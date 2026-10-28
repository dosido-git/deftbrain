const express = require('express');
const { allChecks } = require('../lib/bothChecks');
const router  = express.Router();
const { answer } = require('../lib/progressive');
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { runOutputGuard } = require('../lib/outputGuard');

const { customsResearch } = require('../lib/customsResearch');
const { checkEvidenceFit } = require('../lib/evidenceFit');
const { calibrateClaims } = require('../lib/certaintyCheck');
// The governing standard for this tool. One text, used to write the
// briefing and to check it, so the two cannot drift into paraphrases.
const STANDARD = `Describe common practices and useful tendencies without treating a country, city, religion, or population as culturally uniform. Distinguish strong conventions from variable practices. Avoid invented precision and categorical claims about how locals will react. Never claim insider knowledge. For legal, safety, payment, tipping, religious, or rapidly changing practical information, clearly qualify uncertainty and avoid presenting potentially changing information as guaranteed fact. Describe a courtesy as a courtesy, with what makes it flexible ('prefer', 'may be appreciated', 'ask your host'); an accommodation for diet, alcohol, faith, health or the use of cutlery is always acceptable, and courtesy never requires eating, drinking or doing something unsuitable. The destination does not establish the hosts' language, faith, ethnicity or family customs: never assume them and never promise how communication will go; name what to ask instead. Keep safety and law apart from courtesy.`;

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
4. CLAIMED INSIDER STANDING — 'locals will tell you', 'what only residents know', 'the secret is'. The briefing has not been there. A tip resting on a named national stereotype — 'X time', 'X directness' — fails here too. So does the same claim stated plainly in any other field — any sentence whose subject is a nationality or people and whose verb is a behaviour. A nationality is not a behaviour, and moving the claim out of the tips into a section does not fix it. Attach the observation to a SETTING, never to a people.
5. VOLATILE INFORMATION STATED AS SETTLED — anything legal, financial, payment, tipping, religious, safety-related or subject to change, presented as guaranteed rather than as something to verify.
6. THE PERSON'S OWN NEEDS TREATED AS FAULTS — not drinking, a diet, a faith practice or a disability presented as a misstep or something to explain away. They are things to plan for.
7. A COURTESY MADE AN OBLIGATION — an 'only', 'always', 'never', 'must' or 'at least' attached to manners, food, drink, gifts or dress when the source describes what is common; or a practice of one observance or setting applied to a whole city or country. A general etiquette source describes what is common, not what every family expects: say what is common and what makes it flexible, scope it to its setting or observance, and keep the accommodation open.
8. THE FAMILY PRESUMED FROM THE PLACE — the hosts' language, faith, ethnicity or customs assumed from the destination or from a passing word in the visitor's text, or a promise that communication or a gesture will go well. Name what to ask instead.
9. SAFETY OR LAW CALLED COURTESY — a legal restriction or a physical risk framed as manners.${pack ? `

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

  // Accuracy and speed first (CLAUDE.md; owner's reviews 2026-10-27). The
  // briefing is written only from official-first research (lib/customsResearch.js,
  // cached 30 days per destination); every item cites a finding and its
  // strength is set in code from the finding. A first-time destination takes
  // ~90s to research, so the research starts at once and does not hold the
  // page: the first part — the questions to settle for THIS visit, which
  // state no outside fact and need no research — shows in seconds, and the
  // researched parts land as the research finishes (second review: 95s with
  // nothing on screen; the partner's family, not a national checklist, is
  // the organising principle).
  const SECTIONS = [
    ['greetings', '🤝'], ['occasions', '🎉'], ['dining', '🍽️'], ['business', '💼'], ['gifts', '🎁'],
    ['places', '🛐'], ['getting_around', '🚌'], ['money', '💰'], ['safety', '🛡️'],
  ];
  const TOPIC_SECTION = { greetings: 'greetings', names: 'greetings', language: 'greetings', occasions: 'occasions', dining: 'dining', dietary: 'dining', alcohol: 'dining', business: 'business', gifts: 'gifts', indoors: 'places', religious_sites: 'places', dress: 'places', photography: 'places', transport: 'getting_around', money: 'money', safety: 'safety', law: 'safety' };

  try {
    const research = customsResearch({ destination: destination.trim(), region: region?.trim() }).catch(() => null);
    let pack = null;
    const getPack = async () => {
      pack = await research;
      if (!pack) throw new Error('customs research unavailable');
      return pack;
    };
    const valid = () => new Set((pack?.findings || []).map(f => f.id));
    const byId = () => new Map((pack?.findings || []).map(f => [f.id, f]));
    const findingsFor = ids => pack.findings.filter(f => ids.includes(TOPIC_SECTION[f.topic]));

    const trip = `A visitor is going to ${destination.trim()}${region ? ` (${region.trim()})` : ''}.
${contextParts.join('\n')}`;
    const base = `${trip}

THE STANDARD:
${STANDARD}

Write ONLY from the RESEARCHED FINDINGS below. Every item cites the finding ids it rests on; anything no finding supports is left out — never fill a gap from memory. Keep each item as strong as its finding, no stronger, and keep its scope (where or when it applies). A finding from a general etiquette guide describes what is common, not what every family or host expects. Only what bears on what this visitor said they will do belongs; places they did not mention visiting (palaces, shrines, markets) are left out unless the trip is sightseeing. Things the visitor told you about themselves (diet, not drinking, faith, access needs, children) are things to plan for, never missteps or something to explain away. Say each point once.`;
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
    const sectionRules = 'At most 4 items per section, each one short sentence. A section with nothing relevant to this trip gets "items": []. Photographing people (a matter of their consent) and photographing government, military or airport sites (a legal and security matter) are separate items. Transport risks are safety items, said as plainly as the source says them.';
    const sectionPart = (ids, i) => ({
      required: false,
      run: async () => { await getPack(); return call(ask(findingsFor(ids), sectionSchema(ids), sectionRules), 1200, `culture-briefing-${i + 2}`); },
      apply: (d, out) => { (Array.isArray(out?.sections) ? out.sections : []).forEach(sec => { if (sec && ids.includes(sec.id)) d.sectionMap = { ...d.sectionMap, [sec.id]: sec }; }); },
    });
    const keep = (arr) => { const ok = valid(); return (Array.isArray(arr) ? arr : []).map(x => ({ ...x, finding_ids: (Array.isArray(x?.finding_ids) ? x.finding_ids : []).map(String).filter(id => ok.has(id)) })).filter(x => x.finding_ids.length); };
    const visitOf = arr => (Array.isArray(arr) ? arr : []).filter(q => q && typeof q.question === 'string' && q.question.trim()).slice(0, 6).map(q => ({ question: q.question.trim(), why: typeof q.why === 'string' ? q.why.trim() : '' }));

    // Strength from the finding, never from the writer; each finding said
    // once across the sections (the essentials are the short summary above).
    // Safety and law are labelled as such, never as a courtesy (second review:
    // photographing government sites and motorcycle taxis read 'Common courtesy').
    const assemble = (d) => {
      const { sectionMap, ...rest } = structuredClone(d);
      const visit = visitOf(rest.visit);
      if (!pack) return { destination: destination.trim(), tripPurpose, visit, overview: '', essentials: [], for_your_needs: [], sections: [], small_slips: [], sources: [], finding_sources: {}, researched_at: null };
      const findingById = byId();
      // Each finding said once outside the essentials: your needs first, then
      // the topics, then the slips (owner's review: 'no tipping' said three times).
      const used = new Set();
      const once = arr => keep(arr).filter(x => { const fresh = x.finding_ids.some(f => !used.has(f)); x.finding_ids.forEach(f => used.add(f)); return fresh; });
      const needs = once(rest.for_your_needs).slice(0, 4);
      // A section item that says what an essential already said, nearly word
      // for word, is left out of the section (owner: say each point once).
      const wordsOf = x => new Set(String(x || '').toLowerCase().match(/[\p{L}\p{N}]+/gu) || []);
      const essentialWords = keep(rest.essentials).map(e => wordsOf(e.point));
      const restates = text => { const w = wordsOf(text); return w.size > 0 && essentialWords.some(e => [...w].filter(x => e.has(x)).length / w.size >= 0.8); };
      const strengthOf = ids => {
        const fs = ids.map(id => findingById.get(id)).filter(Boolean);
        // Law only when every finding behind it is a legal requirement;
        // a crime warning citing one law finding is still safety.
        if (fs.length && fs.every(f => f.topic === 'law' && f.strength === 'required')) return 'law';
        if (fs.some(f => f.topic === 'safety' || f.topic === 'law')) return 'safety';
        // Transport and money facts are not courtesies: no 'Common courtesy'
        // tag on a ban or on how to pay (second review: the okada ban).
        if (fs.every(f => ['transport', 'money'].includes(f.topic)) && fs.every(f => f.strength === 'common')) return null;
        const order = ['offence', 'required', 'ask', 'varies', 'common'];
        return fs.map(f => f.strength).sort((a, b) => order.indexOf(a) - order.indexOf(b))[0] || 'common';
      };
      const sections = SECTIONS.map(([id, icon]) => {
        const sec = sectionMap?.[id];
        if (!sec) return null;
        const items = keep(sec.items).filter(it => { const fresh = it.finding_ids.some(f => !used.has(f)); it.finding_ids.forEach(f => used.add(f)); return fresh && it.text && !restates(it.text); })
          .map(it => ({ text: it.text, strength: strengthOf(it.finding_ids), finding_ids: it.finding_ids }));
        return items.length ? { id, icon, title: sec.title || id, items } : null;
      }).filter(Boolean);
      const cited = new Set([...sections.flatMap(s2 => s2.items.flatMap(it => it.finding_ids)), ...keep(rest.essentials).flatMap(e => e.finding_ids), ...keep(rest.for_your_needs).flatMap(e => e.finding_ids), ...keep(rest.small_slips).flatMap(e => e.finding_ids)]);
      const sourceIds = new Set(pack.findings.filter(f => cited.has(f.id)).map(f => f.source_id));
      return {
        destination: destination.trim(), tripPurpose,
        visit,
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
      // The research can take ~90s after the first part is on screen; pings
      // keep the connection from being dropped as idle.
      heartbeat: true,
      parts: [
        // First, in seconds, with no research: what to settle with the people
        // they are visiting. Questions only — no outside fact is stated here.
        { required: false,
          run: () => call(`${trip}

THE STANDARD:
${STANDARD}

Write the questions this visitor should settle before the trip with the person who invited them or knows the hosts (a partner, a host, a colleague, a host family — whoever their context names). Lead with the occasion or plans they described, and cover what that occasion turns on: which parts of it they attend, what to wear, what to bring or give, whether photos are welcome, when to arrive, who will introduce them or show them the ropes. When they will meet people: which languages those people prefer, and how to greet and address them. Only when they stated a need (diet, alcohol, faith, access, children): how and when to let the hosts know — never ask whether they have one. QUESTIONS ONLY — state no custom, language, faith or fact about the place or the people; the destination does not tell you the family's language, faith or customs.

Return ONLY valid JSON:
{ "visit": [ { "question": "one short question, addressed to the visitor (Which events…?)", "why": "what the answer settles, at most 10 words" } ] }
4-6 questions, most useful first. Never place a double-quote (") character inside any JSON string value.`, 700, 'culture-briefing-visit'),
          apply: (d, out) => { if (Array.isArray(out?.visit)) d.visit = out.visit; } },
        { required: true,
          run: async () => { await getPack(); return call(ask(pack.findings, `{ "overview": "1-2 sentences: what kind of trip this is and where practice differs by setting, region or family — never adjectives for a place or people", "essentials": [ { "point": "one of the 4-6 things that matter most for THIS trip and its plans, one short sentence", "finding_ids": ["F1"] } ] }`, 'essentials: the 4-6 points that matter most for what this visitor said they will do, most important first, each one short sentence. Safety and law points come before courtesies.'), 900, 'culture-briefing'); },
          apply: (d, out) => { if (out?.overview) d.overview = out.overview; if (out?.essentials) d.essentials = out.essentials; } },
        sectionPart(['greetings', 'dining', 'business'], 0),
        sectionPart(['occasions', 'gifts', 'money'], 1),
        sectionPart(['places', 'getting_around', 'safety'], 2),
        { required: false,
          run: async () => { await getPack(); return call(ask(pack.findings, `{ "for_your_needs": [ { "need": "a need the visitor stated, in a few words", "plan": "what to do about it, specific and practical — what to ask about, what to say, when to tell the hosts", "finding_ids": ["F1"] } ], "small_slips": [ { "slip": "a concrete action a visitor might get wrong (passing a dish with the left hand), not a broad assumption", "recovery": "a concrete recovery: thank the person, apologise briefly if needed, follow their lead", "finding_ids": ["F1"] } ] }`, `for_your_needs: only for needs the visitor stated about THEMSELVES (diet, alcohol, faith, access, children) — not the trip's purpose or plans${context?.trim() ? '' : ' — they stated none, so []'}; each plan adds practical help, not a restatement of a custom. small_slips: 0-3 concrete slips with concrete recoveries; nothing the visitor told you about themselves is a slip.`), 900, 'culture-briefing-4'); },
          apply: (d, out) => { if (out?.for_your_needs) d.for_your_needs = out.for_your_needs; if (out?.small_slips) d.small_slips = out.small_slips; } },
      ],
      finish: assemble,
      ready: d => Boolean(d.visit?.length || (d.overview && d.essentials?.length)),
      complete: d => Boolean(d.overview && d.essentials?.length),
      check: async (draft) => {
        const parsed = assemble(draft);
        // Side by side (lib/bothChecks.js): every item against the findings it
        // cites (T13); then the guard (the standard, and the person's needs
        // never as faults). The visit questions state no evidence, so the
        // evidence check skips them; the guard reads them.
        await allChecks(parsed, [
          x => checkEvidenceFit(x, {
            label: 'culture-briefing',
            evidence: JSON.stringify(pack.findings),
            summary: ['overview', 'essentials'],
            skip: ['destination', 'tripPurpose', 'visit', 'sources', 'finding_sources', 'researched_at'],
            userLanguage,
          }),
          x => guardResult(x, req.body, pack),
          // T5: a courtesy made a rule, or the hosts' language and reactions
          // inferred from the place ('so you will be able to communicate').
          x => calibrateClaims(x, { label: 'culture-briefing', userLanguage, skip: ['destination', 'tripPurpose', 'visit', 'sources', 'finding_sources', 'researched_at'] }),
        ], { label: 'culture-briefing' });
        // Back into the draft's shape, repairs included.
        Object.keys(draft).forEach(k => delete draft[k]);
        Object.assign(draft, { visit: parsed.visit, overview: parsed.overview, essentials: parsed.essentials, for_your_needs: parsed.for_your_needs, small_slips: parsed.small_slips, sectionMap: Object.fromEntries(parsed.sections.map(sec => [sec.id, sec])) });
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
    'courtesy_stated_as_obligation',        // 'accept at least…', 'right hand only', 'never…'
    'hosts_language_faith_or_customs_presumed_from_place', // 'learn Yoruba' for Lagos
    'safety_or_law_framed_as_courtesy',     // government-site photos, motorcycle taxis
  ],
  require: [
    'strong_conventions_distinguished_from_variable_practice',
    'changeable_information_flagged_for_checking',
    'fulfills_tool_promise',
  ],
};

module.exports = router;
