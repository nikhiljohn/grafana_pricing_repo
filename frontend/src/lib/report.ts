/* ------------------------------------------------------------------ */
/*  Intellicore CMP — Executive health reports (PDF)                  */
/*  Generates a branded PDF health report for the current pillar so a  */
/*  customer can hand a contextual summary to their CIO, CISO, or CFO. */
/*  Pulls live data through the same data layer the UI uses.           */
/* ------------------------------------------------------------------ */

import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
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

export function hasReport(path: string): boolean {
  return path in REPORT_CONFIG;
}

export function reportTitleFor(path: string): string {
  return REPORT_CONFIG[path]?.title ?? "Health Report";
}

/** Fetch the pillar's data, build a PDF, and trigger a download. */
export async function downloadReport(path: string): Promise<void> {
  const cfg = REPORT_CONFIG[path];
  if (!cfg) return;

  const datasets = await Promise.all(
    cfg.sections.map(async (s) => ({
      label: s.label,
      rows: (await apiFetch<Record<string, unknown>[]>(s.endpoint)) || [],
    })),
  );

  const doc = buildPdf(cfg, datasets);
  const stamp = new Date().toISOString().slice(0, 10);
  doc.save(`intellicore-${cfg.slug}-${stamp}.pdf`);
}

/* ── PDF builder ──────────────────────────────────────────────────── */

const NAVY: [number, number, number] = [15, 39, 68];
const BLUE: [number, number, number] = [26, 115, 232];
const SLATE: [number, number, number] = [71, 85, 105];
const HEAD_BG: [number, number, number] = [248, 250, 252];

function isPrimitiveCell(v: unknown): boolean {
  if (v === null || v === undefined) return true;
  const t = typeof v;
  if (t === "string" || t === "number" || t === "boolean") return true;
  if (Array.isArray(v)) return v.every((x) => typeof x !== "object" && typeof x !== "function");
  return false;
}

function formatCell(v: unknown): string {
  if (v === null || v === undefined) return "";
  if (Array.isArray(v)) return v.map((x) => String(x)).join(", ");
  return String(v);
}

function humanize(key: string): string {
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function buildPdf(
  cfg: ReportConfig,
  datasets: { label: string; rows: Record<string, unknown>[] }[],
): jsPDF {
  const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 36;
  const generated = new Date().toLocaleString();

  // ── Header band ──
  doc.setFillColor(...NAVY);
  doc.circle(margin + 10, 34, 10, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("AI", margin + 10, 37, { align: "center" });

  doc.setTextColor(...NAVY);
  doc.setFontSize(13);
  doc.text("Intellicore CMP", margin + 28, 32);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...SLATE);
  doc.setFontSize(9);
  doc.text("A Searce Product · Powered by CSRE", margin + 28, 44);

  doc.setDrawColor(...BLUE);
  doc.setLineWidth(2);
  doc.line(margin, 56, pageW - margin, 56);

  // ── Title block ──
  doc.setTextColor(...NAVY);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text(cfg.title, margin, 82);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...SLATE);
  doc.setFontSize(10);
  doc.text(`Prepared for: ${cfg.audience}    ·    Generated: ${generated}`, margin, 98);
  doc.text("Managed by Searce CSRE Squad", margin, 112);

  // ── Executive summary ──
  let y = 134;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...NAVY);
  doc.text("Executive Summary", margin, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...SLATE);
  for (const d of datasets) {
    doc.text(`•  ${d.label}: ${d.rows.length} item(s)`, margin + 6, y);
    y += 14;
  }
  y += 6;

  // ── Sections ──
  for (const d of datasets) {
    if (y > pageH - 90) {
      doc.addPage();
      y = margin + 10;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...NAVY);
    doc.text(`${d.label}  (${d.rows.length})`, margin, y);
    y += 6;

    if (!d.rows.length) {
      y += 14;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text("No data for this section.", margin, y);
      y += 16;
      continue;
    }

    const keys = Object.keys(d.rows[0]).filter((k) =>
      d.rows.every((r) => isPrimitiveCell(r[k])),
    );
    const head = [keys.map((k) => humanize(k))];
    const body = d.rows.map((r) => keys.map((k) => formatCell(r[k])));

    autoTable(doc, {
      head,
      body,
      startY: y + 6,
      margin: { left: margin, right: margin },
      styles: { fontSize: 7.5, cellPadding: 3, overflow: "linebreak", valign: "top" },
      headStyles: { fillColor: HEAD_BG, textColor: SLATE, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [252, 253, 254] },
      tableWidth: "auto",
    });
    const lastY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY;
    y = (lastY ?? y) + 22;
  }

  // ── Footer on every page ──
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.line(margin, pageH - 26, pageW - margin, pageH - 26);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(
      "Intellicore CMP · Searce · Data reflects the operational state at generation time.",
      margin,
      pageH - 14,
    );
    doc.text(`Page ${i} of ${pageCount}`, pageW - margin, pageH - 14, { align: "right" });
  }

  return doc;
}
