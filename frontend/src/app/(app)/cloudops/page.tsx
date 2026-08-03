"use client";

import { useState } from "react";
import { useApiData } from "@/lib/api";
import type { VmInstance, Incident, ServerlessFunction, Pipeline } from "@/lib/api";

type WorkloadTab = "all" | "compute" | "kubernetes" | "databases" | "serverless" | "data-ai";
type SubTab = "overview" | "analysis";
type AnalysisCategory = "security" | "cost" | "performance" | "reliability";

const WORKLOAD_LABELS: Record<WorkloadTab, string> = {
  all: "All Workloads",
  compute: "Compute / VMs",
  kubernetes: "Kubernetes",
  databases: "Databases",
  serverless: "Serverless",
  "data-ai": "Data & AI",
};

const WORKLOAD_ANALYSIS_NAMES: Record<WorkloadTab, string> = {
  all: "workloads",
  compute: "compute instances",
  kubernetes: "kubernetes clusters",
  databases: "databases",
  serverless: "serverless functions",
  "data-ai": "data & AI pipelines",
};

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */
export default function CloudOpsIntelligencePage() {
  const [topTab, setTopTab] = useState<WorkloadTab>("all");
  const [subTab, setSubTab] = useState<SubTab>("overview");
  const [analysisCategory, setAnalysisCategory] = useState<AnalysisCategory>("security");
  const [expandedInstance, setExpandedInstance] = useState<string | null>("pgsql");

  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* ===== Header ===== */}
      <div className="border-b border-slate-200 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-600">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-800">CloudOps Intelligence</h1>
              <p className="text-sm text-slate-500">
                Unified operations view across all cloud workloads — VMs, Kubernetes, Databases, Serverless, Data &amp; AI
              </p>
            </div>
          </div>
          <select className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 focus:border-sky-500 focus:outline-none">
            <option>searce-sandbox</option>
            <option>production-org</option>
          </select>
        </div>
      </div>

      {/* ===== Workload Tabs ===== */}
      <div className="border-b border-slate-200 px-6">
        <div className="flex gap-0">
          {(Object.keys(WORKLOAD_LABELS) as WorkloadTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => { setTopTab(tab); setSubTab("overview"); }}
              className={`px-5 py-3 text-sm font-medium transition-colors ${
                topTab === tab
                  ? "border-b-2 border-sky-500 text-sky-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {WORKLOAD_LABELS[tab]}
            </button>
          ))}
        </div>
      </div>

      {/* ===== Sub Tabs ===== */}
      <div className="border-b border-slate-200 px-6">
        <div className="flex gap-0">
          {(["overview", "analysis"] as SubTab[]).map((st) => (
            <button
              key={st}
              onClick={() => setSubTab(st)}
              className={`px-5 py-3 text-sm font-medium capitalize transition-colors ${
                subTab === st
                  ? "border-b-2 border-sky-500 text-sky-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* ===== Content ===== */}
      <div className="p-6">
        {/* ---------- ANALYSIS (shared across all tabs) ---------- */}
        {subTab === "analysis" && (
          <AnalysisView
            workloadKey={topTab}
            analysisCategory={analysisCategory}
            setAnalysisCategory={setAnalysisCategory}
          />
        )}

        {/* ---------- ALL WORKLOADS > OVERVIEW ---------- */}
        {topTab === "all" && subTab === "overview" && <AllWorkloadsOverview />}

        {/* ---------- COMPUTE > OVERVIEW ---------- */}
        {topTab === "compute" && subTab === "overview" && <ComputeOverview />}

        {/* ---------- KUBERNETES > OVERVIEW ---------- */}
        {topTab === "kubernetes" && subTab === "overview" && <KubernetesOverview />}

        {/* ---------- DATABASES > OVERVIEW ---------- */}
        {topTab === "databases" && subTab === "overview" && (
          <DatabasesOverview
            expandedInstance={expandedInstance}
            setExpandedInstance={setExpandedInstance}
          />
        )}

        {/* ---------- SERVERLESS > OVERVIEW ---------- */}
        {topTab === "serverless" && subTab === "overview" && <ServerlessOverview />}

        {/* ---------- DATA & AI > OVERVIEW ---------- */}
        {topTab === "data-ai" && subTab === "overview" && <DataAiOverview />}
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Shared: Analysis View                                              */
/* ================================================================== */
function AnalysisView({
  workloadKey,
  analysisCategory,
  setAnalysisCategory,
}: {
  workloadKey: WorkloadTab;
  analysisCategory: AnalysisCategory;
  setAnalysisCategory: (c: AnalysisCategory) => void;
}) {
  const categories: { key: AnalysisCategory; label: string; activeClasses: string; icon: React.ReactNode }[] = [
    {
      key: "security",
      label: "Security",
      activeClasses: "bg-red-50 text-red-600 ring-1 ring-red-200",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
    },
    {
      key: "cost",
      label: "Cost",
      activeClasses: "bg-amber-50 text-amber-600 ring-1 ring-amber-200",
      icon: <span className="text-sm font-semibold">$</span>,
    },
    {
      key: "performance",
      label: "Performance",
      activeClasses: "bg-blue-50 text-blue-600 ring-1 ring-blue-200",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
    },
    {
      key: "reliability",
      label: "Reliability",
      activeClasses: "bg-green-50 text-green-600 ring-1 ring-green-200",
      icon: (
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      ),
    },
  ];

  const catLabel = analysisCategory.charAt(0).toUpperCase() + analysisCategory.slice(1);

  return (
    <div>
      {/* Pills */}
      <div className="mb-8 flex gap-2">
        {categories.map((c) => (
          <button
            key={c.key}
            onClick={() => setAnalysisCategory(c.key)}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              analysisCategory === c.key ? c.activeClasses : "bg-slate-100 text-slate-500 hover:bg-slate-200"
            }`}
          >
            {c.icon}
            {c.label}
          </button>
        ))}
      </div>

      {/* Empty state */}
      <div className="flex flex-col items-center justify-center py-24">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
          <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        </div>
        <h2 className="mb-2 text-lg font-semibold text-slate-700">{catLabel} Analysis</h2>
        <p className="mb-6 text-center text-sm text-slate-500">
          AI will analyse your {WORKLOAD_ANALYSIS_NAMES[workloadKey]} and generate prioritised findings.
        </p>
        <button className="rounded-lg bg-sky-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-sky-700">
          Run {catLabel} Analysis
        </button>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Shared small components                                            */
/* ================================================================== */
function StatCard({ label, value, sub, borderColor }: { label: string; value: string; sub?: string; borderColor?: string }) {
  return (
    <div className={`rounded-lg border bg-white p-4 ${borderColor ?? "border-slate-200"}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-800">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400">{children}</h3>;
}

function IncidentRow({
  time, workload, resource, issue, resolution, duration, status, statusColor,
}: {
  time: string; workload: string; resource: string; issue: string; resolution: string; duration: string; status: string; statusColor: string;
}) {
  return (
    <tr className="border-b border-slate-100 last:border-0">
      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">{time}</td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">{workload}</td>
      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-700">{resource}</td>
      <td className="px-4 py-3 text-sm text-slate-600">{issue}</td>
      <td className="px-4 py-3 text-sm text-slate-500">{resolution}</td>
      <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">{duration}</td>
      <td className="whitespace-nowrap px-4 py-3">
        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${statusColor}`}>
          {status}
        </span>
      </td>
    </tr>
  );
}

/* ================================================================== */
/*  ALL WORKLOADS > OVERVIEW                                           */
/* ================================================================== */
function AllWorkloadsOverview() {
  const { data: incidents } = useApiData<Incident[]>("/cloudops/incidents", []);
  return (
    <div className="space-y-8">
      {/* 1. Operational Health Score */}
      <div>
        <SectionHeading>Operational Health Score</SectionHeading>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Overall Health */}
          <div className="flex items-center gap-4 rounded-lg border border-slate-200 bg-white p-5">
            <svg viewBox="0 0 36 36" className="h-14 w-14 flex-shrink-0">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="#e2e8f0" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.9" fill="none" stroke="#22c55e" strokeWidth="3"
                strokeDasharray="94 6" strokeDashoffset="25" strokeLinecap="round"
              />
              <text x="18" y="20" textAnchor="middle" className="fill-slate-800 text-[8px] font-bold">94</text>
            </svg>
            <div>
              <p className="text-sm text-slate-500">Overall Health</p>
              <p className="text-2xl font-bold text-slate-800">94<span className="text-sm font-normal text-slate-400">/100</span></p>
              <p className="text-xs text-green-600">All systems operational</p>
            </div>
          </div>

          {/* Uptime */}
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Uptime (30d)</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">99.94%</p>
            <p className="mt-0.5 text-xs text-slate-400">2 incidents, 26 min total downtime</p>
          </div>

          {/* MTTR */}
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">MTTR</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">13 min</p>
            <p className="mt-0.5 text-xs text-green-600">Improved 22% from last month</p>
          </div>

          {/* Open Issues */}
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">Open Issues</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">7</p>
            <p className="mt-0.5 text-xs text-slate-400">3 critical, 2 high, 2 medium</p>
          </div>
        </div>
      </div>

      {/* 2. Workload Health Grid */}
      <div>
        <SectionHeading>Workload Health Grid</SectionHeading>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {/* Compute / VMs */}
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-semibold text-slate-700">Compute / VMs</h4>
              <span className="text-sm font-medium text-slate-500">$368/mo</span>
            </div>
            <div className="mb-2 flex items-center gap-3 text-sm">
              <span className="text-slate-600">23 instances</span>
              <span className="flex items-center gap-1 text-green-600"><span className="inline-block h-2 w-2 rounded-full bg-green-500" /> 21 healthy</span>
              <span className="flex items-center gap-1 text-amber-600"><span className="inline-block h-2 w-2 rounded-full bg-amber-400" /> 2 warning</span>
            </div>
            <p className="text-xs text-slate-400">Last incident: CPU spike on clens-dev (3d ago, auto-resolved)</p>
          </div>

          {/* Kubernetes */}
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-5">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-semibold text-slate-700">Kubernetes</h4>
            </div>
            <p className="mb-1 text-sm text-slate-500">0 clusters</p>
            <p className="text-xs text-slate-400">No clusters discovered</p>
            <p className="mt-1 text-xs text-sky-600">Run scan to discover EKS/GKE clusters</p>
          </div>

          {/* Databases */}
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-semibold text-slate-700">Databases</h4>
              <span className="text-sm font-medium text-slate-500">$15/mo</span>
            </div>
            <div className="mb-2 flex items-center gap-3 text-sm">
              <span className="text-slate-600">1 instance</span>
              <span className="flex items-center gap-1 text-green-600"><span className="inline-block h-2 w-2 rounded-full bg-green-500" /> 1 healthy</span>
            </div>
            <p className="text-xs text-slate-400">Last incident: Connection pool exhaustion (7d ago, resolved)</p>
          </div>

          {/* Serverless */}
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-semibold text-slate-700">Serverless</h4>
              <span className="text-sm font-medium text-slate-500">$86/mo</span>
            </div>
            <div className="mb-2 flex items-center gap-3 text-sm">
              <span className="text-slate-600">12 functions</span>
              <span className="flex items-center gap-1 text-green-600"><span className="inline-block h-2 w-2 rounded-full bg-green-500" /> 12 healthy</span>
            </div>
            <p className="text-xs text-slate-400">Last incident: Cold start latency &gt;2s (14d ago, mitigated with min instances)</p>
          </div>

          {/* Data & AI */}
          <div className="rounded-lg border border-slate-200 bg-white p-5">
            <div className="mb-3 flex items-center justify-between">
              <h4 className="font-semibold text-slate-700">Data &amp; AI</h4>
              <span className="text-sm font-medium text-slate-500">$28/mo</span>
            </div>
            <div className="mb-2 flex items-center gap-3 text-sm">
              <span className="text-slate-600">3 pipelines</span>
              <span className="flex items-center gap-1 text-green-600"><span className="inline-block h-2 w-2 rounded-full bg-green-500" /> 2 healthy</span>
              <span className="flex items-center gap-1 text-amber-600"><span className="inline-block h-2 w-2 rounded-full bg-amber-400" /> 1 warning</span>
            </div>
            <p className="text-xs text-slate-400">Last incident: BigQuery slot exhaustion (5d ago, auto-scaled)</p>
          </div>
        </div>
      </div>

      {/* 3. Operational Memory -- Recent Incidents */}
      <div>
        <SectionHeading>Operational Memory — Recent Incidents</SectionHeading>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Time</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Workload</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Resource</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Issue</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Resolution</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Duration</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
              </tr>
            </thead>
            <tbody>
              {incidents.map((inc, i) => (
                <IncidentRow
                  key={i}
                  time={inc.time} workload={inc.workload} resource={inc.resource}
                  issue={inc.issue} resolution={inc.resolution}
                  duration={inc.duration} status={inc.status} statusColor={inc.statusColor}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. What's Working Well */}
      <div>
        <SectionHeading>What&apos;s Working Well</SectionHeading>
        <div className="rounded-lg border border-green-200 bg-green-50 p-5">
          <ul className="space-y-2 text-sm text-green-800">
            <li className="flex items-start gap-2">
              <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              22 of 23 VMs within CPU/memory thresholds
            </li>
            <li className="flex items-start gap-2">
              <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              All databases encrypted at rest
            </li>
            <li className="flex items-start gap-2">
              <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              Zero security findings on serverless workloads
            </li>
            <li className="flex items-start gap-2">
              <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
              BigQuery costs down 15% after query optimization (from incident #2)
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  COMPUTE / VMs > OVERVIEW                                           */
/* ================================================================== */
function ComputeOverview() {
  const { data: vmInstances } = useApiData<VmInstance[]>("/cloudops/compute-instances", []);
  return (
    <div className="space-y-8">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Instances" value="23" />
        <StatCard label="Status" value="21 / 2" sub="Running / Stopped" />
        <StatCard label="Monthly Cost" value="$368" borderColor="border-green-200" />
        <StatCard label="Avg CPU" value="42%" />
        <StatCard label="Avg Memory" value="61%" />
        <StatCard label="Public IPs" value="0" sub="All private" />
      </div>

      {/* Instance table */}
      <div>
        <SectionHeading>Instance Inventory</SectionHeading>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Name</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Type</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Zone</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">CPU %</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Memory %</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Cost/mo</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Last Incident</th>
              </tr>
            </thead>
            <tbody>
              {vmInstances.map((vm) => (
                <tr key={vm.name} className="border-b border-slate-100 last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-700">{vm.name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">{vm.type}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">{vm.zone}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-slate-100">
                        <div
                          className={`h-1.5 rounded-full ${vm.cpu > 80 ? "bg-red-400" : vm.cpu > 60 ? "bg-amber-400" : "bg-green-400"}`}
                          style={{ width: `${vm.cpu}%` }}
                        />
                      </div>
                      {vm.cpu}%
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-slate-100">
                        <div
                          className={`h-1.5 rounded-full ${vm.memory > 80 ? "bg-red-400" : vm.memory > 60 ? "bg-amber-400" : "bg-green-400"}`}
                          style={{ width: `${vm.memory}%` }}
                        />
                      </div>
                      {vm.memory}%
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      vm.status === "healthy"
                        ? "bg-green-50 text-green-700"
                        : vm.status === "warning"
                        ? "bg-amber-50 text-amber-700"
                        : "bg-slate-100 text-slate-500"
                    }`}>
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${
                        vm.status === "healthy" ? "bg-green-500" : vm.status === "warning" ? "bg-amber-400" : "bg-slate-400"
                      }`} />
                      {vm.status === "healthy" ? "Running" : vm.status === "warning" ? "Warning" : "Stopped"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">{vm.cost}</td>
                  <td className="px-4 py-3 text-sm text-slate-400">{vm.lastIncident}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Operational Memory */}
      <div>
        <SectionHeading>Operational Memory</SectionHeading>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 space-y-3">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-block rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">Resolved</span>
            <div>
              <p className="text-sm text-slate-700"><span className="font-medium">3d ago</span> — CPU utilization 95% sustained on <span className="font-medium">clens-dev</span></p>
              <p className="text-xs text-slate-400">Auto-scaled to e2-standard-4, load balanced. Duration: 8 min.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-block rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">False positive</span>
            <div>
              <p className="text-sm text-slate-700"><span className="font-medium">21d ago</span> — Network egress anomaly 170k+ on <span className="font-medium">bastion-host</span></p>
              <p className="text-xs text-slate-400">Traffic analyzed — legitimate backup job, alert threshold adjusted. Duration: 4 min.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  KUBERNETES > OVERVIEW                                              */
/* ================================================================== */
function KubernetesOverview() {
  return (
    <div className="flex flex-col items-center justify-center py-32">
      <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
        <svg className="h-8 w-8 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
        </svg>
      </div>
      <h2 className="mb-2 text-lg font-semibold text-slate-700">No Kubernetes clusters found</h2>
      <p className="text-sm text-slate-500">Run an asset scan to discover EKS and GKE clusters.</p>
    </div>
  );
}

/* ================================================================== */
/*  DATABASES > OVERVIEW                                               */
/* ================================================================== */
function DatabasesOverview({
  expandedInstance,
  setExpandedInstance,
}: {
  expandedInstance: string | null;
  setExpandedInstance: (v: string | null) => void;
}) {
  return (
    <div className="space-y-8">
      {/* Stat Tiles */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Instances" value="1" />
        <StatCard label="Monthly Cost" value="$15" borderColor="border-green-200" />
        <StatCard label="Open Findings" value="2" borderColor="border-red-200" />
        <StatCard label="Total Storage" value="10 GB" borderColor="border-blue-200" />
        <StatCard label="Multi-AZ" value="0" sub="HA configured" />
        <StatCard label="Public Access" value="0" sub="All private" />
      </div>

      {/* Progress Bars */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Encrypted at rest", ratio: "1/1", pct: 100, color: "bg-green-500" },
          { label: "Multi-AZ / Regional", ratio: "0/1", pct: 0, color: "bg-amber-500" },
          { label: "PITR enabled", ratio: "0/1", pct: 0, color: "bg-amber-500" },
          { label: "Pending maintenance", ratio: "0/1", pct: 0, color: "bg-amber-500" },
        ].map((bar) => (
          <div key={bar.label} className="rounded-lg border border-slate-200 bg-white p-4">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm text-slate-600">{bar.label}</span>
              <span className={`text-sm font-medium ${bar.pct === 100 ? "text-green-600" : "text-slate-400"}`}>{bar.ratio}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100">
              <div className={`h-2 rounded-full ${bar.color}`} style={{ width: `${bar.pct}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Instance Overview */}
      <div>
        <SectionHeading>Instance Overview</SectionHeading>
        <div className="rounded-lg border border-slate-200 bg-white">
          <button
            onClick={() => setExpandedInstance(expandedInstance === "pgsql" ? null : "pgsql")}
            className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-slate-50"
          >
            <div className="flex items-center gap-3">
              <svg
                className={`h-4 w-4 text-slate-400 transition-transform ${expandedInstance === "pgsql" ? "rotate-90" : ""}`}
                fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
              <div>
                <p className="font-medium text-slate-800">pgsql</p>
                <p className="text-xs text-slate-400">GCP &middot; POSTGRES_18 &middot; db-f1-micro &middot; ZONAL</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-green-600">$15/mo</span>
              <span className="rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-600">2 findings</span>
            </div>
          </button>

          {expandedInstance === "pgsql" && (
            <div className="border-t border-slate-200 bg-slate-50 px-5 py-4">
              <div className="ml-7 grid grid-cols-3 gap-4">
                <div className="rounded-md border border-slate-200 bg-white p-3">
                  <p className="text-xs text-slate-400">Security</p>
                  <p className="mt-1 text-lg font-bold text-slate-800">2<span className="text-sm font-normal text-slate-400">/8</span></p>
                </div>
                <div className="rounded-md border border-slate-200 bg-white p-3">
                  <p className="text-xs text-slate-400">HA / DR</p>
                  <p className="mt-1 text-lg font-bold text-slate-800">0<span className="text-sm font-normal text-slate-400">/4</span></p>
                </div>
                <div className="rounded-md border border-slate-200 bg-white p-3">
                  <p className="text-xs text-slate-400">Findings</p>
                  <p className="mt-1 text-lg font-bold text-red-500">2</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Operational Memory */}
      <div>
        <SectionHeading>Operational Memory</SectionHeading>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-block rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">Resolved</span>
            <div>
              <p className="text-sm text-slate-700"><span className="font-medium">7d ago</span> — Connection pool max (100) hit on <span className="font-medium">pgsql</span></p>
              <p className="text-xs text-slate-400">Pool size increased to 200, connection leak fixed in application code. Duration: 18 min.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  SERVERLESS > OVERVIEW                                              */
/* ================================================================== */
function ServerlessOverview() {
  const { data: serverlessFunctions } = useApiData<ServerlessFunction[]>("/cloudops/serverless", []);
  return (
    <div className="space-y-8">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Functions" value="12" />
        <StatCard label="Health" value="All Healthy" borderColor="border-green-200" />
        <StatCard label="Monthly Cost" value="$86" borderColor="border-green-200" />
        <StatCard label="Avg Latency" value="145ms" />
        <StatCard label="P99 Latency" value="820ms" />
        <StatCard label="Errors (24h)" value="0" sub="No errors" />
      </div>

      {/* Function list */}
      <div>
        <SectionHeading>Function Inventory</SectionHeading>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Name</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Runtime</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Region</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Invocations (24h)</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Avg Latency</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Error Rate</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Cost/mo</th>
              </tr>
            </thead>
            <tbody>
              {serverlessFunctions.map((fn) => (
                <tr key={fn.name} className="border-b border-slate-100 last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-700">{fn.name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">{fn.runtime}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">{fn.region}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">{fn.invocations}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">{fn.avgLatency}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">{fn.errorRate}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">{fn.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Operational Memory */}
      <div>
        <SectionHeading>Operational Memory</SectionHeading>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-block rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">Mitigated</span>
            <div>
              <p className="text-sm text-slate-700"><span className="font-medium">14d ago</span> — Cold start &gt;2s (p99) on <span className="font-medium">process-orders</span></p>
              <p className="text-xs text-slate-400">Min instances set to 3, memory increased to 512MB. Configuration change — no downtime.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  DATA & AI > OVERVIEW                                               */
/* ================================================================== */
function DataAiOverview() {
  const { data: pipelines } = useApiData<Pipeline[]>("/cloudops/pipelines", []);
  return (
    <div className="space-y-8">
      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Pipelines" value="3" />
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-sm text-slate-500">Health</p>
          <div className="mt-1 flex items-center gap-2">
            <span className="flex items-center gap-1 text-sm font-bold text-green-600"><span className="inline-block h-2 w-2 rounded-full bg-green-500" /> 2</span>
            <span className="flex items-center gap-1 text-sm font-bold text-amber-600"><span className="inline-block h-2 w-2 rounded-full bg-amber-400" /> 1</span>
          </div>
          <p className="mt-0.5 text-xs text-slate-400">Healthy / Warning</p>
        </div>
        <StatCard label="BigQuery Datasets" value="2" />
        <StatCard label="Vertex AI Endpoints" value="1" />
        <StatCard label="Monthly Cost" value="$28" borderColor="border-green-200" />
        <StatCard label="Data Processed (30d)" value="1.8 TB" />
      </div>

      {/* Pipeline list */}
      <div>
        <SectionHeading>Pipeline Inventory</SectionHeading>
        <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Pipeline</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Type</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Last Run</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Duration</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Status</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Next Run</th>
                <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Cost/mo</th>
              </tr>
            </thead>
            <tbody>
              {pipelines.map((p) => (
                <tr key={p.name} className="border-b border-slate-100 last:border-0">
                  <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-700">{p.name}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">{p.type}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">{p.lastRun}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">{p.duration}</td>
                  <td className="whitespace-nowrap px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      p.status === "healthy" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                    }`}>
                      <span className={`inline-block h-1.5 w-1.5 rounded-full ${
                        p.status === "healthy" ? "bg-green-500" : "bg-amber-400"
                      }`} />
                      {p.status === "healthy" ? "Healthy" : "Warning"}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">{p.nextRun}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">{p.cost}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Operational Memory */}
      <div>
        <SectionHeading>Operational Memory</SectionHeading>
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-5">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 inline-block rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">Resolved</span>
            <div>
              <p className="text-sm text-slate-700"><span className="font-medium">5d ago</span> — BigQuery slot exhaustion during ETL on <span className="font-medium">etl-daily</span></p>
              <p className="text-xs text-slate-400">Autoscaling slots enabled, query optimized to reduce shuffle. Duration: 22 min.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
