# Giftology — architecture & lock notes (`giftology-v1`)

Gift-panic helper: describe the recipient → 3-4 personal "perfect picks" (with reasoning chain,
price, where to get, card message), a wildcard, a deadline-is-now option, and a "never do this".
**Frontend:** `src/tools/Giftology.js` (in `LOCALIZED_TOOLS`, `gft_` keys). **Backend:**
`backend/routes/giftology.js` (single endpoint). **Golden:** `audit/giftology-golden-sample.json`
(1 case). Verify: `npm run check:golden giftology` (~60s; card-message-heavy).

## Shape
1 endpoint `/giftology`, `claude-sonnet-4-6` (`MODELS.SMART`), **`max_tokens 3500`**, via
`callClaudeWithRetry` + `withLanguage` + `withLocaleContext`. Guard `!perfect_picks && !gifts`
(perfect_picks is top-level, always-present; `gifts` a legacy alias) ✅.

## Audit fixes locked here (2026-07-12)
1. **🐛 USD-anchoring.** `price_range` was exemplified `"$XX - $XX"` (both perfect_picks and
   the_wildcard) — hardcoded `$` fighting `withLocaleContext`, so EUR/GBP users got dollar ranges.
   `price_range` renders **raw** (frontend does not reformat — the model owns the string). **Fix:**
   `"a realistic low–high price range in the user's local currency"` + a rule "price_range values
   must be in the user's local currency (never assume US dollars)" + de-dollarized a `$20`-in-prose
   exemplar in `card_message`. Verified live: German/EUR returns `16 € – 22 €` etc., no `$`.
2. **⚠️ Truncation risk.** Only endpoint at `max_tokens 2000` (3-4 picks × 6 fields incl. 2-4
   sentence `card_message` + wildcard + deadline block). **Fix:** `max_tokens` 2000 → **3500** +
   "EXACTLY 3-4 perfect_picks" cap + brevity line.
3. **⚠️→cleaned: 14 annotation leaks** — `— one sentence` ×11 (glued onto `gift`, `where_to_get`,
   `never_do_this` — copy-paste output) + a double-annotation on `never_do_this`. Stripped; kept
   the legit `— 2-4 sentences` on `card_message`.

## DO NOT silently reverse
1. NO hardcoded `$` exemplars in `price_range` or prose — always "the user's local currency".
   The frontend renders `price_range` raw; the model must format it.
2. `max_tokens >= 3500` + "EXACTLY 3-4 perfect_picks".
3. NO annotation suffixes on `gift`/`where_to_get`/`never_do_this`; keep `— 2-4 sentences` on card_message.

## Known / accepted
- Card-message-heavy JSON occasionally parse-fails on attempt 1 → `callClaudeWithRetry` recovers.
