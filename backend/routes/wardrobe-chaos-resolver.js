const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/wardrobe-chaos-resolver', async (req, res) => {
  console.log('✅ Wardrobe Chaos Resolver endpoint called');
  
  try {
    const { 
      wardrobeInventory,
      weather,
      activities,
      mood,
      comfortPriority,
      sensoryNeeds
    } = req.body;
    
    // Validation — check wardrobeInventory first (Object.values crashes on undefined)
    if (!wardrobeInventory || typeof wardrobeInventory !== 'object' || Array.isArray(wardrobeInventory)) {
      return res.status(400).json({ error: 'Wardrobe inventory is required' });
    }

    const totalItems = Object.values(wardrobeInventory).reduce((sum, items) => sum + (Array.isArray(items) ? items.length : 0), 0);

    console.log('📝 Request:', { 
      weather,
      activities,
      mood,
      comfortPriority,
      wardrobeItems: totalItems
    });
    
    if (totalItems < 5) {
      return res.status(400).json({ 
        error: `You need at least 5 items in your wardrobe. Currently have ${totalItems} items.` 
      });
    }

    if (!weather) {
      return res.status(400).json({ error: 'Weather is required' });
    }

    if (!activities || !Array.isArray(activities) || activities.length === 0) {
      return res.status(400).json({ error: 'At least one activity is required' });
    }

    if (!mood) {
      return res.status(400).json({ error: 'Mood is required' });
    }

    // Build wardrobe description for Claude
    const wardrobeDescription = Object.entries(wardrobeInventory)
      .map(([category, items]) => {
        if (items.length === 0) return null;
        
        const itemsList = items.map(item => {
          const details = [item.name];
          if (item.color) details.push(`(${item.color})`);
          if (item.style) details.push(`[${item.style}]`);
          details.push(`comfort: ${item.comfortLevel}/10`);
          if (item.sensoryNotes) details.push(`sensory: ${item.sensoryNotes}`);
          if (item.wearCount) details.push(`worn ${item.wearCount} times`);
          return details.join(' ');
        }).join('\n  - ');
        
        return `${category.toUpperCase()}:\n  - ${itemsList}`;
      })
      .filter(Boolean)
      .join('\n\n');

    // Analyze color palette for better matching
    const colorPalette = {};
    Object.values(wardrobeInventory).flat().forEach(item => {
      if (item.color) {
        const color = item.color.toLowerCase();
        colorPalette[color] = (colorPalette[color] || 0) + 1;
      }
    });
    
    const dominantColors = Object.entries(colorPalette)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([color]) => color);

    const colorGuidance = dominantColors.length > 0
      ? `\n\nCOLOR COORDINATION:\nUser's dominant colors: ${dominantColors.join(', ')}
Focus on creating cohesive outfits using these colors. Suggest color combinations that work well together.
Classic combinations:
- Navy + white/gray/beige
- Black + white/any color
- Gray + pink/yellow/navy
- Beige + brown/navy/white
- Earth tones together (brown, olive, beige)`
      : '';

    // Identify most/least worn items for smarter suggestions
    const allItems = Object.values(wardrobeInventory).flat();
    const underutilized = allItems
      .filter(item => !item.wearCount || item.wearCount < 2)
      .map(item => item.name)
      .slice(0, 5);
    
    const wearGuidance = underutilized.length > 0
      ? `\n\nWARDROBE UTILIZATION:\nTry to incorporate these underused items: ${underutilized.join(', ')}\nThis helps the user get more value from their wardrobe.`
      : '';

    // Build sensory requirements string
    const sensoryRequirements = [];
    if (sensoryNeeds && sensoryNeeds.softFabrics) sensoryRequirements.push('Only soft, non-scratchy fabrics');
    if (sensoryNeeds && sensoryNeeds.looseFit) sensoryRequirements.push('Loose, non-restrictive fit preferred');
    if (sensoryNeeds && sensoryNeeds.noTags) sensoryRequirements.push('Avoid items with tags or prominent seams');
    if (sensoryNeeds && sensoryNeeds.avoidTextures) sensoryRequirements.push(`Avoid these textures: ${sensoryNeeds.avoidTextures}`);
    
    const sensoryContext = sensoryRequirements.length > 0 
      ? `\n\nSENSORY REQUIREMENTS:\n${sensoryRequirements.join('\n')}`
      : '';

    // Comfort priority interpretation
    let comfortGuidance = '';
    if (comfortPriority >= 8) {
      comfortGuidance = 'PRIORITIZE COMFORT - User needs maximum physical comfort today. Choose the softest, most comfortable items even if less stylish.';
    } else if (comfortPriority >= 5) {
      comfortGuidance = 'BALANCED APPROACH - Find a good balance between comfort and style.';
    } else {
      comfortGuidance = 'PRIORITIZE STYLE - User wants to look put-together even if it means sacrificing some comfort.';
    }

    // Build the prompt
    const prompt = `You are a personal stylist helping someone pick an outfit from their existing wardrobe. This is CRITICAL for neurodivergent users who experience decision fatigue.

USER'S WARDROBE:
${wardrobeDescription}

TODAY'S CONTEXT:
- Weather: ${weather}
- Activities: ${activities.join(', ')}
- Desired mood/feeling: ${mood}
- Comfort priority: ${comfortPriority}/10 (1=style first, 10=comfort first)
${sensoryContext}

STYLING GUIDANCE:
${comfortGuidance}
${colorGuidance}
${wearGuidance}

ACTIVITY-SPECIFIC REQUIREMENTS:
${activities.includes('work') || activities.includes('meeting') ? '- Professional/appropriate for workplace' : ''}
${activities.includes('exercise') ? '- Must allow for movement and breathability' : ''}
${activities.includes('event') ? '- Should be elevated/special occasion appropriate' : ''}
${activities.includes('casual') ? '- Relaxed and comfortable' : ''}
${activities.includes('home') ? '- Maximum comfort for staying home' : ''}

Create 3-5 complete outfit combinations using ONLY items from the wardrobe above. Return ONLY a valid JSON object with this structure:

{
  "outfit_combinations": [
    {
      "outfit_id": 1,
      "items": {
        "top": "exact item name from wardrobe",
        "bottom": "exact item name from wardrobe (or null if dress)",
        "shoes": "exact item name from wardrobe",
        "outerwear": "exact item name or null if not needed",
        "accessories": "optional items or null"
      },
      "why_this_works": "Brief explanation of why this outfit matches their day - mention weather appropriateness, activity suitability, and how it achieves their desired mood",
      "comfort_rating": 8,
      "style_rating": 7,
      "sensory_friendly": true,
      "weather_appropriate": true,
      "confidence_boost": "Positive affirmation about how they'll feel in this outfit",
      "color_coordination": "Brief note on why these colors work together (e.g., 'Navy and white is a classic combination that looks polished')"
    }
  ],
  "getting_dressed_tips": [
    "Lay clothes out the night before if mornings are hard",
    "Start with comfortable underwear - it sets the tone",
    "If stuck between options, go with the one that feels softer"
  ],
  "backup_option": "If feeling overwhelmed, just wear [simplest comfortable outfit from wardrobe]. Sometimes 'good enough' is perfect.",
  "capsule_wardrobe_suggestions": [
    "Add a white button-down for versatility with your navy bottoms",
    "A neutral cardigan would work with most of your existing pieces"
  ]
}

CRITICAL RULES:
1. ONLY use items that are EXPLICITLY listed in the wardrobe above
2. Match weather: Hot = light fabrics, Cold = layers/outerwear, Rainy = weather-resistant
3. Respect sensory needs STRICTLY - if they need soft fabrics, only suggest items marked as comfortable
4. Comfort rating should reflect PHYSICAL comfort (fabric feel, fit, restriction)
5. Style rating should reflect put-togetherness and appropriateness
6. Include confidence_boost messages that are genuine and specific
7. getting_dressed_tips should be practical for low-energy/executive dysfunction
8. backup_option should be the SIMPLEST possible outfit from their wardrobe
9. Each outfit should be COMPLETE - don't leave people guessing
10. If comfort priority is high (7+), prioritize items with comfort_level 7+
11. COLOR COORDINATION: Explain why the colors work together (navy+white is classic, earth tones are cohesive, etc.)
12. Try to incorporate underutilized items when appropriate to help user rediscover their wardrobe
13. CAPSULE WARDROBE: If wardrobe has gaps (lacking versatile basics), suggest 1-2 pieces to add that would multiply outfit options

Return ONLY the JSON object, no other text.`;

    console.log('🤖 Calling Claude API...');

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ 
        role: 'user', 
        content: prompt 
      }]
    });

    console.log('✅ Claude API responded');

    // Extract and parse response
    const textContent = message.content.find(item => item.type === 'text')?.text || '';
    
    let cleaned = textContent.trim();
    cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('No JSON object found in response');
    }
    
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      console.error('JSON parse error:', parseError.message);
      console.error('Attempted to parse:', cleaned);
      throw new Error('Failed to parse outfit suggestions as JSON');
    }
    
    // Validate response structure
    if (!parsed.outfit_combinations || !Array.isArray(parsed.outfit_combinations)) {
      throw new Error('Invalid response structure - missing outfit_combinations array');
    }
    
    console.log('✅ Response validated successfully');
    console.log('📊 Generated outfits:', {
      count: parsed.outfit_combinations.length,
      avgComfort: parsed.outfit_combinations.reduce((sum, o) => sum + (o.comfort_rating || 0), 0) / parsed.outfit_combinations.length,
      avgStyle: parsed.outfit_combinations.reduce((sum, o) => sum + (o.style_rating || 0), 0) / parsed.outfit_combinations.length
    });

    res.json(parsed);

  } catch (error) {
    console.error('❌ Wardrobe Chaos Resolver error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate outfits. Please try again.' 
    });
  }
});


module.exports = router;
