# FutureProof — architecture & lock notes (`futureproof-v1`)

5-year (or N-year) trajectory analysis for a skill / career / investment / habit / technology:
pattern, tailwinds/headwinds, automation question, adjacent pivots, bull/base/bear scenarios,
honest take, one action. **Frontend:** `src/tools/FutureProof.js` (in `LOCALIZED_TOOLS`, `fp_`
keys). **Backend:** `backend/routes/future-proof.js` (single endpoint). **Golden:**
`audit/future-proof-golden-sample.json` (2 cases). Verify: `npm run check:golden future-proof` (~40-50s).

## Shape
1 endpoint `/future-proof`, `claude-sonnet-4-6` (`MODELS.SMART`), **`max_tokens 5500`**, via
`callClaudeWithRetry` + `withLanguage` + `withLocaleContext`. Guard `!subject_as_understood`
(top-level, always-present) ✅. Enum fields (`trajectory`, `trajectory_label`,
`trajectory_strength`, `confidence`, `risk_level`, `effort_required`) drive frontend styling and
were already clean.

## Audit fixes locked here (2026-07-12)
1. **⚠️ Truncation risk.** `tailwinds`, `headwinds`, `the_pivot.adjacent_moves` were **uncapped**
   at `max_tokens 4500` → German + long-horizon (10y) truncation risk. **Fix:** caps
   (tailwinds/headwinds ≤4, adjacent_moves ≤3) + `max_tokens` 4500 → **5500**. Verified live:
   German 10-year case = 200, arrays 4/4/3, ~6.6KB (~1.7K tokens).
2. **⚠️→cleaned: 15 annotation leaks** — `— one sentence` on prose fields. Worst was
   `the_honest_take`, annotated `"One direct paragraph — … Just the real read. — one sentence"`
   (contradiction: paragraph vs one sentence) and it renders as copy-paste. Stripped; a single
   LIMITS/brevity line now says it's a short 2-3 sentence paragraph. No enum contamination.

## DO NOT silently reverse
1. Array caps (tailwinds/headwinds ≤4, adjacent_moves ≤3) + `max_tokens >= 5500` — together.
2. `the_honest_take` / `the_pattern` are short paragraphs; every other field one sentence.
3. NO annotation suffixes; keep enum values clean (frontend switches on trajectory/confidence/etc).
