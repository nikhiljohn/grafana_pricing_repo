import { Search, Bell } from "lucide-react";
import { fetchMe } from "@/lib/api";
import { LogoutButton } from "@/components/LogoutButton";
import { DownloadReport } from "@/components/DownloadReport";

export async function TopBar() {
  const user = await fetchMe();
  const initials = (user?.email ?? "?")
    .split("@")[0]
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="h-14 border-b border-slate-200 bg-white flex items-center px-6 gap-4">
      <div className="flex-1 max-w-md relative">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Ask Memory anything about your cloud..."
          className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-searce-blue"
        />
      </div>

      <DownloadReport />

      <button className="p-2 hover:bg-slate-100 rounded-lg">
        <Bell className="w-4 h-4 text-slate-600" />
      </button>

      <div className="flex items-center gap-2">
        <div className="w-7 h-7 rounded-full bg-searce-blue text-white text-xs font-medium grid place-items-center">
          {initials}
        </div>
        <span className="text-sm text-slate-700">{user?.email ?? "Signed in"}</span>
        <LogoutButton />
      </div>
    </header>
  );
}
