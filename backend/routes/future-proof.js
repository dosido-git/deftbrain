const express = require('express');
const router = express.Router();
const { answer, keyGroups, onlyKeys } = require('../lib/progressive');
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { groundedFacts, groundedData, normalizeKeyPart, stripCites } = require('../lib/groundedFacts');
const { runOutputGuard } = require('../lib/outputGuard');

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — write quoted phrases or names plainly or with single quotes, or it breaks the JSON.';

const DAY_MS = 24 * 60 * 60 * 1000;
// Labour markets and technology move, but not hourly. A week is long enough
// that one search serves many visitors asking about the same field, and short
// enough that nothing here goes stale in a way that changes an answer.
const FACT_TTL_MS = 7 * DAY_MS;
// Zero, on measurement. Across 46 cold requests the search landed inside the
// 12-second window once. The other 45 waited the full twelve seconds and then
// answered unverified anyway, so the wait was buying a 2% chance of sources at
// a guaranteed cost of 12s. The background refresh still runs and still warms
// the cache for everyone after them, which is where the sourcing actually comes
// from. Raise this only if the search itself gets much faster.
const COLD_WAIT_MS = Number(process.env.FP_COLD_WAIT_MS || 0);
// Deliberately generous. An entry budget normally exists so a slow answer does
// not get slower, but here the guard is the mechanism the whole tool rests on,
// and at 75s it was skipped on precisely the requests that need it most: a cold
// cache means grounding did not land, which means the model answered from
// memory, which is when invented figures appear. Measured: cold ~79s, warm
// ~91s including the guard. Both now run it.
const GUARD_ENTRY_MS = Number(process.env.FP_GUARD_ENTRY_MS || 105_000);

// ════════════════════════════════════════════════════════════
// TYPE FRAMEWORKS
// ════════════════════════════════════════════════════════════
// The type used to be a label pasted into the prompt, which meant a career and
// an index fund were reasoned about identically. They are not the same
// question. Each framework below names what actually decides the outcome for
// that kind of bet, and what the analysis is not allowed to do.
//
// `habit` was removed rather than given a framework. A daily habit is not a
// bet on external conditions — it has no labour market, no adoption curve and
// no automation exposure — so every section of this tool either misfires or
// has to be padded. Someone asking about a habit is really asking about a
// skill (is this worth getting good at) or a commitment (is this worth years
// of my life), and both of those are here.
const FRAMEWORKS = {
  career: `FRAME THIS AS A LABOUR-MARKET QUESTION.
What decides the answer: demand for the work, the supply of people who can do
it, what share of the work is being automated or offshored, whether the
credential or experience that gates entry is getting harder or easier to
obtain, and whether pay is set by scarcity or by budget. Distinguish the field
from the role — a shrinking role inside a growing field is a different
situation from a shrinking field. Say which one this is.`,

  skill: `FRAME THIS AS A SKILL-VALUE QUESTION.
What decides the answer: whether the skill is becoming more valuable per hour
or more commoditised, whether it compounds with other things the person has,
how long it takes to reach usefulness versus how fast the ground moves under
it, and whether tools are making it easier to do (which raises supply and
lowers price) or easier to do MORE with (which raises value). Those two are
opposite outcomes and are routinely confused. Say which is happening.`,

  technology: `FRAME THIS AS AN ADOPTION QUESTION.
What decides the answer: where it sits on the adoption curve now, what it
displaces and what the incumbent's advantage is, whether the constraint is
technical, economic or regulatory, and what would have to become true for it
to reach the next stage. Do not treat attention as adoption. A technology can
be everywhere in the discourse and nowhere in production.`,

  investment: `FRAME THIS AS A THESIS TO BE STRESS-TESTED — see the investment
policy below, which overrides anything that conflicts with it.`,

  commitment: `FRAME THIS AS A MULTI-YEAR COMMITMENT.
What decides the answer: what it costs to enter, what it costs to leave, what
it forecloses while it runs, which of its benefits survive if the surrounding
conditions change, and whether the exit is a door or a wall. A commitment that
pays off in one future and traps them in the others is a different
proposition from one that is merely uncertain. Say which this is.`,
};

