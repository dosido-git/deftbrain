# WaitingModeLiberator — architecture & lock notes (v1, 2026-07-02)

ADHD "waiting mode" tool: appointments → free-window plan + prep-alarm countdown, guided block launch, anxiety-vs-reality debrief, pattern review. View state machine, 6 `claude-sonnet-4-6` actions on one route. In `LOCALIZED_TOOLS`.

- **Golden:** `audit/waiting-mode-liberator-golden-sample.json` (liberate + review). Verify: `npm run check:golden waiting-mode-liberator`.

## DO NOT silently reverse
1. **Prep alarms are PRECOMPUTED client-side and echoed by the model.** The frontend sends per-event `prepAlarm` + top-level `firstPrepAlarm`; the prompt says "echo EXACTLY — never recompute." Model arithmetic previously sat beside client math on the hero (contradiction class). The liberate golden asserts the echo.
2. **Guards must not truthiness-test numerics:** liberate guards `total_free_minutes == null && !time_blocks && !events_summary` (0 free minutes is a VALID answer — back-to-back events used to 500); review guards `trigger_patterns` (the schema exemplar for `total_sessions` is literally `0`). The review golden guards this.
3. **Timers are target-timestamp based** (`countdownTargetRef`/`blockTargetRef` + `visibilitychange` re-sync) — decrement `setInterval` counters fire the prep alarm minutes-to-hours late in throttled background tabs, which is the tool's core promise for ADHD users. Mid-check fires on `<= halfway` threshold (exact `===` skips when ticks jump).
4. **Time parsing strips `h`/`Uhr`/`時` suffixes** and the 12 non-English `wml_time_ph`/`wml_time_hint`/`wml_err_bad_time` (+_short) strings advertise ONLY parseable formats. Localized hints previously advertised "mediodía"/named words the English-only parser rejected → **non-English users could not add an event at all** — a class no localization gate catches (key parity ≠ behavior).
5. Day labels (badge + model payload) derive from `parsedDayOffset(parsed date)`, not the stored dayOffset — a past "Today" time silently auto-advances to tomorrow and all three representations must agree.
6. Keyboard handler uses the ref pattern and excludes TEXTAREA/BUTTON from plain-Enter (stale closure once submitted OLD events; Enter in the tasks textarea hijacked submit).
7. `events_summary[].type` echoes the input type exactly (clean token — frontend keys icon lookup on it); time exemplars are bare ("2:00 PM"). Liberate arrays capped (≤8 blocks, ≤4 steps) + CONSISTENT NUMBERS rule.
8. Try Example events carry `prepMinutes/travelMinutes` (missing ones rendered a literal `{{prep}}m`) and `dayOffset: 1` (immune to the past-time trap at any hour).
