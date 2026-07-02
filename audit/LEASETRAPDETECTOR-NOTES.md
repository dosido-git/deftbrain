# LeaseTrapDetector — architecture & lock notes (v1, 2026-07-01)

Lease analysis: flags illegal/exploitative clauses, hidden fees, missing protections; money + legal-adjacent. In `LOCALIZED_TOOLS`.

- **Model:** all 7 endpoints `claude-sonnet-4-6` + `withLocaleContext`. Main endpoint `max_tokens 7000`.
- **Endpoints:** `/api/lease-trap-detector` (main), `/followup`, `/compare`, `/draft-email`, `/amendment`, `/checklist`, `/renewal-traps`.
- **Golden:** `audit/lease-trap-detector-golden-sample.json` (trap-heavy Spanish + typical English — both guard truncation; the Spanish one also guards the non-English path). Verify: `npm run check:golden lease-trap-detector` (~2-3 min/case; harness timeout is 180s/case, observed 105-140s).

## DO NOT silently reverse
1. **Content array passed RAW** to `messages[].content` — never through `withLanguage()`. `withLanguage` string-interpolates, so wrapping the array (`[{document PDF}, {text}]`) produced `"[object Object],[object Object]…"` for every non-English user → the lease was silently dropped. The language directive already rides on `system:` via `withLanguage(systemPrompt,…)+withLocaleContext(…)`.
2. **REDUCED main schema — do not re-expand it.** The original ~12-section schema emitted ~7000+ tokens for ANY lease → truncation-500s (even at max_tokens 12000 on complex/Spanish leases) and 300-420s runtimes (gateway 502). The reduction (2026-07-01):
   - `red_flags` 12→8 fields (cut why_problematic / what_lease_says / what_law_says / landlord_likely_response — merged into concern/your_rights)
   - `yellow_flags` 7→5 (cut why_concerning, landlord_likely_response)
   - `security_deposit_analysis` 13→8 (cut interest_details, walkthrough_details, permitted/prohibited_deductions arrays; booleans kept for the 3-tile UI)
   - `missing_disclosures` array REMOVED — legally-required disclosures are folded into `missing_protections` items
   - `negotiation_strategy` 7→4 (cut compromise_positions, leverage_points, market_context)
   - `resources` 5→3 (cut contact, notes — model must not invent contact details anyway)
   - `unusual_fees` 7→5 (cut lease_reference, specific_law)
   - OUTPUT LIMITS caps: red ≤5, yellow ≤4, green ≤3, unenforceable ≤4, missing ≤5, fees ≤4, resources ≤3 + single-sentence rule.
   Deep detail on any clause lives in the **follow-up Q&A** endpoint — that's the intended path, not schema re-expansion. A max_tokens bump alone does NOT fix truncation here (tested: 8000 and 12000 both truncated pre-reduction); the caps are the fix.
3. **`stop_reason === 'max_tokens'` fast-fail** before parse (main + missing endpoints) — a truncated response must return the clear "too long" error, not a cryptic parse-500 after retries.
4. Enum values clean (no glued `(number)`/`(true/false)`): `is_legal`, `renewal_type`, `priority` — frontend switches on them.
5. Money fields locale-neutral ("amount in the user's local currency"), NOT "dollar amount" (fought `withLocaleContext`).
6. Legal citations hedged: cite statutes only when confident; label uncertain ones ("commonly cited as / verify locally"); never invent resource phone numbers/URLs.
7. **Time notice** (`ltd_time_notice`, 13 languages) under the analyze button — "usually takes 1–3 minutes." Analysis is genuinely ~2 min; keep expectations honest.
