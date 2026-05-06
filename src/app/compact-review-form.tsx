"use client";

import { useRouter } from "next/navigation";
import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { rememberSubmittedRepository } from "@/lib/ui/browser-submissions";
import { readApiResult } from "./api-response";
import { useDisplayMode } from "./mode-shell";
import { reviewRequestHeaders } from "./review-session";

type Preview = {
  owner: string;
  repo: string;
  projectName: string;
  stars: number;
  defaultBranch: string;
};

type ReviewJob = {
  id: string;
  status: "queued" | "leased" | "completed" | "failed" | "cancelled";
  stage: string;
  report_id: string | null;
  last_error: string | null;
  batch_status?: Array<{
    key: string;
    label: string;
    state: "queued" | "running" | "completed" | "fallback" | "failed";
  }>;
};

const reviewBatchSteps = [
  "Evidence",
  "Local artifacts",
  "Caps applied",
  "Hidden trust",
  "Next actions",
  "Overview",
];

export function CompactReviewForm() {
  const router = useRouter();
  const { mode } = useDisplayMode();
  const [repositoryUrl, setRepositoryUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [stage, setStage] = useState<"idle" | "preview" | "inspect" | "review" | "save">("idle");
  const [batchCursor, setBatchCursor] = useState(0);
  const [jobBatches, setJobBatches] = useState<ReviewJob["batch_status"]>([]);
  const [preview, setPreview] = useState<Preview | null>(null);

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setPreview(null);
    setBatchCursor(0);
    setJobBatches([]);
    setStage("preview");
    try {
      const reviewHeaders = await reviewRequestHeaders();
      const previewResponse = await fetch("/api/repositories/preview", {
        method: "POST",
        headers: reviewHeaders,
        body: JSON.stringify({ repositoryUrl }),
      });
      const previewPayload = await readApiResult<{ repository?: Preview }>(previewResponse, "Repository preview failed.");
      if (!previewResponse.ok || !previewPayload.repository) throw new Error(previewPayload.error ?? "Repository preview failed.");
      setPreview(previewPayload.repository);
      setStage("inspect");

      const createResponse = await fetch("/api/reviews/jobs", {
        method: "POST",
        headers: reviewHeaders,
        body: JSON.stringify({ repositoryUrl }),
      });
      const createPayload = await readApiResult<{ jobId?: string; job?: ReviewJob }>(createResponse, "Review job creation failed.");
      if (!createResponse.ok || !createPayload.jobId) throw new Error(createPayload.error ?? "Review job creation failed.");

      setStage("review");
      void fetch(`/api/reviews/jobs/${createPayload.jobId}/run`, {
        method: "POST",
        headers: reviewHeaders,
      }).catch((caught) => {
        setError(caught instanceof Error ? caught.message : "Review job failed.");
      });

      const completed = await pollReviewJob(createPayload.jobId, setJobBatches, setBatchCursor);
      if (!completed.report_id) throw new Error(completed.last_error ?? "Review completed without a report.");
      setStage("save");
      setBatchCursor(reviewBatchSteps.length);
      rememberSubmittedRepository(repositoryUrl);
      router.push(`/reports/${completed.report_id}`);
      router.refresh();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Review failed.");
    } finally {
      setBusy(false);
      setStage("idle");
      setBatchCursor(0);
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
          <ProgressStep mode={mode} done={stage === "save"} active={stage === "review"} label="Batched AI audit" />
          <ProgressStep mode={mode} done={stage === "save"} active={stage === "save"} label="Save report" />
        </div>
      ) : null}
      {busy && stage === "review" ? (
        <div className={mode === "dank" ? "mt-2 grid gap-1 border border-pink-500/25 bg-black/70 p-2 text-[11px] uppercase text-lime-100 sm:grid-cols-6" : "mt-2 grid gap-1 rounded-sm border border-stone-300 bg-white/70 p-2 text-[11px] text-stone-700 sm:grid-cols-6"}>
          {visibleBatchSteps(jobBatches).map((step, index) => (
            <ProgressStep key={step.label} mode={mode} done={step.done || batchCursor > index} active={step.active || batchCursor === index} label={step.label} />
          ))}
        </div>
      ) : null}
      {error ? <p className={mode === "dank" ? "text-xs text-pink-300" : "text-xs text-red-700"}>{error}</p> : null}
    </form>
  );
}

async function pollReviewJob(
  jobId: string,
  setBatches: (batches: ReviewJob["batch_status"]) => void,
  setCursor: Dispatch<SetStateAction<number>>,
) {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    const response = await fetch(`/api/reviews/jobs/${jobId}`, { cache: "no-store" });
    const payload = await readApiResult<{ job?: ReviewJob }>(response, "Review job lookup failed.");
    if (!response.ok || !payload.job) throw new Error(payload.error ?? "Review job lookup failed.");
    setBatches(payload.job.batch_status ?? []);
    setCursor(Math.max(0, visibleBatchSteps(payload.job.batch_status).filter((step) => step.done).length));
    if (payload.job.status === "completed") return payload.job;
    if (payload.job.status === "failed" || payload.job.status === "cancelled") {
      throw new Error(payload.job.last_error ?? "Review job failed.");
    }
    await new Promise((resolve) => window.setTimeout(resolve, 1800));
  }
  throw new Error("Review is still running. Check back on this job again shortly.");
}

function visibleBatchSteps(batches: ReviewJob["batch_status"] = []) {
  if (!batches.length) return reviewBatchSteps.map((label) => ({ label, done: false, active: false }));
  const selected = ["evidence", "local_artifacts", "caps_applied", "hidden_trust", "next_actions", "overview_synthesis"];
  return batches
    .filter((batch) => selected.includes(batch.key))
    .map((batch) => ({
      label: batch.label,
      done: batch.state === "completed" || batch.state === "fallback",
      active: batch.state === "running",
    }));
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
