const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

// ════════════════════════════════════════════════════════════
// POST /context-collapse — How Will Different People Read This?
// ════════════════════════════════════════════════════════════
router.post('/context-collapse', async (req, res) => {
  try {
    const {
      message,         // The message they're about to send/post
      platform,        // 'text', 'email', 'social_media', 'group_chat', 'slack', 'public_post', 'announcement', 'other'
      audiences,       // Array of { label, relationship, context } — who will see this
      intent,          // What they're TRYING to communicate
      concerns,        // Optional: what they're worried about
      userLanguage,
    } = req.body;

    if (!message?.trim()) {
      return res.status(400).json({ error: 'Paste the message you\'re about to send' });
    }
    if (!audiences?.length || !audiences.some(a => a.label?.trim())) {
      return res.status(400).json({ error: 'Add at least one audience — who will see this?' });
    }

    const validAudiences = audiences.filter(a => a.label?.trim());

    const systemPrompt = `You are a communication analyst specializing in "context collapse" — the phenomenon where a single message is interpreted completely differently by different audiences.

You help people preview how their message will land BEFORE they send it. You think like a therapist (understanding emotional subtext), a PR strategist (understanding public perception), and a linguist (understanding how words carry different weight in different relationships).

KEY PRINCIPLES:
1. Be specific and vivid about HOW each audience reads the message — not vague. "Your boss reads this as..." not "some people might think..."
2. Identify the EMOTIONAL interpretation, not just the literal one. The same sentence can feel supportive to one person and passive-aggressive to another.
3. Pay attention to: tone markers (!, ..., capitalization, emoji), implicit assumptions, what's NOT said, and cultural/generational differences in communication style.
4. The gap between intent and interpretation is where problems happen. Make this gap visible.
5. When suggesting rewrites, preserve their voice — don't make them sound like a corporate PR department.
6. Be honest about risks. If a message is genuinely problematic for an audience, say so clearly.`;

    const audienceList = validAudiences.map((a, i) =>
      `Audience ${i + 1}: "${a.label}"${a.relationship ? ` (relationship: ${a.relationship})` : ''}${a.context ? ` — context: ${a.context}` : ''}`
    ).join('\n');

    const userPrompt = `MESSAGE THEY'RE ABOUT TO SEND:
"${message}"

PLATFORM: ${platform || 'not specified'}
${intent ? `THEIR INTENT: ${intent}` : ''}
${concerns ? `THEIR CONCERN: ${concerns}` : ''}

AUDIENCES WHO WILL SEE THIS:
${audienceList}

Analyze how each audience will interpret this. Return ONLY valid JSON:

{
  "message_analysis": {
    "tone_detected": "What tone does this message actually convey? Be specific — not just 'friendly' but 'casually assertive with an undercurrent of frustration'",
    "subtext": "What does this message communicate between the lines that the sender might not realize?",
    "ambiguous_elements": ["Specific words, phrases, or stylistic choices that different audiences will read differently"]
  },

  "readings": [
    {
      "audience": "Audience label",
      "reads_as": "How this audience interprets the message — be vivid and specific. Write as: 'They read this as...' or 'To them, this says...'",
      "emotional_impact": "How this makes them FEEL — not just what they think",
      "risk_level": "safe | mild_risk | risky | dangerous",
      "key_trigger": "The specific word, phrase, or absence that drives their interpretation",
      "what_they_might_do": "How they might respond or react"
    }
  ],

  "intent_vs_reality": {
    "intended": "${intent || 'Not explicitly stated — infer from message tone'}",
    "gap_analysis": "Where does the intended message diverge from how it actually reads? Be specific.",
    "biggest_risk": "The single most problematic interpretation across all audiences"
  },

  "verdict": {
    "safe_to_send": true or false,
    "verdict_label": "SEND AS IS | MINOR TWEAKS | REWRITE NEEDED | DON'T SEND",
    "summary": "1-2 sentences: overall assessment"
  },

  "rewrites": [
    {
      "label": "What this rewrite optimizes for (e.g., 'Safer for boss, same vibe for friends')",
      "message": "The rewritten message — preserve their voice, fix the gaps",
      "tradeoff": "What you gain and what you lose with this version"
    }
  ],

  "platform_note": "Any platform-specific considerations — group chat dynamics, social media permanence, email forwarding risk, screenshot risk. null if not relevant.",

  "nuclear_scenarios": [
    {
      "scenario": "The worst-case interpretation someone could have",
      "likelihood": "unlikely | possible | likely",
      "mitigation": "How to prevent this reading or recover if it happens"
    }
  ]
}

Generate 1-2 rewrites that meaningfully improve the message for the most at-risk audiences while preserving the sender's intent and voice.`;

    const message_resp = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 3500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message_resp.content.find(b => b.type === 'text')?.text || '';
    const parsed = JSON.parse(cleanJsonResponse(text));
    res.json(parsed);

  } catch (error) {
    console.error('Context Collapse error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze message' });
  }
});

module.exports = router;
