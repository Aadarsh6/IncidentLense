  export type Severity = "critical" | "high" | "medium";
  
  export interface Evidence {
    line: number;    // 1-based line number in the original log
    quote: string;   // exact text claimed to be on that line
  }
  
  export interface Finding {
    source: "rule" | "agent";
    detectorId: string;
    title: string;
    severity: Severity;
    confidence: number;
    evidence: Evidence[];
    remediation: string;
  }
  
  export interface IncidentReport {
    id: string;
    createdAt: string;
    lineCount: number;
    redactions: number;
    summary: string;
    findings: Finding[];
    rejectedFindings: number;
    aiStatus: "ok" | "unavailable";
  }