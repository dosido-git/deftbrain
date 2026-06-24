# Doctor Visit Translator (DVT) — Architecture & Decision Record

Known-good baseline: **tag `dvt-v1`**, golden sample **`audit/dvt-golden-sample.json`**.
This tool regressed once (returned errors on PDF upload, hung ~2.5 min on text,
and failed every diagram) because prompt/model/`max_tokens` changes degraded
output while the 5 structural gates stayed green. The gates do NOT check output
quality — this note + the golden sample do. **Read this before changing DVT.**

## Shape (`backend/routes/doctor-visit-translator.js`)

- **`POST /doctor-visit-translator`** — translates pasted notes / a PDF into a
  large (~100-field) plain-English JSON via `callClaudeWithRetry`. PDF is sent as
  a native `document` block. Frontend: `src/tools/DoctorVisitTranslator.js`.
- **`POST /generate-diagram`** — generates a compact SVG (anatomy) or HTML
  (data-viz) from a text `description`. Triggered by per-section "Generate Visual".

## DO NOT silently reverse

1. **PDF content building.** Apply `withLanguage` / `withLocaleContext` to the
   prompt **string**, then build the content array around it. NEVER
   `withLanguage(contentArray) + withLocaleContext(...)` — `array + string`
   coerces to `"[object Object],…"` and destroys the prompt *and* the document
   block. That broke **every** PDF upload.
2. **`max_tokens`.** Translate = **8000**, diagram = **8000**. The schema is huge;
   2500 truncated the JSON → parse-fail → 3 retries (~2.5 min) → error, and 1500
   truncated the SVG so the closing-tag regex failed every time. Do not lower
   without re-running `check:golden`.
3. **Model = `claude-opus-4-8`** (translate + diagram). ~2× faster than
   `sonnet-4-6` here *and* better-calibrated. Don't downgrade without re-testing
   speed *and* quality.
4. **Diagram accuracy rules.** The SVG/HTML prompts carry a strict ACCURACY rule
   (use ONLY the numbers/labels in the description; never invent or relabel — e.g.
   never draw "wall thickness" for a chamber's internal diameter). The translate
   prompt's **rule 11** makes every visual-aid description embed the exact value +
   normal range + precise anatomy. Together these stopped diagrams from inventing
   numbers (aorta drew 4.0/3.8 vs the real 4.2/4.0) and mislabeling concepts.
   Keep both.
5. **SVG prompt stays bounded** ("keep compact, well under ~3000 tokens"). A
   maximalist anatomical prompt overran even 6000 tokens and never closed `</svg>`.
6. **Comparison panel** ("vs Last Visit") slices the diagnosis to **150** chars,
   not 6 (`6` rendered "Pre-di…"). Don't re-shrink.

## Known, accepted limitation (not a bug)

A full PDF echo translation takes ~55–130s — it's generating a large, thorough
response through the ~100-field schema. It succeeds (no client-side timeout
aborts it). Trimming the schema or fan-out would speed it but changes the output;
deferred deliberately.

## Verifying a DVT change

1. Run the 5 gates (necessary, **not sufficient** — they don't see quality).
2. With the dev backend up: **`npm run check:golden dvt`** — re-runs the golden
   inputs and asserts no error, all sections present, non-empty stays non-empty,
   diagram closes. This is what catches the regressions the gates miss.
3. Eyeball one real output against `audit/dvt-golden-sample.json`.
