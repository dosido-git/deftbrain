const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

const PERSONALITY = `You are a conspiracy theorist for fiction — brilliant, obsessive, and endlessly creative. You find connections in stories that the creators probably didn't intend but are too compelling to ignore. You build theories the way a detective builds a case: evidence first, then the wild conclusion. The theory should be WRONG but DEFENSIBLE — that's the sweet spot.

RULES:
- Every theory must cite specific plot details as "evidence" — no handwaving
- The theory should be surprising enough to make someone go "wait... actually?"
- Internal consistency is everything — each piece of evidence should support the conclusion
- Mix genuinely clever observations with absurd leaps of logic
- The plausibility rating should be honest — most theories are 2-4 out of 10, and that's fine`;

// ════════════════════════════════════════════════════════════
// POST /fan-theory — Generate a wild fan theory
// ════════════════════════════════════════════════════════════
router.post('/fan-theory', async (req, res) => {
  try {
    const { title, mediaType, direction, userLanguage } = req.body;

    if (!title?.trim()) {
      return res.status(400).json({ error: 'Name a movie, show, book, or game!' });
    }

    const directionHints = {
      villain: 'Generate a theory about a hero/good character secretly being the villain or having sinister motives.',
      connected: 'Generate a theory connecting this to another franchise/universe in a way nobody would expect.',
      timeline: 'Generate a theory about the timeline being wrong, events happening in a different order, or time loops.',
      alive: 'Generate a theory about a dead character actually being alive, or a living character already being dead.',
      simulation: 'Generate a theory about the whole thing being a simulation, dream, or story-within-a-story.',
      wild: 'Go absolutely wild. The most creative, unexpected angle you can find.'
    };

    const userPrompt = `FAN THEORY GENERATOR:

TITLE: "${title.trim()}"
TYPE: ${mediaType || 'movie'}
DIRECTION: ${direction || 'wild'}
${directionHints[direction] || directionHints.wild}

Generate a wild but internally-consistent fan theory. The theory must cite specific plot details as evidence. It should be WRONG but DEFENSIBLE — that "wait... actually?" feeling.

Return ONLY valid JSON:

{
  "title_analyzed": "Full title",
  "theory_name": "A catchy, dramatic name for this theory (e.g., 'The Pixar Death Theory')",
  "one_line": "The theory in one shocking sentence",
  "the_theory": "Full theory explanation in 150-250 words. Build the case like a conspiracy theorist: evidence, connections, the big reveal. Make it compelling.",
  "evidence": [
    {
      "detail": "A specific plot detail that 'supports' the theory",
      "spin": "How you interpret this detail to support the theory",
      "strength": "COMPELLING | SUSPICIOUS | A STRETCH | PURE DELUSION"
    }
  ],
  "the_smoking_gun": "The single strongest piece of evidence. The one that makes people pause.",
  "counterargument": "The strongest argument AGAINST this theory — and your response to it",
  "plausibility": "1-10 honest rating (most fan theories are 2-4, and that's fine)",
  "mind_blown_factor": "1-10 how much this would blow someone's mind if true",
  "rabbit_hole": "Where to look for more 'evidence' — what scene to rewatch, what detail to examine"
}

Generate 4-6 evidence items. At least one should be genuinely clever, at least one should be a hilarious stretch.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      system: withLanguage(PERSONALITY, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('FanTheory error:', error);
    res.status(500).json({ error: error.message || 'Theory generation failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /fan-theory/grade — Grade a user's fan theory
// ════════════════════════════════════════════════════════════
router.post('/fan-theory/grade', async (req, res) => {
  try {
    const { title, theory, userLanguage } = req.body;

    if (!theory?.trim()) {
      return res.status(400).json({ error: 'Share your theory!' });
    }

    const userPrompt = `GRADE THIS FAN THEORY:

ABOUT: "${title?.trim() || 'Unknown'}"
THE THEORY: "${theory.trim().slice(0, 2000)}"

You are a fan theory professor grading this submission. Be thorough, fair, and entertaining. Identify what's clever, what's a stretch, and what's pure cope.

Return ONLY valid JSON:

{
  "theory_summary": "Restate the theory in one clear sentence",
  "grade": "A+ | A | B | C | D | F — with a +/- modifier",
  "grade_title": "A title for this grade level (e.g., 'Certified Galaxy Brain', 'Noble Effort', 'Delusional But Dedicated')",
  "strengths": [
    "What's genuinely clever or well-observed about this theory"
  ],
  "weaknesses": [
    "Where the theory falls apart — be specific"
  ],
  "plausibility": "1-10 honest rating",
  "creativity": "1-10 how original and creative this theory is",
  "evidence_quality": "ROCK SOLID | DECENT | CIRCUMSTANTIAL | VIBES ONLY",
  "professor_notes": "2-3 sentences of feedback in the voice of a professor. Constructive but entertaining.",
  "improvement_suggestion": "How could this theory be made more convincing? One specific suggestion.",
  "would_reddit_upvote": "How would this perform on Reddit? One sentence prediction."
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: withLanguage(PERSONALITY, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('FanTheory grade error:', error);
    res.status(500).json({ error: error.message || 'Grading failed' });
  }
});

module.exports = router;
