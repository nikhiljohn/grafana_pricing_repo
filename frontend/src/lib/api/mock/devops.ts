/* ------------------------------------------------------------------ */
/*  Intellicore CMP — DevOps seed data                                 */
/*  Keyed [tenantId][environmentId][endpoint]. One rich production      */
/*  profile per tenant, scaled down for non-prod environments.          */
/* ------------------------------------------------------------------ */

import { TENANTS } from "../../tenants";
import { buildTenantEnvShell, envName } from "./_env";

interface Change { time: string; resource: string; resourceType: string; changeType: string; risk: string; memory: string; }
interface Orchestration { ticket: string; request: string; resource: string; provider: string; estCost: string; risk: string; status: string; memory: string; }
interface Patch { resource: string; type: string; currentVer: string; targetVer: string; severity: string; daysBehind: string; memory: string; }
interface Deployment { time: string; name: string; target: string; success: boolean; summary: string; }
interface Velocity { day: string; count: number; }

interface DevOpsProfile {
  changes: Change[]; orchestration: Orchestration[]; patches: Patch[];
  patterns: string[]; deployments: Deployment[]; velocity: Velocity[];
}

const VELOCITY_BASE: Velocity[] = [
  { day: "Mon", count: 1120 }, { day: "Tue", count: 980 }, { day: "Wed", count: 2400 },
  { day: "Thu", count: 1350 }, { day: "Fri", count: 1100 }, { day: "Sat", count: 420 }, { day: "Sun", count: 310 },
];

