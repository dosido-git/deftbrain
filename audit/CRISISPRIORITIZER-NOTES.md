# CrisisPrioritizer — architecture & lock notes (v1, 2026-07-01)

Triage tool: separates real urgency from anxiety across 12 actions (generate, quick-dump, re-triage, delegate, pattern, time-block, just-one-thing, split-task, accountability, rolling-update, dashboard, follow-up). In `LOCALIZED_TOOLS`.

- **Model:** all actions `claude-sonnet-4-6` via `callClaudeWithRetry` + `withLanguage` (no currency — correct).
- **Endpoint:** `/api/crisis-prioritizer` (dispatch on `action`).
- **Golden:** `audit/crisis-prioritizer-golden-sample.json` (generate/right_now). Verify: `npm run check:golden crisis-prioritizer`.

## DO NOT silently reverse
1. **i18n namespace: CrisisPrioritizer owns `cp_*`; ChaosPilot was moved to `chp_*`.** The two tools collided on `cp_tagline`/`cp_submit_hint`/`cp_recent` (different values); the flat merge let CrisisPrioritizer clobber ChaosPilot's strings in all 13 languages. Do not reintroduce `cp_`-prefixed keys in chaos-pilot. (Gate 5 can't see value collisions.)
2. **All 12 action guards key on top-level fields** (objective_priorities, tasks, acknowledgment, message, pattern_summary, schedule_summary, the_one_thing, diagnosis, progress_acknowledgment, total_sessions, hindsight_summary) — correct, no always-500. `generate` max_tokens 5000, `time-block` 4000.
3. Enum values the frontend switches on stay clean (`actual_urgency`, `block.type`, `plan_status`). String `(number)`/`(true/false)` annotations were stripped from rendered fields.
4. Safety framing: grounding message, disclaimer, anti-catastrophizing (`consequence_if_missed` = "what ACTUALLY happens, not anxiety's version").
5. Known-acceptable: the dead `crisis-history` "Recent" panel is intentionally retained (it's the only S1.5-satisfying render anchor; the real history is `journal`). Removing it requires renaming the `journal` feature — out of scope.
