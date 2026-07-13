# ComebackCooker — architecture & lock notes (`comebackcooker-v1`)

Generates the 5 comebacks someone wishes they'd said (each a different technique) plus a "nuclear option" and a "high road" line. Cathartic fiction; clever-not-cruel. **Frontend:** `src/tools/ComebackCooker.js`. **Backend:** `backend/routes/comeback-cooker.js` (1 endpoint). **Golden:** `audit/comeback-cooker-golden-sample.json` (2 cases: en, de). Verify: `npm run check:golden comeback-cooker` (needs local backend; haiku — fast, ~11–16s/case).

## Shape
- **1 endpoint `/api/comeback-cooker`.** `claude-haiku-4-5` (`MODELS.FAST`), `max_tokens 4000`, via `callClaudeWithRetry`. Language via `withLanguage('', userLanguage)` appended to the `system` field (PERSONALITY) + `withLocaleContext`.
- Output: `situation_read`, `comebacks[5]{line, technique, why_it_works, delivery_note}`, `the_nuclear_option{line, warning}`, `the_high_road{line, why_its_devastating}`. Three-layer sync clean; `mood` enum (surgical|witty|petty|dignified) drives the prompt tone.
- Guard `if (!Array.isArray(parsed.comebacks) || !parsed.comebacks.length)` — top-level array, always present (correct).
- In `LOCALIZED_TOOLS` (`cc_` prefix); mobile clean (mood picker `grid-cols-2 sm:grid-cols-4`). No truncation at 4000 (DE ~16s).

## Audit fixes locked here (2026-07-12)
1. **🛡️ Robustness — local `withRetry` retried only on 529 overload** (no parse-retry, no truncation fail-fast; the recurring CaptionMagic/ChaosPilot anti-pattern). **Fix: switched to `callClaudeWithRetry`** (`{model: MODELS.FAST, max_tokens, system, messages}`) — parse-retry + `stop_reason==='max_tokens'` fail-fast + API-error retry. Removed the dead `withRetry` helper + now-unused `anthropic`/`cleanJsonResponse` imports.
2. **⚠️→cleaned: 9 `— one sentence` annotations stripped** — glued onto the **primary output**, including the comeback `line` itself (the copy-paste text) plus `technique`/`why_it_works`/`delivery_note` and the nuclear/high-road lines. Latent (didn't echo in tests); BatchFlow class.

## DO NOT silently reverse
1. **`callClaudeWithRetry`** — don't revert to bare `anthropic.messages.create` + local `withRetry`.
2. **Stripped annotations** — don't re-add `— one sentence`; **check-golden checks STRUCTURE not content** — eyeball output after prompt edits.
3. **The guard** — keep on top-level `comebacks[]`.

## Known / accepted
- 0 baseline `audit_v2` / backend-audit issues.
- No arrays neutralized — `comebacks` is always 5 (prompt asks for 5); nuclear/high-road are objects.
- Live EN+DE verified 200 / 5 comebacks / no leaks post-refactor.
