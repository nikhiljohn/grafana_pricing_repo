/* ------------------------------------------------------------------ */
/*  Intellicore CMP — FinOps seed data                                 */
/*  Keyed [tenantId][environmentId][endpoint]. One rich production      */
/*  profile per tenant, scaled down for non-prod environments.          */
/* ------------------------------------------------------------------ */

import { TENANTS } from "../../tenants";
import { buildTenantEnvShell, envFactor } from "./_env";

interface MonthlyTrend { month: string; cost: number; }
interface PillarCost { name: string; cost: number; breakdown: string; sparkData: number[]; sparkColor: string; memory: string; }
interface Optimization { recommendation: string; appliedDate: string | null; savings: string; status: "applied" | "pending" | "available"; memory: string; }
interface Anomaly {
  title: string; severity: "active" | "resolved" | "false-positive"; timeAgo: string; service: string;
  extra: string; memory: string; confidence: string | null; suggestedFix: string | null; timeline: string[];
}
interface Forecast { month: string; cost: number; note: string; }

interface FinOpsProfile {
  monthlyTrend: MonthlyTrend[];
  costs: PillarCost[];
  optimizations: Optimization[];
  anomalies: Anomaly[];
  forecast: Forecast[];
  riskFactors: string[];
}

const PROFILES: Record<string, FinOpsProfile> = {
  netcore: {
    monthlyTrend: [
      { month: "Feb", cost: 920000 }, { month: "Mar", cost: 968000 }, { month: "Apr", cost: 1010000 },
      { month: "May", cost: 1055000 }, { month: "Jun", cost: 1092000 }, { month: "Jul", cost: 1140000 },
    ],
    costs: [
      { name: "CloudOps", cost: 640000, breakdown: "GKE $410K, Cloud SQL $130K, Networking $100K", sparkData: [520, 560, 590, 610, 630, 640], sparkColor: "#3b82f6", memory: "Right-sized GKE node pools saved $18K/mo since Jun." },
      { name: "AI / Vertex", cost: 310000, breakdown: "Vertex inference $260K, BigQuery ML $50K", sparkData: [180, 210, 240, 270, 290, 310], sparkColor: "#f59e0b", memory: "GPU spend growing with inference traffic. Reserved slot review scheduled." },
      { name: "SecOps", cost: 42000, breakdown: "SCC Premium, Wiz", sparkData: [40, 41, 42, 42, 42, 42], sparkColor: "#10b981", memory: "Stable, no anomalies." },
      { name: "DevOps", cost: 86000, breakdown: "Cloud Build, Artifact Registry", sparkData: [95, 98, 96, 94, 98, 86], sparkColor: "#8b5cf6", memory: "2nd-gen Functions migration cut cold-start cost." },
    ],
    optimizations: [
      { recommendation: "Apply partition filter to BigQuery ETL", appliedDate: null, savings: "est. $42/run", status: "pending", memory: "Same fix resolved the Jul 15 spike. Current pipeline scans full 2TB on each run." },
      { recommendation: "Committed use discount on GKE node pools", appliedDate: "Jun 3", savings: "$1,240/mo", status: "applied", memory: "1-yr CUD on n2-standard-8, breakeven in 5 weeks." },
      { recommendation: "Reserved Vertex AI inference slots", appliedDate: null, savings: "est. $2,100/mo", status: "available", memory: "On-demand GPU spend growing 15% MoM. Review by Q4." },
    ],
    anomalies: [
      {
        title: "BigQuery cost spike: +340% in last 4 hours", severity: "active", timeAgo: "4 hours ago", service: "BigQuery",
        extra: "$42 estimated overspend",
        memory: "Matches the Jul 15 ETL spike pattern (unoptimized JOIN on a 2TB table). Root cause + fix already known.",
        confidence: "88% same root cause",
        suggestedFix: "Apply the same partition filter used on Jul 15 to the nightly ETL DAG.",
        timeline: ["02:00 — ETL DAG triggered", "02:04 — BigQuery scan exceeded 1TB threshold", "02:12 — Cost anomaly detected", "02:15 — Pattern matched to Jul 15 incident (88%)"],
      },
    ],
    forecast: [
      { month: "Aug", cost: 1180000, note: "Assumes BigQuery anomaly resolved and partition filter applied." },
      { month: "Sep", cost: 1120000, note: "Reserved Vertex slots applied, GKE CUD fully amortized." },
    ],
    riskFactors: [
      "BigQuery usage trending +15% MoM from increased ML training data.",
      "Vertex AI spend growing with new model experiments — review reserved slots by Q4.",
    ],
  },

  aarti: {
    monthlyTrend: [
      { month: "Feb", cost: 172000 }, { month: "Mar", cost: 176000 }, { month: "Apr", cost: 179000 },
      { month: "May", cost: 181000 }, { month: "Jun", cost: 183000 }, { month: "Jul", cost: 186000 },
    ],
    costs: [
      { name: "CloudOps", cost: 120000, breakdown: "Compute $80K, Cloud SQL $30K, Networking $10K", sparkData: [100, 105, 110, 113, 117, 120], sparkColor: "#3b82f6", memory: "Stable compliance-region workloads." },
      { name: "SecOps", cost: 38000, breakdown: "SCC Premium, audit tooling", sparkData: [30, 32, 34, 35, 36, 38], sparkColor: "#10b981", memory: "Rising slightly with Q3 audit prep tooling." },
    ],
    optimizations: [
      { recommendation: "Cloud SQL committed use discount", appliedDate: null, savings: "est. $22/mo", status: "available", memory: "db-custom-4-16384 running 24/7 for 8 months — stable pattern." },
    ],
    anomalies: [],
    forecast: [
      { month: "Aug", cost: 189000, note: "Flat spend, audit tooling stable." },
    ],
    riskFactors: [
      "Cloud SQL instance approaching 75% storage capacity — may need resize by Sep.",
    ],
  },

  shopstop: {
    monthlyTrend: [
      { month: "Feb", cost: 340000 }, { month: "Mar", cost: 355000 }, { month: "Apr", cost: 362000 },
      { month: "May", cost: 378000 }, { month: "Jun", cost: 390000 }, { month: "Jul", cost: 412000 },
    ],
    costs: [
      { name: "CloudOps", cost: 260000, breakdown: "Compute $180K, AWS EKS $50K, Networking $30K", sparkData: [210, 220, 230, 240, 250, 260], sparkColor: "#3b82f6", memory: "Pre-scaled 3x for sale window — cost bump is expected, not anomalous." },
      { name: "AIOps", cost: 44000, breakdown: "Predictive scaling agent, Vertex AI", sparkData: [28, 32, 36, 38, 41, 44], sparkColor: "#f59e0b", memory: "Predictive scaling agent running on 5 services ahead of sale." },
    ],
    optimizations: [
      { recommendation: "Right-size catalog-search after sale window", appliedDate: null, savings: "est. $18/mo", status: "available", memory: "Sale-window over-provisioning should scale back within 72h of event end." },
    ],
    anomalies: [
      {
        title: "Compute Engine egress +85% WoW", severity: "resolved", timeAgo: "5 days ago", service: "Compute Engine",
        extra: "Resolved in 2h",
        memory: "Cross-region replication running without compression. Added gzip, egress normalized within 2h.",
        confidence: null, suggestedFix: null,
        timeline: ["08:00 — Egress anomaly detected (+85%)", "08:30 — Root cause: uncompressed replication", "09:15 — Compression applied", "10:00 — Egress normalized"],
      },
    ],
    forecast: [
      { month: "Aug", cost: 450000, note: "Sale-window spend elevated, expected to normalize by Aug 10." },
    ],
    riskFactors: [
      "Pre-sale traffic ramp typically adds 10-15% to compute spend for ~5 days.",
    ],
  },

  designx: {
    monthlyTrend: [
      { month: "Feb", cost: 29000 }, { month: "Mar", cost: 30500 }, { month: "Apr", cost: 31200 },
      { month: "May", cost: 32000 }, { month: "Jun", cost: 33400 }, { month: "Jul", cost: 34000 },
    ],
    costs: [
      { name: "CloudOps", cost: 22000, breakdown: "Render farm $18K, Storage $4K", sparkData: [18, 19, 20, 20, 21, 22], sparkColor: "#3b82f6", memory: "Render farm usage flat, no anomalies." },
      { name: "DevOps", cost: 6000, breakdown: "Cloud Build, Artifact Registry", sparkData: [5, 5, 6, 6, 6, 6], sparkColor: "#8b5cf6", memory: "Stable build minutes after caching improvements." },
    ],
    optimizations: [
      { recommendation: "Switch thumbnail-generator to 2nd gen Functions", appliedDate: "Jun 3", savings: "$12/mo", status: "applied", memory: "Cold start p99 improved 2.1s to 340ms." },
    ],
    anomalies: [],
    forecast: [
      { month: "Aug", cost: 34500, note: "Flat spend expected." },
    ],
    riskFactors: [],
  },

  paynimbus: {
    monthlyTrend: [
      { month: "Feb", cost: 228000 }, { month: "Mar", cost: 233000 }, { month: "Apr", cost: 237000 },
      { month: "May", cost: 240000 }, { month: "Jun", cost: 243000 }, { month: "Jul", cost: 248000 },
    ],
    costs: [
      { name: "CloudOps", cost: 165000, breakdown: "Payments API $90K, Ledger $50K, Fraud detection $25K", sparkData: [140, 145, 150, 155, 160, 165], sparkColor: "#3b82f6", memory: "Stable, PCI-scoped tier isolated on dedicated capacity." },
      { name: "SecOps", cost: 51000, breakdown: "Key management, PCI evidence tooling, IAM audit", sparkData: [42, 44, 46, 48, 50, 51], sparkColor: "#10b981", memory: "Rising slightly ahead of quarterly PCI evidence package." },
    ],
    optimizations: [
      { recommendation: "Committed use discount on payments-api tier", appliedDate: "May 20", savings: "$310/mo", status: "applied", memory: "1-yr CUD, stable 24/7 usage pattern for 11 months." },
    ],
    anomalies: [],
    forecast: [
      { month: "Aug", cost: 251000, note: "Flat spend, PCI evidence tooling cost stable." },
    ],
    riskFactors: [
      "Ledger service storage growing ~4%/mo — review retention policy by Q4.",
    ],
  },
};

