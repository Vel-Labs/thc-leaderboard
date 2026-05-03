import type { THCReport } from "@/lib/thc/schema";

export function repositoryMeta(report: THCReport) {
  const parsed = parseGitHubUrl(report.repositoryUrl);
  const owner = report.repositoryOwner ?? parsed.owner;
  const repo = report.repositoryName ?? parsed.repo ?? report.projectName;

  return {
    owner,
    repo,
    ownerUrl: owner ? `https://github.com/${owner}` : report.repositoryUrl,
    ownerAvatarUrl: report.repositoryOwnerAvatarUrl ?? (owner ? `https://github.com/${owner}.png?size=96` : undefined),
    repoUrl: report.repositoryUrl,
    stars: report.repositoryStars,
    forks: report.repositoryForks,
    openIssues: report.repositoryOpenIssues,
    description: report.repositoryDescription,
    defaultBranch: report.defaultBranch,
  };
}

function parseGitHubUrl(repositoryUrl: string) {
  try {
    const url = new URL(repositoryUrl);
    const [owner, repo] = url.pathname.split("/").filter(Boolean);
    return { owner, repo: repo?.replace(/\.git$/, "") };
  } catch {
    return { owner: undefined, repo: undefined };
  }
}
