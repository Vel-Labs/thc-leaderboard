import { describe, expect, test } from "vitest";
import { invariantReportLabels, modeCopy } from "./modes";

describe("modeCopy", () => {
  test("keeps public review truth labels invariant across modes", () => {
    expect(invariantReportLabels.reviewLabel).toBe("Automated Public Review");
    expect(invariantReportLabels.disclaimer).toContain("not certification");
  });

  test("uses serious Clarity labels for report sections", () => {
    expect(modeCopy.clarity.evidence).toBe("Evidence");
    expect(modeCopy.clarity.caps).toBe("Caps Applied");
    expect(modeCopy.clarity.hiddenTrust).toBe("Hidden Trust");
  });

  test("uses meme labels only for Dank presentation", () => {
    expect(modeCopy.dank.evidence).toBe("Receipts");
    expect(modeCopy.dank.caps).toBe("Score Nerfs");
    expect(modeCopy.dank.hiddenTrust).toBe("Biggest Sus");
    expect(modeCopy.dank.nextActions).toBe("Un-Cook This Repo");
  });
});
