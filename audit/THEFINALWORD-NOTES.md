# TheFinalWord — architecture & lock notes

**Known-good:** tag `thefinalword-v1` · golden `audit/the-final-word-golden-sample.json`
**Verify:** `npm run check:golden the-final-word` (backend up: `npm run dev:backend`)

## What it is
An argument-settler / fact-checker / trivia tool. Frontend `src/tools/TheFinalWord.js` (~1800
lines): Quick Answer, Settle It, Fact Check, Trivia Night, plus Appeal / Follow-up / Devil's
Advocate / Deep Dissect, single-device team trivia, AND a **multiplayer room** system. Backend
`backend/routes/the-final-word.js`: one mode-dispatched `/the-final-word` route (8 modes) +
`/dissect` + `/share` + 5 `/room/*` endpoints. All AI calls `claude-sonnet-4-6`.

- Main route: 3-attempt `anthropic.messages.create` retry, `safeParseJSON` (fence/comma/control-
  char tolerant). No per-mode success guard — a parse failure throws → top-level 500 (fine; the
  frontend is null-safe for individual fields).
- `getDateContext()` injects today's date; prompts handle knowledge-cutoff for time-sensitive
  claims (don't present stale stats as current).

## DO NOT silently reverse (the locked fixes)
1. **No stray annotations glued to enum option VALUES.** The schemas had `"confidence": "certain
   (number)" | …`, `"verdict": "who_a_wins — one sentence" | …`, `"ruling_display": "TRUE ✓ — one
   sentence" …`, `"appeal_ruling": "upheld — one sentence" | …`. The `(number)` made the model
   return **`"certain (99.99%)"`**, and the frontend `confBarColor` (`conf === 'certain'`) then
   fell through to **red** — so the MOST confident answers showed a red (lowest) bar. `ruling_display`
   absorbed a whole explanation sentence. All annotations are stripped — keep enum values clean
   (length hints belong only on free-text fields). The golden's `question` case guards this
   (`confidence` must be a clean enum like `"certain"`).
2. **All modes on `claude-sonnet-4-6`** via the 3-attempt retry + `safeParseJSON`.
3. **Room multiplayer is in-memory, single-server** (`rooms`/`sharedVerdicts` Maps, 24h/30d TTL).
   It's correctly host-gated (`next`/`reveal` check `hostId`), hides `correct_index` until reveal
   (`/state` sanitizes), and scores streaks/categories. It will NOT work across multiple server
   instances — documented limitation ("replace with Redis"); don't assume horizontal scale.

## Frontend
- `confBarColor` and the appeal/challenge displays switch on enum values — keep them clean (#1).
- `getVerdictText()` registers copy via `useRegisterActions`. PF-2 aliases (`c.textMuteded`,
  `c.label`) were missing — added after the `c` block.
- Mobile clean at 375px (home + result); team/player chips use intentional `overflow-x-auto`
  scroll. Fully localized (`tfw_*`, 13 languages; Spanish renders, no raw keys).

## Gotchas
- **Backend rate limit = 4 req/min.** `check:golden` runs the 3 cases sequentially and fits.
- The `ruling`/`verdict` LOGIC enums were already clean (only the first-option annotations were the
  problem). `dissect` is clean.
- **Restart the backend after route edits** (started via `node`, not nodemon).
