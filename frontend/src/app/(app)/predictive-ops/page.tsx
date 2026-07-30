"use client";

import { useState } from "react";
import {
  Zap,
  ChevronDown,
  Clock,
  AlertTriangle,
  TrendingUp,
  Activity,
  Shield,
  ArrowUpRight,
  Info,
} from "lucide-react";

const orgs = ["searce-playground", "searce-prod", "searce-staging"];

interface RiskItem {
  id: number;
  instance: string;
  metric: string;
  status: "NORMAL" | "CRITICAL" | "WARNING";
  breachTime?: string;
  description: string;
  trendPercent: string;
  trendDirection: "up" | "down";
}

const risks: RiskItem[] = [
  {
    id: 1,
    instance: "clens-dev",
    metric: "CPU",
    status: "NORMAL",
    breachTime: "22.2d",
    description:
      "CPU Utilisation is 39.4% (within normal range). Predicted to breach 80.0% in ~22.2 days.",
    trendPercent: "+3.6%/d",
    trendDirection: "up",
  },
  {
    id: 2,
    instance: "cloudlens-dev-new",
    metric: "CPU",
    status: "NORMAL",
    breachTime: "22.7d",
    description:
      "CPU Utilisation is 38.8% (within normal range). Predicted to breach 80.0% in ~22.7 days.",
    trendPercent: "+3.5%/d",
    trendDirection: "up",
  },
  {
    id: 3,
    instance: "connectiq",
    metric: "CPU",
    status: "NORMAL",
    breachTime: "22.7d",
    description:
      "CPU Utilisation is 38.9% (within normal range). Predicted to breach 80.0% in ~22.7 days.",
    trendPercent: "+3.5%/d",
    trendDirection: "up",
  },
  {
    id: 4,
    instance: "cl-icore",
    metric: "CPU",
    status: "NORMAL",
    breachTime: "22.9d",
    description:
      "CPU Utilisation is 38.5% (within normal range). Predicted to breach 80.0% in ~22.9 days.",
    trendPercent: "+3.5%/d",
    trendDirection: "up",
  },
  {
    id: 5,
    instance: "Bastion-Host",
    metric: "Network Out",
    status: "CRITICAL",
    description:
      "Network Egress is critically anomalous at 170485.00 (3.3σ from baseline 142054.25).",
    trendPercent: "+2.9%/d",
    trendDirection: "up",
  },
];

const heatmapData = [
  { instance: "clens-dev", cpu: "normal", memory: "normal", diskRead: "normal", diskWrite: "normal", networkIn: "normal", networkOut: "normal" },
  { instance: "cloudlens-dev-new", cpu: "normal", memory: "normal", diskRead: "normal", diskWrite: "normal", networkIn: "normal", networkOut: "normal" },
  { instance: "connectiq", cpu: "normal", memory: "normal", diskRead: "nodata", diskWrite: "nodata", networkIn: "normal", networkOut: "normal" },
  { instance: "cl-icore", cpu: "normal", memory: "normal", diskRead: "normal", diskWrite: "normal", networkIn: "normal", networkOut: "normal" },
  { instance: "Bastion-Host", cpu: "normal", memory: "normal", diskRead: "nodata", diskWrite: "nodata", networkIn: "normal", networkOut: "critical" },
];

const heatmapColumns = ["CPU", "Memory", "Disk Read", "Disk Write", "Network In", "Network Out"];

function getHeatmapColor(status: string) {
  switch (status) {
    case "normal":
      return "bg-emerald-500";
    case "warning":
      return "bg-orange-400";
    case "critical":
      return "bg-red-500";
    case "nodata":
      return "bg-gray-600";
    default:
      return "bg-gray-600";
  }
}

