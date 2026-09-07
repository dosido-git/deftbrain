# PlotTwist — architecture & lock notes (`plottwist-v2`)

**Renamed to "Decision Prism" on 2026-09-06** (display name + full id/URL — id is now
`DecisionPrism`, canonical URL `/DecisionPrism`). Kept internally, deliberately: the i18n prefix
(`ptw_*`), localStorage keys (`plot-twist-history`, `plottwist-result`), the backend endpoint
(`/api/plot-twist`), this notes filename, and the golden-sample filename/slug
(`plot-twist-golden-sample.json`, `npm run check:golden plot-twist`) — renaming those buys
nothing and breaks saved visitor state. `/PlotTwist`, `/plottwist`, `/plot-twist` all 301 to
`/DecisionPrism` via `LEGACY_REDIRECTS` in `backend/server.js` (single hop — the old id was
removed from `TOOL_IDS`); `TOOL_ALIASES` in `src/components/ToolRenderer.js` covers the
in-app client-side case. Cross-reference links updated in `WrongAnswersOnly.js`, `Bookmark.js`,
`TimeWarp.js`, `HomeIntro.js`, `tool-og-slugs.json` (kept both `PlotTwist`/`DecisionPrism` keys
pointing at the same `plot-twist` OG slug), `og-slug-map.json`, and the Gate 5 allowlist path in
`localization-audit.js`. `ptw_title`/`ptw_tagline` updated to "Decision Prism"/"See a tough
decision from every angle" across all 13 languages — `ptw_title` stays an untranslated brand
name (matches every other tool name in this catalog), `ptw_tagline` is translated per language.

Decision-clarity tool — runs a decision through pre-mortem / time-horizons / opportunity-cost /
reversibility / values-fit / comparison-matrix frameworks. **Frontend:** `src/tools/DecisionPrism.js`.
**Backend:** `backend/routes/plot-twist.js` — parallel split: `plot-twist-options`
(`MODELS.SMART`, max_tokens 4000, owns `options_analysis` + `comparison_matrix`) +
`plot-twist-framing` (`MODELS.SMART`, max_tokens 2500, owns everything else), merged via
`{ ...optionsPart, ...framingPart }`. One 8-key schema in a single call measured ~67s — past
where Safari abandons the fetch — hence the split (see the 2026-08-08 parallel-split-pattern
memory note: partition the structure, not the index). **Golden:**
`audit/plot-twist-golden-sample.json` (3 cases, all from real verified live runs). Verify:
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

## Second correction pass (2026-09-06) — proximity, matrix-unknown, time-horizon, one_question

A live elder-care test (father can no longer live alone; move-in vs. care home; a brother
abroad offers money but not presence) surfaced 4 more overreach patterns, all now fixed and
re-verified live (golden case 3):

1. **Proximity → assumed personal responsibility.** The model had written "the load falls
   primarily on whoever is present — which, given your brother's location, means you." A
   sibling's absence doesn't establish that the visitor personally provides care — other
   household members, paid help, or other arrangements may exist unmentioned. Fixed with an
   explicit rule: don't convert proximity into personal responsibility unless the visitor
   established who would actually provide care. Now speaks in terms of "your household."
2. **Directional advantage on a flagged unknown.** The comparison matrix rated "brother's
   financial contribution providing real relief" as an advantage for one option and a
   disadvantage for the other, while `unknowns_that_matter` separately (and correctly) said the
   tool didn't know what the contribution would cover. Fixed: if a dimension turns on a fact
   flagged elsewhere as unknown, rate **both** sides UNKNOWN rather than picking a direction to
   avoid a blank cell.
3. **Time horizons narrating a future event.** 10-month/10-year content about caregiving load or
   relationship strain needs the same conditional discipline as predicted emotions already had —
   "questions that may matter by then," never "the caregiving demands will be heavier."
4. **`one_question` presupposing an option.** A question like "if your father moved in and your
   household found itself struggling..." starts inside one option and presumes it went badly.
   Fixed: prefer a question that distinguishes between the options or resolves the single most
   decision-changing unknown, without presuming a choice was made or went badly.

`FINAL SELF-CHECK` extended to 16 items and `outputGuard.prohibit` gained 4 matching entries.

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
- Proximity/absence never converted into assumed personal caregiving responsibility.
- A comparison-matrix dimension flagged elsewhere as unknown stays UNKNOWN on both sides, never
  a directional advantage.
- Time-horizon content (caregiving load, relationship strain, any topic) stays conditional
  ("questions that may matter"), never a narrated future event.
- `one_question` stays option-neutral by default — no presuming a choice was made or went badly.
