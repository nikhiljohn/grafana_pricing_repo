"""Reads from the Memory graph — Timeline, Patterns, causal chains.

Every read is tenant-scoped at the query layer.
"""

import logging
from datetime import datetime
from typing import Any

from app.db.neo4j import get_driver

logger = logging.getLogger(__name__)


def _serialize_event(record: dict) -> dict:
    """Convert Neo4j event node → dict matching TimelineEvent schema."""
    e = record["e"]
    props = dict(e)
    ts = props.get("timestamp")
    if hasattr(ts, "to_native"):
        props["timestamp"] = ts.to_native()
    return {
        "id": props.get("id"),
        "timestamp": props.get("timestamp"),
        "event_type": props.get("event_type", "unknown"),
        "category": props.get("category", "reliability"),
        "severity": props.get("severity", "info"),
        "title": props.get("title", ""),
        "summary": props.get("summary", ""),
        "resource_id": record.get("resource_id"),
        "resource_type": record.get("resource_type"),
        "causes": record.get("causes", []) or [],
        "caused": record.get("caused", []) or [],
    }


async def get_timeline(
    *,
    tenant_id: str,
    category: str | None = None,
    severity: str | None = None,
    from_ts: datetime | None = None,
    to_ts: datetime | None = None,
    limit: int = 100,
    cursor: str | None = None,
) -> tuple[list[dict], str | None, int]:
    """Return a page of events, most recent first, plus a next-page cursor."""
    filters = ["e.tenant_id = $tenant_id"]
    params: dict[str, Any] = {"tenant_id": tenant_id, "limit": limit}

    if category:
        filters.append("e.category = $category")
        params["category"] = category
    if severity:
        filters.append("e.severity = $severity")
        params["severity"] = severity
    if from_ts:
        filters.append("e.timestamp >= datetime($from_ts)")
        params["from_ts"] = from_ts.isoformat()
    if to_ts:
        filters.append("e.timestamp <= datetime($to_ts)")
        params["to_ts"] = to_ts.isoformat()
    if cursor:
        filters.append("e.timestamp < datetime($cursor)")
        params["cursor"] = cursor

    where = " AND ".join(filters)
    query = f"""
        MATCH (e:Event)
        WHERE {where}
        OPTIONAL MATCH (e)-[:AFFECTS]->(r:Resource)
        OPTIONAL MATCH (cause:Event)-[:PRECEDED|CAUSED]->(e)
        OPTIONAL MATCH (e)-[:PRECEDED|CAUSED]->(effect:Event)
        WITH e, r,
             collect(DISTINCT cause.id) AS causes,
             collect(DISTINCT effect.id) AS caused
        RETURN e, r.id AS resource_id, r.type AS resource_type, causes, caused
        ORDER BY e.timestamp DESC
        LIMIT $limit
    """

    count_query = f"MATCH (e:Event) WHERE {where.split(' AND cursor')[0]} RETURN count(e) AS total"

    driver = get_driver()
    async with driver.session() as session:
        result = await session.run(query, **params)
        records = [record.data() async for record in result]

        # Total (unfiltered by cursor)
        count_params = {k: v for k, v in params.items() if k != "cursor"}
        count_result = await session.run(
            f"""
            MATCH (e:Event)
            WHERE {' AND '.join(f for f in filters if 'cursor' not in f)}
            RETURN count(e) AS total
            """,
            **count_params,
        )
        total_record = await count_result.single()
        total = total_record["total"] if total_record else 0

    events = [_serialize_event(r) for r in records]
    next_cursor = events[-1]["timestamp"].isoformat() if len(events) == limit and events else None
    return events, next_cursor, total


async def get_patterns(*, tenant_id: str, min_confidence: float = 0.6) -> list[dict]:
    """Return all detected patterns for the tenant above the confidence threshold."""
    driver = get_driver()
    async with driver.session() as session:
        result = await session.run(
            """
            MATCH (p:Pattern {tenant_id: $tenant_id})
            WHERE p.confidence >= $min_confidence
            OPTIONAL MATCH (p)-[:EVIDENCED_BY]->(e:Event)
            WITH p, collect(e.id) AS evidence_event_ids
            RETURN p, evidence_event_ids
            ORDER BY p.confidence DESC, p.occurrence_count DESC
            """,
            tenant_id=tenant_id,
            min_confidence=min_confidence,
        )
        records = [record.data() async for record in result]

    patterns = []
    for r in records:
        props = dict(r["p"])
        for k in ("first_seen", "last_seen"):
            v = props.get(k)
            if hasattr(v, "to_native"):
                props[k] = v.to_native()
        patterns.append(
            {
                "id": props.get("id"),
                "title": props.get("title", ""),
                "description": props.get("description", ""),
                "category": props.get("category", "reliability"),
                "first_seen": props.get("first_seen"),
                "last_seen": props.get("last_seen"),
                "occurrence_count": int(props.get("occurrence_count", 0)),
                "confidence": float(props.get("confidence", 0.0)),
                "impact_estimate": props.get("impact_estimate", ""),
                "evidence_event_ids": r.get("evidence_event_ids", []) or [],
                "recommended_action": props.get("recommended_action", ""),
                "guardrail_available": bool(props.get("guardrail_available", False)),
            }
        )
    return patterns