// An investment analysis that reads like career advice is worse than useless:
// it sounds like a recommendation to act. This is the one type where the tool
// must not tell anyone what to do with money.
const INVESTMENT_POLICY = `
INVESTMENT POLICY — OVERRIDES EVERYTHING ELSE IN THIS PROMPT.
You are stress-testing a thesis, not advising a transaction.
- State the thesis as you understand it, then attack it. What has to be true
  for it to work? Which of those things are already true, and which are
  assumed?
- Name what would INVALIDATE the thesis. This is the most useful thing on the
  page and it is usually missing.
- Name the downside exposure plainly: what is lost, and can it be lost
  permanently.
- NEVER write buy, sell, hold, accumulate, exit, overweight, underweight, or
  any synonym that tells the reader what to do with a position.
- NEVER forecast a return, a price, a target or a percentage gain. Not as a
  range, not as a scenario figure, not "historically around". You do not know.
- NEVER assign a probability to a scenario.
- one_action must be an information-gathering, thesis-testing, risk-mapping or
  decision-preparation step. Never an instruction to transact, and never a
  suggestion to move a position.`;

// ════════════════════════════════════════════════════════════
// EVIDENCE DISCIPLINE
// ════════════════════════════════════════════════════════════
// Supplied by the owner and used close to verbatim. It replaces three shorter
// rules that said parts of the same thing in three places — a prompt that
// states a rule three times reads as three weak rules rather than one firm one.
// LEAN (2026-11-01, audit/LEAN-PROMPT-STANDARD.md): ~280 lines (owner-supplied)
// condensed to the rules that change an answer; the guard and the URL filter
// below still enforce them after the answer shows.
const EVIDENCE_DISCIPLINE = `
EVIDENCE
- OBSERVED means a checked source above says it, with its publisher, date and URL. Everything else is INFERRED or ASSUMED, and labelled so.
- Keep a sourced fact and what you conclude from it in separate sentences. A proxy (job postings, a survey, a forecast) shows only what it measured; never more specific than the source.
- Prefer government, original data and research; a commercial rating is that company's opinion.
- What the person told you about themselves is their situation, not evidence about the market.
- Each assumption says what would change the answer if it broke.`;


// ════════════════════════════════════════════════════════════
// FINAL REASONING & OUTPUT QUALITY
// ════════════════════════════════════════════════════════════
// Owner-supplied, appended after EVIDENCE_DISCIPLINE. Item 1 is the one that
// targets the failure the previous round left standing: a sourced premise
// silently licensing an unsourced conclusion.
const FINAL_QUALITY_RULES = `
QUALITY
- A forecast is a projection by someone, not a fact about the future; say whose.
- Calibrate: no "always", "never", "guaranteed", "permanently safe from automation", and no rhetoric about being the honest one.
- one_action tests the biggest uncertainty in this analysis and is worth doing whichever scenario comes true.
- Fill every field the shape asks for; don't overcorrect into saying nothing.`;

const PERSONALITY = `Analyst who stress-tests long-term bets. You do not predict the future and you say so by how you write, not by adding disclaimers.

Your discipline is the difference between what is observed, what is inferred, and what is assumed. You state observations plainly, mark projections as projections, and surface the assumptions a reader would otherwise absorb without noticing. You would rather say "we cannot see that from here" than produce a confident sentence that is not supported.`;

// ════════════════════════════════════════════════════════════
// GROUNDING
// ════════════════════════════════════════════════════════════
// The instruction "do not fabricate statistics" is not enough on its own: a
// model asked about a labour market will produce plausible figures because
// plausible figures are what that text looks like. So the volatile claims get
// verified in a small bounded search first, and the main call is told that the
// verified block is the only place it may take a number from.
// A template literal, because this is a multi-line brief and a single-quoted
// string silently accepted the newlines at parse-check time and then failed to
// load at require time.
const FACTS_SYSTEM = `You verify current conditions with web search.

THE URL YOU RETURN MUST BE THE PAGE THAT PUBLISHED THE FACT, and the publisher must be whoever owns that page. If you find a government statistic on a careers site, that is a lead, not a source: search again for the agency's own page and return THAT url. If you cannot reach the original, drop the entry. Never return a publisher of the form X cited by Y, X via Y, or according to X — that is the record admitting its url does not point at the source, and such an entry is unusable.

Prefer sources in this order, and stop at the best one you can actually reach: (1) government agencies and regulators; (2) original datasets and original research; (3) universities and established research institutions; (4) professional or industry organisations with disclosed methodology; (5) company reports containing original data; (6) high-quality journalism reporting verifiable evidence; (7) specialist commercial sources; (8) secondary blogs or aggregators, only when nothing better exists. Never cite a secondary article for a statistic when the original is reasonably available. Not forums, not opinion pieces, not vendor marketing, not listicles.

A proprietary rating invented by a commercial site — an employability grade, a score out of ten, a demand index — is that company's opinion, not a measured condition. Do not return it as a fact.

Report only what you actually saw published, and only with its publisher, its date and its url. Three good entries beat eight weak ones, and an empty array is a correct and useful answer. Never invent a url, a study, a survey or a statistic. Return ONLY valid JSON. `;

