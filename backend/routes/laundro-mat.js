const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');
const { MODELS } = require('../lib/models');
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

// ── v2 post-generation check ────────────────────────────────────────────────
// Reviewed against backend/lib/outputStandard.js on 2026-09-01. The clause this
// tool kept failing is §8: the stain action said "bleach and heat have set this"
// in four separate fields, and the advise action said "wash the red shirt alone"
// in four more. So the check is deterministic and aimed at that: a tip field
// that only echoes a field above it is removed rather than shipped, which is
// what §7 asks for when a section has nothing of its own to do.
const TIP_FIELDS = ['quick_tip', 'pro_tip', 'prevention_tip'];

function significantWords(text) {
  return new Set(String(text || '').toLowerCase().match(/[a-z]{5,}/g) || []);
}

function validateResult(data) {
  if (!data || typeof data !== 'object') return data;
  // Everything the visitor already read, minus the tip fields themselves.
  const body = Object.entries(data)
    .filter(([k]) => !TIP_FIELDS.includes(k))
    .map(([, v]) => (typeof v === 'string' ? v : JSON.stringify(v)))
    .join(' ');
  const bodyWords = significantWords(body);
  for (const field of TIP_FIELDS) {
    const tip = data[field];
    if (typeof tip !== 'string' || !tip.trim()) continue;
    const tipWords = [...significantWords(tip)];
    if (tipWords.length < 4) continue;
    const overlap = tipWords.filter(w => bodyWords.has(w)).length / tipWords.length;
    // Four fifths of a one-sentence tip's own vocabulary already appearing
    // above is a restatement, not a tip.
    if (overlap >= 0.8) {
      console.log(`[laundro-mat] ${field} dropped — ${Math.round(overlap * 100)}% of it already appears in the result`);
      data[field] = '';
    }
  }
  return data;
}

const SYSTEM_PROMPT = `EACH FIELD MUST EARN ITS PLACE. Do not restate one conclusion across several fields — a headline, then a probability, then a tip, then a closing line is the same sentence in four costumes. If a field would only repeat what another field already says, return an empty string or an empty array for it.

You are LaundroMat, an AI laundry expert. You give specific, practical laundry advice — care instructions, stain treatment, and fabric guidance.

TONE: Practical, direct, slightly protective of people's clothes. Brief but specific.

Never place a double-quote (") character inside any JSON string value — it breaks the JSON.`;

// Valid care-symbol codes — MUST stay in sync with CARE_SYMBOLS in src/tools/LaundroMat.js
const CARE_CODE_REF = 'MW0=Machine Wash | MW1=Machine Wash Cold · 30°C | MW2=Machine Wash Warm · 40°C | MW3=Machine Wash Hot · 50°C | MW4=Cold Wash (1 dot) | MW5=Warm Wash (2 dots) | MW6=Hot Wash (3 dots) | MW7=Permanent Press | MW8=Gentle / Delicate Cycle | W0=Do Not Wash | W1=Hand Wash Only | W2=Do Not Wring | W3=Do Not Bleach | W4=Bleach As Needed | W5=Non-Chlorine Bleach Only | I0=Iron Cool · 110°C | I1=Iron Warm · 150°C | I2=Iron Hot · 200°C | I3=Do Not Iron | I4=Steam As Needed | I5=Do Not Steam | D0=Tumble Dry | D1=Do Not Tumble Dry | D2=Tumble Dry Low Heat | D3=Tumble Dry Medium Heat | D4=Tumble Dry High Heat | D5=Permanent Press (Dry) | D6=Gentle Cycle (Dry) | D7=Dry in Shade | D8=Dry Flat | D9=Drip Dry | D10=Line Dry | DC0=Dry Clean | DC1=Do Not Dry Clean';

