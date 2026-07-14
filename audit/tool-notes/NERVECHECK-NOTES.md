# NerveCheck — architecture & lock notes (`nervecheck-v1`)

Confidence coach: full analysis + prep plan (main), live pre-event, post-event debrief,
situation-specific prep, mid-event SOS, coach-someone-else, and a graduated fear ladder.
**Frontend:** `src/tools/NerveCheck.js`. **Backend:** `backend/routes/nerve-check.js` (7 endpoints,
`MODELS.SMART`, all `max_tokens 4000` except specific-prep **5000**; local `safeParseJSON` 5-pass
repair, raw `anthropic.messages.create` + 3-try loop). **Golden:** `audit/nerve-check-golden-sample.json`
(3 DE cases). Verify: `npm run check:golden nerve-check`.

## Audit fixes locked here (2026-07-13)
1. **🐛 `debrief.verdict` enum degradation.** Was `"brave / you_showed_up / learning_experience —
   one sentence"`; the frontend switches on the exact value for emoji AND the journal `braveRate`
   analytics → the annotation pushed prose → always mis-bucketed. **Fix:** clean enum
   `"brave | you_showed_up | learning_experience"`. Verified DE: `brave`.
2. **🐛 `specific-prep.likely_challenges[].probability` enum degradation.** Was `"likely / possible /
   unlikely (number)"`; frontend switches for badge color → the `(number)` broke it → all grey.
   **Fix:** `"likely | possible | unlikely"`. Verified DE: clean.
3. **🐛 German 500 (unescaped quotes).** The "what to say"/script fields produced unescaped `"` in
   German → `safeParseJSON` failed all 5 repair passes → 500 (caught live on main). **Fix:** a
   "never place a double-quote inside a string value" rule in **all 7** prompts.
4. **⚠️ specific-prep truncation.** 4 uncapped arrays + two 2-4-sentence script fields. **Fix:** cap
   targeted_prep ≤4 / likely_challenges ≤4 / power_moves ≤3 / cheat_sheet ≤5 + `max_tokens 5000`.
5. **⚠️ phantom guard OR-clause.** Main guarded `!fear_breakdown && !reframe`; `reframe` is never
   emitted. **Fix:** `!fear_breakdown` only.
6. **⚠️→cleaned:** 73 annotation leaks (`— one sentence`/`— N words`/`(number)`) + brevity/caps lines
   added to main + coach + specific-prep.

## DO NOT silently reverse
- Clean pipe enums for verdict / probability (and the already-clean difficulty / priority); the
  no-inner-double-quote rule in all 7 prompts; specific-prep caps + `5000`; main guard
  `!fear_breakdown` only; no annotation suffixes.
