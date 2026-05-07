"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import type { THCReport } from "@/lib/thc/schema";
import { getBrowserSupabaseClient } from "@/lib/supabase/browser";
import { readSubmittedRepositories, repositoryWasSubmitted } from "@/lib/ui/browser-submissions";
import { repositoryMeta } from "@/lib/ui/repository-meta";
import {
  AvatarWithDankAccessories,
  accessoryLabels,
  accessoryOrder,
  defaultAccessoriesForMode,
  defaultProfileAccessoryLoadouts,
  readAccessoryLoadouts,
  writeAccessoryLoadouts,
  type AccessoryMode,
  type DankAccessoryId,
  type DankAccessorySettings,
  type DankAccessoryState,
  type ProfileAccessoryLoadouts,
} from "../avatar-cosmetics";
import { CompactReviewForm } from "../compact-review-form";
import { GitHubSignInButton } from "../github-sign-in-button";
import { ModeToggle, useDisplayMode } from "../mode-shell";
import { PixelFace } from "../pixel-face";
import { ProfileTabLink } from "../profile-tab-link";
import { Disclaimer } from "../reports/[id]/report-parts";

type Profile = {
  login: string;
  displayName: string;
  avatarUrl?: string;
};

export function ProfileView({ reports }: { reports: THCReport[] }) {
  const { mode } = useDisplayMode();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadouts, setLoadouts] = useState<ProfileAccessoryLoadouts>(defaultProfileAccessoryLoadouts);
  const [selectedAccessory, setSelectedAccessory] = useState<DankAccessoryId>("hat");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [submittedRepos, setSubmittedRepos] = useState<string[]>([]);
  const myReports = reports.filter((report) => repositoryWasSubmitted(report.repositoryUrl, submittedRepos));
  const activeMode = mode as AccessoryMode;
  const accessories = loadouts[activeMode];
  const selectedSettings = accessories[selectedAccessory];

  useEffect(() => {
    const hydrationId = window.setTimeout(() => {
      setLoadouts(readAccessoryLoadouts());
      setSubmittedRepos(readSubmittedRepositories());
    }, 0);
    const supabase = getBrowserSupabaseClient();
    if (!supabase) return () => window.clearTimeout(hydrationId);

    supabase.auth.getUser().then(({ data }) => {
      setProfile(data.user ? profileFromUser(data.user) : null);
    });
    return () => window.clearTimeout(hydrationId);
  }, []);

  async function signOut() {
    await getBrowserSupabaseClient()?.auth.signOut();
    window.location.replace("/");
  }

  function updateAccessories(next: DankAccessoryState) {
    const nextLoadouts = { ...loadouts, [activeMode]: next };
    setLoadouts(nextLoadouts);
    writeAccessoryLoadouts(nextLoadouts);
    setSaveStatus("idle");
  }

  function updateSelectedAccessory(next: Partial<DankAccessorySettings>) {
    updateAccessories({
      ...accessories,
      [selectedAccessory]: {
        ...selectedSettings,
        ...next,
      },
    });
  }

  function equipAllAccessories() {
    updateAccessories(accessoryOrder.reduce((next, id) => ({ ...next, [id]: { ...accessories[id], equipped: true } }), accessories));
  }

  function resetSelectedAccessory() {
    updateSelectedAccessory(defaultAccessoriesForMode(activeMode)[selectedAccessory]);
  }

  function resetAllAccessories() {
    updateAccessories(defaultAccessoriesForMode(activeMode));
  }

  async function savePublicLoadout() {
    const supabase = getBrowserSupabaseClient();
    if (!supabase) return;

    setSaveStatus("saving");
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) {
      setSaveStatus("error");
      return;
    }

    const response = await fetch("/api/profile/dank-loadout", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ loadouts }),
    });
    setSaveStatus(response.ok ? "saved" : "error");
  }

  const profileHeader = (
    <section className={mode === "dank" ? "border-b border-pink-500/45 pb-3" : "border-b border-stone-300 pb-3"}>
      <div className="flex flex-wrap items-center justify-between gap-5">
        <div className="flex min-w-0 flex-wrap items-center gap-5">
          <AvatarWithDankAccessories avatarUrl={profile?.avatarUrl} alt={profile ? `${profile.login} avatar` : "GitHub profile avatar"} mode={mode} accessories={accessories} size="lg" />
          <div className="min-w-0">
            <p className={mode === "dank" ? "text-xs font-black uppercase tracking-[0.24em] text-pink-400" : "font-serif text-sm italic text-stone-500"}>{mode === "dank" ? "Profile // public loadout" : "Profile folder page"}</p>
            <h1 className={mode === "dank" ? "mt-1 truncate text-[clamp(2.6rem,4.8vw,5rem)] font-black uppercase leading-none text-lime-300" : "mt-1 truncate font-serif text-[clamp(2.6rem,4.8vw,5rem)] font-semibold leading-none tracking-tight"}>
              {profile?.displayName ?? "GitHub profile"}
            </h1>
            <p className={mode === "dank" ? "mt-2 text-sm uppercase text-pink-300" : "mt-2 text-base text-stone-600"}>{profile ? `@${profile.login}` : "Sign in with GitHub to connect this profile."}</p>
          </div>
        </div>
        {profile ? (
          <button type="button" onClick={signOut} className={mode === "dank" ? "border border-pink-500/50 px-3 py-1.5 text-xs font-black uppercase text-pink-200" : "rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700"}>
            Sign out
          </button>
        ) : null}
      </div>
    </section>
  );

  const loadoutSection = (
    <section id="loadout" className={mode === "dank" ? "relative overflow-hidden border border-lime-300/30 bg-black/78 p-5 shadow-[0_0_35px_rgba(190,242,100,0.12)]" : "relative overflow-hidden rounded-sm border border-stone-300 bg-white/78 p-5 shadow-[0_18px_55px_rgba(68,64,60,0.08)]"}>
      <div className={mode === "dank" ? "absolute inset-0 dank-noise opacity-45" : "absolute inset-0 paper-grid opacity-35"} />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className={mode === "dank" ? "text-xs font-black uppercase tracking-[0.24em] text-lime-300" : "text-xs font-semibold uppercase tracking-[0.18em] text-emerald-700"}>{mode === "dank" ? "Dank Loadout" : "Clarity Loadout"}</p>
          <h2 className={mode === "dank" ? "mt-1 text-3xl font-black uppercase text-pink-300" : "mt-1 font-serif text-3xl font-semibold text-zinc-950"}>Avatar Cosmetics</h2>
          <p className={mode === "dank" ? "mt-2 max-w-3xl text-base leading-7 text-lime-100/70" : "mt-2 max-w-3xl text-base leading-7 text-stone-600"}>
            {mode === "dank"
              ? "Accessories stay hidden until you add and save them. Future items can unlock from streaks and achievements."
              : "Formal accessories stay hidden until you add and save them. Tune the cap, glasses, cube, and pointer without changing the dank loadout."}
          </p>
        </div>
        <div className="grid min-w-[300px] gap-2">
          <label className={mode === "dank" ? "grid gap-1 text-sm font-black uppercase text-lime-100" : "grid gap-1 text-sm font-semibold uppercase text-stone-700"}>
            Accessory
            <select value={selectedAccessory} onChange={(event) => setSelectedAccessory(event.currentTarget.value as DankAccessoryId)} className={mode === "dank" ? "border border-lime-300/35 bg-black px-3 py-2.5 text-base text-lime-100" : "rounded-sm border border-stone-300 bg-white px-3 py-2.5 text-base text-stone-900"}>
              {accessoryOrder.map((id) => (
                <option key={id} value={id}>
                  {accessoryLabels[id]}
                </option>
              ))}
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <CosmeticButton label={selectedSettings.equipped ? "Remove" : "Add"} description={accessoryLabels[selectedAccessory]} active={selectedSettings.equipped} onClick={() => updateSelectedAccessory({ equipped: !selectedSettings.equipped })} />
            <CosmeticButton label={selectedSettings.flipped ? "Unflip" : "Flip"} description="Mirror item" active={selectedSettings.flipped} onClick={() => updateSelectedAccessory({ flipped: !selectedSettings.flipped })} />
          </div>
        </div>
      </div>
      <div className="relative mt-5 grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-center">
        <div className={mode === "dank" ? "flex min-h-[240px] justify-center border border-lime-300/20 bg-black/55 p-6" : "flex min-h-[240px] justify-center rounded-sm border border-stone-200 bg-white/70 p-6"}>
          <AvatarWithDankAccessories avatarUrl={profile?.avatarUrl} alt="Avatar cosmetic preview" mode={mode} accessories={accessories} size="lg" />
        </div>
        <div className="grid gap-4">
          <CosmeticSlider mode={mode} label={`${accessoryLabels[selectedAccessory]} Left / Right`} min={-64} max={64} step={1} value={selectedSettings.x} onChange={(x) => updateSelectedAccessory({ x })} />
          <CosmeticSlider mode={mode} label={`${accessoryLabels[selectedAccessory]} Up / Down`} min={-72} max={72} step={1} value={selectedSettings.y} onChange={(y) => updateSelectedAccessory({ y })} />
          <CosmeticSlider mode={mode} label={`${accessoryLabels[selectedAccessory]} Scale`} min={0.35} max={2} step={0.05} value={selectedSettings.scale} onChange={(scale) => updateSelectedAccessory({ scale })} />
          <CosmeticSlider mode={mode} label={`${accessoryLabels[selectedAccessory]} Opacity`} min={0.25} max={1} step={0.05} value={selectedSettings.opacity} onChange={(opacity) => updateSelectedAccessory({ opacity })} />
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={resetSelectedAccessory} className={mode === "dank" ? "w-fit border border-cyan-300/40 px-3 py-1.5 text-xs font-black uppercase text-cyan-200 hover:border-cyan-200" : "w-fit rounded-sm border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase text-stone-700 hover:border-emerald-400"}>Reset item</button>
            <button type="button" onClick={resetAllAccessories} className={mode === "dank" ? "w-fit border border-pink-400/40 px-3 py-1.5 text-xs font-black uppercase text-pink-200 hover:border-pink-300" : "w-fit rounded-sm border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold uppercase text-stone-700 hover:border-emerald-400"}>Reset all</button>
            <button type="button" onClick={equipAllAccessories} className={mode === "dank" ? "w-fit border border-lime-300/40 px-3 py-1.5 text-xs font-black uppercase text-lime-200 hover:border-lime-200" : "w-fit rounded-sm border border-emerald-300 bg-emerald-50 px-3 py-1.5 text-xs font-semibold uppercase text-emerald-800"}>Add all</button>
            <button type="button" onClick={savePublicLoadout} disabled={saveStatus === "saving" || !profile} className={mode === "dank" ? "w-fit border border-lime-300 bg-lime-300/15 px-3 py-1.5 text-xs font-black uppercase text-lime-100 hover:bg-lime-300/25 disabled:cursor-not-allowed disabled:opacity-45" : "w-fit rounded-sm bg-emerald-700 px-3 py-1.5 text-xs font-semibold uppercase text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-45"}>
              {saveStatus === "saving" ? "Saving" : "Save public loadout"}
            </button>
          </div>
          <p className={mode === "dank" ? "text-sm uppercase text-lime-100/60" : "text-sm text-stone-500"}>
            {saveStatus === "saved" ? "Saved to your public GitHub profile." : saveStatus === "error" ? "Could not save. Check Supabase schema and session." : `Saved loadouts appear for this GitHub owner in ${mode} mode.`}
          </p>
        </div>
      </div>
    </section>
  );

  const reposSection = (
    <section id="my-repos" className={mode === "dank" ? "border border-cyan-300/25 bg-zinc-950/80 p-5" : "rounded-sm border border-stone-300 bg-white/75 p-5"}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className={mode === "dank" ? "text-2xl font-black uppercase text-cyan-300" : "font-serif text-3xl font-semibold"}>My Repos</h2>
              <p className={mode === "dank" ? "mt-1 text-sm uppercase text-lime-100/65" : "mt-1 text-base text-stone-600"}>
                Browser-submitted reports for now. Supabase-backed ownership can replace this once repo ownership verification is wired.
              </p>
            </div>
            <Link href="/audit" className={mode === "dank" ? "border border-lime-300/45 px-4 py-2.5 text-sm font-black uppercase text-lime-200" : "rounded-sm bg-emerald-700 px-4 py-2.5 text-base font-semibold text-white"}>
              Add public repo
            </Link>
          </div>
          <div className="mt-4 grid gap-2">
            {myReports.map((report) => {
              const meta = repositoryMeta(report);
              return (
                <Link key={report.id} href={`/reports/${report.id}`} className={mode === "dank" ? "grid gap-1 border border-lime-300/15 bg-black/45 p-3 text-sm hover:border-lime-300/45" : "grid gap-1 rounded-sm border border-stone-200 bg-white p-3 text-sm hover:border-emerald-300"}>
                  <span className={mode === "dank" ? "font-black text-pink-300" : "font-semibold text-blue-700"}>{meta.owner}/{meta.repo}</span>
                  <span className="font-mono">{report.totalScore} · {report.recommendedLevel}</span>
                </Link>
              );
            })}
            {myReports.length === 0 ? <p className={mode === "dank" ? "text-sm text-lime-100/65" : "text-sm text-stone-600"}>No connected reports yet.</p> : null}
          </div>
    </section>
  );

  const achievementsSection = (
    <section id="achievements" className={mode === "dank" ? "border border-pink-500/30 bg-black/70 p-5" : "rounded-sm border border-stone-300 bg-[#fff8e8] p-5"}>
      <h2 className={mode === "dank" ? "text-2xl font-black uppercase text-pink-300" : "font-serif text-3xl font-semibold"}>Achievements</h2>
      <p className={mode === "dank" ? "mt-2 text-base text-lime-100/70" : "mt-2 text-base text-stone-600"}>
        Achievement rows belong in Supabase once reports, verified ownership, and award jobs are connected.
      </p>
    </section>
  );

  return (
    <main className={mode === "dank" ? "flex min-h-screen w-full max-w-none flex-col gap-2 px-2 py-2 font-mono text-lime-100 sm:px-3 lg:h-screen lg:min-h-0 lg:overflow-hidden" : "flex min-h-screen w-full max-w-none flex-col gap-2 px-2 py-2 text-zinc-950 sm:px-3 lg:h-screen lg:min-h-0 lg:overflow-hidden"}>
      <ProfileTopBar mode={mode} />
      <div className="grid min-h-0 flex-1 gap-2 lg:grid-cols-[295px_minmax(0,1fr)] 2xl:grid-cols-[315px_minmax(0,1fr)]">
        <ProfileSidebar mode={mode} />
        <section className={mode === "dank" ? "relative min-w-0 overflow-hidden border border-lime-300/40 bg-black/80 shadow-[0_0_38px_rgba(190,242,100,0.16)] lg:h-full" : "relative min-w-0 overflow-hidden rounded-sm border border-stone-300 bg-[#fbf7ec] shadow-[0_18px_55px_rgba(68,64,60,0.18)] lg:h-full"}>
          <div className={mode === "dank" ? "absolute inset-0 dank-noise opacity-70" : "absolute inset-0 opacity-55 paper-grid"} />
          <div className="relative grid min-h-0 gap-2 p-2 lg:h-full 2xl:grid-cols-[minmax(0,1fr)_270px]">
            <div className="min-h-0 overflow-auto pr-1">
              <div className="grid gap-2">
                {profileHeader}
                {loadoutSection}
                {reposSection}
                {achievementsSection}
              </div>
            </div>
            <aside className="hidden min-h-0 content-start gap-2 overflow-hidden 2xl:grid">
              <ProfileRail mode={mode} saveStatus={saveStatus} />
            </aside>
          </div>
        </section>
      </div>
      <Disclaimer mode={mode} />
    </main>
  );
}

