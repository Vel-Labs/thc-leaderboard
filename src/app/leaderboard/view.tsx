"use client";

import Link from "next/link";
import { useState } from "react";
import type { THCReport } from "@/lib/thc/schema";
import { readSubmittedRepositories, repositoryWasSubmitted } from "@/lib/ui/browser-submissions";
import { repositoryMeta } from "@/lib/ui/repository-meta";
import { CompactReviewForm } from "../compact-review-form";
import { GitHubSignInButton } from "../github-sign-in-button";
import { ModeToggle, useDisplayMode } from "../mode-shell";
import { OwnerDankAvatar } from "../owner-dank-avatar";
import { PixelFace } from "../pixel-face";
import { ProfileTabLink } from "../profile-tab-link";
import { Disclaimer, PinnedNote } from "../reports/[id]/report-parts";
import { StarReportButton } from "../star-report-button";

type LeaderboardPeriod = "all" | "24h";
type LeaderboardSection = "leaderboard" | "operators" | "most-truthful" | "most-hardened" | "most-clarified" | "best-audit-history" | "highest-thc";

export function LeaderboardView({ reports }: { reports: THCReport[] }) {
  const { mode } = useDisplayMode();
  return mode === "dank" ? <DankLeaderboard reports={reports} /> : <ClarityLeaderboard reports={reports} />;
}

function ClarityLeaderboard({ reports }: { reports: THCReport[] }) {
  const [period, setPeriod] = useState<LeaderboardPeriod>("all");
  const [activeSection, setActiveSection] = useState<LeaderboardSection>("leaderboard");
  const [submittedRepos] = useState<string[]>(() => readSubmittedRepositories());
  const filteredReports = filterReportsByPeriod(reports, period);
  const boards = buildBoards(filteredReports);
  const operators = buildOperators(filteredReports);
  const myReports = filteredReports.filter((report) => repositoryWasSubmitted(report.repositoryUrl, submittedRepos));
  return (
    <main className="flex min-h-screen w-full max-w-none flex-col gap-2 px-2 py-2 text-zinc-950 sm:px-3 lg:h-screen lg:min-h-0 lg:overflow-hidden">
      <LeaderboardTopBar mode="clarity" />
      <div className="grid min-h-0 flex-1 gap-2 lg:grid-cols-[295px_minmax(0,1fr)] 2xl:grid-cols-[315px_minmax(0,1fr)]">
        <ClarityLeaderboardSidebar active={activeSection} onSelect={setActiveSection} />
        <section className="relative min-w-0 overflow-hidden rounded-sm border border-stone-300 bg-[#fbf7ec] shadow-[0_18px_55px_rgba(68,64,60,0.18)] lg:h-full">
          <div className="absolute inset-0 opacity-55 paper-grid" />
          <div className="relative grid min-h-0 gap-2 p-2 lg:h-full 2xl:grid-cols-[minmax(0,1fr)_270px]">
            <div className="grid min-h-0 gap-2 overflow-hidden lg:grid-rows-[auto_auto_minmax(0,1fr)_210px]">
              <section className="border-b border-stone-300 pb-3">
                <p className="font-serif text-sm italic text-stone-500">Leaderboard folder page</p>
                <h1 className="mt-1 font-serif text-[clamp(2.3rem,4vw,4.6rem)] font-semibold leading-none tracking-tight">Public Review Index</h1>
                <p className="mt-3 max-w-4xl text-sm leading-6 text-stone-700">
                  Stored Automated Public Review artifacts ranked by evidence categories. Repository owner, stars, and metadata are display
                  context only; they never affect score, caps, or THC level.
                </p>
              </section>

              <div className="flex items-center justify-between gap-3 border border-stone-300 bg-white/55 px-3 py-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">Leaderboard Window</p>
                  <p className="text-xs text-stone-600">Filters top boards, tables, and operators by report timestamp.</p>
                </div>
                <PeriodToggle mode="clarity" period={period} onChange={setPeriod} />
              </div>

              <ActiveLeaderboardPanel activeSection={activeSection} boards={boards} reports={filteredReports} operators={operators} mode="clarity" />

              <div className="grid min-h-0 gap-2 overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
                <ReportsPanel title="Recent Reports" description="Most recent 10 public review artifacts." reports={filteredReports.slice(0, 10)} mode="clarity" compact />
                <OperatorsPanel operators={operators} mode="clarity" />
                <ReportsPanel title="My Repos" description="Repos reviewed from this browser until GitHub-backed ownership is wired." reports={myReports} mode="clarity" compact />
              </div>
            </div>

            <aside className="hidden min-h-0 content-start gap-2 overflow-hidden 2xl:grid">
              <PinnedNote title="Registry Rule" tone="white">
                Leaderboard placement is a stored review artifact, not certification, endorsement, or production readiness.
              </PinnedNote>
              <PinnedNote title="Top 10 Boards" tone="amber">
                Truth, Hardening, Clarity, Audit History, and total THC each rank independently from the same report payload.
              </PinnedNote>
              <PinnedNote title="Refresh Model" tone="green">
                Re-reviews should enqueue work, skip unchanged commits, and preserve old reports by reviewed SHA.
              </PinnedNote>
            </aside>
          </div>
        </section>
      </div>
      <Disclaimer mode="clarity" />
    </main>
  );
}

