# Quality Audit — 2026-08-29 (cohort 2: life-admin + priority safety loop)

Scheduled wave. Cohort rotation: cohort 1 (document) was covered 2026-07-19 and again
2026-07-23 (multi-language); this wave advances to **cohort 2 — life-admin**
(brain-dump-buddy, subscription-tamer, skill-gap-map, brag-sheet-builder,
crisis-prioritizer, bill-rescue) plus the standing priority loop (grief-guide,
drive-home, safe-walk, lease-trap-detector — bill-rescue is in both).

English only, one realistic run each, planted checkable details, quoted dialogue in
three inputs as the NO_QUOTE_RULE probe. 10/10 endpoints returned HTTP 200 in
13–81s — **no truncation and no latency finding anywhere this wave**, and every
quote probe parsed clean. Last wave's predictor (`grep -c "double-quote"`) is 1+ on
all ten routes; that whole failure class is closed for this cohort.

**Run cut short:** the Anthropic API credit balance hit zero during the German
truncation probe (`400 invalid_request_error: Your credit balance is too low`).
The de-DE spot check on brag-sheet-builder did not run, and **no golden could be
re-run after the fixes below** — see Fixed / Deferred.

## Verdicts

| Tool | Verdict | Time | Headline |
|---|---|---|---|
| safe-walk | **SIGNIFICANT — REGRESSION** | 71s | invented park borders + invented transit outage; battery concern now in 5 fields (was 4) |
| subscription-tamer | **SIGNIFICANT** | 81s | three wrong money numbers; breakdown doesn't sum to the total; `"infinity"` renders as `$0` |
| brag-sheet-builder | **SIGNIFICANT** | 75s | fabricated a metric that inverts the user's own reported failure count, into 5 deliverables |
| skill-gap-map | **SIGNIFICANT** | 52s | parallel split returns 3 duplicate skill pairs (12 gaps, 9 distinct) |
| brain-dump-buddy | MINOR | 49s | prose summary says 13 not-actionable, pinned tile says 7 |
| crisis-prioritizer | MINOR | 38s | string `"null"` renders as "Deadline: null"; guard repair can't demote its own item |
| bill-rescue | MINOR — no regression | 78s | May 2025 vs May 2027 for the same date of service; `canAffordMonthly` is a dead param |
| drive-home | MINOR — no regression | 13s | `factors_in_favor` broke the rule its own prompt states verbatim |
| lease-trap-detector | **GOOD** — no regression | 49s | 14/14 planted traps, AB 12 applied correctly incl. the small-landlord exception |
| grief-guide | **GOOD** — no regression | 39s | acute-risk path correct, 988 correct, all resources real |

Priority loop regression status: **safe-walk REGRESSED**; bill-rescue, drive-home,
grief-guide, lease-trap-detector all hold their 2026-07-23 verdicts.

## Confirmed defects

**safe-walk** (worst of the wave — a safety tool giving fabricated route advice)
1. Hallucinated named geography, driving the instructions: *"Clark Park, bordered by
   43rd and 45th Streets between Baltimore and Woodland Avenues"* (it is Baltimore /
   43rd / **Chester** / 45th). The invented border then produces two directives —
   *"stay on the lit commercial side, not the Woodland Ave side"*. Also routes the
   user *"Walnut Street from 40th toward 43rd, then turn onto Baltimore Ave"*;
   Walnut and Baltimore do not intersect. The DIRECTIONS rule (`safe-walk.js:29`)
   was extended on 2026-07-23 to ban unverified stop counts and park-border streets —
   it did not hold.
2. Hallucinated transit precision that removes the user's safest option, escalating
   across three fields: `local_context` → `watch_for` → *"The T2 is almost certainly
   NOT running along Baltimore Ave right now"*. SEPTA's overnight closure diverts
   trolleys to the surface at 40th & Market; it does not stop the Baltimore Ave
   surface route. A lone woman at 1:15am with a 12% phone was talked out of the ride
   her roommate recommended, on a schedule the model invented.
3. The two-field cap (`safe-walk.js:98`) is now broken in 5 fields (was 4).
4. `safe-walk.js:107` never calls `withLocaleContext` — the only priority-loop route
   still missing localization layer 2.

**subscription-tamer** (no CONSISTENCY RULES block exists in this route at all)
- `cost_per_use: "infinity"` → `Number(x) || 0` (`src/tools/SubscriptionTamer.js:83`)
  renders **"Cost per use $0"** on the two worst subscriptions — the inverse of the
  finding. Schema exemplar is a bare `"4.12"` with no format rule (`:102`).
- Savings equivalents wrong: *"saves roughly $1,442 a year"* (true $1,755);
  *"over $980 a year"* (true $736).
- `breakdown` sums to $171.24 against a $241.25 true total, and the donut normalises
  to that wrong base (`SubscriptionTamer.js:347-352`), so every slice % is wrong.
  `wasted_monthly` 100.29 vs $156.28 of cancel verdicts.
- Stale price stated as fact: Netflix Standard *"$15.49/month"*.

**brag-sheet-builder**
- User wrote *"only 2 of them had checkout downtime over 5 minutes"*; output claims
  *"99.4% on-time, zero-extended-downtime completion rate"* — a dimension never
  measured, asserting the opposite of the reported near-miss, propagated into five
  copy-paste deliverables under three labels. `what_changed` states the move plainly:
  *"converted the downtime stat into a completion rate that reads as a success
  metric rather than a near-miss."* TRUTHFULNESS RULES (`:160`) covers agency
  inflation, not invented metrics.
- Onboarding value `[$2,000–$3,200]` priced one hire and labelled it four
  (2 wks × 4 hires × $25–40/h = $8,000–$12,800).
