# DoctorVisitPrep — architecture & lock notes (`doctorvisitprep-v1`)

Pre-visit complement to DoctorVisitTranslator (DVT decodes what the doctor said; this shapes what
YOU say). Turns scattered symptoms into a focused opener, prioritized questions, clinical symptom
description, red-flag prompts, pre-visit checklist, what-to-bring, conversation tips, and
if-medication questions. **Frontend:** `src/tools/DoctorVisitPrep.js` (in `LOCALIZED_TOOLS`,
`dvp_` keys). **Backend:** `backend/routes/doctor-visit-prep.js` (single endpoint). **Golden:**
`audit/doctor-visit-prep-golden-sample.json` (2 cases). Verify: `npm run check:golden doctor-visit-prep` (~30-45s/case).

## Shape
1 endpoint `/doctor-visit-prep`, `claude-sonnet-4-6` (`MODELS.SMART`), **`max_tokens 3500`**, via
`callClaudeWithRetry` + `withLanguage` + `withLocaleContext`. Guard `!results.opener ||
!Array.isArray(results.prioritized_questions)` — both top-level, always-present ✅.

## Audit fixes locked here (2026-07-12)
1. **⚠️ Truncation risk.** `max_tokens 2000` with **uncapped** arrays (`prioritized_questions`,
   `pre_visit_checklist`, `what_to_bring`, `things_to_mention`, meds-questions) → German
   truncation risk on rich inputs. **Fix:** array caps (AT MOST 5 each, conversation_tips 2-4) +
   `max_tokens` 2000 → **3500**. Verified live: rich German cardiac case = 200, ~5.8KB (~1.8K
   tokens, well under ceiling), all arrays at 5.
2. **⚠️→cleaned: 2 annotation leaks** — `— one sentence` glued onto `opener` and
   `prioritized_questions[].question` (both rendered / read aloud). Stripped. The prompt already
   carries a global "1-2 sentences max per item" brevity line, so no re-lengthening trap.

## DO NOT silently reverse
1. The **AT-MOST-5 array caps + `max_tokens >= 3500`** (together prevent truncation).
2. No annotation suffixes on `opener` / `prioritized_questions[].question`.
3. Keep the existing global "1-2 sentences max per item" line.

## Known / accepted
- Dead bilingual path: backend reads a `language` (side-by-side `|||`) preference the frontend
  never sends → bilingual output is unreachable. Harmless (BiText splitter degrades gracefully);
  left as-is. It's also why real-world truncation risk was lower than the schema suggested.
- No currency surface; `withLocaleContext` is inert but harmless.
