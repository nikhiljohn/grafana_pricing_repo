"""FreshService ITSM client.

FreshService is the system of record for tickets on the Shoppers Stop
engagement. Intellicore CMP does not own ticket state — it reads from and
writes to FreshService, which is what the squad and the Client actually
look at.

Direction of travel:

    Intellicore -> FreshService   raise/annotate tickets with Memory context
    FreshService -> Intellicore   resolved tickets feed the Memory Curator

NOTE ON SOW SCOPE: §3.1 names the ITSM integration target as
"Grafana/Dynatrace", which is imprecise — those are monitoring and APM
tools, not an ITSM. FreshService is the actual ITSM. The SOW wording
should be corrected before signature so the integration obligation names
the right system.

Raw HTTP via httpx is deliberate here: this is the FreshService REST API,
not an Anthropic surface. Claude calls go through
``app/services/claude_agent_runtime.py`` on the official SDK.
"""

from __future__ import annotations

import base64
import logging
from dataclasses import dataclass
from enum import IntEnum
from typing import Any

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)

FRESHSERVICE_TIMEOUT = 20.0


class FreshServiceError(RuntimeError):
    """FreshService rejected a request or is unreachable."""


class FsPriority(IntEnum):
    """FreshService priority values."""

    LOW = 1
    MEDIUM = 2
    HIGH = 3
    URGENT = 4


class FsStatus(IntEnum):
    """FreshService ticket status values."""

    OPEN = 2
    PENDING = 3
    RESOLVED = 4
    CLOSED = 5


#: SOW §7.1 priorities mapped onto FreshService's 4-point scale.
#: P1 Critical -> Urgent, and so on down. Keep this mapping in one place:
#: an off-by-one here silently changes which SLA clock a ticket runs on.
SOW_TO_FS_PRIORITY: dict[str, FsPriority] = {
    "P1": FsPriority.URGENT,
    "P2": FsPriority.HIGH,
    "P3": FsPriority.MEDIUM,
    "P4": FsPriority.LOW,
}

FS_TO_SOW_PRIORITY: dict[int, str] = {
    int(v): k for k, v in SOW_TO_FS_PRIORITY.items()
}

#: SOW §7.1 response/resolution SLOs, for annotating the ticket so the
#: engineer sees the clock without opening the contract.
SOW_SLA: dict[str, tuple[str, str]] = {
    "P1": ("15 minutes", "4 hours"),
    "P2": ("30 minutes", "8 hours"),
    "P3": ("30 minutes", "24 hours"),
    "P4": ("4 hours", "5 business days"),
}


@dataclass(frozen=True)
class Ticket:
    """A FreshService ticket, reduced to the fields Intellicore uses."""

    id: int
    subject: str
    description: str
    priority: int
    status: int
    tags: list[str]
    created_at: str | None = None
    updated_at: str | None = None
    #: Present once resolved — the text the Memory Curator learns from.
    resolution_notes: str | None = None

    @property
    def sow_priority(self) -> str:
        return FS_TO_SOW_PRIORITY.get(self.priority, "P4")

    @property
    def is_resolved(self) -> bool:
        return self.status in (FsStatus.RESOLVED, FsStatus.CLOSED)

    @classmethod
    def from_api(cls, payload: dict[str, Any]) -> Ticket:
        return cls(
            id=int(payload["id"]),
            subject=payload.get("subject", ""),
            description=payload.get("description_text") or payload.get("description", ""),
            priority=int(payload.get("priority", FsPriority.LOW)),
            status=int(payload.get("status", FsStatus.OPEN)),
            tags=list(payload.get("tags") or []),
            created_at=payload.get("created_at"),
            updated_at=payload.get("updated_at"),
            resolution_notes=(payload.get("custom_fields") or {}).get("resolution_notes"),
        )


def _auth_header(api_key: str) -> str:
    """FreshService uses HTTP Basic with the API key as the username."""
    token = base64.b64encode(f"{api_key}:X".encode()).decode()
    return f"Basic {token}"


