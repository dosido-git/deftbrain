const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// Generation alone runs ~30s, so a 45s gate was rejecting the edit on any slow
// draft. The edit is the only thing enforcing the physical constraint, so it is
// worth waiting for.
const EDIT_ENTRY_MS = Number(process.env.HM_EDIT_ENTRY_MS || 90_000);
const EDIT_MAX_TOKENS = Number(process.env.HM_EDIT_MAX_TOKENS || 6000);

// Guards the prose a person reads and acts on. The failure mode here is not a
// bad hobby — it is a confident sentence about who they are, or a price, club
// or practice schedule nobody supplied. session_fit and startup_cost are left
// out on purpose: they are near-enumerations, and checking thirty-three fields
// instead of twenty-three buys a slower repair for no additional catch.
// Prices and durations are the one class here that needs no reasoning to spot,
// and the prose rule kept failing to hold them: the enums removed them from the
// metadata chips and they reappeared inside what_its_like and watch_for as
// "£1", "£5", "materials for 0-20". So they are found in code and the offending
// sentences are handed to pass 2 by name.
const MONEY_OR_TIME = /[£$€¥₹]\s?\d|\b\d+\s*(?:[-–—]\s*\d+\s*)?(?:minutes?|mins?|hours?|weeks?|months?|sessions?|quid|dollars?|euros?|pounds?)\b|\b(?:one|two|three|four|five|ten|fifteen|twenty|thirty|forty|sixty|ninety)\s+(?:minutes?|hours?|sessions?|weeks?|months?)\b|\bfinished in one (?:session|sitting)\b|\btakes a few sessions\b/gi;

function numericLeaks(draft) {
  const hits = [];
  const scan = (path, v) => {
    if (typeof v !== 'string' || !v.trim()) return;
    const m = v.match(MONEY_OR_TIME);
    if (m) hits.push({ path, found: [...new Set(m)].join(', '), sentence: v.slice(0, 160) });
  };
  (draft.matching_for || []).forEach((x, i) => scan(`matching_for[${i}]`, x));
  (draft.hobbies || []).forEach((h, i) => {
    if (!h) return;
    ['why_it_made_the_list', 'what_its_like', 'try_it_once', 'where_to_look', 'watch_for']
      .forEach(f => scan(`hobbies[${i}].${f}`, h[f]));
  });
  scan('wildcard.why', draft.wildcard && draft.wildcard.why);
  scan('pattern_in_matches', draft.pattern_in_matches);
  return hits;
}

