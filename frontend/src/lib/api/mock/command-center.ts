/* ------------------------------------------------------------------ */
/*  Intellicore CMP — Command Center seed data                        */
/*  Keyed [tenantId][environmentId][endpoint] so the org switcher on   */
/*  Command Center (top-right) actually changes what renders. Each     */
/*  tenant's PRODUCTION story matches the customer demo script's       */
/*  "Needs Your Attention" spine; non-prod environments are quieter    */
/*  variants of the same institutional memory.                         */
/* ------------------------------------------------------------------ */

import { TENANTS } from "../../tenants";

interface Score {
  pillar: string;
  score: number | null;
  status: "healthy" | "warning" | "critical" | "active";
  note: string;
}

interface Attention {
  severity: "red" | "amber" | "blue";
  pillar: string;
  title: string;
  memory: string;
}

interface ChangeLine {
  pillar: string;
  detail: string;
}

interface MemoryPattern {
  pattern: string;
  firstSeen: string;
  occurrences: number;
  lastResolution: string;
  confidence: number;
}

interface CsreLine {
  label: string;
  value: string;
}

interface TenantProfile {
  scores: Score[];
  attention: Attention[];
  changes: ChangeLine[];
  patterns: MemoryPattern[];
  workingWell: string[];
  csre: CsreLine[];
  timeline: number[];
}

/* ── Quiet-down transform for non-production environments ──────────── */
/* Same institutional memory (patterns are tenant-wide), but day-to-day */
/* signal is calmer: fewer live attention items, healthier scores, a    */
/* flatter timeline — reflecting that non-prod simply sees less real    */
/* traffic and fewer customer-facing incidents.                        */
function quiet(prod: TenantProfile, envLabel: string): TenantProfile {
  return {
    scores: prod.scores.map((s) => ({
      ...s,
      score: s.score === null ? null : Math.min(99, s.score + 6),
      status: s.status === "critical" ? "warning" : s.status === "warning" ? "healthy" : s.status,
      note: s.status === "healthy" || s.status === "active" ? s.note : "",
    })),
    attention: prod.attention.slice(0, 1).map((a) => ({
      ...a,
      severity: a.severity === "red" ? "amber" : a.severity,
      title: `[${envLabel}] ${a.title}`,
    })),
    changes: prod.changes,
    patterns: prod.patterns,
    workingWell: [
      `${envLabel} mirrors production config — 0 drift findings this week`,
      ...prod.workingWell.slice(0, 2),
    ],
    csre: prod.csre,
    timeline: prod.timeline.map((v) => (v === 2 ? 1 : 0)),
  };
}

/* ── Netcore Cloud — Martech SaaS — FinOps hero ─────────────────────── */
const netcoreProd: TenantProfile = {
  scores: [
    { pillar: "CloudOps", score: 92, status: "healthy", note: "" },
    { pillar: "FinOps", score: 71, status: "warning", note: "BigQuery cost anomaly active" },
    { pillar: "Cloud Security", score: 91, status: "healthy", note: "" },
    { pillar: "DevOps", score: 95, status: "healthy", note: "" },
    { pillar: "AIOps", score: null, status: "active", note: "4 agents running" },
  ],
  attention: [
    {
      severity: "amber",
      pillar: "FinOps",
      title: "BigQuery cost spike +340% in last 4h",
      memory:
        "Matches the Jul 15 ETL spike pattern (unoptimized JOIN on a 2TB table). Root cause + fix already known — flagged in 12 min. Same fix cut $42/run last time.",
    },
    {
      severity: "amber",
      pillar: "CloudOps",
      title: "gke-prod-app node pool memory pressure at 88%",
      memory: "7 prior occurrences at ~65% of projected load. Right-size + load balance resolves in avg 8 min.",
    },
    {
      severity: "blue",
      pillar: "DevOps",
      title: "3 orchestration requests pending approval",
      memory: "Oldest: 40 min (Terraform apply — add BigQuery slot reservation, est. $220/mo, low risk).",
    },
  ],
  changes: [
    { pillar: "CloudOps", detail: "31 VMs stable, 2 GKE node pools auto-scaled (resolved in 6-9 min)" },
    { pillar: "FinOps", detail: "$1.14M current month spend, +12% MoM. BigQuery anomaly flagged." },
    { pillar: "Cloud Security", detail: "58 findings, 4 recurrences of resolved patterns. Posture score: 91." },
    { pillar: "DevOps", detail: "112 deployments, 1 rollback (Terraform state lock, resolved 3 min)." },
    { pillar: "AIOps", detail: "1,240 tokens used, 5 auto-remediations triggered, 4 successful." },
  ],
  patterns: [
    { pattern: "BigQuery ETL cost spike", firstSeen: "30d ago", occurrences: 3, lastResolution: "Query optimization + partition filter", confidence: 88 },
    { pattern: "GKE memory pressure at 65% of projection", firstSeen: "88d ago", occurrences: 7, lastResolution: "Right-size + load balance", confidence: 94 },
    { pattern: "Friday deployment → weekend P2", firstSeen: "154d ago", occurrences: 4, lastResolution: "Pre-deploy freeze after 4pm IST", confidence: 91 },
    { pattern: "New VPC without Private Google Access", firstSeen: "155d ago", occurrences: 4, lastResolution: "Enforce PGA in Terraform module", confidence: 82 },
  ],
  workingWell: [
    "29/31 VMs within thresholds for 30d",
    "Zero security findings on serverless workloads",
    "MTTR improved 19% vs last month (11 min avg)",
    "4 auto-remediations succeeded without human intervention",
  ],
  csre: [
    { label: "Last review", value: "2h ago by Searce CSRE" },
    { label: "Next scheduled review", value: "Tomorrow 10:00 AM IST" },
    { label: "Open tickets", value: "2 (1 cost optimization, 1 capacity planning)" },
    { label: "Recommendations applied this month", value: "9" },
    { label: "Estimated savings from recommendations", value: "$1,240/mo" },
  ],
  timeline: [0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1],
};

