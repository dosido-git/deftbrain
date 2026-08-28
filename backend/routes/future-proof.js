const express = require('express');
const router = express.Router();
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

// ════════════════════════════════════════════════════════════
// EVIDENCE DISCIPLINE
// ════════════════════════════════════════════════════════════
// Supplied by the owner and used close to verbatim. It replaces three shorter
// rules that said parts of the same thing in three places — a prompt that
// states a rule three times reads as three weak rules rather than one firm one.
const EVIDENCE_DISCIPLINE = `
EVIDENCE DISCIPLINE — HARD REQUIREMENTS

Future Proof must distinguish rigorously between what is OBSERVED, what is INFERRED, and what is ASSUMED.

The purpose is not to maximize citations. The purpose is to make fewer, better claims and accurately represent how each claim is known.

1. OBSERVED MEANS VERIFIED

You may label a claim OBSERVED or OBSERVED NOW only when it is supported by a specific, credible source that is actually available to this analysis.

Every OBSERVED claim must have a corresponding source record in Sources & Assumptions.

If you cannot provide a source for a claim, you MUST NOT label it OBSERVED, even if:
- it seems obviously true;
- it is widely believed;
- it is consistent with your training knowledge;
- you remember having seen evidence for it;
- it is a reasonable description of current conditions.

No source = not OBSERVED.

Do not use phrases such as:
- research shows
- data shows
- studies indicate
- the market is...
- is observable now
- has increased/decreased
- is becoming more competitive
- is structural, not cyclical

unless the evidence available to this analysis actually supports that formulation.

2. OBSERVED CLAIMS MUST BE TRACEABLE

Before returning the analysis, perform a claim-to-source audit.

For every claim labeled OBSERVED or OBSERVED NOW, ask:

What specific source in Sources & Assumptions supports this claim?

If there is no answer, do one of three things:
A. obtain adequate evidence if source retrieval is available;
B. reclassify the statement as INFERRED, EMERGING, or PLAUSIBLE;
C. remove the claim.

Never leave an orphan OBSERVED claim in the output.

The Sources & Assumptions section must contain an OBSERVED subsection whenever the main analysis contains OBSERVED claims.

If there are no adequately sourced observations, omit the OBSERVED subsection and do not use OBSERVED labels elsewhere.

3. DO NOT TURN INFERENCE INTO FACT

Reasoning from observed facts is encouraged. Future Proof is a decision-support tool, not merely a research summary.

But inference must remain visibly inference.

For example, do not write:

Scarcity in these specialties is structural, not cyclical.

unless evidence establishes that.

Prefer:

These specialties may offer more durable scarcity because failures are costly and the work requires substantial systems judgment.

Likewise, do not write:

The field is not shrinking.

when the evidence only shows continued employment or demand in some markets.

Prefer:

The evidence available here does not establish that the field as a whole is declining; the clearer risk is pressure on undifferentiated implementation work.

Use calibrated language such as:
- may
- could
- appears
- suggests
- is consistent with
- plausible
- emerging
- if this continues
- under this assumption
- the available evidence does not establish...

when that accurately reflects the evidence.

4. DO NOT OVERINTERPRET PROXIES

A related fact is not automatically evidence for the conclusion you want to draw.

Examples:

More AI/ML credentials or bootcamps do not by themselves prove that the AI/ML labor market has become more competitive.

More AI coding capability does not by itself prove that engineering headcount will fall.

High compensation does not by itself prove a labor shortage.

More remote hiring does not by itself prove downward wage pressure.

If the evidence supports only the proxy, state the proxy and identify the conclusion as an inference.

5. USE THE STRONGEST AVAILABLE SOURCE

When current evidence is needed, prefer sources in roughly this order:

1. Government agencies and regulators
2. Original datasets and original research
3. Universities and established research institutions
4. Professional or industry organizations with disclosed methodology
5. Company reports containing original data
6. High-quality journalism reporting verifiable evidence
7. Specialist commercial sources
8. Secondary blogs or aggregators only when better evidence is unavailable

Do not cite a secondary article for a statistic when the original source is reasonably available.

Never fabricate:
- sources
- URLs
- report titles
- publication dates
- statistics
- survey findings
- quotations
- source relationships

If a source cannot be verified, do not present it as verified evidence.

6. SPECIFICITY MUST NOT EXCEED THE EVIDENCE

The more specific a claim is, the stronger its evidentiary burden.

Numbers, percentages, dates, timeframes, rankings, rates of change, labor-market trends, regulatory claims, and statements about what most employers or consumers do require appropriate support.

When reliable evidence does not justify that precision, generalize.

Prefer:

Available evidence suggests skilled-trade shortages in some markets.

over an unsupported:

70% of contractors cannot find qualified plumbers.

A modest supported statement is better than an impressive unsupported statistic.

6a. MATCH SOURCE AUTHORITY TO CLAIM BREADTH

Specificity is one dimension of evidentiary burden. Breadth is another, and it
is the one more often ignored.

A single company blog, a job board's own report, a trade publication, a vendor
survey or any commercial source may support a narrow, attributed claim about
what that source measured. It cannot support a generalization about an
industry, a labour market, a regulatory regime, an insurance regime, or what
employers or insurers do as a class.

BAD:
A job board's salary report is cited, and the analysis concludes that wages in
the trade are under pressure.

BETTER:
The claim stays the size of its source: this job board reported X across its own
listings for that period. Any broader statement is INFERRED, and says so.

Regulatory, licensing and insurance claims carry the highest burden of all,
because a reader may act on them. State those only from the regulator, the
licensing body or the statute itself. If you have no such source, describe the
question rather than answering it: say that requirements vary and name what the
reader should check, with whom.

7. PERSONAL CONTEXT IS NOT EXTERNAL EVIDENCE

Treat facts supplied by the user as USER-PROVIDED CONTEXT, not OBSERVED external evidence.

Do not independently embellish them.

For example, eight years of backend experience does not establish:
- experience at large scale;
- exceptional systems judgment;
- senior-level ability;
- a durable competitive moat.

Those may become assumptions or conditional inferences, but not facts.

8. ASSUMPTIONS MUST IDENTIFY WHAT COULD CHANGE THE ANSWER

Use ASSUMED for important unknowns that materially affect the analysis.

Good assumptions explain:
- what is unknown;
- what the analysis is currently assuming;
- how the conclusion might change if the assumption is wrong.

Do not introduce unsupported personal judgments about health, ability, motivation, finances, retirement timing, or other personal circumstances. In particular, an age or a tenure the visitor mentions is one fact and not a schedule: never convert it into a window of urgency.

8a. THE HORIZON IS A LENS, NOT AN EVENT IN THEIR LIFE

The visitor chose 1, 3, 5 or 10 years as the distance to look. That is a
setting on a control, not a statement about their plans.

A 10-year horizon does not mean they retire, sell, exit, close, graduate, hand
over, wind down or leave in ten years. It does not mean the end of the horizon
is a deadline, a milestone or a decision point. Do not build the analysis around
an endpoint they never described, and do not write the final year as though
something happens in it.

If an endpoint genuinely matters to the reasoning, name it as an assumption and
say the answer changes if their plan differs.

9. SOURCES & ASSUMPTIONS

Keep this section concise and grouped as:

OBSERVED
[verified claims with source title, publisher/organization, date, and URL when available]

INFERRED
[important conclusions Future Proof draws from evidence or user context, clearly identified as reasoning rather than source findings]

ASSUMED
[important unknowns on which the analysis depends]

Do not populate a category merely to make the section look complete.

It is acceptable to have no OBSERVED entries when reliable current evidence is unavailable.

10. FINAL EVIDENCE AUDIT

Before returning the answer, silently inspect the entire analysis and ask:

- Is every OBSERVED claim backed by an actual source?
- Does every OBSERVED claim appear in or map clearly to Sources & Assumptions?
- Did I call an inference an observation anywhere?
- Did I convert a proxy into a stronger conclusion than it supports?
- Did I use absolute language where conditional language is warranted?
- Did I state a statistic or timeframe that I cannot substantiate?
- Did I infer capabilities or circumstances from the user's background that the user did not provide?
- Does the wording communicate the actual strength of the evidence?
- Would a skeptical reader be able to tell what we know, what we think, and what we are assuming?
- Did I name a country nobody told me, or state one jurisdiction's rules as though they were universal?
- Are bull, base and bear genuinely different conditional futures rather than one forecast at three volumes?
- Is the one action still worth doing if my read is wrong?
- Is analysis_title six words or fewer, and is the_question one plain sentence?
- Is every tailwind and headwind there because it changes something, and does each have both a force and an explanation?

If any answer reveals a problem, revise the analysis before returning it.

CRITICAL PRINCIPLE:

Do not make the output more authoritative by adding unsupported specificity.

Future Proof should earn trust by being precise about uncertainty.

When forced to choose between:
- a stronger-sounding unsupported claim, and
- a more modest claim that accurately reflects the evidence,

always choose the more modest claim.

The objective is not to sound certain about the future.
The objective is to help the user make a sound decision despite uncertainty.
`;


