const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');
const { rateLimit } = require('../lib/rateLimiter');

const PERSONALITY = `You are a relationship orbit designer. You understand how the most valuable relationships form: not through cold outreach, but through gravitational pull — becoming the kind of person worth knowing, showing up in the right places, and making yourself visible before you ever introduce yourself.

You think in terms of proximity, visibility, and value creation:
- PROXIMITY: Getting into the same spaces, conversations, and contexts as the target
- VISIBILITY: Creating a presence they'll notice before you ever reach out
- VALUE: Contributing something worth their attention before asking for anything

You know the failure mode: most people cold email, cold LinkedIn, cold anything — and it doesn't work because there's no warm surface. The solution isn't better cold outreach — it's eliminating the "cold" entirely.

YOUR PLANS ARE:
- 90-day, not instant — relationship gravity takes time to build
- Specific — "write a piece about X and post it where they'll see it" not "create content"
- Asymmetric — actions that require little from the target but create pull
- Realistic — no manufactured encounters or contrived situations`;

router.post('/gravity-well', rateLimit(), async (req, res) => {
  try {
    const { targetDescription, targetType, whyThemContext, yourBackground, userLanguage } = req.body;
  if (!targetDescription?.trim()) return res.status(400).json({ error: 'Describe the person you want in your life.' });

    const userPrompt = `GRAVITY WELL — 90-DAY ORBIT STRATEGY

TARGET PERSON: "${targetDescription.trim()}"
TYPE OF RELATIONSHIP WANTED: ${targetType || 'Not specified — infer from description'}
${whyThemContext?.trim() ? `WHY THIS PERSON / CONTEXT: ${whyThemContext.trim()}` : ''}
${yourBackground?.trim() ? `YOUR BACKGROUND / WHAT YOU BRING: ${yourBackground.trim()}` : ''}

Design a 90-day gravity strategy. Not cold outreach — gravitational pull.

Return ONLY valid JSON:
{
  "target_profile": {
    "what_they_care_about": "The 2-3 things this type of person most values in their professional/creative world",
    "what_gets_their_attention": "What kind of people, work, or contributions actually break through their noise",
    "what_they_avoid": "The approach or signal that immediately marks someone as not worth their time",
    "their_world": "The spaces, platforms, and contexts where they already exist and pay attention"
  },

  "your_gravity_score": {
    "current": "A percentage — how much gravitational pull you currently have on this person, e.g. '3%'",
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

  "gravity_score_target": "The percentage after 90 days of this plan, e.g. '71%'",
  "the_one_thing_today": "The single action to take in the next 24 hours to start building gravity"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: withLanguage(PERSONALITY, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('GravityWell error:', error);
    res.status(500).json({ error: error.message || 'Failed to design gravity strategy' });
  }
});

module.exports = router;
