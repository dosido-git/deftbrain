# SpiralStopper — architecture & lock notes (`spiralstopper-v1`)

**SENSITIVE mental-health-adjacent domain.** Anxiety-spiral intervention (spiral) + freeze-unblocker
(unfreeze) + shutdown recovery (recover) + post-episode debrief (reflect) + history patterns.
**Frontend:** `src/tools/SpiralStopper.js` (`sps_` keys). **Backend:** `backend/routes/spiral-stopper.js`
(1 route, 5 modes, `MODELS.SMART`; spiral+recover **5000**, unfreeze 1500). **Golden:**
`audit/spiral-stopper-golden-sample.json` (2 DE cases). Verify: `npm run check:golden spiral-stopper`.

## Audit fixes locked here (2026-07-14)
All 5 guards key on field presence (`=== undefined`) — correct, no i18n-enum guard bug; the display
enums (primary_distortion / most_common_type) are rendered raw, not switched, so no pin needed.
1. **🛡️ Static crisis banner (user-approved, SENSITIVE).** Was absent — only a soft breathing banner.
   Added `sps_crisis` i18n line (×13, with hotlines: 988 / Samaritans 116 123 / Telefonseelsorge /
   local) that renders whenever a mode is active — a model-independent safety net like GriefGuide's
   `gg_intro` and MHN's `mhn_intro`.
2. **🐛 dead history feature.** Spiral accepted `history` but the frontend sends `sessionHistory` → the
   pattern-from-history behavior silently never fired. **Fix:** `history || sessionHistory`.
3. **🐛 German quotes.** "What to say"/reframe/instruction fields → unescaped quotes in German → 500.
   **Fix:** the no-inner-double-quote rule on all quote-heavy modes.
4. **⚠️ truncation.** spiral + recover (heaviest, 5 arrays) uncapped at 4000. **Fix:** caps
   (thought_breakdown ≤4, stages ≤4, permissions/basics/recovery_signs ≤5, etc.) + `max_tokens 5000`.
5. **⚠️→cleaned:** 31 leaks (incl `(number)` on grounding.duration) + brevity; frontend gained
   `labelText` + the PF-2 aliases.

## DO NOT silently reverse
- The static `sps_crisis` banner; array caps + spiral/recover `5000`; `history || sessionHistory`; the
  no-inner-double-quote rule; no annotation suffixes.
