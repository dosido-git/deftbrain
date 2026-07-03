# DreamPatternSpotter — architecture & lock notes (v1, 2026-07-02)

Dual-mode dream tool: single-dream depth analysis (classification, themes with multi-school perspectives, symbols, lucid/nightmare/sleep analysis, insights, reflection questions, therapist export) + multi-dream pattern analysis. 2 `claude-sonnet-4-6` endpoints. Reflective, non-deterministic framing (prompts mandate tentative language). In `LOCALIZED_TOOLS`.

- **Golden:** `audit/dream-pattern-spotter-golden-sample.json` (single + pattern — both guard the restored schemas). Verify: `npm run check:golden dream-pattern-spotter`.

## DO NOT silently reverse
1. **Both prompt JSON schemas are COMPLETE, CLOSED, and BOUNDED (max_tokens 6000 each).** They were once truncated mid-template (missing closing `}` + dangling comma) — sections were deleted from the prompts but not the frontend, orphaning ~8 renderer sections including the tool's flagship features (insights, reflection_questions, therapist_export_summary, life-event connections). Restoring them WITHOUT the OUTPUT LIMITS caps truncated every run at 4000 (→ 500) — keep the per-array caps (themes ≤3, symbols ≤4, reflection_questions ≤4, …) AND the 6000 ceiling together; neither alone suffices. The goldens assert the restored keys exist. If editing the prompts, verify the JSON template braces balance.
2. **`loadExample` spreads into the existing state shape** (`setSingleDream(prev => ({...prev, …}))`) — replacing the whole object drops the `emotions` object and **hard-crashes the tool** on the new-user first-click path (TypeError reading `.anxious`).
3. `nightmare_frequency` is an instruction ("count dreams whose description indicates a nightmare"), NOT the old hard-interpolated `"0/${totalDreams}"` literal — no UI collects `isNightmare`, so the literal deterministically contradicted the analysis text.
4. Cmd+Enter is handled ONLY by the document-level handler (the inline textarea handler double-submitted). No second example button in pattern mode (a ghost, label-less one existed).
5. History cap 50 (`// Exception (PF-25)` comment required — it's a journal). Copy export ends with the `BRAND` const; history dates via `formatDate(h.date, userLocale)`.
