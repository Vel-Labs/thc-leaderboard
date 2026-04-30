import "server-only";

type ReviewContext = {
  projectName: string;
  repositoryUrl: string;
  reviewedCommitSha: string;
  inspectedFiles: string[];
  boundedEvidence: string;
};

export type MiniMaxReviewDraft = {
  summary: string;
  strengths: string[];
  risks: string[];
  uncertaintyNotes: string[];
};

export async function generateMiniMaxReviewDraft(context: ReviewContext): Promise<MiniMaxReviewDraft> {
  const apiKey = process.env.MINIMAX_API_KEY;
  if (!apiKey) {
    return mockReviewDraft(context);
  }

  const response = await fetch("https://api.minimax.io/v1/chat/completions", {
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
            "Return keys: summary, strengths, risks, uncertaintyNotes. Arrays should be concise.",
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

  return normalizeDraft(JSON.parse(content));
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
  };
}

function normalizeDraft(value: unknown): MiniMaxReviewDraft {
  const draft = value as Partial<MiniMaxReviewDraft>;
  return {
    summary: typeof draft.summary === "string" ? draft.summary : "MiniMax returned limited review summary.",
    strengths: stringArray(draft.strengths),
    risks: stringArray(draft.risks),
    uncertaintyNotes: stringArray(draft.uncertaintyNotes),
  };
}

function stringArray(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string").slice(0, 6) : [];
}
