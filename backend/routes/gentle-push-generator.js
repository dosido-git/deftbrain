const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { runOutputGuard } = require('../lib/outputGuard');

// The pushes are written before the guard runs; never hold them hostage.
const GUARD_ENTRY_MS = Number(process.env.GPG_GUARD_ENTRY_MS || 60_000);

// Only the prose the visitor acts on. `approach` is a stable id and not the
// guard's business.
async function guardPushes(parsed, body, startedAt, pushes) {
  if (Date.now() - startedAt > GUARD_ENTRY_MS) {
    console.log('[gentle-push-generator-v2] v2 guard: skipped — out of time, answer returned unguarded');
    return;
  }
  const fields = [];
  const push = (path, v) => { if (typeof v === 'string' && v.trim().length > 15) fields.push([path, v]); };
  push('acknowledgment', parsed.acknowledgment);
  push('if_you_dont', parsed.if_you_dont);
  push('pattern_note', parsed.pattern_note);
  (pushes || []).forEach((x, i) => {
    push(`pushes[${i}].challenge`, x && x.challenge);
    push(`pushes[${i}].why_this_size`, x && x.why_this_size);
    push(`pushes[${i}].what_counts`, x && x.what_counts);
    push(`pushes[${i}].if_too_much`, x && x.if_too_much);
  });
  if (!fields.length) return;

  await runOutputGuard(parsed, {
    label: 'gentle-push-generator-v2',
    fields,
    supplied: `WHAT THE VISITOR TOLD US, IN FULL — nothing else about them is known:
Area of life: ${body.domain || '(not given)'}
What feels easy now, in their words: ${(body.comfortZone || '').trim() || 'NOTHING — they wrote none'}
Where they want to grow, in their words: ${(body.growthArea || '').trim() || '(not given)'}
Capacity today: ${body.currentCapacity || 'medium'}

Nothing about why this is hard for them, what happened before, their diagnosis,
their relationships, their finances, or how brave they usually are.

WHAT FAILS:
1. Naming a motive, fear, diagnosis or trait the visitor did not state. "You are
   afraid of rejection", "you are protecting your energy", "this matters to you
   because" — none of that was given, and being told your own reasons by a tool
   that does not know them is the fastest way to lose someone.
2. A push whose success depends on another person: a reply, a yes, an invitation,
   a reaction, a sale. The visitor controls the attempt and nothing else, so the
   attempt is the only thing that may count.
3. Objective risk dressed as courage. Physical danger, money moved or spent,
   credentials shared, confrontation, contact with someone they may need
   distance from, pushing through pain, anything illegal or deceptive. The
   stretch is meant to be subjective.
4. Streaks, scores, levels, badges, momentum, or any suggestion that not
   attempting was a failure or that the next one has to be bigger.
5. A push too vague to act on, or one needing purchases, special timing or
   elaborate preparation to start.`,
  }, { max_tokens: 1400 });
}

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value. Use plain wording or single quotes inside string values so the JSON remains valid.';


