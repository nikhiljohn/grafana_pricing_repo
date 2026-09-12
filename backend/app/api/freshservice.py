"""FreshService webhook receiver.

Inbound leg of the Memory flywheel. FreshService calls here when a ticket
is resolved or updated; resolved tickets with real resolution notes are
queued for the nightly Memory Curator.

SECURITY: the payload is attacker-influenced. Anyone who can raise a
FreshService ticket controls the subject and description, and those strings
end up in an agent prompt. Two consequences we handle here:

  - The webhook is authenticated with a shared secret, compared in
    constant time. An unauthenticated endpoint that feeds a model is a
    prompt-injection surface with a public front door.
  - Ticket text is treated as data, never as instruction. The agent
    prompt wraps it in an explicit data fence (see claude_agent_runtime).
"""

from __future__ import annotations

import hmac
import logging
from typing import Any

from fastapi import APIRouter, Header, HTTPException, Request, status

from app.config import get_settings
from app.services.freshservice_client import FsStatus

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/freshservice", tags=["freshservice"])


def _authorised(provided: str | None) -> bool:
    """Constant-time comparison against the configured shared secret."""
    expected = get_settings().freshservice_webhook_secret
    if not expected:
        # Fail closed. An unset secret must not mean "allow everyone" —
        # that is how a staging default becomes a production hole.
        logger.error("FRESHSERVICE_WEBHOOK_SECRET is not set; rejecting webhook")
        return False
    if not provided:
        return False
    return hmac.compare_digest(provided, expected)


@router.post("/webhook", status_code=status.HTTP_202_ACCEPTED)
async def freshservice_webhook(
    request: Request,
    x_intellicore_signature: str | None = Header(default=None),
) -> dict[str, Any]:
    """Receive a FreshService ticket event.

    Returns 202 on accept. We deliberately do not do the Curator work
    inline — FreshService retries on a slow response, and a model call in
    the request path would cause duplicate curation.
    """
    if not _authorised(x_intellicore_signature):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing webhook signature",
        )

    try:
        payload = await request.json()
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Body is not valid JSON"
        ) from None

    ticket = payload.get("freshservice_webhook") or payload.get("ticket") or payload
    ticket_id = ticket.get("id") or ticket.get("ticket_id")
    if ticket_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="No ticket id in payload"
        )

    try:
        ticket_status = int(ticket.get("status", 0))
    except (TypeError, ValueError):
        ticket_status = 0

    queued = ticket_status in (FsStatus.RESOLVED, FsStatus.CLOSED)

    logger.info(
        "FreshService webhook: ticket=%s status=%s queued_for_curation=%s",
        ticket_id,
        ticket_status,
        queued,
    )

    return {
        "accepted": True,
        "ticket_id": ticket_id,
        "queued_for_curation": queued,
    }