// PASS 2 — the constraint and grounding edit.
//
// runOutputGuard repairs FIELDS. It cannot remove a recommendation, and that is
// the failure that matters here: told "bad knees, anything seated or low-impact
// is fine", generation kept returning rock climbing, badminton and trail
// running, and the guard dutifully rewrote climbing's watch_for while leaving
// climbing on the list. Rules did not fix it either — an explicit hard filter
// naming those exact activities still let two runs in three through.
//
// So a second, colder call reviews the list with the constraint in front of it
// and is allowed to DROP an entry. Returning four hobbies that fit beats five
// where one argues its way past a stated limitation, and QUALITY OVER QUANTITY
// already says fewer is the right answer when the input does not support five.
async function enforceSuppliedFacts(draft, body, startedAt) {
  if (Date.now() - startedAt > EDIT_ENTRY_MS) {
    console.log('[hobby-match] grounding edit: skipped — out of time, draft returned unedited');
    return draft;
  }
  const numbers = numericLeaks(draft);
  const numberBlock = numbers.length ? `
PRICES OR DURATIONS FOUND — remove each; cost and session_fit already carry this categorically:
${numbers.map(h => `- ${h.path}: ${h.found}`).join('\n')}
` : '';
  const prohibited = (router.outputGuard.prohibit || []).map(x => `- ${x.replace(/_/g, ' ')}`).join('\n');

  const editorSystem = `You are a grounding editor for a hobby recommender. You are NOT making anything more appealing, more specific or better argued — that impulse is what put the errors in. You remove what the writer had to invent or argue around, and you change nothing else.

Return the SAME JSON shape. You may REMOVE a hobby from the list; never add one, and never rewrite a hobby into a different hobby. Never place a double-quote (") character inside a JSON string value. Return ONLY the JSON.`;

  const editorPrompt = `WHAT THE USER ACTUALLY SAID — the complete set of established facts:
About them: ${(body.personality || '').trim() || '(not given)'}
What they want more of: ${(body.lookingFor || '').trim() || '(not given)'}
Free time: ${(body.schedule || '').trim() || '(not given)'}
Startup budget: ${(body.budget || '').trim() || '(not given)'}
Things that affect what will work: ${(body.physical || '').trim() || '(none given)'}
Already tried: ${(body.triedBefore || '').trim() || '(not given)'}

STEP 1 — CONSTRAINT. If they stated anything affecting what will work, remove every hobby that does not clearly satisfy it AS WRITTEN. A hobby fails if its case relies on judging how the activity loads a joint, on a gentler or modified version existing, on technique, or on a caveat to ask an instructor. "Low-impact", "easy on", "gentle on", "at your own pace", "you could adapt" appearing in its favour means it fails. Rock climbing, badminton, tennis, running and the like do not satisfy a stated knee problem, whatever technique exists. Remove them. Do not replace them — a shorter list is the correct answer.

STEP 2 — GROUNDING. In everything that remains, for each sentence explaining why a hobby fits, check the connection holds without inventing a fact about their psychology, body, motivation or likely reaction. Remove or rewrite:
- predictions: will stick, will keep you interested, will get you out of your head, satisfies your need for
- ordinary language rendered clinical: "hates being a beginner in public" is not anxiety — say "lets you learn privately"
- explanations of why a past hobby ended, or one experience generalised into a rule about them — including a comparison that implies it: "progress that does not plateau the way chess does" both explains why chess ended and ranks two hobbies on evidence nobody has. Say what this hobby offers; do not rank it against the one they mentioned.
- invented durations, costs, comparisons or availability in ANY field — no "takes 20-40 minutes", no "£5", no "finished in one session", no "often free online". cost and session_fit already carry this categorically; prose must not restate it numerically
- therapy-sounding description — "channels mental energy into construction" is a claim about them; say what the activity involves
- a pattern about the PERSON rather than about the recommendations, or any comparison with other people
${prohibited}

Do not replace a removed detail with a different invented detail. Keep every remaining hobby's name and icon exactly as they are. Leave cost, session_fit and activity_mode exactly as they are — they are enum values the interface renders, not prose to improve. Leave user_facts_used alone except to DELETE an entry that is not in the text above.

FINAL TEST: could every user-specific statement be highlighted in the text above? Could someone with the stated limitation do each remaining hobby without argument, adaptation or a caveat? If not, fix it.

${numberBlock}
DRAFT TO EDIT:
${JSON.stringify(draft)}`;

  try {
    const edited = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: EDIT_MAX_TOKENS,
      temperature: 0,
      system: withLanguage(editorSystem, body.userLanguage),
      messages: [{ role: 'user', content: editorPrompt }],
    }, { label: 'hobby-match:grounding-edit', maxRetries: 0 });

    // It may shorten the list; it may not empty it, grow it, or change shape.
    const n = (draft.hobbies || []).length;
    const ok = edited
      && (Array.isArray(edited.matching_for) ? edited.matching_for.length > 0 : typeof edited.matching_for === 'string')
      && Array.isArray(edited.hobbies)
      && edited.hobbies.length >= 1
      && edited.hobbies.length <= n
      && edited.hobbies.every(h => h && typeof h.name === 'string' && h.name.trim());
    if (!ok) {
      console.log('[hobby-match] grounding edit: rejected — shape changed, draft returned');
      return draft;
    }
    const stillNumeric = numericLeaks(edited);
    const dropped = n - edited.hobbies.length;
    console.log(`[hobby-match] grounding edit: applied`
      + (dropped ? `, ${dropped} hobby(ies) dropped for the stated constraint` : '')
      + (numbers.length ? `, ${numbers.length} price/duration flagged` : '')
      + (stillNumeric.length ? `, ${stillNumeric.length} STILL PRESENT: ${stillNumeric.map(x => x.path).join(', ')}` : numbers.length ? ', all removed' : ''));
    return edited;
  } catch (err) {
    console.log('[hobby-match] grounding edit: failed —', err.message, '— draft returned');
    return draft;
  }
}

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

