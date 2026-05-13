// mental-health-navigator.js
const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, cleanJsonResponse } = require('../lib/claude');
const { rateLimit } = require('../lib/rateLimiter');

const AREA_LABELS = {
  anxiety:      'anxiety / excessive worry',
  mood:         'low mood / depression',
  stress:       'stress / burnout',
  trauma:       'trauma / difficult past events',
  grief:        'grief / loss',
  addiction:    'addiction / compulsive habits',
  eating:       'eating or body image concerns',
  sleep:        'sleep problems',
  work:         'work / career stress',
  relationship: 'relationship difficulties',
  identity:     'identity / life direction / purpose',
  parenting:    'parenting / family challenges',
  medication:   'seeking diagnosis or medication support',
  general:      'general or unclear',
};

const TRIED_LABELS = {
  nothing:    'nothing yet',
  therapy:    'therapy or counseling',
  gp:         'GP / primary care doctor',
  medication: 'psychiatric medication',
  self_help:  'self-help books, apps, or online resources',
  crisis:     'crisis services',
};

const BARRIER_LABELS = {
  cost:       'cost / affordability',
  waitlists:  'long waitlists',
  stigma:     'stigma or privacy concerns',
  access:     'access or location barriers',
  language:   'language or cultural fit',
  unsure:     'not knowing where to start',
};

router.post('/stream', rateLimit(), async (req, res) => {
  const { situationAreas, freeform, triedBefore, barriers, country, userLanguage } = req.body;

  const areaList    = Array.isArray(situationAreas) && situationAreas.length
    ? situationAreas.map(a => AREA_LABELS[a] ?? a).join(', ')
    : null;

  if (!areaList && !freeform?.trim()) {
    return res.status(400).json({ error: 'Please select at least one area or describe your situation.' });
  }

  const triedList   = Array.isArray(triedBefore) && triedBefore.length
    ? triedBefore.map(t => TRIED_LABELS[t] ?? t).filter(t => t !== 'nothing yet').join(', ')
    : null;

  const barrierList = Array.isArray(barriers) && barriers.length
    ? barriers.map(b => BARRIER_LABELS[b] ?? b).filter(Boolean).join(', ')
    : null;

  const systemPrompt = withLanguage(
    `You are a knowledgeable and compassionate mental health navigator — not a therapist or diagnostician, but an informed guide who helps people understand what types of professional support exist, which might fit their situation, and how to access it. You are warm, non-judgmental, and practical. You never diagnose, never prescribe, and never minimize what someone is going through. You always return only valid JSON with no markdown, no code blocks, and no explanation outside the JSON object.`,
    userLanguage
  );

  const context = [
    areaList                      ? `Areas of concern: ${areaList}` : null,
    freeform?.trim()              ? `Person's description: ${freeform.trim()}` : null,
    triedList                     ? `Previously tried: ${triedList}` : null,
    barrierList                   ? `Barriers to access: ${barrierList}` : null,
    country?.trim()               ? `Country: ${country.trim()}` : null,
  ].filter(Boolean).join('\n');

  const prompt = `Help this person navigate toward the right mental health support based on their situation:

${context}

Return ONLY valid JSON with this exact structure:
{
  "what_you_described": <1-2 sentence warm, non-clinical reflection of what they've shared — help them feel heard>,
  "recommended_support": [
    {
      "type_name": <professional or support type — e.g. "Licensed therapist (CBT-focused)", "Psychiatrist", "GP / Primary care doctor", "Peer support group", "Crisis line">,
      "why": <1-2 sentence explanation of why this fits their specific situation — cite what they shared>,
      "what_to_expect": <brief description of what working with this type of support is actually like>,
      "how_to_find": <practical guidance on how to find this type of support — specific to their country if provided>,
      "cost_note": <brief note on typical cost range or insurance — country-specific if possible, null if unknown>
    }
  ],
  "what_to_say": [<specific sentence or phrase to say when first contacting a professional — removes the intimidation of not knowing what to say — max 3>],
  "barriers_addressed": [<specific, practical response to one of their stated barriers — e.g. "For cost: many therapists offer sliding scale fees" — only include if they stated barriers — max 3>],
  "immediate_steps": [<specific action to take in the next 48 hours — ordered by ease of access — max 4>]
}

Guidelines:
- recommended_support: list 2-3 options, ordered by best fit. First option should be primary recommendation.
- Be specific to their country when provided — name actual resources, directories, or services where possible
- Never suggest anything that requires diagnosis to access (e.g. don't say "take medication") — stay in navigation/access territory
- what_to_say: these are actual words they can use — "Hi, I'm looking for support with anxiety that's been affecting my sleep and work" is better than "ask about their approach"
- immediate_steps: think about what someone can do TODAY, not eventually — searching a directory, calling a GP, downloading an app, calling a warmline
- Tone: warm, practical, not clinical. This person is probably nervous about reaching out.
- Return ONLY the JSON object`;

  try {
    const result = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 1800,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = cleanJsonResponse(result);
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return res.status(500).json({ error: 'Failed to parse guidance. Please try again.' });
    }

    if (!parsed?.what_you_described || !Array.isArray(parsed?.recommended_support)) {
      return res.status(500).json({ error: 'Unexpected response format. Please try again.' });
    }

    res.json({
      what_you_described:  parsed.what_you_described,
      recommended_support: parsed.recommended_support,
      what_to_say:         Array.isArray(parsed.what_to_say)         ? parsed.what_to_say         : [],
      barriers_addressed:  Array.isArray(parsed.barriers_addressed)  ? parsed.barriers_addressed  : [],
      immediate_steps:     Array.isArray(parsed.immediate_steps)     ? parsed.immediate_steps     : [],
    });
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: 'Navigation failed. Please try again.' });
    }
  }
});

module.exports = router;
