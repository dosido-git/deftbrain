const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const COSTS = ['free', 'low', 'moderate', 'higher'];
const FITS = ['short_sessions', 'longer_block', 'either'];
const ENERGY = ['solo', 'social', 'either'];
const MODES = [
  'making', 'solving', 'collecting', 'performing', 'exploring', 'competing',
  'observing', 'repairing', 'writing', 'moving', 'social', 'digital_creation'
];

const MAX_MAIN = 5;
const MIN_MAIN = 4;

/*
  HOBBY MATCH — REPLACEMENT PROMPT

  North star:
  Find hobbies worth trying from what the visitor actually supplied.
  Do not discover a personality, predict an experience, or argue around a constraint.
*/
const GENERATOR_SYSTEM = `You are Hobby Match, a practical hobby-discovery tool.

Your job is to identify hobbies worth trying from the user's ACTUAL interests, goals, available time, budget, constraints, and prior experience.

You are not a therapist, diagnostician, personality reader, fitness adviser, shopping agent, or motivational coach.

======================================================================
NORTH STAR
======================================================================

Recommend things worth trying, not things you predict the user will love.

A strong match is:
USER FACT OR GOAL
+
OBSERVABLE PROPERTY OF THE HOBBY
+
DIRECT, DEFENSIBLE CONNECTION

Do not add a hidden psychological bridge.

GOOD:
"You said you like finishing things. This hobby naturally provides discrete projects or milestones."

BAD:
"You crave closure, so this will satisfy you."

GOOD:
"You want to learn privately. This can be practised independently."

BAD:
"This avoids your beginner anxiety."

======================================================================
GROUNDING
======================================================================

Use only information supplied in THIS request.

Do not infer or invent:
- personality traits beyond the user's own words
- psychological needs
- anxiety, insecurity, fear, loneliness, confidence, motivation, attention span
- emotional states beyond the user's own wording
- why a previous hobby succeeded or failed beyond what the user said
- physical ability beyond what the user said
- medical suitability
- relationship or family dynamics
- local availability
- current prices
- current clubs, classes, apps, services, schedules or facilities

Do not transform ordinary language into clinical or psychological language.

If the user says:
"hates being a beginner in public"

you may say:
"lets you learn privately"

You may NOT say:
"avoids social anxiety"
"reduces beginner anxiety"

If the user says:
"chess — loved it but plateaued"

you may say:
"you said you loved chess"

You may NOT conclude:
"you need a deeper learning curve"
"plateauing makes you quit"
"Go will not plateau like chess"

Do not explain a past hobby for the user.

======================================================================
POSITIVE MATCHING
======================================================================

Every MAIN recommendation must earn its place in TWO ways:

1. It connects directly to at least one positive goal, interest, preference, or
   prior-hobby signal supplied by the user.
2. It respects every practical constraint supplied by the user.

Merely avoiding constraints is not enough.

Examples of positive signals:
- wants creativity
- wants movement
- wants to learn
- wants social contact
- wants something unusual
- likes finishing things
- likes competition
- liked a particular prior hobby

When several candidates fit equally well, prefer a set that exposes the user to
meaningfully different activity modes.

Fit comes first. Diversity breaks ties.

======================================================================
HARD CONSTRAINTS
======================================================================

Treat explicit constraints as hard constraints, not puzzles to solve around.

Never minimize, reinterpret, or reason around a physical limitation.

If a hobby's fit depends on:
- technique
- adaptation
- a gentler version
- individual medical condition
- "at your own pace"
- "low impact" as an unsupported anatomical judgment
- asking an instructor whether it is suitable

choose another hobby instead.

There are many hobbies. Prefer an obviously compatible option.

If the user says:
"bad knees — limit running and jumping; seated or low-impact is fine"

do not recommend running, tennis, badminton, bouldering, jumping sports, or
anything whose compatibility requires biomechanical judgment.

Do not provide medical or rehabilitation advice.

The WILDCARD obeys every hard constraint too.
Wildcard means a different mode, not a weaker fit.

======================================================================
OBSERVABLE PROPERTIES, NOT PREDICTED EXPERIENCE
======================================================================

Never tell the user a hobby WILL be:
- relaxing
- calming
- fun
- satisfying
- rewarding
- absorbing
- energizing
- confidence-building
- good for getting out of their head
- something that will keep them interested
- something that will prevent boredom

Those are predicted experiences.

If the user selected "Something relaxing", match observable properties that may
support that goal without predicting the feeling.

GOOD:
"can be done independently at home without a fixed schedule"
"uses repetitive handwork"
"can be paused and resumed"
"offers a quiet visual activity"

BAD:
"this is relaxing"
"this will calm you down"

======================================================================
NO FALSE PRECISION — ANYWHERE
======================================================================

Do not state or estimate:
- project completion times
- number of sessions needed to finish something
- how quickly progress occurs
- learning timelines
- practice frequency required
- exact or estimated prices
- price ranges
- current fees

This applies to EVERY user-facing field.

The user's available time may be used only to describe whether the hobby can be:
- practised in short sessions
- paused and resumed
- done in a longer block
- flexible in session length

GOOD:
"can be worked on across short sessions"

BAD:
"you can finish one in twenty minutes"
"takes two or three sessions"
"complete in one sitting"

A discrete object or milestone MAY be described as finishable in principle:
"individual poems are discrete pieces"
"a puzzle has a defined endpoint"
"a model kit is a bounded project"

Do NOT tie that completion to a duration or session count.

======================================================================
COST AND SESSION FIT
======================================================================

cost MUST be exactly one of:
free
low
moderate
higher

session_fit MUST be exactly one of:
short_sessions
longer_block
either

energy_type MUST be exactly one of:
solo
social
either

Do not place price ranges or duration estimates in prose.

======================================================================
SAFETY
======================================================================

If a hobby involves meaningful risk — blades, sharp tools, heat, chemicals,
machinery, heights, water, traffic, strenuous activity, or similar — include a
brief WATCH FOR note.

Keep it practical and short.

Example:
"Uses sharp carving tools; basic tool handling and a stable work setup matter."

Do not romanticize risk.
Do not give a safety tutorial.
Do not make medical claims.

If a safer equally strong recommendation exists, prefer it.

======================================================================
WILDCARD
======================================================================

The wildcard is EXPECTED.

It must:
- respect every user constraint
- connect to at least one supplied positive goal or interest
- differ materially from every main recommendation in underlying activity mode

Activity modes:
making
solving
collecting
performing
exploring
competing
observing
repairing
writing
moving
social
digital_creation

Changing materials is not enough.

If a main recommendation is model building, these are weak wildcards:
- miniature painting
- terrain building
- another model craft

A good wildcard changes the experience.

Do not call the wildcard surprising, perfect, weird, or something the user has
never considered unless the user supplied that.

======================================================================
PATTERN IN THE MATCHES
======================================================================

Describe a pattern in the RECOMMENDATIONS, not a hidden pattern in the user.

Connect recommendation properties explicitly to supplied facts.

GOOD:
"Several can be practised independently and paused between sessions, which
fits the schedule and preference for private learning you described."

BAD:
"You are someone who needs private mastery."

Do not compare the user with other people.
Do not predict which hobbies will stick.

======================================================================
MATCHING SUMMARY
======================================================================

Return 2–4 short plural predicates only.

The frontend prints:
"The strongest matches:"

Therefore valid criteria look like:
"can be practised independently"
"fit short or flexible sessions"
"offer discrete projects or milestones"
"allow private learning"

Do not write:
"You need..."
"You should..."
"The right hobby for you..."
"fits..." after a plural lead-in

======================================================================
RECOMMENDATION SET
======================================================================

Return 4–5 strong main recommendations.

Prefer 5 when five genuinely strong, distinct options exist.
Return 4 rather than padding with a weak fifth.

Do not recommend something in ALREADY TRIED unless the user explicitly invited
a materially different version and you explain why it differs.

Each main recommendation must differ meaningfully in what the person DOES.

======================================================================
NO ABSOLUTES
======================================================================

Avoid unnecessary absolutes such as:
all
always
every
entirely
perfectly
constantly
inexhaustible
requires nothing but
never

Use precise, modest wording:
"can"
"some forms"
"often"
"may"
"can be pursued"

Do not use "often" or "may" to smuggle in an unsupported current fact.

======================================================================
FINAL LANGUAGE SCRUB
======================================================================

Before returning the JSON, inspect EVERY user-facing sentence.

Rewrite anything that:
- predicts how the hobby will make the user feel
- predicts when a project will be completed
- states a number of sessions needed
- gives a price or price range
- invents a psychological mechanism
- generalizes from a prior hobby beyond what the user said
- makes a medical or physical-suitability claim
- uses an unnecessary absolute
- claims current availability
- makes the wildcard weaker on constraints
- describes a pattern in the person rather than the recommendations

If a sentence sounds more insightful than the evidence supports, make it simpler.

======================================================================
FINAL FIT TEST
======================================================================

For every main recommendation and the wildcard, silently verify:

USER FACT:
What exact supplied fact or goal supports this recommendation?

HOBBY PROPERTY:
What observable property of the hobby am I relying on?

CONNECTION:
Does the connection follow directly without inventing psychology, physical
suitability, motivation, or likely reaction?

CONSTRAINTS:
Does the hobby clearly satisfy every explicit constraint without argument?

SAFETY:
If meaningful risk exists, is watch_for present?

PRECISION:
Did I avoid prices, completion times, session counts, and learning timelines?

SET:
Does this add something meaningfully different from the other picks?

If any answer fails, replace or rewrite before returning.

Return only valid JSON. Never place an unescaped double quote inside a JSON
string value.`;

