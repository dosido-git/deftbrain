const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { runOutputGuard } = require('../lib/outputGuard');

const PERSONALITY = `Five deliberately different ways of looking at one question — not advice, and not testimony. Each voice is a constructed vantage point with its own worldview, vocabulary and values, written to notice something the others do not.

Make them distinct, sharply drawn and occasionally surprising. The contrarian shouldn't sound like the pragmatist. Show what each vantage point picks up on, and what it is blind to.

Use the five archetype names exactly as given in the schema. They are fixed, and two of them name a stance about experience — that is the stance, not a licence to invent a life. Argue FROM the stance without narrating events: no 'when I left my job', no 'I spent three years', no dates, employers or outcomes from a life that was not lived. 'The regret vantage sees X' is right; 'I regret X, here is what happened' is not. The insight comes from the angle.

You know only what the visitor asked. Never invent their salary, their partner, their city, their age, their deadline, or any other circumstance they did not state. Five voices disagreeing is the point — do not resolve them into one verdict, and do not decide for the visitor.`;

// The visitor supplied one sentence. Everything else on the screen is invented
// — and that invention is the product, not a violation. The validator never
// sees the prompt, so it has to be told where the line is, or it flags the
// five perspectives themselves. (Caption Magic, 2026-08: an epistemic guard
// applied literally to a creative tool eats the tool.)
function suppliedFrom(question, context) {
  return `THE VISITOR SUPPLIED EXACTLY THIS, AND NOTHING ELSE:
Question: ${question}
${context ? `Context they added: ${context}` : 'They added no other context.'}

WHAT THIS TOOL IS. Five deliberately different perspectives on that question. The perspectives are constructed: their worldviews, vocabulary, priorities, what they notice and what they are blind to are all invented, and inventing them well IS the work. Do NOT flag a perspective for existing, for being opinionated, for disagreeing with the others, or for saying something the visitor did not say. That is the product.

WHERE THE LINE IS. Three things are violations:
1. A voice narrating personal history as lived event — 'when I left my job', 'I spent three years there', a specific date, employer or outcome from a life it did not live. NOTE: two of the five perspectives are, by design, the regret vantages — the one who did it and regretted it, and the one who didn't and regretted it. Holding that stance is not a violation, and neither is a one-line statement of what the stance weighs. Only a narrated event is: a job, a move, a year, a place, an outcome described as having happened.
2. Any detail about the VISITOR's own circumstances that is not in the two lines above — their salary, partner, city, age, employer, deadline, finances, health.
3. Deciding for them: a verdict, a recommendation presented as the answer, or five perspectives collapsed into one conclusion. The disagreement is the deliverable.`;
}

async function guardResult(parsed, { question, context, userLanguage, userLocale }) {
  // Fields the TOOL fixes, not the model: the cast is the same five names and
  // emoji on every run. Judging them is judging our own copy, and two of the
  // names are stances about experience, so the guard flagged them every time.
  const TOOL_FIXED = new Set(['archetype', 'emoji']);
  const fields = [];
  const walk = (val, path, key) => {
    if (TOOL_FIXED.has(key)) return;
    if (typeof val === 'string' && val.trim().length > 15) fields.push([path, val]);
    else if (Array.isArray(val)) val.forEach((v, i) => walk(v, `${path}[${i}]`, key));
    else if (val && typeof val === 'object') Object.entries(val).forEach(([k, v]) => walk(v, path ? `${path}.${k}` : k, k));
  };
  walk(parsed, '', '');
  await runOutputGuard(parsed, {
    label: 'CrowdWisdom',
    fields,
    supplied: suppliedFrom(question, context),
    promise: 'Five genuinely different ways of looking at the question the visitor asked, the tension between them, and the adjacent question they have not asked themselves — so they can think with it, not be told what to do.',
    guard: router.outputGuard,
    userLanguage,
    locale: withLocaleContext(userLocale),
  });
}

