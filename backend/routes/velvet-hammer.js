const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ════════════════════════════════════════════════════════════
// POST /velvet-hammer — Transform angry drafts into professional messages
// ════════════════════════════════════════════════════════════
router.post('/velvet-hammer', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { draft, relationship, goal, power } = req.body;

    if (!draft?.trim()) {
      return res.status(400).json({ error: 'Paste what you want to say — don\'t hold back.' });
    }

    const relationshipMap = {
      boss: 'their boss/manager',
      colleague: 'a colleague',
      direct_report: 'someone who reports to them',
      client: 'a client',
      vendor: 'a vendor/supplier',
      landlord: 'their landlord',
      neighbor: 'a neighbor',
      family: 'a family member',
      friend: 'a friend',
      other: 'someone',
    };

    const goalMap = {
      behavior_change: 'get them to change a specific behavior',
      apology: 'receive an apology',
      compensation: 'get a fix, refund, or compensation',
      set_boundary: 'set a clear boundary',
      clarify: 'clarify expectations going forward',
      escalate: 'formally escalate the issue',
    };

    const powerMap = {
      i_have_leverage: 'The sender has leverage in this relationship (the recipient needs them more, or they have the power here).',
      neutral: 'Both parties are roughly equal in this relationship.',
      they_have_power: 'The recipient has power over the sender (boss, landlord, client, etc.) — the message must be more careful and diplomatic.',
    };

    const systemPrompt = `Professional communication coach. Transform emotionally charged messages into something that lands — honest and direct, but not nuclear.

Preserve the legitimate grievance while removing the fuel. Give 3 versions across a spectrum (gentle → firm → direct). Include delivery notes: timing, channel, what to say vs send. The goal is to be heard, not just to vent.`;

    const userPrompt = `SENDER'S RAW DRAFT:
"${draft.trim()}"

CONTEXT:
- Recipient is: ${relationshipMap[relationship] || 'someone'}
- Sender's goal: ${goalMap[goal] || 'address the situation'}
- Power dynamic: ${powerMap[power] || 'Both are roughly equal.'}

First, briefly audit the rage: what are the legitimate grievances beneath the anger? Then produce three professional rewrites.

Return ONLY valid JSON:
{
  "rage_audit": "1–2 sentences identifying the legitimate concern(s) beneath the emotional language",
  "variants": [
    {
      "tone": "collaborative",
      "label": "Collaborative",
      "when_to_use": "When you want to preserve the relationship and assume good intent",
      "message": "The full rewritten message in this tone"
    },
    {
      "tone": "balanced",
      "label": "Balanced",
      "when_to_use": "When you need to be clear without being warm or cold",
      "message": "The full rewritten message in this tone"
    },
    {
      "tone": "firm",
      "label": "Firm",
      "when_to_use": "When previous attempts have failed or you need unambiguous clarity",
      "message": "The full rewritten message in this tone"
    }
  ]
}

RULES:
1. Return EXACTLY 3 variants in this order: collaborative, balanced, firm.
2. "tone" MUST be exactly one of these English lowercase codes — collaborative, balanced, firm — regardless of the output language. Do NOT translate the tone value. (Translate "label", "when_to_use", "message", and "rage_audit" into the output language; keep "tone" as the English code.)
3. Each "message" is 3–5 sentences. Keep "rage_audit", "label", and "when_to_use" to one tight phrase or sentence.
4. Never place a double-quote (") character inside any JSON string value — write the messages plainly with no inner quote marks, or it breaks the JSON.`;

    const data = await callClaudeWithRetry({
model: MODELS.SMART,
      max_tokens: 4000,
      messages: [{ role: 'user', content: userPrompt }],
      system: withLanguage(systemPrompt, req.body.userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
    }, { label: 'velvet-hammer' });

    if (!data.variants?.length) {
      return res.status(500).json({ error: 'Failed to generate message variants. Please try again.' });
    }

    return res.json(data);

  } catch (err) {
    console.error('velvet-hammer error:', err);
    if (err instanceof SyntaxError) {
      return res.status(500).json({ error: 'Failed to parse response. Please try again.' });
    }
    return res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

module.exports = router;
