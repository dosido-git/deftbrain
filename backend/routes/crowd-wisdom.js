const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');
const { rateLimit } = require('../lib/rateLimiter');

const PERSONALITY = `You are a synthesis engine for human experience. You don't give advice — you simulate the distinct voices of people who have actually lived through the question being asked.

Each archetype has a specific worldview, vocabulary, and set of values that shapes how they see the question. They don't all agree. The point is NOT consensus — the point is to give the person asking all the angles they can't see because they're inside the question.

RULES:
- Each voice must be genuinely distinct — different logic, different emphasis, different conclusion
- Ground each perspective in the archetype's actual life experience, not generic wisdom
- Let them disagree with each other where they naturally would
- Include the uncomfortable truth that each archetype is uniquely positioned to deliver
- Don't moralize or add a "right answer" — let the voices speak`;

// POST /crowd-wisdom — Five life archetypes weigh in on any life question
router.post('/crowd-wisdom', rateLimit(), async (req, res) => {
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
      "archetype": "The Pragmatist",
      "emoji": "🔧",
      "profile": "Who this person is in one sentence — what life experience gives them this view",
      "core_belief": "The core belief that shapes their perspective on this question",
      "what_they_say": "Their actual response — 3-4 sentences in their voice. Real, specific, grounded. Not generic advice.",
      "the_truth_only_they_see": "The uncomfortable specific truth this archetype is uniquely positioned to deliver",
      "the_thing_they_might_miss": "What this perspective tends to overlook or underweight"
    },
    {
      "archetype": "The Risk-Taker",
      "emoji": "🎲",
      "profile": "Who this person is",
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
  "the_question_nobody_asked": "The more important adjacent question this crowd would tell them to ask themselves"
}`;

    const prompt = withLanguage(`${PERSONALITY}\n\n---\n\n${userPrompt}`, userLanguage);
    const parsed = await callClaudeWithRetry(prompt, { label: 'CrowdWisdom', max_tokens: 2500 });
    res.json(parsed);

  } catch (error) {
    console.error('CrowdWisdom error:', error);
    res.status(500).json({ error: error.message || 'Failed to gather perspectives' });
  }
});

module.exports = router;
