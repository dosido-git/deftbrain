# DecoderRing — architecture & lock notes (`decoderring-v1`)

Decodes the subtext of a received message: surface reading, decoded layers (phrase→surface→subtext→technique), emotional undercurrent, red/green flags, response strategies, tone ratings. **Frontend:** `src/tools/DecoderRing.js`. **Backend:** `backend/routes/decoder-ring.js` (1 endpoint). **Golden:** `audit/decoder-ring-golden-sample.json` (2 cases). Verify: `npm run check:golden decoder-ring` (~30–45s/case).

## Shape
- **1 endpoint `/api/decoder-ring`.** `claude-sonnet-4-6` (`MODELS.SMART`), `max_tokens 4000`, `callClaudeWithRetry` (no robustness gap), guard `!surface_reading` (top-level). Output: surface_reading, decoded_layers[], emotional_undercurrent, flags{red_flags,green_flags}, overall_translation, response_strategies[], tone_rating{warmth,directness,manipulation,sincerity}. In `LOCALIZED_TOOLS`.

## Audit fixes locked here (2026-07-12)
1. **⚠️→cleaned: 13 annotations stripped** (`— one sentence` ×12 + a stray `(number)`). No truncation resulted — the 4000 budget absorbed the (slightly longer) fields.

## DO NOT silently reverse
1. **Stripped annotations** — check-golden checks STRUCTURE not content.

## Known / accepted
- 0 baseline audit issues (was already clean — callClaudeWithRetry, guard correct). No truncation at 4000 (DE ~45s).
- Golden neutralizes `flags.red_flags`/`green_flags` to `[]` (variable — a benign message may have none); decoded_layers/response_strategies stay non-empty.
