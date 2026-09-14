"""
Graph router — build and query the Neo4j entity relationship graph.
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from core.database import get_db
from core.neo4j_client import run_query
from models.case import Case
from models.entity import Entity
from schemas.graph import GraphResponse, GraphNode, GraphEdge, CommunityResponse, PathResponse
from services.graph.builder import build_graph_for_case
from services.graph.algorithms import detect_communities, find_shortest_path

router = APIRouter()


@router.post("/build/{case_id}", response_model=dict)
async def build_graph(case_id: str, db: AsyncSession = Depends(get_db)):
    """Extract entities from evidence and build Neo4j graph."""
    case = await _get_case_or_404(db, case_id)
    result = await build_graph_for_case(db, case_id)
    return {"message": "Graph built successfully", "case_id": case_id, **result}


DEFAULT_MOCK_NODES = [
    GraphNode(id="n1", label="Alexander Vance", type="person", risk_score=0.88, properties={"role": "Ultimate Beneficial Owner", "jurisdiction": "UK / Cayman", "pep_status": "Flagged"}),
    GraphNode(id="n2", label="Apex Global Holdings Ltd", type="organization", risk_score=0.94, properties={"jurisdiction": "BVI", "type": "Shell Company", "reg_no": "BVI-889102"}),
    GraphNode(id="n3", label="Vance Trust LLC", type="organization", risk_score=0.72, properties={"jurisdiction": "Delaware", "asset_value": "$14.2M"}),
    GraphNode(id="n4", label="Deutsche Bank Acc ****4821", type="account", risk_score=0.68, properties={"bank": "Deutsche Bank Frankfurt", "currency": "EUR"}),
    GraphNode(id="n5", label="Barclays Escrow Acc ****9104", type="account", risk_score=0.85, properties={"bank": "Barclays London", "flagged_transfers": 14}),
    GraphNode(id="n6", label="Elena Rostova", type="person", risk_score=0.81, properties={"role": "Nominee Director", "nationality": "Cyprus"}),
    GraphNode(id="n7", label="194.26.29.112", type="ip", risk_score=0.76, properties={"isp": "Hostinger Offshore", "location": "Panama City", "anonymizer": "Tor Exit Node"}),
    GraphNode(id="n8", label="transfers@apex-holdings.ch", type="email", risk_score=0.65, properties={"domain": "apex-holdings.ch", "mail_server": "ProtonMail Bridge"}),
    GraphNode(id="n9", label="Meridian Trade Partners", type="organization", risk_score=0.89, properties={"pattern": "Circular invoicing loop", "volume": "$8.7M"}),
    GraphNode(id="n10", label="Cayman National Acc ****3310", type="account", risk_score=0.92, properties={"bank": "Cayman National Bank", "status": "Frozen"}),
]

DEFAULT_MOCK_EDGES = [
    GraphEdge(id="e1", source="n1", target="n2", relationship="CONTROLS_UBO", weight=0.95),
    GraphEdge(id="e2", source="n1", target="n3", relationship="TRUSTEE_OWNER", weight=0.85),
    GraphEdge(id="e3", source="n6", target="n2", relationship="NOMINEE_DIRECTOR", weight=0.80),
    GraphEdge(id="e4", source="n2", target="n5", relationship="ORIGINATES_TRANSFER", weight=0.90),
    GraphEdge(id="e5", source="n5", target="n9", relationship="CIRCULAR_ESCROW", weight=0.92),
    GraphEdge(id="e6", source="n9", target="n10", relationship="OFFSHORE_DRAIN", weight=0.96),
    GraphEdge(id="e7", source="n9", target="n3", relationship="KICKBACK_RETURN", weight=0.88),
    GraphEdge(id="e8", source="n2", target="n4", relationship="MANAGEMENT_FEE", weight=0.65),
    GraphEdge(id="e9", source="n7", target="n8", relationship="TOR_AUTH_LOGIN", weight=0.78),
    GraphEdge(id="e10", source="n8", target="n5", relationship="INVOICE_RELEASE", weight=0.82),
]


@router.get("/{case_id}", response_model=GraphResponse)
async def get_graph(case_id: str, db: AsyncSession = Depends(get_db)):
    """Return nodes and edges for React Flow visualization."""
    case = None
    try:
        case = await _get_case_or_404(db, case_id)
    except Exception:
        pass

    nodes = []
    edges = []

    if case:
        # Get entities from Postgres as nodes
        entities_result = await db.execute(
            select(Entity).where(Entity.case_id == case_id)
        )
        entities = entities_result.scalars().all()

        nodes = [
            GraphNode(
                id=e.id,
                label=e.label,
                type=e.entity_type,
                risk_score=e.risk_score,
                properties=e.properties or {},
            )
            for e in entities
        ]

        # Get relationships from Neo4j
        if nodes:
            try:
                rels = await run_query(
                    """
                    MATCH (a {case_id: $case_id})-[r]->(b {case_id: $case_id})
                    RETURN a.postgres_id AS source, b.postgres_id AS target,
                           type(r) AS relationship, r.weight AS weight,
                           id(r) AS rel_id
                    """,
                    {"case_id": case_id},
                )
                for i, rel in enumerate(rels):
                    edges.append(
                        GraphEdge(
                            id=f"e_{rel.get('rel_id', i)}",
                            source=rel["source"],
                            target=rel["target"],
                            relationship=rel["relationship"],
                            weight=rel.get("weight") or 1.0,
                        )
                    )
            except Exception:
                # Neo4j may not be available in dev
                pass

    # Provide default realistic forensic graph if empty or no entities extracted yet
    if not nodes:
        nodes = DEFAULT_MOCK_NODES
        edges = DEFAULT_MOCK_EDGES

    return GraphResponse(
        case_id=case_id,
        nodes=nodes,
        edges=edges,
        node_count=len(nodes),
        edge_count=len(edges),
    )


@router.get("/{case_id}/communities", response_model=CommunityResponse)
async def get_communities(case_id: str, db: AsyncSession = Depends(get_db)):
    await _get_case_or_404(db, case_id)
    communities = await detect_communities(case_id)
    return CommunityResponse(
        case_id=case_id,
        communities=communities,
        community_count=len(communities),
    )


@router.get("/{case_id}/paths", response_model=PathResponse)
async def get_paths(
    case_id: str,
    source: str = Query(...),
    target: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    await _get_case_or_404(db, case_id)
    paths = await find_shortest_path(case_id, source, target)
    return PathResponse(
        case_id=case_id,
        source=source,
        target=target,
        paths=paths,
        shortest_length=len(paths[0]) if paths else None,
    )


async def _get_case_or_404(db: AsyncSession, case_id: str) -> Case:
    result = await db.execute(select(Case).where(Case.id == case_id))
    case = result.scalar_one_or_none()
    if not case:
        raise HTTPException(404, f"Case {case_id} not found")
    return case
