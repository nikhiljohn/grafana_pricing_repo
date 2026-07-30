"use client";

import { useState } from "react";
import {
  Shield,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Key,
  AlertTriangle,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

const TABS = [
  { label: "Dashboard", active: true },
  { label: "Access Review", ai: true },
  { label: "Stale Identities", ai: true },
  { label: "Escalation Paths", ai: true },
  { label: "Policy Changes", ai: true },
];

const TIME_RANGES = ["7d", "14d", "30d", "60d", "90d"] as const;

const STATS = [
  { label: "Total Users", value: "40", color: "text-slate-800" },
  { label: "Total Roles", value: "194", color: "text-slate-800" },
  { label: "Groups", value: "5", color: "text-slate-800" },
  {
    label: "Admin Identities",
    value: "12",
    sub: "5 users · 7 roles",
    color: "text-slate-800",
  },
  {
    label: "Inactive",
    value: "196",
    sub: ">30d no activity",
    color: "text-rose-600",
  },
  {
    label: "Over-Privileged",
    value: "177",
    sub: "granted > used",
    color: "text-amber-600",
  },
  {
    label: "Federated / SSO",
    value: "10",
    sub: "external identities",
    color: "text-blue-600",
  },
  {
    label: "Policy Violations",
    value: "108",
    sub: "wildcard · public access",
    color: "text-rose-600",
  },
  {
    label: "Stale Access Keys",
    value: "5",
    sub: ">90d without rotation",
    color: "text-amber-600",
  },
];

const STALE_KEYS = [
  {
    user: "ci-deploy-bot",
    keyId: "AKIA...3FQX",
    created: "2025-02-14",
    lastUsed: "2025-04-01",
    age: "167 days",
  },
  {
    user: "legacy-etl-sa",
    keyId: "AKIA...9MNR",
    created: "2025-01-22",
    lastUsed: "2025-03-10",
    age: "189 days",
  },
  {
    user: "backup-automation",
    keyId: "AKIA...7TBZ",
    created: "2024-12-05",
    lastUsed: "Never",
    age: "237 days",
  },
  {
    user: "monitoring-read",
    keyId: "AKIA...2WKC",
    created: "2025-03-18",
    lastUsed: "2025-04-20",
    age: "134 days",
  },
  {
    user: "dev-sandbox-user",
    keyId: "AKIA...6LPD",
    created: "2025-01-03",
    lastUsed: "2025-02-11",
    age: "208 days",
  },
];

const HEATMAP_DATA = [
  {
    identity: "ci-deploy-bot",
    type: "Service Account",
    granted: 48,
    used: 6,
    utilisation: 12,
  },
  {
    identity: "analytics-pipeline",
    type: "Service Account",
    granted: 35,
    used: 4,
    utilisation: 11,
  },
  {
    identity: "admin-legacy",
    type: "User",
    granted: 62,
    used: 8,
    utilisation: 13,
  },
  {
    identity: "backup-automation",
    type: "Service Account",
    granted: 29,
    used: 2,
    utilisation: 7,
  },
  {
    identity: "dev-team-role",
    type: "Role",
    granted: 44,
    used: 10,
    utilisation: 23,
  },
  {
    identity: "monitoring-read",
    type: "Service Account",
    granted: 18,
    used: 3,
    utilisation: 17,
  },
];

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function IAMPage() {
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [timeRange, setTimeRange] = useState<string>("30d");
  const [staleOpen, setStaleOpen] = useState(false);
  const [heatmapOpen, setHeatmapOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
          <Shield className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold text-searce-navy">IAM</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Live posture — identity inventory, heatmaps, violations, activity
          </p>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────────────────────────── */}
      <div className="border-b border-slate-200">
        <div className="flex gap-1 -mb-px overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.label}
              onClick={() => setActiveTab(tab.label)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex items-center gap-1.5 ${
                activeTab === tab.label
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
              }`}
            >
              {tab.label}
              {tab.ai && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold bg-violet-100 text-violet-700 px-1.5 py-0.5 rounded-full">
                  <Sparkles className="w-3 h-3" />
                  AI
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Sub-header ─────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-searce-navy">
            IAM Intelligence
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Identity &amp; access management posture — live from IAM scan data
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Org dropdown */}
          <button className="inline-flex items-center gap-1.5 text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 hover:bg-slate-50">
            Searce Inc.
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>

          {/* Time range pills */}
          <div className="flex rounded-lg border border-slate-200 bg-white overflow-hidden">
            {TIME_RANGES.map((t) => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                  timeRange === t
                    ? "bg-blue-600 text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Refresh */}
          <button className="inline-flex items-center gap-1.5 text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 hover:bg-slate-50">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
        </div>
      </div>

      {/* ── Stats row ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9 gap-3">
        {STATS.map((s) => (
          <div
            key={s.label}
            className="bg-white border border-slate-200 rounded-xl p-4"
          >
            <div className="text-[11px] uppercase tracking-wider text-slate-500 font-medium leading-tight">
              {s.label}
            </div>
            <div className={`text-2xl font-semibold mt-1 ${s.color}`}>
              {s.value}
            </div>
            {s.sub && (
              <div className="text-[11px] text-slate-400 mt-0.5">{s.sub}</div>
            )}
          </div>
        ))}
      </div>

      {/* ── Active vs Inactive Principals ──────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-searce-navy mb-1">
          Active vs Inactive Principals
        </h3>
        <p className="text-xs text-slate-500 mb-5">
          Principals with activity in the selected time window vs those with
          none
        </p>

        <div className="space-y-5">
          {/* Users bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-slate-700">Users</span>
              <span className="text-xs text-slate-500">40 total</span>
            </div>
            <div className="flex h-8 rounded-lg overflow-hidden">
              <div
                className="bg-emerald-500 flex items-center justify-center text-white text-xs font-medium"
                style={{ width: "15%" }}
              >
                6
              </div>
              <div
                className="bg-rose-500 flex items-center justify-center text-white text-xs font-medium"
                style={{ width: "85%" }}
              >
                34
              </div>
            </div>
            <div className="flex gap-4 mt-1.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Active (15%)
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Inactive (85%)
              </div>
            </div>
          </div>

          {/* Roles bar */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm font-medium text-slate-700">Roles</span>
              <span className="text-xs text-slate-500">194 total</span>
            </div>
            <div className="flex h-8 rounded-lg overflow-hidden">
              <div
                className="bg-emerald-500 flex items-center justify-center text-white text-xs font-medium"
                style={{ width: "16.5%" }}
              >
                32
              </div>
              <div
                className="bg-rose-500 flex items-center justify-center text-white text-xs font-medium"
                style={{ width: "83.5%" }}
              >
                162
              </div>
            </div>
            <div className="flex gap-4 mt-1.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                Active (16%)
              </div>
              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                Inactive (84%)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Stale Access Keys (collapsible) ────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <button
          onClick={() => setStaleOpen(!staleOpen)}
          className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            {staleOpen ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
            <Key className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-semibold text-searce-navy">
              Stale Access Keys — Not Rotated in 90+ Days
            </span>
          </div>
          <span className="text-[11px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
            5
          </span>
        </button>

        {staleOpen && (
          <div className="border-t border-slate-100 px-5 pb-5">
            <div className="overflow-x-auto mt-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-[11px] uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-2.5 font-medium">User / SA</th>
                    <th className="px-4 py-2.5 font-medium">Key ID</th>
                    <th className="px-4 py-2.5 font-medium">Created</th>
                    <th className="px-4 py-2.5 font-medium">Last Used</th>
                    <th className="px-4 py-2.5 font-medium">Age</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {STALE_KEYS.map((k) => (
                    <tr key={k.keyId} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {k.user}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">
                        {k.keyId}
                      </td>
                      <td className="px-4 py-3 text-slate-600">{k.created}</td>
                      <td className="px-4 py-3 text-slate-600">
                        {k.lastUsed === "Never" ? (
                          <span className="text-rose-500 font-medium">
                            Never
                          </span>
                        ) : (
                          k.lastUsed
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 text-amber-600 font-medium text-xs">
                          <AlertTriangle className="w-3 h-3" />
                          {k.age}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Privilege Heatmap (collapsible) ─────────────────────────── */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <button
          onClick={() => setHeatmapOpen(!heatmapOpen)}
          className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            {heatmapOpen ? (
              <ChevronDown className="w-4 h-4 text-slate-400" />
            ) : (
              <ChevronRight className="w-4 h-4 text-slate-400" />
            )}
            <svg
              className="w-4 h-4 text-rose-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <rect x="14" y="14" width="7" height="7" rx="1" />
            </svg>
            <span className="text-sm font-semibold text-searce-navy">
              Privilege Heatmap — Permission Utilisation
            </span>
          </div>
          <span className="text-[11px] font-semibold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
            177
          </span>
        </button>

        {heatmapOpen && (
          <div className="border-t border-slate-100 px-5 pb-5">
            <p className="text-xs text-slate-500 mt-3 mb-4">
              Identities using less than 25% of their granted permissions are
              flagged as over-privileged
            </p>
            <div className="space-y-2">
              {HEATMAP_DATA.map((row) => (
                <div key={row.identity} className="flex items-center gap-3">
                  <div className="w-40 shrink-0">
                    <div className="text-sm font-medium text-slate-700 truncate">
                      {row.identity}
                    </div>
                    <div className="text-[11px] text-slate-400">{row.type}</div>
                  </div>
                  <div className="flex-1">
                    <div className="relative h-5 bg-slate-100 rounded overflow-hidden">
                      {/* granted (full bar, faded) */}
                      <div
                        className="absolute inset-y-0 left-0 bg-rose-100 rounded"
                        style={{ width: "100%" }}
                      />
                      {/* used (fill) */}
                      <div
                        className="absolute inset-y-0 left-0 rounded"
                        style={{
                          width: `${row.utilisation}%`,
                          background:
                            row.utilisation < 15 ? "#e02424" : "#f59e0b",
                        }}
                      />
                    </div>
                  </div>
                  <div className="w-28 shrink-0 flex items-center gap-2 text-xs">
                    <span className="text-slate-500">
                      {row.used}/{row.granted}
                    </span>
                    <span
                      className={`font-semibold ${
                        row.utilisation < 15
                          ? "text-rose-600"
                          : "text-amber-600"
                      }`}
                    >
                      {row.utilisation}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