async def get_event_causal_chain(
    *, tenant_id: str, event_id: str, depth: int = 2
) -> dict | None:
    """Return an event + its upstream causes and downstream effects, up to `depth`."""
    driver = get_driver()
    async with driver.session() as session:
        # The event itself
        result = await session.run(
            """
            MATCH (e:Event {tenant_id: $tenant_id, id: $event_id})
            OPTIONAL MATCH (e)-[:AFFECTS]->(r:Resource)
            RETURN e, r.id AS resource_id, r.type AS resource_type
            """,
            tenant_id=tenant_id,
            event_id=event_id,
        )
        record = await result.single()
        if not record:
            return None

        event = _serialize_event({**record.data(), "causes": [], "caused": []})

        # Upstream — anything that led to this event
        up_result = await session.run(
            f"""
            MATCH path=(cause:Event)-[:PRECEDED|CAUSED*1..{depth}]->(target:Event {{tenant_id: $tenant_id, id: $event_id}})
            WITH DISTINCT cause AS e
            OPTIONAL MATCH (e)-[:AFFECTS]->(r:Resource)
            RETURN e, r.id AS resource_id, r.type AS resource_type
            ORDER BY e.timestamp
            """,
            tenant_id=tenant_id,
            event_id=event_id,
        )
        upstream = [
            _serialize_event({**rec.data(), "causes": [], "caused": []})
            async for rec in up_result
        ]

        # Downstream — anything that happened because of this event
        down_result = await session.run(
            f"""
            MATCH path=(source:Event {{tenant_id: $tenant_id, id: $event_id}})-[:PRECEDED|CAUSED*1..{depth}]->(effect:Event)
            WITH DISTINCT effect AS e
            OPTIONAL MATCH (e)-[:AFFECTS]->(r:Resource)
            RETURN e, r.id AS resource_id, r.type AS resource_type
            ORDER BY e.timestamp
            """,
            tenant_id=tenant_id,
            event_id=event_id,
        )
        downstream = [
            _serialize_event({**rec.data(), "causes": [], "caused": []})
            async for rec in down_result
        ]

    return {"event": event, "upstream": upstream, "downstream": downstream}


async def get_cost_summary(*, tenant_id: str) -> dict:
    """Aggregate cost events for a dashboard summary."""
    driver = get_driver()
    async with driver.session() as session:
        result = await session.run(
            """
            MATCH (e:Event {tenant_id: $tenant_id, category: 'cost'})
            WHERE e.timestamp >= datetime() - duration('P30D')
            RETURN count(e) AS anomalies_30d,
                   sum(coalesce(e.amount_inr, 0)) AS spend_impact_inr
            """,
            tenant_id=tenant_id,
        )
        record = await result.single()

    return {
        "anomalies_30d": record["anomalies_30d"] if record else 0,
        "spend_impact_inr": float(record["spend_impact_inr"] or 0) if record else 0.0,
        "mtd_inr": 4_820_000.0,  # TODO: pull from real cost source
        "forecast_inr": 6_400_000.0,
    }


async def get_security_summary(*, tenant_id: str) -> dict:
    """Count open security findings grouped by severity."""
    driver = get_driver()
    async with driver.session() as session:
        result = await session.run(
            """
            MATCH (e:Event {tenant_id: $tenant_id, category: 'security'})
            RETURN e.severity AS severity, count(e) AS n
            """,
            tenant_id=tenant_id,
        )
        rows = [record.data() async for record in result]

    counts = {"critical": 0, "warning": 0, "info": 0}
    for r in rows:
        sev = r["severity"] or "info"
        counts[sev] = counts.get(sev, 0) + r["n"]
    return {"by_severity": counts, "total": sum(counts.values())}
