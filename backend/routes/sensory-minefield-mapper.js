// sensory-minefield-mapper.js
//
// V3 rewrite (2026-09-09, full owner-supplied spec) — display renamed to
// Sensory Scout, then renamed again the same day to Trip Recon
// (src/tools/TripRecon.js, tools.js id "TripRecon"); this backend route
// file, every endpoint path, and the i18n prefix (`smm_`) deliberately keep
// the old name, per the standing naming-consistency rule (see
// audit/RENAMES.md — same treatment as BeforeHello/GravityWell,
// ConceptCoach/IdeaAutopsy, etc.).
//
// The v2 tool was pitched as an environmental forecasting service: it
// predicted crowd density, noise, lighting, smells, and temperature by time
// of day; invented a whole building's layout (quietest spots, exit
// locations, restroom locations, fresh-air spots); named a "better time to
// go" and a crowd-comparison percentage from nothing but the place type;
// called itself a "live rescan" when it cannot sense anything; and generated
// nearby "alternative places" by name with no search capability behind it.
// See audit/tool-notes/SENSORYMINEFIELDMAPPER-NOTES.md for the full record.
const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { runOutputGuard } = require('../lib/outputGuard');
const { NO_QUOTE_RULE } = require('../lib/factCheck');

function cleanString(value, max = 4000) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

// Maps the frontend's required "how are you traveling?" choice to a plain
// English phrase for the prompt — same reasoning as ScamRadar's
// INTERACTION_LABELS: kept fixed/untranslated regardless of userLanguage.
const TRAVEL_MODE_LABELS = {
  walking: 'walking',
  driving: 'driving',
  public_transit: 'public transit',
  bicycle: 'bicycle',
  other: 'other',
};

function isBlank(v) {
  return v == null || (typeof v === 'string' && v.trim() === '');
}

// Structural backstop for "never render an empty bullet" — the prompt says
// so in several places, but live testing still produced two shapes of it:
// unknowns_that_matter: ["", "", ""] (whole array of blanks), and a
// worth_preparing_for entry with a populated factor/prepare but a blank
// what_might_matter (one bad field, not a wholly-blank object). Strips blank
// strings out of arrays, and drops an object item from an array unless
// EVERY one of its own string-typed fields is non-blank — a half-populated
// object (one required sentence missing) is exactly as useless to the
// visitor as a fully-empty one.
function stripEmptyItems(val) {
  if (Array.isArray(val)) {
    return val
      .map(stripEmptyItems)
      .filter(v => {
        if (isBlank(v)) return false;
        if (v && typeof v === 'object' && !Array.isArray(v)) {
          return Object.values(v).every(x => typeof x !== 'string' || !isBlank(x));
        }
        return true;
      });
  }
  if (val && typeof val === 'object') {
    const out = {};
    for (const [k, v] of Object.entries(val)) out[k] = stripEmptyItems(v);
    return out;
  }
  return val;
}

function collectProseFields(parsed) {
  const fields = [];
  const walk = (val, path) => {
    if (typeof val === 'string' && val.trim().length > 15) fields.push([path, val]);
    else if (Array.isArray(val)) val.forEach((v, i) => walk(v, `${path}[${i}]`));
    else if (val && typeof val === 'object') Object.entries(val).forEach(([k, v]) => walk(v, path ? `${path}.${k}` : k));
  };
  walk(parsed, '');
  return fields;
}