function profileFromUser(user: User): Profile {
  const metadata = user.user_metadata;
  const login = stringValue(metadata.user_name) ?? stringValue(metadata.preferred_username) ?? stringValue(metadata.name) ?? user.email ?? "github-user";
  const name = stringValue(metadata.full_name) ?? stringValue(metadata.name);
  return {
    login,
    displayName: name ?? `@${login}`,
    avatarUrl: stringValue(metadata.avatar_url) ?? stringValue(metadata.picture),
  };
}

function ProfileTopBar({ mode }: { mode: "clarity" | "dank" }) {
  return (
    <header className={mode === "dank" ? "relative overflow-hidden border border-lime-300/45 bg-black/88 p-2 shadow-[0_0_30px_rgba(190,242,100,0.16)]" : "relative overflow-hidden rounded-sm border border-stone-300 bg-[#f8f3e8] p-3 shadow-[0_8px_22px_rgba(68,64,60,0.14)]"}>
      <div className={mode === "dank" ? "grid gap-2 lg:grid-cols-[360px_minmax(0,1fr)_390px] lg:items-center" : "grid gap-2 lg:grid-cols-[250px_minmax(0,1fr)_340px] lg:items-center"}>
        <div className={mode === "dank" ? "flex min-w-0 items-center gap-3" : ""}>
          {mode === "dank" ? <PixelFace /> : null}
          <div>
            <div className={mode === "dank" ? "whitespace-nowrap text-2xl font-black leading-none text-lime-300" : "text-xl font-black leading-none tracking-wide text-zinc-950"}>THC LEADERBOARD</div>
            <div className={mode === "dank" ? "mt-1 whitespace-nowrap text-[10px] font-black uppercase tracking-[0.16em] text-lime-300" : "mt-1 text-xs tracking-[0.15em] text-stone-600"}>Truth · Hardening · Clarity</div>
          </div>
        </div>
        <div className={mode === "dank" ? "hidden h-5 overflow-hidden text-center text-[10px] uppercase tracking-[0.5em] text-pink-500/45 lg:block" : "hidden items-center justify-center gap-4 text-center font-serif text-base italic text-stone-600 lg:flex"}>
          <span>{mode === "dank" ? "▓▒░ profile // loadout // owner signal ░▒▓" : "Profile, repos, and public owner settings"}</span>
        </div>
        <div className={mode === "dank" ? "flex flex-nowrap items-center justify-end gap-2" : "flex flex-wrap justify-end gap-2 pr-9 md:pr-10 lg:pr-11"}>
          <GitHubSignInButton mode={mode} />
          <ModeToggle />
          {mode === "dank" ? <PixelFace small /> : null}
        </div>
      </div>
      <div className="mt-3">
        <CompactReviewForm />
      </div>
    </header>
  );
}

