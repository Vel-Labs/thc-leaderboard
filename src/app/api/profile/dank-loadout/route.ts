import { z } from "zod";
import { normalizeProfileAccessoryLoadouts } from "@/lib/dank-accessories";
import { assertJsonRequest, RequestGuardError } from "@/lib/http-guards";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const saveLoadoutSchema = z.object({
  accessories: z.unknown().optional(),
  loadouts: z.unknown().optional(),
});

export async function POST(request: Request) {
  try {
    assertJsonRequest(request, 16_384);
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

    const body = saveLoadoutSchema.safeParse(await request.json());
    if (!body.success) {
      return Response.json({ error: "Invalid loadout." }, { status: 400 });
    }

    const metadata = userData.user.user_metadata;
    const githubLogin = stringValue(metadata.user_name) ?? stringValue(metadata.preferred_username) ?? stringValue(metadata.name);
    if (!githubLogin) {
      return Response.json({ error: "GitHub login was not found on the authenticated user." }, { status: 400 });
    }

    const loadouts = normalizeProfileAccessoryLoadouts(body.data.loadouts ?? body.data.accessories);
    const { error } = await supabase.from("github_profiles").upsert(
      {
        auth_user_id: userData.user.id,
        github_login: githubLogin,
        display_name: stringValue(metadata.full_name) ?? stringValue(metadata.name),
        avatar_url: stringValue(metadata.avatar_url) ?? stringValue(metadata.picture),
        dank_accessories: loadouts,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "github_login" },
    );

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ githubLogin, loadouts });
  } catch (error) {
    if (error instanceof RequestGuardError) {
      return Response.json({ error: error.message }, { status: error.status });
    }
    throw error;
  }
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim().length ? value.trim() : undefined;
}
