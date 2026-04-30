import { createPublicReview } from "@/lib/thc/review";
import { reviewRequestSchema } from "@/lib/thc/schema";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = reviewRequestSchema.safeParse(body);
    if (!parsed.success) {
      return Response.json({ error: "Repository URL is required." }, { status: 400 });
    }

    const report = await createPublicReview(parsed.data.repositoryUrl);
    return Response.json({ reportId: report.id, report });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Review failed.";
    const status = statusForError(message);
    return Response.json({ error: message }, { status });
  }
}

function statusForError(message: string) {
  if (message.includes("Only") || message.includes("Enter") || message.includes("Use the repository root")) return 400;
  if (message.includes("private") || message.includes("not found")) return 404;
  if (message.includes("MiniMax")) return 502;
  return 500;
}
