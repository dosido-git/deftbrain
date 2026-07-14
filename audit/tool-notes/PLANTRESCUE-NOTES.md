# PlantRescue — architecture & lock notes (`plantrescue-v1`)

Plant diagnosis / care / identify (vision — multi-photo) + follow-up Q&A + companion-planting advisor.
**Frontend:** `src/tools/PlantRescue.js`. **Backend:** `backend/routes/plant-rescue.js` (3 endpoints,
`MODELS.SMART`). **Golden:** `audit/plant-rescue-golden-sample.json`. Verify: `npm run check:golden plant-rescue`.

## Endpoints
`/plant-rescue` (main, **5500**, `callClaudeWithRetry`, guard `isRescue && (!diagnosis || !action_plan)`),
`/plant-rescue/followup` (**1500**, FREE TEXT, raw create + local loop), `/plant-rescue/companions`
(4000, `callClaudeWithRetry`).

## Audit fixes locked here (2026-07-14)
1. **🐛 Two latent German-500 paths on main.** It used raw `anthropic.messages.create` + a
   trailing-comma-only repair that can't fix a mid-string cutoff, and the schema has a **mandatory
   12-month seasonal_calendar** (always-on) → German truncation → 500; plus unescaped quotes had no
   shared repair. **Fix:** route main + companions through `callClaudeWithRetry` (shared repair +
   fail-fast), `max_tokens 4000→5500`, cap the arrays (action_plan ≤5, secondary ≤4, prevention ≤5,
   alt_species ≤3, regional ≤3, ≤3 tasks/month), add the no-inner-double-quote rule.
2. **🐛 format-strict enums breaking the hero badge.** `confidence` (`high/medium/low (number)`),
   `severity` (`critical/concerning/minor — 2-4 words`), toxicity `level` — the frontend switches on
   these; a leaked annotation → switch falls to default → "healthy" label on a dying plant. **Fix:**
   bare pipe enums. Verified DE rescue: severity='critical', confidence='high', tox='toxic'.
3. **⚠️ followup free-text clip.** `max_tokens 800→1500` + "2-3 short paragraphs".
4. **⚠️→cleaned:** ~40 annotation leaks (incl `(number)` + `— one sentence` on calendar months);
   PF-2 `c.label` alias normalized. Removed the now-unused `cleanJsonResponse` import.

## DO NOT silently reverse
- `callClaudeWithRetry` on main + companions; main `5500` + array caps; bare pipe enums
  (confidence/severity/toxicity level); the no-inner-double-quote rule; followup `1500`;
  no annotation suffixes.
