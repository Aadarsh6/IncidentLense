"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { API, type Severity } from "../../lib/api";
import { SAMPLE_LOGS } from "../../lib/sample";
import { TopBar } from "../../components/TopBar";

const STAGES = [
  "Redacting secrets…",
  "Running 6 deterministic detectors…",
  "Querying AI explanation layer…",
  "Verifying every citation against the original logs…",
  "Compiling case file…",
];

const sevDot: Record<Severity, string> = {
  critical: "bg-red-400",
  high: "bg-amber-400",
  medium: "bg-zinc-400",
};

/* Client-side per-line heuristics for the intake status bar ONLY.
   Detection and redaction still happen server-side — these are hints. */
const SIGNAL_RE =
  /(error|fatal|panic|exception|traceback|failed|exit code|econnrefused|permission denied|command not found|cannot find|segmentation)/i;
const SECRET_RE =
  /(AKIA[0-9A-Z]{16}|-----BEGIN [A-Z ]*PRIVATE KEY-----|\b(?:api[_-]?key|secret|token|password)\b\s*[:=])/gi;

const PIPELINE_PREVIEW = [
  { n: "01", title: "Redact", note: "Secrets stripped before anything else runs." },
  { n: "02", title: "Detect", note: "Six deterministic detectors, no model." },
  { n: "03", title: "Explain", note: "Optional AI layer. Offline ⇒ rule-only." },
  { n: "04", title: "Verify", note: "Claims checked against the original logs." },
];

