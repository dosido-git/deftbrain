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
`audit/pre-mortem-golden-sample.json` (3 cases, all real verified live runs). Verify:
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

## Second correction pass (2026-09-07) — general LLM discipline, 9 more overreach patterns

A live org-merge test (two support teams merging; one manager not selected to lead) surfaced 9
more overreach patterns beyond the initial rewrite, all fixed and re-verified live (golden case 3):

1. **Fictional-event leakage.** The memo may invent "the non-promoted manager later resigned" —
   but nothing outside the memo (`warning_signs.why_it_matters`, `assumption_to_test_first`,
   `when_to_reconsider`, `failure_modes`, `assumptions_autopsy`, `first_move`) may treat that
   invented event as settled fact. Fixed with an explicit containment rule + worked example.
2. **Predicted personal behavior/internal state.** Banned "they withdraw," "they disengage,"
   "they become resentful" as asserted fact — replaced with observable possibilities ("reduces
   participation," "raises concerns directly," "indicates intent to leave").
3. **Unverified organizational effects stated as fact** (not just personal-plan psychology) —
   "newer customers may be more sensitive" not "new customers have less goodwill and will notice
   first."
4. **Invented exact timelines** (week/day counts, observation windows) — extended the existing
   "DO NOT INVENT THRESHOLDS" rule to timing generally; prefer "early in the transition," "as
   launch approaches" over "by week four."
5. **More than one PRIMARY WATCH.** Added both a prompt rule (exactly one) AND a **code-side
   safety net** in the route handler: if the model returns zero or multiple PRIMARY WATCH
   entries, deterministically demotes extras or promotes `primary_failure_path`'s named mode (or
   the first mode) to PRIMARY WATCH. Same defense-in-depth pattern as the Decision Prism
   matrix-rating coercion — see [[deftbrain-plottwist-architecture]].
6. **Mandatory-sounding mitigation from a hypothetical condition.** "Pause the launch and run a
   parallel queue" → "Consider delaying full cutover or using a staged transition" when the
   triggering condition is still hypothetical; stronger direction reserved for conditions the
   supplied facts already confirm.
7. **Inferred hidden management/organizational motives** (budget cuts, secret reorgs, leadership
   deception) never supplied by the visitor — UNKNOWN MOTIVE stays UNKNOWN.
8. **`first_move` overclaiming exclusivity.** No more "the only action that matters" — reframed
   as the highest-value step, not the only valid one.
9. **Failure-mode distinctness + observation-before-interpretation.** Added a merge-test
   ("would fixing this one also fix the other?") for failure modes, and required warning signs
   to state the observable event before the interpretation, never collapsing morale/trust/
   resentment-style inferred states into something "observed."

`FINAL SELF-CHECK` extended to 20 items, `outputGuard.prohibit` gained 8 matching entries.

## DO NOT silently reverse
- `failure_modes[].priority` stays qualitative (`PRIMARY WATCH|IMPORTANT WATCH|SECONDARY
  WATCH`) — never reintroduce a probability enum or numeric likelihood.
- Exactly one `PRIMARY WATCH` — both the prompt rule and the code-side safety net that corrects
  zero or multiple PRIMARY WATCH entries after parsing.
- `warning_signs` never claims the visitor WILL ignore something, never invents a dismissal
  rationale the visitor didn't supply, and states the observable event before the interpretation
  (never an inferred internal state like morale/trust/resentment presented as observed).
- Dependency phrasing: "the plan depends on X," never "you assume X," for anything inferred
  rather than explicitly stated (`assumption_to_test_first`, `assumptions_autopsy`).
- `when_to_reconsider` never claims a specific point where failure becomes inevitable, and never
  invents an exact timeline (week/day count) for the trigger condition.
- No predicted personal behavior/internal state for a specific person, and no inferred hidden
  organizational/management motive the visitor didn't supply.
- An invented fictional-memo event never reappears elsewhere in the output as settled fact.
- Mitigations for a still-hypothetical condition read as options ("consider"), not commands.
- The parallel-split real-world-boundary architecture — the prevention half must never see the
  memo half's invented narrative.
- False precision (exact counts, dates, rates, named entities) stays prohibited everywhere
  EXCEPT numbers the visitor actually supplied and valid arithmetic performed on them.
- History storing full input snapshots (needed for Revisit) rather than just a preview string.
