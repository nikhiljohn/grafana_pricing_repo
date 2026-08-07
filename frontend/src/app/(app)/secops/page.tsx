"use client";

import { useEffect, useState } from "react";
import { useApiData } from "@/lib/api";
import { ApplyFixModal } from "@/components/ApplyFixModal";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Tab = "findings" | "iam" | "compliance" | "remediation";
type Severity = "all" | "critical" | "high" | "medium" | "low";

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

const TABS: { key: Tab; label: string }[] = [
  { key: "findings", label: "Findings Intelligence" },
  { key: "iam", label: "IAM Risk" },
  { key: "compliance", label: "Compliance" },
  { key: "remediation", label: "Remediation Memory" },
];

const STAT_CARDS = [
  { label: "Total Findings", value: "342", sub: "across all accounts", color: "text-slate-700", bg: "bg-white", border: "border-slate-200" },
  { label: "Critical", value: "7", sub: "require immediate action", color: "text-rose-700", bg: "bg-rose-50", border: "border-rose-200" },
  { label: "Recurrences", value: "12", sub: "patterns we've seen before", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
  { label: "Auto-remediable", value: "23", sub: "memory-backed fixes available", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  { label: "Compliance", value: "89%", sub: "CIS benchmark", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  { label: "IAM Risk Score", value: "Low", sub: "no high-risk identities", color: "text-green-700", bg: "bg-green-50", border: "border-green-200" },
];

interface Finding {
  id: number;
  severity: "critical" | "high" | "medium";
  title: string;
  resource: string;
  account: string;
  cisCheck: string;
  memorySeenCount: number;
  memoryLastResolution: string;
  memoryConfidence: number;
  memoryNote: string;
  actions: string[];
}

interface IamIdentityRow {
  name: string;
  type: string;
  risk: string;
  riskColor: string;
  lastActive: string;
  memory: string;
}

interface ComplianceFrameworkRow {
  name: string;
  pct: number;
  passing: number;
  failing: number;
  notAssessed: number;
  total: number;
}

interface RemediationRow {
  date: string;
  finding: string;
  action: string;
  result: string;
  time: string;
}

const SEVERITY_FILTERS: { key: Severity; label: string; count?: number }[] = [
  { key: "all", label: "All", count: 342 },
  { key: "critical", label: "Critical", count: 7 },
  { key: "high", label: "High", count: 45 },
  { key: "medium", label: "Medium", count: 180 },
  { key: "low", label: "Low", count: 110 },
];

/* ------------------------------------------------------------------ */
/*  Donut Score SVG                                                    */
/* ------------------------------------------------------------------ */

function PostureDonut({ score, size = 140 }: { score: number; size?: number }) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const pct = Math.min(score / 100, 1);
  const color = score >= 80 ? "#0e9f6e" : score >= 60 ? "#f59e0b" : "#e02424";

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx={50} cy={50} r={r} fill="none" stroke="#e2e8f0" strokeWidth={10} />
        <circle cx={50} cy={50} r={r} fill="none" stroke={color} strokeWidth={10} strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-slate-800">{score}</span>
        <span className="text-[11px] text-slate-500">/ 100</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Severity border color helper                                       */
/* ------------------------------------------------------------------ */

function severityBorder(s: string) {
  if (s === "critical") return "border-l-rose-500";
  if (s === "high") return "border-l-orange-400";
  if (s === "medium") return "border-l-amber-400";
  return "border-l-blue-400";
}

function severityBadge(s: string) {
  if (s === "critical") return "bg-rose-100 text-rose-700";
  if (s === "high") return "bg-orange-100 text-orange-700";
  if (s === "medium") return "bg-amber-100 text-amber-700";
  return "bg-blue-100 text-blue-700";
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SecOpsIntelligencePage() {
  const [activeTab, setActiveTab] = useState<Tab>("findings");
  const [severityFilter, setSeverityFilter] = useState<Severity>("all");

  const { data: findingsData } = useApiData<Finding[]>("/secops/findings", []);
  const { data: iamIdentities } = useApiData<IamIdentityRow[]>("/secops/iam", []);
  const { data: complianceFrameworks } = useApiData<ComplianceFrameworkRow[]>("/secops/compliance", []);
  const { data: remediationLog } = useApiData<RemediationRow[]>("/secops/remediations", []);

  // Local, mutable copy so "Auto-Fix" / "Generate Role" actually resolve
  // the finding instead of being decorative — resyncs on org switch.
  const [findings, setFindings] = useState<Finding[]>([]);
  useEffect(() => setFindings(findingsData), [findingsData]);
  const [fixTarget, setFixTarget] = useState<Finding | null>(null);

  const filteredFindings = severityFilter === "all"
    ? findings
    : findings.filter((f) => f.severity === severityFilter);

  return (
    <div className="min-h-screen bg-white text-slate-800">
      {/* ================================================================ */}
      {/*  HEADER                                                          */}
      {/* ================================================================ */}
      <div className="border-b border-slate-200 px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-slate-800">Cloud Security</h1>
              <p className="text-sm text-slate-500">
                Cloud security posture with remediation memory — every finding has context from past resolutions
              </p>
            </div>
          </div>
          <select className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-600 focus:border-indigo-500 focus:outline-none">
            <option>Searce Inc.</option>
            <option>searce-sandbox</option>
            <option>production-org</option>
          </select>
        </div>
      </div>

      {/* ================================================================ */}
      {/*  POSTURE SCORE BANNER                                            */}
      {/* ================================================================ */}
      <div className="mx-6 mt-6 rounded-xl border border-slate-200 bg-gradient-to-r from-emerald-50 via-white to-white p-6">
        <div className="flex flex-col lg:flex-row lg:items-center gap-6">
          {/* Donut */}
          <div className="flex items-center gap-5">
            <PostureDonut score={89} />
            <div>
              <div className="text-sm font-semibold text-slate-700">Security Posture Score</div>
              <div className="text-sm text-slate-500 mt-1 flex items-center gap-1">
                <svg className="w-3.5 h-3.5 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                2 from last week — 2 new SSH security groups created in us-east-1
              </div>
            </div>
          </div>

          {/* Memory context */}
          <div className="flex-1 rounded-lg bg-blue-50 border border-blue-100 p-4">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
              <div>
                <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Memory</div>
                <p className="text-sm text-blue-800 mt-0.5">
                  SSH group findings have been resolved 12 times across accounts. Auto-remediation script available with 96% confidence.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ================================================================ */}
      {/*  STATS ROW                                                       */}
      {/* ================================================================ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 px-6 mt-6">
        {STAT_CARDS.map((s) => (
          <div key={s.label} className={`${s.bg} border ${s.border} rounded-xl p-4`}>
            <div className={`text-[11px] uppercase tracking-wider font-semibold ${s.color}`}>{s.label}</div>
            <div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* ================================================================ */}
      {/*  TABS                                                            */}
      {/* ================================================================ */}
      <div className="border-b border-slate-200 px-6 mt-6">
        <div className="flex gap-0">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className={`px-5 py-3 text-sm font-medium transition-colors ${
                activeTab === t.key
                  ? "border-b-2 border-indigo-500 text-indigo-600"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ================================================================ */}
      {/*  TAB CONTENT                                                     */}
      {/* ================================================================ */}
      <div className="px-6 py-6">
        {/* ============================================================ */}
        {/*  FINDINGS INTELLIGENCE                                        */}
        {/* ============================================================ */}
        {activeTab === "findings" && (
          <div className="space-y-5">
            {/* Recurrence alert banner */}
            <div className="flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
              <svg className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
              <div>
                <div className="text-sm font-semibold text-amber-800">Recurrence Alert</div>
                <p className="text-sm text-amber-700 mt-0.5">
                  12 of 342 findings are recurrences of patterns resolved in the past. Memory-backed remediation available for all 12.
                </p>
              </div>
            </div>

            {/* Severity filter pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {SEVERITY_FILTERS.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setSeverityFilter(f.key)}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    severityFilter === f.key
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {f.label} {f.count !== undefined && <span className="ml-1 opacity-80">({f.count})</span>}
                </button>
              ))}
            </div>

            {/* Findings list */}
            <div className="space-y-4">
              {filteredFindings.map((f) => (
                <div
                  key={f.id}
                  className={`border border-slate-200 rounded-xl overflow-hidden border-l-4 ${severityBorder(f.severity)}`}
                >
                  {/* Finding header */}
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded ${severityBadge(f.severity)}`}>
                            {f.severity}
                          </span>
                          <span className="text-xs text-slate-400">{f.cisCheck}</span>
                        </div>
                        <h3 className="text-sm font-semibold text-slate-800">{f.title}</h3>
                        <p className="text-xs text-slate-500 mt-1">
                          {f.resource} &middot; {f.account} &middot; {f.cisCheck}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {f.actions.map((a) =>
                          a === "Auto-Fix" || a === "Generate Role" ? (
                            <button
                              key={a}
                              onClick={() => setFixTarget(f)}
                              className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-colors ${
                                a === "Auto-Fix"
                                  ? "bg-indigo-600 text-white hover:bg-indigo-700"
                                  : "bg-emerald-600 text-white hover:bg-emerald-700"
                              }`}
                            >
                              {a}
                            </button>
                          ) : (
                            <button
                              key={a}
                              disabled
                              title="Coming in V2 — dedicated investigation view per finding"
                              className="text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-200 text-slate-300 cursor-not-allowed"
                            >
                              {a}
                            </button>
                          ),
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Memory panel */}
                  <div className="bg-blue-50 border-t border-blue-100 px-5 py-3.5">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Memory</span>
                          {f.memorySeenCount > 0 && (
                            <span className="text-[11px] text-blue-600">
                              Seen {f.memorySeenCount} times before
                            </span>
                          )}
                          {f.memoryConfidence > 0 && (
                            <span className="text-[11px] text-blue-600">
                              Confidence: {f.memoryConfidence}%
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-blue-800 mt-1">{f.memoryNote}</p>
                        {f.memoryConfidence > 85 && (
                          <div className="mt-2">
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                              </svg>
                              Auto-fix available
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/*  IAM RISK                                                     */}
        {/* ============================================================ */}
        {activeTab === "iam" && (
          <div className="space-y-6">
            {/* IAM Stats */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: "Users", value: "45", color: "text-slate-700" },
                { label: "Roles", value: "12", color: "text-slate-700" },
                { label: "Admin Identities", value: "3", color: "text-rose-600" },
                { label: "Inactive >90d", value: "2", color: "text-amber-600" },
                { label: "Over-Privileged", value: "5", color: "text-orange-600" },
              ].map((s) => (
                <div key={s.label} className="bg-white border border-slate-200 rounded-xl p-4 text-center">
                  <div className="text-[11px] uppercase tracking-wider font-semibold text-slate-500">{s.label}</div>
                  <div className={`text-2xl font-bold mt-1 ${s.color}`}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Over-Privileged Identities Table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-800">Over-Privileged Identities</h3>
                <p className="text-xs text-slate-500 mt-0.5">Identities with more permissions than required by their usage pattern</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Name</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Risk</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Last Active</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Memory</th>
                    </tr>
                  </thead>
                  <tbody>
                    {iamIdentities.map((id) => (
                      <tr key={id.name} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-slate-800">{id.name}</td>
                        <td className="px-5 py-3.5 text-slate-600">{id.type}</td>
                        <td className="px-5 py-3.5">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded ${id.riskColor}`}>{id.risk}</span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600">{id.lastActive}</td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-start gap-1.5 max-w-md">
                            <svg className="w-3.5 h-3.5 text-blue-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                            </svg>
                            <span className="text-xs text-blue-700">{id.memory}</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/*  COMPLIANCE                                                   */}
        {/* ============================================================ */}
        {activeTab === "compliance" && (
          <div className="space-y-6">
            {/* Framework cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {complianceFrameworks.map((fw) => {
                const barColor = fw.pct >= 90 ? "#0e9f6e" : fw.pct >= 80 ? "#3b82f6" : "#f59e0b";
                return (
                  <div key={fw.name} className="bg-white border border-slate-200 rounded-xl p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="text-sm font-semibold text-slate-800">{fw.name}</h3>
                      <span className="text-2xl font-bold" style={{ color: barColor }}>{fw.pct}%</span>
                    </div>
                    {/* Progress bar */}
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                      <div className="h-full rounded-full transition-all" style={{ width: `${fw.pct}%`, background: barColor }} />
                    </div>
                    {/* Counts */}
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <div className="text-lg font-bold text-emerald-600">{fw.passing}</div>
                        <div className="text-[11px] text-slate-500 uppercase">Passing</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-rose-600">{fw.failing}</div>
                        <div className="text-[11px] text-slate-500 uppercase">Failing</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold text-slate-400">{fw.notAssessed}</div>
                        <div className="text-[11px] text-slate-500 uppercase">Not Assessed</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Memory note */}
            <div className="rounded-lg bg-blue-50 border border-blue-100 p-4">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <div>
                  <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">Memory</span>
                  <p className="text-sm text-blue-800 mt-0.5">
                    CIS score improved from 82% to 89% after SSH remediation campaign in June. NIST improvement expected after VPC logging findings are resolved.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================ */}
        {/*  REMEDIATION MEMORY                                           */}
        {/* ============================================================ */}
        {activeTab === "remediation" && (
          <div className="space-y-6">
            {/* Remediation timeline table */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <h3 className="text-sm font-semibold text-slate-800">Remediation History</h3>
                <p className="text-xs text-slate-500 mt-0.5">All past remediations with outcomes and resolution times</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100">
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Finding</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Action Taken</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Result</th>
                      <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Time to Resolve</th>
                    </tr>
                  </thead>
                  <tbody>
                    {remediationLog.map((r, i) => (
                      <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5 font-medium text-slate-700 whitespace-nowrap">{r.date}</td>
                        <td className="px-5 py-3.5 text-slate-800">{r.finding}</td>
                        <td className="px-5 py-3.5 text-slate-600">{r.action}</td>
                        <td className="px-5 py-3.5">
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                            </svg>
                            {r.result}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 font-medium">{r.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-xl border border-slate-200 bg-gradient-to-r from-emerald-50 via-white to-white p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
                  <svg className="h-4 w-4 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-sm font-semibold text-slate-800">Remediation Summary (90 days)</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-white rounded-lg border border-slate-100">
                  <div className="text-2xl font-bold text-indigo-600">23</div>
                  <div className="text-xs text-slate-500 mt-0.5">Total remediations</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border border-slate-100">
                  <div className="text-2xl font-bold text-indigo-600">13 min</div>
                  <div className="text-xs text-slate-500 mt-0.5">Avg time to resolve</div>
                </div>
                <div className="text-center p-3 bg-white rounded-lg border border-slate-100">
                  <div className="text-2xl font-bold text-emerald-600">0</div>
                  <div className="text-xs text-slate-500 mt-0.5">Regressions</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ApplyFixModal
        open={fixTarget !== null}
        onClose={() => setFixTarget(null)}
        onConfirm={() => {
          setFindings((cur) => cur.filter((f) => f !== fixTarget));
        }}
        pillar="Cloud Security"
        title={fixTarget?.title ?? ""}
        memoryContext={fixTarget?.memoryNote ?? ""}
        confidence={fixTarget?.memoryConfidence || null}
        fixDescription="Applies the same remediation Memory has already validated for this finding, then re-scans the resource to confirm it's clear."
      />
    </div>
  );
}
