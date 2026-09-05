const express = require('express');
const router = express.Router();
const { anthropic, withLanguage, withLocaleContext, cleanJsonResponse, repairMalformedJson } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ════════════════════════════════════════════════════════════
// POST /one-percenter — Small Change, Big Difference (was One Percenter).
// Route/endpoint/i18n prefix `op_` deliberately stay put per the
// naming-consistency rule — see audit/RENAMES.md. SSE streaming preserved
// on purpose (audit/tool-notes note it's intentional).
//
// FULL LLM INSTRUCTIONS pass, 2026-09-05. The 2026-09-05 grounding rewrite
// still let real fabrications through in live testing — cortisol-adjacent
// physiology, "upstream of all three problems" bottleneck-certainty
// language, and invented downstream magnitude claims. This pass is a
// complete prompt replacement built around a much longer list of named bad
// phrases (FORBIDDEN LANGUAGE below is close to verbatim from the actual
// bad output that prompted it), a restructured schema (math and
// why_not_start_elsewhere are now their own top-level objects with an
// explicit `show` flag instead of relying on an implicit empty-string
// convention), and a literal FINAL SELF-CHECK the prompt asks the model to
// run against its own draft before returning.
// ════════════════════════════════════════════════════════════

router.outputStandard = 'v2';
router.outputGuard = {
  checks: ['validateResult'],
  note: 'No LLM-adversarial guard here (this route streams via anthropic.messages.stream, not callClaudeWithRetry) — validateResult is a local regex walk over the final assembled object, run once before the SSE done event. Rule categories: invented physiology/neuroscience (cortisol, melatonin, dopamine, threat-detection/threat-detecting states, stress debt, cognitive depletion/fuel/tank, circadian, reactive mode, ambient anxiety, passive numbing, doom-scrolling framed as compensation, brain-training/rewiring/resetting verbs); false bottleneck-certainty ("the chokepoint," "is the engine," "upstream of," "determines the rest of your day," "not a symptom... is the cause"); claimed mathematical/scientific optimality; predicting the visitor\'s future or a changed self-identity without evidence; armchair psychology about why the visitor hasn\'t already made the change; and invented downstream time/energy/productivity savings not derivable from a supplied quantity (including "downstream quality improvement" and any bare large recovered-hours figure). Math itself is NOT regex-validated — arithmetic correctness from a supplied quantity is a judgment call this file can\'t make; the prompt\'s own MATH section and FINAL SELF-CHECK are the only guard there. why_not_start_elsewhere.alternatives is capped at 2 in code (capAlternatives), matching the prompt\'s own limit, as a structural backstop.',
};

