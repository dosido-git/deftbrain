const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');
const { rateLimit } = require('../lib/rateLimiter');

const PERSONALITY = `You are an epistemics expert — trained in research methodology, statistics, and the sociology of how bad information spreads. Your job is to separate what's actually known from what only feels known.

You have deep knowledge of how fields produce consensus, how marketing masquerades as science, how ideological capture distorts advice, and how media incentives create noise that drowns out signal.

YOUR METHOD:
- Distinguish between "experts agree" (strong signal) vs. "studies suggest" (weak signal) vs. "people believe" (noise)
- Identify the actual mechanism behind a recommendation — is it physiology, economics, psychology, or vibe?
- Name the commercial or ideological interests that might be distorting a field
- Be honest about what's genuinely unsettled — don't manufacture false certainty
- Don't be contrarian for its own sake — if something is well-established, say so clearly

CRITICAL: Do not moralize. Do not hedge everything into uselessness. Take positions where evidence supports them.`;

router.post('/signal-vs-noise', rateLimit(), async (req, res) => {
  try {
    const { topic, conflictingAdvice, userContext, userLanguage } = req.body;
    if (!topic?.trim()) return res.status(400).json({ error: 'What topic are you trying to cut through?' });

    const userPrompt = `SIGNAL VS. NOISE

TOPIC: "${topic.trim()}"
${conflictingAdvice?.trim() ? `CONFLICTING ADVICE THEY'VE SEEN:\n${conflictingAdvice.trim()}` : ''}
${userContext?.trim() ? `THEIR CONTEXT: ${userContext.trim()}` : ''}

Separate what's actually known from what just feels known.

Return ONLY valid JSON:
{
  "topic_as_understood": "The specific domain you're analyzing — narrow it if needed",

  "why_this_field_is_noisy": "2-3 sentences on WHY this topic generates so much contradictory advice — commercial interests, research methodology issues, individual variation, media incentives, etc.",

  "the_signal": {
    "label": "SETTLED SCIENCE / STRONG CONSENSUS / WELL-ESTABLISHED PATTERN",
    "items": [
      {
        "claim": "What is actually well-established",
        "confidence": "high | very_high",
        "why_we_know_this": "The type of evidence and why it's reliable — RCTs, meta-analyses, decades of data, etc.",
        "the_nuance": "The important qualifier that's often stripped out when this gets repeated (or null)"
      }
    ]
  },

  "the_noise": [
    {
      "claim": "The popular recommendation or belief",
      "noise_type": "marketing | methodology_problem | cherry_picked | outdated | oversimplified | ideology | individual_variation | media_distortion",
      "noise_label": "Human-readable label for what kind of noise this is",
      "the_problem": "Specifically why this is noise — not just 'it's complicated' but what's actually wrong with it",
      "kernel_of_truth": "The grain of truth that makes this noise believable (or null if there isn't one)"
    }
  ],

  "genuinely_debated": [
    {
      "question": "The specific unresolved question",
      "side_a": "One legitimate position and its evidence base",
      "side_b": "The other legitimate position and its evidence base",
      "why_unsettled": "What it would take to actually settle this — better data, longer timescales, individual variation, etc."
    }
  ],

  "the_bottom_line": {
    "what_to_do": "Given signal vs. noise, what does the evidence actually support doing? Specific and actionable.",
    "what_to_ignore": "The popular advice that the evidence doesn't support — be direct",
    "the_honest_uncertainty": "What genuinely isn't known and why that matters"
  },

  "sources_of_noise": [
    {
      "actor": "Who or what is generating noise in this space",
      "incentive": "Why they generate misleading or incomplete information",
      "how_to_spot_it": "How to recognize when you're getting their version vs. reality"
    }
  ]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      system: withLanguage(PERSONALITY, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('SignalVsNoise error:', error);
    res.status(500).json({ error: error.message || 'Failed to separate signal from noise' });
  }
});

module.exports = router;
