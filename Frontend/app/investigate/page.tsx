"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { API, type Severity } from "../../lib/api";
import { SAMPLE_LOGS } from "../../lib/sample";

const STAGES = [
  "Redacting secrets…",
  "Running 6 deterministic detectors…",
  "Querying AI explanation layer…",
  "Verifying every citation against the original logs…",
  "Compiling case file…",
];

const sevDot: Record<Severity, string> = { critical: "bg-red-400", high: "bg-amber-400", medium: "bg-zinc-400" };

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

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-3xl px-6 py-14">
        <a href="/" className="text-xs text-zinc-500 transition hover:text-zinc-300">← IncidentLens</a>

        <h1 className="mt-5 text-2xl font-semibold tracking-tight text-zinc-100 sm:text-3xl">
          Investigate
        </h1>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-500">
          Paste your failed deploy logs. Every claim in the report must cite the exact log
          line that proves it.
        </p>

        <textarea
          value={logs}
          onChange={(e) => setLogs(e.target.value)}
          rows={14}
          placeholder="$ paste build logs, runtime errors, stack traces…"
          className="mt-7 w-full rounded-md border border-zinc-800 bg-zinc-950/60 p-4 font-mono text-sm leading-relaxed text-zinc-200 outline-none transition focus:border-emerald-700"
        />

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
          <button
            onClick={analyze}
            disabled={busy || !logs.trim()}
            className="rounded-md bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {busy ? "Investigating…" : "Investigate →"}
          </button>
          <button
            onClick={() => setLogs(SAMPLE_LOGS)}
            className="text-xs text-zinc-500 underline-offset-4 transition hover:text-zinc-300 hover:underline"
          >
            try a sample incident
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-red-900/60 bg-red-950/20 px-4 py-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Client-side loading approximation only — not real backend telemetry.
            The request is a single blocking call; this ticker just narrates the
            known pipeline stages while it's in flight. */}
        {busy && (
          <div className="mt-5" aria-live="polite">
            <p className="text-[10px] uppercase tracking-widest text-zinc-600">
              Working (estimated)
            </p>
            <div className="mt-2 flex gap-1.5">
              {STAGES.map((_, i) => (
                <span
                  key={i}
                  className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                    i <= stage ? "bg-emerald-500" : "bg-zinc-800"
                  }`}
                />
              ))}
            </div>
            <div className="relative mt-2 h-4">
              <AnimatePresence mode="wait">
                <motion.p
                  key={stage}
                  initial={{ opacity: 0, y: reduceMotion ? 0 : 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: reduceMotion ? 0 : -4 }}
                  transition={{ duration: reduceMotion ? 0 : 0.2 }}
                  className="absolute inset-0 text-xs text-emerald-400"
                >
                  {STAGES[stage]}
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        )}

        {history.length > 0 && (
          <section className="mt-14">
            <h2 className="text-xs font-medium uppercase tracking-widest text-zinc-500">
              Case files
            </h2>
            <ul className="mt-3 space-y-2">
              {history.map((h) => (
                <li key={h.id}>
                  <a
                    href={`/report?id=${h.id}`}
                    className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border border-zinc-800 bg-zinc-900/40 p-3 text-sm transition hover:border-zinc-600"
                  >
                    <span className={`h-2 w-2 shrink-0 rounded-full ${sevDot[h.findings?.[0]?.severity as Severity] ?? "bg-zinc-600"}`} />
                    <span className="shrink-0 font-mono text-xs text-zinc-500">
                      {new Date(h.createdAt).toLocaleString()}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-zinc-300">
                      {h.summary.slice(0, 80)}
                    </span>
                    <span className="shrink-0 font-mono text-xs text-zinc-600">
                      {h.findings?.length ?? 0} findings
                    </span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {history.length === 0 && (
          <p className="mt-14 text-xs text-zinc-600">
            No cases yet. Your first failed deploy is waiting to be opened.
          </p>
        )}
      </div>
    </main>
  );
}
