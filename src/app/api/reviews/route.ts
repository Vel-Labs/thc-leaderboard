import { authorizeReviewSubmission, ReviewSubmissionError } from "@/lib/review-submissions";
import { assertJsonRequest, RequestGuardError } from "@/lib/http-guards";
import { createPublicReview } from "@/lib/thc/review";
import { reviewRequestSchema } from "@/lib/thc/schema";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    assertJsonRequest(request, 2_048);
    const body = await request.json();
    const parsed = reviewRequestSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Repository URL is required." }, { status: 400 });
    }

    const requester = await authorizeReviewSubmission(request, parsed.data.repositoryUrl);
    const report = await createPublicReview(parsed.data.repositoryUrl, { submittedBy: requester.userId });
    return Response.json({ reportId: report.id, report });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Review failed.";
    const status = error instanceof ReviewSubmissionError || error instanceof RequestGuardError ? error.status : statusForError(message);
    return Response.json({ error: message }, { status });
  }
}

function statusForError(message: string) {
  if (message.includes("Only") || message.includes("Enter") || message.includes("Use the repository root")) return 400;
  if (message.includes("private") || message.includes("not found")) return 404;
  if (message.includes("rate limit")) return 429;
  if (message.includes("timed out")) return 504;
  if (message.includes("MiniMax")) return 502;
  if (message.includes("GitHub")) return 502;
  return 500;
}
