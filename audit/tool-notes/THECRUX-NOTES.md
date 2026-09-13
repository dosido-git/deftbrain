# Heart of the Matter (was The Crux, was Recall) — architecture & lock notes (`the-crux-v1`)

> **Renamed 2026-09-13:** `TheCrux` → **Heart of the Matter** (id `HeartOfTheMatter`), alongside
> a CONTRACT rewrite. The old PERSONALITY leaned on inferring exam likelihood, professor intent,
> and future lecture content from a transcript; the replacement is source-first — the supplied
> material is the only authority for content-specific claims, `exam_strategy`/`cumulative_exam_focus`
> are now always null/empty (code-enforced via a new `validateResult(kind, parsed)`, not just
> requested in the prompt), and `router.outputStandard = 'v2'` + `router.outputGuard` were added
> (this route had neither before). Output labels changed: Testable → Practice, Gaps/Coming Next →
> Unresolved in the Material, Course Narrative → Throughline, Gaps Between Lectures → Unresolved
> Connections. Frontend/backend/i18n filenames, the route slug, and all 4 endpoints deliberately
> stay put (see below) — same convention as the 2026-07-16 rename. `/TheCrux` deliberately gets NO
> redirect this time (owner decision) — see `audit/RENAMES.md`.
>
> **Renamed 2026-07-22:** `Recall` → The Crux (id `TheCrux`, route `/the-crux`). Broadened
> positioning beyond students/lectures to any talk or long read (TED talks, keynotes, sermons,
> podcasts, articles). Old `/Recall` URL redirects via `TOOL_ALIASES` in `ToolRenderer.js` AND a
> server-side 301 in `backend/server.js` (now pointed at `/HeartOfTheMatter`, chain collapsed). i18n
> keys keep the `rec_*` prefix (naming-consistency rule: rename route/id, never churn i18n keys).
> Added non-interactive scope chips under the tagline (`rec_scope_label`/`rec_scope_items`, 13 langs).

Distill a transcript to key points, build a study guide, generate practice questions, and connect
multiple sources. **Frontend:** `src/tools/HeartOfTheMatter.js`. **Backend:**
`backend/routes/the-crux.js` (4 endpoints, `MODELS.SMART`). **Golden:**
`audit/the-crux-golden-sample.json`. Verify: `npm run check:golden the-crux`.

## Endpoints
**Correction (2026-09-13): the line below has said `/recall/*` since this file was written, but the
route file has used `/the-crux` endpoints since at least the 2026-07-22 rename — confirmed against
the live route source, not against this note. Read the endpoint paths from the code, not from here,
if the two ever disagree again.**
`/the-crux` (distill, 6000, guard `!lecture_summary`), `/the-crux/study-guide` (6000, `!title`),
`/the-crux/test-prep` (5000, **`!parsed.questions`**), `/the-crux/connect` (**4000**, `!course_narrative`).

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
