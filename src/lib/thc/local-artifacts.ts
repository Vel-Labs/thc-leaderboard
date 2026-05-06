import type { LocalArtifactStatus } from "./schema";

const localArtifactPaths = [
  "docs/thc/README.md",
  "docs/thc/LOCAL_CHECK.md",
  "docs/thc/LOCAL_CHECK.provenance.json",
  "docs/thc/THC-BOT.md",
  "docs/thc/THC-BOT.history.json",
];

const requiredRunFiles = [
  "THC-BOT.md",
  "THC-BOT.contract.json",
  "THC-BOT.provenance.json",
  "slices/overview.json",
  "slices/evidence.json",
  "slices/local-artifacts.json",
  "slices/caps-applied.json",
  "slices/hidden-trust.json",
  "slices/next-actions.json",
  "slices/uncertainty.json",
];

type AssessInput = {
  reviewedCommitSha: string;
  files: Record<string, string | undefined>;
};

export function assessLocalArtifacts(input: AssessInput): LocalArtifactStatus {
  const filesPresent = localArtifactPaths.filter((path) => input.files[path]);
  const thcBot = assessThcBot(input);
  if (filesPresent.length === 0) {
    return {
      state: "absent",
      filesPresent,
      findings: ["No local THC artifacts were found at docs/thc/."],
      publicReviewHandoffNotes: [
        "No local THC handoff was available; public review used repository files directly.",
      ],
      thcBot: thcBot.thcBot,
    };
  }

  const findings: string[] = [...thcBot.findings];
  const handoff = [
    thcBot.thcBot.detected
      ? "Local THC-BOT artifacts were used as a review map only; reviewers must independently verify cited public evidence before assigning a public score."
      : "Local THC artifacts were treated as input, not truth, and the public review was recomputed from the inspected commit.",
  ];

  const legacyOnly = !thcBot.thcBot.detected;
  for (const requiredPath of legacyOnly ? localArtifactPaths.slice(0, 3) : ["docs/thc/README.md", "docs/thc/LOCAL_CHECK.md", "docs/thc/THC-BOT.history.json"]) {
    if (!input.files[requiredPath]) {
      findings.push(`Missing local THC artifact: ${requiredPath}.`);
    }
  }

  if (thcBot.thcBot.detected) {
    return {
      state: stateFromThcBot(thcBot.thcBot.publicVerificationState, findings),
      filesPresent,
      findings,
      publicReviewHandoffNotes: handoff,
      thcBot: thcBot.thcBot,
    };
  }

  const provenanceText = input.files["docs/thc/LOCAL_CHECK.provenance.json"];
  if (!provenanceText) {
    return {
      state: "present-unverified",
      filesPresent,
      findings,
      publicReviewHandoffNotes: handoff,
      thcBot: thcBot.thcBot,
    };
  }

  try {
    const provenance = JSON.parse(provenanceText) as {
      reviewed_revision?: string;
      report_sha256?: string;
      precheck_worktree_clean?: boolean;
    };

    if (provenance.reviewed_revision !== input.reviewedCommitSha) {
      findings.push("Local provenance reviewed_revision does not match the inspected public commit.");
    }

    if (!provenance.report_sha256) {
      findings.push("Local provenance does not include a report hash.");
    }

    if (provenance.precheck_worktree_clean !== true) {
      findings.push("Local provenance does not record a clean worktree precheck.");
    }

    return {
      state: findings.length === 0 ? "present-verified-input" : "present-stale-or-inconsistent",
      filesPresent,
      findings,
      publicReviewHandoffNotes: handoff,
      thcBot: thcBot.thcBot,
    };
  } catch {
    findings.push("Local provenance JSON could not be parsed.");
    return {
      state: "present-unverified",
      filesPresent,
      findings,
      publicReviewHandoffNotes: handoff,
      thcBot: thcBot.thcBot,
    };
  }
}

export function withPublicVerificationResult(
  status: LocalArtifactStatus,
  verification: {
    publicScore: number;
    publicCaps: string[];
    publicHiddenTrustFindings: string[];
    publicEvidenceLinks: string[];
  },
): LocalArtifactStatus {
  if (!status.thcBot.detected) {
    return {
      ...status,
      thcBot: {
        ...status.thcBot,
        publicScore: verification.publicScore,
        scoreDelta: null,
      },
    };
  }

  const localCaps = new Set([...status.thcBot.capsConfirmed, ...status.thcBot.capsDisputedOrMissing]);
  const localHiddenTrust = new Set([...status.thcBot.hiddenTrustConfirmed, ...status.thcBot.hiddenTrustAdded]);
  const publicCaps = new Set(verification.publicCaps);
  const publicHiddenTrust = new Set(verification.publicHiddenTrustFindings);
  const localScore = status.thcBot.localScore;

  return {
    ...status,
    thcBot: {
      ...status.thcBot,
      publicScore: verification.publicScore,
      scoreDelta: localScore === null ? null : verification.publicScore - localScore,
      capsConfirmed: [...localCaps].filter((cap) => publicCaps.has(cap)),
      capsDisputedOrMissing: [
        ...verification.publicCaps.filter((cap) => !localCaps.has(cap)),
        ...[...localCaps].filter((cap) => !publicCaps.has(cap)),
      ],
      hiddenTrustConfirmed: [...localHiddenTrust].filter((finding) => publicHiddenTrust.has(finding)),
      hiddenTrustAdded: verification.publicHiddenTrustFindings.filter((finding) => !localHiddenTrust.has(finding)),
      evidenceLinksVerified: Array.from(new Set([...status.thcBot.evidenceLinksVerified, ...verification.publicEvidenceLinks])).slice(0, 20),
    },
  };
}

