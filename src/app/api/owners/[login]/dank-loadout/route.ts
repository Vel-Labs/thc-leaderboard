import { normalizeProfileAccessoryLoadouts } from "@/lib/dank-accessories";
import { getSupabaseServiceClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: RouteContext<"/api/owners/[login]/dank-loadout">) {
  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    return Response.json({ loadouts: null });
  }

  const { login } = await context.params;
  const { data, error } = await supabase
    .from("github_profiles")
    .select("dank_accessories")
    .eq("github_login", login)
    .maybeSingle();

  if (error || !data?.dank_accessories) {
    return Response.json({ loadouts: null });
  }

  return Response.json({ loadouts: normalizeProfileAccessoryLoadouts(data.dank_accessories) });
}
