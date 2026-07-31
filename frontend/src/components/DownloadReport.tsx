"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { Download, Loader2 } from "lucide-react";
import { hasReport, downloadReport, reportTitleFor } from "@/lib/report";

/**
 * Route-aware "Download report" button. Appears in the top bar on any
 * pillar page and generates a contextual, print-to-PDF executive health
 * report for that pillar (CloudOps / FinOps / Cloud Security / DevOps /
 * AIOps / Command Center).
 */
export function DownloadReport() {
  const pathname = usePathname();
  const [busy, setBusy] = useState(false);

  if (!hasReport(pathname)) return null;

  async function onClick() {
    setBusy(true);
    try {
      await downloadReport(pathname);
    } finally {
      setBusy(false);
    }
  }

  return (
    <button
      onClick={onClick}
      disabled={busy}
      title={reportTitleFor(pathname)}
      className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-50 disabled:opacity-50"
    >
      {busy ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      <span className="hidden sm:inline">Download report</span>
    </button>
  );
}
