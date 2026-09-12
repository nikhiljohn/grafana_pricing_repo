/* ------------------------------------------------------------------ */
/*  Intellicore CMP — Shoppers Stop eCommerce environment              */
/*                                                                     */
/*  SINGLE SOURCE OF TRUTH for the Shoppers Stop tenant.               */
/*                                                                     */
/*  Every value here is traceable to the Statement of Work:            */
/*  "Cloud Managed Services — eCommerce Workloads", Shoppers Stop      */
/*  Limited × Searce Cosourcing Services, v1.0 Draft, 4 Sep 2026.      */
/*  Clause references are given inline as [SOW §x.y].                  */
/*                                                                     */
/*  The per-domain mock modules import from this file rather than      */
/*  hardcoding resource names, so the demo cannot drift away from the  */
/*  contracted environment. If the SOW changes, change it here.        */
/*                                                                     */
/*  ASSUMPTIONS (not stated in the SOW — confirm with Subhasish        */
/*  Mishra before using these in a customer-facing demo):              */
/*    - Region is asia-south1 (Mumbai). The SOW names no region.       */
/*    - Resource names follow an ss-ecom-* convention. The SOW names   */
/*      only gcphulk.ssecom.tech, so the rest are placeholders.        */
/*    - Costs are illustrative. The SOW pricing table (§10.1) is TBD.  */
/* ------------------------------------------------------------------ */

/** Contract metadata [SOW cover page, §12]. */
export const ENGAGEMENT = {
  client: "Shoppers Stop Limited",
  supplier: "Searce Cosourcing Services Private Limited",
  scope: "Cloud Managed Services — eCommerce Workloads",
  sowVersion: "v1.0 (Draft)",
  effectiveDate: "1 October 2026",
  termMonths: 36,
  currency: "INR",
  /** Routine deploys and DB maintenance only [SOW §4.5, §4.6, §7.2]. */
  maintenanceWindow: "02:00–05:00 IST",
  /** Client must give notice before sale traffic spikes [SOW §7.2]. */
  saleEventNoticeHours: 48,
} as const;

/* ── GCP projects [SOW §4.2] ────────────────────────────────────────── */

export type ProjectTier = "Production" | "Non-Production" | "CI/CD";

export interface SsProject {
  id: string;
  tier: ProjectTier;
  purpose: string;
}

/** 7 GCP projects under management [SOW §4.2]. */
export const PROJECTS: SsProject[] = [
  { id: "ss-ecom-prod-network", tier: "Production", purpose: "VPC / Jump host / Firewall" },
  { id: "ss-ecom-prod-gke", tier: "Production", purpose: "GKE cluster project" },
  { id: "ss-ecom-prod-winapi", tier: "Production", purpose: "Windows VM / Ecom API" },
  { id: "ss-ecom-uat-1", tier: "Non-Production", purpose: "UAT environment 1" },
  { id: "ss-ecom-uat-2", tier: "Non-Production", purpose: "UAT environment 2" },
  { id: "ss-ecom-dev", tier: "Non-Production", purpose: "Development environment" },
  { id: "ss-ecom-cicd", tier: "CI/CD", purpose: "Jenkins — gcphulk.ssecom.tech" },
];

export const REGION = "asia-south1";

/* ── Service towers [SOW §4.3–§4.9] ─────────────────────────────────── */

export interface Tower {
  id: "A" | "B" | "C" | "D" | "E" | "F" | "G";
  name: string;
  /** Pillar this tower surfaces under in the Intellicore CMP UI. */
  pillar: "CloudOps" | "FinOps" | "Cloud Security" | "DevOps" | "AIOps";
  coverage: string;
  /** P1 response SLO where the tower states its own [SOW §4.3–§4.5]. */
  p1ResponseSlo: string;
  sowClause: string;
}