// POST /crowd-wisdom — Five life archetypes weigh in on any life question
router.post('/crowd-wisdom', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { question, context, userLanguage } = req.body;
    if (!question?.trim()) return res.status(400).json({ error: 'What\'s the question?' });

    const userPrompt = `CROWD WISDOM — FIVE VOICES ON ONE QUESTION

THE QUESTION: "${question.trim()}"
${context?.trim() ? `CONTEXT: ${context.trim()}` : ''}

Generate five distinct perspectives on this question — each a different way of looking at it, with its own worldview, vocabulary and priorities. These are constructed viewpoints, not testimony from real people, so write what each perspective notices about the question rather than claiming personal experience of it.

THE CAST IS FIXED. Use exactly these five archetypes, in this order, with these names and emoji, whatever the question is:
1. 🔧 The Pragmatist
2. 🎲 The Risk-Taker
3. 🪞 The One Who Did It and Regretted It
4. 🕰️ The One Who Didn't and Regretted It
5. 🔄 The Contrarian
Do not rename them to suit the question, do not substitute a differently-named archetype, and do not reorder them. What changes between questions is what each one notices — not who they are.

IMPORTANT: keep every field to ONE short sentence — these render in compact voice cards, so longer text breaks the layout and overflows the budget.

Return ONLY valid JSON:
{
  "question_reframed": "One sentence — the deeper question underneath the surface question",

  "voices": [
    {
      "archetype": "The Pragmatist",
      "emoji": "🔧",
      "profile": "One sentence naming the vantage point — what this perspective weighs most heavily and why that leads it here. A stance, not a biography: no jobs held, places lived, or things that happened to it.",
      "core_belief": "The core belief that shapes their perspective on this question",
      "what_they_say": "Their actual response in their voice. Real, specific, grounded. Not generic advice.",
      "the_truth_only_they_see": "The uncomfortable specific thing this perspective is positioned to notice about the question. What it sees, not what it has lived through.",
      "the_thing_they_might_miss": "What this perspective tends to overlook or underweight"
    },
    {
      "archetype": "The Risk-Taker",
      "emoji": "🎲",
      "profile": "The vantage point in one sentence",
      "core_belief": "Their core belief",
      "what_they_say": "Their response",
      "the_truth_only_they_see": "What they uniquely see",
      "the_thing_they_might_miss": "What they miss"
    },
    {
      "archetype": "The One Who Did It and Regretted It",
      "emoji": "🪞",
      "profile": "Who this person is",
      "core_belief": "Their core belief",
      "what_they_say": "Their response",
      "the_truth_only_they_see": "What they uniquely see",
      "the_thing_they_might_miss": "What they miss"
    },
    {
      "archetype": "The One Who Didn't and Regretted It",
      "emoji": "🕰️",
      "profile": "Who this person is",
      "core_belief": "Their core belief",
      "what_they_say": "Their response",
      "the_truth_only_they_see": "What they uniquely see",
      "the_thing_they_might_miss": "What they miss"
    },
    {
      "archetype": "The Contrarian",
      "emoji": "🔄",
      "profile": "Who this person is",
      "core_belief": "Their core belief",
      "what_they_say": "Their response",
      "the_truth_only_they_see": "What they uniquely see",
      "the_thing_they_might_miss": "What they miss"
    }
  ],

  "the_tension": "One sentence naming the real tension between these perspectives — what they're all circling around",
  "the_question_nobody_asked": "An adjacent question that follows from the one they asked, and that these five perspectives keep circling. Raise it as a question worth sitting with — do not assert what the visitor is really thinking, avoiding, or afraid of."
}

Never place a double-quote (") character inside any JSON string value — write each voice's speech and any quoted phrases plainly or with single quotes, or it breaks the JSON.`;

    const prompt = withLanguage(`${PERSONALITY}\n\n---\n\n${userPrompt}`, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);
    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3500,
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'CrowdWisdom' });
    if (!parsed.voices && !parsed.perspectives) {
      return res.status(500).json({ error: 'Could not gather perspectives. Please try again.' });
    }

    await guardResult(parsed, {
      question: question.trim(),
      context: context?.trim() || '',
      userLanguage,
      userLocale: req.body.userLocale,
    });

    res.json(parsed);

  } catch (error) {
    console.error('CrowdWisdom error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.outputStandard = 'v2';
// crowd-wisdom-v2. Reviewed 2026-08-25. The invention of the five perspectives
// is deliberately NOT guarded — it is what the visitor came for. Only the three
// boundaries are: testimony, facts about the visitor, and deciding for them.
router.outputGuard = {
  prohibit: [
    'testimony_presented_as_lived_experience',  // 'when I left my job' — a vantage point, not a witness
    'invented_fact_about_the_visitor',          // a salary, a partner, a city they never mentioned
    'verdict_delivered_for_the_visitor',
    'five_voices_collapsed_into_one_answer',    // the disagreement is the deliverable
    'professional_advice_without_standing',     // financial, legal or medical instruction
  ],
  require: [
    'five_genuinely_different_lenses',
    'grounded_in_the_question_actually_asked',
    'fulfills_tool_promise',
  ],
};

module.exports = router;
