import { describe, expect, test } from "vitest";
import { assessLocalArtifacts, withPublicVerificationResult } from "./local-artifacts";

describe("assessLocalArtifacts", () => {
  test("marks complete local THC files as input only when provenance matches the reviewed commit", () => {
    const status = assessLocalArtifacts({
      reviewedCommitSha: "abc123",
      files: {
        "docs/thc/README.md": "# THC Review Artifacts",
        "docs/thc/LOCAL_CHECK.md": "Reviewed Revision: abc123",
        "docs/thc/LOCAL_CHECK.provenance.json": JSON.stringify({
          reviewed_revision: "abc123",
          report_sha256: "1234",
          precheck_worktree_clean: true,
        }),
      },
    });

    expect(status.state).toBe("present-verified-input");
    expect(status.publicReviewHandoffNotes[0]).toContain("input, not truth");
  });

  test("flags stale provenance without accepting local score truth", () => {
    const status = assessLocalArtifacts({
      reviewedCommitSha: "newsha",
      files: {
        "docs/thc/README.md": "# THC Review Artifacts",
        "docs/thc/LOCAL_CHECK.md": "Recommended Level: THC-5 High-THC",
        "docs/thc/LOCAL_CHECK.provenance.json": JSON.stringify({
          reviewed_revision: "oldsha",
          precheck_worktree_clean: true,
        }),
      },
    });

    expect(status.state).toBe("present-stale-or-inconsistent");
    expect(status.findings).toContain("Local provenance reviewed_revision does not match the inspected public commit.");
  });

  test("detects a complete THC-BOT run as a handshake map, not public truth", () => {
    const status = assessLocalArtifacts({
      reviewedCommitSha: "abc123",
      files: thcBotFiles({
        reviewedCommitSha: "abc123",
        validationState: "Complete",
        visibility: "public",
        localScore: 86,
      }),
    });

    expect(status.state).toBe("present-verified-input");
    expect(status.thcBot?.detected).toBe(true);
    expect(status.thcBot?.latestRunId).toBe("2026-05-05_project_0.1.0_abc123");
    expect(status.thcBot?.localValidationState).toBe("Complete");
    expect(status.thcBot?.publicVerificationState).toBe("verified-map");
    expect(status.thcBot?.localScore).toBe(86);
    expect(status.thcBot?.publicScore).toBeNull();
    expect(status.thcBot?.ignoredFiles).toContain("docs/thc/THC-BOT.html");
    expect(status.publicReviewHandoffNotes.join(" ")).toContain("independently verify");
  });

  test("uses stale THC-BOT artifacts as hints only when reviewed revision differs", () => {
    const status = assessLocalArtifacts({
      reviewedCommitSha: "newsha",
      files: thcBotFiles({
        reviewedCommitSha: "oldsha",
        validationState: "Complete",
        visibility: "public",
        localScore: 87,
      }),
    });

    expect(status.state).toBe("present-stale-or-inconsistent");
    expect(status.thcBot?.publicVerificationState).toBe("hints-only");
    expect(status.thcBot?.confidenceImpact).toBe("reduced");
    expect(status.thcBot?.publicReadinessStatus).toContain("not publicly verified");
    expect(status.findings).toContain("THC-BOT reviewed revision does not match the inspected public commit.");
  });

  test("marks a THC-BOT run partial when required files are missing", () => {
    const files = thcBotFiles({
      reviewedCommitSha: "abc123",
      validationState: "Complete",
      visibility: "public",
      localScore: 72,
    });
    delete files["docs/thc/runs/2026-05-05_project_0.1.0_abc123/slices/uncertainty.json"];

    const status = assessLocalArtifacts({
      reviewedCommitSha: "abc123",
      files,
    });

    expect(status.state).toBe("present-unverified");
    expect(status.thcBot?.localValidationState).toBe("Partial Validation");
    expect(status.thcBot?.publicVerificationState).toBe("not-publicly-verified");
    expect(status.findings).toContain("Missing THC-BOT run artifact: docs/thc/runs/2026-05-05_project_0.1.0_abc123/slices/uncertainty.json.");
  });

  test("does not treat private THC-BOT evidence as leaderboard-verifiable", () => {
    const status = assessLocalArtifacts({
      reviewedCommitSha: "abc123",
      files: thcBotFiles({
        reviewedCommitSha: "abc123",
        validationState: "Complete",
        visibility: "private",
        localScore: 91,
      }),
    });

    expect(status.state).toBe("present-stale-or-inconsistent");
    expect(status.thcBot?.publicVerificationState).toBe("private-only");
    expect(status.thcBot?.publicReadinessStatus).toBe("not leaderboard-verifiable");
    expect(status.findings).toContain("THC-BOT project visibility is private; private evidence is not leaderboard-verifiable.");
  });

  test("compares THC-BOT score against the independently generated public score", () => {
    const status = assessLocalArtifacts({
      reviewedCommitSha: "abc123",
      files: thcBotFiles({
        reviewedCommitSha: "abc123",
        validationState: "Complete",
        visibility: "public",
        localScore: 86,
      }),
    });

    const verified = withPublicVerificationResult(status, {
      publicScore: 82,
      publicCaps: ["No visible validation path", "Core docs known to be stale"],
      publicHiddenTrustFindings: ["Validation path is not visible."],
      publicEvidenceLinks: ["README.md", "package.json"],
    });

    expect(verified.thcBot.publicScore).toBe(82);
    expect(verified.thcBot.scoreDelta).toBe(-4);
    expect(verified.thcBot.capsConfirmed).toEqual(["No visible validation path"]);
    expect(verified.thcBot.capsDisputedOrMissing).toEqual(["Core docs known to be stale"]);
    expect(verified.thcBot.hiddenTrustAdded).toEqual(["Validation path is not visible."]);
    expect(verified.thcBot.evidenceLinksVerified).toContain("README.md");
  });
});

