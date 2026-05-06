export type GitHubRepository = {
  owner: string;
  repo: string;
  repositoryUrl: string;
};

export type InspectedRepository = GitHubRepository & {
  projectName: string;
  ownerAvatarUrl: string;
  defaultBranch: string;
  description: string | null;
  stars: number;
  forks: number;
  openIssues: number;
  reviewedCommitSha: string;
  files: Record<string, string | undefined>;
  inspectedFiles: string[];
};

export type RepositoryPreview = GitHubRepository & {
  projectName: string;
  ownerAvatarUrl: string;
  defaultBranch: string;
  description: string | null;
  stars: number;
  forks: number;
  openIssues: number;
};

export type RepositoryRevision = RepositoryPreview & {
  reviewedCommitSha: string;
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
  "docs/thc/THC-BOT.md",
  "docs/thc/THC-BOT.history.json",
  "docs/thc/THC-BOT.html",
];

const thcBotRunFiles = [
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

const defaultGitHubFetchTimeoutMs = 8_000;

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
  const preview = await previewPublicGitHubRepository(repositoryUrl);
  const parsed = {
    owner: preview.owner,
    repo: preview.repo,
    repositoryUrl: preview.repositoryUrl,
  };
  const repoInfo = {
    name: preview.projectName,
    owner: { avatar_url: preview.ownerAvatarUrl },
    default_branch: preview.defaultBranch,
    description: preview.description,
    stargazers_count: preview.stars,
    forks_count: preview.forks,
    open_issues_count: preview.openIssues,
  };

  const branchResponse = await githubFetch(
    `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/branches/${encodeURIComponent(repoInfo.default_branch)}`,
  );
  if (!branchResponse.ok) {
    throw new Error(githubErrorMessage(branchResponse, "Could not resolve the reviewed commit SHA."));
  }
  const branchInfo = (await branchResponse.json()) as { commit: { sha: string } };

  const files: Record<string, string | undefined> = {};
  await Promise.all(
    candidateFiles.map(async (path) => {
      const content = await fetchGitHubTextFile(parsed, path, branchInfo.commit.sha);
      if (content !== undefined) files[path] = content;
    }),
  );
  await Promise.all(
    latestThcBotRunCandidateFiles(files["docs/thc/THC-BOT.history.json"]).map(async (path) => {
      const content = await fetchGitHubTextFile(parsed, path, branchInfo.commit.sha);
      if (content !== undefined) files[path] = content;
    }),
  );

  return {
    ...parsed,
    projectName: repoInfo.name,
    ownerAvatarUrl: repoInfo.owner.avatar_url,
    defaultBranch: repoInfo.default_branch,
    description: repoInfo.description,
    stars: repoInfo.stargazers_count,
    forks: repoInfo.forks_count,
    openIssues: repoInfo.open_issues_count,
    reviewedCommitSha: branchInfo.commit.sha,
    files,
    inspectedFiles: Object.keys(files).sort(),
  };
}

export async function resolvePublicGitHubRepositoryRevision(repositoryUrl: string): Promise<RepositoryRevision> {
  const preview = await previewPublicGitHubRepository(repositoryUrl);
  const branchResponse = await githubFetch(
    `https://api.github.com/repos/${preview.owner}/${preview.repo}/branches/${encodeURIComponent(preview.defaultBranch)}`,
  );
  if (!branchResponse.ok) {
    throw new Error(githubErrorMessage(branchResponse, "Could not resolve the reviewed commit SHA."));
  }
  const branchInfo = (await branchResponse.json()) as { commit: { sha: string } };
  return {
    ...preview,
    reviewedCommitSha: branchInfo.commit.sha,
  };
}

