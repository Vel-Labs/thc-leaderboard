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

  it("runs scoped review slices before the overview synthesis", async () => {
    process.env.MINIMAX_API_KEY = "test-key";
    const calls: string[] = [];
    vi.stubGlobal(
      "fetch",
      vi.fn(async (_url, init) => {
        const body = JSON.parse(String((init as RequestInit).body));
        const content = body.messages[1].content as string;
        calls.push(content);
        const sliceMatch = content.match(/Review slice: ([a-z-]+)/);
        const slice = sliceMatch?.[1] ?? "overview-synthesis";
        return new Response(JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify(slice === "overview-synthesis"
                  ? {
                      summary: "Synthesis from completed review slices.",
                      strengths: ["Public evidence was available."],
                      risks: ["Some trust remains hidden."],
                      uncertaintyNotes: ["Synthesis used prior slices."],
                    }
                  : {
                      definition: `${slice} definition`,
                      whatIsWrong: [`${slice} issue`],
                      aiNote: `${slice} note`,
                    }),
              },
            },
          ],
        }), { status: 200 });
      }),
    );

    const draft = await generateMiniMaxReviewDraft({
      projectName: "ClearIntent",
      repositoryUrl: "https://github.com/Vel-Labs/ClearIntent",
      reviewedCommitSha: "303e060ee6a5164a6392a0fff0fe123456789abc",
      inspectedFiles: ["README.md"],
      boundedEvidence: "README.md: visible setup evidence",
    });

    expect(calls.filter((call) => call.includes("Review slice: ") && !call.includes("overview-synthesis"))).toHaveLength(5);
    expect(calls.at(-1)).toContain("Review slice: overview-synthesis");
    expect(draft.summary).toBe("Synthesis from completed review slices.");
    expect(draft.sectionAnalysis.evidence.aiNote).toBe("evidence note");
    expect(draft.batches.map((batch) => batch.slice)).toEqual([
      "evidence",
      "local-artifacts",
      "caps-applied",
      "hidden-trust",
      "next-actions",
      "overview-synthesis",
    ]);
    expect(draft.batches.every((batch) => batch.state === "completed")).toBe(true);
  });
});
