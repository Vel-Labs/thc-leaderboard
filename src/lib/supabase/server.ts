import "server-only";

import { createClient } from "@supabase/supabase-js";
import { readSupabaseRuntimeConfig } from "./config";

export function getSupabaseServiceClient() {
  const config = readSupabaseRuntimeConfig();
  if (!config.enabled || !config.url || !config.secretKey) return null;

  return createClient(config.url, config.secretKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
