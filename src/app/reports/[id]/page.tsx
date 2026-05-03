import { notFound } from "next/navigation";
import { getReport, listReports } from "@/lib/storage";
import { ReportView } from "./report-view";

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const report = await getReport(id);
  if (!report) notFound();
  const leaderboardReports = await listReports(100);

  return <ReportView report={report} section="overview" leaderboardReports={leaderboardReports} />;
}
