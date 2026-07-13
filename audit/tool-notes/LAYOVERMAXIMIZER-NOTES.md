# LayoverMaximizer — Architecture & Decision Record

Known-good baseline: **tag `layovermaximizer-v1`**, golden **`audit/layover-maximizer-golden-sample.json`**
(2 of 7 endpoints — both `/layover-maximizer` cases, guarding the two audit fixes). Approved for
Prime Time after a full audit. **Read before changing.**

## Shape (`backend/routes/layover-maximizer.js`, ~560 lines)

Seven endpoints, all **`claude-sonnet-4-6`** via `callClaudeWithRetry` + `withLanguage` +
**`withLocaleContext`** (on the `system:` field). Frontend `src/tools/LayoverMaximizer.js` (~1845
lines): all sections rendered, 10 inputs reach the route, `userLanguage`/locale auto-injected.

| endpoint | max_tokens | guard |
|---|---|---|
| `/layover-maximizer` (plan) | 4000 | `verdict` |
| `/lounge` | 5000 | (tailored) |
| `/risk` | 2000 | (tailored) |
| `/gate-to-gate` | 2000 | (tailored) |
| `/compare` | 3000 | (tailored) |
| `/packing` | 4000 | (tailored) |
| `/survival-kit` | 2000 | (tailored) |

## DO NOT silently reverse

1. **CONSISTENT NUMBERS for time_math (FIX #1, 2026-06-25).** The main prompt requires
   `time_math.available_city_minutes` to EQUAL `total_layover_minutes` minus all six deductions
   (deplane_and_walk + immigration_exit + transit_to_city + transit_from_city + security_reentry +
   buffer), with `breakdown_explanation` stating the same figure. Without it the model intermittently
   contradicted itself (DXB: available 310 vs breakdown 350 — a 40-min error in the tool's CORE
   number, which drives the leave/stay verdict and could blow a tight connection). The `main-dxb`
   golden case guards it (must reconcile).
2. **`withLocaleContext` + NO hardcoded `$` exemplars (FIX #2).** All 7 `system:` fields append
   `withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion)`, and the
   absolute-cost schema exemplars (`cost_estimate`, `day_pass_price`, lounge `cost`) are
   currency-NEUTRAL ("in the traveler's local currency"). Before, the schema hardcoded `$5-8`/`$50`
   with no locale context → every traveler got USD. Now costs follow locale (FRA → EUR, e.g.
   "6,20 €"). Do NOT reintroduce `$` absolute-amount exemplars — they fight the directive
   (CLAUDE.md rule). The `main-fra-eur` golden case guards it. (Relative price tier `price_range:
   "$-$$$$"` is left as-is — a universal tier indicator, not an absolute amount.)
3. **Model `claude-sonnet-4-6`; max_tokens main=4000** (verified no truncation; a 10-h big-hub
   layover is ~11.5 KB, getting close — don't lower). **Guard `!parsed.verdict`** (correct).

## Known-and-accepted

- **Latency 50-76 s** on the main plan (the schema demands many "real, specific" items — 4 food +
  3 lounges + transit + itinerary + practical). Acceptable for a deep tool; trimming list sizes
  would speed it up if it ever matters.
- **Facts are model-generated.** Verified accurate for major hubs (ORD: CTA Blue Line / Tortas
  Frontera; DXB: Dubai Metro Red Line / Careem). Reliability drops for obscure airports — the tool
  hedges with "worst-case estimates."

## Verifying a change

1. Run the 5 gates (necessary, not sufficient).
2. Dev backend up: **`npm run check:golden layover-maximizer`** — re-runs both cases (structure).
3. Eyeball the two invariants: (a) `main-dxb` time_math reconciles (available = total − deductions);
   (b) `main-fra-eur` costs are in EUR, not USD.
