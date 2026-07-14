# TheGap — architecture & lock notes (`thegap-v1`)

Academic diagnostician — traces backwards through the prerequisite chain to find the exact concept
where a student's understanding broke, then digs into one prerequisite. **Frontend:** `src/tools/TheGap.js`.
**Backend:** `backend/routes/the-gap.js` (2 endpoints, `MODELS.SMART`). **Golden:**
`audit/the-gap-golden-sample.json` (2 DE cases). Verify: `npm run check:golden the-gap`.

## Audit fixes locked here (2026-07-14)
1. **🐛 BOTH endpoints were DOWN — 500 every call, all languages. The tool never worked in production.**
   - `/the-gap` guarded `!parsed.repair_plan` — no such field exists in the schema (emits
     `concept_analysis`/`likely_gap`/…) → always 500. **Fix:** `!parsed.likely_gap`.
   - `/the-gap/dig` guarded `!parsed.next_step` — no such field (emits `concept`/`refresher`/
     `connects_forward`) → always 500. **Fix:** `!parsed.refresher`.
   Both classic copy-paste guard drift. Verified DE: both 200.
2. **🐛 i18n `gap_likelihood` enum.** The frontend `gapStyle` switches on `high|medium|low` for the
   gap-risk badge color, but `withLanguage` localizes string values → wrong color in 12 languages.
   **Fix:** pinned the enum to English keys in the prompt ("code value, do not translate"). Verified DE.
3. **⚠️ truncation.** `/the-gap` @2500 with uncapped `if_thats_not_it`; `/the-gap/dig` uncapped
   `common_mistakes`. **Fix:** `if_thats_not_it` ≤2 + `max_tokens 3500`; `common_mistakes` ≤3.
4. **⚠️→cleaned:** ~26 annotation leaks + brevity + no-inner-double-quote rule.

## DO NOT silently reverse
- Guards `!parsed.likely_gap` / `!parsed.refresher`; `gap_likelihood` English pin; `/the-gap` 3500 +
  caps; no annotation suffixes; the no-inner-double-quote rule.
