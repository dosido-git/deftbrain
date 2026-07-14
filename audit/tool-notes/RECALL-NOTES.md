# Recall — architecture & lock notes (`recall-v1`)

Study/memory tool — distill a transcript to key points, build a study guide, generate practice
questions, and connect multiple lectures. **Frontend:** `src/tools/Recall.js`. **Backend:**
`backend/routes/recall.js` (4 endpoints, `MODELS.SMART`). **Golden:** `audit/recall-golden-sample.json`
(2 DE cases). Verify: `npm run check:golden recall`.

## Endpoints
`/recall` (distill, 6000, guard `!lecture_summary`), `/recall/study-guide` (6000, `!title`),
`/recall/test-prep` (5000, **`!parsed.questions`**), `/recall/connect` (**4000**, `!course_narrative`).

## Audit fixes locked here (2026-07-14)
1. **🐛 test-prep DOWN — 500 every call.** Guard was `!parsed.answer && !parsed.facts &&
   !parsed.response`, but the schema emits top-level `questions` + `study_tips` (`answer` is nested
   in `questions[].answer`) → all three always undefined → 500 on every successful generation.
   Classic copy-pasted-guard drift. **Fix:** `!parsed.questions`. Verified DE: 12 questions.
2. **⚠️→🐛 `/connect` truncation.** 5 uncapped arrays across up to 5 lectures at `max_tokens 2500`.
   **Fix:** cap all 5 (themes ≤5, chain ≤5, contradictions ≤4, focus ≤5, gaps ≤4) + `max_tokens 4000`.
   Verified DE (3 lectures): ~1239 tok, within caps.
3. **⚠️ array caps** added to `/recall` (vocabulary/connections/professor_signals/gaps) + study-guide
   (concepts/definitions/processes/relationships) + test-prep (study_tips ≤5).
4. **⚠️→cleaned:** 34 annotation leaks + brevity lines; no-inner-double-quote rule on test-prep +
   study-guide + connect (quote-prone passage fields).
5. PF-2 `c.label` alias normalized (was double-space + ordered after `c.textMuteded`).

## DO NOT silently reverse
- test-prep guard `!parsed.questions`; connect `max_tokens 4000` + 5 caps; the other array caps; the
  no-inner-double-quote rule; no annotation suffixes.
