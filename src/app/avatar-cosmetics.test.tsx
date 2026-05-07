import { afterEach, describe, expect, test, vi } from "vitest";
import { fetchPublicAccessoryLoadouts } from "./avatar-cosmetics";

describe("fetchPublicAccessoryLoadouts", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  test("normalizes saved public loadouts from the owner API", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          loadouts: {
            dank: {
              hat: { equipped: true },
            },
          },
        }),
      }),
    );

    const loadouts = await fetchPublicAccessoryLoadouts("vel-labs");

    expect(loadouts?.dank.hat.equipped).toBe(true);
    expect(loadouts?.clarity.hat.equipped).toBe(false);
    expect(fetch).toHaveBeenCalledWith("/api/owners/vel-labs/dank-loadout");
  });
});
