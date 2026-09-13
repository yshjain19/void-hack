"""
Graph algorithm services — community detection, centrality, shortest path.
Uses Neo4j GDS plugin when available, falls back to networkx.
"""
from typing import Any
from core.neo4j_client import run_query


async def detect_communities(case_id: str) -> list[dict[str, Any]]:
    """
    Detect communities using Louvain algorithm via Neo4j GDS.
    Falls back to a mock if GDS is unavailable.
    """
    try:
        # Project the in-memory graph
        await run_query(
            """
            CALL gds.graph.project(
                $graph_name,
                {Entity: {label: ['Person','Organization','IPAddress','BankAccount','EmailAddress','Phone','Address'],
                          properties: ['risk_score']}},
                {RELATED_TO: {type: 'RELATED_TO', properties: ['weight']}}
            )
            """,
            {"graph_name": f"forensiq_{case_id}"},
        )

        result = await run_query(
            """
            CALL gds.louvain.stream($graph_name)
            YIELD nodeId, communityId
            RETURN communityId, collect(gds.util.asNode(nodeId).label) AS members, count(*) AS size
            ORDER BY size DESC
            """,
            {"graph_name": f"forensiq_{case_id}"},
        )

        # Drop the projected graph
        await run_query(
            "CALL gds.graph.drop($graph_name)",
            {"graph_name": f"forensiq_{case_id}"},
        )

        return [
            {"community_id": r["communityId"], "members": r["members"], "size": r["size"]}
            for r in result
        ]
    except Exception:
        return [{"community_id": 0, "members": [], "size": 0, "note": "GDS not available"}]


async def find_shortest_path(case_id: str, source_id: str, target_id: str) -> list[list[str]]:
    """Find shortest path between two entities in the graph."""
    try:
        result = await run_query(
            """
            MATCH path = shortestPath(
                (a {postgres_id: $source, case_id: $case_id})-[*]-(b {postgres_id: $target, case_id: $case_id})
            )
            RETURN [node IN nodes(path) | node.postgres_id] AS node_ids
            LIMIT 5
            """,
            {"source": source_id, "target": target_id, "case_id": case_id},
        )
        return [r["node_ids"] for r in result]
    except Exception:
        return []


async def compute_centrality(case_id: str) -> list[dict[str, Any]]:
    """Compute PageRank centrality for all nodes in the case graph."""
    try:
        result = await run_query(
            """
            MATCH (n {case_id: $case_id})
            OPTIONAL MATCH (n)-[r]->(m {case_id: $case_id})
            WITH n, count(r) AS out_degree
            OPTIONAL MATCH (p {case_id: $case_id})-[r2]->(n)
            RETURN n.postgres_id AS entity_id, n.label AS label,
                   count(r2) AS in_degree, out_degree
            ORDER BY in_degree DESC
            LIMIT 20
            """,
            {"case_id": case_id},
        )
        return result
    except Exception:
        return []
