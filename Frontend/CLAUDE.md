# CLAUDE.md

Engineering constraints for anyone (human or AI) working on this repository.
Read this before touching any code.

## Context

IncidentLens is an **existing hackathon project with a working AWS backend.**
It is not a greenfield app. The backend is already built, deployed, and
demoed — it is not a placeholder or a mock to be replaced.

The current task is a **frontend visual/UX redesign only.** The backend and
its contract are out of scope, permanently, unless a human explicitly says
otherwise in a future instruction that supersedes this file.

## The backend/API integration is sacred

Sacred means: do not change it, do not "improve" it, do not refactor it,
do not route around it, even if a cleaner design seems obviously better.
If a task appears to require changing any of the following, stop and ask
rather than proceeding.

Specifically:

- **Do not modify `Frontend/lib/api.ts`.** This file defines the API base
  URL, the `Severity`, `Evidence`, `Finding`, and `IncidentReport` types,
  and is the single source of truth for the contract. Import from it;
  never redefine or shadow its types elsewhere.
- **Do not modify `Frontend/lib/sample.ts`.** The sample log blob is fixed.
- **Do not modify the `POST /analyze` request or response contract.** The
  request body must remain exactly `{ logs }`. The response must remain
  an `IncidentReport` as currently typed.
- **Do not modify `GET /incidents`.** Its response shape and usage (the
  case-file history list) stay as-is.
- **Do not modify `GET /incidents/:id`.** Its response shape (a full
  `IncidentReport`) stays as-is.
- **Do not modify the Lambda, API Gateway, or DynamoDB configuration** —
  this includes `src/handler.ts`, `template.yaml`, `samconfig.toml`, and
  anything else outside `Frontend/`.
- **Do not create a replacement Next.js API** (no route handlers, no
  server actions standing in for the Lambda). All data access goes
  through the existing endpoints, from the client, exactly as today.
- **Do not add authentication.** The product is deliberately login-free.
- **Do not invent backend fields.** If a design calls for a data point
  the API doesn't return, either drop that part of the design or flag it
  — never fabricate a field on the client and pretend the backend sent it.
- **Do not fake backend progress.** The existing `STAGES` ticker in the
  current code is a cosmetic, fixed-interval approximation while a single
  blocking request is in flight — that's acceptable and can be restyled,
  but do not introduce new "progress" UI that implies the backend is
  reporting real step-by-step status when it isn't. Never invent
  telemetry, percentages, or stage completion events the backend does not
  actually emit.

## Static export constraints

- **Preserve `output: "export"`** in `Frontend/next.config.mjs`. This app
  ships as static files to Amplify (see `amplify.yml`, which builds `out/`).
  There is no Next.js server at runtime — no route handlers, no server
  components doing data fetching, no middleware, no Image Optimization
  API unless explicitly reconfigured with `images.unoptimized`.
- **Preserve the `/report` query-param architecture.** The report page is
  addressed as `/report?id=...`, not a dynamic segment like
  `/report/[id]`. Do not convert it to a dynamic route — that would
  require `generateStaticParams`, which is impossible here since case IDs
  are created at runtime, and would break the static export entirely.
- **Preserve the `Suspense` boundary around `useSearchParams`.** The split
  between `app/report/page.tsx` (a thin `Suspense` wrapper) and
  `app/report/ReportClient.tsx` (the actual `useSearchParams()` consumer)
  exists specifically because `useSearchParams()` outside `Suspense`
  breaks static export builds. Keep this split in any redesign — do not
  merge them back into one file.

## Process

- **Run `npm run build` after each meaningful implementation phase**, not
  just at the very end. Catch static-export breakage (missing Suspense
  boundaries, accidental dynamic routes, server-only APIs) early, while
  it's cheap to isolate which change caused it.
- **Do not rewrite Git history or force push.** Normal commits only.

## Summary

If in doubt: the backend is fixed, the contract is fixed, the export mode
is fixed. Everything else — layout, components, styling, motion, copy,
page structure within these constraints — is open for the redesign.