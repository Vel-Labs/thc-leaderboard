export type DisplayMode = "clarity" | "dank";

export const invariantReportLabels = {
  reviewLabel: "Automated Public Review",
  disclaimer:
    "This is an automated public review artifact, not certification, security approval, production readiness, Vel Labs endorsement, or a reliability guarantee.",
} as const;

export const modeCopy = {
  clarity: {
    title: "Clarity Mode",
    subtitle: "Paper dossier workspace",
    evidence: "Evidence",
    caps: "Caps Applied",
    hiddenTrust: "Hidden Trust",
    localArtifacts: "Local Artifacts",
    nextActions: "Next Actions",
    confidence: "Confidence",
    inputLabel: "Public GitHub repository URL",
    reviewButton: "Start Review",
    sidebarTitle: "Review Folder",
    statusReady: "Ready",
  },
  dank: {
    title: "Dank Mode",
    subtitle: "2am meme board",
    evidence: "Receipts",
    caps: "Score Nerfs",
    hiddenTrust: "Biggest Sus",
    localArtifacts: "Claimed Lore",
    nextActions: "Un-Cook This Repo",
    confidence: "Vibe Check",
    inputLabel: "Drop the public repo",
    reviewButton: "Run the Vibe Check",
    sidebarTitle: "Meme Folder",
    statusReady: "Locked in",
  },
} as const;

export const sidebarItems = ["Overview", "Evidence", "Caps", "Hidden Trust", "Local Artifacts", "Next Actions"];

export function copyForMode(mode: DisplayMode) {
  return modeCopy[mode];
}
