"use client";

import Image from "next/image";
import {
  accessoryOrder,
  defaultAccessoriesForMode,
  defaultProfileAccessoryLoadouts,
  normalizeAccessoryState,
  normalizeProfileAccessoryLoadouts,
  type AccessoryMode,
  type DankAccessoryId,
  type DankAccessorySettings,
  type DankAccessoryState,
  type ProfileAccessoryLoadouts,
} from "@/lib/dank-accessories";

export {
  accessoryLabels,
  accessoryOrder,
  defaultAccessoriesForMode,
  defaultClarityAccessories,
  defaultDankAccessories,
  defaultProfileAccessoryLoadouts,
  normalizeAccessoryState,
  normalizeProfileAccessoryLoadouts,
  type AccessoryMode,
  type DankAccessoryId,
  type DankAccessorySettings,
  type DankAccessoryState,
  type ProfileAccessoryLoadouts,
} from "@/lib/dank-accessories";

export const accessoryLoadoutsStorageKey = "thc-avatar-accessory-loadouts";
export const dankAccessoryStorageKey = "thc-dank-avatar-accessories";
const baseAccessoryPixels = 148;

export function readAccessoryLoadouts(): ProfileAccessoryLoadouts {
  if (typeof window === "undefined") return defaultProfileAccessoryLoadouts;
  try {
    const stored = window.localStorage.getItem(accessoryLoadoutsStorageKey);
    if (stored) return normalizeProfileAccessoryLoadouts(JSON.parse(stored));
    const legacyDank = window.localStorage.getItem(dankAccessoryStorageKey);
    if (legacyDank) {
      return normalizeProfileAccessoryLoadouts({ dank: JSON.parse(legacyDank) });
    }
    return defaultProfileAccessoryLoadouts;
  } catch {
    return defaultProfileAccessoryLoadouts;
  }
}

export function writeAccessoryLoadouts(loadouts: ProfileAccessoryLoadouts) {
  const normalized = normalizeProfileAccessoryLoadouts(loadouts);
  window.localStorage.setItem(accessoryLoadoutsStorageKey, JSON.stringify(normalized));
  window.dispatchEvent(new CustomEvent("thc-accessory-loadouts-change", { detail: normalized }));
}

export function readAccessoriesForMode(mode: AccessoryMode): DankAccessoryState {
  return readAccessoryLoadouts()[mode];
}

export function readDankAccessories(): DankAccessoryState {
  return readAccessoriesForMode("dank");
}

export function writeDankAccessories(accessories: DankAccessoryState) {
  const current = readAccessoryLoadouts();
  writeAccessoryLoadouts({ ...current, dank: normalizeAccessoryState(accessories) });
}

export function AvatarWithDankAccessories({
  avatarUrl,
  alt,
  mode,
  accessories,
  size = "md",
}: {
  avatarUrl?: string;
  alt: string;
  mode: "clarity" | "dank";
  accessories: DankAccessoryState;
  size?: "sm" | "md" | "lg";
}) {
  const dimensions = {
    sm: { outer: "h-9 w-9", inner: "h-7 w-7", sizes: "28px", pixels: 48 },
    md: { outer: "h-20 w-20", inner: "h-16 w-16", sizes: "64px", pixels: 104 },
    lg: { outer: "h-36 w-36", inner: "h-24 w-24", sizes: "96px", pixels: 148 },
  }[size];
  const normalized = normalizeAccessoryState(accessories ?? defaultAccessoriesForMode(mode));

  return (
    <span className={`relative inline-flex shrink-0 items-end justify-center overflow-visible ${dimensions.outer}`} aria-label={alt}>
      <span className={mode === "dank" ? `relative overflow-hidden rounded-full border border-lime-300/45 bg-lime-300/10 ${dimensions.inner}` : `relative overflow-hidden rounded-full border border-stone-300 bg-white ${dimensions.inner}`}>
        {avatarUrl ? <Image src={avatarUrl} alt="" fill sizes={dimensions.sizes} className="object-cover" /> : null}
      </span>
      {accessoryOrder.map((id) => {
        const settings = normalized[id];
        if (!settings.equipped) return null;
        return (
          <span key={id} className="pointer-events-none absolute" style={styleForAccessory(settings, dimensions.pixels)} aria-hidden>
            <AccessorySvg id={id} mode={mode} />
          </span>
        );
      })}
    </span>
  );
}

function styleForAccessory(settings: DankAccessorySettings, pixels: number) {
  const flip = settings.flipped ? -1 : 1;
  const offsetFactor = pixels / baseAccessoryPixels;
  return {
    height: `${pixels}px`,
    left: "50%",
    opacity: settings.opacity,
    top: "50%",
    transform: `translate(calc(-50% + ${settings.x * offsetFactor}px), calc(-50% + ${settings.y * offsetFactor}px)) scale(${settings.scale * flip}, ${settings.scale})`,
    transformOrigin: "center",
    width: `${pixels}px`,
  };
}

