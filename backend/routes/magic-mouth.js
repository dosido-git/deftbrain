const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');
const { rateLimit } = require('../lib/rateLimiter');

const PERSONALITY = `You are that friend who always gets the upgrade, the fee waived, the free dessert, the exception to the rule. You're not a scammer — you're just extraordinarily good at asking. You understand that most "no" answers are actually "nobody asked the right way" answers.

You know that the secret isn't manipulation. It's empathy + angle + timing + delivery. You read the situation, find the opening, and give people a reason to say yes that makes THEM feel good about it.

RULES:
- Always find a legitimate angle — not lies, not threats, just the right framing
- Read the power dynamics: who has authority, what's their incentive, what makes saying yes easy for them
- Include the human element: name use, timing, tone, body language cues
- Be specific to the situation — not generic "be polite" advice
- Acknowledge when the odds are low but still give the best shot
- Never suggest dishonesty. Charm, not fraud.
- The script should sound natural, not rehearsed. Real humans don't talk in corporate speak.
- Include what NOT to say — the common mistakes that kill the ask`;

// ─── MAIN: Analyze the ask and build the approach ───
router.post('/magic-mouth', rateLimit(), async (req, res) => {
  try {
    const { whatYouWant, situation, whoYoureAsking, triedAlready, userLanguage } = req.body;

    if (!whatYouWant?.trim()) {
      return res.status(400).json({ error: 'Tell me what you want to get.' });
    }

    const userPrompt = `MAGIC MOUTH — THE ART OF THE ASK

WHAT THEY WANT: "${whatYouWant.trim()}"
THE SITUATION: "${situation?.trim() || 'No additional context provided'}"
${whoYoureAsking?.trim() ? `WHO THEY'RE ASKING: "${whoYoureAsking.trim()}"` : ''}
${triedAlready?.trim() ? `ALREADY TRIED: "${triedAlready.trim()}"` : ''}

Analyze this situation. Find the best angle. Write the script. Coach the delivery.

Return ONLY valid JSON:

{
  "situation_read": "2-3 sentences — your honest read on the situation. What are the odds? What's working for them? What's working against them?",
  "difficulty": "easy | moderate | hard | long_shot",
  "best_angle": {
    "name": "Short name for the strategy (e.g., 'The Loyalty Play', 'The Friendly Escalation', 'The Reasonable Exception')",
    "why_this_works": "1-2 sentences — why this specific angle is the best shot in this specific situation",
    "who_to_ask": "The right person to approach and why — not always the first person you see",
    "when_to_ask": "Timing advice — best time of day, day of week, or moment in the interaction"
  },
  "the_script": {
    "opener": "The exact opening line — warm, natural, sets the right tone. Include name use if applicable.",
    "the_ask": "The core request — framed using the best angle. 2-4 sentences, conversational, specific.",
    "if_they_hesitate": "What to say if they pause or seem unsure — the gentle nudge that makes yes easier.",
    "graceful_exit": "What to say if the answer is genuinely no — leave the door open and your dignity intact."
  },
  "delivery_notes": {
    "tone": "How to sound — specific coaching beyond 'be polite'",
    "body_language": "Physical presence cues — posture, eye contact, hands, smile",
    "dont_do_this": "The 1-2 most common mistakes people make in this exact situation that kill the ask"
  },
  "backup_angle": {
    "name": "If the first angle fails, try this one",
    "pivot_line": "The exact transition sentence to shift strategies mid-conversation"
  },
  "pro_tip": "One insider insight that most people don't know about this type of ask — a hack, a policy loophole, or a human nature shortcut"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      system: withLanguage(PERSONALITY, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('MagicMouth error:', error);
    res.status(500).json({ error: error.message || 'Failed to find your angle' });
  }
});

// ─── PHONE TREE HACK — Navigate automated systems to reach a human ───
router.post('/magic-mouth/phone-tree', rateLimit(), async (req, res) => {
  try {
    const { company, issue, goal, userLanguage } = req.body;

    if (!company?.trim()) return res.status(400).json({ error: 'Which company are you calling?' });
    if (!issue?.trim()) return res.status(400).json({ error: 'What\'s the issue you need help with?' });

    const systemPrompt = `You are a phone system expert — someone who has navigated thousands of corporate phone trees, knows the secret menu options, the magic phrases that bypass automated systems, and the exact words that get a human on the line in under 2 minutes.

You know that every major company has documented shortcuts: menu sequences that skip to the right department, phrases that trigger "high-value customer" routing, escalation words that get you to a supervisor, and the specific time windows when hold times are lowest.

Be specific. Not "say you want to speak to a human" — give the exact phrase. Not "press 0" — give the actual sequence for THIS company if known. If you don't know the specific sequence, give the best universal tactics for that company type and what to try first.

RULES:
- Be precise about company-specific shortcuts when you know them
- Give the actual menu sequence (press 1, then 3, etc.) where possible
- Include the exact phrases to say — not paraphrases
- Note the best time to call (day of week, time of day)
- Always include escalation triggers for if the first rep can't help
- Keep escalation tactics firm but professional — no threats`;

    const userPrompt = `PHONE TREE HACK

COMPANY: "${company.trim()}"
ISSUE: "${issue.trim()}"
${goal?.trim() ? `WHAT THEY WANT RESOLVED: "${goal.trim()}"` : ''}

Give them everything they need to get to the right human fast.

Return ONLY valid JSON:
{
  "company_type": "The type of company this is (bank, airline, insurance, telecom, healthcare billing, government agency, etc.) — for context",
  "best_time_to_call": {
    "day": "Best day(s) of the week to call and why",
    "time": "Best time window (e.g., 'Tuesday–Thursday, 8–10am local time') and why",
    "avoid": "Times/days to avoid and why (e.g., Monday mornings, Friday afternoons)"
  },
  "menu_navigation": {
    "opening_move": "The very first thing to do when the automated system picks up — say this phrase or press this key",
    "sequence": [
      {
        "step": 1,
        "action": "press_key | say_phrase | wait",
        "detail": "Exactly what to press or say",
        "why": "Why this works / what it routes to"
      }
    ],
    "skip_ahead": "The fastest path to a human — the 'cheat code' if there is one (e.g., press 0 three times, say 'representative' twice)"
  },
  "magic_phrases": [
    {
      "phrase": "The exact words to say",
      "when": "When in the call to say this",
      "effect": "What this phrase triggers or unlocks"
    }
  ],
  "right_department": {
    "name": "The exact department or team name to ask for",
    "why": "Why this department (not the default one) can actually help",
    "how_to_ask": "The exact phrasing to request this department"
  },
  "escalation_ladder": [
    {
      "level": 1,
      "trigger": "If the first rep says [this] or can't help with [this]",
      "move": "Exactly what to say to escalate",
      "phrase": "The word-for-word escalation request"
    },
    {
      "level": 2,
      "trigger": "If the supervisor also can't resolve it",
      "move": "Next escalation step",
      "phrase": "The exact phrase"
    }
  ],
  "things_to_have_ready": [
    "Account number, confirmation number, or ID to have on hand",
    "Any documentation or dates relevant to the issue",
    "What to reference that strengthens your position"
  ],
  "power_move": "One insider tactic most people don't know — a policy shortcut, a magic department, or a phrase that changes the dynamic",
  "script_opener": "The exact first sentence to say to the human once you reach them — clear, calm, and positions you for a yes"
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
    console.error('MagicMouth phone-tree error:', error);
    res.status(500).json({ error: error.message || 'Failed to hack the phone tree' });
  }
});

// ─── NUCLEAR OPTION — Maximum legal leverage when nice has failed ───
router.post('/magic-mouth/nuclear', rateLimit(), async (req, res) => {
  try {
    const { company, problem, whatTried, goal, userLanguage } = req.body;

    if (!company?.trim()) return res.status(400).json({ error: 'Who are you up against?' });
    if (!problem?.trim()) return res.status(400).json({ error: 'What\'s the problem that isn\'t getting resolved?' });

    const systemPrompt = `You are a consumer rights specialist and escalation strategist. When someone has exhausted the polite options — emails ignored, agents useless, supervisors stone-walling — you know exactly how to apply maximum legal pressure without hiring a lawyer.

You know:
- Which regulatory agencies actually investigate consumer complaints (and which are toothless)
- How to find executive email addresses using standard corporate naming conventions
- The small claims court thresholds by state and how to file effectively
- Which social media pressure points actually move corporations (not just tweeting into the void)
- The specific legal-adjacent phrases that make legal departments pay attention
- How to send a demand letter that signals you're serious without needing a lawyer to write it

YOUR RULES:
- Legal leverage only. No harassment, no threats of illegal action.
- Be specific — "file with the CFPB" not "complain to regulators"
- Honest about likelihood — some fights aren't worth the battle time; say so
- The goal is resolution, not punishment — frame pressure accordingly
- Include the magic sentences that do work without hiring a lawyer`;

    const userPrompt = `NUCLEAR OPTION — MAXIMUM LEGAL LEVERAGE

COMPANY/ORGANIZATION: "${company.trim()}"
THE PROBLEM: "${problem.trim()}"
${whatTried?.trim() ? `WHAT THEY'VE ALREADY TRIED: "${whatTried.trim()}"` : ''}
${goal?.trim() ? `WHAT THEY WANT: "${goal.trim()}"` : ''}

Map the full escalation ladder from where they are now to maximum legal leverage.

Return ONLY valid JSON:
{
  "situation_assessment": {
    "leverage_level": "The amount of leverage they actually have — high, medium, low, or very_low",
    "their_strongest_card": "The single most powerful piece of leverage in this specific situation",
    "why_nice_failed": "The specific reason polite methods aren't working in this situation",
    "winnable": true
  },

  "escalation_ladder": [
    {
      "rung": 1,
      "title": "Executive Escalation",
      "action": "How to find and contact C-suite or VP-level contacts directly — including the email format trick",
      "the_email_formula": "The standard naming convention for this company type (e.g., firstname.lastname@company.com) and how to verify",
      "subject_line": "The exact subject line that gets opened",
      "opening_paragraph": "The first paragraph of the executive email — firm, factual, signals you know your options"
    },
    {
      "rung": 2,
      "title": "Regulatory Complaint",
      "action": "The specific agency to file with and why this one has actual teeth",
      "agency_name": "The exact agency name and acronym",
      "where_to_file": "The URL or specific filing path",
      "why_it_works": "Why this company fears complaints to this specific agency — the regulatory or reputational mechanism",
      "what_to_include": "The specific information that makes the complaint credible and actionable"
    },
    {
      "rung": 3,
      "title": "Small Claims / Demand Letter",
      "action": "The small claims threshold and whether this case qualifies, plus how to write a demand letter that works",
      "threshold": "Typical small claims limit for this type of dispute",
      "demand_letter_opener": "The opening sentence of a demand letter — the one that makes legal departments take notice",
      "the_magic_sentence": "The specific phrase that signals serious legal intent without needing a lawyer"
    },
    {
      "rung": 4,
      "title": "Social and Reputational Pressure",
      "action": "The specific platform and format that actually moves this type of company",
      "platform": "The exact platform (not just 'social media' — be specific: Twitter/X, Reddit r/[specific], BBB, Trustpilot, etc.)",
      "why_this_platform": "Why this specific platform has leverage over this type of organization",
      "post_formula": "What to include in the post for maximum impact — facts, not emotion"
    }
  ],

  "magic_sentences": [
    {
      "sentence": "The exact phrase to say or write",
      "when": "When in the process to deploy this",
      "what_it_triggers": "The specific mechanism — what department it routes to, what policy it invokes, what fear it activates"
    }
  ],

  "the_one_to_start": {
    "rung": "Which escalation rung to start with given where they are",
    "why": "Why this specific step is the right first move from their current position",
    "first_action_today": "The single most important action to take in the next 24 hours — specific and executable"
  },

  "honest_assessment": {
    "time_investment": "Realistic time estimate to see results from this approach",
    "most_likely_outcome": "What resolution they can realistically expect if they execute this well",
    "when_to_walk_away": "The signal that tells them this battle costs more than it's worth — and what to do instead"
  }
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2800,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('MagicMouth nuclear error:', error);
    res.status(500).json({ error: error.message || 'Failed to map the nuclear options' });
  }
});

module.exports = router;
