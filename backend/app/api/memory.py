"""Intellicore Memory API — the hero.

Every endpoint here traverses the per-tenant Neo4j graph.

- GET /memory/timeline    — the customer's cloud story, event by event
- GET /memory/patterns    — recurring behavioral patterns
- POST /memory/chat       — natural language questions over the graph
- GET /memory/event/{id}  — causal chain for a single event
"""

import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.core.security import current_tenant
from app.services.chat_service import answer_memory_question
from app.services.memory_service import (
    get_event_causal_chain,
    get_patterns,
    get_timeline,
)

router = APIRouter()
logger = logging.getLogger(__name__)


class TimelineEvent(BaseModel):
    id: str
    timestamp: datetime
    event_type: str
    category: str  # cost | security | reliability | deployment | ai
    severity: str  # info | warning | critical
    title: str
    summary: str
    resource_id: str | None = None
    resource_type: str | None = None
    causes: list[str] = Field(default_factory=list)  # upstream event ids
    caused: list[str] = Field(default_factory=list)  # downstream event ids


class TimelineResponse(BaseModel):
    events: list[TimelineEvent]
    total: int
    cursor: str | None = None


class Pattern(BaseModel):
    id: str
    title: str
    description: str
    category: str
    first_seen: datetime
    last_seen: datetime
    occurrence_count: int
    confidence: float
    impact_estimate: str  # e.g. "₹15L annual" or "3 incidents/quarter"
    evidence_event_ids: list[str] = Field(default_factory=list)
    recommended_action: str
    guardrail_available: bool = False


class PatternsResponse(BaseModel):
    patterns: list[Pattern]
    total: int


class ChatRequest(BaseModel):
    question: str


class ChatResponse(BaseModel):
    answer: str
    cited_event_ids: list[str] = Field(default_factory=list)
    cited_pattern_ids: list[str] = Field(default_factory=list)
    cypher_used: str | None = None


class CausalChain(BaseModel):
    event: TimelineEvent
    upstream: list[TimelineEvent] = Field(default_factory=list)
    downstream: list[TimelineEvent] = Field(default_factory=list)


@router.get("/timeline", response_model=TimelineResponse)
async def timeline(
    category: str | None = Query(None, description="Filter by cost|security|reliability|deployment|ai"),
    severity: str | None = Query(None, description="Filter by info|warning|critical"),
    from_ts: datetime | None = Query(None, description="Start timestamp (ISO 8601)"),
    to_ts: datetime | None = Query(None, description="End timestamp (ISO 8601)"),
    limit: int = Query(100, ge=1, le=500),
    cursor: str | None = None,
    tenant_id: str = Depends(current_tenant),
) -> TimelineResponse:
    """Return the customer's Intellicore Memory timeline, most recent first."""
    events, next_cursor, total = await get_timeline(
        tenant_id=tenant_id,
        category=category,
        severity=severity,
        from_ts=from_ts,
        to_ts=to_ts,
        limit=limit,
        cursor=cursor,
    )
    return TimelineResponse(
        events=[TimelineEvent(**e) for e in events],
        total=total,
        cursor=next_cursor,
    )


@router.get("/patterns", response_model=PatternsResponse)
async def patterns(
    min_confidence: float = Query(0.6, ge=0.0, le=1.0),
    tenant_id: str = Depends(current_tenant),
) -> PatternsResponse:
    """Return recurring patterns detected in this tenant's cloud graph."""
    detected = await get_patterns(tenant_id=tenant_id, min_confidence=min_confidence)
    return PatternsResponse(
        patterns=[Pattern(**p) for p in detected],
        total=len(detected),
    )


@router.get("/event/{event_id}", response_model=CausalChain)
async def event_chain(
    event_id: str,
    depth: int = Query(2, ge=1, le=4),
    tenant_id: str = Depends(current_tenant),
) -> CausalChain:
    """Return the causal chain for a single event, up to `depth` hops."""
    chain = await get_event_causal_chain(tenant_id=tenant_id, event_id=event_id, depth=depth)
    if chain is None:
        raise HTTPException(status_code=404, detail=f"Event {event_id} not found")
    return CausalChain(
        event=TimelineEvent(**chain["event"]),
        upstream=[TimelineEvent(**e) for e in chain["upstream"]],
        downstream=[TimelineEvent(**e) for e in chain["downstream"]],
    )


@router.post("/chat", response_model=ChatResponse)
async def chat(
    req: ChatRequest,
    tenant_id: str = Depends(current_tenant),
) -> ChatResponse:
    """Ask a natural language question about this customer's cloud.

    The system translates the question into a Cypher query using Claude,
    executes it against the tenant's graph, and returns a grounded answer
    with cited graph nodes.
    """
    result = await answer_memory_question(tenant_id=tenant_id, question=req.question)
    return ChatResponse(**result)