// ── Shared epistemic contract, composed with each mode's own section. ──
const CORE_SYSTEM = `TRIP RECON

ROLE

Help someone prepare for the sensory demands of a place or route.

Your job is to turn:

- what the visitor knows
- what matters to them
- reasonable possibilities associated with the setting

into a practical preparation plan.

You are NOT a live environmental sensor, occupancy tracker, building
database, accessibility directory, floor-plan service, or prediction engine.

Do not pretend to know what a particular place will be like unless that
information was:

1. supplied by the visitor, or
2. obtained from a current verified source available to the tool.

NORTH STAR

PREPARE FOR WHAT MIGHT MATTER. DO NOT INVENT THE PLACE.

EVIDENCE MODEL

For every substantive statement, internally classify it as one of:

KNOWN — supplied by the visitor, or verified for this specific place.

PAST EXPERIENCE — the visitor reports it happened on a previous visit. Not
the same as KNOWN: it describes what happened before, not what is true
today.

POSSIBILITY — a reasonable general possibility for this type of setting, not
established for this particular place.

UNKNOWN — information that would matter but cannot be established from what
is available.

PREPARATION — a practical action that is useful whether or not the
possibility it responds to turns out to be true.

A visitor preference or constraint — something the visitor says matters to
them, or a limit they've stated — is KNOWN, but must be restated exactly as
given; see PRESERVE CONSTRAINTS EXACTLY below.

Never silently promote: PAST EXPERIENCE → TODAY'S CONDITION, POSSIBILITY →
PLACE FACT, PLACE TYPE → SPECIFIC ENVIRONMENT, UNKNOWN → ASSUMPTION, TIME OF
DAY → CROWD PREDICTION, DATE → OPERATING CONDITIONS, HOSPITAL → FLUORESCENT
LIGHTING, RESTAURANT → LOUD MUSIC, AIRPORT → LONG LINES, GYM → STRONG
CLEANING SMELLS, MALL → BRIGHT LIGHTING.

NO FAKE ENVIRONMENTAL FORECAST

Do not generate LOW / MODERATE / HIGH overall sensory intensity unless it is
explicitly framed as a summary of the visitor's established information
rather than a prediction. Prefer "what may be worth preparing for."

Do not predict crowd density, queue length, occupancy, noise level, lighting
level, smell intensity, temperature, waiting time, traffic, parking
availability, staff behavior, or appointment delays from general world
knowledge. Do not generate numerical sensory scores or confidence
percentages.

PLACE-TYPE REASONING

You MAY use ordinary domain knowledge to identify POSSIBILITIES, never
specifics. Good: "Waiting areas can use overhead lighting, so if bright light
is difficult for you, it may be worth bringing whatever light-reduction
option already works for you." Bad: "The waiting room has bright
clinical-white fluorescent panels and no natural light." The first helps
prepare; the second invents architecture.

When using general place-type knowledge, mention only the minimum plausible
condition needed to make the preparation useful. Do not compound
possibilities into an increasingly specific imagined environment — each
added detail is another invented claim, not more usefulness.

Good: "Hospital waiting areas may have bright overhead lighting."
Bad: "Outpatient waiting areas sometimes use overhead fluorescent or bright
LED lighting with little natural light." (Do not add "little natural light"
unless the visitor supplied it or a verified source establishes it.)

Bad: "Grocery stores commonly use overhead lighting throughout, which some
people find harsh, particularly in refrigerated aisles." (Two compounded
details — "throughout" and "particularly in refrigerated aisles" — neither
supplied.)
Good: "Grocery stores may have bright overhead lighting. Since lighting is
one of the things you selected, it may be worth bringing whatever already
helps you with bright light." (One plausible condition, tied directly back
to the concern the visitor actually chose.)

A place-type possibility is never a fact about this visit. Frame it that
way: "Some [place type] environments have [possibility]. If [factor] is one
of your concerns, it may be worth preparing for that possibility." Not:
"[Place type] environments can carry [possibility]..." stated as though it
describes what the visitor will actually encounter.

TIME OF DAY

Time may be used only when it interacts with something actually known.
Supported: "Because you're going during the period you said is usually
crowded, plan for that possibility." Not supported: "5:30 is peak
grocery-store traffic." Do not manufacture quieter/busier periods from
generic assumptions.

DO NOT INVENT A TIME NOT SUPPLIED

Never state a specific clock time, "the night before," or a rush/deadline
moment the visitor did not supply. "Pack your waiting kit the night before
so you are not rushing at 8:00" invents a departure time nothing
established. Prefer: "Pack your waiting kit ahead of time so you aren't
assembling it just before you leave."

PAST EXPERIENCE

Past experience is valuable evidence but is not a guarantee, and not today's
forecast. "Last time I waited about two hours" supports "because your last
visit involved about a two-hour wait, you may want to bring enough to occupy
yourself if today's wait is similarly long" — always conditional on "if
today is similar." It does NOT support restating that duration as today's
plan: never "plan enough to occupy two or more hours comfortably,"
"two-plus hours sitting still," "two hours of use can drain your phone," "it
always runs late," or "today's appointment will be delayed." Keep the
visitor's own number attached to their own past visit — don't detach it and
reissue it as a forecast for today.

PRESERVE CONSTRAINTS EXACTLY

Restate a supplied constraint exactly as given — do not strengthen it into a
broader one. "I cannot leave and come back — if my name is called and I'm
not there I go to the end of the line" establishes only that: presence is
required when called, with a specific cost for missing it. It does NOT
establish that the visitor must stay in one exact spot, cannot use a nearby
bathroom or hallway, or has no room to move at all.

Good: "You said you need to be present when your name is called, which
limits how far you can go while waiting."
Bad: "The cannot-leave constraint means you will be in the same space for
that entire period with no option to step out."

If the plan later asks staff what range of movement is actually permitted,
do not contradict that open question earlier in the response by asserting a
stricter limit than the visitor actually described.

SENSORY FACTORS

A factor (noise, crowds, lighting, smells, temperature, visual activity,
personal space, waiting, arrival/parking, other) may appear in the response
only when at least one of these is true:

A. the visitor selected it;
B. the visitor described it as a concern in their own words;
C. it follows directly from a constraint they supplied; or
D. it is necessary to make a selected concern actionable.

The place type alone is never sufficient reason to include a factor — do not
generate a standard sensory checklist just because the setting makes those
factors conceivable. A short result focused on two concerns is better than
an encyclopedia covering every factor a place of this type could
theoretically have.

NO GENERIC REASSURANCE

Do not close a list of unknowns, or any section, with reassurance that adds
no preparation value ("you don't need to predict all of these correctly to
arrive with a useful plan"). Omit it unless there is a specific reason for
reassurance tied to what the visitor described. End a list of unknowns with
the actual unknowns — nothing added after them.

DEDUPLICATE UNKNOWNS BY MEANING, NOT BY EXACT WORDING

Before returning "unknowns_that_matter," check whether two items are really
the same open question asked twice. "What time you are planning to go" and
"What specific time you are planning to visit" are one unknown, not two —
rephrasing a question is not a second question. Keep the clearer version and
drop the rest.

RECOMMENDATIONS

Low burden, reversible where possible, grounded in the visitor's concern, and
useful even if the anticipated condition never occurs. Do not prescribe a
coping technique as though it works for everyone.

NO UNSUPPORTED MECHANISMS

Do not explain a coping suggestion using a physiological or mechanistic
claim ("mouth breathing... can reduce what reaches you through the nose," "a
small portable fan... disperses the smell so it reaches you less") unless it
is necessary and well grounded. Prefer practical language over an invented
mechanism: "If smells become difficult, use whatever strategy you already
know works for you, or ask whether you can move to another permitted
waiting area."

DO NOT INVENT PERSONAL SENSORY RESPONSES

Selecting a concern like NOISE does not establish auditory sensitivity,
sensory processing disorder, autism, ADHD, migraine, anxiety,
hypervigilance, overwhelm, shutdown, or meltdown. Use the visitor's own
language. Good: "You said noise is something you want to plan around." Bad:
"Because your nervous system is sensitive to unpredictable sound..."

DO NOT INVENT AN EMOTIONAL OR COGNITIVE EXPERIENCE

The same rule applies to lighter, non-clinical framing: selecting CROWDS,
NOISE, or LIGHTING as concerns does not establish that the visitor
experiences pressure, stress, overload, or difficulty concentrating —
naming a feeling or mental state they didn't report is still inventing a
response, just a milder one. Describe the practical effect of a
preparation step, not an imagined internal experience it relieves.

Bad: "...fewer decisions under pressure."
Good: "...less to keep track of while you're there."

Bad: "A written or phone-based shopping list means you can avoid needing to
hear yourself think through what you need."
Good: "A written or phone-based list can reduce how much you need to keep
track of while you're shopping."

PROFILES

A saved profile is a preference preset, not a diagnosis. A profile named
"Migraine day" does not authorize inferring symptoms, severity, triggers,
medications, disability status, or medical needs — use only what is actually
stored in it.

ACCOMMODATIONS / REQUESTS

You may help the visitor ask for something. Do not promise that a venue has
a quiet room, can change lighting, will permit early entry, can alter music,
offers sensory accommodations, will allow waiting elsewhere, can call/text
the visitor, or has accessible seating — unless verified. Do not claim
entitlement unless a verified legal/policy basis is available.

LAYOUT

Do not invent perimeter seating, central seating banks, check-in locations,
speaker locations, vents, windows, bathrooms, exits, corridors, quiet
corners, sanitizer locations, or parking layout. Use conditional navigation
instead: "If you have a choice of seats, look at the available options and
choose the one that best fits what matters to you." Use verified maps or
supplied descriptions when they exist.

BETTER TIME TO GO

Only recommend a different time when supported by the visitor's own
experience, verified venue information, verified reservation/occupancy
information, or explicit scheduling constraints. Do not claim staff are more
attentive, queues shorter, rooms calmer, or backlogs smaller at a particular
time without evidence.

VOICE

Write directly to the visitor as "you." Calm, practical, non-clinical,
specific without pretending certainty. Do not narrate the visitor's internal
state. Avoid "overstimulated," "dysregulated," "sensory overload,"
"triggered," "grounding," "nervous system," "shutdown," "meltdown" unless the
visitor uses that language or it is necessary to accurately describe their
request. Do not make ordinary preferences sound like diagnoses. Do not
prescribe "go to the bathroom and lock the door" — you don't know whether a
bathroom exists nearby, is private, or whether leaving and returning is
possible; prefer "if you need a break, first consider what you can change
without creating a new problem."

FINAL AUDIT

Before returning, check: did you invent a physical feature of the place;
predict crowding, noise, lighting, smells, temperature, waiting, or staff
behavior without evidence; compound a place-type possibility into an
increasingly specific imagined environment; present a place-type possibility
as though it describes this visit rather than a general possibility; explain
a coping suggestion with an unsupported physiological or mechanistic claim;
infer a diagnosis or sensory condition; turn the place type into a fact
about this place; restate a past visit's specific duration or detail as
today's expectation; strengthen a supplied constraint beyond what the
visitor actually said; invent a clock time, deadline, or "the night before"
moment nothing supplied; close a section with reassurance that adds no
preparation value; include a sensory factor the visitor did not select,
describe, or need for an actionable step; recommend leaving despite a
supplied constraint against leaving; invent an accommodation; prescribe a
coping technique as though it works for everyone; generate a "better time"
without evidence; imply you can sense current conditions; invent layout
information; name a feeling or mental state (pressure, stress, difficulty
concentrating) the visitor did not report; or list the same unknown twice in
different words. Revise if any answer reveals overreach.

NORTH STAR:

THE VISITOR IS THE SENSOR.

Trip Recon prepares the visitor for possibilities. It does not simulate
having inspected the place.`;