function ProfileSidebar({ mode }: { mode: "clarity" | "dank" }) {
  const sections = ["Loadout", "My Repos", "Achievements"];

  if (mode === "dank") {
    return (
      <aside className="relative hidden overflow-hidden border border-lime-300/35 bg-black/75 p-3 lg:block lg:h-full">
        <div className="mb-3 grid grid-cols-[0.7fr_0.7fr_1.25fr_0.85fr] gap-2 text-[10px] font-black uppercase tracking-wide">
          <Link href="/" className="border border-cyan-300/25 px-2 py-1.5 text-cyan-300/60">About</Link>
          <Link href="/audit" className="border border-pink-500/25 px-2 py-1.5 text-pink-300/55">Audit</Link>
          <Link href="/leaderboard" className="border border-pink-500/25 px-2 py-1.5 text-pink-300/55">Leaderboard</Link>
          <ProfileTabLink mode="dank" active variant="dank-grid" />
        </div>
        <p className="mb-3 text-xs font-black uppercase tracking-widest text-lime-300">Profile Folder //</p>
        <nav className="space-y-1 text-sm">
          {sections.map((section) => (
            <a key={section} href={`#${section.toLowerCase().replaceAll(" ", "-")}`} className="block border border-transparent border-b-lime-300/15 px-3 py-2 font-semibold text-lime-100/70 hover:border-lime-300/45 hover:text-lime-100">
              {section}
            </a>
          ))}
        </nav>
        <div className="absolute bottom-3 left-3 right-3 border border-pink-500/35 bg-pink-500/10 p-3 text-xs leading-5 text-pink-100">
          Public loadouts are profile display only. They never affect THC scores.
        </div>
      </aside>
    );
  }

  return (
    <aside className="relative hidden overflow-hidden rounded-sm border border-stone-300 bg-[#efe4cd] p-3 shadow-[8px_12px_22px_rgba(68,64,60,0.16)] lg:block lg:h-full">
      <div className="absolute left-4 top-2 z-20 flex items-end gap-1.5">
        <FolderTab href="/" label="About" width="w-[52px]" />
        <FolderTab href="/audit" label="Audit" width="w-[48px]" />
        <FolderTab href="/leaderboard" label="Leaderboard" width="w-[90px]" />
        <ProfileTabLink mode="clarity" active width="w-[60px]" />
      </div>
      <p className="relative mb-2 mt-8 flex items-center gap-2 text-xs uppercase tracking-widest text-stone-500">□ Profile Folder</p>
      <div className="relative mb-4 flex items-center gap-2 border-b border-stone-300 pb-3 pl-1 text-xs font-semibold text-stone-700">
        <span className="text-base">□</span>
        <span className="truncate">owner settings</span>
      </div>
      <nav className="relative space-y-1 text-sm">
        {sections.map((section, index) => (
          <a key={section} href={`#${section.toLowerCase().replaceAll(" ", "-")}`} className={`block rounded-sm border px-3 py-2 ${index === 0 ? "border-emerald-400 bg-emerald-50/95 text-emerald-950" : "border-transparent border-b-stone-300/75 text-stone-700 hover:bg-white/45"}`}>
            {section}
          </a>
        ))}
      </nav>
      <div className="absolute bottom-3 left-3 right-3 rounded-sm border border-stone-200 bg-white p-3 font-serif text-xs italic leading-5 text-stone-700 shadow-[6px_8px_16px_rgba(68,64,60,0.12)]">
        Profile signals are display context only.
      </div>
    </aside>
  );
}

