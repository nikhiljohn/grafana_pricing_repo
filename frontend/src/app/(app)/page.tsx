"use client";

import { Card, Donut } from "@/components/charts";

const costByService = [
  { label: "Instance", value: 161, color: "#3b82f6" },
  { label: "Bucket", value: 145, color: "#8b5cf6" },
  { label: "Function", value: 86, color: "#10b981" },
  { label: "Bucket", value: 68, color: "#f59e0b" },
  { label: "Function", value: 48, color: "#ef4444" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">Dashboard</h1>
          <p className="text-sm text-slate-500">Cloud asset inventory overview</p>
        </div>
        <div className="flex items-center gap-3">
          <select className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white">
            <option>All Organizations</option>
            <option>AI</option>
            <option>AWS CSRE</option>
            <option>Sea-Sbox</option>
          </select>
          <button className="text-sm text-slate-600 flex items-center gap-1.5 border border-slate-200 rounded-lg px-3 py-2 bg-white hover:bg-slate-50">
            ↻ Refresh
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-50 rounded-lg px-4 py-2">
        <span className="animate-spin text-emerald-500">◌</span>
        <span className="text-emerald-600 font-medium">Scan in progress...</span>
        <span>· 13 assets</span>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <StatTile icon="📋" label="Total Assets" value="5,154" sub="Active resources" />
        <StatTile icon="$" label="Monthly Cost" value="$250" sub="CE actuals when available" color="text-emerald-600" />
        <StatTile icon="🔔" label="Active Alerts" value="3" sub="Require attention" color="text-red-500" />
        <StatTile icon="🔄" label="Changes (24h)" value="8452" sub="4228 new resources" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card title="Cost Trend" className="col-span-2">
          <div className="h-48 flex items-center justify-center text-slate-400 text-sm">
            Run a scan to see cost trends
          </div>
        </Card>
        <Card title="Cost by Service">
          <div className="flex justify-center mb-4">
            <CostDonut segments={costByService} />
          </div>
          <div className="space-y-2">
            {costByService.map((s, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ background: s.color }} />
                  <span className="text-slate-600">{s.label}</span>
                </div>
                <span className="font-medium text-slate-800">${s.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatTile({ icon, label, value, sub, color }: { icon: string; label: string; value: string; sub: string; color?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xl opacity-60">{icon}</span>
        <span className="text-xs text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
      <div className={`text-3xl font-semibold ${color || "text-slate-800"}`}>{value}</div>
      <div className="text-xs text-slate-400 mt-1">{sub}</div>
    </div>
  );
}

function CostDonut({ segments }: { segments: { label: string; value: number; color: string }[] }) {
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
            cx="80" cy="80" r={r}
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
    </svg>
  );
}
