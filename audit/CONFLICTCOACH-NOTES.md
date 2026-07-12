# ConflictCoach — architecture & lock notes (`conflictcoach-v1`)

Analyzes a received message/thread to prevent reactive texting: manipulation-tactic detection (gaslighting/DARVO/guilt-tripping/etc.), goal reality-check, reactive-draft analysis, 3-4 de-escalating response strategies, what-NOT-to-say, timing/channel landmines, cooling recommendation. Plus a follow-up coach and a tone-adjuster. **Frontend:** `src/tools/ConflictCoach.js`. **Backend:** `backend/routes/conflict-coach.js` (3 endpoints). **Golden:** `audit/conflict-coach-golden-sample.json` (2 cases). Verify: `npm run check:golden conflict-coach` (main slow, DE ~170s/case).

## Shape
- **3 endpoints**, all `claude-sonnet-4-6` (`MODELS.SMART`) via `callClaudeWithRetry` (no robustness gap) + `withLanguage('', userLanguage)` + `withLocaleContext`:
  - `/conflict-coach` (main, **`max_tokens 6000`**) — 12-section schema; no post-parse guard (callClaudeWithRetry guarantees valid JSON; frontend null-safe).
  - `/conflict-coach/followup` (800) · `/conflict-coach/adjust-tone` (1500).
- In `LOCALIZED_TOOLS` (`cc_` prefix); mobile clean.

## Audit fixes locked here (2026-07-12)
1. **🐛 German truncation.** The 12-section schema (manipulation_tactics[], response_strategies[], draft_analysis, what_NOT_to_say[], landmines…) fit English at `max_tokens 4000` but 500'd in German (truncation — `callClaudeWithRetry` reported it cleanly). **Fix (bound + headroom):** `max_tokens` 4000 → **6000** + caps (response_strategies **3-4**, what_NOT_to_say **3-4**). Re-verified DE 200 (12 sections).
2. **⚠️→cleaned: 10 annotations stripped** — `— one sentence` ×8, `— 1-2 sentences` ×1, `— 2-4 words` ×1 — glued onto `response_text` (the message to send), tactic name/example/response, communication_style. Latent; BatchFlow class.
3. **⚠️ Frontend PF-26** — `useRegisterActions(buildFullText)` (function ref → ActionBar always shown) fixed to `buildFullText()`.

## DO NOT silently reverse
1. **`max_tokens 6000` + the response_strategies/what_NOT_to_say caps** — together they prevent the German truncation.
2. **Stripped annotations** — don't re-add; check-golden checks STRUCTURE not content.
3. **PF-26** — keep `buildFullText()` called.

## Known / accepted
- 0 baseline issues after PF-26 fix.
- Golden neutralizes `manipulation_tactics` + `draft_analysis.tone_flags`/`problematic_phrases` to `[]` (interpretation-dependent — could legitimately be empty); the rule-forced arrays (response_strategies, what_NOT_to_say, timing/channel_landmines, triggers_identified) stay non-empty.
- main is slow (~80s EN / ~170s DE) — big analytical schema.
