import { describe, expect, test } from "vitest";
import { parseGitHubRepositoryUrl } from "./github";

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
