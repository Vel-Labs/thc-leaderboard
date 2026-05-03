export const reportSections = [
  "overview",
  "evidence",
  "caps-applied",
  "hidden-trust",
  "local-artifacts",
  "next-actions",
  "ai-analysis",
  "history",
  "leaderboard",
  "operators",
  "most-truthful",
  "most-hardened",
  "most-clarified",
  "best-audit-history",
  "highest-thc",
] as const;

export type ReportSection = (typeof reportSections)[number];

export function isReportSection(value: string): value is ReportSection {
  return reportSections.includes(value as ReportSection);
}

export const leaderboardSections: ReportSection[] = [
  "leaderboard",
  "operators",
  "most-truthful",
  "most-hardened",
  "most-clarified",
  "best-audit-history",
  "highest-thc",
];

export function isLeaderboardSection(section: ReportSection) {
  return leaderboardSections.includes(section);
}
