const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

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

TONE: Practical, direct, slightly protective of people's clothes. Brief but specific.`;

// Valid care-symbol codes — MUST stay in sync with CARE_SYMBOLS in src/tools/LaundroMat.js
const CARE_CODE_REF = 'MW0=Machine Wash | MW1=Machine Wash Cold · 30°C | MW2=Machine Wash Warm · 40°C | MW3=Machine Wash Hot · 50°C | MW4=Cold Wash (1 dot) | MW5=Warm Wash (2 dots) | MW6=Hot Wash (3 dots) | MW7=Permanent Press | MW8=Gentle / Delicate Cycle | W0=Do Not Wash | W1=Hand Wash Only | W2=Do Not Wring | W3=Do Not Bleach | W4=Bleach As Needed | W5=Non-Chlorine Bleach Only | I0=Iron Cool · 110°C | I1=Iron Warm · 150°C | I2=Iron Hot · 200°C | I3=Do Not Iron | I4=Steam As Needed | I5=Do Not Steam | D0=Tumble Dry | D1=Do Not Tumble Dry | D2=Tumble Dry Low Heat | D3=Tumble Dry Medium Heat | D4=Tumble Dry High Heat | D5=Permanent Press (Dry) | D6=Gentle Cycle (Dry) | D7=Dry in Shade | D8=Dry Flat | D9=Drip Dry | D10=Line Dry | DC0=Dry Clean | DC1=Do Not Dry Clean';

