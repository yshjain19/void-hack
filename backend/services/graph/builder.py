"""
Graph builder service — extracts entities from evidence and builds Neo4j graph.
"""
import uuid
from typing import Any

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.evidence import Evidence
from models.entity import Entity
from core.neo4j_client import run_query


ENTITY_TYPE_MAP = {
    "person": "Person",
    "organization": "Organization",
    "ip": "IPAddress",
    "account": "BankAccount",
    "email": "EmailAddress",
    "phone": "Phone",
    "address": "Address",
}


async def build_graph_for_case(db: AsyncSession, case_id: str) -> dict[str, Any]:
    """
    For each parsed evidence item in the case:
    1. Extract entities from extra_metadata (entity_hints)
    2. Create Entity records in Postgres
    3. Create/merge nodes in Neo4j
    4. Create relationship edges based on co-occurrence
    """
    evidence_result = await db.execute(
        select(Evidence).where(Evidence.case_id == case_id, Evidence.parsed == True)
    )
    evidence_items = evidence_result.scalars().all()

    nodes_created = 0
    edges_created = 0

    # Clear existing entities for this case to rebuild
    existing = await db.execute(select(Entity).where(Entity.case_id == case_id))
    for ent in existing.scalars().all():
        await db.delete(ent)
    await db.flush()

    all_entities: list[Entity] = []

    for ev in evidence_items:
        meta = ev.extra_metadata or {}
        entity_hints = meta.get("entity_hints", [])
        sample_records = meta.get("sample_records", [])

        # Email-specific entities
        if ev.file_type == "email":
            entities = _extract_email_entities(case_id, ev.id, meta)
        else:
            entities = _extract_tabular_entities(case_id, ev.id, entity_hints, sample_records)

        for ent in entities:
            db.add(ent)
            all_entities.append(ent)
            nodes_created += 1

    await db.flush()

    # Build Neo4j graph
    try:
        for ent in all_entities:
            label = ENTITY_TYPE_MAP.get(ent.entity_type, "Entity")
            await run_query(
                f"""
                MERGE (n:{label} {{postgres_id: $pid}})
                SET n.case_id = $case_id,
                    n.label = $label,
                    n.risk_score = $risk_score,
                    n.entity_type = $entity_type
                """,
                {
                    "pid": ent.id,
                    "case_id": case_id,
                    "label": ent.label,
                    "risk_score": ent.risk_score,
                    "entity_type": ent.entity_type,
                },
            )

        # Create RELATED_TO edges between entities from same evidence
        for i, a in enumerate(all_entities):
            for b in all_entities[i + 1:]:
                if a.source_evidence_id == b.source_evidence_id:
                    a_label = ENTITY_TYPE_MAP.get(a.entity_type, "Entity")
                    b_label = ENTITY_TYPE_MAP.get(b.entity_type, "Entity")
                    await run_query(
                        f"""
                        MATCH (a:{a_label} {{postgres_id: $aid}}),
                              (b:{b_label} {{postgres_id: $bid}})
                        MERGE (a)-[r:RELATED_TO]->(b)
                        SET r.weight = 1.0, r.case_id = $case_id
                        """,
                        {"aid": a.id, "bid": b.id, "case_id": case_id},
                    )
                    edges_created += 1

    except Exception as neo_err:
        # Graceful fallback if Neo4j is unavailable
        return {
            "nodes_created": nodes_created,
            "edges_created": 0,
            "neo4j_available": False,
            "neo4j_error": str(neo_err),
        }

    return {
        "nodes_created": nodes_created,
        "edges_created": edges_created,
        "neo4j_available": True,
    }


def _extract_email_entities(case_id: str, ev_id: str, meta: dict) -> list[Entity]:
    entities = []
    from_info = meta.get("from", {})
    if from_info.get("address"):
        entities.append(Entity(
            id=str(uuid.uuid4()), case_id=case_id, entity_type="email",
            label=from_info["address"], source_evidence_id=ev_id,
            properties={"name": from_info.get("name", ""), "role": "sender"},
        ))
    for ip in meta.get("received_hop_ips", []):
        entities.append(Entity(
            id=str(uuid.uuid4()), case_id=case_id, entity_type="ip",
            label=ip, source_evidence_id=ev_id,
            properties={"role": "mail_hop"},
        ))
    for url in meta.get("suspicious_urls", []):
        entities.append(Entity(
            id=str(uuid.uuid4()), case_id=case_id, entity_type="address",
            label=url[:255], source_evidence_id=ev_id,
            properties={"type": "suspicious_url"},
            risk_score=0.7,
        ))
    return entities


def _extract_tabular_entities(
    case_id: str, ev_id: str, hints: list, records: list
) -> list[Entity]:
    entities = []
    seen: set[str] = set()
    for hint in hints:
        col = hint["column"]
        etype = hint["type"]
        if etype in ("amount",):
            continue
        for val in hint.get("sample", []):
            val = str(val).strip()
            if val and val not in seen and len(val) > 1:
                seen.add(val)
                entities.append(Entity(
                    id=str(uuid.uuid4()), case_id=case_id, entity_type=etype,
                    label=val[:255], source_evidence_id=ev_id,
                    properties={"source_column": col},
                ))
    return entities
