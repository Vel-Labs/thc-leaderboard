"use client";

import Link from "next/link";
import type { THCReport } from "@/lib/thc/schema";
import { repositoryMeta } from "@/lib/ui/repository-meta";
import { isLeaderboardSection, type ReportSection } from "@/lib/ui/report-sections";
import { CompactReviewForm } from "../../compact-review-form";
import { GitHubSignInButton } from "../../github-sign-in-button";
import { ModeToggle, useDisplayMode } from "../../mode-shell";
import { OwnerDankAvatar } from "../../owner-dank-avatar";
import { PixelFace } from "../../pixel-face";
import { ProfileTabLink } from "../../profile-tab-link";
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

type SidebarItem = { label: string; section: ReportSection; icon: string; flavor?: string };

export function ReportView({ report, section = "overview", leaderboardReports = [] }: { report: THCReport; section?: ReportSection; leaderboardReports?: THCReport[] }) {
  const { mode } = useDisplayMode();
  return mode === "dank" ? <DankReport report={report} section={section} leaderboardReports={leaderboardReports} /> : <ClarityReport report={report} section={section} leaderboardReports={leaderboardReports} />;
}

function ClarityReport({ report, section, leaderboardReports }: { report: THCReport; section: ReportSection; leaderboardReports: THCReport[] }) {
  const score = scoreLookup(report);
  return (
    <main className="flex min-h-screen w-full max-w-none flex-col gap-2 px-2 py-2 text-zinc-950 sm:px-3 lg:h-screen lg:min-h-0 lg:overflow-hidden">
      <TopBar mode="clarity" />
      <div className="grid min-h-0 flex-1 gap-2 lg:grid-cols-[295px_minmax(0,1fr)] 2xl:grid-cols-[315px_minmax(0,1fr)]">
        <ClaritySidebar report={report} activeSection={section} />
        <section className="relative min-w-0 overflow-hidden rounded-sm border border-stone-300 bg-[#fbf7ec] shadow-[0_18px_55px_rgba(68,64,60,0.18)] lg:h-full">
          <div className="absolute inset-0 opacity-55 paper-grid" />
          <div className="relative grid min-h-0 gap-2 p-2 lg:h-full 2xl:grid-cols-[minmax(0,1fr)_270px]">
            {section === "overview" ? (
            <div className="grid min-h-0 gap-2 overflow-auto pr-1 lg:grid-rows-[auto_auto_auto_minmax(0,1fr)_auto]">
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
                  <Paperclip className="-right-5 -top-5 h-20 w-8 rotate-12 text-stone-400" />
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
            ) : isLeaderboardSection(section) ? (
              <LeaderboardSectionPage report={report} section={section} reports={leaderboardReports} mode="clarity" />
            ) : (
              <SectionPage report={report} section={section} mode="clarity" />
            )}

            <aside className="hidden min-h-0 content-start gap-2 overflow-hidden 2xl:grid">
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
              <PinnedNote title="AI Review Notes" tone="green">
                <span className="block font-semibold">AI Review Notes</span>
                <span className="mt-1 block">{truncateText(report.summary, 240)}</span>
                <Link className="mt-2 inline-block text-xs font-semibold uppercase tracking-wide text-emerald-700" href={`/reports/${report.id}/ai-analysis`}>
                  Read AI Report
                </Link>
                <span className="mt-2 block text-xs">Current provider is server-configured. Deterministic THC scoring and caps remain authoritative.</span>
              </PinnedNote>
              <ReportDownloadLink report={report} mode="clarity" />
            </aside>
          </div>
        </section>
      </div>
      <Disclaimer mode="clarity" />
    </main>
  );
}

function DankReport({ report, section, leaderboardReports }: { report: THCReport; section: ReportSection; leaderboardReports: THCReport[] }) {
  const score = scoreLookup(report);
  return (
    <main className="flex min-h-screen w-full max-w-none flex-col gap-2 px-2 py-2 font-mono text-lime-100 sm:px-3 lg:h-screen lg:min-h-0 lg:overflow-hidden">
      <TopBar mode="dank" />
      <div className="grid min-h-0 flex-1 gap-2 lg:grid-cols-[295px_minmax(0,1fr)] 2xl:grid-cols-[315px_minmax(0,1fr)]">
        <DankSidebar report={report} activeSection={section} />
        <section className="relative min-w-0 overflow-hidden border border-lime-300/40 bg-black/80 p-2 shadow-[0_0_38px_rgba(190,242,100,0.16)] lg:h-full">
          <div className="absolute inset-0 dank-noise opacity-70" />
          <div className="relative grid min-h-0 gap-2 lg:h-full 2xl:grid-cols-[minmax(0,1fr)_275px]">
            {section === "overview" ? (
            <div className="grid min-h-0 gap-2 overflow-auto pr-1 lg:grid-rows-[auto_auto_auto_minmax(0,1fr)_auto]">
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
            ) : isLeaderboardSection(section) ? (
              <LeaderboardSectionPage report={report} section={section} reports={leaderboardReports} mode="dank" />
            ) : (
              <SectionPage report={report} section={section} mode="dank" />
            )}

            <aside className="hidden min-h-0 content-start gap-2 overflow-hidden 2xl:grid">
              <DankTape title="At-a-Glance //">
                <CheckList items={["Public repo inspected", "No code execution", "No private access", "Deterministic scoring", "Caps enforced"]} />
              </DankTape>
              <DankTape title="Evidence Note">
                Evidence is inferred from public state. No private access used.
              </DankTape>
              <DankTape title="AI Review Note">
                <span className="block">{truncateText(report.summary, 220)}</span>
                <Link className="mt-2 inline-block text-xs font-black uppercase text-lime-300" href={`/reports/${report.id}/ai-analysis`}>
                  Read AI Report
                </Link>
              </DankTape>
              <ReportDownloadLink report={report} mode="dank" />
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
        <div className="grid gap-2 lg:grid-cols-[360px_minmax(0,1fr)_390px] lg:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <PixelFace />
            <div>
              <div className="whitespace-nowrap text-2xl font-black leading-none text-lime-300 drop-shadow-[0_0_8px_rgba(190,242,100,0.55)]">THC LEADERBOARD</div>
              <div className="mt-1 whitespace-nowrap text-[10px] font-black uppercase tracking-[0.16em] text-lime-300">Truth · Hardening · Clarity</div>
            </div>
          </div>
          <div className="hidden h-5 overflow-hidden text-[10px] uppercase tracking-[0.5em] text-pink-500/45 lg:block">
            ▓▒░ audit signal // public repo state // trust no lore ░▒▓
          </div>
          <div className="flex flex-nowrap items-center justify-end gap-2">
            <GitHubSignInButton mode="dank" />
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
      <div className="grid gap-2 lg:grid-cols-[250px_minmax(0,1fr)_340px] lg:items-center">
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
        <div className="flex flex-wrap justify-end gap-2 pr-9 md:pr-10 lg:pr-11">
          <GitHubSignInButton mode="clarity" />
          <ModeToggle />
        </div>
      </div>
      <div className="mt-3">
        <CompactReviewForm />
      </div>
    </header>
  );
}

