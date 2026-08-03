"""Tenant settings API — Bring Your Own Key (BYOK).

Customers manage their own LLM API keys here. Every AI feature in the
platform uses the tenant's active key; nothing is billed to Searce.

- GET    /settings/ai-keys            — list configured providers (masked)
- PUT    /settings/ai-keys            — add / replace a provider key
- PUT    /settings/ai-keys/active     — choose the active provider
- DELETE /settings/ai-keys/{provider} — remove a provider key
"""

import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.core.security import current_tenant
from app.services import settings_service

router = APIRouter()
logger = logging.getLogger(__name__)


class AiKeyUpsert(BaseModel):
    provider: str = Field(..., description="anthropic | openai | gemini")
    api_key: str = Field(..., min_length=8)
    model: str | None = Field(default=None)


class ActiveProvider(BaseModel):
    provider: str


class ProviderStatus(BaseModel):
    provider: str
    configured: bool
    key_last4: str | None = None
    model: str | None = None
    is_active: bool = False
    updated_at: str | None = None


class AiKeysResponse(BaseModel):
    providers: list[ProviderStatus]
    active_provider: str | None = None


@router.get("/ai-keys", response_model=AiKeysResponse)
async def list_keys(tenant_id: str = Depends(current_tenant)) -> AiKeysResponse:
    creds = await settings_service.list_ai_credentials(tenant_id)
    active = next((c["provider"] for c in creds if c["is_active"]), None)
    return AiKeysResponse(
        providers=[ProviderStatus(**c) for c in creds],
        active_provider=active,
    )


@router.put("/ai-keys")
async def upsert_key(
    body: AiKeyUpsert, tenant_id: str = Depends(current_tenant)
) -> dict:
    try:
        await settings_service.upsert_ai_credential(
            tenant_id, body.provider, body.api_key, body.model
        )
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"ok": True, "provider": body.provider}


@router.put("/ai-keys/active")
async def set_active(
    body: ActiveProvider, tenant_id: str = Depends(current_tenant)
) -> dict:
    try:
        await settings_service.set_active_provider(tenant_id, body.provider)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {"ok": True, "active_provider": body.provider}


@router.delete("/ai-keys/{provider}")
async def delete_key(
    provider: str, tenant_id: str = Depends(current_tenant)
) -> dict:
    await settings_service.delete_ai_credential(tenant_id, provider)
    return {"ok": True, "removed": provider}
