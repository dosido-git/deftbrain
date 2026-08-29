const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, CREATIVE_LIMITS } = require('../lib/rateLimiter');
const { runOutputGuard } = require('../lib/outputGuard');

const GUARD_ENTRY_MS = Number(process.env.GDC_GUARD_ENTRY_MS || 60_000);

// Only the message text. `feel` and `choose_if` describe the message, not the
// recipient, and are cheap to leave alone.
async function guardMessages(parsed, body, startedAt) {
  if (Date.now() - startedAt > GUARD_ENTRY_MS) {
    console.log('[gratitude-debt-clearer-v2] v2 guard: skipped — out of time, answer returned unguarded');
    return;
  }
  const fields = [];
  (parsed.thank_you_messages || []).forEach((m, i) => {
    if (m && typeof m.message_text === 'string' && m.message_text.trim().length > 15) {
      fields.push([`thank_you_messages[${i}].message_text`, m.message_text]);
    }
  });
  if (!fields.length) return;

  await runOutputGuard(parsed, {
    label: 'gratitude-debt-clearer-v2',
    fields,
    supplied: `WHAT THE SENDER TOLD US, IN FULL — nothing else about either person is known:
Recipient: ${(body.recipientName || '').trim() || '(not given)'}
Relationship, in their words: ${body.relationship || '(not given)'}
What actually happened, in their words: ${(body.gratitudePoints || '').trim() || '(not given)'}
Anything else they added: ${(body.extraContext || '').trim() || 'nothing'}

Nothing is known about their history together, how close they are, what either
of them felt, why the recipient helped, what it cost them, or what has passed
between them before or since.

WHAT FAILS:
1. A fact about the recipient the sender never supplied — a motive, a sacrifice,
   a worry, a habit, an inside joke, a trait. This message is sent verbatim to a
   real person who will know it is not true.
2. Turning an action into a character verdict the sender did not make. They said
   what happened; they did not say what kind of person it makes them.
3. Claiming what the recipient felt, intended or struggled with.
4. Emotion the sender did not express, put in the sender's mouth. They have to
   stand behind every word of this.
5. Specificity beyond what was given — a date, a place, a detail, a number that
   was never mentioned.
6. Three versions that are one message lightly reworded rather than genuinely
   different ways to say the same true thing.`,
  }, { max_tokens: 1400 });
}

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value. Use plain wording or single quotes inside JSON string values.';

const groundingRules = `GROUNDING — HARD REQUIREMENT:
- Personalize from facts the user actually supplied.
- Do NOT invent relationship history, closeness, shared habits, personality traits, motives, private feelings, inside jokes, routines, preferences, cultural identity, or emotional meaning.
- Do NOT turn an action into a character judgment unless the user already made that judgment.
- Specificity must not exceed the information supplied.
- If a useful personal detail is missing, do not fill the gap. Write naturally around what is known.
- Never claim the recipient felt, intended, worried, struggled, sacrificed, or behaved in a way the user did not state.
- The user RECEIVED the favor, gift, kindness, or support and is the person saying thank you.`;

