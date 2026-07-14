# TipOfTongue — audit lock notes (`tipoftongue-v1`, 2026-07-14)

Backend `tip-of-tongue.js` — 2 endpoints `MODELS.FAST`:
- `POST /tip-of-tongue` (main identify) — max_tokens 3000→**4000** — `matches[]`
- `POST /tip-of-tongue/refine` (narrow after feedback) — max_tokens 2000→**3000** — `matches[]`

## 🐛 i18n-enum — confidence badge/bar/color wrong in all 12 non-English languages
`matches[].confidence` is a machine enum (`high|medium|low`) that the frontend switches on three ways: badge text+emoji (🎯 likely / 🤔 maybe / 💭 possible), bar color, and `confBg`/`confText`. `withLanguage` localizes JSON string values → German returned `hoch/mittel/niedrig` etc. → every branch fell through to the **low/blue "possible"** default. Net: every match in 12 languages rendered as low-confidence blue, defeating the confidence ranking that is the tool's core value.
**Fix:** pinned `confidence` to exact English lowercase codes in **both** prompts (do-not-translate rule); the frontend English switch is now correct in every language. Verified live (DE): confidence values came back `['high','high','medium','medium']` and `['high','medium','high']`. `confidence_pct` stays a number (drives bar width). This is the reference i18n-enum fix pattern (pin the code value, localize only prose).

## Other fixes
- **German unescaped double-quotes:** candidate names + lyric fragments get quoted → 500 in German. Added the no-inner-double-quote rule to both prompts.
- **Truncation:** main matches capped 3-4 + `also_try ≤ 3` + max_tokens 3000→4000; refine matches 2-3 + 2000→3000 (both were unbounded — `also_try` had no count).
- **Annotation leaks:** stripped 17 `— one sentence` / `— 3-6 words` (reached `name`/`why_it_fits`/`how_to_find` in copy output) + global brevity rule per prompt.
- **PF-2:** normalized `c.label = c.labelText` alias spacing.

## Not bugs
- Both guards key top-level `matches[]` — correct.
- History is local `usePersistentState('tip-of-tongue-history')`, never sent to backend; refine sends `previousMatches`/`originalDescription`/`refinement`, all read. No dead-param.

## Verify
`npm run check:golden tip-of-tongue` (2 DE cases). The confidence value must stay English `high/medium/low`. Backend must be up.
