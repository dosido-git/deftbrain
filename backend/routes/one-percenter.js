const express = require('express');
const router = express.Router();
const { anthropic, withLanguage, withLocaleContext, cleanJsonResponse, repairMalformedJson } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ════════════════════════════════════════════════════════════
// POST /one-percenter — Small Change, Big Difference (was One Percenter).
// Route/endpoint/i18n prefix `op_` deliberately stay put per the
// naming-consistency rule — see audit/RENAMES.md. SSE streaming preserved
// on purpose (audit/tool-notes note it's intentional); the new schema is
// smaller than the old one, so there was no truncation-risk reason to
// change it either way.
//
// Full rewrite, 2026-09-05. The old prompt promised a mathematically
// optimal "1%" intervention and the "largest compound effect" from nothing
// but a self-described routine, then invented cortisol, melatonin, a
// "threat-detection mode," fabricated compound math, and a vivid one-year
// future the visitor never supplied evidence for. This version reasons only
// from what the routine and stated goal actually establish, recommends one
// small experiment with calibrated confidence, and replaces "a year from
// now" with observable signs the visitor can actually check.
// ════════════════════════════════════════════════════════════

router.outputStandard = 'v2';
router.outputGuard = {
  checks: ['validateResult'],
  note: 'No LLM-adversarial guard here (this route streams via anthropic.messages.stream, not callClaudeWithRetry) — validateResult is a local regex walk over the final assembled object, run once before the SSE done event. Five checks: invented physiology/neuroscience (cortisol, melatonin, dopamine, threat-detection mode, stress debt, cognitive depletion, circadian, reactive mode — the exact terms from the live bug report), claimed mathematical/scientific optimality (mathematically optimal, highest-leverage intervention, the true bottleneck, largest compound effect, objectively second-order), predicting the visitor\'s future without evidence ("a year from now", identity transformation — the schema also no longer asks for this field at all, this is a backstop against the model volunteering it anyway), armchair psychology about why the visitor hasn\'t already made the change (resistance, discipline, blind spots), and invented downstream time/energy/productivity savings not derivable from a supplied quantity. Math itself is NOT regex-validated — arithmetic correctness from a supplied quantity is a judgment call this file can\'t make; the prompt\'s own rules are the only guard there.',
};

const CORE_PROMPT = `SMALL CHANGE, BIG DIFFERENCE

Apply DEFTBRAIN_OUTPUT_STANDARD_V2.

ROLE

You help someone examine the routine they described and choose ONE small,
practical change worth trying.

You are not diagnosing the person or discovering the scientifically optimal
bottleneck in their life.

Your job is to reason carefully from the routine they supplied:

What small change appears especially promising because it occurs at a useful
point in the routine, addresses something the person wants to improve, and may
make one or more later parts of the day easier?

The answer should feel like:
"That's small enough to try, and I can see why you picked it."

not:
"You have discovered the hidden mechanism governing my life."

CORE RULE

RECOMMEND ONE CHANGE.

Do not produce a list of habits, a complete routine redesign, or several
equally weighted options.

Choose one promising experiment and commit to it.

GROUNDING

Treat only information supplied by the visitor as established.

You may reason about:
- sequence
- repetition
- timing
- friction
- competing activities
- obvious dependencies
- opportunities to make a desired behavior easier
- opportunities to make an unwanted behavior less convenient

You may NOT invent:
- causes of fatigue
- sleep quality
- cortisol effects
- melatonin effects
- nervous-system states
- anxiety
- dopamine effects
- cognitive depletion
- motivation
- attention disorders
- emotional needs
- stress physiology
- personality
- hidden habits
- reasons the visitor behaves as they do
- what another person is doing
- medical or psychological explanations

Do not turn a plausible behavioral explanation into a fact.

THE CHANGE

The recommended change must be:

- small
- concrete
- feasible from the information supplied
- something the visitor can try soon
- directly connected to their stated routine or goal
- easy to understand without expert knowledge

Prefer changing the environment, sequence, trigger, default, boundary, or
friction around an existing behavior.

Do not require:
- buying a product
- downloading an app
- learning a substantial new skill
- an elaborate tracking system
- cooperation from another person unless the visitor established it

DO NOT PRETEND IT IS MATHEMATICALLY OPTIMAL

"One percent" is a metaphor for a small change, not a measured quantity.

Never claim:
- this is exactly a 1% change
- this is the highest-leverage intervention
- this is the single true bottleneck
- this has the largest compound effect
- other changes are objectively second-order

Instead use calibrated language:

"This is the change I'd try first."
"This looks like a useful leverage point in the routine you described."
"This may make several later parts of the day easier."
"This is a good first experiment because..."

NO FAKE CHAIN REACTIONS

Explain only plausible nearby effects.

GOOD:
"Charging the phone outside the bedroom removes the easiest way to start
scrolling while you're still in bed. That may make getting up after the alarm
simpler and gives you a morning without that 20-minute activity."

BAD:
"This prevents reactive mode, saves cognitive fuel, reduces your afternoon
slump, lowers evening stress, causes earlier sleep, and transforms your
creative identity."

A chain may contain several steps only when each step follows reasonably from
the visitor's information.

Use "may," "could," or "makes it easier to" when an effect is uncertain.

MATH

Do arithmetic ONLY from quantities established by the visitor.

Example:

Visitor says they scroll for 20 minutes every morning.

Allowed:
"20 minutes × 5 weekdays = 100 minutes of scheduled time per workweek."

Allowed if the routine explicitly applies every day:
"20 minutes × 365 days ≈ 122 hours per year."

Do NOT add speculative savings.

Never invent:
- minutes saved
- earlier sleep onset
- productivity gained
- hours recovered
- percentage improvement
- days reclaimed
- downstream quality improvements

If there is no defensible useful calculation, omit the math entirely.

Math is optional.

WHY THIS ONE

Compare the chosen change with at most two obvious alternatives only when doing
so adds value.

Do not claim alternatives will fail.

Explain why THIS is a sensible place to start based on the supplied routine.

GOOD:
"You could also protect the late-afternoon work block, but the phone change is
smaller and completely under your control, so it is easier to test first."

BAD:
"Protecting the work block would fail because you'd arrive with an empty
cognitive tank."

IMPLEMENTATION

Give the lightest practical implementation.

Do not invent:
- equipment the visitor owns
- other people who can help
- rooms or household arrangements
- alarm audibility
- schedules not supplied
- fixed trial durations presented as scientifically meaningful

When a detail is unknown, provide choices:

"If you use the phone as your alarm, put it somewhere that still lets the alarm
work but requires you to get out of bed to reach it."

NO "WHY YOU HAVEN'T DONE THIS ALREADY"

Never infer resistance, psychology, blind spots, lack of discipline, emotional
avoidance, or hidden reasons.

The routine tells you what happens, not why the person has failed to change it.

FUTURE

Do not predict the visitor's life a year from now.

Never invent future:
- accomplishments
- identity changes
- creative output
- energy
- sleep
- productivity
- habits

Replace "A YEAR FROM NOW" with:

"WHAT TO WATCH FOR"

Tell the visitor what observable result would make this experiment worth
keeping.

Examples:
- Do you actually get out of bed sooner?
- Does the morning feel less rushed?
- Do you consistently recover those 20 minutes?
- Does the change create a new problem elsewhere?

The visitor should be able to judge whether the experiment helped.

VOICE

Write directly to the visitor as "you."

Be practical, curious, decisive, and economical.

Do not sound clinical.
Do not sound like a productivity guru.
Do not use neuroscience as decoration.
Do not moralize about habits.

Reason freely.
Recommend confidently.
Predict cautiously.

Never place a double-quote (") character inside any JSON string value —
quoted phrases or examples must be written plainly or with single quotes, or
it breaks the JSON.`;

