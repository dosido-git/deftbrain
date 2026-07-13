# MentalHealthNavigator — architecture & lock notes (`mentalhealthnavigator-v1`)

Helps someone navigate to the right kind of mental-health support: warm reflection, 2-3
recommended support types (with why / what-to-expect / how-to-find / cost), what-to-say,
barriers addressed, immediate steps. **SENSITIVE DOMAIN.** **Frontend:**
`src/tools/MentalHealthNavigator.js` (in `LOCALIZED_TOOLS`, `mhn_` keys). **Backend:**
`backend/routes/mental-health-navigator.js` (single endpoint `/mental-health-navigator/stream`
— misnamed, plain JSON; re-serializes a fixed field whitelist). **Golden:**
`audit/mental-health-navigator-golden-sample.json` (2 DE cases). Verify: `npm run check:golden mental-health-navigator`.

## Shape
1 endpoint, `claude-sonnet-4-6` (`MODELS.SMART`), **`max_tokens 5000`**, via `callClaudeWithRetry`
+ `withLanguage` + `withLocaleContext`. Guard `!parsed.what_you_described || !Array.isArray(parsed.recommended_support)` ✅. Does **not** log PII.

## Audit fixes locked here (2026-07-13)
1. **🐛 German 500-every-call (found during the safety work).** The German `what_to_say` phrases
   (quoted example sentences) emitted **unescaped double-quotes** → invalid JSON → `callClaudeWithRetry`
   parse-fail on all retries → 500 for German users. The shared `repairJsonStrings` can't fix inner
   quotes. **Fix:** a "CRITICAL JSON RULE: never place a double-quote inside a string value" in the
   Guidelines. (⚠️ the raw model output *parses* when captured directly — the failure only shows
   through the route; and putting the safety directive in the SYSTEM prompt ALSO destabilized JSON
   output, so the safety rule lives in the user-prompt Guidelines, not the system prompt.)
2. **🐛 SAFETY — no acute-crisis path.** The tool had a static disclaimer but no concrete numbers and
   no acute handling. **Fix (defense in depth):**
   - **Static crisis banner** — appended concrete numbers (US/Canada 988; UK/Ireland Samaritans
     116 123; local emergency) to `mhn_intro` in **all 13 languages**, now rendered on **both** input
     AND results screens (model-independent net).
   - **Guidelines SAFETY rule** — on acute risk, lead `what_you_described` with care and make the
     FIRST `recommended_support` a crisis line. Verified live: German acute → first support =
     "Krisentelefon – Telefonseelsorge Deutschland" (the CORRECT localized line, better than 988).
3. **⚠️ `none` barrier leak.** `BARRIER_LABELS` had no `none` key → a "no barriers" selection reached
   the prompt as the literal barrier "none". **Fix:** `none: ''` (filtered by `.filter(Boolean)`).
4. **⚠️ Headroom:** `max_tokens` 4000 → **5000** (typical DE ~1.6K tokens — huge margin).

## DO NOT silently reverse
1. The **"never place a double-quote inside a string value" JSON rule** — without it German 500s every call.
2. The safety directive stays in the **user-prompt Guidelines**, NOT the system prompt (system-prompt
   version broke JSON output).
3. The `mhn_intro` crisis clause in all 13 languages, on input AND results.
4. `BARRIER_LABELS.none = ''`; `max_tokens 5000`.

## Known / accepted
- No dedicated `crisis_notice` field — the model routes crisis into `recommended_support[0]`
  (correct localized line) + the static banner is the reliable net. A dedicated field both broke
  parsing and would be dropped by the response whitelist.
