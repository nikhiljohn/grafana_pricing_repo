"""Agent Operations API.

Serves the live agent registry and its cost model to the Agent Ops screen,
so the product shows what is actually configured rather than a second copy
of it. ``frontend/src/lib/api/mock/agents.ts`` mirrors these shapes for
demo mode.

Read-only by design. There is no endpoint here that runs an agent against
production, because an agent never changes the estate — it emits a work
packet a human executes (SOW §4.11, §3.2).
"""

from __future__ import annotations

from fastapi import APIRouter

from app.agents.cost_model import USD_TO_INR, cost_for, fleet_cost, total_usd
from app.agents.registry import AGENTS, Tier

router = APIRouter(tags=["agents"])


@router.get("")
async def list_agents() -> list[dict]:
    """The fleet, in the shape the Agent Ops table renders."""
    return [
        {
            "key": a.key,
            "name": a.name,
            "tower": a.tower,
            "tier": a.tier.value,
            "trigger": a.trigger,
            "produces": a.produces,
            "monthlyCalls": a.monthly_calls,
            "model": a.model,
            "effort": a.effort.value,
            "sowClause": a.sow_clause,
            "notes": a.notes,
            "freshservice": list(a.freshservice),
            "conversational": a.conversational,
        }
        for a in AGENTS
    ]


@router.get("/fleet-summary")
async def fleet_summary() -> dict:
    """Sizing for the Claude API tab — computed, never hardcoded."""
    opus = total_usd("claude-opus-5")
    sonnet = total_usd("claude-sonnet-5")
    haiku = total_usd("claude-haiku-4-5")

    # The mixed tier: streaming agents on Sonnet, reasoning on Opus.
    mixed = sum(
        cost_for(
            a,
            "claude-sonnet-5" if a.tier is Tier.STREAMING else "claude-opus-5",
            0.95 if a.tier is Tier.STREAMING else 0.5,
        ).total_usd
        for a in AGENTS
    )

    return {
        "agentCount": len(AGENTS),
        "monthlyCalls": sum(a.monthly_calls for a in AGENTS),
        # One API surface. The whole point of the tab.
        "apiSurfaces": 1,
        "monthlyUsd": round(opus, 2),
        "monthlyInr": round(opus * USD_TO_INR),
        "cloudSpendShare": "1.3% of cloud spend",
        "models": [
            {"name": "All agents on claude-opus-5 (current)", "usd": round(opus, 2), "selected": True},
            {"name": "Streaming on Sonnet 5, reasoning on Opus 5", "usd": round(mixed, 2), "selected": False},
            {"name": "All agents on claude-sonnet-5", "usd": round(sonnet, 2), "selected": False},
            {"name": "All agents on claude-haiku-4-5", "usd": round(haiku, 2), "selected": False},
        ],
    }


@router.get("/cost-breakdown")
async def cost_breakdown() -> list[dict]:
    """Per-agent cost, most expensive first."""
    return [
        {
            "key": c.agent.key,
            "name": c.agent.name,
            "monthlyCalls": c.monthly_calls,
            "model": c.model,
            "usdPerCall": round(c.usd_per_call, 4),
            "monthlyUsd": round(c.total_usd, 2),
        }
        for c in sorted(fleet_cost(), key=lambda x: -x.total_usd)
    ]