function Paperclip({ className = "" }: { className?: string }) {
  return (
    <span className={`pointer-events-none absolute inline-block ${className}`} aria-hidden>
      <svg className="h-full w-full overflow-visible drop-shadow-[1px_2px_2px_rgba(68,64,60,0.22)]" viewBox="0 0 30 78" fill="none">
        <path
          d="M19.3 8.4v45.8c0 8.8-5.3 14.2-11.4 12.3-4.5-1.4-6.6-5.4-6.6-10.9V17.9C1.3 7.8 7.4 1.8 15 1.8s13.5 6 13.5 16.1v37.7c0 14.6-9.7 22.6-21 19.6"
          stroke="currentColor"
          strokeWidth="3.2"
          strokeLinecap="round"
        />
        <path
          d="M13.4 17.1v38.3c0 2.6-1.1 3.9-2.6 3.7-1.3-.2-2.1-1.4-2.1-3.2V18.5c0-4.8 2.5-7.7 6.1-7.7 3.8 0 6.3 2.9 6.3 7.7v34.7"
          stroke="currentColor"
          strokeWidth="2.3"
          strokeLinecap="round"
          opacity="0.76"
        />
      </svg>
    </span>
  );
}

function ReportDownloadLink({ report, mode }: { report: THCReport; mode: "clarity" | "dank" }) {
  const href = `data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(report, null, 2))}`;
  return (
    <a
      href={href}
      download={`${report.projectName}-thc-report-${report.id}.json`}
      className={
        mode === "dank"
          ? "block border border-pink-500/45 bg-black/75 px-3 py-2 text-center text-xs font-black uppercase text-pink-200 shadow-[0_0_16px_rgba(236,72,153,0.2)]"
          : "block rounded-sm border border-stone-300 bg-white/80 px-3 py-2 text-center text-xs font-semibold uppercase tracking-wide text-emerald-800 shadow-[4px_6px_12px_rgba(68,64,60,0.1)]"
      }
    >
      Download Report JSON
    </a>
  );
}

function ClaritySidebar({ report, activeSection }: { report: THCReport; activeSection: ReportSection }) {
  const isLeaderboard = isLeaderboardSection(activeSection);
  const auditItems: SidebarItem[] = [
    { label: "Overview", section: "overview", icon: "▣" },
    { label: "Evidence", section: "evidence", icon: "▤" },
    { label: "Caps Applied", section: "caps-applied", icon: "△" },
    { label: "Hidden Trust", section: "hidden-trust", icon: "⚠" },
    { label: "Local Artifacts", section: "local-artifacts", icon: "▣" },
    { label: "Next Actions", section: "next-actions", icon: "▤" },
    { label: "AI Analysis", section: "ai-analysis", icon: "✦" },
    { label: "History", section: "history", icon: "↗" },
  ];
  const leaderboardItems: SidebarItem[] = [
    { label: "Overview", section: "leaderboard", icon: "▣", flavor: "All ranked artifacts" },
    { label: "Operators", section: "operators", icon: "O", flavor: "Owner rollups" },
    { label: "Most Truthful", section: "most-truthful", icon: "T", flavor: "Truth receipts" },
    { label: "Most Hardened", section: "most-hardened", icon: "H", flavor: "Guardrails and tests" },
    { label: "Most Clarified", section: "most-clarified", icon: "C", flavor: "Setup and navigation" },
    { label: "Best Audit History", section: "best-audit-history", icon: "A", flavor: "Decision trail" },
    { label: "Highest THC", section: "highest-thc", icon: "★", flavor: "Total public score" },
  ];
  const items = isLeaderboard ? leaderboardItems : auditItems;
  return (
    <aside className="relative hidden overflow-hidden rounded-sm border border-stone-300 bg-[#efe4cd] p-3 shadow-[8px_12px_22px_rgba(68,64,60,0.16)] before:absolute before:-right-2 before:top-7 before:h-[calc(100%-54px)] before:w-3 before:rounded-r before:border before:border-l-0 before:border-stone-300 before:bg-[#e7dcc5] after:absolute after:-right-1 after:top-12 after:h-[calc(100%-92px)] after:w-2 after:rounded-r after:bg-[#d9ccb4] lg:block lg:h-full">
      <div className="absolute left-4 top-2 z-20 flex items-end gap-1.5">
        <Link href="/" className="relative h-8 w-[52px] rounded-t-sm border border-b-0 border-stone-300 bg-[#e4d7bd] px-2 pt-1.5 text-center text-[10px] font-semibold uppercase tracking-wide text-stone-500 shadow-[3px_-2px_8px_rgba(68,64,60,0.08)]">
          <span className="absolute -right-3 bottom-[-1px] h-[calc(100%+1px)] w-5 skew-x-[16deg] rounded-tr-sm border border-b-0 border-l-0 border-stone-300 bg-[#e4d7bd]" />
          <span className="relative">About</span>
        </Link>
        <Link href={`/reports/${report.id}`} className={`relative h-8 w-[48px] rounded-t-sm border border-b-0 px-2 pt-1.5 text-center text-[10px] font-semibold uppercase tracking-wide shadow-[3px_-2px_8px_rgba(68,64,60,0.08)] ${!isLeaderboard ? "border-emerald-700/70 bg-[#fbf3df] text-emerald-900" : "border-stone-300 bg-[#e4d7bd] text-stone-500"}`}>
          <span className={`absolute -right-3 bottom-[-1px] h-[calc(100%+1px)] w-5 skew-x-[16deg] rounded-tr-sm border border-b-0 border-l-0 ${!isLeaderboard ? "border-emerald-700/70 bg-[#fbf3df]" : "border-stone-300 bg-[#e4d7bd]"}`} />
          <span className="relative">Audit</span>
        </Link>
        <Link href={`/reports/${report.id}/leaderboard`} className={`relative h-8 w-[90px] rounded-t-sm border border-b-0 px-2 pt-1.5 text-center text-[10px] font-semibold uppercase tracking-wide shadow-[3px_-2px_8px_rgba(68,64,60,0.08)] ${isLeaderboard ? "border-emerald-700/70 bg-[#fbf3df] text-emerald-900" : "border-stone-300 bg-[#e4d7bd] text-stone-500"}`}>
          <span className={`absolute -right-3 bottom-[-1px] h-[calc(100%+1px)] w-5 skew-x-[16deg] rounded-tr-sm border border-b-0 border-l-0 ${isLeaderboard ? "border-emerald-700/70 bg-[#fbf3df]" : "border-stone-300 bg-[#e4d7bd]"}`} />
          <span className="relative">Leaderboard</span>
        </Link>
        <ProfileTabLink mode="clarity" width="w-[60px]" />
      </div>
      <Paperclip className="-right-4 top-4 h-20 w-8 rotate-6 text-stone-400" />
      <p className="relative mb-2 mt-8 flex items-center gap-2 text-xs uppercase tracking-widest text-stone-500">
        <span className="text-lg leading-none">□</span>
        {isLeaderboard ? "Leaderboard Folder" : "Report Folder"}
      </p>
      <div className="relative mb-4 flex items-center gap-2 border-b border-stone-300 pb-3 pl-1 text-xs font-semibold text-stone-700">
        <span className="text-base">□</span>
        <span className="truncate">{isLeaderboard ? "public registry" : report.projectName}</span>
      </div>
      <nav className="relative space-y-1 text-sm">
        {items.map((item) => (
          <Link key={item.section} className={`flex items-center gap-2 rounded-sm border px-3 py-2 ${item.section === activeSection ? "border-emerald-400 bg-emerald-50/95 text-emerald-950 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.18)]" : "border-transparent border-b-stone-300/75 text-stone-700 hover:bg-white/45"}`} href={sectionHref(report.id, item.section)}>
            <span>{item.icon}</span>
            <span className="min-w-0">
              <span className="block truncate">{item.label}</span>
              {item.flavor ? <span className="block truncate text-[10px] text-stone-500">{item.flavor}</span> : null}
            </span>
          </Link>
        ))}
      </nav>
      <div className="absolute bottom-3 left-3 right-3 space-y-3">
        <div className="relative rotate-[-1deg] border border-stone-200 bg-white p-3 font-serif text-xs italic leading-5 text-stone-700 shadow-[6px_8px_16px_rgba(68,64,60,0.12)]">
          <Paperclip className="-right-3 -top-5 h-16 w-7 rotate-12 text-stone-400" />
          Independent review of public repository state. Local artifacts are input, not truth.
        </div>
        <div className="rounded-md border border-stone-300 bg-[#fffaf0] p-3 text-xs">
          <p className="font-semibold text-stone-500">Rubric Version</p>
          <p className="mt-2 font-mono">{report.rubricVersion.replace("THC Methodology ", "")}</p>
        </div>
      </div>
    </aside>
  );
}

