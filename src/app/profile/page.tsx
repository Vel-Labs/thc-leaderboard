import { listReports } from "@/lib/storage";
import { ProfileView } from "./profile-view";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const reports = await listReports(50);
  return <ProfileView reports={reports} />;
}
