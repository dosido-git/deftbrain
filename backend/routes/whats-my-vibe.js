const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const PERSONALITY = `You are What's My Vibe. Analyze patterns that are actually visible in the user's writing samples and help the user see how their writing may come across to a reader.

You are analyzing writing, not diagnosing the writer.

Distinguish carefully between:
- OBSERVATION — directly visible in the samples: sentence length, punctuation, capitalization, vocabulary, repetition, hedging, intensifiers, humor, questions, apologies, qualifiers, directness, formality, structure, emojis, etc.
- PLAUSIBLE IMPRESSION — how those observable choices might make the writing feel to a reader.
- INNER STATE OR PERSONALITY — motives, anxiety, insecurity, attachment, hidden feelings, psychological needs, character traits, coping mechanisms, or what the writer "really" feels. Do not infer these.

Never turn a writing pattern into a psychological explanation.
- "Uses humor when delivering bad news" is supported if visible.
- "Uses humor to manage anxiety and keep people from feeling burdened" is not.
- "Frequently apologizes before inconveniencing someone" may be supported.
- "Constantly manages everyone else's feelings" is not.

SAMPLE LIMIT: Treat the supplied writing as a sample, not the user's permanent voice. Do not convert repeated behavior in a small sample into "always," "constantly," "your default," or a stable personality trait.

CONTEXT MATTERS: Text messages, work chat, dating profiles, email, and social posts may reflect different voices. Use the selected source when interpreting patterns. Do not generalize from one context to the user's communication everywhere.

NO MIND READING: Never state what readers actually think or feel. Say what wording may, can, or is likely to convey when the evidence is strong enough.

NO PRAISE GENERATOR: Do not automatically turn every pattern into a flattering character portrait. Interesting, awkward, contradictory, neutral, and potentially misread patterns are all valid findings.

GROUND EVERY FINDING: Every substantive observation must be traceable to something present in the supplied samples. Use very short examples when useful.

Be perceptive and playful, but epistemically modest. The pleasure of the tool should come from the user thinking "I really do write like that," not "Wow, AI knows my secret personality."

Do not include hidden psychology, personality diagnosis, emotional subtext, or unsupported explanations of why the writer communicates this way.

When a finding quotes exact wording from the sample, wrap the quoted phrase in single quotes ('like this'), never a double-quote character — a double-quote inside a JSON string value breaks the response.`;

router.post('/whats-my-vibe', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { samples, sourceType, userLanguage } = req.body;

    if (!samples?.trim()) {
      return res.status(400).json({ error: 'Paste some writing so I can find the patterns.' });
    }

    const sourceMap = {
      texts: 'casual text messages',
      emails: 'emails',
      social: 'social media posts',
      dating: 'a dating profile',
      'work-slack': 'work chat / Slack',
      other: 'other writing',
    };

    const userPrompt = `FIND THE PATTERNS IN THIS WRITING

SOURCE: ${sourceMap[sourceType] || sourceMap.other}

THE WRITING:
"""
${samples.trim()}
"""

Find the writing patterns actually visible in this sample and how they might land on a reader. Ground every claim in something present in the text above. Do not explain why the writer communicates this way.

Return ONLY valid JSON:
{
  "vibe_title": "A memorable, playful 2-5 word name for the WRITING STYLE, not the person — describes the writing, e.g. 'The Deadpan Side-Quest'",
  "vibe_summary": "1-2 sentences summarizing the strongest observable pattern in this sample",
  "what_you_do": [
    "3-5 specific writing habits actually visible in the sample. Each should reference or quote something in the text. Quoted phrases use single quotes, never a double-quote character."
  ],
  "how_it_can_land": [
    "2-4 plausible reader impressions created by those writing choices. Phrase these as possibilities ('can come across as', 'may read as'), never as fact about what a reader actually thinks."
  ],
  "signature_moves": [
    "2-4 distinctive verbal, punctuation, structural, or humor patterns visible in the sample. Short phrases or exact quoted wording work well. Quoted phrases use single quotes, never a double-quote character."
  ],
  "pattern_tags": [
    "2-4 very short (1-3 word) labels naming the patterns above, for a compact summary line — e.g. 'dry exaggeration', 'topic hopping', 'personification'"
  ],
  "easy_to_misread": "One genuine ambiguity where the writer may intend something one way but it could plausibly read another way, grounded in the sample. If nothing in the sample supports a real ambiguity, say that honestly instead of inventing one.",
  "vibe_one_line": "One concise, playful description of the writing style, grounded in the analysis above"
}

FINAL CHECK:
- Is every claim traceable to something actually in the sample?
- Did you avoid explaining WHY the person writes this way (anxiety, insecurity, motive, attachment)?
- Are how_it_can_land impressions phrased as possibilities, not facts about what a reader thinks?
- Did you avoid turning this one sample into "always" or "your default"?
- Is vibe_title a name for the WRITING, not a verdict on the writer's personality?
- Did you check easy_to_misread honestly rather than inventing an ambiguity that isn't there?
- Did every quoted phrase use single quotes instead of double quotes, so the JSON stays valid?`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 4000,
      system: withLanguage(PERSONALITY, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'whats-my-vibe' });

    if (!parsed.vibe_title || !Array.isArray(parsed.what_you_do) || !parsed.what_you_do.length || !parsed.vibe_one_line) {
      return res.status(500).json({ error: 'Could not read the patterns in your writing. Please try again.' });
    }

    res.json(parsed);
  } catch (error) {
    console.error('WhatsMyVibe error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
