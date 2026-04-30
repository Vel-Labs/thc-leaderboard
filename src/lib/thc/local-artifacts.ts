import type { LocalArtifactStatus } from "./schema";

const localArtifactPaths = [
  "docs/thc/README.md",
  "docs/thc/LOCAL_CHECK.md",
  "docs/thc/LOCAL_CHECK.provenance.json",
];

type AssessInput = {
  reviewedCommitSha: string;
  files: Record<string, string | undefined>;
};

export function assessLocalArtifacts(input: AssessInput): LocalArtifactStatus {
  const filesPresent = localArtifactPaths.filter((path) => input.files[path]);
  if (filesPresent.length === 0) {
    return {
      state: "absent",
      filesPresent,
      findings: ["No local THC artifacts were found at docs/thc/."],
      publicReviewHandoffNotes: [
        "No local THC handoff was available; public review used repository files directly.",
      ],
    };
  }

  const findings: string[] = [];
  const handoff = [
    "Local THC artifacts were treated as input, not truth, and the public review was recomputed from the inspected commit.",
  ];

  for (const requiredPath of localArtifactPaths) {
    if (!input.files[requiredPath]) {
      findings.push(`Missing local THC artifact: ${requiredPath}.`);
    }
  }

  const provenanceText = input.files["docs/thc/LOCAL_CHECK.provenance.json"];
  if (!provenanceText) {
    return {
      state: "present-unverified",
      filesPresent,
      findings,
      publicReviewHandoffNotes: handoff,
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
    };
  } catch {
    findings.push("Local provenance JSON could not be parsed.");
    return {
      state: "present-unverified",
      filesPresent,
      findings,
      publicReviewHandoffNotes: handoff,
    };
  }
}
