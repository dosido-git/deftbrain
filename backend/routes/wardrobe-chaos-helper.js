const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ─── Helper: build wardrobe description for prompt ───
// Warmth and fitFeel are optional per-item fields the user may not have
// filled in — only mentioned when actually supplied, never inferred.
function buildWardrobeDescription(wardrobeInventory) {
  return Object.entries(wardrobeInventory)
    .map(([category, items]) => {
      if (!items || items.length === 0) return null;
      const itemsList = items.map(item => {
        const details = [item.name];
        if (item.color) details.push(`(${item.color})`);
        if (item.style) details.push(`[${item.style}]`);
        details.push(`comfort: ${item.comfortLevel}/10`);
        if (item.warmth) details.push(`warmth: ${item.warmth}`);
        if (item.fitFeel) details.push(`fit: ${item.fitFeel}`);
        if (item.sensoryNotes) details.push(`sensory notes: ${item.sensoryNotes}`);
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
// Color is listed as a plain fact for the model to mention only when it
// materially helps distinguish two otherwise-similar options — never as
// color-theory advice ("cohesive combos") the model has no basis to give.
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
    colorGuidance = `\n\nCOLORS PRESENT (fact only, not a style rule): ${dominantColors.join(', ')}. Mention color only when it materially helps distinguish the options — never as a claim that colors are "cohesive," "flattering," or otherwise objectively coordinated.`;
  }

  const underutilized = allItems
    .filter(item => !item.wearCount || item.wearCount < 2)
    .map(item => item.name).slice(0, 5);

  let wearGuidance = '';
  if (underutilized.length > 0) {
    wearGuidance = `\n\nLOWER PRIORITY — VARIETY: when equally suitable alternatives exist, these items have been worn least: ${underutilized.join(', ')}. Use this only as a tie-breaker after hard constraints, comfort, and practical fit are already satisfied.`;
  }

  const wornRecently = allItems
    .filter(item => {
      if (!item.lastWorn) return false;
      return Math.floor((Date.now() - new Date(item.lastWorn).getTime()) / 86400000) < 2;
    })
    .map(item => item.name);

  let recencyGuidance = '';
  if (wornRecently.length > 0) {
    recencyGuidance = `\n\nRECENCY AVOIDANCE:\nAvoid these (worn in last 2 days) unless the wardrobe is too limited to avoid them: ${wornRecently.join(', ')}`;
  }

  return { colorGuidance, wearGuidance, recencyGuidance };
}

// ─── Helper: build sensory + comfort context ───
// No "prioritize style" framing — comfort priority shifts which comfort-
// rated items to lean toward, not an aesthetic judgment call.
function buildSensoryContext(sensoryNeeds, comfortPriority) {
  const requirements = [];
  if (sensoryNeeds?.softFabrics) requirements.push('Only soft, non-scratchy fabrics');
  if (sensoryNeeds?.looseFit) requirements.push('Loose, non-restrictive fit');
  if (sensoryNeeds?.noTags) requirements.push('No tags or seams');
  if (sensoryNeeds?.avoidTextures) requirements.push(`Avoid: ${sensoryNeeds.avoidTextures}`);

  const sensoryContext = requirements.length > 0
    ? `\n\nSENSORY REQUIREMENTS (hard constraint): ${requirements.join('; ')}. Only mark an outfit sensory-compatible if every item's actual data (sensory notes, or the absence of any conflicting detail) supports it — if an item has no sensory notes at all, its compatibility is unknown, not assumed fine.`
    : '';

  const priority = Number(comfortPriority) || 5;
  let comfortGuidance;
  if (priority >= 8) comfortGuidance = 'Comfort priority is HIGH: favor the wardrobe\'s higher comfort-rated items over lower-rated ones when both are otherwise suitable.';
  else if (priority >= 4) comfortGuidance = 'Comfort priority is MODERATE: comfort ratings are one factor among several, not the deciding one.';
  else comfortGuidance = 'Comfort priority is LOW: other factors (activity fit, laundry availability, variety) may outweigh comfort ratings today.';

  return { sensoryContext, comfortGuidance };
}

// ─── Helper: build feedback context ───
// Interpreted at the item/combo level — a like or dislike is about THAT
// combination, not evidence of a general "style" the user has.
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
    ctx += `\n\nPAST COMBO FEEDBACK — user marked these combinations as working well: ${loved.join(', ')}. Treat this as a signal about those specific pieces together, not a general style preference to extrapolate from.`;
  }
  if (neverAgain.length > 0) {
    ctx += `\nPast combo feedback — user marked these as not working: ${neverAgain.join(', ')}. Avoid repeating that exact combination; do not assume it means avoiding the individual pieces entirely.`;
  }
  return ctx;
}

// Shared instructions reused across all three endpoints — the tool's
// actual job (reduce the search space) and what it must never fabricate.
const CORE_PERSONALITY = `You are Wardrobe Chaos Helper, a practical outfit-selection assistant.

Your job is to reduce decision load by finding workable combinations from the user's actual wardrobe. Use only the information supplied in the wardrobe and today's context. Do not act as a fashion authority and do not pretend there is one objectively best outfit.

FACT DISCIPLINE
Do not invent fabric properties, fit, weight, warmth, breathability, stretch, structure, condition, or sensory qualities unless the wardrobe data actually supplies them. A name such as "wool blazer" does not establish that it is lightweight or unstructured. A "button-down" does not establish that it will be cool enough in warm weather. A high comfort score does not tell you why the item is comfortable. If suitability depends on information the user has not supplied, say so briefly rather than guessing.

STYLE DISCIPLINE
Do not assign objective style scores or make unsupported claims such as: timeless, elegant, sophisticated, flattering, confident, polished, modern, powerful, effortless, or appropriate for nearly any occasion. You may explain a visible or data-supported relationship such as: the colors are similar or contrasting; the pieces are all marked casual; the outfit uses the user's higher-comfort items; the outfit avoids recently worn items; the outfit fits the stated activity better than another option.

MOOD
Treat the user's desired feeling (when supplied) as a preference, not something clothing can guarantee. Do not claim "you will look confident" or "this outfit makes you approachable." Say instead that an option leans more dressed-up, relaxed, simple, or low-effort when that follows from the stored item styles.

Never place a double-quote (") character inside any JSON string value — it breaks the JSON.`;

// Model sometimes marks outfits sensory-compatible despite containing an
// avoided texture — enforce in code: any item mentioning an avoided
// texture loses the flag, regardless of what the model claimed.
const enforceAvoidTextures = (outfits, avoidTextures) => {
  if (!Array.isArray(outfits) || !avoidTextures) return outfits;
  const tokens = String(avoidTextures).toLowerCase().split(/[,;/]|\band\b/).map(t => t.trim()).filter(t => t.length >= 3);
  if (!tokens.length) return outfits;
  return outfits.map(o => {
    const text = Object.values(o.items || {}).concat([o.why_today || '']).join(' ').toLowerCase();
    if (tokens.some(t => text.includes(t))) {
      return { ...o, sensory_compatible: false };
    }
    return o;
  });
};

// ═══════════════════════════════════════════════════
//  POST /wardrobe-chaos-helper — Main outfit generation
// ═══════════════════════════════════════════════════
router.post('/wardrobe-chaos-helper', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { wardrobeInventory, weather, activities, mood, comfortPriority, sensoryNeeds, outfitFeedback, userLanguage } = req.body;

    if (!wardrobeInventory || typeof wardrobeInventory !== 'object' || Array.isArray(wardrobeInventory)) {
      return res.status(400).json({ error: 'Wardrobe inventory is required' });
    }
    const totalItems = Object.values(wardrobeInventory).reduce((sum, items) => sum + (Array.isArray(items) ? items.length : 0), 0);
    if (totalItems < 3) return res.status(400).json({ error: `Need at least 3 items. Currently have ${totalItems}.` });
    if (!weather) return res.status(400).json({ error: 'Weather is required' });
    if (!activities || !Array.isArray(activities) || activities.length === 0) return res.status(400).json({ error: 'At least one activity is required' });
    // Mood is optional: the tool has a much stronger job with weather,
    // activity, comfort, and sensory constraints than with interpreting an
    // abstract desired feeling.

    const wardrobeDescription = buildWardrobeDescription(wardrobeInventory);
    const { colorGuidance, wearGuidance, recencyGuidance } = buildContextGuidance(wardrobeInventory);
    const { sensoryContext, comfortGuidance } = buildSensoryContext(sensoryNeeds, comfortPriority);
    const feedbackContext = buildFeedbackContext(outfitFeedback);

    // Neutral, factual per-activity notes — no aesthetic or emotional
    // promises ("attractive and confident" for a date is exactly the kind
    // of unsupported claim STYLE DISCIPLINE forbids).
    const activityReqs = [
      activities.includes('work') || activities.includes('meeting') ? '- Workplace context: pieces marked professional/formal fit better than pieces marked casual, if the wardrobe distinguishes them.' : '',
      activities.includes('exercise') ? '- Movement is involved: favor pieces that do not restrict movement, if fit data is available.' : '',
      activities.includes('event') ? '- A more formal occasion: pieces marked dressier fit better than everyday basics, if the wardrobe distinguishes them.' : '',
      activities.includes('casual') ? '- No formality requirement.' : '',
      activities.includes('home') ? '- No public-facing requirement; comfort can be weighted highest.' : '',
      activities.includes('date') ? '- No objective requirement beyond the user\'s own stated comfort priority and mood, if supplied — do not assume what reads as "attractive."' : ''
    ].filter(Boolean).join('\n');

    const prompt = withLanguage(`${CORE_PERSONALITY}

PRIORITIES, in order:
1. Hard constraints first: only use listed items; respect laundry status (only items in the wardrobe below are available — assume all are clean unless told otherwise elsewhere), weather, sensory restrictions, and explicit activity requirements.
2. User comfort next: use the stored comfort ratings and stated comfort priority.
3. Practical fit: choose combinations appropriate to today's activity and weather.
4. Preference signals: use prior likes/dislikes and recent-wear history when available.
5. Variety last: avoid unnecessary repetition when equally suitable alternatives exist.

USER'S WARDROBE:
${wardrobeDescription}

TODAY'S CONTEXT:
- Weather: ${weather}
- Activities: ${activities.join(', ')}
${mood ? `- Desired feeling (a preference, not a guarantee): ${mood}` : '- Desired feeling: not specified — do not invent one.'}
- Comfort priority: ${comfortPriority}/10 (1=other factors matter more, 10=comfort matters most)
${sensoryContext}

GUIDANCE:
${comfortGuidance}
${colorGuidance}
${wearGuidance}
${recencyGuidance}
${feedbackContext}

ACTIVITY NOTES:
${activityReqs}

Return up to three outfit options:
- BEST FIT: the strongest overall match for today's constraints.
- EASIEST: the lowest-decision or highest-comfort option that still works for the day.
- ALTERNATIVE: a meaningfully different option using other suitable pieces — include this only when the wardrobe actually supports a genuinely different combination; omit it rather than force a weak third option.

Then return ONE complete outfit as "just_dress_me" — a single line, no alternatives, for someone who does not want to think about it at all.

Return ONLY valid JSON:
{
  "outfits": [
    {
      "role": "best_fit",
      "items": { "top": "exact item name or null", "bottom": "exact item name or null", "dress": "exact item name or null", "shoes": "exact item name or null", "outerwear": "exact item name or null", "accessories": [] },
      "why_today": "One short, grounded explanation using only what the wardrobe data and today's context actually support.",
      "check": "Optional uncertainty or practical caution the user should know about, otherwise null"
    },
    {
      "role": "easiest",
      "items": {},
      "why_today": "",
      "check": null
    },
    {
      "role": "alternative",
      "items": {},
      "why_today": "",
      "check": null
    }
  ],
  "just_dress_me": "One complete outfit in one line."
}

RULES:
1. ONLY use items explicitly listed in the wardrobe above.
2. Match weather and the activity notes above.
3. Respect sensory requirements strictly — never claim sensory compatibility an item's actual data doesn't support.
4. Avoid items marked WORN TODAY or WORN YESTERDAY unless the wardrobe is too limited to avoid them.
5. Do not include comfort_rating, style_rating, confidence_boost, color_coordination, or any numeric style score — none of those exist in this schema.
6. Do not suggest items to buy or shop for anywhere in this response.
7. "alternative" may be omitted (send only 2 outfits) if the wardrobe doesn't support a genuinely different third option — do not force one.
8. Keep every field concise.
9. Never place a double-quote (") character inside any JSON string value.`, userLanguage || 'en') + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

    const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'wardrobe-chaos-helper' });

    if (!Array.isArray(parsed.outfits) || !parsed.outfits.length || !parsed.just_dress_me) {
      throw new Error('Invalid response — missing outfits or just_dress_me');
    }
    parsed.outfits = enforceAvoidTextures(parsed.outfits, sensoryNeeds?.avoidTextures);
    res.json(parsed);
  } catch (error) {
    console.error('Wardrobe Chaos Helper error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
//  POST /wardrobe-chaos-helper/regenerate — Swap piece or regenerate
// ═══════════════════════════════════════════════════
router.post('/wardrobe-chaos-helper/regenerate', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { wardrobeInventory, weather, activities, mood, comfortPriority, sensoryNeeds, currentOutfit, swapPiece, outfitFeedback, userLanguage } = req.body;

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
      instruction = `Replace only the ${swapPiece} in this outfit, keeping every other piece fixed: ${currentItems}
Choose a DIFFERENT ${swapPiece} that satisfies the same hard constraints (weather, sensory needs, activity) as the original. Do NOT use "${currentOutfit.items[swapPiece]}". Only mention a tradeoff in why_today if it is actually material — a same-quality swap needs no justification beyond naming the new piece.`;
    } else {
      instruction = `Create a meaningfully different outfit than this one: ${currentItems}
Use different items where the wardrobe supports it, while still satisfying the same hard constraints.`;
    }

    const prompt = withLanguage(`${CORE_PERSONALITY}

${instruction}

WARDROBE:
${wardrobeDescription}

CONTEXT: Weather ${weather}, Activities: ${(activities || []).join(', ')}${mood ? `, Desired feeling (a preference, not a guarantee): ${mood}` : ''}, Comfort priority ${comfortPriority}/10
${sensoryContext}
${comfortGuidance}
${recencyGuidance}
${feedbackContext}

Return ONLY valid JSON:
{
  "outfit": {
    "items": { "top": "name or null", "bottom": "name or null", "dress": "name or null", "shoes": "name or null", "outerwear": "name or null", "accessories": [] },
    "why_today": "One short, grounded explanation. If this was a single-piece swap, mention the change only if the tradeoff is material.",
    "check": "Optional uncertainty or practical caution, otherwise null"
  }
}

RULES:
1. ONLY use items from the wardrobe above.
2. Do not include comfort_rating, style_rating, confidence_boost, or color_coordination — none of those exist in this schema.
3. Keep every field concise.
4. Never place a double-quote (") character inside any JSON string value.`, userLanguage || 'en') + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

    const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'wardrobe-chaos-helper-regen' });

    if (!parsed.outfit) throw new Error('Invalid response — missing outfit');
    res.json(parsed);
  } catch (error) {
    console.error('Wardrobe regenerate error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
//  POST /wardrobe-chaos-helper/pack — Packing plan generator
// ═══════════════════════════════════════════════════
router.post('/wardrobe-chaos-helper/pack', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { wardrobeInventory, destination, days, tripType, outfitFeedback, userLanguage } = req.body;

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
      casual: 'Everyday, mix-and-match pieces.',
      business: 'Include professional pieces the wardrobe actually has.',
      mixed: 'A mix of professional and casual pieces the wardrobe actually has.',
      adventure: 'Favor durable, movement-friendly pieces if the wardrobe distinguishes them; layers help with unknown conditions.',
      formal: 'Include at least one dressier outfit the wardrobe actually has.'
    }[tripType] || 'Mix-and-match pieces from the wardrobe.';

    const prompt = withLanguage(`${CORE_PERSONALITY}

Build the smallest practical clothing set from the user's existing wardrobe for the stated trip. Prioritize, in order: rewearability, activity coverage, weather suitability, comfort, and compatibility among pieces.

Do not invent destination weather or climate. Weather/forecast for this trip was NOT supplied — say plainly, in the uncertainty field, that this plan assumes the user will verify conditions before packing.

WARDROBE:
${wardrobeDescription}

TRIP: ${destination}, ${numDays} day(s), trip type: ${tripType || 'casual'}. ${tripTypeGuidance}
${feedbackContext}

Use ONLY wardrobe items. Do not recommend purchases anywhere in this response, even to fill a gap — note the gap in the uncertainty field instead if it's material.

Return ONLY valid JSON:
{
  "pack_these": ["exact item name from the wardrobe", "..."],
  "wear_plan": [
    { "day": 1, "items": { "top": "exact name or null", "bottom": "exact name or null", "dress": "exact name or null", "shoes": "exact name or null", "outerwear": "exact name or null", "accessories": [] } }
  ],
  "uncertainty": "One thing the user should verify before packing (e.g. actual weather), or null if there's genuinely nothing to flag"
}

RULES:
1. ONLY use items from the wardrobe.
2. Maximize reuse — one bottom paired with 3 tops is 3 outfits from 4 items.
3. Create one wear_plan entry per day, at most ${numDays}.
4. At most 15 items in pack_these.
5. Do not invent destination weather — reflect the uncertainty field's guidance above.
6. Do not recommend purchases anywhere in this response.
7. Keep every field concise.
8. Never place a double-quote (") character inside any JSON string value.`, userLanguage || 'en') + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

    const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'wardrobe-chaos-helper-pack' });

    if (!Array.isArray(parsed.pack_these) || !parsed.pack_these.length) {
      throw new Error('Invalid response — missing pack_these');
    }
    res.json(parsed);
  } catch (error) {
    console.error('Wardrobe packing error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
