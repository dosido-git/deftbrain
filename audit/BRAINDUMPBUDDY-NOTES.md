# BrainDumpBuddy — architecture & lock notes (v1, 2026-07-02)

Brain-dump structurer: raw thoughts (free text / rapid one-at-a-time / voice) → `structure` (do-first + categorized checklist + overwhelm meter) and `excavate` (dig into a worry). One route, `claude-sonnet-4-6`. In `LOCALIZED_TOOLS`.

- **Golden:** `audit/brain-dump-buddy-golden-sample.json` (structure). Verify: `npm run check:golden brain-dump-buddy`.

## DO NOT silently reverse
1. **Global keyboard handler starts with `if (e.defaultPrevented) return;`** — the textarea/rapid inputs have local Cmd+Enter handlers; without the check every keyboard submit fired the API **twice** (double token cost, spinner died early, second response clobbered the first).
2. **The view fallback renders the setup view** (`if (view !== 'results' || !results)`) — `view` is persisted (`bds-view`), and a bare `return null` fallback once blanked the whole tool *across reloads* when a stale results-view persisted without results.
3. **Guards key on real schema fields**: structure `!breathe && !do_first && !actions`; emergency `!breathe && !one_task`. The old `!parsed.tasks` clause was a phantom (neither schema emits `tasks`).
4. The INPUT_MODES row and the rapid input+➕ row live in `flex gap-2` wrappers — bulk-edit commit `e9317e3` once deleted them (flex-1 children in non-flex parents = broken layout). Watch for this class in any bulk edit touching this file.
5. Known-accepted: the `emergency` backend branch has no UI trigger yet (kept for a future "barely functioning" toggle); reclassify remaps `checkedItems` indexes.
