# PlotTwist — architecture & lock notes (`plottwist-v2`)

Decision-clarity tool — runs a decision through pre-mortem / time-horizons / opportunity-cost /
reversibility / values-fit / comparison-matrix frameworks. **Frontend:** `src/tools/PlotTwist.js`.
**Backend:** `backend/routes/plot-twist.js` — parallel split: `plot-twist-options`
(`MODELS.SMART`, max_tokens 4000, owns `options_analysis` + `comparison_matrix`) +
`plot-twist-framing` (`MODELS.SMART`, max_tokens 2500, owns everything else), merged via
`{ ...optionsPart, ...framingPart }`. One 8-key schema in a single call measured ~67s — past
where Safari abandons the fetch — hence the split (see the 2026-08-08 parallel-split-pattern
memory note: partition the structure, not the index). **Golden:**
`audit/plot-twist-golden-sample.json` (2 cases, both from real verified live runs). Verify:
`npm run check:golden plot-twist`.

## V2 rewrite (2026-09-06) — from mind-reading to grounded analysis

The v1 tool ran a genuinely useful six-framework analysis, but repeatedly turned frameworks
into claims about the *decision-maker* rather than the *decision*: it asserted a "real question"
the visitor was secretly asking, diagnosed a "stuck pattern" as psychological fact, ran a "gut
check" that inferred what the visitor's gut "already knew" from word order and omission,
predicted future emotions at 10 months/10 years, generated bare 1-10 scores for
reversibility/values-fit/comparison-matrix dimensions with no defensible measurement basis, and
told visitors in the UI copy that it would automatically add "do nothing" as an option they
never supplied.

Full field rename (same six-framework core kept, reframed as evidence-bound):
- `the_real_question` → `underlying_question` — a generated reframing question, never asserted
  as the visitor's actual hidden question.
- `stuck_pattern.{pattern,explanation,unlock}` → `what_may_be_making_this_hard.{basis,summary,
  useful_reframe}` — `basis` is `USER_SELECTED | REASONABLE_TENSION | NOT_ENOUGH_TO_TELL`; a
  selected stuck-reason is used as self-reported context only, never diagnosed further.
- `gut_check` (inferred from word choice/emphasis/omission) **REMOVED**. Replaced with
  `what_your_description_points_to`, which may only restate tensions actually present in the
  visitor's own words.
- `ten_ten_ten` → `time_horizons` (same 3 sub-fields, still prose) — reframed from "how you'll
  feel" to "what may matter," no predicted emotions.
- `reversibility.score` / `values_alignment.score` (bare 1-10 ints, **DO NOT reintroduce**) →
  `reversibility.level` (`HIGHLY REVERSIBLE|PARTLY REVERSIBLE|HARD TO REVERSE|UNCLEAR`) /
  `values_fit.level` (`STRONG FIT|MIXED FIT|WEAK FIT|NOT ENOUGH TO TELL`).
- `hidden_upside` / `hidden_risk` → `upside_worth_considering` / `risk_worth_considering` (same
  slot; "hidden" implied the tool knows what's overlooked — it doesn't).
- `comparison_matrix.scores` (bare 1-10 ints per dimension, **DO NOT reintroduce**) →
  `comparison_matrix.options[].ratings` (`STRONG ADVANTAGE|SOME ADVANTAGE|MIXED|
  SOME DISADVANTAGE|STRONG DISADVANTAGE|UNKNOWN`).
- **Added** `unknowns_that_matter` (array, 1-4) and `current_read.{summary,
  what_currently_favors, what_prevents_a_clean_call}` — v1 had no recommendation section at
  all; v2 distinguishes "what the facts favor" from "what you should do," and must decline to
  favor either option when the facts don't support a lean (verified live — see golden case 2).
- `if_still_stuck.{coin_flip_test,two_year_letter}` → `{coin_flip_reaction,future_self}` —
  removed "notice which side you're hoping for while it's in the air, that's your answer";
  replaced with "your reaction is one data point, not a verdict."
