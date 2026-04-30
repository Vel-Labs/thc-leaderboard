import "server-only";

import { randomUUID } from "node:crypto";
import { inspectPublicGitHubRepository } from "@/lib/github";
import { generateMiniMaxReviewDraft } from "@/lib/minimax";
import { saveReport } from "@/lib/storage";
import { assessLocalArtifacts } from "./local-artifacts";
import { applyLevelCaps, levelFromScore, sumEvidenceScores } from "./scoring";
import type { EvidenceRow, HiddenTrustFinding, THCReport } from "./schema";

const rubricVersion = "THC Methodology 0.2.0";

export async function createPublicReview(repositoryUrl: string): Promise<THCReport> {
  const inspected = await inspectPublicGitHubRepository(repositoryUrl);
  const localArtifactStatus = assessLocalArtifacts({
    reviewedCommitSha: inspected.reviewedCommitSha,
    files: inspected.files,
  });

  const evidenceTable = scoreEvidence(inspected.files);
  const totalScore = sumEvidenceScores(evidenceTable);
  const caps = inferCaps(inspected.files, localArtifactStatus.findings);
  const capped = applyLevelCaps(levelFromScore(totalScore), caps);
  const hiddenTrustFindings = inferHiddenTrustFindings(inspected.files, localArtifactStatus.findings);
  const boundedEvidence = buildBoundedEvidence(inspected.files);
  const draft = await generateMiniMaxReviewDraft({
    projectName: inspected.projectName,
    repositoryUrl: inspected.repositoryUrl,
    reviewedCommitSha: inspected.reviewedCommitSha,
    inspectedFiles: inspected.inspectedFiles,
    boundedEvidence,
  });

  const report: THCReport = {
    id: randomUUID(),
    projectName: inspected.projectName,
    repositoryUrl: inspected.repositoryUrl,
    reviewedCommitSha: inspected.reviewedCommitSha,
    generatedAt: new Date().toISOString(),
    rubricVersion,
    reviewLabel: "Automated Public Review",
    recommendedLevel: capped.level,
    totalScore,
    confidence: inferConfidence(inspected.inspectedFiles, localArtifactStatus.state),
    capsApplied: capped.capsApplied,
    evidenceTable,
    hiddenTrustFindings,
    localArtifactStatus,
    inspectedFiles: inspected.inspectedFiles,
    summary: draft.summary,
    nextActions: inferNextActions(caps, hiddenTrustFindings),
    uncertaintyNotes: [
      ...draft.uncertaintyNotes,
      "This is an automated public review artifact, not certification, security approval, production readiness, endorsement, or a reliability guarantee.",
    ],
    topStrength: draft.strengths[0] ?? "Public repository state was inspected without executing project code.",
    topHiddenTrustFinding: hiddenTrustFindings[0]?.finding ?? "No critical hidden-trust finding was identified from the inspected files.",
  };

  return saveReport(report);
}

function scoreEvidence(files: Record<string, string | undefined>): EvidenceRow[] {
  const readme = files["README.md"] ?? files["readme.md"] ?? "";
  const packageFile = files["package.json"] ?? "";
  const docs = concatFiles(files, ["docs/README.md", "docs/index.md", "docs/ARCHITECTURE.md", "docs/DECISIONS.md", "AGENTS.md", "CLAUDE.md"]);
  const validation = concatFiles(files, ["package.json", "Makefile", ".github/workflows/ci.yml", ".github/workflows/test.yml"]);
  const audit = concatFiles(files, ["CHANGELOG.md", "docs/DECISIONS.md", "docs/thc/LOCAL_CHECK.md"]);

  const truth = clamp(
    points(Boolean(readme), 6) +
      points(hasAny(readme, ["purpose", "overview", "what", "why"]), 5) +
      points(hasAny(docs, ["source of truth", "architecture", "boundary", "contract"]), 8) +
      points(hasAny(docs + readme, ["assumption", "constraint", "known unknown", "risk"]), 6) +
      points(hasAny(docs + readme, ["evidence", "verified", "validated"]), 5),
    30,
  );

  const hardening = clamp(
    points(Boolean(packageFile || files["Makefile"]), 5) +
      points(hasAny(validation, ["test", "lint", "typecheck", "build"]), 8) +
      points(Boolean(files[".github/workflows/ci.yml"] || files[".github/workflows/test.yml"]), 7) +
      points(hasAny(docs + readme, ["failure", "recovery", "troubleshoot", "fail closed"]), 6) +
      points(hasAny(docs + readme, ["guardrail", "agent", "automation", "drift"]), 5) +
      points(hasAny(validation, ["env", "environment", "config"]), 4),
    35,
  );

  const clarity = clamp(
    points(hasAny(readme, ["install", "setup", "getting started", "usage"]), 7) +
      points(hasAny(readme + docs, ["contributing", "contributor", "development"]), 5) +
      points(hasAny(docs + readme, ["operate", "runtime", "run", "deploy"]), 5) +
      points(hasAny(docs + readme, ["troubleshoot", "recover", "debug"]), 4) +
      points(Boolean(docs), 4),
    25,
  );

  const auditHistory = clamp(
    points(hasAny(audit, ["hidden trust", "risk", "finding", "uncertainty"]), 5) +
      points(Boolean(files["CHANGELOG.md"] || files["docs/DECISIONS.md"] || files["docs/thc/LOCAL_CHECK.md"]), 5),
    10,
  );

  return [
    { category: "Truth", evidence: evidenceSummary(files, ["README.md", "docs/ARCHITECTURE.md", "docs/DECISIONS.md", "AGENTS.md"]), score: truth, notes: "Scored from explicit purpose, source-of-truth, assumptions, boundaries, and evidence claims." },
    { category: "Hardening", evidence: evidenceSummary(files, ["package.json", "Makefile", ".github/workflows/ci.yml", ".github/workflows/test.yml"]), score: hardening, notes: "Scored from visible validation, CI, failure-mode, environment, and automation guardrail evidence." },
    { category: "Clarity", evidence: evidenceSummary(files, ["README.md", "docs/README.md", "docs/index.md"]), score: clarity, notes: "Scored from setup, contributor, operator, recovery, and navigation clarity." },
    { category: "Audit History", evidence: evidenceSummary(files, ["CHANGELOG.md", "docs/DECISIONS.md", "docs/thc/LOCAL_CHECK.md"]), score: auditHistory, notes: "Scored from visible review history, known risks, hidden-trust findings, or decision history." },
  ];
}