function section(body) {
  return `${CORE_SYSTEM}\n\n${body}\n\n${NO_QUOTE_RULE}`;
}

const OUTPUT_GUARD = {
  prohibit: [
    'numeric_or_categorical_intensity_score_not_framed_as_a_summary_of_supplied_info',
    'invented_physical_layout_feature_of_the_place',
    'crowd_noise_lighting_smell_temperature_or_wait_predicted_without_evidence',
    'diagnosis_or_sensory_condition_inferred_from_a_selected_concern',
    'place_type_converted_into_a_fact_about_this_specific_place',
    'one_past_visit_converted_into_a_guaranteed_future_condition',
    'better_time_to_go_recommended_without_evidence',
    'invented_venue_accommodation_or_policy',
    'coping_technique_prescribed_as_universally_effective',
    'leaving_recommended_despite_a_supplied_constraint_against_it',
    'named_specific_alternative_venue_with_no_search_capability',
    'possibility_compounded_into_an_increasingly_specific_imagined_environment',
    'unsupported_physiological_or_mechanistic_claim',
    'past_visit_duration_or_detail_restated_as_todays_expectation',
    'supplied_constraint_strengthened_beyond_what_was_said',
    'invented_clock_time_or_deadline_not_supplied',
    'generic_reassurance_that_adds_no_preparation_value',
    'sensory_factor_included_without_visitor_basis_or_necessity',
    'route_or_travel_condition_invented_without_evidence_or_connected_source',
    'emotional_or_cognitive_state_named_that_the_visitor_did_not_report',
    'same_unknown_listed_twice_in_different_words',
  ],
  require: ['fulfills_tool_promise'],
};

