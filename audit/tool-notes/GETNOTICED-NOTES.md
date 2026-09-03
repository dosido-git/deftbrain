# LuckSurface — architecture & lock notes (`lucksurface-v1`)

"Luck surface area" analyzer: current→target serendipity score + 5 moves to widen it. **Frontend:**
`src/tools/LuckSurface.js` (in `LOCALIZED_TOOLS`, `lks_`). **Backend:** `backend/routes/luck-surface.js`
(single endpoint). **Golden:** `audit/luck-surface-golden-sample.json` (1 DE case). Verify: `npm run check:golden luck-surface`.

## Shape
1 endpoint, `claude-sonnet-4-6` (`MODELS.SMART`), **`max_tokens 3000`**, `callClaudeWithRetry` +
`withLanguage` + `withLocaleContext`. Guard `!parsed.audit` ✅.

## Audit fixes locked here (2026-07-13)
1. **🐛 CSS-width field leak (GravityWell class).** `audit.current_surface_area` and
   `the_target.new_surface_area` are rendered BOTH as a big displayed number AND as raw
   `style={{ width: value }}` progress bars (`LuckSurface.js:204/210/279/282`), but their schema
   examples were prose (`"A percentage — dramatic and specific, e.g. '14%' — one sentence"`) → a
   prose response breaks both bars + garbles the number. **Fix:** bare-percentage schema example
   (`"14%"`/`"43%"`) + explicit "BARE percentage string ONLY" rule. Verified live: `11%`/`43%`.
2. **⚠️→cleaned: 12 annotation leaks** (`— one sentence` ×~10, `— 3-6 words` ×2). Stripped + one
   global brevity/RULES line.
3. **⚠️ Truncation:** 38-field schema at `max_tokens 2200` (German-tight). **Fix:** EXACTLY 5 moves
   cap + `max_tokens` → **3000**. Verified DE: ~1.9K tokens.

## DO NOT silently reverse
1. `current_surface_area` / `new_surface_area` are **bare percentage strings** (rendered as CSS width).
2. EXACTLY 5 moves + `max_tokens 3000`; no annotation suffixes.
