const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ── Main diagnosis / care / identify endpoint ──
router.post('/plant-rescue', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  console.log('✅ Plant Rescue V3 endpoint called');

  try {
    const {
      imageBase64, extraPhotos, plantDescription, symptoms,
      lightLevel, wateringFreq, location, ageOfOwnership,
      hasPets, hasChildren, climateZone, userLocation,
      mode, plantName, userLanguage
    } = req.body;

    const isRescue = mode === 'rescue';
    const isIdentify = mode === 'identify';
    const isCare = mode === 'care';

    if (!imageBase64 && (!plantDescription || plantDescription.trim().length < 3) && (!symptoms || symptoms.length === 0)) {
      return res.status(400).json({ error: 'Provide a photo, description, or select symptoms' });
    }

    // Build context strings
    const lightDesc = { 'full-sun': 'Full sun (6+h)', 'partial-shade': 'Partial shade (3-6h)', 'low-light': 'Low light' };
    const waterDesc = { 'daily': 'Daily', 'few-days': 'Every few days', 'weekly': 'Weekly', 'rarely': 'Rarely' };
    const envContext = [];
    if (lightLevel) envContext.push(`Light: ${lightDesc[lightLevel] || lightLevel}`);
    if (wateringFreq) envContext.push(`Watering: ${waterDesc[wateringFreq] || wateringFreq}`);
    if (location) envContext.push(`Location: ${location}`);
    if (ageOfOwnership) envContext.push(`Owned for: ${ageOfOwnership}`);

    const safetyContext = [];
    if (hasPets) safetyContext.push('⚠️ HOUSEHOLD HAS PETS');
    if (hasChildren) safetyContext.push('⚠️ HOUSEHOLD HAS CHILDREN');

    const environmentalInfo = envContext.length > 0 ? `\n\nENVIRONMENTAL CONDITIONS:\n${envContext.join('\n')}` : '';
    const safetyInfo = safetyContext.length > 0 ? `\n\n${safetyContext.join('\n')}` : '';
    const climateInfo = (climateZone || userLocation) ? `\n\nCLIMATE: ${climateZone || ''} ${userLocation || ''}` : '';

    // Symptom text
    const symptomMap = {
      yellow_leaves: 'Yellowing leaves', brown_tips: 'Brown tips', drooping: 'Drooping/wilting',
      spots: 'Spots on leaves', mushy_stem: 'Mushy/soft stem', white_fuzz: 'White fuzz/mold',
      tiny_bugs: 'Tiny bugs/pests', leggy: 'Leggy/stretched growth', no_growth: 'No new growth',
      leaf_drop: 'Leaf dropping', crispy: 'Crispy/dry leaves', root_rot: 'Bad smell/possible root rot'
    };
    const symptomText = symptoms?.length > 0
      ? `\n\nSELECTED SYMPTOMS:\n${symptoms.map(s => `- ${symptomMap[s] || s}`).join('\n')}`
      : '';

    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long' });

    const modeBlock = isRescue
      ? `MODE: RESCUE — Plant is struggling. Diagnose, provide urgent action plan, assess if saveable. If NOT saveable, ALWAYS include propagation_guide.`
      : isIdentify
      ? `MODE: IDENTIFY — User wants to know what this plant is. Focus on accurate identification, then provide complete care profile.`
      : `MODE: CARE GUIDE — Plant may be healthy. Provide comprehensive care schedule and seasonal calendar. Focus on THRIVING.`;

    const multiPhotoNote = (extraPhotos?.length > 0)
      ? `\n\nMULTIPLE PHOTOS PROVIDED: The user has sent ${1 + extraPhotos.length} photos. Image 1 is the whole plant. Additional images show close-ups or soil/roots. Analyze ALL images together for best diagnosis.`
      : '';

    const prompt = withLanguage(`You are a professional botanist and plant care expert.
${plantName ? `Plant name: "${plantName}"` : ''}

${modeBlock}

${plantDescription ? `DESCRIPTION:\n${plantDescription}` : imageBase64 ? 'PHOTO PROVIDED — analyze visually' : 'No photo or description — use symptoms below'}
${symptomText}
${multiPhotoNote}
${environmentalInfo}
${safetyInfo}
${climateInfo}

Return ONLY valid JSON:

{
  "plant_identification": {
    "species": "Scientific name or 'Unknown'",
    "common_name": "Common name",
    "confidence": "high/medium/low",
    "confidence_score": 85,
    "alternative_species": [{"species": "...", "common_name": "...", "likelihood": 60}]
  },
  ${(hasPets || hasChildren) ? `"toxicity_warning": {
    "is_toxic": true,
    "level": "highly-toxic/toxic/mildly-toxic/safe",
    "dangerous_for": ["pets", "children"],
    "symptoms": "Ingestion symptoms",
    "safety_measures": "Safety advice",
    "alternative_plants": "2-3 safe alternatives"
  },` : ''}
  ${isRescue ? `"diagnosis": {
    "primary_problem": "Main issue",
    "secondary_issues": ["Other problems"],
    "severity": "critical/concerning/minor",
    "uncertainty_note": "If uncertain, how diagnosis might change"
  },
  "action_plan": [
    {
      "priority": 1,
      "action": "Most urgent action",
      "timing": "When to do this",
      "why": "Why needed",
      "how": "Step-by-step"
    }
  ],
  "is_saveable": true,
  "recovery_timeline": "Timeline to recovery",` : ''}
  "care_schedule": {
    "watering": "SPECIFIC: e.g. 'Every 5-7 days. Check top inch — if dry, water thoroughly until drainage. Reduce to every 10-14 days in winter.'",
    "fertilizing": "e.g. 'Balanced 10-10-10 every 2 weeks March–September. Stop in winter.'",
    "misting": "e.g. 'Daily if humidity < 50%'",
    "rotation": "e.g. 'Quarter-turn weekly'",
    "pruning": "e.g. 'Remove yellow leaves. Shape in spring.'",
    "repot_timing": "e.g. 'Every 1-2 years in spring'",
    "seasonal_adjustments": "How care changes by season"
  },
  "seasonal_calendar": [
    {"month": "January", "tasks": ["Reduce watering", "No fertilizer", "Check for drafts"]},
    {"month": "February", "tasks": ["Watch for new growth", "Plan repotting"]},
    {"month": "March", "tasks": ["Resume fertilizing", "Increase watering", "Repot if rootbound"]},
    {"month": "April", "tasks": ["Move closer to window", "Begin regular feeding"]},
    {"month": "May", "tasks": ["Peak growing season", "Watch for pests"]},
    {"month": "June", "tasks": ["Water more frequently", "Provide shade if needed"]},
    {"month": "July", "tasks": ["Keep soil moist", "Mist in dry conditions"]},
    {"month": "August", "tasks": ["Continue summer care", "Propagate cuttings"]},
    {"month": "September", "tasks": ["Reduce fertilizer", "Prepare for dormancy"]},
    {"month": "October", "tasks": ["Reduce watering", "Move indoors if needed"]},
    {"month": "November", "tasks": ["Stop fertilizing", "Reduce watering further"]},
    {"month": "December", "tasks": ["Minimal watering", "Keep away from heaters"]}
  ],
  "repotting_guide": {
    "needs_repotting": true,
    "when": "Best time",
    "soil_mix": "Exact recipe",
    "pot_size": "Size recommendation",
    "pot_material": "Material + why",
    "drainage": "Requirements",
    "steps": ["Step 1", "Step 2", "Step 3"]
  },
  "propagation_guide": {
    "method": "e.g. Stem cutting",
    "best_season": "When",
    "steps": ["Step 1", "Step 2"],
    "success_rate": "e.g. High (80%+)",
    "timeline": "e.g. Roots in 2-3 weeks"
  },
  "environmental_adjustments": {
    "light": "Recommendation",
    "water": "Schedule",
    "location": "Where to place"
  },
  "prevention_tips": ["Tip 1", "Tip 2", "Tip 3"],
  "climate_recommendations": {
    "seasonal_note": "Current season note",
    "regional_tips": ["Regional advice"]
  }
}

RULES:
- ONLY include "alternative_species" if confidence_score < 70%
- ONLY include "toxicity_warning" if toxic AND household has pets/children
- ONLY include "climate_recommendations" if climate info provided
- seasonal_calendar: ALWAYS include. 12 months. 2-4 specific tasks per month for THIS species in ${climateZone || 'temperate'} climate. Current month is ${currentMonth}.
- care_schedule: ALWAYS include. Be SPECIFIC — "every 5-7 days" not "regularly".
- repotting_guide: ALWAYS include. Exact soil recipe.
- propagation_guide: ALWAYS include. Step-by-step with success rate.
${isRescue ? `- action_plan: 3-6 actions ordered by priority
- If is_saveable is false, propagation_guide is MANDATORY` : ''}
- Make instructions clear for complete beginners

${hasPets || hasChildren ? `🚨 HOUSEHOLD HAS ${hasPets ? 'PETS' : ''}${hasPets && hasChildren ? ' AND ' : ''}${hasChildren ? 'CHILDREN' : ''} — MUST check toxicity` : ''}

Return ONLY the JSON.`, userLanguage);

    console.log('🤖 Calling Claude...', { mode, hasImage: !!imageBase64, extraPhotos: extraPhotos?.filter(Boolean)?.length || 0, symptoms: symptoms?.length || 0 });

    // Build message content with multi-photo support (#6)
    const content = [];

    if (imageBase64) {
      const base64Data = imageBase64.split(',')[1] || imageBase64;
      let mediaType = 'image/jpeg';
      if (imageBase64.includes('data:image/png')) mediaType = 'image/png';
      else if (imageBase64.includes('data:image/webp')) mediaType = 'image/webp';
      content.push({ type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } });
    }

    // Extra photos
    if (extraPhotos?.length) {
      for (const photo of extraPhotos) {
        if (!photo) continue;
        const data = photo.split(',')[1] || photo;
        let mt = 'image/jpeg';
        if (photo.includes('data:image/png')) mt = 'image/png';
        else if (photo.includes('data:image/webp')) mt = 'image/webp';
        content.push({ type: 'image', source: { type: 'base64', media_type: mt, data } });
      }
    }

    content.push({ type: 'text', text: prompt });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content }]
    });

    const textContent = message.content.find(item => item.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(textContent);

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      let repaired = cleaned.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
      try { parsed = JSON.parse(repaired); }
      catch { return res.status(500).json({ error: 'Parse failed. Try again.' }); }
    }

    if (isRescue && (!parsed.diagnosis || !parsed.action_plan)) {
      return res.status(500).json({ error: 'Incomplete diagnosis. Try again.' });
    }

    console.log('✅ V3 Response:', {
      mode, species: parsed.plant_identification?.species || 'unknown',
      hasCareSchedule: !!parsed.care_schedule,
      hasCalendar: !!parsed.seasonal_calendar?.length,
      hasRepotting: !!parsed.repotting_guide,
      hasPropagation: !!parsed.propagation_guide
    });

    res.json(parsed);

  } catch (error) {
    console.error('❌ Plant Rescue V3 error:', error);
    res.status(500).json({ error: error.message || 'Analysis failed.' });
  }
});