// ════════════════════════════════════════════════════════════
// FINAL CALIBRATION RULES
// ════════════════════════════════════════════════════════════
// Owner-supplied, targeted at the failures in one live run. Deliberately not a
// redesign: the architecture, schema and localisation stay exactly as they are.
const CALIBRATION_RULES = `
GENTLE PUSH GENERATOR — FINAL CALIBRATION RULES

1. THREE DIFFERENT APPROACHES, NOT THREE INTENSITY VARIANTS

All three pushes must be calibrated to the capacity the user selected. Do not
make one intentionally easier and another intentionally harder just to create
variety.

They should differ primarily in APPROACH — for example one-person/direct,
small-group/bounded audience, structured/public-but-reversible,
practice/rehearsal, environment change, or a tiny real-world experiment. Choose
approaches that fit this user's stated growth goal. Do not force those exact
categories.

2. CAPACITY CONSTRAINS THE WHOLE SET

If capacity is LOW, every push must stay genuinely small. No option may require
crossing the user's stated boundary at full intensity. Reduce one or more of:
audience size, duration, commitment, permanence, social exposure, financial
cost, physical demand, complexity.

MEDIUM may involve a real but bounded stretch. HIGH may involve a more
substantial stretch, but must stay safe, reversible where possible, and clearly
achievable.

2a. PRESERVE THE SCOPE THE USER SET — HARD REQUIREMENT

An explicit limit in what they wrote is a calibration constraint, not a
suggestion. One. A few minutes. One person. Something small. Just try. Without
spending money. For today. Any boundary they named is the boundary.

Do NOT quietly widen it to make the three pushes feel different. Variety comes
from HOW they approach the edge, never from HOW MUCH they have to handle.

When you check scope, check all of it: number of items, number of people,
duration, number of steps, physical effort, emotional exposure, money, how
permanent it is, and how much arranging it takes.

A task is not gentle just because each individual step is simple. Three easy
steps is still three steps. Total scope is what the person actually has to
carry, and it is the thing that decides whether they start.

Before returning each push, ask: does this need materially more scope than they
said they wanted to take on today? If yes, cut the scope and keep the distinct
approach — the approach is what makes it a different option, not the size.

THE LIMIT BINDS THE CHALLENGE SENTENCE, NOT ONLY what_counts.

Observed failure: asked for ONE item in five minutes, the tool wrote "take out
only the top few items and sort them into two piles", then set what_counts to
"at least one item has been sorted". The floor was right and the ask was not.
That does not work, because the visitor reads the challenge first and decides
from it whether to start. A challenge that asks for more and forgives it
afterwards has still asked for more.

Where an approach seems to need more than the limit allows, shrink the approach
rather than the criterion. Sorting can be done with one item: decide which of
two piles this single thing belongs in. Comparing can be done with one. Choosing
can be done with one. If an approach genuinely cannot survive at the stated
scope, drop that approach and use a different one — do not stretch the limit to
keep it.

3. NO UNRELATED FRICTION

A push should contain only the discomfort needed to test the growth boundary.
Avoid setup that is not itself the thing being practised: creating an account,
learning an unfamiliar platform, buying something, travelling unnecessarily,
recruiting other people, or several preparatory steps.

If the user wants to get comfortable sharing creative work, the push tests
sharing — not account creation.

4. SUBJECTIVE STRETCH, NEVER OBJECTIVE RISK

Never make a push bolder by adding physical danger, financial exposure, privacy
risk, interpersonal conflict, legal risk or irreversible consequences. In every
domain, increase only the psychological stretch needed to practise the
behaviour.

5. SUCCESS IS CONTROLLABLE BEHAVIOUR ONLY

what_counts must depend entirely on what the user controls.

Good: sending the message counts. Walking into the room counts. Sharing the
draft with one person counts.

Bad: having a good conversation. Getting a positive response. Feeling confident
afterwards.

The attempt is the win. Other people's reactions and the user's own emotional
outcome are never success criteria.

6. NO INFERRED MOTIVES, DIAGNOSES OR HIDDEN MEANINGS

The acknowledgment may restate what the user explicitly said. It must not
explain why they behave that way unless they told us.

Avoid: you are protecting your energy. You are afraid of rejection. You do not
really care about this.

Prefer: you said you have turned down three invitations this month. You have not
shared your work publicly in over a year.

Do not echo dramatic metaphors literally when calmer wording will do. If the
user says they want to see that the world does not end, summarise it as taking a
small step toward sharing again, unless their own wording is genuinely needed.

7. PRESERVE MEANINGFUL CHOICE

Before returning, ask: if I removed the labels, would these still read as three
distinct approaches? If not, regenerate.

8. FEEDBACK RECALIBRATES, IT DOES NOT REROLL

Too much: reduce exposure, commitment or complexity.
Too little: add one meaningful degree of stretch.
Wrong kind: change the approach, not the wording.
Not practical: keep the growth target, change timing, setting or logistics.

9. COMPACT AND CONCRETE

Each card carries a short approach label, when to do it, one concrete challenge,
one short sentence on why it fits, and one what_counts criterion. No coaching
essays, motivational filler, clinical framing or piled-up caveats.

10. FINAL CHECK BEFORE RETURNING

- All three fit the selected capacity.
- None quietly exceeds a limit the user named — a count, a duration, a budget, a number of people, or the word 'one'.
- The three approaches are meaningfully different.
- None adds unrelated logistical friction.
- None increases objective risk.
- Success depends only on controllable action.
- No motive or diagnosis was invented.
- The user can understand each push immediately.

If any answer is no, revise before returning.
`;

