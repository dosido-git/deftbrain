# BrainRoulette — architecture & lock notes (v1, 2026-07-01)

Knowledge/curiosity tool: spins up "rabbit hole" topics, journeys, debates, digests from a user's interests. In `LOCALIZED_TOOLS`.

- **Model:** all endpoints `claude-haiku-4-5` via `callClaudeWithRetry`.
- **Endpoints:** `/api/brain-roulette` (main spin), `/deeper`, `/chain-deeper`, `/debate`, `/journey`, `/journey-step`, `/extract-concepts`, `/digest`.
- **Golden:** `audit/brain-roulette-golden-sample.json` (main-spin + debate cases). Verify: `npm run check:golden brain-roulette`.

## DO NOT silently reverse
1. **`/debate` success guard must key on `claim`/`verdict`/`reveal`** (top-level schema fields). It previously guarded `!parsed.position_b` — a phantom field the schema never emits (leftover from an old two-sided-debate schema) → **every debate call returned 500**. The debate case in the golden guards this (check-golden asserts HTTP 200 + sections present).
2. **`verdict` enum values stay clean** (`mostly_false | misleading | its_complicated | surprisingly_true`) — the frontend switches on them for color/label. No glued annotations.
3. Debate guess buttons live in a real flex container (`flex flex-col sm:flex-row gap-2`); the `flex-1` children were previously in a non-flex parent (rendered as gapless full-width blocks).
4. `sessionHistory` cap of 200 is intentional (knowledge-graph / spaced-repetition needs it) — not the usual ≤50.
5. No currency (language-only localization; correct — do not add `withLocaleContext`).
