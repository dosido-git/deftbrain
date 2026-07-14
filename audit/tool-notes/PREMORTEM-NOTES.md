# PreMortem — architecture & lock notes (`premortem-v1`)

Writes a fictional post-mortem as if a plan already failed — failure modes, warning signs, the fatal
assumption, and the single most critical prevention. **Frontend:** `src/tools/PreMortem.js`.
**Backend:** `backend/routes/pre-mortem.js` (1 endpoint, `MODELS.SMART`, **max_tokens 4500**).
**Golden:** `audit/pre-mortem-golden-sample.json`. Verify: `npm run check:golden pre-mortem`.
Cross-referenced by DecisionCoach / BeliefStressTest / FutureProof (link only, no data contract).

## Audit fixes locked here (2026-07-14)
Guard `!failure_modes` (array) correct; sync clean; no endpoint down.
1. **🐛 self-contradictory annotations.** `narrative` said "3–5 paragraphs … — 1-2 sentences" and
   `executive_summary` "2–3 sentences … — 1-2 sentences" — the annotation fought the content spec (a
   coin-flip between a stub and truncation), and could echo into the rendered/copied memo. **Fix:**
   stripped the `— …` suffixes; pinned `narrative` to "2–3 short paragraphs" (it was the token hog).
   Verified DE: 598-char 2-3 paragraph narrative.
2. **⚠️ truncation.** Multi-array + multi-paragraph schema at `max_tokens 3000` → verbose German
   plausibly 500s. **Fix:** 4500. Verified DE: ~2746 tok, 5/4/5 array items.
3. **⚠️→cleaned:** 17 annotation leaks + brevity + no-inner-double-quote rule; `probability` stays a
   clean pipe enum (frontend `PROB_CONFIG` switches on it); PF-2 `c.label` alias moved directly after
   the `c` block.

## DO NOT silently reverse
- `narrative` 2-3 paragraphs (no `— 1-2 sentences` contradiction); `max_tokens 4500`; clean
  `probability` enum; no annotation suffixes; the no-inner-double-quote rule.
