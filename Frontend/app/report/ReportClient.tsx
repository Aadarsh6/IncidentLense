"use client";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { API, type IncidentReport, type Finding, type Severity } from "../../lib/api";

/* ------------------------------------------------------------------ */
/* Semantics                                                           */
/*   emerald = verified / rule-confirmed   amber  = degraded / offline */
/*   red     = failure / critical          violet = AI-originated only */
/* ------------------------------------------------------------------ */

const SEVERITY: Record<Severity, { badge: string; rail: string }> = {
  critical: { badge: "border-red-500/40 bg-red-500/10 text-red-400", rail: "border-l-red-500/70" },
  high: { badge: "border-amber-500/40 bg-amber-500/10 text-amber-400", rail: "border-l-amber-500/60" },
  medium: { badge: "border-zinc-600 bg-zinc-800/40 text-zinc-400", rail: "border-l-zinc-700" },
};

function formatOpened(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return `${d.toISOString().replace("T", " ").slice(0, 19)} UTC`;
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">{children}</h2>
  );
}

function Shell({ children }: { children: ReactNode }) {
  return (
    <main className="mx-auto max-w-4xl px-5 py-12 sm:px-6 sm:py-14">
      <Link href="/investigate" className="text-xs text-zinc-500 transition hover:text-zinc-300">
        ← New investigation
      </Link>
      {children}
    </main>
  );
}

/* ------------------------------------------------------------------ */
/* Case header                                                         */
/* ------------------------------------------------------------------ */

function Meta({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[10px] uppercase tracking-[0.18em] text-zinc-600">{label}</dt>
      <dd className="mt-1 font-mono text-sm text-zinc-200">{children}</dd>
    </div>
  );
}

