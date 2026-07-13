# CrowdWisdom — architecture & lock notes (`crowdwisdom-v1`)

Simulates 5 distinct "voices" (people who've lived the question) answering one question, then names the underlying tension + the question nobody asked. **Frontend:** `src/tools/CrowdWisdom.js`. **Backend:** `backend/routes/crowd-wisdom.js` (1 endpoint). **Golden:** `audit/crowd-wisdom-golden-sample.json` (2 cases). Verify: `npm run check:golden crowd-wisdom` (~25s/case).

## Shape
- **1 endpoint `/api/crowd-wisdom`.** `claude-sonnet-4-6` (`MODELS.SMART`), **`max_tokens 3500`**, `callClaudeWithRetry`, guard `!voices && !perspectives` (top-level). Output: question_reframed, voices[5]{archetype,emoji,profile,core_belief,what_they_say,the_truth_only_they_see,the_thing_they_might_miss}, the_tension, the_question_nobody_asked. In `LOCALIZED_TOOLS`.

## Audit fixes locked here (2026-07-12)
1. **⚠️→🐛 30 annotations stripped — and this exposed a trap.** The 29 `— one sentence` (+1 `— 3-4 sentences`) were per-field LENGTH constraints, not just leaks. Stripping all of them let the model write LONGER fields → German 500'd (truncation at 2500), and long fields would also cramp the compact voice cards (the SEA short-values bug). **Fix:** replaced the per-field hints with ONE global brevity instruction ("keep every field to ONE short sentence — these render in compact voice cards") + raised `max_tokens` 2500 → **3500**. Result: restored the short-values contract, fixed German, AND made it ~2× faster (26s vs 52s) since output is tighter.

## DO NOT silently reverse
1. **The global brevity instruction + `max_tokens 3500`** — without the brevity line, fields grow and German truncates + cards cramp.
2. Don't re-add per-field `— one sentence` annotations (they leak); the one global instruction does the job.

## Known / accepted
- 0 baseline audit issues. `voices` is always 5 (prompt: "five voices").
- LESSON (recorded in [[deftbrain-truncation-and-retry]]): stripping length-hint annotations can *lengthen* output → truncation; replace with a single global brevity instruction rather than just deleting them.
