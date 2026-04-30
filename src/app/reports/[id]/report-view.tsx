"use client";

import type { THCReport } from "@/lib/thc/schema";
import { CompactReviewForm } from "../../compact-review-form";
import { ModeToggle, useDisplayMode } from "../../mode-shell";
import {
  CapsPanel,
  CheckList,
  DankMetric,
  DankMiniScore,
  DankTape,
  Disclaimer,
  EvidenceTable,
  FindingsCard,
  LocalStatus,
  MetaLine,
  MiniScore,
  NextActions,
  PinnedNote,
  ScoreTile,
  scoreLookup,
} from "./report-parts";

const levelShort: Record<string, string> = {
  "THC-0 Unverified": "THC-0",
  "THC-1 Documented": "THC-1",
  "THC-2 Hardened": "THC-2",
  "THC-3 Inspectable": "THC-3",
  "THC-4 Reproducible": "THC-4",
  "THC-5 High-THC": "THC-5",
};

export function ReportView({ report }: { report: THCReport }) {
  const { mode } = useDisplayMode();
  return mode === "dank" ? <DankReport report={report} /> : <ClarityReport report={report} />;
}

function ClarityReport({ report }: { report: THCReport }) {
  const score = scoreLookup(report);
  return (
    <main className="flex min-h-screen w-full max-w-none flex-col gap-2 px-2 py-2 text-zinc-950 sm:px-3 lg:h-screen lg:min-h-0 lg:overflow-hidden">
      <TopBar mode="clarity" />
      <div className="grid min-h-0 flex-1 gap-2 lg:grid-cols-[210px_minmax(0,1fr)] 2xl:grid-cols-[230px_minmax(0,1fr)]">
        <ClaritySidebar report={report} />
        <section className="relative min-w-0 overflow-hidden rounded-sm border border-stone-300 bg-[#fbf7ec] shadow-[0_18px_55px_rgba(68,64,60,0.18)] lg:h-full">
          <div className="absolute inset-0 opacity-55 paper-grid" />
          <div className="relative grid min-h-0 gap-2 p-2 lg:h-full xl:grid-cols-[minmax(0,1fr)_240px] 2xl:grid-cols-[minmax(0,1fr)_270px]">
            <div className="grid min-h-0 gap-2 lg:grid-rows-[auto_auto_auto_minmax(0,1fr)_auto]">
              <div className="relative border-b border-stone-300 pb-3">
                <h1 className="font-serif text-[clamp(2rem,3.4vw,3.6rem)] font-semibold leading-none tracking-tight">{report.projectName}</h1>
                <a className="mt-2 inline-block text-sm text-blue-700" href={report.repositoryUrl} rel="noreferrer" target="_blank">
                  {report.repositoryUrl}
                </a>
                <div className="mt-3 grid max-w-3xl gap-3 text-xs text-stone-700 sm:grid-cols-3">
                  <MetaLine label="Reviewed Commit" value={report.reviewedCommitSha.slice(0, 28)} />
                  <MetaLine label="Generated" value={new Date(report.generatedAt).toLocaleString()} />
                  <MetaLine label="Rubric Version" value={report.rubricVersion.replace("THC Methodology ", "")} />
                </div>
                <div className="absolute right-6 top-0 hidden rotate-[-2deg] border border-amber-200 bg-amber-100 px-4 py-3 font-serif text-base shadow-[8px_10px_20px_rgba(68,64,60,0.18)] md:block">
                  Automated<br />Public Review
                  <span className="absolute -right-4 -top-4 h-16 w-6 rotate-12 rounded-b-full border border-stone-400 bg-stone-200/90" />
                </div>
              </div>

              <div className="grid border border-stone-300 bg-white/55 sm:grid-cols-[1fr_1.35fr_1fr]">
                <ScoreTile label="THC Level" value={levelShort[report.recommendedLevel] ?? report.recommendedLevel} sub={report.recommendedLevel.replace(/^THC-\d\s/, "")} variant="level" />
                <ScoreTile label="Total Score" value={`${report.totalScore}`} sub="/ 100" variant="score" />
                <ScoreTile label="Confidence" value={report.confidence === "medium" ? "68%" : report.confidence} sub={report.confidence} variant="confidence" />
              </div>

              <div className="grid border border-stone-300 bg-white/50 sm:grid-cols-4">
                <MiniScore label="Truth" value={score.Truth} max={30} />
                <MiniScore label="Hardening" value={score.Hardening} max={35} />
                <MiniScore label="Clarity" value={score.Clarity} max={25} />
                <MiniScore label="Audit History" value={score["Audit History"]} max={10} />
              </div>

              <div className="grid min-h-0 gap-2 xl:grid-cols-[minmax(0,1fr)_240px]">
                <EvidenceTable report={report} mode="clarity" />
                <FindingsCard report={report} mode="clarity" />
              </div>

              <div className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_270px]">
                <NextActions report={report} mode="clarity" />
                <LocalStatus report={report} mode="clarity" />
              </div>
            </div>

            <aside className="hidden min-h-0 content-start gap-2 overflow-hidden xl:grid">
              <PinnedNote title="At-a-Glance" tone="white">
                <CheckList items={["Public repo inspected", "No code execution", "No private access", "Deterministic scoring", "Caps enforced"]} />
              </PinnedNote>
              <PinnedNote title="Caps Applied" tone="amber">
                <ul className="space-y-1 text-sm">
                  {report.capsApplied.map((cap, index) => (
                    <li key={cap}>-{index + 1} pts · {cap}</li>
                  ))}
                </ul>
              </PinnedNote>
              <PinnedNote title="Evidence Note" tone="green">
                Evidence is inferred from public state. No private access used.
              </PinnedNote>
            </aside>
          </div>
        </section>
      </div>
      <Disclaimer mode="clarity" />
    </main>
  );
}