function StatusBadge({ status }: { status: "NORMAL" | "CRITICAL" | "WARNING" }) {
  const styles = {
    NORMAL: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    CRITICAL: "bg-red-500/15 text-red-400 border-red-500/30",
    WARNING: "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold ${styles[status]}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === "NORMAL"
            ? "bg-emerald-400"
            : status === "CRITICAL"
            ? "bg-red-400"
            : "bg-yellow-400"
        }`}
      />
      {status}
    </span>
  );
}

export default function PredictiveOpsPage() {
  const [selectedOrg, setSelectedOrg] = useState(orgs[0]);
  const [orgDropdownOpen, setOrgDropdownOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"live" | "all" | "briefing">("live");

  const tabs = [
    { key: "live" as const, label: "Live Monitor", icon: Activity },
    { key: "all" as const, label: "All Metrics", icon: TrendingUp },
    { key: "briefing" as const, label: "AI Briefing", icon: Zap },
  ];

  const stats = [
    { label: "Monitored Metrics", value: "11", color: "text-slate-100" },
    { label: "Critical Anomalies", value: "1", color: "text-red-400" },
    { label: "Warnings", value: "0", color: "text-yellow-400" },
    { label: "Breach in 24h", value: "0", color: "text-slate-300" },
    { label: "Breach in 7 days", value: "0", color: "text-slate-300" },
    { label: "Normal", value: "10", color: "text-emerald-400" },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <div className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-5">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 text-violet-400">
                <Zap className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-white">
                  Predictive Operations
                </h1>
                <p className="mt-1 text-sm text-slate-400">
                  AIOps &middot; Statistical anomaly detection &middot; Trend
                  extrapolation &middot; Predictive threshold alerts
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-xs text-slate-500">
                <Clock className="h-3.5 w-3.5" />
                Last poll: 12m ago
              </span>
              {/* Org Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setOrgDropdownOpen(!orgDropdownOpen)}
                  className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-300 transition hover:border-slate-600 hover:bg-slate-750"
                >
                  {selectedOrg}
                  <ChevronDown className="h-4 w-4 text-slate-500" />
                </button>
                {orgDropdownOpen && (
                  <div className="absolute right-0 z-50 mt-1 w-48 rounded-lg border border-slate-700 bg-slate-800 py-1 shadow-xl">
                    {orgs.map((org) => (
                      <button
                        key={org}
                        onClick={() => {
                          setSelectedOrg(org);
                          setOrgDropdownOpen(false);
                        }}
                        className={`block w-full px-3 py-2 text-left text-sm transition hover:bg-slate-700 ${
                          org === selectedOrg
                            ? "text-violet-400"
                            : "text-slate-300"
                        }`}
                      >
                        {org}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-6">
        {/* Tabs */}
        <div className="mb-6 flex gap-1 rounded-lg border border-slate-800 bg-slate-900/50 p-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.key
                  ? "bg-slate-800 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Stats Row */}
        <div className="mb-8 grid grid-cols-6 gap-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-slate-800 bg-slate-900/50 px-4 py-3.5 text-center"
            >
              <div className={`text-2xl font-bold ${stat.color}`}>
                {stat.value}
              </div>
              <div className="mt-1 text-xs text-slate-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Top Risks */}
        <div className="mb-8">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-400" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
              Top Risks — Prioritised by Urgency
            </h2>
          </div>

          <div className="space-y-3">
            {risks.map((risk, index) => (
              <div
                key={risk.id}
                className={`rounded-xl border bg-slate-900/50 p-5 transition hover:bg-slate-900/80 ${
                  risk.status === "CRITICAL"
                    ? "border-red-500/30"
                    : "border-slate-800"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-slate-400">
                        {index + 1}
                      </span>
                      <span className="font-semibold text-white">
                        {risk.instance}
                      </span>
                      <span className="rounded bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-400">
                        {risk.metric}
                      </span>
                      <StatusBadge status={risk.status} />
                      {risk.breachTime && (
                        <span className="flex items-center gap-1 text-xs font-medium text-red-400">
                          <Clock className="h-3.5 w-3.5" />
                          breach in {risk.breachTime}
                        </span>
                      )}
                    </div>
                    <p className="ml-9 text-sm text-slate-400">
                      {risk.description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-800/50 px-3 py-1.5">
                    <ArrowUpRight className="h-3.5 w-3.5 text-red-400" />
                    <span className="text-sm font-semibold text-red-400">
                      {risk.trendPercent}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Anomaly Heatmap */}
        <div>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-cyan-400" />
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                Anomaly Heatmap
              </h2>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500">
              <Info className="h-3.5 w-3.5" />
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-500" />
                Green = normal
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-orange-400" />
                Orange = warning
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-red-500" />
                Red = critical
              </span>
              <span className="flex items-center gap-1.5">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-gray-600" />
                Grey = no data
              </span>
            </div>
          </div>

          <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/50">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Instance
                  </th>
                  {heatmapColumns.map((col) => (
                    <th
                      key={col}
                      className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500"
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapData.map((row) => (
                  <tr
                    key={row.instance}
                    className="border-b border-slate-800/50 last:border-0"
                  >
                    <td className="px-4 py-3 text-sm font-medium text-slate-300">
                      {row.instance}
                    </td>
                    {[
                      row.cpu,
                      row.memory,
                      row.diskRead,
                      row.diskWrite,
                      row.networkIn,
                      row.networkOut,
                    ].map((status, i) => (
                      <td key={i} className="px-4 py-3 text-center">
                        <span
                          className={`inline-block h-6 w-10 rounded ${getHeatmapColor(
                            status
                          )}`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
