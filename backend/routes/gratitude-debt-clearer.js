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

  const answered = (Array.isArray(body.additionalFacts) ? body.additionalFacts : [])
    .filter(f => typeof f === 'string' && f.trim());

  await runOutputGuard(parsed, {
    label: 'gratitude-debt-clearer-v2',
    fields,
    supplied: `WHAT THE SENDER TOLD US, IN FULL — nothing else about either person is known:
Recipient: ${(body.recipientName || '').trim() || '(not given)'}
Relationship, in their words: ${body.relationship || '(not given)'}
What actually happened, in their words: ${(body.gratitudePoints || '').trim() || '(not given)'}
Anything else they added: ${(body.extraContext || '').trim() || 'nothing'}
${answered.length ? `They were asked for more detail during this session and answered:\n${answered.map(f => `- ${f}`).join('\n')}\nThose answers are their own words. Treat them exactly like the account above.` : 'They were not asked for, and did not add, any further detail.'}

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

// ════════════════════════════════════════════════════════════
// GROUNDING AND PERSONALIZATION
// ════════════════════════════════════════════════════════════
// Owner-supplied, permanent, and shared by every mode this route serves —
// initial generation and every refinement. The rule about asking instead of
// guessing is only meaningful because the response contract below lets the
// model return a question instead of prose; a prompt that forbids inventing
// while the schema demands a message every time will produce invention.
const groundingRules = `GROUNDED TRANSFORMATION — HARD REQUIREMENT

Personalization must remain grounded in information the user supplied.

Do not merely repeat or rearrange the user's facts. Transform those facts into natural expressions of gratitude.

You MAY:
- interpret the evident effort, significance, contrast, or practical meaning of an action when that interpretation follows naturally from the facts supplied;
- express appreciation for that effort or significance;
- paraphrase concrete facts into natural conversational language;
- connect multiple supplied facts to explain why the gesture was meaningful.

You MUST NOT turn an interpretation into a new personal fact.

Never invent:
- relationship history or duration;
- past behavior not supplied;
- personality or character traits;
- motives or intentions;
- thoughts or feelings of the recipient;
- shared memories or inside jokes;
- habits, preferences, or routines;
- emotions or consequences the user did not state and that do not follow directly from the supplied facts.

Examples:

USER FACT:
"Drove four hours to help me move."

ALLOWED:
"That was a lot to take on just to help me."
"You went well out of your way to help."

NOT ALLOWED:
"You've always been the friend I can count on."
"You never hesitate to help people."

USER FACT:
"Didn't complain once."

ALLOWED:
"You never made any of it feel like a burden."
"You handled the whole thing without making a fuss."

NOT ALLOWED:
"I know you were exhausted."
"That's just the kind of person you are."

USER FACT:
"Bought me dinner afterward."

ALLOWED:
"And then you bought me dinner on top of everything else."
"You somehow topped it off by buying me dinner."

NOT ALLOWED:
"You knew exactly what I needed."
"You're always taking care of everyone."

The goal is:
INTERPRET THE FACTS WITHOUT INVENTING FACTS.

Do not create false intimacy in order to make a message sound personal.

Cultural expectations are a fact like any other: use them only when the user
supplied them.

If a requested revision would require information you do not have, do not guess.
Ask one concise, useful question instead.

STYLE GROUNDING

Do not claim to know what sounds like the user unless the user has supplied
style preferences or writing examples.

Use only explicit style information gathered in this interaction.

A style preference changes HOW the message is written. It must never introduce
new facts about WHAT happened.

DELIVERY METHOD — HARD REQUIREMENT

Do not imply or mention a delivery method — such as text, card, email, letter, note, speech, or conversation — unless the user explicitly supplied or selected one.

When no delivery method is known, write the message so it works naturally across ordinary delivery methods.

FINAL CHECK BEFORE RETURNING ANY MESSAGE

Ask internally:
1. Did every personal detail come from the user?
2. Did I invent closeness, history, personality, motives, memories, or feelings?
3. Did I add specificity that was not supplied?
4. If I lacked information needed for the requested revision, should I ask instead?
5. Did I transform the user's facts into meaningful gratitude, or did I merely repeat them?

If any answer reveals unsupported content, revise before returning.

The user RECEIVED the favour, gift, kindness or support and is the person saying
thank you.`;

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
      action,                 // more_specific | less_emotional | more_like_me
      stylePreferences,       // only ever affects phrasing, never facts
      additionalFacts,        // answers the visitor gave to earlier clarify questions
      userLanguage,
    } = req.body;

    if (!recipientName?.trim()) return res.status(400).json({ error: 'Recipient name required' });
    if (!gratitudePoints?.trim()) return res.status(400).json({ error: 'Gratitude details required' });

    let prompt;

    // Facts the visitor has added since the first draft, by answering a clarify
    // question. They are as authoritative as the original input — the visitor
    // supplied them.
    const addedFacts = Array.isArray(additionalFacts) ? additionalFacts.filter(f => typeof f === 'string' && f.trim()) : [];
    const factBlock = `RECIPIENT: ${recipientName}
RELATIONSHIP: ${relationship}
WHAT ACTUALLY HAPPENED, IN THE USER'S WORDS:
${gratitudePoints}${addedFacts.length ? `\n${addedFacts.map(f => `${f} (they added this when you asked — it is their own account, exactly as authoritative as the lines above, and it is available to you)`).join('\n')}` : ''}
${extraContext ? `\nANYTHING ELSE THEY ADDED:\n${extraContext}` : ''}`;

    // What the visitor told us about how they write. Never about what happened.
    const sp = stylePreferences && typeof stylePreferences === 'object' ? stylePreferences : {};
    const styleNotes = [
      sp.lessPolished && 'Too polished. Let it be a little rougher — the phrasing a real person reaches for first, not the one they settle on after three drafts.',
      sp.lessFormal && 'Too formal. Drop the register: plainer words, contractions, how they would actually address this person.',
      sp.lessEmotional && 'Too emotional. Say the same thing with less feeling in it. Do not replace the feeling with distance.',
      sp.shorter && 'Too wordy. Cut it down. Every fact stays; the padding goes.',
      sp.moreCasual && 'They would say it more casually. Loosen the sentences toward speech.',
      ...(Array.isArray(sp.naturalLanguage) ? sp.naturalLanguage.filter(Boolean).map(v => `In their own words, how they talk: ${v}. Write it that way.`) : []),
    ].filter(Boolean);
    const styleBlock = styleNotes.length
      ? `\nHOW THEY SAY THEY WRITE — affects phrasing ONLY, never what happened:\n${styleNotes.map(n => `- ${n}`).join('\n')}`
      : '\nHOW THEY SAY THEY WRITE: nothing supplied. Do not guess at their voice.';

    // When the visitor has just answered a question, "be more specific" is no
    // longer an open search — the answer IS the material, and returning a draft
    // that omits it is the one outcome that makes asking pointless. Live-tested:
    // with only the general brief the model dropped the supplied fact and
    // returned a SHORTER message. A prompt branch, not a prose rule.
    const moreSpecificBrief = addedFacts.length
      ? `The visitor wants this more specific, and has just answered your question.

Their answer is listed above under FACTS THEY SUPPLIED WHEN ASKED. That answer is
the material you asked for. Work it into the message, in the sender's own register,
so the thanks names what actually happened rather than gesturing at it.

Do NOT return a message that omits it. Do NOT ask another question — you already
have what you asked for. Do NOT shorten or flatten the message: the point of this
revision is that it now carries a detail it did not carry before.

Use only what they supplied. Do not extrapolate from their answer.`
      : `The visitor wants this more specific.

First look for material in the facts above that this message has NOT used, or
has mentioned only in passing. Bring that forward. That is the whole job when
such material exists.

If the message already uses every material fact, do NOT invent a detail to
satisfy the request. Return a clarify response instead, naming the ONE missing
fact that would most improve this particular message. Ask for something small
and answerable, about what actually happened.`;

    const ACTION_BRIEF = {
      more_specific: moreSpecificBrief,
      less_emotional: `Reduce emotional intensity while preserving all important factual content.
Prefer concrete appreciation over emotional amplification. Do not make the
message colder, more formal, or less grateful than it needs to be. Do not
introduce new facts. This request needs no clarification — the click told you
what you needed to know.`,
      more_like_me: styleNotes.length
        ? `Rewrite in line with the style notes above, and nothing else.

Those notes are the visitor's answer. Do NOT ask what they meant — they have
already told you, and asking again for the same information is the one response
this request cannot have. Act on what is there.

Style changes phrasing, never facts. Keep every fact the message already carries.
The result must be audibly different from the current message, or the click did
nothing.`
        : `No style information was supplied, so you do not know what sounds like
them. Return a clarify response asking what does not sound like them, rather than
guessing at a voice.`,
    };

    if ((adjustmentPrompt || action) && originalMessage) {
      const brief = ACTION_BRIEF[action] || `REVISION REQUEST:\n${adjustmentPrompt}`;
      const suppliedNote = addedFacts.length
        ? `\n\nNOTE ON THE FINAL CHECK ABOVE: the user answered a question during this
session. Their answer is in the account above. It is supplied information, not
added specificity — using it is required, and omitting it fails the revision.`
        : '';
      prompt = `You help people revise thank-you messages so they sound natural, specific, and sendable.

${factBlock}
${styleBlock}

CURRENT MESSAGE:
${originalMessage}

WHAT THEY ASKED FOR:
${brief}

${groundingRules}${suppliedNote}

Revise without adding any fact or implication not supported above.

YOU MAY RETURN A QUESTION INSTEAD OF A MESSAGE. That is not a failure — it is the
correct answer when the revision they asked for would need something you have not
been told. One question, concrete and answerable, about a fact rather than a
feeling. Never ask more than one.

Return ONLY valid JSON, in ONE of these two shapes:

{
  "type": "messages",
  "thank_you_messages": [
    {
      "version": "Adjusted",
      "message_text": "complete revised message",
      "feel": "one short phrase describing how it reads",
      "choose_if": "one short sentence about the effect of this version"
    }
  ]
}

or:

{
  "type": "clarify",
  "question": "the one question that would most improve this message",
  "reason": "one short sentence on why this detail is needed"
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

MEANINGFUL DIFFERENTIATION — HARD REQUIREMENT

The three messages must represent genuinely different rhetorical approaches, not three paraphrases of the same sentence.

Each version must actually demonstrate the approach stated in its title and description.

For example:

DIRECT AND SPECIFIC
Lead with what happened and express appreciation plainly.

LIGHT AND CONVERSATIONAL
Use natural spoken rhythm, lightness, contrast, or gentle humor when supported by the facts. Do not claim humor unless the message actually contains it.

REFLECTIVE BUT GROUNDED
Draw out why the supplied actions mattered without inventing emotional meaning, relationship history, or character traits.

FINAL DIFFERENTIATION CHECK:
Compare all three messages before returning them.

If two messages could become essentially identical by moving the recipient's name, changing sentence order, or substituting a few synonyms, they are not sufficiently different. Rewrite one.

Also verify that each message actually delivers the rhetorical quality promised by its title and description.

CARD-TO-MESSAGE CONSISTENCY — HARD REQUIREMENT

Each card's title, descriptor, and "Choose this if" must accurately describe the message that was actually generated.

Do not claim that a message contains humor, levity, reflection, emotional depth, directness, restraint, or another rhetorical quality unless the message actually demonstrates it.

For "Reflective but Grounded," draw out the significance of the supplied actions or effort without inventing motives, feelings, character traits, or relationship history.

FINAL CHECK:
Read the completed message first, then verify its title, descriptor, and "Choose this if" against the actual wording. If they do not match, revise the card before returning it.

WRITING RULES:
- Lead with concrete details from the user's account rather than generic gratitude language.
- Sound like a real person, not a greeting card, therapist, etiquette manual, or AI assistant.
- Avoid inflated phrases such as 'says everything about the kind of person you are' unless the user explicitly supplied that sentiment.
- Avoid 'I don't deserve you', 'everyone hopes for a friend like you', and similar manufactured intimacy unless supported by the input.
- Do not add an offer to repay the favor unless the user asked for one.
- Do not give cultural advice or infer culture from locale, region, language, name, or relationship.
- If tone is 'Let DeftBrain choose', infer only the degree of formality warranted by the stated relationship and wording; do not infer closeness.
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

    // A question is a valid answer, not a failed generation. Only refinements may
    // return one — the first draft always has the visitor's own words to work
    // from, so there is nothing it could need to ask for.
    if (parsed?.type === 'clarify' && typeof parsed.question === 'string' && parsed.question.trim()) {
      if (!originalMessage) {
        return res.status(500).json({ error: 'Could not generate your messages. Please try again.' });
      }
      console.log(`[gratitude-debt-clearer] clarify (${action || 'freeform'}): ${parsed.question.slice(0, 80)}`);
      return res.json({ type: 'clarify', question: parsed.question.trim(), reason: typeof parsed.reason === 'string' ? parsed.reason.trim() : '' });
    }

    if (!Array.isArray(parsed?.thank_you_messages) || !parsed.thank_you_messages.length) {
      return res.status(500).json({ error: 'Could not generate your messages. Please try again.' });
    }

    parsed.type = 'messages';
    parsed.thank_you_messages = parsed.thank_you_messages.slice(0, (adjustmentPrompt || action) ? 1 : 3).map(m => ({
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
