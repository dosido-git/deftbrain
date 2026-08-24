// contract-decoder.js — DeftBrain V2
const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { groundedFacts, normalizeKeyPart } = require('../lib/groundedFacts');
const { runOutputGuard } = require('../lib/outputGuard');

router.outputStandard = 'v2';
router.outputGuard = {
  prohibit: [
    'unsupported_legal_conclusion',
    'unsupported_enforceability_claim',
    'unsupported_risk_rating',
    'unsupported_fairness_or_standardness_claim',
    'invented_contract_fact',
    'assumed_jurisdiction',
    'prescriptive_legal_advice',
    'false_precision',
  ],
  require: [
    'quoted_contract_grounding',
    'plain_english_explanation',
    'actionable_questions',
    'structural_completeness',
  ],
};

const CONTRACT_TYPE_LABELS = {
  employment:  'Employment contract',
  freelance:   'Freelance or NDA agreement',
  lease:       'Lease / Rental agreement',
  saas:        'SaaS / Terms of service',
  service:     'Service agreement',
  purchase:    'Purchase / Sale agreement',
  partnership: 'Partnership agreement',
  other:       'Contract',
};

const SYSTEM_BASE = `You are Contract Decoder, a DeftBrain tool that helps a signer understand a contract before signing.

Explain what the document says in ordinary language. Identify terms that materially affect the signer, questions worth asking, and possible points to clarify or negotiate.

Be definite about what the document actually says. Be careful about judgments the document cannot establish.

Do not rate the contract or a clause high/medium/low risk. Do not call a clause fair, unfair, standard, unusual, safe, dangerous, legal, illegal, valid, invalid, enforceable, or unenforceable unless current applicable law has been specifically verified and supports that statement.

Do not assume jurisdiction from the visitor's locale, currency, IP region, or location. If contract jurisdiction is unknown, say so when jurisdiction would materially affect an explanation.

Do not invent missing terms or declare that the contract lacks a protection merely because you would expect one. You may say that the supplied text does not appear to address a specific practical question.

Negotiation language is an option, not a command. Phrase it as one possible way to ask for a change.

Use only facts in the supplied contract and visitor context, plus any VERIFIED CURRENT LAW block supplied in the prompt. Return only valid JSON with no markdown or commentary outside the JSON.

Never place a double-quote (") character inside any JSON string value. This matters most in the quote field, where you are copying contract language that often contains them: replace inner quote marks with single quotes. An unescaped one breaks the JSON and the tool returns nothing.`;

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanList(value, max) {
  return Array.isArray(value)
    ? value.map(cleanString).filter(Boolean).slice(0, max)
    : [];
}

function normalizeDraft(value) {
  const terms = Array.isArray(value?.important_terms)
    ? value.important_terms.slice(0, 8).map((term) => ({
        heading: cleanString(term?.heading),
        quote: cleanString(term?.quote).slice(0, 300),
        plain_english: cleanString(term?.plain_english),
        practical_effect: cleanString(term?.practical_effect),
        question_to_consider: cleanString(term?.question_to_consider),
        possible_negotiation_ask: cleanString(term?.possible_negotiation_ask) || null,
      })).filter(term => term.heading && term.quote && term.plain_english && term.practical_effect)
    : [];

  const clarifications = Array.isArray(value?.things_to_clarify)
    ? value.things_to_clarify.slice(0, 5).map((item) => ({
        observation: cleanString(item?.observation),
        question: cleanString(item?.question),
      })).filter(item => item.observation && item.question)
    : [];

  const legalQuestions = Array.isArray(value?.legal_questions)
    ? value.legal_questions.slice(0, 5).map((item) => ({
        topic: cleanString(item?.topic),
        why_relevant: cleanString(item?.why_relevant),
      })).filter(item => item.topic && item.why_relevant)
    : [];

  return {
    summary: cleanString(value?.summary),
    important_terms: terms,
    things_to_clarify: clarifications,
    before_you_sign: cleanList(value?.before_you_sign, 5),
    legal_questions: legalQuestions,
  };
}

function validateOutput(value) {
  if (!value?.summary || !Array.isArray(value?.important_terms) || value.important_terms.length === 0) {
    return false;
  }
  return value.important_terms.every(term =>
    term.heading && term.quote && term.plain_english && term.practical_effect
  );
}

