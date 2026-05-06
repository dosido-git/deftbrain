const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');
const { rateLimit } = require('../lib/rateLimiter');

const PERSONALITY = `You are a world-class presentation coach who has prepped TED speakers, startup founders, and executives. You're brutally honest about what works and what doesn't. You know that great presentations are about clarity, rhythm, and emotional impact — not just information. You respect the speaker's voice and content, but you're fearless about cutting, restructuring, and sharpening.

RULES:
- Be specific — reference exact sections, phrases, and transitions
- Respect the speaker's core message while improving delivery
- Prioritize audience impact over completeness
- Be direct and actionable — no vague advice like "be more engaging"
- Consider pacing, energy arcs, and audience attention spans`;

// ─── CUT: Trim content to fit a time limit ───
router.post('/the-runthrough-cut', rateLimit(), async (req, res) => {
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
  "trimmed_content": "The full rewritten/trimmed presentation text, ready to deliver",
  "trimmed_word_count": 0,
  "trimmed_est_minutes": 0,
  "what_was_cut": [
    {
      "section": "Name or description of what was removed",
      "reason": "Why this was the right thing to cut"
    }
  ],
  "what_was_kept": "Brief explanation of the core thread that survived — what makes this version still land",
  "pacing_notes": "2-3 specific notes on where to slow down, pause, or speed up for maximum impact"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: withLanguage(PERSONALITY, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('TheRunthrough Cut error:', error);
    res.status(500).json({ error: error.message || 'Cut failed' });
  }
});

// ─── ANTICIPATE: Predict tough Q&A ───
router.post('/the-runthrough-anticipate', rateLimit(), async (req, res) => {
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
    "weakest_claim": "The single claim most likely to be challenged",
    "missing_data": "What data or evidence the audience will notice is absent",
    "assumption_risk": "The biggest unstated assumption that could be questioned"
  },
  "tough_questions": [
    {
      "question": "The exact question someone would ask",
      "why_they_ask": "What's behind this question — what are they really worried about",
      "difficulty": "hard | very_hard | killer",
      "draft_answer": "A strong, specific answer — 40-80 words, confident but honest",
      "trap_to_avoid": "The common mistake speakers make when answering this"
    }
  ],
  "curveball": {
    "question": "One completely unexpected question from left field that could throw you off",
    "draft_answer": "How to handle it gracefully"
  },
  "overall_readiness": "A candid 1-2 sentence assessment of how ready this presentation is for tough questions"
}

Generate 5-7 tough_questions, ordered from most to least likely.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      system: withLanguage(PERSONALITY, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('TheRunthrough Anticipate error:', error);
    res.status(500).json({ error: error.message || 'Anticipation failed' });
  }
});

// ─── HOOK: Rewrite opening, closing, transitions ───
router.post('/the-runthrough-hook', rateLimit(), async (req, res) => {
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
    "current_opening": "Brief description of how it currently opens",
    "opening_problem": "What's wrong with it — why it doesn't grab attention",
    "current_closing": "Brief description of how it currently ends",
    "closing_problem": "What's weak about the ending"
  },
  "new_opening": {
    "text": "The full rewritten opening — 3-5 sentences, ready to deliver",
    "technique": "Name the technique used (story, question, statistic, bold claim, etc.)",
    "why_it_works": "1 sentence on why this grabs the audience"
  },
  "new_closing": {
    "text": "The full rewritten closing — 3-5 sentences, ready to deliver",
    "technique": "Name the technique used (callback, CTA, vision, challenge, etc.)",
    "why_it_works": "1 sentence on why this makes it stick"
  },
  "transitions": [
    {
      "between": "Section A → Section B",
      "original": "What's there now (or nothing)",
      "rewritten": "A smooth, purposeful transition sentence",
      "why": "What this transition accomplishes"
    }
  ],
  "energy_arc": "A brief description of the emotional journey: where energy should peak, dip, and land. 2-3 sentences."
}

Generate 2-4 transitions for the most important section breaks.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      system: withLanguage(PERSONALITY, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('TheRunthrough Hook error:', error);
    res.status(500).json({ error: error.message || 'Hook rewrite failed' });
  }
});

module.exports = router;