router.post('/gratitude-debt-clearer', rateLimit(CREATIVE_LIMITS, 'gratitude-debt-clearer:'), async (req, res) => {
  const startedAt = Date.now();
  try {
    const {
      recipientName,
      gratitudePoints,
      relationship = 'Other',
      tone = 'Let DeftBrain choose',
      length = 'Moderate',
      extraContext = '',
      adjustmentPrompt,
      originalMessage,
      userLanguage,
    } = req.body;

    if (!recipientName?.trim()) return res.status(400).json({ error: 'Recipient name required' });
    if (!gratitudePoints?.trim()) return res.status(400).json({ error: 'Gratitude details required' });

    let prompt;

    if (adjustmentPrompt && originalMessage) {
      prompt = `You help people revise thank-you messages so they sound natural, specific, and sendable.

RECIPIENT: ${recipientName}
RELATIONSHIP: ${relationship}
WHAT ACTUALLY HAPPENED:
${gratitudePoints}
${extraContext ? `\nUSER-SUPPLIED CONTEXT:\n${extraContext}` : ''}

CURRENT MESSAGE:
${originalMessage}

REVISION REQUEST:
${adjustmentPrompt}

${groundingRules}

Revise the message without adding any fact or implication that is not supported above.

Return ONLY valid JSON:
{
  "thank_you_messages": [
    {
      "version": "Adjusted",
      "message_text": "complete revised message",
      "feel": "one short phrase describing how it reads",
      "choose_if": "one short sentence about the effect of this version"
    }
  ]
}

${NO_QUOTE_RULE}`;
    } else {
      const lengthGuide = length === 'Short'
        ? 'Keep each message concise, usually 2-4 sentences.'
        : length === 'Detailed'
          ? 'Use enough detail to feel substantial, but avoid repetition; usually 1-3 short paragraphs.'
          : 'Use a natural moderate length, usually one compact paragraph.';

      prompt = `You help people turn concrete acts of kindness into thank-you messages they will actually send.

RECIPIENT: ${recipientName}
RELATIONSHIP: ${relationship}
WHAT THE USER IS GRATEFUL FOR:
${gratitudePoints}
${extraContext ? `\nUSER-SUPPLIED CONTEXT OR FORMALITY NOTE:\n${extraContext}` : ''}

TONE PREFERENCE: ${tone}
LENGTH: ${length}

CORE JOB:
Write exactly THREE genuinely different thank-you messages. All three express the same true gratitude, but take different approaches so the user has a meaningful choice.

${groundingRules}

WRITING RULES:
- Lead with concrete details from the user's account rather than generic gratitude language.
- Sound like a real person, not a greeting card, therapist, etiquette manual, or AI assistant.
- Avoid inflated phrases such as 'says everything about the kind of person you are' unless the user explicitly supplied that sentiment.
- Avoid 'I don't deserve you', 'everyone hopes for a friend like you', and similar manufactured intimacy unless supported by the input.
- Do not add an offer to repay the favor unless the user asked for one.
- Do not give cultural advice or infer culture from locale, region, language, name, or relationship.
- If tone is 'Let DeftBrain choose', infer only the degree of formality warranted by the stated relationship and wording; do not infer closeness.
- The three versions must differ in approach, not merely synonyms. Good distinctions include: direct and specific; light and conversational; reflective but grounded.
- Do not label a version as best for a relationship history you do not know.
- Instead, 'choose_if' must describe the MESSAGE EFFECT, e.g. 'You want the thanks to feel warm without getting emotional.'
- ${lengthGuide}

OPTIONAL PERSONALIZATION PROMPT:
If one additional fact from the user could materially improve the message, provide ONE short question they could answer later. Ask for a fact; never suggest an invented memory. If no extra detail is needed, return an empty string.

FINAL CHECK BEFORE RETURNING:
1. Did I attribute any habit, preference, personality trait, motive, feeling, relationship history, or shared experience the user did not supply? If yes, remove it.
2. Is every emotionally meaningful claim traceable to the user's words?
3. Are the three versions meaningfully different?
4. Would an ordinary person plausibly send each one?

Return ONLY valid JSON:
{
  "thank_you_messages": [
    {
      "version": "short useful title",
      "message_text": "complete message",
      "feel": "short phrase describing how it reads",
      "choose_if": "short sentence describing the effect of choosing this version"
    },
    {
      "version": "short useful title",
      "message_text": "complete message",
      "feel": "short phrase describing how it reads",
      "choose_if": "short sentence describing the effect of choosing this version"
    },
    {
      "version": "short useful title",
      "message_text": "complete message",
      "feel": "short phrase describing how it reads",
      "choose_if": "short sentence describing the effect of choosing this version"
    }
  ],
  "personalization_prompt": "one optional question or empty string"
}

${NO_QUOTE_RULE}`;
    }

    const wrappedPrompt = withLanguage(prompt, userLanguage)
      + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

    const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 4200,
      messages: [{ role: 'user', content: wrappedPrompt }],
    }, { label: 'gratitude-debt-clearer' });

    if (!Array.isArray(parsed?.thank_you_messages) || !parsed.thank_you_messages.length) {
      return res.status(500).json({ error: 'Could not generate your messages. Please try again.' });
    }

    parsed.thank_you_messages = parsed.thank_you_messages.slice(0, adjustmentPrompt ? 1 : 3).map(m => ({
      ...m,
      length: typeof m.message_text === 'string' ? m.message_text.trim().split(/\s+/).filter(Boolean).length : 0,
    }));

    await guardMessages(parsed, req.body, startedAt);
    res.json(parsed);
  } catch (error) {
    console.error('Gratitude Debt Clearer error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.outputStandard = 'v2';
// gratitude-debt-clearer-v2. Reviewed 2026-08-28 after the rewrite. Every other
// v2 tool produces something the visitor reads; this one produces something they
// SEND, to someone who was actually there. An invented detail is not a quality
// problem here — the recipient knows it did not happen, and the sender is the
// one holding it. The route already carries strong grounding rules in the
// prompt; this is the check that they held.
router.outputGuard = {
  prohibit: [
    'invents_a_fact_about_the_recipient',
    'turns_an_action_into_a_character_verdict',
    'claims_what_the_recipient_felt_or_intended',
    'puts_emotion_in_the_senders_mouth',
    'specificity_beyond_what_was_supplied',
    'three_versions_that_are_one_message_reworded',
  ],
  require: [
    'sendable_as_written_by_this_sender',
    'fulfills_tool_promise',
  ],
};

module.exports = router;
