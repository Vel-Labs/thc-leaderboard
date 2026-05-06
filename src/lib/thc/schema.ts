import { z } from "zod";

export const reviewLabels = [
  "Automated Public Review",
  "Local THC Check",
  "Self-Assessed",
  "Peer Reviewed",
  "Maintainer Reviewed",
  "Vel Labs Reviewed",
] as const;

export const thcLevels = [
  "THC-0 Unverified",
  "THC-1 Documented",
  "THC-2 Hardened",
  "THC-3 Inspectable",
  "THC-4 Reproducible",
  "THC-5 High-THC",
] as const;

export const evidenceCategories = [
  "Truth",
  "Hardening",
  "Clarity",
  "Audit History",
] as const;

export const reviewLabelSchema = z.enum(reviewLabels);
export const thcLevelSchema = z.enum(thcLevels);
export const evidenceCategorySchema = z.enum(evidenceCategories);

export const evidenceRowSchema = z.object({
  category: evidenceCategorySchema,
  evidence: z.string(),
  score: z.number().int().min(0).max(35),
  notes: z.string(),
});

export const hiddenTrustFindingSchema = z.object({
  finding: z.string(),
  severity: z.enum(["low", "medium", "high", "critical"]),
  evidence: z.string(),
  recommendation: z.string(),
});

export const localArtifactStatusSchema = z.object({
  state: z.enum([
    "absent",
    "present-verified-input",
    "present-stale-or-inconsistent",
    "present-unverified",
  ]),
  filesPresent: z.array(z.string()),
  findings: z.array(z.string()),
  publicReviewHandoffNotes: z.array(z.string()),
  thcBot: z.object({
    detected: z.boolean(),
    latestRunId: z.string().nullable(),
    contractVersion: z.string().nullable(),
    reviewedRevision: z.string().nullable(),
    localValidationState: z.enum(["Complete", "Partial Validation", "Invalid", "absent"]),
    publicVerificationState: z.enum([
      "full-audit",
      "verified-map",
      "hints-only",
      "private-only",
      "not-publicly-verified",
    ]),
    localRecommendedLevel: z.string().nullable(),
    localScore: z.number().int().min(0).max(100).nullable(),
    publicScore: z.number().int().min(0).max(100).nullable(),
    scoreDelta: z.number().int().nullable(),
    confidenceImpact: z.enum(["none", "reduced", "blocked"]),
    publicReadinessStatus: z.string(),
    capsConfirmed: z.array(z.string()),
    capsDisputedOrMissing: z.array(z.string()),
    hiddenTrustConfirmed: z.array(z.string()),
    hiddenTrustAdded: z.array(z.string()),
    evidenceLinksVerified: z.array(z.string()),
    evidenceLinksStaleMissingOrPrivate: z.array(z.string()),
    ignoredFiles: z.array(z.string()),
  }).default({
    detected: false,
    latestRunId: null,
    contractVersion: null,
    reviewedRevision: null,
    localValidationState: "absent",
    publicVerificationState: "full-audit",
    localRecommendedLevel: null,
    localScore: null,
    publicScore: null,
    scoreDelta: null,
    confidenceImpact: "none",
    publicReadinessStatus: "full public audit required",
    capsConfirmed: [],
    capsDisputedOrMissing: [],
    hiddenTrustConfirmed: [],
    hiddenTrustAdded: [],
    evidenceLinksVerified: [],
    evidenceLinksStaleMissingOrPrivate: [],
    ignoredFiles: [],
  }),
});

export const sectionAnalysisSchema = z.object({
  definition: z.string(),
  whatIsWrong: z.array(z.string()),
  aiNote: z.string(),
});

export const reviewAnalysisSchema = z.object({
  evidence: sectionAnalysisSchema,
  capsApplied: sectionAnalysisSchema,
  hiddenTrust: sectionAnalysisSchema,
  localArtifacts: sectionAnalysisSchema,
  nextActions: sectionAnalysisSchema,
});