function DankReport({ report }: { report: THCReport }) {
  const score = scoreLookup(report);
  return (
    <main className="flex min-h-screen w-full max-w-none flex-col gap-2 px-2 py-2 font-mono text-lime-100 sm:px-3 lg:h-screen lg:min-h-0 lg:overflow-hidden">
      <TopBar mode="dank" />
      <div className="grid min-h-0 flex-1 gap-2 lg:grid-cols-[210px_minmax(0,1fr)] 2xl:grid-cols-[230px_minmax(0,1fr)]">
        <DankSidebar report={report} />
        <section className="relative min-w-0 overflow-hidden border border-lime-300/40 bg-black/80 p-2 shadow-[0_0_38px_rgba(190,242,100,0.16)] lg:h-full">
          <div className="absolute inset-0 dank-noise opacity-70" />
          <div className="relative grid min-h-0 gap-2 lg:h-full xl:grid-cols-[minmax(0,1fr)_245px] 2xl:grid-cols-[minmax(0,1fr)_275px]">
            <div className="grid min-h-0 gap-2 lg:grid-rows-[auto_auto_auto_minmax(0,1fr)_auto]">
              <div className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_180px]">
                <div className="border-b border-lime-300/35 pb-3">
                  <h1 className="text-[clamp(2rem,3.4vw,3.6rem)] font-black leading-none tracking-tight text-lime-200">{report.projectName} <span className="text-2xl">⌐■-■</span></h1>
                  <a className="mt-2 inline-block text-sm text-pink-400" href={report.repositoryUrl} rel="noreferrer" target="_blank">
                    {report.repositoryUrl}
                  </a>
                  <div className="mt-3 grid gap-3 text-xs uppercase text-lime-300/80 sm:grid-cols-3">
                    <MetaLine label="Reviewed Commit" value={report.reviewedCommitSha.slice(0, 28)} />
                    <MetaLine label="Generated" value={new Date(report.generatedAt).toLocaleString()} />
                    <MetaLine label="Rubric Version" value={report.rubricVersion.replace("THC Methodology ", "")} />
                  </div>
                </div>
                <div className="hidden rotate-[-2deg] border-2 border-pink-500 bg-black/80 p-3 text-center text-lg font-black uppercase text-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.35)] xl:block">
                  Automated<br />Public Review
                  <div className="mt-2 text-xs tracking-[0.3em]">||||||||||||</div>
                </div>
              </div>

              <div className="grid gap-2 sm:grid-cols-[1fr_1.7fr_1fr]">
                <DankMetric title="THC Level" value={levelShort[report.recommendedLevel] ?? report.recommendedLevel} sub={report.recommendedLevel.replace(/^THC-\d\s/, "")} />
                <DankMetric title="Total Score (Potency)" value={`${report.totalScore}/100`} sub="same rubric" wide />
                <DankMetric title="Vibe Check" value={report.confidence === "medium" ? "68%" : report.confidence} sub={report.confidence} />
              </div>

              <div className="grid gap-2 sm:grid-cols-4">
                <DankMiniScore label="Truth" value={score.Truth} max={30} />
                <DankMiniScore label="Hardening" value={score.Hardening} max={35} />
                <DankMiniScore label="Clarity" value={score.Clarity} max={25} />
                <DankMiniScore label="Audit History" value={score["Audit History"]} max={10} />
              </div>

              <div className="grid min-h-0 gap-2 xl:grid-cols-[minmax(0,1fr)_260px]">
                <EvidenceTable report={report} mode="dank" />
                <div className="grid min-h-0 content-start gap-2 overflow-hidden">
                  <FindingsCard report={report} mode="dank" />
                  <CapsPanel report={report} />
                </div>
              </div>

              <div className="grid gap-2 xl:grid-cols-[minmax(0,1fr)_270px]">
                <NextActions report={report} mode="dank" />
                <LocalStatus report={report} mode="dank" />
              </div>
            </div>

            <aside className="hidden min-h-0 content-start gap-2 overflow-hidden xl:grid">
              <DankTape title="At-a-Glance //">
                <CheckList items={["Public repo inspected", "No code execution", "No private access", "Deterministic scoring", "Caps enforced"]} />
              </DankTape>
              <DankTape title="Evidence Note">
                Evidence is inferred from public state. No private access used.
              </DankTape>
              <DankTape title="Impact">
                Moderate
              </DankTape>
            </aside>
          </div>
        </section>
      </div>
      <Disclaimer mode="dank" />
    </main>
  );
}

