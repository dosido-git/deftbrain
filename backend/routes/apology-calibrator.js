const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

const PERSONALITY = `You are an apology calibration expert — part therapist, part communication coach. You help people navigate the full spectrum: from "you're apologizing way too much" to "this needs a serious repair effort." You're warm but direct. You never shame people for getting it wrong — most people were never taught how to apologize well.

KEY PRINCIPLES:
- Over-apologizing is just as much of a problem as under-apologizing
- A good apology has: acknowledgment of what happened, ownership without excuses, understanding of impact, commitment to change
- "I'm sorry you feel that way" is never an apology
- Timing and delivery matter as much as words
- Follow-through after an apology matters more than the apology itself`;

// ════════════════════════════════════════════════════════════
// POST /apology-calibrator — Main calibration
// ════════════════════════════════════════════════════════════
router.post('/apology-calibrator', async (req, res) => {
  try {
    const { whatHappened, relationship, situation, userLanguage } = req.body;
    if (!whatHappened?.trim()) return res.status(400).json({ error: 'Please describe what happened.' });

    const systemPrompt = `${PERSONALITY}

Analyze the situation and calibrate the appropriate apology level. Be specific about THIS situation — don't give generic advice.`;

    const userPrompt = `CALIBRATE THIS APOLOGY:
What happened: ${whatHappened}
${relationship ? `Relationship: ${relationship}` : ''}
${situation ? `Context: ${situation}` : ''}

Return ONLY valid JSON:
{
  "appropriate_apology_level": 3,
  "level_name": "Simple apology",
  "level_emoji": "🟡",
  "why_this_level": "Clear explanation of why this level is right for this situation",

  "situation_analysis": {
    "what_actually_happened": "Objective summary of the situation",
    "actual_harm_caused": "What impact this had on the other person",
    "your_responsibility_level": "high|medium|low|none",
    "intent_vs_impact": "Your intent may have been X, but the impact was Y",
    "relationship_context": "How the relationship affects the apology"
  },

  "apology_templates": [
    {
      "option": "The actual words to say",
      "tone": "brief|sincere|formal|vulnerable",
      "when_to_use": "When this version is the right choice",
      "strength": "Why this one works"
    }
  ],

  "what_NOT_to_say": [
    {
      "phrase": "The bad phrase",
      "why_its_bad": "What's wrong with it"
    }
  ],

  "if_youre_over_apologizing": {
    "applies": true,
    "reality_check": "Honest assessment of whether this warrants the level of guilt they're feeling",
    "reframe": "What to say instead of sorry",
    "permission": "Permission statement — it's OK to not apologize for this"
  },

  "if_youre_under_apologizing": {
    "applies": false,
    "reality_check": "Why this is bigger than they think",
    "what_to_add": "What's missing from their apology approach",
    "repair_actions": "Concrete things to do beyond words"
  },

  "follow_up": {
    "needed": true,
    "what": "What follow-up action to take",
    "when": "When to do it",
    "behavior_change": "What to do differently going forward"
  }
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('ApologyCalibrator error:', error);
    res.status(500).json({ error: error.message || 'Calibration failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /apology-calibrator/detect — Sorry-Not-Sorry Detector
// ════════════════════════════════════════════════════════════
router.post('/apology-calibrator/detect', async (req, res) => {
  try {
    const { draft, context, userLanguage } = req.body;
    if (!draft?.trim()) return res.status(400).json({ error: 'Paste your apology draft.' });

    const systemPrompt = `${PERSONALITY}

You are analyzing a draft apology message. Flag every problem: non-apologies, deflections, over-apologies, missing elements, toxic phrases, and unnecessary self-flagellation. Then rewrite it to actually land.`;

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
      "text": "The exact problematic phrase from the draft",
      "problem": "What's wrong with it",
      "fix": "What to say instead"
    }
  ],

  "missing_elements": [
    {
      "element": "acknowledgment|ownership|impact|change_commitment|specificity",
      "description": "What's missing and why it matters"
    }
  ],

  "whats_good": ["Things the draft does right — always find something positive"],

  "rewritten": "The complete rewritten apology — same general message but actually effective. Keep the person's voice and intent, just fix the problems.",

  "delivery_note": "One tip about how to deliver this (text vs call vs in person, timing, etc.)"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('ApologyCalibrator detect error:', error);
    res.status(500).json({ error: error.message || 'Detection failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /apology-calibrator/delivery — Delivery coach
// ════════════════════════════════════════════════════════════
router.post('/apology-calibrator/delivery', async (req, res) => {
  try {
    const { whatHappened, relationship, apologyText, userLanguage } = req.body;
    if (!whatHappened?.trim()) return res.status(400).json({ error: 'Describe the situation.' });

    const systemPrompt = `${PERSONALITY}

You are coaching someone on HOW to deliver their apology. The words matter, but delivery matters more. Consider: timing, medium, setting, body language, what to do if they react badly, and what comes after.`;

    const userPrompt = `DELIVERY PLAN:
Situation: ${whatHappened}
${relationship ? `Relationship: ${relationship}` : ''}
${apologyText ? `Their planned apology: "${apologyText}"` : ''}

Return ONLY valid JSON:
{
  "when": {
    "timing": "When to deliver the apology — specific advice",
    "too_soon_risk": "What happens if they apologize too soon",
    "too_late_risk": "What happens if they wait too long",
    "ideal_window": "The sweet spot"
  },
  "how": {
    "best_medium": "In person|Phone call|Video call|Text|Email|Handwritten note",
    "why_this_medium": "Why this is the right channel for this situation",
    "avoid_medium": "What channel to NOT use and why"
  },
  "setting": {
    "where": "Where to have this conversation",
    "private_vs_public": "Should this be private or does the group need to hear it?",
    "tip": "Setting-specific tip"
  },
  "opening_line": "The exact first sentence to say",
  "body_language": ["2-3 specific body language tips for this apology"],
  "if_they_react_badly": {
    "anger": "What to do if they get angry",
    "silence": "What to do if they go quiet",
    "dismissal": "What to do if they brush it off",
    "crying": "What to do if they cry"
  },
  "if_they_say_its_fine": "How to respond when they say 'it's fine' but you're not sure it is",
  "after_the_apology": {
    "next_24_hours": "What to do in the next day",
    "next_week": "How to follow up",
    "long_term": "What behavior change demonstrates the apology was real"
  },
  "common_mistake": "The #1 mistake people make when delivering this type of apology"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('ApologyCalibrator delivery error:', error);
    res.status(500).json({ error: error.message || 'Delivery plan failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /apology-calibrator/audit — Over-apologizing pattern analysis
// ════════════════════════════════════════════════════════════
router.post('/apology-calibrator/audit', async (req, res) => {
  try {
    const { situations, userLanguage } = req.body;
    if (!situations?.length) return res.status(400).json({ error: 'Add at least one situation.' });

    const systemPrompt = `${PERSONALITY}

You are analyzing a PATTERN of apology situations — not just one. Look for: chronic over-apologizing, chronic under-apologizing, specific triggers, relationship patterns, and give compassionate but honest feedback. Many people apologize reflexively for things that don't warrant an apology — help them see the pattern without shaming them.`;

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
      "situation": "Brief reference to the situation",
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
      "instead_of": "Sorry for [common thing they over-apologize for]",
      "try": "Alternative phrasing that's not an apology"
    }
  ],
  "deeper_insight": "One compassionate insight about why they might have this pattern — without diagnosing",
  "one_thing_to_practice": "The single most impactful thing they could practice this week"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('ApologyCalibrator audit error:', error);
    res.status(500).json({ error: error.message || 'Audit failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /apology-calibrator/cultural — Cultural calibration
// ════════════════════════════════════════════════════════════
router.post('/apology-calibrator/cultural', async (req, res) => {
  try {
    const { whatHappened, culture, relationship, setting, userLanguage } = req.body;
    if (!whatHappened?.trim() || !culture?.trim()) {
      return res.status(400).json({ error: 'Describe the situation and the cultural context.' });
    }

    const systemPrompt = `${PERSONALITY}

You are analyzing apology norms across cultures. Be specific and nuanced — avoid stereotypes while acknowledging real cultural differences in: formality expectations, hierarchy sensitivity, public vs private apologies, physical gestures, gift-giving as repair, and how "saving face" works differently across cultures. Always be respectful of all cultures.`;

    const userPrompt = `CULTURAL CALIBRATION:
Situation: ${whatHappened}
Cultural context: ${culture}
${relationship ? `Relationship: ${relationship}` : ''}
${setting ? `Setting: ${setting}` : ''}

Return ONLY valid JSON:
{
  "culture_context": "${culture}",
  "cultural_norms": {
    "apology_frequency": "How often apologies are expected in this culture",
    "formality_level": "How formal apologies should be",
    "hierarchy_matters": "How seniority/status affects apology expectations",
    "public_vs_private": "Whether this should be public or private",
    "directness": "How direct vs indirect the apology should be"
  },
  "what_this_culture_expects": "Specific expectations for this type of situation in this cultural context",
  "what_might_surprise_you": "Something about apology norms in this culture that outsiders often get wrong",
  "adapted_apology": {
    "words": "Culturally appropriate apology text",
    "delivery": "How to deliver it in this cultural context",
    "gestures": "Any physical gestures, gifts, or actions expected",
    "timing": "When is appropriate in this culture"
  },
  "avoid": ["Things that would be inappropriate or offensive in this cultural context"],
  "if_cross_cultural": "If the apologizer and recipient are from different cultures, how to bridge the gap",
  "key_phrases": [
    {
      "english": "I'm sorry for...",
      "local": "Translation if applicable",
      "note": "Usage note"
    }
  ]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('ApologyCalibrator cultural error:', error);
    res.status(500).json({ error: error.message || 'Cultural calibration failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /apology-calibrator/decode — "Was That Even an Apology?" Decoder
// ════════════════════════════════════════════════════════════
router.post('/apology-calibrator/decode', async (req, res) => {
  try {
    const { theirWords, context, relationship, userLanguage } = req.body;
    if (!theirWords?.trim()) return res.status(400).json({ error: 'Paste what they said to you.' });

    const systemPrompt = `${PERSONALITY}

You are analyzing an apology someone RECEIVED — not one they're giving. The person is trying to figure out: was that a real apology, or was it manipulation, deflection, or performance? Be specific about what makes it genuine or not. Help them decide how to respond — not by telling them what to feel, but by giving them clarity about what actually happened in those words.`;

    const userPrompt = `DECODE THIS APOLOGY:
What they said: "${theirWords}"
${context ? `Context: ${context}` : ''}
${relationship ? `Relationship: ${relationship}` : ''}

Return ONLY valid JSON:
{
  "verdict": "genuine|mostly_genuine|mixed|performative|deflective|guilt_trip|non_apology|manipulative",
  "verdict_emoji": "✅|🟡|🟠|🎭|🪞|😰|❌|🚩",
  "verdict_label": "Short human-readable label",
  "one_line": "One sentence summary of what this apology actually is",

  "breakdown": [
    {
      "phrase": "Exact quote from their words",
      "reads_as": "What this phrase actually communicates",
      "flag": "genuine|deflection|blame_shift|minimizing|guilt_trip|conditional|vague|performative|none",
      "flag_emoji": "✅|🪞|👈|📏|😰|⚠️|🌫️|🎭|—"
    }
  ],

  "whats_real": ["Things about this apology that ARE genuine — always find something if possible"],
  "whats_missing": ["Elements that a real apology would have included but this one doesn't"],

  "what_a_real_apology_would_sound_like": "What they WOULD have said if they were truly taking accountability — in their voice, same situation",

  "your_options": [
    {
      "option": "accept|accept_with_boundary|push_back|table_it|walk_away",
      "label": "Short label",
      "what_to_say": "Exact words for this response",
      "when_this_fits": "When this is the right choice"
    }
  ],

  "pattern_warning": "If this sounds like a pattern (repeated non-apologies, DARVO, etc.), flag it gently — or null if not applicable",
  "emotional_validation": "Acknowledge how receiving a non-apology or bad apology feels — validate without catastrophizing"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('ApologyCalibrator decode error:', error);
    res.status(500).json({ error: error.message || 'Decode failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /apology-calibrator/practice — Apology Practice Mode
// ════════════════════════════════════════════════════════════
router.post('/apology-calibrator/practice', async (req, res) => {
  try {
    const { situation, relationship, mode, history, userLanguage } = req.body;
    if (!situation?.trim()) return res.status(400).json({ error: 'Describe the situation to practice.' });

    const systemPrompt = `${PERSONALITY}

You are role-playing as the person receiving an apology so the user can PRACTICE before the real conversation. You respond in-character based on the relationship and situation.

MODE: ${mode === 'hard' ? 'HARD — You are hurt, skeptical, not making this easy. You push back, go quiet, or get emotional. Make them earn it.' : 'NORMAL — You are open to hearing them out but not a pushover. You react naturally — some defensiveness, some openness.'}

After each exchange, break character briefly to coach them: what landed, what felt off, what to adjust. Then get back in character for the next round.`;

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
  "in_character_response": "Your response as the person receiving the apology — stay in character, react naturally",
  "emotion": "angry|hurt|skeptical|guarded|softening|receptive|crying|cold|dismissive",
  "emotion_emoji": "😠|😢|🤨|🛡️|🫤|😊|😭|🧊|🤷",
  "body_language": "Brief description of their body language/tone",

  "coaching": {
    "what_landed": "What worked in their latest attempt",
    "what_felt_off": "What didn't work or felt inauthentic",
    "try_next": "Specific suggestion for their next response",
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
  "scene_setting": "Brief description of the moment — where you are, what just happened, the tension in the air",
  "in_character_response": "Your opening line as the wronged person — you might be confronting them, giving them the cold shoulder, or waiting for them to speak",
  "emotion": "angry|hurt|skeptical|guarded|cold|dismissive|waiting",
  "emotion_emoji": "😠|😢|🤨|🛡️|🧊|🤷|⏳",
  "body_language": "Brief description of their body language/tone",

  "coaching": {
    "tip_before_starting": "One piece of advice before they begin their apology",
    "watch_for": "The key thing to pay attention to in this person's reactions"
  },

  "conversation_over": false,
  "final_verdict": null
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('ApologyCalibrator practice error:', error);
    res.status(500).json({ error: error.message || 'Practice session failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /apology-calibrator/forgive — Forgiveness Navigator
// ════════════════════════════════════════════════════════════
router.post('/apology-calibrator/forgive', async (req, res) => {
  try {
    const { whatTheyDid, theirApology, relationship, howYouFeel, userLanguage } = req.body;
    if (!whatTheyDid?.trim()) return res.status(400).json({ error: 'Describe what happened.' });

    const systemPrompt = `${PERSONALITY}

You are helping someone navigate FORGIVENESS — the receiving side. This is NOT about pressuring them to forgive. It's about clarity: What does forgiveness mean here? What would they need? What are their real options? Never use toxic positivity. Never say "you should forgive." Instead, help them understand their own feelings and what each path forward looks like.

KEY PRINCIPLES:
- Forgiveness is not the same as reconciliation
- "I accept your apology" ≠ "everything's fine now"
- Sometimes the healthiest choice is to NOT forgive yet
- Forgiveness is about the person forgiving, not the person who wronged them
- People can forgive without ever saying the words`;

    const userPrompt = `FORGIVENESS NAVIGATION:
What they did: ${whatTheyDid}
${theirApology ? `Their apology: "${theirApology}"` : 'No apology given (or inadequate one)'}
${relationship ? `Relationship: ${relationship}` : ''}
${howYouFeel ? `How I feel: ${howYouFeel}` : ''}

Return ONLY valid JSON:
{
  "situation_read": "Empathetic summary of the situation from their perspective — show you understand",
  "emotional_validation": "Validate what they're feeling without minimizing or catastrophizing",

  "forgiveness_clarity": {
    "what_forgiveness_means_here": "What forgiveness would actually look like in THIS specific situation — not the generic definition",
    "what_forgiveness_does_NOT_mean": "Common misconceptions about forgiving in this context",
    "forgiving_vs_reconciling": "The difference between forgiving this person and letting them back in"
  },

  "apology_assessment": {
    "quality": "genuine|partial|inadequate|absent|manipulative",
    "whats_there": "What their apology gets right, if anything",
    "whats_missing": "What you'd need to hear that you haven't heard",
    "is_enough_to_work_with": true
  },

  "what_you_might_need": [
    {
      "need": "A specific thing they might need from the other person",
      "how_to_ask_for_it": "Exact words to request this",
      "if_they_cant_give_it": "What that means for the path forward"
    }
  ],

  "paths_forward": [
    {
      "path": "accept_and_rebuild|accept_with_boundaries|forgive_from_distance|not_yet|not_ever",
      "label": "Human-readable label",
      "what_it_looks_like": "Concrete description of choosing this path",
      "what_to_say": "Words for communicating this choice",
      "trade_offs": "What you gain and what you risk"
    }
  ],

  "if_youre_not_ready": "Compassionate message about the validity of not being ready to forgive",
  "one_thing_to_sit_with": "A reflective question or insight to help them process — not advice, just something to think about"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('ApologyCalibrator forgive error:', error);
    res.status(500).json({ error: error.message || 'Forgiveness navigation failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /apology-calibrator/roadmap — Relationship Repair Roadmap
// ════════════════════════════════════════════════════════════
router.post('/apology-calibrator/roadmap', async (req, res) => {
  try {
    const { whatHappened, relationship, currentState, effortSoFar, userLanguage } = req.body;
    if (!whatHappened?.trim()) return res.status(400).json({ error: 'Describe what happened.' });

    const systemPrompt = `${PERSONALITY}

You are creating a MULTI-WEEK relationship repair roadmap for situations where a single apology isn't enough. The trust has been seriously damaged and needs a sustained, intentional rebuild. Be realistic — some damage takes months. Give concrete weekly actions, not platitudes. Include milestones and red flags. This is the long game.`;

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
    "what_was_broken": "Specifically what trust/bond was damaged",
    "realistic_timeline": "Honest estimate of how long repair takes",
    "can_this_be_fully_repaired": "Honest assessment — sometimes the answer is 'not to what it was, but to something new'"
  },

  "common_mistakes": [
    {
      "mistake": "Thing people do wrong during repair",
      "why_its_tempting": "Why it feels like the right thing",
      "what_to_do_instead": "The better approach"
    }
  ],

  "roadmap": [
    {
      "phase": "Week 1|Weeks 2-3|Month 2|Months 3-6|Ongoing",
      "title": "Phase name",
      "focus": "What this phase is about",
      "actions": ["Specific concrete things to do"],
      "say_this": "Example of something to communicate during this phase",
      "avoid_this": "What NOT to do during this phase",
      "milestone": "How you know this phase was successful",
      "if_its_not_working": "What to try if they're not responding to your efforts"
    }
  ],

  "trust_rebuilding_signals": [
    {
      "signal": "A sign that trust is rebuilding",
      "what_it_looks_like": "Concrete example of this signal",
      "dont_rush_it": "Why not to force this signal"
    }
  ],

  "red_flags_to_watch": ["Signs that repair isn't working and you may need to reassess"],

  "hardest_truth": "The one thing they probably don't want to hear but need to — delivered with compassion",
  "daily_practice": "One small daily action that compounds over time"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('ApologyCalibrator roadmap error:', error);
    res.status(500).json({ error: error.message || 'Roadmap generation failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /apology-calibrator/letter — Apology Letter Builder
// ════════════════════════════════════════════════════════════
router.post('/apology-calibrator/letter', async (req, res) => {
  try {
    const { whatHappened, relationship, tone, additionalContext, userLanguage } = req.body;
    if (!whatHappened?.trim()) return res.status(400).json({ error: 'Describe what happened.' });

    const systemPrompt = `${PERSONALITY}

You are building a thoughtful, structured apology LETTER for situations that need more than a quick "I'm sorry." This is for when someone needs to write it out — either because the situation is serious, they can't say it in person, or they want to make sure they get it right. Each section of the letter has a purpose. Generate multiple versions so they can choose the voice that feels most like them.`;

    const userPrompt = `BUILD AN APOLOGY LETTER:
What happened: ${whatHappened}
${relationship ? `Relationship: ${relationship}` : ''}
${tone ? `Preferred tone: ${tone}` : ''}
${additionalContext ? `Additional context: ${additionalContext}` : ''}

Return ONLY valid JSON:
{
  "letter_approach": "Brief explanation of the approach you're taking and why",

  "structure_guide": {
    "opening": "What the opening should accomplish — no excuses, no preamble",
    "acknowledgment": "What to acknowledge specifically — show you understand what you did",
    "impact": "Show you understand how it affected them — this is where empathy lives",
    "accountability": "Own it without qualifiers, buts, or explanations that sound like excuses",
    "commitment": "What you'll do differently — be specific and realistic",
    "closing": "End with their agency — they get to decide what happens next"
  },

  "versions": [
    {
      "tone": "vulnerable|direct|formal|brief|heartfelt",
      "tone_label": "Descriptive label for this version",
      "letter": "The complete letter — ready to send. Formatted with paragraphs. Natural voice, not robotic.",
      "best_for": "When this version is the right choice",
      "word_count": 150
    }
  ],

  "what_NOT_to_include": [
    {
      "phrase_type": "Type of bad phrase",
      "example": "Example of what to avoid",
      "why": "Why it undermines the letter"
    }
  ],

  "delivery_advice": {
    "medium": "How to deliver this letter (email, handwritten, text, read aloud)",
    "timing": "When to send it",
    "follow_up": "What to do after sending — don't demand a response",
    "if_no_response": "What to do if they don't respond"
  },

  "final_check": "One question to ask yourself before sending — the gut-check that makes sure this is ready"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('ApologyCalibrator letter error:', error);
    res.status(500).json({ error: error.message || 'Letter generation failed' });
  }
});

module.exports = router;
