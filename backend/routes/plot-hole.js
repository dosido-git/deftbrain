const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

const PERSONALITY = `You are a narrative logic analyst with an obsessive eye for detail and a wicked sense of humor. You find plot holes the way a forensic accountant finds embezzlement — methodically, thoroughly, and with barely concealed glee. You love stories, which is WHY you hold them to high standards.

RULES:
- Be SPECIFIC — "why didn't they just..." must reference exact scenes and character knowledge
- Distinguish between real plot holes (logical impossibilities) and nitpicks (minor inconsistencies)
- Include the "in-universe explanation" if one exists, even if it's a stretch
- Be funny but not mean — you're roasting the writing, not the fans
- Severity matters: rate each hole from "minor nitpick" to "universe-breaking"`;

// ════════════════════════════════════════════════════════════
// POST /plot-hole — Find plot holes
// ════════════════════════════════════════════════════════════
router.post('/plot-hole', async (req, res) => {
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
  "title_analyzed": "Full title as you understand it",
  "overall_verdict": "How plot-hole-ridden is this? One colorful sentence.",
  "swiss_cheese_rating": "1-10 (1 = airtight, 10 = more holes than cheese)",
  "holes": [
    {
      "name": "Short catchy name for this hole",
      "description": "What the plot hole is — specific scenes referenced",
      "severity": "NITPICK | MINOR | MAJOR | UNIVERSE-BREAKING",
      "why_it_matters": "Why this breaks the story logic",
      "best_defense": "Strongest fan defense, even if a stretch. null if indefensible.",
      "reddit_would_say": "Snarky one-liner a Redditor would post"
    }
  ],
  "biggest_hole": "Which hole is worst and why",
  "actually_clever": "One thing the story does RIGHT that most people miss",
  "why_nobody_cares": "Why people love this despite the holes"
}

Find 4-7 holes, ranked by severity. Mix severities.`;

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
    console.error('PlotHole error:', error);
    res.status(500).json({ error: error.message || 'Plot hole analysis failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /plot-hole/defend — Defend a specific plot hole
// ════════════════════════════════════════════════════════════
router.post('/plot-hole/defend', async (req, res) => {
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
  "hole_summary": "Restate the alleged plot hole clearly",
  "defense_verdict": "ACQUITTED | REDUCED CHARGES | TECHNICALLY GUILTY | GUILTY AS CHARGED",
  "defense_arguments": [
    {
      "argument": "The defense argument",
      "type": "IN-UNIVERSE | THEMATIC | REAL-WORLD PARALLEL | AUTHORIAL INTENT | STRETCH",
      "strength": "STRONG | DECENT | WEAK BUT FUN",
      "counterpoint": "Strongest rebuttal to this defense"
    }
  ],
  "best_defense": "Your single strongest argument in 2-3 sentences",
  "closing_statement": "Dramatic closing argument to the jury",
  "honest_take": "Defense hat off. Is it actually a plot hole? One sentence."
}

Generate 3-5 defense arguments. At least one should be a genuine stretch played for laughs.`;

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
    console.error('PlotHole defend error:', error);
    res.status(500).json({ error: error.message || 'Defense failed' });
  }
});

module.exports = router;
