// scam-radar.js
const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

router.post('/scam-radar/stream', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  const { messageText, messageType, senderContext, userLanguage, userLocale, userCurrency, userRegion } = req.body;

  if (!messageText?.trim()) {
    return res.status(400).json({ error: 'Message content is required.' });
  }

  const TYPE_LABELS = {
    email:   'Email',
    sms:     'SMS / Text message',
    dm:      'WhatsApp / Direct message',
    phone:   'Phone script',
    invoice: 'Invoice / Document',
    social:  'Social media post',
    other:   'Other',
  };

  const typeName = TYPE_LABELS[messageType] || 'Message';

  const systemPrompt = withLanguage(
    `You are an expert scam, phishing, and fraud detection analyst with deep knowledge of social engineering techniques, cybercrime patterns, and consumer fraud. Your role is to analyze messages and identify whether they are scams, suspicious, or legitimate. You are precise, specific, and cite actual content from the message rather than making generic statements. You always return only valid JSON with no markdown formatting, no code blocks, and no explanation outside the JSON object.`,
    userLanguage
  );

  const prompt = `Analyze the following ${typeName} for signs of fraud, scams, phishing, or manipulation.

${senderContext ? `Sender / context: ${senderContext}\n` : ''}Message content:
---
${messageText.trim()}
---

Return ONLY valid JSON with this exact structure (no markdown, no backticks, no explanation):
{
  "verdict": "SCAM" | "SUSPICIOUS" | "LIKELY SAFE",
  "confidence": <integer 0–100>,
  "scam_type": <string from this list: "Phishing", "Smishing", "Vishing", "Advance Fee Fraud", "Romance Scam", "Fake Invoice", "Prize / Lottery Scam", "Authority Impersonation", "Tech Support Scam", "Job Offer Scam", "Investment Scam", "Subscription Trap", "Package Delivery Scam", "Charity Scam", "Unknown" — or null if LIKELY SAFE>,
  "scam_type_description": <1–2 sentence plain-language explanation of this scam type and how it works — or null if LIKELY SAFE>,
  "one_liner": <one concise sentence summarizing the verdict and key reason>,
  "red_flags": [<specific red flag found in THIS message — cite actual phrases or elements observed — max 8>],
  "green_flags": [<specific genuine-looking element in THIS message, if any — max 4 — empty array if none>],
  "techniques_used": [<manipulation technique name from: "Urgency / time pressure", "Authority impersonation", "Fear of loss", "Too good to be true", "Request for sensitive data", "Suspicious links or domains", "Poor grammar / spelling", "Generic greeting", "Threat of consequences", "Emotional manipulation", "Impersonation of known brand", "Fake scarcity", "Prize or reward lure", "Grooming / trust building" — only include what is actually present>],
  "what_to_do": [<specific concrete action step — max 6>],
  "do_not": [<specific thing to avoid — max 5>]
}

Be precise. Cite actual phrases, domains, or patterns you observed. Do not add fields beyond those listed.

CRITICAL: "verdict" MUST be EXACTLY one of the English tokens SCAM, SUSPICIOUS, or LIKELY SAFE, and the "scam_type" and "techniques_used" values MUST be the exact English strings from the lists above — do NOT translate these code values even when the rest of the response is written in another language (only the prose fields like one_liner, red_flags, what_to_do are localized). Keep techniques_used to at most 6. Never place a double-quote (") character inside any JSON string value — paraphrase any cited phrase instead of wrapping it in quote marks; a literal " breaks the JSON.`;

  try {
    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      system: systemPrompt + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'scam-radar' });

    const VALID_VERDICTS = ['SCAM', 'SUSPICIOUS', 'LIKELY SAFE'];
    if (!VALID_VERDICTS.includes(parsed?.verdict) || typeof parsed?.confidence !== 'number') {
      return res.status(500).json({ error: 'Unexpected analysis format. Please try again.' });
    }

    res.json({
      verdict:               parsed.verdict,
      confidence:            parsed.confidence,
      scam_type:             parsed.scam_type ?? null,
      scam_type_description: parsed.scam_type_description ?? null,
      one_liner:             parsed.one_liner ?? '',
      red_flags:             Array.isArray(parsed.red_flags) ? parsed.red_flags : [],
      green_flags:           Array.isArray(parsed.green_flags) ? parsed.green_flags : [],
      techniques_used:       Array.isArray(parsed.techniques_used) ? parsed.techniques_used : [],
      what_to_do:            Array.isArray(parsed.what_to_do) ? parsed.what_to_do : [],
      do_not:                Array.isArray(parsed.do_not) ? parsed.do_not : [],
    });
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: 'Analysis failed. Please try again.' });
    }
  }
});

module.exports = router;