function DankSidebar({ report, activeSection }: { report: THCReport; activeSection: ReportSection }) {
  const isLeaderboard = isLeaderboardSection(activeSection);
  const auditItems: SidebarItem[] = [
    { label: "Overview", section: "overview", icon: "▣" },
    { label: "Receipts", section: "evidence", icon: "▤" },
    { label: "Score Nerfs", section: "caps-applied", icon: "△" },
    { label: "Biggest Sus", section: "hidden-trust", icon: "◇" },
    { label: "Claimed Lore", section: "local-artifacts", icon: "▧" },
    { label: "Un-Cook This Repo", section: "next-actions", icon: "▥" },
    { label: "AI Analysis", section: "ai-analysis", icon: "✦" },
    { label: "History", section: "history", icon: "↗" },
  ];
  const leaderboardItems: SidebarItem[] = [
    { label: "Registry Main", section: "leaderboard", icon: "▣", flavor: "all contenders" },
    { label: "Operators", section: "operators", icon: "O", flavor: "builder rollups" },
    { label: "Truth Lords", section: "most-truthful", icon: "T", flavor: "least lore tax" },
    { label: "Hardest Builds", section: "most-hardened", icon: "H", flavor: "guardrail maxxing" },
    { label: "Clarity Maxxing", section: "most-clarified", icon: "C", flavor: "docs are cooking" },
    { label: "Receipts Archive", section: "best-audit-history", icon: "A", flavor: "paper trail energy" },
    { label: "Highest Potency", section: "highest-thc", icon: "★", flavor: "top THC score" },
  ];
  const items = isLeaderboard ? leaderboardItems : auditItems;
  return (
    <aside className="relative hidden overflow-hidden border border-lime-300/35 bg-black/75 p-3 shadow-[0_0_22px_rgba(190,242,100,0.1)] lg:block lg:h-full">
      <div className="mb-3 grid grid-cols-[0.7fr_0.7fr_1.25fr_0.85fr] gap-2 text-[10px] font-black uppercase tracking-wide">
        <Link href="/" className="border border-cyan-300/25 px-2 py-1.5 text-cyan-300/60">About</Link>
        <Link href={`/reports/${report.id}`} className={!isLeaderboard ? "border border-lime-300 bg-lime-300/20 px-2 py-1.5 text-lime-100" : "border border-lime-300/25 px-2 py-1.5 text-lime-300/55"}>Audit</Link>
        <Link href={`/reports/${report.id}/leaderboard`} className={isLeaderboard ? "border border-pink-500 bg-pink-500/20 px-2 py-1.5 text-pink-100" : "border border-pink-500/25 px-2 py-1.5 text-pink-300/55"}>Leaderboard</Link>
        <ProfileTabLink mode="dank" variant="dank-grid" />
      </div>
      <p className="mb-3 text-xs uppercase tracking-widest text-lime-300">{isLeaderboard ? "Leaderboard Folder //" : "Report Folder //"}</p>
      <nav className="space-y-1.5 text-xs font-black uppercase 2xl:text-sm">
        {items.map((item) => (
          <Link key={item.section} className={`flex items-center gap-2 border px-3 py-1.5 ${item.section === activeSection ? "border-lime-300 bg-lime-300/18 text-lime-100 shadow-[0_0_18px_rgba(190,242,100,0.22)]" : "border-transparent text-lime-300/75"}`} href={sectionHref(report.id, item.section)}>
            <span>{item.icon}</span>
            <span className="min-w-0">
              <span className="block truncate">{item.label}</span>
              {item.flavor ? <span className="block truncate text-[10px] text-pink-300/65">{item.flavor}</span> : null}
            </span>
          </Link>
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

function sectionHref(reportId: string, section: ReportSection) {
  return section === "overview" ? `/reports/${reportId}` : `/reports/${reportId}/${section}`;
}

function LeaderboardSectionPage({ report, section, reports, mode }: { report: THCReport; section: ReportSection; reports: THCReport[]; mode: "clarity" | "dank" }) {
  const boards = buildLeaderboardBoards(reports);
  if (section === "operators") return <OperatorSectionPage reports={reports} mode={mode} />;
  const selected = boards.find((board) => board.section === section);
  const visibleBoards = section === "leaderboard" ? boards : selected ? [selected] : boards;
  const title = section === "leaderboard" ? (mode === "dank" ? "Registry Main" : "Leaderboard") : selected ? (mode === "dank" ? selected.dankTitle : selected.title) : "Leaderboard";
  const description = section === "leaderboard"
    ? "Public registry boards ranked from stored Automated Public Review artifacts."
    : selected?.description ?? "A public registry slice ranked from stored review artifacts.";

  return (
    <div className="grid min-h-0 gap-3 lg:grid-rows-[auto_minmax(0,1fr)]">
      <section className={mode === "dank" ? "border-b border-pink-500/45 pb-4" : "border-b border-stone-300 pb-4"}>
        <p className={mode === "dank" ? "text-xs font-black uppercase tracking-[0.24em] text-pink-400" : "font-serif text-sm italic text-stone-500"}>
          {mode === "dank" ? "Public registry // receipts not clout" : "Leaderboard folder page"}
        </p>
        <h1 className={mode === "dank" ? "mt-2 text-5xl font-black uppercase leading-none text-lime-300" : "mt-2 font-serif text-5xl font-semibold leading-none text-zinc-950"}>
          {title}
        </h1>
        <p className={mode === "dank" ? "mt-2 max-w-4xl text-sm text-lime-100/75" : "mt-2 max-w-4xl text-sm text-stone-700"}>{description}</p>
      </section>
      <section className={mode === "dank" ? "relative min-h-0 overflow-hidden border border-lime-300/35 bg-black/78 p-4" : "relative min-h-0 overflow-hidden rounded-sm border border-stone-300 bg-white/62 p-4"}>
        {mode === "dank" ? <div className="absolute inset-0 dank-noise opacity-35" /> : <div className="absolute inset-0 paper-grid opacity-45" />}
        <div className={section === "leaderboard" ? "relative grid gap-4 xl:grid-cols-2 2xl:grid-cols-3" : "relative grid gap-4"}>
          {visibleBoards.map((board) => (
            <article key={board.section} className={mode === "dank" ? "border border-pink-500/40 bg-black/72 p-4 text-lime-100" : "border border-stone-300 bg-white/80 p-4 text-stone-900"}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className={mode === "dank" ? "text-xl font-black uppercase text-lime-300" : "font-serif text-2xl font-semibold"}>{mode === "dank" ? board.dankTitle : board.title}</h2>
                  <p className={mode === "dank" ? "mt-1 text-xs uppercase tracking-wide text-pink-300" : "mt-1 text-sm text-stone-600"}>{board.flavor}</p>
                </div>
                <Link className={mode === "dank" ? "text-xs font-black uppercase text-pink-300" : "text-xs font-semibold uppercase text-emerald-700"} href={sectionHref(report.id, board.section)}>
                  Open
                </Link>
              </div>
              <ol className="mt-4 space-y-2 text-sm">
                {board.reports.map((entry, index) => (
                  <li key={`${board.section}-${entry.id}`} className={mode === "dank" ? "flex justify-between gap-3 border-b border-lime-300/10 pb-2" : "flex justify-between gap-3 border-b border-stone-200 pb-2"}>
                    <Link href={`/reports/${entry.id}`} className="min-w-0 truncate font-semibold">
                      {index + 1}. {entry.projectName}
                    </Link>
                    <span className="shrink-0 font-mono">{board.metric(entry)}</span>
                  </li>
                ))}
                {board.reports.length === 0 ? <li>No reports yet.</li> : null}
              </ol>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function buildLeaderboardBoards(reports: THCReport[]) {
  return [
    {
      section: "most-truthful" as ReportSection,
      title: "Most Truthful",
      dankTitle: "Truth Lords",
      flavor: "Strongest public Truth evidence. Purpose, boundaries, assumptions, and claims are easiest to inspect.",
      description: "Repos ranked by the Truth scorecard category only.",
      metric: (entry: THCReport) => categoryScore(entry, "Truth"),
      reports: rankBy(reports, (entry) => categoryScore(entry, "Truth")),
    },
    {
      section: "most-hardened" as ReportSection,
      title: "Most Hardened",
      dankTitle: "Hardest Builds",
      flavor: "Validation paths, CI, failure modes, environment notes, and automation guardrails show up here.",
      description: "Repos ranked by the Hardening scorecard category only.",
      metric: (entry: THCReport) => categoryScore(entry, "Hardening"),
      reports: rankBy(reports, (entry) => categoryScore(entry, "Hardening")),
    },
    {
      section: "most-clarified" as ReportSection,
      title: "Most Clarified",
      dankTitle: "Clarity Maxxing",
      flavor: "Setup, contributor paths, operator docs, recovery notes, and navigation clarity.",
      description: "Repos ranked by the Clarity scorecard category only.",
      metric: (entry: THCReport) => categoryScore(entry, "Clarity"),
      reports: rankBy(reports, (entry) => categoryScore(entry, "Clarity")),
    },
    {
      section: "best-audit-history" as ReportSection,
      title: "Best Audit History",
      dankTitle: "Receipts Archive",
      flavor: "Decision history, changelogs, risk notes, uncertainty, and review trail evidence.",
      description: "Repos ranked by the Audit History scorecard category only.",
      metric: (entry: THCReport) => categoryScore(entry, "Audit History"),
      reports: rankBy(reports, (entry) => categoryScore(entry, "Audit History")),
    },
    {
      section: "highest-thc" as ReportSection,
      title: "Highest THC",
      dankTitle: "Highest Potency",
      flavor: "Highest total score after public inspection. Caps and labels still apply.",
      description: "Repos ranked by total THC score.",
      metric: (entry: THCReport) => entry.totalScore,
      reports: rankBy(reports, (entry) => entry.totalScore),
    },
  ];
}

function OperatorSectionPage({ reports, mode }: { reports: THCReport[]; mode: "clarity" | "dank" }) {
  const operators = buildOperatorRows(reports);
  return (
    <div className="grid min-h-0 gap-3 lg:grid-rows-[auto_minmax(0,1fr)]">
      <section className={mode === "dank" ? "border-b border-pink-500/45 pb-4" : "border-b border-stone-300 pb-4"}>
        <p className={mode === "dank" ? "text-xs font-black uppercase tracking-[0.24em] text-pink-400" : "font-serif text-sm italic text-stone-500"}>
          {mode === "dank" ? "Operators // builder receipts" : "Operators folder page"}
        </p>
        <h1 className={mode === "dank" ? "mt-2 text-5xl font-black uppercase leading-none text-lime-300" : "mt-2 font-serif text-5xl font-semibold leading-none text-zinc-950"}>
          Operators
        </h1>
        <p className={mode === "dank" ? "mt-2 max-w-4xl text-sm text-lime-100/75" : "mt-2 max-w-4xl text-sm text-stone-700"}>
          Repository-owner rollups across submitted public reports. This is a builder signal, not a scoring input.
        </p>
      </section>
      <section className={mode === "dank" ? "relative min-h-0 overflow-hidden border border-lime-300/35 bg-black/78 p-4" : "relative min-h-0 overflow-hidden rounded-sm border border-stone-300 bg-white/62 p-4"}>
        {mode === "dank" ? <div className="absolute inset-0 dank-noise opacity-35" /> : <div className="absolute inset-0 paper-grid opacity-45" />}
        <div className="relative grid gap-3 xl:grid-cols-2">
          {operators.map((operator) => (
            <article key={operator.owner} className={mode === "dank" ? "border border-pink-500/40 bg-black/72 p-4 text-lime-100" : "border border-stone-300 bg-white/80 p-4 text-stone-900"}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <OwnerDankAvatar avatarUrl={operator.ownerAvatarUrl} owner={operator.owner} mode={mode} size="md" />
                  <a className={mode === "dank" ? "min-w-0 truncate text-xl font-black text-cyan-300" : "min-w-0 truncate font-serif text-2xl font-semibold text-blue-700"} href={operator.ownerUrl} rel="noreferrer" target="_blank">
                    {operator.owner}
                  </a>
                </div>
                <span className="font-mono">{operator.averageScore}</span>
              </div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <MetricChip mode={mode} label="Repos" value={operator.repos} />
                <MetricChip mode={mode} label="Reports" value={operator.reports} />
                <MetricChip mode={mode} label="Top" value={operator.topScore} />
              </div>
              <p className="mt-3 truncate text-xs opacity-70">Top repo: {operator.topRepo}</p>
            </article>
          ))}
          {operators.length === 0 ? <p>No operators yet.</p> : null}
        </div>
      </section>
    </div>
  );
}

function MetricChip({ mode, label, value }: { mode: "clarity" | "dank"; label: string; value: number }) {
  return (
    <div className={mode === "dank" ? "border border-lime-300/25 bg-lime-300/10 p-2" : "border border-stone-200 bg-white/70 p-2"}>
      <span className="block opacity-65">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

function buildOperatorRows(reports: THCReport[]) {
  const byOwner = new Map<string, THCReport[]>();
  for (const entry of reports) {
    const meta = repositoryMeta(entry);
    const owner = meta.owner ?? "unknown";
    byOwner.set(owner, [...(byOwner.get(owner) ?? []), entry]);
  }
  return [...byOwner.entries()]
    .map(([owner, entries]) => {
      const top = [...entries].sort((a, b) => b.totalScore - a.totalScore || b.generatedAt.localeCompare(a.generatedAt))[0];
      return {
        owner,
        ownerUrl: repositoryMeta(top).ownerUrl,
        ownerAvatarUrl: repositoryMeta(top).ownerAvatarUrl,
        reports: entries.length,
        repos: new Set(entries.map((entry) => repositoryMeta(entry).repo)).size,
        averageScore: Math.round(entries.reduce((sum, entry) => sum + entry.totalScore, 0) / entries.length),
        topScore: top.totalScore,
        topRepo: repositoryMeta(top).repo,
      };
    })
    .sort((a, b) => b.averageScore - a.averageScore || b.topScore - a.topScore || b.repos - a.repos)
    .slice(0, 10);
}

function rankBy(reports: THCReport[], metric: (entry: THCReport) => number) {
  return [...reports].sort((a, b) => metric(b) - metric(a) || b.generatedAt.localeCompare(a.generatedAt)).slice(0, 10);
}

function categoryScore(report: THCReport, category: string) {
  return report.evidenceTable.find((row) => row.category === category)?.score ?? 0;
}

function SectionPage({ report, section, mode }: { report: THCReport; section: ReportSection; mode: "clarity" | "dank" }) {
  const title = sectionTitle(section, mode);
  const analysis = sectionAnalysis(report, section);
  const sectionNote = presentSectionAnalysis(section, analysis, mode);
  const detailClass =
    mode === "dank"
      ? "relative h-full min-h-0 overflow-hidden border border-lime-300/35 bg-black/78 p-4 shadow-[0_0_0_1px_rgba(236,72,153,0.22),0_0_38px_rgba(190,242,100,0.08)]"
      : "relative h-full min-h-0 overflow-hidden rounded-sm border border-stone-300 bg-white/62 p-4 shadow-[8px_12px_22px_rgba(68,64,60,0.08)]";
  return (
    <div className="grid h-full min-h-0 gap-3 lg:grid-rows-[auto_minmax(0,1fr)]">
      <section className={mode === "dank" ? "border-b border-pink-500/45 pb-4" : "border-b border-stone-300 pb-4"}>
        <p className={mode === "dank" ? "text-xs font-black uppercase tracking-[0.24em] text-pink-400" : "font-serif text-sm italic text-stone-500"}>
          {mode === "dank" ? "Deep Receipts // same truth engine" : "Report folder page"}
        </p>
        <h1 className={mode === "dank" ? "mt-2 text-5xl font-black uppercase leading-none text-lime-300" : "mt-2 font-serif text-5xl font-semibold leading-none text-zinc-950"}>
          {title}
        </h1>
        <p className={mode === "dank" ? "mt-2 max-w-3xl text-sm text-lime-100/75" : "mt-2 max-w-3xl text-sm text-stone-700"}>
          {sectionDescription(section)}
        </p>
      </section>
      <section className={detailClass}>
        {mode === "dank" ? <div className="absolute inset-0 dank-noise opacity-35" /> : <div className="absolute inset-0 paper-grid opacity-45" />}
        <div className="relative grid h-full min-h-0 gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="min-h-0 overflow-auto pr-1">
            {section === "evidence" ? <EvidenceDetail report={report} mode={mode} /> : null}
            {section === "caps-applied" ? <CapsDetail report={report} mode={mode} /> : null}
            {section === "hidden-trust" ? <HiddenTrustDetail report={report} mode={mode} /> : null}
            {section === "local-artifacts" ? <LocalDetail report={report} mode={mode} /> : null}
            {section === "next-actions" ? <ActionsDetail report={report} mode={mode} /> : null}
            {section === "ai-analysis" ? <AIAnalysisDetail report={report} mode={mode} /> : null}
            {section === "history" ? <HistoryDetail report={report} mode={mode} /> : null}
          </div>
          <aside className={`${mode === "dank" ? "border border-pink-500/45 bg-black/75 p-4 text-pink-100" : "rotate-[-0.5deg] border border-amber-200 bg-amber-50 p-4 text-amber-950 shadow-[6px_8px_16px_rgba(68,64,60,0.12)]"} overflow-auto`}>
            <p className={mode === "dank" ? "text-xs font-black uppercase tracking-[0.2em] text-lime-300" : "font-serif text-sm italic text-stone-500"}>{sectionNote.kicker}</p>
            <h2 className={mode === "dank" ? "mt-2 text-lg font-black uppercase text-pink-300" : "mt-2 font-serif text-xl font-semibold"}>{sectionNote.definitionTitle}</h2>
            <p className="mt-2 text-sm leading-6">{sectionNote.definition}</p>
            <h3 className={mode === "dank" ? "mt-4 text-sm font-black uppercase text-lime-300" : "mt-4 text-sm font-semibold uppercase text-stone-600"}>{sectionNote.riskTitle}</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {sectionNote.whatIsWrong.map((item) => <li key={item}>• {item}</li>)}
            </ul>
            <p className={mode === "dank" ? "mt-4 border-t border-pink-500/35 pt-3 text-sm leading-6 text-lime-100" : "mt-4 border-t border-amber-200 pt-3 text-sm leading-6"}>{sectionNote.aiNote}</p>
            <p className={mode === "dank" ? "mt-4 text-[11px] uppercase tracking-wide text-pink-300/80" : "mt-4 text-xs text-stone-600"}>
              AI review providers can draft section notes, but deterministic THC scoring and caps remain authoritative.
            </p>
          </aside>
        </div>
      </section>
    </div>
  );
}

function sectionAnalysis(report: THCReport, section: ReportSection) {
  if (section === "evidence") return report.reviewAnalysis.evidence;
  if (section === "caps-applied") return report.reviewAnalysis.capsApplied;
  if (section === "hidden-trust") return report.reviewAnalysis.hiddenTrust;
  if (section === "local-artifacts") return report.reviewAnalysis.localArtifacts;
  if (section === "ai-analysis") {
    return {
      definition: "AI analysis compiles the section notes, overall summary, strengths, risks, and uncertainty into one readable audit companion.",
      whatIsWrong: ["This page is explanatory only. Deterministic scoring, caps, and labels still come from the app logic."],
      aiNote: "Use this page to read the full provider output in one place without hopping section by section.",
    };
  }
  if (section === "history") {
    return {
      definition: "History shows how this repository changes across public review artifacts over time.",
      whatIsWrong: ["Only one report may exist today, so trend charts become more meaningful after repeated reviews."],
      aiNote: "Each saved report should preserve commit SHA and generated timestamp so score movement is auditable.",
    };
  }
  return report.reviewAnalysis.nextActions;
}

function presentSectionAnalysis(section: ReportSection, analysis: ReturnType<typeof sectionAnalysis>, mode: "clarity" | "dank") {
  if (mode === "clarity") {
    return {
      kicker: "AI analysis note",
      definitionTitle: "What this means",
      riskTitle: "What is wrong",
      definition: analysis.definition,
      whatIsWrong: analysis.whatIsWrong,
      aiNote: analysis.aiNote,
    };
  }

  const sectionTitleMap: Partial<Record<ReportSection, string>> = {
    evidence: "Receipts read",
    "caps-applied": "Score nerf read",
    "hidden-trust": "Sus read",
    "local-artifacts": "Claimed lore read",
    "next-actions": "Un-cook plan",
    "ai-analysis": "Whole read",
    history: "Timeline read",
  };

  return {
    kicker: `AI sidecar // ${sectionTitleMap[section] ?? "provider configured"}`,
    definitionTitle: "What this actually means",
    riskTitle: "Why this gets nerfed",
    definition: analysis.definition,
    whatIsWrong: analysis.whatIsWrong.map((item) => item),
    aiNote: `${analysis.aiNote} Same facts, louder rendering.`,
  };
}

function truncateText(value: string, limit: number) {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit).trimEnd()}...`;
}

function EvidenceDetail({ report, mode }: { report: THCReport; mode: "clarity" | "dank" }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {report.evidenceTable.map((row) => (
        <article key={row.category} className={mode === "dank" ? "border border-lime-300/30 bg-black/65 p-4" : "border border-stone-300 bg-white/75 p-4"}>
          <div className="flex items-start justify-between gap-3">
            <h2 className={mode === "dank" ? "text-xl font-black uppercase text-lime-300" : "font-serif text-2xl font-semibold"}>{row.category}</h2>
            <span className={mode === "dank" ? "text-3xl font-black text-pink-400" : "font-mono text-2xl text-emerald-800"}>{row.score}</span>
          </div>
          <p className={mode === "dank" ? "mt-3 text-sm text-lime-100/80" : "mt-3 text-sm text-stone-700"}>{row.evidence}</p>
          <p className={mode === "dank" ? "mt-3 text-xs uppercase text-pink-300" : "mt-3 text-xs text-stone-500"}>{row.notes}</p>
        </article>
      ))}
    </div>
  );
}

function CapsDetail({ report, mode }: { report: THCReport; mode: "clarity" | "dank" }) {
  return (
    <div className="grid gap-3">
      {report.capsApplied.map((cap, index) => (
        <div key={cap} className={mode === "dank" ? "flex items-center justify-between border border-pink-500/45 bg-black/70 p-4 text-pink-200" : "flex items-center justify-between border border-amber-300 bg-amber-50 p-4 text-amber-950"}>
          <span>{cap}</span>
          <span className="font-mono">-{index + 1} pts</span>
        </div>
      ))}
    </div>
  );
}

function HiddenTrustDetail({ report, mode }: { report: THCReport; mode: "clarity" | "dank" }) {
  return (
    <div className="grid gap-3">
      {report.hiddenTrustFindings.map((finding) => (
        <article key={finding.finding} className={mode === "dank" ? "border border-pink-500/45 bg-black/70 p-4 text-pink-100" : "border border-red-200 bg-red-50 p-4 text-red-950"}>
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-semibold">{finding.finding}</h2>
            <span className="font-mono text-xs uppercase">{finding.severity}</span>
          </div>
          <p className="mt-2 text-sm opacity-85">{finding.evidence}</p>
          <p className="mt-2 text-sm font-semibold">{finding.recommendation}</p>
        </article>
      ))}
    </div>
  );
}

function AIAnalysisDetail({ report, mode }: { report: THCReport; mode: "clarity" | "dank" }) {
  const sections: Array<{ section: ReportSection; title: string }> = [
    { section: "evidence", title: mode === "dank" ? "Receipts" : "Evidence" },
    { section: "caps-applied", title: mode === "dank" ? "Score Nerfs" : "Caps Applied" },
    { section: "hidden-trust", title: mode === "dank" ? "Biggest Sus" : "Hidden Trust" },
    { section: "local-artifacts", title: mode === "dank" ? "Claimed Lore" : "Local Artifacts" },
    { section: "next-actions", title: mode === "dank" ? "Un-Cook Plan" : "Next Actions" },
  ];

  return (
    <div className="grid gap-3">
      <article className={mode === "dank" ? "border border-lime-300/35 bg-black/70 p-4 text-lime-100" : "border border-stone-300 bg-white/75 p-4 text-stone-900"}>
        <h2 className={mode === "dank" ? "text-xl font-black uppercase text-lime-300" : "font-serif text-2xl font-semibold"}>{mode === "dank" ? "Provider Read" : "AI Review Summary"}</h2>
        <p className="mt-3 text-sm leading-6">{report.summary}</p>
        {report.reviewBatches.length ? (
          <div className="mt-4">
            <h3 className={mode === "dank" ? "text-xs font-black uppercase text-pink-300" : "text-xs font-semibold uppercase tracking-wide text-stone-600"}>{mode === "dank" ? "Batch audit queue" : "Batched Review Progress"}</h3>
            <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {report.reviewBatches.map((batch) => (
                <div key={batch.slice} className={mode === "dank" ? "border border-lime-300/25 bg-black/60 p-2 text-xs" : "border border-stone-200 bg-white/70 p-2 text-xs"}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate font-semibold">{batchLabel(batch.slice)}</span>
                    <span className={batch.state === "completed" ? "text-emerald-700" : "text-amber-700"}>{batch.state}</span>
                  </div>
                  <p className="mt-1 truncate opacity-70">{batch.provider}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        {report.uncertaintyNotes.length ? (
          <div className="mt-3">
            <h3 className={mode === "dank" ? "text-xs font-black uppercase text-pink-300" : "text-xs font-semibold uppercase tracking-wide text-stone-600"}>{mode === "dank" ? "Known fuzz" : "Uncertainty Notes"}</h3>
            <ul className="mt-2 space-y-1 text-sm">
              {report.uncertaintyNotes.map((note) => <li key={note}>• {note}</li>)}
            </ul>
          </div>
        ) : null}
      </article>
      <div className="grid gap-3 xl:grid-cols-2">
        {sections.map(({ section, title }) => {
          const analysis = presentSectionAnalysis(section, sectionAnalysis(report, section), mode);
          return (
            <article key={section} className={mode === "dank" ? "border border-pink-500/35 bg-black/70 p-4 text-pink-100" : "border border-stone-300 bg-white/75 p-4 text-stone-900"}>
              <div className="flex items-start justify-between gap-3">
                <h2 className={mode === "dank" ? "text-lg font-black uppercase text-lime-300" : "font-serif text-xl font-semibold"}>{title}</h2>
                <Link className={mode === "dank" ? "text-xs font-black uppercase text-pink-300" : "text-xs font-semibold uppercase text-emerald-700"} href={sectionHref(report.id, section)}>
                  Open
                </Link>
              </div>
              <p className="mt-3 text-sm leading-6">{analysis.definition}</p>
              <ul className="mt-3 space-y-1 text-sm">
                {analysis.whatIsWrong.map((item) => <li key={item}>• {item}</li>)}
              </ul>
              <p className={mode === "dank" ? "mt-3 border-t border-pink-500/35 pt-3 text-sm leading-6 text-lime-100" : "mt-3 border-t border-stone-200 pt-3 text-sm leading-6 text-stone-700"}>{analysis.aiNote}</p>
            </article>
          );
        })}
      </div>
    </div>
  );
}

function batchLabel(slice: string) {
  const labels: Record<string, string> = {
    evidence: "Evidence",
    "local-artifacts": "Local Artifacts",
    "caps-applied": "Caps Applied",
    "hidden-trust": "Hidden Trust",
    "next-actions": "Next Actions",
    "overview-synthesis": "Overview Synthesis",
  };
  return labels[slice] ?? slice;
}

function LocalDetail({ report, mode }: { report: THCReport; mode: "clarity" | "dank" }) {
  const bot = report.localArtifactStatus.thcBot;
  return (
    <div className={mode === "dank" ? "grid gap-3 text-lime-100" : "grid gap-3 text-stone-800"}>
      <p><strong>State:</strong> {report.localArtifactStatus.state}</p>
      <p><strong>Files present:</strong> {report.localArtifactStatus.filesPresent.length ? report.localArtifactStatus.filesPresent.join(", ") : "none"}</p>
      {bot.detected ? (
        <article className={mode === "dank" ? "border border-lime-300/35 bg-black/65 p-4" : "border border-stone-300 bg-white/75 p-4"}>
          <h2 className={mode === "dank" ? "text-lg font-black uppercase text-lime-300" : "font-serif text-xl font-semibold"}>Local THC-BOT Artifacts Detected</h2>
          <p className="mt-2 text-sm leading-6">
            These artifacts were used as a review map and independently checked against public evidence. They are not certification, endorsement, or leaderboard acceptance.
          </p>
          <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div><dt className="font-semibold">Latest run</dt><dd className="break-all font-mono">{bot.latestRunId}</dd></div>
            <div><dt className="font-semibold">Contract</dt><dd>{bot.contractVersion ?? "unknown"}</dd></div>
            <div><dt className="font-semibold">Reviewed revision</dt><dd className="break-all font-mono">{bot.reviewedRevision ?? "unknown"}</dd></div>
            <div><dt className="font-semibold">Local validation</dt><dd>{bot.localValidationState}</dd></div>
            <div><dt className="font-semibold">Public verification</dt><dd>{bot.publicVerificationState}</dd></div>
            <div><dt className="font-semibold">Public readiness</dt><dd>{bot.publicReadinessStatus}</dd></div>
            <div><dt className="font-semibold">Local score</dt><dd>{bot.localScore ?? "unknown"}</dd></div>
            <div><dt className="font-semibold">Public verified score</dt><dd>{bot.publicScore ?? "not publicly verified"}</dd></div>
            <div><dt className="font-semibold">Score difference</dt><dd>{bot.scoreDelta ?? "not available"}</dd></div>
            <div><dt className="font-semibold">Confidence impact</dt><dd>{bot.confidenceImpact}</dd></div>
          </dl>
          {bot.capsConfirmed.length || bot.capsDisputedOrMissing.length ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <ArtifactList title="Caps confirmed" items={bot.capsConfirmed} />
              <ArtifactList title="Caps disputed or missing" items={bot.capsDisputedOrMissing} />
            </div>
          ) : null}
          {bot.evidenceLinksVerified.length || bot.evidenceLinksStaleMissingOrPrivate.length ? (
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <ArtifactList title="Evidence links verified" items={bot.evidenceLinksVerified} />
              <ArtifactList title="Evidence stale, missing, or private" items={bot.evidenceLinksStaleMissingOrPrivate} />
            </div>
          ) : null}
          {bot.ignoredFiles.length ? <p className="mt-3 text-xs opacity-75">Ignored non-canonical files: {bot.ignoredFiles.join(", ")}</p> : null}
        </article>
      ) : (
        <p><strong>THC-BOT:</strong> not detected; public audit used repository files directly.</p>
      )}
      {report.localArtifactStatus.findings.map((finding) => <p key={finding}>• {finding}</p>)}
      {report.localArtifactStatus.publicReviewHandoffNotes.map((note) => <p key={note}>• {note}</p>)}
    </div>
  );
}

function ArtifactList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wide opacity-70">{title}</h3>
      <ul className="mt-1 space-y-1 text-sm">
        {items.length ? items.map((item) => <li key={item}>• {item}</li>) : <li>None recorded.</li>}
      </ul>
    </div>
  );
}

function ActionsDetail({ report, mode }: { report: THCReport; mode: "clarity" | "dank" }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {report.nextActions.map((action) => (
        <label key={action} className={mode === "dank" ? "flex gap-3 border border-lime-300/35 bg-black/70 p-4 text-lime-100" : "flex gap-3 border border-stone-300 bg-white/75 p-4 text-stone-800"}>
          <input type="checkbox" readOnly className="mt-1 shrink-0" />
          <span>{action}</span>
        </label>
      ))}
    </div>
  );
}

function HistoryDetail({ report, mode }: { report: THCReport; mode: "clarity" | "dank" }) {
  const score = scoreLookup(report);
  const bars = [
    ["Truth", score.Truth, 30],
    ["Hardening", score.Hardening, 35],
    ["Clarity", score.Clarity, 25],
    ["Audit History", score["Audit History"], 10],
    ["Total", report.totalScore, 100],
  ] as const;
  return (
    <div className="grid gap-3">
      <article className={mode === "dank" ? "border border-lime-300/35 bg-black/70 p-4" : "border border-stone-300 bg-white/75 p-4"}>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className={mode === "dank" ? "text-xl font-black uppercase text-lime-300" : "font-serif text-2xl font-semibold"}>Current Review Point</h2>
            <p className="mt-1 text-sm opacity-75">{new Date(report.generatedAt).toLocaleString()} · {report.reviewedCommitSha.slice(0, 12)}</p>
          </div>
          <span className={mode === "dank" ? "font-mono text-3xl text-pink-300" : "font-mono text-3xl text-emerald-800"}>{report.totalScore}</span>
        </div>
      </article>
      <div className="grid gap-2">
        {bars.map(([label, value, max]) => (
          <div key={label} className={mode === "dank" ? "border border-lime-300/25 bg-black/65 p-3" : "border border-stone-300 bg-white/75 p-3"}>
            <div className="flex justify-between text-xs font-semibold uppercase">
              <span>{label}</span>
              <span>{value}/{max}</span>
            </div>
            <div className={mode === "dank" ? "mt-2 h-3 bg-lime-100/10" : "mt-2 h-3 bg-stone-200"}>
              <div className={mode === "dank" ? "h-full bg-gradient-to-r from-lime-300 via-cyan-300 to-pink-400" : "h-full bg-emerald-700"} style={{ width: `${Math.round((value / max) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p className={mode === "dank" ? "text-xs uppercase text-pink-300/80" : "text-xs text-stone-500"}>
        Multi-point charts will use prior reports for this repository once repeated reviews are stored by commit SHA.
      </p>
    </div>
  );
}

function sectionTitle(section: ReportSection, mode: "clarity" | "dank") {
  const clarity: Record<ReportSection, string> = {
    overview: "Overview",
    evidence: "Evidence",
    "caps-applied": "Caps Applied",
    "hidden-trust": "Hidden Trust",
    "local-artifacts": "Local Artifacts",
    "next-actions": "Next Actions",
    "ai-analysis": "AI Analysis",
    history: "History",
    leaderboard: "Leaderboard",
    operators: "Operators",
    "most-truthful": "Most Truthful",
    "most-hardened": "Most Hardened",
    "most-clarified": "Most Clarified",
    "best-audit-history": "Best Audit History",
    "highest-thc": "Highest THC",
  };
  const dank: Record<ReportSection, string> = {
    overview: "Overview",
    evidence: "Receipts",
    "caps-applied": "Score Nerfs",
    "hidden-trust": "Biggest Sus",
    "local-artifacts": "Claimed Lore",
    "next-actions": "Un-Cook This Repo",
    "ai-analysis": "AI Analysis",
    history: "History",
    leaderboard: "Registry Main",
    operators: "Operators",
    "most-truthful": "Truth Lords",
    "most-hardened": "Hardest Builds",
    "most-clarified": "Clarity Maxxing",
    "best-audit-history": "Receipts Archive",
    "highest-thc": "Highest Potency",
  };
  return mode === "dank" ? dank[section] : clarity[section];
}

function sectionDescription(section: ReportSection) {
  const descriptions: Record<ReportSection, string> = {
    overview: "Summary dashboard for the automated public review.",
    evidence: "Public evidence inspected by the automated review. Local artifacts are treated as hints, not truth.",
    "caps-applied": "Deterministic level caps applied after scoring when evidence is missing, stale, or unverifiable.",
    "hidden-trust": "Findings where trust is implied by polish, reputation, or claims but not fully backed by public evidence.",
    "local-artifacts": "Status of docs/thc artifacts when present in the public repository state.",
    "next-actions": "Concrete steps likely to improve the next public THC review.",
    "ai-analysis": "Compiled AI section notes, overall summary, strengths, risks, and uncertainty for this review.",
    history: "Score movement over time for this repository or operator as repeated public reviews are stored.",
    leaderboard: "Public registry boards ranked from stored Automated Public Review artifacts.",
    operators: "Repository-owner rollups across submitted public reports.",
    "most-truthful": "Repos ranked by public Truth evidence.",
    "most-hardened": "Repos ranked by public Hardening evidence.",
    "most-clarified": "Repos ranked by public Clarity evidence.",
    "best-audit-history": "Repos ranked by visible audit history evidence.",
    "highest-thc": "Repos ranked by total THC score.",
  };
  return descriptions[section];
}
