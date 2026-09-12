/* ------------------------------------------------------------------ */
/*  Intellicore CMP — CloudOps seed data                              */
/*  Tenant: Shoppers Stop — eCommerce workloads.                      */
/*                                                                     */
/*  Covers the three CloudOps-facing towers:                          */
/*    Tower A — Cloud Infrastructure  [SOW §4.3]  P1 response 15 min  */
/*    Tower B — GKE & Cloud Run       [SOW §4.4]  P1 response 30 min  */
/*    Tower C — Database (CloudSQL)   [SOW §4.5]  P1 response 15 min  */
/*    Tower E — Windows VM & migration[SOW §4.7]                      */
/*                                                                     */
/*  Served by apiFetch() when no backend is configured.               */
/* ------------------------------------------------------------------ */

import type {
  VmInstance,
  Incident,
  ServerlessFunction,
  Pipeline,
  KubernetesCluster,
  DatabaseInstance,
} from "../types";
import { CLUSTERS, DATABASES, MYSQL_UPGRADE, REGION, WINDOWS_VMS, inr } from "./shoppersstop-env";

/* ── Tower A + E — compute ──────────────────────────────────────────── */

/** Per-VM live signal. Keyed by the SOW's 5 production Windows VMs. */
const VM_SIGNAL: Record<string, { cpu: number; memory: number; status: VmInstance["status"]; lastIncident: string }> = {
  "ss-prod-cf-api": { cpu: 68, memory: 74, status: "healthy", lastIncident: "Weekly restart Sep 8, 02:14 — healthy" },
  "ss-prod-ecom-api": { cpu: 84, memory: 88, status: "warning", lastIncident: "Memory 88% — sustained since campaign push (6h)" },
  "ss-catalog": { cpu: 41, memory: 59, status: "healthy", lastIncident: "Weekly restart Sep 8, 02:22 — healthy" },
  "ss-promotion-engine": { cpu: 77, memory: 71, status: "healthy", lastIncident: "Weekly restart Sep 8, 02:31 — healthy" },
  "ss-ms": { cpu: 35, memory: 52, status: "healthy", lastIncident: "Weekly restart Sep 8, 02:39 — healthy" },
};

const computeInstances: VmInstance[] = [
  ...WINDOWS_VMS.map((vm) => {
    const s = VM_SIGNAL[vm.name];
    return {
      name: vm.name,
      type: "n2-standard-4 (Windows)",
      zone: `${REGION}-a`,
      cpu: s.cpu,
      memory: s.memory,
      status: s.status,
      cost: inr(28400),
      lastIncident: s.lastIncident,
    };
  }),
  { name: "ss-jenkins", type: "n2-standard-4", zone: `${REGION}-b`, cpu: 22, memory: 44, status: "healthy", cost: inr(18200), lastIncident: "None" },
  { name: "ss-jump-host", type: "e2-medium", zone: `${REGION}-a`, cpu: 6, memory: 21, status: "healthy", cost: inr(4800), lastIncident: "None" },
  { name: "ss-ecom-dev-sandbox", type: "e2-standard-2", zone: `${REGION}-c`, cpu: 0, memory: 0, status: "stopped", cost: inr(0), lastIncident: "None" },
];

/* ── Tower B — GKE & Cloud Run ──────────────────────────────────────── */

const CLUSTER_SIGNAL: Record<
  string,
  { version: string; nodes: number; cpu: number; memory: number; status: KubernetesCluster["status"]; cost: number; lastEvent: string }
> = {
  "ss-ecom-prod-cluster": {
    version: "1.30.4-gke.1200",
    nodes: 9,
    cpu: 78,
    memory: 81,
    status: "warning",
    cost: 412000,
    lastEvent: "Node pool at 81% memory — autoscale headroom 2 nodes before sale window",
  },
  "ss-ecom-nonprod-cluster": {
    version: "1.30.4-gke.1200",
    nodes: 4,
    cpu: 34,
    memory: 42,
    status: "healthy",
    cost: 96000,
    lastEvent: "UAT refresh completed Sep 11, 03:10",
  },
  "ss-web-autopilot": {
    version: "1.30.4-gke.1200",
    nodes: 0, // Autopilot — nodes are not customer-managed
    cpu: 29,
    memory: 38,
    status: "healthy",
    cost: 38000,
    lastEvent: "No events in 14d",
  },
};

