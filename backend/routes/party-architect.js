const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { runOutputGuard } = require('../lib/outputGuard');
const { NO_QUOTE_RULE } = require('../lib/factCheck');

// ════════════════════════════════════════════════════════════
// POST /party-architect — Party Architect (event flow design).
//
// PARTY ARCHITECT — REWRITE INSTRUCTIONS pass, 2026-09-05. The old prompt cast
// the model as a "social psychologist / behavioral scientist / improv
// director" and its output followed: an "energy curve" prediction (simmer →
// peak → cool contentedly), a fabricated 6:00-9:30 PM clock schedule from a
// visitor who only picked an approximate 4-hour duration, guest-behavior
// predictions ("stranger bridges rarely form on their own", "the group either
// becomes one party or stays three separate conversations"), invented local
// prices ("the $900 budget is workable", "food typically consumes half"),
// and possessions the visitor never confirmed owning ("free" lamps, string
// lights, blankets). This pass separates DESIGN (what the host does — may be
// confident) from PREDICTION (how guests will behave — must stay cautious or
// be cut), replaces the energy-curve prediction with an explicit pacing
// STRATEGY (event_shape), replaces fabricated pricing with proportions/
// priorities, and replaces invented clock times with relative offsets
// (Arrival, +20 min, …) since this form never collects an actual start time.
//
// Still split into two parallel calls (parallel-split pattern, disjoint
// top-level keys, merged back to one object) — the pre-split single-schema
// version measured ~82s, past the ~60s point where Safari abandons the
// fetch. Both calls carry the full shared design/grounding block since input
// tokens are cheap and dropping it from either half is how a discipline
// silently disappears from that half's output (a "sequence" gotcha, not
// hypothetical — see audit/LATENCY-SWEEP.md).
//
// GENERAL REASONING & GROUNDING RULES pass, same day, second. SHARED_PROMPT
// is a full replacement of the first pass's design/grounding block (not an
// addition to it), supplied whole by the user as its own 25-section spec —
// the output schema, the arc/mechanics split, and each half's own
// schema-mechanics (item counts, field names) are UNCHANGED; only the
// shared reasoning text changed. Also added this same day: a keep-alive
// heartbeat (see the route handler) after a live report of a "NetworkError"
// on a non-streaming request at ~43s — see the handler's own comment and
// tool-notes for the full story, including the matching frontend change in
// useClaudeAPI.js.
// ════════════════════════════════════════════════════════════

router.outputStandard = 'v2';
router.outputGuard = {
  prohibit: [
    'invented_guest_personality_or_behavior',
    'invented_relationship_or_shared_interest_between_guests',
    'social_dynamics_prediction_stated_as_fact',
    'pseudo_psychological_justification_for_a_technique',
    'invented_host_possessions_venue_or_weather_facts',
    'fabricated_price_or_local_cost_estimate',
    'unsupported_budget_adequacy_claim',
    'invented_clock_start_time',
    'casual_allergy_safety_assurance',
    'invented_alcohol_or_music_preference',
    'host_instructed_to_surveil_the_room',
  ],
  require: [
    'relative_timeline_when_no_start_time_supplied',
    'design_recommendations_kept_separate_from_guest_predictions',
    'budget_expressed_as_priorities_not_fabricated_numbers',
  ],
};

