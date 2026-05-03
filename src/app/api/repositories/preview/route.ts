import { previewPublicGitHubRepository } from "@/lib/github";
import { assertJsonRequest, RequestGuardError } from "@/lib/http-guards";
import { authorizeRepositoryPreview, ReviewSubmissionError } from "@/lib/review-submissions";
import { reviewRequestSchema } from "@/lib/thc/schema";

export const dynamic = "force-dynamic";
export const maxDuration = 15;

export async function POST(request: Request) {
  try {
    assertJsonRequest(request, 2_048);
    const body = await request.json();
    const parsed = reviewRequestSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Repository URL is required." }, { status: 400 });
    }

    await authorizeRepositoryPreview(request);
    const repository = await previewPublicGitHubRepository(parsed.data.repositoryUrl);
    return Response.json({ repository });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Repository preview failed.";
    const status = error instanceof ReviewSubmissionError || error instanceof RequestGuardError ? error.status : statusForError(message);
    return Response.json({ error: message }, { status });
  }
}

function statusForError(message: string) {
  if (message.includes("private") || message.includes("not found")) return 404;
  if (message.includes("rate limit")) return 429;
  if (message.includes("timed out")) return 504;
  if (message.includes("GitHub")) return 502;
  return 400;
}
