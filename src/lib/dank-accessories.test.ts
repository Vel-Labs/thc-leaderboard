import { describe, expect, test } from "vitest";
import { accessoryOrder, defaultProfileAccessoryLoadouts, normalizeProfileAccessoryLoadouts } from "./dank-accessories";

describe("profile accessory loadouts", () => {
  test("keeps default accessories hidden until explicitly equipped", () => {
    expect(accessoryOrder.every((id) => !defaultProfileAccessoryLoadouts.clarity[id].equipped)).toBe(true);
    expect(accessoryOrder.every((id) => !defaultProfileAccessoryLoadouts.dank[id].equipped)).toBe(true);
  });

  test("does not equip missing accessory fields while preserving explicit saved equips", () => {
    const loadouts = normalizeProfileAccessoryLoadouts({
      clarity: {
        hat: { x: 12 },
      },
      dank: {
        glasses: { equipped: true },
      },
    });

    expect(loadouts.clarity.hat.equipped).toBe(false);
    expect(loadouts.dank.glasses.equipped).toBe(true);
    expect(loadouts.dank.hat.equipped).toBe(false);
  });

  test("accepts JSON encoded saved loadouts", () => {
    const loadouts = normalizeProfileAccessoryLoadouts(
      JSON.stringify({
        dank: {
          hat: { equipped: true },
        },
      }),
    );

    expect(loadouts.dank.hat.equipped).toBe(true);
    expect(loadouts.clarity.hat.equipped).toBe(false);
  });
});
