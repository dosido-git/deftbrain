# QuoteCheck — architecture & lock notes (`quotecheck-v2`)

Paste a repair quote (appliance, car, or other) — or upload a photo/PDF of the actual invoice
— and get an audit of what the quote actually says, not an invented fairness verdict. **Frontend:**
`src/tools/QuoteCheck.js`. **Backend:** `backend/routes/quote-check.js` (1 endpoint, `MODELS.SMART`).
**Golden:** `audit/quote-check-golden-sample.json` (5 cases, including the two real base64 test
files for the upload cases). **Catalog:** `src/data/tools.js`, category `Loot`.

## V2 rewrite (2026-09-07) — audit the quote you have, not the quote you wish you had

The V1 prompt asserted that appliance repair price ranges are "relatively well-established" and
reasoned about them with "medium-to-high confidence," actively diagnosed a cheap part vs. an
expensive one from a one-line symptom description ("a relatively cheap, common-failure part...
being diagnosed as an expensive core component... without a clear explanation of how they ruled
out the cheaper cause first"), asserted a diagnostic fee is "industry-normal" to credit toward
repair, and used a hard "repair costing more than roughly half of a realistic replacement cost is
usually not worth it" rule. All of it sounded specific and confident; none of it is something an
LLM with no live pricing data or an actual look at the appliance can know.

**What changed:**

1. **Verdict enum, fully replaced**: `likely_fair | somewhat_high | overpriced | cant_tell` (a
   fairness claim) → `LOOKS_STRAIGHTFORWARD | NEEDS_CLARIFICATION | HARD_TO_COMPARE |
   SPECIFIC_CONCERNS_FOUND | NOT_ENOUGH_INFORMATION` (an audit-completeness claim).
   `LOOKS_STRAIGHTFORWARD` explicitly does NOT mean the price is proven fair — the prompt says so
   directly, and the guard's `require: verdict_matches_the_evidence_supplied` backs it.
2. **`price_reality_check` (typical_range + confidence) removed entirely** — no field anywhere
   invites a made-up market price range. Replaced by `quote_summary` (extracted from what was
   typed/uploaded, never assumed) and `arithmetic_check` (only when the numbers to check are
   actually present).
3. **Red flag vs. question to clarify, now structurally separated**: `red_flags` (any missing
   detail could become one) → `specific_concerns` (grounded only — arithmetic error, duplicate
   charge, unexplained fee, missing promised warranty, explicitly reported pressure tactic) +
   `unknowns_that_matter` (missing information that limits evaluation but isn't evidence of
   wrongdoing). A lump-sum quote with no diagnostic writeup is now an unknown, not a red flag.
4. **`document_discrepancies`** (new) — when an uploaded document and the typed answer disagree,
   both are shown side by side rather than the model silently picking one.
5. **`repair_vs_replace`** — dropped the universal ~50%-of-replacement-cost rule and any
   age→lifespan inference; `applies` is now genuinely dynamic (not hardcoded to
   `repairType === 'appliance'`), and `missing_information` lists what's needed rather than the
   model inventing the replacement side of the comparison.
6. **`negotiation_script` → `what_to_say`** — no longer automatically a negotiation posture; the
   prompt explicitly says the right first move is often a clarifying question, and bans putting
   an unsupported technical claim in the visitor's own mouth (the V1 example prompt literally
   invited "my understanding is those are more common causes...").
7. **`second_quote.scope_comparable`** (new, YES/NO/UNKNOWN) — a second price is not automatically
   a comparable quote; the prompt requires checking scope before treating a gap as meaningful.
   New frontend field `secondQuoteBreakdown` collects what the second quote covers.
8. **`safety_note`** (new) — for a plausible safety issue (brakes, gas, electrical), states what
   condition warrants stopping use, without diagnosing the hazard itself.
9. **`second_opinion`**: `recommended: boolean` → `assessment: WORTH_CONSIDERING |
   MAY_NOT_ADD_MUCH | NOT_ENOUGH_TO_TELL`, matching the "don't force a binary verdict" pattern
   used across the tool.

