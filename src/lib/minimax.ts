import "server-only";

import type { ReviewAnalysis, ReviewBatch } from "./thc/schema";

type ReviewContext = {
  projectName: string;
  repositoryUrl: string;
  reviewedCommitSha: string;
  inspectedFiles: string[];
  boundedEvidence: string;
};

export type ReviewBatchUpdate = ReviewBatch;

type MiniMaxReviewOptions = {
  onBatch?: (batch: ReviewBatchUpdate) => Promise<void> | void;
};

const defaultMiniMaxTimeoutMs = 30_000;
const reviewSlices = [
  "evidence",
  "local-artifacts",
  "caps-applied",
  "hidden-trust",
  "next-actions",
] as const;

type ReviewSlice = (typeof reviewSlices)[number];

export type MiniMaxReviewDraft = {
  summary: string;
  strengths: string[];
  risks: string[];
  uncertaintyNotes: string[];
  sectionAnalysis: ReviewAnalysis;
  batches: ReviewBatch[];
};

export async function generateMiniMaxReviewDraft(context: ReviewContext, options: MiniMaxReviewOptions = {}): Promise<MiniMaxReviewDraft> {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    if (!mockReviewsAllowed()) {
      throw new Error("MiniMax API key is required for public review generation.");
    }
    const draft = mockReviewDraft(context);
    await publishBatches(draft.batches, options);
    return draft;
  }

  try {
    return generateBatchedMiniMaxReviewDraft(context, apiKey, options);
  } catch (error) {
    const message = error instanceof Error ? error.message : "MiniMax review failed.";
    if (message.includes("status 400") || message.includes("status 401") || message.includes("status 403")) {
      throw error;
    }
    const draft = providerUnavailableDraft(context, message);
    await publishBatches(draft.batches, options);
    return draft;
  }
}

