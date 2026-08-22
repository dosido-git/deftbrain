# DeftBrain — five-tool cleanup

Source: `deftbrain-2026-08-22.zip`

## Brain Dump Buddy
- Rewrote SEO description so it classifies thoughts by what they require rather than labeling them as worries/noise to drop.
- Rewrote guide overview to remove unsupported generalizations about overwhelm and to reflect the current action/decision/communication/waiting/nothing-right-now contract.

## Bookmark
- No code changes required in this patch. Current implementation passed this review.

## Brain Roulette
- No code changes required in this patch. Current implementation passed this review.

## Bike Medic
- Rewrote SEO description to avoid “diagnose/fix any bike problem” and “mechanic” overclaims.
- Rewrote guide overview and How to Use language from exact diagnosis to narrowing likely causes.
- Changed the English fallback label from “Ask the AI mechanic” to “Describe what’s happening.”

## Buy Wise
- Removed remaining prompt instructions that pressured the model to fabricate current-market knowledge when no price was supplied.
- Replaced “best price NOW,” imminent-sale, and sale-calendar instructions with supplied-price/terms evaluation and durable sale-cycle guidance.
- Removed the instruction to include “real prices” in buy-vs-subscribe/rent analysis unless prices were supplied by the user.
- Changed SEO title from “Purchase Research Tool” to “Purchase Decision Helper.”
- Changed the final How to Use step from “Hit Research” to reviewing analysis, tradeoffs, costs, and verification items.

## Validation
- `node --check` passed for all three changed JavaScript files.
- `npm run build` completed the prebuild generators, but the React build could not start because dependencies are not installed in this uploaded snapshot (`react-scripts: not found`).
- `npm run check:golden` could not execute cases because the local backend was not running; no golden-output claim is made.

## Files in this patch
- `backend/routes/buy-wise.js`
- `src/data/tools.js`
- `src/i18n/locales/tools/bike-medic.js`
