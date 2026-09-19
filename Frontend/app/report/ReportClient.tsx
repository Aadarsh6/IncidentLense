"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { API, type IncidentReport, type Finding } from "../../lib/api";

const sevColor: Record<string, string> = {
  critical: "text-red-400 border-red-900", high: "text-amber-400 border-amber-900", medium: "text-zinc-400 border-zinc-700",
};

function PipelineStrip({ ai }: { ai: "ok" | "unavailable" }) {
  const steps = [
    ["Redact", true], ["Detect", true], ["Explain", ai === "ok"], ["Verify", true],
  ] as const;
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {steps.map(([label, ok], i) => (
        <span key={label} className="flex items-center gap-2">
          {i > 0 && <span className="text-zinc-700">→</span>}
          <span className={`rounded px-2 py-0.5 ${ok ? "bg-emerald-500/10 text-emerald-400" : "bg-amber-500/10 text-amber-400"}`}>
            {label} {ok ? "✓" : "⚠ offline"}
          </span>
        </span>
      ))}
    </div>
  );
}

function FindingCard({ f }: { f: Finding }) {
  const rule = f.source === "rule";
  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className={`rounded px-2 py-0.5 font-bold ${rule ? "bg-emerald-500/15 text-emerald-400" : "bg-violet-500/15 text-violet-400"}`}>
          {rule ? "RULE MATCH" : "AI · VERIFIED"}
        </span>
        <span className={`rounded border px-2 py-0.5 ${sevColor[f.severity]}`}>{f.severity}</span>
        <span className="ml-auto text-zinc-500">confidence {Math.round(f.confidence * 100)}%</span>
      </div>
      <h3 className="mt-3 font-semibold text-zinc-100">{f.title}</h3>
      <div className="mt-3 space-y-1.5">
        {f.evidence.map((e, i) => (
          <div key={i} className="flex gap-3 text-xs">
            <span className="shrink-0 select-none text-zinc-600">L{e.line}</span>
            <span className="text-emerald-300">{e.quote}</span>
          </div>
        ))}
      </div>
      <p className="mt-3 border-t border-zinc-800 pt-3 text-sm text-zinc-400">→ {f.remediation}</p>
    </div>
  );
}

export default function ReportClient() {
  const params = useSearchParams();
  const id = params.get("id");
  const [report, setReport] = useState<IncidentReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`${API}/incidents/${id}`).then(r => { if (!r.ok) throw new Error("Case file not found"); return r.json(); })
      .then(setReport).catch((e) => setError(e.message));
  }, [id]);

  if (error) return <main className="mx-auto max-w-3xl px-6 py-14 text-red-400">{error}</main>;
  if (!report) return <main className="mx-auto max-w-3xl px-6 py-14 text-zinc-500">Opening case file…</main>;

  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <a href="/" className="text-xs text-zinc-500 hover:text-zinc-300">← new investigation</a>

      <div className="mt-4 rounded-lg border border-zinc-800 bg-zinc-900/60 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="text-xs uppercase tracking-widest text-zinc-500">Case #{report.id.slice(0, 6)}</div>
          <PipelineStrip ai={report.aiStatus} />
        </div>
        <p className="mt-3 text-sm text-zinc-200">{report.summary}</p>
        <div className="mt-3 flex flex-wrap gap-4 text-xs text-zinc-500">
          <span>{report.lineCount} lines analyzed</span>
          <span className="text-emerald-400">{report.redactions} secrets redacted</span>
          {report.rejectedFindings > 0 && (
            <span className="text-violet-400">{report.rejectedFindings} AI claims rejected — unverifiable evidence</span>
          )}
        </div>
      </div>

      <h2 className="mt-8 text-xs uppercase tracking-widest text-zinc-500">Findings ({report.findings.length})</h2>
      <div className="mt-3 space-y-4">
        {report.findings.map((f, i) => <FindingCard key={i} f={f} />)}
      </div>
    </main>
  );
}