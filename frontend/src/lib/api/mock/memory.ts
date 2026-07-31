/* ------------------------------------------------------------------ */
/*  Intellicore CMP — Memory seed data                                */
/*  Served by apiFetch() when no backend is configured.  Keyed by the  */
/*  endpoint path each page requests via useApiData().                 */
/* ------------------------------------------------------------------ */

const data: Record<string, unknown> = {
  "/memory/entries": [
    {
      id: 1,
      daysAgo: "3d ago",
      pillar: "CloudOps",
      confidence: 94,
      title: "CPU spike recovery pattern",
      context:
        "clens-dev hit 95% CPU sustained. Auto-scaled to e2-standard-4 and added load balancing.",
      learning:
        "Sustained CPU > 85% for 5min triggers auto-scale. Recovery time: 8 min.",
      applied: 7,
    },
    {
      id: 2,
      daysAgo: "5d ago",
      pillar: "FinOps",
      confidence: 88,
      title: "BigQuery ETL cost spike",
      context:
        "Scheduled ETL pipeline scanned 2TB due to missing partition filter.",
      learning:
        "Always validate partition filters after pipeline changes. Cost impact: $42 per occurrence.",
      applied: 3,
    },
    {
      id: 3,
      daysAgo: "7d ago",
      pillar: "CloudOps",
      confidence: 82,
      title: "Database connection pool exhaustion",
      context:
        "pgsql hit max connections (100). Application threw connection timeout errors.",
      learning:
        "Monitor active connections. Pool size 200 with connection leak detection prevents recurrence.",
      applied: 2,
    },
    {
      id: 4,
      daysAgo: "14d ago",
      pillar: "CloudOps",
      confidence: 91,
      title: "Serverless cold start mitigation",
      context:
        "process-orders function p99 latency exceeded 2s during traffic burst.",
      learning:
        "Min instances = 3 with 512MB memory eliminates cold start issue. Cost increase: $4/mo.",
      applied: 1,
    },
    {
      id: 5,
      daysAgo: "21d ago",
      pillar: "CloudOps",
      confidence: 72,
      title: "Network egress false positive",
      context:
        "Bastion-host egress anomaly (3.3σ from baseline). Investigation showed legitimate backup job.",
      learning:
        "Backup jobs to cross-region storage trigger egress alerts. Exclude backup CIDR from anomaly detection.",
      applied: 1,
    },
    {
      id: 6,
      daysAgo: "27d ago",
      pillar: "SecOps",
      confidence: 96,
      title: "SSH security group remediation",
      context:
        "Security group allowing SSH from 0.0.0.0/0 detected. Restricted to VPN CIDR 10.0.0.0/8.",
      learning:
        "Auto-remediable with 96% confidence. Average fix time: 2 min. Zero regressions across 12 applications.",
      applied: 12,
    },
    {
      id: 7,
      daysAgo: "30d ago",
      pillar: "FinOps",
      confidence: 94,
      title: "Committed use discount opportunity",
      context:
        "Compute Engine instances running 24/7 for 6+ months identified.",
      learning:
        "CUD provides 30-40% savings for stable workloads. ROI breakeven: 3 weeks.",
      applied: 1,
    },
    {
      id: 8,
      daysAgo: "45d ago",
      pillar: "DevOps",
      confidence: 91,
      title: "Friday deployment risk",
      context:
        "5 deployment failures occurred on Fridays in 90-day period vs 2 on other weekdays.",
      learning:
        "Fridays have 23% higher failure rate. Recommend deployment freeze after 3 PM Friday.",
      applied: 0,
      appliedNote: "advisory",
    },
    {
      id: 9,
      daysAgo: "60d ago",
      pillar: "SecOps",
      confidence: 82,
      title: "Over-privileged service account pattern",
      context:
        "Service accounts created with Editor/Owner roles as default.",
      learning:
        "Custom roles with least-privilege reduce security findings by 60%. Avg creation time: 25 min.",
      applied: 8,
    },
    {
      id: 10,
      daysAgo: "90d ago",
      pillar: "DevOps",
      confidence: 85,
      title: "Terraform state lock conflict",
      context:
        "Concurrent terraform applies caused state lock conflicts 3 times.",
      learning:
        "Enforce serial applies per workspace. Add pre-apply state lock check to CI pipeline.",
      applied: 3,
    },
  ],

  "/memory/patterns": [
    {
      name: "SSH from Internet",
      occurrences: 12,
      autoResolved: 100,
      avgTime: "2 min",
      trend: "Improving",
      bars: [1, 2, 3, 2, 1, 3],
    },
    {
      name: "CPU Spike → Auto-scale",
      occurrences: 7,
      autoResolved: 100,
      avgTime: "8 min",
      trend: "Stable",
      bars: [1, 1, 2, 1, 1, 1],
    },
    {
      name: "Cost Spike (BigQuery)",
      occurrences: 3,
      autoResolved: 67,
      avgTime: "22 min",
      trend: "New",
      bars: [0, 0, 1, 0, 1, 1],
    },
    {
      name: "Connection Pool Exhaustion",
      occurrences: 2,
      autoResolved: 50,
      avgTime: "18 min",
      trend: "New",
      bars: [0, 0, 0, 0, 1, 1],
    },
    {
      name: "Friday Deploy Failures",
      occurrences: 5,
      autoResolved: 0,
      avgTime: "advisory only",
      trend: "Stable",
      bars: [1, 0, 1, 1, 1, 1],
    },
  ],

  "/memory/remediation-library": [
    {
      fix: "Restrict SSH to VPN CIDR",
      confidence: 96,
      timesApplied: 12,
      successRate: "100%",
      lastApplied: "2h ago",
      pillar: "SecOps",
    },
    {
      fix: "Block S3 Public Access",
      confidence: 94,
      timesApplied: 5,
      successRate: "100%",
      lastApplied: "7d ago",
      pillar: "SecOps",
    },
    {
      fix: "Auto-scale VM on CPU spike",
      confidence: 94,
      timesApplied: 7,
      successRate: "100%",
      lastApplied: "3d ago",
      pillar: "CloudOps",
    },
    {
      fix: "Increase connection pool",
      confidence: 82,
      timesApplied: 2,
      successRate: "100%",
      lastApplied: "7d ago",
      pillar: "CloudOps",
    },
    {
      fix: "Apply BigQuery partition filter",
      confidence: 88,
      timesApplied: 2,
      successRate: "100%",
      lastApplied: "30d ago",
      pillar: "FinOps",
    },
    {
      fix: "Disable inactive IAM users",
      confidence: 90,
      timesApplied: 4,
      successRate: "100%",
      lastApplied: "1d ago",
      pillar: "SecOps",
    },
    {
      fix: "Set min instances on Functions",
      confidence: 91,
      timesApplied: 1,
      successRate: "100%",
      lastApplied: "14d ago",
      pillar: "CloudOps",
    },
  ],

  "/memory/learnings": [
    {
      insight:
        "IAM changes correlate with 40% of security findings within 48h",
      crossPillar: "DevOps × SecOps",
    },
    {
      insight:
        "Cost optimizations that also improve performance have 100% adoption rate",
      crossPillar: "FinOps × CloudOps",
    },
    {
      insight:
        "Auto-remediation with >90% confidence has 100% success rate — zero regressions",
      crossPillar: "AIOps × all",
    },
    {
      insight:
        "The 3 most impactful actions this quarter: CUD ($67/mo saved), SSH auto-fix (12 incidents prevented), BigQuery optimization ($42/incident saved)",
      crossPillar: "cross-pillar",
    },
    {
      insight:
        "MTTR improves by average 22% on second occurrence of any pattern",
      crossPillar: "meta-learning",
    },
  ],
};

export default data;
