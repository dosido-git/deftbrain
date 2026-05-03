const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');
const { rateLimit } = require('../lib/rateLimiter');

const PERSONALITY = `You are a professional comedy roast writer — sharp, observant, and genuinely funny. You find the SPECIFIC funny thing about someone's content, not generic insults. Your roasts land because they're true, not because they're mean. Think Comedy Central Roast meets a friend who knows you too well.

RULES:
- NEVER be cruel, bigoted, or target things people can't change (appearance, disability, identity)
- DO target: choices, phrasing, humblebrags, clichés, contradictions, try-hard energy, obliviousness
- Be SPECIFIC to the actual content — "your LinkedIn says 'passionate about synergy' and that's the saddest four words in the English language" not "you're dumb"
- Each roast should make the person laugh AND wince because it's accurate
- Gentle = playful teasing a friend would say. Medium = Comedy Central energy. Scorched = no mercy but still funny, never hateful`;

// ════════════════════════════════════════════════════════════
// POST /roast-me — Generate personalized roast
// ════════════════════════════════════════════════════════════
router.post('/roast-me', rateLimit(), async (req, res) => {
  try {
    const { content, contentType, heatLevel, userLanguage } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ error: 'Give me something to roast!' });
    }

    const heatMap = {
      gentle: 'GENTLE — Playful teasing. Like a friend who loves you but can\'t help themselves.',
      medium: 'MEDIUM — Comedy Central energy. Sharp observations, pointed humor. The sweet spot.',
      scorched: 'SCORCHED EARTH — Full roast. Nothing is safe. But still FUNNY, not hateful.'
    };

    const typeHints = {
      resume: 'This is a resume/CV. Target: buzzwords, inflated titles, skills that contradict each other, the desperate energy of listing "Microsoft Office" as a skill.',
      dating: 'This is a dating profile. Target: clichés ("I love to laugh"), contradictions ("laid-back" but lists 47 requirements), the gap between who they think they are and who the profile reveals.',
      linkedin: 'This is a LinkedIn bio/post. Target: corporate jargon, humblebrags, "thought leadership" that\'s just common sense, "I\'m humbled to announce" energy.',
      email: 'This is an email or message. Target: passive-aggression they think is hidden, unnecessary formality, the subtext they don\'t realize they\'re broadcasting.',
      social: 'This is a social media post/bio. Target: the curated persona vs. reality, hashtag abuse, the specific brand of delusion on display.',
      other: 'Analyze what this is and find what\'s roastable. Look for contradictions, pretension, clichés, and the gap between intention and reality.'
    };

    const userPrompt = `ROAST THIS CONTENT:

"""
${content.trim().slice(0, 3000)}
"""

CONTENT TYPE: ${contentType || 'unknown'}
${typeHints[contentType] || typeHints.other}

HEAT LEVEL: ${heatMap[heatLevel] || heatMap.medium}

Return ONLY valid JSON:

{
  "content_type_detected": "What this actually is (e.g., 'LinkedIn post', 'Bumble profile')",
  "first_impression": "Your brutally honest first reaction in one sentence.",
  "roasts": [
    {
      "line": "The roast line — punchy, specific, quotable",
      "target": "What specific thing you're roasting",
      "why_it_hurts": "The truth underneath the joke"
    }
  ],
  "summary_roast": "2-3 sentence closing roast. The mic-drop moment.",
  "one_nice_thing": "One genuinely nice observation — makes the roast funnier by contrast",
  "share_line": "The single most quotable line — the one they'll screenshot"
}

Generate 5-8 roast lines (gentle=5, medium=6, scorched=8). Every line must reference SPECIFIC content — zero generic insults.`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system: withLanguage(PERSONALITY, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('RoastMe error:', error);
    res.status(500).json({ error: error.message || 'Roast failed' });
  }
});

module.exports = router;
