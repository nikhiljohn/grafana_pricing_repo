export function PageHeader({
  eyebrow,
  title,
  subtitle,
  accent = "#0064FF",
}: {
  eyebrow: string;
  title: string;
  subtitle: string;
  accent?: string;
}) {
  return (
    <header className="flex items-start justify-between">
      <div>
        <div className="text-[11px] uppercase tracking-widest font-medium mb-1" style={{ color: accent }}>
          {eyebrow}
        </div>
        <h1 className="text-2xl font-semibold text-searce-navy">{title}</h1>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl">{subtitle}</p>
      </div>
      <div className="hidden md:flex items-center gap-2 text-xs text-slate-500 border border-slate-200 rounded-lg px-3 py-2 bg-white">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        CSRE squad active · Netcore Cloud
      </div>
    </header>
  );
}

export function StatTile({
  label,
  value,
  delta,
  deltaTone = "neutral",
  spark,
}: {
  label: string;
  value: string;
  delta?: string;
  deltaTone?: "up" | "down" | "neutral";
  spark?: React.ReactNode;
}) {
  const toneMap = {
    up: "text-emerald-600",
    down: "text-rose-600",
    neutral: "text-slate-500",
  };
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5">
      <div className="text-xs uppercase tracking-wider text-slate-500 font-medium">{label}</div>
      <div className="flex items-end justify-between mt-2">
        <div className="text-3xl font-light text-searce-navy">{value}</div>
        {spark}
      </div>
      {delta && <div className={`text-xs mt-1 ${toneMap[deltaTone]}`}>{delta}</div>}
    </div>
  );
}
