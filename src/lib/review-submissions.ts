import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseServiceClient } from "./supabase/server";
import { readSupabaseRuntimeConfig } from "./supabase/config";

type ReviewRequester = {
  userId?: string;
};

const reviewWindowMs = 60 * 60 * 1000;
const reviewAttempts = new Map<string, number[]>();

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

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) {
    throw new ReviewSubmissionError("Sign in with GitHub before submitting public reviews.", 401);
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    throw new ReviewSubmissionError("Your GitHub session expired. Sign in again before submitting reviews.", 401);
  }

  await enforceSupabaseReviewLimit(supabase, data.user.id, repositoryUrl);
  return { userId: data.user.id };
}

export class ReviewSubmissionError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

function rateLimit(key: string, limit: number) {
  const now = Date.now();
  const fresh = (reviewAttempts.get(key) ?? []).filter((timestamp) => now - timestamp < reviewWindowMs);
  if (fresh.length >= limit) {
    throw new ReviewSubmissionError("Review submission limit reached. Try again later.", 429);
  }
  fresh.push(now);
  reviewAttempts.set(key, fresh);
}

function reviewLimitPerHour() {
  const parsed = Number(process.env.THC_REVIEW_RATE_LIMIT_PER_HOUR ?? 4);
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 4;
}

async function enforceSupabaseReviewLimit(supabase: SupabaseClient, userId: string, repositoryUrl: string) {
  const windowStart = new Date(Date.now() - reviewWindowMs).toISOString();
  const { count, error: countError } = await supabase
    .from("review_submissions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("created_at", windowStart);

  if (countError) {
    throw new ReviewSubmissionError("Could not check review submission limit.", 503);
  }

  if ((count ?? 0) >= reviewLimitPerHour()) {
    throw new ReviewSubmissionError("Review submission limit reached. Try again later.", 429);
  }

  const { error: insertError } = await supabase.from("review_submissions").insert({
    user_id: userId,
    repository_url: repositoryUrl,
  });

  if (insertError) {
    throw new ReviewSubmissionError("Could not record review submission.", 503);
  }
}

function clientAddress(request: Request) {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
}
