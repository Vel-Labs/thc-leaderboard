import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServiceClient } from "./supabase/server";
import { readSupabaseRuntimeConfig } from "./supabase/config";

type ReviewRequester = {
  userId?: string;
};

const reviewWindowMs = 60 * 60 * 1000;
const reviewAttempts = new Map<string, number[]>();
const previewAttempts = new Map<string, number[]>();

export async function authorizeReviewSubmission(request: Request, repositoryUrl: string): Promise<ReviewRequester> {
  const config = readSupabaseRuntimeConfig();
  if (!config.enabled) {
    rateLimit(`local:${clientAddress(request)}`, 8);
    return {};
  }

  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    throw new ReviewSubmissionError("Supabase server config is missing.", 503);
  }

  const userId = await requireSupabaseUser(request, supabase);

  await enforceSupabaseReviewLimit(supabase, userId, repositoryUrl);
  return { userId };
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

  const userId = await requireSupabaseUser(request, supabase);
  rateLimit(`preview-user:${userId}`, previewLimitPerHour(), previewAttempts);
  return { userId };
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

function reviewLimitPerHour() {
  const parsed = Number(process.env.THC_REVIEW_RATE_LIMIT_PER_HOUR ?? 4);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 4;
}

async function enforceSupabaseReviewLimit(supabase: SupabaseClient, userId: string, repositoryUrl: string) {
  const { error } = await supabase.rpc("register_review_submission", {
    p_limit: reviewLimitPerHour(),
    p_repository_url: repositoryUrl,
    p_user_id: userId,
    p_window_seconds: Math.floor(reviewWindowMs / 1000),
  });

  if (error?.message.includes("review_submission_limit_exceeded")) {
    throw new ReviewSubmissionError("Review submission limit reached. Try again later.", 429);
  }

  if (error) {
    throw new ReviewSubmissionError("Could not record review submission.", 503);
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
  return data.user.id;
}

function previewLimitPerHour() {
  const parsed = Number(process.env.THC_PREVIEW_RATE_LIMIT_PER_HOUR ?? 30);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 30;
}

function clientAddress(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
