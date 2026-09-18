import { readFile } from "node:fs/promises";
import { investigate } from "../src/lib/pipeline";

const file = process.argv[2];
if (!file) { console.error("usage: npx tsx scripts/cli.ts incidents/demo1.txt"); process.exit(1); }
const report = await investigate(await readFile(file, "utf8"));
console.log(JSON.stringify(report, null, 2));