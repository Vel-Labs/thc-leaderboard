"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { AvatarWithDankAccessories, defaultProfileAccessoryLoadouts, readAccessoryLoadouts, type ProfileAccessoryLoadouts } from "./avatar-cosmetics";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

type GitHubProfile = {
  login: string;
  displayName: string;
  avatarUrl?: string;
};

export function GitHubSignInButton({ mode }: { mode: "clarity" | "dank" }) {
  const [profile, setProfile] = useState<GitHubProfile | null>(null);
  const [loadouts, setLoadouts] = useState<ProfileAccessoryLoadouts>(defaultProfileAccessoryLoadouts);

  useEffect(() => {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) return;

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setProfile(session?.user ? profileFromUser(session.user) : null);
      cleanOAuthHash();
    });

    recoverHashSession().then(() => supabase.auth.getUser()).then(({ data: userData }) => {
      setProfile(userData.user ? profileFromUser(userData.user) : null);
      cleanOAuthHash();
    });

    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const hydrationId = window.setTimeout(() => setLoadouts(readAccessoryLoadouts()), 0);
    const onLoadoutsChange = (event: Event) => {
      setLoadouts((event as CustomEvent<ProfileAccessoryLoadouts>).detail);
    };
    window.addEventListener("thc-accessory-loadouts-change", onLoadoutsChange);
    return () => {
      window.clearTimeout(hydrationId);
      window.removeEventListener("thc-accessory-loadouts-change", onLoadoutsChange);
    };
  }, []);

  if (profile) {
    const base =
      mode === "dank"
        ? "inline-flex min-w-[172px] items-center justify-center gap-2 whitespace-nowrap border border-lime-300/55 bg-lime-300/12 px-3 py-1.5 text-xs font-black uppercase text-lime-100 shadow-[0_0_16px_rgba(190,242,100,0.18)] hover:border-cyan-300"
        : "inline-flex items-center justify-center gap-2 rounded-full border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-900 shadow-sm hover:border-emerald-500";
    return (
      <Link href="/profile" title={`Connected as ${profile.login}`} className={base}>
        <AvatarWithDankAccessories avatarUrl={profile.avatarUrl} alt={`${profile.login} avatar`} mode={mode} accessories={loadouts[mode]} size="sm" />
        <span className={mode === "dank" ? "h-5 w-px bg-lime-300/35" : "h-5 w-px bg-emerald-300"} aria-hidden />
        <span className="max-w-[128px] truncate">{profile.displayName}</span>
      </Link>
    );
  }

  return (
    <a
      href="/auth/github"
      className={
        mode === "dank"
          ? "inline-flex min-w-[172px] items-center justify-center gap-1.5 whitespace-nowrap border border-pink-500/60 bg-pink-500/15 px-4 py-1.5 text-xs font-black uppercase text-pink-100 shadow-[0_0_16px_rgba(236,72,153,0.18)] hover:border-lime-300 hover:text-lime-100"
          : "inline-flex items-center justify-center gap-1.5 rounded-full border border-stone-300 bg-white/80 px-3 py-1.5 text-xs font-semibold text-stone-800 shadow-sm hover:border-emerald-300 hover:text-emerald-800"
      }
    >
      <span aria-hidden>{mode === "dank" ? "GH" : "◆"}</span>
      <span>Sign in with GitHub</span>
    </a>
  );
}

function profileFromUser(user: User): GitHubProfile {
  const metadata = user.user_metadata;
  const login = stringValue(metadata.user_name) ?? stringValue(metadata.preferred_username) ?? stringValue(metadata.name) ?? user.email ?? "github-user";
  const name = stringValue(metadata.full_name) ?? stringValue(metadata.name);
  return {
    login,
    displayName: name ?? `@${login}`,
    avatarUrl: stringValue(metadata.avatar_url) ?? stringValue(metadata.picture),
  };
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim().length ? value.trim() : undefined;
}

function cleanOAuthHash() {
  if (typeof window === "undefined" || !window.location.hash.includes("access_token")) return;
  window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}`);
}

async function recoverHashSession() {
  const supabase = getBrowserSupabaseClient();
  if (!supabase || typeof window === "undefined" || !window.location.hash.includes("access_token")) return;

  const params = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  if (!accessToken || !refreshToken) return;

  await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
}
