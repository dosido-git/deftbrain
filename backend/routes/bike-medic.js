const express = require('express');
const router = express.Router();
const { anthropic, callClaudeWithRetry, cleanJsonResponse, withLanguage } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ════════════════════════════════════════════════════════════
// BIKE MEDIC V2 — Backend Route
// Three call types: freeform diagnosis, post-fix follow-up, symptom routing
// Supports optional photo attachment for visual diagnosis
// ════════════════════════════════════════════════════════════

const MECHANIC_PERSONA = `You are an expert bicycle mechanic with 20+ years of shop experience across road, mountain, gravel, BMX, commuter, e-bike, and single-speed/fixie bikes. You've seen every failure mode, every weird noise, and every trail-side hack. You diagnose problems the way a great mechanic does: listen to the rider's description, ask yourself what the most likely cause is based on probability, and give clear, jargon-appropriate instructions.

IMPORTANT RULES:
- Be specific: "turn the barrel adjuster 1/4 turn counter-clockwise" not "adjust the cable tension"
- Include actual tool sizes: "5mm Allen key" not "hex wrench"
- If the fix is beyond home mechanic skill, say so clearly and estimate shop cost
- Always assess ride safety — can they ride home or is the bike unsafe?
- Use plain English but don't dumb it down. Riders are smart, they just need direction.
- For severity: "low" = cosmetic or minor annoyance, "moderate" = affects performance or comfort, "critical" = safety risk or bike is unrideable
- Be honest about what's DIY-able vs shop-only. Don't set someone up for failure.`;

// Helper: build message content with optional photo
function buildMessageContent(textPrompt, photo) {
  if (!photo) return textPrompt;
  // photo is a base64 data URL
  const match = photo.match(/^data:(image\/\w+);base64,(.+)$/);
  if (!match) return textPrompt;
  return [
    { type: 'image', source: { type: 'base64', media_type: match[1], data: match[2] } },
    { type: 'text', text: textPrompt },
  ];
}

