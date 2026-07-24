# Output-Quality Audit Kit

Recurring procedure for auditing what the 5 pre-push gates CANNOT see: output quality.
Established 2026-07-19 (30 tools, 21 confirmed defects — see QUALITY-AUDIT-2026-07-19.md).

## When to run

- **Scheduled:** one wave (~6 tools) monthly — cohorts below, full catalog ≈ quarterly.
- **Triggered immediately** when any of:
  - a model id changes in `backend/lib/models.js` (or a Railway MODEL_* override flips)
  - a locked tool's prompt is edited (re-audit that tool with its cohort)
  - the metrics report shows a tool's error rate or avg time spiking
- Priority loop (audit every wave regardless of cohort): grief-guide, drive-home,
  safe-walk, lease-trap-detector, bill-rescue — safety/legal tools where a quality
  regression harms users most.

## Procedure (per wave)

1. Ensure the local backend is up: `node backend/server.js` (port 3001).
2. Launch ONE general-purpose agent per ~6 tools with the brief below. Rules that
   matter (learned the hard way):
   - agent runs every curl SYNCHRONOUSLY in the foreground (idling on monitors ends
     its run); `--max-time 380`; header `x-perf-probe: 1` (dev rate-limit bypass)
   - agent reads each route file BEFORE calling (request shape + schema)
   - agent authors realistic, messy inputs with PLANTED CHECKABLE DETAILS and counts
     recall against them; recomputes any derived numbers itself
3. Fix CONFIRMED defects (bug classes with precedent) same-day; log judgment calls.
4. Append findings to a dated `audit/QUALITY-AUDIT-YYYY-MM-DD.md`; commit fixes in
   small batches with gates + goldens (locked tools) per batch.

## The agent brief (template)

> You are auditing OUTPUT QUALITY for DeftBrain tools (repo <path>, local backend at
> http://localhost:3001). READ-ONLY: do NOT edit, commit, or push. Deliver the complete
> ranked findings report in your FINAL message. Run every curl SYNCHRONOUSLY in the
> foreground; --max-time 380; headers "x-perf-probe: 1" + Content-Type: application/json;
> userLanguage:"en", userLocale:"en-US", userCurrency:"USD", userRegion:"US".
>
> Audit these N endpoints, one realistic run each (read each route file FIRST; author
> substantial messy inputs with planted checkable details): <list>
>
> JUDGE on: A repetitiveness across fields/items; B generic-vs-specific (engages YOUR
> planted details?); C truncation/incompleteness + response time (flag >180s; count
> planted items recalled); D annotation leaks (schema instructions echoed into values);
> E contradictions between fields (counts vs lists, scores vs prose); F accuracy-vs-input
> AND model-knowledge accuracy (invented facts/programs/stats stated confidently, wrong
> derived numbers — recompute percentages yourself); G (safety tools) appropriately
> conservative guidance, correct crisis resources.
>
> Per tool: verdict (GOOD / MINOR ISSUES / SIGNIFICANT ISSUES), 1-3 short evidence
> quotes, likely-cause file:line for confirmed bugs. No style nitpicks; re-read outputs
> before claiming issues. End with a ranked most-needs-work table + the one change per tool.

Optionally run ONE tool per wave with userLanguage:"de" as a localization spot check.

## Cohorts (~6 tools each; rotate one per month, priority loop always added)

1. Document: plaintalk, jargon-assassin, contract-decoder, research-decoder, quote-check, scam-radar
2. Life-admin: brain-dump-buddy, subscription-tamer, skill-gap-map, brag-sheet-builder, crisis-prioritizer, bill-rescue
3. Coaching: conflict-coach, difficult-talk-coach, velvet-hammer, decision-coach, money-diplomat, apology-calibrator
4. Health/safety: doctor-visit-prep, mental-health-navigator, grief-guide, spiral-stopper, sleep-architect, drive-home
5. Decisions/consumer: buy-wise, upsell-shield, giftology, name-audit, future-proof, layover-maximizer
6. Social/creative: toast-writer, hobby-match, date-night, room-reader, culture-briefing, argue-better
(then continue through the remaining catalog alphabetically, ~6 per wave)

## Known failure modes to watch for (from 2026-07-19)

- Model-knowledge accuracy: stale laws / invented programs stated confidently. The
  grounded pre-pass pattern (lease-trap v3 / bill-rescue v2) is the fix where volatile
  facts are core; the honest-hedge rule where they're incidental.
- Rich-input JSON validity: quote-heavy inputs break parsing wherever a prompt lacks
  the NO_QUOTE_RULE — a rich test input MUST contain quoted dialogue.
- FAST/haiku tools fabricate specifics; SMART tools drift on arithmetic/consistency.
- Latency cliffs: single mega-schema calls; the parallel-split pattern is the fix.
- Hero stats: model-computed counts should be code-computed from array lengths.

## Added 2026-07-23 (first multi-language round — see QUALITY-AUDIT-2026-07-23.md)

- **Language-aware token budgets:** any max_tokens sized on English (or even the
  German fix) is suspect for Arabic/Chinese (~1.3-1.5× needed). A "German
  truncation" fix is not closed until re-verified in Arabic.
- **NO_QUOTE_RULE coverage is binary:** `grep -c "double-quote" backend/routes/<f>.js`
  = 0 perfectly predicted every parse-fail outage across 3 languages. Sweep it.
- **Native-orthography drift:** long German outputs degrade to ASCII (ae/oe/ue)
  in later fields — hits copy-paste deliverables; invisible to all gates.
- **422-blames-user catches:** retry-exhaustion handlers that map SyntaxError to
  "improve your input" messages gaslight users — check catch blocks.
- **Wave logistics:** give each parallel agent its OWN scratchpad subdirectory —
  shared payload filenames collided and silently swapped one agent's language.
- Run at least one non-English wave per quarter; crisis-resource localization and
  enum integrity held everywhere in this round, but truncation budgets did not.
