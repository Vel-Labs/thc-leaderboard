import "server-only";

import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { readSupabaseRuntimeConfig } from "./supabase/config";
import { getSupabaseServiceClient } from "./supabase/server";
import { reportSchema, type THCReport } from "./thc/schema";

const reportsDir = path.join(process.cwd(), "data", "reports");

type SaveReportOptions = {
  submittedBy?: string;
};

export async function saveReport(report: THCReport, options: SaveReportOptions = {}) {
  if (storageDriver() === "supabase") {
    return saveSupabaseReport(report, options);
  }

  await mkdir(reportsDir, { recursive: true });
  const parsed = reportSchema.parse(report);
  await writeFile(path.join(reportsDir, `${parsed.id}.json`), JSON.stringify(parsed, null, 2));
  return parsed;
}

export async function getReport(id: string) {
  if (storageDriver() === "supabase") {
    return getSupabaseReport(id);
  }

  try {
    const text = await readFile(path.join(reportsDir, `${id}.json`), "utf8");
    return reportSchema.parse(JSON.parse(text));
  } catch {
    return null;
  }
}

export async function listReports(limit = 25) {
  if (storageDriver() === "supabase") {
    return listSupabaseReports(limit);
  }

  try {
    const names = await readdir(reportsDir);
    const reports = await Promise.all(
      names
        .filter((name) => name.endsWith(".json"))
        .map((name) => getReport(name.replace(/\.json$/, ""))),
    );
    return reports
      .filter((report): report is THCReport => Boolean(report))
      .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt))
      .slice(0, limit);
  } catch {
    return [];
  }
}

function storageDriver() {
  return readSupabaseRuntimeConfig().storageDriver;
}

async function saveSupabaseReport(report: THCReport, options: SaveReportOptions) {
  const parsed = reportSchema.parse(report);
  const supabase = getSupabaseServiceClient();
  if (!supabase) throw new Error("Supabase storage is configured but SUPABASE_SECRET_KEY is missing.");

  const githubOwner = parsed.repositoryOwner ?? ownerFromRepositoryUrl(parsed.repositoryUrl);
  const githubRepo = parsed.repositoryName ?? repoFromRepositoryUrl(parsed.repositoryUrl);
  const ownerUrl = `https://github.com/${githubOwner}`;

  const { data: owner, error: ownerError } = await supabase
    .from("owners")
    .upsert(
      {
        github_login: githubOwner,
        github_url: ownerUrl,
        avatar_url: parsed.repositoryOwnerAvatarUrl ?? null,
        updated_at: parsed.generatedAt,
      },
      { onConflict: "github_login" },
    )
    .select("id")
    .single();
  if (ownerError || !owner) throw new Error(ownerError?.message ?? "Could not save repository owner.");

  const { data: repository, error: repositoryError } = await supabase
    .from("repositories")
    .upsert(
      {
        owner_id: owner.id,
        github_owner: githubOwner,
        github_repo: githubRepo,
        repository_url: parsed.repositoryUrl,
        default_branch: parsed.defaultBranch ?? null,
        description: parsed.repositoryDescription ?? null,
        stars_count: parsed.repositoryStars,
        forks_count: parsed.repositoryForks,
        open_issues_count: parsed.repositoryOpenIssues,
        last_reviewed_commit_sha: parsed.reviewedCommitSha,
        updated_at: parsed.generatedAt,
      },
      { onConflict: "repository_url" },
    )
    .select("id")
    .single();
  if (repositoryError || !repository) throw new Error(repositoryError?.message ?? "Could not save repository.");

  const { error: reportError } = await supabase.from("reports").upsert(
    {
      id: parsed.id,
      repository_id: repository.id,
      submitted_by: options.submittedBy ?? null,
      project_name: parsed.projectName,
      repository_url: parsed.repositoryUrl,
      reviewed_commit_sha: parsed.reviewedCommitSha,
      generated_at: parsed.generatedAt,
      rubric_version: parsed.rubricVersion,
      review_label: parsed.reviewLabel,
      recommended_level: parsed.recommendedLevel,
      total_score: parsed.totalScore,
      confidence: parsed.confidence,
      truth_score: categoryScore(parsed, "Truth"),
      hardening_score: categoryScore(parsed, "Hardening"),
      clarity_score: categoryScore(parsed, "Clarity"),
      audit_history_score: categoryScore(parsed, "Audit History"),
      top_strength: parsed.topStrength,
      top_hidden_trust_finding: parsed.topHiddenTrustFinding,
      report: parsed,
    },
    { onConflict: "id" },
  );
  if (reportError) throw new Error(reportError.message);

  const { error: eventError } = await supabase.from("report_events").insert({
    repository_id: repository.id,
    report_id: parsed.id,
    event_type: "completed",
    message: `Automated Public Review completed for ${githubOwner}/${githubRepo}.`,
  });
  if (eventError) throw new Error(eventError.message);

  return parsed;
}

async function getSupabaseReport(id: string) {
  const supabase = getSupabaseServiceClient();
  if (!supabase) throw new Error("Supabase storage is configured but SUPABASE_SECRET_KEY is missing.");

  const { data, error } = await supabase.from("reports").select("report").eq("id", id).maybeSingle();
  if (error) throw new Error(`Could not read report from Supabase: ${error.message}`);
  if (!data?.report) return null;
  return reportSchema.parse(data.report);
}

async function listSupabaseReports(limit: number) {
  const supabase = getSupabaseServiceClient();
  if (!supabase) throw new Error("Supabase storage is configured but SUPABASE_SECRET_KEY is missing.");

  const { data, error } = await supabase
    .from("reports")
    .select("report")
    .order("generated_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`Could not list reports from Supabase: ${error.message}`);
  if (!data) return [];
  return data.map((row) => reportSchema.parse(row.report));
}

function categoryScore(report: THCReport, category: "Truth" | "Hardening" | "Clarity" | "Audit History") {
  return report.evidenceTable.find((row) => row.category === category)?.score ?? 0;
}

function ownerFromRepositoryUrl(repositoryUrl: string) {
  return new URL(repositoryUrl).pathname.split("/").filter(Boolean)[0] ?? "unknown";
}

function repoFromRepositoryUrl(repositoryUrl: string) {
  return new URL(repositoryUrl).pathname.split("/").filter(Boolean)[1] ?? "unknown";
}