export const TOWERS: Tower[] = [
  { id: "A", name: "Cloud Infrastructure", pillar: "CloudOps", coverage: "24×7×365", p1ResponseSlo: "15 min", sowClause: "§4.3" },
  { id: "B", name: "GKE & Cloud Run", pillar: "CloudOps", coverage: "24×7×365", p1ResponseSlo: "30 min", sowClause: "§4.4" },
  { id: "C", name: "Database (CloudSQL)", pillar: "CloudOps", coverage: "24×7×365", p1ResponseSlo: "15 min", sowClause: "§4.5" },
  { id: "D", name: "DevOps & CI/CD", pillar: "DevOps", coverage: "Business hours + on-call", p1ResponseSlo: "15 min", sowClause: "§4.6" },
  { id: "E", name: "Windows VM & Migration", pillar: "CloudOps", coverage: "Weekly window + on-call", p1ResponseSlo: "15 min", sowClause: "§4.7" },
  { id: "F", name: "Cloud Security", pillar: "Cloud Security", coverage: "24×7×365", p1ResponseSlo: "15 min", sowClause: "§4.8" },
  { id: "G", name: "FinOps & Cost", pillar: "FinOps", coverage: "Business hours", p1ResponseSlo: "4 hr", sowClause: "§4.9" },
];

/* ── SLA [SOW §7.1] ─────────────────────────────────────────────────── */

export interface SlaTier {
  priority: "P1" | "P2" | "P3" | "P4";
  label: string;
  responseSlo: string;
  resolutionSlo: string;
  example: string;
}

export const SLA: SlaTier[] = [
  { priority: "P1", label: "Critical", responseSlo: "15 min", resolutionSlo: "< 4 hr", example: "ss.com unavailable; production GKE cluster failure; database failover" },
  { priority: "P2", label: "Major", responseSlo: "30 min", resolutionSlo: "< 8 hr", example: "Application latency spike; CPU > 80%; single microservice failure" },
  { priority: "P3", label: "Moderate", responseSlo: "30 min", resolutionSlo: "< 24 hr", example: "Service degraded, workaround available" },
  { priority: "P4", label: "Low", responseSlo: "4 hr", resolutionSlo: "5 business days", example: "Service requests, how-tos, reports, advisory" },
];

/* ── GKE [SOW §4.2, §4.4] ───────────────────────────────────────────── */

export interface SsCluster {
  name: string;
  project: string;
  mode: "Standard" | "Autopilot";
  env: "Production" | "Non-Production";
  pods: number;
  notes: string;
}

export const CLUSTERS: SsCluster[] = [
  {
    name: "ss-ecom-prod-cluster",
    project: "ss-ecom-prod-gke",
    mode: "Standard",
    env: "Production",
    pods: 23, // SOW says ~21–25 pods in production
    notes: "Magento microservices, SSO, CMS via Istio service mesh",
  },
  {
    name: "ss-ecom-nonprod-cluster",
    project: "ss-ecom-uat-1",
    mode: "Standard",
    env: "Non-Production",
    pods: 14,
    notes: "UAT mirror of production microservice set",
  },
  {
    name: "ss-web-autopilot",
    project: "ss-ecom-prod-gke",
    mode: "Autopilot",
    env: "Production",
    pods: 6,
    notes: "Smaller website workloads on GKE Autopilot",
  },
];

/* ── Windows VMs [SOW §4.2, §4.7] ───────────────────────────────────── */

export interface SsWindowsVm {
  name: string;
  role: string;
  /** Target under the Dec 2026 GKE migration [SOW §4.7]. */
  migrationTarget: "Migrate to GKE" | "Retain";
}

/**
 * 5 production Windows VMs requiring weekly restarts inside the
 * maintenance window, with curl health checks per SOP [SOW §4.7].
 * Target state: retain only 2–3 by December 2026 (EOSS).
 */
export const WINDOWS_VMS: SsWindowsVm[] = [
  { name: "ss-prod-cf-api", role: "Production CF API", migrationTarget: "Migrate to GKE" },
  { name: "ss-prod-ecom-api", role: "Production Ecom API", migrationTarget: "Migrate to GKE" },
  { name: "ss-catalog", role: "Catalog service", migrationTarget: "Retain" },
  { name: "ss-promotion-engine", role: "Promotion Engine", migrationTarget: "Retain" },
  { name: "ss-ms", role: "MS service", migrationTarget: "Migrate to GKE" },
];

/* ── Cloud SQL [SOW §4.2, §4.5] ─────────────────────────────────────── */

export interface SsDatabase {
  name: string;
  engine: string;
  role: "Magento" | "Operational";
  /** Logical databases carried by this instance [SOW §4.2]. */
  hosts: string;
}

