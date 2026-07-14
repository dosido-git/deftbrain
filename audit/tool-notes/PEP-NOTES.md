# PEP / Dopamine Menu Builder — architecture & lock notes (`pep-v1`)

Energy/recharge suite — an 18-action dispatch on ONE route (`/pep`, switch on `action`). Modes:
recharge menu (generate/just-do-this/build-menu/swap/rate-activity/energy-match/pattern-check/
accountability-nudge/recharge-insights/build-sequence/schedule-checkin/debt-check), budget
(SpoonBudgeter), forecast (SocialBatteryForecaster), decline-message, radar (radar-checkin/
radar-analyze), disruption (RoutineRuptureManager). **Frontend:** `src/tools/PEP.js` (5 UI modes,
all localStorage keys `pep-*`). **Backend:** `backend/routes/pep.js` (`MODELS.SMART`). **Golden:**
`audit/pep-golden-sample.json` (3 DE cases). Verify: `npm run check:golden pep`.

## Audit fixes locked here (2026-07-14)
1. **🐛 Colorless status cards (5 modes).** The `c` config defined `success/warning/danger/infoBox`
   but the debt/budget/forecast/radar renderers index `c['ok'|'warn'|'bad']` → `className="undefined
   …"` (no bg/border). **Fix:** alias `c.ok=c.success / c.warn=c.warning / c.bad=c.danger`. The
   interventions low-priority fallback uses `c['infoBox']` (NOT `c.info` — `c.info` is a banned
   audit key, S1.1).
2. **⚠️ generate truncation.** The biggest output (4 arrays) at the lowest budget (3000). **Fix:**
   cap quick_hits ≤4 / medium ≤4 / deep ≤3 / avoid ≤3 + `max_tokens 4000`. Verified DE: 4/4/3/3.
3. **🐛 forecast guard.** Keyed `!parsed.weekly_capacity` (hardcoded 100, but a model `0` false-500s).
   **Fix:** `!parsed.forecast` (the array the UI needs).
4. **🐛 recharge-insights dead tiles.** Frontend renders `dashboard.total_sessions` +
   `dashboard.best_category` but the schema never emitted them → 2 blank cells. **Fix:** added both
   to the schema. Verified DE: total_sessions=12, best_category populated.
5. **🐛 rate-activity dead param.** Frontend sent `sessionHistory` but the backend destructures
   `history` → the pattern-hint context was always empty. **Fix:** frontend sends `history`.
6. **⚠️ radar-checkin** `max_tokens 1500 → 2500`.
7. **⚠️→cleaned:** 64 annotation leaks + a generate brevity line.

## DO NOT silently reverse
- `c.ok/warn/bad` aliases + the `infoBox` (not `info`) fallback; generate caps + `4000`; forecast
  guard `!parsed.forecast`; dashboard `total_sessions`/`best_category`; the `history` param;
  radar-checkin `2500`; no annotation suffixes.