router.post('/laundro-mat', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { action, loadDescription, machineType, stainType, stainCustom, fabric, stainAge, stainTreatment, imageBase64 } = req.body;

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

FACT CHECK: Never recommend vinegar or salt as dye fixatives for commercial fabrics — popular myth, they do not set modern dyes.

Return ONLY valid JSON. Format:
{
  "load_assessment": "Brief overall assessment (1 sentence) — 1-2 sentences",
  "separate_these": [
    { "item": "item name. Nothing else.", "reason": "why it should be separate — one sentence", "risk": "high|medium" }
  ],
  "safe_together": ["items that can be washed together"],
  "recommended_settings": {
    "cycle": "Normal/Delicate/Heavy Duty/etc. Nothing else.",
    "temperature": "Exactly one of these and nothing else: Cold, Warm, Hot",
    "spin": "Exactly one of these and nothing else: Low, Medium, High",
    "detergent_notes": "Any detergent advice — one sentence"
  },
  "drying_advice": [
    { "item": "item or group. Nothing else.", "method": "specific drying instructions — one sentence", "risk": "high|low" }
  ],
  "pre_treatment": [
    { "item": "item name. Nothing else.", "tip": "pre-treatment advice if needed — one sentence" }
  ],
  "time_estimate": {
    "wash_minutes": 35,
    "dry_minutes": 45
  },
  "quick_tip": "One sentence that adds something no other field already says — a non-obvious risk or habit specific to THIS load. Empty string if everything useful is already covered above.",
  "care_symbols": [
    { "code": "exact code from the CARE SYMBOL CODES list below — pick the closest match", "name": "Symbol name — 3-6 words", "meaning": "Plain English meaning — one sentence" }
  ]
}

Only include care_symbols if a care label photo was provided. separate_these and pre_treatment can be empty arrays if nothing needs flagging.

CARE SYMBOL CODES — identify EVERY symbol printed on the label and include all of them; never omit a symbol. For each, set "code" to the single closest match from this list (if none is exact, pick the nearest — never invent codes or emoji, never skip a symbol): ${CARE_CODE_REF}`
      });

      const data = await callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 4000,
        system: withLanguage(SYSTEM_PROMPT, req.body.userLanguage),
        messages: [{ role: 'user', content: contentBlocks }]
      }, { label: 'laundro-mat-advise' });

      if (!data.load_assessment && !data.advice) {
        return res.status(500).json({ error: 'Could not analyze your laundry. Please try again.' });
      }
      return res.json(validateResult(data));
    }

    // ─── LABEL: Care label symbol identification ───
    if (action === 'label') {
      if (!imageBase64) {
        return res.status(400).json({ error: 'Care label photo required' });
      }

      const img = parseBase64Image(imageBase64);
      if (!img || !img.base64Data || img.base64Data.length < 100) {
        return res.status(400).json({ error: 'Invalid image data' });
      }

      const data = await callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 4000,
        system: withLanguage(SYSTEM_PROMPT, req.body.userLanguage),
        messages: [{
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: img.mediaType, data: img.base64Data } },
            { type: 'text', text: `Identify all laundry care symbols visible in this care label photo. Translate each to plain English.

Return ONLY valid JSON. Format:
{
  "load_assessment": "Summary of what this label is telling you (1-2 sentences)",
  "care_symbols": [
    { "code": "exact code from the CARE SYMBOL CODES list below — pick the closest match", "name": "Symbol name — 3-6 words", "meaning": "Plain English — what to do — one sentence" }
  ],
  "recommended_settings": {
    "cycle": "Based on the label. Nothing else.",
    "temperature": "Based on the label. Nothing else.",
    "spin": "Based on the label. Nothing else.",
    "detergent_notes": "Any relevant notes — one sentence"
  },
  "drying_advice": [
    { "item": "this garment. Nothing else.", "method": "The drying instructions from the label, in one short sentence", "risk": "high or low — one sentence" }
  ],
  "quick_tip": "One sentence that adds something no other field already says. Empty string if everything useful is already covered above."
}

CARE SYMBOL CODES — identify EVERY symbol printed on the label and include all of them; never omit a symbol. For each, set "code" to the single closest match from this list (if none is exact, pick the nearest — never invent codes or emoji, never skip a symbol): ${CARE_CODE_REF}` }
          ]
        }]
      }, { label: 'laundro-mat-label' });

      if (!data.load_assessment && !data.advice) {
        return res.status(500).json({ error: 'Could not analyze your laundry. Please try again.' });
      }
      return res.json(validateResult(data));
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
STAIN STATE / AGE: ${stainAge || 'unknown'}
ALREADY TRIED: ${stainTreatment || 'Nothing supplied'}

If ALREADY TRIED is supplied, do not repeat an incompatible treatment and explain any important interaction risk. If the stain has already been heat-dried, account for that explicitly.

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
  "pro_tip": "One sentence that adds something no other field already says — not a restatement of the urgency line or of what to do if the stain is set. Empty string if everything useful is already covered above."
}`
      });

      const data = await callClaudeWithRetry({
        model: MODELS.FAST,
        max_tokens: 2000,
        system: withLanguage(SYSTEM_PROMPT, req.body.userLanguage),
        messages: [{ role: 'user', content: contentBlocks }]
      }, { label: 'laundro-mat-stain' });

      if (!data.urgency && !data.steps) {
        return res.status(500).json({ error: 'Could not analyze your laundry. Please try again.' });
      }
      return res.json(validateResult(data));
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

