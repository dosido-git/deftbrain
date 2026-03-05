const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

// ════════════════════════════════════════════════════════════
// POST /hobby-match — Discover Your Next Obsession
// ════════════════════════════════════════════════════════════
router.post('/hobby-match', async (req, res) => {
  try {
    const { personality, schedule, budget, physical, triedBefore, lookingFor, userLanguage } = req.body;

    if (!personality?.trim() && !lookingFor?.trim()) {
      return res.status(400).json({ error: 'Tell us about yourself or what you\'re looking for.' });
    }

    const systemPrompt = `You are a hobby matchmaker — part lifestyle coach, part obscure-knowledge encyclopedia, part enthusiast recruiter. Your job: find hobbies people have NEVER considered that genuinely fit their life.

YOUR PHILOSOPHY:
1. GO OBSCURE. Everyone knows about yoga, running, and cooking. Recommend things people DON'T know exist: urban sketching, disc golf, mycology, ham radio, historical fencing, bookbinding, birding by ear, fermentation, letterboxing. The more "I didn't know that was a thing," the better.
2. FIT THE CONSTRAINTS. If they have 30 minutes a week and $0 budget, don't suggest sailing. If they have physical limitations, respect them absolutely. If they work nights, suggest things that work at 2am.
3. SPECIFICITY IS EVERYTHING. Not "try art" — "try gesture drawing at a Dr. Sketchy's Anti-Art School event (they meet at bars and draw burlesque performers — it's fun even if you can't draw)."
4. EXPLAIN THE HOOK. What makes THIS hobby addictive? What's the moment when people go from "this is weird" to "I can't stop"?
5. LOWER THE BARRIER. For each hobby, give the absolute minimum entry point. Not "buy a $500 telescope" but "download the SkyView app tonight and look up."
6. INCLUDE THE COMMUNITY ANGLE. Hobbies stick when they come with people. Where do you find your tribe for this hobby?
7. Mix solo and social options. Mix physical and cerebral. Mix creative and analytical. Show range.
8. If they listed things they've tried before, DO NOT recommend those things or close variants.`;

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

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    return res.json(parsed);

  } catch (error) {
    console.error('HobbyMatch error:', error);
    res.status(500).json({ error: error.message || 'Failed to find hobbies' });
  }
});

module.exports = router;
