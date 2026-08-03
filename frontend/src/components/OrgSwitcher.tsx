"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Building2 } from "lucide-react";
import { TENANTS } from "@/lib/tenants";
import { useOrg } from "@/lib/org-context";

export function OrgSwitcher() {
  const { tenantId, environment, tenant, setTenantId, setEnvironment } = useOrg();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div className="flex items-center gap-2">
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 pl-2 pr-2.5 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
        >
          <span
            className={`w-6 h-6 rounded-md grid place-items-center text-[11px] font-bold ${tenant.accent}`}
          >
            {tenant.name.charAt(0)}
          </span>
          <span className="text-sm font-medium text-slate-800 max-w-[140px] truncate">
            {tenant.name}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
        </button>

        {open && (
          <div className="absolute z-20 top-full left-0 mt-1.5 w-72 bg-white border border-slate-200 rounded-xl shadow-lg py-1.5 max-h-96 overflow-y-auto">
            <div className="px-3 py-1.5 text-[10px] uppercase tracking-wider text-slate-400 font-medium flex items-center gap-1.5">
              <Building2 className="w-3 h-3" />
              Managed book · {TENANTS.length} customers
            </div>
            {TENANTS.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTenantId(t.id);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 hover:bg-slate-50 text-left"
              >
                <span
                  className={`w-7 h-7 rounded-md grid place-items-center text-xs font-bold shrink-0 ${t.accent}`}
                >
                  {t.name.charAt(0)}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-medium text-slate-800 truncate">{t.name}</div>
                  <div className="text-[11px] text-slate-400 truncate">
                    {t.industry} · {t.tagline}
                  </div>
                </div>
                {t.id === tenantId && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-0.5 bg-slate-100 rounded-lg p-0.5">
        {tenant.environments.map((env) => (
          <button
            key={env.id}
            onClick={() => setEnvironment(env.id)}
            className={`px-2.5 py-1 rounded-md text-[12px] font-medium transition-colors ${
              environment === env.id
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            {env.label}
          </button>
        ))}
      </div>
    </div>
  );
}
