const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const PERSONALITY = `World's most confidently wrong expert. Give beautifully structured, internally consistent, completely incorrect answers. The humor is HOW right you sound while being totally wrong — impeccable logic, unshakeable confidence, surgically fabricated facts.

RULES: Every wrong answer must be internally consistent. Use real expert structure (citations, percentages, researcher names, "as research shows..."). Wrongness escalates — start plausible, end absurd. Never offensive. Real answer must not appear anywhere in the response.`;

// ════════════════════════════════════════════════════════════
// POST /wrong-answers-only — Confidently incorrect answers
// ════════════════════════════════════════════════════════════
router.post('/wrong-answers-only', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { question, category, seriousness, userLanguage } = req.body;

    if (!question?.trim()) {
      return res.status(400).json({ error: 'Ask me anything — I\'ll get it wrong!' });
    }

    const categoryHints = {
      science: 'Answer like a confident but completely wrong scientist. Use fake studies, invented chemical compounds, and nonsense equations that look real.',
      history: 'Answer like a confident but completely wrong historian. Invent plausible-sounding dates, treaties, and historical figures. Mix real names with fake events.',
      cooking: 'Answer like a confident but completely wrong chef. Invent cooking techniques, fake temperatures, and ingredient combinations that sound professional but are absurd.',
      life: 'Answer like a confident but completely wrong life coach. Give advice that sounds wise but is logically backwards. Use fake psychology terms.',
      tech: 'Answer like a confident but completely wrong tech expert. Invent protocols, fake error codes, and debugging steps that sound legitimate.',
      nature: 'Answer like a confident but completely wrong nature documentary narrator. Invent animal behaviors, fake Latin species names, and absurd evolutionary explanations.'
    };

    const seriousnessMap = {
      deadpan: 'DEADPAN — 100% serious delivery. No winks, no hints you\'re joking. Pure confidence. Academic tone throughout.',
      playful: 'PLAYFUL — Mostly serious but with increasing absurdity. Start believable, end ridiculous. The slide from plausible to insane is the joke.',
      unhinged: 'UNHINGED — Start vaguely plausible, rapidly descend into beautiful nonsense. Conspiracy-theory-uncle-at-Thanksgiving energy but intellectual.'
    };

    const userPrompt = `WRONG ANSWERS ONLY:

QUESTION: "${question.trim()}"
CATEGORY: ${category || 'general'}
${categoryHints[category] || 'Answer like a confident expert in whatever field this question touches. Be completely, beautifully wrong.'}

TONE: ${seriousnessMap[seriousness] || seriousnessMap.playful}

Return ONLY valid JSON:

{
  "question_rephrased": "Repeat the question back slightly more formally, as if you're taking it very seriously — one sentence",
  "confident_answer": "Your main wrong answer — 100-200 words of beautifully incorrect explanation delivered with full expert confidence. Include fake specifics (dates, percentages, studies).",
  "supporting_evidence": [
    {
      "fake_fact": "A specific fake supporting detail — one sentence",
      "fake_source": "A fake but convincing source (e.g., 'Dr. Helena Marchetti, University of Turin, 2019') — one sentence",
      "how_wrong": "HIDDEN — How wrong this actually is (for the reveal) — one sentence"
    }
  ],
  "common_misconception": "What you claim is the 'common misconception' — which is actually the real answer, framed as something only amateurs believe — one sentence",
  "expert_tip": "A final piece of confidently wrong bonus advice that takes the wrongness to its logical extreme — one sentence",
  "wrongness_level": "1-10 scale of how wrong your answer actually is — one sentence",
  "real_answer_hint": "A very brief, subtle hint toward the actual truth — for people who want to learn something real after laughing — one sentence"
}

Generate 2-3 supporting evidence items. Make the fake sources sound real — specific names, institutions, years.`;

    const parsed = await callClaudeWithRetry({
model: MODELS.FAST,
      max_tokens: 2000,
      system: withLanguage(PERSONALITY, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'wrong-answers-only' });
    if (!parsed.confident_answer) {
      return res.status(500).json({ error: 'Could not generate a wrong answer. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('WrongAnswersOnly error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.'});
  }
});

module.exports = router;
