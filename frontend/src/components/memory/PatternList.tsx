import clsx from "clsx";
import { CheckCircle2, AlertTriangle, ShieldCheck } from "lucide-react";
import type { Pattern } from "@/lib/api";

const categoryBar: Record<string, string> = {
  cost: "bg-chr-cost",
  security: "bg-chr-security",
  reliability: "bg-chr-reliability",
  deployment: "bg-chr-deployment",
  ai: "bg-chr-ai",
};

export function PatternList({ patterns }: { patterns: Pattern[] }) {
  if (patterns.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-slate-500 text-sm">
        No high-confidence patterns yet. Memory needs ~90 days of events to
        surface reliable patterns for your team.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {patterns.map((p) => (
        <div
          key={p.id}
          className="bg-white border border-slate-200 rounded-xl overflow-hidden flex"
        >
          <div className={clsx("w-1", categoryBar[p.category] || "bg-slate-500")} />
          <div className="p-5 flex-1">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="text-xs uppercase tracking-widest text-slate-500 font-medium">
                {p.category}
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-500">
                <AlertTriangle className="w-3 h-3" />
                {p.occurrence_count}× recurrence
              </div>
            </div>

            <h3 className="font-medium text-slate-900 mb-2">{p.title}</h3>

            <div className="text-xs text-slate-500 mb-3">
              Impact: <span className="text-slate-700">{p.impact_estimate}</span>
              {" · "}
              Confidence:{" "}
              <span className="text-slate-700">
                {Math.round(p.confidence * 100)}%
              </span>
            </div>

            <div className="text-sm bg-slate-50 border border-slate-100 rounded-lg p-3 mb-3">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-searce-blue mt-0.5 flex-shrink-0" />
                <div className="text-slate-700">{p.recommended_action}</div>
              </div>
            </div>

            {p.guardrail_available && (
              <button className="w-full flex items-center justify-center gap-2 text-sm bg-searce-navy text-white rounded-lg px-3 py-2 hover:bg-searce-navy-2 transition">
                <ShieldCheck className="w-4 h-4" />
                Turn on guardrail — never again
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