- **Removed the auto-added "do nothing/stay/status quo" option.** The backend now analyzes only
  options actually supplied, or an implicit option **only** when the visitor's own phrasing
  already establishes it (e.g. "should I quit my job" is inherently binary — "stay" is not a
  manufactured filler there). Verified live both ways: a single-option decision phrased as a
  binary correctly surfaced "stay" as the visitor's own implied alternative (golden case 1); a
  two-explicit-option decision with no implicit third analyzed exactly those two (golden case 2).
- New `outputGuard.prohibit`/`require` (v1 had none — `router.outputStandard` is new here) codify
  the FINAL SELF-CHECK: no invented option, no predicted visitor/other-person reaction, no
  diagnosis beyond what was selected, no arbitrary numeric score, no possible-risk-as-certainty,
  no inferred relative value-weighting, no recommendation phrased as "you should" rather than
  "the facts favor."
- Frontend: `context` upgraded from single-line input to textarea (richer new placeholder copy);
  added `VALUE_OPTIONS` "Something else" (`ptw_val_other`) and `STUCK_OPTIONS` "I'm missing
  information" (`missing_info` / `ptw_stuck_missing`); History (`plot-twist-history`) now stores
  the full input snapshot per entry, not just a preview + pattern string, so **Revisit** can
  restore the form for editing — it must never auto-rerun or feed the old AI interpretation back
  in as a new fact (`handleRevisitHistory` only restores inputs; a fresh submit is required).
- Catalog (`src/data/tools.js`): description replaced; `guide.howToUse`/`guide.tips` no longer
  claim "we'll add 'do nothing' automatically" — that line was live and directly contradicted the
  new backend behavior.
- i18n: 23 new `ptw_*` keys + ~17 keys re-texted in place (same key id, new copy) across all 13
  languages — see `src/i18n/locales/tools/plot-twist.js`. Fixed on first `i18n-convention-audit`
  pass: es/pt/fr gender-hedged "🪄 Still Stuck?" title (`atascado/a`, `travado(a)`, `bloqué(e)`)
  recast to non-gendered phrasing; ja `ptw_gut_title` dropped the banned あなた pronoun.

## Bug found and fixed during live verification

**Comparison-matrix rating leaked a different field's enum.** First live run (German café case)
produced a matrix dimension literally named "Reversibility" with rating value `"PARTLY
REVERSIBLE"` — a value from `reversibility.level`'s vocabulary, not from the 6-value rating enum
(`STRONG ADVANTAGE|...|UNKNOWN`). Would have rendered as a raw, untranslated string in every
non-English locale (the frontend's `ratingLabel()` falls back to the raw value for anything
outside `RATING_KEY`). Fixed two ways: (1) an explicit prompt rule forbidding matrix ratings from
reusing the reversibility/values-fit vocabulary, and forbidding "reversibility"/"values fit" as
matrix *dimensions* at all (redundant with the dedicated per-option fields); (2) a server-side
safety net in the route handler that coerces any `comparison_matrix.options[].ratings` value
outside the 6-value enum to `UNKNOWN` before the response leaves the route. Re-verified clean on
the next live run (`invalid ratings: []`).

## DO NOT silently reverse
- Qualitative `reversibility.level` / `values_fit.level` / comparison-matrix `ratings` — never
  reintroduce bare numeric scores anywhere in this schema.
- The comparison-matrix rating safety-net coercion in the route handler.
- The no-auto-"do nothing" rule (implicit options allowed only when the visitor's own phrasing
  already establishes them).
- `current_read`'s favors-vs-unresolved distinction, including declining to favor either option
  when the facts don't support a lean.
- The removed `gut_check` (word-choice/omission inference) — do not resurrect it under
  `what_your_description_points_to`; that field may only restate what was actually supplied.
- History storing full input snapshots (needed for Revisit) rather than just a preview string.
