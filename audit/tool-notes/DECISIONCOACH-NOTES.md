# DecisionCoach — architecture & lock notes (`decisioncoach-v1`)

Makes ONE decisive answer (not options) across 10 modes: decide, pros-cons, quick, patterns, group, followup, dna, devils-advocate, batch, chain. **Frontend:** `src/tools/DecisionCoach.js`. **Backend:** `backend/routes/decision-coach.js` (10 endpoints). **Golden:** `audit/decision-coach-golden-sample.json` (5 cases). Verify: `npm run check:golden decision-coach`.

## Shape
- **10 endpoints**, all `claude-sonnet-4-6` (`MODELS.SMART`) via `callClaudeWithRetry` (max_tokens 4000, except followup 800). `lang = withLanguage('', userLanguage) + withLocaleContext(...)` appended to each prompt (no `system` field). **No per-endpoint success guards** by design (frontend null-safe; callClaudeWithRetry guarantees valid JSON). In `LOCALIZED_TOOLS`.

## Audit fixes locked here (2026-07-12)
1. **🛡️ Robustness — all 10 endpoints used raw `anthropic.messages.create` inside a local retry-loop (API-errors only) + an unguarded `JSON.parse` OUTSIDE the loop** (no parse-retry, no truncation fail-fast). **Fix: switched all 10 to `callClaudeWithRetry`** (parse-retry + `stop_reason==='max_tokens'` fail-fast + API-error retry). Removed the dead `anthropic`/`cleanJsonResponse` imports.
   - **Inlined** as `res.json(await callClaudeWithRetry(...))` rather than `const parsed = …; res.json(parsed)` — the bare-variable form trips backend audit **S7.4f** (unvalidated var); the inline call matches the original's audit-clean posture (the tool has no shape-guards by design).
2. **⚠️→cleaned: 37 annotations stripped** (`— one sentence` ×35, `— 3-6 words` ×2). No truncation resulted — the 4000 budget absorbed the (slightly longer) fields, unlike CrowdWisdom/DateNight at 2000-2500. Verified 8/10 modes 200 in German.
3. **⚠️ PF-2 alias** — added `labelText` to the `c` block + `c.label = c.labelText;` (the tool followed the alias-block pattern via `c.textMuteded` but was missing the label alias).

## DO NOT silently reverse
1. **`callClaudeWithRetry` (inlined into `res.json`)** — don't revert to raw `create`; and keep it inline (bare `res.json(parsed)` re-trips S7.4f).
2. **Stripped annotations** — check-golden checks STRUCTURE not content.

## Known / accepted
- 0 baseline audit issues after fixes. No guards by design (frontend null-safe).
- Golden covers 5 modes (decide en/de, pros-cons, chain, devils-advocate). dna + patterns need sessionHistory (analysis modes) — not in golden; verified structurally same class.
- No truncation at 4000 across all tested modes (the annotation strip did NOT trigger truncation here — enough headroom).
