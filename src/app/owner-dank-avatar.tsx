"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AvatarWithDankAccessories, type ProfileAccessoryLoadouts } from "./avatar-cosmetics";

type OwnerDankAvatarProps = {
  avatarUrl?: string;
  owner: string;
  mode: "clarity" | "dank";
  size?: "sm" | "md";
};

export function OwnerDankAvatar({ avatarUrl, owner, mode, size = "sm" }: OwnerDankAvatarProps) {
  const [loadouts, setLoadouts] = useState<ProfileAccessoryLoadouts | null>(null);
  const pixelSize = size === "md" ? 36 : 28;

  useEffect(() => {
    if (mode !== "dank" || owner === "unknown") return;
    let cancelled = false;
    fetch(`/api/owners/${encodeURIComponent(owner)}/dank-loadout`)
      .then((response) => (response.ok ? response.json() : null))
      .then((data: { loadouts?: ProfileAccessoryLoadouts | null } | null) => {
        if (!cancelled) setLoadouts(data?.loadouts ?? null);
      })
      .catch(() => {
        if (!cancelled) setLoadouts(null);
      });
    return () => {
      cancelled = true;
    };
  }, [mode, owner]);

  if (loadouts) {
    return <AvatarWithDankAccessories avatarUrl={avatarUrl} alt={`${owner} GitHub avatar`} mode={mode} accessories={loadouts[mode]} size={size} />;
  }

  const className =
    mode === "dank"
      ? size === "md"
        ? "relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-lime-300/40 bg-lime-300/10"
        : "relative h-7 w-7 shrink-0 overflow-hidden rounded-full border border-lime-300/40 bg-lime-300/10"
      : size === "md"
        ? "relative h-9 w-9 shrink-0 overflow-hidden rounded-full border border-stone-300 bg-white"
        : "relative h-7 w-7 shrink-0 overflow-hidden rounded-full border border-stone-300 bg-white";

  return (
    <span className={className}>
      {avatarUrl ? <Image src={avatarUrl} alt={`${owner} GitHub avatar`} fill sizes={`${pixelSize}px`} className="object-cover" /> : null}
    </span>
  );
}