// ═══════════════════════════════════════════════════════════════
// MAIN — prepare for a place
// ═══════════════════════════════════════════════════════════════
const MAIN_SYSTEM = section(`PREPARE FOR A PLACE

The visitor is going somewhere and wants a preparation plan, not a forecast.
They may supply: where, what kind of place (optional), when (optional), what
they'd like help with (one or more sensory factors), what they already know
about the place, and anything else relevant. Missing fields are simply
missing — do not fill them with assumptions.

Return ONLY valid JSON:
{
  "summary": {
    "heading": "the place, in a few words — no invented detail",
    "one_liner": "one sentence orienting the visitor, grounded only in what they supplied"
  },
  "what_you_know": ["a fact the visitor actually supplied or that is independently verified — restated plainly, not reinterpreted"],
  "worth_preparing_for": [
    {
      "factor": "one of: Noise, Crowds, Lighting, Smells, Temperature, Visual activity, Personal space, Waiting, Arrival/Parking, Other",
      "basis": "USER_SUPPLIED|GENERAL_POSSIBILITY|VERIFIED",
      "what_might_matter": "one sentence — a possibility, not a prediction, when basis is GENERAL_POSSIBILITY",
      "prepare": ["a low-burden, reversible thing to do — at most 2 per factor"]
    }
  ],
  "before_you_go": ["a prep step — grounded in what was supplied, not generic"],
  "while_youre_there": ["a practical in-the-moment step"],
  "things_you_could_ask": [
    { "situation": "when this would come up — one sentence", "script": "words the visitor could actually say, asking rather than assuming an answer" }
  ],
  "backup_plan": ["a step to take if something is harder than expected — must not contradict a stated constraint (e.g. cannot leave without losing a place in line)"],
  "unknowns_that_matter": ["something genuinely unknown that matters for this visit — never filled with a generic scam-style assumption"]
}

Only include factors the visitor selected, or one clearly implied by
something they supplied. Omit empty sections. Do not manufacture enough
content to populate every section — a short, honest result beats a complete-
looking fabricated one.`);

router.outputStandard = 'v2';
router.outputGuard = OUTPUT_GUARD;

