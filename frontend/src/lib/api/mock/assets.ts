/* ------------------------------------------------------------------ */
/*  Intellicore CMP — Assets / CMDB seed data                         */
/*  Tenant: Shoppers Stop — eCommerce workloads.                      */
/*  Served by apiFetch('/assets') when no backend is configured.       */
/*                                                                     */
/*  Resource names, counts and groupings derive from                  */
/*  ./shoppersstop-env so the inventory always matches the SOW        */
/*  environment (7 GCP projects, 3 GKE clusters, 5 Windows VMs,       */
/*  5 Cloud SQL MySQL instances). Costs are illustrative — the SOW    */
/*  pricing table is TBD.                                             */
/*                                                                     */
/*  In production this inventory is refreshed every 60 minutes        */
/*  [SOW §4.10, Observability & Asset CMDB].                          */
/* ------------------------------------------------------------------ */

import {
  CLUSTERS,
  DATABASES,
  REGION,
  WINDOWS_VMS,
  inr,
} from "./shoppersstop-env";

interface AssetRow {
  name: string;
  subtitle: string;
  service: string;
  project: string;
  region: string;
  state: "RUNNING" | "SUSPENDED" | "UNKNOWN";
  costPerMonth: string;
  lastSeen: string;
}

/** Inventory sweep timestamp — every row shares it (60-min refresh). */
const SEEN = "Sep 12, 09:40";

/* ── GKE clusters [SOW §4.2, §4.4] ──────────────────────────────────── */

const CLUSTER_COST: Record<string, number> = {
  "ss-ecom-prod-cluster": 412000,
  "ss-ecom-nonprod-cluster": 96000,
  "ss-web-autopilot": 38000,
};

const clusters: AssetRow[] = CLUSTERS.map((c) => ({
  name: c.name,
  subtitle: `${c.mode} · ${c.pods} pods · ${c.notes}`,
  service: "GKE Clusters",
  project: c.project,
  region: REGION,
  state: "RUNNING",
  costPerMonth: inr(CLUSTER_COST[c.name] ?? 0),
  lastSeen: SEEN,
}));

/* ── Windows VMs [SOW §4.2, §4.7] ───────────────────────────────────── */

/**
 * All 5 carry a Windows licence, which is why they dominate compute
 * spend and why the Dec 2026 GKE migration is the largest single
 * FinOps lever in the engagement.
 */
const windowsVms: AssetRow[] = WINDOWS_VMS.map((vm) => ({
  name: vm.name,
  subtitle: `n2-standard-4 · Windows Server · ${vm.role}`,
  service: "VM Instances",
  project: "ss-ecom-prod-winapi",
  region: REGION,
  state: "RUNNING",
  costPerMonth: inr(28400),
  lastSeen: SEEN,
}));

/* ── Cloud SQL [SOW §4.2, §4.5] ─────────────────────────────────────── */

const DB_COST: Record<string, number> = {
  "ss-magento-db-01": 88000,
  "ss-magento-db-02": 34000,
  "ss-magento-db-03": 34000,
  "ss-magento-db-04": 34000,
  "ss-ops-db-01": 41000,
};

const databases: AssetRow[] = DATABASES.map((db) => ({
  name: db.name,
  subtitle: `${db.engine} · ${db.hosts}`,
  service: "Cloud SQL Instances",
  project: db.role === "Operational" ? "ss-ecom-prod-winapi" : "ss-ecom-prod-gke",
  region: REGION,
  state: "RUNNING",
  costPerMonth: inr(DB_COST[db.name] ?? 0),
  lastSeen: SEEN,
}));

/* ── Supporting services [SOW §4.2] ─────────────────────────────────── */

const supporting: AssetRow[] = [
  {
    name: "ss-ecom-redis-prod",
    subtitle: "Memorystore Redis 7.0 · 16 GB · HA",
    service: "Redis Instances",
    project: "ss-ecom-prod-gke",
    region: REGION,
    state: "RUNNING",
    costPerMonth: inr(52000),
    lastSeen: SEEN,
  },
  {
    name: "ss-catalog-sync",
    subtitle: "Ready: True · catalogue feed processor",
    service: "Cloud Run Services",
    project: "ss-ecom-prod-gke",
    region: REGION,
    state: "RUNNING",
    costPerMonth: inr(9400),
    lastSeen: SEEN,
  },
  {
    name: "ss-order-webhook",
    subtitle: "Ready: True · order event receiver",
    service: "Cloud Run Services",
    project: "ss-ecom-prod-gke",
    region: REGION,
    state: "RUNNING",
    costPerMonth: inr(6100),
    lastSeen: SEEN,
  },
  {
    name: "ss-ecom-assets",
    subtitle: "Standard · campaign + product imagery",
    service: "Storage Buckets",
    project: "ss-ecom-prod-network",
    region: REGION,
    state: "RUNNING",
    costPerMonth: inr(74000),
    lastSeen: SEEN,
  },
  {
    name: "ss-nitrogen-lb-prod",
    subtitle: "Nitrogen LB + Cloud Armor · ss.com edge",
    service: "Load Balancers",
    project: "ss-ecom-prod-network",
    region: REGION,
    state: "RUNNING",
    costPerMonth: inr(31000),
    lastSeen: SEEN,
  },
  {
    name: "ss-jenkins",
    subtitle: "n2-standard-4 · gcphulk.ssecom.tech",
    service: "VM Instances",
    project: "ss-ecom-cicd",
    region: REGION,
    state: "RUNNING",
    costPerMonth: inr(18200),
    lastSeen: SEEN,
  },
  {
    name: "ss-jump-host",
    subtitle: "e2-medium · bastion into production VPC",
    service: "VM Instances",
    project: "ss-ecom-prod-network",
    region: REGION,
    state: "RUNNING",
    costPerMonth: inr(4800),
    lastSeen: SEEN,
  },
  {
    name: "ss-ecom-dev-sandbox",
    subtitle: "e2-standard-2 · developer sandbox",
    service: "VM Instances",
    project: "ss-ecom-dev",
    region: REGION,
    state: "SUSPENDED",
    costPerMonth: inr(0),
    lastSeen: SEEN,
  },
];

const data: Record<string, unknown> = {
  "/assets": [...clusters, ...windowsVms, ...databases, ...supporting],
};

export default data;
