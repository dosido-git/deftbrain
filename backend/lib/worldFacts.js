// T1 in audit/DEFECT-TYPES.md: real-world facts stated from memory.
//
// Paperwork Path said a Texas move needs a vehicle safety inspection (Texas
// dropped them for most cars in 2025) and to register to vote online (Texas
// has no general online registration). Trip Recon put a train between Denver
// airport's garage and terminal. Micro-Adventure Mapper put Boston Common "at
// the north end" of the Freedom Trail (it is the start, at the south). The
// model does not know it is wrong, so neither a prompt rule nor a second model
// reading from memory fixes this (a memory check made Plot Hole Finder worse).
//
// The shared fix, in two steps:
//   1. researchFacts — one web search per topic (a place, a life event in a
//      place), cached 14 days and shared by every visitor who asks about it.
//      Only facts whose cited page was actually retrieved are kept.
//   2. checkWorldFacts — a SMART read of the finished answer against those
//      facts: a statement the research CONTRADICTS is corrected, and nothing
//      is flagged just because the research does not mention it.
// Start step 1 before the main generation and await it after, so the search
// runs alongside the answer instead of in front of it. Fail-open throughout.

const { groundedFacts, groundedData, normalizeKeyPart, stripCites } = require('./groundedFacts');
const { checkAgainstSupplied } = require('./factCheck');
const { MODELS } = require('./models');

const COLD_WAIT_MS = Number(process.env.WORLD_FACTS_WAIT_MS || 45000);

const host = (u) => { try { return new URL(u).hostname.replace(/^www\./, ''); } catch { return ''; } };

/**
 * @param topic   short, human key parts, e.g. ['paperwork', 'moving', 'Austin, TX']
 * @param brief   what to find out, in plain words
 * @param label   log label
 * @returns { facts: [{ fact, source }], searched_at } or null
 */
async function researchFacts({ topic, brief, label }) {
  const key = `world:${topic.map(normalizeKeyPart).join(':')}`;
  try {
    await groundedFacts({
      cacheKey: key,
      label: `${label}-research`,
      coldWaitMs: COLD_WAIT_MS,
      maxUses: 3,
      maxTokens: 4000,
      system: 'You research specific, checkable facts with web search. Report only what the pages you retrieve say — never fill a gap from memory. Prefer official sources (government, the place itself, transit operators), then established references. Note when something changed recently. Return ONLY valid JSON. Never place a double-quote (") character inside any JSON string value.',
      userPrompt: `${brief}

Return ONLY valid JSON:
{ "facts": [ { "fact": "one specific checkable fact, one sentence", "source": "the domain of the page it came from" } ] }

8-20 facts. Include things people commonly get WRONG about this, and anything that changed recently.`,
      render: (out, searchResults) => {
        const seen = searchResults.map(r => host(r.url)).filter(Boolean);
        const facts = (Array.isArray(out?.facts) ? out.facts : [])
          .map(f => ({ fact: String(stripCites(f?.fact || '')).trim(), source: String(f?.source || '').replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0] }))
          .filter(f => f.fact && f.source && seen.some(h => h === f.source || h.endsWith(`.${f.source}`) || f.source.endsWith(`.${h}`)));
        if (facts.length < 3) {
          console.log(`[${label}-research] rejected: ${facts.length} sourced fact(s) of ${(out?.facts || []).length}`);
          return '';
        }
        return { block: facts.map(f => `- ${f.fact} (${f.source})`).join('\n'), data: { facts, searched_at: new Date().toISOString().slice(0, 10) } };
      },
    });
  } catch (err) {
    console.log(`[${label}] world-facts research skipped: ${err.message}`);
  }
  return groundedData(key);
}

/**
 * Correct statements in `draft` that the researched facts contradict.
 * @param research  the result of researchFacts (or a promise of it)
 * @param fields    [[path, text], ...] prose to check
 */
async function checkWorldFacts(draft, research, { label, fields, subject, userLanguage }) {
  try {
    const data = await research;
    if (!data?.facts?.length || !Array.isArray(fields) || !fields.length) {
      console.log(`[${label}] world-facts check: no research to check against — answering unverified`);
      return [];
    }
    return await checkAgainstSupplied(draft, {
      label: `${label}-world`,
      fields,
      supplied: `RESEARCHED FACTS about ${subject} (web search, ${data.searched_at}):\n${data.facts.map(f => `- ${f.fact} (${f.source})`).join('\n')}`,
      lookFor: `- a statement about the real world — a rule, requirement, office, fee, deadline, place, location, direction, route, connection, schedule or service — that CONTRADICTS the researched facts above.
Do NOT flag something merely because the research does not mention it: research covers a fraction of what a good answer says. Flag only a clear clash. Advice, opinions and the visitor's own details are not facts about the world.`,
      repairNote: 'Correct the statement so it agrees with the researched facts, keeping the rest of the line. If the correction would need detail the research does not give, state the corrected fact plainly or tell them where to confirm it. Do not mention research, searches or sources in the text.',
      userLanguage,
      model: MODELS.SMART,
    }) || [];
  } catch (err) {
    console.log(`[${label}] world-facts check skipped: ${err.message}`);
    return [];
  }
}

module.exports = { researchFacts, checkWorldFacts };
