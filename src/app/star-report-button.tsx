"use client";

import { useState } from "react";

export function StarReportButton({ reportId, mode, compact = false }: { reportId: string; mode: "clarity" | "dank"; compact?: boolean }) {
  const storageKey = `thc-starred-report:${reportId}`;
  const [starred, setStarred] = useState(() => (typeof window === "undefined" ? false : window.localStorage.getItem(storageKey) === "1"));

  function toggleStar() {
    const next = !starred;
    setStarred(next);
    if (next) window.localStorage.setItem(storageKey, "1");
    else window.localStorage.removeItem(storageKey);
  }

  const label = starred ? "Starred" : compact ? "Star" : "App Star";
  return (
    <button
      type="button"
      onClick={toggleStar}
      title="Local app star for now. GitHub login-backed registry stars are the next Supabase auth step."
      aria-pressed={starred}
      className={
        mode === "dank"
          ? `inline-flex items-center justify-center gap-1 border px-2 py-1 text-[10px] font-black uppercase ${starred ? "border-lime-300 bg-lime-300/20 text-lime-100 shadow-[0_0_14px_rgba(190,242,100,0.25)]" : "border-pink-500/45 bg-pink-500/10 text-pink-200"}`
          : `inline-flex items-center justify-center gap-1 rounded-sm border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${starred ? "border-emerald-300 bg-emerald-50 text-emerald-800" : "border-stone-300 bg-white/80 text-stone-600"}`
      }
    >
      <span aria-hidden>{starred ? "★" : "☆"}</span>
      {!compact ? <span>{label}</span> : null}
    </button>
  );
}
