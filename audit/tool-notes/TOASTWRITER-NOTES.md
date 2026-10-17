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
`npm run check:golden toast-writer` (EN + DE cases since v2). Backend must be up. ~25-40s each.

## v2 (2026-10-17)
- **Declares `router.outputStandard = 'v2'`** with a tool guard (`router.outputGuard`): invented story detail/cause/aftermath, a character verdict drawn from an anecdote, words or feelings put in someone's mouth, unsupplied absolutes, the avoid list, tips written as notes to the writer.
- **`runOutputGuard` replaces `checkConsistency`** inside the progressive `check` — one call runs the v2 review and the contradiction/ignored-choice check side by side. Labels and `estimated_time` are read-only; speeches are `requiredNonEmpty`.
- **Guard on `MODELS.SMART`**, not the route's Haiku. Live: the Haiku checker passed "three hours by bike" (she drove) and "the way you've shown up for the people you love"; Sonnet caught and cleanly removed the same class. Cost per run ~$0.12 → ~$0.19.
- **After a repair**, `opening_line`/`closing_line` are re-read from the speech if they no longer match it, and `estimated_time` is recomputed.
- Tips and mistakes: fixed "2-3" → "1-3" (v2 §7: a slot is not a reason to fill it).
- Golden re-captured: EN best-man example (avoid list) + the DE 5-minute case. Short speeches on thin input are by design.
- Residual: the check is a model and misses some (see the golden's `known_issues`).