export default function Investigate() {
  const [logs, setLogs] = useState("");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const router = useRouter();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    fetch(`${API}/incidents`).then(r => r.json()).then(setHistory).catch(() => {});
  }, []);

  useEffect(() => {
    if (!busy) { setStage(0); return; }
    const t = setInterval(() => setStage(s => Math.min(s + 1, STAGES.length - 1)), 1400);
    return () => clearInterval(t);
  }, [busy]);

  async function analyze() {
    if (!logs.trim() || busy) return;
    setBusy(true); setError(null);
    try {
      const res = await fetch(`${API}/analyze`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ logs }),
      });
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const report = await res.json();
      router.push(`/report?id=${report.id}`);
    } catch (e: any) {
      setError(e.message ?? "Investigation failed");
      setBusy(false);
    }
  }

  /* Intake status — derived from the textarea, no extra state */
  const lineCount = logs ? logs.split("\n").length : 0;
  const signalCount = logs
    ? logs.split("\n").filter((l) => SIGNAL_RE.test(l)).length
    : 0;
  const secretCount = logs ? (logs.match(SECRET_RE) ?? []).length : 0;

  return (
    <main className="min-h-screen">
      <TopBar />

      <div className="mx-auto max-w-5xl px-5 pb-20 pt-10 sm:px-6 sm:pt-14">
        <header>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-emerald-400">
            New case file
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
            Investigate
          </h1>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-zinc-400">
            Paste your failed deploy logs. Every claim in the report must cite
            the exact log line that proves it — anything that can&apos;t is
            rejected.
          </p>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px] lg:gap-10">
          {/* ---------------- editor column ---------------- */}
          <div>
            <div className="overflow-hidden rounded-md border border-zinc-800 bg-[#05080d] transition-colors focus-within:border-emerald-700/70">
              {/* window chrome */}
              <div className="flex items-center justify-between border-b border-zinc-800 px-3.5 py-2.5">
                <div className="flex items-center gap-1.5" aria-hidden>
                  <span className="h-2 w-2 rounded-full bg-zinc-700/80" />
                  <span className="h-2 w-2 rounded-full bg-zinc-700/80" />
                  <span className="h-2 w-2 rounded-full bg-zinc-700/80" />
                </div>
                <span className="hidden font-mono text-[10px] text-zinc-600 sm:block">
                  ~/incidents/untitled-case.log
                </span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-700">
                  plain text
                </span>
              </div>

              <label htmlFor="logs" className="sr-only">
                Incident logs
              </label>
              <textarea
                id="logs"
                value={logs}
                onChange={(e) => setLogs(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") analyze();
                }}
                rows={14}
                spellCheck={false}
                placeholder={
                  "$ paste build logs, runtime errors, stack traces…\n\nEvery line stays addressable — findings will cite it by number."
                }
                className="block w-full resize-y bg-transparent px-4 py-4 font-mono text-[13px] leading-relaxed text-zinc-200 outline-none placeholder:text-zinc-600"
              />

              {/* live intake status */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-zinc-800 px-3.5 py-2 font-mono text-[10px] text-zinc-600">
                <span>
                  {lineCount} {lineCount === 1 ? "line" : "lines"}
                </span>
                {signalCount > 0 && (
                  <span className="text-zinc-500">
                    {signalCount} error signal{signalCount === 1 ? "" : "s"}
                  </span>
                )}
                {secretCount > 0 && (
                  <span className="text-amber-500/90">
                    {secretCount} secret-like value{secretCount === 1 ? "" : "s"} ·
                    redacted before analysis
                  </span>
                )}
                <span className="ml-auto hidden sm:block">⌘↵ to run</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-3">
              <button
                onClick={analyze}
                disabled={busy || !logs.trim()}
                className="rounded-md bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
              >
                {busy ? "Investigating…" : "Investigate →"}
              </button>
              <button
                onClick={() => setLogs(SAMPLE_LOGS)}
                disabled={busy}
                className="rounded-md border border-zinc-800 px-3.5 py-2 text-xs font-medium text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-200 disabled:opacity-40"
              >
                Load sample incident
              </button>
              <span className="text-[11px] text-zinc-600">
                Secrets are stripped before anything else runs.
              </span>
            </div>

            {error && (
              <div
                role="alert"
                className="mt-4 border-l-2 border-red-500/70 bg-red-950/20 px-4 py-3 text-sm text-red-400"
              >
                {error}
              </div>
            )}

            {/* Client-side loading approximation only — not real backend
                telemetry. The request is a single blocking call; this
                narrates the known pipeline stages while it's in flight. */}
            {busy && (
              <div
                aria-live="polite"
                className="mt-6 overflow-hidden rounded-md border border-zinc-800 bg-[#0a0e14]"
              >
                <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-2.5">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-500">
                    Running
                  </span>
                  <span className="font-mono text-[10px] text-zinc-600">
                    estimated · single request in flight
                  </span>
                </div>
                <ol className="px-4 py-3">
                  {STAGES.map((label, i) => {
                    const state = i < stage ? "done" : i === stage ? "active" : "todo";
                    return (
                      <li key={label} className="flex items-center gap-3 py-1.5">
                        <span className="w-3 shrink-0 text-center">
                          {state === "done" ? (
                            <span className="font-mono text-[11px] text-emerald-400">✓</span>
                          ) : state === "active" ? (
                            reduceMotion ? (
                              <span className="block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            ) : (
                              <span className="block h-3 w-3 animate-spin rounded-full border border-emerald-500 border-t-transparent" />
                            )
                          ) : (
                            <span className="font-mono text-[11px] text-zinc-700">·</span>
                          )}
                        </span>
                        <span
                          className={`font-mono text-xs ${
                            state === "todo"
                              ? "text-zinc-600"
                              : state === "active"
                              ? "text-emerald-400"
                              : "text-zinc-500"
                          }`}
                        >
                          {label}
                        </span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}
          </div>

          {/* ---------------- context rail ---------------- */}
          <aside className="space-y-8 self-start lg:sticky lg:top-20">
            <div>
              <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
                When you run
              </h2>
              <ol className="mt-3 space-y-2.5">
                {PIPELINE_PREVIEW.map((s) => (
                  <li key={s.n} className="flex gap-3">
                    <span className="font-mono text-[11px] text-zinc-600">{s.n}</span>
                    <div>
                      <p className="text-sm font-medium text-zinc-300">{s.title}</p>
                      <p className="text-xs leading-relaxed text-zinc-600">{s.note}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            <div className="border-t border-zinc-900 pt-6">
              <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
                What you get back
              </h2>
              <ul className="mt-3 space-y-2 text-xs leading-relaxed text-zinc-500">
                <li>— Findings that quote the line that proves them</li>
                <li>— AI claims verified against the logs, or rejected visibly</li>
                <li>— Secrets redacted before analysis</li>
                <li>— A shareable case file URL</li>
              </ul>
            </div>
          </aside>
        </div>

        {/* ---------------- case files ---------------- */}
        <section className="mt-16">
          <div className="flex items-baseline justify-between border-b border-zinc-800 pb-3">
            <h2 className="text-[11px] font-medium uppercase tracking-[0.18em] text-zinc-500">
              Case files
            </h2>
            {history.length > 0 && (
              <span className="font-mono text-[11px] text-zinc-600">
                {history.length} on record
              </span>
            )}
          </div>

          {history.length > 0 ? (
            <ul className="divide-y divide-zinc-900">
              {history.map((h, i) => (
                <motion.li
                  key={h.id}
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: reduceMotion ? 0 : 0.25,
                    delay: reduceMotion ? 0 : Math.min(i * 0.04, 0.24),
                    ease: "easeOut",
                  }}
                >
                  <a
                    href={`/report?id=${h.id}`}
                    className="group flex items-center gap-3 py-3.5"
                  >
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        sevDot[h.findings?.[0]?.severity as Severity] ?? "bg-zinc-600"
                      }`}
                    />
                    <span className="hidden w-44 shrink-0 font-mono text-[11px] text-zinc-600 sm:block">
                      {new Date(h.createdAt).toLocaleString()}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-zinc-300 transition group-hover:text-zinc-100">
                      {h.summary.slice(0, 80)}
                    </span>
                    <span className="shrink-0 font-mono text-[11px] text-zinc-600">
                      {h.findings?.length ?? 0} findings
                    </span>
                    <span className="shrink-0 -translate-x-1 font-mono text-[11px] text-emerald-500 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100">
                      open →
                    </span>
                  </a>
                </motion.li>
              ))}
            </ul>
          ) : (
            <div className="mt-4 rounded-md border border-dashed border-zinc-800 px-5 py-8 text-center">
              <p className="font-mono text-xs text-zinc-500">No case files yet.</p>
              <p className="mx-auto mt-2 max-w-sm text-xs leading-relaxed text-zinc-600">
                Your first failed deploy is waiting to be opened. No sample on hand?
              </p>
              <button
                onClick={() => setLogs(SAMPLE_LOGS)}
                className="mt-4 rounded-md border border-zinc-800 px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
              >
                Load the sample incident
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}