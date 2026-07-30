import clsx from "clsx";
import type { TimelineEvent } from "@/lib/api";

const categoryStyles: Record<string, string> = {
  cost: "bg-chr-cost text-white",
  security: "bg-chr-security text-white",
  reliability: "bg-chr-reliability text-white",
  deployment: "bg-chr-deployment text-white",
  ai: "bg-chr-ai text-white",
};

const severityDot: Record<string, string> = {
  info: "bg-slate-400",
  warning: "bg-amber-500",
  critical: "bg-rose-600",
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function groupByMonth(events: TimelineEvent[]): Array<[string, TimelineEvent[]]> {
  const map = new Map<string, TimelineEvent[]>();
  for (const event of events) {
    const d = new Date(event.timestamp);
    const key = d.toLocaleDateString("en-IN", { month: "long", year: "numeric" });
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(event);
  }
  return [...map.entries()];
}

export function Timeline({ events }: { events: TimelineEvent[] }) {
  if (events.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-slate-500">
        Your Memory graph is being built. Events will appear here as they are
        ingested from your connected cloud accounts.
      </div>
    );
  }

  const grouped = groupByMonth(events);

  return (
    <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100">
      {grouped.map(([month, monthEvents]) => (
        <div key={month} className="p-6">
          <div className="text-xs uppercase tracking-widest text-slate-500 font-medium mb-4">
            {month}
          </div>
          <ol className="relative border-l border-slate-200 ml-2 space-y-6">
            {monthEvents.map((event) => (
              <li key={event.id} className="pl-6 relative">
                <span
                  className={clsx(
                    "absolute -left-[7px] top-1 w-3 h-3 rounded-full ring-4 ring-white",
                    severityDot[event.severity] || "bg-slate-400",
                  )}
                />

                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={clsx(
                          "text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded font-medium",
                          categoryStyles[event.category] || "bg-slate-500 text-white",
                        )}
                      >
                        {event.category}
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatDate(event.timestamp)}
                      </span>
                      {event.caused.length > 0 && (
                        <span className="text-xs text-slate-400">
                          · caused {event.caused.length}{" "}
                          downstream event{event.caused.length === 1 ? "" : "s"}
                        </span>
                      )}
                    </div>

                    <div className="text-sm font-medium text-slate-900">
                      {event.title}
                    </div>
                    <div className="text-sm text-slate-500 mt-0.5">
                      {event.summary}
                    </div>

                    {event.resource_id && (
                      <div className="text-xs text-slate-400 mt-1 font-mono">
                        {event.resource_type}/{event.resource_id}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}
