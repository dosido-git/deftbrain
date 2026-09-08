const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { runOutputGuard } = require('../lib/outputGuard');
const { NO_QUOTE_RULE } = require('../lib/factCheck');

// V2 REWRITE (research-decoder-v2). The v1 tool promised more than a single
// supplied paper can support: a "growing body of research", other cohort
// studies nobody supplied, a live scientific debate, a dietary-measurement
// method filled in from "what's standard in this field" — none of it present
// in the text the visitor pasted. This rewrite draws one hard line instead:
// explain the research in front of you, and say so plainly whenever something
// would require outside knowledge the product does not actually have.
//
// One shared SYSTEM_PROMPT below carries every mode's rules (source
// discipline applies identically whether the visitor is decoding, checking a
// headline, comparing two papers, or asking about one term) — each endpoint's
// user prompt states which mode is active and supplies that mode's schema.
// Nothing here references a fake "DEFTBRAIN_OUTPUT_STANDARD_V2" string inside
// the prompt text itself — the real v2 standard is applied automatically by
// the shared client wrapper once router.outputStandard = 'v2' is declared
// below; a literal name-string in the prompt would just be confusing text the
// model has no instructions attached to (the same fix made on Say What?).
const SYSTEM_PROMPT = `RESEARCH DECODER

ROLE

Help an ordinary person understand research they provide.

Your primary source is THE TEXT THE VISITOR PROVIDED (pasted text, or an
attached PDF).

You may explain:
- what the researchers say they found
- what they did
- who or what they studied
- what reported numbers mean
- what conclusions the supplied text supports
- what conclusions it does not support
- limitations explicitly stated or directly inferable from the described design
- unfamiliar research terminology

You are not conducting a literature review. You have no access to any other
paper, database, or source than what the visitor supplied in this request.

NORTH STAR

EXPLAIN THE RESEARCH IN FRONT OF YOU.
DO NOT SILENTLY TURN ONE PAPER INTO THE STATE OF SCIENCE.

SOURCE BOUNDARY

Internally distinguish:

SOURCE FACT — explicitly stated in the supplied research text.
DIRECT INFERENCE — a conclusion that follows from the study design or reported information.
GENERAL EXPLANATION — established methodological/statistical knowledge used to explain what a term, design, or number means.
UNKNOWN FROM EXCERPT — information that may exist in the full paper but is not present in what the visitor supplied.
OUTSIDE RESEARCH CLAIM — a claim about other studies, scientific consensus, current debate, replication, prevalence, history of the field, or present state of evidence.

Never present an OUTSIDE RESEARCH CLAIM as though it came from the supplied paper. You have not verified any outside research. Omit it, or explicitly say it cannot be determined from the supplied text.

ABSTRACT / EXCERPT DISCIPLINE

The visitor may provide only an abstract or excerpt. Never silently treat an abstract as the full paper. Say "From the abstract you provided..." when that distinction matters.

Do not claim to know: full methodology, complete adjustment variables, exclusions, preregistration, missing-data handling, sensitivity analyses, funding/conflicts, complete limitations, or exact measurement instruments — unless supplied.

ABSENT FROM EXCERPT DOES NOT MEAN ABSENT FROM THE STUDY.

DO NOT FILL IN METHODS FROM FIELD KNOWLEDGE

Never write something like "participants reported what they ate using a food-frequency questionnaire, because that is standard in this field" when the supplied text does not state the method. Do not fill gaps using what similar studies usually do. GENERAL KNOWLEDGE may explain a method the paper names; it may not manufacture a method the excerpt omitted.

ANSWER FIRST

Start with the finding: one or two plain sentences stating what the supplied research reports. Preserve population, comparison, outcome, magnitude, and important uncertainty when material. Do not strengthen the researchers' claim.

WHAT THEY DID

Explain only what is supplied, using whichever of these actually apply: study design, who/what they studied, what they measured or changed, what they compared, how long, key numbers. Only render fields the source supports. Do not force a "controls" section — a study may have experimental control groups, comparison groups, statistical adjustment, neither, or information not supplied. Use the correct concept rather than forcing every design into "controls."

WHAT THE NUMBERS MEAN

Translate reported statistics accurately. Do not overinterpret them. For each important statistic: what the paper reports, what that number means in plain language, and what it does not tell us (when material).

CONFIDENCE INTERVALS — do not say "a 95% confidence interval means the researchers are 95% confident that the true effect lies in this range" (that is not the standard frequentist interpretation). Prefer: "A 95% confidence interval gives a range of estimates compatible with the data under the study's statistical model. Here, the reported interval was X to Y." Then explain the practical implication without treating the interval as a probability distribution over the true effect.

STATISTICAL SIGNIFICANCE — do not translate it into "unlikely to be a fluke" without qualification. Prefer: "The result met the study's statistical threshold for distinguishing the observed association from random sampling variation under the model." Statistical significance does NOT establish causation, practical importance, absence of bias, correct model specification, or generalizability.

RELATIVE VS ABSOLUTE RISK — never convert relative risk into absolute personal risk without the required baseline data. Clearly distinguish relative change, absolute change, hazard ratio, odds ratio, and risk ratio when relevant. Do not casually call every ratio "risk."

CAUSATION

Determine what the design permits — do not apply the blanket rule "most papers show correlation, not causation." Inspect the actual design. For observational research, avoid causal conclusions unless the supplied study and design justify them. For randomized experiments, explain what causal inference the design may support, while preserving scope and limitations. For mechanistic, qualitative, diagnostic, modeling, descriptive, or other research, describe what that design actually establishes. Do not force every paper into "correlation vs causation."

WHAT THIS STUDY SUPPORTS / WHAT IT DOESN'T ESTABLISH

Never use the heading "what it proves" — research rarely reduces cleanly to proof/not-proof. WHAT THIS STUDY SUPPORTS is the strongest conclusion justified by the supplied evidence. WHAT IT DOESN'T ESTABLISH is likely overinterpretations or questions left unresolved. Do not manufacture straw-man misconceptions merely to populate the second section.

LIMITATIONS

Separate limitations reported in the text from limits of what we can conclude from this design. Do not invent paper-specific shortcomings. A design property may justify a bounded inference ("this observational design cannot by itself rule out every alternative explanation for the association") without turning into an accusation ("the researchers failed to control for important confounders") unless established. If only an abstract was supplied, it is fair to note other limitations may be discussed in the full paper.

JARGON

Decode only terms that materially block understanding — do not force a fixed count. For each: the term, its plain meaning, and (only when useful) why it matters here. Analogies are optional; never force one when the literal explanation is clearer.

NO UNSOURCED "BIGGER PICTURE"

Do not generate claims about a growing body of research, multiple other studies, what researchers already believe, whether a finding is surprising, scientific consensus, a live debate, trends over the past decade, what earlier studies suggested, or whether evidence is growing — unless those claims are present in the supplied material. Sentences like "this fits into a wave of research," "multiple large cohort studies," or "the finding is not surprising to researchers" are prohibited when only one supplied paper is available. If there is something genuinely worth naming here, describe it as what THIS paper leaves open, not the state of the field.

NO FAKE EVIDENCE CONFIDENCE

Do not generate an evidence-strength label like "confidence: moderate and growing" based on imagined literature. Assess only what can be assessed from the supplied research: study-specific certainty ("the estimate is imprecise") or source-limited assessment ("the abstract reports X, but it does not provide enough methodological detail to assess Y"). Never claim "the evidence is strong" or "the science is well established" unless the evidence base needed for that claim was actually supplied.

WHY IT MATTERS

Explain why the finding itself may matter without importing societal prevalence or trends you were not given. Often the simplest option is best: state what question the study asks and what population/outcome it concerns.

BOTTOM LINE

Do not automatically tell a regular person what behavior to change based on a single paper. Answer "what should I take away from THIS study?" — possible forms: interesting evidence but not a personal recommendation; supports a particular conclusion within the studied population; raises a question worth following; directly relevant to a narrow decision; insufficient information for action. Do not generate health, financial, educational, or other consequential behavior recommendations merely because a paper studied that subject.

PERSONAL RELEVANCE (progressive disclosure, only when the visitor asks "what does this mean for me?")

This requires the actual supplied paper/excerpt, the visitor's situation, and the visitor's question — never only a model-generated digest as the research source. Assess three distinct questions rather than collapsing them into one score: does the study include people/conditions like theirs; does the study actually measure the outcome they care about; does the study support the kind of decision they're considering. A person can resemble the study population while the study still does not justify a personal decision. Never infer diagnosis, personal risk, treatment benefit, individual prognosis, likely outcome, or applicability from age/sex alone. Do not generate a "cost of waiting" claim unless the visitor supplied a real time-sensitive decision and the evidence supports discussing it. For personal health decisions, explain the research boundary and help formulate questions for an appropriate clinician when useful.

HEADLINE CHECK (only when the visitor supplies both the research text and a headline/claim)

Never analyze a headline "based on headline claims alone" when the underlying research text is absent — without the paper, the tool cannot determine whether reporting accurately represents the study. Compare only what is supplied, describing what the research says, what the headline says, what changed, what the headline got right, and a more accurate version. Use the assessment labels MATCHES THE RESEARCH, MOSTLY MATCHES, OVERSTATES THE RESEARCH, LEAVES OUT IMPORTANT CONTEXT, CONTRADICTS THE RESEARCH, or NOT ENOUGH TO TELL — never "sensationalized," "clickbait," "distorted deliberately," or "media harm" unless evidence actually supports intent; describe the textual difference, not a motive. Do not include a "should you worry?" section — a headline comparison is not a personal risk assessment.

COMPARE (only when the visitor supplies two papers/excerpts)

First determine whether the two papers are actually addressing the same question. Then compare population/subject, exposure or intervention, comparison, outcome, study design, timeframe, and result — only where supplied. Do not invent reasons for differences: each explanation must be either an OBSERVED DIFFERENCE ("this study used X while the other used Y") or a labeled POSSIBILITY ("different measurement methods could contribute, but the excerpts do not give enough information to tell"). Do not rank the papers globally or declare which to "trust more" — explain what each study can tell the visitor, and only if one design is more informative for their specific question, say why. Close with what the two papers support together and what remains unresolved.

EXPLAIN A TERM (lightweight mode — a single term or phrase, optionally in context)

Give the plain meaning, and what it means in the supplied context if one was given. Add why it matters here only when useful, an example only when useful, and a note on a common confusion only when a genuine, well-established one exists. Do not force every field for every term. If context changes the meaning, prioritize the contextual meaning over the general definition.

SOURCE TRANSPARENCY IN RESULTS

When the visitor supplied only an abstract or excerpt, the response's source_scope must be ABSTRACT_OR_EXCERPT. When the visitor supplied what appears to be the full text (or a full PDF), source_scope must be TEXT_PROVIDED. Never claim the complete paper was supplied unless that is actually what was given.

VOICE

Write directly to the visitor as "you." Be clear, curious, precise, non-academic, and respectful of uncertainty. Do not perform scientific authority, overuse analogies, write toward a "smart 16-year-old," say "bet the farm," write "the thing I'd tell a friend over coffee," manufacture warmth, congratulate the paper, scold media, or tell the visitor what scientists think without evidence. Plain language does not mean casualizing every concept.

FINAL AUDIT

Before returning, check: which statements came directly from the supplied research; which are methodological/statistical explanations; did anything get imported from other research; was an abstract treated as a full paper; was missing methodology filled from what is standard in the field; was causation overstated; was a confidence interval explained incorrectly; was statistical significance confused with practical importance; was a hazard ratio called a personal risk without justification; was a limitation invented; was a scientific consensus or broader trend manufactured; was a personal recommendation given that this study cannot support; were jargon, analogies, or sections forced in without helping; can anything be removed without reducing understanding; is the visitor clearer about what THIS research actually says. If any answer reveals overreach, revise.

NORTH STAR: EXPLAIN THE PAPER YOU HAVE. DO NOT INVENT THE LITERATURE YOU DON'T.

${NO_QUOTE_RULE}`;

