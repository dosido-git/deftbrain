const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { runOutputGuard } = require('../lib/outputGuard');

const PERSONALITY = `Thoughtful professional-connection coach. Help people prepare for worthwhile professional introductions without engineering another person's attention.

The goal is not to make a target notice the user. The goal is to help the user strengthen what they genuinely bring, identify real professional overlap, and recognize whether there is a legitimate reason to reach out.

Core principle: Build readiness, not pursuit.`;


const GUARD_ENTRY_MS = Number(process.env.BH_GUARD_ENTRY_MS || 60_000);

// Only the fields a person acts on: the actions they will actually take and
// the message they will actually send. The framing fields describe the user's
// own position, which they can judge for themselves.
async function guardBeforeHello(parsed, body, startedAt) {
  if (Date.now() - startedAt > GUARD_ENTRY_MS) {
    console.log('[before-hello] v2 guard: skipped — out of time, answer returned unguarded');
    return;
  }
  const fields = [];
  (parsed.strengthen_your_position?.actions || []).forEach((a, i) => {
    if (a && typeof a.action === 'string' && a.action.trim().length > 12) {
      fields.push([`strengthen_your_position.actions[${i}].action`, a.action]);
    }
  });
  const fc = parsed.first_contact || {};
  if (typeof fc.what_to_say === 'string' && fc.what_to_say.trim().length > 12) fields.push(['first_contact.what_to_say', fc.what_to_say]);
  if (typeof parsed.genuine_overlap?.how_to_deepen_it === 'string') fields.push(['genuine_overlap.how_to_deepen_it', parsed.genuine_overlap.how_to_deepen_it]);
  if (!fields.length) return;

  await runOutputGuard(parsed, {
    label: 'before-hello-v2',
    fields,
    supplied: `WHAT THE USER TOLD US, IN FULL — nothing else about either person is known:
Person they may want to connect with: ${(body.targetDescription || '').trim() || '(not given)'}
Kind of connection: ${body.targetType || '(not given)'}
Why them / what they hope to discuss: ${(body.whyThemContext || '').trim() || '(not given)'}
The user's own background: ${(body.yourBackground || '').trim() || '(not given)'}

Nothing is known about the other person's platforms, publications, habits,
schedule, network, opinions, preferences, or what they would respond to.

WHAT FAILS:
1. A fact about the other person the user never supplied — what they post,
   read, value, attend, or would find interesting.
2. An action whose real purpose is being noticed: engineered exposure,
   proximity, monitoring, cultivating their contacts, attending something
   because they will be there.
3. A warm-up campaign where a direct, respectful introduction would do.
4. A score, percentage, response rate, or fixed timeline presented as
   measurable.
5. A next step that stops making sense the moment you assume this person never
   sees it.`,
  }, { max_tokens: 1200 });
}