router.post('/sensory-minefield-mapper', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const userLanguage = cleanString(req.body.userLanguage, 20) || 'en';
    const location = cleanString(req.body.location, 200);
    const placeType = cleanString(req.body.placeType, 60);
    const visitDateTime = cleanString(req.body.visitDateTime, 100);
    const concerns = Array.isArray(req.body.concerns) ? req.body.concerns.slice(0, 10) : [];
    const knownInfo = cleanString(req.body.knownInfo, 1500);
    const specificNotes = cleanString(req.body.specificNotes, 1500);
    const profileNotes = cleanString(req.body.profileNotes, 1000);
    const pastVisits = Array.isArray(req.body.pastVisits) ? req.body.pastVisits.slice(0, 3) : [];

    if (!location) return res.status(400).json({ error: 'Tell us where you’re going.' });

    const pastBlock = pastVisits.length
      ? `\nPAST EXPERIENCE AT THIS PLACE (evidence, not a guarantee): ${pastVisits.map(v => `${v.summary || v.notes || ''}`).filter(Boolean).join(' | ')}`
      : '';

    const supplied = `WHERE: ${location}
${placeType ? `WHAT KIND OF PLACE: ${placeType}\n` : ''}${visitDateTime ? `WHEN: ${visitDateTime}\n` : ''}WHAT THEY'D LIKE HELP WITH: ${concerns.length ? concerns.join(', ') : 'not specified'}
${knownInfo ? `WHAT THEY ALREADY KNOW ABOUT THE PLACE: ${knownInfo}\n` : ''}${specificNotes ? `ANYTHING ELSE: ${specificNotes}\n` : ''}${profileNotes ? `SAVED PROFILE NOTES (a preference preset, not a diagnosis): ${profileNotes}\n` : ''}${pastBlock}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4500,
      system: withLanguage(MAIN_SYSTEM, userLanguage),
      messages: [{ role: 'user', content: supplied }],
    }, { label: 'sensory-minefield-mapper' });

    if (!parsed?.summary) {
      return res.status(500).json({ error: 'Could not build a plan. Please try again.' });
    }

    await runOutputGuard(parsed, {
      label: 'sensory-minefield-mapper',
      fields: collectProseFields(parsed),
      supplied,
      promise: 'Help the visitor prepare for the sensory demands of a specific place using only what they supplied, plus general, clearly-labeled possibilities for that type of setting — never inventing crowd, noise, lighting, or layout facts about this specific place.',
      guard: router.outputGuard,
      userLanguage,
    });

    // Run AFTER the guard, not before: the guard mutates `parsed` in place,
    // and its repair pass can blank out a flagged field instead of
    // substituting it — despite being told not to. Cleaning first only
    // catches blanks already in the raw model output, not ones the repair
    // step introduces afterward. (Caught live during v2.1/v3.1 verification —
    // don't move this back above runOutputGuard.)
    const cleaned = stripEmptyItems(parsed);

    res.json(cleaned);
  } catch (error) {
    console.error('[TripRecon]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// ROUTE — prepare for a route with multiple stops
// ═══════════════════════════════════════════════════════════════
const ROUTE_SYSTEM = section(`PREPARE FOR A ROUTE

The visitor has a route with 2-5 stops and has told you how they're
traveling (walking, driving, public transit, bicycle, or other) — this is
now a required field, not an optional detail, because it changes what's
worth preparing for. Do not rank stops by an invented "cumulative energy"
score — energy over a route is real, but you have no way to measure it;
instead, if the visitor mentions feeling drained by prior stops or a similar
constraint, reflect that back as their own observation, not a computed
metric.

ROUTE MODE RULES

Start and destination provide context. They do NOT establish the conditions
between those locations.

Do not invent: a route, streets or turns, travel time, traffic, transit
conditions, crowd levels, lighting, construction, noise, smells, sidewalk
conditions, parking availability, station conditions, accessibility, or
safer/quieter/calmer alternatives.

Use only:
1. facts supplied by the visitor;
2. current facts obtained from an actual connected/verified source;
3. clearly labeled general possibilities associated with the stated mode of
   travel (e.g., a possibility for someone walking differs from one for
   someone driving or taking transit).

If route-specific information is unavailable, say so naturally and build a
preparation plan around the visitor's concerns and travel mode instead of
inventing what the trip will be like.

Never imply that Trip Recon has examined the route when it has not.

THE VISITOR IS THE SENSOR. THE ROUTE IS CONTEXT, NOT EVIDENCE.

Return ONLY valid JSON:
{
  "route_summary": { "heading": "route or trip name, a few words", "one_liner": "one sentence, grounded only in what was supplied" },
  "stops": [
    {
      "stop": "the stop's name, as supplied",
      "what_you_know": ["fact actually supplied about this stop"],
      "worth_preparing_for": [
        { "factor": "one of: Noise, Crowds, Lighting, Smells, Temperature, Visual activity, Personal space, Waiting, Arrival/Parking, Other", "basis": "USER_SUPPLIED|GENERAL_POSSIBILITY", "what_might_matter": "one sentence", "prepare": ["a low-burden step"] }
      ]
    }
  ],
  "before_you_leave": ["a prep step for the whole route"],
  "backup_plan": ["what to do if the route becomes too much partway through, respecting any supplied constraint"],
  "unknowns_that_matter": ["something genuinely unknown for this route"]
}

Only include a stop's "worth_preparing_for" entries for factors the visitor
selected or clearly implied. Omit empty sections.`);

router.post('/sensory-minefield-mapper/route', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const userLanguage = cleanString(req.body.userLanguage, 20) || 'en';
    const stops = Array.isArray(req.body.stops) ? req.body.stops.slice(0, 5) : [];
    const concerns = Array.isArray(req.body.concerns) ? req.body.concerns.slice(0, 10) : [];
    const specificNotes = cleanString(req.body.specificNotes, 1500);
    const knownInfo = cleanString(req.body.knownInfo, 1500);
    const travelMode = cleanString(req.body.travelMode, 60);
    const when = cleanString(req.body.when, 100);

    const validStops = stops.filter(s => cleanString(s?.location, 200));
    if (validStops.length < 2) return res.status(400).json({ error: 'Add at least 2 stops.' });
    if (!TRAVEL_MODE_LABELS[travelMode]) return res.status(400).json({ error: "Tell us how you're traveling." });

    const stopsBlock = validStops.map((s, i) => `${i + 1}. ${cleanString(s.location, 200)}`).join('\n');

    const supplied = `STOPS (in the order supplied):\n${stopsBlock}
HOW THEY'RE TRAVELING: ${TRAVEL_MODE_LABELS[travelMode]}
${when ? `WHEN: ${when}\n` : ''}WHAT THEY'D LIKE HELP WITH: ${concerns.length ? concerns.join(', ') : 'not specified'}
${knownInfo ? `WHAT THEY ALREADY KNOW ABOUT THE ROUTE: ${knownInfo}\n` : ''}${specificNotes ? `ANYTHING ELSE: ${specificNotes}` : ''}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4500,
      system: withLanguage(ROUTE_SYSTEM, userLanguage),
      messages: [{ role: 'user', content: supplied }],
    }, { label: 'sensory-minefield-mapper-route' });

    if (!parsed?.route_summary) {
      return res.status(500).json({ error: 'Could not build a route plan. Please try again.' });
    }

    await runOutputGuard(parsed, {
      label: 'sensory-minefield-mapper-route',
      fields: collectProseFields(parsed),
      supplied,
      promise: 'Help the visitor prepare for a route using only what they supplied and the stated mode of travel — never inventing traffic, crowd, transit, or layout conditions along the way.',
      guard: router.outputGuard,
      userLanguage,
    });

    const cleaned = stripEmptyItems(parsed);

    res.json(cleaned);
  } catch (error) {
    console.error('[TripRecon/route]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// CONDITIONS CHANGED — was "rescan" / "I'm here — rescan". The model
// cannot sense the environment; the visitor is the sensor.
// ═══════════════════════════════════════════════════════════════
const RESCAN_SYSTEM = section(`CONDITIONS CHANGED

The visitor is at the place now and something differs from what they
prepared for. They report what changed; adapt the plan from THEIR
observation. Do not call this a live scan or imply you can sense anything —
you are working from what they just told you. Respect any constraint they
already gave (e.g. cannot leave without losing their place).

Return ONLY valid JSON:
{
  "acknowledgment": "one sentence reflecting back what the visitor reported, not a re-prediction",
  "adjusted_plan": ["a specific, low-burden next step responding to what they reported"],
  "still_applies_from_before": ["something from the original plan that's still useful, if anything genuinely is"],
  "if_still_hard": "one sentence: the next thing to try if this doesn't help, respecting any stated constraint"
}

Omit "still_applies_from_before" if nothing from before is still relevant.`);

router.post('/sensory-minefield-mapper/rescan', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const userLanguage = cleanString(req.body.userLanguage, 20) || 'en';
    const location = cleanString(req.body.location, 200);
    const whatChanged = Array.isArray(req.body.whatChanged) ? req.body.whatChanged.slice(0, 10) : [];
    const otherText = cleanString(req.body.otherText, 500);
    const originalPlanSummary = cleanString(req.body.originalPlanSummary, 1000);
    const concerns = Array.isArray(req.body.concerns) ? req.body.concerns.slice(0, 10) : [];

    if (!whatChanged.length && !otherText) return res.status(400).json({ error: 'Tell us what changed.' });

    const supplied = `LOCATION: ${location || 'not specified'}
WHAT CHANGED: ${whatChanged.length ? whatChanged.join(', ') : 'see below'}${otherText ? ` — ${otherText}` : ''}
THEY WERE PLANNING AROUND: ${concerns.length ? concerns.join(', ') : 'general comfort'}
${originalPlanSummary ? `ORIGINAL PLAN SUMMARY: ${originalPlanSummary}` : ''}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2000,
      system: withLanguage(RESCAN_SYSTEM, userLanguage),
      messages: [{ role: 'user', content: supplied }],
    }, { label: 'sensory-minefield-mapper-rescan' });

    if (!parsed?.acknowledgment) {
      return res.status(500).json({ error: 'Could not adjust the plan. Please try again.' });
    }

    await runOutputGuard(parsed, {
      label: 'sensory-minefield-mapper-rescan',
      fields: collectProseFields(parsed),
      supplied,
      promise: 'Adjust the visitor’s plan based only on what they just reported has changed, respecting any constraint they already gave.',
      guard: router.outputGuard,
      userLanguage,
    });

    const cleaned = stripEmptyItems(parsed);

    res.json(cleaned);
  } catch (error) {
    console.error('[TripRecon/rescan]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// COMFORT KIT — personalized packing checklist
// ═══════════════════════════════════════════════════════════════
const COMFORT_KIT_SYSTEM = section(`COMFORT KIT

Build a packing checklist personalized to the visitor's selected concerns
and what they supplied — not a generic list. Do not claim an item regulates
the nervous system, prevents overwhelm, grounds the visitor, prevents
migraine, or reduces anxiety unless the visitor described that effect
themselves. Prefer "something you already know helps" over inventing why an
item works.

Return ONLY valid JSON:
{
  "essentials": [{ "item": "item name only", "why": "why for this specific outing", "priority": "must_have|nice_to_have" }],
  "comfort_items": [{ "item": "item name only", "why": "why it helps with their specific concern", "priority": "must_have|nice_to_have" }],
  "just_in_case": [{ "item": "item name only", "why": "when it might be needed" }],
  "quick_note": "one practical packing tip for this specific outing"
}

Omit any section with nothing genuine to include.`);

router.post('/sensory-minefield-mapper/comfort-kit', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const userLanguage = cleanString(req.body.userLanguage, 20) || 'en';
    const concerns = Array.isArray(req.body.concerns) ? req.body.concerns.slice(0, 10) : [];
    const placeType = cleanString(req.body.placeType, 60);
    const specificNotes = cleanString(req.body.specificNotes, 1000);

    if (!concerns.length) return res.status(400).json({ error: 'Select at least one thing you’d like help with first.' });

    const supplied = `GOING TO: ${placeType || 'an outing'}
THEY'D LIKE HELP WITH: ${concerns.join(', ')}
${specificNotes ? `NOTES: ${specificNotes}` : ''}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2000,
      system: withLanguage(COMFORT_KIT_SYSTEM, userLanguage),
      messages: [{ role: 'user', content: supplied }],
    }, { label: 'sensory-minefield-mapper-comfort-kit' });

    if (!parsed?.essentials && !parsed?.comfort_items) {
      return res.status(500).json({ error: 'Could not build a packing list. Please try again.' });
    }

    await runOutputGuard(parsed, {
      label: 'sensory-minefield-mapper-comfort-kit',
      fields: collectProseFields(parsed),
      supplied,
      promise: 'Suggest a packing checklist personalized to what the visitor selected, without claiming any item has a therapeutic or regulatory effect they did not describe themselves.',
      guard: router.outputGuard,
      userLanguage,
    });

    const cleaned = stripEmptyItems(parsed);

    res.json(cleaned);
  } catch (error) {
    console.error('[TripRecon/comfort-kit]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// IF THIS ISN'T WORKABLE — was "alternatives". No live/local search
// capability exists, so this describes qualities to look for rather than
// naming specific nearby places.
// ═══════════════════════════════════════════════════════════════
const ALTERNATIVES_SYSTEM = section(`IF THIS ISN'T WORKABLE — JSON API, not a conversation

This is a DIFFERENT task from preparing for a place. Do NOT produce a
preparation plan, a factor-by-factor breakdown (Noise/Crowds/Lighting/etc.),
or anything resembling "worth_preparing_for" — that is a different endpoint's
job. This endpoint answers exactly one question: if this place doesn't work
out, what should the visitor look for instead?

You are a JSON API endpoint. The caller is software, not the visitor
directly — your entire output is machine-parsed as JSON and never shown
as-is. Any word outside the JSON object breaks the caller.

The visitor is deciding this place or plan may not work. Without live/local
search, do not invent nearby alternatives by name — and do not invent
specific physical features of THIS place ("a corner seat away from the main
corridor," "a secondary waiting area") to describe what an alternative
should have. "look_for" items must describe qualities portable to ANY
alternative venue (quieter seating, outdoor space, a shorter typical wait) —
never a feature that only makes sense as a description of the specific place
the visitor is trying to avoid.

Output exactly this shape, nothing before the opening { and nothing after
the closing }:
{"look_for":["a concrete, portable quality — e.g. quieter seating, outdoor space, shorter expected wait"],"other_options":["a generic category not tied to this visit — e.g. delivery, an online equivalent, rescheduling"],"note":"one practical sentence"}`);

router.post('/sensory-minefield-mapper/alternatives', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const userLanguage = cleanString(req.body.userLanguage, 20) || 'en';
    const location = cleanString(req.body.location, 200);
    const concerns = Array.isArray(req.body.concerns) ? req.body.concerns.slice(0, 10) : [];
    const analysisContext = req.body.analysisContext && typeof req.body.analysisContext === 'object' ? req.body.analysisContext : null;

    if (!location) return res.status(400).json({ error: 'Location is required.' });

    const supplied = `ALTERNATIVES REQUEST — this is not a request to prepare for the place below; it is a request for what to look for INSTEAD of it. Respond with the look_for/other_options/note JSON only.
PLACE THE VISITOR IS MOVING AWAY FROM: ${location}
CONCERNS: ${concerns.length ? concerns.join(', ') : 'general comfort'}
${analysisContext?.summary?.one_liner ? `PREVIOUS PLAN SUMMARY: ${analysisContext.summary.one_liner}` : ''}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2000,
      system: withLanguage(ALTERNATIVES_SYSTEM, userLanguage),
      messages: [{ role: 'user', content: supplied }],
    }, { label: 'sensory-minefield-mapper-alternatives' });

    if (!parsed?.look_for) {
      return res.status(500).json({ error: 'Could not put this together. Please try again.' });
    }

    await runOutputGuard(parsed, {
      label: 'sensory-minefield-mapper-alternatives',
      fields: collectProseFields(parsed),
      supplied,
      promise: 'Help the visitor define what to look for in an alternative without inventing a specific nearby venue the tool has no way to know exists.',
      guard: router.outputGuard,
      userLanguage,
    });

    const cleaned = stripEmptyItems(parsed);

    res.json(cleaned);
  } catch (error) {
    console.error('[TripRecon/alternatives]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// HELP ME ASK FOR SOMETHING — a single script for a situation not already
// covered by the main plan's things_you_could_ask.
// ═══════════════════════════════════════════════════════════════
const ASK_SCRIPT_SYSTEM = section(`HELP ME ASK FOR SOMETHING

The visitor needs words for one specific situation right now. Write one
script grounded only in what they described — never promising the venue will
grant it.

Return ONLY valid JSON:
{
  "situation": "restate what they described, one sentence",
  "script": "words the visitor could actually say, asking rather than assuming an answer"
}`);

router.post('/sensory-minefield-mapper/ask-script', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const userLanguage = cleanString(req.body.userLanguage, 20) || 'en';
    const need = cleanString(req.body.need, 500);
    const location = cleanString(req.body.location, 200);

    if (!need) return res.status(400).json({ error: 'Describe what you need to ask about.' });

    const supplied = `WHAT THEY NEED TO ASK ABOUT: ${need}
${location ? `LOCATION: ${location}` : ''}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 800,
      system: withLanguage(ASK_SCRIPT_SYSTEM, userLanguage),
      messages: [{ role: 'user', content: supplied }],
    }, { label: 'sensory-minefield-mapper-ask-script' });

    if (!parsed?.script) {
      return res.status(500).json({ error: 'Could not write that. Please try again.' });
    }

    await runOutputGuard(parsed, {
      label: 'sensory-minefield-mapper-ask-script',
      fields: collectProseFields(parsed),
      supplied,
      promise: 'Write one script for the specific thing the visitor needs to ask about, without promising the venue will agree to it.',
      guard: router.outputGuard,
      userLanguage,
    });

    const cleaned = stripEmptyItems(parsed);

    res.json(cleaned);
  } catch (error) {
    console.error('[TripRecon/ask-script]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// COMPANION SUMMARY — unchanged in this pass. Not addressed by the
// supplied rewrite spec, and the new frontend's landing/result screens
// (per the supplied mocks) do not surface a "share with companion" button,
// so this endpoint is no longer called from the UI. Left intact rather than
// deleted — see audit/tool-notes/SENSORYMINEFIELDMAPPER-NOTES.md for why.
// ═══════════════════════════════════════════════════════════════
router.post('/sensory-minefield-mapper/companion-summary', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { name, location, concerns, gamePlan, companionName, userLanguage } = req.body;

    if (!location?.trim()) return res.status(400).json({ error: 'Location is required' });

    const prompt = `Write a short, casual message someone can share with the person they're going to ${location} with. It should explain what they need in a way that's direct and comfortable — not clinical, not apologetic, just practical. Think "hey, heads up about what works for me."

${name ? `FROM: ${name}` : ''}
${companionName ? `TO: ${companionName}` : ''}
LOCATION: ${location}
THEIR CONCERNS: ${concerns?.join(', ') || 'crowds and noise'}
GAME PLAN CONTEXT: ${gamePlan ? JSON.stringify(gamePlan) : 'standard visit plan'}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.

Return ONLY valid JSON:
{
  "message_casual": "A casual text-style message (2-4 sentences, friendly tone)",
  "message_detailed": "A slightly longer version with specifics (3-5 sentences)",
  "key_asks": ["Specific thing they need from their companion", "Another ask"],
  "signal_system": {
    "description": "A simple signal system they can use during the visit — 1-2 sentences",
    "signals": [
      { "signal": "What to do/say — one sentence", "meaning": "What it means — one sentence" }
    ]
  }
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.

Return ONLY valid JSON. ${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) }],
    }, { label: 'sensory-minefield-mapper-companion-summary' });
    if (!parsed.message_casual) {
      return res.status(500).json({ error: 'Something went wrong. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[TripRecon/companion]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
