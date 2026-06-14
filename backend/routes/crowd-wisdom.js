const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const PERSONALITY = `Synthesis engine for human experience. Simulate distinct voices of people who have actually lived through the question being asked — not advice, but perspectives.

Each archetype has a specific worldview, vocabulary, and values. Make them distinct, authentic, and occasionally surprising. The contrarian shouldn't sound like a pragmatist. Show what each voice uniquely sees that others miss, and what they're blind to.`;

// POST /crowd-wisdom — Five life archetypes weigh in on any life question
router.post('/crowd-wisdom', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { question, context, userLanguage } = req.body;
    if (!question?.trim()) return res.status(400).json({ error: 'What\'s the question?' });

    const userPrompt = `CROWD WISDOM — FIVE VOICES ON ONE QUESTION

THE QUESTION: "${question.trim()}"
${context?.trim() ? `CONTEXT: ${context.trim()}` : ''}

Generate five distinct perspectives from people who have lived this question — each with their own worldview, vocabulary, and hard-won truth.

Return ONLY valid JSON:
{
  "question_reframed": "One sentence — the deeper question underneath the surface question",

  "voices": [
    {
      "archetype": "The Pragmatist — one sentence",
      "emoji": "🔧",
      "profile": "Who this person is in one sentence — what life experience gives them this view",
      "core_belief": "The core belief that shapes their perspective on this question — one sentence",
      "what_they_say": "Their actual response — 3-4 sentences in their voice. Real, specific, grounded. Not generic advice.",
      "the_truth_only_they_see": "The uncomfortable specific truth this archetype is uniquely positioned to deliver — one sentence",
      "the_thing_they_might_miss": "What this perspective tends to overlook or underweight — one sentence"
    },
    {
      "archetype": "The Risk-Taker — one sentence",
      "emoji": "🎲",
      "profile": "Who this person is — one sentence",
      "core_belief": "Their core belief — one sentence",
      "what_they_say": "Their response — one sentence",
      "the_truth_only_they_see": "What they uniquely see — one sentence",
      "the_thing_they_might_miss": "What they miss — one sentence"
    },
    {
      "archetype": "The One Who Did It and Regretted It — one sentence",
      "emoji": "🪞",
      "profile": "Who this person is — one sentence",
      "core_belief": "Their core belief — one sentence",
      "what_they_say": "Their response — one sentence",
      "the_truth_only_they_see": "What they uniquely see — one sentence",
      "the_thing_they_might_miss": "What they miss — one sentence"
    },
    {
      "archetype": "The One Who Didn't and Regretted It — one sentence",
      "emoji": "🕰️",
      "profile": "Who this person is — one sentence",
      "core_belief": "Their core belief — one sentence",
      "what_they_say": "Their response — one sentence",
      "the_truth_only_they_see": "What they uniquely see — one sentence",
      "the_thing_they_might_miss": "What they miss — one sentence"
    },
    {
      "archetype": "The Contrarian — one sentence",
      "emoji": "🔄",
      "profile": "Who this person is — one sentence",
      "core_belief": "Their core belief — one sentence",
      "what_they_say": "Their response — one sentence",
      "the_truth_only_they_see": "What they uniquely see — one sentence",
      "the_thing_they_might_miss": "What they miss — one sentence"
    }
  ],

  "the_tension": "One sentence naming the real tension between these perspectives — what they're all circling around",
  "the_question_nobody_asked": "The more important adjacent question this crowd would tell them to ask themselves — one sentence"
}`;

    const prompt = withLanguage(`${PERSONALITY}\n\n---\n\n${userPrompt}`, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);
    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'CrowdWisdom' });
    if (!parsed.voices && !parsed.perspectives) {
      return res.status(500).json({ error: 'Could not gather perspectives. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('CrowdWisdom error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
