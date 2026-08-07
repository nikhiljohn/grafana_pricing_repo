/* ------------------------------------------------------------------ */
/*  Intellicore CMP — CloudOps seed data                               */
/*  Keyed [tenantId][environmentId][endpoint]. One rich production      */
/*  profile per tenant, scaled down for non-prod environments.          */
/* ------------------------------------------------------------------ */

import { TENANTS } from "../../tenants";
import { buildTenantEnvShell, envName, scaleCost } from "./_env";

interface VmInstance {
  name: string; type: string; zone: string; cpu: number; memory: number;
  status: "healthy" | "warning" | "stopped"; cost: string; lastIncident: string;
}
interface Incident {
  time: string; workload: string; resource: string; issue: string;
  resolution: string; duration: string; status: string; statusColor: string;
}
interface ServerlessFn {
  name: string; runtime: string; region: string; invocations: string;
  avgLatency: string; errorRate: string; cost: string;
}
interface Pipeline {
  name: string; type: string; lastRun: string; duration: string;
  status: "healthy" | "warning"; nextRun: string; cost: string;
}
interface CloudOpsProfile {
  vms: VmInstance[]; incidents: Incident[]; serverless: ServerlessFn[]; pipelines: Pipeline[];
}

const PROFILES: Record<string, CloudOpsProfile> = {
  netcore: {
    vms: [
      { name: "gke-prod-app", type: "e2-standard-4", zone: "asia-south1-b", cpu: 78, memory: 88, status: "warning", cost: "$310", lastIncident: "Memory pressure 88% (today)" },
      { name: "gke-prod-ml", type: "n2-standard-8", zone: "asia-south1-b", cpu: 62, memory: 70, status: "healthy", cost: "$540", lastIncident: "None" },
      { name: "vertex-inference-hero", type: "a2-highgpu-1g", zone: "asia-south1-c", cpu: 44, memory: 51, status: "healthy", cost: "$890", lastIncident: "Cost spike 30d ago" },
      { name: "cloudsql-prod-primary", type: "db-custom-8-32768", zone: "asia-south1-a", cpu: 55, memory: 60, status: "healthy", cost: "$410", lastIncident: "None" },
      { name: "bastion-prod", type: "e2-micro", zone: "asia-south1-a", cpu: 8, memory: 22, status: "healthy", cost: "$7", lastIncident: "None" },
    ],
    incidents: [
      { time: "5h ago", workload: "Data & AI", resource: "BigQuery ETL", issue: "Slot exhaustion, unoptimized JOIN scanning 2TB", resolution: "Partition filter applied, query optimized", duration: "22 min", status: "Resolved", statusColor: "bg-green-50 text-green-700" },
      { time: "3d ago", workload: "Compute", resource: "gke-prod-app", issue: "Node pool memory pressure at 88%", resolution: "Right-sized node pool, added HPA headroom", duration: "8 min", status: "Resolved", statusColor: "bg-green-50 text-green-700" },
      { time: "30d ago", workload: "AI", resource: "vertex-inference-hero", issue: "GPU endpoint cost spike +84%", resolution: "Reserved slot review scheduled", duration: "n/a", status: "Mitigated", statusColor: "bg-blue-50 text-blue-700" },
    ],
    serverless: [
      { name: "search-api", runtime: "Node.js 20", region: "asia-south1", invocations: "812,400", avgLatency: "94ms", errorRate: "0.01%", cost: "$310" },
      { name: "ingestion-webhook", runtime: "Python 3.12", region: "asia-south1", invocations: "220,100", avgLatency: "48ms", errorRate: "0%", cost: "$120" },
    ],
    pipelines: [
      { name: "etl-analytics-nightly", type: "Dataflow", lastRun: "Today 02:00", duration: "38 min", status: "warning", nextRun: "Tomorrow 02:00", cost: "$180" },
      { name: "ml-training-weekly", type: "Vertex AI", lastRun: "Jul 28, 02:00", duration: "3h 40min", status: "healthy", nextRun: "Aug 4, 02:00", cost: "$640" },
    ],
  },
  aarti: {
    vms: [
      { name: "erp-prod-app", type: "t3.large (EC2)", zone: "ap-south-1a", cpu: 41, memory: 55, status: "healthy", cost: "$78", lastIncident: "None" },
      { name: "rds-erp-primary", type: "db.r5.xlarge (RDS)", zone: "ap-south-1a", cpu: 38, memory: 50, status: "healthy", cost: "$310", lastIncident: "None" },
      { name: "batch-processing-ec2", type: "t3.medium (EC2)", zone: "ap-south-1b", cpu: 30, memory: 40, status: "healthy", cost: "$31", lastIncident: "None" },
      { name: "bastion-audit", type: "t3.micro (EC2)", zone: "ap-south-1a", cpu: 6, memory: 18, status: "healthy", cost: "$8", lastIncident: "None" },
    ],
    incidents: [
      { time: "18d ago", workload: "Compute", resource: "erp-prod-app", issue: "Scheduled batch job overlap caused brief CPU contention", resolution: "Job scheduling window adjusted", duration: "6 min", status: "Resolved", statusColor: "bg-green-50 text-green-700" },
    ],
    serverless: [
      { name: "compliance-report-gen", runtime: "Python 3.12 (Lambda)", region: "ap-south-1", invocations: "4,120", avgLatency: "310ms", errorRate: "0%", cost: "$14" },
    ],
    pipelines: [
      { name: "erp-nightly-sync", type: "AWS Step Functions", lastRun: "Today 01:00", duration: "26 min", status: "healthy", nextRun: "Tomorrow 01:00", cost: "$38" },
    ],
  },
  shopstop: {
    vms: [
      { name: "checkout-service-prod", type: "n2-standard-4", zone: "asia-south1-a", cpu: 71, memory: 66, status: "warning", cost: "$280", lastIncident: "Egress anomaly (today)" },
      { name: "cart-service-prod", type: "e2-standard-4", zone: "asia-south1-a", cpu: 58, memory: 60, status: "healthy", cost: "$210", lastIncident: "None" },
      { name: "catalog-search-prod", type: "n2-standard-2", zone: "asia-south1-b", cpu: 33, memory: 45, status: "healthy", cost: "$140", lastIncident: "None" },
      { name: "sap-hana-prod", type: "m3-megamem-64", zone: "asia-south1-a", cpu: 52, memory: 61, status: "healthy", cost: "$1,240", lastIncident: "None" },
      { name: "sap-app-prod", type: "n2-highmem-8", zone: "asia-south1-a", cpu: 44, memory: 58, status: "healthy", cost: "$410", lastIncident: "None" },
      { name: "eks-analytics-prod", type: "m5.xlarge (AWS)", zone: "ap-south-1a", cpu: 47, memory: 52, status: "healthy", cost: "$320", lastIncident: "None" },
    ],
    incidents: [
      { time: "58d ago", workload: "Networking", resource: "bastion-host", issue: "Egress anomaly 3.3σ from baseline", resolution: "Confirmed legitimate backup job, threshold adjusted", duration: "4 min", status: "False positive", statusColor: "bg-slate-100 text-slate-600" },
      { time: "45d ago", workload: "Compute", resource: "checkout-service-prod", issue: "CPU predicted to breach at peak traffic", resolution: "Predictive auto-scale 6 min ahead of breach", duration: "n/a (automated)", status: "Prevented", statusColor: "bg-green-50 text-green-700" },
    ],
    serverless: [
      { name: "order-confirmation", runtime: "Node.js 20", region: "asia-south1", invocations: "1,204,300", avgLatency: "112ms", errorRate: "0.02%", cost: "$410" },
    ],
    pipelines: [
      { name: "inventory-sync-hourly", type: "Dataflow", lastRun: "Today 11:00", duration: "9 min", status: "healthy", nextRun: "Today 12:00", cost: "$60" },
    ],
  },
  designx: {
    vms: [
      { name: "render-farm-prod", type: "n2-highcpu-8", zone: "asia-south1-a", cpu: 66, memory: 40, status: "healthy", cost: "$390", lastIncident: "None" },
      { name: "asset-store-prod", type: "e2-standard-2", zone: "asia-south1-a", cpu: 22, memory: 35, status: "healthy", cost: "$54", lastIncident: "None" },
    ],
    incidents: [],
    serverless: [
      { name: "thumbnail-generator", runtime: "Go 1.22", region: "asia-south1", invocations: "88,400", avgLatency: "210ms", errorRate: "0.01%", cost: "$18" },
      { name: "export-orchestrator", runtime: "Node.js 20", region: "asia-south1", invocations: "12,900", avgLatency: "340ms", errorRate: "0%", cost: "$9" },
    ],
    pipelines: [
      { name: "asset-cdn-sync", type: "Cloud Run Jobs", lastRun: "Today 06:00", duration: "4 min", status: "healthy", nextRun: "Today 18:00", cost: "$8" },
    ],
  },
  dmart: {
    vms: [
      { name: "gke-prod-commerce", type: "n2-standard-8", zone: "asia-south1-b", cpu: 81, memory: 91, status: "warning", cost: "$920", lastIncident: "checkout pods OOMKilled (today)" },
      { name: "gke-prod-catalog", type: "n2-standard-4", zone: "asia-south1-b", cpu: 58, memory: 64, status: "healthy", cost: "$540", lastIncident: "None" },
      { name: "cloudsql-commerce-primary", type: "db-custom-8-32768", zone: "asia-south1-a", cpu: 49, memory: 55, status: "healthy", cost: "$410", lastIncident: "None" },
      { name: "bastion-prod", type: "e2-micro", zone: "asia-south1-a", cpu: 5, memory: 15, status: "healthy", cost: "$7", lastIncident: "None" },
    ],
    incidents: [
      { time: "today", workload: "Compute", resource: "gke-prod-commerce", issue: "hcl-commerce-checkout pods OOMKilled — JVM heap exceeded 2Gi memory limit under flash-sale load", resolution: "Raised pod memory limit + tuned -Xmx, HPA threshold adjusted", duration: "9 min", status: "Resolved", statusColor: "bg-green-50 text-green-700" },
      { time: "55d ago", workload: "Compute", resource: "gke-prod-commerce", issue: "Node pool left over-provisioned 4 days after flash sale ended", resolution: "Added automated 48h post-sale scale-down", duration: "n/a", status: "Mitigated", statusColor: "bg-blue-50 text-blue-700" },
    ],
    serverless: [
      { name: "order-webhook", runtime: "Java 21 (Cloud Run)", region: "asia-south1", invocations: "1,840,200", avgLatency: "74ms", errorRate: "0.01%", cost: "$310" },
    ],
    pipelines: [
      { name: "inventory-sync-hourly", type: "Dataflow", lastRun: "Today 11:00", duration: "11 min", status: "healthy", nextRun: "Today 12:00", cost: "$140" },
    ],
  },
};