- The agency rule itself held perfectly on the trap item ("contributing to", not "drove").

**skill-gap-map** — the category-enum partition (`:51-87`, merge `:164`) is not a
semantic partition: 12 gaps contained 3 same-skill pairs, each billed separate hours
(GCP cert vs GCP regulations, both the same CITI course; two oncology-protocol
literacy entries; two CRF/query/DMP entries). Nothing de-duplicates on merge.

**brain-dump-buddy** — `counts` is code-pinned (`:177-184`) but the prose summary
beside it is not: *"13 do not need action right now"* over a tile reading 7.

**crisis-prioritizer** — string `"null"` in `deadline`/`who_waiting`, from exemplars
written inside quoted strings (`:49-50, 58`); truthy, so the card prints
"Deadline: null". Also: the v2 guard repaired a `why_now` into *"Check what it
requires before ranking it"* — an item in do_first whose stated reason is that it
can't be ranked. `enforceSingleBucket` (`:145-171`) only demotes tasks already in
`need_one_fact`, so a repair can rewrite the sentence but never move the item.

**bill-rescue** — same date of service reported as *"this debt from May 2025"* in one
field and *"around May 2027"* in another, with the credit-safety claim resting on it.
`canAffordMonthly` is read at `:156` and shapes both the payment plan and the
hardship letter, but nothing in `src/` sends it. `keysB` (`:226-230`) omits
`know_your_rights` while the same prompt's schema (`:331`) requires it.

**drive-home** — `factors_in_favor: ["You are weighing the decision carefully before
starting"]` is the exact example the prompt bans at `drive-home.js:546`.

**lease-trap-detector** — `major_concerns_count: 5` above 4 red-flag cards.

**grief-guide** — `support_resources` offered The Compassionate Friends (child loss)
to a partner-loss user.

## Fixed this wave

Only the two defects that are provable by inspection, because **no golden could be
re-run** (credits exhausted) and prompt edits are precisely the class that caused the
2026-07-23 outages:

- `lease-trap-detector.js` — `major_concerns_count` now code-computed from
  `red_flags.length` after the four-group merge.
- `crisis-prioritizer.js` — `nullifyNullStrings()` in the shared `ask()` coerces the
  string `"null"` to real `null` across every endpoint (unit-tested; real values and
  words containing "null" are untouched).

Gates 1–6 pass on both. **Goldens not run — API credits.**

## Deferred to the next wave (needs credits: prompt edits + golden re-run)

Ranked, one change per tool:

1. **safe-walk** — ban unverified *named* geography and transit state outright: a
   park's bounding streets, a street-to-street turn, and "route X is/isn't running
   now" must be phrased as check-before-you-rely-on-it, never asserted. Enforce the
   two-field cap by deduping concerns in code. Add `withLocaleContext`.
2. **subscription-tamer** — add a CONSISTENCY RULES block (breakdown sums to the
   supplied total; `wasted_monthly` = Σ cancel-verdict costs; every equivalent
   recomputed) and make `cost_per_use` format-strict (bare decimal or `null`).
3. **brag-sheet-builder** — extend TRUTHFULNESS RULES from agency to metrics: never
   invent a dimension the user did not measure; never restate a reported failure
   count as its complement.
4. **skill-gap-map** — de-duplicate same-skill entries on merge.
5. **brain-dump-buddy** — pin the summary to the pinned counts (prompt-side: the
   sentence is model-written in 13 languages, so it cannot be assembled in code).
6. **bill-rescue** — wire `canAffordMonthly` into the frontend or delete the branch;
   add `know_your_rights` to `keysB`.
7. **drive-home** — strip `factors_in_favor` items that describe the driver's
   reasoning rather than the drive.
8. **grief-guide** — constrain `support_resources` to the loss type.

## Judgment calls for you

- **brain-dump-buddy**: one input line ("sister / Medicare") produced four near-
  duplicate entries across `decisions`, `tell_someone`, `worries`,
  `not_your_problem`, with one field cross-referencing another. Thorough or padding?
- **skill-gap-map** cites **ICH E6(R2)** as current throughout; E6(R3) has been the
  adopted revision since 2025. Same legal/standards-grounding bucket as the open
  plain-talk decision.
- **drive-home** named "the Montana Department of Transportation" from a place name —
  correct, but inferred. Is naming a real agency from an inferred jurisdiction
  within the grounding rules?
- **crisis-prioritizer** invented `who_waiting: "health inspector"` from "reply to
  their email" — arguably entailed.
- **bill-rescue** `total_potential_savings` "$2,385" vs $3,370 of flagged charges,
  hedged with "minimum" — acceptable hedge or a consistency-rule violation?

## New for the kit checklist

- **Guard repair without a move.** An output guard that can rewrite a field but not
  relocate the item can turn a grounding failure into a self-contradiction — the
  repaired sentence says the item can't be ranked while it sits in the ranked bucket.
  Where a guard's fix is "this belongs elsewhere", the code must be able to move it.
- **String `"null"`.** Nullable exemplars written *inside* quoted schema strings
  ("supplied deadline or null") invite the literal string; every `x && ...` render
  then prints it. Coerce on the way out.
- **The correct parts sell the wrong ones.** safe-walk got T2 = ex-Route 34 and Clark
  Park ≈ 9 acres right, which is exactly what makes the invented park border and
  invented service change credible to a user standing on that corner at 1am.
- **A model-computed count next to the list it counts** is a recurring defect class
  (lease-trap, brain-dump-buddy, bill-rescue this wave). Pin to `array.length`
  wherever the number is a number; pin it in the prompt where the number lives
  inside localized prose.
