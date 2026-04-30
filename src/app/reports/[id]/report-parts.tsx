import type { THCReport } from "@/lib/thc/schema";
import { invariantReportLabels } from "@/lib/ui/modes";

export function MetaLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide opacity-75">{label}</p>
      <p className="mt-1 break-all font-mono">{value}</p>
    </div>
  );
}

export function ScoreTile({ label, value, sub, variant }: { label: string; value: string; sub: string; variant: "level" | "score" | "confidence" }) {
  return (
    <div className="relative min-h-24 border-r border-stone-300 p-3 last:border-r-0 2xl:p-4">
      <p className="text-xs uppercase tracking-wide text-stone-500">{label}</p>
      <div className={variant === "score" ? "mt-1 text-4xl font-light tabular-nums 2xl:text-5xl" : variant === "level" ? "mt-1 font-serif text-4xl font-semibold text-emerald-800 2xl:text-5xl" : "mt-1 text-3xl font-semibold text-emerald-700 2xl:text-4xl"}>
        {value}{variant === "score" ? <span className="text-3xl"> / 100</span> : null}
      </div>
      {variant === "score" ? null : <p className="mt-1 text-sm capitalize text-stone-600">{sub}</p>}
      {variant === "score" ? (
        <div className="mt-2">
          <div className="h-2 bg-stone-200">
            <div className="h-full bg-emerald-700" style={{ width: `${Math.max(0, Math.min(100, Number(value)))}%` }} />
          </div>
          <div className="mt-1 flex justify-between text-[10px] text-stone-500">
            <span>0</span><span>25</span><span>50</span><span>75</span><span>100</span>
          </div>
        </div>
      ) : null}
      {variant === "level" ? (
        <span className="absolute bottom-3 right-4 grid h-8 w-8 place-items-center border-2 border-emerald-700 text-emerald-700">✓</span>
      ) : null}
      {variant === "confidence" ? (
        <span className="absolute bottom-3 right-4 flex h-8 items-end gap-1 text-emerald-700" aria-hidden>
          <span className="h-2 w-1.5 bg-emerald-700" />
          <span className="h-4 w-1.5 bg-emerald-700" />
          <span className="h-6 w-1.5 bg-emerald-700" />
        </span>
      ) : null}
    </div>
  );
}

export function MiniScore({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="border-r border-stone-300 p-3 last:border-r-0">
      <div className="flex justify-between text-xs font-semibold">
        <span>{label}</span>
        <span>{value} / {max}</span>
      </div>
      <div className="mt-2 h-2 bg-stone-200">
        <div className="h-full bg-emerald-700" style={{ width: `${Math.round((value / max) * 100)}%` }} />
      </div>
    </div>
  );
}

export function DankMetric({ title, value, sub }: { title: string; value: string; sub: string; wide?: boolean }) {
  const scoreValue = Number(value.split("/")[0]);
  const percent = Number.isFinite(scoreValue) ? Math.max(0, Math.min(100, scoreValue)) : 68;
  return (
    <div className="relative border border-pink-500/65 bg-black/75 p-3 shadow-[0_0_14px_rgba(236,72,153,0.18)] 2xl:p-4">
      <p className="text-xs uppercase tracking-widest text-pink-400">{title}</p>
      <p className="mt-1 text-4xl font-black text-lime-300 drop-shadow-[0_0_10px_rgba(190,242,100,0.55)] 2xl:text-5xl">{value}</p>
      <p className="mt-1 uppercase text-pink-300">{sub}</p>
      <div className="mt-2 h-2 border border-lime-300/25 bg-black">
        <div className="h-full bg-gradient-to-r from-pink-500 via-lime-300 to-cyan-300" style={{ width: `${percent}%` }} />
      </div>
      {title === "Vibe Check" ? (
        <svg className="absolute bottom-2 right-3 h-8 w-16 text-pink-400" viewBox="0 0 64 32" aria-hidden>
          <path d="M2 26 L10 23 L16 25 L22 14 L28 19 L34 10 L40 18 L46 7 L52 13 L60 4" fill="none" stroke="currentColor" strokeWidth="2" />
        </svg>
      ) : null}
    </div>
  );
}

export function DankMiniScore({ label, value, max }: { label: string; value: number; max: number }) {
  return (
    <div className="border border-lime-300/35 bg-black/70 p-3">
      <div className="flex justify-between text-xs font-black uppercase text-lime-300">
        <span>{label}</span>
        <span>{value}/{max}</span>
      </div>
      <p className="mt-1 text-2xl font-black text-lime-300 2xl:text-3xl">{value}</p>
      <div className="mt-2 h-2 border border-lime-300/30 bg-black">
        <div className="h-full bg-gradient-to-r from-lime-300 to-pink-400" style={{ width: `${Math.round((value / max) * 100)}%` }} />
      </div>
    </div>
  );
}

