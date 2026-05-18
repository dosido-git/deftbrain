const express = require('express');
const router = express.Router();
const { cleanJsonResponse, withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ════════════════════════════════════════════════════════════
// POST /hobby-match — Discover Your Next Obsession
// ════════════════════════════════════════════════════════════
router.post('/hobby-match', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { personality, schedule, budget, physical, triedBefore, lookingFor, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!personality?.trim() && !lookingFor?.trim()) {
      return res.status(400).json({ error: 'Tell us about yourself or what you\'re looking for.' });
    }

    const systemPrompt = `Hobby matchmaker with encyclopedic knowledge of activities across every category. Connect people's personality, lifestyle, and values to hobbies they'll actually stick with.

Be specific and honest: match energy levels, time requirements, startup costs, and social preferences. Recommend the surprising pick that fits better than the obvious one. Include where to start and how to find their community.`;

    const userPrompt = `ABOUT ME: ${personality || 'not specified'}
SCHEDULE: ${schedule || 'not specified'}
BUDGET: ${budget || 'flexible'}
PHYSICAL CONSIDERATIONS: ${physical || 'none specified'}
${triedBefore ? `THINGS I'VE ALREADY TRIED: ${triedBefore}` : ''}
${lookingFor ? `WHAT I'M LOOKING FOR: ${lookingFor}` : ''}

Find me hobbies I've never considered. Return ONLY valid JSON:
{
  "profile_read": "1-2 sentences showing you understand what kind of person they are and what's missing in their life.",

  "hobbies": [
    {
      "name": "The hobby name — specific, not vague",
      "icon": "One relevant emoji",
      "one_liner": "One sentence that makes this sound irresistible.",
      "what_it_is": "2-3 sentences explaining what this actually involves. Be specific — paint a picture of a typical session.",
      "the_hook": "What makes people obsessed with this? The moment it clicks.",
      "why_you": "Why this fits THIS specific person based on what they told you.",
      "time_required": "Realistic time commitment per session and per week",
      "startup_cost": "Real startup cost: free, under $50, under $200, etc.",
      "first_step": "The absolute lowest-barrier first step they can take TODAY. Be specific: an app to download, a YouTube channel to watch, a location to visit.",
      "find_your_people": "Where to find community: subreddits, local groups, apps, events.",
      "energy_type": "solo | social | both",
      "physical_level": "sedentary | light | moderate | active"
    }
  ],

  "wildcard": {
    "name": "One completely unexpected suggestion that doesn't fit their stated preferences at all — but might surprise them. The 'you'd never guess but...' pick.",
    "why": "One sentence on why this might work despite seeming like a mismatch."
  },

  "pattern_noticed": "One observation about what ties their interests together — the underlying thing they might not see about themselves."
}

Generate 5-6 hobby recommendations. At least 2 should be things most people have never heard of.`;

    const parsed = await callClaudeWithRetry({
model: 'claude-haiku-4-5-20251001',
      max_tokens: 3000,
      system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'hobby-match' });
    return res.json(parsed);

  } catch (error) {
    console.error('HobbyMatch error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

module.exports = router;
