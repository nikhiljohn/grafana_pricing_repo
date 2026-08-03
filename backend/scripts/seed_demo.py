"""Seed the demo tenant(s) with synthetic events + run pattern detection.

Run: `make seed`  (or `python -m scripts.seed_demo` inside the backend container)

Seeds two things:
  1. `demo-tenant` — the account a logged-in Searce user authenticates as.
  2. The managed customer book (netcore, aarti, shopstop, designx,
     paynimbus) — five tenants matching the customer demo script, each
     with its own distinct Memory graph. This is what the frontend's org
     switcher lets a CSRE user browse across.

After this runs, the Intellicore Memory Timeline + Patterns UI will be
populated for every tenant and you can demo the product immediately.
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

# The managed customer book — id, display name, tier. Matches
# frontend/src/lib/tenants.ts so the org switcher and the Memory graph
# agree on who's who.
CUSTOMER_BOOK = [
    ("netcore", "Netcore Cloud", "elite"),
    ("aarti", "Aarti Industries", "advanced"),
    ("shopstop", "ShoppersStop", "elite"),
    ("designx", "DesignX", "foundation"),
    ("paynimbus", "PayNimbus", "elite"),
]


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


async def _seed_tenant_node(tenant_id: str, name: str) -> None:
    driver = get_driver()
    async with driver.session() as session:
        await session.run(
            """
            MERGE (t:Tenant {id: $tenant_id})
            SET t.name = $name,
                t.created_at = datetime()
            """,
            tenant_id=tenant_id,
            name=name,
        )


async def _seed_one(tenant_id: str, name: str) -> None:
    logger.info("Seeding tenant %s (%s)", tenant_id, name)
    await _clear_tenant_graph(tenant_id)
    await _seed_tenant_node(tenant_id, name)

    adapter = MockAdapter()
    count = 0
    async for event in adapter.fetch_events(tenant_id):
        await ingest_event(tenant_id=tenant_id, event=event)
        count += 1
    logger.info("Ingested %d events into Memory graph for %s", count, tenant_id)

    patterns = await detect_patterns(tenant_id=tenant_id)
    logger.info("Surfaced %d patterns for %s: %s", len(patterns), tenant_id, patterns)


async def seed() -> None:
    await init_neo4j()

    await _seed_one(DEMO_TENANT, "Netcore Cloud (Demo)")
    for tenant_id, name, _tier in CUSTOMER_BOOK:
        await _seed_one(tenant_id, name)

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
