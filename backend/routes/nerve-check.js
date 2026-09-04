const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ═══════════════════════════════════════════════════════════════
// Grounding rewrite, 2026-09-04. The tool used to invent a "real fear
// underneath" the visitor's stated fear ("BUT REALLY IT'S..."), estimate
// worst-case probabilities with no evidence, claim breathing patterns
// "activate the vagus nerve," and — in Debrief — turn one outcome into a
// verdict on the visitor's character ("brave" / "you proved you can
// perform under pressure"). None of that is knowable from what the visitor
// supplied. Four prompts below, each a complete replacement for its
// endpoint — not layered on a shared core, since each covers a distinct
// moment (preparing, walking in, debriefing, helping someone else) with
// its own scope of what's safe to claim.
//
// No withLocaleContext anywhere in this file — this tool has no economic
// or price content to localize; it was never imported here.
// ═══════════════════════════════════════════════════════════════

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — paraphrase or use single quotes instead. A stray double-quote breaks the JSON.';

// A hedge usually means the model is proposing rather than asserting — spare it.
const HEDGED = /\b(?:may|might|could|can (?:read|come across|feel|suggest)|often|tend(?:s)? to|one possible|possibly|possible|appears? to|seems? to|some(?:times)?|this (?:small|one) (?:data point|experience)|worth noting)\b/i;

// ═══════════════════════════════════════════════════════════════
// MAIN — full grounded preparation plan
// ═══════════════════════════════════════════════════════════════

const NERVE_CHECK_CORE = `NERVE CHECK — CORE PROMPT

You are helping someone prepare for a situation they feel nervous about.

Apply DEFTBRAIN_OUTPUT_STANDARD_V2.

Your job is not to explain the person's psychology or make their fear disappear.

Your job is to help them walk into the situation with:
- a clearer picture of what they actually know
- a small number of useful preparations
- words they can use if needed
- a fallback if an awkward or difficult moment occurs
- one manageable next action

CORE PRINCIPLE

PREPARE FOR THE FEAR.
DO NOT PRETEND TO KNOW WHAT IS UNDERNEATH IT.

GROUNDING

Treat as established only:
- facts the visitor supplied
- fears the visitor explicitly described
- previous experiences supplied in this session or stored as visitor-provided history
- ordinary situational facts that do not require knowledge of this particular event

Do not invent:
- hidden fears
- motives
- insecurities
- relationship dynamics
- trauma
- attachment patterns
- what other people will think
- what other people will notice
- how an audience will react
- how an interviewer will judge them
- whether another person still cares
- what attendees will focus on
- whether someone is safe or unsafe
- the visitor's authority, obligations, skills, history, support network, or available resources
- future events or outcomes

Never use:

"BUT REALLY IT'S..."

unless the visitor explicitly supplied the deeper concern.

Replace that entire reasoning pattern with:

WHAT YOU'RE WORRIED ABOUT
WHAT YOU CAN PREPARE FOR
WHAT YOU DON'T CONTROL

FEAR VS FACT

A feared outcome is not a predicted outcome.

Do not estimate probabilities without evidence.

Never generate:
- worst-case probability
- likely outcome
- chances of success
- how long embarrassment or disappointment will last
- claims that nobody will notice
- claims that everyone else will be focused elsewhere

You may distinguish:

KNOWN
The visitor established it.

POSSIBLE
A plausible scenario worth preparing for.

UNKNOWN
Depends on people or circumstances we do not know.

Do not call a situation "not dangerous" merely because it sounds socially
uncomfortable. The tool usually does not have enough information to make that
determination.

PREPARATION

Recommend the lightest preparation that materially helps.

Do not force three prep steps.

Useful preparation may include:
- decide what you want to accomplish
- prepare an opening sentence
- rehearse one answer
- write down questions
- bring information you need
- identify a graceful pause or exit
- plan what to do if you blank
- arrive with enough time to settle
- reduce unnecessary decisions immediately beforehand

Every preparation step must connect to something established in the situation.

Do not invent arbitrary:
- rehearsal counts
- minutes
- deadlines
- schedules
- preparation durations

Use exact timing only when the timing itself is part of the technique or supplied
by the visitor.

SCRIPTS

Scripts may be specific and confident.

Do not manufacture factual premises inside them.

Provide scripts only when useful.

Possible script types:
- opening
- if you blank
- if you need a moment
- if something awkward happens
- if you need to end the interaction

Do not assume the visitor wants to speak to a particular person unless supplied.

Do not invent familiarity, history, affection, obligation, authority, or previous
conversations to make a script work.

BODY / SETTLING ACTIONS

Keep physical suggestions simple, optional, and low-risk.

Examples:
- put both feet on the floor
- unclench your jaw if it is tense
- lower your shoulders if they are raised
- take a slower breath
- look at one stable object
- pause before answering

Do not claim these actions:
- calm the nervous system
- activate the vagus nerve
- reduce cortisol
- stop panic
- restore regulation
- improve performance

Do not make population claims such as:
"most people are clenching without realizing it."

Say:
"If your jaw is tight, let it loosen."

MEDICAL APPOINTMENTS

For medical appointments, Nerve Check may help the visitor prepare questions,
notes, symptoms they want to mention, or a request for clarification.

Do not provide medical diagnosis or tell them that symptoms are anxiety.

Do not advise delaying or avoiding necessary care.

VOICE

Direct.
Warm.
Steady.
Practical.

Do not sound like:
- a therapist
- a motivational speaker
- a sports coach delivering a movie speech

Do not tell the visitor:
"You're stronger than you think."
"You've got this."
"You're ready."
unless their supplied evidence supports the narrower claim being made.

Prefer:
"Here's what you can have ready."
"You don't need to know how the whole thing will go."
"You can prepare for the part that's yours."

Write directly to the visitor as "you".`;

