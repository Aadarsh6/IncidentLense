import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { z } from "zod";
import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Finding } from "./types";

const MODEL_ID = "amazon.nova-lite-v1:0";
const TIMEOUT_MS = 12_000;

const AgentOutputSchema = z.object({
  summary: z.string().min(1),
  findings: z.array(z.object({
    title: z.string().min(1),
    category: z.string().default("agent"),
    severity: z.enum(["critical", "high", "medium"]).default("medium"),
    evidence: z.array(z.object({ line: z.number().int(), quote: z.string() })).min(1),
    remediation: z.string().min(1),
    confidence: z.number().min(0).max(1).default(0.5),
  })).max(3).default([]),
});

// Best-effort AI layer. ANY failure (timeout, bad JSON, no access)
// returns null and the report proceeds rule-only. The product never
// depends on the model being up.
export async function explainWithBedrock(numberedLogs: string): Promise<{ summary: string; findings: Finding[] } | null> {
  try {
    const system = await readFile(path.join(process.cwd(), "prompts/system.txt"), "utf8");
    const res = await Promise.race([
      new BedrockRuntimeClient({ region: "us-east-1" }).send(new ConverseCommand({
        modelId: MODEL_ID,
        system: [{ text: system }],
        messages: [{
          role: "user",
          content: [{ text: "Failed deployment logs (redacted, line-numbered):\n\n" + numberedLogs +
            "\n\nSummarize the incident and report ONLY failure evidence a rule engine would miss. JSON only." }],
        }],
        inferenceConfig: { temperature: 0.2, maxTokens: 1200 },
      })),
      new Promise<never>((_, rej) => setTimeout(() => rej(new Error("bedrock-timeout")), TIMEOUT_MS)),
    ]);

    const text = (res?.output?.message?.content ?? []).map((c: any) => c.text ?? "").join("");
    const parsed = AgentOutputSchema.safeParse(extractJson(text));
    if (!parsed.success) return null;
    return {
      summary: parsed.data.summary,
      findings: parsed.data.findings.map((f) => ({
        source: "agent" as const,
        detectorId: f.category,
        title: f.title,
        severity: f.severity,
        confidence: f.confidence,
        evidence: f.evidence,
        remediation: f.remediation,
      })),
    };
  } catch {
    return null;
  }
}

function extractJson(text: string): unknown {
  const cleaned = text.replace(/```(?:json)?/g, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("no json in model output");
  return JSON.parse(cleaned.slice(start, end + 1));
}