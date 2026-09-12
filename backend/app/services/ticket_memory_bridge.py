"""The Memory <-> FreshService flywheel.

This is what makes Operational Memory real rather than aspirational.

    Signal -> agent -> work packet -> FreshService ticket (+ Memory note)
                                              |
                                        human resolves
                                              |
                             resolution notes -> Memory Curator -> Neo4j
                                              |
                                    next matching signal cites it

Without the return leg, Memory only ever contains what we seeded, and the
product's central claim — "we know because we have seen this before" —
never becomes true for this customer. FreshService holds the resolution
notes, so FreshService is where the learning comes from.
"""

from __future__ import annotations

import logging
from dataclasses import dataclass
from datetime import UTC, datetime, timedelta

from app.agents.registry import AGENTS_BY_KEY
from app.services.claude_agent_runtime import WorkPacket, run_agent
from app.services.freshservice_client import (
    FreshServiceClient,
    FreshServiceError,
    Ticket,
    sla_for,
)

logger = logging.getLogger(__name__)

#: Below this confidence an agent's packet is still filed, but flagged for
#: a human to check the diagnosis rather than just the execution. Chosen to
#: sit under the confidence of every seeded Memory pattern on this estate,
#: so a low score means genuinely novel, not merely uncommon.
REVIEW_THRESHOLD = 70


@dataclass(frozen=True)
class FiledTicket:
    ticket_id: int
    sow_priority: str
    agent_key: str
    suppressed: bool


def render_work_packet(packet: WorkPacket) -> str:
    """The ticket body a human reads. Ordered for 03:00, not for elegance."""
    lines = [
        f"<b>{packet.summary}</b>",
        "",
        f"Priority: <b>{packet.sow_priority}</b> &middot; {sla_for(packet.sow_priority)}",
        f"Agent: {packet.agent_key} &middot; confidence {packet.confidence}%",
        "",
    ]

    if packet.confidence < REVIEW_THRESHOLD:
        lines += [
            "<b>&#9888; Low confidence — verify the diagnosis before executing.</b>",
            "",
        ]

    if packet.memory_context:
        lines += ["<b>What happened before</b>", packet.memory_context, ""]
    else:
        lines += [
            "<b>What happened before</b>",
            "No prior occurrence on this estate. This is a new pattern.",
            "",
        ]

    if packet.sop_steps:
        lines.append("<b>Steps to run</b>")
        lines.append("<ol>")
        for step in packet.sop_steps:
            lines.append(
                f"<li>{step['action']}<br/>"
                f"<code>{step['command']}</code><br/>"
                f"<i>Expect: {step['expected']}</i></li>"
            )
        lines.append("</ol>")
        lines.append("")
        lines.append(f"<b>Rollback</b><br/>{packet.rollback}")
        lines.append("")

    if packet.requires_client_approval:
        lines += [
            "<b>&#9888; Requires Client approval before execution (SOW §3.2).</b>",
            "",
        ]

    lines.append(
        "<i>Raised by Intellicore CMP. Searce operates read-only under SOW §4.11 — "
        "these steps are executed by a human engineer, not by the platform.</i>"
    )
    return "<br/>".join(lines)


async def file_work_packet(
    packet: WorkPacket,
    *,
    subject: str,
    requester_email: str,
    fs: FreshServiceClient | None = None,
    tags: list[str] | None = None,
) -> FiledTicket | None:
    """Raise a FreshService ticket from an agent's work packet.

    Returns ``None`` when the agent recommended suppression — that is the
    whole point of triage, and filing a ticket anyway would defeat it.
    """
    if packet.recommended_action == "suppress":
        logger.info(
            "agent=%s suppressed signal (confidence=%d): %s",
            packet.agent_key,
            packet.confidence,
            packet.summary,
        )
        return FiledTicket(
            ticket_id=0,
            sow_priority=packet.sow_priority,
            agent_key=packet.agent_key,
            suppressed=True,
        )

    fs = fs or FreshServiceClient()
    ticket = await fs.create_incident(
        subject=subject,
        description=render_work_packet(packet),
        sow_priority=packet.sow_priority,
        requester_email=requester_email,
        tags=[packet.agent_key, *(tags or [])],
    )

    return FiledTicket(
        ticket_id=ticket.id,
        sow_priority=packet.sow_priority,
        agent_key=packet.agent_key,
        suppressed=False,
    )


async def triage_signal(
    agent_key: str,
    *,
    signal: str,
    subject: str,
    sop_library: str,
    estate_context: str,
    memory_matches: str,
    requester_email: str,
    fs: FreshServiceClient | None = None,
) -> FiledTicket | None:
    """Full inbound path: signal -> agent -> FreshService."""
    agent = AGENTS_BY_KEY.get(agent_key)
    if agent is None:
        raise ValueError(f"Unknown agent: {agent_key}")

    packet = await run_agent(
        agent,
        signal=signal,
        sop_library=sop_library,
        estate_context=estate_context,
        memory_matches=memory_matches,
    )
    return await file_work_packet(
        packet, subject=subject, requester_email=requester_email, fs=fs
    )


# ─── Return leg: resolved tickets become Memory ──────────────────────


def curation_window(hours: int = 24) -> str:
    """ISO timestamp for the Curator's nightly lookback."""
    since = datetime.now(UTC) - timedelta(hours=hours)
    return since.strftime("%Y-%m-%dT%H:%M:%SZ")


def _is_curatable(ticket: Ticket) -> bool:
    """Skip tickets that would teach Memory nothing.

    A resolved ticket with no resolution notes records that something
    happened, not what was learned — ingesting it inflates the pattern
    count without improving a single future recommendation.
    """
    if not ticket.is_resolved:
        return False
    notes = (ticket.resolution_notes or "").strip()
    return len(notes) >= 40


async def collect_curation_batch(
    *, hours: int = 24, fs: FreshServiceClient | None = None
) -> list[Ticket]:
    """Resolved tickets worth learning from, for the nightly Curator run."""
    fs = fs or FreshServiceClient()
    try:
        tickets = await fs.list_resolved_since(curation_window(hours))
    except FreshServiceError:
        logger.exception("Memory curation batch failed — FreshService unreachable")
        return []

    curatable = [t for t in tickets if _is_curatable(t)]
    logger.info(
        "Memory curation: %d resolved, %d curatable in the last %dh",
        len(tickets),
        len(curatable),
        hours,
    )
    return curatable
