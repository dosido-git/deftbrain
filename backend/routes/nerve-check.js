const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

function safeParseJSON(text) {
  let cleaned = cleanJsonResponse(text);

  // Pass 1: standard cleanup
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');           // trailing commas
  cleaned = cleaned.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' '); // control chars (keep \t \n \r)
  cleaned = cleaned.replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":'); // unquoted keys

  try { return JSON.parse(cleaned); } catch {}

  // Pass 2: normalize line endings then escape literal newlines inside string values.
  // Claude sometimes writes multi-line string values without \n escaping.
  cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  // Replace literal newlines that appear inside string values (between a non-escaped " and the next ")
  // Strategy: replace any \n that is preceded by an open string (heuristic: inside "...") with \\n
  cleaned = cleaned.replace(/("(?:[^"\\]|\\.)*?)\n((?:[^"\\]|\\.)*?")/g, '$1\\n$2');

  try { return JSON.parse(cleaned); } catch {}

  // Pass 3: fix unescaped double-quotes inside string values.
  // Pattern: a string value that contains " not preceded by \
  // Replace inner unescaped quotes with escaped version.
  cleaned = cleaned.replace(
    /:\s*"((?:[^"\\]|\\.)*)"/g,
    (match, inner) => ': "' + inner.replace(/(?<!\\)"/g, '\\"') + '"'
  );

  try { return JSON.parse(cleaned); } catch {}

  // Pass 4: last resort — strip everything before first { and after last }
  const first = cleaned.indexOf('{');
  const last  = cleaned.lastIndexOf('}');
  if (first !== -1 && last !== -1 && last > first) {
    try { return JSON.parse(cleaned.slice(first, last + 1)); } catch {}
  }

  // Pass 5: throw a descriptive error
  const e = new SyntaxError('safeParseJSON: all repair attempts failed');
  e.rawText = text.slice(0, 200);
  throw e;
}

// ═══════════════════════════════════════════════════════════════
// MAIN — full confidence analysis and prep plan
// ═══════════════════════════════════════════════════════════════

