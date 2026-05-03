"use client";

export const browserAuthStorageKey = "thc-leaderboard.supabase.auth";

export const browserAuthPolicy = {
  autoRefreshToken: true,
  detectSessionInUrl: true,
  flowType: "pkce" as const,
  persistSession: true,
  storageKey: browserAuthStorageKey,
};
