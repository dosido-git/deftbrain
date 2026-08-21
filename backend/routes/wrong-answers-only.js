const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const PERSONALITY = `World's most confidently wrong expert. Give beautifully structured, internally consistent, completely incorrect answers. The humor is HOW right you sound while being totally wrong — impeccable logic, unshakeable confidence, surgically fabricated facts.

RULES: Every wrong answer must be internally consistent. Use real expert structure (citations, percentages, researcher names, "as research shows..."). Wrongness escalates — start plausible, end absurd. Never offensive. Real answer must not appear anywhere in the response.

NO HEDGING, EVER. This is the one tool on this site where uncertainty is the enemy. No "perhaps", no "might", no "one possibility", no "it is worth noting", no "some researchers believe". You are not speculating; you are stating settled fact that happens to be entirely false. The comedy is the gap between the confidence and the content, and a single qualifier collapses it.

THE ONE THING YOU WILL NOT DO. The premise is authoritative misinformation delivered straight, and it only works where believing it costs nobody anything. If a wrong answer could plausibly get someone hurt — medication and doses, allergies and first aid, electrical or gas work, chemicals that should not be mixed, driving, firearms, what to do in an emergency, whether symptoms need a doctor, anything about a child's safety — do not answer it wrongly. Do not lecture either. Decline in character, in one line, and hand them something better: set decline_reason and leave every other field null.`;

// ════════════════════════════════════════════════════════════
// POST /wrong-answers-only — Confidently incorrect answers
// ════════════════════════════════════════════════════════════
router.post('/wrong-answers-only', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { question, seriousness, userLanguage } = req.body;

    if (!question?.trim()) {
      return res.status(400).json({ error: 'Ask me anything — I\'ll get it wrong!' });
    }

    const seriousnessMap = {
      deadpan: 'DEADPAN — 100% serious delivery. No winks, no hints you\'re joking. Pure confidence. Academic tone throughout.',
      playful: 'PLAYFUL — Mostly serious but with increasing absurdity. Start believable, end ridiculous. The slide from plausible to insane is the joke.',
      unhinged: 'UNHINGED — Start vaguely plausible, rapidly descend into beautiful nonsense. Conspiracy-theory-uncle-at-Thanksgiving energy but intellectual.'
    };

    const userPrompt = `WRONG ANSWERS ONLY:

QUESTION: "${question.trim()}"

Work out for yourself what field this belongs to and answer as its most confident practitioner — the scientist with the fake study, the historian with the invented treaty, the chef with the impossible temperature, the nature documentary narrator with the made-up Latin. Nobody told you the category and nobody needed to.

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
  "wrongness_level": 7,
  "real_answer_hint": "A very brief, subtle hint toward the actual truth — for people who want to learn something real after laughing",
  "decline_reason": "null in almost every case. ONLY when a wrong answer could get someone hurt: one line, in character, no lecture, that names something better to ask instead. Every other field null when this is set."
}

RULES:
1. Generate EXACTLY 2-3 supporting_evidence items. Make the fake sources sound real — specific names, institutions, years.
2. "wrongness_level" MUST be a bare integer from 1 to 10 (e.g. 7) — no text, no scale description, no quotes.
3. Keep every string field to one tight sentence (confident_answer is the exception: 100-200 words).
4. Never place a double-quote (") character inside any JSON string value — write quoted phrases and fake citations with no inner quote marks, or it breaks the JSON.`;

    const parsed = await callClaudeWithRetry({
model: MODELS.FAST,
      max_tokens: 3000,
      system: withLanguage(PERSONALITY, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'wrong-answers-only' });
    // A decline is a valid answer, not a failure — it arrives with every other
    // field null on purpose.
    if (parsed.decline_reason) {
      return res.json({ decline_reason: parsed.decline_reason });
    }
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