**Frontend**: input reordered/relabeled to match the owner's spec (item hint about make/model,
"what does the quote include" instead of "itemized breakdown," second-quote breakdown field,
item-age field no longer appliance-gated since `repair_vs_replace.applies` is dynamic now). Result
reordered: recap → verdict → safety note (if any) → quote summary → document check (if any) →
arithmetic (if possible) → specific concerns (with an explicit "no concerns found ≠ fair price"
caveat line when empty) → unknowns → second quote (if provided) → repair-vs-replace (if applies)
→ questions → what-to-say → second opinion. Persisted result key bumped
`quotecheck-results` → `quotecheck-results-v2`.

**Recent/history rebuilt**: previously stored only `{preview, verdict, ts}`. Now stores the full
`input` snapshot and the full `result` per check (`quotecheck-history-v2`, still capped at 8).
Each entry gets **View** (restores the stored result instantly, no API call — `viewFrom()`) and
**Recheck** (restores only the original *inputs* into the editable form, never the model's own
prior conclusions — `recheckFrom()` — so the visitor can add new information and get a fresh
analysis rather than being fed their own past AI output as if it were a new fact).

## Output standard: v2, WITH a working enforcement profile (unlike PronounceItRight)

Declared `router.outputStandard = 'v2'` and wired `runOutputGuard()` with a tool-specific
`outputGuard.prohibit` list (`invented_price_range`, `invented_industry_norm`,
`remote_diagnosis`, `missing_info_called_a_red_flag`, `universal_repair_vs_replace_threshold`,
`lifespan_inferred_from_age_alone`, `unsupported_technical_claim_in_script`,
`second_quote_compared_without_scope_check`). Unlike PronounceItRight (a reference/knowledge tool
where the generic guard couldn't verify a phonetic claim any better than the model that wrote
it, and made things worse when tried), QuoteCheck's failure modes are almost entirely "the
visitor's own supplied situation, invented or twisted" — exactly the guard's designed domain.

**Live-tested before shipping**: the guard did fire false positives at first — flagging a
sentence that explained what ISN'T yet known ("what test confirmed X") as `remote_diagnosis`,
and a sentence about the practical effect of a reported pressure tactic as `mind_reading`.
Tightened `suppliedFrom()`'s "what is NOT a violation" section to explicitly exempt reasoning
about missing evidence and the effect of a visitor-reported tactic, re-tested: went from 3/3
test calls flagged down to occasional (1-2 fields, mixed real/false-positive), and — critically
— **the repaired output never visibly degraded content** across 4 separate live test calls,
unlike PronounceItRight's hedged-into-uselessness failure. Kept the guard; this is a real
enforcement layer here, not a cosmetic declaration.

## DO NOT silently reverse

1. The verdict enum and its definitions — `LOOKS_STRAIGHTFORWARD` must never be treated as "fair
   price confirmed" anywhere in frontend copy or prompt text.
2. `specific_concerns` vs `unknowns_that_matter` — a missing detail goes in the latter; only a
   concrete, evidenced problem goes in the former. This distinction is the core fix.
3. No price range, industry norm, or repair-vs-replace threshold anywhere in the prompt.
4. `second_quote.scope_comparable` gating — never let the frontend or prompt imply the cheaper
   quote is better or the pricier one more thorough without a comparable scope.
5. `viewFrom()` never re-calls the API; `recheckFrom()` never feeds a stored `result` back in as
   input — only the original `input` snapshot.
6. The v2 output guard and its tool-specific `outputGuard` — this is one of the few tools where
   it's proven to help; don't strip it out to "simplify," and don't loosen the "what is NOT a
   violation" exemptions without re-testing for the false-positive regression they fixed.
7. `itemAge` shown for all repair types now, not just appliance — `repair_vs_replace.applies` is
   a model decision, not a hardcoded category gate.

## Known / verified

- All 7 pre-push gates pass: syntax, eslint (0 warnings), guard-keys, diff-audit (0 new issues),
  localization-audit (13 languages, no collisions), primer-audit, sitemap-state, output-standard-
  audit (49 on v2, all with enforcement profiles).
- `check:golden quote-check`: 5/5 live, including both file-upload cases (image price
  discrepancy still caught; PDF pressure-tactic still surfaces as a grounded `specific_concern`
  with a real `safety_note`, not a remote diagnosis).
- Browser-verified end-to-end: example load → submit → full result render (every conditional
  section correctly shown/hidden) → Start Over → Recent Checks list → View (instant, no API
  call) → Start Over → Recheck (restores exact original inputs into the editable form) — zero
  console errors beyond the pre-existing unrelated dev-server WebSocket noise.
