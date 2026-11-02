const express = require('express');
const router = express.Router();
const { answer, onlyKeys } = require('../lib/progressive');
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
// LEAN (2026-11-01, audit/LEAN-PROMPT-STANDARD.md): ~3,000 words condensed to
// what a good decode is; the guard below still checks each listed defect.
const SYSTEM_PROMPT = `RESEARCH DECODER
Help someone understand a piece of research they pasted or uploaded: what it found, what the study did, what the numbers mean, what it supports and what it doesn't, in plain words.

- The supplied text is the only source for what this study says. Don't fill in methods, numbers or results from what studies in the field usually do, and label any outside knowledge as general background, never as this study.
- An abstract or excerpt is not the full paper: say what the excerpt doesn't show rather than what the paper lacks. source_scope is ABSTRACT_OR_EXCERPT for an abstract or excerpt, TEXT_PROVIDED only for what looks like the full text.
- Keep the study's own words for what it measured and in whom; don't widen the population, outcome or claim.
- Explain numbers exactly (a confidence interval, a relative vs absolute risk) and don't claim causation from an association unless the design supports it.
- No confidence or quality labels the evidence doesn't earn; no personal advice, diagnosis or risk from one study.
- Lead with the finding in one or two plain sentences; define jargon only where it blocks understanding.

MODES (used when the request names one):
PERSONAL RELEVANCE: answer three questions separately: does the study include people like them, does it measure the outcome they care about, does it support the decision they are weighing. Never infer diagnosis, risk or benefit from age or sex alone; suggest questions for a clinician.
HEADLINE CHECK: needs both the research and the headline. Compare what each says, what changed, what the headline got right, and a more accurate version. Labels: MATCHES THE RESEARCH · MOSTLY MATCHES · OVERSTATES THE RESEARCH · LEAVES OUT IMPORTANT CONTEXT · CONTRADICTS THE RESEARCH · NOT ENOUGH TO TELL. Describe the textual difference, never a motive; flag a scope stretch only where an ordinary reader would take it more broadly.
COMPARE: first say whether both address the same question; compare only what is supplied. Each difference is observed or a labelled possibility; never rank the papers overall.
EXPLAIN A TERM: plain meaning, and its meaning in the given context if any; add why it matters, an example or a common confusion only when genuinely useful.

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

    // Speed (2026-10-15): one call wrote ~1.8k tokens (~35s). Three calls now
    // write disjoint keys at once — what the study SAYS, what it MEANS, and the
    // jargon list (~800 tokens on its own) — each reading the full text. The guard's consistency check reads the
    // merged answer, so a bottom line that drifts from the finding is caught.
    const userPrompt = (part) => `ACTIVE MODE: DECODE.

${title ? `PAPER TITLE: "${title}"` : 'PAPER TITLE: not supplied'}

${interestLine}

${hasPdf ? 'RESEARCH TEXT: attached as a PDF above this message — it is the sole source of truth for what it says.' : `RESEARCH TEXT (the sole source of truth for what it says):\n"${text}"`}

