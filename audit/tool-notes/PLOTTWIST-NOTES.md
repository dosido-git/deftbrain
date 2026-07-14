# PlotTwist — architecture & lock notes (`plottwist-v1`)

Decision-clarity coach — runs a decision through pre-mortem / 10-10-10 / opportunity-cost /
reversibility / values / real-question / stuck-pattern frameworks. **Frontend:** `src/tools/PlotTwist.js`.
**Backend:** `backend/routes/plot-twist.js` (1 endpoint, `MODELS.SMART`, **max_tokens 5500**).
**Golden:** `audit/plot-twist-golden-sample.json`. Verify: `npm run check:golden plot-twist`.

## Audit fixes locked here (2026-07-14)
Guard `!decision_summary || !stuck_pattern` correct; sync clean; no endpoint down.
1. **🐛 misleading `(number)` on PROSE fields.** `ten_ten_ten.{ten_minutes,ten_months,ten_years}` and
   `opportunity_cost` are feeling/cost DESCRIPTIONS rendered raw in tight cards, but the schema tagged
   them `(number)` — a trailing "(number)" is highly visible and semantically wrong. **Fix:** stripped.
   Verified DE: ten_minutes = prose. (The genuine numeric fields — reversibility.score,
   values_alignment.score, comparison_matrix.scores — stay bare integers.)
2. **⚠️ truncation.** `options_analysis` (heavy: pre_mortem + 3×ten + opportunity + 2 assessments +
   upside + risk) × up to 5 options + comparison_matrix at `max_tokens 4000` → 5-option German runs
   truncated. **Fix:** `max_tokens 5500` + options AT MOST 4. Verified DE (4 options): ~2412 tok.
3. **⚠️→cleaned:** 21 annotation leaks + brevity + no-inner-double-quote rule; PF-2 alias reordered.

## DO NOT silently reverse
- Prose `ten_ten_ten`/`opportunity_cost` (no `(number)`); bare-integer scores; `max_tokens 5500` +
  options ≤4; no annotation suffixes; the no-inner-double-quote rule.