function DankLeaderboard({ reports }: { reports: THCReport[] }) {
  const [period, setPeriod] = useState<LeaderboardPeriod>("all");
  const [activeSection, setActiveSection] = useState<LeaderboardSection>("leaderboard");
  const [submittedRepos] = useState<string[]>(() => readSubmittedRepositories());
  const filteredReports = filterReportsByPeriod(reports, period);
  const boards = buildBoards(filteredReports);
  const operators = buildOperators(filteredReports);
  const myReports = filteredReports.filter((report) => repositoryWasSubmitted(report.repositoryUrl, submittedRepos));
  return (
    <main className="flex min-h-screen w-full max-w-none flex-col gap-2 px-2 py-2 font-mono text-lime-100 sm:px-3 lg:h-screen lg:min-h-0 lg:overflow-hidden">
      <LeaderboardTopBar mode="dank" />
      <div className="grid min-h-0 flex-1 gap-2 lg:grid-cols-[295px_minmax(0,1fr)] 2xl:grid-cols-[315px_minmax(0,1fr)]">
        <DankLeaderboardSidebar active={activeSection} onSelect={setActiveSection} />
        <section className="relative min-w-0 overflow-hidden border border-lime-300/40 bg-black/80 p-2 shadow-[0_0_38px_rgba(190,242,100,0.16)] lg:h-full">
          <div className="absolute inset-0 dank-noise opacity-70" />
          <div className="relative grid min-h-0 gap-2 lg:h-full 2xl:grid-cols-[minmax(0,1fr)_275px]">
            <div className="grid min-h-0 gap-2 overflow-hidden lg:grid-rows-[auto_auto_minmax(0,1fr)_210px]">
              <section className="border-b border-pink-500/45 pb-3">
                <p className="text-xs font-black uppercase tracking-[0.24em] text-pink-400">Registry // receipts not clout</p>
                <h1 className="mt-1 text-[clamp(2.2rem,4vw,4.5rem)] font-black uppercase leading-none text-lime-300">Leaderboard</h1>
                <p className="mt-3 max-w-4xl text-sm leading-6 text-lime-100/75">
                  Repo metadata is flavor text. Scores still come from public evidence, deterministic caps, and the THC methodology.
                </p>
              </section>

              <div className="flex items-center justify-between gap-3 border border-pink-500/40 bg-black/70 px-3 py-2">
                <div>
                  <p className="text-xs font-black uppercase tracking-wide text-pink-300">Time Filter //</p>
                  <p className="text-xs uppercase text-lime-100/60">All-time receipts or last 24h chaos.</p>
                </div>
                <PeriodToggle mode="dank" period={period} onChange={setPeriod} />
              </div>

              <ActiveLeaderboardPanel activeSection={activeSection} boards={boards} reports={filteredReports} operators={operators} mode="dank" />

              <div className="grid min-h-0 gap-2 overflow-hidden lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(0,1fr)]">
                <ReportsPanel title="Recent Receipts" description="Newest 10 public review artifacts." reports={filteredReports.slice(0, 10)} mode="dank" compact />
                <OperatorsPanel operators={operators} mode="dank" />
                <ReportsPanel title="My Repos" description="Repos reviewed from this browser until GitHub-backed ownership is wired." reports={myReports} mode="dank" compact />
              </div>
            </div>

            <aside className="hidden min-h-0 content-start gap-2 overflow-hidden 2xl:grid">
              <DankNote title="Registry Rule //">Rankings are report artifacts, not cosigns, badges, or security blessings.</DankNote>
              <DankNote title="Top 10 Boards //">Truth Lords, Hardest Builds, Clarity Maxxing, Receipts Archive, Highest Potency.</DankNote>
              <DankNote title="Re-Cook Queue //">Cron should enqueue. Workers should inspect. The app server should not run stranger code.</DankNote>
            </aside>
          </div>
        </section>
      </div>
      <Disclaimer mode="dank" />
    </main>
  );
}

