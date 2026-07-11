# BatchFlow — architecture & lock notes (`batchflow-v1`)

Task-batching / cognitive-flow planner. **Frontend:** `src/tools/BatchFlow.js` (865 lines). **Backend:** `backend/routes/batch-flow.js` (1 endpoint, **13 actions**). **Golden:** `audit/batch-flow-golden-sample.json` (3 cases). Verify: `npm run check:golden batch-flow` (needs local backend; `generate` ~40–60s).

## Shape
- **1 endpoint `/api/batch-flow`, 13 actions:** generate, quick-dump, rebatch, expand-batch, progress-update, share-plan, day-template, batch-insights, ab-compare, weekly-rhythm, resistance-check, time-calibrate, location-batch.
- All `claude-sonnet-4-6` (`MODELS.SMART`) + `withLanguage` + `withLocaleContext`. Each action guards on a **top-level always-present field** of its OWN schema (batches||schedule, execution_plan, acknowledgment, message, template_batches, pattern_summary, sprint, days, tasks, mode_breakdown, location_batches) — all verified correct.
- Three-layer sync clean — all 13 actions are wired in the frontend; enum values (`cognitive_mode`, `energy_required`, `intensity`) drive frontend emoji/color. In `LOCALIZED_TOOLS`.

## Audit fixes locked here (2026-07-11)
1. **🐛 Annotation leaks (pervasive — 53 instances).** The schemas glued `— one sentence` (44×) and `(number)` (9×) onto string fields. The model **echoed `— one sentence` literally** (e.g. the "Efficiency Gains" hero stats rendered **"9 switches — one sentence"** in bold; `location: "Home desk — one sentence"`) and **`(number)` made it append a redundant paren** (`estimated_duration: "~135 min (135)"`, `theme: "Orient and Align (1)"`). The frontend interpolates these fields RAW, so the junk showed across every result. Fixed: stripped all 53 (kept legit hints like "1-2 sentences", "— 3-6 words"). Output now clean.
2. **🐛 `generate` truncated in German** at `max_tokens: 4000` → 500. `generate` is the max-schema action (batches with 6-field `focus_preset` + hourly `heatmap`); German expansion overran it. Fixed: **6000** (the annotation strip also shrank output, adding headroom). Re-verified: generate-de 200; ab-compare (3000) and weekly-rhythm (2500) also fit in German post-strip.

## DO NOT silently reverse
1. **`generate` `max_tokens: 6000`** — lower and German `generate` re-truncates.
2. **Stripped annotations** — do NOT re-add `— one sentence` / `(number)` to any schema; the model echoes/distorts them and the frontend renders raw. **check-golden checks structure, NOT content, so it will NOT catch a re-introduced leak** — eyeball output after any prompt edit.
3. **Per-action guards** keyed on each action's own top-level field — don't standardize to one field (this is a 13-schema route).
4. **Clean enum values** (`cognitive_mode` / `energy_required` / `intensity`) — frontend switches on them for emoji/color.

## Known / accepted
- **1 `audit_v2`/backend flag S7.13 is a FALSE POSITIVE:** it claims the `expand-batch` guard (`!parsed.execution_plan`) can't match "this route's schema" — but the backend audit only inspects the FIRST (generate) schema; `execution_plan` IS a top-level key in `expand-batch`'s own schema, and expand-batch returns 200 live (verified). The multi-action route is the audit's blind spot; the guard is correct.
- Mobile pass (375px): input + results clean — the hour-by-hour heatmap fits (10 blocks + legend), no overflow, no crushed columns. (Render-layer — not in the golden.)
- Golden: `unbatchable` + `fixed_commitments_placed` are neutralized to `[]` in the generate cases (variable — depend on input/model routing; the core `batches`/`heatmap` are always non-empty). RecipeChaosSolver/BDB precedent.
