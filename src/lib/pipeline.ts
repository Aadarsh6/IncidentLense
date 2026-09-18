import { randomUUID } from "node:crypto";
import { redact } from "./redact";
import { runDetectors } from "./detectors";
import { validateCitations } from "./citation";
import { explainWithBedrock } from "./bedrock";
import type { IncidentReport, Finding } from "./types";

export async function investigate(rawLogs: string): Promise<IncidentReport> {
  // 1. Redact before anything sees the logs
  const { text, count } = redact(rawLogs);
  const lines = text.split("\n");
  const numbered = lines.map((l, i) => `${i + 1}: ${l}`).join("\n");

  // 2. Deterministic layer — always runs, never needs the model
  const ruleFindings = runDetectors(lines);

  // 3. AI layer — optional
  const ai = await explainWithBedrock(numbered);
  let agentFindings: Finding[] = [];
  let rejected = 0;
  let summary: string;

  if (ai) {
    summary = ai.summary;
    // 4. Agent claims must prove themselves against the original logs
    const vr = validateCitations(ai.findings, lines);
    agentFindings = vr.accepted;
    rejected = vr.rejected.length;
  } else if (ruleFindings.length > 0) {
    summary = `${ruleFindings[0].title} detected by rule engine${ruleFindings.length > 1 ? ` (+${ruleFindings.length - 1} more findings)` : ""}. AI layer unavailable.`;
  } else {
    summary = "No known failure signature found. Review the logs manually.";
  }

  return {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    lineCount: lines.length,
    redactions: count,
    summary,
    findings: [...ruleFindings, ...agentFindings],
    rejectedFindings: rejected,
    aiStatus: ai ? "ok" : "unavailable",
  };
}