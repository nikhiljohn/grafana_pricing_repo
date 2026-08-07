"""Mock adapter — generates a synthetic event stream per demo tenant.

Used by the seed script to populate the demo Memory graph. `demo-tenant`
(the account a logged-in Searce user actually authenticates as) keeps its
original 180-day generic narrative. The five customer tenants in the
managed book (netcore, aarti, shopstop, designx, dmart) each get a
narrative matching their story in the customer demo script, so switching
the org switcher in the UI reflects a genuinely different Memory graph
per customer — not just relabeled copies of the same data.
"""

import random
from collections.abc import AsyncIterator
from datetime import datetime, timedelta, timezone

from app.adapters.base import CloudAdapter

# Realistic-looking synthetic events. Timestamps are set relative to "today"
# so the seeded graph is always a rolling window.


def _now_offset(days_ago: float, hour: int = 10) -> datetime:
    ts = datetime.now(timezone.utc) - timedelta(days=days_ago)
    return ts.replace(hour=hour, minute=random.randint(0, 59), second=0, microsecond=0)


def _generic_events() -> list[dict]:
    """The original curated timeline for the `demo-tenant` account."""
    events: list[dict] = []
    rng = random.Random(42)

    events += [
        {
            "id": "evt_migration_start",
            "source": "gcp_audit",
            "event_type": "MigrationStarted",
            "category": "deployment",
            "severity": "info",
            "timestamp": _now_offset(178, 9),
            "title": "Initial GCP migration — Bengaluru region",
            "summary": "VPC, GKE, Cloud SQL provisioned in asia-south1.",
            "resource_id": "vpc-prod-primary",
            "resource_type": "vpc",
            "environment": "production",
        },
        {
            "id": "evt_vpc_created_1",
            "source": "gcp_audit",
            "event_type": "VpcCreated",
            "category": "deployment",
            "severity": "info",
            "timestamp": _now_offset(178, 10),
            "title": "Created VPC vpc-prod-primary",
            "summary": "10.100.0.0/16 in asia-south1, no PGA.",
            "resource_id": "vpc-prod-primary",
            "resource_type": "vpc",
            "environment": "production",
        },
        {
            "id": "evt_scc_finding_1",
            "source": "scc",
            "event_type": "SecurityFinding",
            "category": "security",
            "severity": "warning",
            "timestamp": _now_offset(150, 14),
            "title": "SCC: Private Google Access disabled on VPC",
            "summary": "vpc-prod-primary has no PGA — data exfiltration risk.",
            "resource_id": "vpc-prod-primary",
            "resource_type": "vpc",
            "environment": "production",
        },
    ]

    for weeks_ago in [22, 16, 10, 4]:
        friday = _now_offset(weeks_ago * 7 + (4 - datetime.now(timezone.utc).weekday()) % 7, 16)
        while friday.weekday() != 4:
            friday -= timedelta(days=1)
        events += [
            {
                "id": f"evt_friday_deploy_{weeks_ago}",
                "source": "gcp_audit",
                "event_type": "DeploymentApplied",
                "category": "deployment",
                "severity": "info",
                "timestamp": friday,
                "title": f"Prod deploy — release-{weeks_ago}",
                "summary": "Applied Helm release to gke-prod-app.",
                "resource_id": "gke-prod-app",
                "resource_type": "gke_cluster",
                "environment": "production",
            },
            {
                "id": f"evt_friday_incident_{weeks_ago}",
                "source": "pagerduty",
                "event_type": "IncidentOpened",
                "category": "reliability",
                "severity": "critical",
                "timestamp": friday + timedelta(hours=rng.randint(6, 60)),
                "title": "P2: elevated 5xx on hero-api",
                "summary": "5xx spiked to 4.2% following release; regressed to prior release.",
                "resource_id": "gke-prod-app",
                "resource_type": "gke_cluster",
                "environment": "production",
            },
        ]

    for i, days_ago in enumerate([155, 118, 74, 32]):
        events += [
            {
                "id": f"evt_vpc_new_{i}",
                "source": "gcp_audit",
                "event_type": "VpcCreated",
                "category": "deployment",
                "severity": "info",
                "timestamp": _now_offset(days_ago, 11),
                "title": f"Created VPC vpc-team-{i + 2}",
                "summary": "New team VPC provisioned via terraform module v0.4.",
                "resource_id": f"vpc-team-{i + 2}",
                "resource_type": "vpc",
                "environment": "production",
            },
            {
                "id": f"evt_scc_pga_{i}",
                "source": "scc",
                "event_type": "SecurityFinding",
                "category": "security",
                "severity": "warning",
                "timestamp": _now_offset(days_ago - rng.randint(3, 30), 8),
                "title": "SCC: PGA disabled on VPC",
                "summary": f"vpc-team-{i + 2}: no PGA. Recommend enabling.",
                "resource_id": f"vpc-team-{i + 2}",
                "resource_type": "vpc",
                "environment": "production",
            },
        ]

    for i, days_ago in enumerate([120, 82, 40]):
        events += [
            {
                "id": f"evt_ai_endpoint_{i}",
                "source": "gcp_audit",
                "event_type": "InferenceEndpointCreated",
                "category": "ai",
                "severity": "info",
                "timestamp": _now_offset(days_ago, 15),
                "title": f"Vertex endpoint created — vertex-inference-{i}",
                "summary": "GPU-backed endpoint (a2-highgpu-1g).",
                "resource_id": f"vertex-inference-{i}",
                "resource_type": "vertex_endpoint",
                "environment": "production",
            },
            {
                "id": f"evt_cost_spike_{i}",
                "source": "cost_anomaly",
                "event_type": "CostSpike",
                "category": "cost",
                "severity": "warning",
                "timestamp": _now_offset(days_ago - rng.randint(10, 28), 6),
                "title": f"Cost anomaly: +{rng.randint(38, 84)}% on Vertex AI",
                "summary": f"Endpoint vertex-inference-{i} 24h spend spiked.",
                "resource_id": f"vertex-inference-{i}",
                "resource_type": "vertex_endpoint",
                "amount_inr": float(rng.randint(240_000, 1_200_000)),
                "environment": "production",
            },
        ]

    for i, days_ago in enumerate([88, 61, 47, 22, 8]):
        events.append({
            "id": f"evt_mem_pressure_{i}",
            "source": "gcp_monitoring",
            "event_type": "MemoryPressure",
            "category": "reliability",
            "severity": "warning",
            "timestamp": _now_offset(days_ago, 13),
            "title": f"GKE node memory pressure — gke-prod-{'app' if i % 2 == 0 else 'ml'}",
            "summary": "Node pool hit >90% mem at 65% of capacity projection.",
            "resource_id": f"gke-prod-{'app' if i % 2 == 0 else 'ml'}",
            "resource_type": "gke_cluster",
            "environment": "production",
        })

    for i, days_ago in enumerate([140, 91, 55, 20]):
        events.append({
            "id": f"evt_iam_grant_{i}",
            "source": "gcp_audit",
            "event_type": "IamRoleGranted",
            "category": "security",
            "severity": "info",
            "timestamp": _now_offset(days_ago, 12),
            "title": "IAM: role granted to service account",
            "summary": f"sa-analytics-{i}@ granted roles/bigquery.dataEditor.",
            "resource_id": f"sa-analytics-{i}",
            "resource_type": "service_account",
            "environment": "production",
        })

    events += [
        {
            "id": "evt_ai_launch",
            "source": "internal",
            "event_type": "ProductLaunch",
            "category": "ai",
            "severity": "info",
            "timestamp": _now_offset(130, 10),
            "title": "AI-powered search launched to production",
            "summary": "Vertex-based semantic search behind /search endpoint.",
            "environment": "production",
        },
        {
            "id": "evt_multiregion",
            "source": "internal",
            "event_type": "ArchitectureChange",
            "category": "deployment",
            "severity": "info",
            "timestamp": _now_offset(96, 10),
            "title": "Multi-region rollout begins",
            "summary": "Traffic split enabled between asia-south1 and asia-southeast1.",
            "environment": "production",
        },
        {
            "id": "evt_intellicore_onboard",
            "source": "internal",
            "event_type": "IntellicoreOnboarded",
            "category": "reliability",
            "severity": "info",
            "timestamp": _now_offset(45, 9),
            "title": "Onboarded to Intellicore CMP",
            "summary": "CSRE squad assigned; ingestion begins; Memory graph starts building.",
            "environment": "production",
        },
    ]

    return sorted(events, key=lambda e: e["timestamp"])


