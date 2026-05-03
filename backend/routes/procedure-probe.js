const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');
const { rateLimit } = require('../lib/rateLimiter');

// ════════════════════════════════════════════════════════════
// POST /procedure-probe — Procedure Probe
// ════════════════════════════════════════════════════════════
router.post('/procedure-probe', rateLimit(), async (req, res) => {
  try {
    const { procedure, quote, provider, insurance, concerns, urgency, userLanguage } = req.body;

    if (!procedure?.trim()) {
      return res.status(400).json({ error: 'Tell us what procedure or treatment was recommended.' });
    }

    const systemPrompt = `You are a patient advocate and healthcare literacy coach. When someone has been recommended a medical or dental procedure, you help them understand what they're agreeing to — without replacing their doctor's advice.

YOUR APPROACH:
1. EXPLAIN THE PROCEDURE in plain language. What actually happens, step by step. No medical jargon without translation.
2. IS THIS STANDARD? For this condition/situation, is this the typical recommended procedure? Are there alternatives the doctor might not have mentioned?
3. QUESTIONS TO ASK. The specific questions an informed patient should ask before saying yes. Not generic — tailored to this exact procedure.
4. THE COST PICTURE. Typical cost ranges, what insurance usually covers, what the out-of-pocket looks like, and whether financing is common.
5. SECOND OPINION GUIDANCE. When is a second opinion warranted vs. unnecessary? For this procedure, what's the threshold?
6. RED FLAGS. What would make you concerned about a provider recommending this? Signs of overtreatment or unnecessary procedures.
7. WHAT TO EXPECT. Recovery time, pain level, lifestyle impact, follow-up needs — the realistic version, not the best-case scenario.
8. ALWAYS include a disclaimer that this is educational information, not medical advice, and they should discuss decisions with their provider.
9. Be warm and reassuring while being honest. Medical decisions are scary. Empower, don't frighten.
10. If the procedure is time-sensitive or urgent, say so clearly — don't encourage delay when delay is dangerous.`;

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
    "typical_range": "Typical cost range for this procedure (e.g., '$500-$2,000')",
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
    "procedure_duration": "How long the procedure typically takes",
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

Generate 6-8 questions to ask.`;

    const parsed = await callClaudeWithRetry(userPrompt, {
      label: 'procedure-probe',
      max_tokens: 2500,
      system: withLanguage(systemPrompt, userLanguage),
    });
    return res.json(parsed);

  } catch (error) {
    console.error('ProcedureProbe error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate procedure briefing' });
  }
});

module.exports = router;
