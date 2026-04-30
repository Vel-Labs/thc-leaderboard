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
});

export const reportSchema = z.object({
  id: z.string(),
  projectName: z.string(),
  repositoryUrl: z.string().url(),
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
});

export const reviewRequestSchema = z.object({
  repositoryUrl: z.string().min(1),
});

export type ReviewLabel = z.infer<typeof reviewLabelSchema>;
export type THCLevel = z.infer<typeof thcLevelSchema>;
export type EvidenceCategory = z.infer<typeof evidenceCategorySchema>;
export type EvidenceRow = z.infer<typeof evidenceRowSchema>;
export type HiddenTrustFinding = z.infer<typeof hiddenTrustFindingSchema>;
export type LocalArtifactStatus = z.infer<typeof localArtifactStatusSchema>;
export type THCReport = z.infer<typeof reportSchema>;
