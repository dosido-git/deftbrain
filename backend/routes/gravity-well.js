const express = require('express');
const router = express.Router();
const { cleanJsonResponse, withLanguage, callClaudeWithRetry } = require('../lib/claude');
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

Return ONLY valid JSON:
{
  "target_profile": {
    "what_they_care_about": "The 2-3 things this type of person most values in their professional/creative world — one sentence",
    "what_gets_their_attention": "What kind of people, work, or contributions actually break through their noise — one sentence",
    "what_they_avoid": "The approach or signal that immediately marks someone as not worth their time — one sentence",
    "their_world": "The spaces, platforms, and contexts where they already exist and pay attention — one sentence"
  },

  "your_gravity_score": {
    "current": "A percentage — how much gravitational pull you currently have on this person, e.g. '3%' — one sentence",
    "the_gap": "What's creating the distance — specifically, not generically — one sentence",
    "your_natural_advantages": "What you already have that gives you an unexpected entry point — one sentence"
  },

  "the_90_day_plan": {
    "phase_1": {
      "name": "Weeks 1-3: Become Findable — 3-6 words",
      "objective": "What you're building in this phase — one sentence",
      "actions": [
        {
          "action": "Specific action — one sentence",
          "platform_or_venue": "Where this happens — one sentence",
          "the_signal_it_sends": "What this communicates about you to them — one sentence"
        }
      ]
    },
    "phase_2": {
      "name": "Weeks 4-7: Enter Their Periphery — 3-6 words",
      "objective": "What you're building in this phase — one sentence",
      "actions": [
        {
          "action": "Specific action — one sentence",
          "platform_or_venue": "Where this happens — one sentence",
          "the_signal_it_sends": "What this communicates about you to them — one sentence"
        }
      ]
    },
    "phase_3": {
      "name": "Weeks 8-12: Make the Connection Natural — 3-6 words",
      "objective": "What you're building in this phase — one sentence",
      "actions": [
        {
          "action": "Specific action — one sentence",
          "platform_or_venue": "Where this happens — one sentence",
          "the_signal_it_sends": "What this communicates about you to them — one sentence"
        }
      ]
    }
  },

  "the_first_contact": {
    "when_to_reach_out": "The specific trigger or moment — not a time, but a condition — one sentence",
    "the_frame": "How to frame the first contact so it doesn't feel like a request — one sentence",
    "what_to_say": "A template for the first message — short, specific, no fluff — one sentence",
    "what_not_to_say": "The phrases that kill it immediately — one sentence"
  },

  "the_value_offer": {
    "what_you_can_give": "The specific thing you can contribute to their world that they'd actually want — one sentence",
    "why_its_genuine": "Why this isn't manufactured — what makes it real — one sentence",
    "the_asymmetry": "Why this creates pull without creating obligation for them — one sentence"
  },

  "gravity_score_target": "The percentage after 90 days of this plan, e.g. '71%' — one sentence",
  "the_one_thing_today": "The single action to take in the next 24 hours to start building gravity — one sentence"
}`;

    const parsed = await callClaudeWithRetry({
model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: withLanguage(PERSONALITY, userLanguage),
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
