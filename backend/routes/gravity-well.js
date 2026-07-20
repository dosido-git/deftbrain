const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const PERSONALITY = `Strategic relationship analyst. Help people build genuine influence and connection with specific people they want in their orbit.

Focus on value asymmetry: what can this person offer that the target actually needs? Build a 90-day approach that creates real value first, visibility second, and asks third. Never manipulative — the goal is authentic connection through genuine contribution.`;

router.post('/gravity-well', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { targetDescription, targetType, whyThemContext, yourBackground, userLanguage } = req.body;
  if (!targetDescription?.trim()) return res.status(400).json({ error: 'Describe the person you want in your life.' });

    const userPrompt = `GRAVITY WELL — 90-DAY ORBIT STRATEGY

TARGET PERSON: "${targetDescription.trim()}"
TYPE OF RELATIONSHIP WANTED: ${targetType || 'Not specified — infer from description'}
${whyThemContext?.trim() ? `WHY THIS PERSON / CONTEXT: ${whyThemContext.trim()}` : ''}
${yourBackground?.trim() ? `YOUR BACKGROUND / WHAT YOU BRING: ${yourBackground.trim()}` : ''}

Design a 90-day gravity strategy. Not cold outreach — gravitational pull.

SCORES: your_gravity_score.current and gravity_score_target are COMPUTED for this specific person and situation — two different runs must not produce identical scores unless the situations are identical. Format: bare integer + % only (e.g. 18%).

Return ONLY valid JSON:
{
  "target_profile": {
    "what_they_care_about": "The 2-3 things this type of person most values in their professional/creative world",
    "what_gets_their_attention": "What kind of people, work, or contributions actually break through their noise",
    "what_they_avoid": "The approach or signal that immediately marks someone as not worth their time",
    "their_world": "The spaces, platforms, and contexts where they already exist and pay attention"
  },

  "your_gravity_score": {
    "current": "a bare integer percent computed for THIS person, e.g. 18% — NEVER copy this example, derive it from how far they currently are from the goal",
    "the_gap": "What's creating the distance — specifically, not generically",
    "your_natural_advantages": "What you already have that gives you an unexpected entry point"
  },

  "the_90_day_plan": {
    "phase_1": {
      "name": "Weeks 1-3: Become Findable",
      "objective": "What you're building in this phase",
      "actions": [
        {
          "action": "Specific action",
          "platform_or_venue": "Where this happens",
          "the_signal_it_sends": "What this communicates about you to them"
        }
      ]
    },
    "phase_2": {
      "name": "Weeks 4-7: Enter Their Periphery",
      "objective": "What you're building in this phase",
      "actions": [
        {
          "action": "Specific action",
          "platform_or_venue": "Where this happens",
          "the_signal_it_sends": "What this communicates about you to them"
        }
      ]
    },
    "phase_3": {
      "name": "Weeks 8-12: Make the Connection Natural",
      "objective": "What you're building in this phase",
      "actions": [
        {
          "action": "Specific action",
          "platform_or_venue": "Where this happens",
          "the_signal_it_sends": "What this communicates about you to them"
        }
      ]
    }
  },

  "the_first_contact": {
    "when_to_reach_out": "The specific trigger or moment — not a time, but a condition",
    "the_frame": "How to frame the first contact so it doesn't feel like a request",
    "what_to_say": "A template for the first message — short, specific, no fluff",
    "what_not_to_say": "The phrases that kill it immediately"
  },

  "the_value_offer": {
    "what_you_can_give": "The specific thing you can contribute to their world that they'd actually want",
    "why_its_genuine": "Why this isn't manufactured — what makes it real",
    "the_asymmetry": "Why this creates pull without creating obligation for them"
  },

  "gravity_score_target": "a bare integer percent representing where the plan gets them — must be derived from THIS case, different every time, greater than current",
  "the_one_thing_today": "The single action to take in the next 24 hours to start building gravity"
}

RULES: your_gravity_score.current and gravity_score_target must each be a BARE percentage string ONLY (e.g. "3%", "71%") — no words, no sentence; they render as progress-bar widths. Each phase's actions array: 2-3 items. Keep every field to ONE short sentence — be concise.`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3500,
      system: withLanguage(PERSONALITY, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'gravity-well' });
    if (!parsed.target_profile) {
      return res.status(500).json({ error: 'Could not generate a response. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('GravityWell error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

module.exports = router;
