/* ------------------------------------------------------------------ */
/*  Intellicore CMP — FinOps seed data                                */
/*  Served by apiFetch() when no backend is configured.                */
/* ------------------------------------------------------------------ */

const data: Record<string, unknown> = {
  "/finops/monthly-trend": [
    { month: "Feb", cost: 480 },
    { month: "Mar", cost: 520 },
    { month: "Apr", cost: 510 },
    { month: "May", cost: 560 },
    { month: "Jun", cost: 590 },
    { month: "Jul", cost: 637 },
  ],

  "/finops/costs": [
    {
      name: "CloudOps",
      cost: 368,
      breakdown: "Compute $280, Networking $58, Storage $30",
      sparkData: [290, 310, 320, 340, 355, 368],
      sparkColor: "#3b82f6",
      memory:
        "Committed use discounts saved $67/mo on project A since applying in May. Compute costs stabilized after right-sizing in April.",
    },
    {
      name: "FinOps overhead",
      cost: 0,
      breakdown: "Platform cost absorbed in MRR",
      sparkData: [0, 0, 0, 0, 0, 0],
      sparkColor: "#94a3b8",
      memory: "No direct cost. FinOps tooling and analysis overhead is included in Searce managed services MRR.",
    },
    {
      name: "Cloud Security",
      cost: 42,
      breakdown: "SCC Premium, Wiz",
      sparkData: [40, 41, 42, 42, 42, 42],
      sparkColor: "#10b981",
      memory: "Stable, no anomalies. SCC Premium enabled since Feb. Wiz license fixed cost, renews in Q1.",
    },
    {
      name: "DevOps",
      cost: 86,
      breakdown: "Cloud Build, Artifact Registry, Functions",
      sparkData: [95, 98, 96, 94, 98, 86],
      sparkColor: "#8b5cf6",
      memory:
        "Switched to 2nd gen Functions in June, saved $12/mo on cold starts. Build minutes stable after caching improvements.",
    },
    {
      name: "AIOps",
      cost: 28,
      breakdown: "Vertex AI, BigQuery ML",
      sparkData: [18, 20, 22, 24, 25, 28],
      sparkColor: "#f59e0b",
      memory:
        "Active anomaly on BigQuery (see above). Vertex AI spend growing with increased model training runs. Review reserved slots by Q4.",
    },
  ],

  "/finops/optimizations": [
    {
      recommendation: "Committed use discount on Compute Engine",
      appliedDate: "May 12",
      savings: "$67/mo",
      status: "applied" as const,
      memory: "ROI breakeven reached in 3 weeks. 1-year CUD on n2-standard-8 for project-a production workloads.",
    },
    {
      recommendation: "Switch Cloud Functions to 2nd gen",
      appliedDate: "Jun 3",
      savings: "$12/mo",
      status: "applied" as const,
      memory:
        "Cold start p99 also improved 2.1s to 340ms. Migrated 14 functions across 3 services with zero downtime.",
    },
    {
      recommendation: "Delete 3 unattached persistent disks",
      appliedDate: "Jun 15",
      savings: "$18/mo",
      status: "applied" as const,
      memory:
        "Disks were orphaned after VM migration in May. 2x 200GB SSD + 1x 500GB standard. No snapshots referenced them.",
    },
    {
      recommendation: "Right-size clens-dev to e2-standard-4",
      appliedDate: "Jul 27",
      savings: "$8/mo",
      status: "applied" as const,
      memory:
        "Applied after CPU spike incident on Jul 25. Peak usage was only 22% on previous e2-standard-8. Downsized with zero performance impact.",
    },
    {
      recommendation: "Apply partition filter to BigQuery ETL",
      appliedDate: null,
      savings: "est. $42/mo",
      status: "pending" as const,
      memory:
        "Same fix resolved Jul 15 spike. Current ETL pipeline scans full 2TB table on each run. Adding partition filter would reduce scan to ~45GB.",
    },
    {
      recommendation: "Cloud SQL committed use discount",
      appliedDate: null,
      savings: "est. $22/mo",
      status: "available" as const,
      memory:
        "Requires 1-yr commitment, payback in 4 months. db-custom-4-16384 instance running 24/7 for 11 months. Usage pattern is stable.",
    },
    {
      recommendation: "Lifecycle policies on 14 Storage buckets",
      appliedDate: null,
      savings: "est. $12/mo",
      status: "available" as const,
      memory:
        "Standard class with <1 access/month identified for Nearline. 8 of 14 buckets are compliance-required hot storage (excluded). 6 eligible buckets total 1.8TB.",
    },
  ],

  "/finops/anomalies": [
    {
      title: "BigQuery cost spike: +340% in last 4 hours",
      severity: "active" as const,
      timeAgo: "4 hours ago",
      service: "BigQuery",
      extra: "$42 estimated overspend",
      memory:
        "This matches the ETL spike pattern from Jul 15 (30d ago). That incident cost $42 extra and was caused by an unoptimized JOIN on the 2TB analytics.events table. The query scanned the full table instead of using the _PARTITIONDATE filter. Resolution on Jul 15: Added partition filter and optimized JOIN, reducing scan from 2TB to 45GB. Processing time dropped from 8min to 22sec.",
      confidence: "88% same root cause",
      suggestedFix: "Apply same partition filter to current query pipeline. The offending query is in the nightly ETL DAG (airflow-prod/dags/etl_analytics.py, line 142).",
      timeline: [
        "Jul 30 02:00 — ETL DAG triggered (normal schedule)",
        "Jul 30 02:04 — BigQuery scan exceeded 1TB threshold",
        "Jul 30 02:12 — Cost anomaly detected by Intellicore",
        "Jul 30 02:15 — Pattern matched to Jul 15 incident (88% confidence)",
      ],
    },
    {
      title: "Compute Engine egress +85% WoW",
      severity: "resolved" as const,
      timeAgo: "5 days ago",
      service: "Compute Engine",
      extra: "Resolved in 2h",
      memory:
        "Cross-region replication job was running without compression between us-central1 and europe-west1. The backup sync for project-b was transferring ~180GB/day uncompressed. Resolution: Added gzip compression to the replication pipeline, reducing transfer to ~35GB/day. Egress normalized within 2 hours of applying the fix. Ongoing monitoring confirms stable egress since.",
      confidence: null,
      suggestedFix: null,
      timeline: [
        "Jul 25 08:00 — Egress anomaly detected (+85% vs 7-day avg)",
        "Jul 25 08:30 — Root cause identified: uncompressed cross-region replication",
        "Jul 25 09:15 — Compression applied to replication pipeline",
        "Jul 25 10:00 — Egress normalized, anomaly resolved",
      ],
    },
    {
      title: "Cloud Storage class mismatch",
      severity: "false-positive" as const,
      timeAgo: "14 days ago",
      service: "Cloud Storage",
      extra: "Partial action taken",
      memory:
        "Flagged 14 Standard class buckets with <1 access/month as candidates for Nearline. Analysis showed 8 of 14 are compliance-required hot storage (SOC2 audit logs, PCI transaction records) that must remain in Standard class per policy. Adjusted recommendation: 6 buckets moved to Nearline ($12/mo saved), 8 kept as Standard with documented justification. Updated detection rules to exclude compliance-tagged buckets.",
      confidence: null,
      suggestedFix: null,
      timeline: [
        "Jul 16 — 14 buckets flagged for storage class mismatch",
        "Jul 17 — Analysis revealed 8 compliance-required buckets",
        "Jul 18 — 6 eligible buckets moved to Nearline",
        "Jul 18 — Detection rules updated to exclude compliance tags",
      ],
    },
  ],

  "/finops/forecast": [
    {
      month: "Aug",
      cost: 680,
      note: "Assumes BigQuery anomaly resolved and partition filter applied. Compute stable with existing CUDs.",
    },
    {
      month: "Sep",
      cost: 650,
      note: "CUD savings fully amortized + Cloud SQL CUD applied. Functions optimization running full month.",
    },
    {
      month: "Oct",
      cost: 620,
      note: "All available recommendations applied. Storage lifecycle policies in effect for full billing cycle.",
    },
  ],

  "/finops/risk-factors": [
    "BigQuery usage trending +15% MoM from increased ML training data. May need reserved slots by Q4 if trend continues.",
    "Vertex AI spend growing with new model experiments. Current on-demand pricing acceptable below $50/mo, review if exceeded.",
    "Cloud SQL instance approaching 80% storage capacity. May need disk resize by Sep (one-time cost, no ongoing increase).",
  ],
};

export default data;