const PROFILES: Record<string, DevOpsProfile> = {
  netcore: {
    changes: [
      { time: "6h ago", resource: "etl-analytics-nightly", resourceType: "BigQuery", changeType: "Query pattern changed", risk: "MEDIUM", memory: "Memory: matches pattern that caused the Jul 15 cost spike." },
      { time: "8h ago", resource: "gke-prod-app", resourceType: "GKE", changeType: "Node pool right-sized", risk: "Low", memory: "Memory: post-incident fix for memory pressure 3d ago." },
    ],
    orchestration: [
      { ticket: "CL-41", request: "Add BigQuery slot reservation", resource: "500 slots", provider: "GCP", estCost: "$220/mo", risk: "Low", status: "Pending approval", memory: "Memory: reduces recurrence risk of ETL cost spikes." },
    ],
    patches: [
      { resource: "gke-prod-app", type: "GKE (1.29)", currentVer: "1.29.4", targetVer: "1.29.6", severity: "High", daysBehind: "18d", memory: "Memory: routine minor version bump, no breaking changes." },
    ],
    patterns: [
      "BigQuery cost spikes correlate with query changes 60% of the time.",
      "GKE deployments have 0% failure rate (34 consecutive successes).",
    ],
    deployments: [
      { time: "Today 09:14", name: "deploy-search-api", target: "GKE", success: true, summary: "v4.1.2 rolled out. 0 errors in canary." },
      { time: "Today 02:15", name: "etl-analytics-nightly", target: "Dataflow", success: true, summary: "Partition filter applied — scan reduced 2TB to 45GB." },
    ],
    velocity: VELOCITY_BASE,
  },
  aarti: {
    changes: [
      { time: "4h ago", resource: "erp-prod-app", resourceType: "VM", changeType: "Machine type unchanged, scheduled patch applied", risk: "Low", memory: "Memory: routine maintenance window." },
    ],
    orchestration: [
      { ticket: "CL-18", request: "Provision audit-readonly SA", resource: "custom role", provider: "GCP", estCost: "—", risk: "Low", status: "Pending", memory: "Memory: least-privilege role, no prior issues with this pattern." },
    ],
    patches: [
      { resource: "erp-prod-app", type: "VM (Ubuntu)", currentVer: "22.04.4", targetVer: "22.04.5", severity: "Medium", daysBehind: "14d", memory: "Memory: scheduled for next maintenance window." },
    ],
    patterns: [
      "IAM changes correlate with 35% of security findings within 48h.",
    ],
    deployments: [
      { time: "Yesterday 10:00", name: "erp-nightly-sync", target: "Cloud Composer", success: true, summary: "Sync completed, no drift detected." },
    ],
    velocity: VELOCITY_BASE.map((v) => ({ ...v, count: Math.round(v.count * 0.15) })),
  },
  shopstop: {
    changes: [
      { time: "2h ago", resource: "checkout-service-prod", resourceType: "VM", changeType: "Pre-scaled to 3x for sale window", risk: "Low", memory: "Memory: matches predictive-scaling pattern, zero downtime across 6 events." },
      { time: "18h ago", resource: "bastion-host", resourceType: "VM", changeType: "Firewall rule updated", risk: "MEDIUM", memory: "Memory: egress alert investigation — rule adjusted to exclude backup CIDR." },
    ],
    orchestration: [
      { ticket: "CL-52", request: "Scale checkout-service-prod", resource: "12 instances", provider: "GCP", estCost: "$340/mo", risk: "Low", status: "Approved", memory: "Memory: standard pre-sale scaling playbook." },
    ],
    patches: [
      { resource: "cart-service-prod", type: "VM (Ubuntu)", currentVer: "22.04.3", targetVer: "22.04.5", severity: "Critical", daysBehind: "26d", memory: "Memory: patch deferred until after sale window per change freeze." },
    ],
    patterns: [
      "Deploy freeze 48h before sale events reduces incident rate to 0%.",
      "Cloud Run deployments have 0% failure rate (19 consecutive successes).",
    ],
    deployments: [
      { time: "Today 07:30", name: "scale-checkout", target: "Compute Engine", success: true, summary: "Pre-sale scaling applied. 0 errors." },
    ],
    velocity: VELOCITY_BASE.map((v) => ({ ...v, count: Math.round(v.count * 0.9) })),
  },
  designx: {
    changes: [
      { time: "12d ago", resource: "deploy-bot", resourceType: "IAM", changeType: "Role binding to Editor blocked", risk: "HIGH", memory: "Memory: guardrail flagged this pattern from the May 9 incident." },
    ],
    orchestration: [
      { ticket: "CL-9", request: "Add IAM role", resource: "custom least-privilege", provider: "GCP", estCost: "—", risk: "Low", status: "Completed", memory: "Memory: replaces the blocked Editor grant." },
    ],
    patches: [],
    patterns: [
      "Cloud Run deployments have 0% failure rate (28 consecutive successes).",
      "Average rollback time: 4 min. All rollbacks were on render-farm jobs.",
    ],
    deployments: [
      { time: "Today 09:00", name: "deploy-frontend", target: "Cloud Run", success: true, summary: "v2.8.1 rolled out. 0 errors in canary." },
      { time: "12d ago", name: "iam-update", target: "IAM", success: true, summary: "Editor grant blocked, least-privilege role applied instead." },
    ],
    velocity: VELOCITY_BASE.map((v) => ({ ...v, count: Math.round(v.count * 0.1) })),
  },
  paynimbus: {
    changes: [
      { time: "6h ago", resource: "payments-admin-key", resourceType: "IAM", changeType: "Key rotated", risk: "Low", memory: "Memory: routine rotation after 94-day staleness finding, PCI evidence attached." },
    ],
    orchestration: [
      { ticket: "CL-27", request: "Rotate payments-admin-key", resource: "access key", provider: "AWS", estCost: "—", risk: "Low", status: "Completed", memory: "Memory: 3rd rotation of this pattern, all within 24h SLA." },
    ],
    patches: [
      { resource: "ledger-service-prod", type: "VM (Amazon Linux)", currentVer: "2023.4", targetVer: "2023.5", severity: "High", daysBehind: "9d", memory: "Memory: PCI change-freeze window ends in 2 days, patch queued." },
    ],
    patterns: [
      "Change freeze compliance during PCI review windows: 100%.",
      "Admin key rotations complete within SLA (24h) 100% of the time.",
    ],
    deployments: [
      { time: "Today 00:30", name: "settlement-batch", target: "AWS Batch", success: true, summary: "Nightly settlement completed, 0 errors." },
    ],
    velocity: VELOCITY_BASE.map((v) => ({ ...v, count: Math.round(v.count * 0.2) })),
  },
};

function scaleForEnv(p: DevOpsProfile, envId: string, isProd: boolean): DevOpsProfile {
  if (isProd) return p;
  return {
    changes: p.changes.map((c) => ({ ...c, resource: envName(c.resource, envId), risk: c.risk === "HIGH" ? "MEDIUM" : c.risk })),
    orchestration: p.orchestration,
    patches: p.patches.map((pt) => ({ ...pt, severity: pt.severity === "Critical" ? "Medium" : pt.severity })),
    patterns: p.patterns,
    deployments: p.deployments.map((d) => ({ ...d, name: envName(d.name, envId) })),
    velocity: p.velocity.map((v) => ({ ...v, count: Math.round(v.count * 0.35) })),
  };
}

const data = buildTenantEnvShell(TENANTS, (tenant, envId, isProd) => {
  const scaled = scaleForEnv(PROFILES[tenant.id], envId, isProd);
  return {
    "/devops/changes": scaled.changes,
    "/devops/orchestration": scaled.orchestration,
    "/devops/patches": scaled.patches,
    "/devops/patterns": scaled.patterns,
    "/devops/deployments": scaled.deployments,
    "/devops/velocity": scaled.velocity,
  };
});

export default data;