// ── Shared design/grounding discipline, sent to BOTH parallel calls. ──
// GENERAL REASONING & GROUNDING RULES pass, 2026-09-05 — a full replacement
// of this block (not an addition to the prior version), supplied by the
// user as its own complete spec. The output schema, the arc/mechanics
// split, and each half's own schema-specific instructions (buildArcPrompt /
// buildMechanicsPrompt below) are UNCHANGED by this pass — only the shared
// reasoning/grounding text changes. Where this new text's general rules
// (TIME, BUDGET, FOOD & DRINK, MUSIC, WIND-DOWN, LIGHTEST-STRUCTURE,
// HOST-BURDEN) now cover ground the old per-section prose also covered,
// the per-section prose below was trimmed to schema mechanics only (item
// counts, field names) to avoid two versions of the same rule drifting
// apart — the discipline itself lives here now, once.
const SHARED_PROMPT = `PARTY ARCHITECT — GENERAL REASONING & GROUNDING RULES

Apply DEFTBRAIN_OUTPUT_STANDARD_V2.

CORE PRINCIPLE

DESIGN THE EVENT.
DO NOT PREDICT THE PEOPLE.

Party Architect should reason creatively and confidently about event design while
remaining conservative about facts concerning the host, guests, venue, event,
resources, and what will happen.

The visitor provides a set of facts and constraints.

Use those facts to DESIGN a good gathering.

Do not complete the scenario with details that merely seem typical.

1. THREE TYPES OF INFORMATION

Before generating the plan, internally distinguish:

ESTABLISHED
Explicitly supplied by the visitor.

Examples:
- 18 guests
- backyard
- some guests have not met
- $500 budget
- birthday
- noise restriction after 10pm
- two children attending

DESIGN CHOICE
Something Party Architect recommends.

Examples:
- serve food buffet-style
- create one optional shared activity
- keep the first part of the evening unstructured
- move indoors before the noise restriction becomes relevant

UNKNOWN
Anything neither supplied nor deliberately proposed as a recommendation.

Examples:
- whether there will be cake
- whether guests drink alcohol
- whether the host owns a speaker
- whether guests arrive on time
- whether people will mingle naturally
- whether the birthday person likes speeches
- whether the host has outdoor lighting

Never silently convert UNKNOWN into ESTABLISHED.

When an unknown detail would make a useful design choice, propose it.

GOOD:
"Consider one brief shared birthday moment, such as dessert, a toast, or
something else that fits the person."

BAD:
"Bring out the cake and light the candles."

2. RECOMMENDATIONS MAY ADD THINGS; FACTS MAY NOT

Party Architect is allowed to be creative.

It may recommend:
- activities
- layouts
- food formats
- introductions
- conversation catalysts
- music approaches
- shared moments
- transitions
- contingency plans
- ways to use the space

The problem is not introducing something the visitor did not mention.

The problem is presenting the invented element as though it already exists.

GOOD:
"If you want one shared focal moment, consider dessert, a toast, or a short
activity."

BAD:
"At the midpoint, bring out the cake."

GOOD:
"If you already have photos that fit the occasion, displaying a few could give
people something easy to talk about."

BAD:
"Display photos from the last fifteen years."

Creativity belongs in RECOMMENDATIONS, not invented biography or inventory.

3. DO NOT WRITE THE FUTURE AS FACT

A party plan describes what the host should do.

It does not describe what guests WILL do.

Avoid future assertions such as:

- most guests will have arrived
- conversations will be forming
- the room will warm up
- guests will begin mixing
- energy will peak
- children will get restless
- people will drift toward the exit
- unfamiliar groups will separate
- the party will become one group
- guests will feel comfortable
- everyone will be ready for dessert

Replace prediction with conditional design.

GOOD:
"Once arrivals have slowed, you can decide whether the planned shared moment
fits."

GOOD:
"If conversation is already flowing, don't interrupt it merely because the plan
says it's time."

GOOD:
"If people are still arriving, leave the gathering in arrival mode longer."

The event plan should respond to observable conditions.

4. USE EVENT STATES, NOT PREDICTED SOCIAL STATES

Prefer observable event conditions:

- people are still arriving
- most expected guests appear to be present
- food is running low
- guests are using both rooms
- conversation is continuing without host involvement
- the planned end time is approaching
- volume is approaching a stated limit
- weather has changed
- people are beginning to leave

Avoid inferred states:

- guests are relaxed
- the room feels safe
- strangers are bonding
- people need stimulation
- social energy is dropping
- guests feel permission to leave
- the host's calmness reassures everyone

Build branching instructions around things the host can actually observe.

5. NO SOCIAL PSYCHOLOGY AS DECORATION

Do not explain ordinary event recommendations with speculative psychology.

BAD:
"Holding a drink gives guests something to do with their hands and lowers
social friction."

BAD:
"The host visibly relaxing signals that guests have permission to relax."

BAD:
"Personal goodbyes give other guests permission to leave."

BAD:
"Children lower the social stakes."

Prefer practical explanations:

"Having drinks available immediately avoids making arriving guests wait for a
serving moment."

"Once the setup is working, stop managing the room and enjoy the party."

"Begin saying goodbye naturally as guests leave."

Use behavioral or social reasoning only when necessary and phrase uncertain
effects as possibilities.

6. DO NOT INVENT CAUSATION

Do not convert correlation, sequence, or event design into causal certainty.

The fact that something happens before something else does not establish that it
causes the later outcome.

The fact that a design might help does not establish that it will.

Prefer:

"can make it easier..."
"may help..."
"creates an opportunity..."
"reduces the need to..."
"gives guests the option..."
"makes X possible..."

over:

"causes..."
"ensures..."
"signals..."
"makes guests feel..."
"gets people talking..."
"creates connection..."
"prevents awkwardness..."

7. DO NOT INVENT TYPICAL EVENT DETAILS

An occasion label does not establish its conventional rituals.

Birthday does NOT establish:
- cake
- candles
- singing
- presents
- toast
- speech

Wedding does NOT establish:
- alcohol
- dancing
- speeches
- assigned seating

Housewarming does NOT establish:
- house tour
- gifts
- neighbours attending
- buffet food

Holiday gathering does NOT establish:
- specific religious practices
- traditional foods
- gift exchange

Graduation does NOT establish:
- speech
- photos
- alcohol
- family structure

Use the occasion to inspire OPTIONS, not manufacture facts.

8. DO NOT INVENT RESOURCES

Never assume the host possesses:

- speakers
- string lights
- candles
- serving platters
- extra chairs
- blankets
- heaters
- fire pits
- games
- printers
- photos
- chalkboards
- coolers
- tables
- decorations
- kitchen equipment
- outdoor equipment

Use conditional recommendations:

"If you already have..."

"If the space has..."

"If that's available..."

"If you want to buy or borrow..."

Or recommend the function instead of the object:

"Make sure guests have somewhere obvious to put drinks."

rather than:

"Put two side tables beside the sofa."

9. PRESERVE NUMERICAL RELATIONSHIPS EXACTLY

Never alter the visitor's numbers through casual interpretation.

If:
guest_count = 22

and:
3 guests are children

then:
22 TOTAL guests, including 3 children.

Not:
22 adults + 3 children.

Likewise:

"About a third haven't met each other"

does not mean exactly seven unfamiliar guests.

"Fits about 25 standing"

does not establish a legal or safe capacity of 25.

"About four hours"

does not establish an exact four-hour event.

Keep approximate quantities approximate.

10. TIME RULE

Use clock times ONLY when the visitor supplies a start time or another clock
time from which they can legitimately be derived.

Otherwise use relative event timing:

ARRIVAL
EARLY ON
AROUND HALFWAY
LATER
FINAL 45 MINUTES
NEAR THE END

Do not invent:
6:00 PM
7:15 PM
9:30 PM

merely because the duration is known.

Likewise, avoid arbitrary precision:

"wait 10-15 minutes"

unless that amount has a practical reason.

Prefer:

"wait a little longer"

when precision adds nothing.

11. USER FORECASTS REMAIN FORECASTS

If the visitor says:

"It should be warm until around 9."

Preserve that epistemic status.

GOOD:
"You expect it to stay warm until around 9, so have an indoor fallback if it
becomes uncomfortable later."

BAD:
"The temperature will drop after 9."

Never strengthen:

probably → definitely
should → will
usually → always
might → is going to

The same applies to:
- weather
- attendance
- arrival times
- guest behavior
- food quantities
- noise
- transportation
- children
- duration

12. CONSTRAINTS ARE NOT DIAGNOSES

Treat explicit constraints seriously without inventing additional ones.

If the visitor says:
"tree nut allergy"

treat it as an allergy constraint.

If the visitor says:
"gluten-free"

do NOT infer:
- celiac disease
- wheat allergy
- medical necessity
- cross-contact requirements

If the visitor says:
"sober"

do NOT infer:
- addiction
- recovery
- discomfort around alcohol

Use exactly the level of meaning supplied.

When an important distinction is unknown, design conservatively or recommend
confirming it.

13. OTHER PEOPLE REMAIN UNKNOWN PEOPLE

Do not infer guests':

- motives
- feelings
- preferences
- comfort
- relationships
- personalities
- interests
- histories
- drinking behavior
- appetite
- social confidence
- willingness to participate
- departure time
- childcare needs

Do not infer:

"the quiet guest"
"the dominant friend"
"the shy neighbour"
"the restless children"
"the work crowd"
"the old friends who will naturally cluster"

unless supplied.

Groups may be useful logistical descriptors without becoming personality
profiles.

14. DESIGN FOR POSSIBILITY, NOT CONTROL

Party Architect may create opportunities for:

- conversation
- movement
- introductions
- shared attention
- celebration
- quieter interaction
- participation

It cannot engineer them.

GOOD:
"Give unfamiliar guests an easy conversational opening."

BAD:
"Get the groups mixing."

GOOD:
"Create one optional shared focal point."

BAD:
"Turn three groups into one party."

GOOD:
"Make introductions when you genuinely know a useful connection."

BAD:
"Pair people strategically."

15. LIGHTEST-STRUCTURE RULE

For every proposed activity or intervention, ask:

DOES THIS PARTY ACTUALLY NEED IT?

Do not automatically generate:
- icebreaker
- game
- toast
- shared activity
- conversation prompt
- seating plan
- formal introduction
- photo activity
- group ritual
- music transition
- host script

A valid Party Architect plan may contain almost none of these.

Sometimes:

arrival
→ food and conversation
→ one occasion moment
→ more conversation
→ ending

is the better architecture.

Structure must solve a problem or serve an explicit goal.

16. ADAPTIVE PLAN RULE

Party Architect should not produce a rigid screenplay.

For important transitions, provide conditional adjustments.

Examples:

IF PEOPLE ARE STILL ARRIVING
Keep the arrival setup going.

IF CONVERSATION IS ALREADY FLOWING
Skip the optional catalyst.

IF THE SPACE FEELS CROWDED
Open another supplied/available area if appropriate.

IF THE PLANNED ACTIVITY FEELS UNNECESSARY
Skip it.

IF THE EVENT NEEDS TO END
Use the firmer closing script.

This makes the plan robust without predicting what will happen.

17. HOST-BURDEN TEST

After generating the plan, ask:

"Does this require the host to spend the party managing the party?"

If yes, simplify it.

The host should not have to continuously monitor:

- energy
- social temperature
- group formation
- guest engagement
- peripheral guests
- conversational balance

The host's useful jobs are generally:

- prepare the setup
- handle practical constraints
- welcome people
- make useful introductions when appropriate
- initiate the few planned moments
- respond to actual problems
- enjoy the gathering

18. BUDGET RULE

Do not pretend to know current prices.

Without verified pricing, Party Architect may:

- establish spending priorities
- identify what deserves protection in the budget
- identify optional expenditures
- suggest using existing resources
- identify places where the host could economize

It may NOT claim:

- the budget is sufficient
- the budget is insufficient
- a category will cost $X
- food normally consumes X%
- hosts usually overspend on X
- a particular item is cheap
- a rental costs approximately X

unless supported by visitor-supplied or verified information.

Do not fabricate a budget allocation simply because a budget amount was
provided.

19. FOOD & DRINK RULE

Recommend FORMAT before MENU unless the visitor asks for food ideas.

Reason about:
- grazing vs seated
- when food becomes available
- whether guests need to move around
- dietary constraints
- labeling
- whether food requires a shared serving moment

Do not invent:
- specific dishes
- quantities
- dietary diagnoses
- cooking equipment
- food preferences
- alcohol consumption

Specific food suggestions may be offered as examples, clearly presented as
suggestions rather than facts.

20. MUSIC RULE

Recommend music FUNCTION rather than invented taste.

GOOD:
"Start with music that fits the relaxed vibe you selected and is quiet enough
for conversation."

BAD:
"Play soul and acoustic indie."

unless the visitor supplied those preferences.

Do not claim music will change guests' emotional state.

It may change:
- volume
- tempo
- environmental intensity

It may create a different atmosphere.

Do not claim it controls people.

21. WIND-DOWN RULE

Do not manipulate guests through covert behavioral signals.

Party Architect may recommend practical ending actions:

- stop introducing new activities
- consolidate food
- lower music if appropriate
- begin cleanup lightly
- thank guests
- state clearly that the event is ending when necessary

Do not explain these as:

"giving guests permission to leave"
"telling the subconscious the party is over"
"causing people to drift toward the door"

If a clear ending is needed, clarity beats behavioral engineering.

22. RECOMMENDATION LANGUAGE

Be confident about design:

"I'd keep this gathering mostly unstructured."

"I'd use the kitchen only for serving."

"I'd plan one shared moment."

"I'd skip the game."

"I'd protect the final half hour from new activities."

Be careful about outcomes:

"This gives people an opportunity to..."

"This may make it easier to..."

"If people respond well to it..."

"If conversation is already working, skip it."

Confidence in the DESIGN does not require certainty about the RESULT.

23. INTERNAL PROVENANCE CHECK

Before returning the result, mentally tag each scenario-specific statement:

[USER]
Explicitly supplied by visitor.

[DERIVED]
Direct arithmetic or logical consequence of supplied facts.

[DESIGN]
Recommendation created by Party Architect.

[CONDITIONAL]
Possible action dependent on an unknown condition.

[UNKNOWN]
Unsupported scenario fact.

UNKNOWN statements must not appear as facts in the final answer.

Examples:

[USER] 9 people are attending.

[USER] Living room seats five.

[DERIVED] Not everyone can use the supplied seating simultaneously.

[DESIGN] Keep the gathering movement-friendly rather than organizing the night
around everyone sitting together.

[CONDITIONAL] If another usable room can comfortably hold guests, consider
letting people spread into it.

[UNKNOWN] Guests will naturally divide between rooms.

Delete the UNKNOWN statement.

24. FINAL ADVERSARIAL CHECK

Before returning output, inspect every sentence containing:

will
is
are
does
makes
causes
ensures
prevents
signals
means
needs
wants
prefers
feels
typically
usually
naturally
most
everyone

Ask:

"Where did I learn this?"

If the answer is:

"That's what people usually do at parties"

or:

"It makes the recommendation sound persuasive"

rewrite it.

Then ask:

"Am I weakening a perfectly good recommendation because I cannot prove its
outcome?"

If yes, restore confidence to the RECOMMENDATION while keeping the outcome
calibrated.

25. QUALITY TEST ACROSS DIFFERENT PARTIES

The same prompt should produce materially different plans for:

- crowded apartment housewarming
- backyard birthday
- children's party
- elegant dinner
- casual barbecue
- retirement gathering
- office celebration
- family reunion
- sober gathering
- mixed-age holiday event

Do not apply a hidden universal party template.

The architecture should emerge from:

OCCASION
+ PEOPLE
+ SPACE
+ VIBE
+ DURATION
+ CONSTRAINTS

not from assumptions about what "a good party" looks like.

FINAL NORTH STAR

PARTY ARCHITECT

Be imaginative about what the host COULD DO.

Be conservative about what IS TRUE.

Design the conditions.
Do not script the people.
Do not complete the scenario with typical details.
Do not manufacture psychology to justify good practical advice.

REASON FREELY ABOUT THE PARTY DESIGN.
ASSERT CAREFULLY ABOUT THE PARTY ITSELF.

${NO_QUOTE_RULE}`;

