# MoneyDiplomat — architecture & lock notes

**Known-good:** tag `moneydiplomat-v1` · golden `audit/money-diplomat-golden-sample.json`
**Verify:** `npm run check:golden money-diplomat` (backend up: `npm run dev:backend`)

## What it is
A "social money" tool covering 18 awkward-money scenarios + Quick Math, debt tracker, conversation
simulator, usage trends, and a persistent profile. Frontend `src/tools/MoneyDiplomat.js`
(~1950 lines). Backend `backend/routes/money-diplomat.js` — **25 endpoints** under
`/api/money-diplomat-*`, all `claude-sonnet-4-6`, all with `withLanguage` + `withLocaleContext`.
The frontend dispatches scenario endpoints via `money-diplomat-${activeType}` (18 activeTypes all
map to real endpoints).

## DO NOT silently reverse (the locked fixes)
1. **No hardcoded `$` exemplars in the prompts.** 37 `$`-prefixed exemplars (placeholders like
   `$XX.XX`/`$XXX/month` and few-shot examples like `$75`, `$18/month`, `$XXX,XXX`) were stripped —
   they fought the `withLocaleContext` directive and caused symbol-less / USD-anchored amounts for
   non-USD users. **The strip regex is `$` immediately followed by a digit or `X`** — it never
   touches `${...}` template interpolations (103 of them). Keep amounts symbol-free in the prompts;
   `withLocaleContext` supplies the currency.
2. **Amount fields ask for a compact figure "in the user's currency," not `(number)`.** Six
   currency fields (tip `amount`, split person `amount`, roommate/subs monthly `amount`, work
   `amount`, group settlement `paid_so_far`/`fair_share`/`owes_or_owed`/transaction `amount`) used
   `(number)` or bare `XX` placeholders → the model returned a bare number and the frontend (which
   renders these RAW) showed e.g. `10` with no symbol. They now request a compact figure in the
   user's currency (e.g. `£24`). Verified: tip `amount` went bare `10` → `£10` (GBP) / `$16.00`
   (USD). Don't revert to `(number)`.
3. **All 25 endpoints on `claude-sonnet-4-6`** + withLanguage + withLocaleContext. All 21 guarded
   endpoints key on present, non-nullable fields — guards are correct, don't make them nullable.

## Frontend
- **AI-result amounts are rendered raw** — the model must format currency (that's why #1/#2
  matter). **Client-side Quick Math / trackers use `formatCurrency()`** (correct, locale-aware).
- **Scenario picker is `grid grid-cols-2 sm:grid-cols-4`** (was `grid-cols-3`). At 3 cols the
  `text-[9px]` tile descriptions crushed to ~50px and wrapped/crushed in longer locales (Spanish
  flagged). 2 cols → ~92px descriptions, readable across locales. Keep 2 cols on mobile.
- `buildFullText` covers the result types; fully localized (`md_*`, 13 languages; Spanish verified).

## Gotchas
- **Backend rate limit = 4 req/min.** `check:golden` runs the 3 cases sequentially and fits.
- **Golden cases use en-GB/GBP** to guard the currency localization (amounts must be £, not bare/USD).
- A **contextual cross-currency comparison in prose** (e.g. "£75 (≈$95) — US norms run higher")
  is acceptable and not a leak; the primary amount is correctly in the user's currency.
- **Restart the backend after route edits** (started via `node`, not nodemon).
