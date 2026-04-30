"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { copyForMode, sidebarItems, type DisplayMode } from "@/lib/ui/modes";

type ModeContextValue = {
  mode: DisplayMode;
  setMode: (mode: DisplayMode) => void;
  copy: ReturnType<typeof copyForMode>;
};

const ModeContext = createContext<ModeContextValue | null>(null);

export function ModeShell({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<DisplayMode>("clarity");
  const setPersistedMode = (nextMode: DisplayMode) => {
    setMode(nextMode);
    window.localStorage.setItem("thc-display-mode", nextMode);
  };
  const value = useMemo(() => ({ mode, setMode: setPersistedMode, copy: copyForMode(mode) }), [mode]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const savedMode = window.localStorage.getItem("thc-display-mode");
      if (savedMode === "clarity" || savedMode === "dank") {
        setMode(savedMode);
      }
    }, 0);
    return () => window.clearTimeout(timeoutId);
  }, []);

  return (
    <ModeContext.Provider value={value}>
      <div data-mode={mode} className={`min-h-screen ${mode === "dank" ? "dank-cursor bg-[#09090b] text-lime-50" : "bg-[#f5f1e8] text-zinc-950"}`}>
        {children}
      </div>
    </ModeContext.Provider>
  );
}

export function useDisplayMode() {
  const value = useContext(ModeContext);
  if (!value) {
    throw new Error("useDisplayMode must be used inside ModeShell.");
  }
  return value;
}

export function ModeToggle() {
  const { mode, setMode } = useDisplayMode();
  const active = "bg-zinc-950 text-white shadow-sm dark:bg-lime-300 dark:text-zinc-950";
  const inactive = "text-zinc-600 hover:text-zinc-950 dark:text-lime-100/70 dark:hover:text-lime-100";

  return (
    <div className="inline-flex rounded-full border border-zinc-300/80 bg-white/70 p-1 text-xs font-semibold shadow-sm backdrop-blur dark:border-lime-300/30 dark:bg-black/40">
      <button
        type="button"
        onClick={() => setMode("clarity")}
        className={`rounded-full px-3 py-1.5 transition ${mode === "clarity" ? active : inactive}`}
        aria-pressed={mode === "clarity"}
      >
        Clarity
      </button>
      <button
        type="button"
        onClick={() => setMode("dank")}
        className={`rounded-full px-3 py-1.5 transition ${mode === "dank" ? "bg-lime-300 text-zinc-950 shadow-[0_0_18px_rgba(190,242,100,0.55)]" : inactive}`}
        aria-pressed={mode === "dank"}
      >
        Dank
      </button>
    </div>
  );
}

export function ModeChrome({ children }: { children: React.ReactNode }) {
  const { mode } = useDisplayMode();
  return (
    <main
      className={
        mode === "dank"
          ? "mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-5 sm:px-6 lg:py-7"
          : "mx-auto flex w-full max-w-7xl flex-1 flex-col gap-5 px-4 py-5 sm:px-6 lg:py-7"
      }
    >
      {children}
    </main>
  );
}

export function AppHeader({ children }: { children: React.ReactNode }) {
  const { mode, copy } = useDisplayMode();
  return (
    <header
      className={
        mode === "dank"
          ? "relative overflow-hidden rounded-xl border border-lime-300/25 bg-black/70 p-4 shadow-[0_0_48px_rgba(190,242,100,0.14)] before:absolute before:inset-x-0 before:top-0 before:h-1 before:bg-gradient-to-r before:from-lime-300 before:via-pink-400 before:to-cyan-300"
          : "relative overflow-hidden rounded-xl border border-stone-300/80 bg-[#fff8e8]/90 p-4 shadow-[0_18px_60px_rgba(68,64,60,0.12)] before:absolute before:left-8 before:top-0 before:h-3 before:w-28 before:rounded-b-md before:bg-stone-200/80"
      }
    >
      <div className="absolute right-5 top-5 z-10">
        <ModeToggle />
      </div>
      <div className="grid gap-4 pr-0 lg:grid-cols-[1fr_1.35fr] lg:pr-36">
        <div>
          <p className={mode === "dank" ? "text-xs font-black uppercase tracking-[0.24em] text-lime-300" : "text-xs font-semibold uppercase tracking-[0.2em] text-emerald-700"}>
            {copy.title} · {copy.subtitle}
          </p>
          <h1 className={mode === "dank" ? "mt-2 text-4xl font-black tracking-tight text-lime-50" : "mt-2 text-4xl font-semibold tracking-tight text-zinc-950"}>
            THC Leaderboard
          </h1>
          <p className={mode === "dank" ? "mt-3 max-w-2xl text-sm leading-6 text-lime-50/72" : "mt-3 max-w-2xl text-sm leading-6 text-zinc-700"}>
            Public GitHub repo in, independently recomputed THC report out. Same truth engine, different operating mood.
          </p>
        </div>
        <div>{children}</div>
      </div>
    </header>
  );
}

