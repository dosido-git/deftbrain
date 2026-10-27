const express = require('express');
const { allChecks } = require('../lib/bothChecks');
const router  = express.Router();
const { answer, whileSearching } = require('../lib/progressive');
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { runOutputGuard } = require('../lib/outputGuard');

const { customsResearch } = require('../lib/customsResearch');
const { checkEvidenceFit } = require('../lib/evidenceFit');
// The governing standard for this tool. One text, used to write the
// briefing and to check it, so the two cannot drift into paraphrases.
const STANDARD = `Describe common practices and useful tendencies without treating a country, city, religion, or population as culturally uniform. Distinguish strong conventions from variable practices. Avoid invented precision and categorical claims about how locals will react. Never claim insider knowledge. For legal, safety, payment, tipping, religious, or rapidly changing practical information, clearly qualify uncertainty and avoid presenting potentially changing information as guaranteed fact.`;

// The visitor supplied a destination and a few trip facts. Everything else is
// general knowledge about a place, which is exactly the kind of claim that
// slides into invented precision and into speaking for a whole population.
function suppliedFrom(body, pack) {
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

WHAT THIS TOOL IS. A practical briefing written from researched findings (official sources first), each item citing the finding it rests on. Describing a common practice is the job. What fails is claiming more than the findings support.

SCOPE. These apply to EVERY field — the overview and the practical tips and the missteps exactly as much as the topic sections. A sweeping characterisation is not excused by being an introduction, and a tip is not excused by being practical.

The failures:
1. TREATING A POPULATION AS UNIFORM — a country, city, religion or population written as though everyone in it does the same thing, INCLUDING in the overview. A place given a set of adjectives ('direct, energetic and relationship-driven'), or values described as held across it ('warmth and humour are valued across social settings', 'respect for elders is expected'), fails. So does 'handshakes are standard' — and 'firm grip expected' — for a practice that varies by gender, religion, region and setting. 'Expected' and 'customary' are the same categorical claim as 'standard'. Practices belonging to a region, generation, setting or faith community must be attributed to it.
2. INVENTED PRECISION — a price, percentage, tipping rate, distance, duration or statistic presented as fact when it is a guess, and a local-language phrase or physical custom stated with confidence it does not warrant.
3. PREDICTING REACTIONS — 'they will be offended', 'locals will appreciate this', 'nobody will mind', 'people will understand', 'this damages trust', 'it breaks rapport', 'you will learn it quickly'. Also the softer forms, which are the same assertion with a gentler verb: 'is read as confident', 'this signals respect', 'is appreciated', 'traffic is understood', and any hedged effect — 'can damage the working relationship', 'may break rapport', 'could wound'. Hedging an effect claim does not make it an observation. 'Can come across as X' is the permitted ceiling and nothing may be appended to it. A convention can be described and a consequence can be phrased as how something CAN come across; how a person WILL respond cannot be known. In small_slips, a recovery ('a brief apology and asking for the pronunciation is a reasonable recovery') is right and a reassurance is not.
4. CLAIMED INSIDER STANDING — 'locals will tell you', 'what only residents know', 'the secret is'. The briefing has not been there. A tip resting on a named national stereotype — 'X time', 'X directness' — fails here too. So does the same claim stated plainly in any other field: 'Nigerians may arrive late without apology', 'Germans are direct', 'the French expect formality'. A nationality is not a behaviour, and moving the claim out of the tips into a section does not fix it. Attach the observation to a SETTING, never to a people.
5. VOLATILE INFORMATION STATED AS SETTLED — anything legal, financial, payment, tipping, religious, safety-related or subject to change, presented as guaranteed rather than as something to verify.
6. THE PERSON'S OWN NEEDS TREATED AS FAULTS — not drinking, a diet, a faith practice or a disability presented as a misstep or something to explain away. They are things to plan for.${pack ? `

RESEARCHED FINDINGS (the only outside facts this briefing may state):
${JSON.stringify(pack.findings)}` : ''}`;
}

