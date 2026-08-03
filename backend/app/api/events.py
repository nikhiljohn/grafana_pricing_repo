"""Event ingestion endpoint — cloud adapters POST here."""

from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.core.security import current_tenant
from app.services.graph_writer import ingest_event

router = APIRouter()


class IncomingEvent(BaseModel):
    source: str  # gcp_audit | aws_cloudtrail | scc | cost_anomaly | terraform | mock
    event_type: str  # e.g. "ResourceCreated", "IncidentOpened", "CostSpike"
    category: str = Field(pattern="^(cost|security|reliability|deployment|ai)$")
    severity: str = Field(default="info", pattern="^(info|warning|critical)$")
    timestamp: datetime
    title: str
    summary: str
    resource_id: str | None = None
    resource_type: str | None = None
    raw_payload_ref: str | None = None


class IngestResponse(BaseModel):
    event_id: str
    ingested: bool


@router.post("/ingest", response_model=IngestResponse)
async def ingest(
    event: IncomingEvent,
    tenant_id: str = Depends(current_tenant),
) -> IngestResponse:
    """Ingest a single normalized event into the Memory graph."""
    event_id = await ingest_event(tenant_id=tenant_id, event=event.model_dump())
    return IngestResponse(event_id=event_id, ingested=True)
