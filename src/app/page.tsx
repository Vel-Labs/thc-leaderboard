import { listReports } from "@/lib/storage";
import { AboutView } from "./about-view";

export const dynamic = "force-dynamic";

export default async function Home() {
  const reports = await listReports(6);
  return <AboutView reports={reports} section="desk" />;
}
