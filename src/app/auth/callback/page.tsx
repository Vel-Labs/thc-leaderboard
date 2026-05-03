"use client";

import { useEffect } from "react";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

export default function AuthCallbackPage() {
  useEffect(() => {
    let cancelled = false;

    async function finishSignIn() {
      const supabase = getBrowserSupabaseClient();
      if (!supabase) {
        window.location.replace("/?auth=supabase-browser-not-configured");
        return;
      }

      const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const code = new URLSearchParams(window.location.search).get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          window.location.replace(`/?auth=${encodeURIComponent(error.message)}`);
          return;
        }
      } else if (accessToken && refreshToken) {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        if (error) {
          window.location.replace(`/?auth=${encodeURIComponent(error.message)}`);
          return;
        }
      } else {
        window.location.replace("/?auth=missing-auth-callback-token");
        return;
      }

      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        window.location.replace(`/?auth=${encodeURIComponent(error?.message ?? "missing-user")}`);
        return;
      }

      if (!cancelled) {
        window.history.replaceState(null, "", "/auth/callback");
        window.location.replace("/?auth=signed-in");
      }
    }

    finishSignIn();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f1e8] px-4 text-zinc-950">
      <div className="rounded-sm border border-stone-300 bg-[#fff8e8] px-5 py-4 text-sm shadow-[0_18px_55px_rgba(68,64,60,0.12)]">
        Connecting GitHub...
      </div>
    </main>
  );
}