export function Workspace({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-5 lg:grid-cols-[236px_1fr]">{children}</div>;
}

export function FolderSidebar({ active = "Overview" }: { active?: string }) {
  const { mode, copy } = useDisplayMode();
  return (
    <aside
      className={
        mode === "dank"
          ? "sticky top-5 self-start rounded-xl border border-pink-400/25 bg-black/55 p-3 text-sm shadow-[0_0_36px_rgba(236,72,153,0.12)]"
          : "sticky top-5 self-start rounded-xl border border-stone-300/90 bg-[#f8ecd3] p-3 text-sm shadow-[9px_12px_0_rgba(68,64,60,0.07)]"
      }
    >
      <div className={mode === "dank" ? "mb-3 flex items-center gap-2 px-2 font-black uppercase tracking-wide text-pink-200" : "mb-3 flex items-center gap-2 px-2 font-semibold text-stone-800"}>
        <span aria-hidden>{mode === "dank" ? "[-_-]" : "FILE"}</span>
        {copy.sidebarTitle}
      </div>
      <nav className="space-y-1">
        {sidebarItems.map((item) => {
          const mapped = mode === "dank" ? mapDankSidebarItem(item) : item;
          const isActive = item === active;
          return (
            <a
              key={item}
              href={`#${item.toLowerCase().replaceAll(" ", "-")}`}
              className={
                mode === "dank"
                  ? `block rounded-md border px-3 py-2 font-semibold ${isActive ? "border-lime-300/60 bg-lime-300/15 text-lime-100" : "border-transparent text-lime-50/64 hover:border-pink-400/40 hover:text-pink-100"}`
                  : `block rounded-md border px-3 py-2 ${isActive ? "border-stone-300 bg-white/85 text-zinc-950 shadow-sm" : "border-transparent text-stone-600 hover:bg-white/55 hover:text-zinc-950"}`
              }
            >
              {mapped}
            </a>
          );
        })}
      </nav>
      <div className={mode === "dank" ? "mt-4 rounded-md border border-pink-400/35 bg-pink-400/10 p-3 text-xs leading-5 text-pink-100" : "mt-4 rounded-md border border-amber-300 bg-amber-100/90 p-3 text-xs leading-5 text-amber-950"}>
        Not certification. Not security approval. Not production readiness.
      </div>
    </aside>
  );
}

export function Panel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const { mode } = useDisplayMode();
  const base =
    mode === "dank"
      ? "rounded-lg border border-lime-300/25 bg-zinc-950/80 shadow-[0_0_0_1px_rgba(236,72,153,0.18),0_24px_80px_rgba(0,0,0,0.4)]"
      : "rounded-lg border border-stone-300/80 bg-[#fffaf0] shadow-[0_18px_55px_rgba(68,64,60,0.12)]";
  return <div className={`${base} ${className}`}>{children}</div>;
}