// When the search comes back with nothing, the model has to be told — otherwise
// it writes "OBSERVED: ... for roughly two decades" over an empty Observed list,
// and the label promises a citation the reader will go looking for and not find.
const NO_SOURCES_BLOCK = `

NO SOURCES WERE VERIFIED FOR THIS REQUEST. The search returned nothing usable,
so you have no citable material at all.

  - Do not label anything OBSERVED. The word means there is a record for it in
    sources_and_assumptions.observed, and that list will be empty.
  - Leave sources_and_assumptions.observed as an empty array. Do not populate it
    from memory; an entry with no url is not a source.
  - Use no figures, percentages, wage levels, counts, dates or growth rates.
    Write the claim without the number.
  - Make no claim about licensing, regulation, insurance, permits or legal
    requirement — not even a hedged one, and not "in most jurisdictions". These
    are the claims a reader is most likely to act on and they vary by place.
    With nothing verified, name the question instead of answering it: say the
    requirement varies, and say who they should check it with.
  - Make no generalization about an industry or a labour market as a whole.
    Reason about the shape of the work, which does not need a citation, rather
    than about conditions across a market, which does.
  - Your analysis is still worth making — it is inference and assumption, and
    labelling it honestly is what makes it usable. Say what you are reasoning
    from rather than dressing it as evidence.`;

const GROUNDED_TYPES = new Set(['career', 'skill', 'technology', 'investment']);

function factsKey({ subject, subjectType }) {
  return ['future-proof', normalizeKeyPart(subjectType || 'general'), normalizeKeyPart(subject).slice(0, 80)].join('|');
}

function renderFactsBlock(verified) {
  if (!Array.isArray(verified) || !verified.length) return '';
  return `\n\nCHECKED AGAINST CURRENT SOURCES TODAY — these are the ONLY figures, dates, named programmes and current conditions you may state as fact. Each carries the source it came from:\n` +
    verified.map(f => `- [${f.kind}] ${f.detail} — ${f.publisher || 'unknown publisher'}, ${f.published || 'no date'}${f.jurisdiction ? `, applies to: ${f.jurisdiction}` : ''} <${f.url || 'no url'}>`).join('\n') +
    `\n\nEverything not on this list is either your inference or an assumption, and must be labelled as such. If a claim you want to make needs a number that is not here, make the claim without the number or leave it out. Do not reconstruct a figure from memory to fill a gap. Every one of these you use must be copied into sources_and_assumptions.observed with its publisher, date and URL exactly as given here.`;
}

