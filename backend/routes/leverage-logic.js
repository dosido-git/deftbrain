const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — scripts and quoted phrases must be written plainly with no inner quote marks, or it breaks the JSON.';

// ═══════════════════════════════════════════════════════════════
// MAIN — full negotiation strategy
// ═══════════════════════════════════════════════════════════════

router.post('/leverage-logic', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { situation, leverage, desired, urgency, relationship, negotiationType, pastAttempts, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!situation?.trim()) return res.status(400).json({ error: 'Describe your negotiation situation' });

    const pastBlock = pastAttempts?.length
      ? `\nPAST ATTEMPTS:\n${pastAttempts.map(a => `- ${a.date}: ${a.approach}${a.result ? ` → ${a.result}` : ''}`).join('\n')}`
      : '';

    const prompt = `You are a negotiation strategist. Analyze this situation and build a complete game plan. Be specific to THEIR situation — no generic advice. Every script should sound natural, not corporate.

SITUATION: ${situation}
NEGOTIATION TYPE: ${negotiationType || 'general'}
THEIR LEVERAGE: ${leverage || 'Not specified — identify what they have'}
DESIRED OUTCOME: ${desired || 'Not specified — suggest realistic targets'}
URGENCY: ${urgency || 'moderate'}
RELATIONSHIP IMPORTANCE: ${relationship || 'moderate — want to maintain'}
${pastBlock}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.

Return ONLY valid JSON:
{
  "situation_read": {
    "summary": "One-sentence read of the situation — 1-2 sentences",
    "power_balance": "who_has_leverage | balanced | they_have_leverage",
    "power_explanation": "Why, in one sentence",
    "negotiation_type": "salary / vendor / lease / purchase / freelance / partnership / dispute / other",
    "stakes": "low / medium / high",
    "complexity": "straightforward / moderate / complex"
  },
  "your_leverage": [
    {
      "point": "What you have — one sentence",
      "strength": "strong / medium / weak",
      "how_to_use": "Specific way to deploy this — one sentence",
      "when": "Early / middle / if they push back — one sentence",
      "warning": "Risk of overplaying this — one sentence"
    }
  ],
  "their_leverage": [
    {
      "point": "What they have — one sentence",
      "strength": "strong / medium / weak",
      "how_to_neutralize": "How to reduce its impact — one sentence"
    }
  ],
  "strategy": {
    "approach": "Name for the overall approach (e.g., 'Anchoring high with data', 'Collaborative problem-solving') — one sentence",
    "opening_position": "Where to start and why — one sentence",
    "target": "Realistic best outcome — one sentence",
    "walkaway": "Minimum acceptable — below this, walk — one sentence",
    "concession_ladder": [
      { "order": 1, "give_up": "First thing to concede — one sentence", "costs_you": "low / medium — one sentence", "value_to_them": "high — makes you look flexible — one sentence" },
      { "order": 2, "give_up": "Second concession — one sentence", "costs_you": "medium — one sentence", "value_to_them": "medium — one sentence" }
    ],
    "timing": "When to have this conversation and why — one sentence",
    "setting": "Where/how to have it (in person, email, etc.) — one sentence"
  },
  "scripts": [
    {
      "moment": "Opening the conversation — one sentence",
      "say_this": "Exact words to use — one sentence",
      "why_it_works": "Brief explanation — one sentence",
      "tone": "confident / warm / matter-of-fact"
    },
    {
      "moment": "Presenting your ask — one sentence",
      "say_this": "Exact words — one sentence",
      "why_it_works": "Brief explanation — one sentence",
      "tone": "tone"
    },
    {
      "moment": "If they say no or push back — one sentence",
      "say_this": "Exact words — one sentence",
      "why_it_works": "Brief explanation — one sentence",
      "tone": "tone"
    },
    {
      "moment": "Deploying your leverage — one sentence",
      "say_this": "Exact words — subtle, not threatening — one sentence",
      "why_it_works": "Brief explanation — one sentence",
      "tone": "tone"
    },
    {
      "moment": "Closing / getting to yes — one sentence",
      "say_this": "Exact words — one sentence",
      "why_it_works": "Brief explanation — one sentence",
      "tone": "tone"
    }
  ],
  "traps_to_avoid": [
    {
      "trap": "Common mistake for this type of negotiation — one sentence",
      "why_dangerous": "What happens if you fall for it — one sentence",
      "instead": "What to do instead — one sentence"
    }
  ],
  "batna": {
    "best_alternative": "Your best option if this fails — one sentence",
    "how_strong": "strong | decent | weak",
    "how_to_strengthen": "What to do now to improve your fallback — one sentence",
    "mention_it": "yes_subtly / no_keep_private / only_if_desperate"
  },
  "body_language": {
    "do": ["Specific body language tip"],
    "avoid": ["What not to do physically"]
  },
  "confidence_boost": "One sentence reminder of why they're in a stronger position than they think"
}

ARRAY BOUNDS: your_leverage 3-5 items, their_leverage 3-5 items, traps_to_avoid 3-5 items. Do not exceed these caps.

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.

Return ONLY valid JSON. ${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion) }],
    }, { label: 'leverage-logic' });
    if (!parsed.situation_read) {
      return res.status(500).json({ error: 'Could not analyze your leverage. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[LeverageLogic] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// COUNTER — handle a specific objection or response
// ═══════════════════════════════════════════════════════════════

router.post('/leverage-logic/counter', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { situation, theyJustSaid, yourGoal, tonePreference, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!theyJustSaid?.trim()) return res.status(400).json({ error: 'What did they say?' });

    const prompt = `Someone is in a negotiation and the other side just responded. Help them with an immediate counter-move. Be specific and natural — these should sound like real words a real person would say.

SITUATION: ${situation || 'ongoing negotiation'}
THEY JUST SAID: "${theyJustSaid}"
YOUR GOAL: ${yourGoal || 'get a better deal'}
PREFERRED TONE: ${tonePreference || 'confident but not aggressive'}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.

Return ONLY valid JSON:
{
  "read": "What their response actually means (the subtext) — one sentence",
  "their_tactic": "Name the negotiation tactic they're using, if any — one sentence",
  "danger_level": "safe | caution | red_flag",
  "responses": [
    {
      "approach": "Name for this approach (2-3 words)",
      "say_this": "Exact words to respond with — one sentence",
      "then_what": "What to expect after you say this — one sentence",
      "risk": "low | medium | high",
      "best_if": "When this approach works best — one sentence"
    }
  ],
  "do_not_say": "Common knee-jerk response that would hurt you — one sentence",
  "silence_option": "Sometimes the best move is to say nothing. Is this one of those times? Why or why not. — one sentence"
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.

Return ONLY valid JSON. ${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion) }],
    }, { label: 'leverage-logic-counter' });
    if (!parsed.read) {
      return res.status(500).json({ error: 'Could not analyze your leverage. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[LeverageLogic/counter] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// PREP CHECK — pre-negotiation readiness assessment
// ═══════════════════════════════════════════════════════════════

router.post('/leverage-logic/prep-check', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { situation, whatYouKnow, whatYouDontKnow, negotiationType, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!situation?.trim()) return res.status(400).json({ error: 'Describe the situation' });

    const prompt = `Someone is about to enter a negotiation. Assess how prepared they are and tell them exactly what homework to do before they walk in.

SITUATION: ${situation}
TYPE: ${negotiationType || 'general'}
WHAT THEY KNOW: ${whatYouKnow || 'Not specified'}
GAPS THEY'RE AWARE OF: ${whatYouDontKnow || 'Not specified'}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.

Return ONLY valid JSON:
{
  "readiness_score": 65,
  "readiness_label": "almost_ready / needs_work / not_ready — 2-4 words",
  "critical_gaps": [
    {
      "gap": "What they don't know yet — one sentence",
      "why_critical": "How it could hurt them — one sentence",
      "how_to_find": "Specific way to get this information — one sentence",
      "time_needed": "5 min / 30 min / a few hours (number)"
    }
  ],
  "strengths": ["What they already have going for them"],
  "homework": [
    {
      "task": "Specific research or prep task — one sentence",
      "priority": "must_do | should_do | nice_to_have",
      "time": "How long it takes — one sentence"
    }
  ],
  "ready_when": "You're ready to negotiate when you can answer: [specific question] — one sentence",
  "quick_win": "One thing they can do in 5 minutes that will significantly improve their position — one sentence"
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.

Return ONLY valid JSON. ${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion) }],
    }, { label: 'leverage-logic-prep-check' });
    if (parsed.readiness_score == null) {
      return res.status(500).json({ error: 'Could not analyze your leverage. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[LeverageLogic/prep-check] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// SIMULATE — war-game likely responses
// ═══════════════════════════════════════════════════════════════

router.post('/leverage-logic/simulate', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { situation, strategy, negotiationType, yourOpening, timeline, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!situation?.trim()) return res.status(400).json({ error: 'Situation is required' });

    const timelineBlock = timeline?.length
      ? `\nNEGOTIATION SO FAR:\n${timeline.map((t, i) => `Round ${i + 1} (${t.date}): ${t.who === 'you' ? 'YOU' : 'THEM'}: ${t.what} → Result: ${t.result || 'pending'}`).join('\n')}`
      : '';

    const prompt = `War-game a negotiation. Given the situation and what's happened so far, predict the 3 most likely responses to the next move and map out how to handle each.

SITUATION: ${situation}
TYPE: ${negotiationType || 'general'}
STRATEGY: ${strategy || 'not specified'}
YOUR OPENING/NEXT MOVE: ${yourOpening || 'as planned'}
${timelineBlock}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.

Return ONLY valid JSON:
{
  "scenarios": [
    {
      "likelihood": "most_likely / possible / unlikely_but_possible — one sentence",
      "they_say": "Their likely response — exact words — one sentence",
      "subtext": "What they actually mean — one sentence",
      "your_counter": "What to say back — exact words — one sentence",
      "then_expect": "What happens after your counter — one sentence",
      "end_state": "Where this path leads — one sentence"
    }
  ],
  "wild_card": {
    "scenario": "Something unexpected they might do — one sentence",
    "how_to_handle": "What to do if this happens — one sentence"
  },
  "best_path": "Which scenario to steer toward and how — one sentence",
  "danger_path": "Which scenario to avoid and early warning signs — one sentence"
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.

Return ONLY valid JSON. ${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion) }],
    }, { label: 'leverage-logic-simulate' });
    if (!parsed.scenarios) {
      return res.status(500).json({ error: 'Could not analyze your leverage. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[LeverageLogic/simulate] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// DRAFT EMAIL — convert strategy into a send-ready message
// ═══════════════════════════════════════════════════════════════

router.post('/leverage-logic/draft-email', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { situation, strategy, scripts, negotiationType, recipientName, tone, timeline, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!situation?.trim()) return res.status(400).json({ error: 'Situation is required' });

    const timelineBlock = timeline?.length
      ? `\nCONVERSATION SO FAR:\n${timeline.map(t => `${t.date}: ${t.who === 'you' ? 'You' : 'Them'}: ${t.what}`).join('\n')}`
      : '';

    const prompt = `Convert a negotiation strategy into a polished email/message ready to send. Written negotiations have different rules than spoken ones — be strategic about what goes in writing vs what should be said verbally.

SITUATION: ${situation}
TYPE: ${negotiationType || 'general'}
STRATEGY CONTEXT: ${strategy ? JSON.stringify(strategy) : 'general negotiation'}
KEY SCRIPTS: ${scripts ? scripts.map(s => s.say_this).join(' | ') : 'none provided'}
TO: ${recipientName || 'the other party'}
PREFERRED TONE: ${tone || 'professional but warm'}
${timelineBlock}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.

Return ONLY valid JSON:
{
  "drafts": [
    {
      "version": "Professional — one sentence",
      "subject_line": "Email subject — one sentence",
      "body": "Full email text ready to send — 2-4 sentences",
      "tone_note": "Why this tone for this situation — one sentence"
    },
    {
      "version": "Direct & Confident — one sentence",
      "subject_line": "Email subject — one sentence",
      "body": "Full email text — 2-4 sentences",
      "tone_note": "Why this version — one sentence"
    },
    {
      "version": "Warm & Collaborative — one sentence",
      "subject_line": "Email subject — one sentence",
      "body": "Full email text — 2-4 sentences",
      "tone_note": "Why this version — one sentence"
    }
  ],
  "do_not_put_in_writing": ["Things better said in person/phone — and why"],
  "subject_line_tip": "Why the subject line matters for this negotiation — one sentence",
  "timing_tip": "Best time to send this email and why — one sentence",
  "follow_up_plan": "What to do if no response in X days — one sentence"
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.

Return ONLY valid JSON. ${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2000,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion) }],
    }, { label: 'leverage-logic-draft-email' });
    if (!parsed.drafts) {
      return res.status(500).json({ error: 'Could not analyze your leverage. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[LeverageLogic/draft-email] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// DEBRIEF — post-negotiation analysis
// ═══════════════════════════════════════════════════════════════

router.post('/leverage-logic/debrief', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { situation, strategy, timeline, finalOutcome, desiredOutcome, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!finalOutcome?.trim()) return res.status(400).json({ error: 'Describe the final outcome' });

    const timelineBlock = timeline?.length
      ? `\nFULL TIMELINE:\n${timeline.map((t, i) => `Round ${i + 1} (${t.date}): ${t.who === 'you' ? 'YOU' : 'THEM'}: ${t.what}${t.result ? ` → ${t.result}` : ''}`).join('\n')}`
      : '';

    const prompt = `Debrief a completed negotiation. Be honest but constructive — what worked, what didn't, what to do differently next time.

SITUATION: ${situation || 'negotiation'}
ORIGINAL STRATEGY: ${strategy ? JSON.stringify(strategy) : 'not recorded'}
DESIRED OUTCOME: ${desiredOutcome || 'not specified'}
FINAL OUTCOME: ${finalOutcome}
${timelineBlock}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.

Return ONLY valid JSON:
{
  "outcome_grade": "A | B | C | D (single letter only)",
  "outcome_summary": "One sentence: how close to the goal",
  "what_worked": [
    { "tactic": "What you did well — one sentence", "impact": "How it helped (number)" }
  ],
  "what_didnt": [
    { "mistake": "What could have gone better — one sentence", "cost": "What it cost you (number)", "next_time": "What to do differently — one sentence" }
  ],
  "value_left_on_table": {
    "likely": "yes | no | maybe",
    "explanation": "Why and how much — 1-2 sentences",
    "how_to_capture": "Can you still go back for more? How? — one sentence"
  },
  "leverage_lessons": [
    "What you learned about your leverage in this situation"
  ],
  "for_next_time": {
    "do_more": "What to repeat — one sentence",
    "do_less": "What to stop doing — one sentence",
    "try_new": "New tactic to try — one sentence",
    "key_insight": "Biggest takeaway in one sentence"
  }
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.

Return ONLY valid JSON. ${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion) }],
    }, { label: 'leverage-logic-debrief' });
    if (!parsed.outcome_grade) {
      return res.status(500).json({ error: 'Could not analyze your leverage. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[LeverageLogic/debrief] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
