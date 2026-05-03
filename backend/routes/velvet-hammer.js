const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');
const { rateLimit } = require('../lib/rateLimiter');

// ════════════════════════════════════════════════════════════
// POST /velvet-hammer — Transform angry drafts into professional messages
// ════════════════════════════════════════════════════════════
router.post('/velvet-hammer', rateLimit(), async (req, res) => {
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

    const systemPrompt = `You are a professional communication coach specializing in transforming emotionally charged messages into effective, professional communication. You help people express legitimate grievances without damaging relationships or their professional reputation.

Your job is to:
1. Identify the core legitimate concern buried in the angry draft
2. Strip away personal attacks, excessive emotion, absolutes ("always", "never"), and inflammatory language
3. Preserve the factual substance and the sender's actual position/needs
4. Rewrite as three professional variants calibrated to tone

TONE VARIANTS:
- Collaborative: Assumes good faith, preserves the relationship, frames as a shared problem to solve. Uses "I" statements and invites dialogue.
- Balanced: Clear about the issue and its impact, sets expectations, neither warm nor cold. Professional and direct.
- Firm: No ambiguity about consequences or requirements. Assertive but never aggressive. Used when previous attempts have failed or when the situation demands clarity.

CALIBRATION RULES:
- If recipient has power over sender: Make all variants more diplomatic, especially Collaborative. Firm should still be professional but slightly softer.
- If sender has leverage: Firm can be quite direct. Collaborative is still warm but confident.
- Goal affects framing: "behavior change" focuses on future expectations; "apology" focuses on impact; "compensation" focuses on resolution; "set_boundary" focuses on what will/won't be tolerated going forward.
- Never soften to the point of obscuring the legitimate complaint.
- Never use passive-aggressive language (that's just disguised hostility).
- Keep messages concise — 3–6 sentences per variant is ideal.`;

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
      "message": "The full rewritten message — 3–5 sentences"
    },
    {
      "tone": "balanced",
      "label": "Balanced",
      "when_to_use": "When you need to be clear without being warm or cold",
      "message": "The full rewritten message — 3–5 sentences"
    },
    {
      "tone": "firm",
      "label": "Firm",
      "when_to_use": "When previous attempts have failed or you need unambiguous clarity",
      "message": "The full rewritten message — 3–5 sentences"
    }
  ]
}`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      messages: [{ role: 'user', content: userPrompt }],
      system: withLanguage(systemPrompt, req.body.userLanguage),
    });

    const raw = response.content[0]?.text || '';
    const data = JSON.parse(cleanJsonResponse(raw));

    if (!data.variants?.length) {
      return res.status(500).json({ error: 'Failed to generate message variants. Please try again.' });
    }

    return res.json(data);

  } catch (err) {
    console.error('velvet-hammer error:', err);
    if (err instanceof SyntaxError) {
      return res.status(500).json({ error: 'Failed to parse response. Please try again.' });
    }
    return res.status(500).json({ error: err.message || 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