function futureProofFacts({ subject, subjectType }) {
  return groundedFacts({
    cacheKey: factsKey({ subject, subjectType }),
    label: 'future-proof-facts',
    ttlMs: FACT_TTL_MS,
    coldWaitMs: COLD_WAIT_MS,
    maxTokens: 2500,
    system: FACTS_SYSTEM + NO_QUOTE_RULE,
    userPrompt: `Verify with web_search the current, checkable conditions someone would need in order to think clearly about this over the next several years: "${subject}"${subjectType ? ` (treated as a ${subjectType})` : ''}.

Look for, and report ONLY what you can see published with a date:
(1) current demand, employment, adoption or market conditions, with the period the figure covers;
(2) a named credential, licence, standard or programme that actually exists, under its exact current name;
(3) a regulatory or policy change already enacted or formally proposed, with its date;
(4) a documented, dated shift in how the work is done or the technology is deployed;
(5) anything published that directly contradicts the common assumption about this subject.

These are CURRENT CONDITIONS, not forecasts. Do not search for or report predictions, analyst targets, price forecasts or anyone's opinion about what will happen.

Return ONLY valid JSON:
{ "verified": [{ "kind": "condition | credential | policy | shift | contradiction", "detail": "The published fact in one sentence, with its figure and the period it covers", "publisher": "The organisation that actually published it", "published": "Publication or revision date as printed", "url": "Direct URL to the page you read it on", "jurisdiction": "Country or region it applies to, or global if it genuinely does" }] }`,
    render: (clean) => ({ block: renderFactsBlock(clean.verified), data: clean.verified }),
  });
}

