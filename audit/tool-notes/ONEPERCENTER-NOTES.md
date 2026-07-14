# OnePercenter — architecture & lock notes (`onepercenter-v1`)

Finds the single highest-leverage 1% change in a daily routine. **Frontend:** `src/tools/OnePercenter.js`.
**Backend:** `backend/routes/one-percenter.js` (1 endpoint, `MODELS.SMART`, **SSE streaming** via
`anthropic.messages.stream` — the client accumulates `chunk` events and parses the final JSON; no
server-side guard). **Golden:** `audit/one-percenter-golden-sample.json`. Verify: `npm run check:golden one-percenter`.

## Audit fixes locked here (2026-07-14)
1. **🐛 phantom `when_to_start` → literal "undefined" in copy.** `buildText()` emitted
   `${t('op_copy_start')} ${ch?.when_to_start}`, but the schema never emits `when_to_start` → every
   copied/shared result contained "Start: undefined". **Fix:** dropped the clause — the "when to start"
   info already lives in `implementation`. Verified DE: implementation = "Heute Abend, vor dem
   Schlafengehen…".
2. **⚠️ PF-2 missing alias.** Added `c.label = c.labelText`.
3. **⚠️→cleaned:** 8 `— one sentence` leaks on the primary render/copy fields; added a global brevity
   line to PERSONALITY.

Schema is all scalar strings (zero arrays) at `max_tokens 4000` → no truncation risk. Streaming is
intentional — keep it.

## DO NOT silently reverse
- Keep SSE streaming; NO `when_to_start` reference in `buildText()`; the `c.label` alias; the global
  brevity line in PERSONALITY; no annotation suffixes.
