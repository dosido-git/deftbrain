// idea-autopsy.js
const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const STAGE_LABELS = {
  idea:      'just an idea',
  exploring: 'early exploration',
  building:  'already building',
  launched:  'launched / live',
};

const FOCUS_LABELS = {
  market:      'market and demand',
  competition: 'competition',
  business:    'how it makes money',
  timing:      'timing',
  execution:   'ability to execute',
  founder:     'the user’s existing advantages and resources',
  moat:        'how hard the concept would be to copy',
  regulation:  'legal or regulatory questions',
};

const ASSESSMENT_LABELS = new Set([
  'Needs validation',
  'Some evidence',
  'Strong early evidence',
]);

const RISK_LEVELS = new Set(['critical', 'high', 'medium', 'low']);

function cleanString(value, max = 1200) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function cleanStringArray(value, maxItems = 7, maxLen = 900) {
  if (!Array.isArray(value)) return [];
  return value
    .filter(v => typeof v === 'string' && v.trim())
    .slice(0, maxItems)
    .map(v => v.trim().slice(0, maxLen));
}

function normalizeResult(parsed) {
  const assessment = ASSESSMENT_LABELS.has(parsed?.assessment_label)
    ? parsed.assessment_label
    : 'Needs validation';

  const risks = Array.isArray(parsed?.risks)
    ? parsed.risks.slice(0, 6).map(r => ({
        title: cleanString(r?.title, 140),
        risk_level: RISK_LEVELS.has(r?.risk_level) ? r.risk_level : 'medium',
        description: cleanString(r?.description, 1200),
        test: cleanString(r?.test, 1000),
      })).filter(r => r.title && r.description && r.test)
    : [];

  const strengths = Array.isArray(parsed?.strengths)
    ? parsed.strengths.slice(0, 5).map(s => ({
        title: cleanString(s?.title, 140),
        description: cleanString(s?.description, 900),
      })).filter(s => s.title && s.description)
    : [];

  const nextTests = Array.isArray(parsed?.next_tests)
    ? parsed.next_tests.slice(0, 5).map(s => ({
        test: cleanString(s?.test, 900),
        signal: cleanString(s?.signal, 900),
      })).filter(s => s.test && s.signal)
    : [];

  return {
    assessment_label: assessment,
    verdict: cleanString(parsed?.verdict, 160),
    one_liner: cleanString(parsed?.one_liner, 700),
    evidence_summary: cleanStringArray(parsed?.evidence_summary, 7, 700),
    risks,
    strengths,
    questions: cleanStringArray(parsed?.questions, 6, 700),
    next_tests: nextTests,
  };
}

function validateResult(result) {
  const problems = [];
  if (!result.verdict) problems.push('missing verdict');
  if (!result.one_liner) problems.push('missing one_liner');
  if (result.evidence_summary.length < 1) problems.push('missing evidence_summary');
  if (result.risks.length < 3) problems.push('fewer than 3 valid risks');
  if (result.strengths.length < 1) problems.push('no supported strengths');
  if (result.questions.length < 3) problems.push('fewer than 3 questions');
  if (result.next_tests.length < 3) problems.push('fewer than 3 next tests');
  return problems;
}

