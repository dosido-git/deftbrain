# ResearchDecoder — architecture & lock notes (`researchdecoder-v1`)

Translates academic papers for non-experts — digest, media-vs-headline check, jargon deep-dive,
two-paper compare, personal relevance. **Frontend:** `src/tools/ResearchDecoder.js`. **Backend:**
`backend/routes/research-decoder.js` (5 endpoints, `MODELS.SMART`). **Golden:**
`audit/research-decoder-golden-sample.json` (2 DE cases). Verify: `npm run check:golden research-decoder`.

## Endpoints
`/research-decoder` (digest, **4000**, `!one_sentence`), `-media` (**3000**, `!paper_actually_says`),
`-jargon` (4000, `!terms`), `-compare` (2500, `!paper1_says`), `-relevance` (4000, `!applies_to_you`).
All guards correct (top-level).

## Audit fixes locked here (2026-07-14)
1. **⚠️→🐛 German truncation.** MEDIA (`max_tokens 2000` + 2 uncapped arrays) and DIGEST (3000, uncapped
   limitations/jargon) were the fragile ones. **Fix:** media 3000 + distortions≤5/got_right≤4; digest
   4000 + limitations≤5/jargon≤8. Verified DE.
2. **🐛 i18n verdict-color bug (2 endpoints).** compare `do_they_agree.verdict` and relevance
   `applies_to_you.verdict` drive badge color+emoji but were compared to English literals ('Yes'/'No')
   → wrong badge in 12 languages. **Fix:** added language-independent `verdict_level` enums (pinned
   English) + switched the frontend on them. Verified DE: verdict_level='disagree'. (The pattern
   already existed in `accuracy_rating.score`'s dual-key map.)
3. **🐛 self-contradictory format annotations.** `should_you_worry` (`(true/false)`) and
   `should_you_change.confidence` (`(number)`) are PROSE rendered raw. **Fix:** stripped.
4. **⚠️ dead `jargonContext` input.** The jargon-mode textarea was bound to state but the handler sent
   the wrong-mode `paperText`. **Fix:** send `jargonContext`.
5. **⚠️ PF-16 reset missing in 2 modes.** `const results = digest||media||compare` excluded
   relevance/jargon → the reset button (keyed on `results`) never showed there. **Fix:** include
   `relResults||jargonResults`.
6. **⚠️→cleaned:** 38 annotation leaks + no-inner-double-quote rule on all 5 (headline/quote text).

## DO NOT silently reverse
- media 3000 + digest 4000 + array caps; `verdict_level` enums + frontend switching on them (not the
  localized string); prose `should_you_worry`/`confidence`; the no-inner-quote rule; the `results`
  alias covering all 5 modes; the `jargonContext` wiring.