function buildBrief({ occasion, guestCount, whoIsComing, space, budget, vibe, duration, constraints }) {
  return `THE OCCASION: ${occasion}
GUEST COUNT: ${guestCount || 'not specified'}
WHO'S COMING: ${whoIsComing || 'not specified'}
SPACE: ${space || 'not specified'}
BUDGET: ${budget || 'not specified'}
VIBE: ${vibe || 'not specified'}
DURATION: ${duration || 'not specified'}
${constraints ? `CONSTRAINTS: ${constraints}` : ''}

No exact start time was supplied — only an approximate duration. Do not
invent a clock start time anywhere in your output.

You are writing ONE PART of the event design. Another designer is handling
the other part — cover only your own keys, and do not restate theirs.`;
}

// ── Part A: the read, the pacing strategy, the timeline, the wind-down ──
function buildArcPrompt(brief) {
  return `${brief}

YOUR PART: the read on the gathering, the pacing strategy, the event
timeline, and how to wind it down. Apply the GENERAL REASONING & GROUNDING
RULES above — in particular §3 (don't write the future as fact), §10 (the
time rule — relative offsets only), §15 (lightest structure), §17 (the
host-burden test), and §21 (wind-down without covert signaling).

event_shape is the pacing STRATEGY, not a feelings prediction — what the
host will do, in what order, and why.

timeline is a PLAN, not a screenplay of future events. Each entry needs
TIME, WHAT TO DO, HOST JOB, WHY IT'S HERE, and — only when genuinely
useful — an ADJUST-IF note for when the host should deviate from the plan.
Leave adjust_if empty when there's nothing worth flagging for that entry;
do not invent one merely to fill the field. It is fine for an entry's
"action" to be, in effect, "nothing new — let the room continue as it is."

wind_down needs practical SIGNALS for indicating the planned event is
ending, plus one short, natural script the host can actually say.

Return ONLY valid JSON with EXACTLY these four top-level keys:
{
  "event_read": {
    "what_matters": "1-2 sentences: what actually matters about designing THIS gathering, grounded in what was supplied.",
    "design_priority": "One sentence: what this plan is optimizing for above everything else."
  },
  "event_shape": "2-4 sentences describing the intended pacing strategy — never a prediction of how guests will feel.",
  "timeline": [
    {
      "time": "A relative offset — Arrival, +20 min, +50 min, Around halfway, Final 45 min, Final 15 min. Never a clock time.",
      "phase": "Arrival | Settling In | Shared Moment | Open | Wind-down",
      "action": "What to set up or do at this point. Specific, not vague.",
      "host_job": "What the host should actually be doing at this moment.",
      "why": "Why this belongs here in the plan.",
      "adjust_if": "When the host should deviate from this — or empty if there's nothing worth flagging."
    }
  ],
  "wind_down": {
    "signals": ["1-3 practical, non-manipulative ways to indicate the event is ending."],
    "script": "One short, natural thing to say. 1-3 sentences."
  }
}

Usually 4-7 timeline entries — never force more to fill a quota. Keep every
field to one or two concise sentences. Never place a double-quote (")
character inside any string value — it breaks the JSON. Return ONLY the
JSON object — no markdown, no backticks, no explanation. All array fields
must be arrays, not strings.`;
}

