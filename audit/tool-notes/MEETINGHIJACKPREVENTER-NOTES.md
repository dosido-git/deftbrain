# MeetingHijackPreventer — architecture & lock notes (`meetinghijackpreventer-v1`)

Structured, hijack-proof meeting agendas + a live facilitator mode (timer, speaking tracker,
per-second cost meter), post-meeting capture, action-item & parking-lot persistence.
**Frontend:** `src/tools/MeetingHijackPreventer.js` (`mhp_` keys, ~1080 lines, 5 modes:
setup/results/facilitator/actions/history). **Backend:** `backend/routes/meeting-hijack-preventer.js`
(1 endpoint, `MODELS.SMART`). **Golden:** `audit/meeting-hijack-preventer-golden-sample.json`
(1 DE max-schema case). Verify: `npm run check:golden meeting-hijack-preventer`.

## Shape
Single endpoint sonnet-4-6 via callClaudeWithRetry + withLanguage + withLocaleContext,
**max_tokens 6000**, guard `!meeting_structure || !facilitator_scripts` (both top-level — fine).
Cost/timer/speaking-tracker are all client-side; hourlyRate never leaves the browser.

## Audit fixes locked here (2026-07-13)
1. **🐛 `virtual_meeting_protocols` empty schema.** The schema emitted `"virtual_meeting_protocols": {}`
   — no keys for the model to fill → the whole "Virtual Protocols" section rendered blank for every
   virtual meeting. **Fix:** defined 5 keys (mute_management, screen_sharing, chat_usage, raise_hand,
   breakout_rooms). Verified DE: all 5 populated.
2. **🐛 `meeting_minutes_template` sync break.** Emitted nested under `meeting_artifacts` but the
   frontend read `results.meeting_minutes_template` (top-level) → never rendered. **Fix:** frontend
   reads `results.meeting_artifacts.meeting_minutes_template`.
3. **🐛 `follow_up_email` + `decision_log` dead renders.** The artifacts section rendered only the
   header (📧 / 🗳️) with no `<pre>` body → the AI-generated templates were invisible. **Fix:** added
   `<pre>` bodies matching the working `action_items_template` block.
4. **⚠️ Truncation.** `agenda_items` uncapped at max_tokens 5000; a 120-min virtual template can run
   long. **Fix:** cap `agenda_items` ≤12, `anti_hijack_strategies` 3-5, `max_tokens` → **6000**.
   Verified DE 120-min sprint: 12 items, ~3567 tok (59% headroom).
5. **⚠️→cleaned:** ~29 annotation leaks (`— one sentence` ×many, `— 3-6 words`, `— 2-4 sentences`)
   that echoed into rendered agenda topics / scripts / strategies.
6. Added the "never place a double-quote inside a string value" JSON rule (German-500 prophylactic).

## DO NOT silently reverse
1. `virtual_meeting_protocols` populated schema (5 keys); frontend reads
   `meeting_artifacts.meeting_minutes_template` + `<pre>` bodies for follow_up_email/decision_log.
2. `agenda_items` ≤12 + `max_tokens 6000`; no annotation suffixes; the no-inner-double-quote rule.
