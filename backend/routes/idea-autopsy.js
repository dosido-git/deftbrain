// idea-autopsy.js
const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const STAGE_LABELS = {
  idea:      'just an idea (pre-validation)',
  exploring: 'early exploration (some research done)',
  building:  'already building (in development)',
  launched:  'launched / live (post-launch)',
};

const FOCUS_LABELS = {
  market:      'market size and demand',
  competition: 'competitive landscape',
  business:    'business model and unit economics',
  timing:      'market timing and trends',
  execution:   'execution risk and team capability',
  founder:     'founder-market fit',
  moat:        'defensibility and competitive moat',
  regulation:  'legal and regulatory risk',
};

router.post('/idea-autopsy/stream', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  const { ideaDescription, ideaStage, founderContext, focusAreas, userLanguage } = req.body;

  if (!ideaDescription?.trim() || ideaDescription.trim().length < 30) {
    return res.status(400).json({ error: 'Please describe your idea in more detail.' });
  }

  const stageLabel   = STAGE_LABELS[ideaStage] ?? 'early stage';
  const focusList    = Array.isArray(focusAreas) && focusAreas.length
    ? `\nPrioritize these areas: ${focusAreas.map(f => FOCUS_LABELS[f] ?? f).join(', ')}`
    : '';

  const systemPrompt = withLanguage(
    `You are a brutally honest startup advisor and venture capital analyst with 20 years of experience evaluating business ideas. You've seen thousands of ideas fail and a few succeed. Your job is to help founders avoid wasting years of their life on ideas that are fundamentally broken — or to identify what needs fixing before it's too late. You are not trying to be encouraging; you are trying to be useful. You always return only valid JSON with no markdown, no code blocks, and no explanation outside the JSON object.`,
    userLanguage
  );

  const prompt = `Perform a rigorous autopsy on this business idea. Stage: ${stageLabel}.${focusList}
${founderContext ? `\nFounder context: ${founderContext}` : ''}

Idea:
---
${ideaDescription.trim()}
---

Return ONLY valid JSON with this exact structure:
{
  "viability_score": <integer 1–10 — honest assessment; 1-3 = fundamental problems, 4-6 = fixable issues with serious work, 7-8 = promising with risks, 9-10 = very rare>,
  "verdict": <4-6 word honest verdict — e.g. "Crowded market, weak differentiation", "Strong niche, execution-dependent", "Fundamentally broken unit economics">,
  "one_liner": <1 sentence summary of the most important thing this person needs to understand about their idea>,
  "risks": [
    {
      "title": <short name for this failure mode — e.g. "Cold start problem", "No willingness to pay">,
      "risk_level": "critical — one sentence" | "high" | "medium" | "low",
      "description": <2-3 sentence specific explanation of why this is a real risk for THIS idea>,
      "mitigation": <specific action that would reduce this risk — null if risk is fundamental/unfixable>
    }
  ],
  "strengths": [<genuine strength of this idea — only real ones, not false encouragement — max 4>],
  "kill_questions": [<the single most important question this founder must answer before proceeding — if they can't answer it, the idea may be dead — max 5, ordered by importance>],
  "next_steps": [<specific action to take in the next 30 days to validate or kill this idea faster — max 5, ordered by impact>]
}

Guidelines:
- viability_score: be honest; most ideas are 3-6. Above 7 should be genuinely exceptional.
- risks: include 4-6 risks, ordered by severity (critical first). Be specific to THIS idea, not generic startup risks.
- kill_questions: these are hypotheses that must be proven true for the idea to work. "Is there a real market?" is too vague. "Will busy parents pay $15/month for this when they could use Google Calendar?" is a kill question.
- next_steps: prioritize validation over building. The goal is to find out if the idea is viable as cheaply as possible.
- If the idea is in a space you know is crowded (Airbnb for X, Uber for Y, etc.), name the competitors and explain what differentiation is needed.
- Return ONLY the JSON object.`;

  try {
    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'idea-autopsy' });

    if (!parsed?.verdict || !Array.isArray(parsed?.risks)) {
      return res.status(500).json({ error: 'Unexpected response format. Please try again.' });
    }

    res.json({
      viability_score: typeof parsed.viability_score === 'number' ? parsed.viability_score : null,
      verdict:         parsed.verdict ?? '',
      one_liner:       parsed.one_liner ?? '',
      risks:           parsed.risks,
      strengths:       Array.isArray(parsed.strengths)       ? parsed.strengths       : [],
      kill_questions:  Array.isArray(parsed.kill_questions)  ? parsed.kill_questions  : [],
      next_steps:      Array.isArray(parsed.next_steps)      ? parsed.next_steps      : [],
    });
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: 'Autopsy failed. Please try again.' });
    }
  }
});

module.exports = router;