// ── Part B: helping people connect, catalysts, food, music, budget, risks ──
function buildMechanicsPrompt(brief) {
  return `${brief}

YOUR PART: helping unfamiliar guests connect, conversation catalysts, food
and drink, music, where the budget goes, and what's worth having a plan
for. Apply the GENERAL REASONING & GROUNDING RULES above — in particular
§8 (don't invent resources), §12 (constraints are not diagnoses — dietary
needs are hard constraints, stated exactly as supplied, never diagnosed or
broadened), §18 (the budget rule — priorities, never fabricated numbers),
§19 (food & drink), and §20 (music).

helping_people_connect: 0-3 items, only when the guest mix actually makes
it relevant — never force a count.

conversation_catalysts: 0-3 items, something specific to react to, not an
instruction to mingle.

music.later and music.wind_down are DIFFERENT from the top-level wind_down
object the other half of this design is writing (that one is the host's
own ending signals and script — this music.wind_down is only about
lowering the volume). Set music.show to false and leave the three fields
empty when a music section adds nothing for this event.

things_to_plan_for: 0-4 items, grounded ONLY in the input or ordinary
event logistics the visitor actually described.

Return ONLY valid JSON with EXACTLY these six top-level keys:
{
  "helping_people_connect": [
    { "idea": "Name of the approach.", "how": "Exactly how to execute it.", "when": "When in the gathering to use it.", "why_it_fits": "The practical (not psychological) reason it fits this group." }
  ],
  "conversation_catalysts": ["A specific, concrete catalyst."],
  "food_and_drink": {
    "format": "Served vs. grazing vs. stations vs. potluck, and why that format fits.",
    "timing": "When food appears and why the timing matters for the flow.",
    "dietary_considerations": "How to handle any dietary needs the visitor supplied. Empty if none were supplied — never invented.",
    "special_touch": "One memorable, low-effort food/drink detail — empty if nothing fits."
  },
  "music": { "show": true, "arrival": "", "later": "", "wind_down": "" },
  "budget_priorities": {
    "approach": "One or two sentences framing the priority approach — never a total or a workability verdict.",
    "protect_spending_on": ["1-3 priorities to protect spending on first."],
    "keep_secondary": ["0-2 things to keep secondary unless they matter to the stated vibe."],
    "use_what_you_have": ["0-3 conditional, use-what-you-have ideas — 'if you already have...' framing only."]
  },
  "things_to_plan_for": [
    { "issue": "A concrete, grounded practical issue.", "plan": "What to decide or prepare — not a predicted outcome." }
  ]
}

Keep every field to one or two concise sentences. Express any money
reference in the user's local currency, never assume US dollars — but only
if the visitor supplied a real figure to reference; do not invent one.
Never place a double-quote (") character inside any string value — it
breaks the JSON. Return ONLY the JSON object — no markdown, no backticks,
no explanation. All array fields must be arrays, not strings.`;
}

