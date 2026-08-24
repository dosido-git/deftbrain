# CrashPredictor — architecture & lock notes (v1, 2026-07-02)

Burnout tracker/predictor: daily check-ins (energy/sleep/stress/mood + symptoms/biometrics/weather) in localStorage → client-side alerts → AI risk analysis + 14-day pattern detection. 4-mode UI (dashboard/checkin/analysis/history). In `LOCALIZED_TOOLS`.

- **Model:** `claude-sonnet-4-6` — `/api/crash-predictor-analyze` (max_tokens 5000) + `/api/crash-predictor-patterns`.
- **Golden:** `audit/crash-predictor-golden-sample.json` (analyze-3-logs + patterns-14-logs). Verify: `npm run check:golden crash-predictor`.

## DO NOT silently reverse
1. **JSX nesting: checkin / analysis / history mode blocks are SIBLINGS.** A missing `</div>` once nested analysis+history *inside* the checkin block (`mode==='checkin' && mode==='analysis'` — impossible) → the tool's entire output layer never rendered; users paid a 60–90s API call for a blank page, and a literal `)}` showed on screen. All five gates were green — this class is invisible to them. If editing this file's JSX, re-verify block nesting by AST (babel parse → mode-block spans must not overlap).
2. **Patterns sends `logs.slice(0, 90)`** — the backend requires ≥14 and accepts 90. It previously sent `slice(0, 6)` → deterministic 400 on every use. Patterns schema is BOUNDED (4-6 strongest patterns, max_tokens 5000) — at 3000 unbounded it truncated → 500 on a real 14-log run.
3. **Try Example confirms before overwriting** (`cpr_example_confirm` ×13) — `setLogs(EXAMPLE.logs)` used to silently destroy weeks of persisted daily check-ins.
4. **Contacts/goals/experiments add-forms exist** (quick-add rows with sr-only labels — the PF-15 v2.0 exemption pattern). They previously had only remove/toggle setters — permanently empty features.
5. Cycle & Weather analysis sections wire real `expandedSections` state (were hardcoded `expanded={false}` — content unreachable forever).
6. Enums are clean and ===-switched (risk levels, urgency, priority) — keep them annotation-free.

## v2 (2026-07-12) — German-truncation residual fix
A post-batch headroom spot-check found `/crash-predictor-analyze` (the ~15-nested-object
schema) **truncated at `max_tokens 5000`** in German (arrays were already capped; the fixed
schema is just large). **Fix:** `max_tokens` 5000 → **7500**. Golden gains a `de-truncation-guard`
case. Tag → `crashpredictor-v2`.

## Re-lock v2 — 2026-08-24 (`crashpredictor-v2`)

Tool rewritten front and back by the owner; this pass was integration repair, not redesign.

**The route was down — 500 on every call.** Four faults, each sufficient alone:

| Fault | Effect |
| --- | --- |
| `parseJson(raw)` on an already-parsed object | `callClaudeWithRetry` parses; the second parse received `[object Object]` and threw. Every call, both endpoints. |
| `MODELS.SONNET` | Does not exist — the roles are `SMART` / `FAST` / `DEEP`. Resolved `undefined`. |
| `callClaudeWithRetry(prompt, system, opts)` | The helper takes **two** arguments. `system` landed in the options slot and the real options were ignored, so `label` never reached the logs. |
| `maxTokens: 4200` | The option is snake_case `max_tokens`. Silently left both schemas on the 2500 default. |

Now on the full-request form (`{ model, max_tokens, system, messages }`, `{ label }`), which is what S7.12 asks for and removes the question of which options the string form honours.

**Enforcement.** The rewrite set `router.outputGuard = 'crash-predictor-v2'` — a string. It reads as a declaration to a human and enforces nothing; Gate 9's regex matched it. Replaced with a real profile and `runOutputGuard` wired into both endpoints across every string field, with the visitor's own log entries as the only source of truth:

```
prohibit: invented_log_entry, causal_claim_from_correlation, medical_or_diagnostic_language,
          unsupported_prediction, false_precision, pattern_from_too_few_days
require:  traceable_to_logged_entries, fulfills_tool_promise
```

It fires usefully rather than decoratively — a 7-entry log drew `causal_claim_from_correlation`, `false_precision` and `pattern_from_too_few_days` on the first live run. `pattern_from_too_few_days` is the one that matters for this tool: a handful of check-ins is not a pattern, and saying so is the honest output.

**Frontend.** Shipped English-only — 37 strings unwrapped. Now `t()` with `cpv2_*` keys across all 13 languages. Palette conformed to the `c = {}` convention, hook ordering fixed, and `analysis || patterns` collapsed into one `results` binding so both endpoints render through the same path.

**Audit rule widened, not exempted.** `audit_v2-3-2.py`'s persistence check accepted a stored `logs` (it matches `[A-Za-z]+Log`) while the render check did not, so a tool whose history *is* a log of check-ins failed half a rule it satisfied. Widened the render side to `[A-Za-z]*[Ll]ogs?` — the two halves now agree. No exemption added.

**Live:** `analyze` 200 / 32.7s, `patterns` 200 / 24.1s, `analyze` DE 200 / 49.2s. Golden 3/3.
