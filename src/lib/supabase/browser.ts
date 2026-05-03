"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { browserAuthPolicy } from "./auth-policy";

let browserClient: SupabaseClient | null = null;

export function getBrowserSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) return null;

  browserClient ??= createClient(url, publishableKey, {
    auth: browserAuthPolicy,
  });

  return browserClient;
}