function FolderTab({ href, label, active = false, width }: { href: string; label: string; active?: boolean; width: string }) {
  return (
    <Link href={href} className={`relative h-8 ${width} rounded-t-sm border border-b-0 px-2 pt-1.5 text-center text-[10px] font-semibold uppercase tracking-wide ${active ? "border-emerald-700/70 bg-[#fbf3df] text-emerald-900" : "border-stone-300 bg-[#e4d7bd] text-stone-500"}`}>
      <span className={`absolute -right-3 bottom-[-1px] h-[calc(100%+1px)] w-5 skew-x-[16deg] rounded-tr-sm border border-b-0 border-l-0 ${active ? "border-emerald-700/70 bg-[#fbf3df]" : "border-stone-300 bg-[#e4d7bd]"}`} />
      <span className="relative">{label}</span>
    </Link>
  );
}

function ProfileRail({ mode, saveStatus }: { mode: "clarity" | "dank"; saveStatus: "idle" | "saving" | "saved" | "error" }) {
  if (mode === "dank") {
    return (
      <>
        <div className="border border-lime-300/35 bg-black/72 p-4 text-sm text-lime-100">Mode-specific loadouts are public owner cosmetics after save.</div>
        <div className="border border-pink-500/40 bg-pink-500/10 p-4 text-sm text-pink-100">Save status: {saveStatus}</div>
      </>
    );
  }

  return (
    <>
      <div className="rounded-sm border border-stone-300 bg-white/75 p-4 text-sm text-stone-700">Use this page for GitHub identity, reviewed repos, achievements, and public display settings.</div>
      <div className="rounded-sm border border-amber-200 bg-amber-100/80 p-4 text-sm text-amber-950">Profile settings never change methodology scores.</div>
    </>
  );
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim().length ? value.trim() : undefined;
}

