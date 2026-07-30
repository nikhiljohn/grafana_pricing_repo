"use client";

import { useState } from "react";
import {
  GitBranch,
  Brain,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Rocket,
  Activity,
  ChevronRight,
  XCircle,
  Info,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
type Tab = "changes" | "orchestration" | "patch" | "memory";

const TAB_LABELS: Record<Tab, string> = {
  changes: "Change Intelligence",
  orchestration: "Orchestration",
  patch: "Patch Compliance",
  memory: "Deployment Memory",
};

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */
interface ChangeRow {
  time: string;
  resource: string;
  resourceType: string;
  changeType: string;
  risk: "Low" | "MEDIUM" | "HIGH";
  memory: string;
}

const CHANGES: ChangeRow[] = [
  {
    time: "2h ago",
    resource: "clens-dev",
    resourceType: "VM",
    changeType: "Machine type changed",
    risk: "Low",
    memory:
      "Memory: Auto-scaled after CPU spike. This is a known recovery pattern.",
  },
  {
    time: "4h ago",
    resource: "deploy-bot",
    resourceType: "IAM",
    changeType: "Role binding added",
    risk: "HIGH",
    memory:
      "Memory: IAM changes are flagged. deploy-bot already over-privileged (see SecOps).",
  },
  {
    time: "6h ago",
    resource: "etl-pipeline",
    resourceType: "BigQuery",
    changeType: "Query pattern changed",
    risk: "MEDIUM",
    memory:
      "Memory: New query matches pattern that caused Jul 15 cost spike.",
  },
  {
    time: "8h ago",
    resource: "process-orders",
    resourceType: "Function",
    changeType: "Min instances set to 3",
    risk: "Low",
    memory:
      "Memory: Cold start mitigation from incident 14d ago.",
  },
  {
    time: "12h ago",
    resource: "pgsql",
    resourceType: "Cloud SQL",
    changeType: "Connection pool increased",
    risk: "Low",
    memory:
      "Memory: Post-incident fix for connection exhaustion 7d ago.",
  },
  {
    time: "18h ago",
    resource: "bastion-host",
    resourceType: "VM",
    changeType: "Firewall rule updated",
    risk: "MEDIUM",
    memory:
      "Memory: Egress alert was false positive. Rule adjusted to exclude backup CIDR.",
  },
  {
    time: "1d ago",
    resource: "testhydpdf",
    resourceType: "S3",
    changeType: "Bucket policy modified",
    risk: "HIGH",
    memory:
      "Memory: This bucket has public access finding (CIS 2.1.2). Change needs review.",
  },
];

interface OrchRequest {
  ticket: string;
  request: string;
  resource: string;
  provider: string;
  estCost: string;
  risk: "Low" | "Medium" | "HIGH";
  status: string;
  memory: string;
}

const ORCH_REQUESTS: OrchRequest[] = [
  {
    ticket: "CL-36",
    request: "Provision VM",
    resource: "e2-standard-2",
    provider: "GCP",
    estCost: "$45/mo",
    risk: "Low",
    status: "Pending approval",
    memory:
      "Memory: Similar VMs provisioned 12 times. Avg approval time: 1.5h",
  },
  {
    ticket: "CL-35",
    request: "Create GCS bucket",
    resource: "Standard",
    provider: "GCP",
    estCost: "$2/mo",
    risk: "Low",
    status: "Pending",
    memory:
      "Memory: Recommend lifecycle policy at creation (FinOps learning)",
  },
  {
    ticket: "CL-34",
    request: "Add IAM role",
    resource: "Editor",
    provider: "GCP",
    estCost: "—",
    risk: "HIGH",
    status: "Pending",
    memory:
      "Memory: Editor role is over-privileged. Suggest custom role (SecOps learning)",
  },
  {
    ticket: "CL-33",
    request: "Scale Cloud Run",
    resource: "10 instances",
    provider: "GCP",
    estCost: "$120/mo",
    risk: "Medium",
    status: "Pending",
    memory:
      "Memory: Current traffic doesn’t justify 10 instances. Suggest autoscaler.",
  },
  {
    ticket: "CL-32",
    request: "Delete old snapshots",
    resource: "—",
    provider: "GCP",
    estCost: "-$8/mo",
    risk: "Low",
    status: "Completed",
    memory:
      "Memory: 14 snapshots deleted, matching FinOps recommendation",
  },
];

interface PatchRow {
  resource: string;
  type: string;
  currentVer: string;
  targetVer: string;
  severity: "Critical" | "High" | "Medium" | "Low";
  daysBehind: string;
  memory: string;
}

const PATCH_ROWS: PatchRow[] = [
  {
    resource: "clens-dev",
    type: "VM (Ubuntu)",
    currentVer: "22.04.4",
    targetVer: "22.04.5",
    severity: "Critical",
    daysBehind: "12d",
    memory:
      "Memory: Last patched during maintenance window. Requires reboot.",
  },
  {
    resource: "bastion-host",
    type: "VM (Ubuntu)",
    currentVer: "22.04.3",
    targetVer: "22.04.5",
    severity: "Critical",
    daysBehind: "28d",
    memory:
      "Memory: Patch delayed due to egress investigation. Safe to proceed now.",
  },
  {
    resource: "pgsql",
    type: "Cloud SQL",
    currentVer: "POSTGRES_17",
    targetVer: "POSTGRES_18",
    severity: "High",
    daysBehind: "45d",
    memory:
      "Memory: Major version upgrade. Tested on staging 30d ago — no issues.",
  },
  {
    resource: "connectiq",
    type: "VM (Debian)",
    currentVer: "11.9",
    targetVer: "12.0",
    severity: "Medium",
    daysBehind: "60d",
    memory:
      "Memory: Debian 12 upgrade requires app compatibility testing.",
  },
  {
    resource: "monitoring-agent",
    type: "VM",
    currentVer: "22.04.4",
    targetVer: "22.04.5",
    severity: "Low",
    daysBehind: "5d",
    memory:
      "Memory: Non-critical, scheduled for next maintenance window.",
  },
];

const DEPLOYMENT_PATTERNS = [
  "Deployments on Fridays fail 23% more than weekday average (5 incidents in 90d)",
  "Cloud Run deployments have 0% failure rate (28 consecutive successes)",
  "IAM changes correlate with 40% of security findings within 48h",
  "Average rollback time: 4 min. All rollbacks were on VM deployments.",
  "Terraform applies succeed 94% of the time. Failures: state lock conflicts (3x).",
];

interface DeployEvent {
  time: string;
  name: string;
  target: string;
  success: boolean;
  summary: string;
}

const DEPLOY_TIMELINE: DeployEvent[] = [
  { time: "Today 09:14", name: "deploy-frontend", target: "Cloud Run", success: true, summary: "v2.8.1 rolled out. 0 errors in canary." },
  { time: "Today 07:30", name: "terraform-apply", target: "Infra", success: true, summary: "Added monitoring dashboard. No drift detected." },
  { time: "Yesterday 18:45", name: "deploy-api", target: "Cloud Run", success: true, summary: "v3.2.0 with new /orders endpoint. Latency stable." },
  { time: "Yesterday 14:20", name: "patch-bastion", target: "VM", success: false, summary: "Patch failed — egress firewall blocked apt update. Rolled back." },
  { time: "Yesterday 10:00", name: "deploy-etl", target: "Dataflow", success: true, summary: "Pipeline v1.4 — added dedup stage. Throughput +12%." },
  { time: "Jul 28 16:30", name: "scale-cloud-run", target: "Cloud Run", success: true, summary: "Auto-scaled to 8 instances during traffic spike." },
  { time: "Jul 28 11:15", name: "terraform-apply", target: "Infra", success: false, summary: "State lock conflict. Resolved after 3 min retry." },
  { time: "Jul 27 09:00", name: "deploy-ml-model", target: "Vertex AI", success: true, summary: "Model v2.1 deployed. Accuracy 94.2% on validation set." },
  { time: "Jul 26 15:45", name: "deploy-frontend", target: "Cloud Run", success: true, summary: "v2.8.0 hotfix for checkout bug. MTTR: 22 min." },
  { time: "Jul 26 08:30", name: "iam-update", target: "IAM", success: true, summary: "Service account key rotated. Old key revoked." },
];

const VELOCITY_DATA = [
  { day: "Mon", count: 1120 },
  { day: "Tue", count: 980 },
  { day: "Wed", count: 2400 },
  { day: "Thu", count: 1350 },
  { day: "Fri", count: 1100 },
  { day: "Sat", count: 420 },
  { day: "Sun", count: 310 },
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function riskDot(risk: string) {
  const color =
    risk === "HIGH"
      ? "bg-red-500"
      : risk === "MEDIUM" || risk === "Medium"
      ? "bg-amber-500"
      : "bg-emerald-500";
  return <span className={`inline-block h-2.5 w-2.5 rounded-full ${color}`} />;
}

function riskBadge(risk: string) {
  const base = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium";
  if (risk === "HIGH")
    return <span className={`${base} bg-red-50 text-red-700`}>{riskDot(risk)} {risk}</span>;
  if (risk === "MEDIUM" || risk === "Medium")
    return <span className={`${base} bg-amber-50 text-amber-700`}>{riskDot(risk)} {risk}</span>;
  return <span className={`${base} bg-emerald-50 text-emerald-700`}>{riskDot(risk)} {risk}</span>;
}

function severityBadge(sev: string) {
  const base = "rounded-full px-2.5 py-0.5 text-xs font-medium";
  if (sev === "Critical") return <span className={`${base} bg-red-50 text-red-700`}>{sev}</span>;
  if (sev === "High") return <span className={`${base} bg-orange-50 text-orange-700`}>{sev}</span>;
  if (sev === "Medium") return <span className={`${base} bg-amber-50 text-amber-700`}>{sev}</span>;
  return <span className={`${base} bg-slate-100 text-slate-600`}>{sev}</span>;
}

function statusBadge(status: string) {
  const base = "rounded-full px-2.5 py-0.5 text-xs font-medium";
  if (status === "Completed")
    return <span className={`${base} bg-emerald-50 text-emerald-700`}>{status}</span>;
  if (status.includes("Pending"))
    return <span className={`${base} bg-amber-50 text-amber-700`}>{status}</span>;
  return <span className={`${base} bg-slate-100 text-slate-600`}>{status}</span>;
}

/* ------------------------------------------------------------------ */
/*  Donut chart for patch compliance                                   */
/* ------------------------------------------------------------------ */
function ComplianceDonut({ percent }: { percent: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const filled = (percent / 100) * circumference;
  const gap = circumference - filled;

  return (
    <div className="relative flex items-center justify-center">
      <svg width="140" height="140" viewBox="0 0 140 140">
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#e2e8f0" strokeWidth="12" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="#f59e0b"
          strokeWidth="12"
          strokeDasharray={`${filled} ${gap}`}
          strokeDashoffset={circumference / 4}
          strokeLinecap="round"
          className="transition-all duration-700"
        />
      </svg>
      <div className="absolute text-center">
        <span className="text-2xl font-bold text-amber-600">{percent}%</span>
        <p className="text-[10px] text-slate-500">Compliant</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Bar chart for change velocity                                      */
/* ------------------------------------------------------------------ */
function VelocityChart() {
  const max = Math.max(...VELOCITY_DATA.map((d) => d.count));

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <h3 className="mb-1 text-sm font-semibold text-slate-700">Change Velocity (7 days)</h3>
      <p className="mb-4 text-xs text-slate-500">Changes per day across all monitored resources</p>
      <div className="flex items-end gap-3" style={{ height: 120 }}>
        {VELOCITY_DATA.map((d, i) => {
          const h = (d.count / max) * 100;
          const isSpike = i === 2;
          return (
            <div key={d.day} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] font-medium text-slate-500">{d.count}</span>
              <div className="relative w-full">
                <div
                  className={`w-full rounded-t ${isSpike ? "bg-sky-500" : "bg-sky-300"}`}
                  style={{ height: `${h}px` }}
                />
                {isSpike && (
                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-sky-700 px-1.5 py-0.5 text-[9px] text-white">
                    Maintenance
                  </div>
                )}
              </div>
              <span className="text-[10px] text-slate-400">{d.day}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-slate-400 italic">
        Spike on Day 3 = scheduled maintenance window
      </p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function DevOpsIntelligencePage() {
  const [activeTab, setActiveTab] = useState<Tab>("changes");

  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* ===== Header ===== */}
      <div className="border-b border-slate-200 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
              <GitBranch className="h-5 w-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-800">DevOps Intelligence</h1>
              <p className="text-sm text-slate-500">
                Change management, deployment health &amp; patch compliance &mdash; with operational memory
              </p>
            </div>
          </div>
          <select className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 focus:border-indigo-500 focus:outline-none">
            <option>searce-sandbox</option>
            <option>production-org</option>
          </select>
        </div>
      </div>

      {/* ===== Stats Row ===== */}
      <div className="grid grid-cols-5 gap-4 border-b border-slate-200 px-6 py-4">
        {/* Changes (24h) */}
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-medium text-slate-500">Changes (24h)</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">8,452</p>
          <p className="mt-0.5 text-xs text-slate-400">4,228 new resources</p>
        </div>
        {/* Deployments (7d) */}
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-medium text-slate-500">Deployments (7d)</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">47</p>
          <p className="mt-0.5 text-xs text-emerald-600">0 failures</p>
        </div>
        {/* Patch Compliance */}
        <div className="rounded-lg border border-amber-200 bg-amber-50/40 px-4 py-3">
          <p className="text-xs font-medium text-slate-500">Patch Compliance</p>
          <p className="mt-1 text-2xl font-bold text-amber-600">78%</p>
          <p className="mt-0.5 text-xs text-amber-600">3 critical pending</p>
        </div>
        {/* Orchestration Queue */}
        <div className="rounded-lg border border-slate-200 bg-white px-4 py-3">
          <p className="text-xs font-medium text-slate-500">Orchestration Queue</p>
          <p className="mt-1 text-2xl font-bold text-slate-800">4 pending</p>
          <p className="mt-0.5 text-xs text-slate-400">oldest: 2h</p>
        </div>
        {/* Memory insight */}
        <div className="rounded-lg border border-blue-200 bg-blue-50/50 px-4 py-3">
          <div className="flex items-center gap-1.5">
            <Brain className="h-3.5 w-3.5 text-blue-600" />
            <p className="text-xs font-medium text-blue-600">Memory</p>
          </div>
          <p className="mt-1 text-sm font-semibold text-blue-800">
            Friday deploys fail 23% more
          </p>
          <p className="mt-0.5 text-xs text-blue-500">Based on 90-day analysis</p>
        </div>
      </div>

      {/* ===== Tabs ===== */}
      <div className="border-b border-slate-200 px-6">
        <div className="flex gap-0">
          {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-3 text-sm font-medium transition-colors ${
                activeTab === tab
                  ? "border-b-2 border-indigo-500 text-indigo-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>
      </div>

      {/* ===== Tab Content ===== */}
      <div className="p-6">
        {activeTab === "changes" && <ChangesTab />}
        {activeTab === "orchestration" && <OrchestrationTab />}
        {activeTab === "patch" && <PatchTab />}
        {activeTab === "memory" && <MemoryTab />}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  CHANGE INTELLIGENCE TAB                                            */
/* ================================================================== */
function ChangesTab() {
  return (
    <div className="space-y-6">
      {/* Pattern Alert */}
      <div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-5 py-4">
        <Brain className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
        <div>
          <p className="text-sm font-semibold text-blue-800">Memory: Deployment Risk Assessment</p>
          <p className="mt-0.5 text-sm text-blue-700">
            Friday deployments have a 23% higher failure rate based on 90 days of data.
            Today is Wednesday &mdash; <span className="font-semibold">low risk window</span>.
          </p>
        </div>
      </div>

      {/* Risk-Scored Changes */}
      <div className="rounded-lg border border-slate-200">
        <div className="border-b border-slate-200 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-700">Risk-Scored Changes</h2>
          <p className="text-xs text-slate-400">
            Every change is scored by risk with historical Memory context
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Time</th>
                <th className="px-5 py-3">Resource</th>
                <th className="px-5 py-3">Change Type</th>
                <th className="px-5 py-3">Risk Score</th>
                <th className="px-5 py-3">Memory Context</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {CHANGES.map((c, i) => (
                <tr key={i} className="hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-5 py-3 text-slate-500">{c.time}</td>
                  <td className="px-5 py-3">
                    <span className="font-medium text-slate-800">{c.resource}</span>
                    <span className="ml-1.5 text-xs text-slate-400">({c.resourceType})</span>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{c.changeType}</td>
                  <td className="px-5 py-3">{riskBadge(c.risk)}</td>
                  <td className="max-w-xs px-5 py-3">
                    <div className="flex items-start gap-1.5">
                      <Brain className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-400" />
                      <span className="text-xs leading-relaxed text-blue-700">{c.memory}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Change Velocity */}
      <VelocityChart />
    </div>
  );
}

/* ================================================================== */
/*  ORCHESTRATION TAB                                                  */
/* ================================================================== */
function OrchestrationTab() {
  return (
    <div className="space-y-6">
      {/* Queue Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-slate-200 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-amber-600">4</p>
          <p className="text-xs text-slate-500">Pending</p>
        </div>
        <div className="rounded-lg border border-slate-200 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-emerald-600">8</p>
          <p className="text-xs text-slate-500">Completed this week</p>
        </div>
        <div className="rounded-lg border border-slate-200 px-4 py-3 text-center">
          <p className="text-2xl font-bold text-slate-400">7</p>
          <p className="text-xs text-slate-500">Failed (historical)</p>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-5 py-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <span className="text-sm font-medium text-amber-800">
            4 requests waiting for approval
          </span>
        </div>
        <button className="flex items-center gap-1 text-sm font-semibold text-amber-700 hover:text-amber-900">
          Review <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Request Table */}
      <div className="rounded-lg border border-slate-200">
        <div className="border-b border-slate-200 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-700">Orchestration Requests</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Ticket</th>
                <th className="px-5 py-3">Request</th>
                <th className="px-5 py-3">Resource</th>
                <th className="px-5 py-3">Provider</th>
                <th className="px-5 py-3">Est. Cost</th>
                <th className="px-5 py-3">Risk</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Memory</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ORCH_REQUESTS.map((r, i) => (
                <tr key={i} className="hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-5 py-3 font-mono text-xs font-semibold text-indigo-600">
                    {r.ticket}
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-800">{r.request}</td>
                  <td className="px-5 py-3 text-slate-600">{r.resource}</td>
                  <td className="px-5 py-3">
                    <span className="rounded bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                      {r.provider}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-slate-600">{r.estCost}</td>
                  <td className="px-5 py-3">{riskBadge(r.risk)}</td>
                  <td className="px-5 py-3">{statusBadge(r.status)}</td>
                  <td className="max-w-xs px-5 py-3">
                    <div className="flex items-start gap-1.5">
                      <Brain className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-400" />
                      <span className="text-xs leading-relaxed text-blue-700">{r.memory}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  PATCH COMPLIANCE TAB                                               */
/* ================================================================== */
function PatchTab() {
  return (
    <div className="space-y-6">
      {/* Top stats */}
      <div className="grid grid-cols-12 gap-6">
        {/* Donut */}
        <div className="col-span-3 flex flex-col items-center justify-center rounded-lg border border-slate-200 py-6">
          <ComplianceDonut percent={78} />
          <p className="mt-2 text-xs font-medium text-slate-500">Compliance Score</p>
        </div>

        {/* Summary cards */}
        <div className="col-span-9 grid grid-cols-4 gap-4">
          <div className="rounded-lg border border-slate-200 px-4 py-4 text-center">
            <p className="text-2xl font-bold text-slate-800">23</p>
            <p className="text-xs text-slate-500">Total Instances</p>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/40 px-4 py-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">18</p>
            <p className="text-xs text-emerald-600">Compliant</p>
          </div>
          <div className="rounded-lg border border-red-200 bg-red-50/40 px-4 py-4 text-center">
            <p className="text-2xl font-bold text-red-600">5</p>
            <p className="text-xs text-red-600">Non-compliant</p>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50/40 px-4 py-4 text-center">
            <p className="text-2xl font-bold text-amber-600">3</p>
            <p className="text-xs text-amber-600">Critical Patches Pending</p>
          </div>
        </div>
      </div>

      {/* Non-compliant Resources */}
      <div className="rounded-lg border border-slate-200">
        <div className="border-b border-slate-200 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-700">Non-compliant Resources</h2>
          <p className="text-xs text-slate-400">
            Resources behind on patches with Memory context for each
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left text-xs font-medium uppercase tracking-wider text-slate-500">
                <th className="px-5 py-3">Resource</th>
                <th className="px-5 py-3">Type</th>
                <th className="px-5 py-3">Current Version</th>
                <th className="px-5 py-3">Target</th>
                <th className="px-5 py-3">Severity</th>
                <th className="px-5 py-3">Days Behind</th>
                <th className="px-5 py-3">Memory</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {PATCH_ROWS.map((p, i) => (
                <tr key={i} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3 font-medium text-slate-800">{p.resource}</td>
                  <td className="px-5 py-3 text-slate-600">{p.type}</td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-600">{p.currentVer}</td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-600">{p.targetVer}</td>
                  <td className="px-5 py-3">{severityBadge(p.severity)}</td>
                  <td className="px-5 py-3 font-medium text-slate-600">{p.daysBehind}</td>
                  <td className="max-w-xs px-5 py-3">
                    <div className="flex items-start gap-1.5">
                      <Brain className="mt-0.5 h-3.5 w-3.5 shrink-0 text-blue-400" />
                      <span className="text-xs leading-relaxed text-blue-700">{p.memory}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  DEPLOYMENT MEMORY TAB                                              */
/* ================================================================== */
function MemoryTab() {
  return (
    <div className="space-y-6">
      {/* Deployment Patterns */}
      <div className="rounded-lg border border-blue-200 bg-blue-50/30">
        <div className="border-b border-blue-200 px-5 py-3">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-blue-600" />
            <h2 className="text-sm font-semibold text-blue-800">Deployment Patterns</h2>
          </div>
          <p className="text-xs text-blue-500">Insights extracted from deployment history</p>
        </div>
        <div className="divide-y divide-blue-100">
          {DEPLOYMENT_PATTERNS.map((pattern, i) => (
            <div key={i} className="flex items-start gap-3 px-5 py-3">
              <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-600">
                {i + 1}
              </div>
              <p className="text-sm text-blue-800">{pattern}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Deployment Outcomes */}
      <div className="rounded-lg border border-slate-200">
        <div className="border-b border-slate-200 px-5 py-3">
          <h2 className="text-sm font-semibold text-slate-700">Recent Deployment Outcomes</h2>
          <p className="text-xs text-slate-400">Last 10 deployments with status and summaries</p>
        </div>
        <div className="divide-y divide-slate-100">
          {DEPLOY_TIMELINE.map((d, i) => (
            <div key={i} className="flex items-start gap-4 px-5 py-3">
              {/* Timeline dot */}
              <div className="flex flex-col items-center pt-1">
                {d.success ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500" />
                )}
                {i < DEPLOY_TIMELINE.length - 1 && (
                  <div className="mt-1 h-6 w-px bg-slate-200" />
                )}
              </div>
              {/* Content */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-slate-800">{d.name}</span>
                  <span className="rounded bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                    {d.target}
                  </span>
                  <span className="text-xs text-slate-400">{d.time}</span>
                </div>
                <p className="mt-0.5 text-xs text-slate-500">{d.summary}</p>
              </div>
              {/* Status */}
              <div className="shrink-0">
                {d.success ? (
                  <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                    Success
                  </span>
                ) : (
                  <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                    Failed
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
