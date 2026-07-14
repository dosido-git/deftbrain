# WhatsMyVibe — audit lock notes (`whatsmyvibe-v1`, 2026-07-14)

Backend `whats-my-vibe.js` — 1 endpoint `POST /whats-my-vibe`, `MODELS.FAST`, max_tokens 4000. Analyzes a person's communication "vibe" from pasted writing.

**Cleanest tool in the final batch** — no DOWN endpoint, no i18n-enum, no format-strict, no truncation exposure. Standard hygiene lock.

## Fixes
- **German unescaped double-quotes:** the tool analyzes/quotes the user's own writing; German output introduces quoted phrases → unescaped `"` → 500. Added the no-inner-double-quote rule.
- **Annotation leaks:** stripped 10 `— one sentence` (5 reached copy output via `buildFullText`) + a global brevity RULE + `EXACTLY 3 quirks` cap.
- **PF-2:** added `c.textMuteded` + `c.label` aliases (`labelText` already in c block).

## Not bugs (verified)
- **No i18n-enum:** `SOURCE_TYPES` are input pills sending language-independent values (`texts`, `work-slack`…); no AI-output enum is frontend-switched.
- **No format-strict:** every field is prose; the only numeric (`wordCount`) is frontend-computed.
- No USD-anchor (2 `$` hits are `${…}` template literals).
- Guard `!parsed.vibe_description` keys a top-level always-emitted field. Correct.
- `sessionHistory` key `whatsmyvibe-history`, consistent.

## Verify
`npm run check:golden whats-my-vibe` (1 DE case). Backend must be up.
