# ContextCollapse — architecture & lock notes (`contextcollapse-v1`)

Analyzes a message against multiple audiences (context-collapse risk): per-audience readings, intent-vs-reality gap, verdict, safer rewrites, "nuclear scenarios". **Frontend:** `src/tools/ContextCollapse.js`. **Backend:** `backend/routes/context-collapse.js` (1 endpoint). **Golden:** `audit/context-collapse-golden-sample.json` (2 cases). Verify: `npm run check:golden context-collapse` (haiku — fast).

## Shape
- **1 endpoint `/api/context-collapse`.** `claude-haiku-4-5` (`MODELS.FAST`), `max_tokens 4000`, via `callClaudeWithRetry` (no robustness gap) + `withLanguage('', userLanguage)` + `withLocaleContext`. Guard `!message_analysis && !rewrites` (top-level). In `LOCALIZED_TOOLS` (`ctc_`).
- Output: message_analysis, readings[] (per audience), intent_vs_reality, verdict, rewrites[], nuclear_scenarios[]. `readings`/`rewrites` scale with audience count.

## Audit fixes locked here (2026-07-12)
1. **⚠️→cleaned: 15 annotations stripped** (`— one sentence` ×13, `— 1-2 sentences` ×1, `— 2-4 sentences` ×1).
2. **⚠️ PF-22 — the lone inline `<CopyBtn>` removed** (+ its import). ContextCollapse was the ONLY tool in the catalog with an inline copy button; the catalog-wide pattern is global-ActionBar copy only (via `useRegisterActions(buildCopy())`). Per "standards override UX", removed the per-rewrite copy button for consistency; the global copy still includes all rewrites.

## DO NOT silently reverse
1. **Stripped annotations** — check-golden checks STRUCTURE not content.
2. **No inline CopyBtn** — copy goes through `useRegisterActions` only (PF-22).

## Known / accepted
- 0 baseline issues after PF-22 fix. No truncation at 4000 (haiku, DE ~28s).
- No golden neutralization — readings/rewrites always ≥ audience count; nuclear_scenarios always present.
