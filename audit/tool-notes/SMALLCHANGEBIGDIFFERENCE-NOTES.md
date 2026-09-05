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

## Rename + full rewrite, 2026-09-05 (`OnePercenter` → `SmallChangeBigDifference`)

**Rename.** "One Percenter" → "Small Change, Big Difference," alongside the
rewrite below. Component file, `tools.js` id/title/tagline/description/guide,
`TOOL_IDS`, OG slug map (added a `SmallChangeBigDifference` key pointing at
the same `one-percenter` slug value; the old `OnePercenter` key stays, per
the `CrashPredictor` precedent), `TOOL_ALIASES`, and `localization-audit.js`
allowlist all updated. `server.js` 301s from `/OnePercenter`, `/onepercenter`,
`/one-percenter`, single-hop to `/SmallChangeBigDifference`.
**Deliberately left unchanged, per the established i18n-stability precedent
(SubSweep/DebateMe) — this tool was already locked (`onepercenter-v1` +
golden sample) before this pass:** backend route file/endpoint
(`one-percenter.js` / `/api/one-percenter`) and i18n filename/prefix
(`one-percenter.js` / `op_`). No separate request to move those was made
this time — contrast Document Detective, where the user asked for the
backend rename explicitly in a follow-up.

**SSE streaming architecture preserved unchanged.** This route predates the
v2 output standard's `callClaudeWithRetry` + `runOutputGuard` convention and
streams raw via `anthropic.messages.stream` (old tool-notes: "Streaming is
intentional — keep it"). The new schema is smaller than the old one (no more
multi-sentence "how the system works" essay or "a year from now" paragraph),
so there was no truncation-risk argument to convert it either way, and
converting to a synchronous call purely to gain the LLM-adversarial guard
was a bigger architectural change than the rewrite asked for. Instead,
`router.outputStandard = 'v2'` and `router.outputGuard = {checks:
['validateResult'], note}` are declared as metadata (matching NerveCheck's
pattern, which similarly doesn't call the imported `runOutputGuard`), and a
local regex `validateResult` — same walk/blank/prune shape as NerveCheck's —
runs once on the fully-assembled object right before the SSE `done` event.

**Why rewrite, not just rename.** "One Percenter" promised a mathematically
optimal "1%" intervention and the "largest compound effect" from nothing but
a self-described routine, then invented cortisol, melatonin, a
"threat-detection mode," fabricated compound math it had no basis for, and a
vivid one-year future the visitor supplied no evidence for.

**Five `validateResult` rule categories**, chosen to match the exact
fabrication classes named in the live bug report: invented physiology/
neuroscience (cortisol, melatonin, dopamine, nervous system,
threat-detection mode, stress debt, cognitive depletion/fuel/load,
circadian, reactive mode), claimed mathematical/scientific optimality
(mathematically optimal, highest-leverage intervention, the true
bottleneck, largest compound effect, objectively second-order), predicting
the visitor's future without evidence ("a year from now," identity
transformation — a backstop even though the schema no longer asks for this
field at all), armchair psychology about why the visitor hasn't already
made the change (resistance, discipline, blind spots), and invented
downstream time/energy/productivity savings not derivable from a supplied
quantity (hours recovered, earlier sleep onset, productivity gained).
**Math itself is NOT regex-validated** — arithmetic correctness from a
supplied quantity is a judgment call code can't make; the prompt's own MATH
section rules are the only guard there, and they held up in both live tests
(one derived "20 minutes × 5 weekdays," the other correctly omitted math
entirely since no defensible calculation existed).

**Schema replaced**: `routine_diagnosis`/`the_one_change`/
`why_not_other_things`/`the_year_from_now` → `what_i_notice`/
`change_to_try`/`why_not_start_elsewhere`/`what_to_watch_for`.
"A Year From Now" is gone with nothing replacing its promise of a
transformed future — `what_to_watch_for` replaces it with observable,
checkable signs the visitor can judge for themselves
(`signs_it_is_helping[]` / `signs_to_rethink_it[]`).

**Live-verified on two fresh routines** (the tool's own built-in examples):
neither response contained any of the banned physiology/optimality/
future-prediction/psychology language, `validateResult` found nothing to
blank on either run (a clean first draft, not a caught-and-fixed one), math
was correctly grounded in one case and correctly omitted in the other, and
"why not start elsewhere" named exactly two alternatives without claiming
either would fail. Both are now the golden sample's two cases.

**i18n.** 20 changed + 10 new + 1 title-only key (31 total) translated
across 12 languages directly (not Workflow — short, formulaic UI labels, not
long prose); 19 unchanged keys carried over as-is (the two built-in example
routines needed no changes — they're pure input text, independent of the
output schema); 12 dead keys removed, including 3 (`op_chaospilot`,
`op_premortem`, `op_futureproof`) that were already unused before this pass
(the cross-ref links use `op_xref_chaospilot` etc., a naming near-miss from
whenever those were first added). `localization-audit` and
`i18n-convention-audit` both came back clean, 0 new findings.

**localStorage**: result key bumped to `onepercenter-result-v2` (result
shape changed completely); history key (`onepercenter-history`) untouched —
it only ever stored a preview string, unaffected by the schema change.
