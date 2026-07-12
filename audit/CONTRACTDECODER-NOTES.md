# ContractDecoder — architecture & lock notes (`contractdecoder-v1`)

Reviews a pasted contract from the SIGNER's side: overall risk, risky clauses (quote + plain-English + negotiate ask), missing protections, before-you-sign checklist. **Frontend:** `src/tools/ContractDecoder.js`. **Backend:** `backend/routes/contract-decoder.js` (1 endpoint). **Golden:** `audit/contract-decoder-golden-sample.json` (2 cases). Verify: `npm run check:golden contract-decoder` (~60–90s/case).

## Shape
- **1 endpoint — path is `/contract-decoder/stream` but it is NON-streaming** (uses `callClaudeWithRetry`; the /stream name is legacy). `claude-sonnet-4-6` (`MODELS.SMART`), **`max_tokens 6000`**, `withLanguage(systemPrompt)` + `withLocaleContext`.
- Guard: `!VALID_RISKS.includes(parsed.overall_risk)` (validates the top-level enum). All arrays defensively normalized to `[]`.
- Schema uses `<...>` placeholders (NOT `— one sentence` annotations) → no annotation-leak class here. In `LOCALIZED_TOOLS`.

## Audit fixes locked here (2026-07-12)
1. **🐛 German truncation.** A realistic 9-clause contract fit English at `max_tokens 4000` but 500'd in German (`missing_protections` reached 9 + 8-9 clauses with quotes). **Fix (bound + headroom):** cap **clauses ≤10, missing_protections ≤6** (before_you_sign already ≤5) + `max_tokens` → **6000**. Re-verified DE 200 (9 clauses, 6 missing).

## DO NOT silently reverse
1. **`max_tokens 6000` + the clause/missing_protections caps** — prevent the German truncation on long contracts.
2. Endpoint stays non-streaming (`callClaudeWithRetry`) despite the `/stream` path.

## Known / accepted
- 0 baseline audit issues (was already clean — no annotations, on callClaudeWithRetry).
- No golden neutralization — clauses/missing_protections/before_you_sign always populated for a real contract.
