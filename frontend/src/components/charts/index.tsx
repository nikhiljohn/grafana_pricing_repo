/**
 * Lightweight, dependency-free SVG chart primitives for Intellicore CMP.
 * Pure render (server-component safe) so they screenshot crisply.
 *
 * Palette (validated for CVD separation + contrast):
 *   #1a56db blue · #0694a2 teal · #7e3af2 purple · #0e9f6e green
 * Status: good #0e9f6e · warning #f59e0b · critical #e02424
 */

export const PALETTE = ["#1a56db", "#0694a2", "#7e3af2", "#0e9f6e"];
export const STATUS = {
  good: "#0e9f6e",
  warning: "#f59e0b",
  serious: "#f97316",
  critical: "#e02424",
};

const AXIS = "#94a3b8";
const GRID = "#e2e8f0";
const INK = "#334155";
const MUTED = "#64748b";

// ─── Vertical bar chart ────────────────────────────────────────────────
export function BarChart({
  data,
  height = 200,
  color = "#0064FF",
  valueFormat = (v: number) => String(v),
}: {
  data: { label: string; value: number }[];
  height?: number;
  color?: string;
  valueFormat?: (v: number) => string;
}) {
  const w = 400;
  const max = Math.max(...data.map((d) => d.value)) * 1.18 || 1;
  const n = data.length;
  const gap = 10;
  const bw = (w - gap * (n - 1)) / n;
  const plotH = height - 34;

  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }}>
      {[0.25, 0.5, 0.75, 1].map((t) => (
        <line key={t} x1={0} x2={w} y1={plotH - plotH * t} y2={plotH - plotH * t} stroke={GRID} strokeWidth={1} />
      ))}
      {data.map((d, i) => {
        const bh = (d.value / max) * plotH;
        const x = i * (bw + gap);
        return (
          <g key={d.label}>
            <rect x={x} y={plotH - bh} width={bw} height={bh} rx={4} fill={color} />
            <text x={x + bw / 2} y={plotH - bh - 6} textAnchor="middle" fontSize={13} fill={INK} fontWeight={600}>
              {valueFormat(d.value)}
            </text>
            <text x={x + bw / 2} y={plotH + 20} textAnchor="middle" fontSize={12} fill={MUTED}>
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Line + area chart ─────────────────────────────────────────────────
export function LineChart({
  points,
  labels,
  height = 200,
  color = "#0064FF",
  fill = true,
}: {
  points: number[];
  labels?: string[];
  height?: number;
  color?: string;
  fill?: boolean;
}) {
  const w = 400;
  const plotH = height - 22;
  const dataMax = Math.max(...points);
  const dataMin = Math.min(...points);
  const pad = (dataMax - dataMin) * 0.18 || dataMax * 0.1 || 1;
  const max = dataMax + pad;
  const min = dataMin - pad;
  const range = max - min || 1;
  const stepX = w / (points.length - 1 || 1);

  const coords = points.map((p, i) => {
    const x = i * stepX;
    const y = plotH - ((p - min) / range) * plotH;
    return [x, y] as const;
  });

  const path = coords.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x} ${y}`).join(" ");
  const area = `${path} L ${w} ${plotH} L 0 ${plotH} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }}>
      {[0.33, 0.66, 1].map((t) => (
        <line key={t} x1={0} x2={w} y1={plotH - plotH * t} y2={plotH - plotH * t} stroke={GRID} strokeWidth={1} />
      ))}
      {fill && <path d={area} fill={color} opacity={0.1} />}
      <path d={path} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
      {coords.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r={3} fill={color} />
      ))}
      {labels &&
        labels.map((l, i) => {
          const x = (i / (labels.length - 1)) * w;
          return (
            <text key={i} x={x} y={height - 4} textAnchor={i === 0 ? "start" : i === labels.length - 1 ? "end" : "middle"} fontSize={12} fill={MUTED}>
              {l}
            </text>
          );
        })}
    </svg>
  );
}

// ─── Horizontal ranking bars ───────────────────────────────────────────
export function HBar({
  data,
  valueFormat = (v: number) => String(v),
}: {
  data: { label: string; value: number; color?: string }[];
  valueFormat?: (v: number) => string;
}) {
  const max = Math.max(...data.map((d) => d.value)) || 1;
  return (
    <div className="space-y-2.5">
      {data.map((d, i) => (
        <div key={d.label} className="flex items-center gap-3 text-sm">
          <span className="w-28 shrink-0 text-slate-600 truncate">{d.label}</span>
          <div className="flex-1 h-5 bg-slate-100 rounded-md overflow-hidden">
            <div
              className="h-full rounded-md"
              style={{ width: `${(d.value / max) * 100}%`, background: d.color || PALETTE[i % PALETTE.length] }}
            />
          </div>
          <span className="w-20 shrink-0 text-right font-medium text-slate-800 tabular-nums">
            {valueFormat(d.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Donut / gauge ─────────────────────────────────────────────────────
export function Donut({
  value,
  max = 100,
  label,
  sublabel,
  color = "#0e9f6e",
  size = 160,
}: {
  value: number;
  max?: number;
  label?: string;
  sublabel?: string;
  color?: string;
  size?: number;
}) {
  const r = 42;
  const c = 2 * Math.PI * r;
  const pct = Math.min(value / max, 1);
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx={50} cy={50} r={r} fill="none" stroke={GRID} strokeWidth={9} />
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
        <span className="text-3xl font-light text-ic-text">{label ?? value}</span>
        {sublabel && <span className="text-[11px] text-slate-500 mt-0.5">{sublabel}</span>}
      </div>
    </div>
  );
}

// ─── Stacked severity bar ──────────────────────────────────────────────
export function StackedBar({
  segments,
}: {
  segments: { label: string; value: number; color: string }[];
}) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  return (
    <div>
      <div className="flex h-4 w-full rounded-md overflow-hidden gap-[2px]">
        {segments.map((s) => (
          <div key={s.label} style={{ width: `${(s.value / total) * 100}%`, background: s.color }} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3">
        {segments.map((s) => (
          <div key={s.label} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />
            {s.label} <span className="font-medium text-slate-800">{s.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Sparkline (inline) ────────────────────────────────────────────────
export function Sparkline({ points, color = "#0064FF", width = 90, height = 28 }: { points: number[]; color?: string; width?: number; height?: number }) {
  const max = Math.max(...points);
  const min = Math.min(...points);
  const range = max - min || 1;
  const stepX = width / (points.length - 1 || 1);
  const path = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${i * stepX} ${height - ((p - min) / range) * height}`)
    .join(" ");
  return (
    <svg width={width} height={height} className="overflow-visible">
      <path d={path} fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ─── Section card wrapper ──────────────────────────────────────────────
export function Card({ title, subtitle, action, children, className = "" }: { title?: string; subtitle?: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl p-5 ${className}`}>
      {(title || action) && (
        <div className="flex items-start justify-between mb-4">
          <div>
            {title && <h3 className="text-sm font-semibold text-ic-text">{title}</h3>}
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function Pill({ tone = "good", children }: { tone?: keyof typeof STATUS | "neutral"; children: React.ReactNode }) {
  const map: Record<string, string> = {
    good: "bg-emerald-50 text-emerald-700",
    warning: "bg-amber-50 text-amber-700",
    serious: "bg-orange-50 text-orange-700",
    critical: "bg-rose-50 text-rose-700",
    neutral: "bg-slate-100 text-slate-600",
  };
  return <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${map[tone]}`}>{children}</span>;
}
