const submittedReposKey = "thc-submitted-repositories";

function normalizeRepositoryUrl(value: string) {
  try {
    const url = new URL(value);
    const pathname = url.pathname.replace(/\/+$/, "").replace(/\.git$/, "");
    return `${url.origin}${pathname}`.toLowerCase();
  } catch {
    return value.trim().toLowerCase();
  }
}

export function rememberSubmittedRepository(repositoryUrl: string) {
  if (typeof window === "undefined") return;
  const normalized = normalizeRepositoryUrl(repositoryUrl);
  const current = readSubmittedRepositories();
  const next = [normalized, ...current.filter((entry) => entry !== normalized)].slice(0, 25);
  window.localStorage.setItem(submittedReposKey, JSON.stringify(next));
}

export function readSubmittedRepositories() {
  if (typeof window === "undefined") return [] as string[];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(submittedReposKey) ?? "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((value): value is string => typeof value === "string");
  } catch {
    return [];
  }
}

export function repositoryWasSubmitted(repositoryUrl: string, submitted = readSubmittedRepositories()) {
  return submitted.includes(normalizeRepositoryUrl(repositoryUrl));
}
