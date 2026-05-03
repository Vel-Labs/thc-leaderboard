"use client";

import Link from "next/link";
import { useState } from "react";
import type { THCReport } from "@/lib/thc/schema";
import { repositoryMeta } from "@/lib/ui/repository-meta";
import { CompactReviewForm } from "./compact-review-form";
import { GitHubSignInButton } from "./github-sign-in-button";
import { ModeToggle, useDisplayMode } from "./mode-shell";
import { PixelFace } from "./pixel-face";
import { ProfileTabLink } from "./profile-tab-link";
import { Disclaimer, PinnedNote } from "./reports/[id]/report-parts";

export type AboutSection = "desk" | "methodology" | "self-audit" | "evidence" | "trust-boundary" | "reports";
type Tone = "green" | "yellow" | "red" | "neutral";

const aboutSections: { section: AboutSection; label: string; dankLabel: string; note: string }[] = [
  { section: "desk", label: "Desk", dankLabel: "Desk", note: "Dashboard" },
  { section: "methodology", label: "Methodology", dankLabel: "Score Law", note: "Concepts" },
  { section: "self-audit", label: "Self-Audit", dankLabel: "Local Receipts", note: "Move up" },
  { section: "evidence", label: "Evidence Examples", dankLabel: "Receipt Types", note: "Good / weak" },
  { section: "trust-boundary", label: "Trust Boundary", dankLabel: "No Vibes", note: "Verify" },
  { section: "reports", label: "Reports", dankLabel: "Receipt Log", note: "Recent" },
];

export function AboutView({ reports, section = "desk" }: { reports: THCReport[]; section?: AboutSection }) {
  const { mode } = useDisplayMode();
  return mode === "dank" ? <DankAbout reports={reports} section={section} /> : <ClarityAbout reports={reports} section={section} />;
}

function ClarityAbout({ reports, section }: { reports: THCReport[]; section: AboutSection }) {
  const copy = sectionCopy(section, "clarity");
  return (
    <main className="flex min-h-screen w-full max-w-none flex-col gap-2 px-2 py-2 text-zinc-950 sm:px-3 lg:h-screen lg:min-h-0 lg:overflow-hidden">
      <AboutTopBar mode="clarity" />
      <div className="grid min-h-0 flex-1 gap-2 lg:grid-cols-[295px_minmax(0,1fr)] 2xl:grid-cols-[315px_minmax(0,1fr)]">
        <ClarityAboutSidebar active={section} />
        <section className="relative min-w-0 overflow-hidden rounded-sm border border-stone-300 bg-[#fbf7ec] shadow-[0_18px_55px_rgba(68,64,60,0.18)] lg:h-full">
          <div className="absolute inset-0 opacity-55 paper-grid" />
          <div className="relative grid min-h-0 gap-2 p-2 lg:h-full 2xl:grid-cols-[minmax(0,1fr)_270px]">
            <div className="grid min-h-0 gap-2 overflow-hidden lg:grid-rows-[auto_minmax(0,1fr)]">
              <AboutHeader mode="clarity" kicker={copy.kicker} title={copy.title} body={copy.body} />
              <section className="min-h-0 overflow-hidden">
                <AboutSectionContent section={section} reports={reports} mode="clarity" />
              </section>
            </div>
            <AboutRightRail mode="clarity" section={section} />
          </div>
        </section>
      </div>
      <Disclaimer mode="clarity" />
    </main>
  );
}

function DankAbout({ reports, section }: { reports: THCReport[]; section: AboutSection }) {
  const copy = sectionCopy(section, "dank");
  return (
    <main className="flex min-h-screen w-full max-w-none flex-col gap-2 px-2 py-2 font-mono text-lime-100 sm:px-3 lg:h-screen lg:min-h-0 lg:overflow-hidden">
      <AboutTopBar mode="dank" />
      <div className="grid min-h-0 flex-1 gap-2 lg:grid-cols-[295px_minmax(0,1fr)] 2xl:grid-cols-[315px_minmax(0,1fr)]">
        <DankAboutSidebar active={section} />
        <section className="relative min-w-0 overflow-hidden border border-lime-300/40 bg-black/80 p-2 shadow-[0_0_38px_rgba(190,242,100,0.16)] lg:h-full">
          <div className="absolute inset-0 dank-noise opacity-70" />
          <div className="relative grid min-h-0 gap-2 lg:h-full 2xl:grid-cols-[minmax(0,1fr)_275px]">
            <div className="grid min-h-0 gap-2 overflow-hidden lg:grid-rows-[auto_minmax(0,1fr)]">
              <AboutHeader mode="dank" kicker={copy.kicker} title={copy.title} body={copy.body} />
              <section className="min-h-0 overflow-hidden">
                <AboutSectionContent section={section} reports={reports} mode="dank" />
              </section>
            </div>
            <AboutRightRail mode="dank" section={section} />
          </div>
        </section>
      </div>
      <Disclaimer mode="dank" />
    </main>
  );
}

