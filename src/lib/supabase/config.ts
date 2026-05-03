import { z } from "zod";

const publicSupabaseEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional().or(z.literal("")),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1).optional().or(z.literal("")),
});

const serverSupabaseEnvSchema = publicSupabaseEnvSchema.extend({
  SUPABASE_SECRET_KEY: z.string().min(1).optional().or(z.literal("")),
  THC_STORAGE_DRIVER: z.enum(["file", "supabase"]).default("file"),
  THC_REVIEW_WORKER_SHARED_SECRET: z.string().min(24).optional().or(z.literal("")),
});

export type SupabaseRuntimeConfig = {
  enabled: boolean;
  storageDriver: "file" | "supabase";
  url?: string;
  publishableKey?: string;
  secretKey?: string;
  workerSharedSecret?: string;
};

export function readSupabaseRuntimeConfig(env = process.env): SupabaseRuntimeConfig {
  const parsed = serverSupabaseEnvSchema.parse(env);
  const url = normalize(parsed.NEXT_PUBLIC_SUPABASE_URL);
  const publishableKey = normalize(parsed.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  const secretKey = normalize(parsed.SUPABASE_SECRET_KEY);
  const workerSharedSecret = normalize(parsed.THC_REVIEW_WORKER_SHARED_SECRET);
  const enabled = Boolean(url && publishableKey);

  if (Boolean(url) !== Boolean(publishableKey)) {
    throw new Error("Supabase configuration requires both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  }

  if (parsed.THC_STORAGE_DRIVER === "supabase" && (!url || !publishableKey || !secretKey)) {
    throw new Error("THC_STORAGE_DRIVER=supabase requires NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, and SUPABASE_SECRET_KEY.");
  }

  return {
    enabled,
    storageDriver: parsed.THC_STORAGE_DRIVER,
    url,
    publishableKey,
    secretKey,
    workerSharedSecret,
  };
}

export function readPublicSupabaseConfig(env = process.env) {
  const parsed = publicSupabaseEnvSchema.parse(env);
  const url = normalize(parsed.NEXT_PUBLIC_SUPABASE_URL);
  const publishableKey = normalize(parsed.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY);
  if (Boolean(url) !== Boolean(publishableKey)) {
    throw new Error("Supabase browser configuration requires both NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.");
  }
  return {
    enabled: Boolean(url && publishableKey),
    url,
    publishableKey,
  };
}

function normalize(value: string | undefined) {
  return value && value.trim().length ? value.trim() : undefined;
}
