// quote-check.js
const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — the negotiation script and any quoted phrases must be written plainly with no inner quote marks, or it breaks the JSON.';

const REPAIR_TYPE_LABELS = {
  appliance: 'Home appliance (fridge, washer, dryer, dishwasher, oven, etc.)',
  car:       'Vehicle / auto repair',
  other:     'Other repair (HVAC, plumbing, electronics, general home repair)',
};

const ALLOWED_FILE_TYPES = { 'image/jpeg': 'image', 'image/png': 'image', 'application/pdf': 'document' };
const MAX_FILE_BYTES = 10 * 1024 * 1024;

// Parses a data: URL into a Claude content block (image or PDF document).
// Returns null on anything unparseable/unsupported — caller treats that as
// "no file", never a hard error, since the file is supplementary evidence.
function parseQuoteFile(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  const match = dataUrl.match(/^data:([a-zA-Z0-9/+.-]+);base64,(.+)$/);
  if (!match) return null;
  const [, mediaType, base64Data] = match;
  const kind = ALLOWED_FILE_TYPES[mediaType];
  if (!kind || !base64Data) return null;
  // Base64 is ~4/3 the size of the raw bytes.
  if (base64Data.length * 0.75 > MAX_FILE_BYTES) return null;
  return kind === 'image'
    ? { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } }
    : { type: 'document', source: { type: 'base64', media_type: mediaType, data: base64Data } };
}