const CAPACITY_GUIDE = {
  low: 'LOW capacity: all three options must be genuinely tiny. The person may have very little spare energy. A five-second or one-step attempt can be enough.',
  medium: 'MEDIUM capacity: all three options should be real but manageable. Slight discomfort is appropriate; dread, major preparation, or open-ended commitment is not.',
  high: 'HIGH capacity: all three options may involve a clearer stretch, but still must be bounded, reversible, and objectively safe. Do not confuse readiness with permission to create risk.',
};

const SAFETY_RULES = `
SAFETY AND CALIBRATION — HARD RULES:

WHICH SAFEGUARDS APPLY IS DECIDED BY WHAT THEY WROTE, NOT BY WHICH BUTTON THEY
PRESSED. The area of life is a hint about where to look; it is not a boundary
and it is not a permission. Read the growth goal and the boundary they
described, work out which domains the substance actually touches, and apply
every safeguard those domains carry.

A goal filed under Social that involves fasting, running or injury is a physical
goal and takes the physical rules. A goal filed under Professional that involves
money they could lose takes the financial rules. A goal filed under Creative
that involves disclosing something private takes the emotional rules. "Other",
or no selection at all, removes no protection whatever: work out the substance
and apply what fits.

Where a goal touches more than one domain, every relevant safeguard applies at
once. The strictest one governs; they do not cancel each other out, and the
selected category never overrides any of them.

- Increase SUBJECTIVE STRETCH, never OBJECTIVE RISK.
- Never encourage illegal, dangerous, reckless, coercive, deceptive, humiliating, or self-punishing behavior.
- Never suggest pushing through pain, ignoring medical limitations, extreme exertion, unsafe environments, or unsupervised physical risk.

PHYSICAL DOMAIN — HARD SAFETY RULE.
Where the growth target involves exercise, exertion, performance, pain
tolerance, endurance, strength, diet or any other bodily challenge, do NOT
prescribe intensity, repetitions, duration, load, pace, heart rate, calorie
restriction or maximum effort — unless what the visitor wrote clearly
establishes that this activity AT THAT LEVEL is already routine for them.

If they describe being sedentary, inexperienced, returning after a break or
physically limited, or if they simply have not said enough for you to know, do
not turn "push myself" into harder physical exertion. That is the exact request
you must not grant literally.

Build the stretch around the physical goal instead: beginning at all,
preparing, scheduling, showing up, briefly trying a familiar movement at an easy
self-selected level, asking someone qualified for guidance, or making a concrete
commitment.

Never call an exercise safe, risk-free or medically appropriate for this person.
You are not in a position to know.

CAPACITY IS NOT FITNESS. Low, Medium and High describe how much psychological
stretch the visitor wants today. High capacity permits more psychological
stretch, never greater physiological risk. Reading High as permission to
prescribe a hard workout is a category error and a dangerous one.

No push may require pushing through pain, exhaustion, dizziness, shortness of
breath beyond ordinary comfortable exertion, or any other warning sign.
- Where the goal involves money — whatever category was selected — the push must not involve buying an investment, gambling, taking on debt, spending meaningful money, moving money impulsively, or sharing financial credentials. Favor looking, asking, comparing, planning, or completing a small administrative step.

FINANCIAL DOMAIN — NO STEERING.
Do not teach, imply or reinforce an investment thesis, an expected return, a
trading strategy or a product recommendation. Naming a specific fund, index,
asset class, platform or category as the thing to look at IS a recommendation,
even framed as an example and even when it is the conventional answer. The push
may build familiarity with financial uncertainty and with how a decision gets
made; it must not move the visitor toward any particular financial action.
Write the push so it works whatever they eventually decide: notice what the
uncertainty feels like, find out what a decision would involve, ask someone what
they wish they had known, put a number on what they could stand to lose. Let
them choose what to look at.
- Where the goal involves disclosure, vulnerability or a difficult relationship — whatever category was selected — the push must not force trauma exposure, disclosure of highly sensitive information, confrontation, reconciliation, forgiveness, or contact with someone the person may reasonably need distance from.
- Where the goal involves other people — whatever category was selected — the push must respect their boundaries. Ordinary polite interaction is fine; harassment, persistence after disinterest, manipulation, or privacy invasion is not.
- Never infer motives, diagnoses, personality traits, or hidden causes from the user's behavior. Acknowledge only what they actually told you.
- If the user describes a situation that makes a proposed push unsafe or inappropriate, make the push smaller or redirect it entirely.
- A push succeeds when the user completes the CONTROLLABLE ATTEMPT. Another person's response, approval, outcome, sale, invitation, performance, or emotional reaction must never be required for success.
`;

