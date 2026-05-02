const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

function safeParseJSON(text) {
  let cleaned = cleanJsonResponse(text);
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
  try { return JSON.parse(cleaned); } catch {
    cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, ' ');
    try { return JSON.parse(cleaned); } catch {
      cleaned = cleaned.replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":');
      return JSON.parse(cleaned);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN — full negotiation strategy
// ═══════════════════════════════════════════════════════════════

router.post('/leverage-logic', async (req, res) => {
  try {
    const { situation, leverage, desired, urgency, relationship, negotiationType, pastAttempts } = req.body;

    if (!situation?.trim()) return res.status(400).json({ error: 'Describe your negotiation situation' });

    const pastBlock = pastAttempts?.length
      ? `\nPAST ATTEMPTS:\n${pastAttempts.map(a => `- ${a.date}: ${a.approach} → ${a.result}`).join('\n')}`
      : '';

    const prompt = `You are a negotiation strategist. Analyze this situation and build a complete game plan. Be specific to THEIR situation — no generic advice. Every script should sound natural, not corporate.

SITUATION: ${situation}
NEGOTIATION TYPE: ${negotiationType || 'general'}
THEIR LEVERAGE: ${leverage || 'Not specified — identify what they have'}
DESIRED OUTCOME: ${desired || 'Not specified — suggest realistic targets'}
URGENCY: ${urgency || 'moderate'}
RELATIONSHIP IMPORTANCE: ${relationship || 'moderate — want to maintain'}
${pastBlock}

Return ONLY valid JSON:
{
  "situation_read": {
    "summary": "One-sentence read of the situation",
    "power_balance": "who_has_leverage / balanced / they_have_leverage",
    "power_explanation": "Why, in one sentence",
    "negotiation_type": "salary / vendor / lease / purchase / freelance / partnership / dispute / other",
    "stakes": "low / medium / high",
    "complexity": "straightforward / moderate / complex"
  },
  "your_leverage": [
    {
      "point": "What you have",
      "strength": "strong / medium / weak",
      "how_to_use": "Specific way to deploy this",
      "when": "Early / middle / if they push back",
      "warning": "Risk of overplaying this"
    }
  ],
  "their_leverage": [
    {
      "point": "What they have",
      "strength": "strong / medium / weak",
      "how_to_neutralize": "How to reduce its impact"
    }
  ],
  "strategy": {
    "approach": "Name for the overall approach (e.g., 'Anchoring high with data', 'Collaborative problem-solving')",
    "opening_position": "Where to start and why",
    "target": "Realistic best outcome",
    "walkaway": "Minimum acceptable — below this, walk",
    "concession_ladder": [
      { "order": 1, "give_up": "First thing to concede", "costs_you": "low / medium", "value_to_them": "high — makes you look flexible" },
      { "order": 2, "give_up": "Second concession", "costs_you": "medium", "value_to_them": "medium" }
    ],
    "timing": "When to have this conversation and why",
    "setting": "Where/how to have it (in person, email, etc.)"
  },
  "scripts": [
    {
      "moment": "Opening the conversation",
      "say_this": "Exact words to use",
      "why_it_works": "Brief explanation",
      "tone": "confident / warm / matter-of-fact"
    },
    {
      "moment": "Presenting your ask",
      "say_this": "Exact words",
      "why_it_works": "Brief explanation",
      "tone": "tone"
    },
    {
      "moment": "If they say no or push back",
      "say_this": "Exact words",
      "why_it_works": "Brief explanation",
      "tone": "tone"
    },
    {
      "moment": "Deploying your leverage",
      "say_this": "Exact words — subtle, not threatening",
      "why_it_works": "Brief explanation",
      "tone": "tone"
    },
    {
      "moment": "Closing / getting to yes",
      "say_this": "Exact words",
      "why_it_works": "Brief explanation",
      "tone": "tone"
    }
  ],
  "traps_to_avoid": [
    {
      "trap": "Common mistake for this type of negotiation",
      "why_dangerous": "What happens if you fall for it",
      "instead": "What to do instead"
    }
  ],
  "batna": {
    "best_alternative": "Your best option if this fails",
    "how_strong": "strong / decent / weak",
    "how_to_strengthen": "What to do now to improve your fallback",
    "mention_it": "yes_subtly / no_keep_private / only_if_desperate"
  },
  "body_language": {
    "do": ["Specific body language tip"],
    "avoid": ["What not to do physically"]
  },
  "confidence_boost": "One sentence reminder of why they're in a stronger position than they think"
}

Return ONLY valid JSON.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = safeParseJSON(raw);
    res.json(parsed);

  } catch (error) {
    console.error('[LeverageLogic] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze negotiation' });
  }
});

// ═══════════════════════════════════════════════════════════════
// COUNTER — handle a specific objection or response
// ═══════════════════════════════════════════════════════════════

router.post('/leverage-logic/counter', async (req, res) => {
  try {
    const { situation, theyJustSaid, yourGoal, tonePreference } = req.body;

    if (!theyJustSaid?.trim()) return res.status(400).json({ error: 'What did they say?' });

    const prompt = `Someone is in a negotiation and the other side just responded. Help them with an immediate counter-move. Be specific and natural — these should sound like real words a real person would say.

SITUATION: ${situation || 'ongoing negotiation'}
THEY JUST SAID: "${theyJustSaid}"
YOUR GOAL: ${yourGoal || 'get a better deal'}
PREFERRED TONE: ${tonePreference || 'confident but not aggressive'}

Return ONLY valid JSON:
{
  "read": "What their response actually means (the subtext)",
  "their_tactic": "Name the negotiation tactic they're using, if any",
  "danger_level": "safe / caution / red_flag",
  "responses": [
    {
      "approach": "Name for this approach (2-3 words)",
      "say_this": "Exact words to respond with",
      "then_what": "What to expect after you say this",
      "risk": "low / medium / high",
      "best_if": "When this approach works best"
    }
  ],
  "do_not_say": "Common knee-jerk response that would hurt you",
  "silence_option": "Sometimes the best move is to say nothing. Is this one of those times? Why or why not."
}

Return ONLY valid JSON.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = safeParseJSON(raw);
    res.json(parsed);

  } catch (error) {
    console.error('[LeverageLogic/counter] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate counter' });
  }
});

// ═══════════════════════════════════════════════════════════════
// PREP CHECK — pre-negotiation readiness assessment
// ═══════════════════════════════════════════════════════════════

router.post('/leverage-logic/prep-check', async (req, res) => {
  try {
    const { situation, whatYouKnow, whatYouDontKnow, negotiationType } = req.body;

    if (!situation?.trim()) return res.status(400).json({ error: 'Describe the situation' });

    const prompt = `Someone is about to enter a negotiation. Assess how prepared they are and tell them exactly what homework to do before they walk in.

SITUATION: ${situation}
TYPE: ${negotiationType || 'general'}
WHAT THEY KNOW: ${whatYouKnow || 'Not specified'}
GAPS THEY'RE AWARE OF: ${whatYouDontKnow || 'Not specified'}

Return ONLY valid JSON:
{
  "readiness_score": 65,
  "readiness_label": "almost_ready / needs_work / not_ready",
  "critical_gaps": [
    {
      "gap": "What they don't know yet",
      "why_critical": "How it could hurt them",
      "how_to_find": "Specific way to get this information",
      "time_needed": "5 min / 30 min / a few hours"
    }
  ],
  "strengths": ["What they already have going for them"],
  "homework": [
    {
      "task": "Specific research or prep task",
      "priority": "must_do / should_do / nice_to_have",
      "time": "How long it takes"
    }
  ],
  "ready_when": "You're ready to negotiate when you can answer: [specific question]",
  "quick_win": "One thing they can do in 5 minutes that will significantly improve their position"
}

Return ONLY valid JSON.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = safeParseJSON(raw);
    res.json(parsed);

  } catch (error) {
    console.error('[LeverageLogic/prep-check] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to assess readiness' });
  }
});

// ═══════════════════════════════════════════════════════════════
// SIMULATE — war-game likely responses
// ═══════════════════════════════════════════════════════════════

router.post('/leverage-logic/simulate', async (req, res) => {
  try {
    const { situation, strategy, negotiationType, yourOpening, timeline } = req.body;

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

Return ONLY valid JSON:
{
  "scenarios": [
    {
      "likelihood": "most_likely / possible / unlikely_but_possible",
      "they_say": "Their likely response — exact words",
      "subtext": "What they actually mean",
      "your_counter": "What to say back — exact words",
      "then_expect": "What happens after your counter",
      "end_state": "Where this path leads"
    }
  ],
  "wild_card": {
    "scenario": "Something unexpected they might do",
    "how_to_handle": "What to do if this happens"
  },
  "best_path": "Which scenario to steer toward and how",
  "danger_path": "Which scenario to avoid and early warning signs"
}

Return ONLY valid JSON.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = safeParseJSON(raw);
    res.json(parsed);

  } catch (error) {
    console.error('[LeverageLogic/simulate] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to simulate' });
  }
});

// ═══════════════════════════════════════════════════════════════
// DRAFT EMAIL — convert strategy into a send-ready message
// ═══════════════════════════════════════════════════════════════

router.post('/leverage-logic/draft-email', async (req, res) => {
  try {
    const { situation, strategy, scripts, negotiationType, recipientName, tone, timeline } = req.body;

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

Return ONLY valid JSON:
{
  "drafts": [
    {
      "version": "Professional",
      "subject_line": "Email subject",
      "body": "Full email text ready to send",
      "tone_note": "Why this tone for this situation"
    },
    {
      "version": "Direct & Confident",
      "subject_line": "Email subject",
      "body": "Full email text",
      "tone_note": "Why this version"
    },
    {
      "version": "Warm & Collaborative",
      "subject_line": "Email subject",
      "body": "Full email text",
      "tone_note": "Why this version"
    }
  ],
  "do_not_put_in_writing": ["Things better said in person/phone — and why"],
  "subject_line_tip": "Why the subject line matters for this negotiation",
  "timing_tip": "Best time to send this email and why",
  "follow_up_plan": "What to do if no response in X days"
}

Return ONLY valid JSON.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = safeParseJSON(raw);
    res.json(parsed);

  } catch (error) {
    console.error('[LeverageLogic/draft-email] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to draft email' });
  }
});

// ═══════════════════════════════════════════════════════════════
// DEBRIEF — post-negotiation analysis
// ═══════════════════════════════════════════════════════════════

router.post('/leverage-logic/debrief', async (req, res) => {
  try {
    const { situation, strategy, timeline, finalOutcome, desiredOutcome } = req.body;

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

Return ONLY valid JSON:
{
  "outcome_grade": "A / B / C / D",
  "outcome_summary": "One sentence: how close to the goal",
  "what_worked": [
    { "tactic": "What you did well", "impact": "How it helped" }
  ],
  "what_didnt": [
    { "mistake": "What could have gone better", "cost": "What it cost you", "next_time": "What to do differently" }
  ],
  "value_left_on_table": {
    "likely": "yes / no / maybe",
    "explanation": "Why and how much",
    "how_to_capture": "Can you still go back for more? How?"
  },
  "leverage_lessons": [
    "What you learned about your leverage in this situation"
  ],
  "for_next_time": {
    "do_more": "What to repeat",
    "do_less": "What to stop doing",
    "try_new": "New tactic to try",
    "key_insight": "Biggest takeaway in one sentence"
  }
}

Return ONLY valid JSON.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = safeParseJSON(raw);
    res.json(parsed);

  } catch (error) {
    console.error('[LeverageLogic/debrief] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to debrief' });
  }
});

module.exports = router;
