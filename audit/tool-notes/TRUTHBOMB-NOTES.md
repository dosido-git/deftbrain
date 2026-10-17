# TruthBomb — audit lock notes (`truthbomb-v1`, 2026-07-14)

Backend `truth-bomb.js` — 1 endpoint `POST /truth-bomb`, `MODELS.SMART`, max_tokens 2200→**3500**.

## 🐛 Three-way sync — `what_wouldnt_change` never rendered (silent data loss)
Backend emits `what_wouldnt_change` inside `what_would_actually_happen` (alongside `what_it_would_change`), but the frontend read it under `the_timing` (`the_timing.what_wouldnt_change` in the timing row loop) → always `undefined` → the "Won't change" row never appeared; meanwhile the emitted field was orphaned (the `what_would_actually_happen` block only rendered 3 of its 4 fields).
**Fix:** render `what_wouldnt_change` in the `what_would_actually_happen` block (semantic home — pairs with `what_it_would_change`) and remove the orphan row from the timing loop. Kept the schema field where it is. Verified live: field present + rendered.

## Other fixes
- **German unescaped double-quotes:** `the_words` is the verbatim thing-to-say, wrapped in literal `"…"` by the frontend italic block; German quoted speech would emit unescaped `"` → 500. Added the no-inner-double-quote rule (write the words plainly, no quote marks).
- **`the_honest_cost` was mis-annotated `(number)`** but is rendered as prose text — stripped the annotation; it stays a sentence.
- **Annotation leaks:** stripped 24 (`— one sentence` ×23 + the `(number)`) that reached card headers (`version`) and copy output (`the_words`, `what_it_accomplishes`); added a global brevity RULE.
- **Truncation:** max_tokens 2200→3500 + `EXACTLY 3 items in three_ways_to_say_it` (28-string schema, German ~30% longer).
- **PF-2:** frontend c-block had no `labelText` and was missing both aliases → added `labelText` + `c.textMuteded`/`c.label`.

## Not bugs
- `directness` is a bare int 1-3, rendered as opacity dots by array index — language-independent, not an enum bug.
- `is_silence_legitimate` boolean → styled emerald/amber. Fine.
- Guard `!parsed.the_thing_examined` keys a top-level always-emitted object. Correct.

## Verify
`npm run check:golden truth-bomb` (1 DE verbose case). Backend must be up. ~33s (SMART).

## v2 output standard (2026-10-17)
Reviewed against `backend/lib/outputStandard.js` after the progressive speed change (pushed that day with `OUTPUT_STANDARD_SKIP=1`). Now `router.outputStandard = 'v2'` with a tool guard.
- **No prompt change needed.** The tool's core principle (speaking and silence equally legitimate) agrees with v2 §3–4; `if_they_dont_respond_well` + `permission_to_not_say_it` already supply the §5 recovery path; no schema field trips Gate 9's smell list.
- **Guard** (`guardTruthBomb`, runs in the progressive `check`, after the answer shows; fail-open): checks the reading, reality check, the three `the_words`, `if_they_dont_respond_well`, `the_honest_cost`, `safety_note`. `router.outputGuard` turns the prompt's rules 3–16 into prohibit terms (suspicion→fact, guessed position→stated position, scope strengthening, silence-as-damage, scripts adding concessions, tilting toward speaking).
- **Live (DE golden, 2 runs, $0.34 total from metrics.jsonl):** PASS. Guard flagged 4 fields per run; inspected repairs were mild and correct-ish — e.g. `what_you_dont_know` dropped "Ob Thomas das bewusst tut" (presupposed he is doing it). No hedging into uselessness, no enum/structure damage. Check adds ~8s after the answer is on screen; first part still ~7s.
- Per run: 4 SMART parts ≈ $0.115, consistency (SMART) ≈ $0.028, guard + repairs (FAST) ≈ $0.027.
