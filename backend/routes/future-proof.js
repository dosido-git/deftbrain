const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { groundedFacts, normalizeKeyPart, stripCites } = require('../lib/groundedFacts');
const { runOutputGuard } = require('../lib/outputGuard');

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — write quoted phrases or names plainly or with single quotes, or it breaks the JSON.';

const DAY_MS = 24 * 60 * 60 * 1000;
// Labour markets and technology move, but not hourly. A week is long enough
// that one search serves many visitors asking about the same field, and short
// enough that nothing here goes stale in a way that changes an answer.
const FACT_TTL_MS = 7 * DAY_MS;
const COLD_WAIT_MS = 12000;
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
const GROUNDED_TYPES = new Set(['career', 'skill', 'technology', 'investment']);

function factsKey({ subject, subjectType }) {
  return ['future-proof', normalizeKeyPart(subjectType || 'general'), normalizeKeyPart(subject).slice(0, 80)].join('|');
}

function renderFactsBlock(verified) {
  if (!Array.isArray(verified) || !verified.length) return '';
  return `\n\nCHECKED AGAINST CURRENT SOURCES TODAY — these are the ONLY figures, dates, named programmes and current conditions you may state as fact. Each carries the source it came from:\n` +
    verified.map(f => `- [${f.kind}] ${f.detail} (source: ${f.source})`).join('\n') +
    `\n\nEverything not on this list is either your inference or an assumption, and must be labelled as such. If a claim you want to make needs a number that is not here, make the claim without the number or leave it out. Do not reconstruct a figure from memory to fill a gap.`;
}

function futureProofFacts({ subject, subjectType }) {
  return groundedFacts({
    cacheKey: factsKey({ subject, subjectType }),
    label: 'future-proof-facts',
    ttlMs: FACT_TTL_MS,
    coldWaitMs: COLD_WAIT_MS,
    maxTokens: 2500,
    system: 'You verify current conditions with web search. Prefer primary and institutional sources — government labour statistics, regulators, standards bodies, company filings, the organisation that actually issues a credential — then established industry research. Do not use forums, opinion pieces, vendor marketing or listicles. Report only what you actually saw published, with its date. Skip anything you cannot confirm; an empty array is a correct and useful answer. Never invent a URL, a study, a survey or a statistic. Return ONLY valid JSON. ' + NO_QUOTE_RULE,
    userPrompt: `Verify with web_search the current, checkable conditions someone would need in order to think clearly about this over the next several years: "${subject}"${subjectType ? ` (treated as a ${subjectType})` : ''}.

Look for, and report ONLY what you can see published with a date:
(1) current demand, employment, adoption or market conditions, with the period the figure covers;
(2) a named credential, licence, standard or programme that actually exists, under its exact current name;
(3) a regulatory or policy change already enacted or formally proposed, with its date;
(4) a documented, dated shift in how the work is done or the technology is deployed;
(5) anything published that directly contradicts the common assumption about this subject.

These are CURRENT CONDITIONS, not forecasts. Do not search for or report predictions, analyst targets, price forecasts or anyone's opinion about what will happen.

Return ONLY valid JSON:
{ "verified": [{ "kind": "condition | credential | policy | shift | contradiction", "detail": "The published fact in one sentence, with its figure and the period it covers", "source": "The publishing organisation or domain, and the date" }] }`,
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

    const facts = (!type || GROUNDED_TYPES.has(type))
      ? await futureProofFacts({ subject: subject.trim(), subjectType: type }).catch(() => '')
      : '';

    const userPrompt = `STRESS-TEST A LONG-TERM BET

SUBJECT: "${subject.trim()}"
TYPE: ${type || 'not stated — infer it'}
${context?.trim() ? `WHAT THEY TOLD US ABOUT THEIR SITUATION: ${context.trim()}` : 'THEY TOLD US NOTHING ABOUT THEIR SITUATION — do not invent one.'}
HORIZON THEY CHOSE: ${timeframe || '5 years'}

${framework}
${type === 'investment' ? INVESTMENT_POLICY : ''}
${facts}

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

Do not invent a source, a statistic, a study, a survey, a market condition or
a URL. If you did not see it in the checked block above, you did not see it.

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
      "status": "observed_now | emerging | plausible"
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
    "observed": ["A current fact this analysis rests on, with its source where you have one"],
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

BEFORE YOU RETURN, CHECK YOUR OWN ANSWER SILENTLY:
1. Did I state any speculation as fact?
2. Is every current factual claim either in the checked block or clearly marked as my inference?
3. Did I invent a source, statistic, trend, study or citation?
4. Can the reader tell observations from projections without effort?
5. Did I explain where the uncertainty comes from, or just label it?
6. Are bull, base and bear genuinely different conditional futures?
7. Are the adjacent moves built on what this person already has?
8. Is the version worth pursuing resilient, or merely fashionable?
9. Is the one action still worth doing if my read is wrong?
10. Am I claiming more knowledge of the future than the evidence supports?
11. Does this help them decide, or does it just sound authoritative?
12. Did I name a country nobody told me, or state one jurisdiction's rules as though they were universal?
13. Does certainty_because say which parts are solid and which are not, rather than restating the label?
14. Is analysis_title six words or fewer, and is the_question one plain sentence?
Fix anything that fails, then return only the corrected version.

LIMITS: tailwinds and headwinds AT MOST 4 each; adjacent_moves AT MOST 3; each
sources_and_assumptions list AT MOST 4. One sentence per field except
the_pattern, certainty_because and what_this_means_for_you. Be terse.

Return ONLY valid JSON. ${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 6500,
      system: withLanguage(PERSONALITY, userLanguage)
        + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion)
        + ' ' + NO_QUOTE_RULE,
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'future-proof' });

    if (!parsed.subject_as_understood) {
      return res.status(500).json({ error: 'Could not generate a response. Please try again.' });
    }

    // The frontend switches on this enum, and withLanguage translates JSON
    // string values, so a translated trajectory would render as no style at all.
    const TRAJ = ['growing', 'stable', 'transforming', 'declining', 'volatile', 'context_dependent'];
    if (!TRAJ.includes(parsed.trajectory)) parsed.trajectory = 'context_dependent';
    const CERT = ['high', 'moderate', 'low'];
    if (!CERT.includes(parsed.certainty)) parsed.certainty = 'moderate';

    await guardAnalysis(parsed, req.body, startedAt, type);
    // groundedFacts strips cite tags before the block is rendered, but the main
    // call reads that block and can copy a tag back out into its own prose.
    // Stripping again on the way out costs nothing and catches that.
    res.json(stripCites(parsed));

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
${type === 'investment' ? `7. For an investment: any buy/sell/hold direction, any return or price
   forecast, any probability attached to a scenario, or a one_action that
   amounts to moving money.` : ''}`,
  }, { max_tokens: 1800 });
}

router.outputStandard = 'v2';
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
    'investment_direction_or_return_forecast',
  ],
  require: [
    'observations_distinguishable_from_projections',
    'action_useful_even_if_the_read_is_wrong',
    'fulfills_tool_promise',
  ],
};

module.exports = router;