export function SectionPanel({
  id,
  title,
  kicker,
  children,
  className = "",
}: {
  id?: string;
  title: string;
  kicker?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { mode } = useDisplayMode();
  return (
    <section id={id} className={`${mode === "dank" ? "scroll-mt-5 rounded-xl border border-cyan-300/20 bg-zinc-950/82 p-4 shadow-[0_0_0_1px_rgba(190,242,100,0.08)]" : "scroll-mt-5 rounded-xl border border-stone-300/90 bg-[#fffaf0] p-4 shadow-[0_18px_55px_rgba(68,64,60,0.1)]"} ${className}`}>
      {kicker ? <p className={mode === "dank" ? "text-xs font-black uppercase tracking-[0.18em] text-cyan-200" : "text-xs font-semibold uppercase tracking-[0.16em] text-emerald-700"}>{kicker}</p> : null}
      <h2 className={mode === "dank" ? "mt-1 text-xl font-black text-lime-50" : "mt-1 text-xl font-semibold text-zinc-950"}>{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

export function StickerRail({ items }: { items: string[] }) {
  const { mode } = useDisplayMode();
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item, index) => (
        <span
          key={item}
          className={
            mode === "dank"
              ? `rounded-md border px-2.5 py-1 text-xs font-black uppercase tracking-wide ${index % 3 === 0 ? "border-lime-300/60 bg-lime-300/15 text-lime-100" : index % 3 === 1 ? "border-pink-400/60 bg-pink-400/15 text-pink-100" : "border-cyan-300/60 bg-cyan-300/15 text-cyan-100"}`
              : `rounded-md border px-2.5 py-1 text-xs font-semibold ${index % 3 === 0 ? "border-emerald-200 bg-emerald-50 text-emerald-800" : index % 3 === 1 ? "border-amber-200 bg-amber-50 text-amber-800" : "border-stone-200 bg-white text-stone-700"}`
          }
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export function ScoreBar({ label, value, max }: { label: string; value: number; max: number }) {
  const { mode } = useDisplayMode();
  const width = `${Math.max(0, Math.min(100, Math.round((value / max) * 100)))}%`;
  return (
    <div className="space-y-1.5">
      <div className={mode === "dank" ? "flex justify-between text-xs font-black uppercase text-lime-100" : "flex justify-between text-xs font-semibold uppercase text-stone-600"}>
        <span>{label}</span>
        <span>
          {value}/{max}
        </span>
      </div>
      <div className={mode === "dank" ? "h-2 rounded-full bg-lime-100/10" : "h-2 rounded-full bg-stone-200"}>
        <div
          className={mode === "dank" ? "h-full rounded-full bg-gradient-to-r from-lime-300 via-cyan-300 to-pink-400 shadow-[0_0_14px_rgba(190,242,100,0.45)]" : "h-full rounded-full bg-emerald-600"}
          style={{ width }}
        />
      </div>
    </div>
  );
}

export function PaperNote({ children, tone = "default" }: { children: React.ReactNode; tone?: "default" | "warning" | "accent" }) {
  const { mode } = useDisplayMode();
  const clarityTone =
    tone === "warning"
      ? "border-amber-300 bg-amber-100/90 text-amber-950 rotate-[-0.5deg]"
      : tone === "accent"
        ? "border-emerald-200 bg-emerald-50 text-emerald-950 rotate-[0.4deg]"
        : "border-stone-200 bg-white text-zinc-700";
  const dankTone =
    tone === "warning"
      ? "border-pink-400/70 bg-pink-500/15 text-pink-100"
      : tone === "accent"
        ? "border-lime-300/70 bg-lime-300/15 text-lime-100"
        : "border-cyan-300/30 bg-cyan-300/10 text-cyan-50";
  return (
    <div className={`relative rounded-md border p-3 text-sm leading-6 ${mode === "dank" ? dankTone : clarityTone}`}>
      {mode === "clarity" ? <span className="absolute -top-2 left-4 h-4 w-8 rounded-sm bg-stone-200/80 shadow-sm" aria-hidden /> : null}
      {children}
    </div>
  );
}

function mapDankSidebarItem(item: string) {
  if (item === "Evidence") return "Receipts";
  if (item === "Caps") return "Score Nerfs";
  if (item === "Hidden Trust") return "Biggest Sus";
  if (item === "Local Artifacts") return "Claimed Lore";
  if (item === "Next Actions") return "Un-Cook This Repo";
  return item;
}
