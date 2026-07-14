# PronounceItRight — architecture & lock notes (`pronounceitright-v1`)

Pronunciation coach — single-word full guide + batch mode + an ElevenLabs TTS audio route.
**Frontend:** `src/tools/PronounceItRight.js`. **Backend:** `backend/routes/pronounce-it-right.js`
(2 LLM endpoints, `MODELS.FAST`) + `backend/routes/pronounce-it-right-audio.js` (TTS → audio/mpeg).
**Golden:** `audit/pronounce-it-right-golden-sample.json` (2 DE cases). Verify: `npm run check:golden pronounce-it-right`.

## Audit fixes locked here (2026-07-14)
1. **🐛 BATCH endpoint DOWN — 500 every call.** The batch schema's only top-level key is `guides`,
   but its guard was a copy-paste of the single-word guard `!parsed.pronunciation && !parsed.phonetic`
   (neither exists at top level) → `true` on every successful generation → 500. **Fix:**
   `!parsed.guides?.length`. Verified DE: batch returns 5 guides.
2. **⚠️ single-endpoint truncation.** `max_tokens 2500` for a rich 6-field pronunciation + mistakes +
   context + variants schema. **Fix:** 3500. Batch `validWords` capped 10→8 for headroom.
3. **⚠️→cleaned:** 26 annotation leaks + a brevity line on both prompts; added the no-inner-double-quote
   rule (pronunciation/IPA fields can attract quotes in German).
4. **⚠️ duplicate cross-ref.** The PlainTalk pre-result cross-ref rendered twice on the empty state
   (once in `renderInput`, once in the main tree). **Fix:** removed the `renderInput` copy; kept the
   main-tree one — audit **S5.5 requires the pre-result cross-ref in the main render tree**, so do not
   move it back inside renderInput.

## DO NOT silently reverse
- Batch guard `!parsed.guides?.length`; single `max_tokens 3500` + batch cap 8; the no-inner-double-quote
  rule; no annotation suffixes; the cross-ref stays in the main render tree (S5.5).
