"""Writes events + causal edges into the Memory graph.

Every event flows through this module — the single choke point where we
enforce tenant isolation, idempotency, and causal inference.
"""

import logging
import uuid
from datetime import datetime, timedelta, timezone
from typing import Any

from app.db.neo4j import get_driver

logger = logging.getLogger(__name__)

# Temporal window for auto-inferring causality between events on the same resource.
# If event A precedes event B on the same resource within this window, we suspect A caused B.
CAUSAL_WINDOW = timedelta(hours=6)


async def ingest_event(*, tenant_id: str, event: dict[str, Any]) -> str:
    """Idempotently insert an event into the tenant's Memory graph.

    Steps:
    1. Generate a stable event id (or use one provided).
    2. MERGE the Event node (tenant_id + id — idempotent).
    3. MERGE the Resource node if present, link (:Event)-[:AFFECTS]->(:Resource).
    4. Infer temporal causality: find events on the same resource in the last
       CAUSAL_WINDOW and create :PRECEDED / :CAUSED edges.
    """
    event_id = event.get("id") or f"evt_{uuid.uuid4().hex[:16]}"
    defaults = {
        "resource_id": None,
        "resource_type": None,
        "raw_payload_ref": None,
        "amount_inr": None,
        "environment": "production",
    }
    event = {**defaults, **event, "id": event_id, "tenant_id": tenant_id}

    if isinstance(event.get("timestamp"), datetime):
        event["timestamp"] = event["timestamp"].isoformat()

    driver = get_driver()
    async with driver.session() as session:
        # Write the event
        await session.run(
            """
            MERGE (e:Event {tenant_id: $tenant_id, id: $id})
            SET  e.event_type = $event_type,
                 e.category   = $category,
                 e.severity   = $severity,
                 e.timestamp  = datetime($timestamp),
                 e.title      = $title,
                 e.summary    = $summary,
                 e.source     = $source,
                 e.environment = $environment,
                 e.amount_inr = $amount_inr,
                 e.raw_payload_ref = $raw_payload_ref
            """,
            **event,
        )

        # Link to resource if present
        if event.get("resource_id"):
            await session.run(
                """
                MERGE (r:Resource {tenant_id: $tenant_id, id: $resource_id})
                ON CREATE SET r.type = $resource_type, r.first_seen = datetime()
                SET r.last_seen = datetime()
                WITH r
                MATCH (e:Event {tenant_id: $tenant_id, id: $event_id})
                MERGE (e)-[:AFFECTS]->(r)
                """,
                tenant_id=tenant_id,
                resource_id=event["resource_id"],
                resource_type=event.get("resource_type") or "Unknown",
                event_id=event_id,
            )

            # Infer temporal causality on the same resource
            await session.run(
                """
                MATCH (r:Resource {tenant_id: $tenant_id, id: $resource_id})
                MATCH (prior:Event {tenant_id: $tenant_id})-[:AFFECTS]->(r)
                WHERE prior.id <> $event_id
                  AND prior.timestamp < datetime($timestamp)
                  AND duration.between(prior.timestamp, datetime($timestamp)).hours <= 6
                WITH prior
                ORDER BY prior.timestamp DESC
                LIMIT 3
                MATCH (curr:Event {tenant_id: $tenant_id, id: $event_id})
                MERGE (prior)-[p:PRECEDED]->(curr)
                SET p.confidence = 0.5, p.inferred = true
                """,
                tenant_id=tenant_id,
                resource_id=event["resource_id"],
                event_id=event_id,
                timestamp=event["timestamp"],
            )

    logger.debug("Ingested event %s for tenant %s", event_id, tenant_id)
    return event_id


async def upsert_pattern(*, tenant_id: str, pattern: dict[str, Any]) -> str:
    """Insert or update a detected pattern node."""
    pattern_id = pattern.get("id") or f"pat_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()

    driver = get_driver()
    async with driver.session() as session:
        await session.run(
            """
            MERGE (p:Pattern {tenant_id: $tenant_id, id: $id})
            ON CREATE SET p.first_seen = datetime($now)
            SET p.title             = $title,
                p.description       = $description,
                p.category          = $category,
                p.occurrence_count  = $occurrence_count,
                p.confidence        = $confidence,
                p.impact_estimate   = $impact_estimate,
                p.recommended_action = $recommended_action,
                p.guardrail_available = $guardrail_available,
                p.last_seen = datetime($now)
            """,
            tenant_id=tenant_id,
            id=pattern_id,
            now=now,
            **{k: v for k, v in pattern.items() if k not in ("id", "evidence_event_ids")},
        )

        # Link evidence events
        for ev_id in pattern.get("evidence_event_ids", []):
            await session.run(
                """
                MATCH (p:Pattern {tenant_id: $tenant_id, id: $pattern_id})
                MATCH (e:Event   {tenant_id: $tenant_id, id: $event_id})
                MERGE (p)-[:EVIDENCED_BY]->(e)
                """,
                tenant_id=tenant_id,
                pattern_id=pattern_id,
                event_id=ev_id,
            )
    return pattern_id
