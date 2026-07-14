# TimeWarp — architecture & lock notes (`timewarp-v1`)

Comedy history collisions — drops a modern thing into a historical period as an explainer / review /
news article / letter / debate / advertisement. **Frontend:** `src/tools/TimeWarp.js`. **Backend:**
`backend/routes/time-warp.js` (1 endpoint, `MODELS.FAST`, max_tokens 4000). **Golden:**
`audit/time-warp-golden-sample.json`. Verify: `npm run check:golden time-warp`.

## Audit fixes locked here (2026-07-14)
The cleanest tool in the batch — guard `!title || !main_content` correct; sync clean; no format-strict
/ USD hazards; no truncation risk (single 200-400 word prose piece + a "2-3" footnotes array at 4000).
1. **🐛 German quotes.** The review / letter / debate / news formats produce quoted speech, star-rating
   complaints, and dialogue inside `main_content` → unescaped `"` in German → invalid JSON → 500.
   **Fix:** the no-inner-double-quote rule. Verified DE on a medieval smartphone review (1755-char
   main_content, clean parse).
2. **⚠️→cleaned:** 4 leaks; the frontend c block was missing the PF-2 aliases (`labelText` already
   existed) → added `c.label` / `c.textMuteded`.

## DO NOT silently reverse
- The no-inner-double-quote rule; the PF-2 aliases; no annotation suffixes.
