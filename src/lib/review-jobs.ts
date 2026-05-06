import "server-only";

import { inspectPublicGitHubRepository, parseGitHubRepositoryUrl, type InspectedRepository } from "./github";
import { getSupabaseServiceClient } from "./supabase/server";
import { readSupabaseRuntimeConfig } from "./supabase/config";
import { createPublicReview } from "./thc/review";
import type { ReviewBatch } from "./thc/schema";

export type ReviewJobStage =
  | "queued"
  | "preview"
  | "inspect"
  | "thc_bot_handshake"
  | "evidence"
  | "local_artifacts"
  | "caps_applied"
  | "hidden_trust"
  | "next_actions"
  | "overview_synthesis"
  | "saving"
  | "completed"
  | "failed";

export type ReviewJobStatus = "queued" | "leased" | "completed" | "failed" | "cancelled";

export type ReviewJobBatch = {
  key: ReviewJobStage;
  label: string;
  state: "queued" | "running" | "completed" | "fallback" | "failed";
  completedAt: string | null;
  notes: string[];
};

export type ReviewJob = {
  id: string;
  repository_url: string;
  normalized_repository_url: string | null;
  requested_by: string | null;
  status: ReviewJobStatus;
  stage: ReviewJobStage;
  batch_status: ReviewJobBatch[];
  reviewed_commit_sha: string | null;
  default_branch: string | null;
  report_id: string | null;
  last_error: string | null;
  lease_owner: string | null;
  leased_until: string | null;
  attempts: number;
  created_at: string;
  updated_at: string;
  completed_at: string | null;
};

const runnerId = `next-api-${process.pid}`;

const initialBatches: ReviewJobBatch[] = [
  batch("preview", "Repository metadata"),
  batch("inspect", "Public files"),
  batch("thc_bot_handshake", "THC-BOT handshake"),
  batch("evidence", "Evidence"),
  batch("local_artifacts", "Local artifacts"),
  batch("caps_applied", "Caps applied"),
  batch("hidden_trust", "Hidden trust"),
  batch("next_actions", "Next actions"),
  batch("overview_synthesis", "Overview synthesis"),
  batch("saving", "Save report"),
];

export function reviewJobsEnabled() {
  return readSupabaseRuntimeConfig().enabled;
}

export function normalizeRepositoryUrl(repositoryUrl: string) {
  return parseGitHubRepositoryUrl(repositoryUrl).repositoryUrl.toLowerCase();
}

export async function createReviewJob(repositoryUrl: string, requestedBy?: string) {
  const supabase = supabaseOrThrow();
  const normalized = normalizeRepositoryUrl(repositoryUrl);
  const active = await findActiveReviewForRepository(normalized);
  if (active) return active;

  const { data, error } = await supabase
    .from("review_jobs")
    .insert({
      repository_url: repositoryUrl,
      normalized_repository_url: normalized,
      requested_by: requestedBy ?? null,
      status: "queued",
      stage: "queued",
      batch_status: initialBatches,
    })
    .select(jobSelect)
    .single();

  if (error || !data) throw new Error(error?.message ?? "Could not create review job.");
  return normalizeJob(data);
}

export async function getReviewJob(jobId: string) {
  const supabase = supabaseOrThrow();
  const { data, error } = await supabase.from("review_jobs").select(jobSelect).eq("id", jobId).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normalizeJob(data) : null;
}

export async function runReviewJob(jobId: string, requestedBy?: string) {
  const job = await leaseReviewJob(jobId);
  if (!job) return getReviewJob(jobId);

  try {
    await updateReviewJob(job.id, { stage: "preview" }, "preview", "running");
    await updateReviewJob(job.id, { stage: "inspect" }, "preview", "completed");
    await updateReviewJob(job.id, {}, "inspect", "running");
    const inspected = await inspectPublicGitHubRepository(job.repository_url);
    const normalized = normalizeRepositoryUrl(inspected.repositoryUrl);
    const existingForCommit = await findReviewForCommit(normalized, inspected.reviewedCommitSha, job.id);
    if (existingForCommit?.status === "completed" && existingForCommit.report_id) {
      await markJobCompleted(job.id, existingForCommit.report_id, inspected, "Existing completed report reused for this repository commit.");
      return getReviewJob(job.id);
    }
    if (existingForCommit && existingForCommit.status !== "completed") {
      await cancelSupersededJob(existingForCommit.id, `Superseded by retry job ${job.id} for the same repository commit.`);
    }

    await updateReviewJob(
      job.id,
      {
        normalized_repository_url: normalized,
        reviewed_commit_sha: inspected.reviewedCommitSha,
        default_branch: inspected.defaultBranch,
      },
      "inspect",
      "completed",
    );

    await updateReviewJob(job.id, { stage: "thc_bot_handshake" }, "thc_bot_handshake", "running");
    await updateReviewJob(job.id, {}, "thc_bot_handshake", "completed");

    const report = await createPublicReview(inspected.repositoryUrl, {
      submittedBy: requestedBy ?? job.requested_by ?? undefined,
      inspected,
      onBatch: (reviewBatch) => updateBatchFromReviewBatch(job.id, reviewBatch),
    });

    await updateReviewJob(job.id, { stage: "saving" }, "saving", "running");
    await markJobCompleted(job.id, report.id, inspected, "New public review completed.");
    return getReviewJob(job.id);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Review job failed.";
    await markJobFailed(job.id, message);
    throw error;
  }
}

