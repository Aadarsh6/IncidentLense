"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { API, type Severity } from "../lib/api";
import { SAMPLE_LOGS } from "../lib/sample";

const STAGES = [
  "Redacting secrets…",
  "Running 6 deterministic detectors…",
  "Querying AI explanation layer…",
  "Verifying every citation against the original logs…",
  "Compiling case file…",
];

const sevDot: Record<Severity, string> = { critical: "bg-red-400", high: "bg-amber-400", medium: "bg-zinc-400" };

export default function Home() {
  const [logs, setLogs] = useState("");
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const router = useRouter();

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
    <main className="mx-auto max-w-3xl px-6 py-14">
      <h1 className="text-3xl font-bold tracking-tight">
        Incident<span className="text-emerald-400">Lens</span>
      </h1>
      <p className="mt-2 text-sm text-zinc-500">
        Paste your failed deploy logs. Every claim in the report must cite the exact log line that proves it.
      </p>

      <textarea
        value={logs}
        onChange={(e) => setLogs(e.target.value)}
        rows={14}
        placeholder="$ paste build logs, runtime errors, stack traces…"
        className="mt-6 w-full rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 text-sm outline-none focus:border-emerald-600"
      />

      <div className="mt-4 flex flex-wrap items-center gap-4">
        <button
          onClick={analyze}
          disabled={busy || !logs.trim()}
          className="rounded-md bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-400 disabled:opacity-40"
        >
          {busy ? "Investigating…" : "Investigate →"}
        </button>
        <button
          onClick={() => setLogs(SAMPLE_LOGS)}
          className="text-xs text-zinc-500 underline-offset-4 hover:text-zinc-300 hover:underline"
        >
          try a sample incident
        </button>
        {error && <span className="text-sm text-red-400">{error}</span>}
      </div>

      {busy && <p className="mt-3 text-xs text-emerald-400">{STAGES[stage]}</p>}

      {history.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xs uppercase tracking-widest text-zinc-500">Case files</h2>
          <ul className="mt-3 space-y-2">
            {history.map((h) => (
              <li key={h.id}>
                <a href={`/report?id=${h.id}`} className="flex items-center gap-3 rounded-md border border-zinc-800 bg-zinc-900/40 p-3 text-sm transition hover:border-zinc-600">
                  <span className={`h-2 w-2 shrink-0 rounded-full ${sevDot[h.findings?.[0]?.severity as Severity] ?? "bg-zinc-600"}`} />
                  <span className="shrink-0 text-zinc-500">{new Date(h.createdAt).toLocaleString()}</span>
                  <span className="truncate text-zinc-300">{h.summary.slice(0, 80)}</span>
                  <span className="ml-auto shrink-0 text-xs text-zinc-600">{h.findings?.length ?? 0} findings</span>
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {history.length === 0 && (
        <p className="mt-12 text-xs text-zinc-600">No cases yet. Your first failed deploy is waiting to be opened.</p>
      )}
    </main>
  );
}