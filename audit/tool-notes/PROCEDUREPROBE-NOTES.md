# ProcedureProbe — architecture & lock notes (`procedureprobe-v1`)

Medical/dental procedure literacy — plain-English explanation, is-this-standard verdict, questions to
ask, cost picture, red flags, what-to-expect. **Frontend:** `src/tools/ProcedureProbe.js`. **Backend:**
`backend/routes/procedure-probe.js` (1 endpoint, `MODELS.SMART`, **max_tokens 3500**). **Golden:**
`audit/procedure-probe-golden-sample.json`. Verify: `npm run check:golden procedure-probe`.

## Audit fixes locked here (2026-07-14)
Guard `!plain_english` correct; sync clean; no endpoint down.
1. **🐛 USD-anchor.** `cost_picture.typical_range` (`e.g. '$500-$2,000'`) renders raw → non-US users
   saw `$`. **Fix:** "in the user's local currency, never assume US dollars". Verified DE: "600 EUR bis
   1.200 EUR", 0 raw `$`.
2. **🐛 i18n verdict-color bug.** The frontend switched the verdict badge color on
   `verdict === 'Standard'` / `.includes('second opinion')` — English literals, but `withLanguage`
   localizes `verdict` → always green in 12 languages. **Fix:** added a language-independent
   `verdict_level` enum (standard|alternatives|question|second_opinion, pinned to stay English) and
   switched the frontend color on it. Verified DE: verdict_level='alternatives'.
3. **⚠️ `procedure_duration` `(number)`** — it's free text ("45 minutes"), not a number. **Fix:** plain.
4. **⚠️ truncation:** `questions_to_ask` "6-8" → AT MOST 6 + `max_tokens 2500→3500`.
5. **⚠️→cleaned:** 14 annotation leaks + no-inner-double-quote rule; PF-2 `c.label` alias reordered.

The existing static medical disclaimer (`t('pp_disclaimer')`) is adequate — advisory scope, no
crisis-hotline banner needed.

## DO NOT silently reverse
- Local-currency cost fields; `verdict_level` enum + frontend switching on it (not the localized
  string); `questions_to_ask` ≤6 + `max_tokens 3500`; no annotation suffixes; the no-inner-quote rule.