router.post('/nerve-check', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { situation, situationType, confidenceLevel, specificFears, timeUntil, pastWins, userLanguage } = req.body;

    if (!situation?.trim()) return res.status(400).json({ error: 'Describe what you\'re nervous about' });

    const pastBlock = pastWins?.length
      ? `\nPAST WINS (things they've been scared to do and did anyway):\n${pastWins.map(w => `- ${w.situation}: ${w.outcome}`).join('\n')}`
      : '';

    const prompt = `You are a confidence coach. Someone is nervous about something. Your job: break down the fear, show them they're more ready than they think, and give them concrete tools. Be warm, real, and specific — not cheesy motivational poster energy. Like a best friend who also happens to be a therapist.

WHAT THEY'RE FACING: ${situation}
TYPE: ${situationType || 'general'}
CURRENT CONFIDENCE (1-10): ${confidenceLevel || 'low'}
SPECIFIC FEARS: ${specificFears || 'not specified'}
TIME UNTIL: ${timeUntil || 'soon'}
${pastBlock}

Return ONLY valid JSON:
{
  "fear_breakdown": {
    "surface_fear": "What they think they're scared of — one sentence",
    "real_fear": "What's actually underneath (usually about being judged, failing, losing control, or being rejected) — one sentence",
    "reality_check": "Honest assessment — is this actually dangerous or just uncomfortable? — one sentence",
    "probability": "How likely is the worst case, honestly? (number)"
  },
  "why_youre_readier_than_you_think": [
    {
      "reason": "Specific reason based on what they told you — one sentence",
      "evidence": "Proof from their own life/situation — one sentence"
    }
  ],
  "prep_plan": [
    {
      "step": "Specific action to take — one sentence",
      "why": "How it directly reduces the fear — one sentence",
      "time": "How long it takes — one sentence",
      "priority": "must_do / should_do / nice_to_have (number)"
    }
  ],
  "scripts": {
    "opening_line": "Exact first words to say when the moment arrives — one sentence",
    "if_you_blank": "What to say if your mind goes empty — one sentence",
    "if_it_goes_wrong": "Exact words for the worst-case moment — one sentence",
    "exit_line": "Graceful way to leave if you need to — one sentence"
  },
  "body_hacks": [
    {
      "technique": "Name of the technique — one sentence",
      "how": "Exactly how to do it, step by step — one sentence",
      "when": "When to use it (before / during / if panicking) — one sentence",
      "time": "How long it takes — one sentence"
    }
  ],
  "worst_case_autopsy": {
    "actual_worst": "Realistically, the worst thing that could happen — one sentence",
    "would_you_survive": "Yes, and here's why — one sentence",
    "how_long_it_stings": "How long the bad feeling would actually last — one sentence",
    "recovery": "Exactly what you'd do next — one sentence"
  },
  "permission_slip": "A warm, honest statement that being nervous isn't weakness — it means this matters to you. Not a motivational poster. Something real. — one sentence",
  "mantra": "One short sentence to repeat. Not cheesy. Something that actually helps. — one sentence"
}

Return ONLY valid JSON.`;

    let message;
    for (let _att = 1; _att <= 3; _att++) {
      try {
        message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) }],
    });
        break;
      } catch (_e) {
        if (_att === 3) throw _e;
        await new Promise(r => setTimeout(r, 1000 * _att));
      }
    }

    const raw = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = safeParseJSON(raw);
    if (!parsed.fear_breakdown && !parsed.reframe) {
      return res.status(500).json({ error: 'Could not analyze your nerves. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[NerveCheck] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// LIVE — you're about to walk in RIGHT NOW
// ═══════════════════════════════════════════════════════════════

router.post('/nerve-check/live', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { situation, panicLevel, minutesUntil, userLanguage } = req.body;

    if (!situation?.trim()) return res.status(400).json({ error: 'What are you about to do?' });

    const prompt = `Someone is about to walk into a scary situation RIGHT NOW. They don't have time for a full plan. Give them exactly what they need in the next ${minutesUntil || '5'} minutes. Be calm, direct, warm. Like a corner coach between rounds.

SITUATION: ${situation}
PANIC LEVEL (1-10): ${panicLevel || 7}
MINUTES UNTIL: ${minutesUntil || 5}

Return ONLY valid JSON:
{
  "first_thing": "The single most important thing to do right now, in one sentence",
  "breathe": {
    "pattern": "Specific breathing pattern (e.g., 4-7-8) — one sentence",
    "instruction": "Step by step, assume they're panicking — one sentence",
    "rounds": 3
  },
  "body_reset": "One physical thing to do right now (30 seconds max) — one sentence",
  "last_words": {
    "tell_yourself": "What to say internally right before you walk in — one sentence",
    "first_thing_to_say": "Your literal opening line — one sentence",
    "if_panic_hits": "What to do mid-situation if the fear spikes — one sentence"
  },
  "perspective": "One honest sentence putting this in perspective — one sentence",
  "after": "What to do immediately after, no matter how it goes — one sentence"
}

Return ONLY valid JSON.`;

    let message;
    for (let _att = 1; _att <= 3; _att++) {
      try {
        message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) }],
    });
        break;
      } catch (_e) {
        if (_att === 3) throw _e;
        await new Promise(r => setTimeout(r, 1000 * _att));
      }
    }

    const raw = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = safeParseJSON(raw);
    if (!parsed.fear_breakdown && !parsed.reframe) {
      return res.status(500).json({ error: 'Could not analyze your nerves. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[NerveCheck/live] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// DEBRIEF — how did it go?
// ═══════════════════════════════════════════════════════════════

router.post('/nerve-check/debrief', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { situation, howItWent, confidenceBefore, confidenceAfter, whatSurprised, userLanguage } = req.body;

    if (!howItWent?.trim()) return res.status(400).json({ error: 'Tell me how it went' });

    const prompt = `Someone just did a thing that scared them. Help them process what happened. Be warm and celebratory if it went well, gentle and constructive if it didn't. The goal is to build their confidence muscle for next time.

WHAT THEY FACED: ${situation || 'something scary'}
HOW IT WENT: ${howItWent}
CONFIDENCE BEFORE: ${confidenceBefore || '?'}/10
CONFIDENCE AFTER: ${confidenceAfter || '?'}/10
WHAT SURPRISED THEM: ${whatSurprised || 'not specified'}

Return ONLY valid JSON:
{
  "verdict": "brave / you_showed_up / learning_experience — one sentence",
  "headline": "One sentence celebrating or validating what they did",
  "what_you_proved": ["Things this experience proved about them — be specific"],
  "courage_receipt": {
    "fear_before": "What they were scared of — one sentence",
    "what_actually_happened": "The reality — one sentence",
    "gap": "The difference between fear and reality — one sentence"
  },
  "growth_note": "What's different about them now vs before they did this — one sentence",
  "next_stretch": "Something slightly scarier they might be ready for now — one sentence",
  "save_this": "A sentence they can re-read next time they're scared — based on THIS specific experience — one sentence"
}

Return ONLY valid JSON.`;

    let message;
    for (let _att = 1; _att <= 3; _att++) {
      try {
        message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) }],
    });
        break;
      } catch (_e) {
        if (_att === 3) throw _e;
        await new Promise(r => setTimeout(r, 1000 * _att));
      }
    }

    const raw = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = safeParseJSON(raw);
    if (!parsed.fear_breakdown && !parsed.reframe) {
      return res.status(500).json({ error: 'Could not analyze your nerves. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[NerveCheck/debrief] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// SITUATION-SPECIFIC — deep prep tailored to situation type
// ═══════════════════════════════════════════════════════════════

router.post('/nerve-check/specific-prep', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { situation, situationType, specificFears, details, userLanguage } = req.body;

    if (!situation?.trim()) return res.status(400).json({ error: 'Describe the situation' });

    const typeInstructions = {
      interview: 'This is a job interview. Give: likely questions they\'ll face (with answer frameworks, NOT full answers), what to research about the company in 15 min, how to handle "tell me about yourself", salary discussion timing, and red/green flags to watch for.',
      presentation: 'This is a presentation/public speaking event. Give: opening hook options, how to handle Q&A, what to do if tech fails, audience reading techniques, and the 3-second recovery for losing your place.',
      confrontation: 'This is a difficult conversation or confrontation. Give: de-escalation phrases, how to stay calm when they get emotional, boundary-setting scripts, when to pause vs push forward, and signs it\'s time to walk away.',
      date: 'This is a date or high-stakes social situation. Give: conversation starters that aren\'t boring, how to handle awkward silences naturally, body language tips, how to leave gracefully if it\'s not working, and how to suggest a second date if it IS working.',
      medical: 'This is a medical appointment. Give: questions to ask the doctor (and how to insist on answers), how to advocate for yourself, what to write down before going in, how to handle bad news, and your rights as a patient.',
      performance: 'This is a performance (music, theater, sports, etc). Give: warm-up routine, pre-performance ritual suggestions, what to do if you make a mistake mid-performance, audience awareness techniques, and how to channel nervous energy into performance energy.',
      phone_call: 'This is a scary phone call. Give: exact opening script, how to handle being put on hold / transferred, bullet points to have in front of you, when to ask to call back, and follow-up email template.',
      other: 'Give situation-specific practical prep based on what they described.',
    };

    const prompt = `You are a situation-specific confidence coach. Someone is facing a specific type of challenge. Give them TARGETED prep — not generic confidence advice, but the exact practical tools for THIS type of situation.

SITUATION: ${situation}
TYPE: ${situationType || 'other'}
SPECIFIC FEARS: ${specificFears || 'general anxiety'}
ADDITIONAL DETAILS: ${details || 'none'}

SPECIFIC INSTRUCTIONS: ${typeInstructions[situationType] || typeInstructions.other}

Return ONLY valid JSON:
{
  "situation_intel": {
    "what_to_expect": "Exactly what will happen, step by step, so nothing surprises them — one sentence",
    "typical_duration": "How long this usually takes (number)",
    "hardest_part": "The specific moment that's usually hardest — one sentence",
    "secret": "Something most people don't know about this situation that gives them an edge — one sentence"
  },
  "targeted_prep": [
    {
      "task": "Specific prep action for THIS type of situation — one sentence",
      "why": "How it helps — one sentence",
      "time": "Duration — one sentence",
      "script": "Exact words if applicable — 2-4 sentences"
    }
  ],
  "likely_challenges": [
    {
      "challenge": "Specific thing that might happen — one sentence",
      "probability": "likely / possible / unlikely (number)",
      "handle_it": "Exact response or action — one sentence",
      "script": "Words to say if applicable — 2-4 sentences"
    }
  ],
  "power_moves": [
    {
      "move": "Specific thing to do that shows confidence in THIS context — one sentence",
      "when": "Exactly when to do it — one sentence",
      "why_it_works": "Psychology behind it — one sentence"
    }
  ],
  "cheat_sheet": [
    "Bullet point to have in front of you (or memorized) — max 5"
  ]
}

Return ONLY valid JSON.`;

    let message;
    for (let _att = 1; _att <= 3; _att++) {
      try {
        message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1800,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) }],
    });
        break;
      } catch (_e) {
        if (_att === 3) throw _e;
        await new Promise(r => setTimeout(r, 1000 * _att));
      }
    }

    const raw = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = safeParseJSON(raw);
    if (!parsed.fear_breakdown && !parsed.reframe) {
      return res.status(500).json({ error: 'Could not analyze your nerves. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[NerveCheck/specific-prep] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// SOS — mid-event emergency micro-intervention (10 seconds)
// ═══════════════════════════════════════════════════════════════

router.post('/nerve-check/sos', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { situation, whatsHappening, userLanguage } = req.body;

    const prompt = `EMERGENCY. Someone is IN the middle of a scary situation and spiraling. They have 10 seconds to glance at their phone. Give them the absolute minimum to recover. No fluff. No explanation. Just what to do RIGHT NOW.

SITUATION: ${situation || 'something scary'}
WHAT'S HAPPENING: ${whatsHappening || 'panicking'}

Return ONLY valid JSON:
{
  "do_now": "One physical action (5 seconds) — one sentence",
  "think_this": "One thought (5 words max) — one sentence",
  "say_this": "One sentence to get back on track",
  "remember": "One grounding fact (10 words max) — one sentence"
}

Return ONLY valid JSON.`;

    let message;
    for (let _att = 1; _att <= 3; _att++) {
      try {
        message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) }],
    });
        break;
      } catch (_e) {
        if (_att === 3) throw _e;
        await new Promise(r => setTimeout(r, 1000 * _att));
      }
    }

    const raw = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = safeParseJSON(raw);
    if (!parsed.fear_breakdown && !parsed.reframe) {
      return res.status(500).json({ error: 'Could not analyze your nerves. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[NerveCheck/sos] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// COACH — help someone ELSE who's nervous
// ═══════════════════════════════════════════════════════════════

router.post('/nerve-check/coach', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { whoIsNervous, theirSituation, relationship, theirAge, userLanguage } = req.body;

    if (!theirSituation?.trim()) return res.status(400).json({ error: 'What are they nervous about?' });

    const prompt = `Someone wants to help another person who is nervous. Tell them exactly what to say and do. Be specific to the relationship and age. The goal: be genuinely helpful, not dismissive ("just relax!") or patronizing.

WHO IS NERVOUS: ${whoIsNervous || 'someone they care about'}
THEIR SITUATION: ${theirSituation}
RELATIONSHIP: ${relationship || 'not specified'}
THEIR AGE: ${theirAge || 'adult'}

Return ONLY valid JSON:
{
  "dont_say": ["Common things people say that actually make it WORSE — and why"],
  "do_say": [
    {
      "script": "Exact words to say — 2-4 sentences",
      "when": "When to say this (e.g., 'when they first tell you', 'right before they go in') — one sentence",
      "why_it_helps": "What it does for them emotionally — one sentence"
    }
  ],
  "do_this": [
    {
      "action": "Specific supportive action — one sentence",
      "when": "Timing — one sentence",
      "why": "Why it matters — one sentence"
    }
  ],
  "after": {
    "if_it_went_well": "What to say/do after if it went well — one sentence",
    "if_it_went_badly": "What to say/do after if it didn't go well — one sentence",
    "either_way": "What to do regardless — one sentence"
  },
  "key_insight": "One sentence about what nervous people actually need (it's usually not advice)"
}

Return ONLY valid JSON.`;

    let message;
    for (let _att = 1; _att <= 3; _att++) {
      try {
        message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) }],
    });
        break;
      } catch (_e) {
        if (_att === 3) throw _e;
        await new Promise(r => setTimeout(r, 1000 * _att));
      }
    }

    const raw = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = safeParseJSON(raw);
    if (!parsed.fear_breakdown && !parsed.reframe) {
      return res.status(500).json({ error: 'Could not analyze your nerves. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[NerveCheck/coach] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// FEAR LADDER — graduated exposure steps
// ═══════════════════════════════════════════════════════════════

router.post('/nerve-check/fear-ladder', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { bigFear, currentComfort, situationType, userLanguage } = req.body;

    if (!bigFear?.trim()) return res.status(400).json({ error: 'What\'s the big fear?' });

    const prompt = `Someone has a fear they want to overcome through gradual exposure. Build them a "fear ladder" — a series of progressively challenging steps from barely uncomfortable to their big scary goal. Each step should feel achievable from the one before it. Be specific, practical, and encouraging.

THE BIG FEAR: ${bigFear}
CURRENT COMFORT LEVEL: ${currentComfort || 'very uncomfortable with this'}
TYPE: ${situationType || 'general'}

Return ONLY valid JSON:
{
  "ladder_name": "Short name for this ladder (e.g., 'Speaking Up in Meetings') — 3-6 words",
  "rungs": [
    {
      "level": 1,
      "challenge": "Specific, concrete action — not vague — one sentence",
      "difficulty": "easy / moderate / hard / boss_level — 2-4 words",
      "why_this_step": "How this builds on the last one — one sentence",
      "tip": "One practical tip for this specific step — one sentence",
      "you_know_youre_ready_when": "Signal that it's time to move up — one sentence"
    }
  ],
  "timeframe": "Realistic total time to work through the ladder — one sentence",
  "rule": "One important rule for working through this (e.g., 'You can repeat a rung as many times as you need') — one sentence"
}

Generate exactly 6 rungs. Rung 1 should be almost trivially easy. Rung 6 should be the actual big fear or very close to it.

Return ONLY valid JSON.`;

    let message;
    for (let _att = 1; _att <= 3; _att++) {
      try {
        message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) }],
    });
        break;
      } catch (_e) {
        if (_att === 3) throw _e;
        await new Promise(r => setTimeout(r, 1000 * _att));
      }
    }

    const raw = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = safeParseJSON(raw);
    if (!parsed.fear_breakdown && !parsed.reframe) {
      return res.status(500).json({ error: 'Could not analyze your nerves. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[NerveCheck/fear-ladder] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
