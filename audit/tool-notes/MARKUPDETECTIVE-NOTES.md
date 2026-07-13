# MarkupDetective — architecture & lock notes (`markupdetective-v1`)

Pricing forensics: reverse-engineers a product's true cost structure (breakdown, markup multiplier,
tactics, how to pay less). **The localization reference tool** (i18n is exemplary). **Frontend:**
`src/tools/MarkupDetective.js` (`md_` keys). **Backend:** `backend/routes/markup-detective.js`
(single endpoint, **`MODELS.DEEP` = Opus 4.8**, `max_tokens 2500`). **Golden:**
`audit/markup-detective-golden-sample.json` (1 DE/EUR case). Verify: `npm run check:golden markup-detective`.

## Audit fixes locked here (2026-07-13)
1. **🐛 Numeric fields rendered as string/CSS.** `markup_multiplier` (rendered `{value}x` + parseFloat
   for color) and `cost_breakdown[].percent` (rendered as a raw `style width ${parseFloat(percent)}%`
   bar) were string instructions with `— one sentence` / `(number)` annotations → prose breaks the
   `x`/bar. **Fix:** bare-number schema examples (`7.1` / `14`) + an explicit "BARE NUMBERS" rule.
   Verified live: `markup_multiplier: 5.3`, percents `[6,4,9,24,29,28]` (all numeric).
2. **🐛 USD-anchoring.** The systemPrompt ("specific dollar amounts", `~$1`/`$1.50` exemplars) + the
   amount-field examples (`'$6.00'`/`'$0.85'`/`'$2.50'`) hardcoded `$`, and amounts render RAW (no
   formatCurrency). EUR/GBP users got `$`. **Fix:** de-dollarized the systemPrompt + fields → "in the
   user's local currency"; dropped the self-contradictory `(number)` on the currency-STRING fields.
   Verified live (EUR): `true_cost: '0,85 €'`, `fair_price: '3,20 €'`, no `$`.
3. **⚠️→cleaned: 8 `— one sentence` annotations** stripped.

## DO NOT silently reverse
1. `markup_multiplier` + `cost_breakdown.percent` are **bare numbers** (schema examples 7.1 / 14) — rendered as `x`/CSS-width.
2. NO `$` exemplars in the systemPrompt or fields — amounts in the user's local currency (rendered raw).
3. Opus 4.8 (`MODELS.DEEP`); no annotation suffixes.
