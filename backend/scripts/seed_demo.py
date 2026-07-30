"""Seed the demo tenant with 6 months of synthetic events + run pattern detection.

Run: `make seed`  (or `python -m scripts.seed_demo` inside the backend container)

After this runs, the Intellicore Memory Timeline + Patterns UI will be
populated for the `demo-tenant` and you can demo the product immediately.
"""

import asyncio
import logging
import sys

from app.adapters.mock import MockAdapter
from app.core.logging import configure_logging
from app.db.neo4j import close_neo4j, get_driver, init_neo4j
from app.services.graph_writer import ingest_event
from app.services.pattern_detector import detect_patterns

logger = logging.getLogger(__name__)


DEMO_TENANT = "demo-tenant"


async def _clear_tenant_graph(tenant_id: str) -> None:
    """Delete all Memory nodes for the tenant, so re-seeding is idempotent."""
    driver = get_driver()
    async with driver.session() as session:
        await session.run(
            """
            MATCH (n)
            WHERE n.tenant_id = $tenant_id
            DETACH DELETE n
            """,
            tenant_id=tenant_id,
        )
    logger.info("Cleared existing graph for tenant %s", tenant_id)


async def _seed_tenant_node(tenant_id: str) -> None:
    driver = get_driver()
    async with driver.session() as session:
        await session.run(
            """
            MERGE (t:Tenant {id: $tenant_id})
            SET t.name = 'Netcore Cloud (Demo)',
                t.created_at = datetime()
            """,
            tenant_id=tenant_id,
        )


async def seed() -> None:
    await init_neo4j()

    logger.info("Seeding demo tenant %s", DEMO_TENANT)
    await _clear_tenant_graph(DEMO_TENANT)
    await _seed_tenant_node(DEMO_TENANT)

    adapter = MockAdapter()
    count = 0
    async for event in adapter.fetch_events(DEMO_TENANT):
        await ingest_event(tenant_id=DEMO_TENANT, event=event)
        count += 1
    logger.info("Ingested %d events into Memory graph", count)

    logger.info("Running pattern detection...")
    patterns = await detect_patterns(tenant_id=DEMO_TENANT)
    logger.info("Surfaced %d patterns: %s", len(patterns), patterns)

    await close_neo4j()
    logger.info("Seed complete. Open http://localhost:3000/memory to see it live.")


def main() -> None:
    configure_logging("INFO")
    try:
        asyncio.run(seed())
    except Exception as exc:
        logger.error("Seed failed: %s", exc, exc_info=True)
        sys.exit(1)


if __name__ == "__main__":
    main()
