# GratitudeDebtClearer — architecture & lock notes (`gratitudedebtclearer-v1`)

Turns "what you're grateful for" into 2-3 authentic thank-you messages (cultural etiquette,
delivery suggestions, optional handwriting template, tone calibration), plus a specificity
pre-pass and an outcome-based follow-up generator. **Frontend:** `src/tools/GratitudeDebtClearer.js`
(in `LOCALIZED_TOOLS`, `gdc_` keys). **Backend:** `backend/routes/gratitude-debt-clearer.js`
(3 endpoints). **Golden:** `audit/gratitude-debt-clearer-golden-sample.json` (3 cases). Verify:
`npm run check:golden gratitude-debt-clearer` (~8-21s; haiku).

## Shape
3 endpoints, all `claude-haiku-4-5` (`MODELS.FAST`) via `callClaudeWithRetry` + `withLanguage` +
`withLocaleContext`:
- `/gratitude-debt-clearer` (main create + adjust branches, **`max_tokens 6000`**) — guard `!thank_you_messages`.
- `/gratitude-debt-specificity` (4000) — guard `!specificity_level` ✅ (was already correct).
- `/gratitude-debt-followup` (4000) — guard `!follow_up_messages`.

## Audit fixes locked here (2026-07-12) — two endpoints were DOWN
1. **🐛 CRITICAL — guard-vs-schema mismatch → 500 on EVERY call (main + followup).** Both guarded
   `if (!parsed.version && !parsed.message_text)`, but `version`/`message_text` are **nested inside**
   `thank_you_messages[]` / `follow_up_messages[]` — always `undefined` at top level → guard always
   fired. The two deliverable endpoints (the core generate + the follow-up) returned 500 for every
   input. **Fix:** guards now key on the TOP-LEVEL array (`!parsed.thank_you_messages` /
   `!parsed.follow_up_messages`). Same class as RoomReader / MeetingBSDetector.
2. **🐛 The message body was also capped.** `message_text` was annotated `"…— one sentence"` while
   `LENGTH PREFERENCE` asks for 1-3 paragraphs — stripping the annotation un-caps the deliverable
   (verified: 129-word message). **Fix:** stripped all 33 `— one sentence` leaks + one brevity line
   that keeps metadata fields short but EXEMPTS `message_text` (follows LENGTH PREFERENCE).
3. **⚠️ Truncation risk (main).** Schema balloons with `handwriting_template` (7 fields, 2 arrays)
   + `tone_calibration` + 2-3 full messages. **Fix:** `max_tokens` 4000 → **6000**. Verified live:
   German max-schema (handwriting + toneOverride) = 200, ~all sections.

## DO NOT silently reverse
1. Guards key on `thank_you_messages` / `follow_up_messages` (TOP-LEVEL arrays) — NOT nested
   `version`/`message_text` (that mismatch = 500 on every call).
2. `message_text` is a FULL message (no `— one sentence` cap); only metadata fields are one-line.
3. main `max_tokens >= 6000`.