function sectionCopy(section: AboutSection, mode: "clarity" | "dank") {
  const clarity: Record<AboutSection, { kicker: string; title: string; body: string }> = {
    desk: {
      kicker: "About folder page",
      title: "Review Desk",
      body: "A compact dashboard for how the app reviews public repositories, what THC measures, and what recent reports look like.",
    },
    methodology: {
      kicker: "Methodology folder page",
      title: "THC Methodology",
      body: "Truth, Hardening, and Clarity are evidence categories. The public level is computed from score, then constrained by deterministic caps.",
    },
    "self-audit": {
      kicker: "Self-audit folder page",
      title: "Local THC Check",
      body: "Run the methodology locally to create handoff artifacts. The public grader can use them as evidence pointers, but still verifies independently.",
    },
    evidence: {
      kicker: "Evidence folder page",
      title: "Evidence Examples",
      body: "Examples of what earns credit, what stays neutral, and what becomes hidden trust when claims outrun public evidence.",
    },
    "trust-boundary": {
      kicker: "Boundary folder page",
      title: "Trust Boundary",
      body: "The app can use AI review providers and local artifacts, but deterministic code owns score, caps, labels, and disclaimers.",
    },
    reports: {
      kicker: "Reports folder page",
      title: "Recent Reports",
      body: "A compact log of recent public review artifacts. Each report preserves commit SHA, timestamp, score, evidence, caps, and findings.",
    },
  };
  const dank: typeof clarity = {
    desk: { kicker: "Desk // public repo scanner", title: "Review Desk", body: "Repo goes in. Receipts, caps, score nerfs, and a shareable report come out. Vibes are decorative." },
    methodology: { kicker: "Score law // no lore", title: "THC Score Law", body: "Truth, Hardening, Clarity, and Audit History. Same rules, louder pixels." },
    "self-audit": { kicker: "Local receipts // prep mode", title: "Self-Audit", body: "Generate docs/thc receipts locally, then let the public grader verify without trusting your homework." },
    evidence: { kicker: "Receipts // examples", title: "Receipt Types", body: "What cooks, what gets capped, and what gets flagged as sus." },
    "trust-boundary": { kicker: "No vibes // verify", title: "Trust Boundary", body: "AI review can explain. App code scores. Local artifacts are maps, not truth." },
    reports: { kicker: "Receipt log // public artifacts", title: "Recent Reports", body: "The latest cooked reports, tied to commit SHA and timestamp." },
  };
  return mode === "dank" ? dank[section] : clarity[section];
}

function AboutTopBar({ mode }: { mode: "clarity" | "dank" }) {
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
          <div className="hidden h-5 overflow-hidden text-[10px] uppercase tracking-[0.5em] text-pink-500/45 lg:block">☠ ▓▒░ about // audit // leaderboard ░▒▓</div>
          <div className="flex flex-nowrap items-center justify-end gap-2"><GitHubSignInButton mode="dank" /><ModeToggle /><PixelFace small /></div>
        </div>
        <div className="mt-2"><CompactReviewForm /></div>
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
        <div className="flex flex-wrap justify-end gap-2 pr-9 md:pr-10 lg:pr-11"><GitHubSignInButton mode="clarity" /><ModeToggle /></div>
      </div>
      <div className="mt-3"><CompactReviewForm /></div>
    </header>
  );
}

function AboutHeader({ mode, kicker, title, body }: { mode: "clarity" | "dank"; kicker: string; title: string; body: string }) {
  if (mode === "dank") {
    return (
      <section className="relative border-b border-pink-500/45 pb-3">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-pink-400">{kicker}</p>
        <h1 className="mt-1 text-[clamp(2.1rem,3.8vw,4.4rem)] font-black uppercase leading-none text-lime-300">{title}</h1>
        <p className="mt-3 max-w-4xl text-sm leading-6 text-lime-100/75">{body}</p>
        <div className="absolute right-5 top-2 hidden rotate-[-2deg] border-2 border-pink-500 bg-black/80 p-3 text-center text-lg font-black uppercase text-pink-400 shadow-[0_0_20px_rgba(236,72,153,0.35)] 2xl:block">
          Automated<br />Public Review
        </div>
      </section>
    );
  }

  return (
    <section className="relative border-b border-stone-300 pb-3">
      <p className="font-serif text-sm italic text-stone-500">{kicker}</p>
      <h1 className="mt-1 font-serif text-[clamp(2.3rem,4vw,4.6rem)] font-semibold leading-none tracking-tight">{title}</h1>
      <p className="mt-3 max-w-4xl text-sm leading-6 text-stone-700">{body}</p>
      <div className="absolute right-5 top-2 hidden rotate-[-2deg] border border-amber-200 bg-amber-100 px-4 py-3 font-serif text-base shadow-[8px_10px_20px_rgba(68,64,60,0.18)] md:block">
        Automated<br />Public Review
      </div>
    </section>
  );
}

function ClarityAboutSidebar({ active }: { active: AboutSection }) {
  return (
    <aside className="relative hidden overflow-hidden rounded-sm border border-stone-300 bg-[#efe4cd] p-3 shadow-[8px_12px_22px_rgba(68,64,60,0.16)] before:absolute before:-right-2 before:top-7 before:h-[calc(100%-54px)] before:w-3 before:rounded-r before:border before:border-l-0 before:border-stone-300 before:bg-[#e7dcc5] after:absolute after:-right-1 after:top-12 after:h-[calc(100%-92px)] after:w-2 after:rounded-r after:bg-[#d9ccb4] lg:block lg:h-full">
      <div className="absolute left-4 top-2 z-20 flex items-end gap-1.5">
        <FolderTab href="/" label="About" active width="w-[52px]" />
        <FolderTab href="/audit" label="Audit" width="w-[48px]" />
        <FolderTab href="/leaderboard" label="Leaderboard" width="w-[90px]" />
        <ProfileTabLink mode="clarity" width="w-[60px]" />
      </div>
      <p className="relative mb-2 mt-8 flex items-center gap-2 text-xs uppercase tracking-widest text-stone-500"><span className="text-lg leading-none">□</span>About Folder</p>
      <div className="relative mb-4 border-b border-stone-300 pb-3 pl-1 text-xs font-semibold text-stone-700">thc-leaderboard</div>
      <nav className="relative space-y-1 text-sm">
        {aboutSections.map((item) => (
          <Link key={item.section} href={aboutHref(item.section)} className={`block rounded-sm border px-3 py-2 ${item.section === active ? "border-emerald-400 bg-emerald-50/95 text-emerald-950" : "border-transparent border-b-stone-300/75 text-stone-700 hover:bg-white/45"}`}>
            <span className="block truncate">{item.label}</span>
            <span className="block truncate text-[10px] text-stone-500">{item.note}</span>
          </Link>
        ))}
      </nav>
      <div className="absolute bottom-3 left-3 right-3 rounded-sm border border-stone-200 bg-white p-3 font-serif text-xs italic leading-5 text-stone-700 shadow-[6px_8px_16px_rgba(68,64,60,0.12)]">
        Public review registry. Local artifacts are input, not truth.
      </div>
    </aside>
  );
}

