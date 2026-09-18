import { describe, it, expect } from "vitest";
import { validateCitations } from "../src/lib/citation";
import type { Finding } from "../src/lib/types";

const lines = ["Build starting", "Error: connect ECONNREFUSED 10.0.0.5:5432", "Exit code 1"];
const mk = (line: number, quote: string): Finding => ({
  source: "agent", detectorId: "test", title: "t", severity: "high",
  confidence: 0.8, evidence: [{ line, quote }], remediation: "r",
});

describe("citation validator — the anti-hallucination gate", () => {
  it("accepts evidence that matches the cited line", () => {
    expect(validateCitations([mk(2, "ECONNREFUSED")], lines).accepted).toHaveLength(1);
  });
  it("rejects evidence citing a line that does not exist", () => {
    expect(validateCitations([mk(99, "ECONNREFUSED")], lines).rejected).toHaveLength(1);
  });
  it("rejects evidence whose quote is not on the cited line", () => {
    expect(validateCitations([mk(1, "ECONNREFUSED")], lines).rejected).toHaveLength(1);
  });
});