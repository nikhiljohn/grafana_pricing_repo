"use client";

import { LogOut } from "lucide-react";

export function LogoutButton() {
  return (
    <button
      title="Sign out"
      className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500"
      onClick={async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/login";
      }}
    >
      <LogOut className="w-4 h-4" />
    </button>
  );
}