def _netcore_events() -> list[dict]:
    """Netcore Cloud — Martech SaaS — FinOps hero: BigQuery ETL cost spike."""
    rng = random.Random(101)
    events: list[dict] = []

    for i, days_ago in enumerate([120, 90, 45, 15, 0.2]):
        events.append({
            "id": f"nc_etl_spike_{i}",
            "source": "cost_anomaly",
            "event_type": "CostSpike",
            "category": "cost",
            "severity": "warning" if days_ago > 1 else "critical",
            "timestamp": _now_offset(days_ago, 2),
            "title": f"BigQuery cost anomaly: +{rng.randint(180, 340)}%",
            "summary": "Unoptimized JOIN scanning full 2TB analytics.events table.",
            "resource_id": "etl-analytics-nightly",
            "resource_type": "bigquery_job",
            "amount_inr": float(rng.randint(180_000, 420_000)),
            "environment": "production",
        })

    for i, days_ago in enumerate([88, 61, 47, 22, 8]):
        events.append({
            "id": f"nc_mem_pressure_{i}",
            "source": "gcp_monitoring",
            "event_type": "MemoryPressure",
            "category": "reliability",
            "severity": "warning",
            "timestamp": _now_offset(days_ago, 13),
            "title": "GKE node pool memory pressure — gke-prod-app",
            "summary": "Node pool hit >90% mem at 65% of capacity projection.",
            "resource_id": "gke-prod-app",
            "resource_type": "gke_cluster",
            "environment": "production" if i % 3 else "staging",
        })

    for weeks_ago in [22, 16, 10, 4]:
        friday = _now_offset(weeks_ago * 7, 16)
        events += [
            {
                "id": f"nc_friday_deploy_{weeks_ago}",
                "source": "gcp_audit", "event_type": "DeploymentApplied", "category": "deployment",
                "severity": "info", "timestamp": friday, "title": f"Prod deploy — search-api release-{weeks_ago}",
                "summary": "Helm release applied to gke-prod-app.", "resource_id": "gke-prod-app",
                "resource_type": "gke_cluster", "environment": "production",
            },
            {
                "id": f"nc_friday_incident_{weeks_ago}",
                "source": "pagerduty", "event_type": "IncidentOpened", "category": "reliability",
                "severity": "critical", "timestamp": friday + timedelta(hours=rng.randint(6, 60)),
                "title": "P2: elevated 5xx on search-api", "summary": "5xx spiked following Friday release.",
                "resource_id": "gke-prod-app", "resource_type": "gke_cluster", "environment": "production",
            },
        ]

    for i, days_ago in enumerate([155, 118, 74, 32]):
        events += [
            {
                "id": f"nc_vpc_new_{i}", "source": "gcp_audit", "event_type": "VpcCreated",
                "category": "deployment", "severity": "info", "timestamp": _now_offset(days_ago, 11),
                "title": f"Created VPC vpc-team-{i + 2}", "summary": "New team VPC without PGA.",
                "resource_id": f"vpc-team-{i + 2}", "resource_type": "vpc", "environment": "production",
            },
            {
                "id": f"nc_scc_pga_{i}", "source": "scc", "event_type": "SecurityFinding",
                "category": "security", "severity": "warning",
                "timestamp": _now_offset(days_ago - rng.randint(3, 30), 8),
                "title": "SCC: PGA disabled on VPC", "summary": f"vpc-team-{i + 2}: no PGA.",
                "resource_id": f"vpc-team-{i + 2}", "resource_type": "vpc", "environment": "production",
            },
        ]

    return sorted(events, key=lambda e: e["timestamp"])


