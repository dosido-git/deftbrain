const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const PERSONALITY = `Apology calibration expert — part therapist, part communication coach. Full spectrum from 'you're over-apologizing' to 'this needs serious repair.' Warm but direct. Never shame — most people were never taught how to apologize well.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`

// ════════════════════════════════════════════════════════════
// POST /apology-calibrator — Main calibration
// ════════════════════════════════════════════════════════════
router.post('/apology-calibrator', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { whatHappened, relationship, situation, userLanguage } = req.body;
    if (!whatHappened?.trim()) return res.status(400).json({ error: 'Please describe what happened.' });

    const systemPrompt = `${PERSONALITY}

Analyze the situation and calibrate the appropriate apology level. Be specific about THIS situation — don't give generic advice.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`;

    const userPrompt = `CALIBRATE THIS APOLOGY:
What happened: ${whatHappened}
${relationship ? `Relationship: ${relationship}` : ''}
${situation ? `Context: ${situation}` : ''}

Return ONLY valid JSON:
{
  "appropriate_apology_level": 3,
  "level_name": "Simple apology — 3-6 words",
  "level_emoji": "🟡",
  "why_this_level": "Clear explanation of why this level is right for this situation — one sentence",

  "situation_analysis": {
    "what_actually_happened": "Objective summary of the situation — one sentence",
    "actual_harm_caused": "What impact this had on the other person — one sentence",
    "your_responsibility_level": "high|medium|low|none",
    "intent_vs_impact": "Your intent may have been X, but the impact was Y — one sentence",
    "relationship_context": "How the relationship affects the apology — 1-2 sentences"
  },

  "apology_templates": [
    {
      "option": "The actual words to say — one sentence",
      "tone": "brief|sincere|formal|vulnerable",
      "when_to_use": "When this version is the right choice — one sentence",
      "strength": "Why this one works — one sentence"
    }
  ],

  "what_NOT_to_say": [
    {
      "phrase": "The bad phrase — one sentence",
      "why_its_bad": "What's wrong with it — one sentence"
    }
  ],

  "if_youre_over_apologizing": {
    "applies": true,
    "reality_check": "Honest assessment of whether this warrants the level of guilt they're feeling — one sentence",
    "reframe": "What to say instead of sorry — one sentence",
    "permission": "Permission statement — it's OK to not apologize for this — one sentence"
  },

  "if_youre_under_apologizing": {
    "applies": false,
    "reality_check": "Why this is bigger than they think — one sentence",
    "what_to_add": "What's missing from their apology approach — one sentence",
    "repair_actions": "Concrete things to do beyond words — one sentence"
  },

  "follow_up": {
    "needed": true,
    "what": "What follow-up action to take — one sentence",
    "when": "When to do it — one sentence",
    "behavior_change": "What to do differently going forward — one sentence"
  }
}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'apology-calibrator' });
    if (!parsed.level_name) {
      return res.status(500).json({ error: 'Could not calibrate the apology. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('ApologyCalibrator error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /apology-calibrator/detect — Sorry-Not-Sorry Detector
// ════════════════════════════════════════════════════════════
router.post('/apology-calibrator/detect', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { draft, context, userLanguage } = req.body;
    if (!draft?.trim()) return res.status(400).json({ error: 'Paste your apology draft.' });

    const systemPrompt = `${PERSONALITY}

You are analyzing a draft apology message. Flag every problem: non-apologies, deflections, over-apologies, missing elements, toxic phrases, and unnecessary self-flagellation. Then rewrite it to actually land.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`;

    const userPrompt = `ANALYZE THIS APOLOGY DRAFT:
"${draft}"
${context ? `Context: ${context}` : ''}

Return ONLY valid JSON:
{
  "overall_grade": "A|B|C|D|F",
  "overall_emoji": "✅|🟡|🟠|🔴|💀",
  "one_line_verdict": "One sentence summary of how this apology reads",

  "flags": [
    {
      "type": "non_apology|deflection|over_apology|missing_element|self_flagellation|passive_aggressive|excuse",
      "text": "The exact problematic phrase from the draft — one sentence",
      "problem": "What's wrong with it — one sentence",
      "fix": "What to say instead — one sentence"
    }
  ],

  "missing_elements": [
    {
      "element": "acknowledgment|ownership|impact|change_commitment|specificity",
      "description": "What's missing and why it matters — 1-2 sentences"
    }
  ],

  "whats_good": ["Things the draft does right — always find something positive"],

  "rewritten": "The complete rewritten apology — same general message but actually effective. Keep the person's voice and intent, just fix the problems. — one sentence",

  "delivery_note": "One tip about how to deliver this (text vs call vs in person, timing, etc.) — one sentence"
}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'apology-calibrator/detect' });
    if (!parsed.overall_grade) {
      return res.status(500).json({ error: 'Could not calibrate the apology. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('ApologyCalibrator detect error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /apology-calibrator/delivery — Delivery coach
// ════════════════════════════════════════════════════════════
router.post('/apology-calibrator/delivery', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { whatHappened, relationship, apologyText, userLanguage } = req.body;
    if (!whatHappened?.trim()) return res.status(400).json({ error: 'Describe the situation.' });

    const systemPrompt = `${PERSONALITY}

You are coaching someone on HOW to deliver their apology. The words matter, but delivery matters more. Consider: timing, medium, setting, body language, what to do if they react badly, and what comes after.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`;

    const userPrompt = `DELIVERY PLAN:
Situation: ${whatHappened}
${relationship ? `Relationship: ${relationship}` : ''}
${apologyText ? `Their planned apology: "${apologyText}"` : ''}

Return ONLY valid JSON:
{
  "when": {
    "timing": "When to deliver the apology — specific advice — one sentence",
    "too_soon_risk": "What happens if they apologize too soon — one sentence",
    "too_late_risk": "What happens if they wait too long — one sentence",
    "ideal_window": "The sweet spot — one sentence"
  },
  "how": {
    "best_medium": "In person|Phone call|Video call|Text|Email|Handwritten note",
    "why_this_medium": "Why this is the right channel for this situation — one sentence",
    "avoid_medium": "What channel to NOT use and why — one sentence"
  },
  "setting": {
    "where": "Where to have this conversation — one sentence",
    "tip": "Setting-specific tip — one sentence"
  },
  "opening_line": "The exact first sentence to say — one sentence",
  "body_language": ["2-3 specific body language tips for this apology"],
  "if_they_react_badly": {
    "anger": "What to do if they get angry — one sentence",
    "silence": "What to do if they go quiet — one sentence",
    "dismissal": "What to do if they brush it off — one sentence"
  },
  "if_they_say_its_fine": "How to respond when they say 'it's fine' but you're not sure it is — one sentence",
  "after_the_apology": {
    "next_24_hours": "What to do in the next day — one sentence",
    "next_week": "How to follow up — one sentence",
    "long_term": "What behavior change demonstrates the apology was real — 3-6 words"
  },
  "common_mistake": "The #1 mistake people make when delivering this type of apology — one sentence"
}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'apology-calibrator/delivery' });
    if (!parsed.when) {
      return res.status(500).json({ error: 'Could not calibrate the apology. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('ApologyCalibrator delivery error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /apology-calibrator/audit — Over-apologizing pattern analysis
// ════════════════════════════════════════════════════════════
router.post('/apology-calibrator/audit', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { situations, userLanguage } = req.body;
    if (!situations?.length) return res.status(400).json({ error: 'Add at least one situation.' });

    const systemPrompt = `${PERSONALITY}

You are analyzing a PATTERN of apology situations — not just one. Look for: chronic over-apologizing, chronic under-apologizing, specific triggers, relationship patterns, and give compassionate but honest feedback. Many people apologize reflexively for things that don't warrant an apology — help them see the pattern without shaming them.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`;

    const sitList = situations.map((s, i) => `${i + 1}. "${s.text}"${s.didApologize ? ' (they apologized)' : ' (they didn\'t apologize)'}`).join('\n');

    const userPrompt = `APOLOGY AUDIT — analyze these situations:
${sitList}

Return ONLY valid JSON:
{
  "pattern": "over_apologizer|under_apologizer|well_calibrated|mixed",
  "pattern_emoji": "🔴|🟡|🟢|🔵",
  "pattern_summary": "2-3 sentence summary of their pattern",

  "situations_analysis": [
    {
      "situation": "Brief reference to the situation — one sentence",
      "warranted_level": 1,
      "their_response": "apologized|didnt_apologize",
      "calibration": "over|under|right",
      "one_line": "One sentence verdict"
    }
  ],

  "stats": {
    "total": 5,
    "over_apologized": 3,
    "under_apologized": 0,
    "well_calibrated": 2,
    "didnt_need_apology": 3
  },

  "triggers": ["Specific patterns — what types of situations trigger unnecessary apologies"],
  "reframes": [
    {
      "instead_of": "Sorry for [common thing they over-apologize for] — one sentence",
      "try": "Alternative phrasing that's not an apology — one sentence"
    }
  ],
  "deeper_insight": "One compassionate insight about why they might have this pattern — without diagnosing — one sentence",
  "one_thing_to_practice": "The single most impactful thing they could practice this week — one sentence"
}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'apology-calibrator/audit' });
    if (!parsed.pattern) {
      return res.status(500).json({ error: 'Could not calibrate the apology. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('ApologyCalibrator audit error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /apology-calibrator/cultural — Cultural calibration
// ════════════════════════════════════════════════════════════
router.post('/apology-calibrator/cultural', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { whatHappened, culture, relationship, setting, userLanguage } = req.body;
    if (!whatHappened?.trim() || !culture?.trim()) {
      return res.status(400).json({ error: 'Describe the situation and the cultural context.' });
    }

    const systemPrompt = `${PERSONALITY}

You are analyzing apology norms across cultures. Be specific and nuanced — avoid stereotypes while acknowledging real cultural differences in: formality expectations, hierarchy sensitivity, public vs private apologies, physical gestures, gift-giving as repair, and how "saving face" works differently across cultures. Always be respectful of all cultures.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`;

    const userPrompt = `CULTURAL CALIBRATION:
Situation: ${whatHappened}
Cultural context: ${culture}
${relationship ? `Relationship: ${relationship}` : ''}
${setting ? `Setting: ${setting}` : ''}

Return ONLY valid JSON:
{
  "culture_context": "${culture}",
  "cultural_norms": {
    "public_vs_private": "Whether this should be public or private — one sentence"
  },
  "what_this_culture_expects": "Specific expectations for this type of situation in this cultural context — one sentence",
  "what_might_surprise_you": "Something about apology norms in this culture that outsiders often get wrong — one sentence",
  "adapted_apology": {
    "words": "Culturally appropriate apology text — one sentence",
    "delivery": "How to deliver it in this cultural context — one sentence",
    "gestures": "Any physical gestures, gifts, or actions expected — one sentence",
    "timing": "When is appropriate in this culture — one sentence"
  },
  "avoid": ["Things that would be inappropriate or offensive in this cultural context"],
  "if_cross_cultural": "If the apologizer and recipient are from different cultures, how to bridge the gap — one sentence",
  "key_phrases": [
    {
      "english": "I'm sorry for... — one sentence",
      "local": "Translation if applicable — one sentence",
      "note": "Usage note — one sentence"
    }
  ]
}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'apology-calibrator/cultural' });
    if (!parsed.culture_context) {
      return res.status(500).json({ error: 'Could not calibrate the apology. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('ApologyCalibrator cultural error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /apology-calibrator/decode — "Was That Even an Apology?" Decoder
// ════════════════════════════════════════════════════════════
router.post('/apology-calibrator/decode', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { theirWords, context, relationship, userLanguage } = req.body;
    if (!theirWords?.trim()) return res.status(400).json({ error: 'Paste what they said to you.' });

    const systemPrompt = `${PERSONALITY}

You are analyzing an apology someone RECEIVED — not one they're giving. The person is trying to figure out: was that a real apology, or was it manipulation, deflection, or performance? Be specific about what makes it genuine or not. Help them decide how to respond — not by telling them what to feel, but by giving them clarity about what actually happened in those words.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`;

    const userPrompt = `DECODE THIS APOLOGY:
What they said: "${theirWords}"
${context ? `Context: ${context}` : ''}
${relationship ? `Relationship: ${relationship}` : ''}

Return ONLY valid JSON:
{
  "verdict": "genuine|mostly_genuine|mixed|performative|deflective|guilt_trip|non_apology|manipulative",
  "verdict_emoji": "✅|🟡|🟠|🎭|🪞|😰|❌|🚩",
  "verdict_label": "Short human-readable label — 2-4 words",
  "one_line": "One sentence summary of what this apology actually is",

  "breakdown": [
    {
      "phrase": "Exact quote from their words — one sentence",
      "reads_as": "What this phrase actually communicates — one sentence",
      "flag": "genuine|deflection|blame_shift|minimizing|guilt_trip|conditional|vague|performative|none",
      "flag_emoji": "✅|🪞|👈|📏|😰|⚠️|🌫️|🎭|—"
    }
  ],

  "whats_real": ["Things about this apology that ARE genuine — always find something if possible"],
  "whats_missing": ["Elements that a real apology would have included but this one doesn't"],

  "what_a_real_apology_would_sound_like": "What they WOULD have said if they were truly taking accountability — in their voice, same situation — one sentence",

  "your_options": [
    {
      "option": "accept|accept_with_boundary|push_back|table_it|walk_away",
      "label": "Short label — one sentence",
      "what_to_say": "Exact words for this response — one sentence",
      "when_this_fits": "When this is the right choice — one sentence"
    }
  ],

  "pattern_warning": "If this sounds like a pattern (repeated non-apologies, DARVO, etc.), flag it gently — or null if not applicable — one sentence",
  "emotional_validation": "Acknowledge how receiving a non-apology or bad apology feels — validate without catastrophizing — one sentence"
}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'apology-calibrator/decode' });
    if (!parsed.verdict) {
      return res.status(500).json({ error: 'Could not calibrate the apology. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('ApologyCalibrator decode error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /apology-calibrator/practice — Apology Practice Mode
// ════════════════════════════════════════════════════════════
router.post('/apology-calibrator/practice', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { situation, relationship, mode, history, userLanguage } = req.body;
    if (!situation?.trim()) return res.status(400).json({ error: 'Describe the situation to practice.' });

    const systemPrompt = `${PERSONALITY}

You are role-playing as the person receiving an apology so the user can PRACTICE before the real conversation. You respond in-character based on the relationship and situation.

MODE: ${mode === 'hard' ? 'HARD — You are hurt, skeptical, not making this easy. You push back, go quiet, or get emotional. Make them earn it.' : 'NORMAL — You are open to hearing them out but not a pushover. You react naturally — some defensiveness, some openness.'}

After each exchange, break character briefly to coach them: what landed, what felt off, what to adjust. Then get back in character for the next round.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`;

    const historyText = history?.length > 0
      ? history.map(h => `${h.role === 'user' ? 'THEM (practicing)' : 'YOU (in character)'}: ${h.text}`).join('\n')
      : '';

    const userPrompt = history?.length > 0
      ? `PRACTICE SESSION CONTINUES:
Situation: ${situation}
Relationship: ${relationship || 'unspecified'}
Mode: ${mode || 'normal'}

Previous exchanges:
${historyText}

Their latest attempt: "${history[history.length - 1]?.text}"

Return ONLY valid JSON:
{
  "in_character_response": "Your response as the person receiving the apology — stay in character, react naturally — one sentence",
  "emotion": "angry|hurt|skeptical|guarded|softening|receptive|crying|cold|dismissive",
  "emotion_emoji": "😠|😢|🤨|🛡️|🫤|😊|😭|🧊|🤷",
  "body_language": "Brief description of their body language/tone — one sentence",

  "coaching": {
    "what_landed": "What worked in their latest attempt — one sentence",
    "what_felt_off": "What didn't work or felt inauthentic — one sentence",
    "try_next": "Specific suggestion for their next response — one sentence",
    "progress": "improving|steady|struggling"
  },

  "conversation_over": false,
  "final_verdict": null
}`
      : `START PRACTICE SESSION:
Situation: ${situation}
Relationship: ${relationship || 'unspecified'}
Mode: ${mode || 'normal'}

Set the scene. Respond as the person who was wronged — give the user an opening to practice their apology.

Return ONLY valid JSON:
{
  "scene_setting": "Brief description of the moment — where you are, what just happened, the tension in the air — one sentence",
  "in_character_response": "Your opening line as the wronged person — you might be confronting them, giving them the cold shoulder, or waiting for them to speak — one sentence",
  "emotion": "angry|hurt|skeptical|guarded|cold|dismissive|waiting",
  "emotion_emoji": "😠|😢|🤨|🛡️|🧊|🤷|⏳",
  "body_language": "Brief description of their body language/tone — one sentence",

  "coaching": {
    "tip_before_starting": "One piece of advice before they begin their apology — one sentence",
    "watch_for": "The key thing to pay attention to in this person's reactions — one sentence"
  },

  "conversation_over": false,
  "final_verdict": null
}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'apology-calibrator/practice' });
    if (!parsed.in_character_response) {
      return res.status(500).json({ error: 'Could not calibrate the apology. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('ApologyCalibrator practice error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /apology-calibrator/forgive — Forgiveness Navigator
// ════════════════════════════════════════════════════════════
router.post('/apology-calibrator/forgive', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { whatTheyDid, theirApology, relationship, howYouFeel, userLanguage } = req.body;
    if (!whatTheyDid?.trim()) return res.status(400).json({ error: 'Describe what happened.' });

    const systemPrompt = `${PERSONALITY}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`;

    const userPrompt = `FORGIVENESS NAVIGATION:
What they did: ${whatTheyDid}
${theirApology ? `Their apology: "${theirApology}"` : 'No apology given (or inadequate one)'}
${relationship ? `Relationship: ${relationship}` : ''}
${howYouFeel ? `How I feel: ${howYouFeel}` : ''}

Return ONLY valid JSON:
{
  "situation_read": "Empathetic summary of the situation from their perspective — show you understand — one sentence",
  "emotional_validation": "Validate what they're feeling without minimizing or catastrophizing — one sentence",

  "forgiveness_clarity": {
    "what_forgiveness_means_here": "What forgiveness would actually look like in THIS specific situation — not the generic definition — one sentence",
    "what_forgiveness_does_NOT_mean": "Common misconceptions about forgiving in this context — one sentence",
    "forgiving_vs_reconciling": "The difference between forgiving this person and letting them back in — one sentence"
  },

  "apology_assessment": {
    "quality": "genuine|partial|inadequate|absent|manipulative",
    "whats_there": "What their apology gets right, if anything — one sentence",
    "whats_missing": "What you'd need to hear that you haven't heard — one sentence",
    "is_enough_to_work_with": true
  },

  "what_you_might_need": [
    {
      "need": "A specific thing they might need from the other person — one sentence",
      "how_to_ask_for_it": "Exact words to request this — one sentence",
      "if_they_cant_give_it": "What that means for the path forward — one sentence"
    }
  ],

  "paths_forward": [
    {
      "path": "accept_and_rebuild|accept_with_boundaries|forgive_from_distance|not_yet|not_ever",
      "label": "Human-readable label — one sentence",
      "what_it_looks_like": "Concrete description of choosing this path — one sentence",
      "what_to_say": "Words for communicating this choice — one sentence",
      "trade_offs": "What you gain and what you risk — one sentence"
    }
  ],

  "if_youre_not_ready": "Compassionate message about the validity of not being ready to forgive — one sentence",
  "one_thing_to_sit_with": "A reflective question or insight to help them process — not advice, just something to think about — one sentence"
}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'apology-calibrator/forgive' });
    if (!parsed.situation_read) {
      return res.status(500).json({ error: 'Could not calibrate the apology. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('ApologyCalibrator forgive error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /apology-calibrator/roadmap — Relationship Repair Roadmap
// ════════════════════════════════════════════════════════════
router.post('/apology-calibrator/roadmap', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { whatHappened, relationship, currentState, effortSoFar, userLanguage } = req.body;
    if (!whatHappened?.trim()) return res.status(400).json({ error: 'Describe what happened.' });

    const systemPrompt = `${PERSONALITY}

You are creating a MULTI-WEEK relationship repair roadmap for situations where a single apology isn't enough. The trust has been seriously damaged and needs a sustained, intentional rebuild. Be realistic — some damage takes months. Give concrete weekly actions, not platitudes. Include milestones and red flags. This is the long game.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`;

    const userPrompt = `REPAIR ROADMAP:
What happened: ${whatHappened}
${relationship ? `Relationship: ${relationship}` : ''}
${currentState ? `Current state of things: ${currentState}` : ''}
${effortSoFar ? `What I've done so far: ${effortSoFar}` : ''}

Return ONLY valid JSON:
{
  "damage_assessment": {
    "severity": "minor|moderate|serious|severe|critical",
    "severity_emoji": "🟡|🟠|🔴|💔|🚨",
    "what_was_broken": "Specifically what trust/bond was damaged — one sentence",
    "realistic_timeline": "Honest estimate of how long repair takes — one sentence",
    "can_this_be_fully_repaired": "Honest assessment — sometimes the answer is 'not to what it was, but to something new' — one sentence"
  },

  "common_mistakes": [
    {
      "mistake": "Thing people do wrong during repair — one sentence",
      "why_its_tempting": "Why it feels like the right thing — one sentence",
      "what_to_do_instead": "The better approach — one sentence"
    }
  ],

  "roadmap": [
    {
      "phase": "Week 1|Weeks 2-3|Month 2|Months 3-6|Ongoing",
      "title": "Phase name — 3-6 words",
      "focus": "What this phase is about — one sentence",
      "actions": ["Specific concrete things to do"],
      "say_this": "Example of something to communicate during this phase — one sentence",
      "avoid_this": "What NOT to do during this phase — one sentence",
      "milestone": "How you know this phase was successful — one sentence",
      "if_its_not_working": "What to try if they're not responding to your efforts — one sentence"
    }
  ],

  "trust_rebuilding_signals": [
    {
      "signal": "A sign that trust is rebuilding — one sentence",
      "what_it_looks_like": "Concrete example of this signal — one sentence",
      "dont_rush_it": "Why not to force this signal — one sentence"
    }
  ],

  "red_flags_to_watch": ["Signs that repair isn't working and you may need to reassess"],

  "hardest_truth": "The one thing they probably don't want to hear but need to — delivered with compassion — one sentence",
  "daily_practice": "One small daily action that compounds over time — one sentence"
}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      // 5-phase nested roadmap is the largest schema here — 3000 truncated mid-array
      // (deterministic parse-fail on all retries → 500). 4500 clears the ~4000 it needs.
      max_tokens: 4500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'apology-calibrator/roadmap' });
    if (!parsed.damage_assessment) {
      return res.status(500).json({ error: 'Could not calibrate the apology. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('ApologyCalibrator roadmap error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /apology-calibrator/letter — Apology Letter Builder
// ════════════════════════════════════════════════════════════
router.post('/apology-calibrator/letter', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { whatHappened, relationship, tone, additionalContext, userLanguage } = req.body;
    if (!whatHappened?.trim()) return res.status(400).json({ error: 'Describe what happened.' });

    const systemPrompt = `${PERSONALITY}

Build a structured apology LETTER for situations too serious or difficult for in-person delivery. Each section serves a purpose. Generate multiple versions in different voices so they can choose what feels most authentic.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`;

    const userPrompt = `BUILD AN APOLOGY LETTER:
What happened: ${whatHappened}
${relationship ? `Relationship: ${relationship}` : ''}
${tone ? `Preferred tone: ${tone}` : ''}
${additionalContext ? `Additional context: ${additionalContext}` : ''}

Return ONLY valid JSON:
{
  "letter_approach": "Brief explanation of the approach you're taking and why — one sentence",

  "structure_guide": {
    "opening": "What the opening should accomplish — no excuses, no preamble — one sentence",
    "acknowledgment": "What to acknowledge specifically — show you understand what you did — one sentence",
    "impact": "Show you understand how it affected them — this is where empathy lives — one sentence",
    "accountability": "Own it without qualifiers, buts, or explanations that sound like excuses — one sentence",
    "commitment": "What you'll do differently — be specific and realistic — one sentence"
  },

  "versions": [
    {
      "tone": "vulnerable|direct|formal|brief|heartfelt",
      "tone_label": "Descriptive label for this version — 2-4 words",
      "letter": "The complete letter — ready to send. Formatted with paragraphs. Natural voice, not robotic. — 2-4 sentences",
      "best_for": "When this version is the right choice — one sentence",
      "word_count": 150
    }
  ],

  "what_NOT_to_include": [
    {
      "phrase_type": "Type of bad phrase — one sentence",
      "example": "Example of what to avoid — one sentence",
      "why": "Why it undermines the letter — one sentence"
    }
  ],

  "delivery_advice": {
    "medium": "How to deliver this letter (email, handwritten, text, read aloud) — one sentence",
    "timing": "When to send it — one sentence",
    "follow_up": "What to do after sending — don't demand a response — one sentence",
    "if_no_response": "What to do if they don't respond — one sentence"
  },

  "final_check": "One question to ask yourself before sending — the gut-check that makes sure this is ready — one sentence"
}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      // Generates multiple complete letters — borderline at 3000; 4000 is defensive headroom.
      max_tokens: 4000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'apology-calibrator/letter' });
    if (!parsed.letter_approach) {
      return res.status(500).json({ error: 'Could not calibrate the apology. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('ApologyCalibrator letter error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /apology-calibrator/fix — ApologyFixer
// Diagnoses why an apology didn't land and rebuilds it
// ════════════════════════════════════════════════════════════
router.post('/apology-calibrator/fix', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { whatYouSaid, theirReaction, relationship, context, userLanguage } = req.body;
    if (!whatYouSaid?.trim()) return res.status(400).json({ error: 'Paste what you said when you apologized.' });
    if (!theirReaction?.trim()) return res.status(400).json({ error: 'Describe how they reacted.' });

    const systemPrompt = `${PERSONALITY}

Diagnose a failed apology. Find the 1-2 specific problems precisely. Rebuild from scratch — a specific repair for this situation, not a generic template. The fix should be noticeably different in the ways that matter.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`;

    const userPrompt = `APOLOGY FIXER — DIAGNOSE AND REBUILD

WHAT THEY SAID (the failed apology):
"${whatYouSaid.trim()}"

HOW THE OTHER PERSON REACTED:
"${theirReaction.trim()}"

${relationship ? `RELATIONSHIP: ${relationship}` : ''}
${context ? `CONTEXT: ${context}` : ''}

Diagnose what went wrong and rebuild it completely.

Return ONLY valid JSON:
{
  "diagnosis": {
    "summary": "One sentence — the core problem with this apology in plain language",
    "problems": [
      {
        "type": "defensive | too_vague | blame_shift | over_explained | missing_ownership | conditional | minimized | premature_move_on | sorry_you_feel | too_short | weaponized_apology",
        "label": "Human-readable label (e.g. 'Buried the apology in an excuse') — one sentence",
        "evidence": "The exact phrase or element from their apology that demonstrates this problem — one sentence",
        "why_it_landed_wrong": "Why this specific thing made the other person feel worse or unheard — one sentence"
      }
    ],
    "what_they_were_trying_to_do": "Charitable read — what they probably intended, even if it backfired — one sentence",
    "why_it_backfired": "The gap between their intention and how it was received — one sentence"
  },

  "the_fix": {
    "approach": "Brief note on what the rebuild prioritizes and why — one sentence",
    "rebuilt_apology": "The complete rewritten apology — ready to say or send. Natural voice. No filler. Addresses every problem identified above. — one sentence",
    "what_changed": [
      {
        "original_element": "What was in the original — one sentence",
        "replaced_with": "What's in the rebuild instead — one sentence",
        "why_better": "Why this version lands better — one sentence"
      }
    ]
  },

  "delivery_note": {
    "timing": "When to deliver this — right now, or wait? — one sentence",
    "medium": "In person, text, call, or written — what's right for this situation? — one sentence",
    "one_thing_not_to_do": "The single most important mistake to avoid this time — one sentence"
  },

  "if_they_still_dont_accept_it": "What to say and do if this apology also doesn't land — sometimes the apology isn't what they need — one sentence"
}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'apology-calibrator/fix' });
    if (!parsed.diagnosis) {
      return res.status(500).json({ error: 'Could not calibrate the apology. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('ApologyCalibrator fix error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