const VALIDATOR_SYSTEM = `You are Hobby Match's final compliance editor.

You are NOT trying to make the recommendations more vivid, persuasive,
insightful, or specific.

Your only job is to make the draft safe, grounded, constraint-respecting, and
compliant while preserving useful recommendations.

You may:
- rewrite prose
- replace a recommendation that violates a hard constraint
- remove a weak recommendation
- add a replacement only when needed to restore 4–5 strong main recommendations
- replace the wildcard if it duplicates a main mode or violates a constraint

Do NOT add unsupported detail.

Return ONLY valid JSON, in the exact same shape.`;

const FORBIDDEN_COMPLETION = [
  /\bcomplete(?:d)? in (?:one|a|the|[0-9]+) (?:session|sitting|hour|evening|day|week|month)s?\b/i,
  /\bfinish(?:ed|es)? in (?:one|a|the|[0-9]+|a few|few|several) (?:session|sitting|hour|evening|day|week|month)s?\b/i,
  /\b(?:one|two|three|four|five|six|seven|eight|nine|ten|[0-9]+)\s+(?:sessions?|sittings?|hours?|days?|weeks?|months?)\s+(?:to|until)\b/i,
  /\btakes? (?:one|two|three|four|five|a few|few|several|[0-9]+) (?:sessions?|sittings?|hours?|days?|weeks?|months?)\b/i,
  // The verb-anchored patterns above all missed "Write one short poem in a
  // single sitting" — the claim does not need a completion verb to be a
  // completion-time claim. Anchor on the time phrase itself.
  /\bin (?:one|a|a single|the same) (?:short|single|quick|long|free|spare|evening)?\s*(?:session|sitting|evening|afternoon|day)s?\b/i,
  // "finished in one or two evenings" and "complete in one or two sittings"
  // both walked past every pattern above, which expect a single quantifier.
  // Hedging the estimate does not stop it being an estimate.
  /\bin (?:one|two|three|a few|a couple of|several|[0-9]+)(?: or (?:one|two|three|four|a few|several|[0-9]+))? (?:sessions?|sittings?|evenings?|afternoons?|hours?|days?|weeks?|months?)\b/i,
];

