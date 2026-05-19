const express = require('express');
const router = express.Router();
const { cleanJsonResponse, withLanguage, callClaudeWithRetry } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const PERSONALITY = `Comedy roast writer — sharp, specific, genuinely funny. Find THE specific funny thing about the content, not generic insults. Roasts land because they're accurate, not cruel.

RULES: Never target appearance, disability, or identity. DO target choices, phrasing, humblebrags, clichés, contradictions, try-hard energy. Be SPECIFIC — "your LinkedIn says 'passionate about synergy'" not "you're clueless". Gentle = friendly tease. Medium = Comedy Central. Scorched = no mercy, still funny, never hateful.`;

// ════════════════════════════════════════════════════════════
// POST /roast-me — Generate personalized roast
// ════════════════════════════════════════════════════════════
router.post('/roast-me', rateLimit(DEFAULT_LIMITS), async (req, res) => {
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
  "content_type_detected": "What this actually is (e.g., 'LinkedIn post', 'Bumble profile') — one sentence",
  "first_impression": "Your brutally honest first reaction in one sentence.",
  "roasts": [
    {
      "line": "The roast line — punchy, specific, quotable — one sentence",
      "target": "What specific thing you're roasting — one sentence",
      "why_it_hurts": "The truth underneath the joke — one sentence"
    }
  ],
  "summary_roast": "2-3 sentence closing roast. The mic-drop moment.",
  "one_nice_thing": "One genuinely nice observation — makes the roast funnier by contrast — one sentence",
  "share_line": "The single most quotable line — the one they'll screenshot — one sentence"
}

Generate 5-8 roast lines (gentle=5, medium=6, scorched=8). Every line must reference SPECIFIC content — zero generic insults.`;

    const parsed = await callClaudeWithRetry({
model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      system: withLanguage(PERSONALITY, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'roast-me' });
    if (!Array.isArray(parsed.roasts) || !parsed.roasts.length) {
      return res.status(500).json({ error: 'Could not generate the roast. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('RoastMe error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

module.exports = router;
