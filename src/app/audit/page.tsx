import { listReports } from "@/lib/storage";
import { AuditEmptyView } from "./view";
import { ReportView } from "../reports/[id]/report-view";

export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const reports = await listReports(100);
  const latest = reports[0];
  if (latest) {
    return <ReportView report={latest} section="overview" leaderboardReports={reports} />;
  }
  return <AuditEmptyView />;
}
