# TaskAvalancheBreaker — architecture & lock notes (v1, 2026-07-02)

Gamified task-breaker: overwhelming project → 2-20 micro-tasks sized by session time (5/10/15/30 → backend min/max bands) and energy, wrapped in points/streak/level (localStorage), per-task timer with synth sounds, skip/stuck modals, habit stacking. One `claude-sonnet-4-6` endpoint with a deep JSON-salvage chain. In `LOCALIZED_TOOLS`.

- **Golden:** `audit/task-avalanche-breaker-golden-sample.json` (garage + habit-stack case). Verify: `npm run check:golden task-avalanche-breaker`.

## DO NOT silently reverse
1. **Skip works through `skippedTasks`**: `confirmSkip` records the id and `getNextIncompleteTask()` passes over skipped ids (they resurface only after everything else). The renderer shows `getNextIncompleteTask()`, NOT `currentTaskIndex` — advancing the index alone made the skipped task instantly reappear. `skippedTasks` clears wherever `completedTasks` clears.
2. **Reorder clears completions** (`setCompletedTasks([])` before regenerating) — new breakdowns re-number tasks 1..N, so stale completed ids marked *different, never-done* tasks as complete (progress bar lied, fresh tasks arrived pre-checked).
3. **Habit stacking is wired end-to-end**: route destructures `existingHabit`, the prompt adds a task-1 `habit_stack` field when provided, the renderer shows it. It was a UI panel wired to nothing.
4. **`estimated_time` values are bare durations ("30 seconds")** — `parseTimeToSeconds` machine-parses them; an annotated value NaN'd to a 5:00 timer for a 30-second task. `estimated_total_time` is a short value too.
5. Backend fallback time math must stay unit-aware (parseInt("30 seconds") once summed as 30 *minutes*). PF-2 aliases use single spaces (aligned padding breaks the audit's literal match).
