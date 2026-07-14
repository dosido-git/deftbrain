# RulebookBreaker — architecture & lock notes (`rulebookbreaker-v1`)

Finds legitimate escalation paths, loopholes, and pressure points to win against a bureaucratic
system. **Frontend:** `src/tools/RulebookBreaker.js`. **Backend:** `backend/routes/rulebook-breaker.js`
(1 endpoint, `MODELS.SMART`, **max_tokens 6000**). **Golden:** `audit/rulebook-breaker-golden-sample.json`.
Verify: `npm run check:golden rulebook-breaker`.

## Audit fixes locked here (2026-07-14)
Guard `!Array.isArray(the_ladder)` correct; no endpoint down.
1. **🐛 Truncation — needed TWO passes.** The schema is very wide (7 sections, 5 arrays of full-sentence
   fields). It truncated at 2800 (original), then **still truncated at 4800** in German. The fix was
   to BOUND the schema hard — ladder ≤4 (2 magic_words each), loopholes ≤2, magic_phrases ≤3, nuclear
   ≤2, **one short sentence (~25 words) per field** — plus `max_tokens 6000`. The tight caps also cut a
   150s+ latency down to ~47s (bound the schema, don't just raise tokens). Verified DE: ~1650 tok, 200.
2. **🐛 i18n `win_likelihood` enum.** The frontend switches icon/color/label on `high|medium|low|
   very_low`; `withLanguage` would localize it → wrong badge. **Fix:** pinned English in the prompt.
3. **🐛 German quotes.** `magic_words`/`magic_phrases` are quoted scripts → unescaped quotes in German →
   500. **Fix:** the no-inner-double-quote rule.
4. **⚠️→cleaned:** 24 annotation leaks (incl a wrong `(number)` on the prose `their_pressure_points`)
   + a global brevity line in PERSONALITY.

## DO NOT silently reverse
- `win_likelihood` English pin; the hard array caps + per-field word limit + `max_tokens 6000` (do NOT
  loosen — they fix both truncation and latency); the no-inner-double-quote rule; no annotation suffixes.
