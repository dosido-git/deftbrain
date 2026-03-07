const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

// ════════════════════════════════════════════════════════════
// SHARED
// ════════════════════════════════════════════════════════════
const PERSONALITY = `You are a straight-talking money confidence coach. Not a financial advisor, not a therapist — you're the friend who's good with money AND good with people. You help people figure out what to DO and what to SAY when money situations get awkward, stressful, or confusing.

YOUR PERSONALITY:
- Direct and warm. Never preachy, never judgmental, never pitying.
- Action-first: "Here's your move" before "Here's why you feel this way."
- Give people actual words to say — texts to send, scripts to use, phrases that work.
- Acknowledge the feeling briefly, then pivot hard to practical next steps.
- Never use the word "shame." Never make people feel like they need fixing.
- Talk about money like it's a skill people are still learning, not a moral failing.
- Be honest: if someone overspent, say so gently but clearly. If the system screwed them, say that too.`;

// ════════════════════════════════════════════════════════════
// POST /money-moves — Quick Move: situation → action plan
// ════════════════════════════════════════════════════════════
router.post('/money-moves', async (req, res) => {
  try {
    const { situation, context, currency, userLanguage } = req.body;

    if (!situation?.trim()) {
      return res.status(400).json({ error: 'What\'s the situation?' });
    }

    const sym = currency || '$';

    const systemPrompt = `${PERSONALITY}
Use currency symbol: ${sym}. The person is in a money situation and needs to know what to do RIGHT NOW. Lead with the move, not the feelings.`;

    const userPrompt = `THE SITUATION: "${situation}"
${context ? `MORE CONTEXT: ${context}` : ''}

What's my move? Return ONLY valid JSON:

{
  "move_emoji": "Single emoji that captures the vibe of this situation",
  "headline": "Your move: [one bold sentence — the action they should take]",
  "reality_check": "One honest sentence about the situation. Not sugarcoated, not harsh.",
  "immediate_steps": [
    "Step 1: [specific action they can do in the next 5 minutes]",
    "Step 2: [next thing]",
    "Step 3: [if applicable]"
  ],
  "what_to_say": {
    "scenario": "The social moment they're navigating (if applicable)",
    "script": "Exact words they can say or text. Ready to copy-paste.",
    "backup_script": "Alternative if the first feels too direct"
  },
  "reframe": "One sentence that reframes this situation honestly. Not toxic positivity — real perspective.",
  "what_not_to_do": "One common mistake people make in this situation. Be specific.",
  "longer_term": "If there's a structural fix beyond the immediate moment, name it in 1-2 sentences. null if this is a one-time thing.",
  "related_scenarios": ["2-3 similar situations they might face next, so they're prepared"]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('MoneyMoves error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate your move' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /money-moves/scripts — Social script generator
// ════════════════════════════════════════════════════════════
router.post('/money-moves/scripts', async (req, res) => {
  try {
    const { scenario, relationship, tone, currency, userLanguage } = req.body;

    if (!scenario?.trim()) {
      return res.status(400).json({ error: 'What scenario do you need a script for?' });
    }

    const sym = currency || '$';

    const systemPrompt = `${PERSONALITY}
Generate ready-to-use scripts for money conversations. These should sound natural — like something a real person would actually text or say. Not corporate, not overly polite, not weird. Adjust tone based on the relationship. Use currency: ${sym}.`;

    const userPrompt = `SCRIPT REQUEST:
Scenario: "${scenario}"
${relationship ? `Relationship: ${relationship}` : ''}
${tone ? `Preferred tone: ${tone}` : ''}

Generate scripts. Return ONLY valid JSON:

{
  "scenario_name": "Short name for this scenario",
  "scripts": [
    {
      "label": "Direct",
      "style": "Honest and straightforward",
      "text": "The exact words to say/text. Ready to copy.",
      "best_for": "When to use this version"
    },
    {
      "label": "Casual",
      "style": "Light and low-pressure",
      "text": "A more casual version",
      "best_for": "When to use this version"
    },
    {
      "label": "Deflect",
      "style": "Changes the subject gracefully",
      "text": "A version that redirects without lying",
      "best_for": "When you don't want to explain"
    }
  ],
  "follow_up_scripts": {
    "if_they_push_back": "What to say if they don't accept the first answer",
    "if_they_offer_to_pay": "How to handle it if they offer to cover you"
  },
  "pro_tip": "One tactical tip for navigating this specific social scenario"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('MoneyMoves scripts error:', error);
    res.status(500).json({ error: error.message || 'Script generation failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /money-moves/triage — Bill/financial emergency triage
// ════════════════════════════════════════════════════════════
router.post('/money-moves/triage', async (req, res) => {
  try {
    const { billType, amount, currency, deadline, canPay, userLanguage } = req.body;

    if (!billType?.trim()) {
      return res.status(400).json({ error: 'What kind of bill or expense?' });
    }

    const sym = currency || '$';

    const systemPrompt = `${PERSONALITY}
You are triaging a financial situation. The person just got hit with a bill or expense and needs a clear action plan. No lecture about how they should have saved. Just: here's what you do, step by step, starting now. Use currency: ${sym}.`;

    const userPrompt = `BILL TRIAGE:
Type: "${billType}"
${amount ? `Amount: ${sym}${amount}` : 'Amount: Unknown'}
${deadline ? `Due: ${deadline}` : ''}
Can they pay it right now: ${canPay || 'unclear'}

Triage this. Return ONLY valid JSON:

{
  "severity": "LOW | MEDIUM | HIGH | URGENT",
  "severity_emoji": "🟢 | 🟡 | 🟠 | 🔴",
  "first_move": "The very first thing to do. One sentence. Do this TODAY.",
  "action_plan": [
    {
      "step": "Step description",
      "when": "Today | This week | Within 30 days",
      "what_to_say": "If this step involves calling someone, exact script to use. null if not applicable.",
      "pro_tip": "One insider tip for this step"
    }
  ],
  "negotiation_scripts": {
    "payment_plan_request": "Exact words to request a payment plan from this type of provider",
    "hardship_request": "Words to ask about hardship programs or reduced rates. null if not applicable.",
    "delay_request": "Words to ask for a deadline extension"
  },
  "hidden_options": ["2-3 options most people don't know about for this type of bill (assistance programs, negotiation leverage, legal protections, etc.)"],
  "what_NOT_to_do": ["1-2 common mistakes to avoid with this type of bill"],
  "perspective": "One honest sentence putting this in perspective. Not dismissive, but grounding."
}`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('MoneyMoves triage error:', error);
    res.status(500).json({ error: error.message || 'Triage failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /money-moves/guilt — Purchase guilt check
// ════════════════════════════════════════════════════════════
router.post('/money-moves/guilt', async (req, res) => {
  try {
    const { item, amount, currency, context, userLanguage } = req.body;

    if (!item?.trim()) {
      return res.status(400).json({ error: 'What did you buy?' });
    }

    const sym = currency || '$';

    const systemPrompt = `${PERSONALITY}
Someone just bought something and feels guilty. Give them an honest assessment — not blind reassurance, not a lecture. If it was fine, tell them why. If it was a stretch, tell them that too, but gently and with a plan. Use currency: ${sym}.`;

    const userPrompt = `GUILT CHECK:
What I bought: "${item}"
${amount ? `How much: ${sym}${amount}` : ''}
${context ? `Context: ${context}` : ''}

Was this okay? Return ONLY valid JSON:

{
  "verdict": "TOTALLY FINE | REASONABLE | WORTH WATCHING | MIGHT BE A PATTERN",
  "verdict_emoji": "✅ | 👍 | 👀 | ⚠️",
  "honest_take": "2-3 sentences. Be real. Was this a good spend, a neutral spend, or a concerning one? Don't just validate — be honest.",
  "guilt_source": "Why they probably feel guilty — name the specific social or internal pressure.",
  "reality_check": {
    "what_others_spend": "Context on what people typically spend on this. Normalize or flag.",
    "one_time_vs_pattern": "Is this a one-time thing or a recurring pattern? Why it matters.",
    "opportunity_cost": "What else could this money have done? Be specific but not preachy."
  },
  "if_it_was_fine": "Specific reason to let the guilt go. null if it wasn't fine.",
  "if_it_was_a_stretch": "One small corrective action to balance it out. null if it was fine.",
  "rule_of_thumb": "A personal money rule they can use for future decisions like this. Make it memorable."
}`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('MoneyMoves guilt error:', error);
    res.status(500).json({ error: error.message || 'Guilt check failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /money-moves/money-talk — Partner/Roommate money conversation
// ════════════════════════════════════════════════════════════
router.post('/money-moves/money-talk', async (req, res) => {
  try {
    const { topic, relationship, context, currency, userLanguage } = req.body;

    if (!topic?.trim()) {
      return res.status(400).json({ error: 'What do you need to talk about?' });
    }

    const sym = currency || '$';

    const systemPrompt = `${PERSONALITY}
You are guiding someone through a difficult money conversation with their partner, roommate, or close person. This is NOT a one-liner script — it's a full conversation framework. Give them the order to bring things up, specific phrases, how to handle defensiveness, and how to land on an agreement. Use currency: ${sym}.

CRITICAL: Money conversations in relationships are emotional. Your framework must:
- Start with connection, not numbers
- Use "we" language, not "you" accusations
- Acknowledge both people's perspectives
- End with a concrete next step both agree on`;

    const userPrompt = `MONEY TALK:
Topic: "${topic}"
Relationship: ${relationship || 'Partner'}
${context ? `Context: ${context}` : ''}

Build a conversation framework. Return ONLY valid JSON:

{
  "conversation_name": "Short name (e.g., 'The Budget Reset Talk', 'The Split Expenses Chat')",
  "prep_work": {
    "before_you_start": "What to do/gather before having this conversation",
    "best_timing": "When and where to have this talk",
    "mindset": "One sentence to keep in your head during the conversation"
  },
  "opening": {
    "opener": "Exact opening sentence — sets the tone without triggering defensiveness",
    "framing": "How to frame the conversation as a team effort, not a complaint",
    "avoid_saying": "A common opener that backfires — and why"
  },
  "talking_points": [
    {
      "point": "What to bring up",
      "how_to_say_it": "Exact phrasing",
      "if_they_get_defensive": "How to de-escalate if this point triggers a reaction",
      "goal": "What you're trying to agree on for this point"
    }
  ],
  "tough_moments": {
    "if_they_shut_down": "What to say if they go quiet or refuse to engage",
    "if_it_gets_heated": "How to cool things down without abandoning the conversation",
    "if_they_deflect": "How to gently redirect if they change the subject"
  },
  "landing_the_plane": {
    "summary_phrase": "How to summarize what you've agreed on",
    "next_step": "One concrete next step to agree on before ending the talk",
    "follow_up": "When and how to check back in on this"
  },
  "pro_tip": "One insight about money conversations in ${relationship || 'partner'} relationships that most people don't know"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('MoneyMoves money-talk error:', error);
    res.status(500).json({ error: error.message || 'Money talk generation failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /money-moves/pulse — Financial Pulse Check
// ════════════════════════════════════════════════════════════
router.post('/money-moves/pulse', async (req, res) => {
  try {
    const { income, rent, recentSpending, currency, concerns, userLanguage } = req.body;

    const sym = currency || '$';

    const systemPrompt = `${PERSONALITY}
You are giving someone a quick, honest financial pulse check. NOT a budget plan. NOT financial advice. Just: "based on what you told me, here's where you stand." Be honest — if they're stretched, say so. If they're fine, say so. Use currency: ${sym}.

IMPORTANT: You are not a financial advisor. Frame everything as general observations, not professional advice. If someone is in serious trouble, suggest they talk to a nonprofit credit counselor.`;

    const userPrompt = `PULSE CHECK:
${income ? `Monthly income: ~${sym}${income}` : 'Income: not shared'}
${rent ? `Rent/housing: ~${sym}${rent}/mo` : 'Rent: not shared'}
${recentSpending ? `Recent spending that's on their mind: ${recentSpending}` : ''}
${concerns ? `What's worrying them: ${concerns}` : ''}

Give a quick, honest pulse. Return ONLY valid JSON:

{
  "pulse_emoji": "🟢 | 🟡 | 🟠 | 🔴",
  "pulse_verdict": "YOU'RE OKAY | WATCH IT | STRETCHED | GET HELP",
  "honest_read": "2-3 sentences. Be direct. Where do they actually stand based on what they shared?",
  "the_math": {
    "housing_ratio": "What % of income goes to housing? Is that healthy? (general rule: under 30% is comfortable)",
    "breathing_room": "Roughly how much flexibility do they have after necessities? 'A lot', 'Some', 'Tight', 'Negative'",
    "context": "How does their situation compare to typical? Normalize without dismissing."
  },
  "biggest_risk": "The one financial risk they should be most aware of right now. Be specific.",
  "one_thing_to_do": "If they do nothing else, do THIS one thing. Make it concrete and doable.",
  "what_youre_doing_right": "Something positive about their situation or the fact they're checking. Not fake — find something real.",
  "when_to_worry": "Specific signals that would mean they need professional help",
  "free_resources": ["2-3 free resources: nonprofit credit counseling, budgeting apps, assistance programs"]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('MoneyMoves pulse error:', error);
    res.status(500).json({ error: error.message || 'Pulse check failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /money-moves/followup — "They said no, now what?"
// ════════════════════════════════════════════════════════════
router.post('/money-moves/followup', async (req, res) => {
  try {
    const { originalSituation, theirResponse, whatYouTried, currency, userLanguage } = req.body;

    if (!originalSituation?.trim() || !theirResponse?.trim()) {
      return res.status(400).json({ error: 'Need the situation and their response' });
    }

    const sym = currency || '$';

    const systemPrompt = `${PERSONALITY}
Someone tried to negotiate, set a boundary, or handle a money situation — and the other party pushed back. Now they need the next move. This might be round 2 of a negotiation with a company, or a social situation where their friend didn't accept their "no." Help them escalate appropriately without burning bridges. Use currency: ${sym}.`;

    const userPrompt = `FOLLOW-UP:
Original situation: "${originalSituation}"
What I tried: "${whatYouTried || 'Used the initial script'}"
Their response: "${theirResponse}"

What's my next move? Return ONLY valid JSON:

{
  "assessment": "What their response tells you — are they firm, flexible, or bluffing?",
  "next_move": "The strategy for round 2. One clear sentence.",
  "escalation_script": "Exact words for the next attempt. Firmer but still professional.",
  "soft_alternative": "A compromise position if you want to meet halfway",
  "nuclear_option": "The last resort if nothing else works. What's your leverage? What are the consequences of walking away?",
  "know_your_rights": "Any legal protections or policies that apply to this situation. null if purely social.",
  "when_to_fold": "When to accept the situation and move on. Not every battle is worth winning.",
  "pro_tip": "One negotiation insight for this specific type of follow-up"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('MoneyMoves followup error:', error);
    res.status(500).json({ error: error.message || 'Follow-up generation failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /money-moves/rehearsal — Conversation rehearsal tree
// ════════════════════════════════════════════════════════════
router.post('/money-moves/rehearsal', async (req, res) => {
  try {
    const { scenario, relationship, yourGoal, currency, userLanguage } = req.body;

    if (!scenario?.trim()) {
      return res.status(400).json({ error: 'What conversation are you rehearsing?' });
    }

    const sym = currency || '$';

    const systemPrompt = `${PERSONALITY}
You are building a conversation rehearsal — a back-and-forth script the person can practice before having the real conversation. Generate realistic dialogue exchanges with the most likely responses the other person will give (cooperative, resistant, and deflecting). Each exchange should feel natural, not robotic. Use currency: ${sym}.

The person will tap through this like flashcards. Make each exchange short (1-2 sentences per turn). Generate 4-5 exchanges that cover the full arc: opening, the ask, likely pushback, your response to pushback, and landing.`;

    const userPrompt = `REHEARSAL:
Scenario: "${scenario}"
${relationship ? `Other person: ${relationship}` : ''}
${yourGoal ? `My goal: ${yourGoal}` : ''}

Build a rehearsal. Return ONLY valid JSON:

{
  "rehearsal_name": "Short name (e.g., 'The Raise Ask', 'Splitting Rent Fairly')",
  "context_note": "One sentence of context before they start practicing",
  "exchanges": [
    {
      "step": 1,
      "you_say": "What you say (exact words, ready to practice out loud)",
      "they_might_say": "Most likely response (realistic, not worst case)",
      "coaching_note": "Quick tip about delivery — tone, timing, body language"
    },
    {
      "step": 2,
      "you_say": "Your next line",
      "they_might_say": "Their response",
      "coaching_note": "Quick tip"
    }
  ],
  "hard_mode": [
    {
      "they_say": "A tougher version of their response — the pushback you're afraid of",
      "you_say": "How to handle the hard version",
      "why_this_works": "Why this response is effective"
    }
  ],
  "confidence_boosters": [
    "2-3 things to remember that will help you feel more confident going in"
  ],
  "right_before": "One thing to do in the 5 minutes before the actual conversation"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('MoneyMoves rehearsal error:', error);
    res.status(500).json({ error: error.message || 'Rehearsal generation failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /money-moves/simulator — Scenario "what if" simulator
// ════════════════════════════════════════════════════════════
router.post('/money-moves/simulator', async (req, res) => {
  try {
    const { scenario, income, rent, savings, otherContext, currency, userLanguage } = req.body;

    if (!scenario?.trim()) {
      return res.status(400).json({ error: 'What scenario are you considering?' });
    }

    const sym = currency || '$';

    const systemPrompt = `${PERSONALITY}
Someone is considering a major financial decision and wants to know "what does this actually look like?" Give them a realistic month-by-month picture — not a full financial plan, just enough clarity to turn anxiety into a decision. Use currency: ${sym}.

IMPORTANT: You are not a financial advisor. Frame everything as rough estimates and general observations. Encourage them to verify specifics with a professional for major decisions.`;

    const userPrompt = `SCENARIO SIMULATOR:
What I'm considering: "${scenario}"
${income ? `Monthly income: ~${sym}${income}` : ''}
${rent ? `Current rent/housing: ~${sym}${rent}/mo` : ''}
${savings ? `Savings: ~${sym}${savings}` : ''}
${otherContext ? `Other context: ${otherContext}` : ''}

Simulate this scenario. Return ONLY valid JSON:

{
  "scenario_name": "Short name",
  "feasibility": "VERY DOABLE | DOABLE WITH ADJUSTMENTS | TIGHT BUT POSSIBLE | RISKY | NOT YET",
  "feasibility_emoji": "🟢 | 🟡 | 🟠 | 🔴 | ⏳",
  "honest_take": "2-3 sentences. Can they actually do this? Be real.",
  "the_math": {
    "monthly_impact": "How this changes their monthly picture (rough estimate)",
    "timeline": "How long until this feels normal/stable",
    "cushion_needed": "How much financial cushion they should have before pulling the trigger"
  },
  "month_by_month": [
    {
      "month": "Month 1-2",
      "what_happens": "Realistic picture of this period",
      "watch_for": "Risk or adjustment needed"
    },
    {
      "month": "Month 3-6",
      "what_happens": "The settling-in phase",
      "watch_for": "What to monitor"
    },
    {
      "month": "Month 6-12",
      "what_happens": "The new normal",
      "watch_for": "Long-term consideration"
    }
  ],
  "make_it_work": [
    "3-4 specific things they can do to make this scenario more viable"
  ],
  "deal_breakers": ["1-2 conditions that would make this a bad idea — be specific"],
  "before_you_decide": "One thing to research or verify before committing",
  "confidence_verdict": "One sentence: should they go for it? Be direct."
}`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('MoneyMoves simulator error:', error);
    res.status(500).json({ error: error.message || 'Simulation failed' });
  }
});

module.exports = router;
