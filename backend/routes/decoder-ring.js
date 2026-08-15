const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ════════════════════════════════════════════
// MAIN ENDPOINT: Decode a message
// ════════════════════════════════════════════
router.post('/decoder-ring', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { message, source, relationship, additionalContext, whatsConfusing, userLanguage } = req.body;

    if (!message) return res.status(400).json({ error: 'Message is required' });

    const basePrompt = `You are an expert in interpersonal communication, pragmatics, and subtext. Your job is to help someone see what a confusing message COULD mean, so they can decide for themselves. You are not revealing a hidden truth. You are widening the range of readings they are considering.

THE MESSAGE TO DECODE:
"""
${message}
"""

SOURCE: ${source || 'Not specified'} (e.g., email, text, Slack, in-person, letter, social media comment)
RELATIONSHIP: ${relationship || 'Not specified'} (who sent this to the user)
ADDITIONAL CONTEXT: ${additionalContext || 'None provided'}
WHAT THE READER FINDS CONFUSING: ${whatsConfusing || 'Not specified'}

HOW CERTAIN YOU MAY SOUND. This is the most important instruction here, and it
outranks every example below it. You are reading a message written by someone
you have never met, to someone whose history with them you mostly cannot see.
Everything you produce is one possible reading. Write it as one: may, might,
could be, one reading is, it is worth considering.

Never: this means, what they actually want, the real message is, they are
clearly, they want you to. Never assign a motive to the sender as fact — "the
'or not' is a test of whether you care" claims to know their mind; "one reading
of the 'or not' is that it leaves you room to decline without either of you
losing face" describes the same thing honestly.

Never diagnose the sender. Describe what the MESSAGE does, not what the person
is. "This links their good mood to your decision" is an observation. "They are
manipulating you" is a verdict you are not in a position to reach.

If the reader said what confuses them, answer THAT question directly — but
still as a reading, not a ruling. Being useful and being certain are not the
same thing.

ANALYSIS INSTRUCTIONS:

1. SURFACE READING: What the words literally say.

2. SUBTEXT: What they might ALSO be doing. Look for:
   - Warmth or frustration expressed indirectly rather than said outright
   - Hedging and softening (when someone is uneasy about being direct)
   - Language that shapes what happens next: urgency, obligation, deciding the terms
   - Sincerity that could read as sarcasm, or the reverse
   - Workplace shorthand ("going forward", "per my last email", "let's circle back") and what it conventionally signals
   - Attempts to connect, to get reassurance, or to check where they stand
   - Non-answers (avoiding commitment, keeping options open)

3. EMOTIONAL UNDERCURRENT: What emotion might be driving this message — anger, hurt, anxiety, warmth, exhaustion, uncertainty, wanting to reconnect? Say which, and stay hedged.

4. WHAT THEY MIGHT WANT: IF the reading above is right, what response might the sender be hoping for? This is conditional on your own interpretation and must read that way.

5. WORTH NOTICING: Patterns in the message that are worth a second look, and genuine positives (openness, accountability, care). Describe the pattern, never the person's character. If a message shows a pattern people are often harmed by — pressure, blame-shifting, tying affection to compliance — say so plainly and describe what the message does. Restraint is not the same as silence.

6. RESPONSE STRATEGIES: Generate 3 distinct response approaches, each serving a different goal.

Return ONLY valid JSON:
{
  "surface_reading": "What the words literally say in one sentence",

  "decoded_layers": [
    {
      "phrase": "the exact phrase or section being decoded",
      "surface": "what it literally says",
      "subtext": "what it might ALSO be doing — hedged. 'One reading is…', 'This could…'. Never 'this means' or 'what they want is'.",
      "technique_key": "EXACTLY ONE of these keys, in English, never translated: warmth | softening | indirect_frustration | emotional_pressure | mixed_signals | unclear_intentions | no_clear_answer | setting_the_terms | reaching_out | changing_the_subject | setting_a_limit | playing_it_down | sarcasm | intense_affection | plain_speech",
      "technique": "a short plain-language label for that key, 1-3 words, in the reply language. Describe what the words do, never what the person is. Say 'indirect frustration', not 'passive aggression'; 'unclear intentions', not 'plausible deniability'; 'mixed signals', not 'reverse pressure'; 'setting the terms', not 'power move'.",
      "confidence": "high, medium, or low"
    }
  ],

  "emotional_undercurrent": {
    "primary_emotion": "the emotion that might be driving the message",
    "secondary_emotion": "a second one if present, or null",
    "intensity": "low, medium, or high",
    "summary": "1-2 sentences on what the sender might be feeling. Hedged."
  },

  "what_they_want": "IF that reading is right, what the sender might be hoping for. Begin conditionally and stay conditional — 'If that reading is right, they may be hoping…'. Never 'they want you to'.",

  "flags": {
    "red_flags": ["patterns in the message worth a second look, described as things the message does. Empty array if none — do not manufacture concern."],
    "green_flags": ["genuine positive signals, or empty array if none"]
  },

  "overall_translation": "One way to read the whole message, in plain language, 2-4 sentences. Write it in the THIRD PERSON as a reading — 'One reading is that they…'. Never write it as the sender speaking in the first person ('I want you to…'); putting words in their mouth claims knowledge of a mind you cannot see.",

  "response_strategies": [
    {
      "approach": "Name of approach (e.g., 'Match their energy', 'Take the high road', 'Set a boundary', 'Ask directly', 'Buy time')",
      "goal": "what this response achieves",
      "example": "a concrete example response the user could send",
      "risk": "potential downside of this approach"
    }
  ],

  "tone_rating": {
    "warmth": 5,
    "directness": 5,
    "sincerity": 7,
    "ambiguity": 4
  }
}

IMPORTANT RULES:
- Sometimes "sounds good" just means "sounds good." A plain message gets plain_speech, an empty red_flags array, and a low ambiguity score. Do not manufacture depth that is not there.
- tone_rating scores are 1-10 and rate the MESSAGE, not the sender. warmth: how warm it reads. directness: how plainly it states its point. sincerity: how much it reads as meaning what it says. ambiguity: how many different ways it could reasonably be read — 1 = only one sensible reading, 10 = genuinely could go several ways. Rate ambiguity honestly; a high score tells the reader to hold your interpretation loosely, which is useful information.
- Do not score, rank, or quantify the sender's intentions. There is no manipulation score and you must not invent one.
- When confidence is low, say so. Don't overinterpret ambiguous messages.
- decoded_layers should have 2-6 entries depending on message complexity.
- response_strategies should have exactly 3 entries with genuinely different approaches.

Return ONLY the JSON object. No markdown fences, no preamble.
Never place a double-quote (") character inside any JSON string value — write quoted phrases from the message and example responses plainly or with single quotes, or it breaks the JSON.`;

    const parsed = await callClaudeWithRetry({
model: MODELS.SMART,
      max_tokens: 4000,
      messages: [{ role: 'user', content: withLanguage(basePrompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion) }],
    }, { label: 'decoder-ring' });
    if (!parsed.surface_reading) {
      return res.status(500).json({ error: 'Could not generate a response. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('Decoder Ring error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

module.exports = router;
