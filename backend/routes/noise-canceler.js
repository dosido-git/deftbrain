const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ════════════════════════════════════════════════════════════
// POST /noise-canceler — What Actually Affects Me?
// ════════════════════════════════════════════════════════════
router.post('/noise-canceler', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const {
      document,        // The full text of the document
      documentType,    // 'insurance_eob', 'school_newsletter', 'hoa_notice', 'lease', 'policy_update', 'benefits', 'government', 'medical', 'legal', 'other'
      mySituation,     // Their context: "renter, no kids, have a dog", "single, 28, healthy, basic plan"
      concerns,        // Optional: specific things they're worried about
      userLanguage,
    } = req.body;

    if (!document?.trim()) {
      return res.status(400).json({ error: 'Paste the document you received' });
    }
    if (!mySituation?.trim()) {
      return res.status(400).json({ error: 'Tell us about your situation so we can filter what matters to you' });
    }

    const systemPrompt = `Personal relevance filter. Extract what actually matters from dense, bureaucratic, or deliberately obscure documents.

For each key point: plain English meaning, whether it affects this specific person, required action and deadline, and what's buried vs what's prominently featured. Most documents have 2-3 things that actually matter — ruthlessly identify them. Never pad with things that don't affect the reader.`;

    const userPrompt = `DOCUMENT:
${document.substring(0, 12000)}

DOCUMENT TYPE: ${documentType || 'unknown'}

MY SITUATION: ${mySituation}
${concerns ? `SPECIFIC CONCERNS: ${concerns}` : ''}

Filter this document for what actually matters to this person. Return ONLY valid JSON:

{
  "document_type": "What type of document this appears to be — one sentence",
  "tldr": "One sentence: the single most important thing in this document for this person. If nothing affects them: 'Nothing in this document requires your attention.'",

  "action_required": [
    {
      "what": "Specific action they need to take — one sentence",
      "deadline": "By when — exact date if stated, 'ASAP' or 'no deadline' if not — one sentence",
      "consequence": "What happens if they don't do this — one sentence",
      "how": "Exactly how to do it — phone number, URL, form name, etc. if mentioned in the document — one sentence",
      "effort": "quick (< 5 min) | moderate (30 min) | involved (1+ hour)"
    }
  ],

  "costs_you_money": [
    {
      "what": "Price change, new fee, charge, or cost that affects them — one sentence",
      "amount": "Specific amount if stated (number)",
      "when": "When it takes effect — one sentence",
      "avoidable": "Can they avoid or reduce this? How? — one sentence"
    }
  ],

  "saves_you_money": [
    {
      "what": "Discount, benefit, credit, or savings opportunity — one sentence",
      "amount": "Specific amount if stated (number)",
      "how_to_claim": "What they need to do to get it — one sentence",
      "deadline": "By when — one sentence"
    }
  ],

  "affects_you": [
    {
      "what": "Change or information that's relevant to their situation but doesn't require immediate action — one sentence",
      "why_it_matters": "Why this matters specifically to them given their stated situation — one sentence",
      "priority": "high | medium | low"
    }
  ],

  "does_not_affect_you": "Brief note about what major sections of the document they can safely ignore and why (given their situation) — one sentence",

  "buried_important": [
    {
      "what": "Something important that was buried or easy to miss — one sentence",
      "where": "Where in the document it appeared (e.g., 'paragraph 4 of section 3', 'buried in the fine print') — one sentence",
      "why_buried": "Why this is easy to miss — one sentence"
    }
  ],

  "consult_professional": [
    {
      "topic": "What requires professional guidance — 3-6 words",
      "why": "Why they shouldn't rely on this document alone — one sentence",
      "who": "What type of professional (lawyer, accountant, doctor, HR rep, etc.) — one sentence"
    }
  ] or [],

  "questions_to_ask": [
    "Specific questions they should ask the sender/issuer of this document, if any"
  ],

  "confidence": "high | medium | low — how confident you are in the relevance filtering given the information provided",
  "confidence_note": "What additional info would improve the filtering, if anything — one sentence"
}

If a section has no items, return an empty array []. Prioritize action_required and costs_you_money — those are what people miss and regret.`;

    const parsed = await callClaudeWithRetry({
model: MODELS.SMART,
      max_tokens: 2000,
      system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'noise-canceler' });
    if (!parsed.document_type) {
      return res.status(500).json({ error: 'Could not generate a response. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('Noise Canceler error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

module.exports = router;
