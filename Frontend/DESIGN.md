# DESIGN.md

Visual and product direction for IncidentLens. This governs the redesign
of `/`, `/investigate`, and `/report`.

## What this product is

IncidentLens is a **premium developer/infrastructure investigation tool.**
It is not generic AI SaaS. It should look and feel like a piece of
professional tooling a senior engineer would trust at 2 AM during an
outage — closer to a forensics or observability product than a chatbot
wrapper.

## Core product idea

> **AI can explain a failure. It cannot decide what is true.**

Every visual and interaction decision should reinforce this. The product's
entire value proposition is that claims are backed by cited, verifiable
evidence from the actual logs — not confident prose. The design should
make that verification process *visible*, not hide it behind a friendly
chat bubble. Rule-based findings and AI-originated findings should always
be visually distinguishable, never blended together as if they carry the
same epistemic weight.

## Visual direction

The aesthetic is: **dark, technical, editorial, precise, restrained.**
Think premium developer tooling — evidence, forensics, infrastructure —
not consumer AI.

Concretely:

- Dark background as the default surface, not a dark-mode toggle afterthought.
- Editorial layout discipline: clear hierarchy, generous margins, content
  given room to breathe rather than packed into dashboard widgets.
- Precision over decoration. Every visual element should earn its place
  by conveying real information (status, severity, confidence, source).
- Restraint as a feature, not a limitation — the product's credibility
  comes from feeling careful and exact, not flashy.

### Avoid

- Generic purple AI gradients
- Excessive glassmorphism
- Floating blobs
- Excessive rounded cards
- Giant decorative 3D
- Excessive glow
- Meaningless animation
- Card soup (walls of identical rounded boxes with no hierarchy)
- Fake telemetry
- Fake progress
- Generic AI SaaS visuals (the look of "yet another ChatGPT wrapper")

### Use

- Strong typography as a primary design tool — weight and scale do the
  work that decoration would otherwise be asked to do.
- Intentional whitespace — space is used to establish hierarchy and
  focus, not left over by accident.
- Thin borders over shadows/glass for separating regions.
- Technical metadata treated as a first-class visual element (timestamps,
  line numbers, IDs, counts) — this is a tool for people who read logs
  for a living; metadata should look native to that audience, not
  decorative.
- **Monospace** for anything that is or represents raw log content:
  pasted logs, cited evidence lines, line numbers.
- **Sans-serif** for product and interface text: headings, labels, body
  copy, navigation, buttons.
- Color carries meaning, consistently, everywhere:
  - **Emerald** — verified / success / rule-confirmed
  - **Amber** — warning / degraded (e.g. AI layer offline)
  - **Red** — failure / critical severity
  - **Violet, used sparingly** — AI-originated content specifically. Violet
    should read as "this came from the model, not a deterministic rule,"
    never as a generic accent or brand color splashed elsewhere.

## Motion

Motion should feel **subtle and purposeful** — it should clarify state
changes, not perform for their own sake.

- Typical interaction range: **150–400ms.**
- Animate primarily **transform and opacity** (cheap, GPU-friendly,
  avoids layout thrash).
- **Respect `prefers-reduced-motion`** everywhere motion is used.
- **No infinite decorative animations** (no perpetual pulsing glows,
  looping background motion, idle shimmer for its own sake).
- **No WebGL.**
- **No video backgrounds.**

Motion should answer "what just changed and where did it go" — entrance
of real content, state transitions (e.g. a finding becoming verified),
focus changes. It should never be the reason something feels premium;
restraint and typography carry that job.

## Performance

- Keep the JS bundle reasonable — this is a static-export app with no
  server to lean on, so client-side weight is the whole budget.
- Avoid unnecessary dependencies. Every new package needs a real reason.
- Avoid expensive visual effects (heavy blur/backdrop-filter stacks,
  large animated SVG/canvas scenes, particle systems).
- **Preserve static export** (`output: "export"`) — nothing in the
  redesign should require a Next.js server at runtime.
- **Preserve mobile usability.** Engineers may open a case file from a
  phone during an incident; layouts, tap targets, and the log/evidence
  views must remain usable at small viewports, not just look good on a
  wide desktop screen.

## The results page

The `/report` page is the product's proof point. **Evidence must be the
visual centerpiece** of that page — cited log lines, line numbers, and
the rule-vs-AI provenance of each finding should be the most visually
prominent content on the page, more prominent than chrome, summary
copy, or decoration. If a viewer remembers one thing about this product,
it should be "it showed me exactly which log line proved each claim."

## Originality

Do not copy any other product's visual system (no cloning existing
observability tools, no lifting another company's specific component
patterns or illustration style). The aesthetic described above should be
arrived at independently, in service of this product's specific claim:
that it verifies rather than merely explains.