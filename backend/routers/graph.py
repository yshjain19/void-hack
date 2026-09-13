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


@router.get("/{case_id}", response_model=GraphResponse)
async def get_graph(case_id: str, db: AsyncSession = Depends(get_db)):
    """Return nodes and edges for React Flow visualization."""
    await _get_case_or_404(db, case_id)

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
    edges = []
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