type ThcBotSummary = LocalArtifactStatus["thcBot"];

function assessThcBot(input: AssessInput): { thcBot: ThcBotSummary; findings: string[] } {
  const ignoredFiles = input.files["docs/thc/THC-BOT.html"] ? ["docs/thc/THC-BOT.html"] : [];
  const base = absentThcBot(ignoredFiles);
  const historyText = input.files["docs/thc/THC-BOT.history.json"];
  if (!historyText) return { thcBot: base, findings: [] };

  const findings: string[] = [];
  const history = parseJson(historyText);
  if (!history || history.artifactKind !== "THC-BOT History" || !Array.isArray(history.runs)) {
    return {
      thcBot: {
        ...base,
        detected: true,
        publicVerificationState: "not-publicly-verified",
        confidenceImpact: "blocked",
        publicReadinessStatus: "invalid THC-BOT history",
      },
      findings: ["THC-BOT history JSON is missing required history fields."],
    };
  }

  const latest = latestRun(history.runs);
  if (!latest) {
    return {
      thcBot: {
        ...base,
        detected: true,
        publicVerificationState: "not-publicly-verified",
        confidenceImpact: "blocked",
        publicReadinessStatus: "invalid THC-BOT history",
      },
      findings: ["THC-BOT history does not contain any runs."],
    };
  }

  const runId = stringValue(latest.runId);
  const runPath = normalizeRunPath(stringValue(latest.path) || (runId ? `runs/${runId}/` : ""));
  const runRoot = runPath ? `docs/thc/${runPath}`.replace(/\/$/, "") : "";
  if (!runId || !runRoot) {
    return {
      thcBot: {
        ...base,
        detected: true,
        latestRunId: runId,
        contractVersion: stringValue(latest.contractVersion),
        publicVerificationState: "not-publicly-verified",
        confidenceImpact: "blocked",
        publicReadinessStatus: "invalid THC-BOT run reference",
      },
      findings: ["THC-BOT history latest run is missing a run ID or path."],
    };
  }

  for (const file of requiredRunFiles) {
    const path = `${runRoot}/${file}`;
    if (!input.files[path]) findings.push(`Missing THC-BOT run artifact: ${path}.`);
  }

  const contractPath = `${runRoot}/THC-BOT.contract.json`;
  const provenancePath = `${runRoot}/THC-BOT.provenance.json`;
  const contract = parseJson(input.files[contractPath]);
  const provenance = parseJson(input.files[provenancePath]);
  if (!contract) findings.push("THC-BOT contract JSON could not be parsed.");
  if (!provenance) findings.push("THC-BOT provenance JSON could not be parsed.");

  const validationState = validationStateFrom(contract?.validationState, findings);
  const contractVersion = stringValue(contract?.contractVersion) ?? stringValue(latest.contractVersion);
  const reviewedRevision = valueObjectString(contract?.reviewedRevision?.commitSha) ?? stringValue(provenance?.reviewedRevision?.commitSha) ?? stringValue(latest.reviewedRevision);
  const visibility = stringValue(contract?.project?.visibility);
  const localScore = numberValue(contract?.review?.totalScore) ?? numberValue(latest.totalScore);
  const localRecommendedLevel = valueObjectString(contract?.review?.recommendedLevel) ?? stringValue(latest.recommendedLevel);
  const caps = stringArray(contract?.review?.capsApplied);
  const hiddenTrustRows: unknown[] = Array.isArray(contract?.hiddenTrustFindings) ? contract.hiddenTrustFindings : [];
  const hiddenTrust = hiddenTrustRows
    .map((finding) => stringValue((finding as { finding?: unknown })?.finding))
    .filter((finding): finding is string => Boolean(finding));
  const evidence = evidenceReferences(contract);

  const revisionMatches = Boolean(reviewedRevision && revisionEqual(reviewedRevision, input.reviewedCommitSha));
  let publicVerificationState: ThcBotSummary["publicVerificationState"] = "verified-map";
  let confidenceImpact: ThcBotSummary["confidenceImpact"] = "none";
  let publicReadinessStatus = "local benchmark package detected; public verification required";

  if (validationState !== "Complete" || findings.length > 0) {
    publicVerificationState = "not-publicly-verified";
    confidenceImpact = "blocked";
    publicReadinessStatus = "not publicly verified; THC-BOT package is incomplete";
  } else if (visibility === "private" || visibility === "internal") {
    publicVerificationState = "private-only";
    confidenceImpact = "reduced";
    publicReadinessStatus = "not leaderboard-verifiable";
    findings.push(`THC-BOT project visibility is ${visibility}; private evidence is not leaderboard-verifiable.`);
  } else if (!revisionMatches) {
    publicVerificationState = "hints-only";
    confidenceImpact = "reduced";
    publicReadinessStatus = "not publicly verified; reviewed revision mismatch";
    findings.push("THC-BOT reviewed revision does not match the inspected public commit.");
  }

  return {
    thcBot: {
      detected: true,
      latestRunId: runId,
      contractVersion,
      reviewedRevision,
      localValidationState: findings.some((finding) => finding.includes("Missing THC-BOT run artifact")) && validationState === "Complete" ? "Partial Validation" : validationState,
      publicVerificationState,
      localRecommendedLevel,
      localScore,
      publicScore: null,
      scoreDelta: null,
      confidenceImpact,
      publicReadinessStatus,
      capsConfirmed: revisionMatches && publicVerificationState === "verified-map" ? caps : [],
      capsDisputedOrMissing: revisionMatches && publicVerificationState === "verified-map" ? [] : caps,
      hiddenTrustConfirmed: revisionMatches && publicVerificationState === "verified-map" ? hiddenTrust : [],
      hiddenTrustAdded: [],
      evidenceLinksVerified: revisionMatches && publicVerificationState === "verified-map" ? evidence.verified : [],
      evidenceLinksStaleMissingOrPrivate: revisionMatches && publicVerificationState === "verified-map" ? evidence.missing : [...evidence.verified, ...evidence.missing],
      ignoredFiles,
    },
    findings,
  };
}