class FreshServiceClient:
    """Thin async client over the FreshService v2 API."""

    def __init__(
        self,
        *,
        domain: str | None = None,
        api_key: str | None = None,
        client: httpx.AsyncClient | None = None,
    ) -> None:
        settings = get_settings()
        self.domain = domain or settings.freshservice_domain
        self.api_key = api_key or settings.freshservice_api_key
        self._client = client

        if not self.domain or not self.api_key:
            raise FreshServiceError(
                "FreshService is not configured. Set FRESHSERVICE_DOMAIN and "
                "FRESHSERVICE_API_KEY."
            )

    @property
    def base_url(self) -> str:
        return f"https://{self.domain}.freshservice.com/api/v2"

    async def _request(
        self, method: str, path: str, *, json: dict[str, Any] | None = None
    ) -> dict[str, Any]:
        headers = {
            "Authorization": _auth_header(self.api_key),
            "Content-Type": "application/json",
        }
        url = f"{self.base_url}{path}"

        owns_client = self._client is None
        client = self._client or httpx.AsyncClient(timeout=FRESHSERVICE_TIMEOUT)
        try:
            response = await client.request(method, url, headers=headers, json=json)
        except httpx.HTTPError as exc:
            raise FreshServiceError(f"FreshService unreachable: {exc}") from exc
        finally:
            if owns_client:
                await client.aclose()

        if response.status_code == 429:
            # FreshService rate-limits per minute. Surface it rather than
            # retrying blindly — the caller decides whether to queue.
            retry_after = response.headers.get("Retry-After", "unknown")
            raise FreshServiceError(f"FreshService rate limited; retry after {retry_after}s")

        if response.status_code >= 400:
            raise FreshServiceError(
                f"FreshService {method} {path} failed "
                f"({response.status_code}): {response.text[:400]}"
            )

        if not response.content:
            return {}
        return response.json()

    # ── Intellicore -> FreshService ──────────────────────────────────

    async def create_incident(
        self,
        *,
        subject: str,
        description: str,
        sow_priority: str,
        requester_email: str,
        tags: list[str] | None = None,
        group_id: int | None = None,
    ) -> Ticket:
        """Raise an incident, priority expressed in SOW terms ('P1'..'P4')."""
        priority = SOW_TO_FS_PRIORITY.get(sow_priority)
        if priority is None:
            raise FreshServiceError(f"Unknown SOW priority: {sow_priority}")

        payload: dict[str, Any] = {
            "subject": subject,
            "description": description,
            "email": requester_email,
            "priority": int(priority),
            "status": int(FsStatus.OPEN),
            # Tag every Intellicore-raised ticket so the squad can tell
            # agent-raised from human-raised at a glance, and so the
            # Curator can find its own lineage later.
            "tags": ["intellicore", f"sow-{sow_priority.lower()}", *(tags or [])],
        }
        if group_id is not None:
            payload["group_id"] = group_id

        data = await self._request("POST", "/tickets", json=payload)
        return Ticket.from_api(data["ticket"])

    async def add_memory_note(
        self, ticket_id: int, *, memory_context: str, private: bool = True
    ) -> None:
        """Attach Memory context to an existing ticket.

        Private by default: Memory notes reference other customers'
        resolution patterns in aggregate, and that should not land in a
        Client-visible thread without review.
        """
        body = (
            "<b>Intellicore Operational Memory</b><br/><br/>"
            f"{memory_context}"
            "<br/><br/><i>Generated by Intellicore CMP. Verify before acting.</i>"
        )
        await self._request(
            "POST",
            f"/tickets/{ticket_id}/notes",
            json={"body": body, "private": private},
        )

    async def update_priority(self, ticket_id: int, sow_priority: str) -> None:
        priority = SOW_TO_FS_PRIORITY.get(sow_priority)
        if priority is None:
            raise FreshServiceError(f"Unknown SOW priority: {sow_priority}")
        await self._request(
            "PUT", f"/tickets/{ticket_id}", json={"priority": int(priority)}
        )

    # ── FreshService -> Intellicore ──────────────────────────────────

    async def get_ticket(self, ticket_id: int) -> Ticket:
        data = await self._request("GET", f"/tickets/{ticket_id}")
        return Ticket.from_api(data["ticket"])

    async def list_resolved_since(self, iso_timestamp: str) -> list[Ticket]:
        """Resolved/closed tickets updated since a timestamp.

        This is the Memory Curator's nightly input — the squad's own
        resolution notes are what Memory learns from.
        """
        data = await self._request(
            "GET", f"/tickets?updated_since={iso_timestamp}&include=stats"
        )
        tickets = [Ticket.from_api(t) for t in data.get("tickets", [])]
        return [t for t in tickets if t.is_resolved]


def sla_for(sow_priority: str) -> str:
    """Human-readable SLA line for a ticket note."""
    response, resolution = SOW_SLA.get(sow_priority, ("—", "—"))
    return f"SOW {sow_priority}: respond within {response}, resolve within {resolution}"
