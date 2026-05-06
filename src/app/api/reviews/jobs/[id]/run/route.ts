import { authorizeReviewSubmission, recordSuccessfulReviewSubmission, ReviewSubmissionError } from "@/lib/review-submissions";
import { getReviewJob, runReviewJob } from "@/lib/review-jobs";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const requester = await authorizeReviewSubmission(request);
    const job = await getReviewJob(id);
    if (!job) return Response.json({ error: "Review job was not found." }, { status: 404 });
    if (job.status === "completed") return Response.json({ job });

    const completed = await runReviewJob(id, requester.userId);
    if (completed?.status === "completed") {
      await recordSuccessfulReviewSubmission(requester, completed.repository_url);
    }
    return Response.json({ job: completed });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Review job failed.";
    const status = error instanceof ReviewSubmissionError ? error.status : statusForError(message);
    return Response.json({ error: message }, { status });
  }
}

function statusForError(message: string) {
  if (message.includes("private") || message.includes("not found")) return 404;
  if (message.includes("rate limit")) return 429;
  if (message.includes("timed out")) return 504;
  if (message.includes("MiniMax")) return 502;
  if (message.includes("GitHub")) return 502;
  if (message.includes("Supabase")) return 503;
  return 500;
}
