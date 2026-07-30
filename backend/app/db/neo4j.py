"""Neo4j async driver.

This is the heart of Intellicore Memory — every event, resource, and
causal relationship lives here.
"""

import logging

from neo4j import AsyncDriver, AsyncGraphDatabase

from app.config import get_settings

logger = logging.getLogger(__name__)

_driver: AsyncDriver | None = None


async def init_neo4j() -> None:
    global _driver
    settings = get_settings()
    _driver = AsyncGraphDatabase.driver(
        settings.neo4j_uri,
        auth=(settings.neo4j_user, settings.neo4j_password),
        max_connection_pool_size=50,
    )
    await _driver.verify_connectivity()
    logger.info("Connected to Neo4j at %s", settings.neo4j_uri)

    # Apply schema (idempotent — CREATE CONSTRAINT IF NOT EXISTS)
    await _apply_schema()


async def close_neo4j() -> None:
    global _driver
    if _driver is not None:
        await _driver.close()
        _driver = None


def get_driver() -> AsyncDriver:
    if _driver is None:
        raise RuntimeError("Neo4j not initialized. Call init_neo4j() first.")
    return _driver


async def _apply_schema() -> None:
    """Apply Memory graph schema — constraints + indexes."""
    constraints = [
        # Every event is uniquely identified by (tenant_id, event_id)
        "CREATE CONSTRAINT event_id IF NOT EXISTS FOR (e:Event) REQUIRE (e.tenant_id, e.id) IS UNIQUE",
        "CREATE CONSTRAINT resource_id IF NOT EXISTS FOR (r:Resource) REQUIRE (r.tenant_id, r.id) IS UNIQUE",
        "CREATE CONSTRAINT pattern_id IF NOT EXISTS FOR (p:Pattern) REQUIRE (p.tenant_id, p.id) IS UNIQUE",
        "CREATE CONSTRAINT tenant_id IF NOT EXISTS FOR (t:Tenant) REQUIRE t.id IS UNIQUE",
        # Indexes for common queries
        "CREATE INDEX event_tenant_ts IF NOT EXISTS FOR (e:Event) ON (e.tenant_id, e.timestamp)",
        "CREATE INDEX event_tenant_type IF NOT EXISTS FOR (e:Event) ON (e.tenant_id, e.event_type)",
        "CREATE INDEX event_tenant_severity IF NOT EXISTS FOR (e:Event) ON (e.tenant_id, e.severity)",
        "CREATE INDEX resource_tenant_type IF NOT EXISTS FOR (r:Resource) ON (r.tenant_id, r.type)",
    ]

    async with _driver.session() as session:
        for stmt in constraints:
            try:
                await session.run(stmt)
            except Exception as exc:
                logger.warning("Schema statement failed (may already exist): %s — %s", stmt, exc)
    logger.info("Applied Memory graph schema (%d constraints/indexes)", len(constraints))
