# VirtualBodyDouble — audit lock notes (`virtualbodydouble-v1`, 2026-07-14)

Backend `virtual-body-double.js` — **1 endpoint `POST /virtual-body-double` with a 10-way `action` switch** (start, breakdown, check-in, complete, stuck, extend, break, invite, review, card), all `MODELS.SMART`. Nine branches at max_tokens 4000; `complete` was **900**.

## 🐛 `complete` truncation on the 900-token path
`complete` emits 7 string fields (several multi-sentence) and feeds the primary copy/share **card** (celebration, accomplishment_reframe, card_quote). At 900 tokens a German run truncated → `callClaudeWithRetry` fails fast on `stop_reason=max_tokens` → 500 → frontend fell back to canned text (AI celebration lost). **Fix:** raised to **1800**. Verified live (DE grind wrap): 200, all 7 fields, no truncation.

## 🐛 i18n-enum — `difficulty` color-coding broke in 12 languages
`breakdown` emits `sub_tasks[].difficulty` (`easy|medium|hard`); the frontend colors each sub-task on the English literal. `withLanguage` localized it → all fell to the amber "medium" default. **Fix:** schema value is now `"easy"` + a rule pinning `difficulty` to the English codes (do-not-translate). Verified live (DE): `['easy','easy','medium','medium','easy']`.

## Other fixes
- **German unescaped double-quotes + brevity:** added a shared `JSON_RULES` const injected into **all 10** prompts (`${JSON_RULES}` before each template close). Quote-heavy branches (invite/check-in/break/extend/complete) would 500 on German quoted speech. Verified invite (DE): no raw `"` in messages.
- **Annotation leaks:** stripped ~47 (`— one sentence`, `— 2-4 sentences`, `— 3-6 words`, `(number)`, `(one emoji)`) across all branches; the shared brevity line replaces them.
- **`review` falsy-numeric guard:** `!parsed.total_sessions` → `=== undefined` (a legit `0` would 500).
- **Frontend:** removed a dead empty seed button that also hardcoded an English task string; removed 2 dead complete-view reads (`reflection_prompt`/`energy_advice` — `complete` never emits them; they belong to start/extend).

## Not bugs
- The backend-audit S7.13 flag on `sub_tasks` is a **false positive** — the multi-action audit only parses the first (`start`) schema; the `breakdown` branch does emit `sub_tasks`. Each branch guard keys a top-level field its own schema emits.
- `vbd-session-log` localStorage capped `slice(0,6)`; tool-private (not the shared `fp-history` family).

## Verify
`npm run check:golden virtual-body-double` (3 branch cases: complete/breakdown/invite, all DE). Backend must be up.
