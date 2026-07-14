# PartyArchitect — architecture & lock notes (`partyarchitect-v1`)

Designs a full event experience — energy curve, timed run-of-show, mixing strategies, food/music
plans, exit script, budget breakdown. **Frontend:** `src/tools/PartyArchitect.js`. **Backend:**
`backend/routes/party-architect.js` (1 endpoint, `MODELS.SMART`, **max_tokens 5000**). **Golden:**
`audit/party-architect-golden-sample.json`. Verify: `npm run check:golden party-architect`.

## Audit fixes locked here (2026-07-14)
Healthy tool — **no guard** (it `toArray()`-coerces the four list fields then `res.json`; do not add a
naive `!parsed.X` guard). No hard-down bug.
1. **⚠️→🐛 Truncation.** `timeline` "6-8 entries" (heavy: 5 fields each) was uncapped at `max_tokens
   3750`; verbose German could truncate → 500. **Fix:** cap timeline ≤8 + `max_tokens 5000`.
   Verified DE: 8 entries, ~2546 tok.
2. **⚠️ USD-anchor.** `budget_breakdown.total_estimate` / `biggest_expense` render raw with no currency
   instruction. **Fix:** "express all money amounts in the user's local currency, never assume US
   dollars". Verified DE: "ca. 150–220 EUR…", 0 raw `$`.
3. **⚠️→cleaned:** 20 annotation leaks (`— one sentence` ×19, `— 2-4 sentences` on the_exit.script);
   kept the "2-4 sentences" allowance for the_exit.script as an instruction, not an inline suffix.
   Added the no-inner-double-quote rule.

## DO NOT silently reverse
- timeline cap + `max_tokens 5000`; local-currency money instruction; no annotation suffixes; the
  no-inner-double-quote rule; NO `!parsed.X` guard.