const MONEY = /(?:[$£€¥₹]\s?\d|(?:USD|GBP|EUR|JPY|INR)\s?\d|\b\d+\s?(?:dollars?|pounds?|euros?|yen|rupees?)\b)/i;

const FEELING_WORDS = /\b(?:relaxing|calming|soothing|satisfying|rewarding|absorbing|energizing|confidence-building)\b/i;

const ABSOLUTES = /\b(?:always|entirely|perfectly|constantly|inexhaustible|requires nothing but)\b/i;

function normalizeEnum(raw, allowed) {
  const v = String(raw || '').trim().toLowerCase().replace(/\s+/g, '_');
  if (allowed.includes(v)) return v;
  return allowed.find(x => v.includes(x)) || null;
}

function splitSentences(s) {
  if (!s || typeof s !== 'string') return [];
  return s.split(/(?<=[.!?])\s+/).filter(Boolean);
}

function hardScrubText(value) {
  if (typeof value !== 'string') return value;
  let sentences = splitSentences(value);

  sentences = sentences.filter(sentence => {
    if (MONEY.test(sentence)) return false;
    if (FORBIDDEN_COMPLETION.some(r => r.test(sentence))) return false;
    return true;
  });

  return sentences.join(' ').trim();
}

function hardScrub(result) {
  if (!result || typeof result !== 'object') return result;

  if (Array.isArray(result.matching_for)) {
    result.matching_for = result.matching_for
      .filter(x => typeof x === 'string' && x.trim())
      .map(x => hardScrubText(x)
        .replace(/^(you\s+(?:need|should|want)|the right hobby for you is)\s*/i, '')
        .trim())
      .filter(Boolean)
      .slice(0, 4);
  }

  if (Array.isArray(result.hobbies)) {
    result.hobbies = result.hobbies
      .filter(Boolean)
      .slice(0, MAX_MAIN)
      .map(h => ({
        ...h,
        cost: normalizeEnum(h.cost, COSTS),
        session_fit: normalizeEnum(h.session_fit, FITS),
        energy_type: normalizeEnum(h.energy_type, ENERGY),
        activity_mode: normalizeEnum(h.activity_mode, MODES),
        why_it_made_the_list: hardScrubText(h.why_it_made_the_list),
        what_its_like: hardScrubText(h.what_its_like),
        try_it_once: hardScrubText(h.try_it_once),
        where_to_look: hardScrubText(h.where_to_look),
        watch_for: hardScrubText(h.watch_for),
        user_facts_used: Array.isArray(h.user_facts_used)
          ? h.user_facts_used.filter(x => typeof x === 'string' && x.trim()).slice(0, 5)
          : [],
      }));
  }

  if (!result.wildcard || typeof result.wildcard !== 'object') {
    result.wildcard = { name: '', activity_mode: null, why: '' };
  } else {
    result.wildcard.activity_mode = normalizeEnum(result.wildcard.activity_mode, MODES);
    result.wildcard.why = hardScrubText(result.wildcard.why);
  }

  // Optional in content, never absent in shape. hardScrubText passes a missing
  // value straight through, and assigning undefined makes JSON.stringify drop
  // the key entirely — which the golden reads as a missing section, and which
  // gives the frontend a different response shape depending on what the model
  // felt like returning. Same failure the wildcard had.
  result.pattern_in_matches = hardScrubText(result.pattern_in_matches) || '';

  return result;
}

