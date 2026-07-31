/* ------------------------------------------------------------------ */
/*  Intellicore CMP — Executive health reports                        */
/*  Generates a branded, print-to-PDF health report for the current    */
/*  pillar so a customer can hand a contextual summary to their CIO,   */
/*  CISO, or CFO. Pulls live data through the same data layer the UI   */
/*  uses, so reports reflect exactly what's on screen.                 */
/* ------------------------------------------------------------------ */

import { apiFetch } from "./api";

interface ReportSection {
  label: string;
  endpoint: string;
}

interface ReportConfig {
  slug: string;
  title: string;
  audience: string;
  sections: ReportSection[];
}

/** Per-route report definitions. Keyed by the app route. */
export const REPORT_CONFIG: Record<string, ReportConfig> = {
  "/": {
    slug: "executive-health",
    title: "Executive Cloud Health Report",
    audience: "CIO / CTO",
    sections: [
      { label: "Intelligence Scores", endpoint: "/command-center/scores" },
      { label: "Needs Attention", endpoint: "/command-center/attention" },
      { label: "Operational Patterns", endpoint: "/command-center/memory-patterns" },
    ],
  },
  "/cloudops": {
    slug: "cloudops-health",
    title: "CloudOps Health Report",
    audience: "CIO / Head of Infrastructure",
    sections: [
      { label: "Compute Instances", endpoint: "/cloudops/compute-instances" },
      { label: "Incidents", endpoint: "/cloudops/incidents" },
      { label: "Serverless", endpoint: "/cloudops/serverless" },
      { label: "Data Pipelines", endpoint: "/cloudops/pipelines" },
    ],
  },
  "/finops": {
    slug: "finops-health",
    title: "FinOps Cost Report",
    audience: "CFO / FinOps Lead",
    sections: [
      { label: "Cost by Pillar", endpoint: "/finops/costs" },
      { label: "Optimizations", endpoint: "/finops/optimizations" },
      { label: "Cost Anomalies", endpoint: "/finops/anomalies" },
      { label: "Forecast", endpoint: "/finops/forecast" },
    ],
  },
  "/secops": {
    slug: "cloud-security-health",
    title: "Cloud Security Posture Report",
    audience: "CISO / Security Lead",
    sections: [
      { label: "Findings", endpoint: "/secops/findings" },
      { label: "IAM Risk", endpoint: "/secops/iam" },
      { label: "Compliance", endpoint: "/secops/compliance" },
      { label: "Remediations", endpoint: "/secops/remediations" },
    ],
  },
  "/devops": {
    slug: "devops-health",
    title: "DevOps Change & Delivery Report",
    audience: "VP Engineering / Head of DevOps",
    sections: [
      { label: "Changes", endpoint: "/devops/changes" },
      { label: "Orchestration Requests", endpoint: "/devops/orchestration" },
      { label: "Patch Compliance", endpoint: "/devops/patches" },
      { label: "Deployments", endpoint: "/devops/deployments" },
    ],
  },
  "/aiops": {
    slug: "aiops-health",
    title: "AIOps Activity Report",
    audience: "CIO / Head of Platform",
    sections: [
      { label: "AI Agents", endpoint: "/aiops/agents" },
      { label: "Agent Activity", endpoint: "/aiops/activity" },
      { label: "Cost by Feature", endpoint: "/aiops/cost-by-feature" },
      { label: "Audit Trail", endpoint: "/aiops/audit-trail" },
    ],
  },
};

/** Whether the given route can produce a report. */
export function hasReport(path: string): boolean {
  return path in REPORT_CONFIG;
}

export function reportTitleFor(path: string): string {
  return REPORT_CONFIG[path]?.title ?? "Health Report";
}

