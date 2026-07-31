/* ------------------------------------------------------------------ */
/*  Intellicore CMP — CloudOps seed data                              */
/*  Served by apiFetch() when no backend is configured.               */
/* ------------------------------------------------------------------ */

import type {
  VmInstance,
  Incident,
  ServerlessFunction,
  Pipeline,
} from "../types";

const computeInstances: VmInstance[] = [
  { name: "clens-dev", type: "e2-standard-2", zone: "asia-south1-c", cpu: 87, memory: 72, status: "warning", cost: "$54", lastIncident: "CPU spike 95% (3d ago)" },
  { name: "cloudlens-dev-new", type: "e2-standard-2", zone: "asia-south1-c", cpu: 45, memory: 61, status: "healthy", cost: "$54", lastIncident: "None" },
  { name: "connectiq", type: "e2-medium", zone: "us-central1-a", cpu: 32, memory: 48, status: "healthy", cost: "$34", lastIncident: "None" },
  { name: "cl-icore", type: "e2-standard-4", zone: "asia-south1-b", cpu: 56, memory: 70, status: "healthy", cost: "$107", lastIncident: "None" },
  { name: "bastion-host", type: "e2-micro", zone: "us-central1-a", cpu: 12, memory: 34, status: "healthy", cost: "$8", lastIncident: "Egress anomaly (21d ago)" },
  { name: "monitoring-agent", type: "e2-small", zone: "asia-south1-c", cpu: 28, memory: 55, status: "stopped", cost: "$0", lastIncident: "None" },
];

const incidents: Incident[] = [
  {
    time: "3d ago", workload: "Compute", resource: "clens-dev",
    issue: "CPU utilization 95% sustained",
    resolution: "Auto-scaled to e2-standard-4, load balanced",
    duration: "8 min", status: "Resolved", statusColor: "bg-green-50 text-green-700",
  },
  {
    time: "5d ago", workload: "Data & AI", resource: "BigQuery pipeline",
    issue: "Slot exhaustion during ETL",
    resolution: "Autoscaling slots enabled, query optimized",
    duration: "22 min", status: "Resolved", statusColor: "bg-green-50 text-green-700",
  },
  {
    time: "7d ago", workload: "Database", resource: "pgsql",
    issue: "Connection pool max (100) hit",
    resolution: "Pool size increased to 200, connection leak fixed",
    duration: "18 min", status: "Resolved", statusColor: "bg-green-50 text-green-700",
  },
  {
    time: "14d ago", workload: "Serverless", resource: "process-orders",
    issue: "Cold start >2s (p99)",
    resolution: "Min instances set to 3, memory increased to 512MB",
    duration: "N/A (config)", status: "Mitigated", statusColor: "bg-blue-50 text-blue-700",
  },
  {
    time: "21d ago", workload: "Compute", resource: "bastion-host",
    issue: "Network egress anomaly 170k+",
    resolution: "Traffic analyzed — legitimate backup job, alert threshold adjusted",
    duration: "4 min", status: "False positive", statusColor: "bg-slate-100 text-slate-600",
  },
];

const serverless: ServerlessFunction[] = [
  { name: "process-orders", runtime: "Node.js 20", region: "us-central1", invocations: "4,218", avgLatency: "132ms", errorRate: "0.02%", cost: "$24" },
  { name: "send-notifications", runtime: "Python 3.12", region: "us-central1", invocations: "2,891", avgLatency: "89ms", errorRate: "0%", cost: "$18" },
  { name: "resize-images", runtime: "Go 1.22", region: "asia-south1", invocations: "1,456", avgLatency: "245ms", errorRate: "0.01%", cost: "$15" },
  { name: "sync-inventory", runtime: "Node.js 20", region: "us-central1", invocations: "812", avgLatency: "178ms", errorRate: "0%", cost: "$12" },
  { name: "webhook-handler", runtime: "Python 3.12", region: "europe-west1", invocations: "3,344", avgLatency: "56ms", errorRate: "0%", cost: "$10" },
  { name: "data-export", runtime: "Node.js 20", region: "us-central1", invocations: "96", avgLatency: "1,120ms", errorRate: "0%", cost: "$7" },
];

const pipelines: Pipeline[] = [
  { name: "etl-daily", type: "Dataflow", lastRun: "Today 06:00", duration: "42 min", status: "healthy", nextRun: "Tomorrow 06:00", cost: "$12" },
  { name: "ml-training-weekly", type: "Vertex AI", lastRun: "Jul 28, 02:00", duration: "3h 18 min", status: "warning", nextRun: "Aug 4, 02:00", cost: "$11" },
  { name: "data-export-hourly", type: "BigQuery", lastRun: "Today 11:00", duration: "8 min", status: "healthy", nextRun: "Today 12:00", cost: "$5" },
];

const data: Record<string, unknown> = {
  "/cloudops/compute-instances": computeInstances,
  "/cloudops/incidents": incidents,
  "/cloudops/serverless": serverless,
  "/cloudops/pipelines": pipelines,
};

export default data;