async function findActiveReviewForRepository(normalizedRepositoryUrl: string) {
  const supabase = supabaseOrThrow();
  const { data, error } = await supabase
    .from("review_jobs")
    .select(jobSelect)
    .eq("normalized_repository_url", normalizedRepositoryUrl)
    .in("status", ["queued", "leased"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? normalizeJob(data) : null;
}

async function leaseReviewJob(jobId: string) {
  const supabase = supabaseOrThrow();
  const leaseUntil = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const existing = await getReviewJob(jobId);
  if (!existing) return null;
  if (existing.status === "completed" || existing.status === "failed" || existing.status === "cancelled") return null;
  if (existing.status === "leased" && existing.leased_until && new Date(existing.leased_until).getTime() > Date.now()) return null;

  const { data, error } = await supabase
    .from("review_jobs")
    .update({
      status: "leased",
      stage: "preview",
      lease_owner: runnerId,
      leased_until: leaseUntil,
      attempts: existing.attempts + 1,
      started_at: new Date().toISOString(),
      last_error: null,
    })
    .eq("id", jobId)
    .in("status", ["queued", "leased"])
    .select(jobSelect)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? normalizeJob(data) : null;
}

async function findReviewForCommit(normalizedRepositoryUrl: string, reviewedCommitSha: string, currentJobId: string) {
  const supabase = supabaseOrThrow();
  const { data, error } = await supabase
    .from("review_jobs")
    .select("id, status, report_id")
    .eq("normalized_repository_url", normalizedRepositoryUrl)
    .eq("reviewed_commit_sha", reviewedCommitSha)
    .in("status", ["queued", "leased", "completed"])
    .neq("id", currentJobId)
    .order("completed_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as { id: string; status: ReviewJobStatus; report_id: string | null } | null;
}

async function updateReviewJob(
  jobId: string,
  values: Record<string, unknown>,
  batchKey?: ReviewJobStage,
  batchState?: ReviewJobBatch["state"],
  note?: string,
) {
  const job = await getReviewJob(jobId);
  if (!job) throw new Error("Review job was not found.");
  const batch_status = batchKey && batchState ? updateBatch(job.batch_status, batchKey, batchState, note) : job.batch_status;
  const supabase = supabaseOrThrow();
  const { error } = await supabase.from("review_jobs").update({ ...values, batch_status }).eq("id", jobId);
  if (error) throw new Error(error.message);
}

async function updateBatchFromReviewBatch(jobId: string, reviewBatch: ReviewBatch) {
  const key = batchKeyFromReviewSlice(reviewBatch.slice);
  await updateReviewJob(jobId, { stage: key }, key, reviewBatch.state === "completed" ? "completed" : "fallback", reviewBatch.notes[0]);
}

async function markJobCompleted(jobId: string, reportId: string, inspected: InspectedRepository, note: string) {
  const normalized = normalizeRepositoryUrl(inspected.repositoryUrl);
  const job = await getReviewJob(jobId);
  if (!job) throw new Error("Review job was not found.");
  const batch_status = updateBatch(updateBatch(job.batch_status, "saving", "completed", note), "overview_synthesis", "completed");
  const supabase = supabaseOrThrow();
  const { error } = await supabase
    .from("review_jobs")
    .update({
      status: "completed",
      stage: "completed",
      normalized_repository_url: normalized,
      reviewed_commit_sha: inspected.reviewedCommitSha,
      default_branch: inspected.defaultBranch,
      completed_report_cache_key: `${normalized}@${inspected.reviewedCommitSha}`,
      report_id: reportId,
      batch_status,
      completed_at: new Date().toISOString(),
      lease_owner: null,
      leased_until: null,
    })
    .eq("id", jobId);
  if (error) throw new Error(error.message);
}

async function markJobFailed(jobId: string, message: string) {
  const job = await getReviewJob(jobId);
  const supabase = supabaseOrThrow();
  const { error } = await supabase
    .from("review_jobs")
    .update({
      status: "failed",
      stage: "failed",
      last_error: message,
      batch_status: job ? updateBatch(job.batch_status, job.stage, "failed", message) : initialBatches,
      lease_owner: null,
      leased_until: null,
    })
    .eq("id", jobId);
  if (error) throw new Error(error.message);
}

async function cancelSupersededJob(jobId: string, message: string) {
  const job = await getReviewJob(jobId);
  const supabase = supabaseOrThrow();
  const { error } = await supabase
    .from("review_jobs")
    .update({
      status: "cancelled",
      stage: "failed",
      last_error: message,
      batch_status: job ? updateBatch(job.batch_status, job.stage, "failed", message) : initialBatches,
      lease_owner: null,
      leased_until: null,
    })
    .eq("id", jobId);
  if (error) throw new Error(error.message);
}

function updateBatch(batches: ReviewJobBatch[], key: ReviewJobStage, state: ReviewJobBatch["state"], note?: string) {
  return batches.map((item) => item.key === key
    ? {
        ...item,
        state,
        completedAt: state === "completed" || state === "fallback" || state === "failed" ? new Date().toISOString() : item.completedAt,
        notes: note ? [...item.notes, note] : item.notes,
      }
    : item);
}

function batchKeyFromReviewSlice(slice: ReviewBatch["slice"]): ReviewJobStage {
  if (slice === "local-artifacts") return "local_artifacts";
  if (slice === "caps-applied") return "caps_applied";
  if (slice === "hidden-trust") return "hidden_trust";
  if (slice === "next-actions") return "next_actions";
  if (slice === "overview-synthesis") return "overview_synthesis";
  return "evidence";
}

function batch(key: ReviewJobStage, label: string): ReviewJobBatch {
  return {
    key,
    label,
    state: "queued",
    completedAt: null,
    notes: [],
  };
}

const jobSelect = "id, repository_url, normalized_repository_url, requested_by, status, stage, batch_status, reviewed_commit_sha, default_branch, report_id, last_error, lease_owner, leased_until, attempts, created_at, updated_at, completed_at";

function normalizeJob(data: Record<string, unknown>): ReviewJob {
  return {
    id: stringValue(data.id),
    repository_url: stringValue(data.repository_url),
    normalized_repository_url: nullableString(data.normalized_repository_url),
    requested_by: nullableString(data.requested_by),
    status: stringValue(data.status) as ReviewJobStatus,
    stage: stringValue(data.stage) as ReviewJobStage,
    batch_status: normalizeBatches(data.batch_status),
    reviewed_commit_sha: nullableString(data.reviewed_commit_sha),
    default_branch: nullableString(data.default_branch),
    report_id: nullableString(data.report_id),
    last_error: nullableString(data.last_error),
    lease_owner: nullableString(data.lease_owner),
    leased_until: nullableString(data.leased_until),
    attempts: numberValue(data.attempts),
    created_at: stringValue(data.created_at),
    updated_at: stringValue(data.updated_at),
    completed_at: nullableString(data.completed_at),
  };
}

function normalizeBatches(value: unknown) {
  if (!Array.isArray(value)) return initialBatches;
  return value.map((item) => {
    const row = item as Partial<ReviewJobBatch>;
    return {
      key: row.key ?? "queued",
      label: row.label ?? String(row.key ?? "Queued"),
      state: row.state ?? "queued",
      completedAt: row.completedAt ?? null,
      notes: Array.isArray(row.notes) ? row.notes.filter((note): note is string => typeof note === "string") : [],
    };
  });
}

function supabaseOrThrow() {
  const supabase = getSupabaseServiceClient();
  if (!supabase) throw new Error("Supabase review job storage is not configured.");
  return supabase;
}

function stringValue(value: unknown) {
  if (typeof value === "string" && value.trim()) return value;
  throw new Error("Review job row is missing a required string field.");
}

function nullableString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function numberValue(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