router.post('/contract-decoder/stream', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  const {
    contractText,
    pdfBase64,
    contractType,
    focusAreas,
    context,
    jurisdiction,
    userLanguage,
    userLocale,
    userCurrency,
    userRegion,
  } = req.body;

  const hasPdf = typeof pdfBase64 === 'string' && pdfBase64.length > 100;
  if (!hasPdf && (!contractText?.trim() || contractText.trim().length < 100)) {
    return res.status(400).json({ error: 'Paste the contract text or upload the file.' });
  }

  const typeName = CONTRACT_TYPE_LABELS[contractType] ?? 'Contract';
  const focusList = Array.isArray(focusAreas) && focusAreas.length
    ? `\nThe visitor especially wants help understanding: ${focusAreas.join(', ')}.`
    : '';
  const jurisdictionLine = jurisdiction?.trim()
    ? `\nStated contract jurisdiction/location: ${jurisdiction.trim()}. Do not infer anything more specific.`
    : `\nContract jurisdiction/location: not supplied. Do not substitute the visitor's locale or region.`;
  const contextLine = context?.trim()
    ? `\nVisitor context: ${context.trim()}`
    : '';

  // A PDF goes to the model as a document block; it reads them natively, and
  // browser-side text extraction produces mojibake that passes a length check.
  const documentBlock = hasPdf
    ? `${contextLine}${focusList}${jurisdictionLine}\n\nThe contract is the attached PDF. Read the whole document. Quote from it exactly as it appears.`
    : `${contextLine}${focusList}${jurisdictionLine}\n\nContract text:\n---\n${contractText.trim()}\n---`;

  const pdfBlocks = hasPdf
    ? [{
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: pdfBase64.slice(pdfBase64.indexOf(',') + 1),
        },
      }]
    : [];

  const firstPassPrompt = `Read this ${typeName} and produce a grounded first-pass explanation for the signer.

${documentBlock}

Return ONLY valid JSON in this exact shape:
{
  "summary": "2-3 sentence plain-English description of what this agreement does and the most consequential terms visible in the supplied text",
  "important_terms": [
    {
      "heading": "short descriptive heading",
      "quote": "exact excerpt from the supplied contract, maximum 300 characters",
      "plain_english": "what the quoted language says in ordinary words",
      "practical_effect": "the concrete consequence for the signer if this term applies as written",
      "question_to_consider": "a useful question the signer could ask about this term",
      "possible_negotiation_ask": "one optional, neutral way to ask for a change, or null"
    }
  ],
  "things_to_clarify": [
    {
      "observation": "a practical question the supplied text does not appear to answer clearly",
      "question": "a concise question the signer could ask"
    }
  ],
  "before_you_sign": ["concrete verification or clarification step grounded in this document"],
  "legal_questions": [
    {
      "topic": "only a legal rule whose current status would materially change the explanation",
      "why_relevant": "the exact contract term that makes verification useful"
    }
  ]
}

Rules:
- Include at most 8 important_terms, 5 things_to_clarify, 5 before_you_sign items, and 5 legal_questions.
- Every important term must quote language actually present in the supplied contract.
- Do not create a legal_question merely because the contract type often raises that issue. Include one only when this document contains a term for which current law could materially change the explanation.
- If jurisdiction is unknown, legal_questions may identify what would need verification, but do not state jurisdiction-specific law.
- Do not score risk, diagnose fairness, or prescribe what the signer must do.`;

  try {
    const firstRaw = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 6000,
      system: withLanguage(SYSTEM_BASE, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: [...pdfBlocks, { type: 'text', text: firstPassPrompt }] }],
    }, { label: 'contract-decoder-v2-first-pass' });

    const first = normalizeDraft(firstRaw);
    if (!validateOutput(first)) {
      return res.status(500).json({ error: 'Unexpected response format. Please try again.' });
    }

    let verifiedLawBlock = '';
    if (jurisdiction?.trim() && first.legal_questions.length) {
      const topics = first.legal_questions.map(q => q.topic).join('; ');
      const facts = await groundedFacts({
        cacheKey: `contract-law-v2:${normalizeKeyPart(jurisdiction)}:${normalizeKeyPart(contractType || 'general')}:${normalizeKeyPart(topics)}`,
        label: 'contract-decoder-v2-targeted-law',
        userPrompt: `Verify only the following current legal questions for ${jurisdiction.trim()} as of today, because they were raised by terms actually present in a contract: ${first.legal_questions.map(q => `${q.topic} — ${q.why_relevant}`).join(' | ')}. Use authoritative government, statutory, regulatory, or court sources where available. Skip any proposition you cannot verify. Do not add unrelated contract-law rules.\n\nReturn ONLY valid JSON:\n{ "verified": [{ "topic": "topic", "rule": "narrow verified rule", "authority": "statute/regulation/case or official source", "effective": "effective date if material and known", "source": "source domain" }] }`,
        render: (cleanFacts) => {
          if (!Array.isArray(cleanFacts.verified) || !cleanFacts.verified.length) return '';
          return cleanFacts.verified.map(f =>
            `- ${f.topic}: ${f.rule} (${f.authority}${f.effective ? `; ${f.effective}` : ''}; source: ${f.source})`
          ).join('\n');
        },
      });
      verifiedLawBlock = facts || '';
    }

    let final = first;
    if (verifiedLawBlock) {
      const finalPrompt = `Refine this grounded contract explanation using ONLY the verified current-law facts below where they materially affect a term already identified. Do not add unrelated legal commentary. Do not convert a narrow verified rule into a broad claim that the whole clause or contract is legal, illegal, enforceable, unenforceable, fair, unfair, safe, or risky.

VERIFIED CURRENT LAW FOR THE STATED JURISDICTION:
${verifiedLawBlock}

FIRST-PASS ANALYSIS:
${JSON.stringify(first)}

Return ONLY valid JSON with this exact public shape:
{
  "summary": "...",
  "important_terms": [{
    "heading": "...",
    "quote": "...",
    "plain_english": "...",
    "practical_effect": "...",
    "question_to_consider": "...",
    "possible_negotiation_ask": "... or null"
  }],
  "things_to_clarify": [{ "observation": "...", "question": "..." }],
  "before_you_sign": ["..."]
}`;

      const finalRaw = await callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 6000,
        system: withLanguage(SYSTEM_BASE, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
        messages: [{ role: 'user', content: finalPrompt }],
      }, { label: 'contract-decoder-v2-final' });
      final = normalizeDraft(finalRaw);
      if (!validateOutput(final)) {
        return res.status(500).json({ error: 'Unexpected response format. Please try again.' });
      }
    }

    // v2 guard (PF-39a). Fail-open: it wraps a working answer.
    try {
      const fields = [['summary', final.summary]];
      final.important_terms.forEach((term, i) => {
        fields.push([`important_terms[${i}].plain_english`, term.plain_english]);
        fields.push([`important_terms[${i}].practical_effect`, term.practical_effect]);
        if (term.possible_negotiation_ask) fields.push([`important_terms[${i}].possible_negotiation_ask`, term.possible_negotiation_ask]);
      });
      final.things_to_clarify.forEach((item, i) => fields.push([`things_to_clarify[${i}].observation`, item.observation]));
      final.before_you_sign.forEach((item, i) => fields.push([`before_you_sign[${i}]`, item]));

      await runOutputGuard(final, {
        label: 'contract-decoder',
        fields,
        supplied: `CONTRACT TYPE: ${typeName}
STATED JURISDICTION: ${jurisdiction?.trim() || '(not supplied — do not infer one)'}
VISITOR CONTEXT: ${context?.trim() || '(not supplied)'}
${verifiedLawBlock ? `VERIFIED CURRENT LAW:\n${verifiedLawBlock}` : 'NO LAW WAS VERIFIED — any legal conclusion is unsupported.'}

${hasPdf ? 'THE CONTRACT WAS SUPPLIED AS A PDF, which the generator read directly. You cannot see it, so do not flag a quote as unsupported — a quote is verbatim contract text by construction. Judge only the claims made ABOUT the quoted language.' : ''}
THE CONTRACT TEXT ITSELF IS THE OTHER SOURCE OF TRUTH. A term is supported when the quoted language says it; anything about fairness, standardness, enforceability or risk is NOT in the document and needs verified law, which is listed above or absent.`,
        promise: 'Explain what this contract says in ordinary language, name the terms that materially affect the signer, and give questions worth asking before signing.',
        guard: router.outputGuard,
        // The quote field is excluded on purpose: it is verbatim contract text,
        // and "unsupported" is not a thing a verbatim excerpt can be.
        requiredNonEmpty: ['summary', ...final.important_terms.map((_, i) => `important_terms[${i}].plain_english`)],
        userLanguage,
        locale: withLocaleContext(userLocale, userCurrency, userRegion),
      });
    } catch (guardErr) {
      console.error('[contract-decoder] v2 guard skipped:', guardErr.message);
    }

    res.json(stripCites({
      summary: final.summary,
      important_terms: final.important_terms,
      things_to_clarify: final.things_to_clarify,
      before_you_sign: final.before_you_sign,
    }));
  } catch (err) {
    console.error('[contract-decoder] Error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Analysis failed. Please try again.' });
    }
  }
});

function stripCites(val) {
  if (typeof val === 'string') return val.replace(/<\/?(antml:)?cite\b[^>]*>/g, '');
  if (Array.isArray(val)) return val.map(stripCites);
  if (val && typeof val === 'object') {
    return Object.fromEntries(Object.entries(val).map(([k, v]) => [k, stripCites(v)]));
  }
  return val;
}

module.exports = router;