Be honest about what can and cannot realistically improve. Do not present recovery as a precise probability. Distinguish between improvement, partial reversibility, and full restoration.
Use recovery_outlook as one of exactly: "Good chance of improvement", "May improve somewhat", "Unlikely to reverse", "Do not try to reverse this at home".
Keep recoverable as a backward-compatible boolean: true for the first two outlooks, false for the last two.
Use only: cold/warm/hot water, white vinegar, baking soda, dish soap, hair conditioner, ice, a clean towel, a salad spinner, a hair dryer on cool setting.

Return ONLY valid JSON:
{
  "recoverable": true,
  "confidence": "high|medium|low",
  "recovery_outlook": "Good chance of improvement|May improve somewhat|Unlikely to reverse|Do not try to reverse this at home",
  "headline": "One direct sentence: 'Your wool sweater can be unshrunk — act in the next hour'",
  "rescue_steps": [
    "Step 1: Specific action with exact supplies, quantities, and technique",
    "Step 2: ..."
  ],
  "do_not": [
    "Don't do X — it will make it permanent because Y"
  ],
  "time_sensitive": true,
  "if_not_working": "What to try if main steps fail — one sentence",
  "when_to_stop": "At what point to accept defeat and repurpose the item — one sentence",
  "prevention_tip": "How to avoid this exact situation next time, in one sentence, without repeating a do_not item. Empty string if the do_not list already covers it."
}`
      });

      const data = await callClaudeWithRetry({
        model: MODELS.FAST,
        max_tokens: 2000,
        system: withLanguage(SYSTEM_PROMPT, req.body.userLanguage),
        messages: [{ role: 'user', content: contentBlocks }]
      }, { label: 'laundro-mat-rescue' });

      if (!('rescue_steps' in data) && !('recoverable' in data)) {
        return res.status(500).json({ error: 'Could not assess recovery options. Please try again.' });
      }
      return res.json(validateResult(data));
    }

    return res.status(400).json({ error: 'Invalid action. Use: advise, label, stain, or rescue' });

  } catch (error) {
    console.error('❌ LaundroMat error:', error.message);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.outputStandard = 'v2';
router.outputGuard = {
  prohibit: [
    'restates_one_conclusion_across_several_fields',
    'a_tip_field_that_only_repeats_a_field_above_it',
    'a_success_probability_or_grade_on_a_garment_it_has_never_seen',
    'presents_recovery_as_a_precise_probability_rather_than_an_outlook',
    'repeats_a_treatment_the_visitor_said_they_already_tried',
    'ignores_heat_setting_after_the_visitor_reports_drying_or_ironing',
    'scolds_the_visitor_for_how_the_damage_happened',
    'claims_a_result_is_comprehensive_tailored_or_carefully_considered',
  ],
  require: [
    'leads_with_what_to_do_not_with_preamble',
    'names_what_cannot_be_undone_plainly_rather_than_offering_false_hope',
    'gives_a_next_step_when_the_first_approach_fails',
    'fulfills_tool_promise',
  ],
};

module.exports = router;
