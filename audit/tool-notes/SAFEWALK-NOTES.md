# Safe Walk — architecture & lock notes

**Known-good:** tag `safewalk-v5` · golden `audit/safe-walk-golden-sample.json`
(3 cases, live-captured 2026-09-08 — see `_meta` for what each one proves; the
Chicago case reflects the post-correction-pass prompt, below).
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

## Prompt correction pass (2026-09-08, same day) — v4 → v5

Re-reviewing the Chicago late-night golden case surfaced 15 finer-grained
epistemic issues in `SYSTEM_PROMPT`, all fixed:

- **Alarmist hour framing** ("a delayed arrival at nearly midnight is a bad
  time to discover a dead battery") replaced with functional framing (check
  charge because you're relying on the phone for navigation).
- **Areawide construction presented as route-specific** ("active construction
  in the Loop area") — now explicitly distinguished from a source that
  actually covers the visitor's specific blocks; a general checker gets
  pointed to as an action ("check CDOT's current street-work information"),
  never stated as a current fact about the route.
- **Citation coverage widened explicitly** to name every category (station
  facilities, rideshare pickup, closures, construction, pedestrian
  facilities, park/trail hours) — any of these without a traceable source
  gets omitted, not stated.
- **Judging distance as normal** ("the walk is not unusually long") removed —
  there's no defensible denominator for "unusual"; an alternative (rideshare)
  can be named neutrally, never as a verdict on the walk itself.
- **`watch_for` conditions stated as already true** ("the path near the
  underpass is darker... than the map suggested") — now required to open
  with an explicit "if..." contingency; `if_it_happens` can no longer be a
  prescribed safety tactic for a threat that was never confirmed ("keep
  moving at a steady pace").
- **Invented route geometry** ("you can exit to a parallel street") — Safe
  Walk doesn't know the route's actual geometry; redirected to "use your
  navigation app to check for another pedestrian route."
- **Check-in messages promising an emotional effect** ("removes worry for you
  and whoever you tell") — now required to describe the function (a clear
  expected time, closing the loop) instead of predicted psychology.
- **Arrival-time estimates masquerading as precise navigation ETAs**
  ("should arrive by around 12:15am" with no shown basis) — now required to
  show the arithmetic against the visitor's own numbers ("if I leave around
  11:40, expecting to arrive roughly between midnight and 12:10").
- **`unknowns_that_matter` inventing its own hypothetical concern**
  ("whether sidewalks... are interrupted by construction not captured by
  current advisories" — manufacturing a worry out of the shape of the tool's
  own uncertainty) and framing a real unknown as the visitor's homework
  ("worth knowing, if you find out"). Both fixed; the frontend heading
  changed from "Worth knowing, if you find out" to "What Safe Walk Doesn't
  Know" across all 13 languages (`sw_unknowns`).
- **A visitor's stated concern treated as evidence of danger** — added an
  explicit standalone rule: lateness, luggage, an underpass, a garage, or
  unknown foot traffic are planning context, not proof the route, the
  underpass, or the garage is actually dangerous.
- **`FINAL AUDIT` extended** from 11 to 17 checks covering all of the above,
  so future edits to this prompt get re-checked against the same list.

Re-verified live on the exact Chicago case: `runOutputGuard` caught and
repaired 4 real violations on the re-test call itself (`invented_fact` x3,
`false_precision`) — confirms the guard is still doing real work against the
tightened prompt, not that the prompt introduced new problems. The captured
golden output for this case was refreshed to the post-fix response.
`check:golden safe-walk` 3/3 passing after the change.

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
