const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

// Helper: parse base64 data URL
function parseBase64Image(dataUrl) {
  if (!dataUrl || typeof dataUrl !== 'string') return null;
  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex === -1) return { base64Data: dataUrl, mediaType: 'image/jpeg' };
  const base64Data = dataUrl.substring(commaIndex + 1);
  const mimeMatch = dataUrl.substring(0, commaIndex).match(/data:(image\/[a-zA-Z0-9.+-]+);base64/);
  const mediaType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  return { base64Data, mediaType };
}

router.post('/fridge-alchemy', async (req, res) => {
  try {
    const { action, ingredients, staples, constraints, fridgeImageBase64, refinement } = req.body;

    // ─── SCAN: Identify ingredients from fridge photo ───
    if (action === 'scan') {
      if (!fridgeImageBase64) return res.status(400).json({ error: 'No image provided' });

      const parsed = parseBase64Image(fridgeImageBase64);
      if (!parsed || !parsed.base64Data || parsed.base64Data.length < 100) {
        return res.status(400).json({ error: 'Invalid image data' });
      }

      console.log('🧪 FridgeAlchemy: Scanning fridge photo...');

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: parsed.mediaType, data: parsed.base64Data }
            },
            {
              type: 'text',
              text: `Identify all food ingredients clearly visible in this fridge/pantry photo.

RULES:
- Only list items you can confidently identify
- Use simple common names (e.g. "eggs" not "large Grade A eggs")
- Skip condiment packets, beverages, and non-food items
- If you can see brand names that help identify the item, just use the generic name

Return ONLY a JSON object, no markdown fences or preamble:
{ "detected_ingredients": ["item1", "item2", "item3"] }`
            }
          ]
        }]
      });

      const responseText = message.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
      const cleaned = cleanJsonResponse(responseText);

      try {
        const data = JSON.parse(cleaned);
        console.log(`🧪 FridgeAlchemy: Detected ${(data.detected_ingredients || []).length} ingredients`);
        return res.json({ detected_ingredients: data.detected_ingredients || [] });
      } catch {
        return res.json({ detected_ingredients: [] });
      }
    }

    // ─── GENERATE: Create recipes from ingredients ───
    if (action === 'generate') {
      if (!ingredients || ingredients.length < 2) {
        return res.status(400).json({ error: 'At least 2 ingredients required' });
      }

      console.log(`🧪 FridgeAlchemy: Generating recipes for [${ingredients.join(', ')}]`);

      const constraintNotes = [];
      if (constraints?.timeLimit && constraints.timeLimit !== 'any') constraintNotes.push(`Time limit: ${constraints.timeLimit} minutes`);
      if (constraints?.equipment && constraints.equipment !== 'full') {
        const eqMap = { stovetop: 'Stovetop only (no oven)', microwave: 'Microwave only', nofire: 'No cooking/heat' };
        constraintNotes.push(`Equipment: ${eqMap[constraints.equipment] || constraints.equipment}`);
      }
      if (constraints?.diet && constraints.diet !== 'none') constraintNotes.push(`Dietary: ${constraints.diet}`);
      if (constraints?.vibe) {
        const vibeMap = { 'feed-me': 'Just feed me, I don\'t care how it looks', 'try': 'I\'m willing to put in some effort for something good', 'impress': 'I want to impress someone with limited ingredients' };
        constraintNotes.push(`Vibe: ${vibeMap[constraints.vibe] || constraints.vibe}`);
      }

      const prompt = `You are FridgeAlchemy, a creative cooking assistant that makes real meals from minimal ingredients. You're honest, practical, and a little playful — like a friend who's great at improvising.

USER'S INGREDIENTS: ${ingredients.join(', ')}
AVAILABLE STAPLES: ${(staples || ['salt', 'pepper', 'cooking oil', 'water']).join(', ')}
${constraintNotes.length > 0 ? `CONSTRAINTS:\n${constraintNotes.join('\n')}` : ''}

RULES:
1. ONLY use the listed ingredients + checked staples. NEVER sneak in extras.
2. Generate 2-3 creative recipes. Be honest about what's possible.
3. Recipe names: descriptive and real, not pretentious.
4. Steps: specific times and techniques ("Cook 3 minutes until edges golden" not "cook until done").
5. vibe_tag MUST be exactly one of: "🔥 Actually good", "😌 Comfort classic", "⚡ 5-minute save", "🎭 Secretly impressive", "🏕️ Survival mode", "🤌 Minimal but elegant"
6. The one_more_thing should be ONE common ingredient that unlocks the most new possibilities.

Return ONLY valid JSON, no markdown fences:
{
  "intro": "Brief cheeky comment about their ingredients (1-2 sentences)",
  "recipes": [
    {
      "name": "Recipe Name",
      "vibe_tag": "emoji + label from the allowed list",
      "time_minutes": 15,
      "difficulty": "Easy|Medium|Adventurous",
      "ingredients_used": ["from their list"],
      "staples_used": ["from staples"],
      "steps": ["Step 1 with specific times...", "Step 2..."],
      "why_it_works": "One sentence food-science explanation",
      "honest_take": "One sentence honest rating of the dish"
    }
  ],
  "one_more_thing": {
    "ingredient": "single ingredient name",
    "unlocks": "What dishes become possible (1-2 sentences)"
  }
}`;

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        messages: [{ role: 'user', content: prompt }]
      });

      const responseText = message.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
      const cleaned = cleanJsonResponse(responseText);

      try {
        const data = JSON.parse(cleaned);
        console.log(`🧪 FridgeAlchemy: Generated ${(data.recipes || []).length} recipes`);
        return res.json(data);
      } catch (e) {
        console.error('🧪 FridgeAlchemy: JSON parse error:', e.message);
        return res.status(500).json({ error: 'Failed to parse recipe response' });
      }
    }

    // ─── REFINE: Adjust a single recipe ───
    if (action === 'refine') {
      if (!refinement?.originalRecipe) {
        return res.status(400).json({ error: 'Original recipe required for refinement' });
      }

      console.log(`🧪 FridgeAlchemy: Refining recipe — ${refinement.type}`);

      const prompt = `You are FridgeAlchemy. Adjust this recipe based on the user's request.

ORIGINAL RECIPE:
${JSON.stringify(refinement.originalRecipe, null, 2)}

AVAILABLE INGREDIENTS: ${(ingredients || []).join(', ')}
AVAILABLE STAPLES: ${(staples || ['salt', 'pepper', 'cooking oil', 'water']).join(', ')}

ADJUSTMENT REQUESTED: "${refinement.type}"

${refinement.type === 'different' ? 'Create a COMPLETELY different recipe using the same ingredients. Different technique, different dish.' : refinement.type === 'spicier' ? 'Make it spicier using only available ingredients/staples. If they have hot sauce or chili flakes, use those. Otherwise suggest dry-heat techniques.' : `Adapt the recipe to work with: ${refinement.type}. Change technique but keep the same ingredient spirit.`}

RULES: Only use listed ingredients + staples. Be specific with times. Keep the same JSON format.
vibe_tag MUST be exactly one of: "🔥 Actually good", "😌 Comfort classic", "⚡ 5-minute save", "🎭 Secretly impressive", "🏕️ Survival mode", "🤌 Minimal but elegant"

Return ONLY valid JSON:
{
  "recipes": [{ single adjusted recipe in same format }]
}`;

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{ role: 'user', content: prompt }]
      });

      const responseText = message.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
      const cleaned = cleanJsonResponse(responseText);

      try {
        const data = JSON.parse(cleaned);
        return res.json(data);
      } catch (e) {
        console.error('🧪 FridgeAlchemy: Refine parse error:', e.message);
        return res.status(500).json({ error: 'Failed to parse refined recipe' });
      }
    }

    return res.status(400).json({ error: 'Invalid action. Use: scan, generate, or refine' });

  } catch (error) {
    console.error('❌ FridgeAlchemy error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to process request' });
  }
});

module.exports = router;
