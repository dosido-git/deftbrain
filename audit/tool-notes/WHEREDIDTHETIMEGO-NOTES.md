# WhereDidTheTimeGo — audit lock notes (`wheredidthetimego-v1`, 2026-07-14)

Backend `where-did-the-time-go.js` — 1 endpoint `POST /where-did-the-time-go`, `MODELS.FAST`, max_tokens 2500→**3500**. Time-perception gap analysis.

## 🐛 Truncation (confirmed 500)
Array bounds were a soft prose instruction only ("Provide 3-5 activities and 2-4 categories") at max_tokens 2500. A full 5-activity German day **500'd on the golden input** (`Response truncated at max_tokens=2500`). **Fix:** hard caps (`activities ≤ 5`, `where_it_went ≤ 4`) + max_tokens **3500**. Verified live (DE verbose): 200, 5 activities + 4 categories, no truncation.

## Other fixes
- **German unescaped double-quotes:** prose fields (`biggest_gap`, `change`, `why_you_didnt_see_it`) quote speech in German → 500. Added the no-inner-double-quote rule.
- **Annotation leaks:** stripped 14 `— one sentence` (all reached cards + copy via `buildFullText`) + global brevity rule.
- **Frontend:** removed a dead empty seed button that hardcoded an English day description; added PF-2 `labelText` + `c.textMuteded`/`c.label` aliases (were missing → 2 audit warnings).

## Not a bug (verified)
- **NOT format-strict.** Every numeric-ish field (`total_hours_described`, `estimated_time`, `total_unaccounted`, `time_reclaimed`, …) is prose rendered as a **plain text badge with a `~` prefix** (e.g. `~{total_hours_described}`) — no CSS-width bar, no `{v}/10`. Do NOT "fix" these to bare numbers.
- No i18n-enum (category is free-form prose, no frontend switch). No USD-anchor (all time, no money).
- Guard `!parsed.what_you_actually_did` keys the first top-level field. Correct.

## Verify
`npm run check:golden where-did-the-time-go` (1 DE verbose case). Backend must be up. ⚠️ ensure a FRESH server (the fix is max_tokens — a stale 2500 server will 500).
