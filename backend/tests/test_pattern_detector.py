"""Unit test — pattern rules are well-formed Cypher."""

import re

from app.services.pattern_detector import RULES

CYPHER_FORBIDDEN_IN_RULES = re.compile(r"\b(DELETE|MERGE|SET|REMOVE|DROP)\b", re.IGNORECASE)


def test_all_rules_have_required_fields() -> None:
    required = {"id_prefix", "title", "category", "impact_estimate", "recommended_action", "cypher"}
    for rule in RULES:
        missing = required - set(rule.keys())
        assert not missing, f"Rule '{rule.get('id_prefix')}' missing: {missing}"


def test_all_rules_scope_to_tenant() -> None:
    """Every rule must filter by $tenant_id — no cross-tenant reads."""
    for rule in RULES:
        assert "$tenant_id" in rule["cypher"], (
            f"Rule '{rule['id_prefix']}' does not scope to $tenant_id"
        )


def test_no_write_operations_in_rules() -> None:
    """Pattern rules must be pure reads."""
    for rule in RULES:
        assert not CYPHER_FORBIDDEN_IN_RULES.search(rule["cypher"]), (
            f"Rule '{rule['id_prefix']}' contains write operations"
        )
