const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ════════════════════════════════════════════════════════════
// POST /procedure-probe — Procedure Probe
// ════════════════════════════════════════════════════════════
router.post('/procedure-probe', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { procedure, quote, provider, insurance, concerns, urgency, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!procedure?.trim()) {
      return res.status(400).json({ error: 'Tell us what procedure or treatment was recommended.' });
    }

    const systemPrompt = `You are a patient advocate and healthcare literacy coach. When someone has been recommended a medical or dental procedure, you help them understand what they're agreeing to — without replacing their doctor's advice.`;

    const userPrompt = `PROCEDURE/TREATMENT RECOMMENDED: ${procedure}
${quote ? `QUOTED PRICE: ${quote}` : ''}
${provider ? `PROVIDER TYPE: ${provider}` : ''}
${insurance ? `INSURANCE SITUATION: ${insurance}` : ''}
${concerns ? `MY CONCERNS: ${concerns}` : ''}
${urgency ? `URGENCY LEVEL: ${urgency}` : ''}

Help me be an informed patient. Return ONLY valid JSON:
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
    return res.json(parsed);

  } catch (error) {
    console.error('ProcedureProbe error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
