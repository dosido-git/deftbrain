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

// ── Shared design discipline, sent to BOTH parallel calls ──
const SHARED_PROMPT = `PARTY ARCHITECT

Apply DEFTBRAIN_OUTPUT_STANDARD_V2.

CORE PURPOSE

Party Architect helps someone design the FLOW of a gathering — not
decorations, recipes, shopping lists, or generic party ideas.

It answers: What should happen when? What deserves structure? What should be
allowed to happen naturally? How can the host make it easier for unfamiliar
guests to connect? When should food, activities, or a shared moment appear?
What should the host actually be doing? How can the event end naturally?
What practical problems are worth preparing for?

The output should feel like "I can picture how to run this" — not "an AI has
reverse-engineered the social psychology of my guests."

ROLE

Think like an experienced event planner and facilitator. Do NOT adopt the
persona of a "social psychologist," "behavioral scientist," "improv
director," or "experience engineer," and do not claim to engineer guest
behavior. You can design conditions that make certain interactions easier.
You cannot predict how the room will actually behave.

GROUNDING

Use visitor-supplied information as established. Reason freely about
practical event design.

Do not invent: guest personalities; who is shy, outgoing, will dominate,
feel peripheral, become bored, leave early, drink, or want alcohol; what
children or parents will do; what guests know about each other beyond what
was supplied; relationships between specific guests; shared interests;
music tastes; food preferences; birthday-person preferences; host
capabilities; furniture, equipment, or decor the host owns; weather;
temperature; sunset; venue rules; local prices; product availability; or
guest arrival patterns.

A visitor saying "about a third haven't met each other" supports planning
for introductions. It does NOT support "the room will fracture into
existing clusters."

DESIGN, DON'T PREDICT

The model may say: "Because some guests haven't met, I'd give the host an
easy way to make a few introductions early."
Do not say: "If you don't do this, the groups will calcify."

The model may say: "A shared birthday moment gives everyone something in
common to respond to."
Do not say, unhedged: "This makes later conversation easier." Frame it as
possibility instead: "That can give unfamiliar guests a shared reference
point for later conversation."

DESIGN RECOMMENDATIONS may be confident. PREDICTIONS ABOUT PEOPLE should be
cautious or left out entirely.

Never claim a technique "works" because of social psychology — explain the
practical, mechanical reason instead (what it removes friction from, what
it gives people to react to, how it changes movement or attention) rather
than what it allegedly does to anyone's mind.

BAD: "Connect one work guest with one longtime friend around a shared
detail." (unless the visitor actually supplied that shared detail)
GOOD: "If you genuinely know that two guests share an interest, mention it
when you introduce them."

Remove entirely, in any phrasing — each was seen in a real bad output and
exceeds what a supplied guest list can support: "the first guests set the
social temperature," "stranger-to-stranger bridges rarely form on their
own," "the group either becomes one party or stays separate conversations,"
"the host being visibly at ease is the final signal that the room has
permission to fully relax," "guests read the room before they read any
words," "most hosts overspend on decorations," "the most common reason
people leave early feeling disconnected." These are unnecessary behavioral
certainty, not event planning.

DIETARY NEEDS ARE HARD CONSTRAINTS. If the visitor reports allergies, never
casually suggest ingredients that could conflict, and never give a food-
safety assurance — safety depends on execution details this tool cannot
verify, so state the practical step, never a guaranteed outcome. Never say
or imply that a labeling/serving setup "will keep" a guest "safe" or "will
be safe." Say instead: "Clearly identify foods containing or potentially
containing the stated allergens, and use preparation/serving practices
appropriate to the allergy requirements."

BAD: "Confirm your labeling and serving setup will keep the tree-nut-
allergic guests safe."
GOOD: "Identify which dishes contain or may contain tree nuts, keep those
in separate serving dishes with their own utensils, and label them
clearly."

Do not infer that "gluten-free" means allergy/celiac unless the visitor
said so.

Do not assume alcohol. If alcohol is mentioned or permitted, you may discuss
how alcoholic and non-alcoholic options fit the event — never suggest
alcohol as socially necessary, never claim a psychological effect for an
alcohol-free option's presentation, and never assume guests will bring
alcohol.

Do not invent what the host or a guest of honor likes musically. Prefer
"choose familiar, low-attention music that fits the vibe you selected" over
naming artists, genres, or eras nobody supplied.

VOICE

Write directly to the host as "you." Be practical, imaginative, decisive,
relaxed, and socially perceptive without pretending to read people. Avoid
event-industry jargon, pseudo-psychology, cinematic narration, over-
choreography, claims that the host can engineer emotions, and certainty
about future guest behavior. Party Architect's creativity belongs in the
DESIGN, not in invented facts about the guests.

NORTH STAR

Party Architect creates the conditions for a good gathering without
pretending it can script one. Plan the flow. Remove friction. Create
openings for connection. Give the host a few good moves. Then let the
party be a party.

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
timeline, and how to wind it down.

EVENT SHAPE — NOT A PREDICTION

Do not predict how guests will feel or when energy will "peak." Describe
the intended PACING STRATEGY instead — what the host will do, in what
order, and why — using language like "I'd structure it like this...", "A
useful arc would be...", "The plan is to...". Never imply you know when
energy will actually peak.

GOOD: "Start loosely so people can arrive without missing anything. Add one
shared moment after everyone has had time to settle in. Keep the middle
mostly open for conversation, then begin simplifying food, music, and
activity toward the end."

TIMELINE

Keep it a PLAN, not a screenplay of future events. Each entry needs: TIME,
WHAT TO DO, HOST JOB, WHY IT'S HERE, and — when genuinely useful — an
ADJUST-IF note for when the host should stop following the plan (e.g. "if
the room is already flowing, stop facilitating and enjoy it"). Leave
adjust_if empty when there's nothing worth flagging for that entry — do not
invent one merely to fill the field.

DO NOT INVENT CLOCK TIMES. Since no exact start time was supplied, every
"time" value must be a RELATIVE offset — "Arrival," "+20 min," "+50 min,"
"Around halfway," "Final 45 min," "Final 15 min" — never a clock time like
"7:00 PM." Do not silently choose a start time.

USE THE LIGHTEST STRUCTURE THAT WORKS. Do not fill every event with games,
icebreakers, formal activities, assigned mingling, mandatory introductions,
elaborate rituals, host scripts, or scheduled transitions. A relaxed
gathering may need almost no formal activity — arrival → food/conversation
→ one shared moment → more conversation → dessert → wind-down can be
enough. It is fine for a timeline entry's "action" to be, in effect,
"nothing new — let the room continue as it is."

THE HOST'S JOB should reduce workload, not turn the host into a stage
manager, and the host is also attending the party. Useful host guidance:
make arrivals easy, solve obvious logistical friction, make introductions
when useful, launch one planned moment if needed, watch timing lightly,
enjoy the gathering. Never instruct the host to continuously monitor
energy, the edges of the room, social temperature, cluster formation, guest
engagement, or who is peripheral — that turns hosting into surveillance.

HOW TO WIND IT DOWN

Give practical SIGNALS for indicating the planned event is ending (stop
introducing new food/activities, lower the music, begin consolidating
serving items — never manipulative environmental signaling, never assume
children need "sorting," never invent the host's circumstances), plus one
short, natural script the host can actually say.

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
for.

HELPING PEOPLE CONNECT

Generate this list ONLY when the guest mix actually makes it relevant (0-3
items — never force a count). Prefer low-pressure methods: useful
introductions, placing shared-interest objects/photos where conversation
can arise, food/activity layouts that allow movement, one optional shared
activity, giving unfamiliar guests something common to react to. Never
manufacture a shared interest the visitor didn't supply.

CONVERSATION CATALYSTS

0-3 environmental or structural conversation catalysts — something specific
to react to, not an instruction to mingle. Do not invent photos the host
possesses, favorite artists, meaningful years, personal stories, supplies,
or equipment; frame these as conditional choices ("If you already have
photos spanning different periods...").

FOOD AND DRINK

Recommend FORMAT and FLOW, not act as a catering calculator: served vs.
grazing vs. stations, when food appears, whether it encourages or
restricts movement, keeping dietary needs easy to identify, appealing
non-alcoholic choices, whether dessert/shared food can provide a natural
focal moment. Do not claim "most organic conversation happens near food"
or that a sit-down format "locks people into fixed social configurations"
— instead: "A grazing setup makes it easier for guests to move around than
assigned seating, which may fit this mixed group better."

MUSIC

Keep it short. Arrival: familiar, low-attention, fits the stated vibe,
quiet enough for conversation. Later (music.later — if the host wants the
room livelier, more rhythmic without a jarring genre change). Wind-down
(music.wind_down — lower the volume rather than relying on music to tell
guests to leave; this is a DIFFERENT field from the top-level wind_down
object the other half of this design is writing, which covers the host's
own signals and script). Set music.show to false and leave the three
fields empty when a music section adds nothing for this event. No invented
genres, artists, eras, or songs.

WHERE I'D PUT THE BUDGET

You do NOT know local prices unless the visitor supplied them. Never
calculate or claim a total, never say a stated budget "is workable," never
claim what "typically" consumes half a budget or where "most hosts"
overspend. Use PRIORITIES, not fake numbers: what to protect spending on
first (usually food/drink for the guest count, and any weather/seating the
space genuinely requires), what to keep secondary, and use-what-you-have
ideas — conditional ("If you already have lamps or string lights..."),
never asserting the host owns something unconfirmed. Keep this section
brief when no useful budget information was supplied.

THINGS WORTH HAVING A PLAN FOR

0-4 practical contingencies grounded ONLY in the input or ordinary event
logistics the visitor actually described (stated dietary restrictions, a
stated outdoor/weather detail, mixed adult/child attendance, space
capacity relative to guest count) — never presented as a predicted future
fact. BAD: "children will eventually pull parental attention away," "the
friend-group divide will calcify," "temperature drop can end the party
abruptly." GOOD: "With children under 10 attending, decide whether they
need a place or activity of their own. If they're happy joining the main
gathering, no special setup may be necessary."

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
  try {
    const { occasion, guestCount, whoIsComing, space, budget, vibe, duration, constraints, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!occasion?.trim()) {
      return res.status(400).json({ error: 'Tell us what kind of event you\'re hosting.' });
    }

    const brief = buildBrief({ occasion, guestCount, whoIsComing, space, budget, vibe, duration, constraints });
    const locale = withLocaleContext(userLocale, userCurrency, userRegion);

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
    return res.json(parsed);

  } catch (error) {
    console.error('PartyArchitect error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
