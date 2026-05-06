const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');
const { rateLimit } = require('../lib/rateLimiter');

// ════════════════════════════════════════════════════════════
// POST /noise-canceler — What Actually Affects Me?
// ════════════════════════════════════════════════════════════
router.post('/noise-canceler', rateLimit(), async (req, res) => {
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

    const systemPrompt = `You are a personal relevance filter. People receive long, dense documents — insurance EOBs, HOA notices, school newsletters, corporate policy updates, benefits packets, lease amendments — and need to know what ACTUALLY AFFECTS THEM PERSONALLY.

You are NOT a summarizer. You are NOT a jargon translator. You are a RELEVANCE ENGINE.

KEY PRINCIPLES:
1. Filter ruthlessly. If something doesn't affect this specific person given their stated situation, it doesn't make the cut.
2. Prioritize by urgency: things requiring action first, then things that cost/save money, then FYI items.
3. Be specific about what they need to DO, by WHEN, and what happens if they don't.
4. Call out buried important items — the paragraph on page 6 that actually matters.
5. Identify things that seem routine but have real consequences they might miss.
6. If nothing in the document affects them, say so clearly — that's valuable information too.
7. Never add legal or medical advice. Flag items where they should consult a professional.`;

    const userPrompt = `DOCUMENT:
${document.substring(0, 12000)}

DOCUMENT TYPE: ${documentType || 'unknown'}

MY SITUATION: ${mySituation}
${concerns ? `SPECIFIC CONCERNS: ${concerns}` : ''}

Filter this document for what actually matters to this person. Return ONLY valid JSON:

{
  "document_type": "What type of document this appears to be",
  "tldr": "One sentence: the single most important thing in this document for this person. If nothing affects them: 'Nothing in this document requires your attention.'",

  "action_required": [
    {
      "what": "Specific action they need to take",
      "deadline": "By when — exact date if stated, 'ASAP' or 'no deadline' if not",
      "consequence": "What happens if they don't do this",
      "how": "Exactly how to do it — phone number, URL, form name, etc. if mentioned in the document",
      "effort": "quick (< 5 min) | moderate (30 min) | involved (1+ hour)"
    }
  ],

  "costs_you_money": [
    {
      "what": "Price change, new fee, charge, or cost that affects them",
      "amount": "Specific amount if stated",
      "when": "When it takes effect",
      "avoidable": "Can they avoid or reduce this? How?"
    }
  ],

  "saves_you_money": [
    {
      "what": "Discount, benefit, credit, or savings opportunity",
      "amount": "Specific amount if stated",
      "how_to_claim": "What they need to do to get it",
      "deadline": "By when"
    }
  ],

  "affects_you": [
    {
      "what": "Change or information that's relevant to their situation but doesn't require immediate action",
      "why_it_matters": "Why this matters specifically to them given their stated situation",
      "priority": "high | medium | low"
    }
  ],

  "does_not_affect_you": "Brief note about what major sections of the document they can safely ignore and why (given their situation)",

  "buried_important": [
    {
      "what": "Something important that was buried or easy to miss",
      "where": "Where in the document it appeared (e.g., 'paragraph 4 of section 3', 'buried in the fine print')",
      "why_buried": "Why this is easy to miss"
    }
  ],

  "consult_professional": [
    {
      "topic": "What requires professional guidance",
      "why": "Why they shouldn't rely on this document alone",
      "who": "What type of professional (lawyer, accountant, doctor, HR rep, etc.)"
    }
  ] or [],

  "questions_to_ask": [
    "Specific questions they should ask the sender/issuer of this document, if any"
  ],

  "confidence": "high | medium | low — how confident you are in the relevance filtering given the information provided",
  "confidence_note": "What additional info would improve the filtering, if anything"
}

If a section has no items, return an empty array []. Prioritize action_required and costs_you_money — those are what people miss and regret.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const parsed = JSON.parse(cleanJsonResponse(text));
    res.json(parsed);

  } catch (error) {
    console.error('Noise Canceler error:', error);
    res.status(500).json({ error: error.message || 'Failed to filter document' });
  }
});

module.exports = router;
