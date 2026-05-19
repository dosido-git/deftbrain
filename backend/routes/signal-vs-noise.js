const express = require('express');
const router = express.Router();
const { cleanJsonResponse, withLanguage, callClaudeWithRetry } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const PERSONALITY = `Epistemics expert. Separate what's genuinely known from what's contested, overstated, or manufactured controversy.

For every topic: identify real consensus (the signal), genuine expert uncertainty (honest noise), and manufactured controversy pushed by interested parties (false noise). Be specific about who benefits from the noise. Never false-balance settled questions; never dismiss genuinely open ones.`;

router.post('/signal-vs-noise', rateLimit(DEFAULT_LIMITS), async (req, res) => {
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
  "topic_as_understood": "The specific domain you're analyzing — narrow it if needed — one sentence",

  "why_this_field_is_noisy": "2-3 sentences on WHY this topic generates so much contradictory advice — commercial interests, research methodology issues, individual variation, media incentives, etc.",

  "the_signal": {
    "label": "SETTLED SCIENCE / STRONG CONSENSUS / WELL-ESTABLISHED PATTERN — one sentence",
    "items": [
      {
        "claim": "What is actually well-established — one sentence",
        "why_we_know_this": "The type of evidence and why it's reliable — RCTs, meta-analyses, decades of data, etc. — one sentence",
        "the_nuance": "The important qualifier that's often stripped out when this gets repeated (or null) — one sentence"
      }
    ]
  },

  "the_noise": [
    {
      "claim": "The popular recommendation or belief — one sentence",
      "noise_type": "marketing | methodology_problem | cherry_picked | outdated | oversimplified | ideology | individual_variation | media_distortion",
      "noise_label": "Human-readable label for what kind of noise this is — 2-4 words",
      "the_problem": "Specifically why this is noise — not just 'it's complicated' but what's actually wrong with it — one sentence",
      "kernel_of_truth": "The grain of truth that makes this noise believable (or null if there isn't one) — one sentence"
    }
  ],

  "genuinely_debated": [
    {
      "question": "The specific unresolved question — one sentence",
      "side_a": "One legitimate position and its evidence base — one sentence",
      "side_b": "The other legitimate position and its evidence base — one sentence",
      "why_unsettled": "What it would take to actually settle this — better data, longer timescales, individual variation, etc. — one sentence"
    }
  ],

  "the_bottom_line": {
    "what_to_do": "Given signal vs. noise, what does the evidence actually support doing? Specific and actionable. — one sentence",
    "what_to_ignore": "The popular advice that the evidence doesn't support — be direct — one sentence",
    "the_honest_uncertainty": "What genuinely isn't known and why that matters — one sentence"
  },

  "sources_of_noise": [
    {
      "actor": "Who or what is generating noise in this space — one sentence",
      "incentive": "Why they generate misleading or incomplete information — one sentence",
      "how_to_spot_it": "How to recognize when you're getting their version vs. reality — one sentence"
    }
  ]
}`;

    const parsed = await callClaudeWithRetry({
model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      system: withLanguage(PERSONALITY, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'signal-vs-noise' });
    if (!parsed.the_signal || !parsed.why_this_field_is_noisy) {
      return res.status(500).json({ error: 'Could not analyze this topic. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('SignalVsNoise error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

module.exports = router;
