# FocusPocus — architecture & lock notes

**Known-good:** tag `focuspocus-v1` · golden `audit/focus-pocus-golden-sample.json`
**Verify:** `npm run check:golden focus-pocus` (backend up: `npm run dev:backend`)

## What it is
A focus-session timer + break-intervention coach. Frontend `src/tools/FocusPocus.js` (~2430
lines): single/chain (pomodoro) sessions, live scoring, distraction logging, daily/multi-day
streaks, milestones, weekly challenges, ambient Web Audio, recharts analytics, plus two AI
panels (pattern analysis + break coaching). Backend `backend/routes/focus-pocus.js` — **3
endpoints**, all `claude-haiku-4-5-20251001`:

| Endpoint | max_tokens | Guard (matches schema) |
|---|---|---|
| `/focus-pocus` (main break plan) | 4000 | `parsed.headline` |
| `/focus-pocus/patterns` (behavioral analysis) | 2000 | `parsed.focus_profile` |
| `/focus-pocus/break-coach` | 1000 | `parsed.acknowledgment` |

`callClaudeWithRetry` → parse failure throws to the top-level catch → 500. Guards are correct
(each checks its real top-level field).

## DO NOT silently reverse
1. **`handleAiPatterns` must POST `{ history: sessionHistory }`** — NOT `sessionHistory`. The
   `/patterns` route destructures `history` and 400s if absent. Sending the wrong key made AI
   pattern analysis **always fail** (the bug this lock fixed). The golden PATTERNS case uses the
   `history` key and guards this.
2. **`fp-history` cap = 50** (`recordSession`). It was `.slice(0, 6)`, which starved every
   longitudinal feature: the patterns endpoint analyzes up to 50 sessions, the `ten` (≥10) and
   `centurion` (≥50) milestones, the growth trajectory (first-5 vs last-5), and the trend/scatter
   charts. **Don't raise above 50** — audit rule **S1.5** forbids history caps >50, and 50
   exactly matches the patterns `slice(0,50)` and the centurion milestone.
3. **`growth.trajectory` must stay an exact enum** (`improving|declining|stable|volatile`). The
   prompt example used to carry a "— one sentence" annotation; the frontend switches on
   `trajectory === 'improving'`/`=== 'declining'` for badge color and renders the raw value, so a
   leaked suffix breaks the color and shows garbage. Keep the enum clean.
4. **All 3 endpoints on `claude-haiku-4-5-20251001`.**
5. **Distraction data is wired into the main prompt.** `handleTakeBreak` sends `distractionCount`
   + `topDistraction`; the backend reads them and the MESSAGE guidance references a recurring
   distraction pattern when notable. (Before the fix these were sent but ignored.)

## Cross-tool contract
`fp-history` entries (`{date, activity, plannedMin, actualMin, overtimeMin, score, distractions,
distractionTypes, pauseCount, accomplishment, note, ...}`) are read by **FocusSoundArchitect**'s
`focusCorrelation` (needs `date`, `score`, `activity`) and by this tool's own `/patterns`
endpoint. Keep that shape stable.

## Mobile (render-layer, NOT in golden)
- Clean at 375px: setup, active (timer-ring SVG), and the patterns view (two recharts surfaces +
  AI profile) all fit. The hour×day distribution strip is intentionally inside an
  `overflow-x-auto` container (`min-w-[400px]`) — horizontal scroll by design, no document
  overflow, no crushed text.
- Minor (catalog-wide): ambient-volume slider is thin (<44px).

## Gotchas
- **Backend rate limit = 4 req/min.** `check:golden` runs the 3 cases sequentially and fits.
- **Presets/phases:** the charts live in `phase === 'patterns'`; the AI insight panel renders
  from `fp-aiPatterns`. To test the patterns view without a live call, inject `fp-history` (≥5)
  and `fp-aiPatterns` into localStorage and set `fp-phase` to `"patterns"`.
- Fully localized (in `LOCALIZED_TOOLS`); `fpc_*` keys in `src/i18n/locales/tools/focus-pocus.js`.