router.post('/quote-check', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const {
      repairType, itemDescription, whatWentWrong, whatTheyToldYou,
      quotedPrice, quotedBreakdown, secondQuotePrice, itemAge, quoteFileBase64,
      userLanguage, userLocale, userCurrency, userRegion,
    } = req.body;

    if (!itemDescription?.trim()) return res.status(400).json({ error: 'Describe what needs repair.' });
    if (!whatWentWrong?.trim()) return res.status(400).json({ error: 'Describe what\'s wrong.' });
    if (quotedPrice === undefined || quotedPrice === null || isNaN(Number(quotedPrice)) || Number(quotedPrice) < 0) {
      return res.status(400).json({ error: 'Enter the price you were quoted.' });
    }

    const typeName = REPAIR_TYPE_LABELS[repairType] || REPAIR_TYPE_LABELS.other;
    const isCar = repairType === 'car';
    const isAppliance = repairType === 'appliance';
    const fileBlock = parseQuoteFile(quoteFileBase64);

    const systemPrompt = `You are a repair-quote fairness auditor — like a skeptical, knowledgeable friend who used to work in the trade, not a pricing database. Your job is to help the signer/customer tell whether a repair quote is reasonable, spot red flags of being overcharged, and give them real leverage — questions to ask, a script to push back with, and whether a second opinion is worth getting.

CRITICAL — you are NOT a real-time pricing database and must never pretend to be:
- Reason from general, well-known market patterns for this type of repair, not invented precision. State your confidence honestly (high/medium/low) based on how standardized this repair type actually is.
- For appliance repairs, typical cost ranges for common repairs are relatively well-established and you can reason with medium-to-high confidence.
- For car repairs, costs vary enormously by make/model/region/labor rates and a mature pricing-comparison industry (e.g. dedicated repair-estimate services) already exists with real transactional data you don't have — be more conservative here, lean harder on red-flag pattern recognition and negotiation leverage than on claiming a precise "fair" price, and say so when confidence is low.
- Never invent a specific dollar figure with false confidence. A range is fine; a suspiciously precise single number is not.

RED FLAG PATTERNS to actively check for:
- A relatively cheap, common-failure part (e.g. a sensor, fuse, belt, switch) being diagnosed as an expensive core component (e.g. compressor, transmission, control board) without a clear explanation of how they ruled out the cheaper cause first.
- Non-itemized quotes — a single lump sum with no breakdown of parts vs. labor.
- A parts markup that sounds disproportionate to a commodity part's typical cost.
- Pressure tactics — urgency, "if you don't approve today," scare language about the item being dangerous or about to fail catastrophically.
- A diagnostic/service-call fee that is NOT credited back if the customer approves the repair (industry-normal is to credit it).
- Refusal or reluctance to itemize when asked.

DECISION FRAMING:
${isAppliance ? '- If item age is provided, weigh repair-cost-vs-replacement-cost — a repair costing more than roughly half of a realistic replacement cost is usually not worth it, but say this as a rule of thumb, not a rigid formula.' : ''}
${isCar ? '- For vehicles, mention that a dedicated repair-estimate comparison service can give more precise, data-backed pricing than you can — you are the leverage/red-flags layer, not the pricing-precision layer.' : ''}
- Be honest and specific — quote back the user's own numbers and details, don't give generic advice that could apply to any repair.
- If a second quote price was provided, directly compare the two and say what the gap implies.
${fileBlock ? '- The user also attached a photo or PDF of the actual quote/invoice. Read it carefully — it is the ground truth. If it shows different numbers, line items, or wording than what the user typed below, trust the document and note the discrepancy in your analysis.' : ''}

${NO_QUOTE_RULE} Return ONLY valid JSON, no markdown, no code fences, no text outside the JSON object.`;

    const prompt = `REPAIR TYPE: ${typeName}
ITEM: ${itemDescription.trim()}
WHAT'S WRONG: ${whatWentWrong.trim()}
${whatTheyToldYou?.trim() ? `WHAT THE REPAIR PERSON TOLD YOU (their diagnosis/explanation): ${whatTheyToldYou.trim()}` : 'WHAT THE REPAIR PERSON TOLD YOU: not specified'}
QUOTED PRICE: ${quotedPrice} ${userCurrency || 'USD'}
${quotedBreakdown?.trim() ? `ITEMIZED BREAKDOWN THEY GAVE: ${quotedBreakdown.trim()}` : 'ITEMIZED BREAKDOWN: none given — quote was a lump sum'}
${secondQuotePrice ? `SECOND QUOTE RECEIVED: ${secondQuotePrice} ${userCurrency || 'USD'}` : ''}
${isAppliance && itemAge?.trim() ? `ITEM AGE: ${itemAge.trim()}` : ''}

Analyze this specific quote. Be concrete — reference the user's actual numbers and details, not generic advice.

Return ONLY valid JSON:
{
  "understanding": "1-2 sentences showing you understand their specific situation",
  "verdict": "likely_fair | somewhat_high | overpriced | cant_tell",
  "verdict_explanation": "2-3 sentences explaining the verdict, referencing their actual quote",
  "price_reality_check": {
    "typical_range": "A typical range for this specific repair, in the user's currency — or 'not enough information to estimate' if genuinely too unusual/specific to know",
    "where_this_quote_falls": "One sentence: how their quote compares to that range",
    "confidence": "high | medium | low"
  },
  "red_flags": [
    { "flag": "Specific red flag found in THIS quote — one sentence", "why_it_matters": "One sentence" }
  ],
  "itemization_check": {
    "is_itemized_enough": true,
    "whats_missing": "What breakdown detail is missing, or null if itemized fine"
  },
  "replace_vs_repair": ${isAppliance ? '{ "applies": true, "guidance": "One sentence — is this repair worth it vs. replacing the item, given the age/cost, or note that age wasn\'t provided" }' : 'null'},
  "negotiation_script": "Exact words the user could say to push back, ask for an itemized breakdown, or ask for a second opinion — 2-4 sentences, ready to use as-is",
  "questions_to_ask": ["Specific question to ask before approving the repair — at most 4"],
  "second_opinion": {
    "recommended": true,
    "reason": "One sentence — is a second opinion worth the hassle here, and why"
  }
}

ARRAY BOUNDS: red_flags at most 5 (empty array if genuinely none found — don't invent flags for a clean quote), questions_to_ask at most 4.`;

    const content = fileBlock
      ? [fileBlock, { type: 'text', text: prompt }]
      : prompt;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3000,
      system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content }],
    }, { label: 'quote-check' });

    const VALID_VERDICTS = ['likely_fair', 'somewhat_high', 'overpriced', 'cant_tell'];
    if (!VALID_VERDICTS.includes(parsed?.verdict)) {
      return res.status(500).json({ error: 'Unexpected response format. Please try again.' });
    }

    res.json({
      understanding:        parsed.understanding ?? '',
      verdict:               parsed.verdict,
      verdict_explanation:   parsed.verdict_explanation ?? '',
      price_reality_check:   parsed.price_reality_check ?? null,
      red_flags:              Array.isArray(parsed.red_flags) ? parsed.red_flags : [],
      itemization_check:      parsed.itemization_check ?? null,
      replace_vs_repair:      parsed.replace_vs_repair ?? null,
      negotiation_script:     parsed.negotiation_script ?? '',
      questions_to_ask:       Array.isArray(parsed.questions_to_ask) ? parsed.questions_to_ask : [],
      second_opinion:         parsed.second_opinion ?? null,
    });
  } catch (error) {
    console.error('quote-check error:', error);
    res.status(500).json({ error: 'Analysis failed. Please try again.' });
  }
});

module.exports = router;