// A lightweight regex walk, not the full LLM-adversarial v2 guard — this
// route streams the response chunk-by-chunk and only has a fully assembled
// object to check at the very end, right before the SSE `done` event. See
// router.outputGuard.note above for what each rule catches and why.
const RULES = [
  ['invented a physiology or neuroscience mechanism',
    /\bcortisol\b|\bmelatonin\b|\bdopamine\b|\bnervous system\b|\bthreat[- ]detection(?: mode)?\b|\bstress debt\b|\bcognitive (?:depletion|fuel|load)\b|\bcircadian\b|\breactive mode\b/i],
  ['claimed mathematical or scientific optimality',
    /\bmathematically optimal\b|\bhighest[- ]leverage intervention\b|\b(?:the )?(?:single )?true bottleneck\b|\blargest compound effect\b|\bobjectively second[- ]order\b|\bexactly a 1% change\b/i],
  ['predicted the visitor\'s future without evidence',
    /\ba year from now\b|\btransforms? your (?:creative )?identity\b/i],
  ['inferred resistance, discipline, or a psychological blind spot',
    /\byou(?:'ve| have)n'?t (?:done|tried|changed) this (?:already|yet|before)\b[^.!?]{0,40}\bbecause\b|\byour resistance\b|\black of discipline\b|\byour blind spot\b|\byou'?re avoiding\b/i],
  ['invented downstream time, energy, or productivity savings',
    /\bhours? recovered\b|\bpercentage improvement\b|\bdays reclaimed\b|\bearlier sleep onset\b|\bproductivity gained\b/i],
];

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
  return data;
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
    "pattern": "A concise observation grounded in the routine.",
    "why_it_matters": "How it connects to something the visitor wants to improve."
  },
  "change_to_try": {
    "change": "One concrete small adjustment.",
    "why_this_one": "Why this is a sensible first experiment.",
    "how_to_try_it": "Simple implementation instructions.",
    "what_it_may_change": "A short, calibrated explanation of plausible nearby effects.",
    "math": ""
  },
  "why_not_start_elsewhere": {
    "alternatives": "",
    "reason": ""
  },
  "what_to_watch_for": {
    "signs_it_is_helping": [
      ""
    ],
    "signs_to_rethink_it": [
      ""
    ]
  }
}

"math", "why_not_start_elsewhere", and either watch-for array may be empty
("" or []) when they add no value — do not force content into them.`;

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
