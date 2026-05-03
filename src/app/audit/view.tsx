"use client";

import Link from "next/link";
import { CompactReviewForm } from "../compact-review-form";
import { GitHubSignInButton } from "../github-sign-in-button";
import { ModeToggle, useDisplayMode } from "../mode-shell";
import { PixelFace } from "../pixel-face";
import { ProfileTabLink } from "../profile-tab-link";
import { Disclaimer, PinnedNote } from "../reports/[id]/report-parts";

export function AuditEmptyView() {
  const { mode } = useDisplayMode();
  return mode === "dank" ? <DankAuditEmpty /> : <ClarityAuditEmpty />;
}

function ClarityAuditEmpty() {
  return (
    <main className="flex min-h-screen w-full max-w-none flex-col gap-2 px-2 py-2 text-zinc-950 sm:px-3 lg:h-screen lg:min-h-0 lg:overflow-hidden">
      <AuditTopBar mode="clarity" />
      <div className="grid min-h-0 flex-1 gap-2 lg:grid-cols-[295px_minmax(0,1fr)] 2xl:grid-cols-[315px_minmax(0,1fr)]">
        <ClarityAuditSidebar />
        <section className="relative min-w-0 overflow-hidden rounded-sm border border-stone-300 bg-[#fbf7ec] shadow-[0_18px_55px_rgba(68,64,60,0.18)] lg:h-full">
          <div className="absolute inset-0 opacity-55 paper-grid" />
          <div className="relative grid min-h-0 gap-2 p-2 lg:h-full 2xl:grid-cols-[minmax(0,1fr)_270px]">
            <div className="grid min-h-0 gap-2 overflow-hidden lg:grid-rows-[auto_auto_minmax(0,1fr)]">
              <section className="border-b border-stone-300 pb-3">
                <p className="font-serif text-sm italic text-stone-500">Audit folder page</p>
                <h1 className="mt-1 font-serif text-[clamp(2.3rem,4vw,4.6rem)] font-semibold leading-none tracking-tight">No Audit Selected</h1>
                <p className="mt-3 max-w-4xl text-sm leading-6 text-stone-700">
                  Submit a public GitHub repository above to generate the first Automated Public Review. The completed report will appear here
                  with commit SHA, score, caps, evidence, hidden-trust findings, and downloadable JSON.
                </p>
              </section>
              <div className="grid border border-stone-300 bg-white/55 sm:grid-cols-4">
                <EmptyTile label="Repo" value="Waiting" sub="submit URL" />
                <EmptyTile label="Commit" value="Pending" sub="resolve SHA" />
                <EmptyTile label="Review" value="Queued" sub="AI review notes" />
                <EmptyTile label="Score" value="Unset" sub="deterministic caps" />
              </div>
              <section className="rounded-sm border border-stone-300 bg-white/60 p-4">
                <h2 className="font-serif text-2xl font-semibold">What Happens Next</h2>
                <div className="mt-3 divide-y divide-stone-200 border border-stone-200 bg-white/65 text-sm">
                  {["Validate public GitHub URL", "Fetch repository metadata", "Inspect canonical files", "Generate AI review notes", "Apply deterministic THC score and caps"].map((item, index) => (
                    <div key={item} className="grid grid-cols-[44px_minmax(0,1fr)] gap-3 px-3 py-2">
                      <span className="font-mono text-stone-500">{index + 1}</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </section>
            </div>
            <aside className="hidden min-h-0 content-start gap-2 overflow-hidden 2xl:grid">
              <PinnedNote title="At-a-Glance" tone="white">
                Submit a repo to begin inspection.
              </PinnedNote>
              <PinnedNote title="Local Artifacts" tone="amber">
                Add docs/thc artifacts with THC_Check to reduce local-artifact warnings.
              </PinnedNote>
              <PinnedNote title="Methodology" tone="green">
                <a className="text-emerald-800 underline" href="https://github.com/Vel-Labs/thc-methodology" rel="noreferrer" target="_blank">Open thc-methodology</a>
              </PinnedNote>
            </aside>
          </div>
        </section>
      </div>
      <Disclaimer mode="clarity" />
    </main>
  );
}

function DankAuditEmpty() {
  return (
    <main className="flex min-h-screen w-full max-w-none flex-col gap-2 px-2 py-2 font-mono text-lime-100 sm:px-3 lg:h-screen lg:min-h-0 lg:overflow-hidden">
      <AuditTopBar mode="dank" />
      <div className="grid min-h-0 flex-1 gap-2 lg:grid-cols-[295px_minmax(0,1fr)] 2xl:grid-cols-[315px_minmax(0,1fr)]">
        <DankAuditSidebar />
        <section className="relative min-w-0 overflow-hidden border border-lime-300/40 bg-black/80 p-2 shadow-[0_0_38px_rgba(190,242,100,0.16)] lg:h-full">
          <div className="absolute inset-0 dank-noise opacity-70" />
          <div className="relative grid min-h-0 gap-2 lg:h-full 2xl:grid-cols-[minmax(0,1fr)_275px]">
            <div className="grid min-h-0 gap-2 overflow-hidden lg:grid-rows-[auto_auto_minmax(0,1fr)]">
              <section className="border-b border-pink-500/45 pb-3">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-pink-400">Audit // no receipts yet</p>
                <h1 className="mt-1 text-[clamp(2.2rem,4vw,4.5rem)] font-black uppercase leading-none text-lime-300">No Repo Cooked</h1>
                <p className="mt-3 max-w-4xl text-sm leading-6 text-lime-100/75">Drop a public repo URL and the report will render here.</p>
              </section>
              <div className="grid gap-2 sm:grid-cols-4">
                <DankEmptyTile label="Repo" value="Waiting" sub="drop URL" />
                <DankEmptyTile label="Commit" value="Pending" sub="pin SHA" />
                <DankEmptyTile label="Notes" value="Queued" sub="AI review" />
                <DankEmptyTile label="Score" value="Unset" sub="caps law" />
              </div>
            </div>
            <aside className="hidden min-h-0 content-start gap-2 overflow-hidden 2xl:grid">
              <div className="border border-pink-500/40 bg-black/72 p-4 text-sm text-pink-100">No receipts yet. Submit a repo.</div>
            </aside>
          </div>
        </section>
      </div>
      <Disclaimer mode="dank" />
    </main>
  );
}

function AuditTopBar({ mode }: { mode: "clarity" | "dank" }) {
  return (
    <header className={mode === "dank" ? "relative overflow-hidden border border-lime-300/45 bg-black/88 p-2 shadow-[0_0_30px_rgba(190,242,100,0.16)]" : "relative overflow-hidden rounded-sm border border-stone-300 bg-[#f8f3e8] p-3 shadow-[0_8px_22px_rgba(68,64,60,0.14)]"}>
      <div className={mode === "dank" ? "grid gap-2 lg:grid-cols-[360px_minmax(0,1fr)_390px] lg:items-center" : "grid gap-2 lg:grid-cols-[250px_minmax(0,1fr)_340px] lg:items-center"}>
        <div className={mode === "dank" ? "flex min-w-0 items-center gap-3" : ""}>
          {mode === "dank" ? <PixelFace /> : null}
          <div>
            <div className={mode === "dank" ? "whitespace-nowrap text-2xl font-black leading-none text-lime-300" : "text-xl font-black leading-none tracking-wide text-zinc-950"}>THC LEADERBOARD</div>
            <div className={mode === "dank" ? "mt-1 whitespace-nowrap text-[10px] font-black uppercase tracking-[0.16em] text-lime-300" : "mt-1 text-xs tracking-[0.15em] text-stone-600"}>Truth · Hardening · Clarity</div>
          </div>
        </div>
        <div className={mode === "dank" ? "hidden h-5 overflow-hidden text-center text-[10px] uppercase tracking-[0.5em] text-pink-500/45 lg:block" : "hidden items-center justify-center gap-4 text-center font-serif text-base italic text-stone-600 lg:flex"}>
          <span>{mode === "dank" ? "▓▒░ audit signal // public repo state // trust no lore ░▒▓" : "Analyze a public GitHub repository"}</span>
        </div>
        <div className={mode === "dank" ? "flex flex-nowrap items-center justify-end gap-2" : "flex flex-wrap justify-end gap-2 pr-9 md:pr-10 lg:pr-11"}><GitHubSignInButton mode={mode} /><ModeToggle />{mode === "dank" ? <PixelFace small /> : null}</div>
      </div>
      <div className="mt-3"><CompactReviewForm /></div>
    </header>
  );
}

function ClarityAuditSidebar() {
  return (
    <aside className="relative hidden overflow-hidden rounded-sm border border-stone-300 bg-[#efe4cd] p-3 shadow-[8px_12px_22px_rgba(68,64,60,0.16)] lg:block lg:h-full">
      <div className="absolute left-4 top-2 z-20 flex items-end gap-1.5">
        <FolderTab href="/" label="About" width="w-[52px]" />
        <FolderTab href="/audit" label="Audit" active width="w-[48px]" />
        <FolderTab href="/leaderboard" label="Leaderboard" width="w-[90px]" />
        <ProfileTabLink mode="clarity" width="w-[60px]" />
      </div>
      <p className="relative mb-2 mt-8 flex items-center gap-2 text-xs uppercase tracking-widest text-stone-500">□ Audit Folder</p>
      <nav className="relative mt-4 space-y-1 text-sm">
        {["Overview", "Evidence", "Caps Applied", "Hidden Trust", "Local Artifacts", "Next Actions"].map((item, index) => (
          <a key={item} href="#" className={`block rounded-sm border px-3 py-2 ${index === 0 ? "border-emerald-400 bg-emerald-50/95 text-emerald-950" : "border-transparent border-b-stone-300/75 text-stone-700"}`}>{item}</a>
        ))}
      </nav>
    </aside>
  );
}

function DankAuditSidebar() {
  return (
    <aside className="relative hidden overflow-hidden border border-lime-300/35 bg-black/75 p-3 lg:block lg:h-full">
      <div className="mb-3 grid grid-cols-[0.7fr_0.7fr_1.25fr_0.85fr] gap-2 text-[10px] font-black uppercase tracking-wide">
        <Link href="/" className="border border-cyan-300/25 px-2 py-1.5 text-cyan-300/60">About</Link>
        <Link href="/audit" className="border border-lime-300 bg-lime-300/20 px-2 py-1.5 text-lime-100">Audit</Link>
        <Link href="/leaderboard" className="border border-pink-500/25 px-2 py-1.5 text-pink-300/55">Leaderboard</Link>
        <ProfileTabLink mode="dank" variant="dank-grid" />
      </div>
      <p className="mb-3 text-xs uppercase tracking-widest text-lime-300">Audit Folder //</p>
    </aside>
  );
}

function FolderTab({ href, label, active = false, width }: { href: string; label: string; active?: boolean; width: string }) {
  return (
    <Link href={href} className={`relative h-8 ${width} rounded-t-sm border border-b-0 px-2 pt-1.5 text-center text-[10px] font-semibold uppercase tracking-wide ${active ? "border-emerald-700/70 bg-[#fbf3df] text-emerald-900" : "border-stone-300 bg-[#e4d7bd] text-stone-500"}`}>
      <span className={`absolute -right-3 bottom-[-1px] h-[calc(100%+1px)] w-5 skew-x-[16deg] rounded-tr-sm border border-b-0 border-l-0 ${active ? "border-emerald-700/70 bg-[#fbf3df]" : "border-stone-300 bg-[#e4d7bd]"}`} />
      <span className="relative">{label}</span>
    </Link>
  );
}

function EmptyTile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return <div className="border-r border-stone-300 p-4 last:border-r-0"><p className="text-xs uppercase text-stone-500">{label}</p><p className="mt-2 font-serif text-2xl font-semibold text-emerald-800">{value}</p><p className="mt-1 text-xs text-stone-600">{sub}</p></div>;
}

function DankEmptyTile({ label, value, sub }: { label: string; value: string; sub: string }) {
  return <div className="border border-lime-300/35 bg-black/70 p-4"><p className="text-xs font-black uppercase text-pink-300">{label}</p><p className="mt-2 text-2xl font-black uppercase text-lime-300">{value}</p><p className="mt-1 text-xs uppercase text-lime-100/65">{sub}</p></div>;
}