function scaleForEnv(profile: CloudOpsProfile, envId: string, isProd: boolean): CloudOpsProfile {
  if (isProd) return profile;
  return {
    vms: profile.vms.map((vm) => ({
      ...vm,
      name: envName(vm.name.replace("-prod", ""), envId),
      cpu: Math.max(5, Math.round(vm.cpu * 0.5)),
      memory: Math.max(10, Math.round(vm.memory * 0.5)),
      status: vm.status === "warning" ? "healthy" : vm.status,
      cost: scaleCost(vm.cost, envId),
      lastIncident: "None",
    })),
    incidents: [],
    serverless: profile.serverless.map((fn) => ({
      ...fn,
      name: envName(fn.name, envId),
      invocations: scaleCost(`$${fn.invocations.replace(/,/g, "")}`, envId).replace("$", ""),
      cost: scaleCost(fn.cost, envId),
    })),
    pipelines: profile.pipelines.map((p) => ({
      ...p,
      name: envName(p.name, envId),
      status: "healthy",
      cost: scaleCost(p.cost, envId),
    })),
  };
}

const data = buildTenantEnvShell(TENANTS, (tenant, envId, isProd) => {
  const scaled = scaleForEnv(PROFILES[tenant.id], envId, isProd);
  return {
    "/cloudops/compute-instances": scaled.vms,
    "/cloudops/incidents": scaled.incidents,
    "/cloudops/serverless": scaled.serverless,
    "/cloudops/pipelines": scaled.pipelines,
  };
});

export default data;