function scaleForEnv(p: FinOpsProfile, envId: string, isProd: boolean): FinOpsProfile {
  if (isProd) return p;
  const f = envFactor(envId);
  const scale = (n: number) => Math.max(0, Math.round(n * f));
  return {
    monthlyTrend: p.monthlyTrend.map((m) => ({ ...m, cost: scale(m.cost) })),
    costs: p.costs.map((c) => ({ ...c, cost: scale(c.cost), sparkData: c.sparkData.map(scale) })),
    optimizations: p.optimizations.filter((o) => o.status !== "pending"),
    anomalies: [],
    forecast: p.forecast.map((fc) => ({ ...fc, cost: scale(fc.cost), note: "Non-production environment — lower, steadier spend." })),
    riskFactors: [],
  };
}

const data = buildTenantEnvShell(TENANTS, (tenant, envId, isProd) => {
  const scaled = scaleForEnv(PROFILES[tenant.id], envId, isProd);
  return {
    "/finops/monthly-trend": scaled.monthlyTrend,
    "/finops/costs": scaled.costs,
    "/finops/optimizations": scaled.optimizations,
    "/finops/anomalies": scaled.anomalies,
    "/finops/forecast": scaled.forecast,
    "/finops/risk-factors": scaled.riskFactors,
  };
});

export default data;