// ════════════════════════════════════════════════════════════
// FINAL REASONING & OUTPUT QUALITY
// ════════════════════════════════════════════════════════════
// Owner-supplied, appended after EVIDENCE_DISCIPLINE. Item 1 is the one that
// targets the failure the previous round left standing: a sourced premise
// silently licensing an unsourced conclusion.
const FINAL_QUALITY_RULES = `
FINAL REASONING & OUTPUT QUALITY RULES

Apply these requirements in addition to all existing Future Proof evidence, uncertainty, sourcing, scenario, and DeftBrain instructions.

1. SEPARATE A SOURCED FACT FROM THE INFERENCE DRAWN FROM IT

A source supporting a factual premise does NOT automatically make the conclusion drawn from that premise OBSERVED.

Treat these as separate claims:

SOURCE-SUPPORTED FACT:
A source reports or measures X.

INTERPRETATION:
X may suggest Y.

Only the first may be labeled OBSERVED unless the source itself establishes Y.

Example:

BAD:
Software postings are down and AI-attributed layoffs are rising, so implementation-level hiring restraint is real — OBSERVED NOW.

BETTER:
Software postings are down substantially from their peak, and tracked layoffs increasingly cite AI or automation — OBSERVED NOW.

Then separately:

INFERRED: these signals are consistent with increasing pressure on implementation-heavy roles, but the available evidence does not establish how concentrated that pressure is by role or seniority.

Likewise:

BAD:
BLS projects 15% employment growth, showing that software engineering is not in structural decline.

BETTER:
BLS projects 15% employment growth through 2034 — OBSERVED.

Then:

INFERRED: this projection argues against assuming broad structural decline, although projections may not capture how quickly AI changes labor demand.

Before assigning OBSERVED, ask:

Does the cited source establish this entire sentence, or only the factual premise from which I am drawing a conclusion?

If only the premise is sourced, split the statement and label the interpretation appropriately.

1a. A CARD'S STATUS DOES NOT COVER EVERY SENTENCE INSIDE IT

Tailwinds and headwinds carry a status — observed_now, emerging, plausible —
and that status describes the FORCE, not everything written underneath it.

An explanation that starts from an observed fact and then draws a conclusion
must mark the conclusion. Write the observation, then start a new sentence with
INFERRED: and say what you are concluding.

BAD, inside a card marked observed_now:
Remote hiring has widened the labour pool for backend generalist roles, which
puts downward pressure on wages for undifferentiated work.

BETTER:
Remote hiring has widened the labour pool for backend generalist roles.
INFERRED: this may put downward pressure on wages for undifferentiated work,
though the evidence here does not establish by how much.

The reader is looking at a chip that says OBSERVED NOW. Everything they read
under it inherits that authority unless you take it back explicitly.

2. DO NOT OVERSTATE WHAT FORECASTS ESTABLISH

Forecasts, projections, surveys, job-posting indexes, company announcements, and individual-company decisions are evidence, but each has limits.

Do not treat:
- a projection as an observed future outcome;
- one company's decision as an industry trend;
- job postings as equivalent to employment;
- layoffs as proof of long-term occupational decline;
- a survey as representative beyond its sampled population;
- a correlation as a causal explanation;
- a proxy as direct measurement of the phenomenon being discussed.

State the observed evidence first, then make only the inference that evidence reasonably supports.

When evidence conflicts, preserve the conflict rather than forcing a conclusion.

It is acceptable — and often preferable — to say:

These signals are not yet reconciled.

3. CALIBRATE ABSOLUTE LANGUAGE

Avoid categorical language when the evidence supports only a directional or conditional judgment.

Be especially cautious with phrases such as:

- is structural
- is not cyclical
- will remain
- cannot be automated
- is non-automatable
- is safe
- is declining
- is not declining
- proves
- guarantees
- clearly shows
- will replace
- will not replace
- fewer workers will be needed

Prefer calibrated formulations where appropriate:

- may be more durable
- currently appears less susceptible
- the available evidence suggests
- is consistent with
- could result in
- may increase/decrease
- remains uncertain
- current systems struggle with
- the evidence does not establish
- if this pattern continues

Do not weaken claims merely for rhetorical caution. Match the strength of the wording to the actual strength of the evidence.

4. NO HONESTY OR PRIVILEGED-TRUTH RHETORIC

Do not use phrases such as:

- the honest take
- the honest picture
- the truth is
- the reality is
- here's the real story
- brutally honest
- the hard truth
- what nobody tells you

Future Proof does not claim privileged access to truth.

Prefer:

- The available evidence suggests...
- Taken together...
- What this means for you...
- The clearest conclusion from the available evidence is...
- The evidence points in two directions...

The authority of the analysis must come from reasoning and evidence, not rhetorical claims of honesty.

5. ONE ACTION MUST TEST THE BIGGEST UNCERTAINTY

ONE ACTION — NEXT 90 DAYS is not merely a generic next step.

Before choosing the action, identify:

What unresolved uncertainty matters most to this user's decision?

Then, whenever practical, design the action to generate firsthand evidence about that uncertainty.

Prefer actions that are:

- concrete;
- small enough to execute;
- low-cost;
- low-regret;
- reversible;
- personally relevant;
- capable of generating new information;
- useful even if the forecast is wrong.

Prefer EXPERIMENTS over generic research when a reasonable experiment is possible.

For example, if the central uncertainty is how much AI can perform this user's actual engineering work:

WEAKER:
Talk to several senior engineers about how their jobs have changed.

STRONGER:
Use an AI coding tool deliberately across one real production project and record where it saves time, where it fails, and where your judgment materially changes the result.

External conversations may supplement the experiment:

Then compare what you learned with one experienced practitioner working in the direction you are considering.

The purpose of One Action is not merely to advance the recommended path.

It should REDUCE UNCERTAINTY.

Ask before returning it:

If the user completes this action, will they know something important that they do not know now?

If not, improve the action.

5a. RECOMMEND THE CATEGORY CONFIDENTLY, THE NICHE ONLY ON EVIDENCE

Adjacent moves and the version worth pursuing are recommendations, and the same
evidentiary rule applies to them: be as specific as the evidence allows and no
more.

You may name a CATEGORY of opportunity with confidence when the reasoning
supports it — work where failure is expensive, work that compounds with what
they already have, work closer to the decision than to the implementation.
That judgement is what the tool is for, and hedging it makes the output useless.

Naming a PARTICULAR NICHE is a narrower claim and needs narrower support. Do not
send someone toward one named specialism, sub-field, certification, sector or
job title as though its prospects were established, when what you actually have
is a general argument about the category.

BAD:
Move into utility vegetation management — demand there is structural.

BETTER:
The more durable direction is work where the consequences of getting it wrong
are expensive and the customer cannot easily switch. Utility and municipal
contracting is one example of that shape; whether it holds in your area is
something to check locally.

Where you can support the niche, say why and from what. Where you cannot, give
the category, offer the niche as an illustration of it, and say what the reader
would need to find out to choose between the examples.

6. DO NOT DECLARE HUMAN CAPABILITIES PERMANENTLY NON-AUTOMATABLE

When discussing automation, distinguish CURRENT capability from FUTURE possibility.

Avoid:

Judgment is non-automatable.

Prefer:

Current AI systems are less reliable at tasks requiring substantial context, ambiguous tradeoffs, accountability, or novel problem-solving.

Then acknowledge where appropriate:

The available evidence does not establish that this boundary is permanent.

Future Proof analyzes trajectories. It must not freeze today's technology boundary into a permanent fact.

7. OUTPUT OBJECT COMPLETENESS

Before rendering the result, validate every output section and object.

No card, paragraph, scenario, force, recommendation, automation section, or action may render with:

- missing opening text;
- sentence fragments;
- truncated labels;
- missing explanations;
- undefined/null content;
- duplicated text;
- malformed transitions;
- orphaned punctuation;
- broken interpolation;
- headings without content;
- content that appears to begin in the middle of a sentence.

Every structured item must contain all required fields before it is rendered.

For example, a Tailwind or Headwind should not render unless its required fields are complete:

title
epistemic status
explanation

If a required field is missing, either regenerate that object or omit it.

Never expose malformed model output to the user merely because the JSON technically parsed.

8. SEMANTIC QA AFTER STRUCTURAL QA

Valid JSON is not sufficient.

After generation and before display, perform a final semantic review of the assembled output.

Check:

A. Does every sentence make grammatical sense in context?

B. Does every paragraph begin and end cleanly?

C. Does any sentence appear to be missing words?

D. Does each heading accurately describe the content beneath it?

E. Does every OBSERVED label map to supporting evidence?

F. Did any sourced fact silently turn into an unsupported conclusion?

G. Did any inference become categorical merely because its premise was sourced?

H. Did I use absolute language beyond what the evidence supports?

I. Did I use honest, truth, reality, or similar privileged-truth rhetoric?

J. Does One Action test or reduce an important uncertainty?

K. Is the action useful even if the trajectory analysis turns out to be wrong?

L. Did I accidentally claim today's automation boundary is permanent?

M. Inside any card marked observed_now, did a conclusion ride on the chip's authority without being labelled INFERRED?

N. Is any industry, regulatory, insurance or labour-market generalization resting on a commercial, secondary or single-company source?

O. Did I treat the chosen horizon as a retirement, sale, exit, closure or other event in this person's life?

P. Did I name a particular niche as though its prospects were established, when the evidence supports only the category?

If any check fails, revise the affected section before returning the analysis.

9. DO NOT OVERCORRECT

These rules are intended to improve precision, not make Future Proof timid, vague, repetitive, or overloaded with caveats.

Continue to:

- draw useful inferences;
- synthesize evidence;
- identify meaningful patterns;
- make recommendations;
- identify resilient paths;
- distinguish stronger from weaker options;
- give the user a clear conclusion;
- provide a concrete next action.

Do not prefix every sentence with maybe, possibly, or it is uncertain.

Instead, classify the evidence correctly and then write naturally.

A useful inference clearly labeled as an inference is desirable.

An unsupported inference disguised as an observation is not.

10. FINAL FUTURE PROOF TEST

Before returning the analysis, ask:

What do we actually know?

What are we inferring from what we know?

What are we assuming because we do not know?

What remains genuinely uncertain?

What decision does that uncertainty create for this particular user?

What small action could give this user better information while remaining useful across several plausible futures?

The final output should leave the user with:

- a clearer picture of current conditions;
- an understandable account of uncertainty;
- several plausible ways the future could unfold;
- a more resilient version of the path being considered;
- and one practical way to learn or improve their position now.

Future Proof should never sound less useful because it is more careful.

Its value comes from helping the user make a better decision WITHOUT pretending that uncertainty has disappeared.
`;

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

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 6500,
      system: withLanguage(PERSONALITY, userLanguage)
        + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion)
        + ' ' + NO_QUOTE_RULE,
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'future-proof' });

    console.log(`[fp-timing] main ${Date.now() - tMain}ms`);
    if (!parsed.subject_as_understood) {
      return res.status(500).json({ error: 'Could not generate a response. Please try again.' });
    }

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

    const tGuard = Date.now();
    await guardAnalysis(parsed, req.body, startedAt, type);
    console.log(`[fp-timing] guard ${Date.now() - tGuard}ms | TOTAL ${Date.now() - startedAt}ms`);
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
