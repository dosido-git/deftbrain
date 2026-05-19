const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const LEVEL_GUIDE = {
  curious: 'Warm, conversational pushback. Concede easily. Think: smart friend at dinner.',
  rigorous: 'Structured opposition. Press weak points. Demand evidence. Think: practice debate partner.',
  'no-mercy': 'Strongest possible case. Every logical gap. Relentless but respectful. Think: supreme court.'
};

const FORMAT_GUIDE = {
  freeform: 'Open debate. No structural constraints. Respond naturally.',
  'lincoln-douglas': 'Lincoln-Douglas format. Alternate between constructive arguments and rebuttals. Focus on value premises and criteria. Stay structured.',
  'cross-exam': 'Cross-examination format. You may ONLY ask questions — no assertions, no arguments, no statements. Every response must be a question or series of questions designed to expose weaknesses. The user answers and may ask their own questions.',
  oxford: 'Oxford-style debate. Argue for or against a specific motion. Focus on persuading an undecided audience, not winning against the opponent. Stay structured and oratorical.',
  socratic: 'Socratic method. You may ONLY ask questions — never assert anything. Guide the user to examine their own assumptions through probing questions. Never reveal your position. Let them discover contradictions themselves.'
};

// ═══════════════════════════════════════════════════
// ROUTE 1: OPEN — Launch debate (supports formats)
// ═══════════════════════════════════════════════════
router.post('/debate-open', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { position, topic, context, challengeLevel, category, format, userLanguage } = req.body;
    if (!position?.trim()) return res.status(400).json({ error: 'State your position — what do you believe?' });

    const fmt = FORMAT_GUIDE[format] || FORMAT_GUIDE.freeform;
    const prompt = withLanguage(`You are a debate sparring partner. Present the STEELMAN opposing case — the strongest, most intellectually honest disagreement. Not a strawman.

USER'S POSITION: "${position.trim()}"
${topic?.trim() ? `TOPIC AREA: "${topic.trim()}"` : ''}
${context?.trim() ? `CONTEXT: "${context.trim()}"` : ''}
${category ? `CATEGORY: ${category}` : ''}

CHALLENGE LEVEL: ${challengeLevel || 'rigorous'}
${LEVEL_GUIDE[challengeLevel] || LEVEL_GUIDE.rigorous}

DEBATE FORMAT: ${format || 'freeform'}
${fmt}

RULES:
- Frame as advocacy, not personal opinion: "A thoughtful critic would say..."
- Use real evidence, thinkers, examples where possible.
- End with a targeted question at the weakest point.
- Be warm. You're a coach, not an enemy.
${format === 'socratic' ? '- ONLY ask questions. Never assert.' : ''}
${format === 'cross-exam' ? '- ONLY ask questions. No statements.' : ''}

Return ONLY valid JSON:
{
  "opening": "Your steelman counter-argument (or questions if socratic/cross-exam). 3-5 paragraphs. — one sentence",
  "key_challenges": [{ "point": "specific challenge — one sentence", "why_strong": "why hard to dismiss — one sentence", "type": "empirical | logical | moral | practical | historical" }],
  "acknowledged_strengths": ["1-2 things their position gets right"],
  "closing_question": "One targeted question at the weakest point. — one sentence",
  "debate_context": { "user_side": "Brief label — one sentence", "ai_side": "Brief label — one sentence", "core_tension": "Fundamental disagreement in one sentence" }
}`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      system: withLanguage(`Steelman debate partner. Intellectually honest, real evidence, genuine respect. Coach not adversary. ${challengeLevel === 'no-mercy' ? 'Intellectually relentless.' : ''} ${format === 'socratic' || format === 'cross-exam' ? 'QUESTIONS ONLY — never make statements or assertions.' : ''} Return ONLY valid JSON. No markdown.`, userLanguage),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'DebateOpen' });
    if (!parsed.opening && !parsed.response) {
      return res.status(500).json({ error: 'Could not generate the debate response. Please try again.' });
    }
    res.json(parsed);
  } catch (error) {
    console.error('[DebateOpen]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 2: RESPOND — Continue debate
// ═══════════════════════════════════════════════════
router.post('/debate-respond', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { userResponse, debateHistory, challengeLevel, userSide, aiSide, coreTension, format, userLanguage } = req.body;
    if (!userResponse?.trim()) return res.status(400).json({ error: 'Make your argument!' });

    const historyText = debateHistory?.map((t, i) => `[Turn ${i + 1} - ${t.speaker}]: ${t.text}`).join('\n\n') || '';
    const fmt = FORMAT_GUIDE[format] || FORMAT_GUIDE.freeform;

    const prompt = withLanguage(`Continue the steelman opposition in an ongoing debate.

User argues: "${userSide || 'their position'}" | You argue: "${aiSide || 'opposing'}" | Core tension: "${coreTension || ''}"
FORMAT: ${format || 'freeform'} — ${fmt}
CHALLENGE: ${challengeLevel || 'rigorous'} — ${LEVEL_GUIDE[challengeLevel] || LEVEL_GUIDE.rigorous}

HISTORY:\n${historyText}

LATEST: "${userResponse.trim()}"

RULES:
- Concede strong points. Flag fallacies gently. Press forward. End with a question.
${format === 'socratic' || format === 'cross-exam' ? '- ONLY ask questions.' : ''}

Return ONLY valid JSON:
{
  "response": "Your counter-response. 2-4 paragraphs. — one sentence",
  "concessions": ["strong points acknowledged"],
  "fallacy_flags": [{ "type": "fallacy name — one sentence", "in_text": "what triggered it — one sentence", "suggestion": "how to fix — one sentence" }],
  "pressure_point": "weakest part of their response — one sentence",
  "closing_question": "next targeted question — one sentence",
  "momentum": { "assessment": "user_stronger | ai_stronger | even | shifting", "note": "internal assessment — one sentence" }
}`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: withLanguage(`Steelman debate partner. Concede strong points. Flag fallacies. Press forward. ${format === 'socratic' || format === 'cross-exam' ? 'QUESTIONS ONLY.' : ''} Return ONLY valid JSON. No markdown.`, userLanguage),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'DebateRespond' });
    if (!parsed.opening && !parsed.response) {
      return res.status(500).json({ error: 'Could not generate the debate response. Please try again.' });
    }
    res.json(parsed);
  } catch (error) {
    console.error('[DebateRespond]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 3: SWITCH — Switch sides
// ═══════════════════════════════════════════════════
router.post('/debate-switch', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { debateHistory, oldUserSide, oldAiSide, coreTension, challengeLevel, userLanguage } = req.body;
    if (!debateHistory?.length) return res.status(400).json({ error: 'Need debate history to switch.' });

    const historyText = debateHistory.map((t, i) => `[Turn ${i + 1} - ${t.speaker}]: ${t.text}`).join('\n\n');
    const prompt = withLanguage(`Sides switching. You argued "${oldAiSide}", user argued "${oldUserSide}". Now swap. Take their best arguments plus ones they missed.

HISTORY:\n${historyText}

Return ONLY valid JSON:
{
  "switch_opening": "Your argument for your NEW side. 2-3 paragraphs. — one sentence",
  "new_angles": ["arguments the user didn't make"],
  "closing_question": "question targeting their NEW position's weakness — one sentence",
  "switch_context": { "ai_now_argues": "${oldUserSide}" }
}`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: withLanguage('Side-switching debate partner. Argue their former position better than they did. Return ONLY valid JSON. No markdown.', userLanguage),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'DebateSwitch' });
    if (!parsed.opening && !parsed.response) {
      return res.status(500).json({ error: 'Could not generate the debate response. Please try again.' });
    }
    res.json(parsed);
  } catch (error) {
    console.error('[DebateSwitch]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 4: SCORECARD — Post-debate analysis
// ═══════════════════════════════════════════════════
router.post('/debate-scorecard', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { debateHistory, userSide, aiSide, coreTension, challengeLevel, didSwitch, format, userLanguage } = req.body;
    if (!debateHistory?.length || debateHistory.length < 2) return res.status(400).json({ error: 'Need at least one exchange.' });

    const historyText = debateHistory.map((t, i) => `[Turn ${i + 1} - ${t.speaker}${t.side ? ` (${t.side})` : ''}]: ${t.text}`).join('\n\n');
    const prompt = withLanguage(`Analyze this debate as a coach. Honest, specific, encouraging.

User argued: "${userSide}" | AI argued: "${aiSide}" | Tension: "${coreTension || ''}"
${didSwitch ? 'User switched sides.' : ''} | Level: ${challengeLevel} | Format: ${format || 'freeform'}

HISTORY:\n${historyText}

Return ONLY valid JSON:
{
  "overall": { "assessment": "2-3 sentence read", "thinking_sharpness": "1-10", "growth_moment": "specific moment of growth — one sentence" },
  "strengths": [{ "argument": "what they did well — one sentence", "why_effective": "what made it work — one sentence" }],
  "blind_spots": [{ "area": "what they missed — one sentence", "the_gap": "what a strong advocate would say — one sentence", "how_to_strengthen": "advice — one sentence" }],
  "fallacies_used": [{ "type": "name", "instance": "where", "fix": "how to avoid — one sentence" }],
  "best_exchange": { "turn": "which exchange — one sentence", "why": "what made it good — one sentence" },
  "position_evolved": "how their position changed — one sentence",
  "next_debate_suggestion": "related topic to try — one sentence",
  "coaching_note": "one specific actionable piece of advice — one sentence"
}`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: withLanguage('Debate coach. Honest, warm, specific. Coaching not grading. Return ONLY valid JSON. No markdown.', userLanguage),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'DebateScorecard' });
    if (!parsed.opening && !parsed.response) {
      return res.status(500).json({ error: 'Could not generate the debate response. Please try again.' });
    }
    res.json(parsed);
  } catch (error) {
    console.error('[DebateScorecard]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 5: QUICK SPAR — Single round
// ═══════════════════════════════════════════════════
router.post('/debate-quick', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { position, challengeLevel, userLanguage } = req.body;
    if (!position?.trim()) return res.status(400).json({ error: 'State a position.' });

    const prompt = withLanguage(`Quick single-round challenge. One strongest counter-argument.

POSITION: "${position.trim()}" | LEVEL: ${challengeLevel || 'rigorous'}

Return ONLY valid JSON:
{ "counter": "2-3 paragraphs, the best single argument against — one sentence", "the_question": "one question they must answer — one sentence", "steelman_label": "opposing label — 2-4 words", "strength_acknowledged": "what they get right — one sentence", "go_deeper": "most interesting angle for full debate — one sentence" }`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: withLanguage('Quick debate challenger. One punch. Steelman only. Return ONLY valid JSON. No markdown.', userLanguage),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'DebateQuick' });
    if (!parsed.opening && !parsed.response) {
      return res.status(500).json({ error: 'Could not generate the debate response. Please try again.' });
    }
    res.json(parsed);
  } catch (error) {
    console.error('[DebateQuick]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 6: COACH — Help me respond
// ═══════════════════════════════════════════════════
router.post('/debate-coach', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { debateHistory, userSide, aiSide, coreTension, lastAiPoint, userLanguage } = req.body;
    if (!debateHistory?.length) return res.status(400).json({ error: 'Need debate context.' });

    const historyText = debateHistory.map((t, i) => `[Turn ${i + 1} - ${t.speaker}]: ${t.text}`).join('\n\n');
    const prompt = withLanguage(`You're a COACH, not the opponent. User is stuck. Suggest ANGLES, not arguments.

User argues: "${userSide}" | Opponent: "${aiSide}" | Tension: "${coreTension || ''}"
HISTORY:\n${historyText}
STUCK ON: "${lastAiPoint || ''}"

Return ONLY valid JSON:
{
  "encouragement": "One warm sentence. — one sentence",
  "angles": [{ "approach": "strategy not script — one sentence", "why_effective": "why it works here — one sentence", "example_opener": "first 5-10 words only" }],
  "opponent_weakness": "weakness they missed in opponent's argument — one sentence",
  "strategic_concession": "point worth conceding, or null — one sentence",
  "evidence_hint": "type of evidence that would be powerful — one sentence"
}`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: withLanguage('Debate coach. Suggest angles not arguments. Help them think, not think for them. Return ONLY valid JSON. No markdown.', userLanguage),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'DebateCoach' });
    if (!parsed.opening && !parsed.response) {
      return res.status(500).json({ error: 'Could not generate the debate response. Please try again.' });
    }
    res.json(parsed);
  } catch (error) {
    console.error('[DebateCoach]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 7: AUDIENCE JUDGE — Third-party verdict
// ═══════════════════════════════════════════════════
router.post('/debate-audience-judge', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { debateHistory, userSide, aiSide, coreTension, userLanguage } = req.body;
    if (!debateHistory?.length || debateHistory.length < 4) return res.status(400).json({ error: 'Need at least 2 exchanges for audience judgment.' });

    const historyText = debateHistory.filter(h => h.speaker !== 'system').map((t, i) => `[${t.speaker === 'user' ? 'Side A' : 'Side B'} — ${t.side}]: ${t.text}`).join('\n\n');
    const prompt = withLanguage(`You are an UNDECIDED AUDIENCE MEMBER watching a debate. You came in with no strong opinion. Judge purely on persuasiveness — not who's "right," but who made the more compelling case to someone on the fence.

Side A (user) argues: "${userSide}"
Side B (AI) argues: "${aiSide}"
Core question: "${coreTension || ''}"

DEBATE:\n${historyText}

Return ONLY valid JSON:
{
  "verdict": {
    "more_persuasive": "Side A | Side B | Too close to call",
    "confidence": "Strongly | Slightly | Barely",
    "reason": "Why this side was more convincing to an undecided observer. 2-3 sentences."
  },
  "side_a_review": {
    "most_compelling_moment": "Their single most persuasive argument or move — one sentence",
    "least_compelling_moment": "Where they lost the audience — one sentence",
    "persuasion_score": "1-10 as a persuader, not as a debater (number)"
  },
  "side_b_review": {
    "most_compelling_moment": "Their most persuasive moment — one sentence",
    "least_compelling_moment": "Where they lost the audience — one sentence",
    "persuasion_score": "1-10"
  },
  "audience_shift": "How did your opinion shift during the debate? Did you lean one way early and switch? — one sentence",
  "what_would_have_convinced_me": "What argument was MISSING that would have been most persuasive to an undecided person? — one sentence",
  "emotional_vs_logical": "Which side used emotion more effectively? Which used logic? Which worked better for persuasion? — one sentence"
}`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: withLanguage('Undecided audience member judging a debate on persuasiveness, not correctness. Fair, specific, thoughtful. Return ONLY valid JSON. No markdown.', userLanguage),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'DebateAudienceJudge' });
    if (!parsed.opening && !parsed.response) {
      return res.status(500).json({ error: 'Could not generate the debate response. Please try again.' });
    }
    res.json(parsed);
  } catch (error) {
    console.error('[DebateAudienceJudge]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 8: ARGUMENT MAP — Visual debate structure
// ═══════════════════════════════════════════════════
router.post('/debate-argument-map', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { debateHistory, userSide, aiSide, userLanguage } = req.body;
    if (!debateHistory?.length || debateHistory.length < 2) return res.status(400).json({ error: 'Need debate history to map.' });

    const historyText = debateHistory.filter(h => h.speaker !== 'system').map((t, i) => `[Turn ${i + 1} - ${t.speaker}]: ${t.text}`).join('\n\n');
    const prompt = withLanguage(`Analyze the structure of this debate and create an argument map — a tree showing how claims, counter-claims, and evidence connect.

User argued: "${userSide}" | AI argued: "${aiSide}"
DEBATE:\n${historyText}

Return ONLY valid JSON:
{
  "user_tree": {
    "main_claim": "Their central thesis — one sentence",
    "branches": [
      {
        "argument": "A sub-argument they made — one sentence",
        "evidence": "Evidence they provided (or 'none' if unsupported) — one sentence",
        "status": "defended | abandoned | weakened | strengthened",
        "attacked_by": "How the opponent challenged this, or null — one sentence",
        "sub_branches": [{ "argument": "further sub-point — one sentence", "status": "defended | abandoned | weakened" }]
      }
    ]
  },
  "ai_tree": {
    "main_claim": "The opposition's central thesis — one sentence",
    "branches": [
      {
        "argument": "A sub-argument — one sentence",
        "evidence": "Evidence provided — one sentence",
        "status": "defended | abandoned | weakened | strengthened",
        "attacked_by": "How user challenged this, or null — one sentence",
        "sub_branches": []
      }
    ]
  },
  "undefended_branches": ["Arguments that were raised but never addressed by either side"],
  "strongest_chain": "The single strongest argument→evidence→conclusion chain in the debate — one sentence",
  "weakest_chain": "The weakest unsupported claim that was treated as established — one sentence",
  "structural_note": "One observation about the overall shape of the debate — e.g., 'You built wide (many arguments) but not deep (little evidence for each)' — one sentence"
}`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: withLanguage('Argument structure analyst. Map the logical structure of debates into trees. Precise, analytical, visual. Return ONLY valid JSON. No markdown.', userLanguage),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'DebateArgumentMap' });
    if (!parsed.opening && !parsed.response) {
      return res.status(500).json({ error: 'Could not generate the debate response. Please try again.' });
    }
    res.json(parsed);
  } catch (error) {
    console.error('[DebateArgumentMap]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 9: DEVIL'S ADVOCATE PREP — Scenario drilling
// ═══════════════════════════════════════════════════
router.post('/debate-prep', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { position, audience, context, stakes, userLanguage } = req.body;
    if (!position?.trim()) return res.status(400).json({ error: 'What position do you need to defend?' });

    const prompt = withLanguage(`The user has a real-world situation where they need to defend a position. Simulate the specific audience they'll face and drill them on the hardest objections.

POSITION TO DEFEND: "${position.trim()}"
AUDIENCE: "${audience?.trim() || 'general'}"
CONTEXT: "${context?.trim() || 'not specified'}"
STAKES: "${stakes?.trim() || 'moderate'}"

Create a prep package: the 5 hardest questions they'll face from THIS specific audience, with coaching on each.

Return ONLY valid JSON:
{
  "audience_profile": "Brief read on this audience — what they care about, how they think, what would persuade them vs. what would backfire — one sentence",
  "hard_questions": [
    {
      "question": "The specific question or objection this audience would raise — one sentence",
      "why_hard": "Why this is particularly difficult with THIS audience — one sentence",
      "angle": "Strategy for responding — the approach, not the script — one sentence",
      "landmine": "The thing to absolutely NOT say to this audience — one sentence",
      "opener": "First sentence of a strong response — one sentence"
    }
  ],
  "opening_strategy": "How to frame the position from the start to preempt the biggest objections — one sentence",
  "concede_early": "One thing to concede upfront that builds credibility with this audience — one sentence",
  "closing_move": "The strongest way to end — the one thing to leave them with — one sentence",
  "body_language_note": "One specific non-verbal tip for this scenario — one sentence",
  "worst_case": {
    "scenario": "The worst way this could go — one sentence",
    "recovery": "How to recover if it happens — one sentence"
  }
}`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: withLanguage('Devil\'s advocate prep coach. Simulate specific audiences and drill on their hardest objections. Practical, specific, actionable. Return ONLY valid JSON. No markdown.', userLanguage),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'DebatePrep' });
    if (!parsed.opening && !parsed.response) {
      return res.status(500).json({ error: 'Could not generate the debate response. Please try again.' });
    }
    res.json(parsed);
  } catch (error) {
    console.error('[DebatePrep]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 10: FALLACY TRAINING — Identify & avoid
// ═══════════════════════════════════════════════════
router.post('/debate-fallacy-train', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { difficulty, mode, topic, streak, userAnswer, exerciseType, userLanguage } = req.body;

    const prompt = withLanguage(`Generate a fallacy training exercise. ${mode === 'identify' ? 'Present an argument containing a logical fallacy. The user must identify it.' : 'Present a position and challenge the user to argue for it WITHOUT using any fallacies.'}

DIFFICULTY: ${difficulty || 'medium'} (easy = obvious fallacies, medium = subtle, hard = sophisticated)
${topic ? `TOPIC PREFERENCE: "${topic}"` : ''}
${streak ? `CURRENT STREAK: ${streak} correct` : ''}
${userAnswer ? `USER'S ANSWER: "${userAnswer}" — evaluate it.` : ''}
${exerciseType ? `EXERCISE TYPE: ${exerciseType}` : ''}

${userAnswer ? `Evaluate their answer. Were they right? Give specific feedback.

Return ONLY valid JSON:
{
  "correct": true/false,
  "feedback": "Specific explanation of why they were right or wrong — 1-2 sentences",
  "the_fallacy": "The actual fallacy name — one sentence",
  "explanation": "Why this is that fallacy — 1-2 sentences",
  "how_to_fix": "How to make the same point without the fallacy — one sentence",
  "streak": ${(streak || 0)} + (correct ? 1 : 0)
}` : `Generate a new exercise.

Return ONLY valid JSON:
{
  "exercise": {
    "type": "${mode || 'identify'}",
    "argument": "The argument to analyze (2-3 sentences, with an embedded fallacy if identify mode)",
    "context": "Brief setup for the argument — 1-2 sentences",
    "difficulty": "${difficulty || 'medium'}",
    "hint": "A subtle hint if they're stuck — one sentence"
  },
  "topic": "what topic this covers — 3-6 words"
}`}`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: withLanguage('Fallacy training instructor. Create clear, educational exercises. At easy difficulty, fallacies are obvious. At hard, they\'re sophisticated and subtle. Always educational. Return ONLY valid JSON. No markdown.', userLanguage),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'DebateFallacyTrain' });
    if (!parsed.opening && !parsed.response) {
      return res.status(500).json({ error: 'Could not generate the debate response. Please try again.' });
    }
    res.json(parsed);
  } catch (error) {
    console.error('[DebateFallacyTrain]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 11: SOURCE CHECK — "Prove it"
// ═══════════════════════════════════════════════════
router.post('/debate-source-check', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { claim, speaker, debateContext, userLanguage } = req.body;
    if (!claim?.trim()) return res.status(400).json({ error: 'What claim needs sourcing?' });

    const prompt = withLanguage(`A claim was made during a debate. Evaluate whether it's evidence-backed or an inferential leap.

CLAIM: "${claim.trim()}"
MADE BY: ${speaker || 'unknown'}
${debateContext ? `DEBATE CONTEXT: "${debateContext.substring(0, 1000)}"` : ''}

Be honest: if this is well-supported, say so. If it's plausible but unproven, say so. If it's wrong, say so.

Return ONLY valid JSON:
{
  "claim_type": "Empirical fact | Statistical claim | Expert consensus | Logical inference | Anecdotal | Speculative | Mixed",
  "evidence_rating": {
    "score": "Well-supported | Partially supported | Plausible but unproven | Misleading | Unsupported",
    "emoji": "✅ | 🟡 | 🟠 | 🔴 | ❌"
  },
  "assessment": "Specific evaluation of the claim. What's right, what's wrong, what's missing. — 1-2 sentences",
  "real_evidence": "What actual evidence exists for or against this claim — be specific about what studies/data show. — one sentence",
  "the_leap": "If there's an inferential leap, what is it? Where does the claim go beyond what evidence supports? — one sentence",
  "stronger_version": "How to make the same point with better support — or what to say instead if the claim doesn't hold up. — one sentence"
}`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: withLanguage('Evidence evaluator. Assess claims for factual accuracy and evidence quality. Honest, specific, educational. Return ONLY valid JSON. No markdown.', userLanguage),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'DebateSourceCheck' });
    if (!parsed.opening && !parsed.response) {
      return res.status(500).json({ error: 'Could not generate the debate response. Please try again.' });
    }
    res.json(parsed);
  } catch (error) {
    console.error('[DebateSourceCheck]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 12: REMATCH — Target previous blind spots
// ═══════════════════════════════════════════════════
router.post('/debate-rematch', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { position, previousBlindSpots, previousFallacies, previousScore, previousSummary, challengeLevel, userLanguage } = req.body;
    if (!position?.trim()) return res.status(400).json({ error: 'Need the position for rematch.' });

    const prompt = withLanguage(`REMATCH. The user debated this position before and is back for another round. You have intelligence on their weaknesses from last time. Target them specifically.

POSITION: "${position.trim()}"
PREVIOUS SCORE: ${previousScore || '?'}/10
PREVIOUS SUMMARY: "${previousSummary || ''}"
THEIR BLIND SPOTS: ${JSON.stringify(previousBlindSpots || [])}
FALLACIES THEY USED: ${JSON.stringify(previousFallacies || [])}

Your job: Open with arguments that specifically target their documented weak spots. Don't repeat the same opening — find new angles that hit where they're soft. If they used fallacies last time, set traps that would tempt them to use those same fallacies.

CHALLENGE: ${challengeLevel || 'rigorous'}

Return ONLY valid JSON:
{
  "opening": "Steelman opening that specifically targets their known blind spots. 3-4 paragraphs. — one sentence",
  "targeted_weaknesses": [{ "blind_spot": "which weakness you're targeting — one sentence", "how": "how your argument exploits it — one sentence" }],
  "fallacy_traps": ["arguments designed to tempt them toward their habitual fallacies — they'll need to consciously avoid them"],
  "closing_question": "A question aimed squarely at their biggest documented blind spot. — one sentence",
  "debate_context": { "user_side": "their position — one sentence", "ai_side": "opposing — one sentence", "core_tension": "the fundamental tension — one sentence" }
}`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: withLanguage('Rematch debate partner. You have intelligence on their previous weaknesses. Target them specifically. Still fair, still steelman — but surgically aimed at their growth areas. Return ONLY valid JSON. No markdown.', userLanguage),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'DebateRematch' });
    if (!parsed.opening && !parsed.response) {
      return res.status(500).json({ error: 'Could not generate the debate response. Please try again.' });
    }
    res.json(parsed);
  } catch (error) {
    console.error('[DebateRematch]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 13: HIGHLIGHT REEL — Cross-debate patterns
// ═══════════════════════════════════════════════════
router.post('/debate-highlight-reel', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { debates, userLanguage } = req.body;
    if (!debates?.length || debates.length < 3) return res.status(400).json({ error: 'Need at least 3 scored debates for pattern analysis.' });

    const debateSummaries = debates.map((d, i) => `[Debate ${i + 1}] Topic: ${d.userSide} vs ${d.aiSide} | Score: ${d.sharpness}/10 | Level: ${d.level} | Turns: ${d.turns} | Switched: ${d.switched ? 'yes' : 'no'} | Summary: ${d.summary || ''} | Coaching: ${d.coachingNote || ''} | Fallacies: ${d.fallacies?.join(', ') || 'none'}`).join('\n');

    const prompt = withLanguage(`Analyze patterns across multiple debates. This is a meta-analysis of someone's debating/thinking habits. Find the patterns no single scorecard would reveal.

${debates.length} DEBATES:\n${debateSummaries}

Return ONLY valid JSON:
{
  "overall_profile": "2-3 sentence profile of this person as a thinker/debater. What kind of mind do they have?",
  "top_strengths": [{ "pattern": "A recurring strength across debates — one sentence", "evidence": "Which debates show this — one sentence" }],
  "persistent_weaknesses": [{ "pattern": "A weakness that keeps appearing — one sentence", "frequency": "how often (number)", "prescription": "specific practice to fix this — one sentence" }],
  "fallacy_profile": {
    "most_common": "Their go-to fallacy — one sentence",
    "pattern": "When/why they tend to use it — one sentence",
    "exercise": "A specific exercise to break this habit — one sentence"
  },
  "growth_trajectory": {
    "direction": "improving | plateau | declining | inconsistent",
    "insight": "Specific observation about their growth pattern — one sentence"
  },
  "best_moment": "Their single strongest argument or move across all debates — one sentence",
  "biggest_blind_spot": "The one area they consistently avoid or fail to address — one sentence",
  "next_challenges": ["3 specific debate topics that would stretch their weakest areas"],
  "debater_type": {
    "label": "A 2-3 word archetype — e.g., 'Evidence Hunter', 'Intuitive Framer', 'Devil's Advocate', 'Emotional Reasoner'",
    "description": "What this means for their style and where it helps/hurts — 1-2 sentences"
  }
}`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: withLanguage('Meta-analyst of debating patterns. You find patterns across multiple debates that no single scorecard reveals. Insightful, specific, growth-oriented. Return ONLY valid JSON. No markdown.', userLanguage),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'DebateHighlightReel' });
    if (!parsed.opening && !parsed.response) {
      return res.status(500).json({ error: 'Could not generate the debate response. Please try again.' });
    }
    res.json(parsed);
  } catch (error) {
    console.error('[DebateHighlightReel]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
