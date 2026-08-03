"""Security posture API — SCC findings, CNAPP correlation."""

from fastapi import APIRouter, Depends

from app.core.security import current_tenant
from app.services.memory_service import get_security_summary

router = APIRouter()


@router.get("/summary")
async def summary(tenant_id: str = Depends(current_tenant)) -> dict:
    """Return open security findings grouped by severity."""
    return await get_security_summary(tenant_id=tenant_id)