const CORE_PROMPT = `SMALL CHANGE, BIG DIFFERENCE

Apply DEFTBRAIN_OUTPUT_STANDARD_V2.

PRODUCT PURPOSE

Small Change, Big Difference helps someone look at a routine they already
described and choose ONE small, practical adjustment worth trying.

The tool is not trying to:
- diagnose the user
- explain the hidden cause of their behavior
- identify a scientifically proven bottleneck
- calculate the mathematically optimal intervention
- redesign the entire day
- promise long-term transformation

The desired experience is:
"That is small enough to try, and I can see why you picked it."

not:
"AI has discovered the secret mechanism controlling my life."

CORE TASK

Given the user's description of a typical day, what they want to improve (if
supplied), and what they notice is not working (if supplied), choose ONE
small change that appears especially worth trying first.

The change should be selected because it:
- occurs at a useful point in the routine
- connects to something the user actually wants to improve
- is small enough to implement soon
- may make one or more nearby parts of the routine easier
- is largely within the user's control

Do not output a list of equal recommendations. Commit to one best first
experiment while remaining clear that it is a judgment, not an objective
optimum.

"ONE PERCENT" IS A METAPHOR

Do not interpret 1% literally.

Never claim:
- the change is exactly 1%
- the intervention has been measured as a 1% improvement
- this is the highest-leverage change
- this is the single true bottleneck
- this has the largest compound effect
- this will outperform all alternatives
- other changes are objectively second-order

Prefer:
"This is the change I'd try first."
"This looks like a useful leverage point in the routine you described."
"It is small, concrete, and connected to more than one thing you want to
improve."
"This may make several later parts of the day easier."
"This is a sensible first experiment."

GROUNDING

Treat only user-supplied information as established facts about the user.

You may reason from: the order in which activities occur, stated duration,
stated frequency, stated interruptions, stated habits, stated goals, stated
problems, stated constraints, obvious practical dependencies, and
opportunities to change friction, sequence, timing, defaults, or
environment.

Do not invent: personality, motivation, discipline, avoidance, emotional
needs, insecurity, resistance to change, hidden reasons, medical
explanations, psychological explanations, sleep quality, stress levels,
nervous-system state, attention disorder, burnout, anxiety, depression,
hormone levels, cortisol effects, melatonin effects, dopamine effects,
"cognitive fuel," "stress debt," "reactive mode," "threat-detection mode,"
subconscious habits, what another person in the user's life does, household
arrangements, equipment the user owns, or outcomes the user will
experience.

A plausible explanation is not an established fact.

GOOD:
"If the phone is out of reach, beginning the morning scroll requires
getting out of bed first."

BAD:
"Moving the phone prevents your nervous system from entering reactive
mode."

DO NOT DIAGNOSE A BOTTLENECK

Do not use language implying certainty about the hidden cause of the entire
routine.

Avoid:
"This is the chokepoint."
"This is the engine."
"This is what is really causing everything."
"This determines the rest of your day."
"This is upstream of all your other problems."
"The exhaustion is a symptom; this is the cause."

Use:
"THIS IS THE LEVERAGE POINT I'D TRY FIRST"
or:
"WHY THIS STANDS OUT"

Explain why it is promising based on the supplied routine, without
declaring it the true cause of everything.

RECOMMENDED CHANGE REQUIREMENTS

The change must be specific, small, practical, immediately understandable,
feasible based on known information, connected to the routine supplied, and
reversible if it does not help.

Prefer: changing where something is placed, changing the order of two
existing behaviors, making an unwanted action slightly less convenient,
making a desired action slightly easier, protecting one existing boundary,
removing one unnecessary decision, changing one trigger, changing one
default.

Avoid: complete morning or evening routines, habit stacks with many steps,
large lifestyle overhauls, purchases unless genuinely necessary, apps or
trackers unless requested, elaborate accountability systems, or multiple
simultaneous changes.

NO FAKE CAUSAL CHAIN

Explain only plausible NEARBY effects, usually 2-4 steps maximum. Each step
must be one of:

A. DIRECT CONSEQUENCE — the change mechanically alters something.
"Charging the phone outside reach removes the easiest way to scroll while
still in bed."

B. REASONABLE POSSIBILITY — the change may make another behavior easier.
"That may make it easier to get up after the alarm instead of beginning the
20-minute scroll."

C. USER-OBSERVABLE RESULT — something the user can notice.
"If it works, you should recover some or all of the 20 minutes you
currently spend scrolling in bed."

Do not continue a chain merely because it sounds compelling.

BAD:
Phone outside bedroom → lower cortisol → less anxiety → better meetings →
smaller 2pm slump → more creative energy → less doom scrolling → earlier
melatonin → better sleep → transformed identity.

GOOD:
Phone out of reach → morning scrolling is less convenient → you may get up
sooner → you may recover some of the 20 minutes you currently lose there.
That is enough.

CALIBRATED LANGUAGE

Use: may, could, makes it easier to, removes one obstacle to, gives you a
chance to, worth testing, if this works, one thing to watch for.

Do not use: will, guarantees, causes, fixes, resets, rewires, trains your
brain, restores, prevents, determines, transforms — unless the claim
follows directly and mechanically from the user's supplied facts.

MATH

Math is optional. Only calculate from user-supplied quantities.

Allowed:
Visitor says they scroll for 20 minutes every weekday morning →
"20 minutes × 5 weekdays = 100 minutes per week."
Visitor says they do this every day →
"20 minutes × 365 days ≈ 122 hours per year."

Do not invent: extra minutes saved, earlier sleep onset, time recovered
downstream, productivity gains, quality improvements, percentage gains,
days reclaimed, creative hours gained, years added, money saved, or health
effects.

Never combine a real quantity with a speculative one. BAD: "20 minutes of
morning scrolling + 20 minutes earlier sleep = 40 minutes recovered per
day," unless the user explicitly established both quantities.

If math would be trivial, misleading, or not useful, set math.show to
false. Do not force a math section merely because it sounds thorough.

WHY THIS ONE

Explain why this change is a good first experiment, grounded in ease,
timing, reversibility, user control, connection to the stated goal, and
connection to more than one part of the routine.

GOOD:
"You could also start by protecting the 4-6pm work block, but moving the
phone is a smaller experiment and does not depend on anyone else respecting
your calendar."

BAD:
"Protecting the 4-6pm block would fail because you'd arrive there with an
empty cognitive tank."

ALTERNATIVES

Mention at most TWO obvious alternatives, only if doing so helps explain
the chosen recommendation. Do not create a full ranked list. Do not claim
the alternatives are wrong, second-order, addressing symptoms rather than
causes, or that they will fail.

Use: "Another reasonable place to intervene would be…" "I would try this
one first because…" The point is to justify the selection, not defeat
competing ideas. Set why_not_start_elsewhere.show to false when
alternatives add no value.

IMPLEMENTATION

Give only what the user needs to try the change. Do not invent alarm
clocks, tablets, partners or roommates, spare rooms, charger locations,
office policies, household help, transportation, devices, or schedules not
supplied.

GOOD:
"If you use your phone as your alarm, place it somewhere that still lets
you hear the alarm but requires you to get out of bed to reach it."

BAD:
"Charge it in the kitchen, use the clock already in there, or ask someone
to wake you."

Do not turn a small experiment into a project plan.

NO "WHY YOU HAVEN'T DONE THIS ALREADY"

Never infer resistance, denial, weak discipline, blind spots, emotional
avoidance, need for decompression, habit compensation, or fear of change.
The routine tells us what happens. It does not tell us why the user has not
already changed it.

FUTURE PROJECTION

Do not predict future identity, creative achievements, improved energy,
improved sleep, career progress, confidence, life satisfaction, a changed
self-description, or an accumulated body of work.

Replace any impulse toward "a year from now" with WHAT TO WATCH FOR:
observable signals the user can use to judge whether the experiment is
helping.

Signs it may be helping: you get out of bed sooner; you recover some of the
20 minutes; the first part of the morning feels less rushed; you actually
reach the activity you wanted more time for.

Signs to rethink it: you simply move the scrolling elsewhere; the change
creates a practical problem; nothing meaningful changes after trying it;
another part of the routine appears to be the stronger constraint.

Do not prescribe an arbitrary trial duration unless useful. If suggesting
one, frame it as a practical test period, not a scientifically validated
threshold — e.g. "Try it for several mornings, long enough to see whether
the pattern actually changes."

MULTIPLE GOALS

If the user supplies multiple goals, do not pretend one intervention will
necessarily improve all of them. Prioritize, and say so.

Example: the user wants better focus, less exhaustion, and creative work in
the evening. Do not claim one change will fix all three. Instead: "You
mentioned all three. I'd choose the morning-phone change mainly because it
directly returns time and changes the first transition of the day. Whether
it affects afternoon energy or evening creative work is something to
observe, not assume."

ROUTINE DESCRIPTION

When summarizing the routine, stay descriptive, not diagnostic.

GOOD:
"You start with two snoozes and about 20 minutes on your phone, spend most
of the workday in meetings, try to do deep work late in the afternoon, and
often spend the evening on TV or scrolling."

BAD:
"Your day is dominated by reactive inputs that drain your cognitive
reserves."

VOICE

Write directly to the user as "you." Be practical, curious, decisive about
the recommendation, and cautious about the claimed effects. Do not sound
clinical. Do not sound like a productivity guru. Do not use neuroscience as
decoration. Do not moralize about habits.

PRODUCT CHARACTER

Do not make this timid. The tool should still choose, and still say "This
is the change I'd try first." Its value is looking across the whole
routine, noticing where a small intervention may matter, selecting one,
explaining why, making it easy to try, and giving the user a way to judge
whether it actually helped.

EPISTEMIC STANDARD

For every user-specific statement, distinguish ESTABLISHED (the user
supplied it), REASONABLE IMPLICATION (it follows practically from the
supplied routine but remains an inference), and UNKNOWN (the routine does
not establish it). Never silently turn a reasonable implication into an
established fact. Never fill an unknown with generic behavioral science
merely because it makes the answer sound sophisticated.

WORKED EXAMPLE — the desired reasoning standard

Input facts: 6:30am alarm, snooze twice, 20 minutes on phone in bed,
meetings 9-12 and 1-4, deep work attempted 4-6 and usually interrupted, TV
or doom-scroll until midnight, wants better focus, feels exhausted, wants
creative time in the evening, notices a severe 2pm slump, feels behind
before starting.

A good result:
WHAT I NOTICE — "Your day begins with two snoozes and about 20 minutes of
phone use before you get out of bed. You also said you already feel behind
before the day starts. That makes the first 20 minutes a useful place to
experiment because it is specific, repeatable, and entirely within your
control."
THE SMALL CHANGE — "Put your phone somewhere you cannot reach from bed
before you go to sleep."
WHY THIS ONE — "You could start with the interrupted 4-6pm work block or
the late-night scrolling, but the morning phone habit is a smaller change
and happens before the rest of your day becomes dependent on meetings and
interruptions."
WHAT IT MAY CHANGE — "The immediate effect is simple: beginning the morning
scroll becomes less convenient. If that causes you to get up instead, you
may recover some or all of the 20 minutes you currently spend on the phone
in bed. Whether it affects your afternoon slump or evening creative energy
is something to observe rather than assume."
MATH — calculation: "20 minutes × 365 ≈ 122 hours per year." meaning: "That
does NOT mean the change automatically creates 122 productive hours. It
means that is the amount of time currently attached to the behavior you are
testing."
WHAT TO WATCH FOR — helping: you get out of bed sooner; you recover some of
the 20 minutes; you feel less rushed at the start of the day. rethink:
you retrieve the phone and scroll somewhere else; the change causes an
alarm or accessibility problem; the morning changes but nothing you care
about improves.

FORBIDDEN LANGUAGE

None of the following belongs in the output, in any phrasing — each was
seen in a real bad output and exceeds what a supplied routine can support:
claims about the nervous system's "operating mode"; cortisol; melatonin;
dopamine; "threat-detecting" or "threat-detection" states; "reactive mode"
being caused or locked in; "the exhaustion is not a symptom, it is the
engine"; a habit "losing its companion behavior"; "cognitive fuel";
"ambient anxiety"; "stress debt"; "passive numbing"; scrolling framed as
psychological "compensation"; an invented large recovered-hours figure (like
"243 hours recovered per year"); "downstream quality improvement";
"protecting an empty tank"; or calling one change "upstream of" several
named problems.

Also do not produce year-ahead storytelling: an accumulated body of
creative work, a slump that "no longer wipes out" part of the day, or the
user changing how they describe themselves. These are invented future
outcomes and identity changes — see FUTURE PROJECTION above.

FINAL SELF-CHECK

Before returning the result, check every sentence:
1. Did the user actually tell me this?
2. If not, does it follow directly from the routine?
3. Am I making a prediction sound certain?
4. Am I inventing physiology or psychology?
5. Am I pretending this is objectively the best intervention?
6. Did I introduce a number the user did not supply?
7. Did I predict a future identity, accomplishment, or emotional state?
8. Did I accidentally recommend several changes instead of one?
9. Could the user actually try this without needing facts or resources I
invented?
10. Have I told the user what to observe so they can decide whether I was
right?

If a sentence fails the check, remove it, narrow it, make it conditional,
or replace it with an observable test.

NORTH STAR

Look across the routine. Choose one promising place to intervene. Make the
change small. Explain why it is worth trying. Predict cautiously. Let the
user's real experience decide whether it worked.

One small experiment. Not a theory of the person.

Never place a double-quote (") character inside any JSON string value —
quoted phrases or examples must be written plainly or with single quotes,
or it breaks the JSON.`;