${part === 'jargon'
    ? `THIS PASS writes only the JARGON list: the terms in this text that would block an ordinary reader's understanding, each explained plainly and in this study's context. Other passes, reading the same text at the same time, write everything else — do not write it.

Return ONLY valid JSON matching this schema:
{
  "jargon": [
    { "term": "", "plain_meaning": "", "why_it_matters_here": "" }
  ]
}

LIMITS: jargon at most 5. Return an empty array if nothing materially blocks understanding.`
    : part === 'said'
    ? `THIS PASS writes only what the study SAYS: source_scope, finding, what_they_did and key_numbers. Other passes, reading the same text at the same time, write the jargon, what it supports, what it does not establish, the limitations, the bottom line and the unknowns — do not write those.

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
  ]
}

Omit empty optional fields inside what_they_did (leave the string empty when the source does not support it — never invent a value to fill the field). LIMITS: key_numbers at most 5.`
    : `THIS PASS writes only what the study MEANS: what it supports, what it does not establish, the limitations, the bottom line and the important unknowns. Other passes, reading the same text at the same time, write the finding, what they did, the key numbers and the jargon — do not write those, but your bottom line must agree with what the text reports.

Return ONLY valid JSON matching this schema:
{
  "what_this_study_supports": [""],
  "what_it_doesnt_establish": [""],
  "limitations": {
    "reported_in_source": [""],
    "design_limits": [""],
    "may_be_missing_from_excerpt": true
  },
  "bottom_line": "",
  "important_unknowns": [""]
}

LIMITS: what_this_study_supports at most 4, what_it_doesnt_establish at most 4, limitations.reported_in_source at most 5, limitations.design_limits at most 4, important_unknowns at most 4.`}`;

    // Progressive (2026-10-16, lib/progressive.js): the finding is its own
    // small pass so it shows in seconds; what they did, what it means and the
    // jargon fill in as they land. The guard runs after the answer is on screen.
    const system = withLanguage(SYSTEM_PROMPT, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);
    const call = (prompt, maxTokens, tag) => callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: withContentBlocks(hasPdf, blocks, prompt) }],
    }, { label: `research-decoder-v2-${tag}` });
    const take = (keys) => (d, out) => { keys.forEach(k => { if (out?.[k] !== undefined) d[k] = out[k]; }); };
    const SAID_FIRST = ['source_scope', 'finding'];
    const SAID_REST = ['what_they_did', 'key_numbers'];
    const MEANS = ['what_this_study_supports', 'what_it_doesnt_establish', 'limitations', 'bottom_line', 'important_unknowns'];
    // Original key order, so the page renders as before.
    const ORDER = ['source_scope', 'finding', 'what_they_did', 'key_numbers', 'what_this_study_supports', 'what_it_doesnt_establish', 'limitations', 'jargon', 'bottom_line', 'important_unknowns'];
    const ordered = (d) => {
      const out = {};
      for (const k of ORDER) if (d[k] !== undefined) out[k] = d[k];
      if (!(Array.isArray(out.jargon) && out.jargon.length)) delete out.jargon;
      return out;
    };
    const said = userPrompt('said').replace(/THIS PASS writes only what the study SAYS: source_scope, finding, what_they_did and key_numbers\. /, '');
    return await answer(req, res, {
      label: 'research-decoder',
      parts: [
        { required: true, run: () => call(onlyKeys(said, SAID_FIRST), 900, 'finding'), apply: take(SAID_FIRST) },
        { run: () => call(onlyKeys(said, SAID_REST), 3000, 'said'), apply: take(SAID_REST) },
        { run: () => call(userPrompt('means'), 3500, 'means'), apply: take(MEANS) },
        { run: () => call(userPrompt('jargon'), 2500, 'jargon'), apply: take(['jargon']) },
      ],
      finish: d => ordered(structuredClone(d)),
      ready: d => Boolean(d.finding),
      complete: d => Boolean(d.finding),
      check: async (parsed) => {
        await runOutputGuard(parsed, {
          label: 'research-decoder-v2',
          fields: collectProseFields(parsed),
          supplied: `TITLE: ${title || 'none'}\nTEXT: ${hasPdf ? '[PDF document uploaded — see attached]' : text}`,
          promise: 'Explain what the supplied research reports, what the study did, what the numbers mean, and what it does and does not support — without importing outside research, filling in missing methodology, or overstating causation.',
          guard: router.outputGuard,
          userLanguage,
        });
      },
    });
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

    const userPrompt = `ACTIVE MODE: HEADLINE CHECK.

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

    const userPrompt = `ACTIVE MODE: COMPARE.

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

    const userPrompt = `ACTIVE MODE: EXPLAIN A TERM.

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

    const userPrompt = `ACTIVE MODE: PERSONAL RELEVANCE. You must ground every assessment in the actual research text below, not a summary of it.

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

router.outputStandard = 'lean';
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
