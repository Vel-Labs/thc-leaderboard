"use client";

import { useRouter } from "next/navigation";
import { useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { rememberSubmittedRepository } from "@/lib/ui/browser-submissions";
import { readApiResult } from "./api-response";
import { useDisplayMode } from "./mode-shell";
import { reviewRequestHeaders } from "./review-session";

type ReviewState = "idle" | "validating" | "fetching" | "reviewing" | "saving" | "error";

type ReviewJob = {
  id: string;
  status: "queued" | "leased" | "completed" | "failed" | "cancelled";
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
  "Local Artifacts",
  "Caps Applied",
  "Hidden Trust",
  "Next Actions",
  "Overview",
];

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
  const [batchCursor, setBatchCursor] = useState(0);
  const [jobBatches, setJobBatches] = useState<ReviewJob["batch_status"]>([]);

  async function submitReview(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setBatchCursor(0);
    setJobBatches([]);
    setState("validating");

    try {
      setState("fetching");
      const reviewHeaders = await reviewRequestHeaders();
      const createResponse = await fetch("/api/reviews/jobs", {
        method: "POST",
        headers: reviewHeaders,
        body: JSON.stringify({ repositoryUrl }),
      });
      const createPayload = await readApiResult<{ jobId?: string; job?: ReviewJob }>(createResponse, "Review job creation failed.");
      if (!createResponse.ok || !createPayload.jobId) throw new Error(createPayload.error ?? "Review job creation failed.");

      setState("reviewing");
      void fetch(`/api/reviews/jobs/${createPayload.jobId}/run`, {
        method: "POST",
        headers: reviewHeaders,
      }).catch((caught) => {
        setError(caught instanceof Error ? caught.message : "Review job failed.");
      });

      const completed = await pollReviewJob(createPayload.jobId, setJobBatches, setBatchCursor);
      if (!completed.report_id) throw new Error(completed.last_error ?? "Review completed without a report.");

      setState("saving");
      setBatchCursor(reviewBatchSteps.length);
      rememberSubmittedRepository(repositoryUrl);
      router.push(`/reports/${completed.report_id}`);
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
        {state === "reviewing" ? (
          <div className={mode === "dank" ? "grid gap-1 border border-pink-500/25 bg-black/60 p-2 text-[11px] uppercase text-lime-100 sm:grid-cols-6" : "grid gap-1 rounded-md border border-zinc-200 bg-white/70 p-2 text-[11px] text-zinc-700 sm:grid-cols-6"}>
            {visibleBatchSteps(jobBatches).map((step, index) => (
              <div key={step.label} className="flex min-w-0 items-center gap-2">
                <span className={step.done || batchCursor > index ? "text-emerald-700" : step.active || batchCursor === index ? "text-amber-600" : "text-zinc-400"}>{step.done || batchCursor > index ? "✓" : step.active || batchCursor === index ? "…" : "○"}</span>
                <span className="truncate">{step.label}</span>
              </div>
            ))}
          </div>
        ) : null}
        {error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p> : null}
        <p className={mode === "dank" ? "text-xs leading-5 text-lime-50/55" : "text-xs leading-5 text-zinc-500"}>
          v1 fetches public GitHub files and sends bounded evidence to configured AI review providers for section notes. It does not run installs, scripts, tests, or project code.
        </p>
      </div>
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
