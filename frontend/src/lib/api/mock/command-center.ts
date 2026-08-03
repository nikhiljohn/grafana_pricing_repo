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
    { pillar: "SecOps", score: 91, status: "healthy", note: "" },
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
    { pillar: "SecOps", detail: "58 findings, 4 recurrences of resolved patterns. Posture score: 91." },
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
    { pillar: "SecOps", score: 78, status: "critical", note: "5 SSH-open groups, mid-audit" },
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
    { pillar: "CloudOps", detail: "18 VMs stable, all within compliance-mandated regions (asia-south1)." },
    { pillar: "FinOps", detail: "$186K current month spend, +3% MoM. No anomalies." },
    { pillar: "SecOps", detail: "43 findings, 12 recurrences of a known SSH pattern. Posture score: 78 (mid-audit)." },
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
    { pillar: "SecOps", score: 92, status: "healthy", note: "" },
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
    { pillar: "FinOps", detail: "$412K current month spend, +6% MoM ahead of sale traffic." },
    { pillar: "SecOps", detail: "29 findings, all low severity. Posture score: 92." },
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
    { pillar: "SecOps", score: 90, status: "healthy", note: "" },
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
    { pillar: "FinOps", detail: "$34K current month spend, flat MoM." },
    { pillar: "SecOps", detail: "9 findings, all low. Posture score: 90." },
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

/* ── PayNimbus — Fintech/Payments — Cloud Security / IAM hero ──────── */
const paynimbusProd: TenantProfile = {
  scores: [
    { pillar: "CloudOps", score: 93, status: "healthy", note: "" },
    { pillar: "FinOps", score: 91, status: "healthy", note: "" },
    { pillar: "SecOps", score: 80, status: "warning", note: "stale admin key, PCI evidence attached" },
    { pillar: "DevOps", score: 94, status: "healthy", note: "" },
    { pillar: "AIOps", score: null, status: "active", note: "3 agents running" },
  ],
  attention: [
    {
      severity: "amber",
      pillar: "Cloud Security",
      title: "Admin access key unused for 94 days",
      memory:
        "Prior key-rotation remediation on 2 fintech accounts. Rotate + scope-down; PCI-DSS evidence auto-attached.",
    },
    {
      severity: "blue",
      pillar: "SecOps",
      title: "Quarterly PCI-DSS evidence package due in 5 days",
      memory: "Last cycle: 100% of remediations auto-attached evidence, zero manual collection needed.",
    },
  ],
  changes: [
    { pillar: "CloudOps", detail: "26 VMs stable across AWS + GCP. All payment-tier resources isolated per PCI scope." },
    { pillar: "FinOps", detail: "$248K current month spend, +2% MoM." },
    { pillar: "SecOps", detail: "17 findings, all tied to key rotation policy. Posture score: 80." },
    { pillar: "DevOps", detail: "19 deployments, 0 failures. Change freeze in effect for PCI window." },
    { pillar: "AIOps", detail: "780 tokens used, 1 auto-remediation queued (key rotation, awaiting approval)." },
  ],
  patterns: [
    { pattern: "Admin keys unused 90+ days", firstSeen: "94d ago", occurrences: 2, lastResolution: "Rotate + scope-down, auto-attach PCI-DSS evidence", confidence: 90 },
    { pattern: "Quarterly PCI evidence collection", firstSeen: "94d ago", occurrences: 4, lastResolution: "Auto-attached from remediation history", confidence: 100 },
  ],
  workingWell: [
    "100% of remediations this quarter shipped with PCI-DSS evidence attached",
    "Zero findings on the payment-processing tier for 60d",
    "All admin key rotations completed within SLA (24h)",
    "Change freeze compliance: 100% during PCI review windows",
  ],
  csre: [
    { label: "Last review", value: "45 min ago by Searce CSRE" },
    { label: "Next scheduled review", value: "Tomorrow 9:00 AM IST" },
    { label: "Open tickets", value: "2 (key rotation, PCI evidence package)" },
    { label: "Recommendations applied this month", value: "5" },
    { label: "Estimated savings from recommendations", value: "$180/mo" },
  ],
  timeline: [0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0],
};

const PROD_PROFILES: Record<string, TenantProfile> = {
  netcore: netcoreProd,
  aarti: aartiProd,
  shopstop: shopstopProd,
  designx: designxProd,
  paynimbus: paynimbusProd,
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
