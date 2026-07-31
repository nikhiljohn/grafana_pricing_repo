"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

/** Light/dark toggle. Persists the choice and flips the `dark` class on
 *  <html>; the dark-mode override layer in globals.css does the recolor. */
export function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const el = document.documentElement;
    const next = !el.classList.contains("dark");
    el.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      /* ignore */
    }
    setDark(next);
  }

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-2.5 px-2.5 py-[7px] w-full rounded-lg text-[13px] text-slate-600 hover:bg-slate-50"
    >
      {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      <span>{dark ? "Light mode" : "Dark mode"}</span>
    </button>
  );
}
