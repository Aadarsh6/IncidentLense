"use client";
import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { fadeUp } from "../lib/motion";

/**
 * Fades + lifts content into view once, the first time it enters the
 * viewport. Duration stays inside the 150–400ms range from DESIGN.md.
 * When the user prefers reduced motion, content appears instantly with
 * no transform — the reveal becomes a no-op rather than being skipped
 * entirely, so layout stays identical either way.
 */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-64px" }}
      variants={fadeUp}
      transition={{
        duration: reduceMotion ? 0 : 0.4,
        ease: "easeOut",
        delay: reduceMotion ? 0 : delay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
