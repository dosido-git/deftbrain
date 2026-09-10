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

## MAIN correction pass (2026-09-10, same day, owner spec "SKILL GAP MAP — LATEST OUTPUT CORRECTIONS")

Third same-day pass, MAIN-route-specific. Tested against a UX Researcher scenario (marketing
coordinator → UX Researcher) and found the "not a model of a profession" principle from the v3
rewrite wasn't fully holding under a new target role: the tool still described capabilities as
settled facts about the profession, over-claimed what a single supplied skill established, presented
its suggested starting point as an objective priority, and blurred hypothetical practice exercises
with completed research.

**Prompt fixes (MAIN route only — not CORE_SYSTEM, matching this session's established practice of
keeping domain-specific corrections scoped to the route that needs them):**
- **No universal profession descriptions.** "UX researchers regularly present findings to product,
  design, and business stakeholders" states a fact about a profession never surveyed. Now: "commonly
  relevant," "may involve," "some roles" — everywhere, not just in one rule.
- **No upgrading one supplied skill into unestablished technical scope.** "Data analysis in Excel"
  does not establish "research-data analysis" — say what was supplied, note what it doesn't
  establish, describe the transfer as depending on the target role.
- **No inventing what past experience was FOR.** Don't describe the visitor's survey work as being
  "about marketing preferences" (or any other objective) unless they said so — don't invent
  stakeholder types, audiences, or frequency ("regularly present to... stakeholders") either.
- **`start_here` is a SUGGESTED starting point, not an objective priority**, unless a supplied job
  posting or a clear capability dependency justifies calling it the priority. The prompt now asks for
  the reasoning ("worth investigating first because it's adjacent to evidence you already have"), not
  an assertion that it's the most important gap.
- **No hypothetical-research-as-real.** `start_here.proof` and `next_move.primary` must cover BOTH
  cases in one honest sentence when it isn't established whether the visitor already did the
  underlying activity — "if you haven't run one yet, draft a plan; if you have, document what you did
  and learned" — never describing participants, observations, or findings as though they already
  happened.
- **No employer-confidential-access suggestions.** Practice-exercise alternatives must avoid anything
  requiring special permission or raising consent/privacy questions (recorded internal user sessions,
  confidential systems) — a self-contained exercise or something the visitor has legitimate access to
  only.
- **No effort/build-size labels.** `skill_gaps[].effort` (smaller/moderate/larger_build) is removed
  from the schema entirely — priority (start_here/important/useful/role_dependent) is the only
  prioritization signal now. The tool doesn't know the visitor's proficiency, the depth an employer
  wants, or available learning resources; a build-size label implied it did.
- **No specific commercial products/brands** (Dovetail, Lookback, UserTesting, Qualtrics, etc.)
  anywhere in the response, including inside unknowns — name the category instead.
- **No invented employer-type taxonomy** ("agency, startup, mid-size product company, enterprise") —
  one phrase acknowledging general variability replaces a manufactured four-category list.
- **Generic tool/software familiarity is a role expectation to VERIFY, not a skill gap to BUILD** —
  moved from `skill_gaps` to the secondary call's `role_expectations_to_check`, since specific tool
  requirements vary by employer.
- **"You," never "the visitor."** Every field in both calls now explicitly must address the person as
  "you" — this is an individual-facing tool, not a case-file description of a third party.

**SCHEMA CHANGES:**
- `starting_point.important_unknown` (string) → `starting_point.important_unknowns` (array, 1-3
  items, most consequential first). It now absorbs what the secondary call's `unknowns[]` used to
  hold. **The secondary `/skill-gap-map` call's response no longer has an `unknowns` key at all** —
  don't reintroduce it there; the frontend only reads `starting_point.important_unknowns` now.
- `skill_gaps[].effort` removed entirely (see above).
- `transferable_strengths[]` gained `confidence: "direct" | "partial"` — "direct" when supplied
  evidence squarely establishes the strength, "partial" when it's plausibly relevant but the input
  leaves specifics unestablished. Powers the new compact ✓/~ checklist UI.
- `outputGuard.prohibit` grew by 10 entries, one per bullet above (minus the schema-only changes).

**UI CHANGES (`src/tools/SkillGapMap.js`):**
- **"What Carries Over"** (renamed from "Transferable Skills (N)") is now a compact ✓/~ checklist,
  not five full-size green cards — a "Why these may transfer ▾" toggle (shared `expandedSections`
  state, key `_transferable`) reveals the evidence/transfer text per item on demand. The visitor
  already told us these things; they shouldn't cost a page of reading before the actual gap (item 22).
- **"One place to start"** (relabeled from "Start here") gained a "Why this one" eyebrow above the
  reasoning line, making explicit that this is a suggested starting point with stated reasoning, not
  an asserted priority.
- **The separate "Other Things We Can't Tell Yet" card is gone.** Its content is now
  `starting_point.important_unknowns`, rendered once, in the opening card — not restated as its own
  report section further down the page.
- **"Transition Tasks" only renders when `transition_tasks.length > 0`** — an always-visible "(0)"
  disclosure was proof there was nothing there, not progressive disclosure. Its Network/Outreach/
  Resume/Reframe action buttons moved into "More Ways to Prepare," which is now the one place they
  live regardless of whether the model returned any transition_tasks text — they stay reachable
  either way instead of disappearing when the section that used to house them is hidden.
- `EFFORT_LABELS` and its badge on skill_gaps cards removed (dead now that the field doesn't exist).

**Live-tested against:** the exact marketing-coordinator → UX Researcher scenario from the owner's
spec. Zero instances of "the visitor," zero named tool brands, zero employer-type taxonomy, zero
`effort` field, `important_unknowns` correctly populated as an array, `confidence: "partial"` on all
5 transferable strengths (correctly — none of the supplied single-line skills squarely established
their target-role application), `start_here` framed as "a reasonable place to start... because it
sits at the intersection of..." rather than an asserted priority, and `next_move.primary` explicitly
covering both the "have done it" and "haven't done it" cases in one sentence. `npm run check:golden
skill-gap-map` → 4/4 PASS on the re-recorded golden.

**DO NOT silently reverse:** the `effort` field removal, the `important_unknown` → `important_unknowns`
schema change (and the secondary call's `unknowns` key removal), the `confidence` field, the "start_here
is suggested, not objective" framing, the hedged-both-cases proof/next_move language, or the
Transition-Tasks-only-when-non-empty rendering.
