# Bookmark — architecture & lock notes (v1, 2026-07-01)

Spoiler-free "where was I?" media recap (TV / book / game / sports). Form → AI → cards. In `LOCALIZED_TOOLS`.

- **Model:** single endpoint `claude-sonnet-4-6` via `callClaudeWithRetry`, `max_tokens 5000`, 4 schema variants dispatched on `mediaType`.
- **Endpoint:** `/api/bookmark`.
- **Golden:** `audit/bookmark-golden-sample.json` (sports = max-schema variant). Verify: `npm run check:golden bookmark`.

## DO NOT silently reverse
1. **Enum values stay clean** (no glued `(number)` / `— one sentence`):
   - `confidence` (high|medium|low) — frontend does `!== 'high'` for the badge; a leaked `"high (90%)"` made a high-confidence recap show a low-confidence warning.
   - `must_watch_games[].spoiler_level` (outcome_unknown|outcome_revealed) — frontend `=== 'outcome_unknown'` for the "watch blind" badge.
   - `roster_changes[].impact` is prose ("— one sentence"), not `(number)`.
2. **`the_story_so_far` = "2-4 paragraphs"** (the contradictory "— one sentence" was removed).
3. **`buildFullCopy` is media-type-aware** — copies vibe_check, worth_continuing, answers, tips, and the sports/game/book sections, not just the base recap.
4. **Guard = `!data.title`** (top-level, always echoed) — correct. `max_tokens 5000` (sports is the largest variant).
5. No currency (recaps only).