def _aarti_events() -> list[dict]:
    """Aarti Industries — Chemicals/Pharma — Cloud Security hero: SSH open to internet."""
    rng = random.Random(102)
    events: list[dict] = []

    for i, days_ago in enumerate([60, 48, 36, 24, 19, 12, 12, 8, 5, 3, 1, 0.1]):
        events.append({
            "id": f"aarti_ssh_{i}",
            "source": "scc", "event_type": "SecurityFinding", "category": "security",
            "severity": "critical" if days_ago < 1 else "warning",
            "timestamp": _now_offset(days_ago, 8),
            "title": "SG allows SSH from 0.0.0.0/0 (CIS 5.2)",
            "summary": "Security group open to internet on port 22.",
            "resource_id": f"erp-prod-app-sg-{i % 3}",
            "resource_type": "security_group", "environment": "production",
        })

    for i, days_ago in enumerate([90, 60, 30]):
        events.append({
            "id": f"aarti_iam_grant_{i}", "source": "gcp_audit", "event_type": "IamRoleGranted",
            "category": "security", "severity": "info", "timestamp": _now_offset(days_ago, 12),
            "title": "IAM: Editor role granted to service account",
            "summary": f"erp-deploy-sa-{i}@ granted roles/editor by default.",
            "resource_id": f"erp-deploy-sa-{i}", "resource_type": "service_account",
            "environment": "production",
        })

    events.append({
        "id": "aarti_compliance_evidence", "source": "internal", "event_type": "ComplianceEvidenceRequested",
        "category": "security", "severity": "info", "timestamp": _now_offset(21, 9),
        "title": "Auditor requested remediation evidence (Q3 CIS audit)",
        "summary": "3 findings required evidence package for compliance review.",
        "environment": "production",
    })

    return sorted(events, key=lambda e: e["timestamp"])


