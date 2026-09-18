// Scrubs secrets from logs BEFORE any processing. Runs first, always.
type Rule = [label: string, re: RegExp];

const RULES: Rule[] = [
  // AWS access key IDs (AKIA/ASIA + 16 chars)
  ["aws-key", /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g],
  // JWTs: three base64url segments
  ["jwt", /\beyJ[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\.[A-Za-z0-9_-]{15,}\b/g],
  // Authorization headers
  ["bearer", /\bBearer\s+[A-Za-z0-9._~+/=-]{20,}/g],
  // KEY=value / secret: value pairs. Keeps the key name visible,
  // hides the value. Skips `undefined`/`null` so the missing-env
  // detector can still see "DATABASE_URL is undefined".
  ["kv-secret", /\b(password|passwd|secret|token|api[_-]?key|access[_-]?key|client[_-]?secret|database[_-]?url|connection[_-]?string)\b(\s*[:=]\s*)(?!undefined\b|null\b)("[^"\n]{4,}"|'[^'\n]{4,}'|[^\s"']{8,})/gi],
];

export function redact(text: string): { text: string; count: number } {
  let count = 0;
  let out = text;
  for (const [label, re] of RULES) {
    out = out.replace(re, (...args) => {
      count++;
      return label === "kv-secret"
        ? `${args[1]}${args[2]}[REDACTED:${label}]`
        : `[REDACTED:${label}]`;
    });
  }
  return { text: out, count };
}