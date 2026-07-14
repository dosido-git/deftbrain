# PlotHole — architecture & lock notes (`plothole-v1`)

Finds plot holes in a story (analyze) + steel-mans a defense for one (defend). **Frontend:**
`src/tools/PlotHole.js`. **Backend:** `backend/routes/plot-hole.js` (2 endpoints, `MODELS.FAST`).
**Golden:** `audit/plot-hole-golden-sample.json` (2 DE cases). Verify: `npm run check:golden plot-hole`.

## Audit fixes locked here (2026-07-14)
Both guards correct (`!parsed.holes` array / `!parsed.hole_summary`); no endpoint was down.
1. **🐛 `swiss_cheese_rating` format-strict.** Rendered raw by the frontend as `NN/10`; the schema
   had `"1-10 (number)"` (the `(number)`/range could echo as literal text). **Fix:** bare integer `7`
   PLUS an explicit rule — a bare `7` example ALONE made the model rename the key to
   `overall_swiss_cheese_rating` (rating then never rendered), so the rule pins the exact key +
   integer range. Verified DE: `swiss_cheese_rating=6`.
2. **⚠️ `/defend` truncation.** `max_tokens 2000` with 3-5 multi-field `defense_arguments` → German
   could truncate. **Fix:** 3000. Verified DE: 5 arguments, ACQUITTED.
3. **⚠️→cleaned:** 17 annotation leaks + a global brevity line in PERSONALITY + the
   no-inner-double-quote rule; PF-2 `c.label` alias reordered.

## DO NOT silently reverse
- `swiss_cheese_rating` bare integer + the exact-key-name rule; `/defend` `max_tokens 3000`;
  no annotation suffixes; the no-inner-double-quote rule.
