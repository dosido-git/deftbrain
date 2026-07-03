# LazyWorkoutAdapter — architecture & lock notes (v1, 2026-07-02)

9-mode low-barrier movement tool: right-now workouts, 2-min micro, targeted body relief, habit stacking, sleep wind-downs, recovery protocols, weekly menu, history dashboard with AI Insights/Prove-It, client-side timers. 13 `claude-sonnet-4-6` endpoints. In `LOCALIZED_TOOLS`.

- **Golden:** `audit/lazy-workout-adapter-golden-sample.json` (main + insights). Verify: `npm run check:golden lazy-workout-adapter`.

## DO NOT silently reverse
1. **Payload key is `history:`** for insights (`-insights`), prove (`-prove`), and nudge (`-nudge`) — the backend destructures `history`. The frontend once sent `sessionHistory:` → Insights and Prove It returned **400 on every click** and Nudge ran history-blind (the FocusPocus class). The insights golden case guards this.
2. **The limitations input exists and is visible** (right-now form, `lwa_limitations_label/_ph` ×13) and is sent to the movement routes. It's the prompts' injury-safety rail — previously the state existed with NO input, so `LIMITATIONS: None` always.
3. **Exercises carry a numeric `seconds` field; the timer prefers it** (`exSeconds()` helper). `parseDuration` is Latin-unit-only — Japanese/Chinese "2分" misread as 10 seconds without the numeric field.
4. **TimerView / CompleteView / ExCard are module-level components with props** — defining them inline remounted the subtree every render (energy slider lost pointer capture mid-drag; timer ring restarted every tick).
5. `handleComplete` derives duration/energy **per active mode** (body/sleep/recovery/micro times, not the right-now slider) — wrong numbers poisoned the Insights/Prove evidence. History capped `.slice(-50)`; presets keep the newest 6 (`.slice(-6)`, not `slice(0,6)` which kept the oldest).
6. Main endpoint max_tokens 4000 (was 2000 — the lone outlier among 13 siblings).