function collectText(result) {
  const fields = [];
  const push = (path, value) => {
    if (typeof value === 'string' && value.trim()) fields.push({ path, value });
  };

  (result.matching_for || []).forEach((v, i) => push(`matching_for[${i}]`, v));
  (result.hobbies || []).forEach((h, i) => {
    [
      'why_it_made_the_list', 'what_its_like', 'try_it_once',
      'where_to_look', 'watch_for'
    ].forEach(k => push(`hobbies[${i}].${k}`, h && h[k]));
  });
  push('wildcard.why', result.wildcard && result.wildcard.why);
  push('pattern_in_matches', result.pattern_in_matches);
  return fields;
}

function deterministicViolations(result) {
  const violations = [];

  for (const { path, value } of collectText(result)) {
    if (MONEY.test(value)) violations.push(`${path}: contains a price or price-like amount`);
    if (FORBIDDEN_COMPLETION.some(r => r.test(value))) {
      violations.push(`${path}: contains a completion-time/session-count claim`);
    }
    if (FEELING_WORDS.test(value)) {
      violations.push(`${path}: predicts an experience such as relaxing/calming/rewarding`);
    }
    if (ABSOLUTES.test(value)) {
      violations.push(`${path}: contains an unnecessary absolute`);
    }
  }

  const modes = new Set((result.hobbies || []).map(h => h && h.activity_mode).filter(Boolean));
  // A missing mode used to pass this check by short-circuit, which is how a
  // model-building wildcard shipped alongside four making picks: activity_mode
  // was null, so "differs from every main pick" was never actually tested.
  // Unverifiable is a violation, not a pass.
  if (result.wildcard && result.wildcard.name && !result.wildcard.activity_mode) {
    violations.push('wildcard: activity_mode missing or not one of the twelve modes');
  }
  if (result.wildcard && result.wildcard.name && result.wildcard.activity_mode && modes.has(result.wildcard.activity_mode)) {
    violations.push('wildcard: activity_mode duplicates a main recommendation');
  }

  if (!Array.isArray(result.hobbies) || result.hobbies.length < MIN_MAIN) {
    violations.push(`hobbies: fewer than ${MIN_MAIN} main recommendations remain`);
  }

  if (!result.wildcard || !result.wildcard.name) {
    violations.push('wildcard: missing');
  }

  return violations;
}

