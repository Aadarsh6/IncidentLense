import Link from "next/link";
import { Reveal } from "../components/Reveal";

const PIPELINE = [
  {
    n: "01",
    title: "Redact",
    body: "AWS keys, tokens, and KEY=value secrets are stripped before anything else runs — before an AI ever sees the logs.",
  },
  {
    n: "02",
    title: "Detect",
    body: "Six deterministic detectors scan every line. No model involved. Confidence is computed from evidence, not guessed.",
  },
  {
    n: "03",
    title: "Explain",
    body: "An optional AI layer adds context and any findings the rules missed. If it's unavailable, the report still ships — rule-only.",
  },
  {
    n: "04",
    title: "Verify",
    body: "Every AI-proposed finding is checked against the original logs. Anything that can't be matched to a real line is rejected.",
  },
] as const;

export default function Home() {
  return (
    <main className="bg-technical-grid">
      {/* Nav */}
      <header className="border-b border-zinc-900">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <span className="text-sm font-semibold tracking-tight text-zinc-100">
            Incident<span className="text-emerald-400">Lens</span>
          </span>
          <Link
            href="/investigate"
            className="rounded-md border border-zinc-800 px-3.5 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
          >
            Investigate →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-5xl px-6 pb-20 pt-20 sm:pt-28">
        <Reveal>
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
            Evidence-backed incident investigation
          </p>
        </Reveal>

        <Reveal delay={0.05}>
          <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.15] tracking-tight text-zinc-100 sm:text-5xl">
            AI can explain a failure.
            <br />
            <span className="text-zinc-500">It cannot decide what is true.</span>
          </h1>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="mt-6 max-w-xl text-[15px] leading-relaxed text-zinc-400">
            IncidentLens investigates failed deploys and stack traces. Every claim in the
            report is checked against the exact log line that proves it — deterministic
            rules verify what the model proposes, and nothing ships uncited.
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="mt-9 flex flex-wrap items-center gap-5">
            <Link
              href="/investigate"
              className="rounded-md bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-emerald-400"
            >
              Start an investigation →
            </Link>
            <span className="text-xs text-zinc-600">No login. No setup. Paste logs, get a cited case file.</span>
          </div>
        </Reveal>
      </section>

      {/* Evidence thesis */}
      <section className="border-t border-zinc-900">
        <div className="mx-auto grid max-w-5xl gap-12 px-6 py-20 sm:grid-cols-2 sm:gap-16">
          <Reveal>
            <div>
              <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
                The evidence thesis
              </h2>
              <p className="mt-4 text-xl font-medium leading-snug text-zinc-100">
                A confident answer is not the same thing as a correct one.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                Paste logs into a general-purpose chatbot and you get plausible prose —
                often useful, sometimes wrong, and impossible to check without re-reading
                everything yourself. IncidentLens requires every finding to quote the
                exact line that proves it. A validator rejects any claim whose evidence
                doesn&apos;t match the original logs, so what you see is what the logs
                actually say — not what sounded right.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-zinc-400">
                Rule-based findings and AI-originated findings are always labeled
                separately, never blended together as if they carry equal weight.
              </p>
            </div>
          </Reveal>

          <Reveal delay={0.08}>
            <div>
              <p className="mb-2 text-xs uppercase tracking-widest text-zinc-600">
                Illustrative example — not live data
              </p>
              <div className="rounded-md border border-zinc-800 bg-zinc-950/60 p-4">
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded px-2 py-0.5 font-bold bg-emerald-500/15 text-emerald-400">
                    RULE MATCH
                  </span>
                  <span className="rounded border border-red-900 px-2 py-0.5 text-red-400">
                    critical
                  </span>
                  <span className="ml-auto text-zinc-500">confidence 95%</span>
                </div>
                <h3 className="mt-3 text-sm font-semibold text-zinc-100">
                  Missing required environment variable
                </h3>
                <div className="mt-3 flex gap-3 font-mono text-xs">
                  <span className="shrink-0 select-none text-zinc-600">L42</span>
                  <span className="text-emerald-300">
                    Required env STRIPE_WEBHOOK_SECRET is not set
                  </span>
                </div>
                <p className="mt-3 border-t border-zinc-800 pt-3 text-sm text-zinc-400">
                  → Set STRIPE_WEBHOOK_SECRET in the deploy environment before the next run.
                </p>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Pipeline */}
      <section className="border-t border-zinc-900">
        <div className="mx-auto max-w-5xl px-6 py-20">
          <Reveal>
            <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-zinc-500">
              How an investigation runs
            </h2>
            <p className="mt-4 max-w-xl text-xl font-medium leading-snug text-zinc-100">
              Four stages, in order, every time.
            </p>
          </Reveal>

          <div className="mt-10 grid gap-px overflow-hidden rounded-md border border-zinc-800 bg-zinc-900 sm:grid-cols-4">
            {PIPELINE.map((stage, i) => (
              <Reveal key={stage.n} delay={i * 0.06} className="bg-[#0a0e14] p-5">
                <span className="font-mono text-xs text-zinc-600">{stage.n}</span>
                <h3 className="mt-2 text-sm font-semibold text-zinc-100">{stage.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-zinc-500">{stage.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Closing CTA */}
      <section className="border-t border-zinc-900">
        <div className="mx-auto max-w-5xl px-6 py-20 text-center">
          <Reveal>
            <p className="text-xl font-medium text-zinc-100">
              Your next failed deploy is waiting to be investigated.
            </p>
            <Link
              href="/investigate"
              className="mt-7 inline-block rounded-md bg-emerald-500 px-6 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400"
            >
              Start an investigation →
            </Link>
          </Reveal>
        </div>
      </section>

      <footer className="border-t border-zinc-900">
        <div className="mx-auto max-w-5xl px-6 py-8 text-xs text-zinc-600">
          Incident<span className="text-emerald-400">Lens</span> — evidence-backed deploy
          failure investigation.
        </div>
      </footer>
    </main>
  );
}
