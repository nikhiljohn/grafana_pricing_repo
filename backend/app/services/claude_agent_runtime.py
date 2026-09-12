"""Claude runtime for the Intellicore agent fleet.

One API surface — the Messages API — driven by the official Anthropic
SDK. Each agent in ``app.agents.registry`` is a prompt shape and a token
profile over this runtime; there is no per-agent API.

Two design decisions worth knowing before editing:

1. **Advisory output only.** Every agent returns a work packet a human
   executes. The runtime deliberately exposes no tool that mutates
   customer infrastructure — under SOW §4.11 Searce holds Viewer and Tech
   Support Editor, and under §3.2 every change needs Client approval. The
   structured output schema enforces the shape: findings, steps,
   rollback.

2. **Prefix caching is load-bearing.** The agent's system prompt, SOP
   library and estate context are stable across calls and are marked with
   ``cache_control``; only the per-call signal varies. At a 95% hit rate
   on the streaming agents this is roughly a 5x saving on the fleet bill
   (see ``app/agents/cost_model.py``). The prefix must therefore stay
   byte-stable — do not interpolate timestamps, ticket IDs or anything
   per-request into it.
"""

from __future__ import annotations

import json
import logging
from dataclasses import dataclass
from typing import Any

import anthropic

from app.agents.registry import Agent
from app.config import get_settings

logger = logging.getLogger(__name__)

_client: anthropic.AsyncAnthropic | None = None


def get_client() -> anthropic.AsyncAnthropic:
    """Platform client. Tenant BYOK keys resolve via settings_service."""
    global _client
    if _client is None:
        settings = get_settings()
        if not settings.anthropic_api_key:
            raise RuntimeError(
                "ANTHROPIC_API_KEY is not set. Under the BYOK model (SOW §4.10) "
                "the tenant supplies this; the platform key is a fallback only."
            )
        _client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
    return _client


#: The shape every agent returns. Enforced with structured outputs so the
#: UI and the FreshService writer can rely on it without defensive parsing.
WORK_PACKET_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "summary": {
            "type": "string",
            "description": "One sentence an on-call engineer can read at 03:00.",
        },
        "sow_priority": {
            "type": "string",
            "enum": ["P1", "P2", "P3", "P4"],
            "description": "Priority per SOW §7.1.",
        },
        "confidence": {
            "type": "integer",
            "minimum": 0,
            "maximum": 100,
            "description": "Confidence that the diagnosis is correct.",
        },
        "memory_context": {
            "type": "string",
            "description": (
                "What happened before on this estate and how it was resolved. "
                "Empty string when there is no prior occurrence — do not invent one."
            ),
        },
        "recommended_action": {
            "type": "string",
            "enum": ["execute_sop", "escalate", "suppress", "observe"],
        },
        "sop_steps": {
            "type": "array",
            "description": "Exact ordered steps for the human to run. Commands, not prose.",
            "items": {
                "type": "object",
                "properties": {
                    "step": {"type": "integer"},
                    "action": {"type": "string"},
                    "command": {"type": "string"},
                    "expected": {"type": "string"},
                },
                "required": ["step", "action", "command", "expected"],
                "additionalProperties": False,
            },
        },
        "rollback": {
            "type": "string",
            "description": "How to undo the above. Required whenever sop_steps is non-empty.",
        },
        "requires_client_approval": {
            "type": "boolean",
            "description": "True when the action changes state (SOW §3.2).",
        },
    },
    "required": [
        "summary",
        "sow_priority",
        "confidence",
        "memory_context",
        "recommended_action",
        "sop_steps",
        "rollback",
        "requires_client_approval",
    ],
    "additionalProperties": False,
}


@dataclass(frozen=True)
class WorkPacket:
    """A validated agent result, ready for FreshService and the UI."""

    agent_key: str
    summary: str
    sow_priority: str
    confidence: int
    memory_context: str
    recommended_action: str
    sop_steps: list[dict[str, Any]]
    rollback: str
    requires_client_approval: bool
    input_tokens: int
    output_tokens: int
    cache_read_tokens: int

    @property
    def is_actionable(self) -> bool:
        return self.recommended_action in ("execute_sop", "escalate")


