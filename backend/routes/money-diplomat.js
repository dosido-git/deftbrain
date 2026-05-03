const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');
const { rateLimit } = require('../lib/rateLimiter');

// ═══════════════════════════════════════════════════
// ROUTE 1: TIP ADVISOR — Culturally calibrated tip recommendation
// ═══════════════════════════════════════════════════
router.post('/money-diplomat-tip', rateLimit(), async (req, res) => {
  try {
    const { situation, country, serviceType, billAmount, partySize, userLanguage } = req.body;

    if (!situation?.trim()) {
      return res.status(400).json({ error: 'Describe the service situation.' });
    }

    const prompt = withLanguage(`Give a culturally calibrated tip recommendation for this specific situation. Not a percentage lookup — a nuanced judgment call that accounts for everything described.

SITUATION: "${situation.trim()}"
COUNTRY: ${country?.trim() || 'USA'}
SERVICE TYPE: ${serviceType || 'restaurant'}
BILL AMOUNT: ${billAmount || 'Not specified'}
PARTY SIZE: ${partySize || 'Not specified'}

Return ONLY valid JSON:
{
  "recommendation": {
    "percentage": 20,
    "amount": "$24.00",
    "range": { "low": "$20.00", "mid": "$24.00", "generous": "$30.00" },
    "verdict": "Standard|Above average|Below average — and why this situation warrants it"
  },
  "reasoning": "2-3 sentences explaining why this specific percentage for THIS situation — reference the details they gave",
  "cultural_context": "What's normal in this country/region for this type of service — be specific",
  "adjustments": [
    {
      "factor": "Something from their description that moved the tip up or down",
      "direction": "up|down|neutral",
      "explanation": "Why this factor matters"
    }
  ],
  "etiquette_notes": [
    "1-3 specific things to know — e.g., 'Auto-gratuity was likely already included for parties of 8+, check the bill'"
  ],
  "awkward_scenario": {
    "question": "The specific awkward question they're probably wondering — e.g., 'Should I tip on top of the auto-gratuity?'",
    "answer": "Direct answer with reasoning"
  }
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, {
      label: 'MoneyDiplomatTip',
      max_tokens: 2000,
      system: withLanguage('You are a tipping etiquette expert who gives specific, culturally aware recommendations. You know the difference between what\'s expected, what\'s generous, and what\'s insulting in every context. Return ONLY valid JSON. No markdown.', userLanguage),
    });

    res.json(parsed);

  } catch (error) {
    console.error('[MoneyDiplomatTip] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to calculate tip.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 2: BILL SPLITTER — Fair split with social dynamics
// ═══════════════════════════════════════════════════
router.post('/money-diplomat-split', rateLimit(), async (req, res) => {
  try {
    const { situation, people, totalBill, userLanguage } = req.body;

    if (!situation?.trim()) {
      return res.status(400).json({ error: 'Describe the bill situation.' });
    }

    const prompt = withLanguage(`Figure out the fairest way to split this bill, accounting for the social dynamics. This isn't just math — it's diplomacy.

SITUATION: "${situation.trim()}"
PEOPLE INVOLVED: ${people?.trim() || 'Not specified'}
TOTAL BILL: ${totalBill || 'Not specified'}

Return ONLY valid JSON:
{
  "options": [
    {
      "method": "Equal Split|Proportional|Social Split|Custom",
      "breakdown": [
        { "person": "Person description", "amount": "$XX.XX", "reasoning": "Why this amount" }
      ],
      "total_with_tip": "$XXX.XX",
      "fairness_score": 85,
      "social_score": 95,
      "best_for": "When to use this option — e.g., 'When everyone's close friends and nobody's counting'"
    }
  ],
  "recommended": "Which option you'd recommend for THIS specific group dynamic and why",
  "the_awkward_part": "The specific tension in this situation — e.g., 'One person ordered significantly more'",
  "how_to_bring_it_up": "Exact words to say if you need to suggest a non-equal split — natural, not awkward",
  "tip_recommendation": {
    "percentage": 20,
    "total_tip": "$XX.XX",
    "note": "How to handle tip in the split — per person or on total"
  },
  "next_time": "How to prevent this situation in the future — one practical tip"
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, {
      label: 'MoneyDiplomatSplit',
      max_tokens: 2500,
      system: withLanguage('You are a social dynamics expert who splits bills fairly while preserving friendships. You understand that "fair" and "equal" aren\'t always the same thing. Return ONLY valid JSON. No markdown.', userLanguage),
    });

    res.json(parsed);

  } catch (error) {
    console.error('[MoneyDiplomatSplit] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to split bill.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 3: VENMO VERDICT — Should I request this?
// ═══════════════════════════════════════════════════
router.post('/money-diplomat-venmo', rateLimit(), async (req, res) => {
  try {
    const { situation, amount, relationship, timePassed, userLanguage } = req.body;

    if (!situation?.trim()) {
      return res.status(400).json({ error: 'Describe the money situation.' });
    }

    const prompt = withLanguage(`Someone is wondering whether they should request money back. Give them a clear verdict and, if yes, the exact words to use.

SITUATION: "${situation.trim()}"
AMOUNT: ${amount || 'Not specified'}
RELATIONSHIP: ${relationship || 'Friend'}
TIME SINCE: ${timePassed || 'Not specified'}

Return ONLY valid JSON:
{
  "verdict": "Yes, request it|Yes, but gently|Let it go|It's complicated",
  "confidence": 85,
  "reasoning": "Why this verdict — reference the specific dynamics of their situation",
  "the_math": {
    "amount_at_stake": "$XX",
    "relationship_value": "How much is this friendship/relationship worth to you",
    "resentment_risk": "How likely you are to resent them if you don't ask — Low|Medium|High"
  },
  "if_requesting": {
    "message": "The exact text/message to send — casual, natural, not passive-aggressive",
    "platform": "Text|Venmo note|In person|Don't use Venmo for this",
    "timing": "When to send it — now, next time you see them, next time money comes up naturally",
    "tone_guide": "The vibe to strike — e.g., 'Casual, like you just remembered, no big deal'"
  },
  "if_letting_go": {
    "reframe": "How to think about it so you don't resent them",
    "prevention": "How to prevent this next time with this specific person"
  },
  "the_line": "The exact dollar amount threshold where this shifts from 'let it go' to 'definitely ask' for this type of relationship"
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, {
      label: 'MoneyDiplomatVenmo',
      max_tokens: 2000,
      system: withLanguage('You are a social money advisor who helps people navigate the awkward territory of requesting money from friends and family. You\'re practical, not preachy. Return ONLY valid JSON. No markdown.', userLanguage),
    });

    res.json(parsed);

  } catch (error) {
    console.error('[MoneyDiplomatVenmo] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to assess.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 4: GIFT CALCULATOR — How much to spend
// ═══════════════════════════════════════════════════
router.post('/money-diplomat-gift', rateLimit(), async (req, res) => {
  try {
    const { occasion, relationship, theirSpend, yourBudget, region, userLanguage } = req.body;

    if (!occasion?.trim() || !relationship?.trim()) {
      return res.status(400).json({ error: 'Describe the occasion and relationship.' });
    }

    const prompt = withLanguage(`How much should this person spend on this gift? Not a gift idea — just the amount, calibrated to the relationship, occasion, and social norms.

OCCASION: "${occasion.trim()}"
RELATIONSHIP: "${relationship.trim()}"
THEIR LIKELY SPEND ON YOU: ${theirSpend || 'Unknown'}
YOUR BUDGET: ${yourBudget || 'Flexible'}
REGION/CULTURE: ${region || 'USA'}

Return ONLY valid JSON:
{
  "recommendation": {
    "amount": "$75",
    "range": { "minimum": "$50", "sweet_spot": "$75", "generous": "$120" },
    "verdict": "One sentence — e.g., '$75 hits the sweet spot: thoughtful without being awkward'"
  },
  "calibration": {
    "occasion_weight": "How much this occasion typically demands — casual|moderate|significant|major",
    "relationship_factor": "How the closeness affects the amount",
    "reciprocity_note": "How their likely spend on you affects what you should spend",
    "regional_norm": "What's typical for this occasion in this region/culture"
  },
  "group_gift_option": {
    "makes_sense": true,
    "your_share": "$25-35",
    "how_to_organize": "How to suggest going in together — exact words"
  },
  "pitfalls": [
    {
      "mistake": "A common spending mistake for this occasion",
      "why_bad": "Why it backfires",
      "instead": "What to do instead"
    }
  ],
  "the_real_answer": "The honest, unfiltered take — e.g., 'Nobody remembers how much you spent. They remember if the gift was thoughtful. A $30 gift with a handwritten note beats a $100 Amazon card.'"
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, {
      label: 'MoneyDiplomatGift',
      max_tokens: 2000,
      system: withLanguage('You are a gift-giving advisor who knows the unspoken rules about how much to spend. You calibrate to relationship dynamics, cultural norms, and social expectations. Return ONLY valid JSON. No markdown.', userLanguage),
    });

    res.json(parsed);

  } catch (error) {
    console.error('[MoneyDiplomatGift] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to calculate gift amount.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 5: ROOMMATE RECKONER — Fair shared-living splits
// ═══════════════════════════════════════════════════
router.post('/money-diplomat-roommate', rateLimit(), async (req, res) => {
  try {
    const { situation, people, totalCost, userLanguage } = req.body;

    if (!situation?.trim()) {
      return res.status(400).json({ error: 'Describe the roommate situation.' });
    }

    const prompt = withLanguage(`Figure out a fair money arrangement for this shared-living situation. Account for all the factors that make "just split it equally" not actually fair.

SITUATION: "${situation.trim()}"
PEOPLE: ${people?.trim() || 'Not specified'}
COSTS: ${totalCost || 'Not specified'}

Return ONLY valid JSON:
{
  "fair_split": [
    {
      "person": "Person/room description",
      "amount": "$XXX/month",
      "percentage": 45,
      "adjustments": ["Each factor that moved their share up or down"]
    }
  ],
  "methodology": "How the split was calculated — square footage, amenities, usage, etc.",
  "factors_considered": [
    {
      "factor": "e.g., 'Master bedroom has private bathroom'",
      "impact": "+$XX or -$XX",
      "reasoning": "Why this adjustment is fair"
    }
  ],
  "the_conversation": {
    "when": "When to bring this up — before signing, at move-in, or now",
    "opener": "Exact words to start this conversation without it feeling accusatory",
    "if_pushback": "What to say if someone disagrees with the split"
  },
  "house_rules_suggestion": "2-3 money rules that would prevent future conflict — specific to their situation",
  "common_trap": "The most common roommate money mistake for this type of arrangement"
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, {
      label: 'MoneyDiplomatRoommate',
      max_tokens: 2500,
      system: withLanguage('You are a shared-living fairness expert. You know that equal isn\'t always fair and can explain adjustments in a way both sides accept. Return ONLY valid JSON. No markdown.', userLanguage),
    });

    res.json(parsed);

  } catch (error) {
    console.error('[MoneyDiplomatRoommate] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to calculate split.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 6: FAMILY MONEY DIPLOMAT — Family financial dynamics
// ═══════════════════════════════════════════════════
router.post('/money-diplomat-family', rateLimit(), async (req, res) => {
  try {
    const { situation, familyDynamic, culturalContext, userLanguage } = req.body;

    if (!situation?.trim()) {
      return res.status(400).json({ error: 'Describe the family money situation.' });
    }

    const prompt = withLanguage(`Navigate this family money situation with cultural sensitivity and emotional intelligence. Family money is the hardest money — there are always unspoken rules, power dynamics, and history.

SITUATION: "${situation.trim()}"
FAMILY DYNAMIC: ${familyDynamic?.trim() || 'Not specified'}
CULTURAL CONTEXT: ${culturalContext?.trim() || 'Not specified'}

Return ONLY valid JSON:
{
  "assessment": {
    "type": "Lending|Borrowing|Splitting costs|Gift with strings|Inheritance|Support|Boundary setting",
    "emotional_stakes": "Low|Medium|High|Minefield",
    "power_dynamic": "What the money dynamic is really about — control, guilt, love, obligation",
    "cultural_factor": "How cultural expectations shape what's 'normal' here"
  },
  "recommendation": "Clear, direct advice — what to do and why",
  "the_real_issue": "What this is actually about underneath the money — be insightful but kind",
  "script": {
    "setting": "Where and when to have this conversation",
    "opener": "Exact opening words — warm but clear",
    "key_phrases": ["2-3 phrases that navigate the emotional terrain"],
    "boundary_line": "The sentence that sets the boundary without burning the relationship",
    "if_guilt_trip": "What to say when they try to guilt you — because they will"
  },
  "scenarios": [
    {
      "label": "If you say yes",
      "terms": "How to structure it to protect the relationship",
      "risk": "What could go wrong"
    },
    {
      "label": "If you say no",
      "how": "How to decline with love",
      "aftermath": "What to expect and how to handle it"
    }
  ],
  "long_term": "How to prevent this pattern from repeating — systemic, not just this instance"
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, {
      label: 'MoneyDiplomatFamily',
      max_tokens: 3000,
      system: withLanguage('You are a family dynamics advisor specializing in money conversations. You understand that family money is never just about money — it\'s about love, control, guilt, obligation, and belonging. Be wise, warm, and culturally sensitive. Return ONLY valid JSON. No markdown.', userLanguage),
    });

    res.json(parsed);

  } catch (error) {
    console.error('[MoneyDiplomatFamily] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to advise.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 7: DINING DIPLOMAT — Pre-dinner strategy
// ═══════════════════════════════════════════════════
router.post('/money-diplomat-dining', rateLimit(), async (req, res) => {
  try {
    const { situation, context, yourBudget, userLanguage } = req.body;

    if (!situation?.trim()) {
      return res.status(400).json({ error: 'Describe the dining situation.' });
    }

    const prompt = withLanguage(`Strategize for this upcoming dining situation BEFORE it happens. Help this person navigate the money dynamics so the meal is enjoyable, not stressful.

SITUATION: "${situation.trim()}"
CONTEXT: ${context?.trim() || 'Social dinner'}
YOUR BUDGET: ${yourBudget || 'Not specified'}

Return ONLY valid JSON:
{
  "pre_game": {
    "restaurant_strategy": "How to influence restaurant choice to match your budget — or how to handle if it's already picked",
    "splitting_strategy": "When and how to bring up splitting BEFORE ordering — exact words",
    "ordering_strategy": "How to order within budget without being obvious about it"
  },
  "who_pays": {
    "expectation": "Who's expected to pay in this specific social context",
    "reasoning": "Why — relationship, occasion, cultural norm, who invited",
    "the_dance": "How to handle the check-grab moment gracefully"
  },
  "scenarios": [
    {
      "if": "A specific scenario that might happen — e.g., 'Someone suggests the tasting menu'",
      "then": "What to say or do — specific, natural words",
      "avoid": "What NOT to say"
    }
  ],
  "budget_moves": {
    "if_over_budget": "How to keep your spend down without being awkward — specific tactics",
    "if_pressured": "What to say if someone pushes you to order more or split equally after unequal ordering",
    "graceful_exit": "How to leave early if the spending spirals — without killing the vibe"
  },
  "pro_tip": "One piece of dining diplomacy wisdom specific to this situation"
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, {
      label: 'MoneyDiplomatDining',
      max_tokens: 2500,
      system: withLanguage('You are a social dining strategist who helps people navigate group meals without money stress. You give specific words to say, not vague advice. Return ONLY valid JSON. No markdown.', userLanguage),
    });

    res.json(parsed);

  } catch (error) {
    console.error('[MoneyDiplomatDining] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to strategize.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 8: GROUP EVENT SETTLER — Trips, events, shared costs
// ═══════════════════════════════════════════════════
router.post('/money-diplomat-group', rateLimit(), async (req, res) => {
  try {
    const { eventType, situation, people, expenses, userLanguage } = req.body;

    if (!situation?.trim()) {
      return res.status(400).json({ error: 'Describe the group event.' });
    }

    const prompt = withLanguage(`Help settle the money for this group event. Account for who paid what, who used what, and the inevitable person who dropped out or underpaid.

EVENT TYPE: ${eventType || 'Group trip'}
SITUATION: "${situation.trim()}"
PEOPLE: ${people?.trim() || 'Not specified'}
EXPENSES: ${expenses?.trim() || 'Not specified'}

Return ONLY valid JSON:
{
  "settlement": [
    {
      "person": "Name/description",
      "paid_so_far": "$XXX",
      "fair_share": "$XXX",
      "owes_or_owed": "+$XX (owes) or -$XX (is owed)",
      "pay_to": "Who they should pay, or who should pay them"
    }
  ],
  "simplification": {
    "explanation": "How to minimize the number of transactions — e.g., 'Instead of 6 transactions, do 3'",
    "transactions": [
      { "from": "Person A", "to": "Person B", "amount": "$XX", "method": "Venmo/cash/etc." }
    ]
  },
  "the_dropout": {
    "applicable": true,
    "fair_solution": "How to handle the person who dropped out — what they owe, what's fair to eat",
    "how_to_tell_them": "Exact message to send"
  },
  "contested_items": [
    {
      "item": "Something that's debatable — e.g., 'The Airbnb cleaning fee'",
      "options": ["Split equally", "Split by nights stayed", "Host covers it"],
      "recommendation": "Which option is fairest and why"
    }
  ],
  "next_event_tip": "How to set up money tracking from the START next time"
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, {
      label: 'MoneyDiplomatGroup',
      max_tokens: 3000,
      system: withLanguage('You are a group expense settler who makes complex shared costs simple and fair. You minimize transactions, handle dropouts gracefully, and keep friendships intact. Return ONLY valid JSON. No markdown.', userLanguage),
    });

    res.json(parsed);

  } catch (error) {
    console.error('[MoneyDiplomatGroup] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to settle.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 9: LENDING COMPASS — Should I lend money?
// ═══════════════════════════════════════════════════
router.post('/money-diplomat-lend', rateLimit(), async (req, res) => {
  try {
    const { situation, amount, relationship, history, userLanguage } = req.body;

    if (!situation?.trim()) {
      return res.status(400).json({ error: 'Describe the lending situation.' });
    }

    const prompt = withLanguage(`Someone is asking to borrow money. Help the lender decide what to do and give them the exact words for whatever they decide.

SITUATION: "${situation.trim()}"
AMOUNT: ${amount || 'Not specified'}
RELATIONSHIP: ${relationship || 'Not specified'}
HISTORY: ${history?.trim() || 'First time'}

Return ONLY valid JSON:
{
  "verdict": "Lend it|Lend less|Gift it instead|Say no|Offer help instead of money",
  "confidence": 80,
  "reasoning": "Honest assessment of why — reference the specific relationship and amount dynamics",
  "risk_assessment": {
    "will_you_get_it_back": "Likely|Maybe|Unlikely|Almost certainly not — be honest",
    "relationship_risk_if_lend": "Low|Medium|High — money changes dynamics",
    "relationship_risk_if_refuse": "Low|Medium|High — they'll remember",
    "resentment_forecast": "What happens to your feelings if they don't pay back"
  },
  "if_yes": {
    "amount_to_lend": "The amount you'd actually recommend — might be less than asked",
    "terms": "How to structure this — timeline, installments, written agreement",
    "the_conversation": "Exact words to say when agreeing — warm but with clear terms",
    "mental_trick": "Only lend what you can afford to never see again. If you can't gift this amount, don't lend it.",
    "follow_up_plan": "When and how to follow up if they don't pay on time — exact words"
  },
  "if_no": {
    "the_conversation": "Exact words to decline — kind, firm, no guilt",
    "alternative_offer": "Something you CAN do instead — help them budget, connect them with resources, smaller amount",
    "if_they_push": "What to say when they push back or guilt-trip"
  },
  "pattern_check": "Is this a pattern? What the history tells you about what will happen"
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, {
      label: 'MoneyDiplomatLend',
      max_tokens: 2500,
      system: withLanguage('You are a personal lending advisor who protects both the money and the relationship. You\'re honest about whether people will get their money back. Return ONLY valid JSON. No markdown.', userLanguage),
    });

    res.json(parsed);

  } catch (error) {
    console.error('[MoneyDiplomatLend] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to assess.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 10: WORK MONEY NAVIGATOR — Office money etiquette
// ═══════════════════════════════════════════════════
router.post('/money-diplomat-work', rateLimit(), async (req, res) => {
  try {
    const { situation, role, companySize, userLanguage } = req.body;

    if (!situation?.trim()) {
      return res.status(400).json({ error: 'Describe the work money situation.' });
    }

    const prompt = withLanguage(`Navigate this workplace money situation. Office money dynamics are especially tricky because of power imbalances, visibility, and the "optional but not really" pressure.

SITUATION: "${situation.trim()}"
YOUR ROLE: ${role?.trim() || 'Employee'}
COMPANY SIZE: ${companySize || 'Not specified'}

Return ONLY valid JSON:
{
  "assessment": {
    "type": "Collection|Gift pool|Expense|Lunch split|Salary talk|Other",
    "pressure_level": "None|Mild|Moderate|Heavy — how much social pressure is involved",
    "visibility": "Private|Semi-public|Public — who will know your decision",
    "career_risk": "None|Low|Medium — could this affect how you're perceived"
  },
  "recommendation": {
    "action": "What to do — specific",
    "amount": "How much to contribute/spend if applicable",
    "reasoning": "Why this is the right move for your situation"
  },
  "if_opting_out": {
    "possible": true,
    "how": "How to opt out without looking cheap or disengaged — exact words",
    "cover_story": "A graceful reason if you need one — not a lie, just a redirect"
  },
  "power_dynamics": "How seniority/hierarchy affects what's expected — be specific about their role",
  "scripts": [
    {
      "scenario": "A specific moment in this situation",
      "say_this": "What to say",
      "not_this": "What NOT to say"
    }
  ],
  "the_unwritten_rule": "The thing nobody says out loud but everyone knows about workplace money in this type of situation"
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, {
      label: 'MoneyDiplomatWork',
      max_tokens: 2000,
      system: withLanguage('You are a workplace culture expert who understands the unwritten rules of office money dynamics. You help people navigate collections, splits, and expenses without hurting their reputation. Return ONLY valid JSON. No markdown.', userLanguage),
    });

    res.json(parsed);

  } catch (error) {
    console.error('[MoneyDiplomatWork] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to navigate.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 11: TRAVEL MONEY GUIDE — Cultural money etiquette
// ═══════════════════════════════════════════════════
router.post('/money-diplomat-travel', rateLimit(), async (req, res) => {
  try {
    const { destination, situation, userLanguage } = req.body;

    if (!destination?.trim()) {
      return res.status(400).json({ error: 'Where are you going?' });
    }

    const prompt = withLanguage(`Give a complete money etiquette guide for this destination. Not just tipping — the full picture of how money works socially in this culture.

DESTINATION: "${destination.trim()}"
SPECIFIC SITUATION: ${situation?.trim() || 'General travel'}

Return ONLY valid JSON:
{
  "tipping_guide": {
    "restaurants": { "norm": "15-20%", "note": "Context" },
    "taxis": { "norm": "Round up", "note": "Context" },
    "hotels": { "norm": "$2-5/night", "note": "Context" },
    "bars": { "norm": "$1/drink", "note": "Context" },
    "tours": { "norm": "10-15%", "note": "Context" },
    "other": [{ "service": "e.g., spa", "norm": "15-20%", "note": "Context" }]
  },
  "payment_norms": {
    "cash_vs_card": "Which is preferred and why",
    "currency_tips": "Local currency quirks — denominations to carry, coins that matter",
    "digital_payments": "Local apps to know — e.g., WeChat Pay in China"
  },
  "haggling": {
    "expected": true,
    "where": "Markets, taxis, NOT restaurants",
    "how": "The local haggling style — starting offer, walking away, etc.",
    "insulting_line": "Below this offer, you're being disrespectful"
  },
  "social_money_rules": [
    {
      "rule": "A specific cultural money norm — e.g., 'In Japan, never count change at the counter'",
      "why": "The cultural reason behind it",
      "tourist_mistake": "What visitors typically do wrong"
    }
  ],
  "the_host_dance": "How to handle when locals insist on paying — the expected back-and-forth and when to accept",
  "tourist_traps": [
    {
      "trap": "A specific money trap at this destination",
      "how_to_spot": "The signs",
      "what_to_do": "How to handle it"
    }
  ],
  "quick_reference": "The 3 most important things to remember about money in this destination — wallet card version"
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, {
      label: 'MoneyDiplomatTravel',
      max_tokens: 3000,
      system: withLanguage('You are a cultural money etiquette expert for global travel. You know the specific norms, traps, and social rules for money in every destination. Return ONLY valid JSON. No markdown.', userLanguage),
    });

    res.json(parsed);

  } catch (error) {
    console.error('[MoneyDiplomatTravel] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate guide.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 12: MONEY STYLE PROFILE — Pattern analysis
// ═══════════════════════════════════════════════════
router.post('/money-diplomat-profile', rateLimit(), async (req, res) => {
  try {
    const { history, userLanguage } = req.body;

    if (!history?.length || history.length < 3) {
      return res.status(400).json({ error: 'Need at least 3 past situations to build a profile.' });
    }

    const historyCtx = history.map((h, i) => `${i + 1}. [${h.type}] ${h.summary} → ${h.outcome || 'No outcome recorded'}`).join('\n');

    const prompt = withLanguage(`Analyze this person's social money patterns from their past situations. Build a money personality profile that reveals blind spots and tendencies.

HISTORY:
${historyCtx}

Return ONLY valid JSON:
{
  "money_style": {
    "archetype": "The Generous Over-Giver|The Quiet Calculator|The Anxious Avoider|The Fair Splitter|The Reluctant Debtor|The Strategic Spender",
    "description": "2-3 sentences describing their money personality in social situations",
    "strength": "Their best money-social skill",
    "blind_spot": "The pattern they can't see — where they're losing money or creating resentment"
  },
  "patterns": [
    {
      "pattern": "A specific recurring behavior — e.g., 'You consistently underpay in group situations'",
      "frequency": "How often this shows up in their history",
      "impact": "What this costs them — financially or relationally",
      "fix": "One specific thing to change"
    }
  ],
  "by_category": {
    "tipping": "Their tipping tendency — generous, standard, below average, or not enough data",
    "splitting": "How they handle splits — too generous, too anxious, fair, avoidant",
    "lending": "Their lending pattern — always says yes, good boundaries, or avoidant",
    "gifts": "Gift spending tendency — overspends, underspends, or well-calibrated"
  },
  "money_health_score": {
    "score": 72,
    "meaning": "What this score means — not financial health, social money health",
    "biggest_improvement": "The single change that would most improve their social money life"
  },
  "prediction": "Based on patterns, the next awkward money situation they're likely to face — and what to do differently this time",
  "growth": "How their money confidence has changed across their history — improving, stagnant, or getting more anxious"
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, {
      label: 'MoneyDiplomatProfile',
      max_tokens: 2500,
      system: withLanguage('You are a behavioral money analyst who reveals social spending patterns people can\'t see themselves. Be insightful and kind — this is about self-awareness, not judgment. Return ONLY valid JSON. No markdown.', userLanguage),
    });

    res.json(parsed);

  } catch (error) {
    console.error('[MoneyDiplomatProfile] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to build profile.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 13: DATE MONEY — Who pays on dates
// ═══════════════════════════════════════════════════
router.post('/money-diplomat-date', rateLimit(), async (req, res) => {
  try {
    const { situation, dateNumber, dynamic, culturalContext, userLanguage } = req.body;

    if (!situation?.trim()) {
      return res.status(400).json({ error: 'Describe the dating situation.' });
    }

    const prompt = withLanguage(`Navigate the money dynamics of this dating situation. This is the most emotionally charged money question for most people — handle it with nuance, not rules.

SITUATION: "${situation.trim()}"
DATE NUMBER: ${dateNumber || 'Not specified'}
DYNAMIC: ${dynamic?.trim() || 'Not specified'}
CULTURAL CONTEXT: ${culturalContext?.trim() || 'Not specified'}

Return ONLY valid JSON:
{
  "who_pays": {
    "recommendation": "You pay|They pay|Split|Take turns|Discuss it",
    "confidence": 80,
    "reasoning": "Why this makes sense for THIS specific situation — not a generic rule"
  },
  "the_signals": {
    "what_offering_to_pay_signals": "What it communicates if you offer to pay in this context",
    "what_splitting_signals": "What suggesting a split communicates",
    "what_letting_them_pay_signals": "What accepting their offer communicates",
    "the_reach": "How to handle the 'reach for wallet' moment — specific choreography"
  },
  "scripts": [
    {
      "moment": "A specific moment during the date — e.g., 'When the check arrives'",
      "say_this": "Natural, charming words — not a script that sounds rehearsed",
      "dont_say": "What to avoid saying and why"
    }
  ],
  "progression": {
    "this_date": "What to do this time",
    "next_date": "How to evolve the pattern naturally",
    "long_term": "How to transition to a sustainable, equitable pattern as the relationship develops"
  },
  "income_gap": {
    "applicable": true,
    "how_to_handle": "If there's a significant income difference, how to handle it without making it weird",
    "the_conversation": "When and how to bring up the income difference if needed"
  },
  "pro_tip": "One piece of dating money wisdom that most people get wrong"
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, {
      label: 'MoneyDiplomatDate',
      max_tokens: 2500,
      system: withLanguage('You are a dating etiquette advisor who handles money dynamics with emotional intelligence. You know that who pays communicates something — help people send the right signal. Be modern, inclusive, and culturally aware. Return ONLY valid JSON. No markdown.', userLanguage),
    });

    res.json(parsed);

  } catch (error) {
    console.error('[MoneyDiplomatDate] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to advise.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 14: SUBSCRIPTION SPLITTER — Shared accounts & plans
// ═══════════════════════════════════════════════════
router.post('/money-diplomat-subs', rateLimit(), async (req, res) => {
  try {
    const { situation, service, people, monthlyCost, userLanguage } = req.body;

    if (!situation?.trim()) {
      return res.status(400).json({ error: 'Describe the shared subscription situation.' });
    }

    const prompt = withLanguage(`Figure out the fair split for this shared subscription or account. Account for actual usage, who set it up, who added extras, and the awkward dynamics of wanting to leave.

SITUATION: "${situation.trim()}"
SERVICE: ${service || 'Not specified'}
PEOPLE SHARING: ${people?.trim() || 'Not specified'}
MONTHLY COST: ${monthlyCost || 'Not specified'}

Return ONLY valid JSON:
{
  "fair_split": [
    {
      "person": "Person description",
      "amount": "$X.XX/month",
      "reasoning": "Why this amount — usage, who manages it, who added extras"
    }
  ],
  "the_wrinkle": "The specific complication in this situation — e.g., 'One person barely uses it but was on from the start'",
  "manager_premium": {
    "applicable": true,
    "discount": "The person managing the account/payment should get $X off — managing is work",
    "reasoning": "Why the person who deals with the billing deserves a small break"
  },
  "if_leaving": {
    "how_to_say_it": "Exact words to say when you want off the plan",
    "notice": "How much notice to give",
    "transition": "How to handle the transition so nobody loses access suddenly"
  },
  "if_someone_added_extra": {
    "scenario": "e.g., 'They added their partner to the family plan without asking'",
    "fair_response": "How to handle it",
    "script": "What to say"
  },
  "alternatives": "Is there a better way to structure this? — e.g., 'At $18/month split 4 ways, you're each paying $4.50. Individual plans are $7. The savings are real but so is the drama. Worth it?'"
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, {
      label: 'MoneyDiplomatSubs',
      max_tokens: 2000,
      system: withLanguage('You are a shared subscription expert who balances fairness with the reality that someone always manages the account and someone always barely uses it. Return ONLY valid JSON. No markdown.', userLanguage),
    });

    res.json(parsed);

  } catch (error) {
    console.error('[MoneyDiplomatSubs] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to split.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 15: DEBT NUDGE — Generate reminder message for outstanding debt
// ═══════════════════════════════════════════════════
router.post('/money-diplomat-nudge', rateLimit(), async (req, res) => {
  try {
    const { personName, amount, context, daysSince, relationship, attempts, userLanguage } = req.body;

    if (!personName?.trim() || !amount) {
      return res.status(400).json({ error: 'Who owes you and how much?' });
    }

    const prompt = withLanguage(`Generate a natural reminder message to get this money back. Make it appropriate for how long it's been and how many times they've already been reminded.

WHO OWES: "${personName.trim()}"
AMOUNT: ${amount}
CONTEXT: ${context?.trim() || 'Not specified'}
DAYS SINCE: ${daysSince || 'Unknown'}
RELATIONSHIP: ${relationship || 'Friend'}
PREVIOUS ATTEMPTS: ${attempts || 0}

Return ONLY valid JSON:
{
  "message": "The exact text to send — natural, not passive-aggressive, calibrated to attempt number",
  "tone": "Casual|Friendly reminder|Direct|Firm|Last resort",
  "platform": "Text|Venmo request|In person|Email",
  "timing": "When to send — day of week, time of day that works best",
  "escalation_note": "If this doesn't work, what to do next",
  "when_to_give_up": "At what point to stop asking — honest assessment"
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, {
      label: 'MoneyDiplomatNudge',
      max_tokens: 1000,
      system: withLanguage('You write money reminder messages that actually work — casual enough to preserve the friendship, clear enough to get paid. Return ONLY valid JSON. No markdown.', userLanguage),
    });

    res.json(parsed);

  } catch (error) {
    console.error('[MoneyDiplomatNudge] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate nudge.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 16: SALARY NEGOTIATION — How much to ask for
// ═══════════════════════════════════════════════════
router.post('/money-diplomat-salary', rateLimit(), async (req, res) => {
  try {
    const { situation, currentSalary, targetRole, location, experience, userLanguage } = req.body;

    if (!situation?.trim()) {
      return res.status(400).json({ error: 'Describe the negotiation situation.' });
    }

    const prompt = withLanguage(`Help this person navigate a salary or raise negotiation. This is the highest-stakes money conversation most people have all year — give them specific numbers, words, and tactics.

SITUATION: "${situation.trim()}"
CURRENT SALARY: ${currentSalary || 'Not specified'}
TARGET ROLE: ${targetRole?.trim() || 'Not specified'}
LOCATION: ${location?.trim() || 'Not specified'}
EXPERIENCE: ${experience?.trim() || 'Not specified'}

Return ONLY valid JSON:
{
  "range": {
    "ask": "$XXX,XXX — what to say when they ask 'what are you looking for'",
    "minimum": "$XXX,XXX — your walk-away number, do not share this",
    "likely_outcome": "$XXX,XXX — where you'll probably land",
    "reasoning": "How this range was calibrated — market data, experience, location"
  },
  "strategy": {
    "when_to_discuss": "The right moment to bring up money — and when NOT to",
    "who_goes_first": "Should you name a number first? Why or why not in this specific case",
    "the_anchor": "How to set the anchor in your favor"
  },
  "scripts": [
    {
      "moment": "Specific moment in the negotiation",
      "say_this": "Exact words — confident, not aggressive",
      "if_they_counter": "What to say to their likely counteroffer"
    }
  ],
  "beyond_salary": {
    "negotiate_these": ["2-4 non-salary items worth negotiating — signing bonus, PTO, remote days, equity, title"],
    "how": "How to use non-salary items as leverage or consolation if salary is capped"
  },
  "mistakes": [
    {
      "mistake": "A common negotiation mistake for this situation",
      "why_costly": "How much it typically costs",
      "instead": "What to do instead"
    }
  ],
  "power_read": "An honest assessment of how much leverage they have in this specific negotiation — and how to use what they've got"
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, {
      label: 'MoneyDiplomatSalary',
      max_tokens: 3000,
      system: withLanguage('You are a salary negotiation coach who gives specific numbers, not vague advice. You understand leverage, anchoring, and the psychology of hiring managers. Return ONLY valid JSON. No markdown.', userLanguage),
    });

    res.json(parsed);

  } catch (error) {
    console.error('[MoneyDiplomatSalary] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to advise.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 17: AFFORD CHECK — Can I actually afford this?
// ═══════════════════════════════════════════════════
router.post('/money-diplomat-afford', rateLimit(), async (req, res) => {
  try {
    const { situation, cost, income, context, userLanguage } = req.body;

    if (!situation?.trim()) {
      return res.status(400).json({ error: 'Describe what you\'re considering.' });
    }

    const prompt = withLanguage(`Give this person an honest gut-check on whether they can afford this. Not a full budget analysis — a quick, practical reality check with clear advice.

WHAT THEY'RE CONSIDERING: "${situation.trim()}"
COST: ${cost || 'Not specified'}
INCOME/SITUATION: ${income?.trim() || 'Not specified'}
CONTEXT: ${context?.trim() || 'Social pressure situation'}

Return ONLY valid JSON:
{
  "verdict": "Yes, comfortably|Yes, but tight|Stretch — proceed with caution|Probably not|Definitely not",
  "confidence": 75,
  "the_math": "Quick back-of-napkin math — e.g., 'That's 15% of your monthly take-home for one weekend. Most financial advisors would call that a stretch.'",
  "the_real_question": "What they're actually asking — e.g., 'You can afford it financially. The question is whether it's worth it to you.'",
  "if_yes": {
    "how_to_make_it_work": "Specific tactics to afford it without stress — e.g., 'Skip dining out 3 times this month'",
    "spending_cap": "Your hard limit for this event — don't go over this"
  },
  "if_no": {
    "how_to_say_no": "Exact words to gracefully bow out of the social situation",
    "alternative": "A cheaper way to participate — e.g., 'Join for the day trip but skip the overnight'",
    "no_shame": "Reframe — why saying no is actually a power move"
  },
  "social_pressure_check": "Is this a want or is this social pressure? Be honest with them.",
  "future_you": "What Future You will think about this decision in 3 months"
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, {
      label: 'MoneyDiplomatAfford',
      max_tokens: 1800,
      system: withLanguage('You are a financial reality-checker who gives honest, judgment-free gut checks. Not a budget planner — a friend who tells the truth about whether you can swing it. Return ONLY valid JSON. No markdown.', userLanguage),
    });

    res.json(parsed);

  } catch (error) {
    console.error('[MoneyDiplomatAfford] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to assess.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 18: INHERITANCE — Navigating estate money
// ═══════════════════════════════════════════════════
router.post('/money-diplomat-inheritance', rateLimit(), async (req, res) => {
  try {
    const { situation, familyDynamic, culturalContext, userLanguage } = req.body;

    if (!situation?.trim()) {
      return res.status(400).json({ error: 'Describe the inheritance situation.' });
    }

    const prompt = withLanguage(`Navigate this inheritance or estate money situation. This combines grief, family history, legal complexity, and money — handle ALL of those dimensions.

SITUATION: "${situation.trim()}"
FAMILY DYNAMIC: ${familyDynamic?.trim() || 'Not specified'}
CULTURAL CONTEXT: ${culturalContext?.trim() || 'Not specified'}

Return ONLY valid JSON:
{
  "assessment": {
    "complexity": "Simple|Moderate|Complex|Minefield",
    "emotional_temp": "Low|Warm|Hot|Explosive",
    "needs_professional": true,
    "professional_type": "Estate attorney|Mediator|Financial advisor|Therapist|All of the above"
  },
  "guidance": "Clear, compassionate advice for this specific situation — acknowledge the grief alongside the money",
  "common_traps": [
    {
      "trap": "Something that goes wrong in this type of inheritance situation",
      "why_it_happens": "The emotional/family dynamic that causes it",
      "prevention": "How to avoid it"
    }
  ],
  "the_conversations": [
    {
      "with_whom": "Who you need to talk to",
      "about_what": "What to discuss",
      "opener": "How to start the conversation — sensitive to grief",
      "boundary": "What NOT to discuss yet — timing matters"
    }
  ],
  "fairness_framework": {
    "equal_vs_equitable": "Should the split be equal or equitable — and what's the difference in this case",
    "the_caretaker_question": "If one person provided more care, how does that factor in",
    "the_money_vs_sentiment": "How to handle items with sentimental but not monetary value"
  },
  "timeline": "What to do now vs. what can wait — don't make big decisions while grieving",
  "the_thing_nobody_says": "The uncomfortable truth about this inheritance situation that needs to be acknowledged"
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, {
      label: 'MoneyDiplomatInheritance',
      max_tokens: 3000,
      system: withLanguage('You are a compassionate inheritance advisor who understands that estate money is grief money. You navigate family dynamics, legal complexity, and emotional minefields with wisdom and kindness. Always recommend professional help for legal/tax matters. Return ONLY valid JSON. No markdown.', userLanguage),
    });

    res.json(parsed);

  } catch (error) {
    console.error('[MoneyDiplomatInheritance] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to advise.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 19: CULTURAL TRANSLATOR — Cross-cultural money in your city
// ═══════════════════════════════════════════════════
router.post('/money-diplomat-cultural', rateLimit(), async (req, res) => {
  try {
    const { yourBackground, theirBackground, situation, userLanguage } = req.body;

    if (!yourBackground?.trim() || !theirBackground?.trim()) {
      return res.status(400).json({ error: 'Describe both cultural backgrounds.' });
    }

    const prompt = withLanguage(`Two people from different cultural backgrounds are navigating a money moment together. Translate the unspoken rules so nobody accidentally offends or misreads the other.

YOUR BACKGROUND: "${yourBackground.trim()}"
THEIR BACKGROUND: "${theirBackground.trim()}"
SITUATION: "${situation?.trim() || 'General social interaction involving money'}"

Return ONLY valid JSON:
{
  "culture_clash_risk": "Low|Medium|High — how different the money norms are between these two cultures",
  "your_norms": {
    "what_you_expect": "What feels normal to you in this situation based on your background",
    "blind_spot": "What you might not realize comes across differently to them"
  },
  "their_norms": {
    "what_they_expect": "What feels normal to them based on their background",
    "what_they_might_do": "Behavior you might misread — e.g., 'They will insist on paying 3 times. This is ritual, not genuine.'"
  },
  "translation_guide": [
    {
      "their_behavior": "Something they might do with money",
      "what_it_means": "What it actually signals in their culture",
      "what_you_might_think": "What you might incorrectly assume",
      "how_to_respond": "The response that honors both cultures"
    }
  ],
  "dos_and_donts": {
    "do": ["2-3 things that will go over well"],
    "dont": ["2-3 things that could offend or confuse"]
  },
  "the_bridge": "One approach that works across both cultures for this situation — the universal move",
  "if_awkward": "What to say if a money moment gets weird — a graceful recovery that acknowledges cultural differences without making it A Thing"
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, {
      label: 'MoneyDiplomatCultural',
      max_tokens: 2500,
      system: withLanguage('You are a cross-cultural money etiquette translator. You know the unspoken rules of money in every culture and help people from different backgrounds navigate shared money moments without offense. Be specific, not generic. Return ONLY valid JSON. No markdown.', userLanguage),
    });

    res.json(parsed);

  } catch (error) {
    console.error('[MoneyDiplomatCultural] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to translate.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 20: CHARITY CALIBRATOR — How much to donate/contribute
// ═══════════════════════════════════════════════════
router.post('/money-diplomat-charity', rateLimit(), async (req, res) => {
  try {
    const { situation, askType, relationship, amount, userLanguage } = req.body;

    if (!situation?.trim()) {
      return res.status(400).json({ error: 'Describe the donation/contribution ask.' });
    }

    const prompt = withLanguage(`Someone is being asked to donate or contribute. Help them figure out how much (if anything), how to say yes gracefully, and how to say no without guilt.

SITUATION: "${situation.trim()}"
TYPE: ${askType || 'Not specified'}
RELATIONSHIP TO ASKER: ${relationship || 'Not specified'}
AMOUNT ASKED: ${amount || 'Not specified'}

Return ONLY valid JSON:
{
  "recommendation": {
    "amount": "$XX",
    "range": { "minimum": "$XX", "comfortable": "$XX", "generous": "$XX" },
    "verdict": "One sentence — donate this much and feel good about it"
  },
  "obligation_check": {
    "are_you_obligated": "No|Socially expected|Strongly expected|Yes",
    "what_happens_if_no": "Realistically, what are the social consequences of not contributing",
    "guilt_vs_genuine": "Is this genuine generosity or guilt-driven? Be honest."
  },
  "if_donating": {
    "amount_reasoning": "Why this specific amount — not too much, not too little",
    "how_to_give": "The logistics — platform, timing, public vs private",
    "message": "What to say when you give — optional but adds warmth"
  },
  "if_declining": {
    "how_to_say_no": "Exact words — kind, firm, no over-explaining",
    "alternative": "Something you CAN offer instead — time, signal boost, smaller amount",
    "if_pressured": "What to say if they push — because some people will"
  },
  "frequency_check": "If you're being asked constantly (fundraisers, GoFundMes, kid's teams), here's a sustainable policy you can set for all future asks",
  "tax_note": "Quick note on whether this is likely tax-deductible"
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, {
      label: 'MoneyDiplomatCharity',
      max_tokens: 2000,
      system: withLanguage('You are a charitable giving advisor who helps people be generous without being exploited. You understand the difference between genuine giving and guilt compliance. Return ONLY valid JSON. No markdown.', userLanguage),
    });

    res.json(parsed);

  } catch (error) {
    console.error('[MoneyDiplomatCharity] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to calibrate.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 21: SCENARIO SIMULATOR — Practice money conversations
// ═══════════════════════════════════════════════════
router.post('/money-diplomat-simulate', rateLimit(), async (req, res) => {
  try {
    const { situation, otherPerson, userResponse, conversationHistory, userProfile, userLanguage } = req.body;

    if (!situation?.trim()) {
      return res.status(400).json({ error: 'Describe the money situation to practice.' });
    }

    const profileCtx = userProfile ? `\nUSER PROFILE: Budget comfort: ${userProfile.incomeLevel || 'unknown'}, cultural background: ${userProfile.culture || 'unknown'}` : '';

    // If no user response yet, start the simulation
    if (!userResponse) {
      const prompt = withLanguage(`You're playing the other person in a money conversation. Set the scene and deliver the opening line that puts the user in the hot seat. Make it realistic — this is practice for a real conversation.

SITUATION: "${situation.trim()}"
THE OTHER PERSON: ${otherPerson?.trim() || 'The other party'}${profileCtx}

Return ONLY valid JSON:
{
  "scene": "2-sentence scene-setting — where you are, the mood, what just happened",
  "their_line": "What the other person says — realistic, in character, the thing that puts you on the spot",
  "their_emotion": "How they're feeling — nervous|entitled|casual|desperate|passive-aggressive|loving|awkward",
  "what_theyre_really_thinking": "The subtext — what they want but won't say directly",
  "coaching_hint": "A small hint for the user on what to focus on in their response — not the answer, just the angle"
}`, userLanguage);

      const parsed = await callClaudeWithRetry(prompt, {
        label: 'MoneyDiplomatSimStart',
        max_tokens: 1000,
        system: withLanguage('You are a realistic role-player who embodies the other person in a money conversation. Be authentic — people are messy, emotional, and don\'t always say what they mean. Return ONLY valid JSON. No markdown.', userLanguage),
      });
      return res.json({ type: 'prompt', ...parsed });
    }

    // Evaluate response and continue
    const historyCtx = conversationHistory?.map(h => `Them: "${h.them}" You: "${h.you}"`).join('\n') || '';

    const prompt = withLanguage(`You're coaching someone through a money conversation. Evaluate their response and continue the simulation as the other person.

SITUATION: "${situation.trim()}"
OTHER PERSON: ${otherPerson?.trim() || 'The other party'}${profileCtx}

CONVERSATION SO FAR:
${historyCtx}
Them (latest): "${conversationHistory?.slice(-1)[0]?.them || situation}"
User responded: "${userResponse.trim()}"

Return ONLY valid JSON:
{
  "evaluation": {
    "score": 75,
    "what_worked": "The strongest part of their response — be specific",
    "what_to_improve": "The single most impactful improvement",
    "tone_read": "How their response would land emotionally with the other person",
    "power_move": "A subtle thing they could add that would shift the dynamic in their favor"
  },
  "their_next_line": "How the other person responds — realistic, in character. They might push back, cave, deflect, guilt-trip, or accept.",
  "their_emotion_now": "How the other person feels after the user's response",
  "escalation_level": "De-escalating|Stable|Escalating|Resolved",
  "coaching_hint": "What to focus on next",
  "is_resolved": false
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, {
      label: 'MoneyDiplomatSimEval',
      max_tokens: 1500,
      system: withLanguage('You are both a realistic role-player AND a money conversation coach. Evaluate honestly, then stay in character for the next line. Return ONLY valid JSON. No markdown.', userLanguage),
    });

    res.json({ type: 'evaluation', ...parsed });

  } catch (error) {
    console.error('[MoneyDiplomatSim] Error:', error);
    res.status(500).json({ error: error.message || 'Failed in simulation.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 22: MONTHLY RECAP — Summarize usage patterns
// ═══════════════════════════════════════════════════
router.post('/money-diplomat-recap', rateLimit(), async (req, res) => {
  try {
    const { history, debts, userProfile, userLanguage } = req.body;

    if (!history?.length || history.length < 3) {
      return res.status(400).json({ error: 'Need at least 3 situations for a recap.' });
    }

    const historyCtx = history.map((h, i) => `${i + 1}. [${h.type}] ${h.summary} (${new Date(h.date).toLocaleDateString()})`).join('\n');
    const debtCtx = debts?.length ? `\nOUTSTANDING DEBTS: ${debts.filter(d => !d.settled).map(d => `${d.person}: ${d.amount}`).join(', ')}\nSETTLED: ${debts.filter(d => d.settled).length}` : '';
    const profileCtx = userProfile ? `\nPROFILE: ${userProfile.incomeLevel || ''}, ${userProfile.culture || ''}` : '';

    const prompt = withLanguage(`Generate a monthly money recap for this person. Make it feel like Spotify Wrapped for their social money life — insightful, personal, and a little surprising.

SITUATIONS THIS PERIOD:
${historyCtx}
${debtCtx}
${profileCtx}

Return ONLY valid JSON:
{
  "headline": "A punchy, personalized headline — e.g., 'The Generous Overthinker: Your February Money Report'",
  "stats": {
    "total_situations": 14,
    "most_common_type": "Bill splitting (5 times)",
    "biggest_money_moment": "The salary negotiation — highest stakes this month",
    "total_outstanding": "$125 in the tracker",
    "total_settled": "$340 collected"
  },
  "insights": [
    {
      "insight": "A pattern or trend — specific, not generic",
      "so_what": "What this means for them practically"
    }
  ],
  "growth": "How their money confidence has changed — reference specific situations",
  "challenge_next_month": "One specific money challenge to tackle next month based on their patterns",
  "fun_stat": "One surprising or amusing stat — e.g., 'You asked MoneyDiplomat about tipping 6 times. You're officially the most thoughtful tipper in your friend group.'",
  "shareable": "A one-line summary they could share — e.g., 'I navigated 14 awkward money moments this month and collected $340 I was owed. 💸'"
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, {
      label: 'MoneyDiplomatRecap',
      max_tokens: 2000,
      system: withLanguage('You are a witty, insightful personal money analyst who makes people feel good about taking control of their social money life. Think Spotify Wrapped energy. Return ONLY valid JSON. No markdown.', userLanguage),
    });

    res.json(parsed);

  } catch (error) {
    console.error('[MoneyDiplomatRecap] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate recap.' });
  }
});

module.exports = router;
