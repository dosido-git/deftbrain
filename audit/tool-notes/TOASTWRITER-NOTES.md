# ToastWriter — audit lock notes (`toastwriter-v1`, 2026-07-14)

Backend `toast-writer.js` — 1 endpoint `POST /toast-writer`, `MODELS.FAST`, max_tokens 4000→**6000**. Generates 3 toast/speech versions.

## Fixes
- **German unescaped double-quotes:** the whole output is quotable speech (`speech`, `opening_line`, `closing_line`, `emergency_closer`); German quoted dialogue → unescaped `"` → 500. Added the no-inner-double-quote rule. NOTE: the model may still occasionally quote dialogue — the shared `repairJsonStrings` (lib/claude.js) repairs it so it parses to 200 (the golden's v1 speech has a valid dialogue quote). The failure mode we prevent is a hard 500, and the DE 5-minute run returned 200.
- **Truncation:** 3 full speeches (`duration` up to `5_minutes`) with an uncapped `speech` at 4000 truncated a German 5-minute toast. Raised to **6000** + a speech length bound (~200-300 words, never >5 min). Verified live (DE 5-min): 200, 3 versions, speech ~2000 chars, no truncation.
- **Annotation leaks:** stripped 6 `— one sentence`, incl. a self-contradictory one on the multi-paragraph `speech` field; added a global brevity RULE.
- **Frontend minor:** `EXAMPLES[1].tone` was `'warm'` (not a valid `TONES` value) → `'warm_and_funny'` so the pill highlights after loadExample.

## Not bugs
- `tone`/`duration` are English input params (pill state), never model output → no i18n-enum mismatch.
- `style` badge is rendered raw (localized display text) — no frontend switch, fine.
- Guard `!Array.isArray(parsed.versions) || !length` keys a top-level field. Correct. PF-2 already clean (labelText + aliases present).

## Verify
`npm run check:golden toast-writer` (1 DE 5-minute case). Backend must be up. ~38s.