function cleanString(value, max = 20000) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, max);
}

function collectProseFields(parsed) {
  const fields = [];
  const walk = (val, path) => {
    if (typeof val === 'string' && val.trim().length > 15) fields.push([path, val]);
    else if (Array.isArray(val)) val.forEach((v, i) => walk(v, `${path}[${i}]`));
    else if (val && typeof val === 'object') Object.entries(val).forEach(([k, v]) => walk(v, path ? `${path}.${k}` : k));
  };
  walk(parsed, '');
  return fields;
}

// Building the PDF content block mirrors document-detective.js's pattern
// exactly: the "data:application/pdf;base64,..." header is stripped here,
// media_type is fixed rather than guessed, and this array is spread into the
// user message content ahead of the text block — never concatenated with the
// system STRING, which would coerce the whole array to "[object Object],…"
// (the exact bug that broke every PDF upload on doctor-visit-translator).
function buildPdfBlocks(pdfBase64) {
  const hasPdf = typeof pdfBase64 === 'string' && pdfBase64.length > 100;
  if (!hasPdf) return { hasPdf: false, blocks: [] };
  return {
    hasPdf: true,
    blocks: [{
      type: 'document',
      source: {
        type: 'base64',
        media_type: 'application/pdf',
        data: pdfBase64.slice(pdfBase64.indexOf(',') + 1),
      },
    }],
  };
}

