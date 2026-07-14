# MiseEnPlace — architecture & lock notes (`miseenplace-v1`)

Meal-prep "battle plan" builder — sequences a minute-by-minute cooking timeline from on-hand
ingredients (or a fridge photo, vision-capable). **Frontend:** `src/tools/MiseEnPlace.js`.
**Backend:** `backend/routes/mise-en-place.js` (1 endpoint, `MODELS.FAST`, vision). **Golden:**
`audit/mise-en-place-golden-sample.json`. Verify: `npm run check:golden mise-en-place`.

## Audit fixes locked here (2026-07-13)
1. **⚠️→🐛 Truncation.** `battle_plan.phases` instructed at **6-15 entries, uncapped**, at
   `max_tokens 4000`; a verbose German 15-phase plan (its heaviest output) could truncate → parse
   fail → 500. **Fix:** cap phases ≤12 + `max_tokens` → **5500**. Verified DE: 11 phases, ~1898 tok.
2. **🐛 `(number)` leak on `duration`.** `phases[].duration` example was `"5 min (number)"`; the
   frontend copy line renders `(${p.duration})` → a literal "(number)" in output. **Fix:** bare `"5 min"`.
3. **⚠️→cleaned:** ~21 annotation leaks (`— one sentence`/`— N words`) across meals/battle_plan/
   technique_tips/leftovers; replaced with ONE global brevity line. Cleaned `difficulty` +
   `skill_level` to pipe-enum form.
4. **⚠️ stale code:** removed a leftover `// model: MODELS.SMART` comment above the active
   `MODELS.FAST` line.

Guard `!parsed.detected_ingredients` is correct (top-level, always emitted as an echo; empty `[]`
is truthy so text-only inputs don't false-500).

## DO NOT silently reverse
- phases ≤12 + `max_tokens 5500`; the global brevity line; bare `duration` label (no `(number)`);
  single `MODELS.FAST` line; no annotation suffixes.
