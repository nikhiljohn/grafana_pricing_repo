import clsx from "clsx";

const toneStyles = {
  cost: "text-chr-cost bg-chr-cost/10",
  security: "text-chr-security bg-chr-security/10",
  reliability: "text-chr-reliability bg-chr-reliability/10",
  deployment: "text-chr-deployment bg-chr-deployment/10",
  ai: "text-chr-ai bg-chr-ai/10",
};

type Tone = keyof typeof toneStyles;

export function StatCard({
  label,
  value,
  delta,
  icon,
  tone = "reliability",
}: {
  label: string;
  value: string;
  delta?: string;
  icon: React.ReactNode;
  tone?: Tone;
}) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">
          {label}
        </span>
        <div className={clsx("p-1.5 rounded-lg", toneStyles[tone])}>{icon}</div>
      </div>
      <div className="text-3xl font-light text-ic-text">{value}</div>
      {delta && <div className="text-xs text-slate-500 mt-1">{delta}</div>}
    </div>
  );
}
