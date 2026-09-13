"""
Neo4j async driver singleton and Cypher helper utilities.
If neo4j package is not installed, all queries return empty results gracefully.
"""
from typing import Any

from core.config import settings

try:
    from neo4j import AsyncGraphDatabase, AsyncDriver
    NEO4J_AVAILABLE = True
except ImportError:
    NEO4J_AVAILABLE = False

_driver = None


async def get_driver():
    global _driver
    if not NEO4J_AVAILABLE:
        return None
    if _driver is None:
        _driver = AsyncGraphDatabase.driver(
            settings.NEO4J_URI,
            auth=(settings.NEO4J_USER, settings.NEO4J_PASSWORD),
        )
    return _driver


async def close_driver():
    global _driver
    if _driver:
        await _driver.close()
        _driver = None


async def run_query(
    cypher: str,
    parameters: dict[str, Any] | None = None,
    database: str = "neo4j",
) -> list[dict]:
    """Execute a Cypher query and return results as list of dicts."""
    if not NEO4J_AVAILABLE:
        return []
    driver = await get_driver()
    if driver is None:
        return []
    try:
        async with driver.session(database=database) as session:
            result = await session.run(cypher, parameters or {})
            records = await result.data()
            return records
    except Exception:
        return []


async def run_write_query(
    cypher: str,
    parameters: dict[str, Any] | None = None,
    database: str = "neo4j",
) -> list[dict]:
    """Execute a write Cypher transaction."""
    if not NEO4J_AVAILABLE:
        return []
    driver = await get_driver()
    if driver is None:
        return []
    try:
        async with driver.session(database=database) as session:
            result = await session.execute_write(
                lambda tx: tx.run(cypher, parameters or {})
            )
            return result
    except Exception:
        return []

