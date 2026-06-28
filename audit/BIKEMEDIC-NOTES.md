# BikeMedic — architecture & lock notes

**Known-good:** tag `bikemedic-v1` · golden `audit/bike-medic-golden-sample.json`
**Verify:** `npm run check:golden bike-medic` (backend up: `npm run dev:backend`)

## What it is
A bicycle repair/diagnostic tool. Frontend `src/tools/BikeMedic.js` (~2720 lines): bike garage
(profiles + mileage + ride log), freeform AI diagnosis (optional photo), guided fix trees, a
local `FIXES` guide database (61 entries), seasonal + custom prep checklists, and a DIY-savings
hub. Backend `backend/routes/bike-medic.js` — one endpoint, **5 modes**, all `claude-sonnet-4-6`:

| Mode | Path | Retry |
|---|---|---|
| Type 1 — freeform diagnosis (photo-capable) | direct `anthropic.messages.create` | 3-attempt inline loop |
| Type 2 — post-fix follow-up (photo-capable) | same path | same |
| `route` — symptom routing | `callClaudeWithRetry` | yes |
| `seasonal` — seasonal checklist | `callClaudeWithRetry` | yes |
| `custom_check` — situation checklist | `callClaudeWithRetry` | yes |

Types 1 & 2 bypass `callClaudeWithRetry` because the photo path needs a multipart content array
(image + text blocks) and the helper takes a string prompt only.

## DO NOT silently reverse (the locked fixes)
1. **`parts_cost` follows the rider's region/currency, not USD.** Types 1 & 2 append
   `withLocaleContext(userLocale, userCurrency, userRegion)` to the prompt, and the schema's
   `parts_cost` carries NO hardcoded `$` exemplar (it said `"$0 (adjustment only) or cost
   estimate"`). Before the fix, English-language non-USD users (en-GB/AU/CA/IN) got `$` costs.
   Verified: en-GB/GBP now returns `£`. The golden's `diagnosis-freeform-engb-currency` case
   guards this — re-running it must yield GBP, not USD. (seasonal/custom/route have no cost field.)
2. **Types 1 & 2 `create()` is wrapped in a 3-attempt retry loop.** It used to be a bare
   `await anthropic.messages.create(...)` — the most-used (and only photo) path had no retry while
   the other three modes did. Keep the loop; preserve the multipart `messageContent`.
3. **All 5 modes on `claude-sonnet-4-6`.**
4. **`fix_ref` allowlist ⇄ `FIXES` keys.** The seasonal/custom prompts hand the model a 17-id
   `fix_ref` allowlist; every id MUST exist as a key in the frontend `FIXES` DB (verified: all 17
   present among 61 keys) or the "view guide" link silently won't render. Keep them in sync.

## Deliberate design (don't "fix")
- **DIY-savings hub uses `sym` + fixed `SHOP_COSTS` numbers** — the user's currency *symbol* with
  fixed reference figures (not converted). A deliberate simplification, separate from the
  AI-generated `parts_cost`. Left as-is.
- Seasonal checklist is **evergreen** (prompt forbids referencing the current year so it's reusable
  across years).
- Good safety/AI disclaimers present (`bmd_ai_disclaimer`, ride-safe badges).

## Mobile (render-layer, NOT in golden)
- Home + describe panel clean at 375px (no overflow/crush). The diagnosis result card is
  mobile-safe by construction: single-column `space-y-4`, `flex-wrap` badge/tool rows, numbered
  lists as `flex gap-3` (fixed-small number badge + flexible wrapping text). Spanish renders, no
  raw keys. Tool's selects are 12px (iOS-zoom, catalog pattern).

## Gotchas
- **Backend rate limit = 4 req/min.** `check:golden bike-medic` runs 3 cases sequentially and fits.
- The backend must be **restarted** to pick up route changes (started via `node`, not nodemon).
- Fully localized (in `LOCALIZED_TOOLS`); `bmd_*` keys in `src/i18n/locales/tools/bike-medic.js`.