const kubernetes: KubernetesCluster[] = CLUSTERS.map((c) => {
  const s = CLUSTER_SIGNAL[c.name];
  return {
    name: c.name,
    project: c.project,
    mode: c.mode,
    env: c.env,
    version: s.version,
    nodes: s.nodes,
    pods: c.pods,
    cpu: s.cpu,
    memory: s.memory,
    status: s.status,
    cost: inr(s.cost),
    notes: c.notes,
    lastEvent: s.lastEvent,
  };
});

/* ── Tower C — Cloud SQL ────────────────────────────────────────────── */

const DB_SIGNAL: Record<
  string,
  {
    tier: string;
    ha: boolean;
    pitr: boolean;
    connections: number;
    maxConnections: number;
    cpu: number;
    storageUsedGb: number;
    storageGb: number;
    status: DatabaseInstance["status"];
    cost: number;
    lastEvent: string;
  }
> = {
  "ss-magento-db-01": {
    tier: "db-n1-standard-8", ha: true, pitr: true,
    connections: 361, maxConnections: 500, cpu: 71,
    storageUsedGb: 780, storageGb: 1024, status: "warning", cost: 88000,
    lastEvent: "Connections trending +14%/week — projected to reach max in 9 days",
  },
  "ss-magento-db-02": {
    tier: "db-n1-standard-2", ha: true, pitr: true,
    connections: 62, maxConnections: 250, cpu: 28,
    storageUsedGb: 94, storageGb: 256, status: "healthy", cost: 34000,
    lastEvent: "Weekly archival completed Sep 8, 02:05",
  },
  "ss-magento-db-03": {
    tier: "db-n1-standard-2", ha: true, pitr: true,
    connections: 88, maxConnections: 250, cpu: 33,
    storageUsedGb: 71, storageGb: 256, status: "healthy", cost: 34000,
    lastEvent: "Keycloak session table growth steady",
  },
  "ss-magento-db-04": {
    tier: "db-n1-standard-2", ha: true, pitr: true,
    connections: 41, maxConnections: 250, cpu: 19,
    storageUsedGb: 58, storageGb: 256, status: "healthy", cost: 34000,
    lastEvent: "Weekly archival completed Sep 8, 02:11",
  },
  "ss-ops-db-01": {
    tier: "db-n1-standard-4", ha: false, pitr: false,
    connections: 77, maxConnections: 300, cpu: 44,
    storageUsedGb: 212, storageGb: 512, status: "warning", cost: 41000,
    lastEvent: "No HA replica and PITR disabled — serves 5 production Windows VM services",
  },
};

const databases: DatabaseInstance[] = DATABASES.map((db) => {
  const s = DB_SIGNAL[db.name];
  return {
    name: db.name,
    engine: db.engine,
    tier: s.tier,
    hosts: db.hosts,
    ha: s.ha,
    pitr: s.pitr,
    connections: s.connections,
    maxConnections: s.maxConnections,
    cpu: s.cpu,
    storageUsedGb: s.storageUsedGb,
    storageGb: s.storageGb,
    status: s.status,
    cost: inr(s.cost),
    // Every instance is contractually due 8.0.37 → 8.4 before Dec 2026.
    upgradeTo: MYSQL_UPGRADE.to,
    lastEvent: s.lastEvent,
  };
});

/* ── Incidents across towers ────────────────────────────────────────── */

const RESOLVED = "bg-green-50 text-green-700";
const MITIGATED = "bg-blue-50 text-blue-700";
const FALSE_POSITIVE = "bg-slate-100 text-slate-600";

