"""Intellicore CMP — agent registry for the Shoppers Stop eCommerce engagement.

OPERATING MODEL: ADVISE, DO NOT ACT.

Every agent here produces a *work packet* for a human engineer — what
happened, what it means, the exact steps to fix it, and how to roll back.
None of them change customer infrastructure. That is not a limitation we
chose for safety theatre; it falls out of the contract. Under SOW §4.11
Searce holds Project Viewer and Tech Support Editor only, and under §3.2
every Searce-initiated change needs Client approval. An agent that mutated
state would be operating outside the access model the Client signed.

So the unit of output is a runnable SOP, not an applied change.

MODEL SELECTION
Every agent defaults to ``claude-opus-5``. Cheaper models are a deliberate
commercial decision, not a default we make quietly — see
``cost_model.py`` for the comparison across tiers, and
``docs/SHOPPERSSTOP_AGENT_ARCHITECTURE.md`` for the recommendation.

There is ONE Claude API — the Messages API. "How many Claude APIs" is
really three questions: how many agents (below), how many calls per month
(``monthly_calls``), and what that costs (``cost_model.py``).
"""

from __future__ import annotations

from dataclasses import dataclass
from enum import StrEnum

# The model every agent uses unless a tier override is applied.
DEFAULT_MODEL = "claude-opus-5"


class Tier(StrEnum):
    """How an agent is driven, which sets its volume profile."""

    #: Fires on every inbound signal. High volume, short context.
    STREAMING = "streaming"
    #: Fires on a schedule (nightly, per-window, bi-monthly).
    SCHEDULED = "scheduled"
    #: Fires on a human request or a specific rare event (P1, sale event).
    ON_DEMAND = "on_demand"


class Effort(StrEnum):
    """Maps to output_config.effort on the Messages API."""

    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    XHIGH = "xhigh"


@dataclass(frozen=True)
class Agent:
    """One agent. Maps to a tower, a trigger, and a token profile."""

    key: str
    name: str
    tower: str
    tier: Tier
    trigger: str
    #: What the human receives. This is the contract with the squad.
    produces: str
    #: Estimated Claude calls per month. Basis is documented per agent.
    monthly_calls: int
    #: Cached prefix: system prompt + SOP library + estate context.
    cached_prefix_tokens: int
    #: Fresh input per call (the alert, the finding, the diff).
    input_tokens: int
    #: Expected output length.
    output_tokens: int
    effort: Effort = Effort.HIGH
    model: str = DEFAULT_MODEL
    #: FreshService ticket types this agent reads or writes.
    freshservice: tuple[str, ...] = ()
    #: True when the agent is multi-turn (tool loop), which multiplies calls.
    conversational: bool = False
    notes: str = ""
    sow_clause: str = ""


# ─────────────────────────────────────────────────────────────────────
#  Tier 1 — Streaming. These carry the L1 load.
# ─────────────────────────────────────────────────────────────────────

