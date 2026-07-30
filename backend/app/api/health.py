"""Health & readiness endpoints."""

from fastapi import APIRouter

from app.db.neo4j import get_driver
from app.db.redis import get_client

router = APIRouter()


@router.get("/health")
async def health() -> dict:
    """Liveness — is the process up?"""
    return {"status": "ok"}


@router.get("/ready")
async def ready() -> dict:
    """Readiness — are downstream deps reachable?"""
    checks: dict[str, str] = {}

    try:
        await get_driver().verify_connectivity()
        checks["neo4j"] = "ok"
    except Exception as exc:
        checks["neo4j"] = f"error: {exc}"

    try:
        await get_client().ping()
        checks["redis"] = "ok"
    except Exception as exc:
        checks["redis"] = f"error: {exc}"

    all_ok = all(v == "ok" for v in checks.values())
    return {"status": "ok" if all_ok else "degraded", "checks": checks}
