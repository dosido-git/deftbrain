# RoastMe — architecture & lock notes (`roastme-v1`)

Comedy roast of pasted content (resume / dating / LinkedIn / email / social) at 3 heat levels.
**Frontend:** `src/tools/RoastMe.js`. **Backend:** `backend/routes/roast-me.js` (1 endpoint,
`MODELS.FAST`, max_tokens 4000). **Golden:** `audit/roast-me-golden-sample.json`. Verify:
`npm run check:golden roast-me`.

## Audit fixes locked here (2026-07-14)
The cleanest tool in the batch — guard `!Array.isArray(roasts) || !roasts.length` correct; sync
clean; no format-strict/USD hazards.
1. **🐛 German unescaped-quotes (highest DE-500 probability in the batch).** Roast lines are
   explicitly "punchy, specific, quotable" and the prompt models quoted phrases — in German the model
   embeds literal `"…"` inside string values → invalid JSON → 500. **Fix:** a "no double-quote inside
   a string value" rule in the prompt (+ reworded the PERSONALITY example to not model quote-wrapping).
   Verified DE scorched on a quote-heavy LinkedIn bio: 200, 8 roasts, clean parse.
2. **⚠️→cleaned:** 6 `— one sentence` leaks + a brevity line in PERSONALITY; `roasts` capped ≤8.

Content-safety is handled: 3-way heat control + PERSONALITY guardrails (never target appearance/
disability/identity; funny not hateful). The frontend PF-2 audit flag is a pre-existing false-positive
(both aliases are present; the name-keyed heuristic mismatches) — not introduced here, not NEW.

## DO NOT silently reverse
- The no-inner-double-quote rule; `roasts` ≤8; the safety guardrails; no annotation suffixes.
