# ChaosPilot — architecture & lock notes (`chaospilot-v1`)

Diagnoses the invisible behavioral rut producing someone's stagnation, then designs **one** precise, specific, slightly-uncomfortable disruption to break it (no money/equipment/major time). **Frontend:** `src/tools/ChaosPilot.js`. **Backend:** `backend/routes/chaos-pilot.js` (1 endpoint). **Golden:** `audit/chaos-pilot-golden-sample.json` (2 cases: en, de). Verify: `npm run check:golden chaos-pilot` (needs local backend; sonnet ~25–35s/case).

## Shape
- **1 endpoint `/api/chaos-pilot`.** `claude-sonnet-4-6` (`MODELS.SMART`), `max_tokens 4000`, via `callClaudeWithRetry` + `withLanguage(PERSONALITY)` (system) + `withLocaleContext`.
- Output: `pattern_diagnosis{the_invisible_rut, why_its_invisible, what_its_costing}`, `the_disruption{what, when, the_full_instruction (3-5 sentences), the_slight_discomfort, why_this_one}`, `the_downstream_effect{immediate, within_a_week, compound_effect}`, `if_they_resist`. **All nested objects, no arrays.** Three-layer sync clean (every field renders).
- Guard `if (!parsed.pattern_diagnosis || !parsed.the_disruption)` — both are **top-level objects, always present** (correct guard, kept).
- In `LOCALIZED_TOOLS` (`chp_` prefix); mobile clean; no truncation at 4000 (DE ~34s comfortable).

## Audit fixes locked here (2026-07-11)

1. **🛡️ Robustness — local `withRetry` retried only on 529 overload** (no parse-retry, no truncation fail-fast; identical pattern to CaptionMagic pre-lock). A malformed/truncated response → immediate 500; over-budget → slow 502. **Fix: switched to `callClaudeWithRetry`** (`{model: MODELS.SMART, max_tokens, system, messages}`) — parse-retry + `stop_reason==='max_tokens'` fail-fast + API-error retry, consistent with the codebase. Removed the dead `withRetry` helper + now-unused `anthropic`/`cleanJsonResponse` imports.
2. **⚠️→cleaned: 10 `— one sentence` annotations stripped** — glued onto the diagnosis/disruption/downstream string fields (all rendered raw in the result cards). Latent (didn't echo in tests); BatchFlow class.

## DO NOT silently reverse
1. **`callClaudeWithRetry`** — don't revert to bare `anthropic.messages.create` + local `withRetry`; that drops parse-retry + truncation fail-fast.
2. **Stripped annotations** — don't re-add `— one sentence`; **check-golden checks STRUCTURE not content** — eyeball output after prompt edits.
3. **The guard** — keep it on `pattern_diagnosis`/`the_disruption` (top-level always-present objects).

## Known / accepted
- 0 baseline `audit_v2` / backend-audit issues.
- No arrays in the schema → nothing neutralized in the golden; every section is a required object/string.
- Live EN+DE verified 200 / no leaks post-refactor.

## Rewrite (2026-08-15)
- **Description and tagline** replaced with the owner's copy.
- **The diagnosis is now hedged; the disruption is not.** The tool was reading
  three short form fields and returning psychological verdicts as fact — "what
  is actually atrophying is...", "their existence requires justification
  through service". Beautiful writing, possibly wrong about the person reading
  it. The prompt now carries an explicit rule: the disruption may be as
  specific and confident as it likes, because specificity is what makes it
  believable, but anything said about who they are is a guess and must read as
  one ("one possible explanation is", "it sounds as though", "it may be"). The
  three `pattern_diagnosis` fields repeat the rule where it is easiest to
  ignore. Verified live: three hedge markers, zero hard verdicts.
- **"The door that opens" → "Two weeks from now."** Every other label in the
  ripple section is plain and time-anchored (first 30 minutes, within a week);
  the door was the only metaphor.
- Disclaimer untouched, at the owner's explicit request.

**Open idea, not acted on.** The owner flagged `the_slight_discomfort` ("around
minute three, a very specific feeling will arrive... that feeling is the
pattern defending itself") as a reusable pattern worth borrowing into Bill
Rescue, Alternate Path, One Percenter and Spiral Stopper. Predicting the
resistance rather than pretending it will not come. Worth a deliberate pass.