/**
 * 5 Cloud SQL MySQL instances — 4 Magento + 1 operational.
 * All on 8.0.37; must reach 8.4 before December 2026 end-of-support
 * [SOW §4.5, Version Upgrade].
 */
export const DATABASES: SsDatabase[] = [
  { name: "ss-magento-db-01", engine: "MySQL 8.0.37", role: "Magento", hosts: "Magento core catalogue + orders" },
  { name: "ss-magento-db-02", engine: "MySQL 8.0.37", role: "Magento", hosts: "SSO" },
  { name: "ss-magento-db-03", engine: "MySQL 8.0.37", role: "Magento", hosts: "Keycloak" },
  { name: "ss-magento-db-04", engine: "MySQL 8.0.37", role: "Magento", hosts: "CMS" },
  { name: "ss-ops-db-01", engine: "MySQL 8.0.37", role: "Operational", hosts: "Windows VM services" },
];

export const MYSQL_UPGRADE = {
  from: "8.0.37",
  to: "8.4",
  deadline: "December 2026",
  reason: "8.0.37 reaches end-of-support December 2026",
} as const;

/* ── Platform & tooling [SOW §4.2] ──────────────────────────────────── */

export const PLATFORM = {
  serviceMesh: "Istio — host-based routing, SSL certs as Kubernetes secrets",
  auth: "Keycloak (SSO) — replacement planned within 3–4 months [SOW §9 item 8]",
  cicd: "Jenkins — gcphulk.ssecom.tech",
  sourceControl: "GitHub",
  deploysPerMonth: "3–4 (higher during sale periods)",
  logging: "ELK",
  monitoring: "Grafana (microservice health)",
  orchestrationApm: "Dynatrace",
  dns: "AWS Route 53 (out of scope for management) [SOW §4.3]",
  edge: "Nitrogen load balancers + Cloud Armor across 3 VPCs",
  cache: "Redis",
  other: "Cloud Run, Cloud Storage, Pub/Sub",
} as const;

/* ── People [SOW §5, §6] ────────────────────────────────────────────── */

export const CLIENT_CONTACTS = [
  { name: "Bipin Nasit", title: "Head – IT Infrastructure" },
  { name: "Sandeep Sharma", title: "Head – eCommerce" },
  { name: "Subhasish Mishra", title: "eCommerce Infrastructure Lead" },
];

/** Escalation matrix [SOW §6]. L1 squad lead is TBD at SOW v1.0. */
export const ESCALATION = [
  { tier: "L1", name: "Squad Engineer (TBD)", role: "Frontline SRE / Cloud Engineer", engagement: "All P1–P4; 24×7" },
  { tier: "L2", name: "Chandan Rudani", role: "Sr. Manager – CMS", engagement: "P1/P2 escalation; SDM oversight" },
  { tier: "L3", name: "Harish Gurram", role: "Director – CMS", engagement: "P1 escalation; architectural decisions" },
  { tier: "L4", name: "Vamsi Krishna", role: "SVP – Delivery", engagement: "Escalation beyond SLA breach" },
];

/* ── Searce access model [SOW §4.11] ────────────────────────────────── */

/**
 * Searce operates read-mostly. No access to application data, source
 * code, or business data at any time; Client retains Owner.
 */
export const ACCESS_MODEL = [
  { account: "ms.cloudengineer@searce.com", grant: "Project Viewer", use: "Read-only visibility into logs, events, configuration" },
  { account: "ms.prodsupport@searce.com", grant: "Project Viewer + Tech Support Editor", use: "Operational management, incident response" },
];

/* ── Convenience lookups ────────────────────────────────────────────── */

export const PROJECT_IDS = PROJECTS.map((p) => p.id);
export const PRODUCTION_PROJECTS = PROJECTS.filter((p) => p.tier === "Production").map((p) => p.id);

/** Format an INR amount the way the Command Center renders it. */
export function inr(amount: number): string {
  return `₹${amount.toLocaleString("en-IN")}`;
}

/**
 * Compact INR for dashboard tiles, in the units an Indian finance team
 * reads natively: ₹11.2L (lakh) and ₹1.35Cr (crore).
 */
export function inrCompact(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(2)}Cr`;
  if (abs >= 100_000) return `₹${(amount / 100_000).toFixed(2)}L`;
  if (abs >= 1_000) return `₹${(amount / 1_000).toFixed(0)}K`;
  return `₹${amount}`;
}
