const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const PERSONALITY = `Presentation coach and rehearsal guide. Help people prepare for high-stakes communication by identifying the vulnerabilities before they're exposed.

Find the weakest claim, the hardest question, and the moment they're most likely to lose the room. Give the fix before the real thing happens.`;

// ─── CUT: Trim content to fit a time limit ───
router.post('/the-runthrough-cut', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { content, timeMinutes, context, userLanguage } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ error: 'Paste your presentation content.' });
    }
    if (!timeMinutes || timeMinutes < 1) {
      return res.status(400).json({ error: 'Set a time limit (in minutes).' });
    }

    const userPrompt = `PRESENTATION CUT MODE:

CONTENT:
"""
${content.trim()}
"""

TIME LIMIT: ${timeMinutes} minutes
${context ? `CONTEXT: ${context.trim()}` : ''}

Estimate speaking pace at ~130 words/minute. The content above is likely too long for the time limit. Cut it down ruthlessly while preserving the core message and strongest moments.

Return ONLY valid JSON:

{
  "original_word_count": 0,
  "original_est_minutes": 0,
  "target_minutes": ${timeMinutes},
  "trimmed_content": "The full rewritten/trimmed presentation text, ready to deliver — 2-4 sentences",
  "trimmed_word_count": 0,
  "trimmed_est_minutes": 0,
  "what_was_cut": [
    {
      "section": "Name or description of what was removed — one sentence",
      "reason": "Why this was the right thing to cut — one sentence"
    }
  ],
  "what_was_kept": "Brief explanation of the core thread that survived — what makes this version still land — one sentence",
  "pacing_notes": "2-3 specific notes on where to slow down, pause, or speed up for maximum impact — one sentence"
}`;

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: withLanguage(PERSONALITY, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'the-runthrough' });
    if (!parsed.original_word_count && !parsed.hooks) {
      return res.status(500).json({ error: 'Could not analyze your presentation. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('TheRunthrough Cut error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ─── ANTICIPATE: Predict tough Q&A ───
router.post('/the-runthrough-anticipate', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { content, audience, stakes, userLanguage } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ error: 'Paste your presentation content.' });
    }

    const audienceMap = {
      executives: 'C-suite executives — care about ROI, risk, and bottom line. Short attention spans. Will interrupt.',
      investors: 'Investors / VCs — looking for market size, traction, defensibility. Skeptical by default.',
      team: 'Internal team — want to know how this affects them. Looking for clarity and fairness.',
      clients: 'Clients / customers — care about value, reliability, and trust. Will compare to competitors.',
      academic: 'Academic / conference — care about rigor, methodology, and novelty. Will probe assumptions.',
      general: 'General / mixed audience — varied knowledge levels. Questions will range from basic to pointed.',
    };

    const userPrompt = `PRESENTATION ANTICIPATE MODE:

CONTENT:
"""
${content.trim()}
"""

AUDIENCE: ${audienceMap[audience] || audienceMap.general}
${stakes ? `STAKES: ${stakes.trim()}` : ''}

Analyze this presentation and predict the toughest questions this audience will ask. Then draft strong answers.

Return ONLY valid JSON:

{
  "presentation_summary": "1-2 sentence summary of what this presentation argues",
  "vulnerability_scan": {
    "weakest_claim": "The single claim most likely to be challenged — one sentence",
    "missing_data": "What data or evidence the audience will notice is absent — one sentence",
    "assumption_risk": "The biggest unstated assumption that could be questioned — one sentence"
  },
  "tough_questions": [
    {
      "question": "The exact question someone would ask — one sentence",
      "why_they_ask": "What's behind this question — what are they really worried about — one sentence",
      "difficulty": "hard | very_hard | killer",
      "draft_answer": "A strong, specific answer — 40-80 words, confident but honest",
      "trap_to_avoid": "The common mistake speakers make when answering this — one sentence"
    }
  ],
  "curveball": {
    "question": "One completely unexpected question from left field that could throw you off — one sentence",
    "draft_answer": "How to handle it gracefully — one sentence"
  },
  "overall_readiness": "A candid 1-2 sentence assessment of how ready this presentation is for tough questions"
}

Generate 5-7 tough_questions, ordered from most to least likely.`;

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: withLanguage(PERSONALITY, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'the-runthrough-2' });
    if (!parsed.presentation_summary) {
      return res.status(500).json({ error: 'Could not analyze your presentation. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('TheRunthrough Anticipate error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ─── HOOK: Rewrite opening, closing, transitions ───
router.post('/the-runthrough-hook', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { content, tone, goal, userLanguage } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ error: 'Paste your presentation content.' });
    }

    const toneMap = {
      authoritative: 'AUTHORITATIVE — Confident, commanding, "I know this cold." Think keynote energy.',
      conversational: 'CONVERSATIONAL — Warm, relatable, "Let me tell you a story." Think fireside chat.',
      provocative: 'PROVOCATIVE — Bold, challenging, "Everything you think you know is wrong." Think debate opener.',
      inspirational: 'INSPIRATIONAL — Uplifting, visionary, "Imagine a world where..." Think graduation speech.',
    };

    const userPrompt = `PRESENTATION HOOK MODE:

CONTENT:
"""
${content.trim()}
"""

TONE: ${toneMap[tone] || toneMap.conversational}
${goal ? `GOAL: ${goal.trim()}` : ''}

Rewrite the opening, closing, and key transitions to be more compelling. Keep the core content intact — just make the structural moments land harder.

Return ONLY valid JSON:

{
  "diagnosis": {
    "current_opening": "Brief description of how it currently opens — one sentence",
    "opening_problem": "What's wrong with it — why it doesn't grab attention — one sentence",
    "current_closing": "Brief description of how it currently ends — one sentence",
    "closing_problem": "What's weak about the ending — one sentence"
  },
  "new_opening": {
    "text": "The full rewritten opening — 3-5 sentences, ready to deliver",
    "technique": "Name the technique used (story, question, statistic, bold claim, etc.) — one sentence",
    "why_it_works": "1 sentence on why this grabs the audience — one sentence"
  },
  "new_closing": {
    "text": "The full rewritten closing — 3-5 sentences, ready to deliver",
    "technique": "Name the technique used (callback, CTA, vision, challenge, etc.) — one sentence",
    "why_it_works": "1 sentence on why this makes it stick — one sentence"
  },
  "transitions": [
    {
      "between": "Section A → Section B — one sentence",
      "original": "What's there now (or nothing) — one sentence",
      "rewritten": "A smooth, purposeful transition sentence — one sentence",
      "why": "What this transition accomplishes — one sentence"
    }
  ],
  "energy_arc": "A brief description of the emotional journey: where energy should peak, dip, and land. 2-3 sentences."
}

Generate 2-4 transitions for the most important section breaks.`;

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      system: withLanguage(PERSONALITY, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'the-runthrough-3' });
    if (!parsed.diagnosis) {
      return res.status(500).json({ error: 'Could not analyze your presentation. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('TheRunthrough Hook error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
