"use client";

import { useState } from "react";
import {
  ShieldAlert,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Scan,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Static data                                                        */
/* ------------------------------------------------------------------ */

const SEVERITY_STATS = [
  {
    label: "Critical",
    value: 160,
    color: "#e02424",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
  },
  {
    label: "High",
    value: 19,
    color: "#f97316",
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
  },
  {
    label: "Medium",
    value: 94,
    color: "#f59e0b",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  {
    label: "Low",
    value: 67,
    color: "#3b82f6",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
];

const COMPLIANCE = [
  { name: "CIS GCP v1.3", passed: 46, total: 65, pct: 71 },
  { name: "CIS AWS Foundations", passed: 46, total: 65, pct: 71 },
  { name: "CIS Benchmark", passed: 46, total: 65, pct: 71 },
  { name: "NIST CSF", passed: 46, total: 65, pct: 71 },
  { name: "ISO 27001", passed: 46, total: 65, pct: 71 },
];

const SERVICE_FINDINGS = [
  {
    service: "SecurityGroup",
    critical: 140,
    high: 13,
    medium: 18,
    low: 0,
  },
  { service: "Bucket", critical: 17, high: 0, medium: 55, low: 4 },
  { service: "VPC", critical: 0, high: 0, medium: 17, low: 0 },
  { service: "Trail", critical: 3, high: 0, medium: 1, low: 0 },
  { service: "User", critical: 0, high: 4, medium: 3, low: 4 },
  { service: "Instance", critical: 0, high: 2, medium: 0, low: 0 },
];

/* ------------------------------------------------------------------ */
/*  Inline SVG helpers                                                 */
/* ------------------------------------------------------------------ */

function DonutScore({
  score,
  size = 160,
}: {
  score: number;
  size?: number;
}) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const pct = Math.min(score / 100, 1);
  const color = score >= 80 ? "#0e9f6e" : score >= 60 ? "#f59e0b" : "#e02424";

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle
          cx={50}
          cy={50}
          r={r}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth={9}
        />
        <circle
          cx={50}
          cy={50}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={9}
          strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-semibold text-searce-navy">
          {score}
        </span>
        <span className="text-[11px] text-slate-500 mt-0.5">/ 100</span>
      </div>
    </div>
  );
}

function SeverityBarChart() {
  const bars = SEVERITY_STATS;
  const max = Math.max(...bars.map((b) => b.value)) * 1.15;
  const chartH = 180;
  const barW = 52;
  const gap = 32;
  const totalW = bars.length * barW + (bars.length - 1) * gap;

  return (
    <svg
      viewBox={`0 0 ${totalW} ${chartH + 30}`}
      className="w-full"
      style={{ height: chartH + 30 }}
    >
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map((t) => (
        <line
          key={t}
          x1={0}
          x2={totalW}
          y1={chartH - chartH * t}
          y2={chartH - chartH * t}
          stroke="#e2e8f0"
          strokeWidth={1}
        />
      ))}
      {bars.map((b, i) => {
        const bh = (b.value / max) * chartH;
        const x = i * (barW + gap);
        return (
          <g key={b.label}>
            <rect
              x={x}
              y={chartH - bh}
              width={barW}
              height={bh}
              rx={4}
              fill={b.color}
            />
            <text
              x={x + barW / 2}
              y={chartH - bh - 6}
              textAnchor="middle"
              fontSize={13}
              fill="#334155"
              fontWeight={600}
            >
              {b.value}
            </text>
            <text
              x={x + barW / 2}
              y={chartH + 18}
              textAnchor="middle"
              fontSize={12}
              fill="#64748b"
            >
              {b.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function SecurityDashboardPage() {
  const [expandedService, setExpandedService] = useState<string | null>(null);

  const severityColor: Record<string, string> = {
    critical: "#e02424",
    high: "#f97316",
    medium: "#f59e0b",
    low: "#3b82f6",
  };

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-rose-100 flex items-center justify-center shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-searce-navy">
              Security Dashboard
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Cloud Security Posture Management — AWS &amp; GCP
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button className="inline-flex items-center gap-1.5 text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 hover:bg-slate-50">
            Searce Inc.
            <ChevronDown className="w-4 h-4 text-slate-400" />
          </button>
          <button className="inline-flex items-center gap-1.5 text-sm border border-slate-200 rounded-lg px-3 py-1.5 bg-white text-slate-700 hover:bg-slate-50">
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh
          </button>
          <button className="inline-flex items-center gap-1.5 text-sm rounded-lg px-4 py-1.5 bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors">
            <Scan className="w-4 h-4" />
            Run Security Scan
          </button>
        </div>
      </div>

      {/* ── Severity stat tiles ────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {SEVERITY_STATS.map((s) => (
          <div
            key={s.label}
            className={`${s.bg} border ${s.border} rounded-xl p-5`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div
                  className={`text-[11px] uppercase tracking-wider font-semibold ${s.text}`}
                >
                  {s.label}
                </div>
                <div className={`text-3xl font-semibold mt-1 ${s.text}`}>
                  {s.value}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  open findings
                </div>
              </div>
              <div
                className="w-3 h-3 rounded-full"
                style={{ background: s.color }}
              />
            </div>
            <button
              className={`text-xs font-medium mt-3 ${s.text} hover:underline`}
            >
              View &gt;
            </button>
          </div>
        ))}
      </div>

      {/* ── Three-column section ───────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Col 1 — Overall posture donut + compliance */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-searce-navy">
            Overall Posture Score
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">
            Weighted across all frameworks
          </p>
          <div className="flex justify-center mb-5">
            <DonutScore score={89} size={160} />
          </div>
          <div className="space-y-3">
            {COMPLIANCE.map((fw) => (
              <div key={fw.name}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-medium text-slate-700">{fw.name}</span>
                  <span className="text-slate-500">
                    {fw.passed}/{fw.total} checks{" "}
                    <span className="font-semibold text-slate-700">
                      {fw.pct}%
                    </span>
                  </span>
                </div>
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${fw.pct}%`,
                      background:
                        fw.pct >= 80
                          ? "#0e9f6e"
                          : fw.pct >= 60
                            ? "#f59e0b"
                            : "#e02424",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Col 2 — Findings by Severity bar chart */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-searce-navy">
            Findings by Severity
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">
            Distribution of open findings across severity levels
          </p>
          <SeverityBarChart />
          <div className="flex flex-wrap gap-x-4 gap-y-1 mt-4">
            {SEVERITY_STATS.map((s) => (
              <div
                key={s.label}
                className="flex items-center gap-1.5 text-xs text-slate-600"
              >
                <span
                  className="w-2.5 h-2.5 rounded-sm"
                  style={{ background: s.color }}
                />
                {s.label}{" "}
                <span className="font-medium text-slate-800">{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Col 3 — Findings by Service */}
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-searce-navy">
            Findings by Service
          </h3>
          <p className="text-xs text-slate-500 mt-0.5 mb-4">
            Breakdown of findings per cloud service
          </p>
          <div className="space-y-3">
            {SERVICE_FINDINGS.map((svc) => {
              const total =
                svc.critical + svc.high + svc.medium + svc.low;
              const maxTotal = Math.max(
                ...SERVICE_FINDINGS.map(
                  (s) => s.critical + s.high + s.medium + s.low
                )
              );
              const isExpanded = expandedService === svc.service;

              return (
                <div key={svc.service}>
                  <button
                    className="w-full text-left"
                    onClick={() =>
                      setExpandedService(isExpanded ? null : svc.service)
                    }
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-1.5">
                        {isExpanded ? (
                          <ChevronDown className="w-3 h-3 text-slate-400" />
                        ) : (
                          <ChevronRight className="w-3 h-3 text-slate-400" />
                        )}
                        <span className="text-sm font-medium text-slate-700">
                          {svc.service}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500 tabular-nums">
                        {total}
                      </span>
                    </div>
                    {/* stacked severity bar */}
                    <div className="flex h-4 rounded overflow-hidden gap-[1px] ml-4">
                      {svc.critical > 0 && (
                        <div
                          style={{
                            width: `${(svc.critical / maxTotal) * 100}%`,
                            background: severityColor.critical,
                          }}
                        />
                      )}
                      {svc.high > 0 && (
                        <div
                          style={{
                            width: `${(svc.high / maxTotal) * 100}%`,
                            background: severityColor.high,
                          }}
                        />
                      )}
                      {svc.medium > 0 && (
                        <div
                          style={{
                            width: `${(svc.medium / maxTotal) * 100}%`,
                            background: severityColor.medium,
                          }}
                        />
                      )}
                      {svc.low > 0 && (
                        <div
                          style={{
                            width: `${(svc.low / maxTotal) * 100}%`,
                            background: severityColor.low,
                          }}
                        />
                      )}
                    </div>
                  </button>
                  {isExpanded && (
                    <div className="ml-4 mt-1.5 flex flex-wrap gap-2">
                      {svc.critical > 0 && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-rose-50 text-rose-700">
                          {svc.critical} critical
                        </span>
                      )}
                      {svc.high > 0 && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-700">
                          {svc.high} high
                        </span>
                      )}
                      {svc.medium > 0 && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
                          {svc.medium} medium
                        </span>
                      )}
                      {svc.low > 0 && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                          {svc.low} low
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