def build_system_blocks(agent: Agent, sop_library: str, estate_context: str) -> list[dict]:
    """Cacheable system prefix.

    Ordering matters: stable content first, breakpoint at the end of the
    shared portion. Everything after this is per-call and uncached.
    """
    preamble = (
        f"You are the {agent.name} for Shoppers Stop's eCommerce cloud estate, "
        f"operating under service tower {agent.tower} of the Searce managed "
        f"services SOW ({agent.sow_clause}).\n\n"
        "YOUR ROLE IS ADVISORY. You never change infrastructure. You produce a "
        "work packet that a Searce engineer executes by hand. Searce holds "
        "read-mostly access (SOW §4.11) and every state change needs Client "
        "approval (SOW §3.2) — so if your recommendation changes state, set "
        "requires_client_approval to true.\n\n"
        "Rules:\n"
        "- Ground every claim in the signal and the estate context you are given.\n"
        "- If there is no prior occurrence in Memory, say so. Never invent a "
        "precedent — a fabricated pattern is worse than no pattern.\n"
        "- Prefer suppressing a known-benign signal over raising noise, but "
        "never suppress anything on the ss.com checkout path.\n"
        "- Every sop_steps entry must be runnable as written, with a concrete "
        "expected result the engineer can check.\n"
        "- Priorities follow SOW §7.1. P1 means production down or revenue loss."
    )

    return [
        {"type": "text", "text": preamble},
        {"type": "text", "text": f"# Standard Operating Procedures\n\n{sop_library}"},
        {
            "type": "text",
            "text": f"# Estate context\n\n{estate_context}",
            # Breakpoint at the end of the shared prefix. The per-call
            # signal goes in the user turn, after this, so it never
            # invalidates the cache.
            "cache_control": {"type": "ephemeral"},
        },
    ]


async def run_agent(
    agent: Agent,
    *,
    signal: str,
    sop_library: str,
    estate_context: str,
    memory_matches: str = "",
    client: anthropic.AsyncAnthropic | None = None,
) -> WorkPacket:
    """Run one agent over one signal and return a validated work packet."""
    client = client or get_client()

    user_content = f"# Signal\n\n{signal}"
    if memory_matches:
        user_content += f"\n\n# Memory matches on this estate\n\n{memory_matches}"

    response = await client.messages.create(
        model=agent.model,
        max_tokens=16_000,
        system=build_system_blocks(agent, sop_library, estate_context),
        messages=[{"role": "user", "content": user_content}],
        thinking={"type": "adaptive"},
        output_config={
            "effort": agent.effort.value,
            "format": {"type": "json_schema", "schema": WORK_PACKET_SCHEMA},
        },
    )

    if response.stop_reason == "refusal":
        raise RuntimeError(
            f"{agent.key}: request refused "
            f"({getattr(response.stop_details, 'category', 'unknown')})"
        )

    text = "".join(b.text for b in response.content if b.type == "text")
    try:
        parsed = json.loads(text)
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"{agent.key}: model returned non-JSON output") from exc

    usage = response.usage
    packet = WorkPacket(
        agent_key=agent.key,
        summary=parsed["summary"],
        sow_priority=parsed["sow_priority"],
        confidence=parsed["confidence"],
        memory_context=parsed["memory_context"],
        recommended_action=parsed["recommended_action"],
        sop_steps=parsed["sop_steps"],
        rollback=parsed["rollback"],
        requires_client_approval=parsed["requires_client_approval"],
        input_tokens=usage.input_tokens,
        output_tokens=usage.output_tokens,
        cache_read_tokens=getattr(usage, "cache_read_input_tokens", 0) or 0,
    )

    # A zero cache read on a streaming agent means the prefix drifted and
    # the fleet bill is about to be ~5x the model. Worth a loud log.
    if packet.cache_read_tokens == 0 and agent.cached_prefix_tokens > 4_000:
        logger.warning(
            "agent=%s cache_read_input_tokens=0 — prefix may have drifted; "
            "check for per-request content in the system blocks",
            agent.key,
        )

    return packet
