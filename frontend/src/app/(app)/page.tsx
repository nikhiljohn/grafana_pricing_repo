"use client";

import { useState } from "react";
import { Card } from "@/components/charts";

/* ── static data ─────────────────────────────────────────────────────── */

const costByService = [
  { label: "Compute Engine", value: 161, color: "#3b82f6" },
  { label: "Cloud Storage", value: 145, color: "#8b5cf6" },
  { label: "Cloud Functions", value: 86, color: "#10b981" },
  { label: "Cloud SQL", value: 68, color: "#f59e0b" },
  { label: "Cloud Run", value: 48, color: "#ef4444" },
];

const costTrend = [
  { month: "Feb", cost: 480 },
  { month: "Mar", cost: 520 },
  { month: "Apr", cost: 510 },
  { month: "May", cost: 560 },
  { month: "Jun", cost: 590 },
  { month: "Jul", cost: 637 },
];

const workloads = [
  {
    icon: "🖥️",
    name: "Compute / VMs",
    count: 23,
    unit: "instances",
    healthy: 21,
    warning: 2,
    critical: 0,
    cost: 368,
    status: "CPU spike on clens-dev auto-resolved 3d ago",
  },
  {
    icon: "☸️",
    name: "Kubernetes",
    count: 0,
    unit: "clusters",
    healthy: 0,
    warning: 0,
    critical: 0,
    cost: 0,
    status: "No clusters discovered — run scan",
  },
  {
    icon: "🗄️",
    name: "Databases",
    count: 1,
    unit: "instance",
    healthy: 1,
    warning: 0,
    critical: 0,
    cost: 15,
    status: "Connection pool fix deployed 7d ago",
  },
  {
    icon: "⚡",
    name: "Serverless",
    count: 12,
    unit: "functions",
    healthy: 12,
    warning: 0,
    critical: 0,
    cost: 86,
    status: "Cold start mitigation active",
  },
  {
    icon: "🧠",
    name: "Data & AI",
    count: 3,
    unit: "pipelines",
    healthy: 2,
    warning: 1,
    critical: 0,
    cost: 28,
    status: "BigQuery slot optimization in progress",
  },
];

const operationalMemory = [
  {
    tone: "resolved" as const,
    text: "CPU auto-scaling policy validated — resolved clens-dev spike in 8 min",
    time: "3d ago",
  },
  {
    tone: "resolved" as const,
    text: "BigQuery auto-scaling enabled after slot exhaustion — no recurrence",
    time: "5d ago",
  },
  {
    tone: "mitigated" as const,
    text: "Database connection pool increased 100→200 after saturation event",
    time: "7d ago",
  },
  {
    tone: "mitigated" as const,
    text: "Serverless min instances configured — cold start p99 reduced from 2.1s to 340ms",
    time: "14d ago",
  },
  {
    tone: "noted" as const,
    text: "Bastion host egress alert threshold adjusted — was false positive from backup job",
    time: "21d ago",
  },
];

const whatsWorkingWell = [
  "22 of 23 VMs within CPU/memory thresholds for 30 days",
  "All databases encrypted at rest with automated backups",
  "Zero security findings on serverless workloads",
  "Incident MTTR improved 22% vs last month (13 min avg)",
  "Cloud costs down 15% on Data & AI after query optimization",
];

/* ── inline components ───────────────────────────────────────────────── */

function StatTile({
  icon,
  label,
  value,
  sub,
  color,
}: {
  icon: string;
  label: string;
  value: string;
  sub: string;
  color?: string;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xl opacity-60">{icon}</span>
        <span className="text-xs text-slate-500 uppercase tracking-wider font-medium">
          {label}
        </span>
      </div>
      <div className={`text-3xl font-semibold ${color || "text-slate-800"}`}>
        {value}
      </div>
      <div className="text-xs text-slate-400 mt-1">{sub}</div>
    </div>
  );
}

