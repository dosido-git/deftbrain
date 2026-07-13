# IdeaAutopsy — architecture & lock notes (`ideaautopsy-v1`)

Brutal startup-idea autopsy: viability score, verdict, risks, strengths, kill-questions, next steps.
**Frontend:** `src/tools/IdeaAutopsy.js` (`ia_` keys). **Backend:** `backend/routes/idea-autopsy.js`
(single endpoint `/idea-autopsy/stream` — misnamed, plain JSON; `MODELS.SMART`, `max_tokens 5000`).
**Golden:** `audit/idea-autopsy-golden-sample.json` (1 DE case). Verify: `npm run check:golden idea-autopsy`.

## Audit fixes locked here (2026-07-13) — the cleanest of the batch
1. **⚠️ USD-anchor exemplar.** The `kill_questions` guideline used "pay $15/month" — `kill_questions`
   render raw, so the `$` could echo for non-USD users. **Fix:** "pay a recurring monthly fee".
2. **⚠️ Truncation headroom.** `risks` (4-6, each with description + mitigation) at `max_tokens 4000`
   → German risk. **Fix:** `max_tokens` → **5000** (risks already 4-6). Verified DE: 6 risks, ~2.1K tokens.
3. **🐛 Frontend:** duplicate `/PreMortem` cross-ref link removed (was rendered twice).
   `viability_score` is a bare integer (angle-bracket placeholder — clean); risk enums already clean.

## DO NOT silently reverse
1. `max_tokens 5000` + risks 4-6.
2. NO `$` exemplar in `kill_questions` guidance (rendered raw).
3. `viability_score` bare integer.