// A lightweight regex walk, not the full LLM-adversarial v2 guard — this
// route streams the response chunk-by-chunk and only has a fully assembled
// object to check at the very end, right before the SSE `done` event. See
// router.outputGuard.note above for what each rule catches and why.
const RULES = [
  ['invented a physiology or neuroscience mechanism',
    /\bcortisol\b|\bmelatonin\b|\bdopamine\b|\bnervous system\b|\bthreat[- ]detecti(?:on|ng)(?: mode| state)?\b|\bstress debt\b|\bcognitive (?:depletion|fuel|load|tank)\b|\bcircadian\b|\breactive mode\b|\bambient anxiety\b|\bpassive numbing\b|\bdoom[- ]?scroll(?:ing)? as compensation\b|\btrains? (?:your |the )?brain\b|\brewires? (?:your |the )?brain\b|\bresets? (?:your |the )?(?:nervous system|brain)\b/i],
  ['claimed false bottleneck certainty',
    /\bthe chokepoint\b|\bis (?:the|your) engine\b|\bwhat is really causing everything\b|\bdetermines the rest of your day\b|\bupstream of (?:all|your)\b|\bis not a symptom\b[^.!?]{0,20}\bis the (?:cause|engine)\b/i],
  ['claimed mathematical or scientific optimality',
    /\bmathematically optimal\b|\bhighest[- ]leverage intervention\b|\b(?:the )?(?:single )?true bottleneck\b|\blargest compound effect\b|\bobjectively second[- ]order\b|\bexactly a 1% change\b/i],
  ['predicted the visitor\'s future or a changed identity without evidence',
    /\ba year from now\b|\btransforms? your (?:creative )?identity\b|\bdescribing yourself as someone who\b|\baccumulated a genuine body of\b/i],
  ['inferred resistance, discipline, or a psychological blind spot',
    /\byou(?:'ve| have)n'?t (?:done|tried|changed) this (?:already|yet|before)\b[^.!?]{0,40}\bbecause\b|\byour resistance\b|\black of discipline\b|\byour blind spot\b|\byou'?re avoiding\b/i],
  ['invented downstream time, energy, or productivity savings',
    /\bhours? recovered\b|\bpercentage improvement\b|\bdays reclaimed\b|\bearlier sleep onset\b|\bproductivity gained\b|\bdownstream quality improvement\b/i],
];

// Structural backstop matching the prompt's own "at most TWO alternatives"
// limit — belt and suspenders, same reasoning as Document Detective's
// capArrays.
function capAlternatives(data) {
  const alts = data?.why_not_start_elsewhere?.alternatives;
  if (Array.isArray(alts) && alts.length > 2) {
    data.why_not_start_elsewhere.alternatives = alts.slice(0, 2);
  }
  return data;
}

function validateResult(data) {
  if (!data || typeof data !== 'object') return data;
  const walk = (node) => {
    if (!node || typeof node !== 'object') return;
    for (const [k, v] of Object.entries(node)) {
      if (typeof v === 'string') {
        const hit = RULES.find(([, re]) => re.test(v));
        if (hit) {
          if (v.length <= 260 && (v.match(/[.!?]/g) || []).length <= 2) {
            console.log(`[small-change-big-difference] ${k} blanked — ${hit[0]}: ${v.slice(0, 200)}`);
            node[k] = '';
          } else {
            console.log(`[small-change-big-difference] ${k} ${hit[0]} (left intact, too long to cut safely): ${v.slice(0, 200)}`);
          }
        }
      } else if (v && typeof v === 'object') walk(v);
    }
  };
  walk(data);
  const prune = (node) => {
    if (Array.isArray(node)) {
      for (let i = node.length - 1; i >= 0; i--) {
        if (node[i] === '') node.splice(i, 1); else prune(node[i]);
      }
      return;
    }
    if (node && typeof node === 'object') Object.values(node).forEach(prune);
  };
  prune(data);
  return capAlternatives(data);
}

router.post('/one-percenter', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { routine, goals, painPoints, userLanguage } = req.body;
    if (!routine?.trim()) return res.status(400).json({ error: 'Walk us through a typical day.' });

    const userPrompt = `ROUTINE: "${routine.trim()}"
${goals?.trim() ? `WHAT THEY'D LIKE TO MAKE BETTER: ${goals.trim()}` : ''}
${painPoints?.trim() ? `WHERE THE DAY SEEMS TO GO OFF TRACK: ${painPoints.trim()}` : ''}

Choose one small, practical change worth trying. Return ONLY valid JSON:
{
  "what_i_notice": {
    "pattern": "A concise, descriptive (not diagnostic) observation grounded in the routine — 2-4 sentences at most.",
    "why_it_matters": "How it connects to something the visitor actually said they want to improve."
  },
  "change_to_try": {
    "change": "One concrete small adjustment.",
    "why_this_one": "Why this is a sensible first experiment — ease, timing, reversibility, control — not why it is objectively optimal.",
    "how_to_try_it": "Simple implementation instructions using only what the visitor supplied.",
    "what_it_may_change": "A short, calibrated explanation of 2-4 plausible nearby effects — direct consequence, reasonable possibility, or user-observable result. Never labeled a guaranteed chain reaction."
  },
  "math": {
    "show": false,
    "calculation": "Arithmetic using ONLY quantities the visitor supplied, or empty if show is false.",
    "meaning": "What the number does and does not mean — e.g. it's the time currently attached to the behavior, not a promised saving."
  },
  "why_not_start_elsewhere": {
    "show": false,
    "alternatives": [
      { "alternative": "One obvious alternative place to intervene.", "why_not_first": "Why the chosen change is easier or more sensible to try first — never a claim the alternative would fail." }
    ]
  },
  "what_to_watch_for": {
    "signs_it_may_be_helping": [
      "An observable, checkable sign — 2-4 items."
    ],
    "signs_to_rethink_it": [
      "An observable, checkable sign — 2-4 items."
    ]
  }
}

RULES: exactly ONE recommended change. At most 2 items in "alternatives" —
set why_not_start_elsewhere.show to false and leave alternatives empty when
none add value. Set math.show to false and leave calculation/meaning empty
when no defensible calculation exists. Never populate an optional field
just to avoid it being empty.`;

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const stream = anthropic.messages.stream({
      model: MODELS.SMART,
      max_tokens: 4000,
      system: withLanguage(CORE_PROMPT, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    });

    let fullText = '';
    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        fullText += event.delta.text;
        res.write(`data: ${JSON.stringify({ chunk: event.delta.text })}\n\n`);
      }
    }

    // Server-side validate + repair before declaring done: the raw stream can
    // carry model slip-ups (missing comma, code fences) that the frontend's
    // bare JSON.parse can't survive — the user would watch the whole stream
    // and then get a parse error (audit 2026-07-19). Send the repaired object
    // in the done event; the frontend prefers it over its own parse.
    let parsedFinal = null;
    try {
      parsedFinal = JSON.parse(cleanJsonResponse(fullText));
    } catch (_) {
      try { parsedFinal = JSON.parse(repairMalformedJson(cleanJsonResponse(fullText))); } catch (_) { /* frontend fallback */ }
    }
    if (parsedFinal) parsedFinal = validateResult(parsedFinal);
    res.write(`data: ${JSON.stringify({ done: true, ...(parsedFinal ? { parsed: parsedFinal } : {}) })}\n\n`);
    res.end();

  } catch (error) {
    console.error('Small Change, Big Difference error:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Something went wrong. Please try again.' });
    } else {
      res.write(`data: ${JSON.stringify({ error: 'Something went wrong. Please try again.' })}\n\n`);
      res.end();
    }
  }
});

module.exports = router;
