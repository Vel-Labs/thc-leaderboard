"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDisplayMode } from "./mode-shell";

type ReviewState = "idle" | "validating" | "fetching" | "reviewing" | "saving" | "error";

const labels: Record<ReviewState, string> = {
  idle: "Ready",
  validating: "Validating repository URL",
  fetching: "Inspecting public repository",
  reviewing: "Generating THC review",
  saving: "Saving shareable report",
  error: "Review failed",
};

export function ReviewForm() {
  const router = useRouter();
  const { mode, copy } = useDisplayMode();
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [state, setState] = useState<ReviewState>("idle");
  const [error, setError] = useState("");

  async function submitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setState("validating");

    try {
      setState("fetching");
      setTimeout(() => setState((current) => (current === "fetching" ? "reviewing" : current)), 700);
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositoryUrl }),
      });

      const payload = (await response.json()) as { reportId?: string; error?: string };
      if (!response.ok || !payload.reportId) {
        throw new Error(payload.error ?? "Review failed.");
      }

      setState("saving");
      router.push(`/reports/${payload.reportId}`);
      router.refresh();
    } catch (caught) {
      setState("error");
      setError(caught instanceof Error ? caught.message : "Review failed.");
    }
  }

  const busy = ["validating", "fetching", "reviewing", "saving"].includes(state);

  return (
    <form
      onSubmit={submitReview}
      className={
        mode === "dank"
          ? "rounded-lg border border-lime-300/30 bg-black/55 p-4 shadow-[0_0_28px_rgba(190,242,100,0.12)]"
          : "rounded-lg border border-stone-300/90 bg-white/80 p-4 shadow-sm"
      }
    >
      <label className={mode === "dank" ? "block text-sm font-black uppercase tracking-wide text-lime-200" : "block text-sm font-medium text-zinc-900"} htmlFor="repositoryUrl">
        {copy.inputLabel}
      </label>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <input
          id="repositoryUrl"
          name="repositoryUrl"
          type="url"
          required
          placeholder="https://github.com/owner/repo"
          value={repositoryUrl}
          onChange={(event) => setRepositoryUrl(event.target.value)}
          className={
            mode === "dank"
              ? "min-h-11 flex-1 rounded-md border border-lime-300/30 bg-zinc-950 px-3 font-mono text-sm text-lime-100 outline-none ring-lime-300 placeholder:text-lime-100/35 focus:ring-2"
              : "min-h-11 flex-1 rounded-md border border-zinc-300 bg-white px-3 text-sm outline-none ring-emerald-600 focus:ring-2"
          }
        />
        <button
          type="submit"
          disabled={busy}
          className={
            mode === "dank"
              ? "min-h-11 rounded-md bg-lime-300 px-4 text-sm font-black text-zinc-950 shadow-[0_0_22px_rgba(190,242,100,0.35)] hover:bg-lime-200 disabled:cursor-not-allowed disabled:bg-zinc-600 disabled:text-zinc-300"
              : "min-h-11 rounded-md bg-zinc-950 px-4 text-sm font-semibold text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-400"
          }
        >
          {copy.reviewButton}
        </button>
      </div>
      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className={mode === "dank" ? "font-black text-lime-100" : "font-medium text-zinc-900"}>Status</span>
          <span className={state === "error" ? "text-red-700" : mode === "dank" ? "text-cyan-200" : "text-zinc-600"}>
            {state === "idle" ? copy.statusReady : labels[state]}
          </span>
        </div>
        <div className={mode === "dank" ? "h-2 overflow-hidden rounded-full bg-lime-100/10" : "h-2 overflow-hidden rounded-full bg-zinc-100"}>
          <div
            className={mode === "dank" ? "h-full bg-pink-400 transition-all shadow-[0_0_16px_rgba(244,114,182,0.6)]" : "h-full bg-emerald-600 transition-all"}
            style={{ width: state === "idle" ? "8%" : state === "error" ? "100%" : busy ? "70%" : "100%" }}
          />
        </div>
        {error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
        <p className={mode === "dank" ? "text-xs leading-5 text-lime-50/55" : "text-xs leading-5 text-zinc-500"}>
          v1 fetches public GitHub files only. It does not run installs, scripts, tests, or project code.
        </p>
      </div>
    </form>
  );
}
