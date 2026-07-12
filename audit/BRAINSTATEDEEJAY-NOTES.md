# BrainStateDeejay — architecture & lock notes (v1, 2026-07-01)

Music-therapy playlist generator (NOT a synth — emits streaming-service search URLs + a client-side CSS breathing guide). In `LOCALIZED_TOOLS`.

- **Model:** both endpoints `claude-sonnet-4-6`, `max_tokens 3000`, `withLanguage` (no currency — correct).
- **Endpoints:** `/api/brainstate-deejay` (main), `/api/brainstate-deejay/adjust` (route filename has NO hyphen between brain+state).
- **Golden:** `audit/brainstate-deejay-golden-sample.json` (anxious→focused). Verify: `npm run check:golden brainstate-deejay`.

## DO NOT silently reverse
1. **`max_tokens 3000` on both endpoints** (was 2000 → truncation→500 risk on the 3-phase main schema in verbose languages).
2. **Both guards key on `parsed.playlist`** (top-level array; there's a keyed-object→array normalizer before it) — correct.
3. **`duration` / `bpm_range` badge values are clean** (stripped `(number)` / `— one sentence`) so the annotation can't leak into the rendered badge; `parseDuration`/`parseBpm` regex-extract regardless.
4. **Timeline renders for any phase count** (color cycles `idx % 2`, last segment faded via `lastIdx` — not hardcoded `idx===2`).
5. `specific_tracks` is in the schema (was rendered/copied but previously only emitted by luck).

## Re-lock `brainstatedeejay-v2` (2026-07-11) — withRetry sweep
Switched both endpoints (main + adjust) from the local 529-only `withRetry` + `anthropic.messages.create` + manual `JSON.parse(cleanJsonResponse())` to **`callClaudeWithRetry`** (`{model: MODELS.SMART, max_tokens: 3000, messages}`) — gains parse-retry + `stop_reason==='max_tokens'` fail-fast + API-error retry. Removed the dead `withRetry` helper + unused `anthropic`/`cleanJsonResponse` imports. Behavior-preserving; `check:golden brainstate-deejay` 1/1 still passes. Part of the catalog-wide local-`withRetry` anti-pattern sweep (see CaptionMagic/ChaosPilot).
