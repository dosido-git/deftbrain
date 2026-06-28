# FriendshipFadeAlerter — architecture & lock notes

**Known-good:** tag `friendshipfadealerter-v1` · golden `audit/friendship-fade-alerter-golden-sample.json`
**Verify:** `npm run check:golden friendship-fade-alerter` (backend up: `npm run dev:backend`)

## What it is
A keep-in-touch / reconnection tool — track people, get overdue alerts (red/yellow/green), and
generate guilt-free conversation starters. Frontend `src/tools/FriendshipFadeAlerter.js` (~1440
lines; people + contact log live in localStorage). Backend `backend/routes/friendship-fade-alerter.js`
(~610 lines) — **8 endpoints**, all `claude-sonnet-4-6` via `anthropic.messages.create` + a
3-attempt retry loop + `safeParseJSON`. `withLanguage` only (no currency).

| Endpoint | returns | max_tokens |
|---|---|---|
| `/friendship-fade-alerter` (main: starters for one person) | `{starters[], ...}` | 4000 |
| `/batch` (sprint: one message per person) | `{messages[], ...}` | 4000 |
| `/followup-advice` | `{recommendation, ...}` | 800 |
| `/digest` · `/reengage` · `/health-insight` · `/say-it-coach` · `/frequency-suggest` | objects | 900–4000 |

**No per-endpoint success guard** — a parse failure throws from `safeParseJSON` → top-level 500;
the frontend is null-safe for individual fields. (So there's no broken-guard risk; don't "add" a
guard that keys on a nullable/nested field.)

## DO NOT silently reverse (the locked fixes)
1. **No annotations glued to enum/badge VALUES.** Stray length/type hints were attached to enum
   option lists, and the model copied them into the value:
   - `effort` was `"low / medium / high (number)"` → returned **`"low (1)"`/`"medium (2)"`**; the
     frontend switches on `s.effort === 'low'` / `=== 'high'` for badge color, so suffixed values
     fell through to grey → **all effort badges lost their color signal**.
   - `recommendation` was `"wait / follow_up / let_it_go — one sentence"`; the frontend switches on
     `recommendation === 'follow_up'` / `=== 'wait'` ([:1136]) — a suffixed value would show the
     **wrong verdict** ("let it go" default).
   - `tone` (main + batch) was `"casual / warm / direct / playful — one sentence"` → returned a
     full sentence rendered in a tiny badge.
   All are now clean pipe-separated enums (`"low | medium | high"`, etc.). Verified live: effort
   `['low','low','medium','high']`, recommendation `'follow_up'`, tone `'casual'`. Keep enum values
   clean — length hints belong only on free-text fields.
2. **All 8 endpoints on `claude-sonnet-4-6`.** No truncation at current limits (main + batch tested
   live at 4000 return clean).
3. **Field-name sync:** the frontend sends `relationshipType` (not `relationship`) — the main/batch
   endpoints require it.

## Frontend
- Mobile clean at 375px (home + results). `buildFullText` registers copy via `useRegisterActions`.
  Fully localized (`ffa_*`, 13 languages). People/contact-log persistence is client-side.

## Gotchas
- **Backend rate limit = 4 req/min.** `check:golden` runs the 3 cases sequentially and fits.
- **Restart the backend after route edits** (started via `node`, not nodemon).
- Lesson (recurring): keep enum/badge values free of `(number)` / `— one sentence` annotations —
  the model copies them into the value and breaks frontend `=== 'enum'` switches and badge layout.
