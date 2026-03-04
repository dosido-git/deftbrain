const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ─── Helper: build wardrobe description for prompt ───
function buildWardrobeDescription(wardrobeInventory) {
  return Object.entries(wardrobeInventory)
    .map(([category, items]) => {
      if (!items || items.length === 0) return null;
      const itemsList = items.map(item => {
        const details = [item.name];
        if (item.color) details.push(`(${item.color})`);
        if (item.style) details.push(`[${item.style}]`);
        details.push(`comfort: ${item.comfortLevel}/10`);
        if (item.sensoryNotes) details.push(`sensory: ${item.sensoryNotes}`);
        if (item.wearCount) details.push(`worn ${item.wearCount} times`);
        if (item.lastWorn) {
          const days = Math.floor((Date.now() - new Date(item.lastWorn).getTime()) / 86400000);
          if (days === 0) details.push('WORN TODAY');
          else if (days === 1) details.push('WORN YESTERDAY');
          else if (days < 4) details.push(`worn ${days} days ago`);
        }
        return details.join(' ');
      }).join('\n  - ');
      return `${category.toUpperCase()}:\n  - ${itemsList}`;
    })
    .filter(Boolean)
    .join('\n\n');
}

// ─── Helper: build context guidance (color, utilization, recency) ───
function buildContextGuidance(wardrobeInventory) {
  const allItems = Object.values(wardrobeInventory).flat();

  const colorPalette = {};
  allItems.forEach(item => {
    if (item.color) {
      const c = item.color.toLowerCase();
      colorPalette[c] = (colorPalette[c] || 0) + 1;
    }
  });
  const dominantColors = Object.entries(colorPalette)
    .sort((a, b) => b[1] - a[1]).slice(0, 5).map(([c]) => c);

  let colorGuidance = '';
  if (dominantColors.length > 0) {
    colorGuidance = `\n\nCOLOR COORDINATION:\nDominant colors: ${dominantColors.join(', ')}
Focus on cohesive combos: navy+white/gray/beige, black+anything, earth tones together.`;
  }

  const underutilized = allItems
    .filter(item => !item.wearCount || item.wearCount < 2)
    .map(item => item.name).slice(0, 5);

  let wearGuidance = '';
  if (underutilized.length > 0) {
    wearGuidance = `\n\nUTILIZATION:\nTry these underused items when appropriate: ${underutilized.join(', ')}`;
  }

  const wornRecently = allItems
    .filter(item => {
      if (!item.lastWorn) return false;
      return Math.floor((Date.now() - new Date(item.lastWorn).getTime()) / 86400000) < 2;
    })
    .map(item => item.name);

  let recencyGuidance = '';
  if (wornRecently.length > 0) {
    recencyGuidance = `\n\nRECENCY AVOIDANCE:\nAvoid these (worn in last 2 days): ${wornRecently.join(', ')}`;
  }

  return { colorGuidance, wearGuidance, recencyGuidance };
}

// ─── Helper: build sensory + comfort context ───
function buildSensoryContext(sensoryNeeds, comfortPriority) {
  const requirements = [];
  if (sensoryNeeds?.softFabrics) requirements.push('Only soft, non-scratchy fabrics');
  if (sensoryNeeds?.looseFit) requirements.push('Loose, non-restrictive fit');
  if (sensoryNeeds?.noTags) requirements.push('No tags or seams');
  if (sensoryNeeds?.avoidTextures) requirements.push(`Avoid: ${sensoryNeeds.avoidTextures}`);

  const sensoryContext = requirements.length > 0
    ? `\n\nSENSORY REQUIREMENTS:\n${requirements.join('\n')}`
    : '';

  let comfortGuidance = '';
  if (comfortPriority >= 8) comfortGuidance = 'PRIORITIZE COMFORT over style.';
  else if (comfortPriority >= 5) comfortGuidance = 'BALANCED comfort and style.';
  else comfortGuidance = 'PRIORITIZE STYLE over comfort.';

  return { sensoryContext, comfortGuidance };
}

// ─── Helper: build feedback context ───
function buildFeedbackContext(outfitFeedback) {
  if (!outfitFeedback || typeof outfitFeedback !== 'object') return '';
  const loved = [];
  const neverAgain = [];
  Object.entries(outfitFeedback).forEach(([id, rating]) => {
    if (rating === 'loved') loved.push(id);
    else if (rating === 'never-again') neverAgain.push(id);
  });

  let ctx = '';
  if (loved.length > 0) {
    ctx += `\n\nUSER PREFERENCES (from past feedback):\nUser LOVED outfits: ${loved.join(', ')} — create similar combinations.`;
  }
  if (neverAgain.length > 0) {
    ctx += `\nUser DISLIKED outfits: ${neverAgain.join(', ')} — avoid similar combinations.`;
  }
  return ctx;
}

