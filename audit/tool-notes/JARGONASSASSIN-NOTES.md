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