function DankAboutSidebar({ active }: { active: AboutSection }) {
  return (
    <aside className="relative hidden overflow-hidden border border-lime-300/35 bg-black/75 p-3 shadow-[0_0_22px_rgba(190,242,100,0.1)] lg:block lg:h-full">
      <div className="mb-3 grid grid-cols-[0.7fr_0.7fr_1.25fr_0.85fr] gap-2 text-[10px] font-black uppercase tracking-wide">
        <Link href="/" className="border border-cyan-300 bg-cyan-300/15 px-2 py-1.5 text-cyan-100">About</Link>
        <Link href="/audit" className="border border-lime-300/25 px-2 py-1.5 text-lime-300/55">Audit</Link>
        <Link href="/leaderboard" className="border border-pink-500/25 px-2 py-1.5 text-pink-300/55">Leaderboard</Link>
        <ProfileTabLink mode="dank" variant="dank-grid" />
      </div>
      <p className="mb-3 text-xs uppercase tracking-widest text-lime-300">About Folder //</p>
      <nav className="space-y-1.5 text-xs font-black uppercase 2xl:text-sm">
        {aboutSections.map((item) => (
          <Link key={item.section} href={aboutHref(item.section)} className={`block border px-3 py-1.5 ${item.section === active ? "border-lime-300 bg-lime-300/18 text-lime-100" : "border-transparent text-lime-300/75"}`}>
            <span className="block truncate">{item.dankLabel}</span>
            <span className="block truncate text-[10px] text-pink-300/70">{item.note}</span>
          </Link>
        ))}
      </nav>
      <div className="mt-5 border border-lime-300/35 bg-lime-300/10 p-3 text-xs leading-5 text-lime-100">Same scoring. Different chaos layer.</div>
    </aside>
  );
}

function aboutHref(section: AboutSection) {
  return section === "desk" ? "/" : `/about/${section}`;
}

function FolderTab({ href, label, active = false, width }: { href: string; label: string; active?: boolean; width: string }) {
  return (
    <Link href={href} className={`relative h-8 ${width} rounded-t-sm border border-b-0 px-2 pt-1.5 text-center text-[10px] font-semibold uppercase tracking-wide shadow-[3px_-2px_8px_rgba(68,64,60,0.08)] ${active ? "border-emerald-700/70 bg-[#fbf3df] text-emerald-900" : "border-stone-300 bg-[#e4d7bd] text-stone-500"}`}>
      <span className={`absolute -right-3 bottom-[-1px] h-[calc(100%+1px)] w-5 skew-x-[16deg] rounded-tr-sm border border-b-0 border-l-0 ${active ? "border-emerald-700/70 bg-[#fbf3df]" : "border-stone-300 bg-[#e4d7bd]"}`} />
      <span className="relative">{label}</span>
    </Link>
  );
}

function AboutSectionContent({ section, reports, mode }: { section: AboutSection; reports: THCReport[]; mode: "clarity" | "dank" }) {
  if (section === "methodology") return <MethodologyPage mode={mode} />;
  if (section === "self-audit") return <SelfAuditPage mode={mode} />;
  if (section === "evidence") return <EvidenceExamplesPage mode={mode} />;
  if (section === "trust-boundary") return <TrustBoundaryPage mode={mode} />;
  if (section === "reports") return <ReportsPage reports={reports} mode={mode} />;
  return <DeskPage reports={reports} mode={mode} />;
}

function DeskPage({ reports, mode }: { reports: THCReport[]; mode: "clarity" | "dank" }) {
  return (
    <div className="grid min-h-0 gap-2 overflow-hidden lg:grid-rows-[auto_minmax(0,1fr)]">
      <div className={mode === "dank" ? "grid gap-2 sm:grid-cols-4" : "grid border border-stone-300 bg-white/55 sm:grid-cols-4"}>
        <ProcessTile mode={mode} label="Input" value={mode === "dank" ? "Repo URL" : "GitHub URL"} sub="public repository root only" />
        <ProcessTile mode={mode} label="Review State" value="Commit SHA" sub="resolved before scoring" />
        <ProcessTile mode={mode} label="Reasoning" value="AI Review" sub="bounded evidence notes" />
        <ProcessTile mode={mode} label="Authority" value="Code" sub="score, caps, label" />
      </div>
      <div className="grid min-h-0 gap-2 overflow-hidden xl:grid-cols-[300px_minmax(0,1fr)] 2xl:grid-cols-[320px_minmax(0,1fr)]">
        <ReviewFlow mode={mode} />
        <section className="grid min-h-0 content-start gap-2 overflow-hidden">
          <RecentReportsPreview reports={reports} mode={mode} />
          <MethodologySummary mode={mode} />
          <section className={panelClass(mode)}>
            <h2 className={headingClass(mode)}>{mode === "dank" ? "Score Signals //" : "Score Signals"}</h2>
            <div className="mt-3 grid gap-2 sm:grid-cols-4">
              <DeskSignalCard mode={mode} title="Strong" body="Public setup, checks, CI, docs, decisions, current THC provenance." tone="green" />
              <DeskSignalCard mode={mode} title="Needs work" body="Claims exist, but freshness, commands, or handoff are incomplete." tone="yellow" />
              <DeskSignalCard mode={mode} title="Absent" body="No public evidence path, private-only proof, or unverifiable claims." tone="red" />
              <DeskSignalCard mode={mode} title="Neutral" body="Stars, popularity, and polish are display context only." tone="neutral" />
            </div>
          </section>
        </section>
      </div>
    </div>
  );
}

