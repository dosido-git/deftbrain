# PreMortem — architecture & lock notes (`premortem-v2`)

Writes a fictional post-mortem as if a plan already failed, then uses that thinking device to
surface plausible failure modes, observable warning signs, an assumption worth testing first,
and one concrete first move. **Frontend:** `src/tools/PreMortem.js`. **Backend:**
`backend/routes/pre-mortem.js` — parallel split: `pre-mortem-memo` (`MODELS.SMART`, max_tokens
2500, owns `the_postmortem` + `warning_signs`) + `pre-mortem-prevention` (`MODELS.SMART`,
max_tokens 3000, owns everything else), merged via `{ ...memoHalf, ...preventionHalf }`. One
combined schema measured ~100s — the slowest route in the catalog, far past the ~60s Safari
fetch-abandon ceiling — hence the split (see the 2026-08-08 parallel-split-pattern memory note).
This split is also load-bearing for a second reason: the prevention half never sees the memo
half's invented fictional narrative, so an invented competitor or date from the story cannot
leak into an actionable step — structural enforcement, not just an instruction. **Golden:**
`audit/pre-mortem-golden-sample.json` (2 cases, both real verified live runs). Verify:
`npm run check:golden pre-mortem`.

## V2 rewrite (2026-09-07) — from fabricated evidence to disciplined fiction

The v1 tool used the fictional-post-mortem conceit as license to invent an entire future
history and treat it as fact: the v1 golden sample invented 310 subscribers, 11 conversions,
€144 revenue, 3.5% conversion, a March campaign, specific churn percentages, and named
competitors — then built warning signs, `probability` labels (`high`/`medium`/`low`), and
numeric thresholds on top of those inventions, none of which the visitor ever supplied.

Full field rename (same structure, disciplined):
- `warning_signs_ignored[].{when,sign,why_it_was_dismissed}` → `warning_signs[].{stage:
  EARLY|MIDDLE|LATER, watch_for, why_it_matters}` — never claims the visitor WILL ignore
  anything; no invented dismissal rationale unless the visitor supplied one.
- `the_fatal_assumption` → `assumption_to_test_first.{dependency, why_it_matters,
  what_is_known}` — phrased "the plan depends on X," never "you assume X," when the dependency
  was inferred rather than stated. Dropped "fatal" (falsely implies the assumption definitely
  exists, will be false, and will kill the plan).
- `point_of_no_return` → `when_to_reconsider.{condition, response}` — most plans have no single
  knowable moment failure becomes inevitable; now an observable condition that should trigger
  reassessment, redesign, a pause, or stopping further commitment.
- `failure_modes[].probability` (`'high'|'medium'|'low'`, **DO NOT reintroduce** — the model
  cannot know statistical likelihood) → `failure_modes[].priority` (`PRIMARY WATCH|IMPORTANT
  WATCH|SECONDARY WATCH` — priority for attention, never probability).
  `{description,trigger,early_warning}` → `{why_this_could_happen,watch_for,reduce_the_risk}`.
- `the_most_likely` → `primary_failure_path.{failure_mode,one_prevention}` — `failure_mode`
  must name one of the listed `failure_modes` identically (unchanged rule from v1).
- `assumptions_autopsy[].{assumption,how_to_verify,risk_if_wrong}` →
  `assumptions_autopsy[].{dependency,what_we_know,how_to_test,if_wrong}` — same "the plan
  depends on X" phrasing discipline as `assumption_to_test_first`.
- `the_one_thing` → `first_move.{action,why_this_first}` — never claims one action "actually
  determines the outcome"; chosen for information/risk-reduction value, not motivational appeal.
- New `outputGuard.prohibit`/`require` (v1 had none — `router.outputStandard` is new here) codify
  the FINAL SELF-CHECK: no exact invented metric/date/entity, no claimed visitor dismissal, no
  invented rationalization, no inferred-dependency-as-personal-assumption, no probability
  claimed as statistical fact, no claimed point of inevitable failure, no invented market/
  industry facts, no arbitrary numeric threshold, no test "definitively" validating the plan,
  no personal-plan diagnosis (resentment/burnout/etc.) as a future fact.
- Frontend: `warning_signs`/`failure_modes` render the new stage/priority enums via localized
  label maps (`STAGE_KEY`, `PRIORITY_KEY`) — backend enum values stay pinned English literals.
  History (`premortem-history`) now stores the full input snapshot per entry (plan, planType,
  stakes, assumptions) plus the result, with **View**/**Revisit** buttons — v1 had neither;
  Revisit only restores inputs for editing, never auto-reruns or feeds the old analysis back in
  as fact.
- Catalog (`src/data/tools.js`): description/tagline replaced with the supplied text (no more
  "most likely failure modes with probability ratings," "fatal assumption," warning signs "you
  will ignore," or "the one thing that actually determines the outcome" — all stronger claims
  than the tool can establish); `guide.howToUse`/`guide.example`/`guide.tips` updated to match
  new field names and the disciplined-fiction framing.
- i18n: 7 new `pm_*` keys + ~20 keys re-texted in place (same key id, new copy) across all 13
  languages — see `src/i18n/locales/tools/pre-mortem.js`. `pm_prob_high/medium/low` repurposed
  from RISK labels to WATCH-priority labels (same 3 keys, new meaning, avoids key churn since the
  old meaning was being removed anyway); `pm_trigger`/`pm_early_warning` similarly repurposed to
  "why this could happen"/"watch for" labels reused across both `warning_signs` and
  `failure_modes`.

## Verified live: the central fix holds, and user-supplied numbers still work correctly

Case 1 (EN, a custom plan with **no** numeric assumptions supplied at all — the exact condition
under which v1 invented 310 subscribers out of nothing): the v2 output stays fully qualitative
end to end — "growth stayed modest," never "X subscribers by month N." Zero invented exact
metrics, dates, or named entities anywhere in the response.

Case 2 (DE, catalog's own `pm_ex_plan`/`pm_ex_assumptions` example, which explicitly supplies
"1,000 paid subscribers" and "~3-5% conversion" as visitor assumptions): the output correctly
performs arithmetic ON those supplied numbers — deriving a required free-list size of
20,000-33,000 — rather than inventing its own conversion rate or subscriber count. This is the
USER-SUPPLIED NUMBERS rule working as intended, not a regression of the false-precision fix; do
not mistake a visitor-supplied-number derivation for invented precision when eyeballing future
runs.

## DO NOT silently reverse
- `failure_modes[].priority` stays qualitative (`PRIMARY WATCH|IMPORTANT WATCH|SECONDARY
  WATCH`) — never reintroduce a probability enum or numeric likelihood.
- `warning_signs` never claims the visitor WILL ignore something, and never invents a dismissal
  rationale the visitor didn't supply.
- Dependency phrasing: "the plan depends on X," never "you assume X," for anything inferred
  rather than explicitly stated (`assumption_to_test_first`, `assumptions_autopsy`).
- `when_to_reconsider` never claims a specific point where failure becomes inevitable.
- The parallel-split real-world-boundary architecture — the prevention half must never see the
  memo half's invented narrative.
- False precision (exact counts, dates, rates, named entities) stays prohibited everywhere
  EXCEPT numbers the visitor actually supplied and valid arithmetic performed on them.
- History storing full input snapshots (needed for Revisit) rather than just a preview string.