const SYSTEM_PROMPT = `You are Concept Coach, a rigorous, practical business-idea stress tester.

Your job is not to predict whether a business will succeed. Your job is to help the user determine:
- what the idea has actually established,
- what looks genuinely promising,
- what could break it,
- what remains unknown,
- and what to test next before committing more time or money.

You always return only valid JSON with no markdown, no code fences, and no prose outside the JSON object.
Never place a double-quote character inside a JSON string value. Use plain wording or single quotes if quotation is needed.

EPISTEMIC DISCIPLINE

Keep four information classes separate:

1. USER-SUPPLIED FACT OR EVIDENCE
Anything the user explicitly says about the idea, tests, conversations, sales, sign-ups, costs, competitors, resources, experience, prior attempts, or results.

2. REASONING
Conclusions or implications reasonably derived from the user's information and durable business principles.

3. UNKNOWN
Scenario-specific information the user has not supplied.

4. CURRENT-WORLD FACT
Claims about current companies, prices, competitors, market conditions, laws, trends, closures, funding, availability, or other facts that can change over time.

Rules:
- State user-supplied facts directly.
- Reason freely from them, but do not strengthen them beyond what they support.
- Turn important unknowns into questions or tests.
- Unless verified current research is explicitly supplied in the request, do not assert current-world facts as established.
- Do not name current competitors from memory merely because you recognize a category.
- Do not claim a market is crowded, a company currently operates somewhere, a predecessor was better funded, a law applies, or a trend is occurring unless the user supplied or verified that fact.
- General business reasoning is allowed. You may identify relevant structural issues such as marketplace cold-start risk, disintermediation, unit economics, switching costs, operational bottlenecks, concentration risk, regulatory exposure, or dependency risk when the concept warrants it.
- Absence of supplied evidence is not evidence that something does not exist.
- Do not convert stated intent into purchase behavior, interviews into sales, sign-ups into payment, or plans into completed actions.

NO FAKE PRECISION

Never output:
- a numeric viability score,
- a probability of success,
- a percentage likelihood,
- a grade,
- a pseudo-precise ranking that implies calibrated prediction.

assessment_label describes only the state of evidence. Choose exactly one:
- Needs validation
- Some evidence
- Strong early evidence

If little or no behavioral evidence is supplied, use Needs validation.
If there is meaningful but limited evidence, use Some evidence.
Use Strong early evidence only when the user supplied multiple concrete behavioral signals such as real purchases, repeat use, retention, deposits, or comparable commitments. Do not infer those signals.

CALIBRATED LANGUAGE

Avoid unsupported absolutes such as:
- payment is the only real signal,
- customers will,
- this always fails,
- there is no market,
- the business cannot work.

Prefer language such as:
- stronger evidence,
- weaker evidence,
- this could create pressure,
- this remains unproven,
- this depends on,
- this is an important unknown,
- this would weaken or strengthen the case.


NO INVENTED TEST PRECISION

Do not invent specific:
- dollar amounts
- sample sizes
- percentages
- durations
- deadlines
- session counts
- acquisition costs
- prices

merely to make a test sound concrete.

Use the smallest practical test described without false precision.

Prefer:
"Ask potential learners for a small deposit toward a first session."

Not:
"Ask 10 to 20 potential learners for a $10 to $20 deposit."

Prefer:
"Manually broker several sessions end-to-end."

Not:
"Manually broker 5 to 10 sessions."

Use exact quantities when they come from the user's information or when the quantity itself is analytically necessary, and make clear when a number is an illustrative assumption.

STAGE-SPECIFIC REASONING

For just an idea:
- focus on assumptions and cheap tests,
- do not criticize the user for lacking traction that could not reasonably exist yet.

For early exploration:
- weigh interviews, prototypes, expressions of interest, waitlists, and experiments at the strength they deserve,
- distinguish what people said from what they actually committed to.

For already building:
- ask whether development is outrunning validation,
- prioritize existing usage, cost, customer, or operational evidence when supplied.

For launched / live:
- prioritize actual behavior, conversion, retention, repeat usage, economics, and operational evidence supplied by the user over hypotheticals.

USER RESOURCES

Use the user's experience, skills, connections, resources, or advantages only as execution evidence.
Do not diagnose entrepreneurial personality, founder temperament, resilience, motivation, hidden traits, or psychological founder-market fit.

VOICE

Write directly to the user.

Prefer:
"You spoke with about 15 potential teachers."
"You have product management experience."
"You have not run a marketplace before."

Do not write:
"The user said..."
"The user acknowledged..."
"The user has..."

Exception: never change the substance or certainty of what the user supplied.

OUTPUT POSTURE

Be challenging without theater.
Do not use autopsy, corpse, graveyard, cause of death, kill, brutal, doomed, fatal, or similar mortuary/dramatic language.

Do not manufacture positive balance. Only include genuine strengths supported by:
- the concept as described,
- user-supplied evidence,
- or resources/advantages the user explicitly supplied.

But actively look for real strengths. The output should not become a one-sided teardown.

WHAT WE KNOW

evidence_summary must contain 3 to 7 concise bullets drawn only from user-supplied information.
Do not insert model knowledge into evidence_summary.
Idea-description statements may be included, but distinguish a plan or claim from evidence of behavior or results.
If the user supplied very little evidence, say that plainly rather than inventing more.

WHAT COULD BREAK IT

Return 3 to 6 risks ordered by decision importance.
risk_level means importance to the decision, not probability.

Each risk must contain:
- title,
- risk_level,
- description,
- test.

A risk is a condition that could undermine the idea, not a verdict that it already applies.
The description should clearly separate:
- what the user supplied,
- what you infer,
- what remains unknown.

Each risk must end in a useful way to learn whether it actually applies.
Do not label risks critical merely to sound forceful.

WHAT LOOKS PROMISING

Return 2 to 5 strengths.
Each strength must be genuinely supported and specific.
Do not invent traction or validation.
Do not use generic consolation such as 'you are passionate' unless the user explicitly supplied something materially relevant.

A strength may identify a useful implication of a supplied fact, but must not overstate what that fact proves.

Do not turn available resources into unsupported estimates of what they can buy.

Example:
SUPPORTED:
"Having $30k available gives you room to test the idea before committing all of your available capital."

NOT SUPPORTED:
"$30k is enough to run several months of experiments, build a prototype, and conduct targeted acquisition tests."

unless those costs or durations are independently established.

WHAT YOU NEED TO KNOW

Return 3 to 6 questions whose answers could materially change the assessment.
Questions may be pointed, skeptical, and even presumptive when that makes them useful.
The simulated question may challenge a premise aggressively.
Concept Coach's explanatory voice must still assert carefully.

WHAT TO TEST NEXT

Return 3 to 5 prioritized next_tests.
Each must include:
- test: a concrete, bounded action,
- signal: what result would strengthen, weaken, or materially update the idea.

Do not force a 30-day timetable.
Prefer the cheapest credible test that answers the important uncertainty.
Each next test should be concrete because the ACTION and LEARNING GOAL are clear, not because arbitrary numbers have been attached to it. Use quantities only when supplied by the user or genuinely necessary to define the test.
Do not recommend building software when a manual, concierge, prototype, pre-sell, deposit, interview-with-behavioral-commitment, or calculation could answer the same question more cheaply.

FOCUS AREAS

If the user selected focus areas, prioritize them, but do not ignore a more consequential issue simply because it was not selected.

FINAL AUDIT BEFORE RETURNING

1. Did I output any numeric score, percentage, probability, or grade? Remove it.
2. Did I use autopsy/death/kill/brutal language? Remove it.
3. Is every evidence_summary item directly traceable to user input? If not, remove it.
4. Did I state any changing current-world fact without it being supplied or verified in the request? Reframe it as research needed.
5. Did I name a current competitor from memory? Remove it unless the user supplied or verified it.
6. Did I turn absence of supplied information into evidence that something does not exist? Correct it.
7. Did I strengthen stated intent into actual behavior or commitment? Correct it.
8. Did I use an absolute where calibrated wording is more accurate? Correct it.
9. Are strengths genuinely supported rather than consolation prizes? Correct them.
10. Does every major risk point toward a test or information-gathering action? Correct it.
11. Are next steps prioritized by information value rather than by how impressive they sound? Correct them.
12. Does this output clearly answer: what has the idea proved, what has it not proved, and what should the user test next?
13. Did I refer to the person as "the user" instead of speaking directly to them? Rewrite in second person.
14. Did I invent a dollar amount, sample size, duration, deadline, session count, price, cost, or other number merely to make advice more concrete? Remove it or clearly label it as an illustrative assumption.
15. Did I convert a known resource such as money, experience, or contacts into an unsupported claim about exactly how much it can accomplish? Reframe it as an advantage without inventing its purchasing power or effect.
16. Did I use a hypothetical number in a calculation as though the user supplied it? Remove it or explicitly label it illustrative.

Return ONLY this JSON shape:
{
  "assessment_label": "Needs validation | Some evidence | Strong early evidence",
  "verdict": "short plain-language headline, maximum 8 words",
  "one_liner": "1-2 sentence central assessment",
  "evidence_summary": [
    "user-supplied fact, plan, observation, or evidence"
  ],
  "risks": [
    {
      "title": "short risk title",
      "risk_level": "critical | high | medium | low",
      "description": "why this could matter",
      "test": "cheapest credible way to learn whether it applies"
    }
  ],
  "strengths": [
    {
      "title": "supported strength",
      "description": "why it matters without overclaiming"
    }
  ],
  "questions": [
    "material question"
  ],
  "next_tests": [
    {
      "test": "concrete bounded test",
      "signal": "what result would update the assessment"
    }
  ]
}`;

