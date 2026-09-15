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

DON'T TURN A SINGLE INSTANCE INTO A HABIT: Describe a pattern as recurring only when it actually recurs in the supplied sample. A technique that appears once is an example, not a "signature move," a tendency, or something the writer "always" does — even if the sample is short and that one instance is the most interesting thing in it. This applies to verbs too: "keeps checking," "keeps softening," or "keeps apologizing" claims repetition just as much as "always" or "constantly" does — if the sample shows it happening once, say it happened once. Describing the same sentence or moment from three different angles is not three signature moves; it is one, however many facets it has.

CONTEXT MATTERS: Text messages, work chat, dating profiles, email, and social posts may reflect different voices. Use the selected source when interpreting patterns. Do not generalize from one context to the user's communication everywhere.

DESCRIBE EFFECT, NOT INTENT: You may identify what a writing choice does on the page and how it may come across, but never state or imply why the writer chose it unless they said why. Replace "you use X to..." with formulations such as "X creates...," "X can make the message feel...," or "X has the effect of...". A formal phrase does not exist "to sound collaborative" or "to keep distance" — it simply has a formal, collaborative, or distancing effect. The writer's reason is not visible in the text; only the effect is.

NO MIND READING: Never state what readers actually think or feel. Say what wording may, can, or is likely to convey when the evidence is strong enough.

READER IMPRESSIONS: In how_it_can_land specifically, describe qualities the writing may convey — formal, indirect, warm, abrupt, playful, cautious — not specific thoughts, suspicions, motives, or stories a hypothetical reader might construct. "May make the reader wonder what you're holding back" and "can feel like you're building a paper trail" invent a reader's specific thought, not a quality of the writing. "Can read as carefully worded and indirect" does not.

DO NOT NAME AN EMOTION UNLESS THE WRITING NAMES OR UNAMBIGUOUSLY EXPRESSES IT: Do not translate slang, emoji, exaggeration, or humor into a specific hidden feeling. A 💀 emoji or an exaggerated "this was mortifying" reads as comic framing of a disaster — it does not establish that the writer actually felt embarrassed. Describe the device (exaggeration, an emoji standing in for reaction, deadpan understatement) and its effect, not a named emotion the text never states.

DO NOT INVENT A SOCIAL PURPOSE: A writing choice may have an observable effect, but do not say it "invites solidarity," assumes the reader "gets the vibe," makes a reader "feel included," or otherwise assigns a social strategy or response that isn't demonstrated by the text.

KEEP INTERPRETATION CLOSE TO THE WORDS: Prefer the smallest explanation that accounts for the observable pattern. Do not enlarge a phrase into a broader story about the writer or reader when a direct linguistic description will do.

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
    "3-5 specific writing habits actually visible in the sample. Describe what each choice DOES ('X creates...', 'X has the effect of...'), never why the writer chose it. Each should reference or quote something in the text. Quoted phrases use single quotes, never a double-quote character."
  ],
  "how_it_can_land": [
    "2-4 qualities the writing may convey (formal, indirect, warm, abrupt, playful, cautious), phrased as possibilities ('can come across as', 'may read as'). Never invent a specific thought, suspicion, or story a reader might have — describe a quality of the writing, not a scene in a reader's head."
  ],
  "signature_moves": [
    "Only recurring or genuinely distinctive patterns actually supported by the sample — typically 2-4, but if there isn't evidence for that many, return fewer rather than padding to a quota. A pattern that appears exactly once needs to be genuinely distinctive on its own to belong here, not merely notable. Short phrases or exact quoted wording work well. Quoted phrases use single quotes, never a double-quote character."
  ],
  "pattern_tags": [
    "2-4 very short (1-3 word) labels naming the patterns above, for a compact summary line — e.g. 'dry exaggeration', 'topic hopping', 'personification'"
  ],
  "easy_to_misread": "Include this only when the actual wording supports two genuinely plausible readings — state only readings the text supports, do not manufacture a second interpretation just to fill the field. Set this to null if there isn't a meaningful ambiguity.",
  "vibe_one_line": "One concise, playful description of the writing style, grounded in the analysis above. This field is a common place for the habit-from-one-instance and invented-motive mistakes to sneak back in — describe the writing itself, not a repeated behavior the sample only shows once, and not a feeling ('afraid,' 'anxious,' 'insecure') the writer never stated."
}

FINAL CHECK:
- Is every claim traceable to something actually in the sample?
- Did you avoid explaining WHY the person writes this way (anxiety, insecurity, motive, attachment)?
- Does every what_you_do item describe what a choice DOES, not why the writer made it — no "to sound...", "to reframe...", "to soften and add distance"?
- Are how_it_can_land items qualities of the writing (formal, indirect, cautious...), not specific reader thoughts, suspicions, or stories?
- Did you name an emotion (embarrassed, anxious, excited...) anywhere without the text actually stating or unambiguously expressing it? Slang, emoji, and exaggeration are devices with effects, not proof of a specific feeling.
- Did you invent a social purpose — "invites solidarity," "assumes the reader gets the vibe," "makes a reader feel included" — that the text doesn't demonstrate?
- Did you pick the smallest explanation that fits, rather than enlarging a phrase into a bigger story about the writer or reader?
- Did you avoid turning this one sample into "always" or "your default"?
- Does every signature_move actually recur, or is genuinely distinctive on its own — did you avoid padding the list to hit a quota when the sample only supports one or two?
- Did vibe_one_line or any other field turn something that happened once into "always checking," "constantly," or a similar habitual claim the sample doesn't support?
- Is vibe_title a name for the WRITING, not a verdict on the writer's personality?
- Does easy_to_misread (if not null) state two readings the wording actually supports, rather than a manufactured second interpretation?
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
