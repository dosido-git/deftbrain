const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/plant-rescue', async (req, res) => {
  console.log('✅ Plant Rescue endpoint called');
  
  try {
    const { 
      imageBase64,
      plantDescription,
      lightLevel,
      wateringFreq,
      location,
      ageOfOwnership,
      hasPets,
      hasChildren,
      climateZone,
      userLocation
    } = req.body;
    
    console.log('📝 Request:', { 
      hasImage: !!imageBase64,
      hasDescription: !!plantDescription,
      lightLevel,
      wateringFreq,
      location,
      hasPets,
      hasChildren,
      climateZone,
      userLocation
    });

    // Validation: Must have either image or description
    if (!imageBase64 && (!plantDescription || plantDescription.trim().length < 5)) {
      return res.status(400).json({ 
        error: 'Please provide either a plant photo or a description of at least 5 characters' 
      });
    }

    // Build environmental context
    const envContext = [];
    if (lightLevel) {
      const lightDesc = {
        'full-sun': 'Full sun (6+ hours direct sunlight)',
        'partial-shade': 'Partial shade (3-6 hours sunlight)',
        'low-light': 'Low light (indirect or shade)'
      };
      envContext.push(`Light: ${lightDesc[lightLevel] || lightLevel}`);
    }
    if (wateringFreq) {
      const waterDesc = {
        'daily': 'Watered daily',
        'few-days': 'Watered every few days',
        'weekly': 'Watered weekly',
        'rarely': 'Watered rarely (bi-weekly or less)'
      };
      envContext.push(`Watering: ${waterDesc[wateringFreq] || wateringFreq}`);
    }
    if (location) {
      envContext.push(`Location: ${location}`);
    }
    if (ageOfOwnership) {
      envContext.push(`Owned for: ${ageOfOwnership}`);
    }
    
    // Safety context
    const safetyContext = [];
    if (hasPets) {
      safetyContext.push('⚠️ HOUSEHOLD HAS PETS - Check for toxicity');
    }
    if (hasChildren) {
      safetyContext.push('⚠️ HOUSEHOLD HAS CHILDREN - Check for toxicity');
    }
    
    // Climate context
    const climateContext = [];
    if (climateZone) {
      climateContext.push(`Climate: ${climateZone}`);
    }
    if (userLocation) {
      climateContext.push(`Location: ${userLocation}`);
    }

    const environmentalInfo = envContext.length > 0 
      ? `\n\nENVIRONMENTAL CONDITIONS:\n${envContext.join('\n')}`
      : '';
    
    const safetyInfo = safetyContext.length > 0
      ? `\n\n${safetyContext.join('\n')}`
      : '';
    
    const climateInfo = climateContext.length > 0
      ? `\n\nCLIMATE/REGIONAL INFO:\n${climateContext.join('\n')}`
      : '';

    // Build prompt
    const prompt = `You are a professional botanist and plant care expert. Analyze this struggling plant and provide a rescue plan.

${plantDescription ? `PLANT DESCRIPTION:\n${plantDescription}` : 'PLANT IMAGE PROVIDED (analyze the visual symptoms)'}
${environmentalInfo}
${safetyInfo}
${climateInfo}

Provide a comprehensive diagnosis and rescue plan in the following JSON structure:

{
  "plant_identification": {
    "species": "Scientific name if identifiable, otherwise 'Unknown species'",
    "common_name": "Common name if known",
    "confidence": "high/medium/low (how certain you are about identification)",
    "confidence_score": 85 (number 0-100, your confidence percentage),
    "alternative_species": [
      {
        "species": "Alternative scientific name",
        "common_name": "Alternative common name",
        "likelihood": 60 (percentage likelihood this could be the plant)
      }
    ] (ONLY include if confidence_score < 70%, show 2-3 alternatives)
  },
  "toxicity_warning": {
    "is_toxic": true or false,
    "level": "highly-toxic/toxic/mildly-toxic/safe" (if toxic),
    "dangerous_for": ["pets", "children"] (based on household info provided),
    "symptoms": "What happens if ingested - be specific",
    "safety_measures": "How to keep safe (e.g., 'Keep on high shelf, wear gloves when pruning')",
    "alternative_plants": "Suggest 2-3 non-toxic alternatives with similar appearance" (if toxic and pets/children present)
  } (ONLY include if plant is toxic AND household has pets or children),
  "diagnosis": {
    "primary_problem": "Main issue affecting the plant",
    "secondary_issues": ["Array of other contributing problems"],
    "severity": "critical/concerning/minor",
    "uncertainty_note": "If identification uncertain, explain how diagnosis might change for alternative species" (ONLY if confidence < 70%)
  },
  "action_plan": [
    {
      "priority": 1,
      "action": "Most urgent action",
      "timing": "When to do this",
      "why": "Why this is needed",
      "how": "Specific step-by-step instructions",
      "conditional": "If alternative species, explain variations" (ONLY if uncertain identification)
    }
  ],
  "environmental_adjustments": {
    "light": "Specific recommendation",
    "water": "Specific watering schedule",
    "location": "Whether to move the plant and where"
  },
  "prevention_tips": [
    "Tip 1 to prevent this in the future",
    "Tip 2 to maintain plant health",
    "Tip 3 for long-term care"
  ],
  "climate_recommendations": {
    "seasonal_note": "Current season considerations based on location/climate" (e.g., "It's winter in temperate zones - reduce watering"),
    "regional_tips": [
      "Region-specific advice based on climate zone",
      "Local growing season awareness"
    ]
  } (ONLY include if climate/location info provided),
  "recovery_timeline": "How long until plant should recover",
  "is_saveable": true or false
}

CRITICAL SAFETY INSTRUCTIONS:
${hasPets || hasChildren ? `
🚨 THIS HOUSEHOLD HAS ${hasPets ? 'PETS' : ''}${hasPets && hasChildren ? ' AND ' : ''}${hasChildren ? 'CHILDREN' : ''}
- You MUST check if this plant is toxic
- If toxic, include prominent toxicity_warning section
- Be specific about symptoms and safety measures
- Suggest safe alternative plants if highly toxic
` : ''}

UNCERTAINTY HANDLING RULES:
- If confidence_score < 70%, you MUST include alternative_species array with 2-3 possibilities
- Provide conditional guidance: "If this is Species A, do X; if Species B, do Y"
- Be honest about uncertainty - better to show multiple options than guess wrong
- In action_plan, note which actions apply to all possibilities vs specific species

CLIMATE AWARENESS:
${climateZone || userLocation ? `
- Consider the ${climateZone || 'regional'} climate when giving advice
- Account for current season (it's ${new Date().toLocaleDateString('en-US', { month: 'long' })})
- Adjust watering/care based on regional temperature and humidity
- Mention if plant is not suited for this climate zone
` : ''}

CRITICAL INSTRUCTIONS:
1. Be specific and actionable - no vague advice
2. Prioritize actions by urgency (priority 1 = do immediately)
3. If plant is dying, be honest but provide hope if there's any chance
4. Consider the environmental factors provided
5. Focus on what the owner can do NOW
6. If you see multiple issues, address root cause first
7. Include 3-6 actions in priority order
8. Make "how" instructions clear enough for beginners
9. If uncertain about species (< 70% confidence), show alternatives
10. Always check toxicity if pets/children present

COMMON ISSUES TO CHECK FOR:
- Overwatering (yellowing leaves, mushy stems, root rot)
- Underwatering (crispy brown leaves, dry soil, wilting)
- Light issues (leggy growth, pale leaves, sunburn)
- Pests (spots, holes, webbing, sticky residue)
- Nutrient deficiency (yellowing between veins, stunted growth)
- Disease (black spots, mold, fungal growth)
- Transplant shock (recent repotting)
- Temperature stress (sudden changes)

COMMON TOXIC PLANTS (flag these if pets/children present):
- Pothos (mildly toxic - mouth irritation)
- Philodendron (toxic - vomiting, difficulty swallowing)
- Peace Lily (toxic - mouth pain, drooling)
- Sago Palm (highly toxic - liver failure, death)
- Dieffenbachia (toxic - swelling, pain)
- Lilies (highly toxic to cats - kidney failure)
- Snake Plant (mildly toxic - nausea, vomiting)
- ZZ Plant (mildly toxic - skin/mouth irritation)

Return ONLY the JSON object, no other text.`;

    console.log('🤖 Calling Claude API...');

    // Build message content
    const content = [];
    
    // Add image if provided
    if (imageBase64) {
      const base64Data = imageBase64.split(',')[1] || imageBase64;
      
      // Detect media type
      let mediaType = 'image/jpeg';
      if (imageBase64.includes('data:image/png')) {
        mediaType = 'image/png';
      } else if (imageBase64.includes('data:image/webp')) {
        mediaType = 'image/webp';
      }
      
      content.push({
        type: 'image',
        source: {
          type: 'base64',
          media_type: mediaType,
          data: base64Data
        }
      });
    }
    
    // Add text prompt
    content.push({
      type: 'text',
      text: prompt
    });

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ 
        role: 'user', 
        content: content 
      }]
    });

    console.log('✅ Claude API responded');

    // Extract text content
    const textContent = message.content.find(item => item.type === 'text')?.text || '';
    
    // Clean and parse JSON
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
      throw new Error('Failed to parse response as JSON');
    }
    
    // Validate response structure
    if (!parsed.diagnosis || !parsed.action_plan) {
      throw new Error('Invalid response structure - missing required fields');
    }
    
    console.log('✅ Response validated successfully');
    console.log('📊 Diagnosis:', {
      species: parsed.plant_identification?.species || 'unknown',
      severity: parsed.diagnosis?.severity,
      saveable: parsed.is_saveable,
      actionCount: parsed.action_plan?.length || 0
    });

    res.json(parsed);

  } catch (error) {
    console.error('❌ Plant Rescue error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to analyze plant. Please try again.' 
    });
  }
});


module.exports = router;