function thcBotFiles(input: {
  reviewedCommitSha: string;
  validationState: "Complete" | "Partial Validation" | "Invalid";
  visibility: "public" | "private" | "internal" | "unknown";
  localScore: number;
}) {
  const runId = "2026-05-05_project_0.1.0_abc123";
  const runRoot = `docs/thc/runs/${runId}`;
  return {
    "docs/thc/README.md": "# THC Review Artifacts",
    "docs/thc/LOCAL_CHECK.md": "# Local THC Check",
    "docs/thc/THC-BOT.md": "# THC-BOT Ledger",
    "docs/thc/THC-BOT.html": "<!doctype html><title>visual only</title>",
    "docs/thc/THC-BOT.history.json": JSON.stringify({
      artifactKind: "THC-BOT History",
      contractVersion: "0.1.0",
      runs: [
        {
          runId,
          generatedAt: "2026-05-05T16:30:00Z",
          reviewedRevision: input.reviewedCommitSha.slice(0, 7),
          contractVersion: "0.1.0",
          recommendedLevel: "THC-4 Reproducible",
          totalScore: input.localScore,
          confidence: "medium",
          validationState: input.validationState,
          path: `runs/${runId}/`,
        },
      ],
    }),
    [`${runRoot}/THC-BOT.md`]: "# THC-BOT Run",
    [`${runRoot}/THC-BOT.contract.json`]: JSON.stringify({
      artifactKind: "THC-BOT",
      contractVersion: "0.1.0",
      rubricVersion: "THC Methodology 0.2.0",
      validationState: input.validationState,
      project: {
        name: "Project",
        repositoryUrl: {
          value: "https://github.com/example/project",
          status: "provided",
          reason: "",
        },
        visibility: input.visibility,
      },
      reviewedRevision: {
        commitSha: {
          value: input.reviewedCommitSha,
          status: "provided",
          reason: "",
        },
        generatedAt: "2026-05-05T16:30:00Z",
        worktreeState: "clean",
      },
      review: {
        reviewLabel: "Local THC Check",
        recommendedLevel: "THC-4 Reproducible",
        totalScore: input.localScore,
        confidence: "medium",
        capsApplied: ["No visible validation path"],
      },
      evidenceTable: [
        {
          category: "Truth",
          score: 26,
          evidence: ["README.md"],
          missingEvidence: [],
          notes: "Visible truth evidence.",
        },
      ],
      hiddenTrustFindings: [],
      nextActions: [],
      uncertaintyNotes: [],
      provenance: {
        commandsRun: ["git status --porcelain"],
        filesInspected: ["README.md"],
        evidenceFileHashes: {
          "README.md": "sha256:readme",
        },
        reportHash: "sha256:report",
        contractHash: "sha256:contract",
        model: {
          value: "gpt-5",
          status: "provided",
          reason: "",
        },
        promptVersion: {
          value: "THC_Check 0.1.0",
          status: "provided",
          reason: "",
        },
      },
    }),
    [`${runRoot}/THC-BOT.provenance.json`]: JSON.stringify({
      artifactKind: "THC-BOT Provenance",
      contractVersion: "0.1.0",
      generatedAt: "2026-05-05T16:30:00Z",
      reviewedRevision: {
        commitSha: input.reviewedCommitSha,
        worktreeState: "clean",
      },
      commandsRun: ["git status --porcelain"],
      filesInspected: ["README.md"],
      fileHashes: {
        "README.md": "sha256:readme",
      },
      artifactHashes: {
        "THC-BOT.md": "sha256:report",
      },
      unavailableFields: [],
    }),
    [`${runRoot}/slices/overview.json`]: "{}",
    [`${runRoot}/slices/evidence.json`]: "{}",
    [`${runRoot}/slices/local-artifacts.json`]: "{}",
    [`${runRoot}/slices/caps-applied.json`]: "{}",
    [`${runRoot}/slices/hidden-trust.json`]: "{}",
    [`${runRoot}/slices/next-actions.json`]: "{}",
    [`${runRoot}/slices/uncertainty.json`]: "{}",
  };
}
