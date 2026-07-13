# HistoryToday — architecture & lock notes (v1, 2026-07-01)

Structural-parallel finder: given a current event, returns 2 historical parallels + synthesis. In `LOCALIZED_TOOLS` (13 languages).

- **Model:** main + counter = `claude-sonnet-4-6`; deeper = `claude-haiku-4-5`. All via `callClaudeWithRetry`.
- **Endpoints:** `/api/history-today` (main), `/api/history-today-deeper`, `/api/history-today-counter`.
- **Golden:** `audit/history-today-golden-sample.json` (real-event + false-premise cases). Verify: `npm run check:golden history-today`.

## DO NOT silently reverse
1. **Endpoint names must be `history-today*`** in the frontend `callToolEndpoint` calls (HistoryToday.js). A 2026-05 find-replace corrupted them to `sessionHistory-today*` → 404 on every action. The `usePersistentState` localStorage keys legitimately keep the `sessionHistory-today-*` prefix — do not "fix" those.
2. **Main = exactly 2 parallels + bounded nested arrays** (≤2 structural_similarities, ≤2 where_it_breaks_down / key_figures, ≤2 further_reading; what_happened 2-3 sentences), `max_tokens 8000`. This is a latency + truncation fix: the unbounded 2-3 parallel schema overran the token budget → truncated JSON → `callClaudeWithRetry` retried 3× → Railway edge proxy **502** after ~3 min. Bounding it keeps output complete AND fast (~55-65s). A `max_tokens` bump alone does NOT fix it (just moves the truncation point) — keep the array caps.
3. **`premise_check {status, assessment}`** (status: sound|false_premise|unverifiable|not_current_event) must lead the results. The REALITY & RELEVANCE CHECK prompt block makes the tool correct false/inverted/conspiracy premises up front instead of dignifying them as neutral "counterfactuals." Frontend renders it as a banner ABOVE the parallels (red for false_premise); status='sound' emits no banner. Do not drop the field or bury the correction.
4. Deeper prompt: only include `echoing_quotes` that are genuinely real/attributed (omit rather than invent).
