"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDisplayMode } from "./mode-shell";

export function CompactReviewForm() {
  const router = useRouter();
  const { mode } = useDisplayMode();
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositoryUrl }),
      });
      const payload = (await response.json()) as { reportId?: string; error?: string };
      if (!response.ok || !payload.reportId) throw new Error(payload.error ?? "Review failed.");
      router.push(`/reports/${payload.reportId}`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Review failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submitReview} className="space-y-1">
      <div className={mode === "dank" ? "flex gap-3" : "flex gap-3"}>
        <label className="sr-only" htmlFor="compactRepositoryUrl">
          Public GitHub repository URL
        </label>
        <div
          className={
            mode === "dank"
              ? "flex min-h-12 flex-1 items-center gap-3 border border-lime-300 bg-black px-4 font-mono text-sm text-lime-300 shadow-[0_0_18px_rgba(190,242,100,0.18)]"
              : "flex min-h-12 flex-1 items-center gap-3 rounded-sm border border-stone-300 bg-white px-4 text-sm text-zinc-700 shadow-inner"
          }
        >
          <span aria-hidden>{mode === "dank" ? ">" : "↗"}</span>
          <input
            id="compactRepositoryUrl"
            type="url"
            required
            placeholder="https://github.com/owner/repo"
            value={repositoryUrl}
            onChange={(event) => setRepositoryUrl(event.target.value)}
            className={
              mode === "dank"
                ? "min-w-0 flex-1 bg-transparent font-mono text-lime-200 outline-none placeholder:text-lime-300/45"
                : "min-w-0 flex-1 bg-transparent outline-none placeholder:text-zinc-400"
            }
          />
        </div>
        <button
          type="submit"
          disabled={busy}
          className={
            mode === "dank"
              ? "min-h-12 border border-lime-200 bg-lime-300 px-6 font-black uppercase text-zinc-950 shadow-[0_0_22px_rgba(190,242,100,0.45)] hover:bg-lime-200 disabled:opacity-60"
              : "min-h-12 rounded-sm bg-emerald-700 px-6 font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-60"
          }
        >
          {busy ? "Reviewing..." : mode === "dank" ? "Review This Repo >_" : "Start Review ->"}
        </button>
      </div>
      {error ? <p className={mode === "dank" ? "text-xs text-pink-300" : "text-xs text-red-700"}>{error}</p> : null}
    </form>
  );
}