/* ── Aarti Industries — Chemicals/Pharma — Cloud Security hero ──────── */
const aartiProd: TenantProfile = {
  scores: [
    { pillar: "CloudOps", score: 94, status: "healthy", note: "" },
    { pillar: "FinOps", score: 90, status: "healthy", note: "" },
    { pillar: "Cloud Security", score: 78, status: "critical", note: "5 SSH-open groups, mid-audit" },
    { pillar: "DevOps", score: 93, status: "healthy", note: "" },
    { pillar: "AIOps", score: null, status: "active", note: "2 agents running" },
  ],
  attention: [
    {
      severity: "red",
      pillar: "Cloud Security",
      title: "5 security groups allow SSH from internet (CIS 5.2)",
      memory:
        "Identical finding auto-remediated across 3 Aarti accounts on Jul 12 → restrict to VPN CIDR. Auto-fix confidence 96%.",
    },
    {
      severity: "amber",
      pillar: "Cloud Security",
      title: "IAM Recommender flags 2 over-privileged service accounts",
      memory: "8 similar cases resolved with custom least-privilege roles. Avg time to resolve: 25 min.",
    },
  ],
  changes: [
    { pillar: "CloudOps", detail: "18 EC2 instances stable, all within compliance-mandated region (ap-south-1)." },
    { pillar: "FinOps", detail: "$22K current month spend, +3% MoM. No anomalies." },
    { pillar: "Cloud Security", detail: "43 findings, 12 recurrences of a known SSH pattern. Posture score: 78 (mid-audit)." },
    { pillar: "DevOps", detail: "22 deployments, 0 failures. Patch compliance: 91%." },
    { pillar: "AIOps", detail: "540 tokens used, 2 auto-remediations queued pending compliance sign-off." },
  ],
  patterns: [
    { pattern: "SSH security group creation", firstSeen: "60d ago", occurrences: 12, lastResolution: "Auto-remediation to VPN CIDR", confidence: 96 },
    { pattern: "Over-privileged service accounts on creation", firstSeen: "60d ago", occurrences: 8, lastResolution: "Custom least-privilege role", confidence: 82 },
    { pattern: "Compliance audit evidence requests", firstSeen: "21d ago", occurrences: 3, lastResolution: "Auto-attach CIS/SOC2 evidence to finding", confidence: 90 },
  ],
  workingWell: [
    "CIS Benchmark 89%, NIST 84%, ISO 27001 91% — all trending up",
    "Zero findings on production database tier for 45d",
    "All auto-fixes this quarter: 0 regressions",
    "Audit evidence auto-attached to every remediation (saves ~2h/finding for the audit team)",
  ],
  csre: [
    { label: "Last review", value: "1h ago by Searce CSRE" },
    { label: "Next scheduled review", value: "Today 4:00 PM IST" },
    { label: "Open tickets", value: "3 (all Cloud Security, audit-related)" },
    { label: "Recommendations applied this month", value: "11" },
    { label: "Estimated savings from recommendations", value: "$310/mo" },
  ],
  timeline: [0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0],
};

