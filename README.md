# IncidentLens

**Paste your failed deploy logs. Get back a diagnosis where every claim cites the exact log line that proves it.**

[![AWS](https://img.shields.io/badge/AWS-Lambda%20%7C%20API%20Gateway%20%7C%20DynamoDB%20%7C%20Bedrock%20%7C%20Amplify-orange)]()
[![Track](https://img.shields.io/badge/Track-Ship%20It-blue)]()
[![Hackathon](https://img.shields.io/badge/First%20Commit-2026-purple)]()

Built for **First Commit** (Bharat Builds Tour × AWS Builder Center, Sept 17–20, 2026) — **Ship It track**, deployed end-to-end on AWS, with **Best UI** as a secondary target.

![IncidentLens report page — a RULE MATCH finding with cited log lines](docs/screenshot/report.png)

**Live app:** https://YOUR-AMPLIFY-URL.amplifyapp.com · **Demo video:** https://YOUR-VIDEO-LINK · **API:** https://YOUR-API-URL.execute-api.us-east-1.amazonaws.com

---

## Contents

- [Live Demo](#live-demo)
- [Built for First Commit](#built-for-first-commit)
- [The Problem](#the-problem)
- [Why Not a Chatbot](#why-not-a-chatbot)
- [How It Works](#how-it-works)
- [Architecture](#architecture)
- [AWS Services Used](#aws-services-used)
- [Repository Structure](#repository-structure)
- [Running Locally](#running-locally)
- [The Anti-Hallucination Gate](#the-anti-hallucination-gate)
- [Demo Video](#demo-video)
- [What Fought Back](#what-fought-back)
- [What I Learned](#what-i-learned)
- [Cost](#cost)
- [Limitations](#limitations)
- [Roadmap](#roadmap)
- [Third-Party Credit](#third-party-credit)
- [AI Tools Disclosure](#ai-tools-disclosure)
- [Author](#author)

---

## Live Demo

Open the app, click **"try a sample incident"**, then **Investigate**. In under 5 seconds you get a case file: severity-ranked findings, each with cited log line numbers, confidence, and a remediation. Every investigation is persisted and re-openable from the case-files list.

No login, no setup — the sample button exists so anyone can see the full flow in one click.

## Built for First Commit

| Judging criterion | Where to look |
|---|---|
| Idea & Impact | [The Problem](#the-problem), [Why Not a Chatbot](#why-not-a-chatbot) |
| Built on AWS | [AWS Services Used](#aws-services-used), [Architecture](#architecture) |
| Learning | [What I Learned](#what-i-learned), [What Fought Back](#what-fought-back) |
| Execution | [Live Demo](#live-demo), [The Anti-Hallucination Gate](#the-anti-hallucination-gate), [Cost](#cost) |
| Demo | [Demo Video](#demo-video) |

## The Problem

A deployment fails at 2 AM. You are alone — no SRE team, no observability budget, no senior to ping. You are scrolling hundreds of lines of build output, stack traces, and environment dumps, guessing.

Existing options:

- **Enterprise incident tools** assume a team, an agent installed per-service, and a budget.
- **Pasting logs into a chatbot** sends your secrets to a third party and returns a confident answer whose evidence nobody can check.

IncidentLens is the missing middle: an evidence-backed investigator built for people who deploy alone.

## Why Not a Chatbot

This is the design question the whole product answers.

| | Paste logs into ChatGPT | IncidentLens |
|---|---|---|
| **Secrets** | The full log — DB passwords, AWS keys, Stripe keys — leaves your machine | Redacted before anything sees the logs (demo1: 3 secrets caught pre-analysis) |
| **Evidence** | Plausible prose; hallucinated line numbers are common and unverifiable | Every claim must quote its cited line exactly; a validator rejects any finding whose evidence doesn't match the original logs |
| **Confidence** | Vibes | Computed from evidence count (2 matching lines → 0.95) |
| **Availability** | Model down = tool down | The deterministic path runs with no model at all — demonstrated live during this event (see [What Fought Back](#what-fought-back)) |
| **Workflow** | Chat scrollback you re-explain every time | Persisted case files with severity, shareable URLs, and 7-day TTL cleanup |

One sentence: **the AI proposes, deterministic rules verify, the human decides.**

## How It Works

Four stages run in order inside one Lambda function:

**1. Redact** — regex sweep scrubs AWS keys, JWTs, bearer tokens, and `KEY=value` secrets before any processing. Skips values like `undefined` so missing-env findings stay visible. Counter shown in the UI.

**2. Detect** — six deterministic detectors scan every line. No model involved. Confidence is computed, not guessed: 1 matching line → 0.75, 2+ → 0.95.

| Detector | Example signature caught |
|---|---|
| `missing_env` | `Required env STRIPE_WEBHOOK_SECRET is not set` |
| `module_not_found` | `Cannot find module 'x'` / `ERR_MODULE_NOT_FOUND` |
| `db_conn` | `ECONNREFUSED`, `Prisma P1001`, `auth failed` |
| `port_bind` | `EADDRINUSE`, `listen EACCES` |
| `iam_denied` | `AccessDenied`, `not authorized to perform` |
| `build_error` | `npm ERR!`, `error TS2304: Cannot find name 'apiRoutes'` |

**3. Explain** — Bedrock (Amazon Nova Lite) summarizes the incident and adds findings only for evidence the rule engine missed. This layer is optional by design: any failure, timeout, or malformed output returns `null` and the report proceeds rule-only. The UI shows the pipeline state honestly: `Explain ⚠ offline`.

**4. Verify** — the citation validator checks every AI finding: does the cited line exist, and does the quoted text actually appear on it (whitespace-normalized)? One unverifiable quote → the whole finding is rejected, and the rejection counter is displayed in the report.

Rule findings skip validation because their evidence is true by construction — the evidence *is* the line the regex matched. Agent findings are claims about the logs, so they must prove themselves.

## Architecture

```text
┌─────────────────────────────┐
│      Next.js 15 (static)     │
│      Amplify Hosting         │
└──────────────┬────────────────┘
               │ POST /analyze
               │ GET  /incidents/{id}
               ▼
┌─────────────────────────────┐
│    API Gateway (HTTP API)    │
└──────────────┬────────────────┘
               ▼
┌───────────────────────────────────────┐
│      Lambda (Node 22, arm64)           │
│                                         │
│   1. redact.ts                         │
│   2. detectors.ts                      │
│   3. bedrock.ts   ───► Amazon Bedrock   │
│   4. citation.ts        (Nova Lite,    │
│      (pipeline.ts)       optional)     │
└──────────────┬──────────────────────────┘
               ▼
┌─────────────────────────────┐
│    DynamoDB (on-demand)      │
│    case files, TTL 7 days    │
└─────────────────────────────┘
```

**Why each piece:**

- **SAM / CloudFormation** — the entire backend is one `template.yaml`: function, API, table, and IAM roles are reproducible with `sam deploy`, tearable-down with `sam delete`.
- **Lambda + scale-to-zero** — an incident tool is idle most of its life. Idle cost ≈ ₹0.
- **DynamoDB TTL** — every case file carries an `expiresAt`; old incidents self-delete with no cron and no cost.
- **Bedrock as a layer, not a dependency** — isolated behind one function (`bedrock.ts`), pluggable with any provider, but kept on-AWS so the AI stays inside the same trust boundary as everything else.

## AWS Services Used

**Amazon Bedrock** (Nova Lite, explanation layer) · **Lambda** (investigation pipeline) · **API Gateway HTTP API** (frontend ↔ backend) · **DynamoDB** (persistence + TTL) · **Amplify Hosting** (frontend) · **CloudFormation via AWS SAM** (infrastructure as code) · **IAM** (least-privilege roles per component) · **CloudWatch** (logs) · **S3** (deployment artifacts).

## Repository Structure

```text
incidentlens/
├── template.yaml          # SAM: Lambda + API GW + DynamoDB + IAM
├── src/
│   ├── lib/
│   │   ├── redact.ts      # secret scrubbing (runs first, always)
│   │   ├── detectors.ts   # 6 deterministic failure signatures
│   │   ├── bedrock.ts     # optional AI layer (fails open to rules-only)
│   │   ├── citation.ts    # anti-hallucination validator
│   │   ├── pipeline.ts    # orchestrates 1 → 4
│   │   └── types.ts       # shared contracts
│   └── handler.ts         # Lambda entry: HTTP in → investigate() → DynamoDB
├── prompts/
│   └── system.txt         # AI contract: JSON-only, verbatim quotes
├── incidents/              # demo1 (synthetic, planted secrets), demo2 (real deploy failure)
├── tests/                  # citation validator: accepts true evidence, rejects invented
├── Frontend/                # Next.js 15 + Tailwind 4 static site
└── docs/                    # architecture, demo script, AI disclosure, screenshots
```

## Running Locally

Prerequisites: Node 20+, AWS credentials configured, SAM CLI.

```bash
# backend
npm install
npm test                                   # 3 tests: the citation gate
npm run cli -- incidents/demo1.txt         # full pipeline, terminal report

# deploy backend
sam build && sam deploy --guided

# frontend
cd Frontend && npm install && npm run dev  # http://localhost:3000
```

## The Anti-Hallucination Gate

The core guarantee, as a test:

```bash
npm test
✓ accepts evidence that matches the cited line
✓ rejects evidence citing a line that does not exist
✓ rejects evidence whose quote is not on the cited line
```

An AI finding is accepted only if every evidence item survives: the line must exist, and the quote must appear on it (whitespace-normalized, case-insensitive). Rejected findings are counted and shown in the report — the system never silently drops or silently trusts a model claim.

## Demo Video

Three minutes — problem, live investigation on a real production failure, the mechanism, the architecture, and what I learned: https://YOUR-VIDEO-LINK

## What Fought Back

- **`Layout.tsx` vs `layout.tsx`** — Windows does not care about filename case; the Linux build server does. Localhost worked for hours while production failed, because git had committed the wrong case. Fixed by a one-letter rename. The classic "works on my machine," earned the hard way.
- **`globals.css` was empty** — the CSS pipeline worked perfectly and delivered a perfect 0-byte stylesheet. The CloudFront etag was literally the MD5 of an empty string (`d41d8cd9...`). Diagnosed by checking artifact byte counts instead of trusting the green build.
- **npm optional-dependencies bug (#4828)** — rolldown's native binding failed to install on Windows, twice, resurrecting itself every time the lockfile regenerated. Solved by moving to the esbuild-based vitest line.
- **Amazon's new-account model gate** — Bedrock invocation was blocked all weekend (`Operation not allowed while the account finished verification`). The degradation path ran in production the entire time: the UI reports `Explain ⚠ offline` and the deterministic layer carried every investigation. The resilience thesis didn't need a slide — it got demonstrated live.

## What I Learned

- SAM end-to-end: template → CloudFormation → deployed IAM roles, and why deploy-time permissions differ from runtime ones.
- DynamoDB TTL, on-demand billing, and conditional thinking around idempotent writes.
- That "AI feature" is an architecture question, not a model question: redaction before inference, rules before generation, verification after.
- Windows-vs-Linux case sensitivity as a real production failure mode, not a trivia item.
- That a graceful-degradation path you actually watch run is worth more than a demo that only works when everything works.

## Cost

Scale-to-zero by design. The tool is idle between incidents, and idle means no Lambda invocations, no API Gateway requests, no DynamoDB reads — approximately ₹0/month until an actual failure is investigated. The whole hackathon weekend ran inside free-tier + starter credits, including the deployed URL and every demo.

## Limitations

Stated plainly: the detector set covers six common failure classes — novel failures rely on the AI layer, which was invocation-gated during the event window (integration is complete and deployed; see [What Fought Back](#what-fought-back)). Long log bundles are truncated client-side. No authentication — anyone with the URL can open case files, acceptable for a demo tool whose data is user-pasted, redacted, and auto-expiring in 7 days.

## Roadmap

- **GitHub Actions integration** — a workflow step pulls the failed job's logs via the GitHub API and posts the report into the Job Summary and PR comment. The investigation lands where the failure happened.
- **CloudWatch Logs subscription filters → Lambda** — for AWS deploys, zero-paste analysis: the failure streams itself to the investigator.
- **Deploy-webhook adapters** for Render/Vercel/Netlify.
- **A detector registry that grows per incident** — every new failure class becomes a rule, shrinking future model usage.

## Third-Party Credit

<!-- If you started from any boilerplate, template, or open-source scaffold beyond plain npm packages, name it and its license here. Required by the event rules — anything you didn't write needs a credit. If everything here was written from scratch during the event, replace this with: "No external boilerplate or templates were used beyond standard npm packages, each under its own open-source license (see package.json)." -->

## AI Tools Disclosure

Per event rules: AI-assisted tooling — Zed's built-in AI assistant (code completion, scaffolding, and configuration debugging) — was used throughout the build. The core engine — `detectors.ts`, `citation.ts`, the pipeline, the SAM template, and the citation test suite — was written and reviewed by hand. All architecture decisions, the verification mechanism, and this document are the author's own.

## Author

**Aadarsh Mishra** — final-year B.Tech (AI & ML), 2027 · [GitHub]() · [Portfolio]() · [LinkedIn]()

Built solo in 4 days: Sept 17–20, 2026.
