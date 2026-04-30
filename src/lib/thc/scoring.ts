import type { THCLevel } from "./schema";

const levelOrder: THCLevel[] = [
  "THC-0 Unverified",
  "THC-1 Documented",
  "THC-2 Hardened",
  "THC-3 Inspectable",
  "THC-4 Reproducible",
  "THC-5 High-THC",
];

const capLevels: Record<string, THCLevel> = {
  "Missing setup path": "THC-1 Documented",
  "No working setup path": "THC-1 Documented",
  "No public evidence for the requested level": "THC-1 Documented",
  "No visible validation path": "THC-2 Hardened",
  "Critical hidden-trust finding": "THC-2 Hardened",
  "Critical hidden trust finding unresolved": "THC-2 Hardened",
  "Core docs known to be stale": "THC-2 Hardened",
  "No source-of-truth boundary for core behavior": "THC-2 Hardened",
  "Docs and behavior known to diverge": "THC-2 Hardened",
  "Required operational knowledge is maintainer-only": "THC-3 Inspectable",
  "Maintainer-only operational knowledge required": "THC-3 Inspectable",
  "Reproduction requires private access without explanation": "THC-3 Inspectable",
  "Reproducibility depends on private access": "THC-3 Inspectable",
};

export function levelFromScore(score: number): THCLevel {
  if (score < 20) return "THC-0 Unverified";
  if (score < 40) return "THC-1 Documented";
  if (score < 60) return "THC-2 Hardened";
  if (score < 75) return "THC-3 Inspectable";
  if (score < 90) return "THC-4 Reproducible";
  return "THC-5 High-THC";
}

export function applyLevelCaps(level: THCLevel, caps: string[]) {
  const initialRank = levelOrder.indexOf(level);
  const cappedRank = caps.reduce((rank, cap) => {
    const capLevel = capLevels[cap];
    if (!capLevel) return rank;
    return Math.min(rank, levelOrder.indexOf(capLevel));
  }, initialRank);

  return {
    level: levelOrder[Math.max(0, cappedRank)],
    capsApplied: caps,
  };
}

export function sumEvidenceScores(rows: { score: number }[]) {
  return Math.max(
    0,
    Math.min(
      100,
      Math.round(rows.reduce((total, row) => total + row.score, 0)),
    ),
  );
}
