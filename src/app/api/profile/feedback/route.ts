import { z } from "zod";
import { assertJsonRequest, RequestGuardError } from "@/lib/http-guards";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const feedbackSchema = z.object({
  category: z.enum(["methodology", "report", "false_positive", "false_negative", "feature_request"]),
  body: z.string().trim().min(10).max(4000),
});

export async function POST(request: Request) {
  try {
    assertJsonRequest(request, 8_192);
    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return Response.json({ error: "Supabase server config is missing." }, { status: 503 });
    }

    const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
    if (!token) {
      return Response.json({ error: "Authentication is required." }, { status: 401 });
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData.user) {
      return Response.json({ error: "Invalid session." }, { status: 401 });
    }

    const body = feedbackSchema.safeParse(await request.json());
    if (!body.success) {
      return Response.json({ error: "Choose a category and enter at least 10 characters." }, { status: 400 });
    }

    const { error } = await supabase.from("feedback").insert({
      body: body.data.body,
      feedback_type: body.data.category,
      user_id: userData.user.id,
    });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ ok: true });
  } catch (error) {
    if (error instanceof RequestGuardError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}
