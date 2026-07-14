# SignalVsNoise — architecture & lock notes (`signalvsnoise-v1`)

Epistemics tool — separates settled consensus (signal) from genuine debate and manufactured
controversy (noise) on any topic. **Frontend:** `src/tools/SignalVsNoise.js`. **Backend:**
`backend/routes/signal-vs-noise.js` (1 endpoint, `MODELS.SMART`, **max_tokens 5000**). **Golden:**
`audit/signal-vs-noise-golden-sample.json`. Verify: `npm run check:golden signal-vs-noise`.

## Audit fixes locked here (2026-07-14)
Guard `!the_signal || !why_this_field_is_noisy` correct; no endpoint down; **`noise_type` uses the
CORRECT language-independent enum pattern** (switch on a machine token, display via `t(cfg.key)`) —
left as-is, it is the model for fixing the other tools' enums.
1. **🐛 Truncation (2 passes).** 4 arrays of multi-field objects truncated at 3000 AND again at 4000 on
   a maximally-noisy topic (nutrition) in German. **Fix:** cap the_signal.items ≤4, the_noise ≤5,
   genuinely_debated ≤3, sources_of_noise ≤4 + `max_tokens 5000`. Verified DE: ~3227 tok.
2. **⚠️ German quotes.** `the_noise[].claim` is wrapped in literal quotes by the frontend → quote-risk;
   added the no-inner-double-quote rule.
3. **⚠️→cleaned:** 20 annotation leaks + a global brevity line in PERSONALITY.

## DO NOT silently reverse
- The 4 array caps + `max_tokens 5000`; the no-inner-double-quote rule; `noise_type` stays a machine
  enum displayed via `t()` (do not "localize" it); no annotation suffixes.