def _shopstop_events() -> list[dict]:
    """ShoppersStop — Retail/E-commerce — CloudOps hero: pre-sale egress anomaly."""
    events: list[dict] = []

    events.append({
        "id": "shopstop_egress_fp", "source": "gcp_monitoring", "event_type": "NetworkAnomaly",
        "category": "reliability", "severity": "warning", "timestamp": _now_offset(58, 9),
        "title": "Bastion-host egress anomalous (3.3σ)",
        "summary": "Investigation confirmed a legitimate cross-region backup job.",
        "resource_id": "bastion-host", "resource_type": "vm", "environment": "production",
    })
    events.append({
        "id": "shopstop_egress_real", "source": "gcp_monitoring", "event_type": "NetworkAnomaly",
        "category": "reliability", "severity": "critical", "timestamp": _now_offset(0.15, 7),
        "title": "checkout-service egress anomalous (3.3σ) ahead of sale",
        "summary": "Signature differs from the known Jun 2 backup-job false positive.",
        "resource_id": "checkout-service-prod", "resource_type": "vm", "environment": "production",
    })

    for i, days_ago in enumerate([76, 61, 45, 30, 15, 3]):
        events.append({
            "id": f"shopstop_cpu_predict_{i}", "source": "gcp_monitoring", "event_type": "CpuBreachPredicted",
            "category": "reliability", "severity": "warning", "timestamp": _now_offset(days_ago, 18),
            "title": "CPU predicted to breach at peak traffic",
            "summary": "Predictive agent auto-scaled 6 min ahead of projected breach.",
            "resource_id": "checkout-service-prod", "resource_type": "vm", "environment": "production",
        })

    events.append({
        "id": "shopstop_sap_stable", "source": "gcp_monitoring", "event_type": "WorkloadHealthCheck",
        "category": "reliability", "severity": "info", "timestamp": _now_offset(14, 9),
        "title": "SAP HANA workload passed quarterly performance review",
        "summary": "sap-hana-prod (m3-megamem-64) stable at 52% CPU / 61% memory — no action needed.",
        "resource_id": "sap-hana-prod", "resource_type": "vm", "environment": "production",
    })

    return sorted(events, key=lambda e: e["timestamp"])


def _designx_events() -> list[dict]:
    """DesignX — Design SaaS — DevOps hero: CI bot IAM guardrail."""
    events: list[dict] = []

    events.append({
        "id": "designx_iam_incident", "source": "gcp_audit", "event_type": "IamRoleGranted",
        "category": "security", "severity": "critical", "timestamp": _now_offset(85, 11),
        "title": "deploy-bot granted project Editor",
        "summary": "Editor grant to a CI bot led to a privilege-escalation finding.",
        "resource_id": "deploy-bot", "resource_type": "service_account", "environment": "production",
    })
    events.append({
        "id": "designx_iam_guardrail", "source": "internal", "event_type": "GuardrailTriggered",
        "category": "deployment", "severity": "warning", "timestamp": _now_offset(12, 11),
        "title": "Pre-deploy guardrail blocked risky IAM grant",
        "summary": "deploy-bot Editor grant blocked; least-privilege role suggested before it shipped.",
        "resource_id": "deploy-bot", "resource_type": "service_account", "environment": "production",
    })
    for i, days_ago in enumerate([88, 70, 55, 40, 25, 10]):
        events.append({
            "id": f"designx_deploy_{i}", "source": "internal", "event_type": "DeploymentApplied",
            "category": "deployment", "severity": "info", "timestamp": _now_offset(days_ago, 9),
            "title": "Cloud Run deploy succeeded", "summary": "v2.x rolled out, 0 errors in canary.",
            "resource_id": "render-farm-prod", "resource_type": "cloud_run", "environment": "production",
        })

    return sorted(events, key=lambda e: e["timestamp"])