const incidents: Incident[] = [
  {
    time: "2d ago", workload: "Kubernetes", resource: "ss-ecom-prod-cluster",
    issue: "Istio ingress 503s on checkout route during push-notification burst",
    resolution: "Node pool manually scaled 7 → 9; Istio destination-rule pool size raised. Cascading failure contained before ss.com impact.",
    duration: "22 min", status: "Resolved", statusColor: RESOLVED,
  },
  {
    time: "4d ago", workload: "Database", resource: "ss-magento-db-01",
    issue: "Connection pool at 92% of max (460/500)",
    resolution: "Idle Magento connections reaped; app team given the query holding 40 connections open. Pool ceiling review raised as P3.",
    duration: "31 min", status: "Resolved", statusColor: RESOLVED,
  },
  {
    time: "6d ago", workload: "Compute", resource: "ss-prod-ecom-api",
    issue: "Memory 88% sustained after campaign push",
    resolution: "Scheduled restart brought forward into the 02:00–05:00 window. Root cause handed to app team — not an infrastructure fault.",
    duration: "12 min", status: "Mitigated", statusColor: MITIGATED,
  },
  {
    time: "9d ago", workload: "Kubernetes", resource: "ss-web-autopilot",
    issue: "Pod evictions on catalogue workload",
    resolution: "Autopilot rescheduled within 90s; no human action required. Logged for pattern tracking only.",
    duration: "2 min", status: "Auto-resolved", statusColor: RESOLVED,
  },
  {
    time: "12d ago", workload: "Compute", resource: "ss-nitrogen-lb-prod",
    issue: "Egress anomaly 3.1σ above baseline",
    resolution: "Traffic traced to a scheduled catalogue feed export. Threshold re-baselined; no action.",
    duration: "5 min", status: "False positive", statusColor: FALSE_POSITIVE,
  },
  {
    time: "18d ago", workload: "Database", resource: "ss-ops-db-01",
    issue: "Backup integrity check failed on first attempt",
    resolution: "Re-run succeeded. Root cause: concurrent archival job locking. Archival moved 20 min earlier in the window.",
    duration: "44 min", status: "Resolved", statusColor: RESOLVED,
  },
];

/* ── Cloud Run [SOW §4.4] ───────────────────────────────────────────── */

const serverless: ServerlessFunction[] = [
  { name: "ss-catalog-sync", runtime: "Cloud Run · Java 17", region: REGION, invocations: "18,402", avgLatency: "310ms", errorRate: "0.04%", cost: inr(9400) },
  { name: "ss-order-webhook", runtime: "Cloud Run · Node.js 20", region: REGION, invocations: "44,118", avgLatency: "72ms", errorRate: "0.01%", cost: inr(6100) },
  { name: "ss-price-feed", runtime: "Cloud Run · Python 3.12", region: REGION, invocations: "6,240", avgLatency: "188ms", errorRate: "0%", cost: inr(3800) },
  { name: "ss-inventory-reconcile", runtime: "Cloud Run · Java 17", region: REGION, invocations: "1,104", avgLatency: "940ms", errorRate: "0.09%", cost: inr(2900) },
];

/* ── Scheduled operations [SOW §4.5 Routine Operations, §4.7] ───────── */

/**
 * The recurring manual work the SOW commits Searce to. These are the
 * jobs Tower C and Tower E hours are spent on today, and the first
 * candidates for agent execution.
 */
const pipelines: Pipeline[] = [
  { name: "Weekly DB archival & cleanup", type: "Tower C · SOP", lastRun: "Sep 8, 02:05", duration: "38 min", status: "healthy", nextRun: "Sep 15, 02:00", cost: inr(0) },
  { name: "Backup integrity verification", type: "Tower C · SOP", lastRun: "Sep 11, 02:50", duration: "16 min", status: "healthy", nextRun: "Sep 18, 02:50", cost: inr(0) },
  { name: "Windows VM weekly restart ×5", type: "Tower E · SOP", lastRun: "Sep 8, 02:14", duration: "27 min", status: "healthy", nextRun: "Sep 15, 02:00", cost: inr(0) },
  { name: "Post-restart curl health checks", type: "Tower E · SOP", lastRun: "Sep 8, 02:41", duration: "6 min", status: "healthy", nextRun: "Sep 15, 02:30", cost: inr(0) },
  { name: "Nightly card archival script", type: "Tower E · SOP", lastRun: "Sep 12, 01:30", duration: "19 min", status: "warning", nextRun: "Sep 13, 01:30", cost: inr(0) },
];

const data: Record<string, unknown> = {
  "/cloudops/compute-instances": computeInstances,
  "/cloudops/kubernetes": kubernetes,
  "/cloudops/databases": databases,
  "/cloudops/incidents": incidents,
  "/cloudops/serverless": serverless,
  "/cloudops/pipelines": pipelines,
};

export default data;
