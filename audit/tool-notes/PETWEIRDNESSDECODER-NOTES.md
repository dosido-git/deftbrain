# PetWeirdnessDecoder — architecture & lock notes (`petweirdnessdecoder-v1`)

Decodes unusual pet behavior — urgency triage, breed/life-stage context, likely explanation, vet-visit
prep, and a follow-up Q&A. Vision-capable (photo of the pet). **Frontend:** `src/tools/PetWeirdnessDecoder.js`.
**Backend:** `backend/routes/pet-weirdness-decoder.js` (2 endpoints, `MODELS.SMART`). **Golden:**
`audit/pet-weirdness-decoder-golden-sample.json` (2 DE cases). Verify: `npm run check:golden pet-weirdness-decoder`.

## Endpoints
- `POST /pet-weirdness-decoder` — big JSON analysis, `callClaudeWithRetry`, **max_tokens 5000**, guard
  `!most_likely_explanation || !behavior_analysis` (both top-level, always emitted — correct).
- `POST /pet-weirdness-decoder/followup` — **free text** `{answer}` (not JSON), raw
  `anthropic.messages.create` + 3-try loop, **max_tokens 1500**.

## Audit fixes locked here (2026-07-14)
1. **🐛 Endpoint 1 truncation (the real 500 risk, not the 800 one).** 8 uncapped arrays at max_tokens
   4000 → a detailed German case (meds + diet + multiple changes) could truncate → parse fail → 500.
   **Fix:** cap all arrays (other_possibilities ≤3, red_flags ≤4, questions_to_ask ≤4, what_to_observe
   ≤4, enrichment ≤4, behavioral_modification ≤3, common_breed/genetic ≤4) + `max_tokens 5000`.
   Verified DE: ~1532 tok, 3/4/3 items.
2. **⚠️ Endpoint 2 free-text clip.** `max_tokens 800` cut 2-4 German paragraphs mid-sentence (not a
   500 — it returns text, not JSON). **Fix:** `1500` + "2-3 short paragraphs (~150 words)". Verified DE:
   answer ends cleanly.
3. **⚠️ leaky placeholder fields.** `behavior_category`/`life_stage`/`similar_pet_stories` were
   `"string — one sentence"` stubs; `how_common` was a verbose instruction-as-value. **Fix:** real
   descriptions. Added the no-inner-double-quote rule.
4. **⚠️ empty invisible seed button** (anonymous JSX with no children → invisible clickable strip,
   duplicated the working try-example pill + example link) → removed.
5. **⚠️ PF-2 double-space gotcha:** `c.label       = c.labelText` → single space (the name-keyed audit
   regex needs it).

## DO NOT silently reverse
- Array caps + `max_tokens 5000` (Endpoint 1); followup `1500`; clean placeholder descriptions;
  the no-inner-double-quote rule; no annotation suffixes; single-space `c.label` alias.
