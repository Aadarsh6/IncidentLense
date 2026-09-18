import type { Finding, Severity } from "./types";

// Deterministic failure signatures. The AI layer never sees logs these cover.
interface DetectorSpec {
  id: string;
  title: string;
  severity: Severity;
  patterns: RegExp[];
  remediation: string;
}

export const DETECTORS: DetectorSpec[] = [
  {
    id: "missing_env",
    title: "Missing environment variable",
    severity: "critical",
    patterns: [
      /\b[A-Z][A-Z0-9_]{2,}\s+(?:is\s+)?(?:undefined|not defined|missing|not set)\b/,
      /process\.env\.[A-Z0-9_]+\s+is\s+undefined/,
      /ValidationError:.*environment variable/i,
      /Required env (?:var|variable)/i,
    ],
    remediation: "Set the listed variable in your deployment environment config, then redeploy and confirm the service starts.",
  },
  {
    id: "module_not_found",
    title: "Module not found",
    severity: "high",
    patterns: [
      /Cannot find module ['"][^'"]+['"]/,
      /ERR_MODULE_NOT_FOUND/,
      /Module not found:/,
    ],
    remediation: "Run `npm install <missing-package>`. If it is a local import, fix the path or letter-case — Linux deploys are case-sensitive.",
  },
  {
    id: "db_conn",
    title: "Database connection failure",
    severity: "critical",
    patterns: [
      /ECONNREFUSED/,
      /\bP1001\b/,
      /password authentication failed for user/,
      /\bETIMEDOUT\b/,
    ],
    remediation: "Verify DB host/port/credentials, confirm the database is running, and check network access (security group / allow-list).",
  },
  {
    id: "port_bind",
    title: "Port bind failure",
    severity: "high",
    patterns: [/EADDRINUSE/, /address already in use/i, /listen EACCES/],
    remediation: "Bind to the platform-provided port (usually process.env.PORT) and stop the process holding the old one.",
  },
  {
    id: "iam_denied",
    title: "AWS IAM permission denied",
    severity: "critical",
    patterns: [/\bAccessDenied\b/, /is not authorized to perform/, /UnauthorizedOperation/],
    remediation: "Add the exact action string from the cited log line to the executing role's IAM policy.",
  },
  {
    id: "build_error",
    title: "Build / type error",
    severity: "high",
    patterns: [/npm ERR!/, /error TS\d+:/, /BUILD FAILED/i, /Failed to compile/, /Module build failed/],
    remediation: "Fix errors top-down — the first error usually causes the rest. Reproduce with the same build command the platform runs.",
  },
];

// Scans every line against every detector. Max 3 evidence lines each.
// Confidence is computed from match count, not guessed by a model.
export function runDetectors(lines: string[]): Finding[] {
  const findings: Finding[] = [];
  for (const d of DETECTORS) {
    const evidence: Finding["evidence"] = [];
    for (let i = 0; i < lines.length && evidence.length < 3; i++) {
      if (d.patterns.some((p) => p.test(lines[i]))) {
        evidence.push({ line: i + 1, quote: lines[i].trim().slice(0, 200) });
      }
    }
    if (evidence.length > 0) {
      findings.push({
        source: "rule",
        detectorId: d.id,
        title: d.title,
        severity: d.severity,
        confidence: evidence.length >= 2 ? 0.95 : 0.75,
        evidence,
        remediation: d.remediation,
      });
    }
  }
  return findings.sort((a, b) => b.confidence - a.confidence);
}