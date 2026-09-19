export const API = process.env.NEXT_PUBLIC_API_URL ?? "https://i04ivon4j7.execute-api.us-east-1.amazonaws.com";

export type Severity = "critical" | "high" | "medium";
export interface Evidence { line: number; quote: string }
export interface Finding {
  source: "rule" | "agent"; detectorId: string; title: string; severity: Severity;
  confidence: number; evidence: Evidence[]; remediation: string;
}
export interface IncidentReport {
  id: string; createdAt: string; lineCount: number; redactions: number;
  summary: string; findings: Finding[]; rejectedFindings: number; aiStatus: "ok" | "unavailable";
}