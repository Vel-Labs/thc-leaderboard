import "server-only";

import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { reportSchema, type THCReport } from "./thc/schema";

const reportsDir = path.join(process.cwd(), "data", "reports");

export async function saveReport(report: THCReport) {
  await mkdir(reportsDir, { recursive: true });
  const parsed = reportSchema.parse(report);
  await writeFile(path.join(reportsDir, `${parsed.id}.json`), JSON.stringify(parsed, null, 2));
  return parsed;
}

export async function getReport(id: string) {
  try {
    const text = await readFile(path.join(reportsDir, `${id}.json`), "utf8");
    return reportSchema.parse(JSON.parse(text));
  } catch {
    return null;
  }
}

export async function listReports(limit = 25) {
  try {
    const names = await readdir(reportsDir);
    const reports = await Promise.all(
      names
        .filter((name) => name.endsWith(".json"))
        .map((name) => getReport(name.replace(/\.json$/, ""))),
    );
    return reports
      .filter((report): report is THCReport => Boolean(report))
      .sort((a, b) => b.generatedAt.localeCompare(a.generatedAt))
      .slice(0, limit);
  } catch {
    return [];
  }
}
