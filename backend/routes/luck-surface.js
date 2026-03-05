const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

const PERSONALITY = `You are a luck architect — a specialist in the science of serendipity. You understand that luck isn't random: it's the product of surface area, signal strength, and diversity of exposure.

"Luck surface area" is a real concept: the more people who know what you're working on, the more places you show up, the more diverse your inputs, the more likely you are to collide with exactly the right opportunity, person, or idea at the right time.

YOUR ANALYSIS METHOD:
- Audit current patterns: where do they go, who do they know, what do they create, what do they signal
- Calculate the invisible constraints: what's keeping their world small without them knowing it
- Design specific, weird, actionable moves — not "network more" but the precise lever
- The best moves are asymmetric: low effort, high exposure, high serendipity potential
- Think in terms of: rooms entered, signals broadcast, diversity of inputs, weak tie cultivation

RULES:
- Be specific. "Go to more events" is useless. "Show up to the next [X] in your city and introduce yourself to the person standing alone" is actionable.
- The percentage is a device to make the concept concrete, not a real calculation
- Five moves, each genuinely different in mechanism`;

router.post('/luck-surface', async (req, res) => {
  try {
    const { description, goals, currentExposures, userLanguage } = req.body;
    if (!description?.trim()) return res.status(400).json({ error: 'Describe your life and current patterns.' });

    const userPrompt = `LUCK SURFACE ANALYSIS

THEIR LIFE / CURRENT PATTERNS:
"${description.trim()}"
${goals?.trim() ? `\nWHAT KIND OF LUCK THEY WANT MORE OF: ${goals.trim()}` : ''}
${currentExposures?.trim() ? `\nCURRENT EXPOSURES / THINGS THEY ALREADY DO: ${currentExposures.trim()}` : ''}

Calculate their luck surface area. Design 5 moves to expand it dramatically.

Return ONLY valid JSON:
{
  "audit": {
    "current_surface_area": "A percentage — dramatic and specific, e.g. '14%'",
    "the_diagnosis": "2-3 sentences on why their luck surface area is what it is — the specific patterns producing the constraint",
    "the_invisible_wall": "The single biggest structural reason they're not encountering more luck — named precisely",
    "what_theyre_good_at": "What they're already doing that IS expanding their luck surface (genuine credit)"
  },

  "the_five_moves": [
    {
      "move_number": 1,
      "title": "Short memorable title",
      "mechanism": "broadcast | infiltrate | create | curate | compound",
      "mechanism_label": "Broadcast a signal | Infiltrate a new room | Create a serendipity artifact | Curate a high-value connection | Compound an existing asset",
      "the_move": "The specific, weird, actionable thing to do — concrete enough to execute this week",
      "why_asymmetric": "Why this move produces disproportionate luck relative to the effort it requires",
      "luck_multiplier": "The specific type of luck this move is most likely to generate",
      "time_to_first_result": "How long before they'd expect the first serendipitous collision from this"
    }
  ],

  "the_target": {
    "new_surface_area": "The percentage after implementing the five moves, e.g. '43%'",
    "what_becomes_possible": "Specifically what becomes possible at this new surface area that isn't possible now",
    "the_compound_effect": "How these five moves interact and amplify each other"
  },

  "the_one_to_start": "Of the five moves, the one to do first — and the exact first step to take today"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2200,
      system: withLanguage(PERSONALITY, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('LuckSurface error:', error);
    res.status(500).json({ error: error.message || 'Failed to calculate luck surface' });
  }
});

module.exports = router;
