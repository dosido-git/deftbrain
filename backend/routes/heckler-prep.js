const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ════════════════════════════════════════════════════════════
// POST /heckler-prep — Anticipate the Hard Questions
// ════════════════════════════════════════════════════════════
router.post('/heckler-prep', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { topic, audience, proposal, knownObjections, stakes, userLanguage } = req.body;

    if (!topic?.trim()) {
      return res.status(400).json({ error: 'Tell us what you\'re presenting or proposing.' });
    }

    const stakesConfig = {
      low:      { count: 5, brutalMin: 1 },
      moderate: { count: 7, brutalMin: 1 },
      high:     { count: 10, brutalMin: 2 },
    };
    const { count: questionCount, brutalMin } = stakesConfig[stakes] || stakesConfig.moderate;

    const systemPrompt = `Presentation sparring partner. Generate the hardest questions a skeptical audience will ask, then coach concise answers. Think like the person who doesn't want this to succeed. Include at least one Gotcha (designed to trap a contradiction) and one Emotional (about trust or values, not data). Return ONLY valid JSON.`;

    // The questions array is the whole cost — at high stakes it is 10 entries of
    // 7 fields, and the golden case measured 64-69s, past the ~60s where Safari
    // abandons the fetch. A key-wise split cannot help (everything else is four
    // short strings), so the array itself is partitioned — by question TYPE, so
    // the two halves cannot ask the same question twice. Merged, re-sorted into
    // the escalating order the tool promises, and renumbered.
    const splitA = Math.ceil(questionCount / 2);
    const splitB = questionCount - splitA;
    const brutalA = Math.ceil(brutalMin / 2);
    const brutalB = brutalMin - brutalA;

    // The merge below sorts on `difficulty`, and the frontend colour-codes the
    // badge off it — so it has to stay the English enum. withLanguage translates
    // JSON string VALUES, which would otherwise hand both a German word.
    const DIFFICULTY_RULE = 'The "difficulty" field must be EXACTLY one of moderate, hard, brutal — lowercase English, never translated. Every other string is written in the user\'s language as normal.';

    const brief = `TOPIC: ${topic}
AUDIENCE: ${audience || 'not specified'}
${proposal ? `ASKING FOR: ${proposal}` : ''}
${knownObjections ? `KNOWN OBJECTIONS: ${knownObjections}` : ''}
STAKES: ${stakes || 'moderate'}

You are producing ONE PART of the prep. Another sparring partner is producing the other part — stay strictly inside the question types assigned to you so you cannot both ask the same thing.`;

    const questionShape = `    {
      "number": 1,
      "difficulty": "moderate | hard | brutal",
      "type": "One of the question types assigned to you",
      "question": "Exact question in audience voice. Blunt and specific.",
      "real_concern": "The underlying fear in one sentence.",
      "model_answer": "2 sentences. Acknowledge the concern, then reframe. Plain speech.",
      "dont_say": "The one-phrase trap most people fall into."
    }`;

    // ── Part A: the questions that come at the argument itself ──
    const analyticalPrompt = `${brief}

YOUR PART: exactly ${splitA} questions, and ONLY of these types: Data/Logic, Practical, Political.

Return ONLY valid JSON with EXACTLY this one top-level key:
{
  "questions": [
${questionShape}
  ]
}

Generate exactly ${splitA} questions, escalating in difficulty.${brutalA > 0 ? ` At least ${brutalA} must be 'brutal'.` : ''} Every question must be a Data/Logic, Practical or Political question — never Emotional, Gotcha or Values. Number them 1 to ${splitA}.

${DIFFICULTY_RULE}`;

    // ── Part B: the questions that come at the person, plus the framing ──
    const humanPrompt = `${brief}

YOUR PART: exactly ${splitB} questions, and ONLY of these types: Emotional, Gotcha, Values — plus the framing around the whole session.

At least one of your questions must be a Gotcha (designed to trap a contradiction) and at least one must be Emotional (about trust or values, not data).

Return ONLY valid JSON with EXACTLY these four top-level keys:
{
  "questions": [
${questionShape}
  ],
  "situation_read": "2 sentences: what this audience cares about and why this is tricky.",
  "the_curveball": {
    "question": "One unexpected question from an angle they didn't prepare for.",
    "how_to_handle": "2 sentences."
  },
  "opening_move": "One sentence to say at the start that preemptively defuses the biggest objection.",
  "confidence_note": "One sentence of specific encouragement based on their situation."
}

Generate exactly ${splitB} questions, escalating in difficulty.${brutalB > 0 ? ` At least ${brutalB} must be 'brutal'.` : ''} Every question must be an Emotional, Gotcha or Values question — never Data/Logic, Practical or Political. Number them 1 to ${splitB}.

${DIFFICULTY_RULE}`;

    const systemSuffix = withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion) + ' Never place a double-quote (") character inside any JSON string value — write quoted questions or phrases plainly or with single quotes, or it breaks the JSON.';
    const maxTokensByStakes = { low: 1400, moderate: 2000, high: 3200 };
    const halfBudget = maxTokensByStakes[stakes] || 1600;
    const [analytical, human] = await Promise.all([
      callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: halfBudget,
        system: withLanguage(systemPrompt, userLanguage) + systemSuffix,
        messages: [{ role: 'user', content: analyticalPrompt }],
      }, { label: 'heckler-prep:analytical' }),
      callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: halfBudget + 600,
        system: withLanguage(systemPrompt, userLanguage) + systemSuffix,
        messages: [{ role: 'user', content: humanPrompt }],
      }, { label: 'heckler-prep:human' }),
    ]);

    // Both halves number from 1, and each escalates on its own. Restore the
    // single escalating list the tool promises before the frontend sees it.
    const RANK = { moderate: 0, hard: 1, brutal: 2 };
    const merged = [
      ...(Array.isArray(analytical.questions) ? analytical.questions : []),
      ...(Array.isArray(human.questions) ? human.questions : []),
    ]
      .sort((a, b) => (RANK[a?.difficulty] ?? 0) - (RANK[b?.difficulty] ?? 0))
      .map((q, i) => ({ ...q, number: i + 1 }));

    const parsed = { ...human, questions: merged };

    if (!parsed.questions || !parsed.questions.length) {
      return res.status(500).json({ error: 'Could not generate your prep questions. Please try again.' });
    }
    return res.json(parsed);

  } catch (error) {
    console.error('HecklerPrep error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
