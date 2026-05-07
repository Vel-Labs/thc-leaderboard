import { beforeEach, describe, expect, test, vi } from "vitest";

const insertMock = vi.fn();
const getUserMock = vi.fn();

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServiceClient: () => ({
    auth: { getUser: getUserMock },
    from: vi.fn(() => ({ insert: insertMock })),
  }),
}));

describe("POST /api/profile/feedback", () => {
  beforeEach(() => {
    insertMock.mockReset();
    getUserMock.mockReset();
    getUserMock.mockResolvedValue({ data: { user: { id: "user-1" } }, error: null });
    insertMock.mockResolvedValue({ error: null });
  });

  test("stores signed-in feedback in Supabase", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("https://thc.local/api/profile/feedback", {
        method: "POST",
        headers: {
          authorization: "Bearer token-1",
          "content-type": "application/json",
        },
        body: JSON.stringify({ category: "feature_request", body: "Please add a tiny pixel crown accessory." }),
      }),
    );

    expect(response.status).toBe(200);
    expect(getUserMock).toHaveBeenCalledWith("token-1");
    expect(insertMock).toHaveBeenCalledWith({
      body: "Please add a tiny pixel crown accessory.",
      feedback_type: "feature_request",
      user_id: "user-1",
    });
  });

  test("rejects unsigned feedback", async () => {
    const { POST } = await import("./route");
    const response = await POST(
      new Request("https://thc.local/api/profile/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ category: "feature_request", body: "Please add a tiny pixel crown accessory." }),
      }),
    );

    expect(response.status).toBe(401);
    expect(insertMock).not.toHaveBeenCalled();
  });
});
