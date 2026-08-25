const express = require('express');
const router  = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { runOutputGuard } = require('../lib/outputGuard');

// The governing standard for this tool. One text, used to write the
// briefing and to check it, so the two cannot drift into paraphrases.
const STANDARD = `Describe common practices and useful tendencies without treating a country, city, religion, or population as culturally uniform. Distinguish strong conventions from variable practices. Avoid invented precision and categorical claims about how locals will react. Never claim insider knowledge. For legal, safety, payment, tipping, religious, or rapidly changing practical information, clearly qualify uncertainty and avoid presenting potentially changing information as guaranteed fact.`;

// The visitor supplied a destination and a few trip facts. Everything else is
// general knowledge about a place, which is exactly the kind of claim that
// slides into invented precision and into speaking for a whole population.
function suppliedFrom(body) {
  const { destination, region, homeCountry, duration, tripPurpose, context } = body;
  return `WHAT THE VISITOR SUPPLIED:
Destination: ${destination}
${region ? `Region or city: ${region}` : 'No specific region given.'}
${homeCountry ? `Travelling from: ${homeCountry}` : 'Home country not given.'}
${duration ? `Trip length: ${duration}` : ''}
${tripPurpose ? `Purpose: ${tripPurpose}` : ''}
${context ? `Their own context: ${context}` : ''}

THE STANDARD THIS BRIEFING IS HELD TO:
${STANDARD}

WHAT THIS TOOL IS. A practical briefing written from general knowledge about a place. Describing a common practice is the job — do NOT flag an ordinary etiquette observation for lacking a citation. What fails is claiming more than general knowledge supports.

SCOPE. These apply to EVERY field — the overview and the practical tips and the missteps exactly as much as the topic sections. A sweeping characterisation is not excused by being an introduction, and a tip is not excused by being practical.

The failures:
1. TREATING A POPULATION AS UNIFORM — a country, city, religion or population written as though everyone in it does the same thing, INCLUDING in the overview. A place given a set of adjectives ('direct, energetic and relationship-driven'), or values described as held across it ('warmth and humour are valued across social settings', 'respect for elders is expected'), fails. So does 'handshakes are standard' — and 'firm grip expected' — for a practice that varies by gender, religion, region and setting. 'Expected' and 'customary' are the same categorical claim as 'standard'. Practices belonging to a region, generation, setting or faith community must be attributed to it.
2. INVENTED PRECISION — a price, percentage, tipping rate, distance, duration or statistic presented as fact when it is a guess, and a local-language phrase or physical custom stated with confidence it does not warrant.
3. PREDICTING REACTIONS — 'they will be offended', 'locals will appreciate this', 'nobody will mind', 'people will understand', 'this damages trust', 'it breaks rapport', 'you will learn it quickly'. Also the softer forms, which are the same assertion with a gentler verb: 'is read as confident', 'this signals respect', 'is appreciated', 'traffic is understood', and any hedged effect — 'can damage the working relationship', 'may break rapport', 'could wound'. Hedging an effect claim does not make it an observation. 'Can come across as X' is the permitted ceiling and nothing may be appended to it. A convention can be described and a consequence can be phrased as how something CAN come across; how a person WILL respond cannot be known. In small_slips, a recovery ('a brief apology and asking for the pronunciation is a reasonable recovery') is right and a reassurance is not.
4. CLAIMED INSIDER STANDING — 'locals will tell you', 'what only residents know', 'the secret is'. The briefing has not been there. A tip resting on a named national stereotype — 'X time', 'X directness' — fails here too. So does the same claim stated plainly in any other field: 'Nigerians may arrive late without apology', 'Germans are direct', 'the French expect formality'. A nationality is not a behaviour, and moving the claim out of the tips into a section does not fix it. Attach the observation to a SETTING, never to a people.
5. VOLATILE INFORMATION STATED AS SETTLED — anything legal, financial, payment, tipping, religious, safety-related or subject to change, presented as guaranteed rather than as something to verify.`;
}