export function PinnedNote({ title, children, tone }: { title: string; children: React.ReactNode; tone: "white" | "amber" | "green" }) {
  const toneClass = tone === "amber" ? "border-amber-300 bg-amber-100" : tone === "green" ? "border-emerald-200 bg-emerald-50" : "border-stone-200 bg-white";
  return (
    <div className={`relative rotate-[-1deg] border p-3 text-xs leading-5 shadow-[6px_8px_16px_rgba(68,64,60,0.12)] 2xl:text-sm ${toneClass}`}>
      <span className="absolute -top-3 left-6 h-5 w-10 rounded-sm bg-stone-200/80" />
      {title ? <p className="mb-2 font-serif text-base font-semibold 2xl:text-lg">{title}</p> : null}
      {children}
    </div>
  );
}

export function DankTape({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="relative rotate-[-1deg] border border-lime-300/45 bg-black/75 p-3 text-xs leading-5 text-lime-100 shadow-[0_0_18px_rgba(190,242,100,0.12)] 2xl:text-sm">
      <span className="absolute -left-2 -top-2 h-5 w-12 rotate-[-18deg] bg-lime-300/45" />
      <span className="absolute -right-2 -top-2 h-5 w-12 rotate-[16deg] bg-stone-300/25" />
      <p className="mb-2 text-xs font-black uppercase tracking-widest text-lime-300">{title}</p>
      {children}
    </div>
  );
}

export function CheckList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1">
      {items.map((item) => (
        <li key={item} className="flex justify-between gap-4">
          <span>{item}</span>
          <span className="text-emerald-700">✓</span>
        </li>
      ))}
    </ul>
  );
}

