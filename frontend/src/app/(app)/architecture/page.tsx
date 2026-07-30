"use client";

export default function ArchitecturePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏗️</span>
          <div>
            <h1 className="text-2xl font-semibold text-slate-800">Architecture Diagram</h1>
            <p className="text-sm text-slate-500">Auto-generated draw.io style diagram from discovered cloud assets</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <select className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white">
            <option>All Organizations</option>
          </select>
          <button className="text-sm text-slate-600 flex items-center gap-1.5 border border-slate-200 rounded-lg px-3 py-2 bg-white hover:bg-slate-50">
            ↻ Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-5 gap-4">
        <StatTile label="Cloud accounts" value="3" />
        <StatTile label="Projects" value="5" />
        <StatTile label="Total assets" value="5,154" color="text-yellow-600" />
        <StatTile label="Monthly cost" value="$637" color="text-emerald-600" />
        <StatTile label="Critical findings" value="157" color="text-red-500" sub="Immediate action required" />
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
        Services grouped into zones: <strong>VPC/Network → Compute → Storage/DB → Security/IAM</strong>. Each tile shows the service type with icon and resource count. Project border color reflects security posture. BigQuery datasets excluded. Updates automatically after every scan. Use Export SVG to share.
      </div>

      <div className="flex items-center gap-4 text-sm text-slate-500">
        <button className="px-2 py-1 border border-slate-200 rounded hover:bg-slate-50">🔍+</button>
        <button className="px-2 py-1 border border-slate-200 rounded hover:bg-slate-50">🔍−</button>
        <span>100%</span>
        <button className="px-3 py-1 border border-slate-200 rounded hover:bg-slate-50 flex items-center gap-1">
          📥 Export SVG
        </button>
        <span>100%</span>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-8 min-h-[500px]">
        <div className="flex flex-col items-center">
          <div className="bg-slate-100 border border-slate-300 rounded-lg px-4 py-2 text-sm flex items-center gap-2 mb-6">
            🌐 <div><div className="font-medium">Internet</div><div className="text-xs text-slate-400">Users / API</div></div>
          </div>

          <div className="w-px h-8 bg-red-400" />

          <div className="w-full max-w-4xl border-2 border-slate-200 rounded-xl p-6 relative">
            <div className="absolute -top-3 left-4 bg-white px-2">
              <span className="bg-emerald-500 text-white text-xs px-2 py-0.5 rounded font-medium">GCP</span>
              <span className="text-sm font-medium text-slate-700 ml-2">Sea-GCP-Sbox</span>
            </div>
            <div className="text-xs text-slate-500 mb-4">Project: 138101788 · 4,623 assets · $368/mo</div>
            <div className="absolute top-2 right-4">
              <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2 py-1 rounded">100/100</span>
            </div>

            <div className="border border-dashed border-emerald-300 rounded-lg p-4 mb-4">
              <div className="text-xs text-emerald-600 font-medium mb-3 bg-emerald-50 inline-block px-2 py-0.5 rounded">VPC / Network</div>
              <div className="flex gap-4">
                <ResourceTile icon="🔲" name="Subnet" count={99} />
                <ResourceTile icon="🔵" name="IP Address" count={11} />
              </div>
            </div>

            <div className="border border-dashed border-blue-300 rounded-lg p-4">
              <div className="text-xs text-blue-600 font-medium mb-3 bg-blue-50 inline-block px-2 py-0.5 rounded">Compute / Containers</div>
              <div className="flex gap-4 flex-wrap">
                <ResourceTile icon="📦" name="Repository" count={0} />
                <ResourceTile icon="⚡" name="Cloud Functi..." count={0} />
                <ResourceTile icon="🟦" name="Cloud Run" count={0} />
                <ResourceTile icon="🔧" name="CustomJob" count={0} />
                <ResourceTile icon="🛡️" name="Firewall" count={0} />
                <ResourceTile icon="🟦" name="Cloud Run" count={0} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatTile({ label, value, color, sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 text-center">
      <div className="text-xs text-slate-500 mb-1">{label}</div>
      <div className={`text-2xl font-semibold ${color || "text-slate-800"}`}>{value}</div>
      {sub && <div className="text-[10px] text-slate-400 mt-0.5">{sub}</div>}
    </div>
  );
}

function ResourceTile({ icon, name, count }: { icon: string; name: string; count: number }) {
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 w-24 text-center">
      <div className="text-2xl mb-1">{icon}</div>
      <div className="text-xs text-slate-600 truncate">{name}</div>
      <div className="text-[10px] text-slate-400">{count}</div>
    </div>
  );
}
