# HobbyMatch — architecture & lock notes (`hobbymatch-v1`)

Recommends 5 personalized hobbies (+ a wildcard) from personality/schedule/budget. **Frontend:**
`src/tools/HobbyMatch.js` (`hm_` keys). **Backend:** `backend/routes/hobby-match.js` (single
endpoint, `MODELS.FAST` = haiku, `max_tokens 4000`). **Golden:** `audit/hobby-match-golden-sample.json`
(1 DE/EUR case). Verify: `npm run check:golden hobby-match`.

## Audit fixes locked here (2026-07-13)
1. **🐛 `startup_cost` USD-anchor + (number) leak.** Rendered RAW in a badge (`HobbyMatch.js:349`)
   + copy; schema was `"...free, under $50, under $200, etc. (number)"` → EUR/GBP users got `$`, and
   `(number)` on a string field. **Fix:** `"a short phrase in the user's local currency … never assume
   US dollars"`. Verified live (EUR): `'20–40 EUR'`, no `$`.
2. **⚠️→cleaned: 9 annotation leaks** (`— one sentence` ×6, `— 3-6 words` ×2 on name/wildcard/pattern).
3. **⚠️ Truncation:** unbounded "5-6" hobbies at `max_tokens 3000`. **Fix:** EXACTLY 5 + `max_tokens`
   → **4000**. Verified DE: ~2.5K tokens. `energy_type` enum (solo|social|both) already clean.

## DO NOT silently reverse
1. `startup_cost` is a short currency-neutral phrase (NO `$` exemplars, NO `(number)`) — rendered raw.
2. EXACTLY 5 hobbies + `max_tokens 4000`; no annotation suffixes; keep `energy_type` enum clean.