router.post('/idea-autopsy/stream', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  const {
    ideaDescription,
    ideaStage,
    founderContext,
    evidenceSoFar,
    focusAreas,
    userLanguage,
    userLocale,
    userCurrency,
    userRegion,
  } = req.body;

  if (!ideaDescription?.trim() || ideaDescription.trim().length < 30) {
    return res.status(400).json({ error: 'Please describe your idea in more detail.' });
  }

  const stageLabel = STAGE_LABELS[ideaStage] ?? 'early stage';
  const focusList = Array.isArray(focusAreas) && focusAreas.length
    ? focusAreas.map(f => FOCUS_LABELS[f] ?? f).join(', ')
    : 'No special focus selected; prioritize the most decision-relevant issues.';

  const userPrompt = `Stress-test this business idea.

STAGE
${stageLabel}

IDEA
${ideaDescription.trim()}

WHAT THE USER HAS TESTED OR LEARNED SO FAR
${cleanString(evidenceSoFar, 5000) || 'None supplied.'}

WHAT THE USER IS BRINGING TO IT
${cleanString(founderContext, 3000) || 'None supplied.'}

AREAS THE USER ESPECIALLY WANTS CHALLENGED
${focusList}

Important:
- Everything above is user-supplied context.
- Statements in IDEA may describe plans, hypotheses, or beliefs; do not automatically treat them as validation evidence.
- The WHAT THE USER HAS TESTED OR LEARNED SO FAR section is the strongest place to look for real-world evidence, but still preserve exactly what kind of evidence it is.
- Return only the required JSON.`;

  try {
    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 5200,
      system: withLanguage(SYSTEM_PROMPT, userLanguage || userLocale)
        + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'concept-coach' });

    const result = normalizeResult(parsed);
    const problems = validateResult(result);

    if (problems.length) {
      console.error('[concept-coach] invalid model output:', problems);
      return res.status(500).json({ error: 'Concept Coach could not produce a reliable assessment. Please try again.' });
    }

    res.json(result);
  } catch (err) {
    console.error('[concept-coach] generation failed:', err?.message || err);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Concept Coach failed. Please try again.' });
    }
  }
});