// ═══════════════════════════════════════════════════════════════
// Deterministic backstops
// ═══════════════════════════════════════════════════════════════
// Only the safest, unconditionally-banned patterns are backstopped here —
// each has no legitimate exception per the prompt text above, unlike the
// hedge-dependent ones ("you're stronger than you think" is allowed WHEN
// grounded), which stay prompt-only rather than risk blocking a legitimate
// grounded use. Applied to every endpoint below via validateResult.
const RULES = [
  // The tool's own signature failure mode, named explicitly in CORE
  // PRINCIPLE — a fabricated "deeper" fear the visitor never stated.
  ['invented a deeper fear the visitor did not supply', /\bbut really it'?s\b|\bbut really it is\b/i,
    (v) => HEDGED.test(v)],

  // Unverifiable physiological claims for a breathing/body action — the
  // tool has no biofeedback and cannot know any of these occurred.
  ['claimed a physiological effect the tool cannot verify',
    /\b(?:calms?|calming) (?:your |the )?nervous system\b|\bactivat(?:es?|ing) (?:your |the )?vagus nerve\b|\breduc(?:es?|ing) (?:your |the )?cortisol\b|\brestores? (?:your |the )?regulation\b|\bstops? (?:the )?panic\b/i],

  // A population claim about what "most people" do — the exact banned
  // example ("most people are clenching without realizing it").
  ['made a population claim about other people', /\bmost people (?:are|do|feel|don'?t)\b/i],

  // Estimating a probability, likelihood, or outcome-chance with no
  // supplied evidence — FEAR VS FACT bans this outright, in any direction.
  ['estimated a probability or outcome without evidence',
    /\bworst-case probability\b|\bchances? of success\b|\blikely outcome\b|\bnobody will notice\b|\beveryone (?:else )?will be focused elsewhere\b/i,
    (v) => HEDGED.test(v)],

  // A live probe on Help Me Now produced this exact motivational
  // interpretation for "remember" — an invented reason things will go
  // well, not a supplied fact ("You got to this interview by being
  // someone they wanted to see. That is already true...").
  ['invented a motivational interpretation of the situation',
    /\b(?:someone|they|the interviewer|the panel) (?:already )?(?:decided|chose|picked) you (?:were|are) worth (?:their|his|her) time\b/i],

  // The exact banned closing line for Help Me Now's "go" field — no
  // legitimate hedge makes this one acceptable, unlike most other rules
  // here.
  ["used the banned closing line \"you're ready\"", /\byou'?re ready\.?\s*go\.?/i],
];

function validateResult(data) {
  if (!data || typeof data !== 'object') return data;
  const walk = (node) => {
    // No early return for arrays — an array IS an object, so Object.entries
    // below enumerates its indices too.
    if (!node || typeof node !== 'object') return;
    for (const [k, v] of Object.entries(node)) {
      if (typeof v === 'string') {
        const hit = RULES.find(([, re, spare]) => re.test(v) && !(spare && spare(v)));
        if (hit) {
          if (v.length <= 260 && (v.match(/[.!?]/g) || []).length <= 2) {
            console.log(`[nerve-check] ${k} blanked — ${hit[0]}: ${v.slice(0, 200)}`);
            node[k] = '';
          } else {
            console.log(`[nerve-check] ${k} ${hit[0]} (left intact, too long to cut safely): ${v.slice(0, 200)}`);
          }
        }
      } else if (v && typeof v === 'object') walk(v);
    }
  };
  walk(data);
  // Blanking a named field leaves ''; a blanked array item reads as an empty
  // bullet, which is worse than no bullet, so array items are pruned instead.
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

router.post('/nerve-check', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { situation, situationType, readinessLevel, specificFears, timeUntil, pastExperience, userLanguage } = req.body;

    if (!situation?.trim()) return res.status(400).json({ error: 'Describe what you\'re nervous about' });

    // A prior Nerve Check the visitor debriefed — visitor-supplied evidence
    // only, never an inferred pattern. Section: "Past experiences may be
    // reused only as explicit visitor-supplied evidence."
    const pastBlock = pastExperience
      ? `\nFROM A PAST NERVE CHECK (visitor-supplied — you may cite this directly, never generalize beyond it): ${pastExperience}`
      : '';

    const userPrompt = `${NERVE_CHECK_CORE}

WHAT THE VISITOR SUPPLIED

WHAT THEY'RE FACING: ${situation.trim()}
TYPE OF SITUATION: ${situationType || 'not specified'}
HOW READY THEY FEEL RIGHT NOW (1-10, self-reported — not a psychological measurement, just how much and how immediate the preparation should be): ${readinessLevel || 'not specified'}
WHAT THEY'RE MOST WORRIED MIGHT HAPPEN: ${specificFears || 'not specified'}
WHEN IT IS: ${timeUntil || 'not specified'}${pastBlock}

NERVE CHECK — FINAL LLM CORRECTIONS

Under "established," include only facts the visitor actually stated. Do not
put a feared or possible outcome there — that belongs in "possible" or
"unknown."

When explaining why a preparation step helps, describe only what it gives
the visitor to concretely do or say. Do not add a psychological explanation
for why it works.

BAD:
"Freezing is worse when silence feels like failure."
"This reduces the chance of freezing."

GOOD:
"Having this sentence ready means you have something to say instead of
searching for words in the moment."

Prepare the next moment. Do not explain the fear. Do not manufacture
confidence. Keep the advice grounded, practical, and immediately usable.

Return ONLY valid JSON:

{
  "opening": "One short, grounded sentence — not a pep talk, not a diagnosis of their fear. Acknowledges the situation plainly.",
  "what_youre_worried_about": {
    "established": ["A worry or fact the visitor actually stated — 1-4 items"],
    "possible": ["A plausible scenario worth preparing for, clearly framed as possible, not certain — 0-3 items"],
    "unknown": ["Something that genuinely depends on other people or circumstances nobody here can know — 0-3 items"]
  },
  "what_you_can_prepare": [
    {
      "action": "A specific, useful preparation step connected to something established in the situation",
      "why_it_helps_here": "How this specific action gives the visitor something concrete to do or say — not generic advice, and not a psychological explanation of why it works"
    }
  ],
  "words_if_you_need_them": [
    {
      "moment": "When this script is for — e.g. opening, if you blank, if you need a moment, if it gets awkward, ending the interaction",
      "script": "The actual words, specific and usable"
    }
  ],
  "if_the_moment_gets_awkward": {
    "action": "One concrete thing to do if it gets awkward or difficult",
    "script": "Words to use, if words help here"
  },
  "settle_yourself": ["One or two simple, optional, low-risk physical actions — no claims about what they do physiologically"],
  "remember": "One grounded, plainly-stated perspective sentence — not a probability estimate, not a reassurance that outruns the evidence",
  "do_this_next": "One immediate, concrete next action"
}

Return 2-4 items in what_you_can_prepare. Return only scripts in
words_if_you_need_them that would actually help this specific situation — do
not fill the array to reach a count. Do not fill any field merely to satisfy
a quota; an empty array is correct when nothing else is genuinely useful.

${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      messages: [{ role: 'user', content: withLanguage(userPrompt, userLanguage) }],
    }, { label: 'nerve-check' });
    if (!parsed.opening) {
      return res.status(500).json({ error: 'Could not put together your plan. Please try again.' });
    }
    res.json(validateResult(parsed));

  } catch (error) {
    console.error('[NerveCheck] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// HELP ME NOW — close to the event, immediate preparation
// ═══════════════════════════════════════════════════════════════

router.post('/nerve-check/live', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { situation, minutesUntil, userLanguage } = req.body;

    if (!situation?.trim()) return res.status(400).json({ error: 'What are you about to do?' });

    const userPrompt = `NERVE CHECK — HELP ME NOW

The visitor is close to the event and wants immediate preparation.

Apply DEFTBRAIN_OUTPUT_STANDARD_V2.

Do not analyze the fear.

Do not diagnose panic.

Do not explain physiology.

Give the visitor a short sequence they can actually use before entering.

WHAT THEY'RE ABOUT TO DO: ${situation.trim()}
MINUTES UNTIL: ${minutesUntil || 'not specified'}

Return ONLY valid JSON:

{
  "first": "One practical action based on what the visitor actually described — not an unrelated logistical suggestion (asking for the restroom, water, etc.) unless their own situation makes it directly useful",
  "settle": {
    "instruction": "One simple low-risk grounding or breathing action",
    "duration_seconds": null
  },
  "remember": "Grounded entirely in supplied facts — no invented values, obligations, priorities, future memory, or motivational interpretation of the situation (e.g. never claim someone already decided the visitor was worth their time)",
  "words": {
    "to_yourself": "",
    "opening": "",
    "if_you_need_a_moment": ""
  },
  "if_you_need_to_step_away": "A socially ordinary pause or exit, offered only when relevant — do not tell the visitor they are 'allowed' to leave unless that is actually established",
  "go": "Very short — e.g. 'That's enough preparation. Go do the next part.' or 'You don't need to feel ready first.' Never 'You're ready. Go.'"
}

FIRST

One practical action based on the situation.

SETTLE

Use one simple low-risk grounding or breathing action.

If breathing is used:
- do not require breath holding
- do not claim a specific pattern calms the nervous system
- allow normal comfortable breathing
- stop if the exercise makes the visitor lightheaded or uncomfortable

Example:

"Let your next few breaths be a little slower than usual. Don't force them."

WORDS

Scripts must work without invented history.

NERVE CHECK — FINAL LLM CORRECTIONS

Keep it short and immediate.

Do not add a motivational interpretation of the situation — do not claim
someone already decided the visitor was worth their time, or invent any
other reason things will go well.

Do not suggest an action unrelated to what the visitor described — no
suggesting the restroom, water, or other unrelated logistics unless the
visitor's own situation makes it directly useful.

Never write "You're ready. Go." Good final line: "You don't need to feel
ready first. Go do the next part."

Prepare the next moment. Do not manufacture confidence.

${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3000,
      messages: [{ role: 'user', content: withLanguage(userPrompt, userLanguage) }],
    }, { label: 'nerve-check-live' });
    if (!parsed.first) {
      return res.status(500).json({ error: 'Could not put together your plan. Please try again.' });
    }
    res.json(validateResult(parsed));

  } catch (error) {
    console.error('[NerveCheck/live] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// DEBRIEF — extract evidence, not a verdict on their character
// ═══════════════════════════════════════════════════════════════

router.post('/nerve-check/debrief', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { situation, howItWent, readinessBefore, readinessAfter, whatSurprised, userLanguage } = req.body;

    if (!howItWent?.trim()) return res.status(400).json({ error: 'Tell me how it went' });

    const userPrompt = `NERVE CHECK — DEBRIEF

The visitor has completed the situation.

Help them extract useful evidence for next time.

Apply DEFTBRAIN_OUTPUT_STANDARD_V2.

Do not turn one experience into a personality conclusion.

Do not claim the visitor:
- proved they can perform under pressure
- became more confident
- grew
- conquered a fear
- is now ready for something harder
- underestimated themselves
unless the supplied outcome directly supports that narrow conclusion.

A before/after readiness number is descriptive, not proof of transformation.

WHAT THEY FACED: ${situation || 'not specified'}
HOW IT WENT (visitor's own account): ${howItWent.trim()}
READINESS BEFORE (1-10, self-reported): ${readinessBefore || 'not specified'}
READINESS AFTER (1-10, self-reported): ${readinessAfter || 'not specified'}
WHAT SURPRISED THEM: ${whatSurprised || 'not specified'}

Compare:

WHAT THEY EXPECTED OR FEARED
with
WHAT THEY SAY ACTUALLY HAPPENED

Do not improve the outcome.

Do not infer success from confidence-after.

Do not infer that a feared outcome "didn't happen" unless the visitor said
enough to establish that.

Return ONLY valid JSON:

{
  "headline": "Reflect the event, not the person's character",
  "before_and_after": {
    "readiness_before": null,
    "readiness_after": null
  },
  "what_you_expected": ["What they said they feared or expected — 1-3 items"],
  "what_happened": ["What they say actually happened — 1-3 items"],
  "what_was_different": ["A specific difference between expectation and what happened — 0-3 items"],
  "useful_evidence_for_next_time": ["Only reusable evidence actually established, grounded in the supplied readiness numbers and account — 1-3 items"],
  "what_you_might_change": ["Only include when the visitor supplied something suggesting a useful change — otherwise this is an empty array"],
  "save_this": "A first-person reminder built only from the supplied evidence"
}

HEADLINE

GOOD:
"You expected to freeze. You said you didn't."

BAD:
"You proved you perform well under pressure."

USEFUL EVIDENCE FOR NEXT TIME

GOOD:
"Before this interview you rated your readiness 4/10. You later said the
interview went well and that you didn't freeze."

BAD:
"A 4 is all you need to succeed."

SAVE THIS

Example:
"I felt underprepared going in, and I still got through the interview
without freezing."

${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3500,
      messages: [{ role: 'user', content: withLanguage(userPrompt, userLanguage) }],
    }, { label: 'nerve-check-debrief' });
    if (!parsed.headline) {
      return res.status(500).json({ error: 'Could not put together your debrief. Please try again.' });
    }
    res.json(validateResult(parsed));

  } catch (error) {
    console.error('[NerveCheck/debrief] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// HELP SOMEONE ELSE — support without diagnosing them
// ═══════════════════════════════════════════════════════════════

router.post('/nerve-check/coach', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { whoIsNervous, theirSituation, relationship, theirAge, userLanguage } = req.body;

    if (!theirSituation?.trim()) return res.status(400).json({ error: 'What are they nervous about?' });

    const userPrompt = `HELP SOMEONE ELSE

Help the visitor support another person who is nervous.

Apply DEFTBRAIN_OUTPUT_STANDARD_V2.

Do not diagnose the other person.

Do not infer why they are nervous.

Do not tell the visitor what the other person "needs."

Use only:
- what the visitor says the person is facing
- what the visitor says the person has expressed
- their relationship, if supplied

WHO IS NERVOUS: ${whoIsNervous || 'not specified'}
WHAT THEY'RE FACING: ${theirSituation.trim()}
RELATIONSHIP TO THE VISITOR: ${relationship || 'not specified'}
THEIR AGE GROUP: ${theirAge || 'not specified'}

Return ONLY valid JSON:

{
  "what_to_say": "",
  "what_not_to_push": "",
  "practical_help_you_could_offer": ["A category of help to offer, or an offer to ask what they'd want — not a specific invented task list"],
  "if_they_dont_want_help": ""
}

Prefer support that preserves the other person's agency.

GOOD:
"Want to practice the first question with me?"

BAD:
"You need to stop overthinking this."

GOOD:
"If you'd rather not talk about it, that's okay."

Do not make the visitor responsible for regulating or fixing the other
person's emotions.

NERVE CHECK — FINAL LLM CORRECTIONS

OFFER, DON'T INVENT.

Do not invent what the other person needs, wants, fears, finds pressuring,
or would prefer afterward — only the visitor's own supplied facts establish
that.

Suggest categories of help unless the visitor supplied a specific need.

GOOD:
"Ask whether there's anything practical they'd like help with."

TOO FAR:
"Handle rides, food timing, and costume checks."

Do not invent what other people need. Keep the advice grounded, practical,
and immediately usable.

${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3000,
      messages: [{ role: 'user', content: withLanguage(userPrompt, userLanguage) }],
    }, { label: 'nerve-check-coach' });
    if (!parsed.what_to_say) {
      return res.status(500).json({ error: 'Could not put together suggestions. Please try again.' });
    }
    res.json(validateResult(parsed));

  } catch (error) {
    console.error('[NerveCheck/coach] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.outputStandard = 'v2';
router.outputGuard = {
  checks: ['validateResult'],
  note: 'Grounding rewrite, 2026-09-04 — this tool never had outputStandard/outputGuard or any deterministic backstop before this pass (only a single top-level-key presence guard per endpoint, which is preserved). Six regex checks now: the four unconditionally-banned patterns from the original rewrite (the tool\'s own signature failure "BUT REALLY IT\'S..." inventing a deeper fear; unverifiable physiological claims for a body/breathing action; a population claim about "most people"; an unevidenced probability/outcome estimate) plus two added after a follow-up live probe caught real recurrences: an invented motivational interpretation of the situation on Help Me Now\'s "remember" field ("someone already decided you were worth their time" — the exact live-probe sentence), and the specific banned closing line "You\'re ready. Go." Hedge-dependent bans that are CONDITIONALLY allowed per the prompt text (Debrief\'s character-transformation claims like "proved you can perform under pressure," which are fine WHEN the supplied outcome directly supports them; "you\'re stronger than you think" family, fine WHEN grounded; Main\'s psychological-explanation ban in why_it_helps_here, too varied to safely reduce to a regex on first pass) are deliberately left prompt-only — a keyword ban would block a legitimate grounded use as readily as an invented one. specific-prep, sos, and fear-ladder endpoints were removed in this rewrite, not merged elsewhere; situationType now flows into the main endpoint\'s single grounded plan instead of a separate deep-prep call.',
};

module.exports = router;
