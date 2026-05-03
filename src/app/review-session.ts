"use client";

import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

export async function reviewRequestHeaders() {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const supabase = getBrowserSupabaseClient();
  if (!supabase) return headers;

  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}