function AccessorySvg({ id, mode }: { id: DankAccessoryId; mode: "clarity" | "dank" }) {
  return (
    <svg viewBox="0 0 96 96" className="h-full w-full" shapeRendering="crispEdges">
      {id === "hat" ? mode === "dank" ? <Hat /> : <GraduateCap /> : null}
      {id === "glasses" ? mode === "dank" ? <Glasses /> : <NerdGlasses /> : null}
      {id === "necklace" ? mode === "dank" ? <Necklace /> : <RubiksCube /> : null}
      {id === "joint" ? mode === "dank" ? <Joint /> : <Pointer /> : null}
    </svg>
  );
}

function Hat() {
  return (
    <>
      <path d="M30 15h25v4h9v6h4v8H26V21h4z" fill="#2f3238" />
      <path d="M26 33h45v5H18v-5z" fill="#15171a" />
      <path d="M35 18h20v3H35zM32 22h28v3H32z" fill="#454a52" />
      <path d="M42 20h4v3h-4zM54 25h4v3h-4zM36 28h3v3h-3z" fill="#737983" opacity="0.8" />
    </>
  );
}

function Glasses() {
  return (
    <>
      <path d="M26 43h15l5 7h8l5-7h15l-6 11H57l-5-5h-6l-5 5H31z" fill="#111" />
      <path d="M42 45h4v3h-4zM61 45h4v3h-4z" fill="#fff" />
    </>
  );
}

function Joint() {
  return (
    <>
      <path d="M25 64h22v5H25z" fill="#8a4d10" transform="rotate(-22 36 66)" />
      <path d="M18 69h10v9H18z" fill="#f97316" transform="rotate(-22 23 74)" />
      <path d="M18 74h6v4h-6z" fill="#ef4444" transform="rotate(-22 21 76)" />
      <path d="M31 57h3v8h-3zM26 55h3v8h-3z" fill="#d1d5db" opacity="0.65" />
    </>
  );
}

function Necklace() {
  return (
    <>
      <path d="M35 66h5v5h-5zM40 71h5v5h-5zM45 76h5v5h-5zM50 81h6v5h-6zM56 76h5v5h-5zM61 71h5v5h-5zM66 66h5v5h-5z" fill="#facc15" />
      <path d="M49 84h8v4h-8zM52 82h4v12h-4zM48 90h12v4H48z" fill="#facc15" />
    </>
  );
}

function GraduateCap() {
  return (
    <>
      <path d="M16 28h64v8H16z" fill="#111827" />
      <path d="M26 20h44v8H26z" fill="#1f2937" />
      <path d="M31 36h34v8H31z" fill="#111827" />
      <path d="M66 34h4v16h-4zM62 50h12v4H62z" fill="#facc15" />
      <path d="M31 23h10v3H31zM47 23h8v3h-8z" fill="#4b5563" />
    </>
  );
}

function NerdGlasses() {
  return (
    <>
      <path d="M24 44h18v14H24zM54 44h18v14H54z" fill="#111827" />
      <path d="M28 48h10v6H28zM58 48h10v6H58z" fill="#fff" />
      <path d="M42 49h12v4H42z" fill="#111827" />
      <path d="M22 42h4v4h-4zM70 42h4v4h-4z" fill="#111827" />
    </>
  );
}

function RubiksCube() {
  return (
    <>
      <path d="M37 64h24v24H37z" fill="#111827" />
      <path d="M40 67h6v6h-6z" fill="#ef4444" />
      <path d="M48 67h6v6h-6z" fill="#facc15" />
      <path d="M56 67h3v6h-3z" fill="#22c55e" />
      <path d="M40 75h6v6h-6z" fill="#3b82f6" />
      <path d="M48 75h6v6h-6z" fill="#fff" />
      <path d="M56 75h3v6h-3z" fill="#ef4444" />
      <path d="M40 83h6v3h-6z" fill="#f97316" />
      <path d="M48 83h6v3h-6z" fill="#22c55e" />
      <path d="M56 83h3v3h-3z" fill="#3b82f6" />
    </>
  );
}

function Pointer() {
  return (
    <>
      <path d="M24 62h34v5H24z" fill="#f8fafc" transform="rotate(-24 41 64)" />
      <path d="M56 54h6v10h-6z" fill="#0f172a" transform="rotate(-24 59 59)" />
      <path d="M20 65h10v10H20z" fill="#22c55e" transform="rotate(-24 25 70)" />
    </>
  );
}
