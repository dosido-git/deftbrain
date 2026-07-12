# ChaosPilot — architecture & lock notes (`chaospilot-v1`)

Diagnoses the invisible behavioral rut producing someone's stagnation, then designs **one** precise, specific, slightly-uncomfortable disruption to break it (no money/equipment/major time). **Frontend:** `src/tools/ChaosPilot.js`. **Backend:** `backend/routes/chaos-pilot.js` (1 endpoint). **Golden:** `audit/chaos-pilot-golden-sample.json` (2 cases: en, de). Verify: `npm run check:golden chaos-pilot` (needs local backend; sonnet ~25–35s/case).

## Shape
- **1 endpoint `/api/chaos-pilot`.** `claude-sonnet-4-6` (`MODELS.SMART`), `max_tokens 4000`, via `callClaudeWithRetry` + `withLanguage(PERSONALITY)` (system) + `withLocaleContext`.
- Output: `pattern_diagnosis{the_invisible_rut, why_its_invisible, what_its_costing}`, `the_disruption{what, when, the_full_instruction (3-5 sentences), the_slight_discomfort, why_this_one}`, `the_downstream_effect{immediate, within_a_week, compound_effect}`, `if_they_resist`. **All nested objects, no arrays.** Three-layer sync clean (every field renders).
- Guard `if (!parsed.pattern_diagnosis || !parsed.the_disruption)` — both are **top-level objects, always present** (correct guard, kept).
- In `LOCALIZED_TOOLS` (`chp_` prefix); mobile clean; no truncation at 4000 (DE ~34s comfortable).

## Audit fixes locked here (2026-07-11)

1. **🛡️ Robustness — local `withRetry` retried only on 529 overload** (no parse-retry, no truncation fail-fast; identical pattern to CaptionMagic pre-lock). A malformed/truncated response → immediate 500; over-budget → slow 502. **Fix: switched to `callClaudeWithRetry`** (`{model: MODELS.SMART, max_tokens, system, messages}`) — parse-retry + `stop_reason==='max_tokens'` fail-fast + API-error retry, consistent with the codebase. Removed the dead `withRetry` helper + now-unused `anthropic`/`cleanJsonResponse` imports.
2. **⚠️→cleaned: 10 `— one sentence` annotations stripped** — glued onto the diagnosis/disruption/downstream string fields (all rendered raw in the result cards). Latent (didn't echo in tests); BatchFlow class.

## DO NOT silently reverse
1. **`callClaudeWithRetry`** — don't revert to bare `anthropic.messages.create` + local `withRetry`; that drops parse-retry + truncation fail-fast.
2. **Stripped annotations** — don't re-add `— one sentence`; **check-golden checks STRUCTURE not content** — eyeball output after prompt edits.
3. **The guard** — keep it on `pattern_diagnosis`/`the_disruption` (top-level always-present objects).

## Known / accepted
- 0 baseline `audit_v2` / backend-audit issues.
- No arrays in the schema → nothing neutralized in the golden; every section is a required object/string.
- Live EN+DE verified 200 / no leaks post-refactor.
