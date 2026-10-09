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
//   2. checkWorldFacts — picks the answer's most consequential claims the
//      topic research does not settle and searches each one (cached per
//      question), then a SMART read of the finished answer against all of it:
//      a statement the research CONTRADICTS is corrected, and nothing is
//      flagged just because the research does not mention it.
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

// ── Claim-by-claim verification (2026-10-09) ─────────────────────────────────
// A topic search only catches the claims it happens to cover. Paperwork Path
// kept telling a Texas mover to register to vote online (Texas has no general
// online registration) because the "moving to Austin" research never covered
// voting; Plot Hole Finder's errors are story TIMING that no plot summary
// carries. So after the topic research, the answer's most consequential
// claims that the research does not settle are each searched on their own —
// one small cached search per claim, shared by everyone who triggers the same
// question.
const CLAIM_LIMIT = Number(process.env.WORLD_CLAIMS_MAX || 3);

async function pickClaims({ label, fields, subject, known }) {
  const { callClaudeWithRetry } = require('./claude');
  const out = await callClaudeWithRetry({
    model: MODELS.SMART,
    max_tokens: 1200,
    messages: [{ role: 'user', content: `Below is an answer about ${subject}, and facts already researched.

ALREADY RESEARCHED:
${known || '(nothing)'}

ANSWER:
${fields.map(([p, v]) => `${p}:\n${v}`).join('\n\n')}

List up to ${CLAIM_LIMIT} specific, checkable claims about the real world (a rule, requirement, availability online or in person, deadline, fee, place, route, schedule, or an event in a story and when it happens) that the answer states as fact and that the research above does NOT already confirm or contradict. Most consequential first: a claim a conclusion or a step rests on, or one that would cost the reader if wrong. Skip advice, opinions, and anything vague. If none qualify, return an empty list.

Return ONLY valid JSON: { "claims": [ { "field": "exact identifier from the answer", "claim": "the claim, one sentence", "question": "a neutral search question that would settle it, naming ${subject}" } ] }
Never place a double-quote character inside a JSON string value.` }],
  }, { label: `${label}-claims`, maxRetries: 0 });
  return (Array.isArray(out?.claims) ? out.claims : [])
    .filter(c => c && typeof c.question === 'string' && c.question.trim())
    .slice(0, CLAIM_LIMIT);
}

async function verifyClaim({ label, claim }) {
  const key = `claim:${normalizeKeyPart(claim.question)}`;
  await groundedFacts({
    cacheKey: key,
    label: `${label}-claim`,
    coldWaitMs: COLD_WAIT_MS,
    maxUses: 2,
    maxTokens: 1500,
    system: 'You answer one factual question with web search. Report only what the pages you retrieve say; if they do not settle it, say so. Return ONLY valid JSON. Never place a double-quote (") character inside any JSON string value.',
    userPrompt: `${claim.question}

Return ONLY valid JSON: { "answer": "what the sources say, one or two sentences, specific", "settled": true or false, "source": "the domain of the page the answer comes from" }`,
    render: (out, searchResults) => {
      const answer = String(stripCites(out?.answer || '')).trim();
      const src = String(out?.source || '').replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
      const seen = searchResults.map(r => host(r.url));
      if (!answer || out?.settled === false || !src || !seen.some(h => h === src || h.endsWith(`.${src}`) || src.endsWith(`.${h}`))) return '';
      return { block: answer, data: { fact: answer, source: src } };
    },
  });
  return groundedData(key);
}

/**
 * Correct statements in `draft` that the researched facts contradict.
 * @param research  the result of researchFacts (or a promise of it)
 * @param fields    [[path, text], ...] prose to check
 */
async function checkWorldFacts(draft, research, { label, fields, subject, userLanguage }) {
  try {
    if (!Array.isArray(fields) || !fields.length) return [];
    const data = await research;
    const topicFacts = Array.isArray(data?.facts) ? data.facts : [];
    const known = topicFacts.map(f => `- ${f.fact} (${f.source})`).join('\n');
    let claimFacts = [];
    try {
      const claims = await pickClaims({ label, fields, subject, known });
      claimFacts = (await Promise.all(claims.map(claim => verifyClaim({ label, claim }).catch(() => null)))).filter(Boolean);
      console.log(`[${label}] world-facts: ${claims.length} claim(s) searched, ${claimFacts.length} settled`);
    } catch (err) {
      console.log(`[${label}] world-facts claim search skipped: ${err.message}`);
    }
    const facts = [...topicFacts, ...claimFacts];
    if (!facts.length) {
      console.log(`[${label}] world-facts check: no research to check against — answering unverified`);
      return [];
    }
    return await checkAgainstSupplied(draft, {
      label: `${label}-world`,
      fields,
      supplied: `RESEARCHED FACTS about ${subject} (web search${data?.searched_at ? `, ${data.searched_at}` : ''}):\n${facts.map(f => `- ${f.fact} (${f.source})`).join('\n')}`,
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

module.exports = { researchFacts, checkWorldFacts, pickClaims, verifyClaim };
