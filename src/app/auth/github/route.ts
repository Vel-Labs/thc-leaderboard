import { NextResponse } from "next/server";
import { readSupabaseRuntimeConfig } from "@/lib/supabase/config";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  const config = readSupabaseRuntimeConfig();
  const requestOrigin = new URL(request.url).origin;
  const origin = config.siteUrl ?? requestOrigin;

  if (!config.enabled || !config.url) {
    const fallback = new URL("/", requestOrigin);
    fallback.searchParams.set("auth", "supabase-not-configured");
    return NextResponse.redirect(fallback);
  }

  const authorizeUrl = new URL("/auth/v1/authorize", config.url);
  authorizeUrl.searchParams.set("provider", "github");
  authorizeUrl.searchParams.set("redirect_to", `${origin}/auth/callback`);

  return NextResponse.redirect(authorizeUrl);
}
