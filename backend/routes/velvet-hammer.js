const express = require('express');
const router = express.Router();
const { withLanguage, callClaudeWithRetry } = require('../lib/claude');
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
  "rage_audit": "1–2 sentences identifying the legitimate concern(s) beneath the emotional language — one sentence",
  "variants": [
    {
      "tone": "collaborative — one sentence",
      "label": "Collaborative — one sentence",
      "when_to_use": "When you want to preserve the relationship and assume good intent — one sentence",
      "message": "The full rewritten message — 3–5 sentences — 2-4 sentences"
    },
    {
      "tone": "balanced — one sentence",
      "label": "Balanced — one sentence",
      "when_to_use": "When you need to be clear without being warm or cold — one sentence",
      "message": "The full rewritten message — 3–5 sentences — 2-4 sentences"
    },
    {
      "tone": "firm",
      "label": "Firm",
      "when_to_use": "When previous attempts have failed or you need unambiguous clarity — one sentence",
      "message": "The full rewritten message — 3–5 sentences — 2-4 sentences"
    }
  ]
}`;

    const data = await callClaudeWithRetry({
model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{ role: 'user', content: userPrompt }],
      system: withLanguage(systemPrompt, req.body.userLanguage),
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