export function latestThcBotRunCandidateFiles(historyText: string | undefined) {
  if (!historyText) return [];
  let history: { artifactKind?: unknown; runs?: unknown };
  try {
    history = JSON.parse(historyText);
  } catch {
    return [];
  }
  if (history.artifactKind !== "THC-BOT History" || !Array.isArray(history.runs)) return [];
  const latest = history.runs
    .filter((run): run is Record<string, unknown> => Boolean(run) && typeof run === "object" && !Array.isArray(run))
    .sort((a, b) => stringValue(b.generatedAt)?.localeCompare(stringValue(a.generatedAt) ?? "") ?? 0)[0];
  const runPath = normalizeThcBotRunPath(stringValue(latest?.path) ?? (stringValue(latest?.runId) ? `runs/${stringValue(latest?.runId)}/` : null));
  if (!runPath) return [];
  const root = `docs/thc/${runPath}`.replace(/\/$/, "");
  return thcBotRunFiles.map((path) => `${root}/${path}`);
}

export async function previewPublicGitHubRepository(repositoryUrl: string): Promise<RepositoryPreview> {
  const parsed = parseGitHubRepositoryUrl(repositoryUrl);
  const repoResponse = await githubFetch(`https://api.github.com/repos/${parsed.owner}/${parsed.repo}`);
  if (repoResponse.status === 404) {
    throw new Error("Repository was not found or is private.");
  }
  if (!repoResponse.ok) {
    throw new Error(githubErrorMessage(repoResponse, "GitHub repository lookup failed."));
  }

  const repoInfo = (await repoResponse.json()) as {
    name: string;
    owner: { avatar_url: string };
    private: boolean;
    default_branch: string;
    description: string | null;
    stargazers_count: number;
    forks_count: number;
    open_issues_count: number;
  };
  if (repoInfo.private) {
    throw new Error("Private repositories are not supported in v1.");
  }

  return {
    ...parsed,
    projectName: repoInfo.name,
    ownerAvatarUrl: repoInfo.owner.avatar_url,
    defaultBranch: repoInfo.default_branch,
    description: repoInfo.description,
    stars: repoInfo.stargazers_count,
    forks: repoInfo.forks_count,
    openIssues: repoInfo.open_issues_count,
  };
}

async function fetchGitHubTextFile(repo: GitHubRepository, path: string, ref: string) {
  const response = await githubFetch(
    `https://raw.githubusercontent.com/${repo.owner}/${repo.repo}/${ref}/${path}`,
  );
  if (response.status === 404) return undefined;
  if (response.status === 403 || response.status === 429) {
    throw new Error(githubErrorMessage(response, "GitHub file fetch was rate limited."));
  }
  if (!response.ok) return undefined;
  const text = await response.text();
  return text.slice(0, 60_000);
}

async function githubFetch(url: string) {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "User-Agent": "thc-leaderboard",
  };
  const token = process.env.GITHUB_TOKEN?.trim();
  if (token && new URL(url).hostname === "api.github.com") {
    headers.Authorization = `Bearer ${token}`;
  }

  try {
    return await fetch(url, {
      cache: "no-store",
      headers,
      signal: AbortSignal.timeout(githubFetchTimeoutMs()),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new Error("GitHub request timed out.");
    }
    throw error;
  }
}

function githubFetchTimeoutMs() {
  const parsed = Number(process.env.THC_GITHUB_FETCH_TIMEOUT_MS ?? defaultGitHubFetchTimeoutMs);
  return Number.isFinite(parsed) && parsed >= 1_000 ? Math.floor(parsed) : defaultGitHubFetchTimeoutMs;
}

function githubErrorMessage(response: Response, fallback: string) {
  if (response.status === 403 || response.status === 429) {
    const reset = response.headers.get("x-ratelimit-reset");
    const suffix = reset ? ` Rate limit resets at ${new Date(Number(reset) * 1000).toISOString()}.` : "";
    return `GitHub rate limit reached or request was blocked.${suffix}`;
  }
  return `${fallback} GitHub returned status ${response.status}.`;
}

function normalizeThcBotRunPath(value: string | null) {
  if (!value) return null;
  const trimmed = value.replace(/^\/+/, "").replace(/\.\./g, "").replace(/^docs\/thc\//, "");
  return trimmed.endsWith("/") ? trimmed : `${trimmed}/`;
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}
