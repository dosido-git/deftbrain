const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const PERSONALITY = `Epistemics expert. Separate what's genuinely known from what's contested, overstated, or manufactured controversy.

For every topic: identify real consensus (the signal), genuine expert uncertainty (honest noise), and manufactured controversy pushed by interested parties (false noise). Be specific about who benefits from the noise. Never false-balance settled questions; never dismiss genuinely open ones.

Keep every field to one concise sentence (why_this_field_is_noisy may be 2-3). Provide AT MOST 4 the_signal.items, 5 the_noise, 3 genuinely_debated, and 4 sources_of_noise. Never place a double-quote (") character inside any JSON string value — a literal " breaks the JSON.`;

router.post('/signal-vs-noise', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { topic, conflictingAdvice, userContext, userLanguage } = req.body;
    if (!topic?.trim()) return res.status(400).json({ error: 'What topic are you trying to cut through?' });

    // One 7-key schema at max_tokens 5000 measured 66-71s — past the ~60s where
    // Safari abandons the fetch. The tool's own name is the seam: what's known
    // in one call, what's manufactured in the other. Disjoint top-level keys,
    // merged back to the original response shape (frontend untouched).
    const brief = `SIGNAL VS. NOISE

TOPIC: "${topic.trim()}"
${conflictingAdvice?.trim() ? `CONFLICTING ADVICE THEY'VE SEEN:\n${conflictingAdvice.trim()}` : ''}
${userContext?.trim() ? `THEIR CONTEXT: ${userContext.trim()}` : ''}

Separate what's actually known from what just feels known.

LENGTH CONTRACT: the one-concise-sentence-per-field rule is HARD — a field that runs multiple sentences risks truncating the whole response in longer languages.

You are producing ONE PART of the analysis. Another analyst is producing the other part — return only your own keys.`;

    // ── Part A: what is actually established, and what is honestly open ──
    const signalPrompt = `${brief}

YOUR PART: the settled science and the genuine expert disagreement.

Return ONLY valid JSON with EXACTLY these four top-level keys:
{
  "topic_as_understood": "The specific domain you're analyzing — narrow it if needed",

  "why_this_field_is_noisy": "2-3 sentences on WHY this topic generates so much contradictory advice — commercial interests, research methodology issues, individual variation, media incentives, etc.",

  "the_signal": {
    "label": "SETTLED SCIENCE / STRONG CONSENSUS / WELL-ESTABLISHED PATTERN",
    "items": [
      {
        "claim": "What is actually well-established",
        "why_we_know_this": "The type of evidence and why it's reliable — RCTs, meta-analyses, decades of data, etc.",
        "the_nuance": "The important qualifier that's often stripped out when this gets repeated (or null)"
      }
    ]
  },

  "genuinely_debated": [
    {
      "question": "The specific unresolved question",
      "side_a": "One legitimate position and its evidence base",
      "side_b": "The other legitimate position and its evidence base",
      "why_unsettled": "What it would take to actually settle this — better data, longer timescales, individual variation, etc."
    }
  ]
}

Provide AT MOST 4 the_signal.items and 3 genuinely_debated.`;

    // ── Part B: what is manufactured, who profits, and what to do about it ──
    const noisePrompt = `${brief}

YOUR PART: the noise, who generates it, and the practical bottom line.

Return ONLY valid JSON with EXACTLY these three top-level keys:
{
  "the_noise": [
    {
      "claim": "The popular recommendation or belief",
      "noise_type": "marketing | methodology_problem | cherry_picked | outdated | oversimplified | ideology | individual_variation | media_distortion",
      "noise_label": "Human-readable label for what kind of noise this is",
      "the_problem": "Specifically why this is noise — not just 'it's complicated' but what's actually wrong with it",
      "kernel_of_truth": "The grain of truth that makes this noise believable (or null if there isn't one)"
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
}

Provide AT MOST 5 the_noise and 4 sources_of_noise. noise_type must be one of the listed values, in English, exactly as written.`;

    const locale = withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);
    const [signalPart, noisePart] = await Promise.all([
      callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 3000,
        system: withLanguage(PERSONALITY, userLanguage) + locale,
        messages: [{ role: 'user', content: signalPrompt }],
      }, { label: 'signal-vs-noise:signal' }),
      callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 3000,
        system: withLanguage(PERSONALITY, userLanguage) + locale,
        messages: [{ role: 'user', content: noisePrompt }],
      }, { label: 'signal-vs-noise:noise' }),
    ]);
    const parsed = { ...noisePart, ...signalPart };
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