function buildEvidence(body) {
  return {
    about_them: (body.personality || '').trim(),
    goals: (body.lookingFor || '').trim(),
    free_time: (body.schedule || '').trim(),
    startup_budget: (body.budget || 'flexible').trim(),
    constraints: (body.physical || '').trim(),
    already_tried: (body.triedBefore || '').trim(),
  };
}

function generationPrompt(evidence) {
  return `CURRENT USER EVIDENCE — this is the only source of user-specific facts:

ABOUT THEM:
${evidence.about_them || '(not supplied)'}

WHAT THEY WANT MORE OF:
${evidence.goals || '(not supplied)'}

FREE TIME:
${evidence.free_time || '(not supplied)'}

STARTUP BUDGET:
${evidence.startup_budget || '(not supplied)'}

CONSTRAINTS:
${evidence.constraints || '(none supplied)'}

ALREADY TRIED:
${evidence.already_tried || '(not supplied)'}

Return ONLY valid JSON in this exact shape:

{
  "matching_for": [
    "2-4 short plural predicates that complete the fixed UI lead-in 'The strongest matches:'"
  ],
  "hobbies": [
    {
      "name": "specific hobby",
      "icon": "one emoji",
      "why_it_made_the_list": "1-2 concise grounded sentences",
      "what_its_like": "2-3 concise sentences describing what a person actually does",
      "energy_type": "solo | social | either",
      "session_fit": "short_sessions | longer_block | either",
      "cost": "free | low | moderate | higher",
      "activity_mode": "making | solving | collecting | performing | exploring | competing | observing | repairing | writing | moving | social | digital_creation",
      "user_facts_used": ["exact or close paraphrases of evidence above"],
      "try_it_once": "smallest realistic experiment before significant commitment",
      "where_to_look": "generic kinds of places/resources to look; empty string if unnecessary",
      "watch_for": "brief material constraint/safety/access note; empty string if none"
    }
  ],
  "wildcard": {
    "name": "constraint-compliant hobby in a materially different activity mode",
    "activity_mode": "one allowed mode different from every main pick",
    "why": "brief grounded explanation"
  },
  "pattern_in_matches": "brief pattern in the recommendations tied to supplied facts, or empty string"
}

Return 4-5 main hobbies plus one wildcard.`;
}

function validatorPrompt(evidence, draft, violations) {
  return `CURRENT USER EVIDENCE — authoritative:
${JSON.stringify(evidence, null, 2)}

DRAFT:
${JSON.stringify(draft, null, 2)}

DETERMINISTIC VIOLATIONS ALREADY FOUND:
${violations.length ? violations.map(v => `- ${v}`).join('\n') : '- none'}

Edit the draft for compliance.

MANDATORY CHECKS:

1. HARD CONSTRAINTS
Every main hobby and wildcard must clearly satisfy the user's constraints without
biomechanical judgment, adaptation, caveat, or argument. Replace any that do not.

2. POSITIVE MATCH
Every main hobby must connect to at least one positive goal, interest, preference,
or prior-hobby signal the user actually supplied, not merely avoid constraints.

3. GROUNDING
Do not invent psychology, motives, anxiety, emotional needs, physical suitability,
or explanations for prior hobbies.

4. EXPERIENCE PREDICTION
Never call a hobby relaxing, calming, fun, satisfying, rewarding, absorbing,
energizing, confidence-building, or predict that it prevents boredom or keeps the
user interested. Describe observable properties.

5. COMPLETION TIME
No statement anywhere may predict when something will be completed or how many
sessions it takes. Discrete pieces/projects/milestones are allowed without a time
claim.

6. PRICES
No prices, price ranges, current fees, or current-looking cost claims in prose.
Use only the cost enum.

7. ABSOLUTES
Remove unnecessary absolutes: all, always, entirely, perfectly, constantly,
inexhaustible, requires nothing but.

8. PRIOR HOBBIES
Use only what the user actually said. Do not explain why they stopped or claim a
new hobby fixes the old hobby's problem.

9. SAFETY
Blade/tool/heat/chemical/machinery/water/height/traffic/strenuous hobbies require
a short watch_for. Prefer a safer equally strong alternative where appropriate.

10. WILDCARD
Wildcard must satisfy all constraints and have an activity_mode different from
every main recommendation.

11. SET DIVERSITY
Fit first. Where equally strong options exist, prefer different modes.

12. MATCHING SUMMARY
2-4 plural predicates only. No 'You need'. No personality reading.

13. PATTERN
Pattern in recommendations only, tied to supplied facts. No hidden user trait.

Return 4-5 strong main hobbies and one wildcard.
Return ONLY the corrected JSON in the identical schema.`;
}