/* ── ShoppersStop — Retail/E-commerce — CloudOps hero ───────────────── */
const shopstopProd: TenantProfile = {
  scores: [
    { pillar: "CloudOps", score: 82, status: "warning", note: "egress anomaly ahead of sale" },
    { pillar: "FinOps", score: 88, status: "healthy", note: "" },
    { pillar: "Cloud Security", score: 92, status: "healthy", note: "" },
    { pillar: "DevOps", score: 90, status: "healthy", note: "" },
    { pillar: "AIOps", score: null, status: "active", note: "5 agents running" },
  ],
  attention: [
    {
      severity: "amber",
      pillar: "CloudOps",
      title: "checkout-service egress anomalous (3.3σ) ahead of sale",
      memory:
        "A similar 3.3σ egress on Jun 2 was a false positive (backup job). This signature differs — likely real. Flagged before the sale window.",
    },
    {
      severity: "blue",
      pillar: "DevOps",
      title: "Pre-sale load test scheduled — capacity guardrail check",
      memory: "Last Big Billion Days event: auto-scaled 6 min ahead of breach, zero downtime.",
    },
  ],
  changes: [
    { pillar: "CloudOps", detail: "64 VMs stable, checkout-service pool pre-scaled to 3x for sale window." },
    { pillar: "FinOps", detail: "$220K current month spend, +6% MoM ahead of sale traffic (incl. SAP HANA workloads)." },
    { pillar: "Cloud Security", detail: "29 findings, all low severity. Posture score: 92." },
    { pillar: "DevOps", detail: "38 deployments, 0 failures. Deploy freeze begins 48h before sale." },
    { pillar: "AIOps", detail: "2,100 tokens used, predictive scaling agent active on 5 services." },
  ],
  patterns: [
    { pattern: "Egress anomaly ahead of sale events", firstSeen: "60d ago", occurrences: 2, lastResolution: "Distinguish backup-job baseline vs real signal", confidence: 78 },
    { pattern: "CPU breach predicted at peak traffic", firstSeen: "45d ago", occurrences: 6, lastResolution: "Auto-scale 6 min ahead of projected breach", confidence: 94 },
    { pattern: "Bastion-host egress false positive (backup job)", firstSeen: "58d ago", occurrences: 1, lastResolution: "Exclude backup CIDR from anomaly baseline", confidence: 72 },
  ],
  workingWell: [
    "Predictive scaling running on checkout + cart services",
    "Zero downtime through last 3 sale events",
    "MTTR improved 22% vs last quarter (13 min avg)",
    "Auto-scaling saved an estimated 4 manual pages last sale window",
  ],
  csre: [
    { label: "Last review", value: "30 min ago by Searce CSRE" },
    { label: "Next scheduled review", value: "Today 6:00 PM IST (pre-sale check)" },
    { label: "Open tickets", value: "1 (egress anomaly, investigating)" },
    { label: "Recommendations applied this month", value: "6" },
    { label: "Estimated savings from recommendations", value: "$540/mo" },
  ],
  timeline: [0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0],
};

