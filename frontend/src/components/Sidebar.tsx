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
  Bot,
  Database,
  Bell,
  Brain,
  LogOut,
  Settings,
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";

type NavItem =
  | { href: string; label: string; icon: React.ElementType; badge?: string }
  | { section: string };

const nav: NavItem[] = [
  { section: "INTELLIGENCE" },
  { href: "/", label: "Command Center", icon: Command },
  { href: "/cloudops", label: "CloudOps", icon: Cloud },
  { href: "/finops", label: "FinOps", icon: DollarSign },
  { href: "/secops", label: "Cloud Security", icon: Shield, badge: "12" },
  { href: "/devops", label: "DevOps", icon: GitBranch },
  { href: "/aiops", label: "AIOps", icon: Sparkles, badge: "Beta" },
  { href: "/agents", label: "Agent Ops", icon: Bot, badge: "16" },
  { section: "REFERENCE" },
  { href: "/assets", label: "Assets / CMDB", icon: Database },
  { href: "/alerts", label: "Alerts", icon: Bell, badge: "3" },
  { href: "/memory", label: "Memory", icon: Brain },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 bg-ic-panel border-r border-ic-border flex flex-col shrink-0 h-screen sticky top-0">
      {/* No wordmark here — the brand lockup lives in the header (TopBar),
          matching the marketing site, where the <nav> owns the branding. */}
      <nav className="flex-1 overflow-y-auto px-2 pt-3 pb-4">
        {nav.map((item, i) => {
          if ("section" in item) {
            return (
              <div key={i} className="px-2 pt-5 pb-1.5 text-[10px] uppercase tracking-wider text-ic-muted-2 font-medium">
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
                "flex items-center gap-2.5 px-2.5 py-[7px] rounded-btn text-[13px] transition",
                active
                  ? /* Same emerald tint the site uses for its `.eyebrow` pill. */
                    "bg-[rgba(5,150,105,0.08)] text-ic-emerald-ink font-medium"
                  : "text-ic-muted hover:bg-ic-panel-2 hover:text-ic-text",
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span className="flex-1 truncate">{item.label}</span>
              {"badge" in item && item.badge && (
                <span className={clsx(
                  "text-[10px] font-medium px-1.5 py-0.5 rounded-full",
                  item.badge === "12"
                    ? "bg-[rgba(225,29,72,0.10)] text-ic-rose-ink"
                    : item.badge === "3"
                    ? "bg-[rgba(180,83,9,0.10)] text-ic-amber-ink"
                    : "bg-ic-panel-2 text-ic-muted-2"
                )}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-ic-border p-3">
        <div className="px-2.5 py-1.5 mb-2">
          <div className="text-[10px] text-ic-muted-2 uppercase tracking-wider mb-1">Managed by</div>
          <div className="text-[11px] font-medium text-ic-emerald-ink">Searce CSRE Squad</div>
          <div className="text-[10px] text-ic-muted-2">Last review: 2h ago</div>
        </div>
        <ThemeToggle />
        <div className="flex items-center gap-2.5 px-2.5 py-2 mt-1">
          <div className="w-7 h-7 rounded-full bg-[rgba(5,150,105,0.10)] text-ic-emerald-ink flex items-center justify-center text-xs font-semibold">
            N
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[13px] font-medium text-ic-text truncate">Nikhil John</div>
            <div className="text-[10px] text-ic-muted-2 uppercase">VIEWER</div>
          </div>
          <button className="p-1 text-ic-muted-2 hover:text-ic-muted" aria-label="Sign out">
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}
