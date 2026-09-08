# Safe Walk — architecture & lock notes

**Known-good:** tag `safewalk-v4` · golden `audit/safe-walk-golden-sample.json`
(3 cases, live-captured 2026-09-08 — see `_meta` for what each one proves).
**Verify:** `npm run check:golden safe-walk` (backend up: `npm run dev:backend`).

## What it is

Two tabs: **Plan** (one AI-backed endpoint, `POST /api/safe-walk`
`action: 'assess'`) and **Walking** (entirely on-device tools — a check-in
reminder, a pretend call, a flashlight/screen-light, a location link, and a
manual emergency panel — none of it calls the backend). Frontend
`src/tools/SafeWalk.js`. Backend `backend/routes/safe-walk.js`.

## V2 rewrite (2026-09-08) — owner brief

The v1 tool promised more than it did in two separate ways, and the rewrite
fixes both.

**1. The AI planning side overclaimed certainty.** It assigned an overall
`risk_level` (low/moderate/elevated/high) with no defensible basis, invented
street conditions ("likely unlit, narrow, and not observable from the
street"), inferred the visitor's personal state from an activity ("post-yoga
low alertness"), and could fold a web-searched statistic into prose without a
visible source. The Plan input also front-loaded a taxonomy — `AREA_OPTIONS`
(well-lit / poorly-lit / campus / residential / downtown / industrial / park /
garage) and `ROUTE_FEATURES` (underpass / park section / transit /
construction / bar strip / cut-through) — that pushed the visitor to classify
the area before the tool had any actual route information, and encouraged the
model to treat a broad category as route-specific evidence.

**2. The Walking tab's copy overclaimed what the on-device tools actually do.**
It called itself a "check-in timer" that would auto-escalate to an alarm 30
seconds after a missed check-in; called Share Location "GPS location sharing"
when it only copies a Google Maps link to the clipboard; called the emergency
panel "Alarm + SOS" and auto-started an alarm + 15-second countdown to an
"escalated" tier the moment it opened, none of which contacts anyone or sends
anything anywhere. For a safety tool, the gap between what the interface
implies and what a local device does is a real problem, not a nitpick.

**What changed — Plan:**

- **Schema fully rewritten.** `what_matters{summary, known_factors[],
  unknowns_that_matter[]}`, `before_you_go[]{action, why_here}` (no more
  `essential|recommended|optional` priority — ordinary prep doesn't need to
  sound mandatory), `route_choice{useful, guidance, basis}` (only populated
  when the visitor actually described a choice between routes),
  `watch_for[]{condition, if_it_happens}` (must be grounded in something
  supplied or verified — no more predicted threats like "left-turning
  vehicles are your second-highest risk"), `check_in_plan{worth_considering,
  reason, message}`, `verified_local_info[]{fact, source_name,
  source_date_or_status, source_url}` (a searched fact with no traceable
  source is dropped, not stated as an uncited claim), `bottom_line`. **No
  `risk_level` field anywhere** — the old low/moderate/elevated/high UI
  color-coded box is gone entirely, not just relabeled. Guard:
  `!parsed?.what_matters || !parsed?.bottom_line`.
- **Input taxonomy removed.** `AREA_OPTIONS` and `ROUTE_FEATURES` pill grids
  are gone. Replaced by one free-text field, "What do you already know about
  the route?" (optional, with example bullets as placeholder text), plus the
  existing "particular concerns" field. `TIME_OPTIONS` gained "Other";
  `DURATION_OPTIONS` gained "Not sure."
- **`router.outputStandard = 'v2'` + `runOutputGuard`** now wraps the assess
  call, with a prohibit list drawn directly from the rewrite's REMOVE list
  (overall risk score, unsourced street/crime claims, inferred personal
  state, profiling, uncited searched facts, invented directions, instinct-as-
  evidence, a feature described as monitoring when it isn't).
- **`web_search` tool kept**, but scoped tighter: only for concrete official
  facts (closures, detours, park hours) with source fields the visitor can
  actually see, never for neighborhood danger/crime.

**What changed — Walking:**

- **Check-in timer → Check-In Reminder**, with copy stating plainly it "will
  remind you on this device. It does not notify another person
  automatically." **Automatic emergency escalation on missed check-in is
  gone.** Timer expiry now shows a flat "Check In" prompt with three
  buttons — I'm Okay / Give Me 5 More Minutes / Emergency Tools — and no
  countdown to anything.
- **Emergency panel rebuilt as a flat, manual toolset.** Opening it no longer
  auto-starts the alarm, auto-grabs-and-reveals a countdown, or has an
  "escalated" tier. Four explicit buttons: Call 911 (`tel:` link), Sound
  Alarm (manual toggle — `toggleEmergencyAlarm`, replaces the old auto-fired
  `createAlarm()` call), Copy Location, Copy Emergency Message. A location
  fetch still runs quietly in the background so "Copy Location" is instant,
  but nothing is transmitted until the visitor taps copy — see the
  `openEmergencyTools` comment. The panel's own copy states outright: "Safe
  Walk does not automatically contact emergency services or send your
  location." Dropped the word "SOS" entirely — nothing here transmits an SOS
  signal.
- **Fake Call → Pretend Call**, with an always-visible disclosure line under
  the tile ("Simulated call on this phone") rather than only being knowable
  once the overlay is already ringing.
- **Location tile is capability-honest.** If `navigator.share` exists, the
  tile reads "Share My Location" and invokes the real native share sheet
  (`navigator.share`); otherwise it reads "Copy My Location" / "Copy
  Location" and only ever copies a map link to the clipboard. Never called
  "GPS location sharing."
- **Flashlight stays honest about hardware access.** On `getUserMedia` /
  torch failure it falls back to a bright white screen and labels the state
  "Screen Light" (`flashlightIsScreenOnly`), not a claim that the hardware
  flashlight is on.
- **Recent Routes demoted** from an always-visible panel to a collapsed
  utility row (`🕐 Recent Routes (N)`) with two actions per entry: **View**
  (shows the captured past plan exactly as captured, never re-labeled as
  current) and **Use Again** (restores the inputs and runs a fresh
  assessment — route conditions can change, so a stored AI result is never
  silently reused as current). Persisted key bumped `safewalk-history` →
  `safewalk-history-v2` since entries now also store the plan inputs
  (`from`/`to`/`timeOfDay`/`walkDuration`/`routeKnowledge`/`concerns`), not
  just a preview string and a result blob.
- **Disclaimer rewritten** to state plainly what the tool does and doesn't
  do, dropping "Always trust your instincts" as a standalone claim (intuition
  is preserved as *permission to act*, not asserted as *evidence of actual
  danger* — see the NO "TRUST YOUR INSTINCTS" section of the system prompt).

**Catalog and i18n:** `src/data/tools.js` guide rewritten to describe the
actual v2 behavior. 130 `sw_*` i18n keys across 13 languages — 80 kept
verbatim (generic UI chrome unaffected by the rewrite), 50 new or reworded
(including the disclaimer and the "Assess"-button copy, both retranslated
into every language since their English meaning changed).

## Live verification (2026-09-08)

The account's Anthropic API key hit its usage cap mid-session and reset
before this tool's turn was fully done — the assess prompt did get a full
live pass. 4 test calls total; every one had at least one field flagged and
repaired by `runOutputGuard` (self_explanation, invented_fact, mind_reading,
unsupported_prediction, searched_fact_without_traceable_source,
false_precision) — the 3 kept as golden cases show the POST-repair output a
real visitor would see:

- **A route with a stated lighting/route-choice concern** (Portland, tonight,
  "main road is better lit than the park shortcut"): grounded route_choice
  guidance tied to exactly what was said, plus a real `web_search` hit
  surfaced as a fully-sourced `verified_local_info` entry (an actual PBOT
  repaving-project page with a source name, status date, and URL).
- **A short, plain daytime walk with nothing supplied**: `route_choice.useful`
  and `check_in_plan.worth_considering` both correctly came back `false`
  rather than padded with invented content — confirms "don't force
  it" is actually followed, not just written into the prompt.
- **An unfamiliar city, late night, an underpass mentioned on the map**
  (Chicago): the underpass was treated as something to route around by
  choice ("you don't need a reason to walk around it"), never asserted as
  unsafe or unlit: two real, cited construction-project sources were
  surfaced instead of an invented street condition.

No overall risk score appeared in any of the 4 calls. Every static gate
also passes (syntax, eslint, guard-keys, diff-audit, localization-audit,
i18n-convention-audit, epistemics-audit, primer-audit, sitemap checks,
check-renames, output-standard-audit, three-way-sync), and the on-device
Walking-tab behavior (no API call needed) was verified directly in the
browser in English and Spanish — check-in reminder copy, the four-button
manual emergency panel with its disclaimer, and the pretend-call disclosure
all confirmed rendering correctly.

## DO NOT silently reverse

- No `risk_level` / overall safety score anywhere in the schema or the UI.
- `verified_local_info` entries always carry `source_name` +
  `source_date_or_status` + `source_url` — never fold a searched fact into
  `what_matters` or another prose field without its source attached.
- The emergency panel's alarm stays a manual toggle
  (`toggleEmergencyAlarm`) — never wire it back to auto-start on open or on a
  missed check-in.
- Timer expiry stays a flat "Check In" prompt (I'm Okay / 5 more minutes /
  Emergency Tools) with no countdown to an automatic escalation.
- The location tile's label stays conditional on `navigator.share` actually
  existing — never claim "Share" when the real behavior is clipboard-only.
- "Recent Routes" stays collapsed by default with explicit View / Use Again
  actions — never reuse a stored AI result as if it reflects current
  conditions.
