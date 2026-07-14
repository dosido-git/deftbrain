# PlainTalk — architecture & lock notes (`plaintalk-v1`)

Universal text comprehension — plain-English translation + structural X-ray of any complex document,
plus follow-up Q&A and two-version comparison. **Frontend:** `src/tools/PlainTalk.js`. **Backend:**
`backend/routes/plain-talk.js` (3 endpoints, `MODELS.SMART`). **Golden:** `audit/plaintalk-golden-sample.json`.
Verify: `npm run check:golden plaintalk`.

## Endpoints
`/plaintalk` (main, **8000**, guard `!detected_type`), `/plaintalk/followup` (2000, `!answer`),
`/plaintalk/compare` (**4000**, `!summary`). All guards correct (top-level).

## Audit fixes locked here (2026-07-14)
1. **🐛 `full_translation` self-contradiction (headline deliverable silently broken).** The schema said
   "COMPLETE … nothing omitted" but ended with `— one sentence` → coin-flip between a stub translation
   and truncation. **Fix:** stripped the annotation + `max_tokens 4000→8000` (full_translation is
   input-proportional). Verified DE: 1625-char multi-paragraph translation.
2. **🐛 German unescaped-quotes (top real-world 500).** Legal/contract inputs are quote-heavy and
   several fields reproduce text verbatim (`sections[].original`, `key_quote`, `text_a`/`text_b`).
   **Fix:** the no-inner-double-quote rule on all 3 endpoints. Verified DE on a quote-heavy lease clause.
3. **⚠️ truncation:** `sections` capped ≤12, `jargon_glossary` ≤15; compare `changes` ≤15 +
   `max_tokens 3000→4000`.
4. **⚠️ dead `/stream` route** (never invoked, raw stream, no repair) removed + the now-unused
   `anthropic` import dropped.
5. **⚠️→cleaned:** 26 annotation leaks; PF-2 `c.label` alias normalized (double-space).

## DO NOT silently reverse
- `full_translation` uncapped + `max_tokens 8000`; sections/glossary/changes caps; the no-inner-quote
  rule on all 3 endpoints; no `/stream` route; no annotation suffixes.
