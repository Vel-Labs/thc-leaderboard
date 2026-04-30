"use client";

import Link from "next/link";
import type { THCReport } from "@/lib/thc/schema";
import { AppHeader, FolderSidebar, ModeChrome, PaperNote, SectionPanel, StickerRail, Workspace, useDisplayMode } from "../mode-shell";
import { ReviewForm } from "../review-form";

export function LeaderboardView({ reports }: { reports: THCReport[] }) {
  const { mode } = useDisplayMode();

  return (
    <ModeChrome>
      <AppHeader>
        <ReviewForm />
      </AppHeader>

      <Workspace>
        <FolderSidebar active="Evidence" />
        <div className="space-y-5">
          <SectionPanel id="overview" title={mode === "dank" ? "Receipts Board" : "Public Review Index"} kicker="ranked artifacts, not reputation">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <p className="mode-muted max-w-3xl text-sm leading-6">
                Each entry links to a report with the reviewed commit, scorecard rows, level caps, uncertainty, and hidden-trust findings.
              </p>
              <StickerRail
                items={
                  mode === "dank"
                    ? ["No Star Chasing", "Receipts or L", "Lore Tax Applied", "Caps Stay On"]
                    : ["Evidence Linked", "Caps Visible", "Commit Pinned", "Disclaimer Present"]
                }
              />
            </div>
          </SectionPanel>

          <div className="grid gap-4 md:grid-cols-2">
            <PaperNote tone="accent">
              Ranking is based on stored Automated Public Review reports, not reputation, stars, package size, or maintainer lore.
            </PaperNote>
            <PaperNote tone="warning">
              Placement does not imply certification, security approval, production readiness, endorsement, or guaranteed reliability.
            </PaperNote>
          </div>

          <SectionPanel id="evidence" title={mode === "dank" ? "Chronically Online Board" : "Leaderboard"} kicker="public review artifacts">
            <div className="overflow-x-auto rounded-md border border-stone-300/70 bg-white/85">
              <table className="mode-table w-full min-w-[1080px] text-left text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-3">Project</th>
                    <th className="px-4 py-3">Repository</th>
                    <th className="px-4 py-3">THC Level</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Review Label</th>
                    <th className="px-4 py-3">Generated</th>
                    <th className="px-4 py-3">Top Strength</th>
                    <th className="px-4 py-3">{mode === "dank" ? "Biggest Sus" : "Top Hidden-Trust Finding"}</th>
                    <th className="px-4 py-3">Report</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id} className="align-top">
                      <td className="px-4 py-3 font-semibold">{report.projectName}</td>
                      <td className="px-4 py-3">
                        <a className="mode-link" href={report.repositoryUrl} rel="noreferrer" target="_blank">
                          {report.repositoryUrl.replace("https://github.com/", "")}
                        </a>
                      </td>
                      <td className="px-4 py-3">{report.recommendedLevel}</td>
                      <td className="px-4 py-3 tabular-nums">{report.totalScore}</td>
                      <td className="px-4 py-3">{report.reviewLabel}</td>
                      <td className="px-4 py-3">{new Date(report.generatedAt).toLocaleDateString()}</td>
                      <td className="max-w-xs px-4 py-3">{report.topStrength}</td>
                      <td className="max-w-xs px-4 py-3">{report.topHiddenTrustFinding}</td>
                      <td className="px-4 py-3">
                        <Link className="mode-link font-semibold" href={`/reports/${report.id}`}>
                          Open
                        </Link>
                      </td>
                    </tr>
                  ))}
                  {reports.length === 0 ? (
                    <tr>
                      <td className="px-4 py-5" colSpan={9}>
                        No qualified reports yet.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </SectionPanel>
        </div>
      </Workspace>
    </ModeChrome>
  );
}
