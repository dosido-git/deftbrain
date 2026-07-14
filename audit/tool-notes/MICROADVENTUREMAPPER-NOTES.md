# MicroAdventureMapper — architecture & lock notes (`microadventuremapper-v1`)

Local micro-adventure itinerary builder. **Frontend:** `src/tools/MicroAdventureMapper.js`.
**Backend:** `backend/routes/micro-adventure-mapper.js` (1 route, 3 actions: generate/regenerate/swap,
`MODELS.FAST`, raw `anthropic.messages.create` with a local 3-try retry loop). **Golden:**
`audit/micro-adventure-mapper-golden-sample.json`. Verify: `npm run check:golden micro-adventure-mapper`.

## Audit fixes locked here (2026-07-13)
1. **🐛 SWAP was DOWN (500 every call).** The swap schema emits `{stops, transit_between}` and NO
   `adventure`, but the guard checked `!data.adventure` → 500 on every stop-swap. **Fix:** `!data.stops`.
2. **🐛 USD-anchor on raw-rendered cost fields.** `total_cost` (`"Free – $15"`), `stops[].cost`,
   `rainy_backup.cost` (`"$5-15"`) rendered raw → EUR users saw `$`; `budgetMap` also injected `$0-20`.
   **Fix:** all cost fields → "in the user's local currency, never US dollars"; budgetMap tiers de-dollarized.
   Verified DE: `total_cost` = "20–35 EUR", 0 raw `$`.
3. **⚠️ regenerate under-budget.** Same full schema as generate but `max_tokens 3000` vs 4000. **Fix:** 4000.
4. **⚠️ dead `rainy_backup.stops`.** Emitted + leaked but never rendered. **Fix:** removed from schema.
5. **⚠️ broken EXAMPLE[1].** `when:'this_weekend'` isn't a valid WHEN_OPTIONS value → no pill highlighted
   + raw passthrough. **Fix:** `'weekend'`.
6. **⚠️→cleaned:** ~23 annotation leaks (`— 3-6 words`/`— one sentence`/`(number)`); replaced with ONE
   global brevity + caps line in SYSTEM_PROMPT (3-5 stops, ≤8 what_to_bring).

## DO NOT silently reverse
- swap guard `!data.stops`; local-currency cost fields (rendered raw); regenerate `max_tokens 4000`;
  no `rainy_backup.stops`; no annotation suffixes; the brevity+caps line in SYSTEM_PROMPT.