_STREAMING: list[Agent] = [
    Agent(
        key="alert_triage",
        name="Alert Triage Agent",
        tower="A — Cloud Infrastructure",
        tier=Tier.STREAMING,
        trigger="Every Grafana / Dynatrace alert across all 7 projects",
        produces=(
            "FreshService ticket with proposed priority (P1-P4 per §7.1), the "
            "matching Memory pattern, and the SOP to run — or a suppression "
            "recommendation with the reason"
        ),
        # ~60 raw alerts/day across 7 projects, 23 pods, 5 VMs, 5 DBs.
        monthly_calls=1_800,
        cached_prefix_tokens=12_000,
        input_tokens=1_200,
        output_tokens=700,
        effort=Effort.MEDIUM,
        freshservice=("incident",),
        notes=(
            "Highest-volume agent by an order of magnitude, and therefore the "
            "one whose model choice decides the bill. Prefix is the SOP "
            "library plus estate topology — near-identical across calls, so it "
            "caches almost perfectly."
        ),
        sow_clause="§4.3",
    ),
    Agent(
        key="gke_health",
        name="GKE Health Agent",
        tower="B — GKE & Cloud Run",
        tier=Tier.STREAMING,
        trigger="Pod restarts, node pressure, autoscaling and Istio events",
        produces=(
            "Either a logged non-event (Autopilot self-repair) or an escalation "
            "naming the cascading-failure signature and the pre-scale action"
        ),
        # ~30 cluster events/day across 3 clusters.
        monthly_calls=900,
        cached_prefix_tokens=12_000,
        input_tokens=1_500,
        output_tokens=800,
        effort=Effort.MEDIUM,
        freshservice=("incident",),
        notes=(
            "Suppresses benign Autopilot evictions, which is most of the "
            "overnight L1 noise on this estate."
        ),
        sow_clause="§4.4",
    ),
    Agent(
        key="db_health",
        name="Database Health Agent",
        tower="C — Database (CloudSQL)",
        tier=Tier.STREAMING,
        trigger="Connection, replication, storage and slow-query signals on 5 instances",
        produces=(
            "Early-warning ticket with the projected breach date and the "
            "remediation SOP, raised as P3 in a window rather than a 03:00 P1"
        ),
        # 4 scheduled sweeps/day + event-driven.
        monthly_calls=200,
        cached_prefix_tokens=12_000,
        input_tokens=2_500,
        output_tokens=900,
        freshservice=("incident", "service_request"),
        notes="Owns the connection-pool projection that converts P1s into P3s.",
        sow_clause="§4.5",
    ),
    Agent(
        key="security_triage",
        name="Security Finding Triage Agent",
        tower="F — Cloud Security",
        tier=Tier.STREAMING,
        trigger="Each CSPM scan — ranks all 65+ checks in one call",
        produces=(
            "Top-N findings ranked by exploitability against THIS estate, each "
            "with the exact gcloud/Terraform remediation and a blast-radius note"
        ),
        # One ranking call per daily scan; the whole finding set fits one call.
        monthly_calls=30,
        cached_prefix_tokens=12_000,
        input_tokens=18_000,
        output_tokens=4_000,
        effort=Effort.XHIGH,
        freshservice=("incident", "problem"),
        notes=(
            "Ranking the full set in one call is what lets it reason about "
            "relative blast radius. Per-finding calls would lose that and cost "
            "more. This is the agent that moved the Keycloak CVE from 7th to 1st."
        ),
        sow_clause="§4.8",
    ),
    Agent(
        key="cost_anomaly",
        name="Cost Anomaly Agent",
        tower="G — FinOps",
        tier=Tier.STREAMING,
        trigger="Billing export deltas beyond the seasonal model",
        produces="Anomaly narrative with root cause hypothesis, prior occurrence, and fix",
        monthly_calls=60,
        cached_prefix_tokens=12_000,
        input_tokens=4_000,
        output_tokens=1_200,
        freshservice=("service_request",),
        notes=(
            "Caught two config mistakes last quarter that a static budget "
            "threshold would have missed — both were within budget, just wasteful."
        ),
        sow_clause="§4.9",
    ),
]

# ─────────────────────────────────────────────────────────────────────
#  Tier 2 — Scheduled. Predictable, batchable.
# ─────────────────────────────────────────────────────────────────────

