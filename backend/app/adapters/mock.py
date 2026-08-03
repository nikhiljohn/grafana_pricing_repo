"""Mock adapter — generates a 180-day synthetic event stream for a demo tenant.

Used by the seed script to populate the demo Memory graph so a fresh
staging deployment shows the product in action immediately.
"""

import random
from collections.abc import AsyncIterator
from datetime import datetime, timedelta, timezone

from app.adapters.base import CloudAdapter

# Realistic-looking synthetic events. Timestamps are set relative to "today"
# so the seeded graph is always a rolling 6-month window.

_RESOURCES = [
    ("gke-prod-app", "gke_cluster"),
    ("gke-prod-ml", "gke_cluster"),
    ("vpc-prod-primary", "vpc"),
    ("vpc-staging", "vpc"),
    ("cloudsql-prod-primary", "cloudsql_instance"),
    ("gcs-user-uploads", "gcs_bucket"),
    ("pubsub-ingestion", "pubsub_topic"),
    ("vertex-inference-hero", "vertex_endpoint"),
    ("vertex-inference-search", "vertex_endpoint"),
    ("aws-eks-analytics", "eks_cluster"),
    ("aws-s3-archive", "s3_bucket"),
]


def _now_offset(days_ago: float, hour: int = 10) -> datetime:
    ts = datetime.now(timezone.utc) - timedelta(days=days_ago)
    return ts.replace(hour=hour, minute=random.randint(0, 59), second=0, microsecond=0)


def _mock_events() -> list[dict]:
    """A curated timeline that will trigger real pattern detections."""
    events: list[dict] = []
    rng = random.Random(42)

    # ─── 6-month narrative ────────────────────────────────────────
    # 180 days ago: initial GCP migration
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
        },
    ]

    # Pattern: Friday deployments → weekend P2 incidents (x4)
    for weeks_ago in [22, 16, 10, 4]:
        friday = _now_offset(weeks_ago * 7 + (4 - datetime.now(timezone.utc).weekday()) % 7, 16)
        # normalize to a Friday
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
            },
        ]

    # Pattern: New VPCs without PGA → SCC finding (x4)
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
            },
        ]

    # Pattern: AI inference endpoints → cost spike within 34 days (x3)
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
            },
        ]

    # Pattern: GKE memory pressure at 65% (x5)
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
        })

    # IAM role grants (x4)
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
        })

    # Narrative anchor events
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
        },
    ]

    return sorted(events, key=lambda e: e["timestamp"])


class MockAdapter(CloudAdapter):
    name = "mock"

    async def fetch_events(self, tenant_id: str) -> AsyncIterator[dict]:
        for event in _mock_events():
            yield event
