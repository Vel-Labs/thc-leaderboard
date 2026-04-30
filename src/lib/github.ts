export type GitHubRepository = {
  owner: string;
  repo: string;
  repositoryUrl: string;
};

export type InspectedRepository = GitHubRepository & {
  projectName: string;
  defaultBranch: string;
  reviewedCommitSha: string;
  files: Record<string, string | undefined>;
  inspectedFiles: string[];
};

const candidateFiles = [
  "README.md",
  "readme.md",
  "package.json",
  "pnpm-lock.yaml",
  "package-lock.json",
  "yarn.lock",
  "Makefile",
  "pyproject.toml",
  "Cargo.toml",
  "docs/README.md",
  "docs/index.md",
  "docs/ARCHITECTURE.md",
  "docs/DECISIONS.md",
  "docs/ROADMAP.md",
  "CHANGELOG.md",
  "AGENTS.md",
  "CLAUDE.md",
  ".github/workflows/ci.yml",
  ".github/workflows/test.yml",
  "docs/thc/README.md",
  "docs/thc/LOCAL_CHECK.md",
  "docs/thc/LOCAL_CHECK.provenance.json",
];

export function parseGitHubRepositoryUrl(value: string): GitHubRepository {
  let url: URL;
  try {
    url = new URL(value.trim());
  } catch {
    throw new Error("Enter a GitHub repository URL.");
  }

  if (url.protocol !== "https:" || url.hostname !== "github.com") {
    if (url.hostname !== "github.com") {
      throw new Error("Only public GitHub repositories are supported.");
    }
    throw new Error("Only HTTPS GitHub repository URLs are supported.");
  }

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 2) {
    throw new Error("Enter a GitHub repository URL with owner and repository.");
  }
  if (parts.length > 2) {
    throw new Error("Use the repository root URL, not a branch, file, issue, or pull request URL.");
  }

  const owner = parts[0];
  const repo = parts[1].replace(/\.git$/, "");
  if (!owner || !repo) {
    throw new Error("Enter a GitHub repository URL with owner and repository.");
  }

  return {
    owner,
    repo,
    repositoryUrl: `https://github.com/${owner}/${repo}`,
  };
}

export async function inspectPublicGitHubRepository(repositoryUrl: string): Promise<InspectedRepository> {
  const parsed = parseGitHubRepositoryUrl(repositoryUrl);
  const repoResponse = await githubFetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`);
  if (repoResponse.status === 404) {
    throw new Error("Repository was not found or is private.");
  }
  if (!repoResponse.ok) {
    throw new Error(`GitHub repository lookup failed with status ${repoResponse.status}.`);
  }

  const repoInfo = (await repoResponse.json()) as {
    name: string;
    private: boolean;
    default_branch: string;
  };
  if (repoInfo.private) {
    throw new Error("Private repositories are not supported in v1.");
  }

  const branchResponse = await githubFetch(
    `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/branches/${encodeURIComponent(repoInfo.default_branch)}`,
  );
  if (!branchResponse.ok) {
    throw new Error("Could not resolve the reviewed commit SHA.");
  }
  const branchInfo = (await branchResponse.json()) as { commit: { sha: string } };

  const files: Record<string, string | undefined> = {};
  await Promise.all(
    candidateFiles.map(async (path) => {
      const content = await fetchGitHubTextFile(parsed, path, branchInfo.commit.sha);
      if (content !== undefined) files[path] = content;
    }),
  );

  return {
    ...parsed,
    projectName: repoInfo.name,
    defaultBranch: repoInfo.default_branch,
    reviewedCommitSha: branchInfo.commit.sha,
    files,
    inspectedFiles: Object.keys(files).sort(),
  };
}

async function fetchGitHubTextFile(repo: GitHubRepository, path: string, ref: string) {
  const response = await githubFetch(
    `https://raw.githubusercontent.com/${repo.owner}/${repo.repo}/${ref}/${path}`,
  );
  if (response.status === 404) return undefined;
  if (!response.ok) return undefined;
  const text = await response.text();
  return text.slice(0, 60_000);
}

function githubFetch(url: string) {
  return fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "thc-leaderboard",
    },
  });
}
