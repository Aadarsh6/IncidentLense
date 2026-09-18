import type { Finding, Evidence } from "./types";

// Whitespace-collapsed, case-insensitive comparison. Forgiving about
// formatting, strict about content.
const norm = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

// The core guarantee: a finding is ACCEPTED only if EVERY evidence item
// points at a real line whose text contains the quote. One bad citation
// rejects the whole finding. No exceptions.
export function validateCitations(findings: Finding[], logLines: string[]): { accepted: Finding[]; rejected: Finding[] } {
  const accepted: Finding[] = [];
  const rejected: Finding[] = [];
  for (const f of findings) {
    const ok =
      f.title.trim().length > 0 &&
      f.remediation.trim().length > 0 &&
      f.evidence.length > 0 &&
      f.evidence.every((e) => evidenceHolds(e, logLines));
    (ok ? accepted : rejected).push(f);
  }
  return { accepted, rejected };
}

function evidenceHolds(e: Evidence, lines: string[]): boolean {
  if (!Number.isInteger(e.line) || e.line < 1 || e.line > lines.length) return false;
  const line = norm(lines[e.line - 1]);
  const quote = norm(e.quote);
  return quote.length > 0 && line.includes(quote);
}