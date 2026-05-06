import { authorizeReviewSubmission, ReviewSubmissionError } from "@/lib/review-submissions";
import { assertJsonRequest, RequestGuardError } from "@/lib/http-guards";
import { createReviewJob, reviewJobsEnabled } from "@/lib/review-jobs";
import { reviewRequestSchema } from "@/lib/thc/schema";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

export async function POST(request: Request) {
  try {
    if (!reviewJobsEnabled()) {
      return Response.json({ error: "Review job storage is not configured." }, { status: 503 });
    }

    assertJsonRequest(request, 2_048);
    const body = await request.json();
    const parsed = reviewRequestSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Repository URL is required." }, { status: 400 });
    }

    const requester = await authorizeReviewSubmission(request);
    const job = await createReviewJob(parsed.data.repositoryUrl, requester.userId);
    return Response.json({ jobId: job.id, job });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Review job creation failed.";
    const status = error instanceof ReviewSubmissionError || error instanceof RequestGuardError ? error.status : statusForError(message);
    return Response.json({ error: message }, { status });
  }
}

function statusForError(message: string) {
  if (message.includes("Only") || message.includes("Enter") || message.includes("Use the repository root")) return 400;
  if (message.includes("rate limit")) return 429;
  if (message.includes("Supabase")) return 503;
  return 500;
}