FIT, NOT PREDICTION
Say why a hobby appears compatible with what they supplied. Do not predict that it will solve, offset, relieve, satisfy or improve anything they mentioned. Not "perfect for", "excellent for you", "will help", "will offset", "will satisfy", "exactly what you need". Prefer the concrete property that makes it compatible: "can be done in short sessions", "easy to pause between steps", "does not require a fixed group schedule", "can be done at home".

GROUNDING
Use only what the user supplied. Do not infer or invent personality traits, psychological needs, fears, insecurities, motivations or emotional states, social confidence, learning style, attention span beyond what they described, physical ability beyond what they stated, or why a previous hobby succeeded or failed beyond the reason they gave.
Transform what they supplied intelligently, but never into a personality diagnosis. And never translate ordinary language into a psychological condition or emotion: someone who says they hate being a beginner in public has not reported anxiety. Write "which lets you learn privately", not "which sidesteps the beginner anxiety". From "I liked chess but plateaued" you may say "you have enjoyed a hobby with measurable skill progression". You may not say "you crave mastery and visible metrics". Nor "you learn best when...", "you thrive on...", "you are the kind of person who..." — restating their own constraint is fine ("you said you would rather not be a beginner in front of people"), but naming a learning style or a disposition is a diagnosis wearing a helpful voice.

DO NOT EXPLAIN PRIOR HOBBIES FOR THE USER
A hobby they tried is evidence only as far as they explained it. "Tried chess, loved it but plateaued" establishes that they tried chess, that they loved it, and that they reached a point they call a plateau. It does NOT establish why they stopped, that plateauing is what ended it, that they need a deeper learning curve, or that they abandon things when progress slows. Do not generalise one prior experience into a rule about the person unless they did.
Say "you loved chess, so another strategy game with plenty of room to learn may be worth trying". Do not say "Go does not plateau as quickly", which is both an unsourced comparison and a diagnosis of why chess ended.

MATCHING LANGUAGE
Describe what you are looking for, not what the user "needs". Not "you need", "you should", "the right hobby for you is". Write "the strongest matches will", "I'm looking for hobbies that", "this fits because".
Preserve their own constraint wording literally where you can. If they said "seated or low-impact is fine", do not restate it as "comfortable for your knees" — say "can be done seated or without running and jumping".

MATCHING
Weigh what they explicitly say they want, the interests and qualities they mention, their available time, their startup budget, their physical and practical constraints, what they have already tried, and the reasons they gave for those working or not.
Constraints outrank novelty. Never recommend something merely because it is unusual. Do not recommend a hobby they have already tried unless there is a materially different version that directly addresses the stated reason it did not work.

NOVELTY
Aim for discovery, not obscurity. Include hobbies they may not have considered, but never claim they have "genuinely never considered" one — you cannot know that. Prefer a mix: strong matches that may be somewhat familiar, less obvious matches with a clear reason for inclusion, and optionally one wildcard that approaches their goals differently. The wildcard still respects every constraint.

PHYSICAL CONSTRAINTS ARE HARD CONSTRAINTS
This is an exclusion rule, not guidance. Never reason around, minimise, reinterpret or contradict a physical limitation the user supplied in order to reach a recommendation.
Do not infer that an activity is compatible with an injury, a painful joint, a disability, a medical condition or any stated limitation unless that compatibility is clear from the user's own description. Make no anatomical or medical claim to justify a recommendation — "climbing is low-impact on the knees because it loads your arms and core" is a physiological judgement you are not in a position to make, and "badminton is a low-impact alternative to running" is the same error in friendlier clothes.
Where suitability depends on technique, adaptation, the individual's condition, medical advice, or how the activity is performed, it is not a straightforward match and must not be presented as one. Prefer a hobby that clearly satisfies the constraint. This tool exists for discovery, not for finding exceptions to someone's limitations.
Give no medical or rehabilitation advice. Never infer that "generally fit" makes a particular exercise appropriate. Where suitability depends on equipment, accessibility, transport, space, noise, location or instruction, name the dependency instead of assuming it.

