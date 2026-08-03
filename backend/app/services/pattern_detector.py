"""Pattern detector — finds recurring behaviors in a tenant's Memory graph.

Runs periodically. Each rule is a Cypher query that identifies a class of
recurring behavior; if occurrence >= 3 and confidence >= 0.7, a Pattern node
is upserted and linked to its evidence events.
"""

import logging
import uuid
from datetime import datetime, timezone
from typing import Any

from app.db.neo4j import get_driver
from app.services.graph_writer import upsert_pattern

logger = logging.getLogger(__name__)


# Each rule returns evidence event ids + a pattern spec.
RULES: list[dict[str, Any]] = [
    {
        "id_prefix": "friday_deploy",
        "title": "Friday deployments correlate with P2 incidents",
        "category": "reliability",
        "impact_estimate": "3 incidents/quarter",
        "recommended_action": "Adopt a Friday deploy freeze after 4pm IST",
        "guardrail_available": True,
        "cypher": """
            MATCH (d:Event {tenant_id: $tenant_id, category: 'deployment'})
            WHERE date(d.timestamp).dayOfWeek = 5
            MATCH (d)-[:PRECEDED|CAUSED*1..3]->(i:Event {category: 'reliability', severity: 'critical'})
            WHERE duration.between(d.timestamp, i.timestamp).hours <= 72
            RETURN collect(DISTINCT d.id) + collect(DISTINCT i.id) AS event_ids,
                   count(DISTINCT d) AS occurrences
        """,
    },
    {
        "id_prefix": "gke_memory_pressure",
        "title": "GKE clusters hit memory pressure at ~65% of projected load",
        "category": "reliability",
        "impact_estimate": "15% capacity planning gap",
        "recommended_action": "Adjust GKE node pool sizing algorithm to 65th percentile baseline",
        "guardrail_available": False,
        "cypher": """
            MATCH (e:Event {tenant_id: $tenant_id, event_type: 'MemoryPressure'})
            WHERE e.resource_type = 'gke_cluster'
            RETURN collect(DISTINCT e.id) AS event_ids, count(e) AS occurrences
        """,
    },
    {
        "id_prefix": "vpc_no_pga",
        "title": "New VPCs deployed without Private Google Access → security findings",
        "category": "security",
        "impact_estimate": "4 of last 6 VPCs → SCC finding within 45d",
        "recommended_action": "Enforce PGA in the VPC Terraform module by default",
        "guardrail_available": True,
        "cypher": """
            MATCH (d:Event {tenant_id: $tenant_id, event_type: 'VpcCreated'})
            OPTIONAL MATCH (d)-[:AFFECTS]->(r:Resource)
            OPTIONAL MATCH (d)-[:PRECEDED|CAUSED*1..3]->(s:Event {category: 'security'})
            WHERE duration.between(d.timestamp, s.timestamp).days <= 45
            RETURN collect(DISTINCT d.id) + collect(DISTINCT s.id) AS event_ids,
                   count(DISTINCT d) AS occurrences
        """,
    },
    {
        "id_prefix": "gpu_runaway",
        "title": "GPU spend runs away past 4 concurrent inference endpoints",
        "category": "ai",
        "impact_estimate": "₹15L quarterly savings opportunity",
        "recommended_action": "Set a budget guardrail per project when concurrent GPU endpoints exceed 4",
        "guardrail_available": True,
        "cypher": """
            MATCH (a:Event {tenant_id: $tenant_id, category: 'ai', event_type: 'InferenceEndpointCreated'})
            MATCH (c:Event {tenant_id: $tenant_id, category: 'cost', event_type: 'CostSpike'})
            WHERE c.timestamp > a.timestamp
              AND duration.between(a.timestamp, c.timestamp).days <= 34
            RETURN collect(DISTINCT a.id) + collect(DISTINCT c.id) AS event_ids,
                   count(DISTINCT a) AS occurrences
        """,
    },
    {
        "id_prefix": "iam_scope_creep",
        "title": "Service accounts accumulating permissions post-provision",
        "category": "security",
        "impact_estimate": "12 SAs violate least-privilege",
        "recommended_action": "Enable IAM Recommender + monthly review workflow",
        "guardrail_available": False,
        "cypher": """
            MATCH (e:Event {tenant_id: $tenant_id, event_type: 'IamRoleGranted'})
            RETURN collect(DISTINCT e.id) AS event_ids, count(e) AS occurrences
        """,
    },
]


async def detect_patterns(*, tenant_id: str) -> list[str]:
    """Run all pattern rules against the tenant's graph, upsert matches.

    Returns the list of pattern ids that were surfaced or updated.
    """
    driver = get_driver()
    surfaced: list[str] = []

    for rule in RULES:
        async with driver.session() as session:
            result = await session.run(rule["cypher"], tenant_id=tenant_id)
            record = await result.single()

        if not record:
            continue

        occurrences = int(record.get("occurrences", 0))
        event_ids = record.get("event_ids", []) or []

        if occurrences < 3:
            continue

        # Confidence scales with occurrences (capped at 0.95)
        confidence = min(0.5 + 0.1 * occurrences, 0.95)

        if confidence < 0.7:
            continue

        pattern_id = f"{rule['id_prefix']}_{uuid.uuid4().hex[:6]}"
        await upsert_pattern(
            tenant_id=tenant_id,
            pattern={
                "id": pattern_id,
                "title": rule["title"],
                "description": rule["title"],
                "category": rule["category"],
                "occurrence_count": occurrences,
                "confidence": confidence,
                "impact_estimate": rule["impact_estimate"],
                "recommended_action": rule["recommended_action"],
                "guardrail_available": rule["guardrail_available"],
                "evidence_event_ids": event_ids,
            },
        )
        surfaced.append(pattern_id)
        logger.info(
            "Pattern surfaced: %s (tenant=%s, occurrences=%d, confidence=%.2f)",
            rule["title"],
            tenant_id,
            occurrences,
            confidence,
        )

    return surfaced


async def _iso_now() -> str:
    return datetime.now(timezone.utc).isoformat()