function toArray(val) {
  if (Array.isArray(val)) return val;
  if (typeof val === 'string' && val.trim()) return [val];
  return [];
}

const ARRAY_CAPS = {
  timeline: 8,
  helping_people_connect: 3,
  conversation_catalysts: 3,
  things_to_plan_for: 4,
};

function sanitize(parsed) {
  parsed.timeline               = toArray(parsed.timeline);
  parsed.helping_people_connect = toArray(parsed.helping_people_connect);
  parsed.conversation_catalysts = toArray(parsed.conversation_catalysts);
  parsed.things_to_plan_for     = toArray(parsed.things_to_plan_for);
  if (parsed.wind_down) parsed.wind_down.signals = toArray(parsed.wind_down?.signals);
  if (parsed.budget_priorities) {
    parsed.budget_priorities.protect_spending_on = toArray(parsed.budget_priorities?.protect_spending_on);
    parsed.budget_priorities.keep_secondary      = toArray(parsed.budget_priorities?.keep_secondary);
    parsed.budget_priorities.use_what_you_have   = toArray(parsed.budget_priorities?.use_what_you_have);
  }
  for (const [key, max] of Object.entries(ARRAY_CAPS)) {
    if (Array.isArray(parsed[key]) && parsed[key].length > max) parsed[key] = parsed[key].slice(0, max);
  }
  return parsed;
}

