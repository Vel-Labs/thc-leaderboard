import { getReviewJob } from "@/lib/review-jobs";

export const dynamic = "force-dynamic";
export const maxDuration = 10;

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const job = await getReviewJob(id);
  if (!job) return Response.json({ error: "Review job was not found." }, { status: 404 });
  return Response.json({ job });
}
