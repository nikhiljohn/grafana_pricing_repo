"""Claude API sizing and cost model for the Shoppers Stop agent fleet.

Answers "how many Claude APIs do we need" with arithmetic rather than a
guess. The short answer is ONE API — the Messages API. What actually
varies is call volume, token profile, and model tier, all of which are
derived here from ``registry.py``.

Pricing is USD per million tokens, first-party Anthropic API rates as of
2026-06-24. Cache reads bill at 0.1x base input; cache writes at 1.25x
for the default 5-minute TTL. Batch API is 50% off but is not applied to
any interactive path.

Re-run after changing the registry:

    python -m app.agents.cost_model
"""

from __future__ import annotations

from dataclasses import dataclass

from app.agents.registry import AGENTS, Agent, Tier

# USD per million tokens. Keep in sync with the Anthropic pricing page.
PRICING: dict[str, tuple[float, float]] = {
    # model: (input_per_mtok, output_per_mtok)
    "claude-opus-5": (5.00, 25.00),
    "claude-sonnet-5": (2.00, 10.00),
    "claude-haiku-4-5": (1.00, 5.00),
}

CACHE_READ_MULTIPLIER = 0.10
CACHE_WRITE_MULTIPLIER = 1.25

#: Indicative. Used only to present INR alongside USD, since the SOW
#: invoices in INR (§10.2). Not a treasury rate.
USD_TO_INR = 88.0


@dataclass(frozen=True)
class AgentCost:
    agent: Agent
    model: str
    monthly_calls: int
    input_usd: float
    cache_read_usd: float
    cache_write_usd: float
    output_usd: float

    @property
    def total_usd(self) -> float:
        return self.input_usd + self.cache_read_usd + self.cache_write_usd + self.output_usd

    @property
    def usd_per_call(self) -> float:
        return self.total_usd / self.monthly_calls if self.monthly_calls else 0.0


def cost_for(agent: Agent, model: str | None = None, cache_hit_rate: float = 0.95) -> AgentCost:
    """Monthly cost for one agent.

    ``cache_hit_rate`` is the share of calls that read the cached prefix
    rather than writing it. 0.95 is realistic for a streaming agent whose
    prefix is a stable SOP library; a scheduled agent that fires twice a
    month will never hit its cache and should be modelled near 0.
    """
    model = model or agent.model
    in_rate, out_rate = PRICING[model]

    calls = agent.monthly_calls
    prefix = agent.cached_prefix_tokens

    # Prefix is either read from cache or written to it.
    reads = calls * cache_hit_rate
    writes = calls - reads

    cache_read_usd = (reads * prefix / 1_000_000) * in_rate * CACHE_READ_MULTIPLIER
    cache_write_usd = (writes * prefix / 1_000_000) * in_rate * CACHE_WRITE_MULTIPLIER
    input_usd = (calls * agent.input_tokens / 1_000_000) * in_rate
    output_usd = (calls * agent.output_tokens / 1_000_000) * out_rate

    return AgentCost(
        agent=agent,
        model=model,
        monthly_calls=calls,
        input_usd=input_usd,
        cache_read_usd=cache_read_usd,
        cache_write_usd=cache_write_usd,
        output_usd=output_usd,
    )


def _hit_rate_for(agent: Agent) -> float:
    """Cache hit rate by tier.

    A scheduled agent firing twice a month writes its prefix every time —
    the 5-minute TTL is long gone. Modelling it at 0.95 would understate
    the bill.
    """
    if agent.tier is Tier.STREAMING:
        return 0.95
    if agent.tier is Tier.ON_DEMAND:
        # Conversational agents burst, so later turns hit a warm cache.
        return 0.80 if agent.conversational else 0.50
    return 0.10


def fleet_cost(model_override: str | None = None) -> list[AgentCost]:
    return [cost_for(a, model_override, _hit_rate_for(a)) for a in AGENTS]


def total_usd(model_override: str | None = None) -> float:
    return sum(c.total_usd for c in fleet_cost(model_override))


def _fmt(costs: list[AgentCost]) -> str:
    lines = []
    width = 34
    lines.append(f"{'AGENT':<{width}} {'CALLS':>7} {'$/CALL':>9} {'USD/MO':>10}")
    lines.append("-" * (width + 29))
    for c in sorted(costs, key=lambda x: -x.total_usd):
        lines.append(
            f"{c.agent.name[:width]:<{width}} {c.monthly_calls:>7,} "
            f"{c.usd_per_call:>9.4f} {c.total_usd:>10,.2f}"
        )
    total = sum(c.total_usd for c in costs)
    calls = sum(c.monthly_calls for c in costs)
    lines.append("-" * (width + 29))
    lines.append(f"{'TOTAL':<{width}} {calls:>7,} {'':>9} {total:>10,.2f}")
    lines.append(f"{'':<{width}} {'':>7} {'INR':>9} {total * USD_TO_INR:>10,.0f}")
    return "\n".join(lines)


def main() -> None:
    print("Shoppers Stop — Claude API sizing")
    print("=" * 63)
    print(f"Agents: {len(AGENTS)}   ONE API surface (Messages API)\n")

    for model in ("claude-opus-5", "claude-sonnet-5", "claude-haiku-4-5"):
        costs = fleet_cost(model)
        total = sum(c.total_usd for c in costs)
        print(f"\n### All agents on {model}")
        print(f"    ${total:,.2f}/mo   (INR {total * USD_TO_INR:,.0f})")

    print("\n\n### Default fleet (claude-opus-5 throughout)\n")
    print(_fmt(fleet_cost()))

    # The mixed tier the architecture doc recommends as a Client option.
    print("\n\n### Mixed tier — streaming on Sonnet 5, reasoning on Opus 5\n")
    mixed: list[AgentCost] = []
    for a in AGENTS:
        model = "claude-sonnet-5" if a.tier is Tier.STREAMING else "claude-opus-5"
        mixed.append(cost_for(a, model, _hit_rate_for(a)))
    print(_fmt(mixed))


if __name__ == "__main__":
    main()