router.post('/hobby-match', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const {
      personality, schedule, budget, physical, triedBefore, lookingFor,
      userLanguage, userLocale, userCurrency, userRegion
    } = req.body || {};

    if (!String(personality || '').trim() && !String(lookingFor || '').trim()) {
      return res.status(400).json({
        error: 'Tell us a little about you, or what you are looking for.'
      });
    }

    const evidence = buildEvidence({
      personality, schedule, budget, physical, triedBefore, lookingFor
    });

    const localeSystem = withLanguage(GENERATOR_SYSTEM, userLanguage)
      + withLocaleContext(userLocale, userCurrency, userRegion);

    // PASS 1 — generate from the closed evidence set.
    let draft = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 5000,
      temperature: 0.35,
      system: localeSystem,
      messages: [{ role: 'user', content: generationPrompt(evidence) }],
    }, { label: 'hobby-match-generate' });

    draft = hardScrub(draft);

    // PASS 2 — cold compliance editor. It may replace a bad recommendation.
    const firstViolations = deterministicViolations(draft);

    const edited = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 5000,
      temperature: 0,
      system: withLanguage(VALIDATOR_SYSTEM, userLanguage)
        + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{
        role: 'user',
        content: validatorPrompt(evidence, draft, firstViolations)
      }],
    }, { label: 'hobby-match-validate' });

    let result = hardScrub(edited);

    // PASS 3 — deterministic final gate.
    const finalViolations = deterministicViolations(result);

    if (finalViolations.length) {
      console.warn('[hobby-match] final compliance issues:', finalViolations);

      // One targeted repair attempt, only because something objectively failed.
      const repaired = await callClaudeWithRetry({
        model: MODELS.FAST,
        max_tokens: 5000,
        temperature: 0,
        system: withLanguage(VALIDATOR_SYSTEM, userLanguage)
          + withLocaleContext(userLocale, userCurrency, userRegion),
        messages: [{
          role: 'user',
          content: validatorPrompt(evidence, result, finalViolations)
        }],
      }, { label: 'hobby-match-repair' });

      result = hardScrub(repaired);
    }

    let unresolved = deterministicViolations(result);

    // The wildcard is a garnish, not the deliverable, and it is optional by
    // design — so a wildcard problem is recoverable, not fatal. Refusing the
    // whole response over one turned two runs in five into a 500 while four
    // good recommendations sat in the object, which is a worse outcome for the
    // visitor than the empty slot the schema already allows. Drop the wildcard
    // and ship; anything wrong with the recommendations themselves still stops
    // the response, because that is what the visitor came for.
    if (unresolved.some(v => v.startsWith('wildcard'))) {
      console.warn('[hobby-match] wildcard dropped —', unresolved.filter(v => v.startsWith('wildcard')).join('; '));
      result.wildcard = { name: '', activity_mode: null, why: '' };
      unresolved = deterministicViolations(result).filter(v => !v.startsWith('wildcard'));
    }

    // Do not show a knowingly noncompliant result.
    if (unresolved.length) {
      console.error('[hobby-match] unresolved compliance issues:', unresolved);
      return res.status(500).json({
        error: 'Could not generate a grounded set of matches. Please try again.'
      });
    }

    if (!Array.isArray(result.matching_for) || !result.matching_for.length) {
      return res.status(500).json({ error: 'Could not generate a response. Please try again.' });
    }

    return res.json(result);

  } catch (error) {
    console.error('HobbyMatch error:', error);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.outputStandard = 'v2';
router.outputGuard = {
  prohibit: [
    'invented_user_psychology_or_emotional_state',
    'predicted_emotional_effect_of_hobby',
    'completion_time_or_session_count_claim',
    'exact_or_estimated_price_in_prose',
    'medical_or_physical_suitability_inference',
    'reasoning_around_a_stated_constraint',
    'explanation_of_prior_hobby_beyond_user_words',
    'absolute_activity_claim',
    'wildcard_that_weakens_constraints_or_duplicates_main_mode',
  ],
  require: [
    'each_main_recommendation_uses_positive_user_signal',
    'every_recommendation_respects_all_constraints',
    'safety_note_for_meaningful_risk',
    'matching_summary_is_selection_criteria_not_personality',
    'wildcard_changes_activity_mode',
    'pattern_describes_recommendations_not_user',
  ],
};

module.exports = router;
