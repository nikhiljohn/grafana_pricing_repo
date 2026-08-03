"""Cost dashboard API — MTD, forecast, anomalies."""

from fastapi import APIRouter, Depends

from app.core.security import current_tenant
from app.services.memory_service import get_cost_summary

router = APIRouter()


@router.get("/summary")
async def summary(tenant_id: str = Depends(current_tenant)) -> dict:
    """Return MTD spend, projected month-end, and top anomalies for the tenant."""
    return await get_cost_summary(tenant_id=tenant_id)
