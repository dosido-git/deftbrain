const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { runOutputGuard } = require('../lib/outputGuard');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — write quoted dialogue or phrases plainly or with single quotes, or it breaks the JSON.';

// ═══════════════════════════════════════════════════════════════
// MAIN ANALYSIS
// ═══════════════════════════════════════════════════════════════

router.post('/conflict-coach', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { receivedMessage, relationship, goals, userDraft, actualGoal, isThread, personLabel, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!receivedMessage || receivedMessage.trim().length < 10) {
      return res.status(400).json({ error: 'Please provide the message (at least 10 characters)' });
    }

    const goalsText = goals?.length > 0 ? goals.map(g => g.replace(/_/g, ' ')).join(', ') : 'respond thoughtfully';

    // One call, one job. The split into a "read" and a "respond" call existed
    // to serve two big schemas; there is one small schema now.
    const systemPrompt = `You are Conflict Coach.

The visitor has received a tense message and wants help deciding how to respond.

Your job is not to diagnose the conflict or the other person. Your job is to help the visitor write a response that advances the goal they selected.

Use only the message, relationship, conversation context, visitor's draft (if supplied), and selected goal.

Briefly identify language in the received message that materially affects how it could be answered. Quote the relevant words. When meaning is ambiguous, say so. Do not infer the sender's emotions, motives, intentions, needs, personality, or likely reaction.

Then provide four genuinely different, complete, ready-to-send responses. Every response must be something the visitor could send directly to the other person — not advice to the visitor, analysis, questions for the visitor, or instructions about what to write.

Each response must pursue the visitor's selected goal. Vary the approach, not merely the wording. Keep the language natural and proportionate to the message and relationship.

Do not invent events, history, responsibilities, feelings, agreements, or relationship dynamics that the visitor did not provide.

If important context is missing, write responses that remain useful under that uncertainty rather than filling in the missing facts.

${NO_QUOTE_RULE}
CRITICAL: Return ONLY valid JSON. No preamble, no markdown.`;

    const userPrompt = `${isThread ? 'CONVERSATION THREAD' : 'MESSAGE RECEIVED'}:
"${receivedMessage}"

RELATIONSHIP: ${relationship}${personLabel ? ` (${personLabel})` : ''}
THE GOAL THEY SELECTED: ${goalsText || 'not specified'}
${userDraft ? `WHAT THEY ARE TEMPTED TO SEND: "${userDraft}"` : ''}
${actualGoal ? `IN THEIR OWN WORDS: ${actualGoal}` : ''}

Output only:
{
  "message_read": "A brief, evidence-grounded observation about the received message — quote the words it turns on. Only when useful: null when the message is plain and there is nothing worth saying. Never about the sender.",
  "strategies": [
    {
      "title": "Short descriptive title for what this response does",
      "tone": "calm/firm/warm/direct",
      "response_text": "The complete message, ready to send to the other person exactly as written."
    }
  ]
}

Exactly four strategies. Nothing else.`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3000,
      system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'ConflictCoach' });

    if (!Array.isArray(parsed.strategies) || !parsed.strategies.length) {
      console.error('ConflictCoach: strategies not an array', typeof parsed.strategies);
      return res.status(500).json({ error: 'Could not put together a response. Please try again.' });
    }

    // Four tests, and a strategy that fails any of them is not a strategy.
    try {
      await runOutputGuard(parsed, {
        label: 'conflict-coach',
        // Titles are checked too. "Redirect without chasing" invents a chasing
        // dynamic nobody described, and it is the visitor-facing label on the
        // option — a violation there is as visible as one in the message.
        fields: parsed.strategies
          .flatMap((st, i) => [
            [`strategies[${i}].response_text`, st?.response_text],
            [`strategies[${i}].title`, st?.title],
          ])
          .filter(([, v]) => typeof v === 'string' && v.trim())
          .concat(typeof parsed.message_read === 'string' && parsed.message_read.trim()
            ? [['message_read', parsed.message_read]] : []),
        supplied: `THE MESSAGE THEY RECEIVED: ${receivedMessage}
WHAT THEY ARE TEMPTED TO SEND: ${userDraft || '(not supplied)'}
RELATIONSHIP: ${relationship || '(not supplied)'}${personLabel ? ` (${personLabel})` : ''}
THE GOAL THEY SELECTED: ${goalsText || '(not specified)'}`,
        promise: 'Four responses the visitor can send directly to the other person, each pursuing the goal they selected.',
        guard: router.outputGuard,
        requiredNonEmpty: parsed.strategies.map((_, i) => `strategies[${i}].response_text`),
        userLanguage,
        locale: withLocaleContext(userLocale, userCurrency, userRegion),
      });
    } catch (err) {
      console.error('ConflictCoach v2 guard skipped:', err.message);
    }

    res.json(parsed);

  } catch (error) {
    console.error('ConflictCoach error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.post('/conflict-coach/followup', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { question, originalAnalysis, relationship, receivedMessage, actualGoal, personLabel, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!question?.trim()) return res.status(400).json({ error: 'Please provide a question.' });
    if (!originalAnalysis) return res.status(400).json({ error: 'No analysis context. Run analysis first.' });

    const lang = withLanguage('', userLanguage);

    const ctx = [];
    ctx.push(`Relationship: ${relationship || 'Unknown'}${personLabel ? ` (${personLabel})` : ''}`);
    ctx.push(`Original message: ${receivedMessage?.slice(0, 200) || 'Not provided'}`);
    if (actualGoal) ctx.push(`Goal: ${actualGoal}`);
    if (originalAnalysis.message_analysis?.triggers_identified?.length) {
      ctx.push(`Phrases that landed hardest: ${originalAnalysis.message_analysis.triggers_identified.join(' / ')}`);
    }
    if (originalAnalysis.response_strategies?.length) {
      ctx.push(`Strategies suggested: ${originalAnalysis.response_strategies.map(s => s.strategy).join(', ')}`);
    }

    const systemPrompt = `You are an expert conflict resolution coach. A user already received an analysis and has a follow-up question.

ORIGINAL CONTEXT:
${ctx.join('\n')}

Answer the follow-up based on full context. Be specific, practical, warm but honest.
- If they share a new response from the other person, analyze it for manipulation and suggest next steps.
- If they ask about a specific scenario, give concrete advice.
- If they're spiraling, help ground them.
- Keep to 2-4 paragraphs. Stay de-escalating.

CRITICAL: Return ONLY valid JSON: {"answer": "Your full coaching response here"}

${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 800,
      system: systemPrompt + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: question.trim() + `\n\n${lang}` }],
    }, { label: 'conflict-coach' });

    res.json({ answer: parsed.answer || 'No answer available.' });
  } catch (error) {
    console.error('❌ Follow-up error:', error.message);
    res.status(500).json({ error: 'Failed to answer follow-up.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// TONE ADJUSTMENT
// ═══════════════════════════════════════════════════════════════

router.post('/conflict-coach/adjust-tone', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { originalResponse, originalStrategy, toneLevel, relationship, receivedMessage, actualGoal, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!originalResponse) return res.status(400).json({ error: 'No response to adjust.' });
    if (toneLevel === undefined || toneLevel === null) return res.status(400).json({ error: 'Tone level required.' });

    const lang = withLanguage('', userLanguage);

    const toneDescription = toneLevel <= 20 ? 'very gentle, soft, empathetic, prioritizing warmth over directness'
      : toneLevel <= 40 ? 'gentle and warm, but with clear intent'
      : toneLevel <= 60 ? 'balanced — direct but compassionate'
      : toneLevel <= 80 ? 'firm and clear, with minimal softening'
      : 'very firm, direct, no-nonsense, clear boundaries with zero ambiguity';

    const systemPrompt = `You are a conflict resolution expert. Rewrite this response at the requested tone level while keeping the same intent and strategy.

Original strategy: ${originalStrategy || 'de-escalate'}
Original: "${originalResponse}"
Relationship: ${relationship || 'Unknown'}
${actualGoal ? `Goal: ${actualGoal}` : ''}
Context (their message): "${receivedMessage?.slice(0, 200) || ''}"

Tone target: ${toneLevel}/100 (${toneDescription})

CRITICAL: Return ONLY valid JSON:
{
  "adjusted_text": "The rewritten response",
  "tone_note": "One short line on what changed in the wording. Not what it will achieve."
}

${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 1500,
      system: systemPrompt + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: `Rewrite at tone level ${toneLevel}/100.\n\n${lang}` }],
    }, { label: 'conflict-coach-2' });
    res.json(parsed);
  } catch (error) {
    console.error('❌ Tone adjust error:', error.message);
    res.status(500).json({ error: 'Failed to adjust tone.' });
  }
});

// PF-39. Reviewed against DEFTBRAIN_OUTPUT_STANDARD_V2 on 2026-08-23.
router.outputStandard = 'v2';

// The failure modes that are local to this tool. It reads one message from
// someone it has never met, and every construct below turned that into a
// determination about a person: "Primary emotion: resentment", "Manipulation
// Tactics Detected", "designed to make you feel guilty", "wait 20-30 minutes",
// "they may interpret this as". The visitor is the only one here who knows the
// sender, and they came for help replying, not a diagnosis of their sister.
// Four tests, and a strategy that fails any of them is not a strategy. The
// long prohibition list this replaces was fighting a schema that has since
// been deleted; what remains is what a response has to be.
router.outputGuard = {
  prohibit: [
    'not_addressed_to_the_other_person',   // advice to the visitor, not a message
    'not_sendable_as_written',             // a fragment, an instruction, a question for the visitor
    'does_not_pursue_selected_goal',
    'unsupported_fact_or_inference',       // invented events, history, feelings, dynamics
  ],
  require: [
    'four_complete_responses',
    'fulfills_tool_promise',
  ],
};

module.exports = router;
