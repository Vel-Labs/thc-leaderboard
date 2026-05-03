import { notFound } from "next/navigation";
import { getReport, listReports } from "@/lib/storage";
import { isReportSection } from "@/lib/ui/report-sections";
import { ReportView } from "../report-view";

export default async function ReportSectionPage({ params }: { params: Promise<{ id: string; section: string }> }) {
  const { id, section } = await params;
  if (!isReportSection(section) || section === "overview") notFound();

  const report = await getReport(id);
  if (!report) notFound();
  const leaderboardReports = await listReports(100);

  return <ReportView report={report} section={section} leaderboardReports={leaderboardReports} />;
}