export const reviewBatchSchema = z.object({
  slice: z.enum([
    "evidence",
    "local-artifacts",
    "caps-applied",
    "hidden-trust",
    "next-actions",
    "overview-synthesis",
  ]),
  state: z.enum(["queued", "running", "completed", "fallback"]),
  provider: z.string(),
  completedAt: z.string().nullable(),
  notes: z.array(z.string()),
});

export const reportSchema = z.object({
  id: z.string(),
  projectName: z.string(),
  repositoryUrl: z.string().url(),
  repositoryOwner: z.string().optional(),
  repositoryOwnerAvatarUrl: z.string().url().optional(),
  repositoryName: z.string().optional(),
  repositoryStars: z.number().int().min(0).default(0),
  repositoryForks: z.number().int().min(0).default(0),
  repositoryOpenIssues: z.number().int().min(0).default(0),
  repositoryDescription: z.string().nullable().optional(),
  defaultBranch: z.string().optional(),
  reviewedCommitSha: z.string().min(7),
  generatedAt: z.string(),
  rubricVersion: z.string(),
  reviewLabel: reviewLabelSchema,
  recommendedLevel: thcLevelSchema,
  totalScore: z.number().int().min(0).max(100),
  confidence: z.enum(["low", "medium", "high"]),
  capsApplied: z.array(z.string()),
  evidenceTable: z.array(evidenceRowSchema),
  hiddenTrustFindings: z.array(hiddenTrustFindingSchema),
  localArtifactStatus: localArtifactStatusSchema,
  inspectedFiles: z.array(z.string()),
  summary: z.string(),
  nextActions: z.array(z.string()),
  uncertaintyNotes: z.array(z.string()),
  topStrength: z.string(),
  topHiddenTrustFinding: z.string(),
  reviewBatches: z.array(reviewBatchSchema).default([]),
  reviewAnalysis: reviewAnalysisSchema.default({
    evidence: {
      definition: "Evidence is the public repository material inspected for the THC review.",
      whatIsWrong: ["Section analysis was not captured for this older report."],
      aiNote: "Regenerate the report to include AI-generated section notes.",
    },
    capsApplied: {
      definition: "Caps are deterministic limits applied after scoring when required evidence is missing or unverifiable.",
      whatIsWrong: ["Section analysis was not captured for this older report."],
      aiNote: "Regenerate the report to include AI-generated section notes.",
    },
    hiddenTrust: {
      definition: "Hidden trust identifies claims that require faith beyond public evidence.",
      whatIsWrong: ["Section analysis was not captured for this older report."],
      aiNote: "Regenerate the report to include AI-generated section notes.",
    },
    localArtifacts: {
      definition: "Local THC artifacts are treated as input hints, not public truth.",
      whatIsWrong: ["Section analysis was not captured for this older report."],
      aiNote: "Regenerate the report to include AI-generated section notes.",
    },
    nextActions: {
      definition: "Next actions are concrete changes likely to improve a future public review.",
      whatIsWrong: ["Section analysis was not captured for this older report."],
      aiNote: "Regenerate the report to include AI-generated section notes.",
    },
  }),
});

export const reviewRequestSchema = z.object({
  repositoryUrl: z.string().min(1).max(300),
});

export type ReviewLabel = z.infer<typeof reviewLabelSchema>;
export type THCLevel = z.infer<typeof thcLevelSchema>;
export type EvidenceCategory = z.infer<typeof evidenceCategorySchema>;
export type EvidenceRow = z.infer<typeof evidenceRowSchema>;
export type HiddenTrustFinding = z.infer<typeof hiddenTrustFindingSchema>;
export type LocalArtifactStatus = z.infer<typeof localArtifactStatusSchema>;
export type ReviewAnalysis = z.infer<typeof reviewAnalysisSchema>;
export type ReviewBatch = z.infer<typeof reviewBatchSchema>;
export type THCReport = z.infer<typeof reportSchema>;
