# SkillGapMap — architecture & lock notes

**Known-good:** tag `skillgapmap-v1` · golden `audit/skill-gap-map-golden-sample.json`
**Verify:** `npm run check:golden skill-gap-map` (backend up: `npm run dev:backend`)

## What it is
A 23-feature career-transition engine (gap analysis, learning timeline, proof projects, resume
audit, mock interviews, salary economics, company targeting, mentor matching, etc.). Frontend
`src/tools/SkillGapMap.js` (~1560 lines). Backend `backend/routes/skill-gap-map.js` (~1540 lines)
— **23 endpoints** under `/api/skill-gap-*`, all `claude-sonnet-4-6`, all `callClaudeWithRetry` +
`withLanguage` + `withLocaleContext`.

**STALE NOTICE (2026-09-10):** this file describes the pre-v3, 23-endpoint architecture and its
own historical max_tokens fights (v1). The primary flow (MAIN/EXPLORE/TIMELINE) was fully rewritten
in the v3 pass — schema, prompts, and the `max_tokens` figures below no longer match the current
code. See `deftbrain-skillgapmap-v3-architecture.md` in project memory for the current record, and
the "v3 EXPLORE correction" section appended at the end of this file for the latest pass. The
sections below are kept for the 19 untouched secondary routes, where they may still be accurate.

## DO NOT silently reverse (the locked fixes — v1/v2, see stale notice above)
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
   **UPDATE 2026-09-10:** the v3 rewrite replaced this whole schema and reset MAIN's primary call to
   3000 tokens, reintroducing the identical truncation-500 (reported live by the owner, "twice in a
   row"). Fixed again by raising to 5000 (secondary 2000->2500) — see the v3 architecture memory.
   The lesson above held; the number just wasn't carried forward through the rewrite.
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

## v3 EXPLORE correction (2026-09-10, owner spec "HELP ME EXPLORE — FINAL CORRECTIONS")

Applied on top of the v3 rewrite (see `deftbrain-skillgapmap-v3-architecture.md` for that). Explore
generates plausible directions for a visitor with no target yet — it deliberately does NOT run a
full skill-gap analysis or rank/score anything; the visitor picks one and "Map This" hands it to the
real MAIN route. This pass tightened that separation:

- **Field renames** in `directions[]`: `why_it_may_connect`→`why_it_connects`,
  `what_to_learn_more_about`→`worth_learning_more_about`,
  `one_low_cost_way_to_investigate`→`one_way_to_investigate`. `what_the_work_involves` unchanged.
  Matches the frontend's new labeled four-part card (WHY IT CONNECTS / WHAT THE WORK MAY INVOLVE /
  WORTH LEARNING MORE ABOUT / ONE WAY TO INVESTIGATE).
- **Default count is exactly 4, not a 4-6 range** — a range let the model pad to 6 and produce two
  near-duplicate variants of the same underlying role (e.g. two Product Manager flavors) eating two
  of the four most valuable slots. The prompt now explicitly bars near-duplicate variants in the
  same batch.
- **"Show 2 More Directions"** — new `count`/`excludeDirections` request params; the frontend
  appends the result to the existing list rather than replacing it (`handleExplore({ more: true })`
  in `SkillGapMap.js`). Not a full re-search.
- **"Tell Me What You're Looking For"** — new `refinementNote` param, a free-text steering
  constraint applied to every direction in the next (replacing) generation.
- **Epistemic corrections**: no natural-fit/compatibility claims, no "genuinely" before a
  personal-fit question (rephrased as "would you want/enjoy X" — a question for the visitor, not a
  tool-detected preference), no unverified entry-path/common-transition/hiring-demand claims, no
  named companies unless the visitor supplied them, no elevating a general role description into a
  universal requirement ("core part of how this work gets done"). `OUTPUT_GUARD.prohibit` (shared
  file-wide) grew by 6 entries for these.
- **No ranking, ever** — the prompt states the return order carries no meaning; the frontend never
  shows a rank number, "best match," or percentage on a direction.
- Added the tool's first `/skill-gap-explore` golden case (none existed before this pass) — see
  `explore-swe-to-adjacent-directions` in `audit/skill-gap-map-golden-sample.json`.

**DO NOT silently reverse:** the field renames above, the count-4 default, the near-duplicate-variant
ban, or the null-safe additive behavior of "Show 2 More."
