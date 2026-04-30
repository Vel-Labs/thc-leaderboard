import { listReports } from "@/lib/storage";
import { LeaderboardView } from "./view";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const reports = await listReports(100);
  return <LeaderboardView reports={reports} />;
}