// ── Follow-up Q&A ──
router.post('/plant-rescue/followup', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  console.log('✅ Plant Rescue Follow-Up called');

  try {
    const { question, originalDiagnosis, plantDescription, imageProvided, userLanguage } = req.body;
    if (!question?.trim()) return res.status(400).json({ error: 'Provide a question.' });
    if (!originalDiagnosis) return res.status(400).json({ error: 'No context. Run analysis first.' });

    const ctx = [];
    if (originalDiagnosis.plant_identification) ctx.push(`Plant: ${originalDiagnosis.plant_identification.common_name || originalDiagnosis.plant_identification.species || 'Unknown'}`);
    if (originalDiagnosis.diagnosis) ctx.push(`Diagnosis: ${originalDiagnosis.diagnosis.primary_problem} (${originalDiagnosis.diagnosis.severity})`);
    if (originalDiagnosis.care_schedule?.watering) ctx.push(`Watering: ${originalDiagnosis.care_schedule.watering}`);
    if (originalDiagnosis.care_schedule?.fertilizing) ctx.push(`Fertilizing: ${originalDiagnosis.care_schedule.fertilizing}`);
    if (originalDiagnosis.repotting_guide?.soil_mix) ctx.push(`Soil: ${originalDiagnosis.repotting_guide.soil_mix}`);
    if (originalDiagnosis.action_plan?.length) ctx.push(`Actions: ${originalDiagnosis.action_plan.map(a => a.action).join('; ')}`);
    if (originalDiagnosis.environmental_adjustments) {
      const ea = originalDiagnosis.environmental_adjustments;
      if (ea.light) ctx.push(`Light: ${ea.light}`);
    }

    const systemPrompt = withLanguage(
      `You are a botanist. User has a plant analysis and a follow-up question.

CONTEXT:
${ctx.join('\n')}
${plantDescription ? `\nDescription: ${plantDescription}` : ''}
Recovery: ${originalDiagnosis.recovery_timeline || 'N/A'}
Saveable: ${originalDiagnosis.is_saveable !== undefined ? (originalDiagnosis.is_saveable ? 'Yes' : 'Unlikely') : 'N/A'}

Be specific, practical, encouraging. 2-4 paragraphs.`,
      userLanguage
    );

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: 'user', content: question.trim() }]
    });

    const answer = message.content.find(item => item.type === 'text')?.text || 'No answer.';
    res.json({ answer: answer.trim() });

  } catch (error) {
    console.error('❌ Follow-up error:', error);
    res.status(500).json({ error: error.message || 'Follow-up failed.' });
  }
});


