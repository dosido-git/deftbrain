# RoomReader — architecture & lock notes

**Known-good:** tag `roomreader-v1` · golden `audit/room-reader-golden-sample.json`
**Verify:** `npm run check:golden room-reader` (backend up: `npm run dev:backend`)

## What it is
A 12-mode social-intelligence coach (prep / navigate / recover / debrief). Frontend
`src/tools/RoomReader.js` (~1610 lines) with a persistent Playbook + recurring-people tracking.
Backend `backend/routes/room-reader.js` (~820 lines) — **14 endpoints**, all `claude-sonnet-4-6`
via `callClaudeWithRetry` + `withLanguage` (no `withLocaleContext` — purely social, no currency).

| Endpoint | guard (top-level field) | max_tokens |
|---|---|---|
| `/room-reader` (Pre-Game, the primary mode) | `vibe_check \|\| conversation_starters` | **5000** |
| `/room-reader-decode` | `most_likely` | 4000 |
| `-quick` `line` · `-debrief` `honest_read` · `-followup` `timing` · `-person` `person_read` · `-group` `group_read` · `-recover` `damage_check` · `-culture` `quick_read` · `-person-refresh` `relationship_arc` · `-energy` `gap_read` · `-ladder` `ladder` · `-autopsy` `honest_assessment` | (correct) | 1500–4000 |

## DO NOT silently reverse (the locked fixes)
1. **Success guards must check a TOP-LEVEL schema field.** Pre-Game and Decode both guarded on
   `if (!parsed.read && !parsed.room_read)` — but `read` is **nested** (`vibe_check.read` /
   `most_likely.read`), never top-level. So `parsed.read` was always `undefined` → the guard
   **always fired → every Pre-Game and Decode request returned 500** (the two headline modes were
   dead on arrival). Now: Pre-Game guards `vibe_check || conversation_starters`; Decode guards
   `most_likely`. The golden's `pregame` + `decode` cases guard this (they 500'd before). The
   other 12 guards already key on real top-level fields — leave them.
2. **`/room-reader` (Pre-Game) max_tokens ≥ 5000.** Its schema (6–8 `conversation_starters` × 6
   fields + `people_map` + `body_language` + `landmine_map` + `exit_toolkit` + `worst_case_saves`
   + `pep_talk`) truncated at 3000 → parse-fail on all 3 retries → 500 (this fired *before* the
   guard, so Pre-Game needed BOTH fixes). Now 5000; full output ~80s (golden timeout 180s).
3. **All 14 endpoints on `claude-sonnet-4-6`.**

## Frontend
- Mobile clean at 375px (home + results; only grid is `grid-cols-1 sm:grid-cols-3`). `buildFullText`
  registers copy via `useRegisterActions`. Fully localized (`rr_*`, 13 languages).
- The Playbook + recurring-people history are client-side (localStorage) — `-person-refresh`
  builds on logged history.

## Gotchas
- **Backend rate limit = 4 req/min.** `check:golden` runs the 3 cases sequentially and fits.
- **Pre-Game is slow (~80s)** by nature (8 starters + full plan at 5000 tokens) — verify with a
  long-timeout fetch, not a short `curl -m`.
- **Restart the backend after route edits** (started via `node`, not nodemon).
- Lesson (recurring): a success guard must key on a field the schema actually emits AT TOP LEVEL —
  a nested or renamed field makes the guard always fire (every request 500s). Same class as
  MeetingBSDetector; verify guards by checking the schema's top-level keys, not just any occurrence.
