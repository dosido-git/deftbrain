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

const SYSTEM_PROMPT = `You are LaundroMat, an AI laundry expert. You give specific, practical laundry advice — care instructions, stain treatment, and fabric guidance.

TONE: Practical, direct, slightly protective of people's clothes. Brief but specific.

RULES:
1. Be specific about temperatures, times, and techniques. "Cold water" not "appropriate temperature."
2. Err on the side of caution — better to wash something separately than ruin it.
3. For stain treatment, only recommend supplies people commonly have (dish soap, vinegar, baking soda, hydrogen peroxide, rubbing alcohol). No specialty products unless asked.
4. Always warn about dryer risks — more clothes are ruined by dryers than washers.
5. For care labels, identify standard laundry symbols and translate to plain English.
6. Time estimates should be realistic for the machine type specified.
7. Flag high-risk items clearly — shrinkage, color bleeding, and heat damage are the big three.

FORMAT: Always respond in valid JSON matching the schema requested. No markdown fences, no preamble. Pure JSON only.`;

router.post('/laundro-mat', async (req, res) => {
  try {
    const { action, loadDescription, machineType, stainType, stainCustom, fabric, stainAge, imageBase64 } = req.body;

    // ─── ADVISE: Full load analysis ───
    if (action === 'advise') {
      if (!loadDescription && !imageBase64) {
        return res.status(400).json({ error: 'Describe your load or upload a care label photo' });
      }

      console.log('🧺 LaundroMat: Load advice request');

      const contentBlocks = [];

      if (imageBase64) {
        const parsed = parseBase64Image(imageBase64);
        if (parsed && parsed.base64Data && parsed.base64Data.length > 100) {
          contentBlocks.push({
            type: 'image',
            source: { type: 'base64', media_type: parsed.mediaType, data: parsed.base64Data }
          });
          contentBlocks.push({
            type: 'text',
            text: 'The user uploaded a photo of a care label. Identify the laundry symbols and include them in your response as care_symbols.'
          });
        }
      }

      contentBlocks.push({
        type: 'text',
        text: `Analyze this laundry load and provide complete care advice.

LOAD DESCRIPTION: ${loadDescription || '(see care label photo above)'}
MACHINE TYPE: ${machineType || 'home'}

Return JSON:
{
  "load_assessment": "Brief overall assessment (1 sentence)",
  "separate_these": [
    { "item": "item name", "reason": "why it should be separate", "risk": "high|medium" }
  ],
  "safe_together": ["items that can be washed together"],
  "recommended_settings": {
    "cycle": "Normal/Delicate/Heavy Duty/etc",
    "temperature": "Cold/Warm/Hot",
    "spin": "Low/Medium/High",
    "detergent_notes": "Any detergent advice"
  },
  "drying_advice": [
    { "item": "item or group", "method": "specific drying instructions", "risk": "high|low" }
  ],
  "pre_treatment": [
    { "item": "item name", "tip": "pre-treatment advice if needed" }
  ],
  "time_estimate": {
    "wash_minutes": 35,
    "dry_minutes": 45
  },
  "quick_tip": "One bonus laundry tip relevant to this load",
  "care_symbols": [
    { "symbol": "emoji or description", "name": "Symbol name", "meaning": "Plain English meaning" }
  ]
}

Only include care_symbols if a care label photo was provided. separate_these and pre_treatment can be empty arrays if nothing needs flagging.`
      });

      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2500,
        system: withLanguage(SYSTEM_PROMPT, req.body.userLanguage),
        messages: [{ role: 'user', content: contentBlocks }]
      });

      const responseText = message.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
      const cleaned = cleanJsonResponse(responseText);

      try {
        const data = JSON.parse(cleaned);
        console.log('🧺 LaundroMat: Load advice generated');
        return res.json(data);
      } catch (e) {
        console.error('🧺 LaundroMat: Parse error:', e.message);
        return res.status(500).json({ error: 'Failed to parse advice response' });
      }
    }

    // ─── LABEL: Care label symbol identification ───
    if (action === 'label') {
      if (!imageBase64) {
        return res.status(400).json({ error: 'Care label photo required' });
      }

      console.log('🧺 LaundroMat: Care label scan request');

      const parsed = parseBase64Image(imageBase64);
      if (!parsed || !parsed.base64Data || parsed.base64Data.length < 100) {
        return res.status(400).json({ error: 'Invalid image data' });
      }

      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        system: withLanguage(SYSTEM_PROMPT, req.body.userLanguage),
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: parsed.mediaType, data: parsed.base64Data } },
            { type: 'text', text: `Identify all laundry care symbols visible in this care label photo. Translate each to plain English.

Return JSON:
{
  "load_assessment": "Summary of what this label is telling you (1-2 sentences)",
  "care_symbols": [
    { "symbol": "emoji or text representation", "name": "Symbol name", "meaning": "Plain English — what to do" }
  ],
  "recommended_settings": {
    "cycle": "Based on the label",
    "temperature": "Based on the label",
    "spin": "Based on the label",
    "detergent_notes": "Any relevant notes"
  },
  "drying_advice": [
    { "item": "this garment", "method": "Drying instructions from label", "risk": "high or low" }
  ],
  "quick_tip": "One practical tip based on this garment type"
}` }
          ]
        }]
      });

      const responseText = message.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
      const cleaned = cleanJsonResponse(responseText);

      try {
        const data = JSON.parse(cleaned);
        console.log(`🧺 LaundroMat: Identified ${(data.care_symbols || []).length} symbols`);
        return res.json(data);
      } catch (e) {
        console.error('🧺 LaundroMat: Label parse error:', e.message);
        return res.status(500).json({ error: 'Failed to parse label response' });
      }
    }

    // ─── STAIN: Urgent stain treatment ───
    if (action === 'stain') {
      if (!stainType && !stainCustom && !imageBase64) {
        return res.status(400).json({ error: 'Describe the stain or upload a photo' });
      }

      console.log(`🧺 LaundroMat: Stain SOS — ${stainType || stainCustom || 'photo'}`);

      const contentBlocks = [];

      if (imageBase64) {
        const parsed = parseBase64Image(imageBase64);
        if (parsed && parsed.base64Data && parsed.base64Data.length > 100) {
          contentBlocks.push({
            type: 'image',
            source: { type: 'base64', media_type: parsed.mediaType, data: parsed.base64Data }
          });
          contentBlocks.push({
            type: 'text',
            text: 'The user uploaded a photo of the stain. Identify the stain type and fabric if possible.'
          });
        }
      }

      contentBlocks.push({
        type: 'text',
        text: `Provide urgent stain treatment instructions.

STAIN TYPE: ${stainType || stainCustom || '(see photo above)'}
FABRIC: ${fabric || 'Unknown'}
STAIN AGE: ${stainAge || 'unknown'}

Use ONLY common household supplies (dish soap, white vinegar, baking soda, hydrogen peroxide, rubbing alcohol, cold/warm water, clean cloth). No specialty products.

Return JSON:
{
  "urgency": "How urgent — one sentence (e.g. 'Act now — coffee stains set within hours')",
  "what_you_need": ["item 1", "item 2"],
  "steps": [
    "Step 1 with specific details...",
    "Step 2..."
  ],
  "do_not": ["Don't do X — reason", "Don't do Y — reason"],
  "if_stain_is_set": "Alternative approach if the stain is already dried/set (1-2 sentences)",
  "success_probability": "Honest assessment: High/Medium/Low — brief explanation",
  "pro_tip": "One bonus tip (1 sentence)"
}`
      });

      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        system: withLanguage(SYSTEM_PROMPT, req.body.userLanguage),
        messages: [{ role: 'user', content: contentBlocks }]
      });

      const responseText = message.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
      const cleaned = cleanJsonResponse(responseText);

      try {
        const data = JSON.parse(cleaned);
        console.log(`🧺 LaundroMat: Stain advice generated — ${(data.steps || []).length} steps`);
        return res.json(data);
      } catch (e) {
        console.error('🧺 LaundroMat: Stain parse error:', e.message);
        return res.status(500).json({ error: 'Failed to parse stain response' });
      }
    }

    return res.status(400).json({ error: 'Invalid action. Use: advise, label, or stain' });

  } catch (error) {
    console.error('❌ LaundroMat error:', error.message);
    res.status(500).json({ error: error.message || 'Failed to process request' });
  }
});

module.exports = router;