// ── Companion Planting Advisor (#4) ──
router.post('/plant-rescue/companions', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  console.log('✅ Companion Planting called');

  try {
    const { plants, climateZone, location, userLanguage } = req.body;

    if (!plants?.length || plants.length < 2) {
      return res.status(400).json({ error: 'Need at least 2 plants for companion analysis.' });
    }

    const plantList = plants.map(p => `- ${p.name} (${p.species})${p.lightNeeds ? ` | Light: ${p.lightNeeds}` : ''}${p.waterNeeds ? ` | Water: ${p.waterNeeds}` : ''}`).join('\n');

    const prompt = withLanguage(`You are an indoor plant placement expert. Analyze this collection and suggest optimal groupings.

PLANTS:
${plantList}
${climateZone ? `Climate: ${climateZone}` : ''}
${location ? `Setting: ${location}` : ''}

Return ONLY valid JSON:
{
  "groupings": [
    {
      "group_name": "Humidity Lovers",
      "plants": ["Plant Name 1", "Plant Name 2"],
      "reason": "Both need high humidity. Group near bathroom or use shared pebble tray."
    }
  ],
  "conflicts": [
    "Don't place Fern next to Cactus — fern needs humidity, cactus needs dry air"
  ],
  "suggestions": [
    "Consider adding a Spider Plant — thrives in same conditions as your Pothos and purifies air"
  ]
}

RULES:
- Group by compatible light, humidity, and watering needs
- Flag incompatible pairings with specific reasons
- Suggest 1-2 companion plants that complement the collection
- Be specific about WHERE to place groups (bathroom, windowsill, etc.)`, userLanguage);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }]
    });

    const textContent = message.content.find(item => item.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(textContent);

    let parsed;
    try { parsed = JSON.parse(cleaned); }
    catch {
      let repaired = cleaned.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
      try { parsed = JSON.parse(repaired); }
      catch { return res.status(500).json({ error: 'Parse failed.' }); }
    }

    console.log('✅ Companions:', { groupings: parsed.groupings?.length, conflicts: parsed.conflicts?.length });
    res.json(parsed);

  } catch (error) {
    console.error('❌ Companion error:', error);
    res.status(500).json({ error: error.message || 'Companion analysis failed.' });
  }
});


module.exports = router;