/* ── DesignX — Design SaaS — DevOps hero ────────────────────────────── */
const designxProd: TenantProfile = {
  scores: [
    { pillar: "CloudOps", score: 96, status: "healthy", note: "" },
    { pillar: "FinOps", score: 93, status: "healthy", note: "" },
    { pillar: "Cloud Security", score: 90, status: "healthy", note: "" },
    { pillar: "DevOps", score: 85, status: "warning", note: "risky IAM change caught pre-deploy" },
    { pillar: "AIOps", score: null, status: "active", note: "2 agents running" },
  ],
  attention: [
    {
      severity: "blue",
      pillar: "DevOps",
      title: "deploy-bot granted project Editor (risky IAM change)",
      memory:
        "On May 9 an Editor grant to a CI bot led to a privilege-escalation finding. Pre-deploy guardrail flagged this change and suggested a least-privilege role before it shipped.",
    },
  ],
  changes: [
    { pillar: "CloudOps", detail: "12 VMs stable, all serverless-first workloads within thresholds." },
    { pillar: "FinOps", detail: "$10K current month spend, flat MoM." },
    { pillar: "Cloud Security", detail: "9 findings, all low. Posture score: 90." },
    { pillar: "DevOps", detail: "64 deployments, 1 guardrail block (risky IAM grant, awaiting least-privilege fix)." },
    { pillar: "AIOps", detail: "310 tokens used, 1 guardrail suggestion generated." },
  ],
  patterns: [
    { pattern: "CI bot granted Editor/Owner on provision", firstSeen: "85d ago", occurrences: 3, lastResolution: "Pre-deploy guardrail suggests least-privilege role", confidence: 87 },
    { pattern: "Cloud Run deployments succeed", firstSeen: "90d ago", occurrences: 28, lastResolution: "n/a — 0% failure rate", confidence: 97 },
  ],
  workingWell: [
    "28 consecutive Cloud Run deployments with 0 failures",
    "Guardrail has blocked 3 risky IAM grants before they shipped this quarter",
    "Average rollback time: 4 min when needed",
    "Terraform applies succeed 94% of the time",
  ],
  csre: [
    { label: "Last review", value: "3h ago by Searce CSRE" },
    { label: "Next scheduled review", value: "Thu 11:00 AM IST" },
    { label: "Open tickets", value: "1 (IAM guardrail follow-up)" },
    { label: "Recommendations applied this month", value: "4" },
    { label: "Estimated savings from recommendations", value: "$60/mo" },
  ],
  timeline: [0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
};

/* ── Dmart — Retail/E-commerce — CloudOps / Kubernetes hero ─────────── */
const dmartProd: TenantProfile = {
  scores: [
    { pillar: "CloudOps", score: 84, status: "warning", note: "checkout pods OOMKilled during flash sale" },
    { pillar: "FinOps", score: 90, status: "healthy", note: "" },
    { pillar: "Cloud Security", score: 92, status: "healthy", note: "" },
    { pillar: "DevOps", score: 93, status: "healthy", note: "" },
    { pillar: "AIOps", score: null, status: "active", note: "4 agents running" },
  ],
  attention: [
    {
      severity: "amber",
      pillar: "CloudOps",
      title: "hcl-commerce-checkout pods OOMKilled during flash-sale traffic",
      memory:
        "3rd time this pattern has occurred in 70 days. JVM heap exceeds the pod's 2Gi memory limit under flash-sale load. Same fix (raise memory limit + tune -Xmx) resolved it in under 10 min last time.",
    },
    {
      severity: "blue",
      pillar: "DevOps",
      title: "Helm rollout to hcl-commerce-catalog pending approval",
      memory: "Last 4 rollouts to this service were zero-downtime canary deploys.",
    },
  ],
  changes: [
    { pillar: "CloudOps", detail: "GKE node pool auto-scaled 3x for flash-sale traffic; 2 checkout pods restarted after OOMKill." },
    { pillar: "FinOps", detail: "$70.4K current month spend, +3% MoM. Node pool scale-down automation saved $860 last cycle." },
    { pillar: "Cloud Security", detail: "6 findings, all low severity. Posture score: 92." },
    { pillar: "DevOps", detail: "41 deployments this week, 1 Helm chart rollback on hcl-commerce-search (resolved 6 min)." },
    { pillar: "AIOps", detail: "620 tokens used, predictive HPA agent active on 4 commerce services." },
  ],
  patterns: [
    { pattern: "hcl-commerce-checkout OOMKilled under flash-sale load", firstSeen: "70d ago", occurrences: 3, lastResolution: "Raised pod memory limit + tuned JVM -Xmx", confidence: 91 },
    { pattern: "Node pool over-provisioned after sale window", firstSeen: "55d ago", occurrences: 2, lastResolution: "Auto scale-down 48h post-sale", confidence: 88 },
  ],
  workingWell: [
    "Predictive HPA scaling active on checkout, catalog, search, and orders services",
    "Zero downtime through the last 3 flash-sale events",
    "Post-sale node pool scale-down saved $860/mo automatically",
    "40+ GKE deploys/week with 0% rollback rate outside the 1 Helm chart issue",
  ],
  csre: [
    { label: "Last review", value: "1h ago by Searce CSRE" },
    { label: "Next scheduled review", value: "Tomorrow 11:00 AM IST" },
    { label: "Open tickets", value: "1 (OOMKill pattern, permanent memory-limit fix in review)" },
    { label: "Recommendations applied this month", value: "6" },
    { label: "Estimated savings from recommendations", value: "$860/mo" },
  ],
  timeline: [0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0],
};

const PROD_PROFILES: Record<string, TenantProfile> = {
  netcore: netcoreProd,
  aarti: aartiProd,
  shopstop: shopstopProd,
  designx: designxProd,
  dmart: dmartProd,
};

function toEndpoints(p: TenantProfile) {
  return {
    "/command-center/scores": p.scores,
    "/command-center/attention": p.attention,
    "/command-center/changes": p.changes,
    "/command-center/memory-patterns": p.patterns,
    "/command-center/working-well": p.workingWell,
    "/command-center/csre-activity": p.csre,
    "/command-center/timeline": p.timeline,
  };
}

const data: Record<string, Record<string, Record<string, unknown>>> = {};

for (const tenant of TENANTS) {
  const prod = PROD_PROFILES[tenant.id];
  data[tenant.id] = {};
  tenant.environments.forEach((env) => {
    const profile = env.id === "production" ? prod : quiet(prod, env.label);
    data[tenant.id][env.id] = toEndpoints(profile);
  });
}

export default data;