router.post('/bike-medic', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { symptom, context, mode, bikeProfile, photo } = req.body;

    // ── TYPE 4: Seasonal Maintenance Wizard ──
    if (mode === 'seasonal') {
      if (!bikeProfile) {
        return res.status(400).json({ error: 'Bike profile required for seasonal check' });
      }

      const season = context?.season || 'spring';
      const recentRides = context?.recentRides || [];
      const ridesContext = recentRides.length > 0
        ? `\nRECENT RIDES: ${recentRides.map(r => `${r.distance}mi (${r.conditions})`).join(', ')}`
        : '';

      const seasonalUserPrompt = `You are generating a SEASONAL MAINTENANCE CHECKLIST for a cyclist.

CURRENT SEASON: ${season}
BIKE: ${bikeProfile.name || bikeProfile.bikeType || 'unknown'} — type: ${bikeProfile.bikeType || '?'}, brakes: ${bikeProfile.brakeType || '?'}, shifting: ${bikeProfile.shiftType || '?'}, tires: ${bikeProfile.tireSetup || '?'}
TOTAL MILEAGE: ~${bikeProfile.totalMiles || 0} miles${ridesContext}

Generate a personalized seasonal maintenance checklist. Consider:
- The season and likely weather conditions
- The bike type and components
- The rider's mileage (more miles = more wear)
- Recent riding conditions (wet/muddy rides need more attention)
- What specific tasks are most important for THIS bike RIGHT NOW

Return ONLY valid JSON:
{
  "title": "Season + Year Maintenance Checklist",
  "summary": "One-sentence overview of priorities for this season",
  "tasks": [
    {
      "task": "Specific maintenance task",
      "reason": "Why this matters right now for this bike",
      "priority": "high | medium | low",
      "fix_ref": "fix_id from our fix database or null if no matching guide"
    }
  ]
}

Available fix_ref IDs: fix_noise_chainlube, fix_chain_worn, fix_disc_pad_worn, fix_disc_squeal, fix_tubeless_refresh, fix_ghost_shift, fix_headset_loose, fix_headset_gritty, fix_bb_creak, fix_noise_creak, fix_true_wheel, fix_hub_play, fix_clipless, fix_rim_weak

Generate 6-10 tasks, ordered by priority. Be specific to the bike and season.`;

      const parsed = await callClaudeWithRetry(seasonalUserPrompt, {
        label: 'bike-medic/seasonal',
        max_tokens: 1500,
        system: withLanguage(MECHANIC_PERSONA, req.body.userLanguage),
      });
      return res.json(parsed);
    }

    // ── TYPE 3: Symptom Routing ──
    if (mode === 'route') {
      if (!symptom || symptom.trim().length < 5) {
        return res.status(400).json({ error: 'Describe the problem in a few words' });
      }

      const routeUserPrompt = `AVAILABLE PROBLEM CATEGORIES: flat (flat tire / puncture), chain (dropped chain / chain issues), brakes (brake problems), shifting (shifting / derailleur), headset (wobbly handlebars / steering), noise (strange noises), pedals (pedal/crank/bottom bracket), wheel (wheel problems / spokes / hub), tubeless (tubeless tire setup issues), suspension (fork/shock issues)

RIDER SAYS: "${symptom.trim()}"
${bikeProfile ? `RIDER'S BIKE: ${bikeProfile.bikeType || 'unknown'} with ${bikeProfile.brakeType || 'unknown'} brakes, ${bikeProfile.shiftType || 'unknown'} shifting, ${bikeProfile.tireSetup || 'unknown'} tires` : ''}

Based on this description, which problem category should they start troubleshooting in? Think about probability — what's the MOST LIKELY category, not just one that could match.

Return ONLY valid JSON:
{
  "recommended_category": "category_id from list above",
  "confidence": 0.0 to 1.0,
  "reasoning": "One sentence explaining why this category fits",
  "alternative_categories": ["second_best", "third_best"],
  "suggested_first_question": "A good diagnostic question to ask the rider"
}`;

      const parsed = await callClaudeWithRetry(routeUserPrompt, {
        label: 'bike-medic/route',
        max_tokens: 500,
        system: withLanguage(MECHANIC_PERSONA, req.body.userLanguage),
      });
      return res.json(parsed);
    }

    // ── Validation for Types 1 & 2 ──
    if (!symptom || symptom.trim().length < 10) {
      return res.status(400).json({
        error: 'Please describe the problem in more detail (at least 10 characters)'
      });
    }

    let prompt;
    const bikeContext = bikeProfile
      ? `RIDER'S BIKE: ${bikeProfile.bikeType || 'unknown'} with ${bikeProfile.brakeType || 'unknown'} brakes, ${bikeProfile.shiftType || 'unknown'} shifting, ${bikeProfile.tireSetup || 'unknown'} tires`
      : '';
    const photoNote = photo ? '\n\nThe rider has also attached a photo of the problem. Examine the image carefully for visual clues about the issue — wear patterns, alignment, damage, contamination, etc.' : '';

    // ── TYPE 2: Post-Fix Follow-up ──
    if (context && context.fix_attempted) {
      prompt = withLanguage(`${MECHANIC_PERSONA}

SITUATION: The rider already attempted a standard fix and it DIDN'T WORK. They need you to think deeper — beyond the obvious causes.

FIX THEY ATTEMPTED: "${context.fix_attempted}"
PROBLEM CATEGORY: ${context.problem_category || 'unknown'}
TREE PATH TAKEN: ${context.tree_path ? context.tree_path.join(' > ') : 'unknown'}
${context.steps_completed ? `STEPS THEY COMPLETED:\n${context.steps_completed.map((s, i) => `${i + 1}. ${s}`).join('\n')}` : ''}

WHAT THE RIDER SAYS NOW: "${symptom.trim()}"
${bikeContext}${photoNote}

IMPORTANT: The obvious fix has been tried. Think about LESS COMMON causes:
- Is there a related component that could be the real culprit?
- Could the symptom have a different root cause than assumed?
- Is there a setup or installation error in what they already did?
- Does the bike need a different tool or technique than the standard approach?
- Should they go to a shop for this?

Return ONLY valid JSON:
{
  "diagnosis": "What's actually wrong (different from what they already tried)",
  "severity": "low | moderate | critical",
  "ride_safe": true/false,
  "explanation": "2-3 sentences explaining why the first fix didn't work and what the real issue likely is",
  "likely_causes": ["Most probable deeper cause", "Second possibility", "Third possibility"],
  "fix_steps": ["Step 1 with specific detail", "Step 2 etc."],
  "tools_needed": ["Specific tools with sizes"],
  "difficulty": "easy | moderate | advanced | shop-only",
  "time_estimate": "estimate",
  "parts_cost": "cost estimate",
  "pro_tip": "Insider tip for this specific deeper issue",
  "shop_visit": "When to give up DIY and go to a shop (or null if fully DIY-able)",
  "prevention": "How to prevent this in the future",
  "next_steps": ["Prioritized action 1", "Action 2", "Action 3"],
  "related_issues": ["Other things to check while they're at it"]
}`, req);

    } else {
      // ── TYPE 1: Freeform Diagnosis ──
      prompt = withLanguage(`${MECHANIC_PERSONA}

RIDER'S DESCRIPTION: "${symptom.trim()}"
${bikeContext}${photoNote}

Diagnose the most likely cause and provide a clear, step-by-step fix. Start with the most common/probable cause, not the most dramatic one.

Return ONLY valid JSON:
{
  "diagnosis": "Short, clear name for the problem",
  "severity": "low | moderate | critical",
  "ride_safe": true/false,
  "explanation": "2-3 sentence plain-English explanation of what's happening mechanically",
  "likely_causes": ["Most probable cause (60%+ of cases)", "Second most likely", "Third possibility"],
  "fix_steps": ["Step 1 with specific detail and tool sizes", "Step 2", "Step 3", "Final verification"],
  "tools_needed": ["Specific tool with size"],
  "difficulty": "easy | moderate | advanced | shop-only",
  "time_estimate": "5-10 min (or similar)",
  "parts_cost": "$0 (adjustment only) or cost estimate",
  "pro_tip": "One insider tip that saves time, money, or prevents recurrence",
  "shop_visit": "When to take to a shop (or null if fully DIY-able)",
  "prevention": "How to prevent this in the future (1-2 sentences)",
  "next_steps": ["Prioritized action 1", "Action 2 if that doesn't work", "Action 3 / shop fallback"],
  "related_issues": ["Other things to check while you're at it"]
}

Return ONLY valid JSON. No markdown, no explanation outside the JSON.`, req);
    }

    // ── Types 1 & 2: Freeform Diagnosis + Post-Fix Follow-up ──
    // NOTE: These use anthropic.messages.create directly (not callClaudeWithRetry) because
    // the photo attachment path requires a multipart content array (image + text blocks).
    // callClaudeWithRetry accepts a string prompt only. Refactor once lib supports multipart.
    const messageContent = buildMessageContent(prompt, photo);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: messageContent }]
    });

    const textContent = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = JSON.parse(cleanJsonResponse(textContent));

    res.json(parsed);

  } catch (error) {
    console.error('Bike Medic error:', error);
    res.status(500).json({
      error: error.message || 'Failed to diagnose bike problem'
    });
  }
});

module.exports = router;