def _dmart_events() -> list[dict]:
    """Dmart — Retail/E-commerce — CloudOps/Kubernetes hero: HCL Commerce on GKE, OOMKilled checkout pods."""
    rng = random.Random(103)
    events: list[dict] = []

    for i, days_ago in enumerate([70, 40, 0.05]):
        events.append({
            "id": f"dmart_oomkill_{i}",
            "source": "gcp_monitoring", "event_type": "PodOOMKilled", "category": "reliability",
            "severity": "warning" if days_ago > 1 else "critical",
            "timestamp": _now_offset(days_ago, 14),
            "title": "hcl-commerce-checkout pods OOMKilled during flash-sale traffic",
            "summary": "JVM heap exceeded the pod's 2Gi memory limit under flash-sale load.",
            "resource_id": "gke-prod-commerce", "resource_type": "gke_cluster", "environment": "production",
        })

    for i, days_ago in enumerate([55, 20]):
        events.append({
            "id": f"dmart_nodepool_overprov_{i}",
            "source": "gcp_monitoring", "event_type": "CostSpike", "category": "cost",
            "severity": "warning", "timestamp": _now_offset(days_ago, 8),
            "title": "GKE node pool left over-provisioned after flash-sale window",
            "summary": "Node pool stayed scaled to 3x for 4 days after the sale ended.",
            "resource_id": "gke-prod-commerce", "resource_type": "gke_cluster",
            "amount_inr": float(rng.randint(60_000, 140_000)), "environment": "production",
        })

    events.append({
        "id": "dmart_scaledown_automation", "source": "internal", "event_type": "GuardrailTriggered",
        "category": "deployment", "severity": "info", "timestamp": _now_offset(53, 10),
        "title": "Automated 48h post-sale node pool scale-down added",
        "summary": "Prevents the over-provisioning pattern seen after the last 2 sale windows.",
        "resource_id": "gke-prod-commerce", "resource_type": "gke_cluster", "environment": "production",
    })

    for i, days_ago in enumerate([12, 6]):
        events.append({
            "id": f"dmart_podsec_{i}", "source": "scc", "event_type": "SecurityFinding",
            "category": "security", "severity": "warning", "timestamp": _now_offset(days_ago, 9),
            "title": "Pod running without non-root securityContext",
            "summary": "hcl-commerce workload missing runAsNonRoot (CIS Kubernetes 5.2.6).",
            "resource_id": "gke-prod-catalog" if i else "gke-prod-commerce",
            "resource_type": "gke_cluster", "environment": "production",
        })

    for i, days_ago in enumerate([65, 48, 30, 9]):
        events.append({
            "id": f"dmart_deploy_{i}", "source": "internal", "event_type": "DeploymentApplied",
            "category": "deployment", "severity": "info", "timestamp": _now_offset(days_ago, 9),
            "title": "Helm rollout succeeded", "summary": "hcl-commerce-catalog canary rolled out, 0 errors.",
            "resource_id": "gke-prod-catalog", "resource_type": "gke_cluster", "environment": "production",
        })
    events.append({
        "id": "dmart_helm_rollback", "source": "internal", "event_type": "DeploymentRolledBack",
        "category": "deployment", "severity": "warning", "timestamp": _now_offset(0.3, 9),
        "title": "Helm chart rollback — hcl-commerce-search v3.4.2",
        "summary": "Latency regression detected in canary; rolled back to v3.4.1 within 6 min.",
        "resource_id": "gke-prod-commerce", "resource_type": "gke_cluster", "environment": "production",
    })

    return sorted(events, key=lambda e: e["timestamp"])


TENANT_EVENT_BUILDERS = {
    "demo-tenant": _generic_events,
    "netcore": _netcore_events,
    "aarti": _aarti_events,
    "shopstop": _shopstop_events,
    "designx": _designx_events,
    "dmart": _dmart_events,
}


def _mock_events(tenant_id: str) -> list[dict]:
    builder = TENANT_EVENT_BUILDERS.get(tenant_id, _generic_events)
    return builder()


class MockAdapter(CloudAdapter):
    name = "mock"

    async def fetch_events(self, tenant_id: str) -> AsyncIterator[dict]:
        for event in _mock_events(tenant_id):
            yield event
