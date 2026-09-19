import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand, GetCommand, ScanCommand } from "@aws-sdk/lib-dynamodb";
import { z } from "zod";
import { investigate } from "./lib/pipeline";

const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.TABLE_NAME!;

const BodySchema = z.object({ logs: z.string().min(1).max(120_000) });

const json = (status: number, body: unknown) => ({
  statusCode: status,
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

export async function handler(event: { routeKey?: string; body?: string; pathParameters?: { id?: string } }) {
  try {
    switch (event.routeKey) {
      case "POST /analyze": {
        const parsed = BodySchema.safeParse(JSON.parse(event.body ?? "{}"));
        if (!parsed.success) return json(400, { error: "expected {\"logs\": string}" });
        const report = await investigate(parsed.data.logs);
        // 7-day TTL keeps the demo account free after the weekend
        await ddb.send(new PutCommand({ TableName: TABLE, Item: { ...report, expiresAt: Math.floor(Date.now() / 1000) + 7 * 86400 } }));        return json(200, report);
      }
      case "GET /incidents": {
        const res = await ddb.send(new ScanCommand({ TableName: TABLE, Limit: 50 }));
        const items = (res.Items ?? [])
          .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
          .map(({ id, createdAt, lineCount, redactions, summary, findings, rejectedFindings, aiStatus }) =>
            ({ id, createdAt, lineCount, redactions, summary, findings, rejectedFindings, aiStatus }));
        return json(200, items);
      }
      case "GET /incidents/{id}": {
        const res = await ddb.send(new GetCommand({ TableName: TABLE, Key: { id: event.pathParameters?.id } }));
        return res.Item ? json(200, res.Item) : json(404, { error: "incident not found" });
      }
      default:
        return json(404, { error: "no route" });
    }
  } catch (err) {
    console.error(err); // CloudWatch — free evidence for the video
    return json(500, { error: "investigation failed" });
  }
}