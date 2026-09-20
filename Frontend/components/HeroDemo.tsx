"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";

type LogLine = { text: string; secret?: boolean; error?: boolean };

const LINES: LogLine[] = [
  { text: "$ docker build -t api ." },
  { text: "Step 6/12 : RUN npm ci --omit=dev" },
  { text: "Error: Required env STRIPE_WEBHOOK_SECRET is not set", error: true },
  { text: "    at loadConfig (/app/src/config.ts:42:11)" },
  { text: "AWS_ACCESS_KEY_ID=AKIA47HXZ92QK1M8PDQF", secret: true },
  { text: "exit code 1" },
];

const STEP_MS = 460;
const MASK_AT = LINES.length;
const VERIFY_AT = LINES.length + 1;
const VERDICT_AT = LINES.length + 2;
const TOTAL = LINES.length + 3;
const HOLD_MS = 3200;

/**
 * Scripted, looping playback of the pipeline: logs type in, a secret is
 * visibly redacted, the evidence line is highlighted, the finding card
 * assembles. Deliberately labeled "not live data" — honesty is part of
 * the product's voice.
 */
export function HeroDemo() {
  const reduce = useReducedMotion();
  const [step, setStep] = useState(0);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (reduce) return;
    if (step >= TOTAL) {
      const t = setTimeout(() => {
        setCycle((c) => c + 1);
        setStep(0);
      }, HOLD_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setStep((s) => s + 1), step === 0 ? 600 : STEP_MS);
    return () => clearTimeout(t);
  }, [step, reduce]);

  const done = reduce || step >= TOTAL;
  const shown = reduce ? LINES.length : Math.min(step, LINES.length);
  const masked = done || step > MASK_AT;
  const verified = done || step > VERIFY_AT;
  const verdict = done || step >= VERDICT_AT;

  const phase = verdict
    ? "case file ready"
    : verified
    ? "verifying"
    : masked
    ? "redacting"
    : "intake";

  return (
    <div>
      <div className="overflow-hidden rounded-md border border-zinc-800 bg-[#05080d]">
        {/* window chrome */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-3.5 py-2.5">
          <div className="flex items-center gap-1.5" aria-hidden>
            <span className="h-2 w-2 rounded-full bg-zinc-700/80" />
            <span className="h-2 w-2 rounded-full bg-zinc-700/80" />
            <span className="h-2 w-2 rounded-full bg-zinc-700/80" />
          </div>
          <span className="hidden font-mono text-[10px] text-zinc-600 sm:block">
            ~/incidents/deploy-0917.log
          </span>
          <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">
            {phase}
          </span>
        </div>

        {/* log body */}
        <motion.div
          key={cycle}
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduce ? 0 : 0.4, ease: "easeOut" }}
          className="min-h-[172px] py-3 font-mono text-[11.5px] leading-[1.9] sm:text-xs"
        >
          {LINES.slice(0, shown).map((line, i) => {
            const isEvidence = Boolean(line.error) && verified;
            const isMaskedSecret = Boolean(line.secret) && masked;
            return (
              <div
                key={i}
                className={`grid grid-cols-[2.4rem_minmax(0,1fr)] gap-x-2 border-l-2 px-3.5 ${
                  isEvidence
                    ? "border-emerald-500 bg-emerald-500/[0.06]"
                    : "border-transparent"
                }`}
              >
                <span className="select-none text-right text-zinc-700">
                  L{String(i + 1).padStart(2, "0")}
                </span>
                {isMaskedSecret ? (
                  <span className="text-zinc-500">
                    AWS_ACCESS_KEY_ID=
                    <span className="tracking-tighter">████████████████████</span>
                    <span className="ml-2 text-emerald-500/80"># redacted</span>
                  </span>
                ) : (
                  <span
                    className={
                      line.error
                        ? "text-red-400"
                        : line.secret
                        ? "text-amber-300/90"
                        : "text-zinc-400"
                    }
                  >
                    {line.text}
                  </span>
                )}
              </div>
            );
          })}
          {!done && shown < LINES.length && (
            <div className="px-3.5 pt-0.5">
              <span className="caret-blink text-emerald-400">▍</span>
            </div>
          )}
        </motion.div>

        {/* the finding — styled to mirror the real report page */}
        <AnimatePresence>
          {verdict && (
            <motion.div
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -6 }}
              transition={{ duration: reduce ? 0 : 0.35, ease: "easeOut" }}
              className="border-t border-zinc-800 bg-[#0a0e14] px-3.5 py-3.5"
            >
              <div className="flex flex-wrap items-center gap-2">
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
              <p className="mt-2.5 text-[13px] font-semibold text-zinc-100">
                Missing required environment variable
              </p>
              <div className="mt-2 flex gap-2 font-mono text-[11px]">
                <span className="shrink-0 text-emerald-500/80">L03</span>
                <span className="min-w-0 text-zinc-300">
                  Required env STRIPE_WEBHOOK_SECRET is not set
                </span>
              </div>
              <p className="mt-2.5 border-t border-zinc-800/70 pt-2.5 text-xs text-zinc-400">
                → Set STRIPE_WEBHOOK_SECRET in the deploy environment, then rebuild.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <p className="mt-2.5 font-mono text-[10px] uppercase tracking-widest text-zinc-600">
        Illustrative playback · not live data
      </p>
    </div>
  );
}