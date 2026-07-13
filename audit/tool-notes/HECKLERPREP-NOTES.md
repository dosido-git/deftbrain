# HecklerPrep — architecture & lock notes (`hecklerprep-v1`)

Prep for hostile Q&A: reads the audience, generates N tough questions (with real concern + model
answer + what-not-to-say), a curveball, an opening move. **Frontend:** `src/tools/HecklerPrep.js`
(`hp_` keys). **Backend:** `backend/routes/heckler-prep.js` (single endpoint, stakes-tiered
`max_tokens`). **Golden:** `audit/heckler-prep-golden-sample.json` (1 high/DE case). Verify: `npm run check:golden heckler-prep`.

## Shape
1 endpoint, `claude-sonnet-4-6` (`MODELS.SMART`), `max_tokens` by stakes **{low:1500, moderate:2500, high:5000}**, via `callClaudeWithRetry` + `withLanguage` + `withLocaleContext`. Guard `!parsed.questions.length` ✅.

## Audit fixes locked here (2026-07-13)
1. **⚠️→cleaned: 6 self-contradictory annotation leaks.** `situation_read`/`model_answer`/curveball
   `how_to_handle` were `"2 sentences … — one sentence"` (contradiction + leak); `question` renders
   as the bold headline. Stripping `— one sentence` fixes both (the "2 sentences" cue stays).
2. **⚠️ High-stakes truncation.** stakes=high = **10 questions × 6 fields** at the old `high: 3000`
   → German truncation. **Fix:** `{low:1500, moderate:2500, high:5000}`. Verified DE high = 200,
   10 questions, ~3.3K tokens (questions are hard-capped by questionCount, so output can't balloon).

## DO NOT silently reverse
1. `maxTokensByStakes = {low:1500, moderate:2500, high:5000}`.
2. NO annotation suffixes (the "2 sentences" length cues are fine; the `— one sentence` tails are not).
