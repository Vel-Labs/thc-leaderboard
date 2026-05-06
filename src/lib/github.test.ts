import { describe, expect, test } from "vitest";
import { latestThcBotRunCandidateFiles, parseGitHubRepositoryUrl } from "./github";

describe("parseGitHubRepositoryUrl", () => {
  test("accepts canonical public GitHub repository URLs", () => {
    expect(parseGitHubRepositoryUrl("https://github.com/vercel/next.js")).toEqual({
      owner: "vercel",
      repo: "next.js",
      repositoryUrl: "https://github.com/vercel/next.js",
    });
  });

  test("normalizes trailing slashes and git suffixes", () => {
    expect(parseGitHubRepositoryUrl("https://github.com/Vel-Labs/thc-methodology.git/")).toEqual({
      owner: "Vel-Labs",
      repo: "thc-methodology",
      repositoryUrl: "https://github.com/Vel-Labs/thc-methodology",
    });
  });

  test("rejects non-GitHub, non-HTTPS, nested, and missing repository URLs", () => {
    expect(() => parseGitHubRepositoryUrl("http://github.com/a/b")).toThrow("Only HTTPS GitHub repository URLs are supported");
    expect(() => parseGitHubRepositoryUrl("https://gitlab.com/a/b")).toThrow("Only public GitHub repositories are supported");
    expect(() => parseGitHubRepositoryUrl("https://github.com/a/b/tree/main")).toThrow("Use the repository root URL");
    expect(() => parseGitHubRepositoryUrl("https://github.com/a")).toThrow("Enter a GitHub repository URL");
  });
});

describe("latestThcBotRunCandidateFiles", () => {
  test("resolves the latest THC-BOT run files from history", () => {
    const paths = latestThcBotRunCandidateFiles(JSON.stringify({
      artifactKind: "THC-BOT History",
      runs: [
        {
          runId: "old",
          generatedAt: "2026-05-01T00:00:00Z",
          path: "runs/old/",
        },
        {
          runId: "new",
          generatedAt: "2026-05-05T00:00:00Z",
          path: "runs/new/",
        },
      ],
    }));

    expect(paths).toContain("docs/thc/runs/new/THC-BOT.contract.json");
    expect(paths).toContain("docs/thc/runs/new/slices/uncertainty.json");
    expect(paths).not.toContain("docs/thc/runs/new/THC-BOT.html");
    expect(paths).not.toContain("docs/thc/runs/old/THC-BOT.contract.json");
  });

  test("returns no paths for invalid or missing THC-BOT history", () => {
    expect(latestThcBotRunCandidateFiles("not-json")).toEqual([]);
    expect(latestThcBotRunCandidateFiles(JSON.stringify({ artifactKind: "Other", runs: [] }))).toEqual([]);
  });
});
