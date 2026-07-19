// contract-decoder.js
const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const CONTRACT_TYPE_LABELS = {
  employment:  'Employment contract',
  freelance:   'Freelance or NDA agreement (infer which from the text itself — do not assert the document contains NDA terms unless it does)',
  lease:       'Lease / Rental agreement',
  saas:        'SaaS / Terms of service',
  service:     'Service agreement',
  purchase:    'Purchase / Sale agreement',
  partnership: 'Partnership agreement',
  other:       'Contract',
};

router.post('/contract-decoder/stream', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  const { contractText, contractType, focusAreas, context, userLanguage, userLocale, userCurrency, userRegion } = req.body;

  if (!contractText?.trim() || contractText.trim().length < 100) {
    return res.status(400).json({ error: 'Please provide more contract text for a useful analysis.' });
  }

  const typeName   = CONTRACT_TYPE_LABELS[contractType] ?? 'Contract';
  const focusList  = Array.isArray(focusAreas) && focusAreas.length
    ? `\nPrioritize these areas: ${focusAreas.join(', ')}`
    : '';

  const systemPrompt = withLanguage(
    `You are an expert contract attorney reviewing documents on behalf of the signing party — not the party that drafted the contract. Your goal is to protect the signer by identifying clauses that are unfair, unusual, high-risk, or commonly negotiated. You are precise and specific: you quote actual clause text, cite specific problems, and give concrete negotiation asks. You always return only valid JSON with no markdown, no code blocks, and no explanation outside the JSON object.`,
    userLanguage
  );

  const prompt = `Review this ${typeName} and identify clauses the signer should know about.
${context ? `\nSigner's situation: ${context}` : ''}${focusList}

Contract text:
---
${contractText.trim()}
---

Return ONLY valid JSON with this exact structure:
{
  "overall_risk": "high" | "medium" | "low",
  "overall_summary": <2-3 sentence plain-English summary of the contract's most important concerns for the signer>,
  "red_flags_count": <integer — count of high-risk clauses only>,
  "clauses": [
    {
      "clause_name": <short name — e.g. "IP Assignment", "Non-Compete", "Unilateral Modification">,
      "risk_level": "high" | "medium" | "low",
      "plain_english": <1-2 sentence explanation of what this clause actually means for the signer>,
      "quote": <exact excerpt from contract — max 200 characters>,
      "why_it_matters": <why this is significant or unusual>,
      "what_to_do": <specific recommended action — e.g. "Request a liability cap equal to fees paid", "Strike this clause entirely">,
      "negotiate": <specific replacement language or ask — null if not negotiable or standard>
    }
  ],
  "missing_protections": [<protection standard for this contract type that is absent — be specific>],
  "before_you_sign": [<concrete action to take before signing — max 5 items>]
}

Order clauses by risk_level descending (high first). Include at most 10 clauses (the most important — skip genuinely boilerplate, fair clauses) and at most 6 missing_protections. Be specific — quote actual text, cite actual problems. Return ONLY the JSON object.`;

  try {
    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 6000,
      system: systemPrompt + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'contract-decoder' });

    const VALID_RISKS = ['high', 'medium', 'low'];
    if (!VALID_RISKS.includes(parsed?.overall_risk)) {
      return res.status(500).json({ error: 'Unexpected response format. Please try again.' });
    }

    res.json({
      overall_risk:         parsed.overall_risk,
      overall_summary:      parsed.overall_summary ?? '',
      red_flags_count:      typeof parsed.red_flags_count === 'number' ? parsed.red_flags_count : 0,
      clauses:              Array.isArray(parsed.clauses) ? parsed.clauses : [],
      missing_protections:  Array.isArray(parsed.missing_protections) ? parsed.missing_protections : [],
      before_you_sign:      Array.isArray(parsed.before_you_sign) ? parsed.before_you_sign : [],
    });
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: 'Analysis failed. Please try again.' });
    }
  }
});

module.exports = router;
