# JargonAssassin — architecture & lock notes (`jargonassassin-v1`)

De-jargons documents (paste / image / PDF): plain-language translation + glossary + red-flags,
plus follow-up Q&A, version compare, section explain, must-ask questions, explain-to-audience,
**red-line edits**, **vs-normal comparison**, action plan, dossier. **Frontend:**
`src/tools/JargonAssassin.js` (in `LOCALIZED_TOOLS`, `jarg_` keys). **Backend:**
`backend/routes/jargon-assassin.js` (11 endpoints). **Golden:**
`audit/jargon-assassin-golden-sample.json` (3 DE cases). Verify: `npm run check:golden jargon-assassin`.

## Shape
11 endpoints, all `claude-sonnet-4-6` (`MODELS.SMART`) via `callClaudeWithRetry` + `withLanguage`
+ `withLocaleContext` (Route 1 also takes image/PDF blocks). Key `max_tokens`: translate **6000**,
redline **6000**, template **4000**; others 2000-3000.

## Audit fixes locked here (2026-07-13) — two endpoints were DOWN
1. **🐛 CRITICAL — Red-line (`:325`) + vs-Normal (`:377`) 500'd on EVERY click.** Both guards were
   copy-pasted from Route 1: `if (!parsed.translation && !parsed.plain_version && !parsed.score)`.
   But redline emits `overview`/`fairness_score`/`redlines` and template emits
   `overall_assessment`/`normal_score`/`comparisons` — none of `translation`/`plain_version`/`score`
   exist top-level, so the guard ALWAYS fired. **Fix:** redline → `!parsed.overview && !parsed.redlines`;
   template → `!parsed.overall_assessment && !parsed.comparisons`; Route 1 → just `!parsed.translation`
   (dropped the dead `plain_version`/`score` cruft). Same class as RoomReader/GratitudeDebtClearer.
2. **🐛 Red-line was ALSO truncating** at `max_tokens 2500` in German (doubly broken — even with the
   guard fixed it 500'd). **Fix:** `max_tokens` 2500 → **6000** + `redlines` AT MOST 8 (8 clauses × ~650
   tok can exceed 4500). translate 4000 → **6000** + array caps (key_sections≤8, glossary≤10,
   jargon_highlights≤12, checklist≤6, suggested_questions≤6). template 3000 → **4000** + comparisons≤8.
3. **⚠️→cleaned: 74 annotation leaks** — `— one sentence`/`— 1-2 sentences`/`— 3-6 words` glued onto
   values incl. `reading_level` (rendered as a **badge** + copied), `key_sections.title`,
   `glossary.term`, `jargon_highlights.*`. Stripped (kept the 2 legit `— 2-4 sentences` body hints).
   Enum values (`danger_score.level`, `priority`, `verdict`, `difficulty`) were already clean.
4. **⚠️ Frontend:** `loadExample` set `docType: 'lease'` — not a `DOC_TYPES` id → the example's type
   pill never highlighted. Fixed to `'legal'`.

## DO NOT silently reverse
1. Guards: translate `!translation`, redline `!overview && !redlines`, template `!overall_assessment && !comparisons`.
2. `max_tokens`: translate 6000, redline 6000, template 4000 — **with** the array caps.
3. NO annotation suffixes on `reading_level`/`key_sections.title`/`glossary.term`.

---

## v2 re-lock (2026-07-19, jargonassassin-v2)

Driven by real user testing with a 6-page auto insurance policy.

1. **🐛 Translate silently failed on large docs** — max_tokens 6000 truncated the response for
   multi-page documents; backend treats truncation as failure; frontend had NO try/catch so the UI
   just reverted to the input screen with no message. Fix: translate split into TWO PARALLEL calls
   (translation+summary @8000 tokens ∥ key_sections/glossary/checklist/danger_score @4000), merged
   into the same response shape — ~115s → ~80s wall-clock on the 6-page doc. All 11 frontend handlers
   wrapped in try/catch → `jarg_err_request_failed` (13 langs). 15s slow-translate banner added.
2. **🐛 Q&A couldn't see past char 8000** — user asked about an endorsement on the last page and got
   "the summary doesn't include it". `documentText` was capped `substring(0, 8000)` frontend AND
   backend. Fix: doc caps → 40000 everywhere (compare 20000/version). Q&A + Letter now fall back to
   the full translation for PDF uploads (previously sent EMPTY documentText — model only saw the
   3-sentence summary).
3. **✨ NEW endpoint `/jargon-assassin-personalize`** ("For You" tab): cross-references the user's
   stated situation against the document's actual clauses — specific collision + specific fix, with
   already_covered so it doesn't read as all-problems. `userSituation` also threaded into Q&A and
   Action Plan (the Action Plan input had been designed but never built — button always sent '').
4. **UX:** Q&A discoverability callout at bottom of Translation tab; stale error banner cleared on
   tab switch (a leftover error looked like it was caused by the next tab clicked).

## DO NOT silently reverse (v2 additions)
1. The parallel split: both calls re-send the document; merge is `{...translated, ...extracted}` —
   extraction keys must NOT collide with translation keys.
2. Doc caps 40000 — lowering re-introduces the "can't see the last page" bug class.
3. PDF-upload fallback `docText.trim() || results?.translation` in handleAsk/handleLetter.
4. Golden case 4 (`personalize-situational-gap-analysis`) guards the new endpoint.
