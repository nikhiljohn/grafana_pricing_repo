"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  Command,
  Cloud,
  DollarSign,
  Shield,
  GitBranch,
  Sparkles,
  Database,
  Bell,
  Brain,
  Moon,
  LogOut,
} from "lucide-react";

type NavItem =
  | { href: string; label: string; icon: React.ElementType; badge?: string }
  | { section: string };

const nav: NavItem[] = [
  { section: "INTELLIGENCE" },
  { href: "/", label: "Command Center", icon: Command },
  { href: "/cloudops", label: "CloudOps", icon: Cloud },
  { href: "/finops", label: "FinOps", icon: DollarSign },
  { href: "/secops", label: "SecOps", icon: Shield, badge: "12" },
  { href: "/devops", label: "DevOps", icon: GitBranch },
  { href: "/aiops", label: "AIOps", icon: Sparkles, badge: "Beta" },
  { section: "REFERENCE" },
  { href: "/assets", label: "Assets / CMDB", icon: Database },
  { href: "/alerts", label: "Alerts", icon: Bell, badge: "3" },
  { href: "/memory", label: "Memory", icon: Brain },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-white border-r border-slate-200 flex flex-col shrink-0 h-screen sticky top-0">
      <div className="p-4 pb-3 flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center">
          <span className="text-white text-xs font-bold">AI</span>
        </div>
        <div>
          <span className="text-sm font-semibold text-slate-800">Intellicore</span>
          <span className="ml-1 text-[10px] font-medium bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">CMP</span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 pb-4">
        {nav.map((item, i) => {
          if ("section" in item) {
            return (
              <div key={i} className="px-2 pt-5 pb-1.5 text-[10px] uppercase tracking-wider text-slate-400 font-medium">
                {item.section}
              </div>
            );
          }
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-2.5 px-2.5 py-[7px] rounded-lg text-[13px] transition",
                active
                  ? "bg-emerald-50 text-emerald-700 font-medium"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              {"badge" in item && item.badge && (
                <span className={clsx(
                  "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                  item.badge === "12"
                    ? "bg-red-100 text-red-600"
                    : item.badge === "3"
                    ? "bg-amber-100 text-amber-600"
                    : "bg-slate-100 text-slate-500"
                )}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-slate-200 p-3">
        <div className="px-2.5 py-1.5 mb-2">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1">Managed by</div>
          <div className="text-[11px] font-medium text-emerald-700">Searce CSRE Squad</div>
          <div className="text-[10px] text-slate-400">Last review: 2h ago</div>
        </div>
        <button className="flex items-center gap-2.5 px-2.5 py-[7px] w-full rounded-lg text-[13px] text-slate-600 hover:bg-slate-50">
          <Moon className="w-4 h-4" />
          <span>Dark mode</span>
        </button>
        <div className="flex items-center gap-2.5 px-2.5 py-2 mt-1">
          <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-semibold">
            N
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium text-slate-800 truncate">Nikhil John</div>
            <div className="text-[10px] text-slate-400 uppercase">VIEWER</div>
          </div>
          <button className="p-1 text-slate-400 hover:text-slate-600">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