function absentThcBot(ignoredFiles: string[]): ThcBotSummary {
  return {
    detected: false,
    latestRunId: null,
    contractVersion: null,
    reviewedRevision: null,
    localValidationState: "absent",
    publicVerificationState: "full-audit",
    localRecommendedLevel: null,
    localScore: null,
    publicScore: null,
    scoreDelta: null,
    confidenceImpact: "none",
    publicReadinessStatus: "full public audit required",
    capsConfirmed: [],
    capsDisputedOrMissing: [],
    hiddenTrustConfirmed: [],
    hiddenTrustAdded: [],
    evidenceLinksVerified: [],
    evidenceLinksStaleMissingOrPrivate: [],
    ignoredFiles,
  };
}

function stateFromThcBot(publicVerificationState: ThcBotSummary["publicVerificationState"], findings: string[]): LocalArtifactStatus["state"] {
  if (publicVerificationState === "verified-map" && findings.length === 0) return "present-verified-input";
  if (publicVerificationState === "hints-only" || publicVerificationState === "private-only") return "present-stale-or-inconsistent";
  return "present-unverified";
}

function latestRun(runs: unknown[]) {
  return runs
    .filter((run): run is Record<string, unknown> => Boolean(run) && typeof run === "object" && !Array.isArray(run))
    .sort((a, b) => stringValue(b.generatedAt)?.localeCompare(stringValue(a.generatedAt) ?? "") ?? 0)[0];
}

function normalizeRunPath(value: string | null) {
  if (!value) return null;
  const trimmed = value.replace(/^\/+/, "").replace(/\.\./g, "").replace(/^docs\/thc\//, "");
  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
}

function validationStateFrom(value: unknown, findings: string[]): ThcBotSummary["localValidationState"] {
  if (value === "Complete" || value === "Partial Validation" || value === "Invalid") return value;
  findings.push("THC-BOT contract validationState is missing or invalid.");
  return "Partial Validation";
}

function parseJson(value: string | undefined) {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function valueObjectString(value: unknown) {
  if (typeof value === "string") return value;
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return stringValue((value as { value?: unknown }).value);
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function numberValue(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(0, Math.min(100, Math.round(value)));
  if (value && typeof value === "object" && !Array.isArray(value)) return numberValue((value as { value?: unknown }).value);
  return null;
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.trim().length > 0) : [];
}

function revisionEqual(local: string, inspected: string) {
  return local === inspected || inspected.startsWith(local) || local.startsWith(inspected);
}

function evidenceReferences(contract: Record<string, unknown> | null) {
  const verified = new Set<string>();
  const missing = new Set<string>();
  const rows = Array.isArray(contract?.evidenceTable) ? contract.evidenceTable : [];
  for (const row of rows) {
    if (!row || typeof row !== "object") continue;
    for (const item of stringArray((row as { evidence?: unknown }).evidence)) verified.add(item);
    for (const item of stringArray((row as { missingEvidence?: unknown }).missingEvidence)) missing.add(item);
  }
  return {
    verified: [...verified].slice(0, 12),
    missing: [...missing].slice(0, 12),
  };
}
