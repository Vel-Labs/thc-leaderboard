import Link from "next/link";
import { listReports } from "@/lib/storage";
import { AppHeader, FolderSidebar, ModeChrome, PaperNote, SectionPanel, StickerRail, Workspace } from "./mode-shell";
import { ReviewForm } from "./review-form";

export const dynamic = "force-dynamic";

export default async function Home() {
  const reports = await listReports(6);

  return (
    <ModeChrome>
      <AppHeader>
        <ReviewForm />
      </AppHeader>

      <Workspace>
        <FolderSidebar />
        <div className="space-y-5">
          <SectionPanel id="overview" title="Review Desk" kicker="submit, inspect, publish">
            <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
              <div className="mode-muted space-y-3 text-sm leading-6">
                <p>
                  THC Leaderboard turns a public GitHub repository into a shareable public review artifact. The app inspects public files,
                  resolves the reviewed commit, applies deterministic caps, and keeps the score grounded in visible evidence.
                </p>
                <StickerRail items={["URL Ingest", "Commit SHA", "Evidence Table", "Caps Applied", "Leaderboard Entry"]} />
              </div>
              <div className="grid gap-2 text-sm">
                <div className="mode-soft-card rounded-md border p-3">
                  <div className="font-semibold">Truth</div>
                  <div className="mode-muted">Claims and source-of-truth boundaries.</div>
                </div>
                <div className="mode-soft-card rounded-md border p-3">
                  <div className="font-semibold">Hardening</div>
                  <div className="mode-muted">Validation, guardrails, drift and failure evidence.</div>
                </div>
                <div className="mode-soft-card rounded-md border p-3">
                  <div className="font-semibold">Clarity</div>
                  <div className="mode-muted">Setup, operator, contributor and recovery legibility.</div>
                </div>
              </div>
            </div>
          </SectionPanel>

          <div className="grid gap-4 md:grid-cols-3">
            <PaperNote tone="accent">
              Local THC artifacts can point to evidence faster, but the public score is recomputed from the inspected commit.
            </PaperNote>
            <PaperNote>
              Truth, Hardening, and Clarity use the same scorecard in both display modes.
            </PaperNote>
            <PaperNote tone="warning">
              Automated Public Review is not certification, security approval, production readiness, endorsement, or a reliability guarantee.
            </PaperNote>
          </div>

          <SectionPanel id="overview" title="Recent Reports" kicker="Leaderboard preview">
            <div className="mb-3 flex justify-end">
              <Link className="text-sm font-semibold text-emerald-700 hover:text-emerald-900 dark:text-lime-200" href="/leaderboard">
                View leaderboard
              </Link>
            </div>
            <div className="overflow-hidden rounded-md border border-stone-300/70 bg-white/85">
              <table className="mode-table w-full min-w-[760px] text-left text-sm">
                <thead>
                  <tr>
                    <th className="px-4 py-3">Project</th>
                    <th className="px-4 py-3">Level</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Label</th>
                    <th className="px-4 py-3">Generated</th>
                    <th className="px-4 py-3">Report</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.length === 0 ? (
                    <tr>
                      <td className="px-4 py-5" colSpan={6}>
                        No reports yet. Submit a public GitHub repository to create the first entry.
                      </td>
                    </tr>
                  ) : (
                    reports.map((report) => (
                      <tr key={report.id}>
                        <td className="px-4 py-3 font-semibold">{report.projectName}</td>
                        <td className="px-4 py-3">{report.recommendedLevel}</td>
                        <td className="px-4 py-3 tabular-nums">{report.totalScore}</td>
                        <td className="px-4 py-3">{report.reviewLabel}</td>
                        <td className="px-4 py-3">{new Date(report.generatedAt).toLocaleString()}</td>
                        <td className="px-4 py-3">
                          <Link className="mode-link font-semibold" href={`/reports/${report.id}`}>
                            Open
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </SectionPanel>
        </div>
      </Workspace>
    </ModeChrome>
  );
}
