import { describe, expect, it } from "vitest";
import { readPublicSupabaseConfig, readSupabaseRuntimeConfig } from "./config";

describe("Supabase config", () => {
  it("defaults to disabled file storage", () => {
    expect(readSupabaseRuntimeConfig({})).toMatchObject({
      enabled: false,
      storageDriver: "file",
    });
  });

  it("enables public config when URL and publishable key are present", () => {
    expect(
      readPublicSupabaseConfig({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
      }),
    ).toMatchObject({
      enabled: true,
      url: "https://example.supabase.co",
      publishableKey: "sb_publishable_test",
    });
  });

  it("requires a server secret for Supabase-backed storage", () => {
    expect(() =>
      readSupabaseRuntimeConfig({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "sb_publishable_test",
        THC_STORAGE_DRIVER: "supabase",
      }),
    ).toThrow("SUPABASE_SECRET_KEY");
  });

  it("requires public Supabase values as a pair", () => {
    expect(() =>
      readPublicSupabaseConfig({
        NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co",
      }),
    ).toThrow("NEXT_PUBLIC_SUPABASE_URL");
  });

  it("requires public Supabase values when Supabase storage is enabled", () => {
    expect(() =>
      readSupabaseRuntimeConfig({
        SUPABASE_SECRET_KEY: "sb_secret_test",
        THC_STORAGE_DRIVER: "supabase",
      }),
    ).toThrow("NEXT_PUBLIC_SUPABASE_URL");
  });
});
