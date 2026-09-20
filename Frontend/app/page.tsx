import Link from "next/link";
import { TopBar } from "../components/TopBar";
import { HeroDemo } from "../components/HeroDemo";
import { Reveal } from "../components/Reveal";

const STATS = [
  { value: "06", label: "deterministic detectors" },
  { value: "04", label: "stages, every run" },
  { value: "100%", label: "of findings cite a line" },
] as const;

const PIPELINE = [
  {
    n: "01",
    title: "Redact",
    tag: "runs first · always",
    body: "AWS keys, tokens, and KEY=value secrets are stripped before anything else runs — before an AI ever sees a byte.",
  },
  {
    n: "02",
    title: "Detect",
    tag: "no model involved",
    body: "Six deterministic detectors scan every line. Confidence is computed from evidence, not guessed.",
  },
  {
    n: "03",
    title: "Explain",
    tag: "optional · fails open",
    body: "An AI layer adds context and any findings the rules missed. If it's unavailable, the report still ships — rule-only.",
  },
  {
    n: "04",
    title: "Verify",
    tag: "unmatched ⇒ rejected",
    body: "Every AI-proposed finding is checked against the original logs. Anything that can't be matched to a real line is rejected — and shown as rejected.",
  },
] as const;

export default function Home() {
  return (
    <main>
      <TopBar />

      {/* Hero — copy on the left, the product demonstrating itself on the right */}
      <section className="relative overflow-hidden border-b border-zinc-900">
        <div aria-hidden className="bg-technical-grid bg-grid-fade absolute inset-0" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-14 sm:px-6 sm:pt-20 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:gap-14">
          <div>
            <Reveal>
              <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-emerald-400">
                Evidence-backed incident investigation
              </p>
            </Reveal>

            <Reveal delay={0.05}>
              <h1 className="mt-5 text-4xl font-semibold leading-[1.1] tracking-tight text-zinc-50 sm:text-5xl">
                AI can explain a failure.
                <br />
                <span className="text-zinc-500">It cannot decide what is true.</span>
              </h1>
            </Reveal>

            <Reveal delay={0.1}>
              <p className="mt-5 max-w-lg text-[15px] leading-relaxed text-zinc-400">
                IncidentLens investigates failed deploys and stack traces.
                Deterministic rules verify what the model proposes — and every
                claim in the report must quote the exact log line that proves
                it. Nothing ships uncited.
              </p>
            </Reveal>

            <Reveal delay={0.15}>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/investigate"
                  className="rounded-md bg-emerald-500 px-5 py-3 text-sm font-semibold text-black transition hover:bg-emerald-400"
                >
                  Open a case →
                </Link>
                <Link
                  href="#pipeline"
                  className="rounded-md border border-zinc-800 px-4 py-3 text-sm font-medium text-zinc-300 transition hover:border-zinc-600 hover:text-zinc-100"
                >
                  How it works
                </Link>
              </div>
            </Reveal>

            <Reveal delay={0.2}>
              <dl className="mt-10 flex flex-wrap gap-x-10 gap-y-4">
                {STATS.map((s) => (
                  <div key={s.label}>
                    <dt className="sr-only">{s.label}</dt>
                    <dd className="font-mono text-2xl text-zinc-100">{s.value}</dd>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-zinc-500">
                      {s.label}
                    </p>
                  </div>
                ))}
              </dl>
            </Reveal>
          </div>

          <Reveal delay={0.1}>
            <HeroDemo />
          </Reveal>
        </div>
      </section>

      {/* The evidence thesis — the contrast IS the argument */}
      <section className="border-t border-zinc-900">
        <div className="mx-auto max-w-5xl px-5 py-20 sm:px-6">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">
              The evidence thesis
            </p>
            <h2 className="mt-3 max-w-2xl text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
              A confident answer is not the same thing as a correct one.
            </h2>
          </Reveal>

          <div className="relative mt-10 grid gap-5 lg:grid-cols-2 lg:gap-8">
            <span
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-1/2 z-10 hidden h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-zinc-800 bg-[#0a0e14] font-mono text-[10px] text-zinc-500 lg:grid"
            >
              vs
            </span>

            <Reveal>
              <div className="h-full rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-300">A chatbot, unprompted</p>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">
                    0 citations
                  </span>
                </div>
                <div className="mt-5 max-w-[90%] rounded-2xl rounded-bl-sm bg-zinc-800/60 px-4 py-3">
                  <p className="text-sm leading-relaxed text-zinc-300">
                    It looks like your deploy failed due to a missing environment
                    variable. You may also want to double-check your CI
                    configuration and make sure all your secrets are set
                    correctly. Hope this helps!
                  </p>
                </div>
                <p className="mt-5 border-t border-dashed border-zinc-800 pt-4 text-xs text-zinc-500">
                  Plausible prose. Nothing points back to the logs, so every
                  word has to be re-checked by hand.
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="h-full rounded-md border border-emerald-900/50 bg-[#0d1119] p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-zinc-100">IncidentLens</p>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-emerald-500">
                    1 citation · verified
                  </span>
                </div>

                <div className="mt-5 flex flex-wrap items-center gap-2">
                  <span className="rounded-sm border border-emerald-500/30 bg-emerald-500/10 px-1.5 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-widest text-emerald-300">
                    Rule match
                  </span>
                  <span className="rounded-sm border border-red-500/40 bg-red-500/10 px-1.5 py-0.5 font-mono text-[9.5px] uppercase tracking-widest text-red-400">
                    critical
                  </span>
                  <span className="ml-auto font-mono text-[10px] text-zinc-500">
                    confidence 95%
                  </span>
                </div>

                <h3 className="mt-3 text-[15px] font-semibold text-zinc-100">
                  Missing required environment variable
                </h3>

                <div className="mt-3 grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-2 overflow-hidden rounded-sm border border-zinc-800 bg-[#05080d] py-2.5 font-mono text-[11px]">
                  <span className="select-none text-right text-emerald-500/80">L42</span>
                  <span className="pr-3 text-zinc-200">
                    Required env STRIPE_WEBHOOK_SECRET is not set
                  </span>
                </div>

                <p className="mt-3 text-xs text-zinc-400">
                  → Set STRIPE_WEBHOOK_SECRET in the deploy environment, then rebuild.
                </p>
                <p className="mt-5 border-t border-zinc-800 pt-4 text-xs text-zinc-500">
                  Quoted, matched against the original logs, actionable. The
                  quote is the proof.
                </p>
              </div>
            </Reveal>
          </div>

          <Reveal>
            <p className="mt-8 max-w-2xl text-sm leading-relaxed text-zinc-500">
              Paste logs into a general-purpose chatbot and you get prose that
              sounds right — sometimes useful, sometimes wrong, impossible to
              check without re-reading everything yourself. IncidentLens
              requires the quote. A validator rejects any claim whose evidence
              doesn&apos;t match the original logs, and rule-based vs.
              AI-originated findings are always labeled separately.
            </p>
          </Reveal>
        </div>
      </section>

      {/* Pipeline — editorial rows, not a card grid */}
      <section id="pipeline" className="border-t border-zinc-900">
        <div className="mx-auto max-w-5xl px-5 py-20 sm:px-6">
          <Reveal>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-zinc-500">
              How an investigation runs
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
              Four stages, in order, every time.
            </h2>
          </Reveal>

          <ol className="mt-12">
            {PIPELINE.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.04}>
                <li className="group grid gap-2 border-t border-zinc-900 py-7 transition-colors hover:bg-zinc-900/20 sm:grid-cols-[4.5rem_minmax(0,1fr)_13rem] sm:gap-8 sm:py-8">
                  <span className="font-mono text-sm text-zinc-600 transition-colors group-hover:text-emerald-400">
                    {s.n}
                  </span>
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight text-zinc-100">
                      {s.title}
                    </h3>
                    <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-400">
                      {s.body}
                    </p>
                  </div>
                  <p className="self-center font-mono text-[11px] uppercase tracking-widest text-zinc-600 sm:text-right">
                    {s.tag}
                  </p>
                </li>
              </Reveal>
            ))}
            <li aria-hidden className="border-t border-zinc-900" />
          </ol>
        </div>
      </section>

      {/* Closing CTA — one flat, loud block */}
      <section className="bg-emerald-500">
        <div className="mx-auto flex max-w-5xl flex-col justify-between gap-8 px-5 py-16 sm:flex-row sm:items-end sm:px-6 sm:py-20">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-emerald-950/70">
              No login · no setup · paste logs
            </p>
            <h2 className="mt-3 max-w-xl text-3xl font-semibold leading-tight tracking-tight text-emerald-950 sm:text-4xl">
              Your next failure deserves a case file.
            </h2>
          </div>
          <Link
            href="/investigate"
            className="inline-flex shrink-0 items-center rounded-md bg-emerald-950 px-6 py-3.5 text-sm font-semibold text-emerald-50 transition hover:bg-black"
          >
            Open a case →
          </Link>
        </div>
      </section>

      <footer className="border-t border-zinc-900">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-5 py-8 sm:px-6">
          <p className="text-xs text-zinc-600">
            Incident<span className="text-emerald-500">Lens</span> — evidence-backed
            incident investigation.
          </p>
          <p className="font-mono text-[11px] text-zinc-700">Every claim cites its line.</p>
        </div>
      </footer>
    </main>
  );
}