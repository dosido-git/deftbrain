const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

const PERSONALITY = `You are that friend who always gets the upgrade, the fee waived, the free dessert, the exception to the rule. You're not a scammer — you're just extraordinarily good at asking. You understand that most "no" answers are actually "nobody asked the right way" answers.

You know that the secret isn't manipulation. It's empathy + angle + timing + delivery. You read the situation, find the opening, and give people a reason to say yes that makes THEM feel good about it.

RULES:
- Always find a legitimate angle — not lies, not threats, just the right framing
- Read the power dynamics: who has authority, what's their incentive, what makes saying yes easy for them
- Include the human element: name use, timing, tone, body language cues
- Be specific to the situation — not generic "be polite" advice
- Acknowledge when the odds are low but still give the best shot
- Never suggest dishonesty. Charm, not fraud.
- The script should sound natural, not rehearsed. Real humans don't talk in corporate speak.
- Include what NOT to say — the common mistakes that kill the ask`;

// ─── MAIN: Analyze the ask and build the approach ───
router.post('/magic-mouth', async (req, res) => {
  try {
    const { whatYouWant, situation, whoYoureAsking, triedAlready, userLanguage } = req.body;

    if (!whatYouWant?.trim()) {
      return res.status(400).json({ error: 'Tell me what you want to get.' });
    }

    const userPrompt = `MAGIC MOUTH — THE ART OF THE ASK

WHAT THEY WANT: "${whatYouWant.trim()}"
THE SITUATION: "${situation?.trim() || 'No additional context provided'}"
${whoYoureAsking?.trim() ? `WHO THEY'RE ASKING: "${whoYoureAsking.trim()}"` : ''}
${triedAlready?.trim() ? `ALREADY TRIED: "${triedAlready.trim()}"` : ''}

Analyze this situation. Find the best angle. Write the script. Coach the delivery.

Return ONLY valid JSON:

{
  "situation_read": "2-3 sentences — your honest read on the situation. What are the odds? What's working for them? What's working against them?",
  "difficulty": "easy | moderate | hard | long_shot",
  "best_angle": {
    "name": "Short name for the strategy (e.g., 'The Loyalty Play', 'The Friendly Escalation', 'The Reasonable Exception')",
    "why_this_works": "1-2 sentences — why this specific angle is the best shot in this specific situation",
    "who_to_ask": "The right person to approach and why — not always the first person you see",
    "when_to_ask": "Timing advice — best time of day, day of week, or moment in the interaction"
  },
  "the_script": {
    "opener": "The exact opening line — warm, natural, sets the right tone. Include name use if applicable.",
    "the_ask": "The core request — framed using the best angle. 2-4 sentences, conversational, specific.",
    "if_they_hesitate": "What to say if they pause or seem unsure — the gentle nudge that makes yes easier.",
    "graceful_exit": "What to say if the answer is genuinely no — leave the door open and your dignity intact."
  },
  "delivery_notes": {
    "tone": "How to sound — specific coaching beyond 'be polite'",
    "body_language": "Physical presence cues — posture, eye contact, hands, smile",
    "dont_do_this": "The 1-2 most common mistakes people make in this exact situation that kill the ask"
  },
  "backup_angle": {
    "name": "If the first angle fails, try this one",
    "pivot_line": "The exact transition sentence to shift strategies mid-conversation"
  },
  "pro_tip": "One insider insight that most people don't know about this type of ask — a hack, a policy loophole, or a human nature shortcut"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      system: withLanguage(PERSONALITY, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('MagicMouth error:', error);
    res.status(500).json({ error: error.message || 'Failed to find your angle' });
  }
});

module.exports = router;
