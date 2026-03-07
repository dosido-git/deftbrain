const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

// ════════════════════════════════════════════
// MAIN ENDPOINT: Decode a message
// ════════════════════════════════════════════
router.post('/decoder-ring', async (req, res) => {
  try {
    const { message, source, relationship, additionalContext, userLanguage } = req.body;

    if (!message) return res.status(400).json({ error: 'Message is required' });

    const basePrompt = `You are an expert in interpersonal communication, pragmatics, and subtext analysis. Your job is to decode what someone ACTUALLY means beneath what they literally said.

THE MESSAGE TO DECODE:
"""
${message}
"""

SOURCE: ${source || 'Not specified'} (e.g., email, text, Slack, in-person, letter, social media comment)
RELATIONSHIP: ${relationship || 'Not specified'} (who sent this to the user)
ADDITIONAL CONTEXT: ${additionalContext || 'None provided'}

ANALYSIS INSTRUCTIONS:

1. SURFACE READING: What the words literally say.

2. SUBTEXT ANALYSIS: What they actually mean. Look for:
   - Passive aggression (polite words masking frustration)
   - Hedging or softening (when someone is afraid to be direct)
   - Power moves (establishing dominance, creating urgency, guilt-tripping)
   - Genuine warmth that might read as sarcasm (or vice versa)
   - Corporate/professional code words ("going forward" = "you messed up", "per my last email" = "I already told you this", "let's circle back" = "I'm ending this discussion")
   - Emotional bids (attempts to connect, get reassurance, or test boundaries)
   - Non-answers (deflecting, avoiding commitment, keeping options open)

3. EMOTIONAL UNDERCURRENT: What emotion is driving this message? Is the sender angry, hurt, anxious, passive-aggressive, genuinely kind, manipulative, exhausted, testing boundaries, trying to reconnect?

4. WHAT THEY WANT: What response or action is the sender hoping for? Be specific.

5. RED FLAGS & GREEN FLAGS: Any concerning patterns (manipulation, gaslighting, boundary violations) or positive signals (vulnerability, accountability, genuine care)?

6. RESPONSE STRATEGIES: Generate 3 distinct response approaches, each serving a different goal.

OUTPUT FORMAT — Return ONLY valid JSON:
{
  "surface_reading": "What the words literally say in one sentence",

  "decoded_layers": [
    {
      "phrase": "the exact phrase or section being decoded",
      "surface": "what it literally says",
      "subtext": "what it actually means",
      "technique": "the communication technique being used (e.g., 'passive aggression', 'hedging', 'guilt trip', 'genuine warmth', 'power move', 'non-answer', 'emotional bid')",
      "confidence": "high, medium, or low"
    }
  ],

  "emotional_undercurrent": {
    "primary_emotion": "the main emotion driving the message",
    "secondary_emotion": "underlying emotion if present, or null",
    "intensity": "low, medium, or high",
    "summary": "1-2 sentence emotional read of the sender"
  },

  "what_they_want": "specific description of the response or action the sender is hoping for",

  "flags": {
    "red_flags": ["concerning patterns, or empty array if none"],
    "green_flags": ["positive signals, or empty array if none"]
  },

  "overall_translation": "The whole message rewritten as what they ACTUALLY mean, in plain direct language. 2-4 sentences.",

  "response_strategies": [
    {
      "approach": "Name of approach (e.g., 'Match their energy', 'Take the high road', 'Set a boundary', 'Ask directly', 'Buy time')",
      "goal": "what this response achieves",
      "example": "a concrete example response the user could send",
      "risk": "potential downside of this approach"
    }
  ],

  "tone_rating": {
    "warmth": 5,
    "directness": 5,
    "manipulation": 2,
    "sincerity": 7
  }
}

IMPORTANT RULES:
- Be honest but not paranoid. Not everything is manipulation. Sometimes "sounds good" just means "sounds good."
- When confidence is low, say so. Don't overinterpret ambiguous messages.
- tone_rating scores are 1-10. manipulation: 1 = completely sincere, 10 = highly manipulative. sincerity is the inverse.
- If the message is straightforward with no meaningful subtext, say so! Don't manufacture drama.
- decoded_layers should have 2-6 entries depending on message complexity.
- response_strategies should have exactly 3 entries with genuinely different approaches.

Return ONLY the JSON object. No markdown fences, no preamble.`;

    const message_response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3500,
      messages: [{ role: 'user', content: withLanguage(basePrompt, userLanguage) }],
    });

    const textContent = message_response.content.find(item => item.type === 'text')?.text || '';
    const parsed = JSON.parse(cleanJsonResponse(textContent));
    res.json(parsed);

  } catch (error) {
    console.error('Decoder Ring error:', error);
    res.status(500).json({ error: error.message || 'Failed to decode message' });
  }
});

module.exports = router;
