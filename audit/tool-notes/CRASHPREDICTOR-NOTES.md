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
