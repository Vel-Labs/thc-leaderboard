import { afterEach, describe, expect, it, vi } from "vitest";
import { generateMiniMaxReviewDraft } from "./minimax";

const previousEnv = { ...process.env };

describe("generateMiniMaxReviewDraft", () => {
  afterEach(() => {
    process.env = { ...previousEnv };
    vi.restoreAllMocks();
  });

  it("falls back to deterministic section notes when MiniMax times out", async () => {
    process.env.MINIMAX_API_KEY = "test-key";
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => {
        throw new DOMException("timed out", "TimeoutError");
      }),
    );

    const draft = await generateMiniMaxReviewDraft({
      projectName: "ClearIntent",
      repositoryUrl: "https://github.com/Vel-Labs/ClearIntent",
      reviewedCommitSha: "303e060ee6a5164a6392a0fff0fe123456789abc",
      inspectedFiles: ["README.md"],
      boundedEvidence: "README.md: visible setup evidence",
    });

    expect(draft.summary).toContain("Deterministic THC scoring completed");
    expect(draft.uncertaintyNotes.join(" ")).toContain("AI note provider unavailable");
    expect(draft.sectionAnalysis.evidence.aiNote).toContain("ClearIntent");
  });

  it("still fails closed when the production API key is missing", async () => {
    process.env.NODE_ENV = "production";
    delete process.env.MINIMAX_API_KEY;

    await expect(
      generateMiniMaxReviewDraft({
        projectName: "ClearIntent",
        repositoryUrl: "https://github.com/Vel-Labs/ClearIntent",
        reviewedCommitSha: "303e060ee6a5164a6392a0fff0fe123456789abc",
        inspectedFiles: ["README.md"],
        boundedEvidence: "README.md",
      }),
    ).rejects.toThrow("MiniMax API key is required");
  });
});
