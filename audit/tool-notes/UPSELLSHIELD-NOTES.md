# UpsellShield — audit lock notes (`upsellshield-v1`, 2026-07-14)

Backend `upsell-shield.js` — 1 endpoint `POST /upsell-shield`, `MODELS.SMART`, max_tokens 3750→**4500**. Arms the user against high-pressure sales tactics.

## 🐛 PF-2 was FAILING Gate 2 (push blocked)
The frontend c-block had no `labelText` key and neither PF-2 alias, so `npm run audit --max-warnings=0` failed — any lock push was blocked. **Fix:** added `labelText` + `c.textMuteded` + `c.label`.

## Other fixes
- **German unescaped double-quotes:** output is rehearsed quoted scripts (`your_counter`, `walk_away_line`, `power_questions[].question`) → 500 in German. Added the no-inner-double-quote rule.
- **`insider_price` (USD-anchor / raw money):** was annotated `(number)` and rendered raw; relied only on `withLocaleContext`. Changed to an explicit local-currency directive ("expressed in the user's local currency — never assume US dollars") and dropped `(number)`. Verified live (DE/EUR): `13.900 EUR`, no `$` anywhere in output.
- **Truncation:** capped `their_playbook` to 5 (was 5-7), `power_questions` to 4 (was 4-5), max_tokens 3750→4500. Verified live: 5 tactics + 4 questions, no truncation (55s — SMART + verbose German).
- **Annotation leaks:** stripped 13 (`— one sentence`, `— 3-6 words`, `(number)`) that reached cards + copy output; global brevity rule.

## Not bugs
- No i18n-enum (no verdict/recommendation enum, nothing frontend-switched on a localized value).
- Guard `!parsed.situation_read || !Array.isArray(parsed.their_playbook)` keys two top-level fields. Correct.
- `sessionHistory` key `upsellshield-history`, consistent.

## Verify
`npm run check:golden upsell-shield` (1 DE/EUR case). insider_price must render in the user's currency, no `$`. Backend must be up.