async function guardResult(parsed, body, pack) {
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
    supplied: suppliedFrom(body, pack),
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

  // Accuracy and speed first (CLAUDE.md; owner's review 2026-10-27). The
  // briefing used to be written from memory and spot-checked afterwards; now
  // official sources are researched first (lib/customsResearch.js, cached 30
  // days per destination) and every item must cite a finding. Strength comes
  // from the finding, set in code, so nothing is made a "higher-stakes"
  // misstep unless a source says it causes offence. A first-time destination
  // waits for the search with a note on screen (whileSearching); after that,
  // four short parallel passes show the essentials in seconds.
  const SECTIONS = [
    ['greetings', '🤝'], ['dining', '🍽️'], ['business', '💼'], ['gifts', '🎁'],
    ['places', '⛩️'], ['getting_around', '🚌'], ['money', '💰'], ['safety', '🛡️'],
  ];
  const TOPIC_SECTION = { greetings: 'greetings', names: 'greetings', language: 'greetings', dining: 'dining', dietary: 'dining', alcohol: 'dining', business: 'business', gifts: 'gifts', indoors: 'places', religious_sites: 'places', dress: 'places', photography: 'places', transport: 'getting_around', money: 'money', safety: 'safety', law: 'safety' };

  try {
    const pack = await whileSearching(req, res, 'customs', customsResearch({ destination: destination.trim(), region: region?.trim() }).catch(() => null));
    if (!pack) {
      return res.status(503).json({ error: 'The official-source check for this destination did not finish. Please try again in a minute — the research usually completes by then.', code: 'research_unavailable' });
    }
    const valid = new Set(pack.findings.map(f => f.id));
    const byId = new Map(pack.findings.map(f => [f.id, f]));
    const findingsFor = ids => pack.findings.filter(f => ids.includes(TOPIC_SECTION[f.topic]));

    const base = `A visitor is going to ${destination.trim()}${region ? ` (${region.trim()})` : ''}.
${contextParts.join('\n')}

THE STANDARD:
${STANDARD}

Write ONLY from the RESEARCHED FINDINGS below. Every item cites the finding ids it rests on; anything no finding supports is left out — never fill a gap from memory. Keep each item as strong as its finding, no stronger, and keep its scope (where or when it applies). Things the visitor told you about themselves (diet, not drinking, faith, access needs, children) are things to plan for, never missteps or something to explain away. Say each point once.`;
    const ask = (findings, schema, rules) => `${base}

RESEARCHED FINDINGS:
${JSON.stringify(findings)}

Return ONLY valid JSON:
${schema}

${rules}
Never place a double-quote (") character inside any JSON string value.`;

    const system = withLanguage(`${STANDARD}\n\nReturn only valid JSON. Never place a double-quote (") character inside any JSON string value — write quoted phrases or local-language terms plainly or with single quotes, or it breaks the JSON.`, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion);
    const call = (content, maxTokens, tag) => callClaudeWithRetry({ model: MODELS.FAST, max_tokens: maxTokens, system, messages: [{ role: 'user', content }] }, { label: tag });
    const sectionSchema = ids => `{ "sections": [ ${ids.map(id => `{ "id": "${id}", "title": "short heading in the visitor's language", "items": [ { "text": "one short practical sentence", "finding_ids": ["F1"] } ] }`).join(', ')} ] }`;
    const sectionRules = 'At most 4 items per section, each one short sentence. A section with nothing relevant to this trip gets "items": [].';
    const sectionPart = (ids, i) => ({
      required: false,
      run: () => call(ask(findingsFor(ids), sectionSchema(ids), sectionRules), 1200, `culture-briefing-${i + 2}`),
      apply: (d, out) => { (Array.isArray(out?.sections) ? out.sections : []).forEach(sec => { if (sec && ids.includes(sec.id)) d.sectionMap = { ...d.sectionMap, [sec.id]: sec }; }); },
    });
    const keep = (arr) => (Array.isArray(arr) ? arr : []).map(x => ({ ...x, finding_ids: (Array.isArray(x?.finding_ids) ? x.finding_ids : []).map(String).filter(id => valid.has(id)) })).filter(x => x.finding_ids.length);

    // Strength from the finding, never from the writer; each finding said
    // once across the sections (the essentials are the short summary above).
    const assemble = (d) => {
      const { sectionMap, ...rest } = structuredClone(d);
      // Each finding said once outside the essentials: your needs first, then
      // the topics, then the slips (owner's review: 'no tipping' said three times).
      const used = new Set();
      const once = arr => keep(arr).filter(x => { const fresh = x.finding_ids.some(f => !used.has(f)); x.finding_ids.forEach(f => used.add(f)); return fresh; });
      const needs = once(rest.for_your_needs).slice(0, 4);
      const strengthOf = ids => { const order = ['offence', 'required', 'ask', 'varies', 'common']; return ids.map(id => byId.get(id)?.strength).sort((a, b) => order.indexOf(a) - order.indexOf(b))[0] || 'common'; };
      const sections = SECTIONS.map(([id, icon]) => {
        const sec = sectionMap?.[id];
        if (!sec) return null;
        const items = keep(sec.items).filter(it => { const fresh = it.finding_ids.some(f => !used.has(f)); it.finding_ids.forEach(f => used.add(f)); return fresh && it.text; })
          .map(it => ({ text: it.text, strength: strengthOf(it.finding_ids), finding_ids: it.finding_ids }));
        return items.length ? { id, icon, title: sec.title || id, items } : null;
      }).filter(Boolean);
      const cited = new Set([...sections.flatMap(s2 => s2.items.flatMap(it => it.finding_ids)), ...keep(rest.essentials).flatMap(e => e.finding_ids), ...keep(rest.for_your_needs).flatMap(e => e.finding_ids), ...keep(rest.small_slips).flatMap(e => e.finding_ids)]);
      const sourceIds = new Set(pack.findings.filter(f => cited.has(f.id)).map(f => f.source_id));
      return {
        destination: destination.trim(), tripPurpose,
        overview: rest.overview || '',
        essentials: keep(rest.essentials).slice(0, 6),
        for_your_needs: needs,
        sections,
        small_slips: once(rest.small_slips).slice(0, 3),
        // Sources numbered 1, 2, 3… among those actually cited.
        ...(() => {
          const shown = pack.sources.filter(src => sourceIds.has(src.id));
          const num = new Map(shown.map((src, i) => [src.id, `S${i + 1}`]));
          return {
            sources: shown.map(src => ({ ...src, id: num.get(src.id) })),
            finding_sources: Object.fromEntries(pack.findings.filter(f => num.has(f.source_id)).map(f => [f.id, num.get(f.source_id)])),
          };
        })(),
        researched_at: pack.searched_at || null,
      };
    };

    return await answer(req, res, {
      label: 'culture-briefing',
      parts: [
        { required: true,
          run: () => call(ask(pack.findings, `{ "overview": "1-2 sentences: what kind of trip this is and where practice differs by setting or region — never adjectives for a place or people", "essentials": [ { "point": "one of the 4-6 things that matter most for THIS trip and purpose, one short sentence", "finding_ids": ["F1"] } ] }`, 'essentials: the 4-6 points that matter most for this purpose and context, most important first, each one short sentence.'), 900, 'culture-briefing'),
          apply: (d, out) => { if (out?.overview) d.overview = out.overview; if (out?.essentials) d.essentials = out.essentials; } },
        sectionPart(['greetings', 'dining', 'business', 'gifts'], 0),
        sectionPart(['places', 'getting_around', 'money', 'safety'], 1),
        { required: false,
          run: () => call(ask(pack.findings, `{ "for_your_needs": [ { "need": "a need the visitor stated, in a few words", "plan": "what to do about it, specific (for a vegetarian: what hidden ingredients to ask about)", "finding_ids": ["F1"] } ], "small_slips": [ { "slip": "an ordinary slip a visitor might make", "recovery": "a calm, simple recovery", "finding_ids": ["F1"] } ] }`, `for_your_needs: only for needs the visitor stated about THEMSELVES (diet, alcohol, faith, access, children) — not the trip's purpose or plans${context?.trim() ? '' : ' — they stated none, so []'}. small_slips: 0-3 ordinary slips with calm recoveries; nothing the visitor told you about themselves is a slip.`), 900, 'culture-briefing-4'),
          apply: (d, out) => { if (out?.for_your_needs) d.for_your_needs = out.for_your_needs; if (out?.small_slips) d.small_slips = out.small_slips; } },
      ],
      finish: assemble,
      ready: d => Boolean(d.overview && d.essentials?.length),
      complete: d => Boolean(d.overview && d.essentials?.length),
      check: async (draft) => {
        const parsed = assemble(draft);
        // Side by side (lib/bothChecks.js): every item against the findings it
        // cites (T13); then the guard (the standard, and the person's needs
        // never as faults).
        await allChecks(parsed, [
          x => checkEvidenceFit(x, {
            label: 'culture-briefing',
            evidence: JSON.stringify(pack.findings),
            summary: ['overview', 'essentials'],
            skip: ['destination', 'tripPurpose', 'sources', 'finding_sources', 'researched_at'],
            userLanguage,
          }),
          x => guardResult(x, req.body, pack),
        ], { label: 'culture-briefing' });
        // Back into the draft's shape, repairs included.
        Object.keys(draft).forEach(k => delete draft[k]);
        Object.assign(draft, { overview: parsed.overview, essentials: parsed.essentials, for_your_needs: parsed.for_your_needs, small_slips: parsed.small_slips, sectionMap: Object.fromEntries(parsed.sections.map(sec => [sec.id, sec])) });
      },
    });
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
