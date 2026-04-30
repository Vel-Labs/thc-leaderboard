import { describe, expect, test } from "vitest";
import { applyLevelCaps, levelFromScore } from "./scoring";

describe("THC scoring", () => {
  test("maps documented score bands to THC levels", () => {
    expect(levelFromScore(0)).toBe("THC-0 Unverified");
    expect(levelFromScore(39)).toBe("THC-1 Documented");
    expect(levelFromScore(40)).toBe("THC-2 Hardened");
    expect(levelFromScore(74)).toBe("THC-3 Inspectable");
    expect(levelFromScore(75)).toBe("THC-4 Reproducible");
    expect(levelFromScore(90)).toBe("THC-5 High-THC");
  });

  test("applies the most restrictive documented cap after scoring", () => {
    const result = applyLevelCaps("THC-5 High-THC", [
      "No visible validation path",
      "Maintainer-only operational knowledge required",
    ]);

    expect(result.level).toBe("THC-2 Hardened");
    expect(result.capsApplied).toEqual([
      "No visible validation path",
      "Maintainer-only operational knowledge required",
    ]);
  });
});
