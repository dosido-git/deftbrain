# GetNoticed — architecture & lock notes (`lucksurface-v2`)

Renamed from Luck Surface on 2026-09-02, and rewritten at the same time: the
percentage premise is gone (there is no denominator for available serendipity),
replaced by a qualitative narrow/mixed/broad reading. **Frontend:**
`src/tools/GetNoticed.js` (in `LOCALIZED_TOOLS`). **Backend:**
`backend/routes/get-noticed.js`, endpoint `/api/get-noticed` (single endpoint).
**Golden:** `audit/get-noticed-golden-sample.json`. Verify: `npm run check:golden get-noticed`.

**The `lks_` i18n prefix stays**, along with its catalog file
`src/i18n/locales/tools/luck-surface.js`. Renaming an i18n prefix buys nothing
and risks a silent collision across the flat per-language namespace; the file
path is also what the Gate 5 allowlist is keyed on. Everything else — file,
endpoint, retry label, log prefix, golden — follows the catalog id.

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