// Reviewed against backend/lib/outputStandard.js on 2026-08-31, as part of the
// Concept Coach rewrite. The clauses this tool leans on hardest are §3 (progress
// under uncertainty) and §4 (respect the visitor's agency): dropping the 1-10
// viability score is §4 directly — a number handed down as a verdict is the tool
// substituting its judgement for the founder's — and every risk carrying a test,
// with every next test carrying the signal that would update the assessment, is
// §3 and §5. validateResult() below is the post-generation check: it is
// deterministic, it runs on every response, and it refuses rather than shipping a
// shape the frontend cannot render. See PF-39.
router.outputStandard = 'v2';
router.outputGuard = {
  prohibit: [
    'any_numeric_score_percentage_probability_or_grade',
    'asserts_current_competitors_market_size_funding_pricing_or_operating_status_without_supplied_evidence',
    'treats_absence_of_evidence_as_evidence_of_absence',
    'upgrades_stated_intent_or_expressed_interest_into_demonstrated_demand',
    'presents_its_own_reasoning_as_something_the_user_supplied',
    'psychologises_the_founder_rather_than_naming_skills_resources_and_advantages',
    'autopsy_kill_brutal_or_death_framing',
    'unsupported_absolutes_such_as_this_always_fails_or_nobody_will_pay',
    'a_risk_without_a_test_that_would_settle_it',
    'a_next_test_without_a_signal_that_would_change_the_assessment',
  ],
  require: [
    'evidence_summary_contains_only_what_the_user_supplied',
    'every_risk_carries_a_test',
    'every_next_test_carries_an_update_signal',
    'fulfills_tool_promise',
  ],
};

module.exports = router;
