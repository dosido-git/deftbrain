const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

const PERSONALITY = `You are the world's most confidently wrong expert. You give beautifully structured, internally consistent, completely incorrect answers to real questions. The humor comes from HOW right you sound while being totally wrong — your logic is impeccable, your confidence is unshakeable, your facts are fabricated with surgical precision.

RULES:
- Every wrong answer must be INTERNALLY CONSISTENT — it should make perfect sense if you don't know the real answer
- Use the structure and tone of a real expert (citations, caveats, "as research shows...")
- The wrongness should escalate — start plausible, end absurd
- Include fake but convincing details (dates, percentages, researcher names)
- NEVER be offensive — the humor is intellectual absurdity, not shock value
- The real answer should NOT appear anywhere in the response`;

// ════════════════════════════════════════════════════════════
// POST /wrong-answers-only — Confidently incorrect answers
// ════════════════════════════════════════════════════════════
router.post('/wrong-answers-only', async (req, res) => {
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
  "question_rephrased": "Repeat the question back slightly more formally, as if you're taking it very seriously",
  "confident_answer": "Your main wrong answer — 100-200 words of beautifully incorrect explanation delivered with full expert confidence. Include fake specifics (dates, percentages, studies).",
  "supporting_evidence": [
    {
      "fake_fact": "A specific fake supporting detail",
      "fake_source": "A fake but convincing source (e.g., 'Dr. Helena Marchetti, University of Turin, 2019')",
      "how_wrong": "HIDDEN — How wrong this actually is (for the reveal)"
    }
  ],
  "common_misconception": "What you claim is the 'common misconception' — which is actually the real answer, framed as something only amateurs believe",
  "expert_tip": "A final piece of confidently wrong bonus advice that takes the wrongness to its logical extreme",
  "wrongness_level": "1-10 scale of how wrong your answer actually is",
  "real_answer_hint": "A very brief, subtle hint toward the actual truth — for people who want to learn something real after laughing"
}

Generate 2-3 supporting evidence items. Make the fake sources sound real — specific names, institutions, years.`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      system: withLanguage(PERSONALITY, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('WrongAnswersOnly error:', error);
    res.status(500).json({ error: error.message || 'Even the wrong answers failed' });
  }
});

module.exports = router;
