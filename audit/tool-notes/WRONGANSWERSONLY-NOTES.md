# WrongAnswersOnly — audit lock notes (`wronganswersonly-v1`, 2026-07-14)

Backend `wrong-answers-only.js` — 1 endpoint `POST /wrong-answers-only`, `MODELS.FAST`, max_tokens 2000→**3000**. Comedy tool: confidently-incorrect answers.

## 🐛 Format-strict — `wrongness_level` broke the meter
Schema described `wrongness_level` as prose (`"1-10 scale of how wrong… — one sentence"`), but the frontend consumes it as a **number**: `wrongnessWidth = ${Math.min(wrongnessLevel*10,100)}%` (CSS width) and `{wrongnessLevel}/10`. A string/prose value → `NaN%` (bar collapses) + garbage meter text.
**Fix:** schema value is now the literal integer `7` + rule: *"wrongness_level MUST be a bare integer from 1 to 10 — no text, no scale description, no quotes."* Verified live: returns `9` (int).

## Other fixes
- **German unescaped double-quotes:** entire output is quotable punchlines + fake citations (`'Dr. Helena Marchetti, University of Turin, 2019'`); German quoted speech → unescaped `"` → 500. Added the no-inner-double-quote rule (RoastMe class).
- **Truncation:** max_tokens 2000→3000 + `EXACTLY 2-3 supporting_evidence` cap (unhinged German is the most verbose path).
- **Annotation leaks:** stripped 8 `— one sentence` suffixes (reached cards + copy output) + global brevity rule.
- **PF-2:** normalized `c.label = c.labelText` alias spacing (`labelText` already in c block).

## Not bugs
- `category`/`seriousness` are English input params (from pill state), sent to backend and never touched by `withLanguage` → no i18n-enum mismatch.
- Guard `!parsed.confident_answer` keys a top-level always-emitted field. Correct.
- `sessionHistory` key `wronganswersonly-history`, capped 6 — self-contained.

## Verify
`npm run check:golden wrong-answers-only` (1 DE unhinged case). Backend must be up.