function ProcessTile({ mode, label, value, sub }: { mode: "clarity" | "dank"; label: string; value: string; sub: string }) {
  return (
    <article className={mode === "dank" ? "border border-pink-500/40 bg-black/70 p-4" : "border-r border-stone-300 p-4 last:border-r-0"}>
      <p className={mode === "dank" ? "text-xs font-black uppercase tracking-wide text-pink-300" : "text-xs uppercase tracking-wide text-stone-500"}>{label}</p>
      <p className={mode === "dank" ? "mt-2 text-2xl font-black uppercase text-lime-300" : "mt-2 font-serif text-2xl font-semibold text-emerald-800"}>{value}</p>
      <p className={mode === "dank" ? "mt-1 text-xs uppercase text-lime-100/65" : "mt-1 text-xs text-stone-600"}>{sub}</p>
    </article>
  );
}

function ReviewFlow({ mode }: { mode: "clarity" | "dank" }) {
  const rows = mode === "dank"
    ? [["01", "Gate URL", "public github root or bounce"], ["02", "Grab Receipts", "files only, no install script jump scares"], ["03", "Ask AI Review", "bounded notes, no score lawmaking"], ["04", "Apply Nerfs", "deterministic caps and level mapping"]]
    : [["1", "Validate URL", "Only public GitHub repository roots are accepted."], ["2", "Inspect Files", "README, package/build files, docs, tests, CI, changelog, agent instructions, docs/thc artifacts."], ["3", "Generate Notes", "Configured AI review receives bounded evidence context for section analysis only."], ["4", "Apply THC Rules", "Scorecard totals and level caps are computed deterministically after evidence review."]];
  return (
    <section className={mode === "dank" ? "border border-lime-300/35 bg-black/70 p-3" : "rounded-sm border border-stone-300 bg-white/60 p-3"}>
      <h2 className={mode === "dank" ? "text-xl font-black uppercase text-lime-300" : "font-serif text-2xl font-semibold"}>{mode === "dank" ? "Review Flow //" : "Review Flow"}</h2>
      <div className={mode === "dank" ? "mt-3 divide-y divide-lime-300/15 border border-pink-500/35 text-xs uppercase" : "mt-3 divide-y divide-stone-200 border border-stone-200 bg-white/65 text-sm"}>
        {rows.map(([step, title, body]) => (
          <div key={step} className="grid gap-2 px-3 py-1.5 md:grid-cols-[34px_minmax(0,1fr)]">
            <span className={mode === "dank" ? "font-mono text-pink-300" : "font-mono text-stone-500"}>{step}</span>
            <span className="min-w-0">
              <span className={mode === "dank" ? "block font-black text-lime-300" : "block font-semibold text-stone-900"}>{title}</span>
              <span className={mode === "dank" ? "mt-0.5 block leading-5 text-lime-100/75" : "mt-0.5 block leading-5 text-stone-700"}>{body}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function MethodologyPage({ mode }: { mode: "clarity" | "dank" }) {
  const categories = [
    ["Truth", "30", "Explicit claims, public source of truth, boundaries, assumptions, and evidence trail.", "green"],
    ["Hardening", "35", "Validation commands, tests, CI, failure modes, environment notes, and guardrails.", "green"],
    ["Clarity", "25", "Fresh-clone setup, contributor guidance, operator docs, recovery notes, and navigation.", "yellow"],
    ["Audit History", "10", "Changelog, decisions, known risks, uncertainty, and prior review trail.", "yellow"],
  ];
  const levelBands = [
    ["THC-0", "Unverified", "Insufficient public evidence or major trust gaps remain.", "red"],
    ["THC-1", "Documented", "The repo explains itself, but hardening evidence may still be thin.", "yellow"],
    ["THC-2", "Hardened", "Validation and operational guardrails are visible enough to score.", "yellow"],
    ["THC-3", "Inspectable", "A reviewer can follow the repo, evidence, and decisions from public state.", "green"],
    ["THC-4", "Reproducible", "Setup and checks are strong enough for repeatable public review.", "green"],
    ["THC-5", "High-THC", "High score plus no unresolved cap blockers under the methodology.", "green"],
  ];
  const caps = [
    ["Missing setup path", "Caps level because reviewers cannot reproduce basic orientation.", "red"],
    ["No visible validation", "Caps level when tests/CI/commands are absent or unverifiable.", "red"],
    ["Stale local artifacts", "Local THC files point at a different revision than public review.", "yellow"],
    ["Private-only proof", "Private dashboards or maintainer memory cannot earn public score credit.", "yellow"],
  ];
  return (
    <div className="grid min-h-0 gap-2 overflow-hidden xl:grid-cols-[minmax(0,1fr)_340px]">
      <section className={panelClass(mode)}>
        <h2 className={headingClass(mode)}>Scorecard</h2>
        <ScorecardGroup mode={mode} title="1. Score Categories" subtitle="The base score is built from four documented evidence categories.">
          <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
            {categories.map(([name, points, body, tone]) => (
              <InfoCard key={name} mode={mode} title={`${name} / ${points}`} body={body} tone={tone as Tone} />
            ))}
          </div>
        </ScorecardGroup>
        <ScorecardGroup mode={mode} title="2. Level Mapping" subtitle="The score maps to a THC level before cap logic is applied.">
          <div className="grid gap-2 md:grid-cols-3">
            {levelBands.map(([level, title, body, tone]) => <InfoCard key={level} mode={mode} title={`${level} ${title}`} body={body} tone={tone as Tone} />)}
          </div>
        </ScorecardGroup>
        <ScorecardGroup mode={mode} title="3. Cap Checks" subtitle="Caps lower the recommended level when evidence is missing, stale, private, or unverifiable.">
          <div className="grid gap-2 md:grid-cols-4">
            {caps.map(([title, body, tone]) => <InfoCard key={title} mode={mode} title={title} body={body} tone={tone as Tone} />)}
          </div>
        </ScorecardGroup>
      </section>
      <section className="grid content-start gap-2">
        <StatusLegend mode={mode} />
        <Expandable mode={mode} title="Score is not certification" tone="red">Reports are review artifacts only. They are not security approval, production readiness, endorsement, or a reliability guarantee.</Expandable>
        <Expandable mode={mode} title="Caps are deterministic" tone="yellow">Missing setup, missing validation, stale artifacts, or unverifiable claims can cap the public level after scoring.</Expandable>
        <Expandable mode={mode} title="Popularity does not count" tone="red">Stars, maintainer reputation, package size, polish, or brand awareness do not increase THC score.</Expandable>
        <Expandable mode={mode} title="Strong public evidence compounds" tone="green">The best reports show a clean trail from claim, to file, to command, to decision history, all at the reviewed commit.</Expandable>
      </section>
    </div>
  );
}

function SelfAuditPage({ mode }: { mode: "clarity" | "dank" }) {
  return (
    <div className="grid min-h-0 gap-2 overflow-hidden xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className={panelClass(mode)}>
        <LocalAuditGuide mode={mode} />
      </section>
      <section className="grid content-start gap-2">
        <InfoCard mode={mode} title="Good handoff" body="docs/thc files are present, current, provenance-backed, and committed to the public repository." tone="green" />
        <InfoCard mode={mode} title="Needs improvement" body="Local artifacts exist, but the reviewed revision, hash, or command evidence cannot be fully verified." tone="yellow" />
        <InfoCard mode={mode} title="Absent handoff" body="No docs/thc artifacts were found. The public grader uses repository files directly and flags the absence." tone="red" />
        <Expandable mode={mode} title="Why this helps the leaderboard" tone="green">Local checks do not grant trust. They reduce ambiguity by pointing public review toward concrete evidence that can be independently verified.</Expandable>
      </section>
    </div>
  );
}

function EvidenceExamplesPage({ mode }: { mode: "clarity" | "dank" }) {
  const strong = [
    ["Strong evidence", "Fresh-clone setup, deterministic validation commands, CI, decision history, and current docs/thc provenance tied to the reviewed commit.", "green"],
    ["Strong hardening", "Tests or checks are named, runnable, documented, and connected to CI or an equivalent repeatable validation path.", "green"],
  ];
  const partial = [
    ["Partial evidence", "A useful README or architecture note exists, but validation commands, freshness, or operational handoff are incomplete.", "yellow"],
    ["Needs improvement", "Evidence exists but is scattered, stale, inconsistent, or requires guessing across unrelated files.", "yellow"],
    ["Stale evidence", "Local artifacts or docs reference a different revision than the reviewed public commit.", "yellow"],
  ];
  const missing = [
    ["Missing evidence", "Claims of reliability, safety, or production readiness appear without inspectable public files.", "red"],
    ["Private evidence", "Maintainer knowledge, private dashboards, private tests, or closed docs. Useful internally, but not public score evidence.", "red"],
    ["Hidden trust", "Any place the reader must trust reputation or vibes because public evidence does not close the loop.", "red"],
  ];
  return (
    <section className={panelClass(mode)}>
      <EvidenceExampleGroup mode={mode} title="Strong Evidence" items={strong} />
      <EvidenceExampleGroup mode={mode} title="Partial / Needs Improvement" items={partial} />
      <EvidenceExampleGroup mode={mode} title="Missing / No Public Credit" items={missing} />
    </section>
  );
}

function TrustBoundaryPage({ mode }: { mode: "clarity" | "dank" }) {
  const reasoning = [
    ["AI review adapters", "Configured providers can draft bounded section notes. They do not define levels, change score law, or override caps.", "yellow"],
    ["Local THC artifacts", "Can speed evidence discovery. They are input hints, not public truth.", "yellow"],
    ["Public commit SHA", "Every report is tied to the reviewed public revision so future re-reviews can be compared honestly.", "green"],
  ];
  const identity = [
    ["GitHub login", "Can identify a submitter. It does not automatically prove repository ownership or quality.", "yellow"],
    ["App stars and feedback", "Product signals only. They never affect THC score or level.", "green"],
  ];
  const infrastructure = [
    ["Workers", "Future sandbox workers may run safe checks, but the app server should not execute arbitrary repo code.", "red"],
    ["Supabase", "Registry and queue substrate. Database rows preserve artifacts; they do not become methodology truth.", "green"],
    ["Private access", "Private repos, private tests, secrets, and unpublished dashboards are excluded from v1 scoring.", "red"],
  ];
  return (
    <section className={panelClass(mode)}>
      <EvidenceExampleGroup mode={mode} title="Review Reasoning Boundary" items={reasoning} card="info" />
      <EvidenceExampleGroup mode={mode} title="Identity And Community Signals" items={identity} card="info" />
      <EvidenceExampleGroup mode={mode} title="Infrastructure And Exclusions" items={infrastructure} card="info" />
    </section>
  );
}

function ReportsPage({ reports, mode }: { reports: THCReport[]; mode: "clarity" | "dank" }) {
  return (
    <section className={panelClass(mode)}>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {reports.slice(0, 12).map((report) => <ReportCard key={report.id} report={report} mode={mode} />)}
        {reports.length === 0 ? <p className={mode === "dank" ? "text-lime-100/70" : "text-stone-600"}>No reports yet. Submit a public GitHub repository to create the first entry.</p> : null}
      </div>
    </section>
  );
}

function ScorecardGroup({ mode, title, subtitle, children }: { mode: "clarity" | "dank"; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <section className={mode === "dank" ? "mt-3 border border-cyan-300/25 bg-black/35 p-3" : "mt-3 border border-stone-200 bg-white/45 p-3"}>
      <div className="mb-3 flex items-end justify-between gap-3 border-b border-current/15 pb-2">
        <div>
          <h3 className={mode === "dank" ? "text-sm font-black uppercase tracking-wide text-cyan-200" : "text-sm font-semibold uppercase tracking-wide text-stone-700"}>{title}</h3>
          <p className={mode === "dank" ? "mt-1 text-xs uppercase text-lime-100/65" : "mt-1 text-xs text-stone-500"}>{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function EvidenceExampleGroup({
  mode,
  title,
  items,
  card = "expandable",
}: {
  mode: "clarity" | "dank";
  title: string;
  items: string[][];
  card?: "expandable" | "info";
}) {
  return (
    <section className={mode === "dank" ? "mb-3 border border-cyan-300/25 bg-black/35 p-3" : "mb-3 border border-stone-200 bg-white/45 p-3"}>
      <h3 className={mode === "dank" ? "mb-3 text-sm font-black uppercase tracking-wide text-cyan-200" : "mb-3 text-sm font-semibold uppercase tracking-wide text-stone-700"}>{title}</h3>
      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
        {items.map(([itemTitle, body, tone]) =>
          card === "info" ? (
            <InfoCard key={itemTitle} mode={mode} title={itemTitle} body={body} tone={tone as Tone} />
          ) : (
            <Expandable key={itemTitle} mode={mode} title={itemTitle} tone={tone as Tone} defaultOpen>
              {body}
            </Expandable>
          ),
        )}
      </div>
    </section>
  );
}

function MethodologySummary({ mode }: { mode: "clarity" | "dank" }) {
  const rows = [["Truth", "30"], ["Hardening", "35"], ["Clarity", "25"], ["Audit History", "10"]];
  return (
    <section id="methodology" className={panelClass(mode)}>
      <h2 className={headingClass(mode)}>{mode === "dank" ? "Score Law //" : "THC Methodology"}</h2>
      <p className={mode === "dank" ? "mt-2 text-xs uppercase leading-5 text-lime-100/70" : "mt-2 text-xs leading-5 text-stone-600"}>Truth, Hardening, and Clarity are scored from public evidence. Levels are mapped from score, then deterministic caps can lower the recommendation.</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-4">
        {rows.map(([name, points]) => (
          <div key={name} className={mode === "dank" ? "border border-lime-300/25 bg-black/50 p-2 text-xs text-lime-100" : "border border-stone-200 bg-white/70 p-2 text-xs text-stone-700"}>
            <span className={mode === "dank" ? "block font-black uppercase text-lime-300" : "block font-semibold text-stone-900"}>{name}</span>
            <span className="mt-1 block font-mono">{points} pts</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function DeskSignalCard({ mode, title, body, tone }: { mode: "clarity" | "dank"; title: string; body: string; tone: Tone }) {
  return (
    <article className={`${semanticCardClass(mode, tone)} p-2 text-xs`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className={mode === "dank" ? "font-black uppercase" : "font-semibold"}>{title}</h3>
        <span className={badgeClass(mode, tone)}>{toneLabel(tone)}</span>
      </div>
      <p className={mode === "dank" ? "mt-1 line-clamp-2 leading-4 text-lime-100/75" : "mt-1 line-clamp-2 leading-4 text-stone-600"}>{body}</p>
    </article>
  );
}

function LocalAuditGuide({ mode }: { mode: "clarity" | "dank" }) {
  const steps = [
    ["Clean Worktree", "Commit or stash unrelated changes before generating local artifacts."],
    ["Run THC_Check", "Use the methodology skill to generate the local check and provenance file."],
    ["Commit Artifacts", "Commit docs/thc/* so public graders can inspect the handoff."],
  ];
  return (
    <>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className={headingClass(mode)}>{mode === "dank" ? "Climb the Board //" : "Move Up the Public Leaderboard"}</h2>
          <p className={mode === "dank" ? "mt-2 text-sm leading-6 text-lime-100/75" : "mt-2 text-sm leading-6 text-stone-700"}>
            Run a local THC check before public review. It should create <span className="font-mono">docs/thc/README.md</span>, <span className="font-mono">docs/thc/LOCAL_CHECK.md</span>, and <span className="font-mono">docs/thc/LOCAL_CHECK.provenance.json</span>.
          </p>
        </div>
        <a className={mode === "dank" ? "shrink-0 border border-pink-500 bg-pink-500/15 px-3 py-2 text-xs font-black uppercase text-pink-200" : "shrink-0 rounded-sm border border-emerald-300 bg-emerald-50 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-800"} href="https://github.com/Vel-Labs/thc-methodology" rel="noreferrer" target="_blank">
          Methodology Repo
        </a>
      </div>
      <div className="mt-3 grid gap-2 text-xs md:grid-cols-3">
        {steps.map(([title, body], index) => <InfoCard key={title} mode={mode} title={`${index + 1}. ${title}`} body={body} />)}
      </div>
      <AgentPromptCard mode={mode} />
    </>
  );
}

const localAuditPrompt = `Review this repository locally using the THC methodology.

Use the public methodology repo as the source of truth:
https://github.com/Vel-Labs/thc-methodology

Run the local THC check workflow for this repo. Treat the output as a preparation artifact, not certification.

Goals:
- Inspect the current repo state from a clean worktree.
- Generate docs/thc/README.md.
- Generate docs/thc/LOCAL_CHECK.md.
- Generate docs/thc/LOCAL_CHECK.provenance.json.
- Record the reviewed commit SHA, worktree status, relevant command evidence, and artifact provenance.
- Do not claim Vel Labs certification, security approval, production readiness, or guaranteed reliability.

After the local artifacts are generated, commit docs/thc/* so a public THC Leaderboard review can independently verify them against the public repository state.`;

function AgentPromptCard({ mode }: { mode: "clarity" | "dank" }) {
  const [copied, setCopied] = useState(false);
  async function copyPrompt() {
    await navigator.clipboard.writeText(localAuditPrompt);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }
  return (
    <div className={mode === "dank" ? "mt-3 border border-pink-500/45 bg-black/75 p-3" : "mt-3 border border-stone-300 bg-white/75 p-3"}>
      <div className="flex items-center justify-between gap-3">
        <p className={mode === "dank" ? "text-xs font-black uppercase tracking-widest text-pink-300" : "text-xs font-semibold uppercase tracking-wide text-stone-600"}>
          {mode === "dank" ? "Tell your agent to run local receipts" : "Tell your agent to review your repo locally"}
        </p>
        <button type="button" onClick={copyPrompt} className={mode === "dank" ? "shrink-0 border border-lime-300 bg-lime-300/15 px-3 py-1.5 text-xs font-black uppercase text-lime-200" : "shrink-0 rounded-sm border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-800"}>
          {copied ? "Copied" : "Copy Prompt"}
        </button>
      </div>
      <pre className={mode === "dank" ? "mt-3 max-h-40 overflow-auto whitespace-pre-wrap border border-lime-300/20 bg-black/70 p-3 text-[11px] leading-5 text-lime-100/75" : "mt-3 max-h-40 overflow-auto whitespace-pre-wrap border border-stone-200 bg-[#fbf7ec] p-3 font-mono text-[11px] leading-5 text-stone-700"}>{localAuditPrompt}</pre>
    </div>
  );
}

function RecentReportsPreview({ reports, mode }: { reports: THCReport[]; mode: "clarity" | "dank" }) {
  const recent = reports.slice(0, 4);
  return (
    <section className={mode === "dank" ? "min-h-0 border border-lime-300/35 bg-black/70 p-4" : "min-h-0 rounded-sm border border-stone-300 bg-white/60 p-4"}>
      <div className="flex items-center justify-between gap-3">
        <h2 className={mode === "dank" ? "text-lg font-black uppercase text-lime-300" : "font-serif text-xl font-semibold"}>{mode === "dank" ? "Recent Receipts" : "Recent Reports"}</h2>
        <Link className={mode === "dank" ? "text-xs font-black uppercase text-pink-300" : "text-xs font-semibold uppercase tracking-wide text-emerald-700"} href="/leaderboard">All</Link>
      </div>
      <div className="mt-3 space-y-2 text-xs">
        {recent.map((report) => <RecentPreviewRow key={report.id} report={report} mode={mode} />)}
        {recent.length === 0 ? <p className={mode === "dank" ? "text-lime-100/65" : "text-stone-600"}>No reports yet.</p> : null}
      </div>
    </section>
  );
}

function RecentPreviewRow({ report, mode }: { report: THCReport; mode: "clarity" | "dank" }) {
  const meta = repositoryMeta(report);
  return (
    <Link href={`/reports/${report.id}`} className={mode === "dank" ? "grid grid-cols-[minmax(0,1fr)_44px] gap-2 border border-lime-300/20 bg-black/50 p-2 text-lime-100 hover:border-lime-300/55" : "grid grid-cols-[minmax(0,1fr)_44px] gap-2 border border-stone-200 bg-white/70 p-2 text-stone-800 hover:border-emerald-300"}>
      <span className="min-w-0">
        <span className={mode === "dank" ? "block truncate font-black text-pink-300" : "block truncate font-semibold text-blue-700"}>{meta.owner}/{meta.repo}</span>
        <span className="mt-0.5 block truncate opacity-70">{report.recommendedLevel}</span>
      </span>
      <span className={mode === "dank" ? "font-mono text-lime-300" : "font-mono text-emerald-800"}>{report.totalScore}</span>
    </Link>
  );
}

function ReportCard({ report, mode }: { report: THCReport; mode: "clarity" | "dank" }) {
  const meta = repositoryMeta(report);
  return (
    <Link href={`/reports/${report.id}`} className={mode === "dank" ? "border border-lime-300/25 bg-black/65 p-3 text-lime-100" : "border border-stone-300 bg-white/75 p-3 text-stone-900"}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className={mode === "dank" ? "truncate font-black text-pink-300" : "truncate font-semibold text-blue-700"}>{meta.owner}/{meta.repo}</p>
          <p className="mt-1 truncate text-xs opacity-70">{report.reviewedCommitSha.slice(0, 12)} · {new Date(report.generatedAt).toLocaleDateString()}</p>
        </div>
        <span className={mode === "dank" ? "font-mono text-lime-300" : "font-mono text-emerald-800"}>{report.totalScore}</span>
      </div>
      <p className="mt-2 truncate text-xs opacity-80">{report.recommendedLevel}</p>
      <p className="mt-2 line-clamp-2 text-xs opacity-75">{report.topHiddenTrustFinding}</p>
    </Link>
  );
}

function InfoCard({ mode, title, body, tone = "neutral" }: { mode: "clarity" | "dank"; title: string; body: string; tone?: Tone }) {
  return (
    <article className={`${semanticCardClass(mode, tone)} p-3 text-sm`}>
      <div className="flex items-start justify-between gap-2">
        <h3 className={mode === "dank" ? "font-black uppercase" : "font-semibold"}>{title}</h3>
        <span className={badgeClass(mode, tone)}>{toneLabel(tone)}</span>
      </div>
      <p className={mode === "dank" ? "mt-2 text-xs leading-5 text-lime-100/75" : "mt-2 text-xs leading-5 text-stone-600"}>{body}</p>
    </article>
  );
}

function Expandable({ mode, title, children, tone = "neutral", defaultOpen = false }: { mode: "clarity" | "dank"; title: string; children: React.ReactNode; tone?: Tone; defaultOpen?: boolean }) {
  return (
    <details open={defaultOpen} className={`${semanticCardClass(mode, tone)} group p-3 text-sm ${mode === "dank" ? "open:shadow-[0_0_24px_rgba(236,72,153,0.22)]" : ""}`}>
      <summary className={mode === "dank" ? "cursor-pointer list-none font-black uppercase" : "cursor-pointer list-none font-semibold"}>
        <span title="Click to expand">{toneIcon(tone)} </span>{title}
        <span className={`${badgeClass(mode, tone)} float-right ml-2`}>{toneLabel(tone)}</span>
      </summary>
      <p className={mode === "dank" ? "mt-2 text-xs leading-5 text-lime-100/75" : "mt-2 text-xs leading-5 text-stone-600"}>{children}</p>
    </details>
  );
}

function StatusLegend({ mode }: { mode: "clarity" | "dank" }) {
  return (
    <section className={mode === "dank" ? "border border-cyan-300/35 bg-black/70 p-3" : "border border-stone-300 bg-white/75 p-3"}>
      <h2 className={mode === "dank" ? "text-sm font-black uppercase text-cyan-200" : "text-sm font-semibold text-stone-950"}>Evidence Color Key</h2>
      <div className="mt-2 grid gap-2 text-xs">
        {(["green", "yellow", "red"] as Tone[]).map((tone) => (
          <div key={tone} className="flex items-center justify-between gap-2">
            <span className={badgeClass(mode, tone)}>{toneLabel(tone)}</span>
            <span className={mode === "dank" ? "text-lime-100/70" : "text-stone-600"}>{toneDescription(tone)}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function semanticCardClass(mode: "clarity" | "dank", tone: Tone) {
  if (mode === "dank") {
    if (tone === "green") return "border border-lime-300/55 bg-lime-300/10 text-lime-100";
    if (tone === "yellow") return "border border-yellow-300/55 bg-yellow-300/10 text-yellow-100";
    if (tone === "red") return "border border-pink-500/55 bg-pink-500/10 text-pink-100";
    return "border border-lime-300/25 bg-black/65 text-lime-100";
  }
  if (tone === "green") return "border border-emerald-300 bg-emerald-50/85 text-emerald-950";
  if (tone === "yellow") return "border border-amber-300 bg-amber-50/85 text-amber-950";
  if (tone === "red") return "border border-red-300 bg-red-50/85 text-red-950";
  return "border border-stone-300 bg-white/75 text-stone-800";
}

function badgeClass(mode: "clarity" | "dank", tone: Tone) {
  if (mode === "dank") {
    if (tone === "green") return "shrink-0 border border-lime-300/55 bg-lime-300/15 px-1.5 py-0.5 text-[10px] font-black uppercase text-lime-200";
    if (tone === "yellow") return "shrink-0 border border-yellow-300/55 bg-yellow-300/15 px-1.5 py-0.5 text-[10px] font-black uppercase text-yellow-100";
    if (tone === "red") return "shrink-0 border border-pink-500/55 bg-pink-500/15 px-1.5 py-0.5 text-[10px] font-black uppercase text-pink-100";
    return "shrink-0 border border-cyan-300/45 bg-cyan-300/10 px-1.5 py-0.5 text-[10px] font-black uppercase text-cyan-100";
  }
  if (tone === "green") return "shrink-0 rounded-sm border border-emerald-300 bg-white/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800";
  if (tone === "yellow") return "shrink-0 rounded-sm border border-amber-300 bg-white/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800";
  if (tone === "red") return "shrink-0 rounded-sm border border-red-300 bg-white/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-800";
  return "shrink-0 rounded-sm border border-stone-300 bg-white/70 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-stone-600";
}

function toneLabel(tone: Tone) {
  if (tone === "green") return "Strong";
  if (tone === "yellow") return "Improve";
  if (tone === "red") return "Absent";
  return "Note";
}

function toneIcon(tone: Tone) {
  if (tone === "green") return "✓";
  if (tone === "yellow") return "△";
  if (tone === "red") return "×";
  return "ⓘ";
}

function toneDescription(tone: Tone) {
  if (tone === "green") return "Good public evidence.";
  if (tone === "yellow") return "Partial, stale, or needs tightening.";
  if (tone === "red") return "Missing, private, unverifiable, or unsafe to credit.";
  return "Context only.";
}

function DankNote({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="border border-pink-500/40 bg-black/72 p-4 text-sm leading-6 text-pink-100">
      <h2 className="text-sm font-black uppercase text-lime-300">{title}</h2>
      <p className="mt-2">{children}</p>
    </section>
  );
}

function AboutRightRail({ mode, section }: { mode: "clarity" | "dank"; section: AboutSection }) {
  if (mode === "dank") {
    return (
      <aside className="hidden min-h-0 content-start gap-2 overflow-hidden 2xl:grid">
        <DankNote title="Boundary //">AI review explains bounded evidence. App code owns scores, levels, caps, and disclaimers.</DankNote>
        <DankNote title={section === "self-audit" ? "Local Receipts //" : "Batch Re-Cook //"}>{section === "self-audit" ? "Local artifacts can help find evidence faster. Public review still verifies." : "Use a queue plus cron later. Never let unattended runs execute repo code on the app server."}</DankNote>
        <DankNote title="Export //">JSON now. Markdown/PDF later from the same payload.</DankNote>
      </aside>
    );
  }
  return (
    <aside className="hidden min-h-0 content-start gap-2 overflow-hidden 2xl:grid">
      <PinnedNote title="Review Boundary" tone="white">Public files inspected. No private access. No code execution. Deterministic scoring remains authoritative.</PinnedNote>
      <PinnedNote title={section === "self-audit" ? "Local Artifacts" : "Cadence Idea"} tone="amber">{section === "self-audit" ? "docs/thc artifacts are handoff evidence, not public truth by themselves." : "Manual audits capture now. Scheduled re-reviews should run from a queue, dedupe by repo, and save each reviewed commit."}</PinnedNote>
      <PinnedNote title="Download Path" tone="green">Report pages expose JSON download now. Markdown/PDF export can layer on the same report payload later.</PinnedNote>
    </aside>
  );
}

function panelClass(mode: "clarity" | "dank") {
  return mode === "dank"
    ? "min-h-0 overflow-auto border border-lime-300/35 bg-black/70 p-4"
    : "min-h-0 overflow-auto rounded-sm border border-stone-300 bg-white/60 p-4";
}

function headingClass(mode: "clarity" | "dank") {
  return mode === "dank" ? "text-xl font-black uppercase text-lime-300" : "font-serif text-2xl font-semibold";
}