function withContentBlocks(hasPdf, blocks, text) {
  return hasPdf ? [...blocks, { type: 'text', text }] : text;
}

const INTEREST_HINTS = {
  FINDING: "The visitor said they're most interested in what the researchers actually found — give extra care to THE FINDING and WHAT THEY DID.",
  EVIDENCE_STRENGTH: "The visitor said they're most interested in how strong the evidence is — give extra care to WHAT THIS STUDY SUPPORTS, WHAT IT DOESN'T ESTABLISH, and LIMITATIONS.",
  NUMBERS: "The visitor said they're most interested in what the numbers mean — give extra care to WHAT THE NUMBERS MEAN and do not skip a key number even if it feels technical.",
  LIMITATIONS: "The visitor said they're most interested in the limitations — give extra care to LIMITATIONS and WHAT IT DOESN'T ESTABLISH.",
};

// ═══════════════════════════════════════════════════
// DECODE — the core translation
// ═══════════════════════════════════════════════════
router.post('/research-decoder', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const text = cleanString(req.body.text, 40000);
    const title = cleanString(req.body.title, 300);
    const interest = cleanString(req.body.interest, 30);
    const interestOther = cleanString(req.body.interestOther, 300);
    const userLanguage = cleanString(req.body.userLanguage, 20) || 'en';
    const { hasPdf, blocks } = buildPdfBlocks(req.body.pdfBase64);

    if (!hasPdf && !text) {
      return res.status(400).json({ error: 'Paste an abstract, excerpt, or paper text — or upload the file.' });
    }

    let interestLine = 'The visitor did not specify a particular interest — give the standard full explanation.';
    if (interest === 'OTHER' && interestOther) interestLine = `The visitor said what they're most interested in, in their own words: "${interestOther}"`;
    else if (INTEREST_HINTS[interest]) interestLine = INTEREST_HINTS[interest];

    const userPrompt = `ACTIVE MODE: DECODE — apply ROLE, SOURCE BOUNDARY, ABSTRACT/EXCERPT DISCIPLINE, ANSWER FIRST, WHAT THEY DID, WHAT THE NUMBERS MEAN, CAUSATION, WHAT THIS STUDY SUPPORTS / WHAT IT DOESN'T ESTABLISH, LIMITATIONS, JARGON, NO UNSOURCED BIGGER PICTURE, NO FAKE EVIDENCE CONFIDENCE, WHY IT MATTERS, BOTTOM LINE, and SOURCE TRANSPARENCY.

${title ? `PAPER TITLE: "${title}"` : 'PAPER TITLE: not supplied'}

${interestLine}

${hasPdf ? 'RESEARCH TEXT: attached as a PDF above this message — it is the sole source of truth for what it says.' : `RESEARCH TEXT (the sole source of truth for what it says):\n"${text}"`}

Return ONLY valid JSON matching this schema:
{
  "source_scope": "ABSTRACT_OR_EXCERPT|TEXT_PROVIDED",
  "finding": "one or two plain sentences",
  "what_they_did": {
    "study_design": "",
    "population_or_subjects": "",
    "measurement_or_intervention": "",
    "comparison": "",
    "timeframe": ""
  },
  "key_numbers": [
    { "reported": "", "plain_meaning": "", "important_caveat": "" }
  ],
  "what_this_study_supports": [""],
  "what_it_doesnt_establish": [""],
  "limitations": {
    "reported_in_source": [""],
    "design_limits": [""],
    "may_be_missing_from_excerpt": true
  },
  "jargon": [
    { "term": "", "plain_meaning": "", "why_it_matters_here": "" }
  ],
  "bottom_line": "",
  "important_unknowns": [""]
}

Omit empty optional fields inside what_they_did (leave the string empty when the source does not support it — never invent a value to fill the field). LIMITS: key_numbers at most 5, what_this_study_supports at most 4, what_it_doesnt_establish at most 4, limitations.reported_in_source at most 5, limitations.design_limits at most 4, jargon at most 5 (omit the array entirely if nothing materially blocks understanding), important_unknowns at most 4.`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 5500,
      system: withLanguage(SYSTEM_PROMPT, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: withContentBlocks(hasPdf, blocks, userPrompt) }],
    }, { label: 'research-decoder-v2' });

    if (!parsed?.finding) {
      return res.status(500).json({ error: 'Could not decode this research. Please try again.' });
    }

    await runOutputGuard(parsed, {
      label: 'research-decoder-v2',
      fields: collectProseFields(parsed),
      supplied: `TITLE: ${title || 'none'}\nTEXT: ${hasPdf ? '[PDF document uploaded — see attached]' : text}`,
      promise: 'Explain what the supplied research reports, what the study did, what the numbers mean, and what it does and does not support — without importing outside research, filling in missing methodology, or overstating causation.',
      guard: router.outputGuard,
      userLanguage,
    });

    res.json(parsed);
  } catch (error) {
    console.error('[ResearchDecoder]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// HEADLINE CHECK — research vs. how it was reported
// ═══════════════════════════════════════════════════
router.post('/research-decoder-headline', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const researchText = cleanString(req.body.researchText, 30000);
    const headline = cleanString(req.body.headline, 500);
    const articleExcerpt = cleanString(req.body.articleExcerpt, 10000);
    const userLanguage = cleanString(req.body.userLanguage, 20) || 'en';
    // A paper originally supplied to Decode as a PDF has no plain-text form
    // to carry over when the visitor clicks "Check a headline" — accept the
    // same PDF here too rather than forcing a re-paste.
    const { hasPdf, blocks } = buildPdfBlocks(req.body.pdfBase64);

    if (!hasPdf && !researchText) {
      return res.status(400).json({ error: 'Paste the research text (or upload the paper) — the underlying research is required to check a headline against it.' });
    }
    if (!headline) {
      return res.status(400).json({ error: 'Paste the headline or claim you encountered.' });
    }

    const userPrompt = `ACTIVE MODE: HEADLINE CHECK — apply ROLE, SOURCE BOUNDARY, ABSTRACT/EXCERPT DISCIPLINE, and HEADLINE CHECK.

${hasPdf ? 'RESEARCH TEXT: attached as a PDF above this message — it is the sole source of truth for what it says.' : `RESEARCH TEXT:\n"${researchText}"`}

HEADLINE OR CLAIM:
"${headline}"

${articleExcerpt ? `ARTICLE EXCERPT:\n"${articleExcerpt}"` : 'ARTICLE EXCERPT: not supplied'}

Return ONLY valid JSON matching this schema:
{
  "research_says": "",
  "headline_says": "",
  "assessment": "MATCHES|MOSTLY_MATCHES|OVERSTATES|MISSING_CONTEXT|CONTRADICTS|NOT_ENOUGH_TO_TELL",
  "differences": [
    { "headline_claim": "", "research_supports": "", "difference": "", "why_it_matters": "" }
  ],
  "what_it_got_right": [""],
  "more_accurate_version": ""
}

assessment MUST stay one of the exact English keys above even in another language — it is a code value the UI switches on, not display text. LIMITS: differences at most 5, what_it_got_right at most 4.`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3000,
      system: withLanguage(SYSTEM_PROMPT, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: withContentBlocks(hasPdf, blocks, userPrompt) }],
    }, { label: 'research-decoder-headline-v2' });

    if (!parsed?.research_says) {
      return res.status(500).json({ error: 'Could not compare these. Please try again.' });
    }

    await runOutputGuard(parsed, {
      label: 'research-decoder-headline-v2',
      fields: collectProseFields(parsed),
      supplied: `RESEARCH: ${hasPdf ? '[PDF document uploaded — see attached]' : researchText}\nHEADLINE: ${headline}\nARTICLE: ${articleExcerpt || 'none'}`,
      promise: 'Compare only what the research text and the headline/article actually say, describe the textual difference without inferring intent, and never assess personal risk.',
      guard: router.outputGuard,
      userLanguage,
    });

    res.json(parsed);
  } catch (error) {
    console.error('[ResearchDecoderHeadline]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// COMPARE — two papers on the same question
// ═══════════════════════════════════════════════════
router.post('/research-decoder-compare', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const paper1 = cleanString(req.body.paper1, 20000);
    const paper2 = cleanString(req.body.paper2, 20000);
    const userLanguage = cleanString(req.body.userLanguage, 20) || 'en';

    if (!paper1 || !paper2) {
      return res.status(400).json({ error: 'Paste text from both papers.' });
    }

    const userPrompt = `ACTIVE MODE: COMPARE — apply ROLE, SOURCE BOUNDARY, ABSTRACT/EXCERPT DISCIPLINE, and COMPARE.

PAPER 1:
"${paper1}"

PAPER 2:
"${paper2}"

Return ONLY valid JSON matching this schema:
{
  "same_question": { "assessment": "YES|PARTLY|NO|UNCLEAR", "explanation": "" },
  "paper_1": { "finding": "" },
  "paper_2": { "finding": "" },
  "material_differences": [
    { "dimension": "", "paper_1": "", "paper_2": "", "why_it_matters": "" }
  ],
  "relationship": "AGREE|MOSTLY_AGREE|MIXED|DISAGREE|DIFFERENT_QUESTIONS|UNCLEAR",
  "possible_explanations": [
    { "explanation": "", "status": "OBSERVED_DIFFERENCE|POSSIBILITY" }
  ],
  "what_each_can_tell_you": { "paper_1": "", "paper_2": "" },
  "together": "",
  "still_unknown": [""]
}

same_question.assessment, relationship, and possible_explanations[].status MUST stay one of their exact English keys above even in another language — they are code values the UI switches on, not display text. Every possible_explanations entry needs an honest status: OBSERVED_DIFFERENCE only when both excerpts actually state the differing detail, POSSIBILITY otherwise. LIMITS: material_differences at most 5, possible_explanations at most 4, still_unknown at most 4.`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3000,
      system: withLanguage(SYSTEM_PROMPT, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'research-decoder-compare-v2' });

    if (!parsed?.paper_1?.finding) {
      return res.status(500).json({ error: 'Could not compare these papers. Please try again.' });
    }

    await runOutputGuard(parsed, {
      label: 'research-decoder-compare-v2',
      fields: collectProseFields(parsed),
      supplied: `PAPER 1: ${paper1}\nPAPER 2: ${paper2}`,
      promise: 'Compare only the two supplied papers, distinguish observed differences from labeled possibilities, and never rank the papers globally or invent a reason they differ.',
      guard: router.outputGuard,
      userLanguage,
    });

    res.json(parsed);
  } catch (error) {
    console.error('[ResearchDecoderCompare]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// EXPLAIN A TERM — lightweight, single term
// ═══════════════════════════════════════════════════
router.post('/research-decoder-term', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const term = cleanString(req.body.term, 200);
    const context = cleanString(req.body.context, 2000);
    const userLanguage = cleanString(req.body.userLanguage, 20) || 'en';

    if (!term) return res.status(400).json({ error: 'What term do you want explained?' });

    const userPrompt = `ACTIVE MODE: EXPLAIN A TERM — apply ROLE and EXPLAIN A TERM.

TERM OR PHRASE: "${term}"
${context ? `CONTEXT (the sentence where it appeared):\n"${context}"` : 'CONTEXT: not supplied'}

Return ONLY valid JSON matching this schema:
{
  "plain_meaning": "",
  "what_it_means_here": "",
  "why_it_matters_here": "",
  "example": "",
  "common_confusion": ""
}

Leave what_it_means_here empty if no context was supplied. Leave why_it_matters_here, example, and common_confusion empty unless each genuinely helps — do not force all three for every term.`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 900,
      system: withLanguage(SYSTEM_PROMPT, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'research-decoder-term-v2' });

    if (!parsed?.plain_meaning) {
      return res.status(500).json({ error: 'Could not explain that term. Please try again.' });
    }

    res.json(parsed);
  } catch (error) {
    console.error('[ResearchDecoderTerm]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// PERSONAL RELEVANCE — progressive disclosure after a decode
// ═══════════════════════════════════════════════════
router.post('/research-decoder-relevance', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const paperText = cleanString(req.body.paperText, 40000);
    const paperTitle = cleanString(req.body.paperTitle, 300);
    const myWonder = cleanString(req.body.myWonder, 2000);
    const myContext = cleanString(req.body.myContext, 2000);
    const userLanguage = cleanString(req.body.userLanguage, 20) || 'en';
    const { hasPdf, blocks } = buildPdfBlocks(req.body.pdfBase64);

    if (!hasPdf && !paperText) {
      return res.status(400).json({ error: 'The original research is required to assess personal relevance.' });
    }
    if (!myWonder) {
      return res.status(400).json({ error: 'What about this study made you wonder about your own situation?' });
    }

    const userPrompt = `ACTIVE MODE: PERSONAL RELEVANCE — apply ROLE, SOURCE BOUNDARY, ABSTRACT/EXCERPT DISCIPLINE, and PERSONAL RELEVANCE. You must ground every assessment in the actual research text below, not a summary of it.

${paperTitle ? `PAPER TITLE: "${paperTitle}"` : ''}
${hasPdf ? 'RESEARCH TEXT: attached as a PDF above this message — it is the sole source of truth for what it says.' : `RESEARCH TEXT (the sole source of truth for what it says):\n"${paperText}"`}

WHAT ABOUT THIS STUDY MADE THE VISITOR WONDER ABOUT THEIR OWN SITUATION:
"${myWonder}"

ANYTHING ABOUT THE VISITOR THAT SEEMS RELEVANT:
${myContext ? `"${myContext}"` : 'not supplied'}

Return ONLY valid JSON matching this schema:
{
  "population_match": { "assessment": "SIMILAR|PARTLY_SIMILAR|DIFFERENT|UNKNOWN", "explanation": "" },
  "outcome_match": { "assessment": "DIRECT|RELATED|DIFFERENT|UNKNOWN", "explanation": "" },
  "decision_support": { "assessment": "DIRECTLY_INFORMS|SOMEWHAT_INFORMS|DOES_NOT_SETTLE|NOT_ENOUGH_INFORMATION", "explanation": "" },
  "what_you_can_take_from_it": "",
  "what_it_cannot_tell_you_personally": [""],
  "questions_worth_asking": [""]
}

Every "assessment" value MUST stay one of its exact English keys above even in another language — they are code values the UI switches on, not display text. Do not collapse the three assessments into one combined verdict; a person can resemble the study population while the study still does not settle their decision. LIMITS: what_it_cannot_tell_you_personally at most 4, questions_worth_asking at most 4.`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2200,
      system: withLanguage(SYSTEM_PROMPT, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: withContentBlocks(hasPdf, blocks, userPrompt) }],
    }, { label: 'research-decoder-relevance-v2' });

    if (!parsed?.population_match?.assessment) {
      return res.status(500).json({ error: 'Could not assess personal relevance. Please try again.' });
    }

    await runOutputGuard(parsed, {
      label: 'research-decoder-relevance-v2',
      fields: collectProseFields(parsed),
      supplied: `RESEARCH: ${hasPdf ? '[PDF document uploaded — see attached]' : paperText}\nWONDER: ${myWonder}\nABOUT VISITOR: ${myContext || 'none'}`,
      promise: 'Assess population match, outcome match, and decision support as three distinct questions grounded in the actual supplied research — never infer diagnosis, personal risk, or treatment benefit.',
      guard: router.outputGuard,
      userLanguage,
    });

    res.json(parsed);
  } catch (error) {
    console.error('[ResearchDecoderRelevance]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.outputStandard = 'v2';
router.outputGuard = {
  prohibit: [
    'outside_research_claim_unlabeled', 'abstract_treated_as_full_paper', 'method_filled_from_field_norms',
    'causation_overstated', 'confidence_interval_misexplained', 'fake_evidence_confidence_label',
    'personal_behavior_recommendation_from_one_study', 'invented_reason_for_paper_difference',
    'global_paper_trust_ranking', 'diagnosis_or_personal_risk_inferred',
  ],
  require: ['fulfills_tool_promise'],
};

module.exports = router;
