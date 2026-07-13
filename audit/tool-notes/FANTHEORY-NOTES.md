# FanTheory — architecture & lock notes (`fantheory-v1`)

Generate a wild-but-defensible fan theory for any movie/show/book/game, or grade the user's own
theory (professor voice). **Frontend:** `src/tools/FanTheory.js` (in `LOCALIZED_TOOLS`, `ft_` keys).
**Backend:** `backend/routes/fan-theory.js` (2 endpoints). **Golden:**
`audit/fan-theory-golden-sample.json` (2 cases). Verify: `npm run check:golden fan-theory` (~13s generate, ~7s grade — haiku, fast).

## Shape
- `/fan-theory` (generate, `max_tokens 4000`) — guard `!theory_name || !Array.isArray(evidence)` ✅.
- `/fan-theory/grade` (2000) — guard `!grade || !professor_notes` ✅.
- Both `claude-haiku-4-5` (`MODELS.FAST`) via `callClaudeWithRetry` + `withLanguage` + `withLocaleContext`.

## Audit fixes locked here (2026-07-12)
1. **🐛 Numeric hero-stat fields were string instructions with leaks.** `plausibility` /
   `mind_blown_factor` (generate) and `plausibility` / `creativity` (grade) were
   `"1-10 honest rating … — one sentence"` — but the frontend renders them **raw** as `{value}/10`
   hero stats. A model echo of `"4 — one sentence"` → `"4 — one sentence/10"` garbage. **Fix:**
   schema example is now a bare **integer** (`"plausibility": 4`) + an explicit "these are INTEGERS
   1-10, return the number only" rule. Verified live: integers returned.
2. **⚠️→cleaned: annotation leaks** — `— one sentence` ×11, `— 3-6 words` ×2 (theory_name,
   grade_title, one_line, evidence detail/spin, smoking_gun, counterargument, rabbit_hole,
   improvement_suggestion). Stripped + added a global brevity line. Enum values (`strength`,
   `evidence_quality`, `grade`) were already clean and stay clean (frontend switches on `strength`).
3. **🐛 (frontend) Broken `EXAMPLES[0]`.** `{mediaType:'tv', direction:'secret_villain'}` — neither
   id exists (`MEDIA_TYPES` = movie/show/book/game; `DIRECTIONS` = wild/villain/connected/timeline/
   alive/simulation). Picking it (50%) highlighted no pill + POSTed bogus values. **Fix:**
   `'tv'→'show'`, `'secret_villain'→'villain'`.
4. **⚠️ (frontend) Dead empty button** — a `<button>` that set Inception/movie/alive but had no
   text (invisible control). Removed.

## DO NOT silently reverse
1. `plausibility` / `mind_blown_factor` / `creativity` are **bare integers** — the frontend renders
   `{value}/10`. Don't turn them back into string instructions.
2. NO annotation suffixes on any string field; keep enum values (`strength`/`evidence_quality`/`grade`) clean.
3. `EXAMPLES[0]` uses valid `mediaType`/`direction` ids.
