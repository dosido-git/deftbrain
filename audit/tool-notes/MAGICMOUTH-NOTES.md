# MagicMouth — architecture & lock notes (`magicmouth-v1`)

Get-what-you-want advocacy: analyze an ask + write the script (main), navigate a phone tree
(phone-tree), or apply maximum legal pressure (nuclear). **Frontend:** `src/tools/MagicMouth.js`
(`mm_` keys). **Backend:** `backend/routes/magic-mouth.js` (3 endpoints, `MODELS.SMART`).
**Golden:** `audit/magic-mouth-golden-sample.json` (2 DE cases). Verify: `npm run check:golden magic-mouth`.

## Shape
3 endpoints sonnet-4-6 via callClaudeWithRetry + withLanguage + withLocaleContext: main (2500,
guard `!situation_read && !the_script`), phone-tree (2500, `!company_type`), nuclear (**5500**, `!situation_assessment`).

## Audit fixes locked here (2026-07-13)
1. **🐛 German 500-every-call (unescaped quotes).** The quoted-phrase fields (`the_script.*`,
   `magic_phrases`, `magic_sentences`) emitted unescaped double-quotes in German → invalid JSON →
   parse-fail all retries → 500. **Fix:** a "never place a double-quote inside a string value" rule
   in ALL 3 prompts. (Same class as MentalHealthNavigator.)
2. **🐛 `leverage_level` enum leak.** Was `"...high, medium, low, or very_low — one sentence"`; the
   frontend switches on it for badge color + `.toUpperCase()` → a leak breaks the badge. **Fix:**
   clean enum `"high | medium | low | very_low"`.
3. **🐛 `winnable` sync break.** Emitted under `situation_assessment.winnable` but the frontend read
   `honest_assessment.winnable` → the winnable badge was always dead. **Fix:** repointed the frontend.
4. **🐛 main guard phantom field.** Guarded `!parsed.scripts` but the schema emits `the_script`. **Fix:**
   `!situation_read && !the_script`.
5. **⚠️ Nuclear truncation.** `escalation_ladder` + `magic_sentences` uncapped at 4000. **Fix:**
   escalation_ladder ≤4, magic_sentences ≤3, `max_tokens` → **5500**. Verified DE: escalation 4, magic 3.
6. **⚠️→cleaned: 67 annotation leaks** (`— one sentence` ×59, `— 3-6 words` ×8 on titles/names).

## DO NOT silently reverse
1. The **no-inner-double-quote rule** in all 3 prompts — without it German 500s every call.
2. `leverage_level` clean enum; frontend reads `situation_assessment.winnable`; main guard `!the_script`.
3. Nuclear caps (escalation ≤4, magic ≤3) + `max_tokens 5500`; no annotation suffixes.