function CostDonut({
  segments,
}: {
  segments: { label: string; value: number; color: string }[];
}) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = 60;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width="160" height="160" viewBox="0 0 160 160">
      {segments.map((s, i) => {
        const pct = s.value / total;
        const dash = c * pct;
        const el = (
          <circle
            key={i}
            cx="80"
            cy="80"
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth="24"
            strokeDasharray={`${dash} ${c - dash}`}
            strokeDashoffset={-offset}
            transform="rotate(-90 80 80)"
          />
        );
        offset += dash;
        return el;
      })}
      {/* Total in center */}
      <text
        x="80"
        y="74"
        textAnchor="middle"
        fontSize="22"
        fontWeight="700"
        fill="#1e293b"
      >
        ${total}
      </text>
      <text
        x="80"
        y="94"
        textAnchor="middle"
        fontSize="11"
        fill="#64748b"
      >
        /month
      </text>
    </svg>
  );
}

function HealthDots({
  healthy,
  warning,
  critical,
}: {
  healthy: number;
  warning: number;
  critical: number;
}) {
  if (healthy === 0 && warning === 0 && critical === 0) {
    return <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" />;
  }
  return (
    <span className="flex items-center gap-1">
      {healthy > 0 && (
        <span className="flex items-center gap-0.5 text-xs text-emerald-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          {healthy}
        </span>
      )}
      {warning > 0 && (
        <span className="flex items-center gap-0.5 text-xs text-amber-600">
          <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
          {warning}
        </span>
      )}
      {critical > 0 && (
        <span className="flex items-center gap-0.5 text-xs text-red-600">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
          {critical}
        </span>
      )}
    </span>
  );
}

function MemoryIcon({ tone }: { tone: "resolved" | "mitigated" | "noted" }) {
  if (tone === "resolved") {
    return (
      <span className="shrink-0 w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-xs">
        ✓
      </span>
    );
  }
  if (tone === "mitigated") {
    return (
      <span className="shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-semibold">
        i
      </span>
    );
  }
  return (
    <span className="shrink-0 w-5 h-5 rounded-full bg-slate-200 text-slate-500 flex items-center justify-center text-xs">
      ●
    </span>
  );
}

/* ── page ─────────────────────────────────────────────────────────────── */