_SCHEDULED: list[Agent] = [
    Agent(
        key="windows_vm_sop",
        name="Windows VM SOP Agent",
        tower="E — Windows VM",
        tier=Tier.SCHEDULED,
        trigger="Weekly restart window + nightly card-archival script",
        produces="Pre-flight checklist, then a post-run validation verdict per VM",
        # 4 weekly windows + 30 nightly archival checks.
        monthly_calls=34,
        cached_prefix_tokens=8_000,
        input_tokens=2_000,
        output_tokens=800,
        effort=Effort.LOW,
        freshservice=("change",),
        notes=(
            "The one agent that barely needs a model — the SOP is deterministic "
            "and the check is a curl assertion. Claude is used only to interpret "
            "a FAILED check. Retires with the Dec 2026 GKE migration."
        ),
        sow_clause="§4.7",
    ),
    Agent(
        key="deploy_preflight",
        name="Deployment Pre-flight Agent",
        tower="D — DevOps & CI/CD",
        tier=Tier.SCHEDULED,
        trigger="Each release, before the 02:00-05:00 window opens",
        produces=(
            "Release classification (A/B/C), go/no-go with reasons, the Magaz "
            "post-deploy command set, and the rollback plan"
        ),
        # ~4 releases/month x 3 calls (classify, pre-flight, post-verify).
        monthly_calls=12,
        cached_prefix_tokens=10_000,
        input_tokens=6_000,
        output_tokens=2_500,
        effort=Effort.XHIGH,
        freshservice=("change",),
        notes=(
            "Blocks on the schema-rehearsal guardrail. Both 90-day deploy "
            "failures carried a schema change."
        ),
        sow_clause="§4.6",
    ),
    Agent(
        key="memory_curator",
        name="Memory Curator",
        tower="Cross-cutting",
        tier=Tier.SCHEDULED,
        trigger="Nightly, over the day's resolved FreshService tickets",
        produces=(
            "New or updated Memory entries — pattern, learning, confidence — "
            "written back to Neo4j and linked to the source ticket"
        ),
        monthly_calls=30,
        cached_prefix_tokens=8_000,
        input_tokens=12_000,
        output_tokens=3_000,
        effort=Effort.XHIGH,
        freshservice=("incident", "problem", "change"),
        notes=(
            "This is the flywheel. Without it Memory never learns from the "
            "squad's own resolutions and the product's core claim stays "
            "aspirational. Reads resolution notes FROM FreshService."
        ),
        sow_clause="§4.10",
    ),
    Agent(
        key="finops_digest",
        name="FinOps Digest Agent",
        tower="G — FinOps",
        tier=Tier.SCHEDULED,
        trigger="1st and 15th of each month",
        produces="Draft bi-monthly cost report with narratives and right-sizing recommendations",
        monthly_calls=2,
        cached_prefix_tokens=10_000,
        input_tokens=25_000,
        output_tokens=8_000,
        effort=Effort.XHIGH,
        freshservice=("service_request",),
        notes="Contractually due on the 1st and 15th (§3.1, §4.9).",
        sow_clause="§4.9",
    ),
    Agent(
        key="wellness_review",
        name="Monthly Wellness / CAB Pack",
        tower="Governance",
        tier=Tier.SCHEDULED,
        trigger="Monthly, ahead of the wellness review",
        produces="SLA adherence, incident trends, repeat-incident rate, open risks",
        monthly_calls=1,
        cached_prefix_tokens=10_000,
        input_tokens=40_000,
        output_tokens=10_000,
        effort=Effort.XHIGH,
        notes="Feeds the outcome scorecard in SHOPPERSSTOP_DELIVERY_DESIGN.md §4.",
        sow_clause="§3.1",
    ),
]

# ─────────────────────────────────────────────────────────────────────
#  Tier 3 — On-demand. Rare, deep, multi-turn.
# ─────────────────────────────────────────────────────────────────────

