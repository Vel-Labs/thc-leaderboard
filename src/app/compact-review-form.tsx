"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { rememberSubmittedRepository } from "@/lib/ui/browser-submissions";
import { useDisplayMode } from "./mode-shell";
import { reviewRequestHeaders } from "./review-session";

type Preview = {
  owner: string;
  repo: string;
  projectName: string;
  stars: number;
  defaultBranch: string;
};

export function CompactReviewForm() {
  const router = useRouter();
  const { mode } = useDisplayMode();
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [stage, setStage] = useState<"idle" | "preview" | "inspect" | "review" | "save">("idle");
  const [preview, setPreview] = useState<Preview | null>(null);

  async function submitReview(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setPreview(null);
    setStage("preview");
    try {
      const reviewHeaders = await reviewRequestHeaders();
      const previewResponse = await fetch("/api/repositories/preview", {
        method: "POST",
        headers: reviewHeaders,
        body: JSON.stringify({ repositoryUrl }),
      });
      const previewPayload = (await previewResponse.json()) as { repository?: Preview; error?: string };
      if (!previewResponse.ok || !previewPayload.repository) throw new Error(previewPayload.error ?? "Repository preview failed.");
      setPreview(previewPayload.repository);
      setStage("inspect");
      window.setTimeout(() => setStage((current) => (current === "inspect" ? "review" : current)), 600);
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: reviewHeaders,
        body: JSON.stringify({ repositoryUrl }),
      });
      const payload = (await response.json()) as { reportId?: string; error?: string };
      if (!response.ok || !payload.reportId) throw new Error(payload.error ?? "Review failed.");
      setStage("save");
      rememberSubmittedRepository(repositoryUrl);
      router.push(`/reports/${payload.reportId}`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Review failed.");
    } finally {
      setBusy(false);
      setStage("idle");
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
              ? "min-h-12 shrink-0 whitespace-nowrap border border-lime-200 bg-lime-300 px-4 font-black uppercase text-zinc-950 shadow-[0_0_22px_rgba(190,242,100,0.45)] hover:bg-lime-200 disabled:opacity-60 sm:px-6"
              : "min-h-12 shrink-0 whitespace-nowrap rounded-sm bg-emerald-700 px-4 font-semibold text-white shadow-sm hover:bg-emerald-800 disabled:opacity-60 sm:px-6"
          }
        >
          {busy ? (
            "Reviewing..."
          ) : mode === "dank" ? (
            <>
              <span className="sm:hidden">Review &gt;_</span>
              <span className="hidden sm:inline">Review This Repo &gt;_</span>
            </>
          ) : (
            <>
              <span className="sm:hidden">Start -&gt;</span>
              <span className="hidden sm:inline">Start Review -&gt;</span>
            </>
          )}
        </button>
      </div>
      {busy || preview ? (
        <div className={mode === "dank" ? "mt-2 grid gap-1 border border-lime-300/25 bg-black/70 p-2 text-[11px] uppercase text-lime-100 sm:grid-cols-4" : "mt-2 grid gap-1 rounded-sm border border-stone-300 bg-white/70 p-2 text-[11px] text-stone-700 sm:grid-cols-4"}>
          <ProgressStep mode={mode} done={Boolean(preview)} active={stage === "preview"} label={preview ? `${preview.owner}/${preview.repo}` : "Repo metadata"} />
          <ProgressStep mode={mode} done={["review", "save"].includes(stage)} active={stage === "inspect"} label="Public files" />
          <ProgressStep mode={mode} done={stage === "save"} active={stage === "review"} label="AI review notes" />
          <ProgressStep mode={mode} done={stage === "save"} active={stage === "save"} label="Save report" />
        </div>
      ) : null}
      {error ? <p className={mode === "dank" ? "text-xs text-pink-300" : "text-xs text-red-700"}>{error}</p> : null}
    </form>
  );
}

function ProgressStep({ mode, done, active, label }: { mode: "clarity" | "dank"; done: boolean; active: boolean; label: string }) {
  const mark = done ? "✓" : active ? "…" : "○";
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className={done ? "text-emerald-700 dark:text-lime-300" : active ? "text-amber-600 dark:text-pink-300" : "text-stone-400"}>{mark}</span>
      <span className={mode === "dank" ? "truncate text-lime-100/75" : "truncate"}>{label}</span>
    </div>
  );
}
