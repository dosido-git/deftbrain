# Heart of the Matter (was The Crux, was Recall) — architecture & lock notes (`heart-of-the-matter-v1`)

> **Route/endpoint renamed 2026-09-13 (second owner-supplied change the same day):** the CONTRACT
> rewrite below shipped keeping the route filename/endpoints on the naming-consistency-rule's
> already-locked exception — then the owner explicitly asked for the mismatch fixed anyway.
> `backend/routes/the-crux.js` → `backend/routes/heart-of-the-matter.js`; all 4 endpoints
> `/the-crux*` → `/heart-of-the-matter*`; golden sample `the-crux-golden-sample.json` →
> `heart-of-the-matter-golden-sample.json`. i18n filename/prefix (`recall.js` / `rec_`) and
> localStorage keys (`recall-results`, `recall-history`) deliberately stayed put — the rule's own
> exception, unaffected by an explicit route-rename request. Same pass also: collapsed the frontend
> from 4 tabs to 3 (Study Guide's endpoint is now labeled "Understand," reusing the same
> `/heart-of-the-matter/study-guide` route and content unchanged; Test Prep dropped from the UI —
> its endpoint, guard, and golden case are all still live and passing, just unreferenced by the
> frontend); added `POST /heart-of-the-matter/extract` so a visitor can upload a file (text/PDF/
> audio) instead of pasting — see the endpoint's own header comment for why PDF goes through Claude
> and audio through ElevenLabs rather than a new dependency.
>
> **Renamed 2026-09-13:** `TheCrux` → **Heart of the Matter** (id `HeartOfTheMatter`), alongside
> a CONTRACT rewrite. The old PERSONALITY leaned on inferring exam likelihood, professor intent,
> and future lecture content from a transcript; the replacement is source-first — the supplied
> material is the only authority for content-specific claims, `exam_strategy`/`cumulative_exam_focus`
> are now always null/empty (code-enforced via a new `validateResult(kind, parsed)`, not just
> requested in the prompt), and `router.outputStandard = 'v2'` + `router.outputGuard` were added
> (this route had neither before). Output labels changed: Testable → Practice, Gaps/Coming Next →
> Unresolved in the Material, Course Narrative → Throughline, Gaps Between Lectures → Unresolved
> Connections. `/TheCrux` deliberately gets NO redirect this time (owner decision) — see
> `audit/RENAMES.md`.
>
> **Renamed 2026-07-22:** `Recall` → The Crux (id `TheCrux`, route `/the-crux`). Broadened
> positioning beyond students/lectures to any talk or long read (TED talks, keynotes, sermons,
> podcasts, articles). Old `/Recall` URL redirects via `TOOL_ALIASES` in `ToolRenderer.js` AND a
> server-side 301 in `backend/server.js` (now pointed at `/HeartOfTheMatter`, chain collapsed). i18n
> keys keep the `rec_*` prefix (naming-consistency rule: rename route/id, never churn i18n keys).
> Added non-interactive scope chips under the tagline (`rec_scope_label`/`rec_scope_items`, 13 langs;
> `rec_scope_label` copy changed 2026-09-13 from "Works on:" to "For example:" — reads as example
> use-cases, not a claimed scope limit).

Distill a transcript to key points, build an "Understand" study guide, generate practice questions
(endpoint still live, no longer surfaced in the UI), and connect multiple sources. Accepts pasted
text or an uploaded file (text/PDF/audio). **Frontend:** `src/tools/HeartOfTheMatter.js`.
**Backend:** `backend/routes/heart-of-the-matter.js` (5 endpoints, `MODELS.SMART`). **Golden:**
`audit/heart-of-the-matter-golden-sample.json`. Verify: `npm run check:golden heart-of-the-matter`.

## Endpoints
`/heart-of-the-matter` (distill, 6000, guard `!lecture_summary`),
`/heart-of-the-matter/study-guide` (6000, `!title`, UI label "Understand"),
`/heart-of-the-matter/test-prep` (5000, **`!parsed.questions`**, no longer linked from the UI),
`/heart-of-the-matter/connect` (**4000**, `!course_narrative`),
`/heart-of-the-matter/extract` (8000, file upload → plain text; PDF via Claude document block,
audio via ElevenLabs `scribe_v1`, no schema/guard — see the route's own comment).

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
