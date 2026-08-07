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
      { name: "Cloud Security", cost: 42000, breakdown: "SCC Premium, Wiz", sparkData: [40, 41, 42, 42, 42, 42], sparkColor: "#10b981", memory: "Stable, no anomalies." },
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
      { month: "Feb", cost: 19800 }, { month: "Mar", cost: 20200 }, { month: "Apr", cost: 20700 },
      { month: "May", cost: 21100 }, { month: "Jun", cost: 21600 }, { month: "Jul", cost: 22400 },
    ],
    costs: [
      { name: "CloudOps", cost: 15600, breakdown: "EC2 $10.2K, RDS $3.8K, Networking $1.6K", sparkData: [12800, 13400, 14000, 14500, 15100, 15600], sparkColor: "#3b82f6", memory: "Stable compliance-region workloads on ap-south-1." },
      { name: "Cloud Security", cost: 4600, breakdown: "GuardDuty, Security Hub, audit tooling", sparkData: [3600, 3800, 4000, 4200, 4400, 4600], sparkColor: "#10b981", memory: "Rising slightly with Q3 audit prep tooling." },
    ],
    optimizations: [
      { recommendation: "RDS reserved instance (1-yr, no upfront)", appliedDate: null, savings: "est. $340/mo", status: "available", memory: "db.r5.xlarge running 24/7 for 8 months — stable pattern, reservation breaks even in 4 months." },
    ],
    anomalies: [],
    forecast: [
      { month: "Aug", cost: 22900, note: "Flat spend, audit tooling stable." },
    ],
    riskFactors: [
      "RDS instance approaching 75% storage capacity — may need resize by Sep.",
    ],
  },

  shopstop: {
    monthlyTrend: [
      { month: "Feb", cost: 182000 }, { month: "Mar", cost: 189000 }, { month: "Apr", cost: 194000 },
      { month: "May", cost: 201000 }, { month: "Jun", cost: 208000 }, { month: "Jul", cost: 220000 },
    ],
    costs: [
      { name: "CloudOps", cost: 138000, breakdown: "Compute $96K, AWS EKS $26K, Networking $16K", sparkData: [112, 118, 122, 128, 133, 138], sparkColor: "#3b82f6", memory: "Pre-scaled 3x for sale window — cost bump is expected, not anomalous." },
      { name: "SAP Workloads", cost: 46000, breakdown: "SAP HANA on Compute Engine $34K, SAP app tier $12K", sparkData: [40, 41, 42, 43, 44, 46], sparkColor: "#8b5cf6", memory: "SAP ECC + HANA on dedicated memory-optimized VMs — stable, no anomalies." },
      { name: "AIOps", cost: 23000, breakdown: "Predictive scaling agent, Vertex AI", sparkData: [15, 17, 19, 20, 21, 23], sparkColor: "#f59e0b", memory: "Predictive scaling agent running on 5 services ahead of sale." },
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
      { month: "Aug", cost: 238000, note: "Sale-window spend elevated, expected to normalize by Aug 10." },
    ],
    riskFactors: [
      "Pre-sale traffic ramp typically adds 10-15% to compute spend for ~5 days.",
    ],
  },

  designx: {
    monthlyTrend: [
      { month: "Feb", cost: 8600 }, { month: "Mar", cost: 8900 }, { month: "Apr", cost: 9100 },
      { month: "May", cost: 9400 }, { month: "Jun", cost: 9700 }, { month: "Jul", cost: 10000 },
    ],
    costs: [
      { name: "CloudOps", cost: 7800, breakdown: "Render farm $6.2K, Storage $1.6K", sparkData: [6400, 6700, 7000, 7300, 7500, 7800], sparkColor: "#3b82f6", memory: "Render farm usage flat, no anomalies." },
      { name: "DevOps", cost: 1600, breakdown: "Cloud Build, Artifact Registry", sparkData: [1300, 1350, 1420, 1480, 1550, 1600], sparkColor: "#8b5cf6", memory: "Stable build minutes after caching improvements." },
    ],
    optimizations: [
      { recommendation: "Switch thumbnail-generator to 2nd gen Functions", appliedDate: "Jun 3", savings: "$12/mo", status: "applied", memory: "Cold start p99 improved 2.1s to 340ms." },
    ],
    anomalies: [],
    forecast: [
      { month: "Aug", cost: 10200, note: "Flat spend expected." },
    ],
    riskFactors: [],
  },

  dmart: {
    monthlyTrend: [
      { month: "Feb", cost: 60000 }, { month: "Mar", cost: 62500 }, { month: "Apr", cost: 64800 },
      { month: "May", cost: 66200 }, { month: "Jun", cost: 68100 }, { month: "Jul", cost: 70400 },
    ],
    costs: [
      { name: "CloudOps", cost: 48000, breakdown: "GKE node pools (HCL Commerce) $36K, Cloud SQL $8K, Networking $4K", sparkData: [39000, 41000, 43000, 44500, 46200, 48000], sparkColor: "#3b82f6", memory: "Node pool auto-scaled during flash-sale windows — cost bump is expected, not anomalous." },
      { name: "DevOps", cost: 9200, breakdown: "Cloud Build, Artifact Registry, GKE Autopilot overhead", sparkData: [7200, 7600, 8000, 8400, 8800, 9200], sparkColor: "#8b5cf6", memory: "CI pipeline for hcl-commerce-* services, 40+ deploys/week." },
      { name: "AIOps", cost: 6800, breakdown: "Predictive HPA agent, Vertex AI", sparkData: [4200, 4600, 5100, 5600, 6200, 6800], sparkColor: "#f59e0b", memory: "Predictive pod-scaling agent watching checkout + catalog services ahead of sale events." },
    ],
    optimizations: [
      { recommendation: "Right-size hcl-commerce-catalog memory requests", appliedDate: null, savings: "est. $410/mo", status: "available", memory: "Catalog pods request 4Gi but use 2.1Gi p95 — matches the pattern found on checkout in May." },
      { recommendation: "Scale node pool back down 48h after flash sale", appliedDate: "Jun 12", savings: "$860/mo", status: "applied", memory: "Post-sale scale-down automation added after 2 sale windows left nodes over-provisioned for days." },
    ],
    anomalies: [],
    forecast: [
      { month: "Aug", cost: 74500, note: "Flash-sale week elevates node pool spend, expected to normalize within 72h." },
    ],
    riskFactors: [
      "GKE node pool cost grows with each flash-sale event — post-sale scale-down automation reduces this but isn't universal across all node pools yet.",
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
