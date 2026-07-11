const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const PERSONALITY = `Plot hole analyst and story defender. Identify internal inconsistencies, logic failures, and continuity errors in stories — then defend them like a skilled apologist.

ANALYST MODE: Find real plot holes with evidence from the story's own rules. Rate severity honestly. Give the best possible defense even when the hole is glaring.

DEFENDER MODE: Steel-man the most charitable explanation. Cite genre conventions, author intent, or real-world analogies. Be honest when no good defense exists.`;

// ════════════════════════════════════════════════════════════
// POST /plot-hole — Find plot holes
// ════════════════════════════════════════════════════════════
router.post('/plot-hole', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { title, description, mediaType, userLanguage } = req.body;

    if (!title?.trim() && !description?.trim()) {
      return res.status(400).json({ error: 'Tell me what to analyze!' });
    }

    const mediaHints = {
      movie: 'Focus on timeline issues, character knowledge problems, and "why didn\'t they just..." moments.',
      show: 'Look for continuity errors across seasons, character knowledge that changes, and rules established then broken.',
      book: 'Focus on internal logic, magic/tech system violations, and character motivation inconsistencies.',
      game: 'Look for ludonarrative dissonance, quest logic issues, and world-building contradictions.',
    };

    const userPrompt = `PLOT HOLE ANALYSIS:

TITLE: "${title?.trim() || 'Unknown'}"
TYPE: ${mediaType || 'movie'}
${description?.trim() ? `ADDITIONAL CONTEXT: ${description.trim().slice(0, 2000)}` : ''}

${mediaHints[mediaType] || mediaHints.movie}

Return ONLY valid JSON:

{
  "title_analyzed": "Full title as you understand it — one sentence",
  "overall_verdict": "How plot-hole-ridden is this? One colorful sentence. — one sentence",
  "swiss_cheese_rating": "1-10 (number)",
  "holes": [
    {
      "name": "Short catchy name for this hole — 3-6 words",
      "description": "What the plot hole is — specific scenes referenced — 1-2 sentences",
      "severity": "NITPICK | MINOR | MAJOR | UNIVERSE-BREAKING",
      "why_it_matters": "Why this breaks the story logic — one sentence",
      "best_defense": "Strongest fan defense, even if a stretch. null if indefensible. — one sentence",
      "reddit_would_say": "Snarky one-liner a Redditor would post — one sentence"
    }
  ],
  "biggest_hole": "Which hole is worst and why — one sentence",
  "actually_clever": "One thing the story does RIGHT that most people miss — one sentence",
  "why_nobody_cares": "Why people love this despite the holes — one sentence"
}

Find 4-7 holes, ranked by severity. Mix severities.`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 4000,
      system: withLanguage(PERSONALITY, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'plot-hole-analyze' });

    if (!parsed.holes || !Array.isArray(parsed.holes)) {
      return res.status(500).json({ error: 'Could not find plot holes. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('PlotHole error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /plot-hole/defend — Defend a specific plot hole
// ════════════════════════════════════════════════════════════
router.post('/plot-hole/defend', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { title, plotHole, userLanguage } = req.body;

    if (!plotHole?.trim()) {
      return res.status(400).json({ error: 'Describe the plot hole to defend' });
    }

    const userPrompt = `PLOT HOLE DEFENSE:

STORY: "${title?.trim() || 'Unknown'}"
THE ALLEGED PLOT HOLE: "${plotHole.trim().slice(0, 1000)}"

You are a DEFENSE ATTORNEY for this story. Construct the strongest possible defense. Find every angle: in-universe explanations, thematic justifications, real-world analogies.

Return ONLY valid JSON:

{
  "hole_summary": "Restate the alleged plot hole clearly — 1-2 sentences",
  "defense_verdict": "ACQUITTED | REDUCED CHARGES | TECHNICALLY GUILTY | GUILTY AS CHARGED",
  "defense_arguments": [
    {
      "argument": "The defense argument — one sentence",
      "type": "IN-UNIVERSE | THEMATIC | REAL-WORLD PARALLEL | AUTHORIAL INTENT | STRETCH",
      "strength": "STRONG | DECENT | WEAK BUT FUN",
      "counterpoint": "Strongest rebuttal to this defense — one sentence"
    }
  ],
  "best_defense": "Your single strongest argument in 2-3 sentences",
  "closing_statement": "Dramatic closing argument to the jury — one sentence",
  "honest_take": "Defense hat off. Is it actually a plot hole? One sentence."
}

Generate 3-5 defense arguments. At least one should be a genuine stretch played for laughs.`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 2000,
      system: withLanguage(PERSONALITY, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'plot-hole-patch' });

    if (!parsed.hole_summary) {
      return res.status(500).json({ error: 'Could not generate patch. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('PlotHole defend error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
