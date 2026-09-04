# Micro-Adventure Mapper — tool notes

Grounding rewrite, 2026-09-03. The tool was good at sounding like a friend who
knows the neighbourhood, and that was the problem: it knew things it could not
know.

## What it was doing

A single Pilsen probe produced all of this, none of it supplied and none of it
checkable:

- "Pilsen is where Chicago's street art scene actually lives"
- "you'll see work most tourists miss"
- "the biggest, newest murals cluster"
- "afternoon light hits murals better between 2–4 PM"
- "many have open doors on weekends"
- "if a door is propped open, you're welcome to look"
- "you might catch artists mid-project"
- "many Pilsen coffee spots have rotating local art"
- "local spots know the art calendar"

Plus invented admission prices, opening states and a full clock-time itinerary
for a visitor who never said what time they were starting.

## The fix is mostly the schema

The fields it invented into no longer exist. That is the load-bearing change —
the prose rules had been there in some form already.

| Gone / renamed | Why |
| --- | --- |
| `time_start`, `time_end` | there is no start time unless the visitor gave one, so there can be no end time either |
| `location` → `area` | a field called `location` asks for an address; `area` asks for a neighbourhood |
| `pro_tip` → `small_twist` | "pro tip" invites insider knowledge; a twist is something to *do* |
| `difficulty` → `activity_level` | plain description, not a grade |
| `why_adventure` → `why_this_fits` | fit to the supplied constraints, not a pitch |
| `transit_between.method/duration/distance` → `between_stops.guidance/estimated_time` | no invented street-by-street routing, no false precision |
| `rainy_backup{time,cost}` → `backup_plan{when_to_use,description}` | the old shape asked for the price and duration of a venue it could not see |
| `extend_it` → `keep_going` | — |
| — | **new:** `verify`, for anything current the visitor should confirm |

Swap now returns `{stop, transition}` rather than `{stops[], transit_between[]}`.
It was always replacing exactly one stop; the arrays were an accident.

## Deterministic backstops

Five, all unit-tested to fire, with 14 legitimate phrasings verified to survive:
`TOURISM_COPY`, `INVENTED_CLOCK`, `LOCAL_INSIDER`, `INVENTED_PRICE_OR_HOURS`,
`INVENTED_ADDRESS`.

Two lessons worth keeping:

**`LOCAL_INSIDER` gets no hedge-spare.** Every other detector in the codebase
spares a hedged sentence, because a hedge usually means the model is proposing
rather than asserting. Not here: "**If** a door is propped open, you're welcome
to look" and "you **might** catch artists mid-project" both open with a hedge and
are both claims about what happens at a place nobody can see. The hedge is doing
rhetorical work, not epistemic work.

**Words are not always adjacent.** The first `LOCAL_INSIDER` draft required the
noun and verb to touch, and "Many artists **in Pilsen** are generous with their
time" walked straight through it. Allow a gap and re-test.

## The final pass, same day

A Boston Freedom Trail probe found six more, all the same shape — a true thing
about a stable landmark used as licence for an untrue thing beside it.

| It wrote | It now writes |
| --- | --- |
| "Solo walking lets you linger where history interests you most" | "It works for a solo outing at your own pace" |
| "By this point you'll have walked enough to be genuinely hungry" | "This is a natural point to pause for food if you want it" |
| "the ground you're standing on has been a gathering space since the 1600s" | nothing — the outing does not need it |
| "Faneuil Hall itself has vendors and casual spots" | "Look for a casual food option near Faneuil Hall, and check current hours" |
| "Many have free or low-cost admission" | "use your maps app to find an open museum, library, market or cafe" |
| "a stable 2.4-mile walking route" | no figure — a decimal makes a remembered number look measured |

**"Old North Church (Beacon Hill)".** Right landmark, wrong neighbourhood,
appended to a field that is not for neighbourhoods. Two fixes: the prompt says a
broad accurate area label beats a precise wrong one, and `stripNameParenthetical`
removes a trailing place-label parenthetical from a stop name in code. It is
tuned to leave a genuine clarifier alone — "Pilsen mural district (16th Street
corridor)" survives.

**Verify chores are now sparse on purpose.** The earlier version asked people to
"check current trail condition and whether all sites are open to walk past or
photograph from outside" for a plan that only required walking a public route.
An over-broad chore trains people to skip the ones that matter, so `verify` is
for what the itinerary MATERIALLY depends on and most stops leave it empty. The
goldens record the ratio.

Six more backstops: `COMPANION_AS_PREFERENCE`, `INVENTED_BODY_STATE`,
`ORNAMENTAL_HISTORY`, `COMMERCIAL_COMPOSITION`, `PRECISE_DISTANCE`, plus two
clauses added to `INVENTED_PRICE_OR_HOURS`. All unit-tested to fire, with the
replacement phrasings verified to survive.

## Things that are allowed, deliberately

- **Stable public geography.** Major parks, landmarks, well-known neighbourhoods
  and corridors are fine. `INVENTED_ADDRESS` is tuned to catch a street number
  or a named cross-street, not "walk toward Ashland".
- **A short outing.** One hour may be one stop. The prompt says the duration is
  a slot, not a target, and the goldens lock that in — a 1-hour case that comes
  back with three stops is a regression, not thoroughness.
- **A `photo_op` without photography selected**, where the scene supports it.
  The spec allows it; both are rendered only when non-empty.

## Endpoints

One route, three actions on `MODELS.FAST`: `generate` (4000), `regenerate`
(4000), `swap` (2000). v2 output standard with `validateResult` as the declared
check.

`withLanguage` is built per action rather than hoisted into a shared `system`
const. The hoisted version read better and the audit flagged it (S7.4) — rightly:
one shared string is one edit away from silently serving every action the wrong
language.

## Storage

`micro-adventure-mapper-results-v2` and `micro-adventure-journal-v2`. Both bumped
in the same commit as the schema change, per the Magic Mouth rule: a persisted v1
result restored into a v2 renderer crashes the tool for every existing user.

## Goldens

Four cases, re-recorded 2026-09-03. The v1 golden was discarded rather than
ported — its expected output was full of fields that no longer exist.

| Case | What it catches |
| --- | --- |
| `generate-two-hours-art-walk` | the exact Pilsen input that produced the list at the top of this file |
| `generate-one-hour-free-accessible` | 1 hour → 1–2 stops, free budget honoured, accessibility never asserted |
| `regenerate-different-outing` | meaningfully different, but not a different vibe from the one selected |
| `swap-stop-one` | the `{stop, transition}` shape, and no invented address, price or travel time |