export function EvidenceTable({ report, mode }: { report: THCReport; mode: "clarity" | "dank" }) {
  const rows = report.evidenceTable.flatMap((row) => row.evidence.split(", ").map((evidence) => ({ category: row.category, evidence, score: row.score, notes: row.notes }))).slice(0, 4);
  return (
    <section id="evidence" className={mode === "dank" ? "min-h-0 overflow-x-auto overflow-y-hidden border border-lime-300/30 bg-black/80 p-3 lg:overflow-hidden" : "min-h-0 overflow-x-auto overflow-y-hidden border border-stone-300 bg-white/65 p-3 lg:overflow-hidden"}>
      <h2 className={mode === "dank" ? "mb-2 text-base font-black uppercase text-lime-300" : "mb-2 font-serif text-lg font-semibold"}>{mode === "dank" ? "Receipts" : "Evidence"}</h2>
      <table className={mode === "dank" ? "min-w-[680px] table-fixed text-left text-xs text-lime-100 lg:w-full lg:min-w-0" : "min-w-[680px] table-fixed text-left text-xs text-stone-800 lg:w-full lg:min-w-0"}>
        <colgroup>
          <col className="w-[18%]" />
          <col className="w-[28%]" />
          <col className="w-[14%]" />
          <col className="w-[10%]" />
          <col className="w-[30%]" />
        </colgroup>
        <thead className={mode === "dank" ? "border-b border-lime-300/30 text-lime-300" : "border-b border-stone-300 text-stone-500"}>
          <tr><th className="py-1.5 pr-2">Category</th><th className="pr-2">Evidence</th><th className="pr-2">Status</th><th className="pr-2">Impact</th><th>Notes</th></tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={`${row.category}-${row.evidence}-${index}`} className={mode === "dank" ? "border-b border-lime-300/10" : "border-b border-stone-200"}>
              <td className="py-1.5 pr-2"><span className="block truncate">{row.category}</span></td>
              <td className="pr-2"><span className="block truncate">{row.evidence || "No direct evidence"}</span></td>
              <td className="pr-2"><StatusBadge mode={mode} status={row.evidence.includes("No direct") ? "Missing" : index % 3 === 1 ? "Partial" : "Found"} /></td>
              <td className="pr-2">+{Math.max(1, Math.round(row.score / 8))}</td>
              <td><span className="block truncate">{row.notes}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function StatusBadge({ mode, status }: { mode: "clarity" | "dank"; status: string }) {
  if (mode === "dank") return <span className={status === "Missing" ? "text-pink-400" : "text-lime-300"}>{status}</span>;
  return <span className={status === "Found" ? "rounded-sm bg-emerald-100 px-1.5 py-0.5 text-emerald-800" : status === "Missing" ? "rounded-sm bg-red-100 px-1.5 py-0.5 text-red-700" : "rounded-sm bg-amber-100 px-1.5 py-0.5 text-amber-800"}>{status}</span>;
}

export function FindingsCard({ report, mode }: { report: THCReport; mode: "clarity" | "dank" }) {
  return (
    <section id="hidden-trust" className={mode === "dank" ? "min-h-[105px] overflow-hidden border border-pink-500/50 bg-black/80 p-3 text-pink-200" : "min-h-0 overflow-hidden rotate-[1deg] border border-red-200 bg-red-50 p-3 text-red-900 shadow-[6px_8px_16px_rgba(68,64,60,0.1)]"}>
      <h2 className={mode === "dank" ? "mb-2 text-base font-black uppercase" : "mb-2 font-serif text-lg font-semibold"}>{mode === "dank" ? "Biggest Sus" : "Hidden-Trust Findings"}</h2>
      <ul className="space-y-1.5 text-xs 2xl:text-sm">
        {report.hiddenTrustFindings.slice(0, 3).map((finding) => <li key={finding.finding} className="truncate">● {finding.finding}</li>)}
      </ul>
      <p className="mt-3 text-xs font-semibold 2xl:text-sm">Impact: Moderate</p>
    </section>
  );
}

export function CapsPanel({ report }: { report: THCReport }) {
  return (
    <section id="caps" className="border border-pink-500/50 bg-black/80 p-2 text-pink-200">
      <h2 className="mb-1.5 text-sm font-black uppercase">Score Nerfs</h2>
      <ul className="space-y-1 text-xs uppercase">
        {report.capsApplied.map((cap, index) => <li key={cap} className="flex justify-between"><span>{cap}</span><span>-{index + 1}</span></li>)}
      </ul>
    </section>
  );
}

export function NextActions({ report, mode }: { report: THCReport; mode: "clarity" | "dank" }) {
  return (
    <section id="next-actions" className={mode === "dank" ? "border border-lime-300/35 bg-black/75 p-2.5" : "rounded-sm border border-stone-300 bg-white/70 p-2.5"}>
      <h2 className={mode === "dank" ? "mb-2 text-base font-black uppercase text-lime-300" : "mb-2 font-serif text-lg font-semibold"}>{mode === "dank" ? "Un-Cook This Repo" : "Next Actions"}</h2>
      <div className="grid gap-1.5 text-xs sm:grid-cols-2 2xl:text-sm">
        {report.nextActions.slice(0, 4).map((action) => (
          <label key={action} className="flex min-w-0 gap-2">
            <input type="checkbox" readOnly className="mt-0.5 shrink-0" />
            <span className="truncate">{action}</span>
          </label>
        ))}
      </div>
    </section>
  );
}

export function LocalStatus({ report, mode }: { report: THCReport; mode: "clarity" | "dank" }) {
  return (
    <section id="local-artifacts" className={mode === "dank" ? "border border-lime-300/35 bg-black/75 p-2.5 text-lime-100" : "rotate-[-1deg] border border-stone-300 bg-emerald-50 p-2.5 shadow-[6px_8px_16px_rgba(68,64,60,0.1)]"}>
      <h2 className={mode === "dank" ? "mb-2 text-base font-black uppercase text-lime-300" : "mb-2 font-serif text-lg font-semibold"}>{mode === "dank" ? "Claimed Lore" : "Local Artifact Status"}</h2>
      <ul className="space-y-1 text-xs 2xl:text-sm">
        <li>State: {report.localArtifactStatus.state}</li>
        <li>Files: {report.localArtifactStatus.filesPresent.length || "none"}</li>
        {report.localArtifactStatus.findings.slice(0, 1).map((finding) => <li key={finding} className="truncate">{finding}</li>)}
      </ul>
    </section>
  );
}

export function Disclaimer({ mode }: { mode: "clarity" | "dank" }) {
  return (
    <footer className={mode === "dank" ? "flex items-center gap-3 border border-pink-500/45 bg-black/80 p-2 text-xs text-pink-300" : "flex items-center gap-3 rounded-sm border border-stone-300 bg-[#f8f3e8] p-2 text-xs text-stone-700"}>
      <span className={mode === "dank" ? "grid h-7 w-7 shrink-0 place-items-center border border-pink-500 text-pink-400" : "grid h-7 w-7 shrink-0 place-items-center rounded-full border border-stone-400 text-stone-600"} aria-hidden>
        {mode === "dank" ? "☠" : "i"}
      </span>
      <span>{invariantReportLabels.disclaimer}</span>
    </footer>
  );
}

export function scoreLookup(report: THCReport) {
  return {
    Truth: report.evidenceTable.find((row) => row.category === "Truth")?.score ?? 0,
    Hardening: report.evidenceTable.find((row) => row.category === "Hardening")?.score ?? 0,
    Clarity: report.evidenceTable.find((row) => row.category === "Clarity")?.score ?? 0,
    "Audit History": report.evidenceTable.find((row) => row.category === "Audit History")?.score ?? 0,
  };
}
