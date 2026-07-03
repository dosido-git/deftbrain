# MeetingBSDetector — Architecture & Decision Record

Known-good baseline: **tag `meetingbsdetector-v1`**, golden **`audit/meeting-bs-detector-golden-sample.json`**
(3 of 8 endpoints: main analyze + calendar + report). Approved for Prime Time after a full audit
that **caught two completely-broken endpoints** the 5 gates passed over. **Read before changing.**

## Shape (`backend/routes/meeting-bs-detector.js`, ~540 lines)

Eight endpoints, all **`claude-sonnet-4-6`** via `callClaudeWithRetry` + `withLanguage` (on the
`system:` field). No `withLocaleContext` — correct, cost is **person-hours, not currency**. All
prompts pass a plain string `content`.

| endpoint | max_tokens | top-level guard field |
|---|---|---|
| `/meeting-bs-detector` (analyze) | 2000 | `verdict` |
| `/calendar` (week audit) | 4000 | `week_verdict` |
| `/live` (in-meeting rescue) | 4000 | `situation_read` |
| `/recurring` | 2500 | `verdict` |
| `/messages` (decline) | 2000 | `message_type` |
| `/agenda` | 2500 | `meeting_title` |
| `/report` | 2000 | `grade` |
| `/team` (team audit) | 2500 | `team_verdict` |

Frontend `src/tools/MeetingBSDetector.js` (~2116 lines): all 13 main-schema fields rendered via
`analyzeResults.X`; inputs reach the route; `userLanguage`/locale auto-injected by `useClaudeAPI`.

## DO NOT silently reverse

1. **Success-guard ↔ schema-field match (THE FIX, 2026-06-25).** Each endpoint's
   `if (!parsed.X) return 500` MUST check the field its schema actually emits as the top-level
   verdict-ish key (see the table above). The original code **copy-pasted the main endpoint's
   `if (!parsed.bs_score && !parsed.verdict && !parsed.analysis)` into `/calendar` and `/report`**,
   whose schemas emit `week_verdict` and `grade` (no top-level `verdict`) — so both returned **500
   on every valid response** (the AI succeeded; the guard rejected it). Gates were green; the
   features were dead. Also: **no endpoint emits `bs_score` or `analysis`** — those were vestigial
   dead checks, now removed. NEVER reintroduce a generic `verdict`-only guard on calendar/report.
   The `calendar-weekaudit` + `report` golden cases guard this (both must return 200).
2. **PERSONALITY person-hours rule.** PERSONALITY says "always express cost in person-hours, never
   currency or dollar figures." Without it the model volunteered USD in prose (e.g. "$100K+ annual
   bonfire") — wrong-locale for non-US users since there's no `withLocaleContext`. Keep it.
3. **Model = `claude-sonnet-4-6`** all 8 endpoints. **`max_tokens`** per the table — main=2000 is
   adequate because the schema fields are short + arrays capped (3-5 reasoning); verified no
   truncation. Don't lower without re-running `check:golden`.
4. **`withLanguage` only, no `withLocaleContext`** (person-hours, no currency). Localization layers
   2/3 are N/A; L1 (output language) + L4 (`mbd_` UI keys) are the live layers.

## Verifying a MeetingBSDetector change

1. Run the 5 gates (necessary, **not sufficient** — they passed while 2 endpoints were 500ing).
2. Dev backend up: **`npm run check:golden meeting-bs-detector`** — re-runs all 3 cases; the
   calendar + report cases assert **200, not 500** (the regression that shipped before).
3. If you touch ANY endpoint's guard, confirm `!parsed.<field>` names the field that endpoint's
   schema actually emits at the top level.