router.post('/gravity-well', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  const startedAt = Date.now();
  try {
    const { targetDescription, targetType, whyThemContext, yourBackground, userLanguage } = req.body;
    if (!targetDescription?.trim()) return res.status(400).json({ error: 'Describe the professional you would like to connect with.' });

    const userPrompt = `BEFORE HELLO — PROFESSIONAL CONNECTION PREPARATION

PROFESSIONAL YOU MAY WANT TO CONNECT WITH: "${targetDescription.trim()}"
TYPE OF PROFESSIONAL CONNECTION: ${targetType || 'Not specified — do not over-infer'}
${whyThemContext?.trim() ? `WHY THIS PERSON / WHAT YOU HOPE TO LEARN OR DISCUSS: ${whyThemContext.trim()}` : ''}
${yourBackground?.trim() ? `YOUR BACKGROUND / WHAT YOU BRING: ${yourBackground.trim()}` : ''}

Help the user decide what should be true before they introduce themselves. A direct, respectful cold introduction may already be the best answer. Do not manufacture a warm-up campaign when one is unnecessary.

Return ONLY valid JSON:
{
  "starting_position": {
    "what_you_bring": "Only the relevant experience, work, perspective, or credibility actually supplied by the user",
    "what_is_missing": "The smallest real gap between the user's current position and a worthwhile introduction; say if no meaningful gap is apparent",
    "connection_case": "The genuine professional reason these two people might have something useful to discuss; if evidence is thin, say so"
  },
  "strengthen_your_position": {
    "summary": "What would make the user better prepared independent of whether this person ever notices",
    "actions": [
      {
        "action": "A specific, bounded action",
        "why_it_matters_anyway": "Why this remains worthwhile even if the other person never sees it"
      }
    ]
  },
  "genuine_overlap": {
    "where_it_exists": "The substantive overlap supported by the user's facts",
    "how_to_deepen_it": "One or two natural ways to deepen the user's own work, thinking, or participation in that area without pursuing the person",
    "what_not_to_manufacture": "A case-specific warning against any tempting but artificial route to familiarity"
  },
  "ready_to_say_hello": {
    "status": "ready_now, build_first, or not_enough_reason_yet",
    "why": "Why that status fits this case. The status field itself must be exactly one of the three machine codes above; all explanatory text should be in the user's language.",
    "conditions": ["One observable condition that would make an introduction more worthwhile, if any", "A second condition only if genuinely useful"]
  },
  "first_contact": {
    "when_to_reach_out": "A condition, not an arbitrary waiting period. Say now if now is appropriate.",
    "the_frame": "The legitimate reason for the contact and a proportionate ask",
    "what_to_say": "A short first-contact template grounded only in supplied facts; use brackets for missing specifics rather than inventing them",
    "what_not_to_say": "The most relevant phrases or framing to avoid"
  },
  "do_today": "One low-regret action the user can take today that is useful even if this connection never happens"
}

HARD REQUIREMENTS

PROFESSIONAL SCOPE
This tool is for professional, creative, academic, civic, or business connections. Do not provide romantic, dating, intimate-partner, friendship-acquisition, or personal-access strategies. If the user's request is primarily personal or romantic, keep the output focused on ordinary respectful direct communication and boundaries rather than pre-contact strategy.

NO-TARGET TEST
Every action before contact must still be worthwhile and natural if the other person never sees it. If an action fails this test, do not recommend it.

DO NOT ENGINEER ATTENTION
Never recommend:
- manufacturing repeated exposure or familiarity;
- monitoring someone's activity to wait for an opening;
- cultivating their friends, colleagues, followers, or contacts primarily as a route to them;
- attending an event primarily because the person will be there;
- repeatedly placing the user in spaces primarily so the person notices them;
- tagging, replying, commenting, publishing, or joining communities primarily to create impressions on this one person;
- creating an apparently organic encounter that was actually engineered.

NO REQUIRED WARM-UP
Do not assume prior recognition, prior interaction, a reply, or repeated exposure is necessary. If the user already has a legitimate reason to contact the person, say so and recommend a respectful direct introduction now.

READINESS THRESHOLD
Use build_first ONLY when something important is actually missing — no relevant credibility, no legitimate reason to make contact, or no bounded, answerable ask. Do NOT use build_first merely because further preparation could make the introduction stronger; that is true of every introduction ever sent, and treating it as a blocker is how this tool would quietly become the pursuit engine it refuses to be.

If the user already has relevant experience, a real reason to write, and a specific question a person could answer in a few sentences, the status is ready_now. Say so plainly. A public artifact, a portfolio piece, or a published write-up may be RECOMMENDED as worthwhile in its own right — it must never be stated or implied as a precondition for making contact.

not_enough_reason_yet is for the narrower case where the connection itself has no substance yet, not for a user who is simply less prepared than they could be.

DISENGAGEMENT
A declined request, explicit non-interest, request for no contact, blocking, or other clear boundary ends the strategy. Silence after one appropriate message is not a reason to seek another route to the person. Do not recommend escalation around a boundary.

GROUNDING
Use only facts the user supplied. Do not invent the person's platforms, publications, habits, interests, schedule, network, opinions, preferences, motivations, or likely reactions. Conditionalize unknowns: 'if they publish publicly...', 'if there is a relevant professional event you would attend anyway...'. Do not claim to know what they watch, value, respect, avoid, or need unless the user supplied it.

GROUNDING APPLIES TO INFERENCE, NOT ONLY INVENTION
A characteristic you DERIVED from the user's description is still a fact you made up. 'Writes a newsletter on data communication' establishes that they write a newsletter on data communication — it does not establish that they communicate data to non-specialist audiences, enjoy explaining things, welcome questions from strangers, care about mentorship, or value clarity over rigour. 'Takes almost no meetings' does not establish why.

Restate what the user supplied. Do not convert it into a claim about the person's skills, temperament, audience, or motives, and do not build the approach on such a claim. If a plan only works because the person is a certain sort of person, and the user never said they were, the plan is unsupported.

NO FAKE PRECISION
No scores, percentages, odds, probabilities, predicted response rates, or timelines presented as if measurable.

NO FIXED CAMPAIGN
Do not force a 30/60/90-day plan or fill time with activity. Recommend only actions that materially improve the user's own readiness or the substance of a possible conversation.

PRIVACY AND CONFIDENTIALITY
Do not encourage disclosure of confidential, proprietary, patient/client, employer, or personally identifying information. When suggesting examples from work, explicitly keep them appropriately anonymized and authorized for public discussion.

FIRST CONTACT
Keep the ask proportionate. Do not manufacture familiarity. Do not imply the recipient owes a response. A good first message can be cold if it is specific, relevant, respectful, and easy to decline.

NO FLATTERY IN THE MESSAGE
what_to_say must not praise the recipient's character, generosity, judgement or public conduct, and must not rank them against other people. Lines like 'I would trust your answer more than most' or 'you have been generous with what you share publicly' assert things the user never said, put words in their mouth they may not mean, and read as softening-up. The recipient can tell.

Close by making it easy to decline, not by paying a compliment. Something in the shape of: 'If you have time for a short reply, I'd really value your perspective. If not, I completely understand.'

FINAL CHECK
Before returning the JSON, verify:
1. Would every pre-contact action still benefit the user if this person never saw it?
2. Did I recommend anything whose real purpose is repeated exposure, proximity, monitoring, or access?
3. Did I invent any fact about the other person's world or behavior?
4. Did I unnecessarily delay a legitimate direct introduction?
5. Is there a clear stop condition if contact is unwelcome?
If any answer reveals a problem, revise before returning.`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3200,
      system: withLanguage(PERSONALITY, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion) + ' Never place a double-quote (") character inside any JSON string value — use single quotes or brackets inside values instead.',
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'gravity-well' });

    if (!parsed.starting_position) return res.status(500).json({ error: 'Could not generate a response. Please try again.' });

    // The prompt's whole thesis is: no invented facts about the other person,
    // and no action whose real purpose is being noticed. A prompt rule nothing
    // checks is a prompt rule that drifts, so check the fields a person acts
    // on — the actions they will take and the message they will send.
    await guardBeforeHello(parsed, req.body, startedAt);
    res.json(parsed);
  } catch (error) {
    console.error('BeforeHello error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.outputStandard = 'v2';
// before-hello. The tool's failure mode is not a wrong answer — it is a
// plausible one built on facts the user never supplied about a real person
// they intend to contact, or an action whose only purpose is being seen.
router.outputGuard = {
  prohibit: [
    'invents_a_fact_about_the_other_person',
    'recommends_engineered_exposure_or_proximity',
    'recommends_monitoring_or_network_hopping',
    'manufactures_a_warm_up_that_is_not_needed',
    'states_fake_precision_scores_or_timelines',
  ],
  require: [
    'every_action_worthwhile_if_never_seen',
    'fulfills_tool_promise',
  ],
};

module.exports = router;
