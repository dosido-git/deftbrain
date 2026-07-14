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
