import Link from "next/link";
import { Search, Bell } from "lucide-react";
import { fetchMe } from "@/lib/api";
import { LogoutButton } from "@/components/LogoutButton";
import { DownloadReport } from "@/components/DownloadReport";
import { BrandLockup } from "@/components/BrandMark";

export async function TopBar() {
  const user = await fetchMe();
  const initials = (user?.email ?? "?")
    .split("@")[0]
    .slice(0, 2)
    .toUpperCase();

  return (
    /* `ic-nav` mirrors the marketing site's <nav>: sticky, 12px backdrop
       blur, 85%-opaque panel, hairline bottom border. */
    <header className="ic-nav h-14 flex items-center px-6 gap-4">
      <Link
        href="/"
        aria-label="Intellicore CMP — go to Command Center"
        className="hover:opacity-90 transition shrink-0"
      >
        <BrandLockup compact />
      </Link>

      <div className="flex-1 max-w-md relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-ic-muted-2" />
        <input
          type="text"
          placeholder="Ask Memory anything about your cloud..."
          className="w-full pl-9 pr-3 py-1.5 border border-ic-border rounded-btn text-sm bg-ic-panel focus:outline-none focus:border-ic-emerald-ink"
        />
      </div>

      <DownloadReport />

      <button
        className="p-2 rounded-btn hover:bg-ic-panel-2 transition"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4 text-ic-muted" />
      </button>

      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-ic-emerald to-emerald-500 text-[#062018] text-xs font-semibold grid place-items-center">
          {initials}
        </div>
        <span className="text-sm text-ic-muted">{user?.email ?? "Signed in"}</span>
        <LogoutButton />
      </div>
    </header>
  );
}
