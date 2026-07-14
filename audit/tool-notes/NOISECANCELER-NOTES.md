# NoiseCanceler ("What Actually Affects Me?") — lock notes (`noisecanceler-v1`)

Personal relevance filter — pastes a dense bureaucratic document + your situation, extracts only what
affects you (actions, costs, savings, buried items, questions). **Frontend:** `src/tools/NoiseCanceler.js`.
**Backend:** `backend/routes/noise-canceler.js` (1 endpoint, `MODELS.SMART`, **max_tokens 3500**).
**Golden:** `audit/noise-canceler-golden-sample.json` (1 dense DE lease case). Verify: `npm run check:golden noise-canceler`.

## Audit fixes locked here (2026-07-14)
1. **🐛 `effort` enum degradation.** Schema was `"quick (< 5 min) | moderate (30 min) | involved (1+
   hour)"`; the frontend does strict `e === 'quick'` / `=== 'moderate'` for the effort badge → the
   parentheticals meant every effort fell through to the "involved" label. **Fix:** bare
   `"quick | moderate | involved"`. Verified DE: quick/moderate emitted clean.
2. **🐛 Truncation on the tool's own target inputs.** 7 uncapped arrays at `max_tokens 2000` — a
   dense German lease/EOB (exactly what this tool is for) truncated → parse fail → 500. **Fix:** cap
   all 7 arrays (action ≤5, costs ≤5, saves ≤4, affects ≤4, buried ≤4, consult ≤3, questions ≤5) +
   `max_tokens 3500`. Verified DE dense lease: ~1372 tok, 4/3/3/3 items.
3. **⚠️ amount fields.** Rendered raw; carried a `(number)` annotation. **Fix:** stripped + "short
   values in the user's local currency". Verified DE: "+85 EUR/Monat" etc.
4. **⚠️→cleaned:** 23 annotation leaks (`— one sentence` ×20, `(number)` ×2, `— 3-6 words`); cleaned
   the `confidence` enum; added the no-inner-double-quote rule (quoted document phrases in German).

## DO NOT silently reverse
- Clean pipe enums (`effort`/`confidence`/`priority`); the 7 array caps + `max_tokens 3500`;
  local-currency amounts; the no-inner-double-quote rule; no annotation suffixes.
