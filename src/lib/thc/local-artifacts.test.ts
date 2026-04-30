import { describe, expect, test } from "vitest";
import { assessLocalArtifacts } from "./local-artifacts";

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
});