function TopBar({ mode }: { mode: "clarity" | "dank" }) {
  if (mode === "dank") {
    return (
      <header className="relative overflow-hidden border border-lime-300/45 bg-black/88 p-2 shadow-[0_0_30px_rgba(190,242,100,0.16)]">
        <div className="pointer-events-none absolute inset-x-24 top-0 hidden h-px bg-gradient-to-r from-transparent via-pink-500/70 to-transparent lg:block" />
        <div className="grid gap-2 lg:grid-cols-[360px_minmax(0,1fr)_230px] lg:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <PixelFace />
            <div>
              <div className="whitespace-nowrap text-2xl font-black leading-none text-lime-300 drop-shadow-[0_0_8px_rgba(190,242,100,0.55)]">THC LEADERBOARD</div>
              <div className="mt-1 text-xs font-black uppercase tracking-[0.22em] text-lime-300">Truth · Hardening · Clarity</div>
            </div>
          </div>
          <div className="hidden h-5 overflow-hidden text-[10px] uppercase tracking-[0.5em] text-pink-500/45 lg:block">
            ▓▒░ audit signal // public repo state // trust no lore ░▒▓
          </div>
          <div className="flex items-center justify-end gap-3">
            <ModeToggle />
            <PixelFace small />
          </div>
        </div>
        <div className="mt-2">
          <CompactReviewForm />
        </div>
      </header>
    );
  }

  return (
    <header className="relative overflow-hidden rounded-sm border border-stone-300 bg-[#f8f3e8] p-3 shadow-[0_8px_22px_rgba(68,64,60,0.14)]">
      <div className="absolute right-4 top-3 hidden text-2xl text-stone-500 md:block">☼</div>
      <div className="grid gap-2 lg:grid-cols-[250px_minmax(0,1fr)_190px] lg:items-center">
        <div>
          <div className="text-xl font-black leading-none tracking-wide text-zinc-950">THC LEADERBOARD</div>
          <div className="mt-1 text-xs tracking-[0.15em] text-stone-600">
            Truth · Hardening · Clarity
          </div>
        </div>
        <div className="hidden items-center justify-center gap-4 text-center font-serif text-base italic text-stone-600 lg:flex">
          <span>Analyze a public GitHub repository</span>
          <span className="text-4xl leading-none text-stone-500">↘</span>
        </div>
        <div className="flex justify-end pr-9 md:pr-10 lg:pr-11">
          <ModeToggle />
        </div>
      </div>
      <div className="mt-3">
        <CompactReviewForm />
      </div>
    </header>
  );
}