/** Fetch the pillar's data, build the report, and trigger a download. */
export async function downloadReport(path: string): Promise<void> {
  const cfg = REPORT_CONFIG[path];
  if (!cfg) return;

  const datasets = await Promise.all(
    cfg.sections.map(async (s) => ({
      label: s.label,
      rows: (await apiFetch<Record<string, unknown>[]>(s.endpoint)) || [],
    })),
  );

  const html = buildReportHtml(cfg, datasets);
  const blob = new Blob([html], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const stamp = new Date().toISOString().slice(0, 10);
  const a = document.createElement("a");
  a.href = url;
  a.download = `intellicore-${cfg.slug}-${stamp}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ── HTML builder ─────────────────────────────────────────────────── */

function esc(v: unknown): string {
  return String(v)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

/** Format a cell value; skips React elements / functions / nested objects. */
function isPrimitiveCell(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  const t = typeof v;
  if (t === "string" || t === "number" || t === "boolean") return true;
  if (Array.isArray(v)) return v.every((x) => typeof x !== "object" && typeof x !== "function");
  return false;
}

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) return v.map((x) => esc(x)).join(", ");
  return esc(v);
}

function renderTable(rows: Record<string, unknown>[]): string {
  if (!rows.length) {
    return `<p class="empty">No data for this section.</p>`;
  }
  // Columns = keys whose values are primitive across all rows.
  const keys = Object.keys(rows[0]).filter((k) =>
    rows.every((r) => isPrimitiveCell(r[k])),
  );
  const head = keys
    .map((k) => `<th>${esc(humanize(k))}</th>`)
    .join("");
  const body = rows
    .map(
      (r) =>
        `<tr>${keys.map((k) => `<td>${formatCell(r[k])}</td>`).join("")}</tr>`,
    )
    .join("");
  return `<table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table>`;
}

function humanize(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function buildReportHtml(
  cfg: ReportConfig,
  datasets: { label: string; rows: Record<string, unknown>[] }[],
): string {
  const generated = new Date().toLocaleString();
  const sections = datasets
    .map(
      (d) => `
      <section>
        <h2>${esc(d.label)} <span class="count">${d.rows.length}</span></h2>
        ${renderTable(d.rows)}
      </section>`,
    )
    .join("");

  const summary = datasets
    .map((d) => `<li><strong>${esc(d.label)}:</strong> ${d.rows.length} item(s)</li>`)
    .join("");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<title>${esc(cfg.title)} — Intellicore CMP</title>
<style>
  :root { --navy:#0f2744; --blue:#1a73e8; --emerald:#059669; --slate:#475569; }
  * { box-sizing: border-box; }
  body { font-family: -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif;
         color: #1e293b; margin: 0; padding: 0; background: #f8fafc; }
  .page { max-width: 920px; margin: 0 auto; padding: 40px; background: #fff; }
  header { border-bottom: 3px solid var(--blue); padding-bottom: 20px; margin-bottom: 24px; }
  .brand { display:flex; align-items:center; gap:10px; color: var(--navy); }
  .brand .logo { width:34px; height:34px; border-radius:50%; background:var(--navy);
                 color:#fff; display:grid; place-items:center; font-weight:700; }
  .brand .cmp { font-size:11px; background:#d1fae5; color:#065f46; padding:2px 6px;
                border-radius:4px; margin-left:4px; }
  h1 { font-size: 24px; margin: 16px 0 4px; color: var(--navy); }
  .meta { color: var(--slate); font-size: 13px; }
  .summary { background:#f1f5f9; border-radius:10px; padding:16px 20px; margin:24px 0; }
  .summary h3 { margin:0 0 8px; font-size:13px; text-transform:uppercase;
                letter-spacing:.05em; color:var(--slate); }
  .summary ul { margin:0; padding-left:18px; font-size:14px; }
  section { margin: 28px 0; page-break-inside: avoid; }
  h2 { font-size:16px; color:var(--navy); border-bottom:1px solid #e2e8f0;
       padding-bottom:6px; }
  h2 .count { font-size:12px; background:#e2e8f0; color:#475569; border-radius:10px;
              padding:1px 8px; margin-left:6px; vertical-align:middle; }
  table { width:100%; border-collapse:collapse; font-size:12.5px; margin-top:10px; }
  th { text-align:left; background:#f8fafc; color:#475569; font-weight:600;
       padding:8px 10px; border-bottom:2px solid #e2e8f0; }
  td { padding:7px 10px; border-bottom:1px solid #f1f5f9; vertical-align:top; }
  tr:nth-child(even) td { background:#fcfdfe; }
  .empty { color:#94a3b8; font-style:italic; font-size:13px; }
  footer { margin-top:40px; padding-top:16px; border-top:1px solid #e2e8f0;
           color:#94a3b8; font-size:12px; }
  .print-bar { position:sticky; top:0; background:var(--navy); color:#fff;
               padding:10px 16px; display:flex; justify-content:space-between;
               align-items:center; font-size:13px; }
  .print-bar button { background:#fff; color:var(--navy); border:none; border-radius:6px;
                      padding:6px 14px; font-weight:600; cursor:pointer; }
  @media print { .print-bar { display:none; } body { background:#fff; }
                 .page { padding:0; max-width:none; } }
</style>
</head>
<body>
  <div class="print-bar">
    <span>Intellicore CMP — ${esc(cfg.title)}</span>
    <button onclick="window.print()">Print / Save as PDF</button>
  </div>
  <div class="page">
    <header>
      <div class="brand">
        <span class="logo">AI</span>
        <span>Intellicore<span class="cmp">CMP</span></span>
      </div>
      <h1>${esc(cfg.title)}</h1>
      <div class="meta">
        Prepared for: ${esc(cfg.audience)} &middot; Generated: ${esc(generated)}<br/>
        Managed by Searce CSRE Squad
      </div>
    </header>

    <div class="summary">
      <h3>Executive Summary</h3>
      <ul>${summary}</ul>
    </div>

    ${sections}

    <footer>
      This report was generated by Intellicore CMP, Searce's AI-native cloud
      management platform. Data reflects the operational state at generation time.
    </footer>
  </div>
</body>
</html>`;
}