async function guardResult(parsed, body) {
  const fields = [];
  const walk = (val, path) => {
    if (typeof val === 'string' && val.trim().length > 15) fields.push([path, val]);
    else if (Array.isArray(val)) val.forEach((v, i) => walk(v, `${path}[${i}]`));
    else if (val && typeof val === 'object') Object.entries(val).forEach(([k, v]) => walk(v, path ? `${path}.${k}` : k));
  };
  walk(parsed, '');
  await runOutputGuard(parsed, {
    label: 'culture-briefing',
    fields,
    supplied: suppliedFrom(body),
    promise: 'A practical cultural briefing for this destination: what is commonly done, what tends to cause friction, what varies and with what, and what to verify locally rather than trust here.',
    guard: router.outputGuard,
    userLanguage: body.userLanguage,
    locale: withLocaleContext(body.userLocale, body.userCurrency, body.userRegion),
  });
}

// POST /api/culture-briefing/stream
// Generates a cultural intelligence briefing for a destination.
// Despite the /stream suffix (matching frontend callToolEndpoint path), this
// returns a standard JSON response — the name was set by the frontend author.
router.post('/culture-briefing', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  const { destination, tripPurpose, duration, homeCountry, region, context, userLanguage, userLocale, userCurrency, userRegion } = req.body;

  if (!destination || !destination.trim()) {
    return res.status(400).json({ error: 'destination is required' });
  }

  const purposeLabel = {
    tourism:  'tourism / leisure',
    business: 'business travel',
    family:   'family or social visit',
    living:   'moving or long-term living',
    study:    'study or research',
    remote:   'remote work',
  }[tripPurpose] || tripPurpose || 'general travel';

  const contextParts = [];
  if (homeCountry) contextParts.push(`Traveller is from: ${homeCountry}`);
  if (duration)    contextParts.push(`Trip length: ${duration}`);
  contextParts.push(`Purpose: ${purposeLabel}`);
  if (region && region.trim())   contextParts.push(`Specific region/city within ${destination.trim()}: ${region.trim()}`);
  if (context && context.trim())  contextParts.push(`Traveller's own context & constraints (HONOR these): ${context.trim()}`);

  const prompt = `Produce a practical cultural briefing for a traveller visiting ${destination.trim()}.

THE STANDARD THIS BRIEFING IS HELD TO:
${STANDARD}

You are writing from general knowledge, not from having been there. Say what is commonly done and what tends to help. Where a practice varies — by region, city, generation, setting, religion, or individual — say so and say what it varies with. Where something is legal, financial, religious, safety-related or liable to change, say plainly that it should be checked rather than trusted here.

Context:
${contextParts.join('\n')}

Return ONLY valid JSON in this exact shape — no markdown, no explanation:

{
  "overview": "2-3 sentences orienting a visitor. Do NOT characterise the place or its people with adjectives — no 'X is direct, energetic and relationship-driven', no 'warmth and humour are valued across social settings', no 'generosity and respect for elders are expected'. A city is not one temperament and its residents are not one set of values. Say instead what a visitor is likely to encounter and where practice differs: which settings are formal and which are not, what varies between business and social contexts, between generations, between religious communities, between this city and the rest of the country. If you cannot say something specific and bounded, say less.",
  "sections": [
    {
      "id": "greetings",
      "icon": "🤝",
      "title": "Greetings & introductions",
      "widely_observed": ["a practice common enough to be a safe default. Scope it — 'common in business settings', 'usual in first meetings' — and NEVER write 'is standard', 'is expected', 'is customary', 'is the norm', 'is appreciated', 'signals respect': those state a rule for a whole population or a reaction you cannot know. Describe the practice; let the reader infer."],
      "best_avoided": ["something that commonly causes friction or offence here, described by what it signals rather than by how people will react"],
      "varies": ["a practice that differs by region, city, generation, setting, religion or individual — name WHAT it varies with, not just that it does"],
      "check_locally": ["anything legal, financial, religious, safety-related or liable to have changed — say what to verify and why it moves"]
    },
    {
      "id": "taboos",
      "icon": "🚫",
      "title": "Taboos & common mistakes",
      "widely_observed": [],
      "best_avoided": [],
      "varies": [],
      "check_locally": []
    },
    {
      "id": "dining",
      "icon": "🍽️",
      "title": "Dining etiquette",
      "widely_observed": [],
      "best_avoided": [],
      "varies": [],
      "check_locally": []
    },
    {
      "id": "dress",
      "icon": "👗",
      "title": "Dress & appearance",
      "widely_observed": [],
      "best_avoided": [],
      "varies": [],
      "check_locally": []
    },
    {
      "id": "tipping",
      "icon": "💰",
      "title": "Tipping & payment",
      "widely_observed": [],
      "best_avoided": [],
      "varies": [],
      "check_locally": []
    },
    {
      "id": "business_etiquette",
      "icon": "💼",
      "title": "Business etiquette",
      "widely_observed": [],
      "best_avoided": [],
      "varies": [],
      "check_locally": []
    },
    {
      "id": "gift_giving",
      "icon": "🎁",
      "title": "Gifts & hospitality",
      "widely_observed": [],
      "best_avoided": [],
      "varies": [],
      "check_locally": []
    },
    {
      "id": "religion",
      "icon": "🕌",
      "title": "Religion & customs",
      "widely_observed": [],
      "best_avoided": [],
      "varies": [],
      "check_locally": []
    },
    {
      "id": "transport",
      "icon": "🚌",
      "title": "Getting around",
      "widely_observed": [],
      "best_avoided": [],
      "varies": [],
      "check_locally": []
    },
    {
      "id": "safety",
      "icon": "🛡️",
      "title": "Safety & scams",
      "widely_observed": [],
      "best_avoided": [],
      "varies": [],
      "check_locally": []
    },
    {
      "id": "phrases",
      "icon": "💬",
      "title": "Key phrases & attitude",
      "widely_observed": [],
      "best_avoided": [],
      "varies": [],
      "check_locally": []
    }
  ],
  "practical_tips": [
    "A specific, practical thing that tends to help, held to the same discipline as everything else: no claim about what a whole population does, no prediction of how anyone will react, no invented figure. Never build a tip on a named cultural stereotype — no advice that rests on 'X time', 'X directness', 'X hospitality' as a trait of a nationality. If a tip only makes sense because of a stereotype, drop it.",
    "Another",
    "Another"
  ],
  "missteps": {
    "small_slips": ["a minor slip, described with a RECOVERY rather than a reaction. Write 'a brief apology and asking for the correct pronunciation is a reasonable recovery'. Never 'people will understand', 'nobody minds', 'they recover from this easily', 'you will pick it up quickly' — those predict other people and predict the visitor."],
    "higher_stakes": ["a misstep that tends to matter more, described by HOW IT CAN COME ACROSS rather than by what it does to anyone. Write 'can come across as disrespectful', 'can read as rejecting hospitality'. Never 'this damages trust', 'which wounds', 'it breaks rapport' — those assert an effect on a person you know nothing about."]
  },
  "confidence": "high | medium | low — YOUR confidence in the specifics of THIS briefing; use 'low' for places you have thin or uncertain knowledge of"
}

Rules:
- Every string must be specific to ${destination.trim()} — no generic travel advice
- Frame advice RELATIVE to the traveler's home country (${homeCountry || 'their home country'}) — emphasize where norms DIFFER from home, not just absolute rules
- Where an etiquette rule has a specific named or local-language concept, NAME it with a brief gloss (e.g. the Japanese business-card ritual = meishi) — but ONLY include a local-language word or phrase when you are CERTAIN of its meaning and usage; if not certain, describe the concept in English instead. A wrong phrase confidently delivered is worse than no phrase. Same for physical customs (which escalator side, which hand): state them only if certain, and never invert regional variations.
- Use realistic, specific numbers — never inflate quantities, and never invent a figure to sound precise. No invented prices, percentages, distances, times, or tipping rates. If a number moves or you are unsure of it, put the item in check_locally and say what to verify
- NO NATIONAL OR ETHNIC TRAIT CLAIMS, in any field. Not 'Nigerians may arrive late', not 'Germans are direct', not 'the French expect', not 'X time' as a concept. A nationality is not a behaviour. If lateness is common in a particular setting, say that about the SETTING — 'meetings in some Lagos offices start later than scheduled' — never about a people. This holds in the overview, the sections, the tips and the missteps alike, and restating a stereotype as a neutral-sounding observation does not launder it
- Never claim insider standing. No 'locals will tell you', 'what only residents know', 'the secret is'. You are writing from general knowledge about a place you have not been
- THE VARIABILITY AND REACTION RULES GOVERN EVERY FIELD, not only the topic sections. overview, practical_tips, small_slips and higher_stakes are held to exactly the same standard as widely_observed and varies. A sweeping sentence is not more acceptable for being in the introduction
- 'Standard', 'expected', 'always', 'universally', 'everyone', 'the norm', 'is customary' are all claims about a whole population. A greeting practice varies by gender, religion, region, age and setting even where it is common — say 'common in business settings' and name what shifts it, rather than 'handshakes are standard'
- Never state categorically how people will react. 'This is considered rude' describes a convention; 'they will be offended', 'locals will appreciate it', 'nobody will mind' predicts individuals. So does the softer form — 'is read as confident', 'signals respect to them', 'comes across to locals as' — when it asserts what a specific reader takes from it. Write the convention and, where a consequence is worth stating, write how something CAN come across — and stop there. 'Can come across as disrespect for hierarchy' is right; 'can come across as disrespect AND can damage the working relationship' is not, because the second half asserts an effect on a relationship you know nothing about. A hedge does not license the claim: 'can damage trust', 'may break rapport', 'could wound' are the same assertion with a softer verb. Likewise 'this signals respect', 'traffic is understood', 'is appreciated' assert what a reader takes from an act; write what the act is, not what it earns
- Treat no country, city, religion or population as uniform. Where a practice belongs to a region, a generation, a setting or a faith community rather than to everyone, say which
- If the traveller context includes constraints (dietary, religious, alcohol, accessibility, travelling with children), TAILOR the relevant sections to them (e.g. vegetarian to dining; non-drinker to business-drinking customs)
- gift_giving: leave its arrays [] if gift-giving is not commonly significant for this destination/purpose
- missteps: separate the slips that usually carry little consequence for a visitor from the ones that tend to matter more. Describe what a misstep signals or interrupts — not how a person or a population will react to it
- confidence: be honest — use 'low' for less-documented destinations rather than inventing specifics
- Any array may be empty [] where you have nothing solid to put in it. An empty 'varies' means you are not aware of meaningful variation — not that there is none. Never pad an array to fill it
- Keep each widely_observed/best_avoided/varies/check_locally array to AT MOST 3 items, and AT MOST 6 items TOTAL across all four arrays in any one section; keep practical_tips to 3-4. Each string is ONE short phrase (not a paragraph) — the briefing must be scannable and fit the response budget
- Weight DEPTH toward the sections most relevant to the trip purpose (${purposeLabel}) — for business, go deeper on meetings, hierarchy, and gift-giving
- CRITICAL: Return ONLY valid JSON. No markdown fences, no commentary.`;

  try {
    const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 7000,
      system: withLanguage(`${STANDARD}\n\nReturn only valid JSON. Never place a double-quote (") character inside any JSON string value — write quoted phrases or local-language terms plainly or with single quotes, or it breaks the JSON.`, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'culture-briefing' });

    if (!parsed.sections || !Array.isArray(parsed.sections) || !parsed.overview) {
      return res.status(500).json({ error: 'Briefing generation failed. Please try again.' });
    }

    // cultural_gap and the risk_level derived from it are gone (2026-08-25). A
    // single 0-100 score for how different a culture is treats a country as one
    // uniform thing, which is the first line of the standard. Deleted here too,
    // in case the model volunteers either.
    delete parsed.cultural_gap;
    delete parsed.risk_level;

    await guardResult(parsed, req.body);

    return res.json(parsed);
  } catch (err) {
    console.error('culture-briefing error:', err);
    return res.status(500).json({ error: 'Failed to generate briefing. Please try again.' });
  }
});

router.outputStandard = 'v2';
// culture-briefing-v2. Reviewed 2026-08-25 against the owner's standard.
// Describing a common practice is the product and is not guarded; claiming
// more than general knowledge supports is.
router.outputGuard = {
  prohibit: [
    'population_treated_as_uniform',        // a country or faith written as one behaviour
    'invented_precision',                   // a price, rate, distance or statistic that is a guess
    'predicted_reaction',                   // 'they will be offended', 'locals will appreciate it'
    'claimed_insider_standing',             // 'what only residents know'
    'stereotype_offered_as_guidance',       // advice resting on a national trait
    'national_or_ethnic_trait_claim',       // 'Nigerians may arrive late', 'Germans are direct'
    'sweeping_characterisation_of_a_place', // a city given three adjectives
    'volatile_information_stated_as_settled',  // legal, payment, tipping, religious, changeable
    'uncertain_local_phrase_stated_confidently',
  ],
  require: [
    'strong_conventions_distinguished_from_variable_practice',
    'changeable_information_flagged_for_checking',
    'fulfills_tool_promise',
  ],
};

module.exports = router;
