# SkillGapMap — architecture & lock notes

**Known-good:** tag `skillgapmap-v1` · golden `audit/skill-gap-map-golden-sample.json`
**Verify:** `npm run check:golden skill-gap-map` (backend up: `npm run dev:backend`)

## What it is
A 23-feature career-transition engine (gap analysis, learning timeline, proof projects, resume
audit, mock interviews, salary economics, company targeting, mentor matching, etc.). Frontend
`src/tools/SkillGapMap.js` (~1560 lines). Backend `backend/routes/skill-gap-map.js` (~1540 lines)
— **23 endpoints** under `/api/skill-gap-*`, all `claude-sonnet-4-6`, all `callClaudeWithRetry` +
`withLanguage` + `withLocaleContext`.

## DO NOT silently reverse (the locked fixes)
1. **`/skill-gap-map` max_tokens ≥ 8000.** It was 3000 — the `skill_gaps[]` schema (~10 fields ×
   6-10 gaps, plus `transferable_skills` + `overall_readiness`) is the largest output here, and it
   **truncated mid-array** → deterministic JSON parse-fail on all 3 retries → **500 for realistic
   inputs** (the tool's namesake feature broken on ordinary use). Bumped to 5000 at lock — but
   **5000 was still right at the edge**: on 2026-06-28 a truncation audit + `check:golden` re-verify
   caught the golden's own `map-marketing-to-pm` case truncating at ~4800 tokens (position 18527/
   19167) → retry loop → 180s timeout (2/3 cases). **Now 8000** (sibling `/skill-gap-reframe` runs
   7500); full map ~90s, ~11 gaps, golden 3/3 PASS. **Lesson:** never set max_tokens to the observed
   output size — output length varies run-to-run, so a right-at-edge limit is flaky, not safe.
   The golden's `map-marketing-to-pm` case guards this (it 500'd/timed-out before).
2. **`free_or_paid` is a currency-neutral tier**, not USD thresholds. It was
   `"free|cheap (<$50)|moderate ($50-200)|expensive (>$200)"` — rendered raw in the learning plan
   ("(Coursera, moderate ($50-200))"), so non-USD users saw USD despite `withLocaleContext`. Now
   `"free | cheap | moderate | expensive"`. Keep it currency-free.
3. **Mentor `frequency`/`duration` are short phrases, not `(number)`.** They're descriptive strings
   ("Every 2 weeks", "3-6 months") rendered raw; the `(number)` annotation risked a bare number.
4. **All 23 endpoints on `claude-sonnet-4-6`** + withLocaleContext. All 21 guards key on present,
   non-nullable fields (`map` guards `gaps || skill_gaps`) — don't change to nullable ones.

## Frontend / currency
- **Salary/economics amounts use `formatCurrency()`** (locale-aware, client-side) — correct; the
  AI returns numbers, the frontend formats them. Don't switch economics to raw model strings.
- Mobile clean at 375px (home + result cards; only grid is `grid-cols-1 sm:grid-cols-3` for the
  economics salary cards). Fully localized (`sgm_*`, 13 languages).
- `buildFullText` registers copy via `useRegisterActions`.

## Gotchas
- **Backend rate limit = 4 req/min.** `check:golden` runs the 3 cases sequentially and fits.
- **`/skill-gap-map` is slow (~90s)** by nature (comprehensive 11-gap analysis at 8000 tokens) —
  capture/verify with a long-timeout fetch, not a short `curl -m`.
- **Restart the backend after route edits** (started via `node`, not nodemon).
- Phase-1 lesson (recurring): test the MAX-SCHEMA endpoint (here `/skill-gap-map`) live — the
  truncation 500 was invisible to the gates and only surfaced when the map was actually exercised.
