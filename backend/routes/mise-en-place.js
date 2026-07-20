const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ════════════════════════════════════════════
// MAIN ENDPOINT: Build a meal prep plan
// ════════════════════════════════════════════
router.post('/mise-en-place', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const {
      imageBase64,
      ingredients,
      servings,
      dietary,
      timeAvailable,
      skillLevel,
      equipment,
      mealType,
      preferences,
      userLanguage,
    } = req.body;

    if (!ingredients && !imageBase64) {
      return res.status(400).json({ error: 'Tell us what you have — list ingredients or upload a fridge photo' });
    }

    // Vision support for fridge photos
    const contentBlocks = [];

    if (imageBase64) {
      const match = (imageBase64 || '').match(/^data:(image\/[a-z+]+);base64,(.+)$/i);
      // Strict base64 check: a corrupted upload used to reach the API, fail
      // non-retryably, and surface as a hard 500 (audit 2026-07-19).
      const b64 = match ? match[2].replace(/\s+/g, '') : '';
      if (match && /^[A-Za-z0-9+/]+={0,2}$/.test(b64) && b64.length % 4 === 0) {
        contentBlocks.push({
          type: 'image',
          source: { type: 'base64', media_type: match[1], data: b64 },
        });
      } else if (imageBase64) {
        return res.status(400).json({ error: "That image didn't upload correctly — try re-uploading it." });
      }
    }

    const dietaryText = Array.isArray(dietary) && dietary.length > 0 ? dietary.join(', ') : 'No restrictions';
    const equipText = Array.isArray(equipment) && equipment.length > 0 ? equipment.join(', ') : 'Standard kitchen';

    const basePrompt = `You are a professional meal prep strategist and home cook coach. Your job is NOT to give recipes — it's to build a realistic, sequenced BATTLE PLAN for getting food on the table efficiently.

${imageBase64 ? 'Look at this photo of their fridge/pantry and identify available ingredients.' : ''}

AVAILABLE INGREDIENTS: ${ingredients || 'See photo above'}
SERVINGS: ${servings || '2-4'}
DIETARY NEEDS: ${dietaryText}
TIME AVAILABLE: ${timeAvailable || '60 minutes'}
SKILL LEVEL: ${skillLevel || 'intermediate'}
EQUIPMENT: ${equipText}
MEAL TYPE: ${mealType || 'dinner'}
PREFERENCES: ${preferences || 'None specified'}

PLANNING INSTRUCTIONS:

1. INGREDIENT AUDIT: What can they make with what they have? What's missing that would open up more options? (Keep "shopping list" to 3-5 items max — the point is using what's on hand.)

2. MEAL RECOMMENDATIONS: Suggest 1-3 meals that work with these ingredients. For each, explain WHY this combination works (flavor profiles, nutrition balance, effort-to-reward ratio).

3. PREP BATTLE PLAN: The star of the show. A minute-by-minute timeline that sequences everything optimally:
   - What to start first (things that take longest)
   - What to prep during downtime (while something roasts, boils, etc.)
   - Parallel tasks (what can happen simultaneously)
   - Critical timing windows (when you MUST check/flip/remove something)

4. TECHNIQUE TIPS: Based on their skill level, include 2-3 specific technique tips that will make the biggest difference in the result.

5. LEFTOVERS STRATEGY: How to transform leftovers into a different meal tomorrow (not just reheating).

OUTPUT FORMAT — CONSISTENT NUMBERS: any per-item timing claim (e.g. 'chicken takes 12-14 minutes') must agree with the phase timeline you output — recompute before stating.

Return ONLY valid JSON:
{
  "detected_ingredients": ["list of ingredients identified from photo or input"],

  "shopping_list": {
    "essential": ["1-3 items that would significantly improve what they can make"],
    "nice_to_have": ["1-2 items that would be a bonus"]
  },

  "meals": [
    {
      "name": "Name of the dish",
      "description": "1-2 sentence description",
      "why_this_works": "Why this combination is a good call",
      "difficulty": "easy | medium | hard",
      "total_time": "total time as a short label, e.g. 35 min",
      "flavor_tags": ["savory", "umami", "bright", "comfort", etc.]
    }
  ],

  "selected_meal": {
    "name": "The recommended meal to make right now",
    "reason": "Why this one first"
  },

  "battle_plan": {
    "total_time": "total time from start to plate, as a short label",
    "phases": [
      {
        "time_mark": "0:00",
        "duration": "5 min",
        "action": "what to do",
        "details": "specific instructions",
        "parallel_task": "what else to do during this time, or null",
        "critical_timing": false
      }
    ],
    "checkpoints": [
      {
        "at": "15:00",
        "check": "what to look for (e.g., 'onions should be translucent')",
        "if_not_ready": "what to do if it's not there yet"
      }
    ]
  },

  "technique_tips": [
    {
      "tip": "the technique",
      "why": "why it matters for this specific meal",
      "skill_level": "beginner | intermediate | advanced"
    }
  ],

  "leftovers_strategy": {
    "storage": "how to store what's left",
    "transform_into": "what to make with leftovers tomorrow",
    "instructions": "brief instructions for the transformation"
  },

  "scaling_notes": "How to easily scale this up or down"
}

IMPORTANT RULES:
- Keep every field concise — a phrase or single short sentence as the schema implies; no meta-notes or length annotations.
- The battle_plan is the most important section. Make it detailed, practical, and sequenced like a real chef would think.
- phases should have 6-12 entries depending on complexity (at most 12). Include EVERY meaningful step but keep each phase to one sentence.
- critical_timing = true for any step where timing matters (don't overcook, must add at right moment, etc.)
- parallel_task is what makes this valuable — always look for downtime that can be used productively.
- Be realistic about the time_available they specified. If they said 30 minutes, don't suggest a 90-minute recipe.
- Adapt language to skill_level: beginners need more detail ("dice means cut into 1/4 inch cubes"), advanced can handle shorthand.
- If the ingredients are sparse, be creative but honest: "This is a stretch, but..."

Return ONLY the JSON object. No markdown fences, no preamble.`;

    contentBlocks.push({ type: 'text', text: withLanguage(basePrompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion) });

    const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 5500,
      messages: [{ role: 'user', content: contentBlocks }],
    }, { label: 'mise-en-place' });
    if (!parsed.detected_ingredients) {
      return res.status(500).json({ error: 'Could not generate a response. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('Mise en Place error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

module.exports = router;