function inferCaps(files: Record<string, string | undefined>, localFindings: string[]) {
  const caps: string[] = [];
  const readme = files["README.md"] ?? files["readme.md"] ?? "";
  const docs = concatFiles(files, ["docs/README.md", "docs/index.md", "docs/ARCHITECTURE.md", "AGENTS.md"]);
  const validation = concatFiles(files, ["package.json", "Makefile", ".github/workflows/ci.yml", ".github/workflows/test.yml"]);

  if (!hasAny(readme, ["install", "setup", "getting started", "usage"])) caps.push("Missing setup path");
  if (!hasAny(validation, ["test", "lint", "typecheck", "build"])) caps.push("No visible validation path");
  if (!hasAny(readme + docs, ["source of truth", "architecture", "boundary", "contract"])) caps.push("No source-of-truth boundary for core behavior");
  if (hasAny(localFindings.join(" "), ["does not match", "could not be parsed"])) caps.push("Core docs known to be stale");
  return caps;
}

function inferHiddenTrustFindings(files: Record<string, string | undefined>, localFindings: string[]): HiddenTrustFinding[] {
  const findings: HiddenTrustFinding[] = [];
  const readme = files["README.md"] ?? files["readme.md"] ?? "";
  const validation = concatFiles(files, ["package.json", "Makefile", ".github/workflows/ci.yml", ".github/workflows/test.yml"]);
  if (!hasAny(readme, ["setup", "install", "getting started"])) {
    findings.push({
      finding: "Setup path is missing or unclear.",
      severity: "high",
      evidence: "README did not expose a clear setup path.",
      recommendation: "Document a fresh-clone setup and validation path.",
    });
  }
  if (!hasAny(validation, ["test", "lint", "typecheck", "build"])) {
    findings.push({
      finding: "Validation path is not visible.",
      severity: "high",
      evidence: "No obvious test, lint, typecheck, build, Makefile, or CI workflow evidence was found.",
      recommendation: "Add deterministic validation commands and expose them in docs or package scripts.",
    });
  }
  for (const finding of localFindings) {
    findings.push({
      finding,
      severity: "medium",
      evidence: "docs/thc local artifact status",
      recommendation: "Regenerate local THC artifacts against the current public revision before using them as handoff evidence.",
    });
  }
  return findings.slice(0, 6);
}

function inferNextActions(caps: string[], findings: HiddenTrustFinding[]) {
  const actions = [
    ...caps.map((cap) => `Resolve level cap: ${cap}.`),
    ...findings.map((finding) => finding.recommendation),
  ];
  return Array.from(new Set(actions)).slice(0, 6);
}

function inferConfidence(inspectedFiles: string[], localState: string) {
  if (inspectedFiles.length < 3) return "low";
  if (localState === "present-stale-or-inconsistent" || inspectedFiles.length < 7) return "medium";
  return "high";
}

function buildBoundedEvidence(files: Record<string, string | undefined>) {
  return Object.entries(files)
    .map(([path, content]) => `--- ${path} ---\n${content?.slice(0, 8_000) ?? ""}`)
    .join("\n\n")
    .slice(0, 48_000);
}

function evidenceSummary(files: Record<string, string | undefined>, paths: string[]) {
  const present = paths.filter((path) => files[path]);
  return present.length ? present.join(", ") : "No direct evidence found in inspected candidate files.";
}

function concatFiles(files: Record<string, string | undefined>, paths: string[]) {
  return paths.map((path) => files[path] ?? "").join("\n").toLowerCase();
}

function hasAny(text: string, needles: string[]) {
  const lower = text.toLowerCase();
  return needles.some((needle) => lower.includes(needle));
}

function points(condition: boolean, value: number) {
  return condition ? value : 0;
}

function clamp(value: number, max: number) {
  return Math.max(0, Math.min(max, value));
}