function LeaderboardTopBar({ mode }: { mode: "clarity" | "dank" }) {
  if (mode === "dank") {
    return (
      <header className="relative overflow-hidden border border-lime-300/45 bg-black/88 p-2 shadow-[0_0_30px_rgba(190,242,100,0.16)]">
        <div className="grid gap-2 lg:grid-cols-[360px_minmax(0,1fr)_390px] lg:items-center">
          <div className="flex min-w-0 items-center gap-3">
            <PixelFace />
            <div>
              <div className="whitespace-nowrap text-2xl font-black leading-none text-lime-300 drop-shadow-[0_0_8px_rgba(190,242,100,0.55)]">THC LEADERBOARD</div>
              <div className="mt-1 whitespace-nowrap text-[10px] font-black uppercase tracking-[0.16em] text-lime-300">Truth · Hardening · Clarity</div>
            </div>
          </div>
          <div className="hidden h-5 overflow-hidden text-[10px] uppercase tracking-[0.5em] text-pink-500/45 lg:block">
            ▓▒░ public registry // top 10 boards ░▒▓
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
          <div className="mt-1 text-xs tracking-[0.15em] text-stone-600">Truth · Hardening · Clarity</div>
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

function ClarityLeaderboardSidebar({ active, onSelect }: { active: LeaderboardSection; onSelect: (section: LeaderboardSection) => void }) {
  const items = [
    ["leaderboard", "Leaderboard", "All ranked artifacts"],
    ["operators", "Operators", "Owner rollups"],
    ["most-truthful", "Most Truthful", "Truth evidence"],
    ["most-hardened", "Most Hardened", "Validation paths"],
    ["most-clarified", "Most Clarified", "Setup clarity"],
    ["best-audit-history", "Best Audit History", "Decision trail"],
    ["highest-thc", "Highest THC", "Total score"],
  ];
  return (
    <aside className="relative hidden overflow-hidden rounded-sm border border-stone-300 bg-[#efe4cd] p-3 shadow-[8px_12px_22px_rgba(68,64,60,0.16)] before:absolute before:-right-2 before:top-7 before:h-[calc(100%-54px)] before:w-3 before:rounded-r before:border before:border-l-0 before:border-stone-300 before:bg-[#e7dcc5] after:absolute after:-right-1 after:top-12 after:h-[calc(100%-92px)] after:w-2 after:rounded-r after:bg-[#d9ccb4] lg:block lg:h-full">
      <div className="absolute left-4 top-2 z-20 flex items-end gap-1.5">
        <FolderTab href="/" label="About" width="w-[52px]" />
        <FolderTab href="/audit" label="Audit" width="w-[48px]" />
        <FolderTab href="/leaderboard" label="Leaderboard" active width="w-[90px]" />
        <ProfileTabLink mode="clarity" width="w-[60px]" />
      </div>
      <p className="relative mb-2 mt-8 flex items-center gap-2 text-xs uppercase tracking-widest text-stone-500">
        <span className="text-lg leading-none">□</span>
        Leaderboard Folder
      </p>
      <div className="relative mb-4 flex items-center gap-2 border-b border-stone-300 pb-3 pl-1 text-xs font-semibold text-stone-700">
        <span className="text-base">□</span>
        <span className="truncate">public registry</span>
      </div>
      <nav className="relative space-y-1 text-sm">
        {items.map(([section, label, flavor], index) => (
          <button
            key={section}
            type="button"
            onClick={() => onSelect(section as LeaderboardSection)}
            className={`flex w-full items-center gap-2 rounded-sm border px-3 py-2 text-left ${active === section ? "border-emerald-400 bg-emerald-50/95 text-emerald-950 shadow-[inset_0_0_0_1px_rgba(16,185,129,0.18)]" : "border-transparent border-b-stone-300/75 text-stone-700 hover:bg-white/45"}`}
          >
            <span>{index <= 1 ? "▣" : "▤"}</span>
            <span className="min-w-0">
              <span className="block truncate">{label}</span>
              <span className="block truncate text-[10px] text-stone-500">{flavor}</span>
            </span>
          </button>
        ))}
      </nav>
      <div className="absolute bottom-3 left-3 right-3 rounded-sm border border-stone-200 bg-white p-3 font-serif text-xs italic leading-5 text-stone-700 shadow-[6px_8px_16px_rgba(68,64,60,0.12)]">
        Ranking is based on stored public review artifacts, not repo popularity.
      </div>
    </aside>
  );
}

function DankLeaderboardSidebar({ active, onSelect }: { active: LeaderboardSection; onSelect: (section: LeaderboardSection) => void }) {
  const items: Array<[LeaderboardSection, string]> = [
    ["leaderboard", "Registry Main"],
    ["operators", "Operators"],
    ["most-truthful", "Truth Lords"],
    ["most-hardened", "Hardest Builds"],
    ["most-clarified", "Clarity Maxxing"],
    ["best-audit-history", "Receipts Archive"],
    ["highest-thc", "Highest Potency"],
  ];
  return (
    <aside className="relative hidden overflow-hidden border border-lime-300/35 bg-black/75 p-3 shadow-[0_0_22px_rgba(190,242,100,0.1)] lg:block lg:h-full">
      <div className="mb-3 grid grid-cols-[0.7fr_0.7fr_1.25fr_0.85fr] gap-2 text-[10px] font-black uppercase tracking-wide">
        <Link href="/" className="border border-cyan-300/25 px-2 py-1.5 text-cyan-300/60">About</Link>
        <Link href="/audit" className="border border-lime-300/25 px-2 py-1.5 text-lime-300/55">Audit</Link>
        <Link href="/leaderboard" className="border border-pink-500 bg-pink-500/20 px-2 py-1.5 text-pink-100">Leaderboard</Link>
        <ProfileTabLink mode="dank" variant="dank-grid" />
      </div>
      <p className="mb-3 text-xs uppercase tracking-widest text-lime-300">Leaderboard Folder //</p>
      <nav className="space-y-1.5 text-xs font-black uppercase 2xl:text-sm">
        {items.map(([section, item]) => (
          <button
            key={section}
            type="button"
            onClick={() => onSelect(section)}
            className={`block w-full border px-3 py-1.5 text-left ${active === section ? "border-lime-300 bg-lime-300/18 text-lime-100 shadow-[0_0_18px_rgba(190,242,100,0.22)]" : "border-transparent text-lime-300/75"}`}
          >
            {item}
          </button>
        ))}
      </nav>
      <div className="mt-5 border border-lime-300/35 bg-lime-300/10 p-3 text-xs leading-5 text-lime-100">
        Public receipts only. Clout is not a score category.
      </div>
    </aside>
  );
}

function FolderTab({ href, label, active = false, width }: { href: string; label: string; active?: boolean; width: string }) {
  return (
    <Link href={href} className={`relative h-8 ${width} rounded-t-sm border border-b-0 px-2 pt-1.5 text-center text-[10px] font-semibold uppercase tracking-wide shadow-[3px_-2px_8px_rgba(68,64,60,0.08)] ${active ? "border-emerald-700/70 bg-[#fbf3df] text-emerald-900" : "border-stone-300 bg-[#e4d7bd] text-stone-500"}`}>
      <span className={`absolute -right-3 bottom-[-1px] h-[calc(100%+1px)] w-5 skew-x-[16deg] rounded-tr-sm border border-b-0 border-l-0 ${active ? "border-emerald-700/70 bg-[#fbf3df]" : "border-stone-300 bg-[#e4d7bd]"}`} />
      <span className="relative">{label}</span>
    </Link>
  );
}

function PeriodToggle({ mode, period, onChange }: { mode: "clarity" | "dank"; period: LeaderboardPeriod; onChange: (period: LeaderboardPeriod) => void }) {
  const options: { value: LeaderboardPeriod; label: string }[] = [
    { value: "all", label: "All Time" },
    { value: "24h", label: "Last 24 Hours" },
  ];
  return (
    <div className={mode === "dank" ? "inline-flex border border-lime-300/40 bg-black/70 p-1 text-[10px] font-black uppercase" : "inline-flex rounded-full border border-stone-300 bg-white/75 p-1 text-xs font-semibold"}>
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={
            mode === "dank"
              ? `px-3 py-1.5 ${period === option.value ? "bg-lime-300 text-black shadow-[0_0_14px_rgba(190,242,100,0.35)]" : "text-lime-100/65"}`
              : `rounded-full px-3 py-1.5 ${period === option.value ? "bg-zinc-950 text-white" : "text-stone-600"}`
          }
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

function ActiveLeaderboardPanel({
  activeSection,
  boards,
  reports,
  operators,
  mode,
}: {
  activeSection: LeaderboardSection;
  boards: Board[];
  reports: THCReport[];
  operators: OperatorRow[];
  mode: "clarity" | "dank";
}) {
  const selectedBoard = boards.find((board) => board.section === activeSection);
  const title = activeSection === "leaderboard" ? (mode === "dank" ? "Registry Main" : "Leaderboard") : activeSection === "operators" ? "Operators" : mode === "dank" ? selectedBoard?.dankTitle ?? "Registry Main" : selectedBoard?.title ?? "Leaderboard";
  const description = activeSection === "leaderboard"
    ? "All stored Automated Public Review artifacts ranked in one scrollable table."
    : activeSection === "operators"
      ? "Owner rollups across submitted public reports."
      : selectedBoard?.description ?? "Ranked THC review artifacts.";

  return (
    <section className={mode === "dank" ? "min-h-0 overflow-hidden border border-lime-300/35 bg-black/72 p-4" : "min-h-0 overflow-hidden rounded-sm border border-stone-300 bg-white/62 p-4"}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className={mode === "dank" ? "text-2xl font-black uppercase text-lime-300" : "font-serif text-3xl font-semibold"}>{title}</h2>
          <p className={mode === "dank" ? "mt-1 text-xs uppercase text-pink-300" : "mt-1 text-sm text-stone-600"}>{description}</p>
        </div>
        <span className={mode === "dank" ? "shrink-0 border border-pink-500/45 px-2 py-1 text-xs font-black text-pink-300" : "shrink-0 rounded-sm border border-stone-300 bg-white px-2 py-1 font-mono text-xs"}>
          {activeSection === "operators" ? operators.length : activeSection === "leaderboard" ? reports.length : selectedBoard?.reports.length ?? 0}
        </span>
      </div>
      <div className="mt-3 h-full overflow-auto">
        {activeSection === "operators" ? <OperatorsTable operators={operators} mode={mode} /> : <LeaderboardTable reports={activeSection === "leaderboard" ? reports : selectedBoard?.reports ?? []} mode={mode} showRank metric={selectedBoard?.metric} metricLabel={activeSection === "leaderboard" ? "Score" : "Metric"} />}
      </div>
    </section>
  );
}

function ReportsPanel({ title, description, reports, mode, compact = false }: { title: string; description: string; reports: THCReport[]; mode: "clarity" | "dank"; compact?: boolean }) {
  return (
    <section id={title.toLowerCase().replaceAll(" ", "-")} className={mode === "dank" ? "min-h-0 overflow-hidden border border-lime-300/35 bg-black/70 p-4" : "min-h-0 overflow-hidden rounded-sm border border-stone-300 bg-white/62 p-4"}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className={mode === "dank" ? "text-xl font-black uppercase text-lime-300" : "font-serif text-2xl font-semibold"}>{title}</h2>
          <p className={mode === "dank" ? "mt-1 text-xs uppercase text-pink-300" : "mt-1 text-sm text-stone-600"}>{description}</p>
        </div>
        <span className={mode === "dank" ? "shrink-0 border border-pink-500/45 px-2 py-1 text-xs font-black text-pink-300" : "shrink-0 rounded-sm border border-stone-300 bg-white px-2 py-1 font-mono text-xs"}>
          {reports.length}
        </span>
      </div>
      <div className="mt-3 max-h-full overflow-auto">
        {compact ? <CompactReportsList reports={reports} mode={mode} /> : <LeaderboardTable reports={reports} mode={mode} />}
      </div>
    </section>
  );
}

function CompactReportsList({ reports, mode }: { reports: THCReport[]; mode: "clarity" | "dank" }) {
  if (reports.length === 0) return <p className={mode === "dank" ? "text-sm text-lime-100/70" : "text-sm text-stone-600"}>No qualified reports yet.</p>;
  return (
    <div className="space-y-2">
      {reports.map((report) => {
        const meta = repositoryMeta(report);
        return (
          <article key={report.id} className={mode === "dank" ? "border border-lime-300/20 bg-black/55 p-2 text-xs text-lime-100" : "border border-stone-200 bg-white/75 p-2 text-xs text-stone-800"}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-2">
                <OwnerDankAvatar avatarUrl={meta.ownerAvatarUrl} owner={meta.owner ?? "unknown"} mode={mode} />
                <a className={mode === "dank" ? "min-w-0 truncate font-black text-cyan-300" : "min-w-0 truncate font-semibold text-blue-700"} href={meta.ownerUrl} rel="noreferrer" target="_blank">
                  {meta.owner}
                </a>
              </div>
              <span className="font-mono">{report.totalScore}</span>
            </div>
            <div className="mt-1 flex items-center justify-between gap-2">
              <a className={mode === "dank" ? "min-w-0 truncate font-black text-pink-300" : "min-w-0 truncate font-semibold text-blue-700"} href={meta.repoUrl} rel="noreferrer" target="_blank">
                {meta.repo}
              </a>
              <div className="flex shrink-0 items-center gap-2">
                <Link className={mode === "dank" ? "font-black uppercase text-lime-300" : "font-semibold text-emerald-700"} href={`/reports/${report.id}`}>Open</Link>
                <StarReportButton reportId={report.id} mode={mode} compact />
              </div>
            </div>
            <p className="mt-1 truncate opacity-70">{report.recommendedLevel}</p>
          </article>
        );
      })}
    </div>
  );
}

type OperatorRow = {
  owner: string;
  ownerUrl: string;
  ownerAvatarUrl?: string;
  reports: number;
  repos: number;
  averageScore: number;
  topScore: number;
  topRepo: string;
};

function leaderboardTableClass(mode: "clarity" | "dank", density: "base" | "compact" | "full") {
  const base = mode === "dank" ? "w-full table-fixed text-left text-xs text-lime-100" : "w-full table-fixed text-left text-sm text-stone-900";
  return density === "full" ? `${base} min-w-[920px]` : base;
}

function OperatorsPanel({ operators, mode }: { operators: OperatorRow[]; mode: "clarity" | "dank" }) {
  return (
    <section id="operators" className={mode === "dank" ? "min-h-0 overflow-hidden border border-lime-300/35 bg-black/70 p-4" : "min-h-0 overflow-hidden rounded-sm border border-stone-300 bg-white/62 p-4"}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className={mode === "dank" ? "text-xl font-black uppercase text-lime-300" : "font-serif text-2xl font-semibold"}>{mode === "dank" ? "Operators" : "Operators"}</h2>
          <p className={mode === "dank" ? "mt-1 text-xs uppercase text-pink-300" : "mt-1 text-sm text-stone-600"}>Repo-owner rollups across submitted public reports.</p>
        </div>
        <span className={mode === "dank" ? "shrink-0 border border-pink-500/45 px-2 py-1 text-xs font-black text-pink-300" : "shrink-0 rounded-sm border border-stone-300 bg-white px-2 py-1 font-mono text-xs"}>
          {operators.length}
        </span>
      </div>
      <div className="mt-3 max-h-full overflow-auto">
        <table className={leaderboardTableClass(mode, "compact")}>
          <thead className={mode === "dank" ? "border-b border-lime-300/30 text-lime-300" : "border-b border-stone-300 text-stone-500"}>
            <tr>
              <th className="py-2 pr-3">Operator</th>
              <th className="py-2 pr-3">Repos</th>
              <th className="py-2 pr-3">Avg</th>
              <th className="py-2">Top</th>
            </tr>
          </thead>
          <tbody>
            {operators.map((operator) => (
              <tr key={operator.owner} className={mode === "dank" ? "border-b border-lime-300/10 align-middle" : "border-b border-stone-200 align-middle"}>
                <td className="py-2 pr-3 align-middle">
                  <div className="flex min-w-0 items-center gap-2">
                    <OwnerDankAvatar avatarUrl={operator.ownerAvatarUrl} owner={operator.owner} mode={mode} />
                    <span className="min-w-0">
                      <a className={mode === "dank" ? "block truncate font-black text-cyan-300" : "block truncate font-semibold text-blue-700"} href={operator.ownerUrl} rel="noreferrer" target="_blank">{operator.owner}</a>
                      <span className="block truncate opacity-65">{operator.reports} reports</span>
                    </span>
                  </div>
                </td>
                <td className="py-2 pr-3 align-middle font-mono">{operator.repos}</td>
                <td className="py-2 pr-3 align-middle font-mono">{operator.averageScore}</td>
                <td className="py-2 align-middle">
                  <span className="block font-mono">{operator.topScore}</span>
                  <span className="block truncate opacity-65">{operator.topRepo}</span>
                </td>
              </tr>
            ))}
            {operators.length === 0 ? (
              <tr>
                <td className="py-4" colSpan={4}>No operators yet.</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function OperatorsTable({ operators, mode }: { operators: OperatorRow[]; mode: "clarity" | "dank" }) {
  return (
    <table className={leaderboardTableClass(mode, "full")}>
      <colgroup>
        <col className="w-[7%]" />
        <col className="w-[24%]" />
        <col className="w-[10%]" />
        <col className="w-[10%]" />
        <col className="w-[10%]" />
        <col className="w-[10%]" />
        <col className="w-[29%]" />
      </colgroup>
      <thead className={mode === "dank" ? "border-b border-lime-300/30 text-lime-300" : "border-b border-stone-300 text-stone-500"}>
        <tr>
          <th className="py-2 pr-3">#</th>
          <th className="py-2 pr-3">Operator</th>
          <th className="py-2 pr-3">Repos</th>
          <th className="py-2 pr-3">Reports</th>
          <th className="py-2 pr-3">Avg</th>
          <th className="py-2 pr-3">Top</th>
          <th className="py-2">Top Repo</th>
        </tr>
      </thead>
      <tbody>
        {operators.map((operator, index) => (
          <tr key={operator.owner} className={mode === "dank" ? "border-b border-lime-300/10 align-middle" : "border-b border-stone-200 align-middle"}>
            <td className="py-2 pr-3 font-mono">{index + 1}</td>
            <td className="py-2 pr-3 align-middle">
              <div className="flex min-w-0 items-center gap-2">
                <OwnerDankAvatar avatarUrl={operator.ownerAvatarUrl} owner={operator.owner} mode={mode} />
                <a className={mode === "dank" ? "block truncate font-black text-cyan-300" : "block truncate font-semibold text-blue-700"} href={operator.ownerUrl} rel="noreferrer" target="_blank">{operator.owner}</a>
              </div>
            </td>
            <td className="py-2 pr-3 align-middle font-mono">{operator.repos}</td>
            <td className="py-2 pr-3 align-middle font-mono">{operator.reports}</td>
            <td className="py-2 pr-3 align-middle font-mono">{operator.averageScore}</td>
            <td className="py-2 pr-3 align-middle font-mono">{operator.topScore}</td>
            <td className="py-2 align-middle"><span className="block truncate">{operator.topRepo}</span></td>
          </tr>
        ))}
        {operators.length === 0 ? (
          <tr>
            <td className="py-4" colSpan={7}>No operators yet.</td>
          </tr>
        ) : null}
      </tbody>
    </table>
  );
}

function LeaderboardTable({
  reports,
  mode,
  compact = false,
  showRank = false,
  metric,
  metricLabel = "Score",
}: {
  reports: THCReport[];
  mode: "clarity" | "dank";
  compact?: boolean;
  showRank?: boolean;
  metric?: (report: THCReport) => number;
  metricLabel?: string;
}) {
  const tableClass = leaderboardTableClass(mode, compact ? "compact" : "base");
  if (compact) {
    return (
      <table className={tableClass}>
        <colgroup>
          <col className="w-[25%]" />
          <col className="w-[28%]" />
          <col className="w-[27%]" />
          <col className="w-[20%]" />
        </colgroup>
        <thead className={mode === "dank" ? "border-b border-lime-300/30 text-lime-300" : "border-b border-stone-300 text-stone-500"}>
          <tr>
            <th className="py-2 pr-3">Owner</th>
            <th className="pr-3">Repository</th>
            <th className="pr-3">Level</th>
            <th>Score</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => <LeaderboardRow key={report.id} report={report} mode={mode} compact />)}
          {reports.length === 0 ? (
            <tr>
              <td className="py-4" colSpan={4}>No qualified reports yet.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    );
  }

  return (
    <table className={leaderboardTableClass(mode, "full")}>
      <colgroup>
        {showRank ? <col className="w-[7%]" /> : null}
        <col className="w-[18%]" />
        <col className="w-[24%]" />
        <col className="w-[8%]" />
        <col className="w-[19%]" />
        <col className="w-[8%]" />
        <col className="w-[12%]" />
        <col className="w-[24%]" />
      </colgroup>
      <thead className={mode === "dank" ? "border-b border-lime-300/30 text-lime-300" : "border-b border-stone-300 text-stone-500"}>
        <tr>
          {showRank ? <th className="py-2 pr-3">#</th> : null}
          <th className="py-2 pr-3">Owner</th>
          <th className="pr-3">Repository</th>
          <th className="pr-3">Stars</th>
          <th className="pr-3">THC Level</th>
          <th className="pr-3">{metricLabel}</th>
          <th className="pr-3">Generated</th>
          <th>Top Hidden-Trust Finding</th>
        </tr>
      </thead>
      <tbody>
        {reports.map((report, index) => <LeaderboardRow key={report.id} report={report} mode={mode} rank={showRank ? index + 1 : undefined} metric={metric} />)}
        {reports.length === 0 ? (
          <tr>
            <td className="py-4" colSpan={showRank ? 8 : 7}>No qualified reports yet.</td>
          </tr>
        ) : null}
      </tbody>
    </table>
  );
}

function LeaderboardRow({ report, mode, compact = false, rank, metric }: { report: THCReport; mode: "clarity" | "dank"; compact?: boolean; rank?: number; metric?: (report: THCReport) => number }) {
  const meta = repositoryMeta(report);
  if (compact) {
    return (
      <tr className={mode === "dank" ? "border-b border-lime-300/10 align-middle" : "border-b border-stone-200 align-middle"}>
        <td className="py-2 pr-3">
          <div className="flex min-w-0 items-center gap-2">
            <OwnerDankAvatar avatarUrl={meta.ownerAvatarUrl} owner={meta.owner ?? "unknown"} mode={mode} />
            <a className={mode === "dank" ? "block truncate font-black text-cyan-300" : "block truncate font-semibold text-blue-700"} href={meta.ownerUrl} rel="noreferrer" target="_blank">
              {meta.owner ?? "unknown"}
            </a>
          </div>
        </td>
        <td className="pr-3">
          <a className={mode === "dank" ? "block truncate font-black text-pink-300" : "block truncate font-semibold text-blue-700"} href={meta.repoUrl} rel="noreferrer" target="_blank">
            {meta.repo}
          </a>
        </td>
        <td className="pr-3"><span className="block truncate">{report.recommendedLevel}</span></td>
        <td className="align-middle">
          <div className="flex items-center gap-2 font-mono">
            <span>{report.totalScore}</span>
            <Link className={mode === "dank" ? "font-black uppercase text-lime-300" : "font-semibold text-emerald-700"} href={`/reports/${report.id}`}>
              Open
            </Link>
            <StarReportButton reportId={report.id} mode={mode} compact />
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className={mode === "dank" ? "border-b border-lime-300/10 align-middle" : "border-b border-stone-200 align-middle"}>
      {typeof rank === "number" ? <td className="py-2 pr-3 align-middle font-mono">{rank}</td> : null}
      <td className="py-2 pr-3 align-middle">
        <div className="flex min-w-0 items-center gap-2">
          <OwnerDankAvatar avatarUrl={meta.ownerAvatarUrl} owner={meta.owner ?? "unknown"} mode={mode} />
          <a className={mode === "dank" ? "truncate font-black text-cyan-300" : "truncate font-semibold text-blue-700"} href={meta.ownerUrl} rel="noreferrer" target="_blank">
            {meta.owner ?? "unknown"}
          </a>
        </div>
      </td>
      <td className="pr-3 align-middle">
        <a className={mode === "dank" ? "font-black text-pink-300" : "font-semibold text-blue-700"} href={meta.repoUrl} rel="noreferrer" target="_blank">
          {meta.repo}
        </a>
        {meta.description ? <p className="mt-1 truncate opacity-70">{meta.description}</p> : null}
      </td>
      <td className="pr-3 align-middle font-mono">{meta.stars.toLocaleString()}</td>
      <td className="pr-3 align-middle">{report.recommendedLevel}</td>
      <td className="pr-3 align-middle font-mono">{metric ? metric(report) : report.totalScore}</td>
      <td className="pr-3 align-middle">{new Date(report.generatedAt).toLocaleDateString()}</td>
      {!compact ? <td className="align-middle">
        <div className="flex items-center gap-2">
          <span className="truncate">{report.topHiddenTrustFinding}</span>
          <Link className={mode === "dank" ? "shrink-0 font-black uppercase text-lime-300" : "shrink-0 font-semibold text-emerald-700"} href={`/reports/${report.id}`}>Open</Link>
          <StarReportButton reportId={report.id} mode={mode} compact />
        </div>
      </td> : null}
    </tr>
  );
}

function DankNote({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="relative rotate-[-1deg] border border-lime-300/45 bg-black/75 p-3 text-xs leading-5 text-lime-100 shadow-[0_0_18px_rgba(190,242,100,0.12)] 2xl:text-sm">
      <span className="absolute -left-2 -top-2 h-5 w-12 rotate-[-18deg] bg-lime-300/45" />
      <span className="absolute -right-2 -top-2 h-5 w-12 rotate-[16deg] bg-stone-300/25" />
      <p className="mb-2 text-xs font-black uppercase tracking-widest text-lime-300">{title}</p>
      {children}
    </div>
  );
}

type Board = {
  section: LeaderboardSection;
  title: string;
  dankTitle: string;
  description: string;
  metric: (report: THCReport) => number;
  reports: THCReport[];
};

function buildBoards(reports: THCReport[]): Board[] {
  return [
    {
      section: "most-truthful",
      title: "Most Truthful",
      dankTitle: "Truth Lords",
      description: "Truth-only ranking from stored public review artifacts.",
      metric: (report: THCReport) => categoryScore(report, "Truth"),
      reports: rankBy(reports, (report) => categoryScore(report, "Truth")),
    },
    {
      section: "most-hardened",
      title: "Most Hardened",
      dankTitle: "Hardest Builds",
      description: "Hardening-only ranking from stored public review artifacts.",
      metric: (report: THCReport) => categoryScore(report, "Hardening"),
      reports: rankBy(reports, (report) => categoryScore(report, "Hardening")),
    },
    {
      section: "most-clarified",
      title: "Most Clarified",
      dankTitle: "Clarity Maxxing",
      description: "Clarity-only ranking from stored public review artifacts.",
      metric: (report: THCReport) => categoryScore(report, "Clarity"),
      reports: rankBy(reports, (report) => categoryScore(report, "Clarity")),
    },
    {
      section: "best-audit-history",
      title: "Best Audit History",
      dankTitle: "Receipts Archive",
      description: "Audit History-only ranking from stored public review artifacts.",
      metric: (report: THCReport) => categoryScore(report, "Audit History"),
      reports: rankBy(reports, (report) => categoryScore(report, "Audit History")),
    },
    {
      section: "highest-thc",
      title: "Highest THC",
      dankTitle: "Highest Potency",
      description: "Highest total THC score after deterministic caps and level mapping.",
      metric: (report: THCReport) => report.totalScore,
      reports: rankBy(reports, (report) => report.totalScore),
    },
  ];
}

function filterReportsByPeriod(reports: THCReport[], period: LeaderboardPeriod) {
  if (period === "all") return reports;
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  return reports.filter((report) => new Date(report.generatedAt).getTime() >= cutoff);
}

function buildOperators(reports: THCReport[]): OperatorRow[] {
  const byOwner = new Map<string, THCReport[]>();
  for (const report of reports) {
    const meta = repositoryMeta(report);
    const owner = meta.owner ?? "unknown";
    const current = byOwner.get(owner) ?? [];
    current.push(report);
    byOwner.set(owner, current);
  }

  return [...byOwner.entries()]
    .map(([owner, ownerReports]) => {
      const repos = new Set(ownerReports.map((report) => repositoryMeta(report).repo)).size;
      const top = [...ownerReports].sort((a, b) => b.totalScore - a.totalScore || b.generatedAt.localeCompare(a.generatedAt))[0];
      const total = ownerReports.reduce((sum, report) => sum + report.totalScore, 0);
      return {
        owner,
        ownerUrl: repositoryMeta(top).ownerUrl,
        ownerAvatarUrl: repositoryMeta(top).ownerAvatarUrl,
        reports: ownerReports.length,
        repos,
        averageScore: Math.round(total / ownerReports.length),
        topScore: top.totalScore,
        topRepo: repositoryMeta(top).repo,
      };
    })
    .sort((a, b) => b.averageScore - a.averageScore || b.topScore - a.topScore || b.repos - a.repos)
    .slice(0, 10);
}

function rankBy(reports: THCReport[], metric: (report: THCReport) => number) {
  return [...reports].sort((a, b) => metric(b) - metric(a) || b.generatedAt.localeCompare(a.generatedAt)).slice(0, 10);
}

function categoryScore(report: THCReport, category: string) {
  return report.evidenceTable.find((row) => row.category === category)?.score ?? 0;
}