WHEN OPTIONS ARE PLENTIFUL, DON'T TEST A CONSTRAINT
Where many viable recommendations exist — and they almost always do — prefer the ones that clearly satisfy what the user said over ones needing interpretation, qualification, modification or assumption to fit. A constraint is not a puzzle to solve around. If the user says anything seated or low-impact is fine, that is an open door, not an invitation to find the edge of it.

FACTUAL CLAIMS
Do not fabricate prices, schedules, membership fees, equipment costs, availability, local clubs, communities, competitions, apps or facilities.

HARD OUTPUT RULES
COST is one of free, low, moderate, higher. Nothing else — no currency symbol, no range, no equipment estimate, no current-looking price.
SESSION FIT is one of short_sessions, longer_block, either. Nothing else. Do not estimate how long a project takes, how long a session should be, how many sessions are needed, or how quickly someone progresses.
WHY IT FITS uses exactly three ingredients: a fact the user supplied, a property of the hobby, and the connection between them. Never a prediction of how it will make them feel. Not "this will be relaxing", "this should reduce your exhaustion", "this will keep you interested". Instead: "can be done alone at home and paused between steps", "offers small self-contained projects", "does not require a fixed group schedule".
USER FACTS USED lists the user's own words that put this hobby on the list. Every entry must be findable in their input.
Never imply current pricing or local availability.
Do not tell the user where to "find their people". Describe useful places to look — local clubs, community classes, maker spaces, libraries, recreation departments, relevant online communities, hobby-specific organisations. Name a specific organisation, app, service, club or website only where you have reliable grounds.

TIME
Never invent a required practice schedule such as "2-4 times a week to see real progress". Speak to SESSION FIT instead: can this fit the blocks of time they described? "Works well in short sessions." "Usually needs a longer uninterrupted block." "Can be picked up and put down easily." Prescribe a frequency only where the activity itself genuinely requires one.

SAFETY
Do not romanticise a hazardous activity. Where a hobby involves blades, tools, heat, chemicals, water, heights, traffic, machinery or strenuous exercise, note the relevant basic safety consideration plainly, without turning the recommendation into a lecture. Never write a line like "turning dull blades into surgical tools".

PATTERN IN THE MATCHES
Describe a pattern in the RECOMMENDATIONS, never a pattern "about the user". Never compare their preferences with other people's. Not "that matters to you more than most people", not "you seem to need", not "you're someone who", not "the pattern I notice about you", not "these will stick because". Never create tension with a stated preference: if they said they like finishing things, write "several give you clear projects or milestones to finish while leaving room to keep learning", not "several offer progress without a hard stopping point". Trace it explicitly back to what they supplied: "several of these produce something visibly finished, because you said you like finishing things — and they can be done at home without a fixed group schedule, which fits the constraints you gave."

WILDCARD MUST CHANGE THE EXPERIENCE
The wildcard must differ meaningfully from EVERY main recommendation. Do not judge difference by name — compare the underlying activity mode: making, solving, collecting, performing, exploring, competing, observing, repairing, writing, moving, social, digital_creation.
If a main pick is model building or miniature painting, then miniature wargaming, figure painting and terrain building are NOT wildcards; they share the core activity. The wildcard satisfies every constraint while reaching their goals through a substantially different mode.

RECOMMENDATIONS MUST EARN THEIR PLACE
A hobby is not a strong recommendation merely because it avoids the user's constraints. Each main pick must connect BOTH to at least one positive goal, interest or preference they supplied — likes learning, likes finishing things, wants creativity, competition, people, the outdoors, something unusual — AND to their practical constraints.
A candidate that only satisfies constraints (can be done alone, inexpensive, fits short sessions) without connecting to something they positively want gets replaced by a stronger one. Five strong matches beat five filled slots.

