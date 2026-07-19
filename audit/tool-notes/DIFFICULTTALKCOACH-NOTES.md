# DifficultTalkCoach — architecture & lock notes (`difficulttalkcoach-v1`)

Rehearsal coach for hard conversations: situation reading, emotional landmines, 3 conversation
approaches (with scripts + anticipated responses), de-escalation, prep plan, 3 firmness-level
copy-paste messages, pushback scripts, plus a live practice partner + debrief + practice summary.
**Frontend:** `src/tools/DifficultTalkCoach.js` (in `LOCALIZED_TOOLS`, `dtc_` keys). **Backend:**
`backend/routes/difficult-talk-coach.js` (4 endpoints). **Golden:** `audit/difficult-talk-coach-golden-sample.json` (4 cases, all German). Verify: `npm run check:golden difficult-talk-coach` — **main is SLOW (~160-190s)**; 300s per-case timeout matters.

## Shape
4 endpoints, all `claude-sonnet-4-6` (`MODELS.SMART`) via `callClaudeWithRetry` + `withLanguage` + `withLocaleContext` (no robustness gap):
- `/difficult-talk-coach` (main, **`max_tokens 12000`**) — 10-section schema; guard `!situation_reading && !scripts`.
- `/difficult-talk-simulate` (1000) — practice partner turn; guard `!their_response`.
- `/difficult-talk-debrief` (3000) — post-conversation debrief; guard `!overall_assessment`.
- `/difficult-talk-practice-summary` (2500) — scores a rehearsal; guard `!readiness_score`.

## Audit fixes locked here (2026-07-12) — the tool was DOWN
1. **🐛 main endpoint 500'd in BOTH English AND German** (confirmed live, ~80-88s each). The
   10-section schema — `conversation_approaches[]` (3) each with a `script` + **5-8**
   `anticipated_responses` + `emotional_landmines[]` (3-5) — blew past `max_tokens 4000`
   (truncation → `callClaudeWithRetry` fail-fast → 500). Core feature produced nothing.
   **Fix (bound + headroom, both together):** cap to **exactly 3** approaches, **exactly 3**
   anticipated_responses/approach, **exactly 3** main_points, **exactly 3** emotional_landmines
   + a hard per-field length rule in the system prompt + `max_tokens` 4000 → **12000**.
   ⚠️ 10000 was NOT enough — a verbose run still truncated at 10000; the exact-3 caps +
   12000 together are what make it reliable (typical DE ~22KB / ~6.5K tokens, ~2× headroom).
2. **⚠️→cleaned: 65 annotation leaks stripped** — `— one sentence` ×~60, `— 2-4 words`,
   `— 3-6 words`, `(number)`, `(1-3 words)` — glued onto schema values including the
   copy-paste `firmness_messages[].label`/`text` (labels were literally `"Gentle but Clear —
   one sentence"`) and `pushback_scripts.*`. Replaced with ONE global brevity/length rule in
   the system prompt (the CrowdWisdom/DateNight trap: stripping per-field hints alone lengthens
   output → worse truncation).

## DO NOT silently reverse
1. **`max_tokens 12000` + the exact-3 array caps** — together they prevent the truncation.
   10000 alone truncated. Don't loosen the caps or drop the ceiling.
2. **The system-prompt length-discipline line** — replaces the stripped per-field annotations;
   removing it re-lengthens fields → truncation returns.
3. **Stripped annotations** — don't re-add to schema values (firmness labels/text are shown +
   copy-pasted verbatim).

## Known / accepted
- **main is inherently SLOW (~160-190s)** — comprehensive 10-section coaching, ~22KB output.
  There is NO frontend request timeout, so the long wait completes; under the 300s golden timeout.
- Golden is all-German (the truncation-prone direction); the `main-de-truncation-guard` case is
  the one that guards the fix. simulate/debrief/practice-summary verified 200 post-strip.

---

## v2 re-lock (2026-07-19, difficulttalkcoach-v2)

**🐛 Core route effectively unusable for realistic inputs** — the 10-step mega-schema at
max_tokens 12000 in ONE call never returned (≤380s, twice) for a rich scenario; a trivial
input worked (~110s). Fix: split into TWO PARALLEL calls (jargon-assassin pattern):
- `DifficultTalkCoach-scripts` (8000 tokens): conversation_approaches, firmness_messages,
  pushback_scripts — the exact-words bulk (STEPs 3/8/9 + rules 1,2,3,6,7).
- `DifficultTalkCoach-analysis` (5000 tokens): situation_reading, emotional_landmines,
  body_language_guidance, deescalation_toolkit, preparation_plan, follow_up_plan,
  confidence_note, validation, reality_check, follow_up_guidance, reassurance_badges
  (STEPs 1/2/4/5/6/7/10 + rules 1,4,5,8).
Both calls receive the identical CONVERSATION CONTEXT block; merge is
`{...analysisPart, ...scriptsPart}` — response shape unchanged (frontend untouched).
Verified live: rich scenario now 200 in ~105s with all 14 keys, 3/3/5/3 cardinalities.

## DO NOT silently reverse (v2)
1. The parallel split — merging back into one call re-breaks rich inputs.
2. Key ownership: scripts-call keys must NOT appear in the analysis prompt schema and
   vice versa (a key emitted by both would silently overwrite in the merge).
