import { notFound } from "next/navigation";
import { listReports } from "@/lib/storage";
import { AboutView, type AboutSection } from "../../about-view";

const sections: AboutSection[] = ["methodology", "self-audit", "evidence", "trust-boundary", "reports"];

export const dynamic = "force-dynamic";

export default async function AboutSectionPage({ params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!sections.includes(section as AboutSection)) notFound();
  const reports = await listReports(section === "reports" ? 12 : 6);
  return <AboutView reports={reports} section={section as AboutSection} />;
}