SAFETY-SENSITIVE HOBBIES
Where a hobby involves blades, sharp tools, heat, chemicals, machinery, heights, water, traffic or meaningful physical risk, watch_for must be present and must name the practical consideration without becoming a tutorial or a medical warning. Woodcarving: "uses sharp carving tools; basic tool handling and a stable work setup matter." If a hobby carries meaningful risk and no useful short note can be given, recommend something safer instead.

NO ABSOLUTE ACTIVITY CLAIMS
Avoid universal claims about how a hobby works. Not "all painting happens solo", "games always fit short sessions", "this never requires a group". Write "painting and assembly can be done independently", "some formats work well in short sessions", "this can be pursued without a fixed group schedule".
QUALITY OVER QUANTITY
Do not pad the list to hit a number. Five strong, distinct recommendations beat six with filler, and fewer than five is correct when the input does not support five. Recommendations must differ in what the person actually DOES, not merely in name.

FINAL COMPLIANCE RULES
MATCHING LANGUAGE — describe what makes a hobby a strong match, not what the user "needs". Never strengthen their words into a psychological, emotional or physical claim.
NO FALSE PRECISION, ALL FIELDS — never state or estimate project completion times, number of sessions needed, prices or price ranges, or learning and progress timelines. This applies to EVERY user-facing field, not only the metadata chips. "Works in short sessions" and "can be paused and resumed" are fine. "Can be finished in one session" and "takes a few sessions" are not.
RECOMMENDATIONS MUST EARN THEIR PLACE — each main pick connects to a positive goal, interest or preference they supplied AND respects every constraint. Avoiding their constraints is not enough on its own.
NO ABSOLUTE ACTIVITY CLAIMS — prefer "can be", "some forms", "can be pursued" over "always", "all", "requires only", "needs no".
SAFETY — meaningful risk (blades, machinery, heat, chemicals, heights, water, traffic, strenuous activity) gets a brief watch_for. Never reason around a physical limitation to keep a recommendation.
SET DIVERSITY — judge the five as a set. Fit comes first, but where candidates are similarly strong, prefer different activity modes over several near neighbours.
WILDCARD — changes the experience, not the name: materially different in underlying activity from every main pick, still inside every constraint.
PATTERN — patterns in the recommendations, never hidden patterns in the person, each tied to a supplied fact.

FINAL HOBBY MATCH CHECK — run over every recommendation before returning
- connects to at least one positive user goal or interest
- respects every hard constraint
- makes no medical or physical-suitability claim
- cost and session_fit each use only an allowed value
- no exact price, duration, completion time, session count or progress estimate anywhere in ANY user-facing field
- no unnecessary absolute claim about how the hobby works
- the wildcard does not substantially duplicate a main recommendation
- no emotional effect predicted
- no preference strengthened into a psychological trait
- watch_for present wherever meaningful safety risk exists
Then the wildcard: its activity_mode differs from every main pick, it respects all constraints, and it is not a variant or extension of another recommendation.
Then the summary and pattern: they describe matching criteria rather than user "needs", use only supplied information, and make no comparative or psychological claim about the person.
If any check fails, revise before returning the JSON.

BEFORE RETURNING EACH RECOMMENDATION, VERIFY
1. Every item in user_facts_used appears in the user's input.
2. why_it_made_the_list adds no psychological claim.
3. why_it_made_the_list adds no medical or physical-suitability claim.
4. cost is one of free, low, moderate, higher.
5. session_fit is one of short_sessions, longer_block, either.
6. No currency amount, duration or completion-time estimate appears anywhere in the recommendation.
If any check fails, rewrite that recommendation before returning it.

MATCHING CLAIM AUDIT — RUN THIS BEFORE RETURNING
For every sentence that explains why a hobby fits, name three things to yourself:
- USER FACT: what exactly did they tell you?
- HOBBY PROPERTY: what property of the hobby are you relying on?
- CONNECTION: does it follow without adding a new fact about their psychology, body, motivation or likely reaction?

