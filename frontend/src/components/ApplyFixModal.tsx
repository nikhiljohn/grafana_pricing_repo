"use client";

/* ------------------------------------------------------------------ */
/*  Intellicore CMP — shared "apply the fix" confirmation modal        */
/*  Every pillar page that offers a Memory-backed action (FinOps       */
/*  anomaly, Cloud Security finding, DevOps orchestration request,     */
/*  Command Center attention item, AIOps chat) opens this same modal   */
/*  instead of firing a decorative button. There is no real            */
/*  remediation backend wired up yet (see BACKLOG.md — "real           */
/*  remediation execution"), so confirming here simulates the apply    */
/*  step and lets the calling page update its own local state (mark    */
/*  the item resolved, remove it from the list, etc.) via onConfirm.   */
/* ------------------------------------------------------------------ */

import { useState } from "react";

interface ApplyFixModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  pillar?: string;
  title: string;
  memoryContext: string;
  confidence?: number | string | null;
  fixDescription: string;
  confirmLabel?: string;
}

export function ApplyFixModal({
  open,
  onClose,
  onConfirm,
  pillar,
  title,
  memoryContext,
  confidence,
  fixDescription,
  confirmLabel = "Apply Fix",
}: ApplyFixModalProps) {
  const [applying, setApplying] = useState(false);
  const [done, setDone] = useState(false);

  if (!open) return null;

  function handleConfirm() {
    setApplying(true);
    // Simulated apply — no live remediation backend yet. Real enough to
    // change the page's state (mark resolved / remove from queue) rather
    // than just closing a dialog, which is what made the old buttons
    // decorative.
    window.setTimeout(() => {
      setApplying(false);
      setDone(true);
      onConfirm();
      window.setTimeout(() => {
        setDone(false);
        onClose();
      }, 850);
    }, 650);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {pillar && (
          <span className="inline-block rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-600">
            {pillar}
          </span>
        )}
        <h3 className="mt-2 text-base font-semibold text-slate-800">{title}</h3>

        <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800">
          <span className="text-xs font-semibold uppercase tracking-wide text-blue-600">
            Memory says
          </span>
          <p className="mt-1 leading-relaxed">{memoryContext}</p>
          {confidence !== undefined && confidence !== null && (
            <p className="mt-2 text-xs font-medium text-blue-700">
              Confidence: {confidence}
              {typeof confidence === "number" ? "%" : ""}
            </p>
          )}
        </div>

        <div className="mt-4 rounded-lg border border-slate-200 p-4 text-sm text-slate-700">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            What Intellicore will do
          </span>
          <p className="mt-1 leading-relaxed">{fixDescription}</p>
        </div>

        <p className="mt-3 text-xs text-slate-400">
          The outcome doesn&apos;t land the instant you click this — Intellicore applies the
          fix, then keeps watching to confirm it held.
        </p>

        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={applying}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={applying || done}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-60"
          >
            {done ? "Applied ✓" : applying ? "Applying…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
