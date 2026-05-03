"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";

type ProfileTabLinkProps = {
  active?: boolean;
  mode: "clarity" | "dank";
  variant?: "folder-tab" | "dank-grid";
  width?: string;
};

export function ProfileTabLink({ active = false, mode, variant = "folder-tab", width = "w-[82px]" }: ProfileTabLinkProps) {
  const [isSignedIn, setIsSignedIn] = useState(false);

  useEffect(() => {
    let mounted = true;
    const supabase = getBrowserSupabaseClient();
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) setIsSignedIn(Boolean(data.session?.user));
    });

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsSignedIn(Boolean(session?.user));
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  if (!isSignedIn) return null;

  if (variant === "dank-grid" || mode === "dank") {
    return (
      <Link href="/profile" className={`border px-2 py-1.5 ${active ? "border-lime-300 bg-lime-300/20 text-lime-100" : "border-lime-300/25 text-lime-300/55"}`}>
        Profile
      </Link>
    );
  }

  return (
    <Link href="/profile" className={`relative h-8 ${width} rounded-t-sm border border-b-0 px-2 pt-1.5 text-center text-[10px] font-semibold uppercase tracking-wide ${active ? "border-emerald-700/70 bg-[#fbf3df] text-emerald-900" : "border-stone-300 bg-[#e4d7bd] text-stone-500"}`}>
      <span className={`absolute -right-3 bottom-[-1px] h-[calc(100%+1px)] w-5 skew-x-[16deg] rounded-tr-sm border border-b-0 border-l-0 ${active ? "border-emerald-700/70 bg-[#fbf3df]" : "border-stone-300 bg-[#e4d7bd]"}`} />
      <span className="relative">Profile</span>
    </Link>
  );
}
