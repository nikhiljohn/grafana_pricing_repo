"""Tests for the agent registry, cost model, and FreshService bridge."""

from __future__ import annotations

import pytest

from app.agents.cost_model import PRICING, cost_for, fleet_cost, total_usd
from app.agents.registry import (
    AGENTS,
    AGENTS_BY_KEY,
    DEFAULT_MODEL,
    Tier,
    total_monthly_calls,
)
from app.services.claude_agent_runtime import WORK_PACKET_SCHEMA, WorkPacket
from app.services.freshservice_client import (
    FS_TO_SOW_PRIORITY,
    SOW_TO_FS_PRIORITY,
    FsPriority,
    FsStatus,
    Ticket,
    sla_for,
)
from app.services.ticket_memory_bridge import (
    REVIEW_THRESHOLD,
    _is_curatable,
    render_work_packet,
)

# ── Registry ─────────────────────────────────────────────────────────


def test_agent_keys_are_unique():
    keys = [a.key for a in AGENTS]
    assert len(keys) == len(set(keys))
    assert len(AGENTS_BY_KEY) == len(AGENTS)


def test_every_agent_defaults_to_opus():
    """Cheaper models are a commercial decision, never a silent default."""
    assert all(a.model == DEFAULT_MODEL for a in AGENTS)
    assert DEFAULT_MODEL == "claude-opus-5"


def test_every_agent_has_a_priced_model():
    assert all(a.model in PRICING for a in AGENTS)


def test_all_seven_towers_are_covered():
    covered = {a.tower[0] for a in AGENTS if a.tower[0].isalpha()}
    for letter in "ABCDEFG":
        assert letter in covered, f"Tower {letter} has no agent"


def test_streaming_agents_dominate_call_volume():
    """If this flips, the cost model's cache assumptions need revisiting."""
    streaming = sum(a.monthly_calls for a in AGENTS if a.tier is Tier.STREAMING)
    assert streaming > total_monthly_calls() / 2


# ── Cost model ───────────────────────────────────────────────────────


def test_fleet_cost_is_bounded_and_positive():
    total = total_usd()
    assert 0 < total < 1_000, f"Fleet cost ${total} outside the sane range"


def test_cheaper_models_cost_less():
    opus = total_usd("claude-opus-5")
    sonnet = total_usd("claude-sonnet-5")
    haiku = total_usd("claude-haiku-4-5")
    assert opus > sonnet > haiku


def test_cache_hits_reduce_cost():
    agent = AGENTS_BY_KEY["alert_triage"]
    cold = cost_for(agent, cache_hit_rate=0.0)
    warm = cost_for(agent, cache_hit_rate=0.95)
    assert warm.total_usd < cold.total_usd
    # Writes cost 1.25x, reads 0.1x — a 12.5x spread on the prefix.
    assert cold.cache_write_usd > 0
    assert warm.cache_read_usd > 0


def test_cost_components_sum_to_total():
    for c in fleet_cost():
        expected = c.input_usd + c.cache_read_usd + c.cache_write_usd + c.output_usd
        assert c.total_usd == pytest.approx(expected)


def test_per_call_cost_matches_manual_arithmetic():
    """Guard the arithmetic itself, not just its self-consistency."""
    agent = AGENTS_BY_KEY["finops_digest"]  # 2 calls, no cache benefit
    c = cost_for(agent, "claude-opus-5", cache_hit_rate=0.0)
    in_rate, out_rate = PRICING["claude-opus-5"]

    expected_input = (2 * agent.input_tokens / 1_000_000) * in_rate
    expected_output = (2 * agent.output_tokens / 1_000_000) * out_rate
    expected_write = (2 * agent.cached_prefix_tokens / 1_000_000) * in_rate * 1.25

    assert c.input_usd == pytest.approx(expected_input)
    assert c.output_usd == pytest.approx(expected_output)
    assert c.cache_write_usd == pytest.approx(expected_write)


# ── Priority mapping ─────────────────────────────────────────────────