// ════════════════════════════════════════════════════════════
// POST /future-proof
// ════════════════════════════════════════════════════════════
router.post('/future-proof', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  const startedAt = Date.now();
  try {
    const { subject, subjectType, context, timeframe, userLanguage } = req.body;
    if (!subject?.trim()) return res.status(400).json({ error: 'What do you want to assess?' });

    const type = FRAMEWORKS[subjectType] ? subjectType : '';
    const framework = type
      ? FRAMEWORKS[type]
      : `NO TYPE WAS CHOSEN. Work out which of these the subject actually is — a career, a skill, a technology, an investment or a multi-year commitment — say so in subject_as_understood, and reason with that frame.`;

    const tGround = Date.now();
    const facts = (!type || GROUNDED_TYPES.has(type))
      ? await futureProofFacts({ subject: subject.trim(), subjectType: type }).catch(() => '')
      : '';
    console.log(`[fp-timing] grounding ${Date.now() - tGround}ms (${facts ? 'hit' : 'miss'})`);
    const tMain = Date.now();

    const userPrompt = `STRESS-TEST A LONG-TERM BET

SUBJECT: "${subject.trim()}"
TYPE: ${type || 'not stated — infer it'}
${context?.trim() ? `WHAT THEY TOLD US ABOUT THEIR SITUATION: ${context.trim()}` : 'THEY TOLD US NOTHING ABOUT THEIR SITUATION — do not invent one.'}
HORIZON THEY CHOSE: ${timeframe || '5 years'}

${framework}
${type === 'investment' ? INVESTMENT_POLICY : ''}
${facts || NO_SOURCES_BLOCK}

THE ONE RULE THIS TOOL EXISTS FOR
You are not forecasting. You are showing what can be seen now, what could
plausibly change, which assumptions the answer rests on, and what is worth
doing while it is still uncertain. A reader must always be able to tell which
of those three they are reading:

  OBSERVED   something true now, that you could show someone
  PROJECTED  a reasoned judgement about what may happen
  ASSUMED    a condition that has to hold for this analysis to stay valid

Never let a projection wear the clothes of an observation. "Demand falls in
two to three years" is a forecast dressed as a schedule; "could fall within
two to three years if hiring stays flat" is the same thought, honestly
dressed. Prefer: observed now · emerging · possible in N years · could
accelerate if X.

Do not put a URL in observed unless it came from the checked block.

WHERE THIS PERSON IS, YOU DO NOT KNOW.
Nothing in this request states a country unless they wrote one themselves in
their own words above. Do not quietly settle on one. Regulation, licensing,
wages, hiring and market structure are all jurisdiction-specific, and an answer
written for one country reads as fact to a visitor in another.

  - Where a claim does not depend on jurisdiction, write it neutrally.
  - Where a checked fact IS jurisdiction-specific, say whose it is, in the
    sentence: "in the US, BLS records...", "UK licensing requires...". Never
    present one country's rules or figures as how things simply are.
  - Where the answer genuinely turns on jurisdiction and you have not been
    told one, say so in the analysis and add it to sources_and_assumptions as
    an assumption the reader has to supply.

Any locale or region hint you may have been given describes where their browser
is, not where their career, business or money is. It is not a statement of
fact about them and must never be written as one.



CREDENTIALS: name a certification only if you are certain it currently exists
under that exact name. Otherwise describe it generically and say the reader
should check the current name.

${EVIDENCE_DISCIPLINE}
${FINAL_QUALITY_RULES}

Return ONLY valid JSON:
{
  "analysis_title": "The subject in AT MOST 6 words, as a label — no verb, no question, no horizon. Example: Small owner-operated plumbing business",
  "the_question": "The real question you are answering, reframed in one plain sentence, sentence case, ending in a question mark. Example: Is the underlying plumbing skill becoming more valuable even as the current business model comes under pressure?",
  "subject_as_understood": "Which analytical frame you used, one short sentence",
  "trajectory": "growing | stable | transforming | declining | volatile | context_dependent",
  "trajectory_label": "GROWING ↑ | STABLE → | TRANSFORMING ⟳ | DECLINING ↓ | VOLATILE ⚡ | CONTEXT-DEPENDENT ◇",

  "certainty": "high | moderate | low",
  "certainty_because": "One or two sentences naming WHICH PARTS are well supported and WHICH ARE NOT. Not a restatement of the label. The shape that works: 'X is well supported; the N-year outlook for Y and Z is much less certain.'",

  "the_pattern": "2-3 sentences on the forces actually driving this. Mark what is observed and what is inferred as you go.",

  "tailwinds": [
    {
      "force": "Name of it",
      "explanation": "One sentence on how it helps",
      "status": "observed_now | emerging | plausible — THIS IS A TIME AXIS, not an evidence claim: is the force already in play, just appearing, or still only possible? It does not mean the force is sourced. A force that is already in play and also sourced belongs in sources_and_assumptions.observed as well."
    }
  ],

  "headwinds": [
    {
      "force": "Name of it",
      "explanation": "One sentence on what the risk actually is",
      "status": "observed_now | emerging | plausible",
      "timing": "When it would bite, phrased as possibility not schedule — e.g. already visible, possible within 2-3 years, only if X happens"
    }
  ],

  "the_automation_question": null,

  "the_pivot": {
    "adjacent_moves": [
      {
        "move": "The specific move, built on what they already have",
        "why_resilient": "One sentence: why this still pays off across more than one of the scenarios below",
        "effort_required": "low | medium | high"
      }
    ],
    "the_version_worth_pursuing": "The most resilient form of what they proposed, given their strengths, the evidence, the uncertainties and the downside. Do not imply you know it will work."
  },

  "scenarios": {
    "bull_case":  { "if_true": "What would have to be true — conditions, not optimism", "then": "What happens under those conditions", "for_you": "What it would mean for this person specifically" },
    "base_case":  { "if_true": "...", "then": "...", "for_you": "..." },
    "bear_case":  { "if_true": "...", "then": "...", "for_you": "..." }
  },

  "what_this_means_for_you": "One paragraph synthesising what looks reasonably well supported, what stays uncertain, what matters given their situation, and where the most resilient opportunity is. Speak to them directly. No claim to privileged truth.",

  "one_action": "One thing worth doing in the next 90 days",
  "one_action_why": "One sentence: why this is worth doing even if the analysis above turns out wrong",

  "sources_and_assumptions": {
    "observed": [{ "claim": "The fact, one sentence, with its figure", "publisher": "Who published it", "published": "Its date", "url": "Direct URL", "jurisdiction": "Where it applies, or global" }],
    "inferred": ["A judgement you made, stated as yours"],
    "assumed": ["A condition that must hold for this analysis to stay valid — if it breaks, the analysis breaks"]
  }
}

THE AUTOMATION QUESTION is not always relevant. Include it ONLY when automation
materially bears on this subject; otherwise leave it null. When you do include
it, use this shape and this language:
{
  "central_to_conclusion": true or false — is automation one of the two or three things this answer actually turns on? Be honest. For a great many subjects the real story is route to market, succession, regulation or demand, and automation is a side note. Say false when it is a side note; the section will still be there, just folded away.
  "exposure": "currently_susceptible | increasingly_assisted | difficult_with_current_systems | could_become_exposed",
  "what_is_exposed": "Which specific tasks or parts, not the whole thing",
  "what_is_not": "What stays hard, and why",
  "net_effect": "Whether automation reads as threat, tool, or mostly beside the point here"
}
Never write that AI will or will not automate something. You do not know that.

THE THREE SCENARIOS must be genuinely different futures with different causes —
not one forecast written optimistically, neutrally and pessimistically. If your
base case is just the bull case with the enthusiasm removed, you have written
one scenario three times. The base case is NOT the prediction; do not present it
as more likely than the others unless you say why, from evidence.

ONE ACTION should be concrete, bounded, cheap next to what is at stake,
reversible or low-regret, and should generate information. It should still be
worth having done under more than one of the three scenarios. Do not tell
anyone to make a large irreversible career, financial or life decision because
this analysis came out favourable.



TAILWINDS AND HEADWINDS ARE NOT A QUOTA. Include a force only if knowing about
it would change what this person does or how confident they should be. Two that
matter beat four where the last two are filler, and one side may legitimately be
shorter than the other. Never pad to reach a number, and never repeat one force
under two names. Every item must have BOTH a force and an explanation — an entry
with one of them missing is not an item, so leave it out entirely.

LIMITS: tailwinds and headwinds AT MOST 4 each — a ceiling, not a target;
adjacent_moves AT MOST 3; each sources_and_assumptions list AT MOST 4. One
sentence per field except the_pattern, certainty_because and
what_this_means_for_you. Be terse.

Return ONLY valid JSON. ${NO_QUOTE_RULE}`;

    // Progressive (2026-10-16, lib/progressive.js): four section passes at
    // once — the trajectory, certainty and pattern first; the synthesis (what
    // this means for you, the one action) is written after them, handed the
    // analysis it sums up. Enum pins, force filters and source checks run on
    // every draft; the guard runs after the answer is on screen.
    const system = withLanguage(PERSONALITY, userLanguage)
      + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion)
      + ' ' + NO_QUOTE_RULE;
    const call = (content, maxTokens, tag) => callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content }],
    }, { label: tag });
    const SYNTHESIS = ['what_this_means_for_you', 'one_action', 'one_action_why'];
    const clean = (parsed) => {
      // The frontend switches on this enum, and withLanguage translates JSON
      // string values, so a translated trajectory would render as no style at all.
      const TRAJ = ['growing', 'stable', 'transforming', 'declining', 'volatile', 'context_dependent'];
      if (!TRAJ.includes(parsed.trajectory)) parsed.trajectory = 'context_dependent';
      const CERT = ['high', 'moderate', 'low'];
      if (!CERT.includes(parsed.certainty)) parsed.certainty = 'moderate';

      // A force with a name and no explanation, or an explanation and no name, is
      // not an item — it is half of one, and it rendered as an empty card. The
      // prompt says so too, but a prompt rule is not a mechanism.
      const usableForce = (x) => x && typeof x.force === 'string' && x.force.trim()
        && typeof x.explanation === 'string' && x.explanation.trim();
      parsed.tailwinds = (Array.isArray(parsed.tailwinds) ? parsed.tailwinds : []).filter(usableForce);
      parsed.headwinds = (Array.isArray(parsed.headwinds) ? parsed.headwinds : []).filter(usableForce);
      parsed.the_pivot = parsed.the_pivot || {};
      parsed.the_pivot.adjacent_moves = (Array.isArray(parsed.the_pivot.adjacent_moves) ? parsed.the_pivot.adjacent_moves : [])
        .filter(m => m && typeof m.move === 'string' && m.move.trim());

      // An observed record exists to be checked. Without a claim there is nothing
      // to check, and a URL that is not http(s) is not something to hand a reader.
      // The URLs the search actually returned. Anything else is the model
      // reconstructing a plausible path — one run produced two ISA links
      // differing only in a directory segment, and a link that 404s is worse
      // than no link because it looks checkable.
      const verifiedUrls = new Set(
        (groundedData(factsKey({ subject: subject.trim(), subjectType: type })) || [])
          .map(f => String((f && f.url) || '').trim().toLowerCase())
          .filter(Boolean)
      );

      const sa = parsed.sources_and_assumptions;
      if (sa && Array.isArray(sa.observed)) {
        sa.observed = sa.observed
          .map(o => (typeof o === 'string' ? { claim: o } : o))
          .filter(o => o && typeof o.claim === 'string' && o.claim.trim())
          // "BLS, cited by environmentalscience.org" is the record admitting its
          // own url does not point at the source. The instruction to follow the
          // figure back to its origin does not reliably hold, and a citation the
          // reader cannot follow is worse than no citation: it looks checkable.
          .filter(o => !/\b(cited by|via|as reported by|according to|reported on|republished)\b/i.test(String(o.publisher || '')))
          .map(o => {
            const url = typeof o.url === 'string' ? o.url.trim() : '';
            const wellFormed = /^https?:\/\//i.test(url);
            // If the search returned nothing (cold cache) there is nothing to
            // check against, so a well-formed url is left alone rather than
            // stripping every citation on the unverified path.
            const traceable = !verifiedUrls.size || verifiedUrls.has(url.toLowerCase());
            if (wellFormed && !traceable) {
              console.log(`[future-proof] observed url not among the searched sources, dropped: ${url}`);
            }
            return { ...o, url: (wellFormed && traceable) ? url : undefined };
          });
      }
      return parsed;
    };
    return await answer(req, res, {
      label: 'future-proof',
      parts: keyGroups([
        ['analysis_title', 'the_question', 'subject_as_understood', 'trajectory', 'trajectory_label', 'certainty', 'certainty_because', 'the_pattern'],
        ['tailwinds', 'headwinds'],
        ['the_automation_question', 'the_pivot'],
        ['scenarios', 'sources_and_assumptions'],
      ], (keys, i) => call(onlyKeys(userPrompt, keys), 2200, i ? `future-proof-${i + 1}` : 'future-proof')),
      after: async (d) => {
        const analysis = Object.fromEntries(Object.entries(d).filter(([k]) => !SYNTHESIS.includes(k)));
        const out = await call(onlyKeys(userPrompt, SYNTHESIS) + `\n\nTHE ANALYSIS ALREADY WRITTEN (other passes wrote it; synthesise THIS analysis, never contradict it):\n${JSON.stringify(analysis)}`, 1200, 'future-proof-synthesis');
        SYNTHESIS.forEach(k => { if (out?.[k] !== undefined) d[k] = out[k]; });
      },
      // groundedFacts strips cite tags before the block is rendered, but a
      // pass reads that block and can copy a tag back out into its own prose.
      finish: d => stripCites(clean(structuredClone(d))),
      ready: d => Boolean(d.subject_as_understood),
      complete: d => Boolean(d.subject_as_understood),
      check: async (parsed) => {
        clean(parsed);
        console.log(`[fp-timing] main ${Date.now() - tMain}ms`);
        const tGuard = Date.now();
        await guardAnalysis(parsed, req.body, startedAt, type);
        console.log(`[fp-timing] guard ${Date.now() - tGuard}ms | TOTAL ${Date.now() - startedAt}ms`);
      },
    });

  } catch (error) {
    console.error('FutureProof error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Only the prose. The enums are a contract with the frontend.
async function guardAnalysis(parsed, body, startedAt, type) {
  if (Date.now() - startedAt > GUARD_ENTRY_MS) {
    console.log('[future-proof-v2] v2 guard: skipped — out of time, answer returned unguarded');
    return;
  }
  const fields = [];
  const push = (path, v) => { if (typeof v === 'string' && v.trim().length > 15) fields.push([path, v]); };
  push('the_pattern', parsed.the_pattern);
  push('certainty_because', parsed.certainty_because);
  (parsed.tailwinds || []).forEach((x, i) => push(`tailwinds[${i}].explanation`, x && x.explanation));
  (parsed.headwinds || []).forEach((x, i) => push(`headwinds[${i}].explanation`, x && x.explanation));
  push('the_pivot.the_version_worth_pursuing', parsed.the_pivot && parsed.the_pivot.the_version_worth_pursuing);
  ['bull_case', 'base_case', 'bear_case'].forEach(k => {
    const sc = parsed.scenarios && parsed.scenarios[k];
    if (sc) { push(`scenarios.${k}.if_true`, sc.if_true); push(`scenarios.${k}.then`, sc.then); }
  });
  push('what_this_means_for_you', parsed.what_this_means_for_you);
  push('one_action', parsed.one_action);
  if (!fields.length) return;

  await runOutputGuard(parsed, {
    label: 'future-proof-v2',
    fields,
    supplied: `WHAT THE VISITOR TOLD US, IN FULL — nothing else about them is known:
Subject: ${body.subject || '(not given)'}
Type: ${type || '(not stated)'}
Their situation, in their words: ${(body.context || '').trim() || 'NOTHING — they wrote none'}
Horizon: ${body.timeframe || '(not given)'}

Nothing about their age, income, savings, seniority, location, family, risk
tolerance, or how much of their life is riding on this.

WHAT FAILS:
1. A projection written as an observation. "Demand drops in three years" is a
   forecast wearing a schedule; only "possible within three years if X" is
   honest. Dates and figures asserted flatly about the future are the specific
   failure this tool exists to avoid.
2. A statistic, study, survey, percentage or named source that was not in the
   checked-sources block. Inventing a plausible number is the most damaging
   thing this output can do, because it is the part a reader will repeat.
3. Certainty explained by restating its own label — "moderate, because there is
   moderate uncertainty" tells the reader nothing.
4. Three scenarios that are one forecast at three volumes, rather than three
   different sets of conditions.
5. Telling the visitor to make a large irreversible decision — quit, move,
   enrol, sell, go all in — on the strength of this analysis.
6. Inventing the visitor's circumstances: their savings, their seniority,
   their family, their appetite for risk, how much they can afford to lose.
7. Picking a country nobody named. Licensing, wages and regulation differ by
   jurisdiction; stating one country's version as the way things are is wrong
   for every reader outside it, and they cannot tell.
8. A figure with no traceable source. Any number that does not correspond to a
   sourced entry in sources_and_assumptions.observed is invented as far as the
   reader can tell, and it is the part they will repeat.
8b. The word OBSERVED attached to a claim with no matching record in that list.
   The label is a promise that the reader can go and check; when the list is
   empty the promise is false and the claim is inference wearing a badge.
9. A personal timeline derived from an age or a tenure — "succession becomes
   pressing in five to eight years" is a deadline nobody gave, built out of one
   number the visitor happened to mention.
${type === 'investment' ? `7. For an investment: any buy/sell/hold direction, any return or price
   forecast, any probability attached to a scenario, or a one_action that
   amounts to moving money.` : ''}`,
  }, { max_tokens: 1800 });
}

router.outputStandard = 'lean';
// future-proof-v2. Reviewed 2026-08-27. The failure mode here is not rudeness
// or invention of the ordinary kind — it is confidence. A tool that answers
// "what happens to my career" will produce dates, percentages and schedules
// because that is what the answer to that question looks like, and a reader
// cannot tell a remembered figure from a made-up one. So the volatile facts
// are searched before the analysis runs, and the guard's job is to catch the
// forecast that slipped back into the present tense.
router.outputGuard = {
  prohibit: [
    'projection_stated_as_observed_fact',
    'statistic_or_source_not_in_the_checked_block',
    'certainty_explained_by_restating_its_own_label',
    'scenarios_that_are_one_forecast_at_three_volumes',
    'urges_a_large_irreversible_decision',
    'invents_the_visitors_circumstances',
    'asserts_one_countrys_rules_or_figures_as_universal',
    'statistic_with_no_traceable_source_record',
    'claim_labelled_observed_with_no_matching_source_record',
    'inference_written_as_established_fact',
    'proxy_treated_as_proof_of_the_conclusion',
    'specificity_exceeding_the_evidence',
    'user_supplied_context_embellished_into_a_capability',
    'sourced_premise_licensing_an_unsourced_conclusion',
    'categorical_language_beyond_the_evidence',
    'privileged_truth_rhetoric',
    'automation_boundary_claimed_permanent',
    'conclusion_inside_an_observed_card_left_unlabelled',
    'narrow_source_supporting_a_broad_generalisation',
    'horizon_treated_as_a_life_event_or_endpoint',
    'named_niche_recommended_on_category_level_evidence',
    'personal_timeline_derived_from_age_or_tenure',
    'investment_direction_or_return_forecast',
  ],
  require: [
    'observations_distinguishable_from_projections',
    'action_useful_even_if_the_read_is_wrong',
    'action_reduces_the_biggest_uncertainty',
    'fulfills_tool_promise',
  ],
};

module.exports = router;
