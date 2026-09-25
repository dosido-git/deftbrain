const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext, NO_INVENTED_FACTS } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { groundedFacts, groundedData, normalizeKeyPart, matchVerifiedSources, stripCites } = require('../lib/groundedFacts');

// Grounded facts PRE-PASS (shared lib/groundedFacts.js pattern; see
// lease-trap-detector.js for the rationale). The tool's core claim —
// `is_this_standard.verdict` — was, until now, pure training-knowledge
// recall with nothing checking it: a materially higher-stakes failure mode
// than a stale legal figure, since it's a "don't worry, this is normal"
// judgment about a medical decision. Keyed on the procedure name only (not
// region): standard-of-care and alternatives are the same everywhere in a
// way deposit law is not, so one search serves every visitor asking about
// the same procedure regardless of where they are.
async function groundProcedureFacts({ procedure }) {
  const cacheKey = `procedure-facts:${normalizeKeyPart(procedure)}`;
  const block = await groundedFacts({
    cacheKey,
    label: 'procedure-probe-facts',
    system: 'You verify current medical-consensus facts with web search. Prefer major medical institutions (Mayo Clinic, Cleveland Clinic, NIH/MedlinePlus), government health agencies, and specialty medical society clinical guidelines over general health-content sites, patient blogs, or clinic marketing pages. Report only what current guidance actually supports, and skip anything you cannot verify — an empty array is a correct answer. Return ONLY valid JSON. Never place a double-quote (") character inside any JSON string value.',
    userPrompt: `Verify with web_search, as of today, current medical guidance for the procedure/treatment: "${procedure.trim().slice(0, 200)}"

Check, and report ONLY what current clinical guidance actually supports:
(1) whether this is a standard, first-line recommendation for its typical indication, or whether it is often over-recommended / alternatives are typically tried first;
(2) real alternative treatments or approaches that current guidance considers for the same condition.

Skip anything you cannot confirm against a credible source. Do not infer, do not fill gaps from memory, and do not include a claim you did not see stated on a page.

Return ONLY valid JSON:
{ "verified": [{ "aspect": "standard_of_care | alternative", "finding": "What current guidance says, one sentence", "source": "ONE bare domain of the single page you actually verified this against — no list, no parenthetical. Prefer a major medical institution, government health agency, or specialty medical society domain when the search found one." }] }`,
    // See matchVerifiedSources (lib/groundedFacts.js): a finding only gets a
    // visible citation when its claimed domain matches a page web_search
    // actually retrieved — the model's own domain self-report isn't
    // independently trustworthy on its own.
    render: (cleanFacts, searchResults) => {
      if (!Array.isArray(cleanFacts.verified) || !cleanFacts.verified.length) return '';
      const block = `\n\nCURRENT MEDICAL GUIDANCE (web-checked today) — use this where it bears on standard-of-care or alternatives; everything else stays your own reasoning under the rules above:\n` +
        cleanFacts.verified.map(f => `- [${f.aspect}] ${f.finding} (source: ${f.source})`).join('\n');
      return { block, data: { sources: matchVerifiedSources(cleanFacts.verified, searchResults) } };
    },
  });
  return { block, cacheKey };
}