// ═══════════════════════════════════════════════════
//  POST /wardrobe-chaos-helper — Main outfit gen
// ═══════════════════════════════════════════════════
router.post('/wardrobe-chaos-helper', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { wardrobeInventory, weather, activities, mood, comfortPriority, sensoryNeeds, outfitFeedback } = req.body;

    if (!wardrobeInventory || typeof wardrobeInventory !== 'object' || Array.isArray(wardrobeInventory)) {
      return res.status(400).json({ error: 'Wardrobe inventory is required' });
    }
    const totalItems = Object.values(wardrobeInventory).reduce((sum, items) => sum + (Array.isArray(items) ? items.length : 0), 0);
    if (totalItems < 3) return res.status(400).json({ error: `Need at least 3 items. Currently have ${totalItems}.` });
    if (!weather) return res.status(400).json({ error: 'Weather is required' });
    if (!activities || !Array.isArray(activities) || activities.length === 0) return res.status(400).json({ error: 'At least one activity is required' });
    if (!mood) return res.status(400).json({ error: 'Mood is required' });

    const wardrobeDescription = buildWardrobeDescription(wardrobeInventory);
    const { colorGuidance, wearGuidance, recencyGuidance } = buildContextGuidance(wardrobeInventory);
    const { sensoryContext, comfortGuidance } = buildSensoryContext(sensoryNeeds, comfortPriority);
    const feedbackContext = buildFeedbackContext(outfitFeedback);

    const activityReqs = [
      activities.includes('work') || activities.includes('meeting') ? '- Professional/workplace appropriate' : '',
      activities.includes('exercise') ? '- Movement and breathability' : '',
      activities.includes('event') ? '- Elevated/special occasion' : '',
      activities.includes('casual') ? '- Relaxed and comfortable' : '',
      activities.includes('home') ? '- Maximum comfort' : '',
      activities.includes('date') ? '- Attractive and confident' : ''
    ].filter(Boolean).join('\n');

    const prompt = withLanguage(`You are a personal stylist helping someone pick an outfit from their existing wardrobe. This tool is designed for users who experience decision fatigue.

USER'S WARDROBE:
${wardrobeDescription}

TODAY'S CONTEXT:
- Weather: ${weather}
- Activities: ${activities.join(', ')}
- Desired feeling: ${mood}
- Comfort priority: ${comfortPriority}/10 (1=style, 10=comfort)
${sensoryContext}

STYLING GUIDANCE:
${comfortGuidance}
${colorGuidance}
${wearGuidance}
${recencyGuidance}
${feedbackContext}

ACTIVITY REQUIREMENTS:
${activityReqs}

Create 3-5 complete outfit combinations using ONLY items from the wardrobe above. Include accessories if available.

Return ONLY valid JSON:
{
  "outfit_combinations": [
    {
      "outfit_id": 1,
      "items": {
        "top": "exact item name",
        "bottom": "exact name or null if dress",
        "shoes": "exact name",
        "outerwear": "exact name or null",
        "accessories": "exact name or null"
      },
      "why_this_works": "brief explanation mentioning weather, activity, mood fit",
      "comfort_rating": 8,
      "style_rating": 7,
      "sensory_friendly": true,
      "weather_appropriate": true,
      "confidence_boost": "specific positive affirmation",
      "color_coordination": "why these colors work together"
    }
  ],
  "getting_dressed_tips": ["tip1", "tip2", "tip3"],
  "backup_option": "simplest comfortable outfit description",
  "capsule_wardrobe_suggestions": ["versatile piece suggestion 1", "suggestion 2"]
}

RULES:
1. ONLY use items explicitly listed in the wardrobe
2. Match weather appropriately
3. Respect sensory needs strictly
4. Avoid items marked as WORN TODAY or WORN YESTERDAY unless wardrobe is very limited
5. Include accessories when available
6. Each outfit must be complete
7. If comfort priority is 7+, prefer items with comfort_level 7+
8. Try to incorporate underutilized items
9. Learn from user feedback — favor combinations similar to loved outfits, avoid disliked patterns
10. Capsule suggestions should fill genuine gaps`, req);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = message.content.find(c => c.type === 'text')?.text || '';
    const parsed = JSON.parse(cleanJsonResponse(text));

    if (!parsed.outfit_combinations || !Array.isArray(parsed.outfit_combinations)) {
      throw new Error('Invalid response — missing outfit_combinations');
    }

    res.json(parsed);
  } catch (error) {
    console.error('Wardrobe Chaos Helper error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate outfits. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
//  POST /wardrobe-chaos-helper/regenerate — Swap piece or regenerate
// ═══════════════════════════════════════════════════
router.post('/wardrobe-chaos-helper/regenerate', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { wardrobeInventory, weather, activities, mood, comfortPriority, sensoryNeeds, currentOutfit, swapPiece, outfitFeedback } = req.body;

    if (!wardrobeInventory || !currentOutfit) {
      return res.status(400).json({ error: 'Wardrobe and current outfit are required' });
    }

    const wardrobeDescription = buildWardrobeDescription(wardrobeInventory);
    const { sensoryContext, comfortGuidance } = buildSensoryContext(sensoryNeeds, comfortPriority);
    const { recencyGuidance } = buildContextGuidance(wardrobeInventory);
    const feedbackContext = buildFeedbackContext(outfitFeedback);

    const currentItems = Object.entries(currentOutfit.items || {})
      .filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join(', ');

    let instruction;
    if (swapPiece) {
      instruction = `SWAP the ${swapPiece} in: ${currentItems}
Keep all other pieces. Choose a DIFFERENT ${swapPiece}. Do NOT use "${currentOutfit.items[swapPiece]}".`;
    } else {
      instruction = `Create a COMPLETELY DIFFERENT outfit. Previous was: ${currentItems}
Use different items where possible.`;
    }

    const prompt = withLanguage(`You are a personal stylist. ${instruction}

WARDROBE:
${wardrobeDescription}

CONTEXT: Weather ${weather}, Activities: ${(activities || []).join(', ')}, Mood: ${mood}, Comfort: ${comfortPriority}/10
${sensoryContext}
${comfortGuidance}
${recencyGuidance}
${feedbackContext}

Return ONLY valid JSON:
{
  "outfit": {
    "outfit_id": ${Date.now()},
    "items": { "top": "name", "bottom": "name or null", "shoes": "name", "outerwear": "name or null", "accessories": "name or null" },
    "why_this_works": "explanation",
    "comfort_rating": 8,
    "style_rating": 7,
    "sensory_friendly": true,
    "weather_appropriate": true,
    "confidence_boost": "affirmation",
    "color_coordination": "color note"
  }
}

ONLY use items from the wardrobe.`, req);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = message.content.find(c => c.type === 'text')?.text || '';
    const parsed = JSON.parse(cleanJsonResponse(text));

    if (!parsed.outfit) throw new Error('Invalid response — missing outfit');
    res.json(parsed);
  } catch (error) {
    console.error('Wardrobe regenerate error:', error);
    res.status(500).json({ error: error.message || 'Failed to regenerate outfit.' });
  }
});