function PixelFace({ small = false }: { small?: boolean }) {
  const size = small ? "h-7 w-9" : "h-9 w-12";
  return (
    <span className={`relative inline-grid ${size} shrink-0 place-items-center border-2 border-lime-300 text-lime-300 shadow-[0_0_12px_rgba(190,242,100,0.45)]`} aria-hidden>
      <span className="absolute left-1 top-1 h-1.5 w-1.5 bg-lime-300" />
      <span className="absolute right-1 top-1 h-1.5 w-1.5 bg-lime-300" />
      <span className="absolute left-2 top-3 h-1.5 w-3 bg-lime-300" />
      <span className="absolute right-2 top-3 h-1.5 w-3 bg-lime-300" />
      <span className="absolute bottom-2 h-1 w-5 bg-lime-300" />
    </span>
  );
}

function ClaritySidebar({ report }: { report: THCReport }) {
  return (
    <aside className="relative hidden overflow-hidden rounded-sm border border-stone-300 bg-[#f2ead8] p-3 shadow-[8px_12px_22px_rgba(68,64,60,0.16)] before:absolute before:-right-2 before:top-5 before:h-[calc(100%-40px)] before:w-3 before:rounded-r before:bg-stone-200/90 lg:block lg:h-full">
      <div className="absolute left-3 top-2 h-6 w-20 rounded-t border border-b-0 border-stone-300 bg-[#fbf3df]" />
      <div className="absolute -right-3 top-2 h-14 w-6 rounded-b-full border border-stone-400 bg-stone-100" />
      <p className="relative mb-4 mt-7 text-xs uppercase tracking-widest text-stone-500">□ Report Folder</p>
      <nav className="space-y-1.5 text-sm">
        {["Overview", "Evidence", "Caps Applied", "Hidden Trust", "Local Artifacts", "Next Actions"].map((item, index) => (
          <a key={item} className={`flex items-center gap-2 rounded-sm border px-3 py-1.5 ${index === 0 ? "border-emerald-300 bg-emerald-50 text-emerald-900" : "border-transparent text-stone-700"}`} href={`#${item.toLowerCase().replaceAll(" ", "-")}`}>
            <span>{["▣", "▤", "△", "⚠", "▣", "▤"][index]}</span>
            {item}
          </a>
        ))}
      </nav>
      <div className="absolute bottom-3 left-3 right-3 space-y-3">
        <PinnedNote title="" tone="white">Independent review of public repository state. Local artifacts are input, not truth.</PinnedNote>
        <div className="rounded-md border border-stone-300 bg-[#fffaf0] p-3 text-xs">
          <p className="font-semibold text-stone-500">Rubric Version</p>
          <p className="mt-2 font-mono">{report.rubricVersion.replace("THC Methodology ", "")}</p>
        </div>
      </div>
    </aside>
  );
}

function DankSidebar({ report }: { report: THCReport }) {
  return (
    <aside className="relative hidden overflow-hidden border border-lime-300/35 bg-black/75 p-3 shadow-[0_0_22px_rgba(190,242,100,0.1)] lg:block lg:h-full">
      <p className="mb-3 text-xs uppercase tracking-widest text-lime-300">Report Folder //</p>
      <nav className="space-y-1.5 text-xs font-black uppercase 2xl:text-sm">
        {["Overview", "Receipts", "Score Nerfs", "Biggest Sus", "Claimed Lore", "Un-Cook This Repo"].map((item, index) => (
          <a key={item} className={`flex items-center gap-2 border px-3 py-1.5 ${index === 0 ? "border-lime-300 bg-lime-300/18 text-lime-100" : "border-transparent text-lime-300/75"}`} href="#">
            <span>{["▣", "▤", "△", "◇", "▧", "▥"][index]}</span>
            {item}
          </a>
        ))}
      </nav>
      <div className="mt-5 border border-lime-300/35 bg-lime-300/10 p-3 text-xs leading-5 text-lime-100">
        Independent review of public repo state. Local artifacts are input, not truth.
      </div>
      <div className="absolute bottom-3 text-xs text-lime-300">
        Rubric Version<br /><span className="text-pink-400">{report.rubricVersion.replace("THC Methodology ", "")}</span>
      </div>
    </aside>
  );
}
