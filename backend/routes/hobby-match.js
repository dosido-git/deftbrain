const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { runOutputGuard } = require('../lib/outputGuard');

const GUARD_ENTRY_MS = Number(process.env.HM_GUARD_ENTRY_MS || 45_000);

// Guards the prose a person reads and acts on. The failure mode here is not a
// bad hobby — it is a confident sentence about who they are, or a price, club
// or practice schedule nobody supplied. session_fit and startup_cost are left
// out on purpose: they are near-enumerations, and checking thirty-three fields
// instead of twenty-three buys a slower repair for no additional catch.
async function guardHobbyMatch(parsed, body, startedAt) {
  if (Date.now() - startedAt > GUARD_ENTRY_MS) {
    console.log('[hobby-match] v2 guard: skipped — out of time, matches returned unguarded');
    return;
  }
  const long = v => typeof v === 'string' && v.trim().length > 12;
  const fields = [];
  if (long(parsed.matching_for)) fields.push(['matching_for', parsed.matching_for]);
  (parsed.hobbies || []).forEach((h, i) => {
    if (long(h?.why_it_made_the_list)) fields.push([`hobbies[${i}].why_it_made_the_list`, h.why_it_made_the_list]);
    if (long(h?.what_its_like)) fields.push([`hobbies[${i}].what_its_like`, h.what_its_like]);
    if (long(h?.try_it_once)) fields.push([`hobbies[${i}].try_it_once`, h.try_it_once]);
    if (long(h?.where_to_look)) fields.push([`hobbies[${i}].where_to_look`, h.where_to_look]);
    if (long(h?.watch_for)) fields.push([`hobbies[${i}].watch_for`, h.watch_for]);
  });
  if (long(parsed.wildcard?.why)) fields.push(['wildcard.why', parsed.wildcard.why]);
  if (long(parsed.pattern_in_matches)) fields.push(['pattern_in_matches', parsed.pattern_in_matches]);
  if (!fields.length) return;

  await runOutputGuard(parsed, {
    label: 'hobby-match-v2',
    fields,
    supplied: `WHAT THE USER TOLD US, IN FULL — nothing else about them is known:
About them: ${(body.personality || '').trim() || '(not given)'}
What they want more of: ${(body.lookingFor || '').trim() || '(not given)'}
Free time: ${(body.schedule || '').trim() || '(not given)'}
Startup budget: ${(body.budget || '').trim() || '(not given)'}
Things that affect what will work: ${(body.physical || '').trim() || '(none given)'}
Already tried: ${(body.triedBefore || '').trim() || '(not given)'}

Nothing is known about their personality, psychological needs, fears,
motivations, social confidence, learning style, attention span, physical
ability beyond what is written above, or why any past hobby actually ended.

WHAT FAILS:
1. A personality trait, disposition, need or emotional state attributed to
   them that they did not state — "you crave mastery", "you learn best when",
   "you thrive on", "you are the kind of person who". Restating their own
   words back is fine; naming what kind of person they are is not.
2. A prediction about how a hobby will land: that it will stick, become
   addictive, be perfect for them, get them out of their head, or make them
   feel any particular way. "You will feel the difference" is a violation;
   "one session shows you whether the feedback loop suits you" is not.
3. A fabricated price, membership fee, equipment cost, schedule, club,
   community, competition, app or facility. A rough range is allowed only when
   marked approximate; a specific named organisation only on reliable grounds.
4. A prescribed practice frequency — "2-4 times a week to see real progress".
   How it fits the time they described is the question; how often they should
   do it is not ours to set.
5. A recommendation that conflicts with a stated limitation, or that assumes
   equipment, transport, space, noise tolerance or accessibility they never
   mentioned, rather than naming that dependency.
6. A claim about what they have never heard of or never considered.`,
    promise: 'Return hobbies that plausibly fit the interests, time, budget, constraints and history this person actually described — with a reason each one is on the list and the smallest way to try it — without telling them who they are or predicting how it will feel.',
    guard: router.outputGuard,
    userLanguage: body.userLanguage || body.userLocale,
    locale: body.userLocale || '',
  });
}