_ON_DEMAND: list[Agent] = [
    Agent(
        key="incident_commander",
        name="Incident Commander",
        tower="Cross-cutting",
        tier=Tier.ON_DEMAND,
        trigger="Any P1, or a P2 that escalates",
        produces=(
            "Running incident timeline, correlated Memory, next diagnostic step, "
            "and a drafted RCA when the incident closes"
        ),
        # ~2 P1/P2 escalations per month, ~12 turns each.
        monthly_calls=24,
        cached_prefix_tokens=15_000,
        input_tokens=8_000,
        output_tokens=2_000,
        effort=Effort.XHIGH,
        conversational=True,
        freshservice=("incident", "problem"),
        notes=(
            "The only agent a human talks to during an outage. Response quality "
            "matters more than cost here by a wide margin — do not downgrade it."
        ),
        sow_clause="§7.1",
    ),
    Agent(
        key="presale_readiness",
        name="Pre-Sale Readiness Agent",
        tower="Cross-cutting",
        tier=Tier.ON_DEMAND,
        trigger="On the Client's 48h sale-event notice (§7.2)",
        produces=(
            "Go/no-go report: node headroom vs expected load, DB connection "
            "headroom, open blast-radius findings, and the pre-scale plan"
        ),
        monthly_calls=10,
        cached_prefix_tokens=15_000,
        input_tokens=20_000,
        output_tokens=6_000,
        effort=Effort.XHIGH,
        conversational=True,
        freshservice=("change",),
        notes=(
            "No human squad delivers this today at any price. It is the "
            "clearest commercial differentiator in the whole agent set."
        ),
        sow_clause="§7.2",
    ),
    Agent(
        key="schema_dependency_map",
        name="MySQL 8.4 Dependency Mapper",
        tower="C — Database",
        tier=Tier.ON_DEMAND,
        trigger="Per schema change, and for the 8.4 upgrade programme",
        produces=(
            "Which services break if this schema changes — across Magento, SSO, "
            "Keycloak and CMS — plus the expand/contract migration plan"
        ),
        monthly_calls=20,
        cached_prefix_tokens=15_000,
        input_tokens=30_000,
        output_tokens=8_000,
        effort=Effort.XHIGH,
        conversational=True,
        freshservice=("change", "problem"),
        notes=(
            "De-risks the December 2026 deadline (§4.5). Also the input to the "
            "schema-rehearsal guardrail that gates Class B releases."
        ),
        sow_clause="§4.5",
    ),
    Agent(
        key="sop_advisor",
        name="SOP Advisor",
        tower="Cross-cutting",
        tier=Tier.ON_DEMAND,
        trigger="An engineer opens a ticket and asks 'what do I run?'",
        produces="The exact runbook for this ticket, parameterised to the affected resource",
        # Assume ~40% of the ~500 human-touched tickets/month ask for this.
        monthly_calls=200,
        cached_prefix_tokens=12_000,
        input_tokens=3_000,
        output_tokens=1_500,
        freshservice=("incident", "service_request", "change"),
        notes=(
            "This is the agent that most directly delivers the operating model: "
            "Intellicore holds the detail, the human executes it."
        ),
        sow_clause="§4.10",
    ),
    Agent(
        key="compliance_reporter",
        name="Compliance Reporter",
        tower="F — Cloud Security",
        tier=Tier.ON_DEMAND,
        trigger="On request — PCI-DSS, ISO 27001, CIS, NIST CSF",
        produces="Framework report with live findings as evidence",
        monthly_calls=4,
        cached_prefix_tokens=12_000,
        input_tokens=30_000,
        output_tokens=10_000,
        effort=Effort.XHIGH,
        notes="Reports are in scope; certification is not (§4.8).",
        sow_clause="§4.8",
    ),
    Agent(
        key="change_risk_scorer",
        name="Change Risk Scorer",
        tower="D — DevOps",
        tier=Tier.ON_DEMAND,
        trigger="Every change request raised in FreshService",
        produces="Risk score with the Memory precedent, and the guardrails it trips",
        monthly_calls=60,
        cached_prefix_tokens=12_000,
        input_tokens=4_000,
        output_tokens=1_500,
        freshservice=("change",),
        notes="Feeds the CAB. Trips the maintenance-window and schema guardrails.",
        sow_clause="§4.6",
    ),
]

AGENTS: tuple[Agent, ...] = tuple(_STREAMING + _SCHEDULED + _ON_DEMAND)

AGENTS_BY_KEY: dict[str, Agent] = {a.key: a for a in AGENTS}


def by_tier(tier: Tier) -> list[Agent]:
    return [a for a in AGENTS if a.tier is tier]


def by_tower(tower_prefix: str) -> list[Agent]:
    """All agents for a tower, matched on its leading letter (e.g. 'A')."""
    return [a for a in AGENTS if a.tower.startswith(tower_prefix)]


def total_monthly_calls() -> int:
    return sum(a.monthly_calls for a in AGENTS)