function CosmeticButton({ label, description, active, onClick }: { label: string; description: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`border px-4 py-3 text-left ${active ? "border-lime-300 bg-lime-300/15 text-lime-100 shadow-[0_0_18px_rgba(190,242,100,0.18)]" : "border-pink-500/35 bg-black/45 text-pink-100/75 hover:border-pink-400"}`}
      aria-pressed={active}
    >
      <span className="block text-sm font-black uppercase">{label}</span>
      <span className="mt-1 block text-xs uppercase opacity-70">{description}</span>
    </button>
  );
}

function CosmeticSlider({
  mode,
  label,
  min,
  max,
  step,
  value,
  onChange,
}: {
  mode: "clarity" | "dank";
  label: string;
  min: number;
  max: number;
  step: number;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className={mode === "dank" ? "grid gap-1.5 text-sm font-black uppercase text-lime-100" : "grid gap-1.5 text-sm font-semibold uppercase text-stone-700"}>
      <span className="flex items-center justify-between gap-3">
        <span>{label}</span>
        <span className={mode === "dank" ? "font-mono text-pink-300" : "font-mono text-emerald-700"}>{Number.isInteger(value) ? value : value.toFixed(2)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.currentTarget.value))}
        className={mode === "dank" ? "h-3 accent-lime-300" : "h-3 accent-emerald-600"}
      />
    </label>
  );
}
