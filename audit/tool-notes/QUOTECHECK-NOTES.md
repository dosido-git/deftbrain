# QuoteCheck — architecture & lock notes (`quotecheck-v1`)

Brand-new tool, built end-to-end 2026-07-15 per direct user request ("One pre-DeftBrain prototype had a tool like this for car mechanics and it was very good... Let's start from scratch"). Paste a repair quote (appliance, car, or other) and get a fairness verdict, price-reality check, red flags found in the specific quote, an itemization check, repair-vs-replace guidance (appliance only), a ready-to-use negotiation script, questions to ask before approving, and a second-opinion recommendation. **Frontend:** `src/tools/QuoteCheck.js`. **Backend:** `backend/routes/quote-check.js` (1 endpoint). **Golden:** `audit/quote-check-golden-sample.json` (3 cases). **Catalog:** `src/data/tools.js`, category `Loot`, headerColor `#c0d8b8` (same family as ContractDecoder/ScamRadar/LeaseTrapDetector).

## Concept validation (before any code was written)
User's actual ask was "is my repair person ripping me off?", not a DIY diagnostic tool. Researched market fit for both car and appliance repair quote-checking:
- **Appliance**: genuine white space — no RepairPal-equivalent incumbent found; real recurring search demand ("how to avoid getting overcharged" articles independently written by many sites); usable reference price data pulled during research (fridge $125-500, washer $100-475, dryer $100-300, diagnostic fee $70-130, common over-diagnosis pattern of expensive parts vs. cheap sensors/fans).
- **Car**: real demand too, but RepairPal is deeply entrenched (#1 estimator since 2008, Fair Price Guarantee network of 3,800+ certified shops, real transactional pricing data). Decision: position QuoteCheck as a red-flags/leverage/negotiation tool for cars, NOT a pricing-precision competitor — this is baked into the SYSTEM PROMPT itself, not just a design note.
- Decided against category-narrow tools (an "ApplianceCheck" + separate "CarCheck") — the underlying evaluation logic (itemization check, parts-markup smell test, pressure-tactic red flags, the 50%-rule, negotiation script) is domain-general, so one tool with a `repairType` selector is more defensible than BikeMedic's narrow-and-deep model.

## Shape
- **1 endpoint**, `claude-opus` (`MODELS.SMART`), `max_tokens 3000`, `withLanguage(systemPrompt) + withLocaleContext`.
- Guard: `!VALID_VERDICTS.includes(parsed?.verdict)` — `verdict` ∈ `likely_fair | somewhat_high | overpriced | cant_tell`.
- `NO_QUOTE_RULE` included in the system prompt from day one (not retrofitted) — `negotiation_script` is "exact words to say," the exact field class that broke JSON in German across ~15 other tools in the earlier callClaudeWithRetry migration campaign.
- `replace_vs_repair` is **appliance-only** — backend always returns `null` for `repairType !== 'appliance'`; frontend only shows the optional `itemAge` input when `repairType === 'appliance'`. Don't add it for car/other without also teaching the prompt a car-specific replace-vs-repair framework (doesn't really apply the same way to vehicles).
- Array bounds: `red_flags` ≤5 (empty array is a valid, expected "clean quote" result — do not force-invent flags), `questions_to_ask` ≤4.

## i18n status — English only at launch, by design
- `src/i18n/locales/tools/quote-check.js` exports `quoteCheck = { en: {...} }` — only the `en` block. This is NOT an oversight: `src/i18n/index.js`'s `t()` falls back to the `en` block for any language/key it can't find (`RESOURCES[lang]?.[key] ?? RESOURCES['en']?.[key] ?? key`), so non-English users see clean English text right now, not broken `qc_*` key leaks.
- **QuoteCheck is deliberately NOT in `scripts/localization-audit.js`'s `LOCALIZED_TOOLS` allowlist yet.** Gate 5 only checks tools in that allowlist, so it correctly skips QuoteCheck for now. Adding the other 12 languages + registering in `LOCALIZED_TOOLS` is the natural next step (see `deftbrain-localization-rollout` memory for the batch workflow) — not required for this to be a working, shippable v1.
- Reused existing shared base keys (`try_example`) instead of duplicating a `qc_`-prefixed equivalent.

## Audit gotchas hit while building (fixed same session, not retrofitted later)
1. **S5.5 false "no pre-result cross-ref"** — the cross-ref link lived only inside the `renderInput()` render-function body. `audit_v2-3-2.py`'s region scanner (S5.5) only recognizes hrefs directly in the top-level `return(...)` JSX or inside a function literally named `renderResults`/`renderOutput`/`renderAnswer` — hrefs inside any other named render helper (like `renderInput`) are invisible to it in either the pre- or post-result region. **Fix:** added a duplicate cross-ref line directly in the top-level return, above `{!results && renderInput()}` — matches the existing (slightly redundant-looking but gate-passing) pattern already used by ContractDecoder, which shows its LeaseTrapDetector cross-ref twice for the same structural reason.
2. **F3/PF-21 "chained results access without optional chaining"** — most of the flagged accesses were already guarded by an outer `{results?.field && (...)}` JSX condition, but the audit script is a blanket regex check with no understanding of JSX control flow — it flags `results.a.b` regardless of surrounding guards. Fixed by adding `?.` at every level throughout `renderResults()` and `buildFullText()`, even where a guard already made it runtime-safe. Treat this as the expected posture for all future tools, not something to argue with case-by-case.

## DO NOT silently reverse
1. The car-repair red-flags/leverage positioning in the system prompt (never claim RepairPal-grade pricing precision for vehicles).
2. `replace_vs_repair` staying `null` for non-appliance repair types.
3. The duplicated pre-result cross-ref (inside `renderInput()` AND in the top-level return) — removing either one risks either a UX gap or an S5.5 audit failure.
4. English-only i18n block — do not add stub/placeholder translations to the other 12 languages just to "fill them in"; either do a real localization pass (translate properly) or leave them absent so the `en` fallback serves clean text.

## Known / accepted
- 0 baseline audit issues across all 3 files (syntax, eslint, guard-keys, diff-audit) — clean from the first pass since built against the current conventions, not retrofitted.
- Browser-verified: full submit flow (appliance example), dark mode rendering of every result section (verdict card, price reality check, red flags, itemization check, replace-vs-repair, negotiation script, questions, second opinion, cross-refs), PF-16 reset button behavior, ActionBar Copy/Print registration, zero console errors.
- Live-verified 3 scenarios: appliance compressor-vs-evaporator-fan misdiagnosis (English, verdict varied `cant_tell`/`overpriced` across runs — appropriately non-deterministic given genuinely ambiguous evidence), car all-four-caliper red flag (English, correctly hedged confidence + `replace_vs_repair: null`), and a German case with deliberately quoted third-party technician speech in `whatTheyToldYou` (zero truncation, zero invalid JSON, correct EUR currency).