async function generateBatchedMiniMaxReviewDraft(context: ReviewContext, apiKey: string, options: MiniMaxReviewOptions): Promise<MiniMaxReviewDraft> {
  const settledSlices = await Promise.all(
    reviewSlices.map(async (slice) => {
      try {
        const value = await callMiniMaxJson(apiKey, slicePrompt(slice, context));
        const batch = completedBatch(slice);
        await options.onBatch?.(batch);
        return {
          slice,
          section: normalizeSection(value, fallbackSectionForSlice(slice, context.projectName)),
          batch,
        };
      } catch (error) {
        const message = error instanceof Error ? error.message : "MiniMax slice failed.";
        if (message.includes("status 400") || message.includes("status 401") || message.includes("status 403")) throw error;
        const batch = fallbackBatch(slice, message);
        await options.onBatch?.(batch);
        return {
          slice,
          section: fallbackSectionForSlice(slice, context.projectName),
          batch,
        };
      }
    }),
  );

  const sectionAnalysis = sectionAnalysisFromSlices(context.projectName, settledSlices);
  const sliceBatches = settledSlices.map((slice) => slice.batch);

  try {
    const synthesis = await callMiniMaxJson(apiKey, synthesisPrompt(context, sectionAnalysis));
    const normalized = normalizeSynthesis(synthesis, context);
    return {
      ...normalized,
      sectionAnalysis,
      batches: [...sliceBatches, await publishBatch(completedBatch("overview-synthesis"), options)],
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "MiniMax synthesis failed.";
    if (message.includes("status 400") || message.includes("status 401") || message.includes("status 403")) throw error;
    const fallback = providerUnavailableDraft(context, message);
    return {
      ...fallback,
      sectionAnalysis,
      batches: [...sliceBatches, await publishBatch(fallbackBatch("overview-synthesis", message), options)],
    };
  }
}

async function callMiniMaxJson(apiKey: string, prompt: string) {
  const response = await fetchMiniMax({
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.MINIMAX_MODEL ?? "MiniMax-M2.7",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You assist THC public reviews. Return JSON only. Do not invent files, endorsements, certification, security approval, production readiness, or Vel Labs review.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`MiniMax review failed with status ${response.status}.`);
  }

  const payload = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = payload.choices?.[0]?.message?.content;
  if (!content) throw new Error("MiniMax returned no review content.");
  return parseMiniMaxJson(content);
}

function slicePrompt(slice: ReviewSlice, context: ReviewContext) {
  return [
    `Review slice: ${slice}`,
    "Review this public repository evidence under THC: Truth, Hardening, Clarity.",
    "This is one scoped batch in a larger public audit. Do not summarize unrelated slices.",
    "Local THC-BOT or local THC artifacts, if present, are input maps only and not public truth.",
    "Return JSON keys only: definition, whatIsWrong, aiNote.",
    "definition should define this slice for a public reviewer.",
    "whatIsWrong should list concrete missing, stale, private, or weak public evidence for this slice.",
    "aiNote should explain the slice result without changing deterministic score, caps, or levels.",
    "Do not invent files, private evidence, endorsement, certification, security approval, production readiness, or Vel Labs review.",
    JSON.stringify(context),
  ].join("\n\n");
}

function synthesisPrompt(context: ReviewContext, sectionAnalysis: ReviewAnalysis) {
  return [
    "Review slice: overview-synthesis",
    "Create the final overview from completed THC review slices only.",
    "Return JSON keys only: summary, strengths, risks, uncertaintyNotes.",
    "Do not change deterministic score, caps, levels, or public verification facts.",
    "Do not invent files, endorsement, certification, security approval, production readiness, or Vel Labs review.",
    JSON.stringify({ context, sectionAnalysis }),
  ].join("\n\n");
}

function mockReviewsAllowed() {
  return process.env.MINIMAX_ALLOW_MOCKS === "true" || process.env.NODE_ENV !== "production";
}

async function fetchMiniMax(init: RequestInit) {
  try {
    return await fetch("https://api.minimax.io/v1/chat/completions", {
      ...init,
      signal: AbortSignal.timeout(miniMaxTimeoutMs()),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new Error("MiniMax review timed out.");
    }
    throw error;
  }
}

function miniMaxTimeoutMs() {
  const parsed = Number(process.env.THC_MINIMAX_TIMEOUT_MS ?? defaultMiniMaxTimeoutMs);
  return Number.isFinite(parsed) && parsed >= 1_000 ? Math.floor(parsed) : defaultMiniMaxTimeoutMs;
}

function parseMiniMaxJson(content: string) {
  const withoutThinkBlocks = content.replace(/<think>[\s\S]*?<\/think>/gi, "").trim();
  const fenced = withoutThinkBlocks.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim();
  const candidate = fenced ?? withoutThinkBlocks;
  try {
    return JSON.parse(candidate);
  } catch {
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start >= 0 && end > start) {
      return JSON.parse(candidate.slice(start, end + 1));
    }
    throw new Error("MiniMax review returned invalid JSON.");
  }
}

function mockReviewDraft(context: ReviewContext): MiniMaxReviewDraft {
  return {
    summary: `${context.projectName} was reviewed from public repository artifacts at ${context.reviewedCommitSha.slice(0, 12)}. This v1 mock draft scores visible evidence only and should be replaced by MiniMax output when MINIMAX_API_KEY is configured.`,
    strengths: [
      context.inspectedFiles.includes("README.md")
        ? "README evidence is visible at the reviewed commit."
        : "Repository inspection completed, but top-level README evidence was limited.",
    ],
    risks: [
      "Automated review cannot execute project code or verify private operational knowledge in v1.",
    ],
    uncertaintyNotes: [
      "MiniMax API key was not configured, so deterministic mock reasoning was used.",
    ],
    sectionAnalysis: fallbackSectionAnalysis(context.projectName),
    batches: fallbackBatches("MiniMax API key was not configured."),
  };
}

function providerUnavailableDraft(context: ReviewContext, reason: string): MiniMaxReviewDraft {
  return {
    summary: `${context.projectName} was reviewed from public repository artifacts at ${context.reviewedCommitSha.slice(0, 12)}. Deterministic THC scoring completed, but the configured AI note provider did not return in time for this live request.`,
    strengths: [
      context.inspectedFiles.includes("README.md")
        ? "README evidence is visible at the reviewed commit."
        : "Repository inspection completed, but top-level README evidence was limited.",
    ],
    risks: [
      "AI sidecar notes were unavailable for this run; deterministic scoring, caps, evidence rows, and hidden-trust checks remain authoritative.",
    ],
    uncertaintyNotes: [
      `AI note provider unavailable: ${reason}`,
      "This report used deterministic fallback section notes so the public review could be saved instead of timing out.",
    ],
    sectionAnalysis: fallbackSectionAnalysis(context.projectName),
    batches: fallbackBatches(reason),
  };
}

function normalizeSynthesis(value: unknown, context: ReviewContext) {
  const draft = value as Partial<MiniMaxReviewDraft>;
  return {
    summary: typeof draft.summary === "string" ? draft.summary : `${context.projectName} was reviewed from public repository artifacts at ${context.reviewedCommitSha.slice(0, 12)} using batched THC review slices.`,
    strengths: stringArray(draft.strengths),
    risks: stringArray(draft.risks),
    uncertaintyNotes: stringArray(draft.uncertaintyNotes),
  };
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(0, 6) : [];
}

function normalizeSection(value: unknown, fallback: ReviewAnalysis[keyof ReviewAnalysis]) {
  if (!value || typeof value !== "object") return fallback;
  const section = value as Partial<ReviewAnalysis[keyof ReviewAnalysis]>;
  return {
    definition: typeof section.definition === "string" ? section.definition : fallback.definition,
    whatIsWrong: stringArray(section.whatIsWrong).length ? stringArray(section.whatIsWrong) : fallback.whatIsWrong,
    aiNote: typeof section.aiNote === "string" ? section.aiNote : fallback.aiNote,
  };
}

function fallbackSectionAnalysis(projectName: string): ReviewAnalysis {
  return {
    evidence: {
      definition: "Evidence is the public repository material inspected for the THC review.",
      whatIsWrong: ["Only visible public files can receive credit; private claims and unstated maintainer knowledge do not count."],
      aiNote: `${projectName} should make evidence paths explicit so reviewers can verify claims without relying on implied context.`,
    },
    capsApplied: {
      definition: "Caps are deterministic limits applied after scoring when required evidence is missing, stale, or unverifiable.",
      whatIsWrong: ["Caps indicate the repository has a review blocker even if some scorecard categories look strong."],
      aiNote: "Resolve caps before optimizing for higher THC levels; caps are the ceiling that keeps the label honest.",
    },
    hiddenTrust: {
      definition: "Hidden trust identifies places where users must trust claims not backed by public, inspectable evidence.",
      whatIsWrong: ["The review penalizes missing setup, validation, provenance, and operational handoff evidence."],
      aiNote: "Convert hidden trust into public artifacts: setup docs, validation commands, provenance, decision records, and recovery notes.",
    },
    localArtifacts: {
      definition: "Local THC artifacts are useful inputs but are not public truth until independently verified against the reviewed commit.",
      whatIsWrong: ["Absent, stale, or unverifiable local artifacts cannot raise the public review label."],
      aiNote: "Keep docs/thc artifacts fresh, hashable, and tied to the exact reviewed revision.",
    },
    nextActions: {
      definition: "Next actions are concrete public changes likely to improve a future THC review.",
      whatIsWrong: ["The current action list focuses on blockers and missing evidence, not cosmetic polish."],
      aiNote: "Prioritize changes that make the repo independently inspectable from a fresh clone.",
    },
  };
}

function sectionAnalysisFromSlices(
  projectName: string,
  slices: Array<{ slice: ReviewSlice; section: ReviewAnalysis[keyof ReviewAnalysis] }>,
): ReviewAnalysis {
  const fallback = fallbackSectionAnalysis(projectName);
  const bySlice = new Map(slices.map((slice) => [slice.slice, slice.section]));
  return {
    evidence: bySlice.get("evidence") ?? fallback.evidence,
    localArtifacts: bySlice.get("local-artifacts") ?? fallback.localArtifacts,
    capsApplied: bySlice.get("caps-applied") ?? fallback.capsApplied,
    hiddenTrust: bySlice.get("hidden-trust") ?? fallback.hiddenTrust,
    nextActions: bySlice.get("next-actions") ?? fallback.nextActions,
  };
}

function fallbackSectionForSlice(slice: ReviewSlice, projectName: string) {
  const fallback = fallbackSectionAnalysis(projectName);
  if (slice === "local-artifacts") return fallback.localArtifacts;
  if (slice === "caps-applied") return fallback.capsApplied;
  if (slice === "hidden-trust") return fallback.hiddenTrust;
  if (slice === "next-actions") return fallback.nextActions;
  return fallback.evidence;
}

function completedBatch(slice: ReviewBatch["slice"]): ReviewBatch {
  return {
    slice,
    state: "completed",
    provider: "minimax",
    completedAt: new Date().toISOString(),
    notes: ["Review slice completed."],
  };
}

function fallbackBatch(slice: ReviewBatch["slice"], reason: string): ReviewBatch {
  return {
    slice,
    state: "fallback",
    provider: "deterministic-fallback",
    completedAt: new Date().toISOString(),
    notes: [`Review slice used fallback notes: ${reason}`],
  };
}

function fallbackBatches(reason: string): ReviewBatch[] {
  return [
    ...reviewSlices.map((slice) => fallbackBatch(slice, reason)),
    fallbackBatch("overview-synthesis", reason),
  ];
}

async function publishBatch(batch: ReviewBatch, options: MiniMaxReviewOptions) {
  await options.onBatch?.(batch);
  return batch;
}

async function publishBatches(batches: ReviewBatch[], options: MiniMaxReviewOptions) {
  for (const batch of batches) await options.onBatch?.(batch);
}