// ═══════════════════════════════════════════════════
//  POST /wardrobe-chaos-helper/pack — Packing list generator
// ═══════════════════════════════════════════════════
router.post('/wardrobe-chaos-helper/pack', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { wardrobeInventory, destination, days, tripType, outfitFeedback } = req.body;

    if (!wardrobeInventory || typeof wardrobeInventory !== 'object') {
      return res.status(400).json({ error: 'Wardrobe inventory is required' });
    }
    if (!destination || typeof destination !== 'string' || !destination.trim()) {
      return res.status(400).json({ error: 'Destination is required' });
    }
    const numDays = Math.max(1, Math.min(14, parseInt(days) || 3));

    const wardrobeDescription = buildWardrobeDescription(wardrobeInventory);
    const feedbackContext = buildFeedbackContext(outfitFeedback);

    const tripTypeGuidance = {
      casual: 'Focus on comfortable, versatile pieces that mix and match easily.',
      business: 'Include professional pieces. A blazer that works with multiple bottoms is ideal.',
      mixed: 'Mix professional and casual. Items should transition between work and leisure.',
      adventure: 'Prioritize movement-friendly, durable, quick-dry items. Layers are key.',
      formal: 'Include at least one formal outfit. Other days can be smart-casual.'
    }[tripType] || 'Versatile mix-and-match pieces.';

    const prompt = withLanguage(`You are a personal stylist and packing expert. Create a minimalist packing list from this person's ACTUAL wardrobe for a trip.

WARDROBE:
${wardrobeDescription}

TRIP DETAILS:
- Destination: ${destination}
- Duration: ${numDays} days
- Trip type: ${tripType}
- Guidance: ${tripTypeGuidance}
${feedbackContext}

PACKING PHILOSOPHY:
- MINIMIZE items, MAXIMIZE outfits through mix-and-match
- Each piece should work in at least 2 outfits
- Include only items from the wardrobe above
- Consider destination weather/climate
- Account for laundry access on longer trips

Return ONLY valid JSON:
{
  "packing_list": [
    {
      "name": "exact item name from wardrobe",
      "notes": "why included / how to style",
      "reuse_count": 3
    }
  ],
  "outfit_plan": [
    {
      "day": 1,
      "note": "arrival day / meeting day / etc",
      "items": {
        "top": "exact name",
        "bottom": "exact name",
        "shoes": "exact name",
        "outerwear": "exact name or null",
        "accessories": "exact name or null"
      }
    }
  ],
  "total_items": 12,
  "total_outfits": 5,
  "reuse_efficiency": "12 items → 5 unique outfits",
  "tips": [
    "packing tip 1",
    "packing tip 2"
  ]
}

RULES:
1. ONLY use items from the wardrobe
2. Maximize reuse — one bottom with 3 tops = 3 outfits
3. Include shoes that work across multiple outfits
4. For ${numDays}+ day trips, plan for laundry mid-trip
5. Consider destination ${destination} climate
6. Create one outfit plan entry per day`, req);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    const text = message.content.find(c => c.type === 'text')?.text || '';
    const parsed = JSON.parse(cleanJsonResponse(text));

    if (!parsed.packing_list || !Array.isArray(parsed.packing_list)) {
      throw new Error('Invalid response — missing packing_list');
    }

    res.json(parsed);
  } catch (error) {
    console.error('Wardrobe packing error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate packing list.' });
  }
});

module.exports = router;