// ════════════════════════════════════════════════════════════
// POST /procedure-probe — Procedure Probe
// ════════════════════════════════════════════════════════════
router.post('/procedure-probe', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { procedure, quote, provider, insurance, concerns, urgency, scheduled, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!procedure?.trim()) {
      return res.status(400).json({ error: 'Tell us what procedure or treatment was recommended.' });
    }

    const { block: verifiedFactsBlock, cacheKey: procedureFactsCacheKey } = await groundProcedureFacts({ procedure });

    const systemPrompt = `You are a patient advocate and healthcare literacy coach. When someone has been recommended a medical or dental procedure, you help them understand what they're agreeing to — without replacing their doctor's advice.

${NO_INVENTED_FACTS}`;

    const userPrompt = `PROCEDURE/TREATMENT RECOMMENDED: ${procedure}
${quote ? `QUOTED PRICE: ${quote}` : 'QUOTED PRICE: NOT PROVIDED'}
${provider ? `PROVIDER TYPE: ${provider}` : 'PROVIDER TYPE: NOT PROVIDED'}
${insurance ? `INSURANCE SITUATION: ${insurance}` : 'INSURANCE SITUATION: NOT PROVIDED'}
${concerns ? `MY CONCERNS: ${concerns}` : ''}
${urgency ? `URGENCY LEVEL: ${urgency}` : ''}
${scheduled === 'scheduled' ? 'ALREADY SCHEDULED: yes — this is happening, so lead with how to prepare and what to ask before the day, not with whether to do it at all.'
  : scheduled === 'not_scheduled' ? 'ALREADY SCHEDULED: no — still deciding, so weigh whether and when, not just how.'
  : scheduled === 'second_opinion' ? 'ALREADY SCHEDULED: seeking a second opinion — say what a second opinion is worth here, what to bring to it, and what a good one would actually settle.'
  : ''}

Help me be an informed patient. COST ARITHMETIC: out_of_pocket_estimate must NET OUT any stated remaining insurance benefit from covered items before quoting a number — never state an unused benefit and then quote a full-price out-of-pocket in the same breath; show the subtraction inline.
${verifiedFactsBlock || '\n\nNo current medical guidance was verified for this procedure today — base is_this_standard and alternatives on your own knowledge, and let the verdict/explanation reflect that this was not independently checked.'}

Return ONLY valid JSON:
{
  "procedure_name": "Clean name of the procedure",
  "plain_english": "2-3 sentences explaining what this procedure actually involves, in language anyone can understand.",

  "is_this_standard": {
    "verdict": "Standard | Common but alternatives exist | Worth questioning | Get a second opinion",
    "verdict_level": "standard | alternatives | question | second_opinion",
    "explanation": "2-3 sentences on whether this is the typical recommendation for this situation.",
    "alternatives": ["1-3 alternative approaches that exist, if any, with brief explanation of each"]
  },

  "questions_to_ask": [
    {
      "question": "The exact question to ask your provider",
      "why_it_matters": "Why this question is important — what the answer reveals"
    }
  ],

  "cost_picture": {
    "typical_range": "Typical cost range for this procedure, in the user's local currency (never assume US dollars)",
    "insurance_typically": "What insurance usually covers for this",
    "out_of_pocket_estimate": "Realistic out-of-pocket estimate",
    "money_saving_tip": "One way to reduce the cost that most patients don't know about"
  },

  "second_opinion": {
    "recommended": true,
    "reason": "One sentence on whether a second opinion is warranted and why."
  },

  "red_flags": [
    "2-3 signs that should make you pause or seek another opinion for this specific procedure"
  ],

  "what_to_expect": {
    "procedure_duration": "How long the procedure typically takes, e.g. about 45 minutes",
    "recovery_time": "Realistic recovery timeline",
    "pain_level": "Honest pain/discomfort assessment",
    "lifestyle_impact": "How it affects daily life during recovery",
    "follow_up": "What follow-up care looks like"
  },

  "urgency_check": {
    "time_sensitive": true,
    "explanation": "Is delaying this procedure risky? Be clear about urgency."
  },

  "empowerment_note": "One reassuring sentence that empowers them to advocate for themselves."
}

Generate AT MOST 6 questions to ask (6 is plenty). Keep every field to one concise sentence (plain_english/explanation may be 2-3 sentences). verdict_level MUST stay one of the exact English keys standard|alternatives|question|second_opinion even when the rest of the response is in another language (it is a code value, not display text). Never place a double-quote (") character inside any JSON string value — a literal " breaks the JSON.`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3500,
      system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'procedure-probe' });
    if (!parsed.plain_english) {
      return res.status(500).json({ error: 'Could not analyze this procedure. Please try again.' });
    }
    const verifiedSources = groundedData(procedureFactsCacheKey)?.sources;
    return res.json(stripCites({
      ...parsed,
      ...(verifiedSources && verifiedSources.length ? { verified_sources: verifiedSources } : {}),
    }));

  } catch (error) {
    console.error('ProcedureProbe error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