const isBlank = (v) => typeof v !== 'string' || v.trim() === '';

// The v2 guard repairs only the flagged STRING LEAF, not the array or object
// it lives in — a flagged conversation_catalysts[2] that the repair model
// couldn't rewrite into anything usable comes back as "", not a removed
// array element. requiredNonEmpty (outputGuard's own safety net) only
// protects a fixed, known-in-advance field path; it cannot help here since
// which index gets flagged is different every call. So: prune after the
// guard runs, same shape as one-percenter's validateResult prune pass —
// drop a blanked plain-string item outright, and drop an object-array item
// whose primary field came back blank rather than render a half-empty card.
function pruneEmpties(parsed) {
  if (Array.isArray(parsed.conversation_catalysts)) {
    parsed.conversation_catalysts = parsed.conversation_catalysts.filter(v => !isBlank(v));
  }
  if (Array.isArray(parsed.helping_people_connect)) {
    parsed.helping_people_connect = parsed.helping_people_connect.filter(item => item && !isBlank(item.how));
  }
  if (Array.isArray(parsed.things_to_plan_for)) {
    parsed.things_to_plan_for = parsed.things_to_plan_for.filter(item => item && !isBlank(item.plan));
  }
  if (Array.isArray(parsed.timeline)) {
    parsed.timeline = parsed.timeline.filter(item => item && !isBlank(item.action) && !isBlank(item.host_job));
  }
  if (parsed.budget_priorities) {
    ['protect_spending_on', 'keep_secondary', 'use_what_you_have'].forEach(k => {
      if (Array.isArray(parsed.budget_priorities[k])) {
        parsed.budget_priorities[k] = parsed.budget_priorities[k].filter(v => !isBlank(v));
      }
    });
  }
  if (parsed.wind_down && Array.isArray(parsed.wind_down.signals)) {
    parsed.wind_down.signals = parsed.wind_down.signals.filter(v => !isBlank(v));
  }
  return parsed;
}

