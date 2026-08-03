/* ------------------------------------------------------------------ */
/*  Intellicore CMP — Memory seed data                                 */
/*  Keyed [tenantId][environmentId][endpoint]. Memory is institutional  */
/*  knowledge that belongs to the customer, not a single environment —  */
/*  so every environment for a tenant sees the same Memory graph,       */
/*  matching the product story ("when an engineer rolls off, none of    */
/*  this is lost").                                                     */
/* ------------------------------------------------------------------ */

import { TENANTS } from "../../tenants";

interface MemoryEntry {
  id: number;
  daysAgo: string;
  pillar: string;
  confidence: number;
  title: string;
  context: string;
  learning: string;
  applied: number;
  appliedNote?: string;
}

interface PatternRow {
  name: string;
  occurrences: number;
  autoResolved: number;
  avgTime: string;
  trend: string;
  bars: number[];
}

interface RemediationRow {
  fix: string;
  confidence: number;
  timesApplied: number;
  successRate: string;
  lastApplied: string;
  pillar: string;
}

interface LearningRow {
  insight: string;
  crossPillar: string;
}

interface TenantMemory {
  entries: MemoryEntry[];
  patterns: PatternRow[];
  remediationLibrary: RemediationRow[];
  learnings: LearningRow[];
}

const TENANT_MEMORY: Record<string, TenantMemory> = {
  netcore: {
    entries: [
      {
        id: 1, daysAgo: "5h ago", pillar: "FinOps", confidence: 88,
        title: "BigQuery ETL cost spike",
        context: "Scheduled ETL pipeline scanned 2TB due to missing partition filter — 3rd time this quarter.",
        learning: "Always validate partition filters after pipeline changes. Cost impact: $42 per occurrence.",
        applied: 3,
      },
      {
        id: 2, daysAgo: "3d ago", pillar: "CloudOps", confidence: 94,
        title: "GKE memory pressure recovery pattern",
        context: "gke-prod-app hit >90% mem at 65% of projected load, 7th occurrence.",
        learning: "Right-size node pool to 65th percentile baseline instead of peak. Recovery time: 8 min.",
        applied: 7,
      },
      {
        id: 3, daysAgo: "22d ago", pillar: "DevOps", confidence: 91,
        title: "Friday deployment risk",
        context: "4 deployments on Fridays led to weekend P2 incidents within 72h.",
        learning: "Adopt a Friday deploy freeze after 4pm IST. 3 incidents/quarter avoided.",
        applied: 0,
        appliedNote: "advisory",
      },
      {
        id: 4, daysAgo: "45d ago", pillar: "Cloud Security", confidence: 82,
        title: "New VPC without Private Google Access",
        context: "4 of last 6 VPCs created without PGA led to an SCC finding within 45 days.",
        learning: "Enforce PGA in the VPC Terraform module by default.",
        applied: 4,
      },
    ],
    patterns: [
      { name: "BigQuery ETL Cost Spike", occurrences: 3, autoResolved: 67, avgTime: "22 min", trend: "New", bars: [0, 0, 1, 0, 1, 1] },
      { name: "GKE Memory Pressure", occurrences: 7, autoResolved: 100, avgTime: "8 min", trend: "Stable", bars: [1, 1, 2, 1, 1, 1] },
      { name: "Friday Deploy → Weekend P2", occurrences: 4, autoResolved: 0, avgTime: "advisory only", trend: "Stable", bars: [1, 0, 1, 1, 0, 1] },
      { name: "VPC Without PGA", occurrences: 4, autoResolved: 50, avgTime: "flagged, manual fix", trend: "Improving", bars: [1, 1, 0, 1, 0, 0] },
    ],
    remediationLibrary: [
      { fix: "Apply BigQuery partition filter", confidence: 88, timesApplied: 3, successRate: "100%", lastApplied: "5h ago", pillar: "FinOps" },
      { fix: "Right-size GKE node pool to 65th percentile", confidence: 94, timesApplied: 7, successRate: "100%", lastApplied: "3d ago", pillar: "CloudOps" },
      { fix: "Enforce PGA on new VPCs", confidence: 82, timesApplied: 4, successRate: "75%", lastApplied: "32d ago", pillar: "Cloud Security" },
    ],
    learnings: [
      { insight: "Cost anomalies matched to a known pattern are flagged in an average of 12 minutes vs. hours for a first occurrence.", crossPillar: "FinOps × AIOps" },
      { insight: "GKE clusters hit memory pressure consistently at ~65% of projected load — capacity plans should use this, not peak.", crossPillar: "CloudOps × FinOps" },
      { insight: "IAM changes correlate with 40% of security findings within 48h.", crossPillar: "DevOps × Cloud Security" },
    ],
  },

  aarti: {
    entries: [
      {
        id: 1, daysAgo: "2d ago", pillar: "Cloud Security", confidence: 96,
        title: "SSH security group remediation",
        context: "Security group allowing SSH from 0.0.0.0/0 detected on 3 Aarti accounts. Restricted to VPN CIDR 10.0.0.0/8.",
        learning: "Auto-remediable with 96% confidence. Average fix time: 2 min. Zero regressions across 12 applications.",
        applied: 12,
      },
      {
        id: 2, daysAgo: "18d ago", pillar: "Cloud Security", confidence: 82,
        title: "Over-privileged service account pattern",
        context: "Service accounts created with Editor/Owner roles as default across 2 projects.",
        learning: "Custom roles with least-privilege reduce security findings by 60%. Avg creation time: 25 min.",
        applied: 8,
      },
      {
        id: 3, daysAgo: "21d ago", pillar: "Cloud Security", confidence: 90,
        title: "Compliance evidence auto-attach",
        context: "Auditor requested remediation evidence for 3 CIS findings during Q3 audit prep.",
        learning: "Auto-attaching CIS/SOC2/ISO evidence to every remediation saves ~2h/finding during audits.",
        applied: 3,
      },
    ],
    patterns: [
      { name: "SSH from Internet", occurrences: 12, autoResolved: 100, avgTime: "2 min", trend: "Improving", bars: [1, 2, 3, 2, 1, 3] },
      { name: "Over-Privileged Service Accounts", occurrences: 8, autoResolved: 100, avgTime: "25 min", trend: "Stable", bars: [1, 1, 2, 1, 2, 1] },
      { name: "Compliance Evidence Requests", occurrences: 3, autoResolved: 100, avgTime: "instant", trend: "New", bars: [0, 0, 1, 1, 1, 0] },
    ],
    remediationLibrary: [
      { fix: "Restrict SSH to VPN CIDR", confidence: 96, timesApplied: 12, successRate: "100%", lastApplied: "2d ago", pillar: "Cloud Security" },
      { fix: "Create least-privilege custom IAM role", confidence: 82, timesApplied: 8, successRate: "100%", lastApplied: "18d ago", pillar: "Cloud Security" },
      { fix: "Auto-attach compliance evidence to finding", confidence: 90, timesApplied: 3, successRate: "100%", lastApplied: "21d ago", pillar: "Cloud Security" },
    ],
    learnings: [
      { insight: "Auto-remediation with >90% confidence has 100% success rate across all 3 Aarti accounts — zero regressions.", crossPillar: "AIOps × Cloud Security" },
      { insight: "Audit-window findings resolve 3x faster when evidence is auto-attached at remediation time, not requested after.", crossPillar: "Cloud Security × Compliance" },
    ],
  },

  shopstop: {
    entries: [
      {
        id: 1, daysAgo: "21d ago", pillar: "CloudOps", confidence: 72,
        title: "Network egress false positive",
        context: "Bastion-host egress anomaly (3.3σ from baseline) on Jun 2. Investigation showed legitimate backup job.",
        learning: "Backup jobs to cross-region storage trigger egress alerts. Exclude backup CIDR from anomaly detection.",
        applied: 1,
      },
      {
        id: 2, daysAgo: "45d ago", pillar: "AIOps", confidence: 94,
        title: "CPU spike recovery pattern",
        context: "checkout-service predicted to breach CPU threshold at peak traffic — 6th occurrence.",
        learning: "Auto-scale 6 minutes ahead of the projected breach using load-trend extrapolation. Zero downtime across all 6 events.",
        applied: 6,
      },
      {
        id: 3, daysAgo: "4h ago", pillar: "CloudOps", confidence: 78,
        title: "Egress signature differs from known false positive",
        context: "New 3.3σ egress ahead of a sale window — signature differs from the Jun 2 backup-job baseline.",
        learning: "When a repeated statistical signal doesn't match its known baseline shape, treat as likely real rather than auto-suppressing.",
        applied: 0,
        appliedNote: "under investigation",
      },
    ],
    patterns: [
      { name: "CPU Spike → Auto-scale", occurrences: 6, autoResolved: 100, avgTime: "6 min ahead of breach", trend: "Stable", bars: [1, 1, 2, 1, 1, 1] },
      { name: "Egress Anomaly (backup job false positive)", occurrences: 1, autoResolved: 100, avgTime: "4 min", trend: "New", bars: [0, 0, 0, 0, 0, 1] },
      { name: "Egress Anomaly (real, differs from baseline)", occurrences: 1, autoResolved: 0, avgTime: "investigating", trend: "New", bars: [0, 0, 0, 0, 0, 1] },
    ],
    remediationLibrary: [
      { fix: "Predictive auto-scale ahead of CPU breach", confidence: 94, timesApplied: 6, successRate: "100%", lastApplied: "45d ago", pillar: "AIOps" },
      { fix: "Exclude backup CIDR from egress anomaly baseline", confidence: 72, timesApplied: 1, successRate: "100%", lastApplied: "21d ago", pillar: "CloudOps" },
    ],
    learnings: [
      { insight: "The same 3.3σ statistical threshold produced both a false positive (Jun 2, backup job) and a likely-real signal (this week) — Memory distinguishes by signature shape, not just magnitude.", crossPillar: "CloudOps × AIOps" },
      { insight: "Predictive scaling ahead of peak-sale traffic has a 100% success rate across 6 events with zero downtime.", crossPillar: "AIOps × CloudOps" },
    ],
  },

  designx: {
    entries: [
      {
        id: 1, daysAgo: "12d ago", pillar: "DevOps", confidence: 87,
        title: "CI bot IAM guardrail",
        context: "On May 9 an Editor grant to a CI bot led to a privilege-escalation finding.",
        learning: "Pre-deploy guardrail now flags Editor/Owner grants to service accounts and suggests a least-privilege role before the change ships.",
        applied: 3,
      },
      {
        id: 2, daysAgo: "60d ago", pillar: "DevOps", confidence: 97,
        title: "Cloud Run zero-failure streak",
        context: "28 consecutive Cloud Run deployments with zero rollbacks.",
        learning: "Canary + automated smoke tests before full rollout is the highest-leverage guardrail for this workload shape.",
        applied: 28,
      },
    ],
    patterns: [
      { name: "CI Bot Over-Grant on Provision", occurrences: 3, autoResolved: 100, avgTime: "pre-deploy block", trend: "Improving", bars: [1, 0, 1, 0, 1, 0] },
      { name: "Cloud Run Deploy Success", occurrences: 28, autoResolved: 100, avgTime: "n/a", trend: "Stable", bars: [1, 1, 1, 1, 1, 1] },
    ],
    remediationLibrary: [
      { fix: "Suggest least-privilege role instead of Editor/Owner", confidence: 87, timesApplied: 3, successRate: "100%", lastApplied: "12d ago", pillar: "DevOps" },
    ],
    learnings: [
      { insight: "A single incident (May 9 privilege escalation) became a standing pre-deploy guardrail — the platform learned once and now prevents the repeat.", crossPillar: "DevOps × Cloud Security" },
    ],
  },

  paynimbus: {
    entries: [
      {
        id: 1, daysAgo: "6h ago", pillar: "Cloud Security", confidence: 90,
        title: "Stale admin key rotation",
        context: "Admin access key unused for 94 days — 3rd occurrence across 2 fintech accounts.",
        learning: "Rotate + scope down, with PCI-DSS evidence auto-attached to the remediation record.",
        applied: 3,
      },
      {
        id: 2, daysAgo: "94d ago", pillar: "Cloud Security", confidence: 100,
        title: "PCI-DSS evidence auto-attach",
        context: "Quarterly PCI evidence package required manual collection in past cycles.",
        learning: "Every remediation now auto-attaches its own evidence — zero manual collection needed for the audit package.",
        applied: 4,
      },
    ],
    patterns: [
      { name: "Stale Admin Keys (90+ days)", occurrences: 3, autoResolved: 100, avgTime: "24h SLA", trend: "Stable", bars: [1, 0, 1, 0, 1, 1] },
      { name: "PCI Evidence Auto-Attach", occurrences: 4, autoResolved: 100, avgTime: "instant", trend: "Improving", bars: [1, 1, 1, 1, 1, 1] },
    ],
    remediationLibrary: [
      { fix: "Rotate + scope-down stale admin key", confidence: 90, timesApplied: 3, successRate: "100%", lastApplied: "6h ago", pillar: "Cloud Security" },
      { fix: "Auto-attach PCI-DSS evidence to remediation", confidence: 100, timesApplied: 4, successRate: "100%", lastApplied: "94d ago", pillar: "Cloud Security" },
    ],
    learnings: [
      { insight: "For a payments company, a stale admin key is an audit finding waiting to happen — Memory carries the fintech-specific remediation and attaches PCI evidence automatically.", crossPillar: "Cloud Security × Compliance" },
    ],
  },
};

const data: Record<string, Record<string, Record<string, unknown>>> = {};

for (const tenant of TENANTS) {
  const mem = TENANT_MEMORY[tenant.id];
  data[tenant.id] = {};
  const endpoints = {
    "/memory/entries": mem.entries,
    "/memory/patterns": mem.patterns,
    "/memory/remediation-library": mem.remediationLibrary,
    "/memory/learnings": mem.learnings,
  };
  tenant.environments.forEach((env) => {
    data[tenant.id][env.id] = endpoints;
  });
}

export default data;