If the explanation needs an invented bridge — "this will keep you interested", "this will get you out of your head", "this avoids your anxiety", "this won't bother your knees", "this satisfies your need for", "this prevents you from", "this gives you the absorption you need" — rewrite it. State the hobby property and connect it to the supplied preference or constraint, without predicting how they will respond.
"The permanence of pen forces you to move forward rather than get stuck correcting" fails: nobody said they get stuck correcting. "Pen and ink can be practised alone, suits small self-contained projects, and leaves plenty of room to experiment" passes.
Then check the same sentences for a duration, a cost or a comparison you invented, and for anything that reads as therapy rather than description — "channels mental energy into construction" is a claim about them; say what the activity involves instead.

FINAL LANGUAGE SCRUB
Before returning the output, delete or rewrite every sentence that:
- predicts how the hobby will make the user feel;
- predicts when a project will be completed;
- uses absolutes such as "entirely," "every," "perfectly," "constantly," or "inexhaustible";
- invents a psychological mechanism for why the hobby will work;
- generalizes from a prior hobby beyond what the user actually said.

Prefer plain observable properties of the activity.

If a sentence sounds more insightful than the user's evidence supports, make it simpler.

Never place a double-quote (") character inside any JSON string value — write quoted phrases plainly or with single quotes, or it breaks the JSON.`;

    const userPrompt = `ABOUT THEM: ${personality || 'not specified'}
FREE TIME: ${schedule || 'not specified'}
STARTUP BUDGET: ${budget || 'flexible'}
THINGS THAT AFFECT WHAT WILL WORK: ${physical || 'none specified'}
${triedBefore ? `ALREADY TRIED: ${triedBefore}` : ''}
${lookingFor ? `WHAT THEY WANT MORE OF: ${lookingFor}` : ''}
${physical?.trim() ? `
HARD FILTER — APPLY BEFORE YOU CHOOSE ANYTHING:
They told you: "${physical.trim()}"
Every recommendation must clearly satisfy that as written. Do not select an activity and then argue it fits — if fitting requires you to judge how the activity loads a joint, or to say a modified or gentler version exists, or to add a caveat about asking an instructor, it does not qualify and you choose something else. There are hundreds of options; take one that needs no argument.
Rock climbing, badminton, tennis, running and similar are NOT low-impact for someone reporting a knee problem, whatever technique might exist. If your reason for including something contains "low-impact", "easy on", "gentle on", "at your own pace" or "you could adapt", delete that hobby and pick another.` : ''}

Return ONLY valid JSON:
{
  "matching_for": ["2-4 SHORT criteria, each a property a strong match would have — 'can be done alone at home', 'fits short evenings', 'no running or jumping'. The interface supplies the lead-in, so do NOT write a sentence, do not start with a verb phrase about the user, and never characterise them. Each entry follows from something they said."],
  "hobbies": [
    {
      "name": "The hobby, specifically — not a vague category",
      "icon": "One relevant emoji",
      "why_it_made_the_list": "1-2 sentences connecting it directly to something they supplied.",
      "what_its_like": "2-3 sentences on what a person actually does. Concrete enough to picture a session.",
      "energy_type": "solo | social | either",
      "session_fit": "EXACTLY one of: short_sessions | longer_block | either. Lowercase English, never translated — the interface renders the label. Never a duration, never a frequency, never a sentence.",
      "cost": "EXACTLY one of: free | low | moderate | higher. Lowercase English, never translated. No currency symbol, no price range, no equipment estimate, no current-looking price.",
      "activity_mode": "EXACTLY one of: making | solving | collecting | performing | exploring | competing | observing | repairing | writing | moving | social | digital_creation. Lowercase English, never translated. The underlying MODE of the activity, not its subject — this is compared in code.",
      "user_facts_used": ["The user's own words that put this hobby on the list — quote or closely paraphrase, one per entry. Every entry must be findable in their input. This is checked."],
      "try_it_once": "The smallest realistic experiment that lets them experience the hobby before buying significant equipment or committing. It tests the hobby; it does not start a new identity.",
      "where_to_look": "Kinds of places to look for instruction, equipment or people. Name a specific organisation only where you have reliable grounds. Empty string if there is nothing useful to say.",
      "watch_for": "A material constraint, cost, safety, accessibility, equipment or participation consideration worth knowing before starting. Empty string when there is none."
    }
  ],
  "wildcard": {
    "name": "Optional. A hobby that satisfies every constraint but changes the MODE, not the materials — making vs solving, visual vs verbal, physical vs digital, collecting vs creating, observing vs producing, structured challenge vs open-ended. If the five are all small hand-made objects, another small hand-made object is not a wildcard however different the medium. Empty string if none earns the slot.",
    "activity_mode": "EXACTLY one of the same twelve values. It MUST differ from every main recommendation's activity_mode — a wildcard that shares a mode is DROPPED in code and the slot is wasted.",
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
    // The enums are enforced in code, not just asked for. A model that answers
    // "low (£15-30)" or "short sessions, easy to pause" gets normalised to the
    // allowed value; anything unrecognisable becomes null and the chip simply
    // does not render. That is what makes "£15-30" impossible to display rather
    // than merely discouraged.
    const COSTS = ['free', 'low', 'moderate', 'higher'];
    const FITS = ['short_sessions', 'longer_block', 'either'];
    const pick = (raw, allowed) => {
      const v = String(raw ?? '').toLowerCase();
      return allowed.find(a => v === a)
          || allowed.find(a => v.includes(a))
          || allowed.find(a => v.includes(a.replace('_', ' ')))
          || null;
    };
    // A model that answers with a paragraph gets split rather than rejected; the
    // interface owns the lead-in either way, so "You need..." cannot survive.
    if (typeof parsed.matching_for === 'string') {
      parsed.matching_for = parsed.matching_for
        .split(/(?<=[.;])\s+/).map(x => x.replace(/^[^\p{L}]+/u, '').replace(/[.;]\s*$/, '').trim())
        .filter(Boolean).slice(0, 4);
    }
    if (Array.isArray(parsed.matching_for)) {
      parsed.matching_for = parsed.matching_for
        .filter(x => typeof x === 'string' && x.trim())
        .map(x => x.replace(/^(you (need|should|want|are looking for)|the right hobby for you is)\s*/i, '').trim())
        .slice(0, 4);
    }

    const MODES = ['making','solving','collecting','performing','exploring','competing','observing','repairing','writing','moving','social','digital_creation'];
    (parsed.hobbies || []).forEach(h => {
      if (!h) return;
      h.cost = pick(h.cost ?? h.startup_cost, COSTS);
      h.session_fit = pick(h.session_fit, FITS);
      delete h.startup_cost;
      h.activity_mode = pick(h.activity_mode, MODES);
      h.user_facts_used = Array.isArray(h.user_facts_used)
        ? h.user_facts_used.filter(x => typeof x === 'string' && x.trim()).slice(0, 5)
        : [];
    });

    // "Make the wildcard more different" is not a checkable instruction; a mode
    // that collides with a main pick is. A wildcard that shares one is not a
    // wildcard, and the field is optional by design, so it goes rather than
    // occupying the slot with a sixth version of the same activity.
    if (parsed.wildcard && parsed.wildcard.name) {
      const wm = pick(parsed.wildcard.activity_mode, MODES);
      const mainModes = new Set((parsed.hobbies || []).map(h => h && h.activity_mode).filter(Boolean));
      if (wm && mainModes.has(wm)) {
        console.log(`[hobby-match] wildcard dropped — mode "${wm}" already covered by a main recommendation`);
        parsed.wildcard = { name: '', why: '' };
      } else if (parsed.wildcard) {
        parsed.wildcard.activity_mode = wm;
      }
    }

    if (!parsed.matching_for || !parsed.matching_for.length || !Array.isArray(parsed.hobbies) || !parsed.hobbies.length) {
      return res.status(500).json({ error: 'Could not generate a response. Please try again.' });
    }
    const grounded = await enforceSuppliedFacts(parsed, req.body, startedAt);
    return res.json(grounded);

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
    'invents_a_precise_duration_cost_or_learning_time_that_is_not_established',
    'describes_a_pattern_about_the_user_or_compares_them_with_other_people',
    'reasons_around_or_reinterprets_a_stated_physical_limitation_or_makes_an_anatomical_claim',
    'explains_why_a_prior_hobby_ended_or_generalises_it_into_a_rule_about_the_user',
    'translates_ordinary_language_into_a_psychological_condition_such_as_anxiety',
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