// ════════════════════════════════════════════════════════════
// POST /hobby-match — hobbies that fit the life described
// ════════════════════════════════════════════════════════════
router.post('/hobby-match', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  const startedAt = Date.now();
  try {
    const { personality, schedule, budget, physical, triedBefore, lookingFor, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!personality?.trim() && !lookingFor?.trim()) {
      return res.status(400).json({ error: 'Tell us a little about you, or what you are looking for.' });
    }

    const systemPrompt = `You are Hobby Match, a practical hobby discovery tool. Your job is not to diagnose the user's personality or tell them what kind of person they are. It is to use what they supplied to identify hobbies that plausibly fit their interests, goals, available time, budget, constraints and prior experience.

CORE PRINCIPLE
Recommend things worth trying, not things you predict the user will love. Never claim a hobby is perfect for them, will stick, will become addictive, will get them "out of their head", will satisfy a psychological need, or will produce a particular emotional effect. A good recommendation gives someone a reason to try something; it does not make a prediction about who they are. This includes the small predictions: never write "you will feel", "you will love", "you will know you have found it", "it will click". Say what the activity does and what trying it would show them — "one session will show you whether the feedback loop suits you" reports a test; "you will feel the difference" promises a result you cannot see.

GROUNDING
Use only what the user supplied. Do not infer or invent personality traits, psychological needs, fears, insecurities, motivations or emotional states, social confidence, learning style, attention span beyond what they described, physical ability beyond what they stated, or why a previous hobby succeeded or failed beyond the reason they gave.
Transform what they supplied intelligently, but never into a personality diagnosis. From "I liked chess but plateaued" you may say "you have enjoyed a hobby with measurable skill progression". You may not say "you crave mastery and visible metrics". Nor "you learn best when...", "you thrive on...", "you are the kind of person who..." — restating their own constraint is fine ("you said you would rather not be a beginner in front of people"), but naming a learning style or a disposition is a diagnosis wearing a helpful voice.

MATCHING
Weigh what they explicitly say they want, the interests and qualities they mention, their available time, their startup budget, their physical and practical constraints, what they have already tried, and the reasons they gave for those working or not.
Constraints outrank novelty. Never recommend something merely because it is unusual. Do not recommend a hobby they have already tried unless there is a materially different version that directly addresses the stated reason it did not work.

NOVELTY
Aim for discovery, not obscurity. Include hobbies they may not have considered, but never claim they have "genuinely never considered" one — you cannot know that. Prefer a mix: strong matches that may be somewhat familiar, less obvious matches with a clear reason for inclusion, and optionally one wildcard that approaches their goals differently. The wildcard still respects every constraint.

PHYSICAL AND PRACTICAL CONSTRAINTS
Treat a stated limitation as a constraint, not a challenge to overcome. Do not recommend an activity that conflicts with one merely because a modified version might exist — if you mean the compatible version, recommend that version plainly. Give no medical or rehabilitation advice. Never infer that "generally fit" makes a particular exercise appropriate.
Where suitability depends on equipment, accessibility, transport, space, noise, location, instruction or any other unknown, name the dependency instead of assuming it.

FACTUAL CLAIMS
Do not fabricate prices, schedules, membership fees, equipment costs, availability, local clubs, communities, competitions, apps or facilities. A rough cost range is allowed only where it is genuinely useful and defensible, and must be labelled as approximate — "typical starter cost: roughly...", "often possible for under...". Never imply current pricing or local availability.
Do not tell the user where to "find their people". Describe useful places to look — local clubs, community classes, maker spaces, libraries, recreation departments, relevant online communities, hobby-specific organisations. Name a specific organisation, app, service, club or website only where you have reliable grounds.

TIME
Never invent a required practice schedule such as "2-4 times a week to see real progress". Speak to SESSION FIT instead: can this fit the blocks of time they described? "Works well in short sessions." "Usually needs a longer uninterrupted block." "Can be picked up and put down easily." Prescribe a frequency only where the activity itself genuinely requires one.

SAFETY
Do not romanticise a hazardous activity. Where a hobby involves blades, tools, heat, chemicals, water, heights, traffic, machinery or strenuous exercise, note the relevant basic safety consideration plainly, without turning the recommendation into a lecture. Never write a line like "turning dull blades into surgical tools".

QUALITY OVER QUANTITY
Do not pad the list to hit a number. Five strong, distinct recommendations beat six with filler, and fewer than five is correct when the input does not support five. Recommendations must differ in what the person actually DOES, not merely in name.

Never place a double-quote (") character inside any JSON string value — write quoted phrases plainly or with single quotes, or it breaks the JSON.`;

    const userPrompt = `ABOUT THEM: ${personality || 'not specified'}
FREE TIME: ${schedule || 'not specified'}
STARTUP BUDGET: ${budget || 'flexible'}
THINGS THAT AFFECT WHAT WILL WORK: ${physical || 'none specified'}
${triedBefore ? `ALREADY TRIED: ${triedBefore}` : ''}
${lookingFor ? `WHAT THEY WANT MORE OF: ${lookingFor}` : ''}

Return ONLY valid JSON:
{
  "matching_for": "2-4 sentences naming the practical matching criteria that follow from their answers — what the hobby has to offer, fit around, or avoid. Selection criteria only. Never characterise their personality.",
  "hobbies": [
    {
      "name": "The hobby, specifically — not a vague category",
      "icon": "One relevant emoji",
      "why_it_made_the_list": "1-2 sentences connecting it directly to something they supplied.",
      "what_its_like": "2-3 sentences on what a person actually does. Concrete enough to picture a session.",
      "energy_type": "solo | social | either",
      "session_fit": "How it sits in the time they described — short sessions, needs a longer block, easy to pick up and put down. Not a practice frequency.",
      "startup_cost": "free | low | moderate | higher, plus a rough range ONLY where defensible, clearly marked approximate and in their local currency",
      "try_it_once": "The smallest realistic experiment that lets them experience the hobby before buying significant equipment or committing. It tests the hobby; it does not start a new identity.",
      "where_to_look": "Kinds of places to look for instruction, equipment or people. Name a specific organisation only where you have reliable grounds. Empty string if there is nothing useful to say.",
      "watch_for": "A material constraint, cost, safety, accessibility, equipment or participation consideration worth knowing before starting. Empty string when there is none."
    }
  ],
  "wildcard": {
    "name": "Optional. A hobby that satisfies their constraints but differs meaningfully from the five. Empty string if none earns the slot.",
    "why": "Why it earned the wildcard slot. Do not claim they will enjoy it."
  },
  "pattern_in_matches": "Optional. A pattern in the RECOMMENDATIONS, supported by several things they supplied — 'several of these can be practised privately, offer measurable progress and fit short sessions'. Never a pattern in the person, and never a prediction about which will stick. Empty string unless clearly supported."
}

The "energy_type" field must be EXACTLY one of solo, social, either — lowercase English, never translated, because the interface matches on it. Every other string is written in the user's language as normal.

Recommend up to 5 hobbies, fewer if the input does not support five. Keep every field concise.`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 4000,
      system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'hobby-match' });

    // Guard on the two fields that are always present. matching_for opens every
    // response and hobbies is the response; wildcard and pattern_in_matches are
    // both optional by design and would 500 every call keyed on either.
    if (!parsed.matching_for || !Array.isArray(parsed.hobbies) || !parsed.hobbies.length) {
      return res.status(500).json({ error: 'Could not generate a response. Please try again.' });
    }
    await guardHobbyMatch(parsed, req.body, startedAt);
    return res.json(parsed);

  } catch (error) {
    console.error('HobbyMatch error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

// Reviewed against backend/lib/outputStandard.js on 2026-08-30, as part of the
// v2 rewrite. It leans hardest on §4 (respect the visitor's agency) — the whole
// rewrite is "recommend things worth trying, not things you predict they will
// love" — and §5 (a recovery path), which is what try_it_once is for. See PF-39.
router.outputStandard = 'v2';
// The failure mode is a confident sentence about who this person is, or a fact
// about the world that nobody checked.
router.outputGuard = {
  prohibit: [
    'attributes_a_personality_trait_disposition_need_or_emotional_state_not_stated',
    'predicts_that_a_hobby_will_stick_suit_them_or_make_them_feel_something',
    'fabricates_a_price_fee_schedule_club_community_app_or_facility',
    'prescribes_a_practice_frequency_rather_than_describing_session_fit',
    'ignores_a_stated_limitation_or_assumes_unmentioned_equipment_transport_or_space',
    'claims_the_user_has_never_heard_of_or_never_considered_something',
  ],
  require: [
    'every_hobby_states_why_it_made_the_list_from_supplied_information',
    'matching_for_states_selection_criteria_not_personality',
    'fulfills_tool_promise',
  ],
};

module.exports = router;