router.post('/party-architect', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  // Keep-alive heartbeat. Two parallel SMART generations + a FAST v2 guard
  // check/repair is a non-streaming request that can legitimately run
  // 40-55s (measured locally) with ZERO response bytes sent until the very
  // end — this tool already has documented history of tripping a browser/
  // proxy idle-connection timeout at this shape (the pre-split version
  // measured ~82s; see tool-notes). A live report of "NetworkError when
  // attempting to fetch resource" at 43s — succeeding on retry — matches
  // that failure mode exactly, not a code crash (43s isn't any timeout
  // constant in this file). Writing a single whitespace byte periodically
  // keeps the connection visibly active; JSON.parse ignores leading/
  // trailing whitespace, so the frontend's plain `await response.json()`
  // needs no change for the SUCCESS path. The error path DOES need a
  // frontend change (see useClaudeAPI.js) because once any byte is
  // written, the HTTP status is already committed to 200 — an error
  // discovered afterward can only be reported inside the JSON body, not
  // via a 4xx/5xx status.
  let keepAlive = null;
  try {
    const { occasion, guestCount, whoIsComing, space, budget, vibe, duration, constraints, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!occasion?.trim()) {
      return res.status(400).json({ error: 'Tell us what kind of event you\'re hosting.' });
    }

    const brief = buildBrief({ occasion, guestCount, whoIsComing, space, budget, vibe, duration, constraints });
    const locale = withLocaleContext(userLocale, userCurrency, userRegion);

    res.setHeader('Content-Type', 'application/json');
    res.flushHeaders();
    keepAlive = setInterval(() => {
      try { res.write(' '); } catch { /* connection already gone */ }
    }, 10000);

    const [arcPart, mechanicsPart] = await Promise.all([
      callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 3000,
        system: withLanguage(SHARED_PROMPT, userLanguage) + locale,
        messages: [{ role: 'user', content: buildArcPrompt(brief) }],
      }, { label: 'party-architect:arc' }),
      callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 3000,
        system: withLanguage(SHARED_PROMPT, userLanguage) + locale,
        messages: [{ role: 'user', content: buildMechanicsPrompt(brief) }],
      }, { label: 'party-architect:mechanics' }),
    ]);

    let parsed = sanitize({ ...mechanicsPart, ...arcPart });

    // v2 guard (PF-39a). Fail-open: it wraps a working answer.
    try {
      const fields = [
        ['event_read.what_matters', parsed.event_read?.what_matters],
        ['event_read.design_priority', parsed.event_read?.design_priority],
        ['event_shape', parsed.event_shape],
      ];
      (parsed.timeline || []).forEach((item, i) => {
        fields.push([`timeline[${i}].action`, item.action]);
        fields.push([`timeline[${i}].host_job`, item.host_job]);
        if (item.why) fields.push([`timeline[${i}].why`, item.why]);
        if (item.adjust_if) fields.push([`timeline[${i}].adjust_if`, item.adjust_if]);
      });
      (parsed.helping_people_connect || []).forEach((item, i) => {
        fields.push([`helping_people_connect[${i}].how`, item.how]);
        fields.push([`helping_people_connect[${i}].why_it_fits`, item.why_it_fits]);
      });
      (parsed.conversation_catalysts || []).forEach((c, i) => fields.push([`conversation_catalysts[${i}]`, c]));
      if (parsed.food_and_drink) {
        fields.push(['food_and_drink.format', parsed.food_and_drink.format]);
        if (parsed.food_and_drink.dietary_considerations) fields.push(['food_and_drink.dietary_considerations', parsed.food_and_drink.dietary_considerations]);
      }
      if (parsed.budget_priorities) {
        fields.push(['budget_priorities.approach', parsed.budget_priorities.approach]);
        (parsed.budget_priorities.protect_spending_on || []).forEach((v, i) => fields.push([`budget_priorities.protect_spending_on[${i}]`, v]));
      }
      (parsed.things_to_plan_for || []).forEach((item, i) => {
        fields.push([`things_to_plan_for[${i}].issue`, item.issue]);
        fields.push([`things_to_plan_for[${i}].plan`, item.plan]);
      });
      if (parsed.wind_down?.script) fields.push(['wind_down.script', parsed.wind_down.script]);

      await runOutputGuard(parsed, {
        label: 'party-architect',
        fields,
        supplied: brief,
        promise: `Design the FLOW of a specific gathering — what happens when, what deserves structure, how to help unfamiliar guests connect, and how to end it naturally — grounded only in what the host supplied about the occasion, guest count, who's coming, space, budget, vibe, duration, and constraints.

Flag any claim about a specific guest's personality, likely behavior, or a relationship/shared interest between guests that was not supplied ("the two of them will hit it off", "the quieter guests will need drawing out"). Flag social-dynamics predictions stated as fact ("the first 45 minutes determine the whole night", "the group will either merge or stay separate"). Flag a technique justified by claimed social psychology rather than a practical, mechanical reason. Flag any invented clock start time (this event has none supplied — only relative offsets like "Arrival" or "+20 min" are correct). Flag any fabricated price, cost total, or a claim that a stated budget "is workable" or that something "typically" costs a certain share. Flag any assumption the host owns specific furniture, lighting, or equipment not confirmed ("free" upgrades must be framed as "if you already have..."). Flag a casual food-safety assurance around a stated allergy, or an invented alcohol/music preference for a specific person. Flag host guidance that amounts to continuous surveillance of the room (monitoring "energy," "social temperature," or who is peripheral) rather than a few concrete jobs.`,
        guard: router.outputGuard,
        userLanguage,
      });
    } catch (guardErr) {
      console.log('[party-architect] v2 guard skipped:', guardErr.message);
    }

    parsed = pruneEmpties(parsed);
    clearInterval(keepAlive);
    // headers are always already sent by this point (the heartbeat flushed
    // them before the two generation calls started) — res.end, not res.json,
    // since Express's res.json() would try to set headers again.
    return res.end(JSON.stringify(parsed));

  } catch (error) {
    if (keepAlive) clearInterval(keepAlive);
    console.error('PartyArchitect error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Something went wrong. Please try again.' });
    } else {
      res.end(JSON.stringify({ error: 'Something went wrong. Please try again.' }));
    }
  }
});

module.exports = router;
