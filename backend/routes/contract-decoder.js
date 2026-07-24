// contract-decoder.js
const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { groundedFacts, normalizeKeyPart } = require('../lib/groundedFacts');

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
    `You are an expert contract attorney reviewing documents on behalf of the signing party — not the party that drafted the contract. Your goal is to protect the signer by identifying clauses that are unfair, unusual, high-risk, or commonly negotiated. You are precise and specific: you quote actual clause text, cite specific problems, and give concrete negotiation asks. You always return only valid JSON with no markdown, no code blocks, and no explanation outside the JSON object. Never place a double-quote (") character inside any JSON string value — in the quote field and everywhere else, replace inner quote marks with single quotes, or the JSON breaks.`,
    userLanguage
  );

  // Grounded facts PRE-PASS (shared lib/groundedFacts.js pattern + cache):
  // the 2026-07-23 audit showed the hedge alone misses changed law (a planted
  // illegal Probezeit clause survived) — verify the volatile limits up front.
  const verifiedLawBlock = await groundedFacts({
    cacheKey: `contract-law:${normalizeKeyPart(userRegion || userLocale || 'US')}:${normalizeKeyPart(contractType || 'general')}`,
    label: 'contract-decoder-facts',
    userPrompt: `Verify with web_search the 3-5 statutory limits most relevant to ${typeName} contracts in ${userRegion || userLocale || 'the US'} that a SIGNER should know (as of today) — prioritize rules that changed or took effect since 2022, plus long-standing floors. As applicable to this contract type: notice-period floors, auto-renewal limits, non-compete enforceability, probation rules, fee/deposit/penalty caps. Skip anything you cannot verify.

Return ONLY valid JSON:
{ "jurisdiction": "Country/region", "verified": [{ "topic": "short slug", "rule": "The current rule in one sentence with the numeric limit", "statute": "Statute name/number", "effective": "Effective date or 'long-standing'", "source": "Domain verified against" }] }`,
    render: (cleanFacts) => {
      if (Array.isArray(cleanFacts.verified) && cleanFacts.verified.length) {
        return `\nVERIFIED CURRENT LAW (web-checked today for ${cleanFacts.jurisdiction || userRegion || 'the stated region'}) — these figures OVERRIDE your training knowledge; use them verbatim and check every clause against them:\n` +
          cleanFacts.verified.map(f => `- [${f.topic}] ${f.rule} (${f.statute}, ${f.effective}; source: ${f.source})`).join('\n') + '\n';
      }
      return '';
    },
  });

  const prompt = `Review this ${typeName} and identify clauses the signer should know about.

LEGAL FIGURES: laws change and your knowledge may be stale — when citing a statute or numeric legal limit, note its effective date if known and advise the signer to verify current law; never present a remembered figure as a verified hard limit.
${verifiedLawBlock}${context ? `\nSigner's situation: ${context}` : ''}${focusList}

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

Order clauses by risk_level descending (high first). Include at most 8 clauses (the most important — skip genuinely boilerplate, fair clauses) and at most 6 missing_protections. Be specific — quote actual text (with inner quote marks replaced by single quotes), cite actual problems. Return ONLY the JSON object.`;

  try {
    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      // 6000 (the German-era fix) truncated every Arabic call; verbatim quote
      // excerpts × non-Latin scripts need more headroom — 2026-07-23 audit.
      max_tokens: 9000,
      system: systemPrompt + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'contract-decoder' });

    const VALID_RISKS = ['high', 'medium', 'low'];
    if (!VALID_RISKS.includes(parsed?.overall_risk)) {
      return res.status(500).json({ error: 'Unexpected response format. Please try again.' });
    }

    res.json(stripCites({
      overall_risk:         parsed.overall_risk,
      overall_summary:      parsed.overall_summary ?? '',
      red_flags_count:      typeof parsed.red_flags_count === 'number' ? parsed.red_flags_count : 0,
      clauses:              Array.isArray(parsed.clauses) ? parsed.clauses : [],
      missing_protections:  Array.isArray(parsed.missing_protections) ? parsed.missing_protections : [],
      before_you_sign:      Array.isArray(parsed.before_you_sign) ? parsed.before_you_sign : [],
    }));
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: 'Analysis failed. Please try again.' });
    }
  }
});

// Recursively strip <cite ...>...</cite> tags from string values in any
// nested structure. Required because the web_search tool wraps phrases in
// citation tags inside JSON string values. (Same helper as safe-walk.)
function stripCites(val) {
  if (typeof val === 'string') return val.replace(/<\/?(antml:)?cite\b[^>]*>/g, '');
  if (Array.isArray(val)) return val.map(stripCites);
  if (val && typeof val === 'object') {
    return Object.fromEntries(
      Object.entries(val).map(([k, v]) => [k, stripCites(v)])
    );
  }
  return val;
}

module.exports = router;