export default function DashboardPage() {
  const [org, setOrg] = useState("All Organizations");

  const costMax = Math.max(...costTrend.map((d) => d.cost));
  const barMaxHeight = 140;

  return (
    <div className="space-y-6">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500">
            Cloud management intelligence — real-time health, cost, and
            operational memory
          </p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={org}
            onChange={(e) => setOrg(e.target.value)}
            className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white text-slate-700"
          >
            <option>All Organizations</option>
            <option>AI</option>
            <option>AWS CSRE</option>
            <option>Sea-Sbox</option>
          </select>
          <button className="text-sm text-slate-600 flex items-center gap-1.5 border border-slate-200 rounded-lg px-3 py-2 bg-white hover:bg-slate-50 transition-colors">
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* ── Scan status ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 text-sm text-slate-500 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5">
        <span className="animate-spin text-emerald-500">◌</span>
        <span className="text-emerald-700 font-medium">
          Scan in progress...
        </span>
        <span className="text-emerald-600">· 13 assets</span>
      </div>

      {/* ── Top stats row ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        <StatTile
          icon="📋"
          label="Total Assets"
          value="5,154"
          sub="Active resources"
        />
        <StatTile
          icon="💲"
          label="Monthly Cost"
          value="$637"
          sub="+8% vs last month"
          color="text-emerald-600"
        />
        <StatTile
          icon="🔔"
          label="Active Alerts"
          value="3"
          sub="Require attention"
          color="text-red-500"
        />
        <StatTile
          icon="⏱️"
          label="Uptime (30d)"
          value="99.94%"
          sub="2 incidents this month"
          color="text-emerald-600"
        />
      </div>

      {/* ── Two-column layout ──────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">
        {/* LEFT — col-span-2 */}
        <div className="col-span-2 space-y-4">
          {/* Operational Health */}
          <Card title="Operational Health" subtitle="Workload status with incident history">
            <div className="divide-y divide-slate-100">
              {workloads.map((w) => {
                const isInactive = w.count === 0;
                return (
                  <div
                    key={w.name}
                    className={`flex items-center gap-4 py-3 first:pt-0 last:pb-0 ${
                      isInactive ? "opacity-50" : ""
                    }`}
                  >
                    <span className="text-lg w-7 text-center shrink-0">
                      {w.icon}
                    </span>
                    <div className="w-32 shrink-0">
                      <div className="text-sm font-medium text-slate-800">
                        {w.name}
                      </div>
                      <div className="text-xs text-slate-400">
                        {w.count} {w.unit}
                      </div>
                    </div>
                    <div className="w-24 shrink-0">
                      <HealthDots
                        healthy={w.healthy}
                        warning={w.warning}
                        critical={w.critical}
                      />
                    </div>
                    <div className="w-20 shrink-0 text-sm font-medium text-slate-700 tabular-nums">
                      {w.cost > 0 ? `$${w.cost}/mo` : "—"}
                    </div>
                    <div className="flex-1 text-xs text-slate-500 truncate">
                      {w.status}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Cost Trend */}
          <Card title="Cost Trend" subtitle="Monthly cloud spend (last 6 months)">
            <div className="pt-2">
              <svg
                viewBox={`0 0 ${costTrend.length * 64} ${barMaxHeight + 40}`}
                className="w-full"
                style={{ height: barMaxHeight + 40 }}
              >
                {costTrend.map((d, i) => {
                  const barH =
                    (d.cost / (costMax * 1.15)) * barMaxHeight;
                  const x = i * 64 + 8;
                  const barW = 44;
                  return (
                    <g key={d.month}>
                      <rect
                        x={x}
                        y={barMaxHeight - barH}
                        width={barW}
                        height={barH}
                        rx={4}
                        fill={
                          i === costTrend.length - 1
                            ? "#3b82f6"
                            : "#bfdbfe"
                        }
                      />
                      <text
                        x={x + barW / 2}
                        y={barMaxHeight - barH - 8}
                        textAnchor="middle"
                        fontSize="12"
                        fontWeight="600"
                        fill="#334155"
                      >
                        ${d.cost}
                      </text>
                      <text
                        x={x + barW / 2}
                        y={barMaxHeight + 18}
                        textAnchor="middle"
                        fontSize="12"
                        fill="#64748b"
                      >
                        {d.month}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          </Card>
        </div>

        {/* RIGHT — col-span-1 */}
        <div className="col-span-1 space-y-4">
          {/* Cost by Service */}
          <Card title="Cost by Service">
            <div className="flex justify-center mb-4">
              <CostDonut segments={costByService} />
            </div>
            <div className="space-y-2.5">
              {costByService.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ background: s.color }}
                    />
                    <span className="text-slate-600">{s.label}</span>
                  </div>
                  <span className="font-medium text-slate-800 tabular-nums">
                    ${s.value}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {/* Operational Memory */}
          <Card title="Operational Memory" subtitle="Recent Insights">
            <div className="space-y-3">
              {operationalMemory.map((item, i) => (
                <div key={i} className="flex items-start gap-2.5">
                  <MemoryIcon tone={item.tone} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-700 leading-snug">
                      {item.text}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {item.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      {/* ── What's Working Well ─────────────────────────────────────────── */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-emerald-800 mb-3">
          What&apos;s Working Well
        </h3>
        <div className="space-y-2">
          {whatsWorkingWell.map((item, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <span className="shrink-0 w-4.5 h-4.5 text-emerald-600 text-sm">
                ✓
              </span>
              <span className="text-sm text-emerald-800">{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