router.post('/laundro-mat', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { action, loadDescription, machineType, stainType, stainCustom, fabric, stainAge, imageBase64 } = req.body;

    // ─── ADVISE: Full load analysis ───
    if (action === 'advise') {
      if (!loadDescription && !imageBase64) {
        return res.status(400).json({ error: 'Describe your load or upload a care label photo' });
      }

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

Return ONLY valid JSON. Format:
{
  "load_assessment": "Brief overall assessment (1 sentence) — 1-2 sentences",
  "separate_these": [
    { "item": "item name — one sentence", "reason": "why it should be separate — one sentence", "risk": "high|medium" }
  ],
  "safe_together": ["items that can be washed together"],
  "recommended_settings": {
    "cycle": "Normal/Delicate/Heavy Duty/etc — one sentence",
    "temperature": "Cold/Warm/Hot (number)",
    "spin": "Low/Medium/High — one sentence",
    "detergent_notes": "Any detergent advice — one sentence"
  },
  "drying_advice": [
    { "item": "item or group — one sentence", "method": "specific drying instructions — one sentence", "risk": "high|low" }
  ],
  "pre_treatment": [
    { "item": "item name — one sentence", "tip": "pre-treatment advice if needed — one sentence" }
  ],
  "time_estimate": {
    "wash_minutes": 35,
    "dry_minutes": 45
  },
  "quick_tip": "One bonus laundry tip relevant to this load — one sentence",
  "care_symbols": [
    { "code": "exact code from the CARE SYMBOL CODES list below — pick the closest match", "name": "Symbol name — 3-6 words", "meaning": "Plain English meaning — one sentence" }
  ]
}

Only include care_symbols if a care label photo was provided. separate_these and pre_treatment can be empty arrays if nothing needs flagging.

CARE SYMBOL CODES — identify EVERY symbol printed on the label and include all of them; never omit a symbol. For each, set "code" to the single closest match from this list (if none is exact, pick the nearest — never invent codes or emoji, never skip a symbol): ${CARE_CODE_REF}`
      });

      let message;
      for (let _att = 1; _att <= 3; _att++) {
        try {
          message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        system: withLanguage(SYSTEM_PROMPT, req.body.userLanguage),
        messages: [{ role: 'user', content: contentBlocks }]
      });
          break;
        } catch (_e) {
          if (_att === 3) throw _e;
          await new Promise(r => setTimeout(r, 1000 * _att));
        }
      }

      const responseText = message.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
      const cleaned = cleanJsonResponse(responseText);

      try {
        const data = JSON.parse(cleaned);
        if (!data.load_assessment && !data.advice) {
          return res.status(500).json({ error: 'Could not analyze your laundry. Please try again.' });
        }
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

      const parsed = parseBase64Image(imageBase64);
      if (!parsed || !parsed.base64Data || parsed.base64Data.length < 100) {
        return res.status(400).json({ error: 'Invalid image data' });
      }

      let message;
      for (let _att = 1; _att <= 3; _att++) {
        try {
          message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 4000,
        system: withLanguage(SYSTEM_PROMPT, req.body.userLanguage),
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: parsed.mediaType, data: parsed.base64Data } },
            { type: 'text', text: `Identify all laundry care symbols visible in this care label photo. Translate each to plain English.

Return ONLY valid JSON. Format:
{
  "load_assessment": "Summary of what this label is telling you (1-2 sentences)",
  "care_symbols": [
    { "code": "exact code from the CARE SYMBOL CODES list below — pick the closest match", "name": "Symbol name — 3-6 words", "meaning": "Plain English — what to do — one sentence" }
  ],
  "recommended_settings": {
    "cycle": "Based on the label — one sentence",
    "temperature": "Based on the label (number)",
    "spin": "Based on the label — one sentence",
    "detergent_notes": "Any relevant notes — one sentence"
  },
  "drying_advice": [
    { "item": "this garment — one sentence", "method": "Drying instructions from label — one sentence", "risk": "high or low — one sentence" }
  ],
  "quick_tip": "One practical tip based on this garment type — one sentence"
}

CARE SYMBOL CODES — identify EVERY symbol printed on the label and include all of them; never omit a symbol. For each, set "code" to the single closest match from this list (if none is exact, pick the nearest — never invent codes or emoji, never skip a symbol): ${CARE_CODE_REF}` }
          ]
        }]
      });
          break;
        } catch (_e) {
          if (_att === 3) throw _e;
          await new Promise(r => setTimeout(r, 1000 * _att));
        }
      }

      const responseText = message.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
      const cleaned = cleanJsonResponse(responseText);

      try {
        const data = JSON.parse(cleaned);
        if (!data.load_assessment && !data.advice) {
          return res.status(500).json({ error: 'Could not analyze your laundry. Please try again.' });
        }
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

Return ONLY valid JSON. Format:
{
  "urgency": "How urgent — one sentence (e.g. 'Act now — coffee stains set within hours')",
  "what_you_need": ["item 1", "item 2"],
  "steps": [
    "Step 1 with specific details...",
    "Step 2..."
  ],
  "do_not": ["Don't do X — reason", "Don't do Y — reason"],
  "if_stain_is_set": "Alternative approach if the stain is already dried/set (1-2 sentences)",
  "success_probability": "Honest assessment: High/Medium/Low — brief explanation — one sentence",
  "pro_tip": "One bonus tip (1 sentence) — one sentence"
}`
      });

      let message;
      for (let _att = 1; _att <= 3; _att++) {
        try {
          message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        system: withLanguage(SYSTEM_PROMPT, req.body.userLanguage),
        messages: [{ role: 'user', content: contentBlocks }]
      });
          break;
        } catch (_e) {
          if (_att === 3) throw _e;
          await new Promise(r => setTimeout(r, 1000 * _att));
        }
      }

      const responseText = message.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
      const cleaned = cleanJsonResponse(responseText);

      try {
        const data = JSON.parse(cleaned);
        if (!data.urgency && !data.steps) {
          return res.status(500).json({ error: 'Could not analyze your laundry. Please try again.' });
        }
        return res.json(data);
      } catch (e) {
        console.error('🧺 LaundroMat: Stain parse error:', e.message);
        return res.status(500).json({ error: 'Failed to parse stain response' });
      }
    }

    // ─── RESCUE: Disaster recovery for ruined garments ───
    if (action === 'rescue') {
      const { disasterType, itemDescription, material, timeAgo, severity } = req.body;
      if (!disasterType && !itemDescription && !imageBase64) {
        return res.status(400).json({ error: 'Describe what happened or upload a photo' });
      }

      const contentBlocks = [];

      if (imageBase64) {
        const parsed = parseBase64Image(imageBase64);
        if (parsed && parsed.base64Data && parsed.base64Data.length > 100) {
          contentBlocks.push({
            type: 'image',
            source: { type: 'base64', media_type: parsed.mediaType, data: parsed.base64Data }
          });
          contentBlocks.push({ type: 'text', text: 'The user uploaded a photo of the damaged garment. Assess the damage visible in the photo.' });
        }
      }

      contentBlocks.push({
        type: 'text',
        text: `A garment has been damaged. Give honest, specific recovery advice using only common household supplies.

WHAT HAPPENED: ${disasterType || '(see photo)'}
ITEM: ${itemDescription || 'Not specified'}
MATERIAL: ${material || 'Unknown'}
TIME SINCE INCIDENT: ${timeAgo || 'Unknown'}
SEVERITY: ${severity || 'Unknown'}

Be honest about success probability. Some garments cannot be saved — say so clearly rather than give false hope.
CONSISTENCY: "recoverable", "confidence", and "success_probability" MUST agree. "success_probability" (High/Medium/Low) must match "confidence" (high/medium/low). If "recoverable" is false, both must be Low. Never give a high/medium probability for an item you call unrecoverable.
Use only: cold/warm/hot water, white vinegar, baking soda, dish soap, hair conditioner, ice, a clean towel, a salad spinner, a hair dryer on cool setting.

Return ONLY valid JSON:
{
  "recoverable": true,
  "confidence": "high|medium|low",
  "headline": "One direct sentence: 'Your wool sweater can be unshrunk — act in the next hour'",
  "rescue_steps": [
    "Step 1: Specific action with exact supplies, quantities, and technique",
    "Step 2: ..."
  ],
  "do_not": [
    "Don't do X — it will make it permanent because Y"
  ],
  "success_probability": "High|Medium|Low",
  "time_sensitive": true,
  "if_not_working": "What to try if main steps fail — one sentence",
  "when_to_stop": "At what point to accept defeat and repurpose the item — one sentence",
  "prevention_tip": "How to avoid this exact situation next time — one sentence"
}`
      });

      let message;
      for (let _att = 1; _att <= 3; _att++) {
        try {
          message = await anthropic.messages.create({
            model: 'claude-haiku-4-5-20251001',
            max_tokens: 2000,
            system: withLanguage(SYSTEM_PROMPT, req.body.userLanguage),
            messages: [{ role: 'user', content: contentBlocks }]
          });
          break;
        } catch (_e) {
          if (_att === 3) throw _e;
          await new Promise(r => setTimeout(r, 1000 * _att));
        }
      }

      const responseText = message.content.filter(b => b.type === 'text').map(b => b.text).join('\n');
      const cleaned = cleanJsonResponse(responseText);

      try {
        const data = JSON.parse(cleaned);
        if (!('rescue_steps' in data) && !('recoverable' in data)) {
          return res.status(500).json({ error: 'Could not assess recovery options. Please try again.' });
        }
        return res.json(data);
      } catch (e) {
        console.error('🧺 LaundroMat: Rescue parse error:', e.message);
        return res.status(500).json({ error: 'Failed to parse rescue response' });
      }
    }

    return res.status(400).json({ error: 'Invalid action. Use: advise, label, stain, or rescue' });

  } catch (error) {
    console.error('❌ LaundroMat error:', error.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
