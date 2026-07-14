# NameStorm — architecture & lock notes (`namestorm-v1`)

Naming studio: main generation (names / domains), availability check (DNS + social HEAD),
"more like this", blend/portmanteau, iterative refine, brand story, and a fast "ThingNamer" quick
mode. **Frontend:** `src/tools/NameStorm.js` (`ns_` keys, ~1670 lines). **Backend:**
`backend/routes/name-storm.js` (7 routes, `MODELS.SMART`; creative-tier rate limit PER-ROUTE — never
`router.use`). **Golden:** `audit/name-storm-golden-sample.json` (3 DE cases). Verify: `npm run check:golden name-storm`.

## Routes
`/namestorm` (main, 9000 / domain 8000), `/namestorm/check` (no AI), `/namestorm/more` (3000),
`/namestorm/blend` (**7500**), `/namestorm/refine` (3000), `/namestorm/story` (2000),
`/namestorm/quick` (3000). **No endpoint uses a `!parsed.X` guard** — each normalizes `problems`
to arrays then `res.json`. Do not add a naive guard (would risk a false 500).

## Audit fixes locked here (2026-07-13)
1. **🐛 MAIN truncation (caught live in German).** Arrays were only prose-capped ("5-7 categories ×
   4-5 names") → up to 35 names truncated at `max_tokens 7000` → `[NameStorm] Response truncated` → 500.
   **Fix:** bound to **5 categories × exactly 4 names (20)** + `max_tokens 9000`; domain mode 4 cats + 8000.
   Verified DE: 20 names, ~4134 tok.
2. **🐛 `/blend` effectively DOWN.** "4 names per strategy (24 total)" with a mandatory verbose
   blend_components recipe per name at `max_tokens 3000` → near-certain German truncation → 500.
   **Fix:** **3 per strategy (18 total)** + `max_tokens 7500`. Verified DE: 18 names, ~4061 tok.
3. **🐛 favorites data-model collision (React crash).** Quick-mode Save stored `{name,source,date}`
   objects while the rest stored plain strings under the same `namestorm-favorites` key → Favorites/
   Compare views hit "Objects are not valid as a React child" + `[object Object]` in copy. **Fix:**
   quick-Save stores the name string; a mount-time migration flattens legacy object entries.
4. **⚠️ `/quick` raw `create` + `JSON.parse`** (no retry/repair) → routed through `callClaudeWithRetry`
   (3000). Removed now-unused `anthropic` + `cleanJsonResponse` imports.
5. **⚠️→cleaned:** 47 annotation leaks stripped + one global brevity line added per prompt.

## DO NOT silently reverse
- main 5×4 + `max_tokens 9000` (domain 4 + 8000); blend 18 + `7500`; `/quick` on `callClaudeWithRetry`;
  string-only favorites + the migration effect; no `!parsed.X` guards; no annotation suffixes.