function CaseHeader({ report }: { report: IncidentReport }) {
  const aiOk = report.aiStatus === "ok";
  return (
    <header className="mt-8">
      <p className="text-[11px] font-medium uppercase tracking-[0.2em] text-zinc-500">Case file</p>
      <h1 className="mt-2 font-mono text-3xl font-semibold tracking-tight text-zinc-100">
        #{report.id.slice(0, 6)}
      </h1>
      <p className="mt-1.5 break-all font-mono text-[11px] text-zinc-600">{report.id}</p>

      <dl className="mt-6 flex flex-wrap gap-x-10 gap-y-4 border-y border-zinc-800 py-4">
        <Meta label="Opened">{formatOpened(report.createdAt)}</Meta>
        <Meta label="Lines analyzed">{report.lineCount}</Meta>
        <Meta label="Secrets redacted">
          <span className={report.redactions > 0 ? "text-emerald-400" : "text-zinc-400"}>
            {report.redactions}
          </span>
        </Meta>
        <Meta label="AI layer">
          <span className={`inline-flex items-center gap-2 ${aiOk ? "text-emerald-400" : "text-amber-400"}`}>
            <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${aiOk ? "bg-emerald-400" : "bg-amber-400"}`} />
            {aiOk ? "online" : "offline · rule-only"}
          </span>
        </Meta>
        {report.rejectedFindings > 0 && (
          <Meta label="Rejected AI claims">
            <a href="#rejected" className="text-violet-300 underline-offset-4 hover:underline">
              {report.rejectedFindings} ↓
            </a>
          </Meta>
        )}
      </dl>
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Pipeline status — resulting case-file state, not live telemetry     */
/* ------------------------------------------------------------------ */

function PipelineStatus({ ai }: { ai: "ok" | "unavailable" }) {
  const reduce = useReducedMotion();
  const steps = [
    { label: "Redact", ok: true, note: "complete" },
    { label: "Detect", ok: true, note: "complete" },
    { label: "Explain", ok: ai === "ok", note: ai === "ok" ? "complete" : "offline" },
    { label: "Verify", ok: true, note: "verified" },
  ];
  return (
    <section className="mt-10">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <SectionLabel>Pipeline</SectionLabel>
        <span className="text-[11px] text-zinc-600">Case-file status · not live telemetry</span>
      </div>
      <ol className="mt-3 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-zinc-800 bg-zinc-800 sm:grid-cols-4">
        {steps.map((s, i) => (
          <motion.li
            key={s.label}
            initial={{ opacity: 0, y: reduce ? 0 : 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduce ? 0 : 0.25, delay: reduce ? 0 : i * 0.06, ease: "easeOut" }}
            className="bg-[#0a0e14] px-3.5 py-3"
          >
            <div className="flex items-center justify-between font-mono text-[10px] text-zinc-600">
              <span>0{i + 1}</span>
              <span aria-hidden className={s.ok ? "text-emerald-400" : "text-amber-400"}>
                {s.ok ? "✓" : "⚠"}
              </span>
            </div>
            <div className="mt-2 text-sm font-medium text-zinc-100">{s.label}</div>
            <div className={`mt-0.5 text-xs ${s.ok ? "text-emerald-400" : "text-amber-400"}`}>{s.note}</div>
          </motion.li>
        ))}
      </ol>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Findings                                                            */
/* ------------------------------------------------------------------ */

function FindingEntry({ f, index }: { f: Finding; index: number }) {
  const reduce = useReducedMotion();
  const rule = f.source === "rule";
  const sev = SEVERITY[f.severity] ?? SEVERITY.medium;
  const n = f.evidence.length;

  return (
    <motion.article
      initial={{ opacity: 0, y: reduce ? 0 : 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: reduce ? 0 : 0.35, ease: "easeOut" }}
      className={`border-l-2 pl-4 sm:pl-6 ${sev.rail}`}
    >
      {/* Provenance + severity, then confidence as secondary metadata */}
      <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
        <span className="font-mono text-[11px] text-zinc-600">{String(index + 1).padStart(2, "0")}</span>
        <span
          className={`rounded border px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest ${
            rule
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
              : "border-violet-400/30 bg-violet-500/10 text-violet-300"
          }`}
        >
          {rule ? "RULE MATCH" : "AI · VERIFIED"}
        </span>
        <span className={`rounded border px-2 py-0.5 font-mono text-[10px] uppercase tracking-widest ${sev.badge}`}>
          {f.severity}
        </span>
        <span className="ml-auto font-mono text-[11px] text-zinc-500">
          confidence {Math.round(f.confidence * 100)}%
        </span>
      </div>

      <h3 className="mt-3 text-lg font-semibold leading-snug tracking-tight text-zinc-100 [overflow-wrap:anywhere] sm:text-xl">
        {f.title}
      </h3>
      <p className="mt-1 break-all font-mono text-[11px] text-zinc-600">{f.detectorId}</p>

      {/* Evidence — the visual centerpiece */}
      <div className="mt-5 overflow-hidden rounded-md border border-zinc-800 bg-[#05080d]">
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-zinc-800 px-3 py-2 font-mono text-[10px] uppercase tracking-widest text-zinc-500">
          <span>
            Evidence · {n} {n === 1 ? "line" : "lines"}
          </span>
          <span className="text-emerald-500/80">{rule ? "✓ rule-matched" : "✓ verified against logs"}</span>
        </div>
        {n === 0 ? (
          <p className="px-3 py-3 font-mono text-xs text-zinc-600">No cited lines attached.</p>
        ) : (
          <ol className="divide-y divide-zinc-900">
            {f.evidence.map((e, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: reduce ? 0 : 0.25, delay: reduce ? 0 : Math.min(i * 0.05, 0.2), ease: "easeOut" }}
                className="grid grid-cols-[4rem_minmax(0,1fr)] sm:grid-cols-[4.75rem_minmax(0,1fr)]"
              >
                <span className="select-none border-r border-zinc-800 px-2 py-2.5 text-right font-mono text-xs tabular-nums text-emerald-500/80">
                  L{e.line}
                </span>
                <code className="block whitespace-pre-wrap px-3 py-2.5 font-mono text-[13px] leading-relaxed text-zinc-100 [overflow-wrap:anywhere]">
                  {e.quote}
                </code>
              </motion.li>
            ))}
          </ol>
        )}
      </div>

      {/* Remediation — actionable, visually quieter than the evidence */}
      <div className="mt-4 flex flex-col gap-1 sm:flex-row sm:gap-4">
        <span className="shrink-0 pt-0.5 text-[10px] uppercase tracking-[0.18em] text-zinc-600 sm:w-20">
          Next step
        </span>
        <p className="min-w-0 text-sm leading-relaxed text-zinc-400 [overflow-wrap:anywhere]">{f.remediation}</p>
      </div>
    </motion.article>
  );
}

function RejectedNotice({ count }: { count: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.section
      id="rejected"
      initial={{ opacity: 0, y: reduce ? 0 : 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: reduce ? 0 : 0.35, ease: "easeOut" }}
      className="mt-14 scroll-mt-6 rounded-md border border-dashed border-zinc-700 px-4 py-5 sm:px-6"
    >
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="rounded border border-violet-400/30 bg-violet-500/10 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-widest text-violet-300">
          AI · REJECTED
        </span>
        <h2 className="text-base font-semibold text-zinc-100">
          {count} AI {count === 1 ? "claim" : "claims"} rejected
        </h2>
      </div>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
        The explanation layer proposed {count === 1 ? "a finding that" : "findings that"} could not be verified
        against the original logs. {count === 1 ? "It is" : "They are"} excluded from the findings above.
      </p>
    </motion.section>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function ReportClient() {
  const params = useSearchParams();
  const id = params.get("id");
  const [report, setReport] = useState<IncidentReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    fetch(`${API}/incidents/${id}`).then(r => { if (!r.ok) throw new Error("Case file not found"); return r.json(); })
      .then((data) => { if (!cancelled) setReport(data); })
      .catch((e) => { if (!cancelled) setError(e.message); });
    return () => { cancelled = true; };
  }, [id]);

  if (error) {
    return (
      <Shell>
        <div role="alert" className="mt-10 rounded-md border border-red-900/60 bg-red-950/20 px-4 py-4">
          <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-red-400/80">Case file unavailable</p>
          <p className="mt-2 text-sm text-red-400 [overflow-wrap:anywhere]">{error}</p>
        </div>
        <Link
          href="/investigate"
          className="mt-5 inline-block text-xs text-zinc-500 underline-offset-4 transition hover:text-zinc-300 hover:underline"
        >
          Start a new investigation →
        </Link>
      </Shell>
    );
  }

  if (!report) {
    return (
      <Shell>
        <p role="status" className="mt-10 font-mono text-sm text-zinc-500">Opening case file…</p>
      </Shell>
    );
  }

  const ruleCount = report.findings.filter(f => f.source === "rule").length;
  const aiCount = report.findings.length - ruleCount;

  return (
    <Shell>
      <CaseHeader report={report} />

      <section className="mt-10">
        <SectionLabel>Incident summary</SectionLabel>
        <p className="mt-3 max-w-3xl text-lg leading-relaxed text-zinc-100 [overflow-wrap:anywhere] sm:text-xl sm:leading-relaxed">
          {report.summary}
        </p>
      </section>

      <PipelineStatus ai={report.aiStatus} />

      <section className="mt-14">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-zinc-800 pb-3">
          <SectionLabel>Findings · {report.findings.length}</SectionLabel>
          <p className="font-mono text-[11px] text-zinc-500">
            {ruleCount} rule {ruleCount === 1 ? "match" : "matches"} · {aiCount} AI-verified
          </p>
        </div>

        {report.findings.length === 0 ? (
          <p className="mt-6 rounded-md border border-zinc-800 px-4 py-5 text-sm text-zinc-500">
            No findings were recorded for this case file.
          </p>
        ) : (
          <div className="mt-8 space-y-12">
            {report.findings.map((f, i) => <FindingEntry key={i} f={f} index={i} />)}
          </div>
        )}
      </section>

      {report.rejectedFindings > 0 && <RejectedNotice count={report.rejectedFindings} />}
    </Shell>
  );
}