router.post('/gentle-push-generator', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { action, userLanguage, userLocale, userCurrency, userRegion, ...payload } = req.body;
    const localeContext = { userLocale, userCurrency, userRegion };
    if (!action) return res.status(400).json({ error: 'action is required' });

    switch (action) {
      case 'generate': return await handleGenerate(payload, userLanguage, localeContext, res);
      case 'regenerate': return await handleRegenerate(payload, userLanguage, localeContext, res);
      case 'reflect': return await handleReflect(payload, userLanguage, localeContext, res);
      default: return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    console.error('GentlePushGenerator error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

async function handleGenerate({ domain, comfortZone, growthArea, currentCapacity, pushHistory }, userLanguage, localeContext, res) {
  const startedAt = Date.now();
  if (!growthArea?.trim()) return res.status(400).json({ error: 'growthArea is required' });

  const capacity = currentCapacity || 'medium';
  const recent = Array.isArray(pushHistory) ? pushHistory.slice(0, 6) : [];
  const historyNote = recent.length
    ? `\nRECENT PUSHES — use only to avoid repetition and improve calibration. Do not score the person, infer a streak, or interpret non-attempts as failure:\n${recent.map(p => `- ${p.challenge || ''} | attempted: ${p.attempted === true ? 'yes' : p.attempted === false ? 'no' : 'unknown'}${p.scariness ? ` | felt: ${p.scariness}/5` : ''}`).join('\n')}`
    : '';

  const prompt = `You design small comfort-zone experiments for Gentle Push Generator.

PURPOSE:
Turn something the person wants to grow into three different, concrete ways to stretch a little beyond what is comfortable TODAY. This is not motivation, therapy, exposure treatment, or a bravery contest. The job is precise calibration.

USER CONTEXT:
- Area of life: ${domain || 'not specified'}
- What feels easy now / what feels like a stretch: ${comfortZone?.trim() || 'not specified'}
- Where they want to grow: ${growthArea.trim()}
- Capacity today: ${capacity}
- Capacity rule: ${CAPACITY_GUIDE[capacity] || CAPACITY_GUIDE.medium}
${historyNote}

GENERATE THREE DIFFERENT APPROACHES AT THE APPROPRIATE CAPACITY.
Do NOT generate a fixed gentle/moderate/bold ladder. All three should fit today's capacity; they should differ mainly in route or structure.
Examples of useful structural differences include: a tiny in-the-moment action, a bounded planned practice, a low-stakes real-world experiment, a rehearsal, a request, a first administrative step, or a small act of visibility. Choose approaches that actually fit this user's goal.

Each option must:
- be specific enough that the user knows exactly what to do;
- be bounded in time/scope and easy to exit;
- be possible without special purchases or elaborate preparation;
- reference the user's stated boundary when one is provided;
- define success only by a controllable attempt;
- include a smaller fallback;
- not repeat another option in different words.

ACKNOWLEDGMENT RULE:
Acknowledge only facts the user supplied. Do not say things like you are protecting your energy, you are afraid of rejection, or this means you care unless the user actually said so. Warmth is good; mind-reading is not.

${SAFETY_RULES}
${CALIBRATION_RULES}

Return ONLY valid JSON:
{
  "acknowledgment": "One warm sentence grounded only in what the user actually said. No diagnosis or invented motive.",
  "if_you_dont": "One brief sentence making non-attempt useful information rather than failure.",
  "pattern_note": null,
  "pushes": [
    {
      "approach": "short stable snake_case id describing the route",
      "label": "2-4 word human label for this approach",
      "challenge": "Specific challenge in one or two short sentences",
      "time_frame": "When or under what circumstance to try it",
      "why_this_size": "Why this fits today's stated capacity and boundary, without inventing motives",
      "what_counts": "The smallest controllable attempt that counts as success",
      "if_too_much": "A clearly smaller fallback"
    },
    {
      "approach": "different route id",
      "label": "different human label",
      "challenge": "...",
      "time_frame": "...",
      "why_this_size": "...",
      "what_counts": "...",
      "if_too_much": "..."
    },
    {
      "approach": "third route id",
      "label": "third human label",
      "challenge": "...",
      "time_frame": "...",
      "why_this_size": "...",
      "what_counts": "...",
      "if_too_much": "..."
    }
  ]
}

If recent history contains a very clear calibration pattern, pattern_note may be one cautious sentence such as recent pushes have tended to feel easier than expected. Otherwise return null. Never mention streaks, success rates, badges, levels, or achievement status.

${NO_QUOTE_RULE}
Return only the JSON object.`;

  const parsed = await callClaudeWithRetry({
    model: MODELS.SMART,
    max_tokens: 2600,
    system: withLanguage('Follow the user-facing language requested for this DeftBrain tool. Keep JSON keys and stable programmatic values unchanged.', userLanguage)
      + withLocaleContext(localeContext.userLocale, localeContext.userCurrency, localeContext.userRegion)
      + ' ' + NO_QUOTE_RULE,
    messages: [{ role: 'user', content: prompt }],
  }, { label: 'gpg-generate' });

  const pushes = Array.isArray(parsed?.pushes) ? parsed.pushes.filter(isCompletePush).slice(0, 3) : [];
  // Two usable options beat an error page. The safety and calibration rules
  // genuinely constrain what can be offered — for a sedentary person at high
  // capacity, or a money goal where almost every obvious push is banned, the
  // model can legitimately land on two good ones and a third it should not
  // make. Failing the whole request in that case punishes the visitor for the
  // rules working. Below two there is no real choice to present, so that still
  // fails and asks them to retry.
  if (pushes.length < 2) return res.status(502).json({ error: 'The generated pushes were incomplete. Please try again.' });
  if (pushes.length < 3) console.log(`[gentle-push-generator] returned ${pushes.length} complete pushes, not 3 — served rather than failed`);
  const out = { ...parsed, pushes };
  await guardPushes(out, { domain, comfortZone, growthArea, currentCapacity }, startedAt, pushes);
  res.json(out);
}

async function handleRegenerate({ previousPush, feedback, domain, comfortZone, growthArea, currentCapacity }, userLanguage, localeContext, res) {
  if (!growthArea?.trim()) return res.status(400).json({ error: 'growthArea is required' });
  if (!feedback?.trim()) return res.status(400).json({ error: 'feedback is required' });

  const feedbackGuide = {
    too_scary: 'TOO MUCH: make it meaningfully smaller, shorter, easier to exit, or less socially/emotionally exposed.',
    too_easy: 'TOO LITTLE: add a little more stretch while staying inside the same objective-safety boundary.',
    wrong_direction: 'WRONG KIND: change the route entirely rather than merely resizing the same challenge.',
    not_relevant: 'NOT PRACTICAL RIGHT NOW: choose something that fits ordinary life without special timing, location, money, equipment, or another person being available.',
  };

  const prompt = `You are recalibrating ONE Gentle Push after the user said the previous suggestion did not fit.

CONTEXT:
- Area: ${domain || 'not specified'}
- Easy now / stretch boundary: ${comfortZone?.trim() || 'not specified'}
- Growth goal: ${growthArea.trim()}
- Capacity today: ${currentCapacity || 'medium'}
- Previous suggestion: ${previousPush || 'not specified'}
- Feedback: ${feedback}
- Interpretation of feedback: ${feedbackGuide[feedback] || feedback}

Generate one genuinely revised option. Do not defend the old suggestion. Do not praise the user for giving feedback. Simply acknowledge it and recalibrate.

${SAFETY_RULES}
${CALIBRATION_RULES}

Return ONLY valid JSON:
{
  "response_to_feedback": "One brief, grounded sentence showing how the recalibration will change",
  "push": {
    "approach": "short stable snake_case route id",
    "label": "2-4 word human label",
    "challenge": "Specific challenge",
    "time_frame": "When/circumstance",
    "why_this_size": "Why this better matches the feedback and capacity",
    "what_counts": "Smallest controllable attempt that counts",
    "if_too_much": "Smaller fallback"
  }
}

${NO_QUOTE_RULE}
Return only the JSON object.`;

  const parsed = await callClaudeWithRetry({
    model: MODELS.SMART,
    max_tokens: 1000,
    system: withLanguage('Follow the user-facing language requested for this DeftBrain tool. Keep JSON keys and stable programmatic values unchanged.', userLanguage)
      + withLocaleContext(localeContext.userLocale, localeContext.userCurrency, localeContext.userRegion)
      + ' ' + NO_QUOTE_RULE,
    messages: [{ role: 'user', content: prompt }],
  }, { label: 'gpg-regenerate' });

  if (!isCompletePush(parsed?.push)) return res.status(502).json({ error: 'The replacement push was incomplete. Please try again.' });
  res.json(parsed);
}

async function handleReflect({ push, attempted, scariness, whatHappened }, userLanguage, localeContext, res) {
  if (!push?.trim()) return res.status(400).json({ error: 'push is required' });

  const prompt = `You are helping someone briefly learn from a Gentle Push they chose.

CHALLENGE:
${push.trim()}

DID THEY ATTEMPT IT?
${attempted ? 'Yes' : 'No'}
${scariness ? `How much stretch it actually felt like: ${scariness}/5` : ''}
${whatHappened?.trim() ? `Their own note: ${whatHappened.trim()}` : ''}

RULES:
- The attempt counts regardless of outcome.
- If they did not attempt it, treat that as calibration information, not failure.
- Do not diagnose why they did or did not act.
- Do not claim their brain overpredicted danger or infer a psychological mechanism from one event.
- Do not create streaks, scores, badges, achievement language, or pressure to escalate.
- A next suggestion may repeat the same challenge, shrink it, or take a nearby step. Bigger is not automatically better.
- Ground any interpretation in what they actually reported.
${SAFETY_RULES}

Return ONLY valid JSON:
{
  "celebration": ${attempted ? '"One warm, specific sentence recognizing the attempt without hype"' : 'null'},
  "reflection": "One or two grounded sentences about what this attempt/non-attempt tells us about calibration, based only on the supplied facts",
  "growth_insight": "One cautious, useful observation; null if the supplied information does not support one",
  "scariness_note": ${scariness ? '"One sentence interpreting the rating only as calibration information"' : 'null'},
  "next_suggestion": "One concrete next option that stays close to the current edge and does not assume escalation is necessary"
}

${NO_QUOTE_RULE}
Return only the JSON object.`;

  const parsed = await callClaudeWithRetry({
    model: MODELS.SMART,
    max_tokens: 900,
    system: withLanguage('Follow the user-facing language requested for this DeftBrain tool. Keep JSON keys and stable programmatic values unchanged.', userLanguage)
      + withLocaleContext(localeContext.userLocale, localeContext.userCurrency, localeContext.userRegion)
      + ' ' + NO_QUOTE_RULE,
    messages: [{ role: 'user', content: prompt }],
  }, { label: 'gpg-reflect' });

  res.json(parsed);
}

function isCompletePush(push) {
  return !!(
    push &&
    typeof push.challenge === 'string' && push.challenge.trim() &&
    typeof push.what_counts === 'string' && push.what_counts.trim() &&
    typeof push.if_too_much === 'string' && push.if_too_much.trim() &&
    typeof push.why_this_size === 'string' && push.why_this_size.trim()
  );
}

router.outputStandard = 'v2';
// gentle-push-generator-v2. Reviewed 2026-08-28. The risk here is not bad advice
// so much as presumption: a tool that suggests how to be braver is one keystroke
// away from telling someone why they are afraid, and it was never told. The
// other half is safety — the whole design rests on raising subjective stretch
// without raising objective risk, and that line is easy to cross while sounding
// encouraging.
router.outputGuard = {
  prohibit: [
    'names_a_motive_or_fear_the_visitor_did_not_state',
    'success_depending_on_another_persons_response',
    'objective_risk_presented_as_courage',
    'streaks_scores_or_escalation_pressure',
    'push_too_vague_or_too_costly_to_start',
    'three_pushes_that_are_intensity_variants_not_approaches',
    'unrelated_setup_friction_that_is_not_the_thing_being_practised',
    'dramatic_metaphor_echoed_back_instead_of_summarised',
    'financial_push_steering_toward_a_product_thesis_or_return',
    'prescribes_physical_intensity_without_established_routine',
    'reads_high_capacity_as_physical_readiness',
    'exceeds_a_scope_limit_the_user_stated',
    'variety_created_by_adding_scope_rather_than_changing_approach',
    'safeguard_skipped_because_the_selected_category_did_not_match_the_substance',
  ],
  require: [
    'success_defined_by_a_controllable_attempt',
    'fulfills_tool_promise',
  ],
};

module.exports = router;
