import "server-only";

import type { ReviewAnalysis } from "./thc/schema";

type ReviewContext = {
  projectName: string;
  repositoryUrl: string;
  reviewedCommitSha: string;
  inspectedFiles: string[];
  boundedEvidence: string;
};

const defaultMiniMaxTimeoutMs = 20_000;

export type MiniMaxReviewDraft = {
  summary: string;
  strengths: string[];
  risks: string[];
  uncertaintyNotes: string[];
  sectionAnalysis: ReviewAnalysis;
};

export async function generateMiniMaxReviewDraft(context: ReviewContext): Promise<MiniMaxReviewDraft> {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    if (!mockReviewsAllowed()) {
      throw new Error("MiniMax API key is required for public review generation.");
    }
    return mockReviewDraft(context);
  }

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
          content: [
            "Review this public repository evidence under THC: Truth, Hardening, Clarity.",
            "Local THC artifacts, if present, are input only and not public truth.",
            "Return keys: summary, strengths, risks, uncertaintyNotes, sectionAnalysis.",
            "sectionAnalysis must include evidence, capsApplied, hiddenTrust, localArtifacts, nextActions.",
            "Each sectionAnalysis entry must include definition, whatIsWrong, aiNote.",
            "Do not change scoring or level meanings; explain only from public evidence.",
            JSON.stringify(context),
          ].join("\n\n"),
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
  if (!content) {
    throw new Error("MiniMax review returned no content.");
  }

  return normalizeDraft(parseMiniMaxJson(content));
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
  };
}

function normalizeDraft(value: unknown): MiniMaxReviewDraft {
  const draft = value as Partial<MiniMaxReviewDraft>;
  return {
    summary: typeof draft.summary === "string" ? draft.summary : "MiniMax returned limited review summary.",
    strengths: stringArray(draft.strengths),
    risks: stringArray(draft.risks),
    uncertaintyNotes: stringArray(draft.uncertaintyNotes),
    sectionAnalysis: normalizeSectionAnalysis(draft.sectionAnalysis),
  };
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(0, 6) : [];
}

function normalizeSectionAnalysis(value: unknown): ReviewAnalysis {
  const fallback = fallbackSectionAnalysis("this repository");
  if (!value || typeof value !== "object") return fallback;
  const draft = value as Partial<Record<keyof ReviewAnalysis, unknown>>;
  return {
    evidence: normalizeSection(draft.evidence, fallback.evidence),
    capsApplied: normalizeSection(draft.capsApplied, fallback.capsApplied),
    hiddenTrust: normalizeSection(draft.hiddenTrust, fallback.hiddenTrust),
    localArtifacts: normalizeSection(draft.localArtifacts, fallback.localArtifacts),
    nextActions: normalizeSection(draft.nextActions, fallback.nextActions),
  };
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