def test_sow_priority_mapping_is_a_bijection():
    """An off-by-one here puts a ticket on the wrong SLA clock."""
    assert SOW_TO_FS_PRIORITY["P1"] is FsPriority.URGENT
    assert SOW_TO_FS_PRIORITY["P4"] is FsPriority.LOW
    for sow, fs in SOW_TO_FS_PRIORITY.items():
        assert FS_TO_SOW_PRIORITY[int(fs)] == sow


def test_sla_text_matches_sow_clause_7_1():
    assert "15 minutes" in sla_for("P1")
    assert "4 hours" in sla_for("P1")
    assert "5 business days" in sla_for("P4")


def test_ticket_round_trips_from_api_payload():
    t = Ticket.from_api(
        {
            "id": 4471,
            "subject": "Node pool memory 81%",
            "description_text": "prod cluster",
            "priority": int(FsPriority.HIGH),
            "status": int(FsStatus.RESOLVED),
            "tags": ["intellicore"],
            "custom_fields": {"resolution_notes": "Scaled 7 to 9 nodes."},
        }
    )
    assert t.id == 4471
    assert t.sow_priority == "P2"
    assert t.is_resolved


# ── Work packet rendering ────────────────────────────────────────────


def _packet(**overrides) -> WorkPacket:
    base: dict = {
        "agent_key": "alert_triage",
        "summary": "Node pool at 81% memory before the festive window",
        "sow_priority": "P2",
        "confidence": 91,
        "memory_context": "Contained 4/4 times by pre-scaling 2 nodes.",
        "recommended_action": "execute_sop",
        "sop_steps": [
            {
                "step": 1,
                "action": "Scale the node pool",
                "command": "gcloud container clusters resize ss-ecom-prod-cluster --num-nodes=11",
                "expected": "11 nodes Ready within 4 minutes",
            }
        ],
        "rollback": "Resize back to 9 nodes.",
        "requires_client_approval": True,
        "input_tokens": 1200,
        "output_tokens": 700,
        "cache_read_tokens": 12000,
    }
    base.update(overrides)
    return WorkPacket(**base)


def test_rendered_packet_carries_command_sla_and_approval():
    html = render_work_packet(_packet())
    assert "gcloud container clusters resize" in html
    assert "respond within 30 minutes" in html
    assert "Requires Client approval" in html
    assert "read-only under SOW §4.11" in html


def test_low_confidence_packet_is_flagged_for_verification():
    html = render_work_packet(_packet(confidence=REVIEW_THRESHOLD - 1))
    assert "Low confidence" in html


def test_absent_memory_is_stated_not_faked():
    html = render_work_packet(_packet(memory_context=""))
    assert "No prior occurrence on this estate" in html


def test_actionable_only_for_execute_or_escalate():
    assert _packet(recommended_action="execute_sop").is_actionable
    assert _packet(recommended_action="escalate").is_actionable
    assert not _packet(recommended_action="suppress").is_actionable
    assert not _packet(recommended_action="observe").is_actionable


# ── Curation filter ──────────────────────────────────────────────────


def _ticket(status: int, notes: str | None) -> Ticket:
    return Ticket(
        id=1,
        subject="s",
        description="d",
        priority=int(FsPriority.MEDIUM),
        status=status,
        tags=[],
        resolution_notes=notes,
    )


def test_curation_requires_resolution_and_substantive_notes():
    good = "Reaped idle Magento connections and handed the leak to the app team."
    assert _is_curatable(_ticket(int(FsStatus.RESOLVED), good))
    # Resolved but empty, or trivially short — teaches Memory nothing.
    assert not _is_curatable(_ticket(int(FsStatus.RESOLVED), None))
    assert not _is_curatable(_ticket(int(FsStatus.RESOLVED), "done"))
    # Still open.
    assert not _is_curatable(_ticket(int(FsStatus.OPEN), good))


# ── Output schema ────────────────────────────────────────────────────


def test_work_packet_schema_is_strict_and_complete():
    assert WORK_PACKET_SCHEMA["additionalProperties"] is False
    required = set(WORK_PACKET_SCHEMA["required"])
    assert required == set(WORK_PACKET_SCHEMA["properties"])
    # Rollback is mandatory — a step list without one is not executable.
    assert "rollback" in required
    assert "requires_client_approval" in required
