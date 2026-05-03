import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServiceClient } from "./supabase/server";
import { readSupabaseRuntimeConfig } from "./supabase/config";

type ReviewRequester = {
  userId?: string;
  githubLogin?: string;
  localRateLimitKey?: string;
  rateLimitBypassed?: boolean;
};

const reviewWindowMs = 60 * 60 * 1000;
const reviewAttempts = new Map<string, number[]>();
const previewAttempts = new Map<string, number[]>();

export async function authorizeReviewSubmission(request: Request): Promise<ReviewRequester> {
  const config = readSupabaseRuntimeConfig();
  if (!config.enabled) {
    const localRateLimitKey = `local:${clientAddress(request)}`;
    checkRateLimit(localRateLimitKey, 8);
    return { localRateLimitKey };
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    throw new ReviewSubmissionError("Supabase server config is missing.", 503);
  }

  const user = await requireSupabaseUser(request, supabase);
  if (isRateLimitBypassed(user.githubLogin)) {
    return { userId: user.id, githubLogin: user.githubLogin, rateLimitBypassed: true };
  }

  await enforceSupabaseReviewLimit(supabase, user.id);
  return { userId: user.id, githubLogin: user.githubLogin };
}

export async function recordSuccessfulReviewSubmission(requester: ReviewRequester, repositoryUrl: string) {
  if (requester.rateLimitBypassed) return;

  const config = readSupabaseRuntimeConfig();
  if (!config.enabled) {
    if (requester.localRateLimitKey) recordLocalReviewSuccess(requester.localRateLimitKey);
    return;
  }

  if (!requester.userId) return;

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    throw new ReviewSubmissionError("Supabase server config is missing.", 503);
  }

  const { error } = await supabase.from("review_submissions").insert({
    repository_url: repositoryUrl,
    user_id: requester.userId,
  });

  if (error) {
    throw new ReviewSubmissionError("Could not record review submission.", 503);
  }
}

export async function authorizeRepositoryPreview(request: Request): Promise<ReviewRequester> {
  const config = readSupabaseRuntimeConfig();
  if (!config.enabled) {
    rateLimit(`preview-local:${clientAddress(request)}`, 30, previewAttempts);
    return {};
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    throw new ReviewSubmissionError("Supabase server config is missing.", 503);
  }

  const user = await requireSupabaseUser(request, supabase);
  if (!isRateLimitBypassed(user.githubLogin)) {
    rateLimit(`preview-user:${user.id}`, previewLimitPerHour(), previewAttempts);
  }
  return { userId: user.id, githubLogin: user.githubLogin, rateLimitBypassed: isRateLimitBypassed(user.githubLogin) };
}

export class ReviewSubmissionError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

function rateLimit(key: string, limit: number, store = reviewAttempts) {
  const now = Date.now();
  const fresh = (store.get(key) ?? []).filter((timestamp) => now - timestamp < reviewWindowMs);
  if (fresh.length >= limit) {
    throw new ReviewSubmissionError("Review submission limit reached. Try again later.", 429);
  }
  fresh.push(now);
  store.set(key, fresh);
}

function checkRateLimit(key: string, limit: number, store = reviewAttempts) {
  const now = Date.now();
  const fresh = (store.get(key) ?? []).filter((timestamp) => now - timestamp < reviewWindowMs);
  if (fresh.length >= limit) {
    throw new ReviewSubmissionError("Review submission limit reached. Try again later.", 429);
  }
  store.set(key, fresh);
}

function recordLocalReviewSuccess(key: string) {
  const now = Date.now();
  const fresh = (reviewAttempts.get(key) ?? []).filter((timestamp) => now - timestamp < reviewWindowMs);
  fresh.push(now);
  reviewAttempts.set(key, fresh);
}

function reviewLimitPerHour() {
  const parsed = Number(process.env.THC_REVIEW_RATE_LIMIT_PER_HOUR ?? 4);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 4;
}

async function enforceSupabaseReviewLimit(supabase: SupabaseClient, userId: string) {
  const cutoff = new Date(Date.now() - reviewWindowMs).toISOString();
  const { count, error } = await supabase
    .from("review_submissions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", cutoff);

  if (error) {
    throw new ReviewSubmissionError("Could not check review submission limit.", 503);
  }

  if ((count ?? 0) >= reviewLimitPerHour()) {
    throw new ReviewSubmissionError("Review submission limit reached. Try again later.", 429);
  }
}

async function requireSupabaseUser(request: Request, supabase: SupabaseClient) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    throw new ReviewSubmissionError("Sign in with GitHub before submitting public reviews.", 401);
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    throw new ReviewSubmissionError("Your GitHub session expired. Sign in again before submitting reviews.", 401);
  }
  return {
    id: data.user.id,
    githubLogin: githubLoginFromMetadata(data.user.user_metadata),
  };
}

function previewLimitPerHour() {
  const parsed = Number(process.env.THC_PREVIEW_RATE_LIMIT_PER_HOUR ?? 30);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 30;
}

function clientAddress(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}

function isRateLimitBypassed(githubLogin?: string) {
  if (!githubLogin) return false;
  return reviewRateLimitBypassLogins().has(githubLogin.toLowerCase());
}

function reviewRateLimitBypassLogins() {
  return new Set(
    ["velcrafting", ...(process.env.THC_REVIEW_RATE_LIMIT_BYPASS_GITHUB_LOGINS ?? "").split(",")]
      .map((login) => login.trim().toLowerCase())
      .filter(Boolean),
  );
}

function githubLoginFromMetadata(metadata: Record<string, unknown>) {
  return stringValue(metadata.user_name) ?? stringValue(metadata.preferred_username) ?? stringValue(metadata.name);
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim().length ? value.trim() : undefined;
}
