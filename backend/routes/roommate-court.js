const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ════════════════════════════════════════════════════════════
// SYSTEM PROMPTS
// ════════════════════════════════════════════════════════════

const MEDIATOR_SYSTEM = `You are an impartial roommate dispute mediator. You are direct, honest, and fair.

RULES:
1. You only hear ONE side of the story. Always consider what the OTHER person would say.
2. If the user is clearly in the wrong, say so — kindly but clearly. Don't sugarcoat.
3. The conversation_script must be WORD-FOR-WORD dialogue the user can rehearse. Use "You:" and "Them:" prefixes. Make it realistic — include likely pushback and how to respond.
4. Tailor escalation options to the living situation (dorm → RA; apartment → landlord/mediation; family → very different approach).
5. The reality_check should be the most honest part — what a wise friend would say after hearing the whole story.
6. Boundaries must be SPECIFIC and actionable, not vague ("no guests after 11pm on weeknights" not "respect quiet hours").
7. Consider how long the issue has been going on and whether they've tried talking — chronic ignored issues need stronger solutions.

FORMAT: Respond in valid JSON matching the schema exactly. No markdown fences, no preamble. Pure JSON only.

CRITICAL: "whos_right" MUST be EXACTLY one of the English keys you|them|both|neither regardless of the response language (it is a code value the UI switches on, not display text). Provide AT MOST 3 items each in immediate_actions, boundaries, and escalation_options. Never place a double-quote (") character inside any JSON string value — write the conversation_script dialogue with the You:/Them: prefixes but no quote marks around speech; a literal " breaks the JSON.

Return ONLY valid JSON.`;

const ASSIGNER_SYSTEM = `You are a fair household chore assignment engine. You balance workload using effort weights and historical data.

RULES:
1. Assign effort weights: 1 = light (5-10 min, easy), 2 = medium (15-30 min, moderate), 3 = heavy (30+ min, unpleasant).
2. Balance TOTAL EFFORT POINTS across roommates, not just chore count. 1 heavy chore = 3 light chores.
3. If history is provided, analyze it: who's been overburdened? Who's had it easy? Correct imbalances.
4. NEVER give someone the same heavy chore two rounds in a row unless unavoidable.
5. Reasoning must cite specific history data: "Alex got bathroom because they haven't had a heavy chore in 3 rounds."
6. Fairness score: 100 = perfectly equal effort, drops as imbalance increases. Below 70 = needs rebalancing.
7. If there are more chores than can be evenly split, give the extra light chore to whoever had the easiest recent history.

FORMAT: Respond in valid JSON matching the schema exactly. No markdown fences, no preamble. Pure JSON only.

Return ONLY valid JSON.`;

// ════════════════════════════════════════════════════════════
// ROUTE
// ════════════════════════════════════════════════════════════

router.post('/roommate-court', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { action } = req.body;

    // ── MEDIATE ──
    if (action === 'mediate') {
      const { dispute, category, yourSide, theirSide, duration, priorCommunication, livingSituation } = req.body;

      const prompt = `DISPUTE CASE FILE:
Category: ${category || 'General'}
Living situation: ${livingSituation || 'Not specified'}
Duration of issue: ${duration || 'Not specified'}
Prior communication attempts: ${priorCommunication || 'Not specified'}

DISPUTE DESCRIPTION:
${dispute || 'Not provided'}

THE USER'S OWN SIDE (the user is speaking — "whos_right: you" refers to THIS person):
${yourSide || 'Not provided'}

WHAT THE OTHER PERSON WOULD SAY:
${theirSide || 'Not provided'}

Analyze this dispute impartially. Remember: you're only hearing one side.

Return this exact JSON structure:
{
  "verdict": {
    "whos_right": "you | them | both | neither",
    "reasoning": "2-3 sentence plain language explanation of your ruling",
    "your_fault_pct": 40,
    "their_fault_pct": 60
  },
  "underlying_issues": {
    "surface_conflict": "what they think they're fighting about",
    "real_conflict": "the actual underlying issue driving this",
    "communication_breakdown": "where and how communication failed"
  },
  "resolution": {
    "immediate_actions": ["specific action 1", "specific action 2", "specific action 3"],
    "conversation_script": "You: [opening line]\\nThem: [likely response]\\nYou: [follow-up]\\n... (full realistic dialogue, 8-12 lines)",
    "compromise": "specific, concrete middle ground proposal",
    "boundaries": ["specific boundary 1", "specific boundary 2", "specific boundary 3"]
  },
  "if_stuck": {
    "escalation_options": ["step 1", "step 2", "step 3"],
    "self_protection": "how to protect yourself if they won't cooperate",
    "exit_strategy": "realistic path out if nothing works"
  },
  "prevention": "how to prevent this specific type of dispute in the future",
  "reality_check": "honest, direct assessment — what would a wise friend say?"
}

Return ONLY valid JSON.`;

      const parsed = await callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 5000,
        system: withLanguage(MEDIATOR_SYSTEM, req.body.userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
        messages: [{ role: 'user', content: prompt }]
      }, { label: 'roommate-court' });
      if (!parsed.verdict && !parsed.ruling && !parsed.judgment) {
        return res.status(500).json({ error: 'Could not deliver the verdict. Please try again.' });
      }
      return res.json(parsed);
    }

    // ── ASSIGN ──
    if (action === 'assign') {
      const { roommates, chores, history, sessionHistory } = req.body;
      const hist = history || sessionHistory;

      if (!roommates || roommates.length < 2) {
        return res.status(400).json({ error: 'Need at least 2 roommates' });
      }
      if (!chores || chores.length < 1) {
        return res.status(400).json({ error: 'Need at least 1 chore' });
      }

      let historyBlock = '';
      if (hist && hist.length > 0) {
        historyBlock = `\n\nASSIGNMENT HISTORY (most recent first):\n${hist.map((round, i) => {
          const assignments = round.assignments.map(a =>
            `  ${a.roommate}: ${a.chores.map(ch => `${ch.name} (effort ${ch.effort})`).join(', ')}`
          ).join('\n');
          return `Round ${hist.length - i} (${round.date}):\n${assignments}`;
        }).join('\n\n')}`;
      }

      const prompt = `HOUSEHOLD:
Roommates: ${roommates.join(', ')}
Chores to assign: ${chores.join(', ')}
${historyBlock}

Assign ALL chores to roommates. Balance total effort points fairly.${hist?.length ? ' Use the history to correct any imbalances.' : ''}

Return this exact JSON structure:
{
  "assignments": [
    { "roommate": "Name", "chores": [{ "name": "Chore", "effort": 2 }] }
  ],
  "effort_totals": { "Name1": 6, "Name2": 5 },
  "fairness_score": 82,
  "reasoning": "2-3 sentences explaining why each person got what they got, citing history if available"
}

Return ONLY valid JSON.`;

      const parsed = await callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 4000,
        system: withLanguage(ASSIGNER_SYSTEM, req.body.userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
        messages: [{ role: 'user', content: prompt }]
      }, { label: 'roommate-court-2' });
      if (!parsed.assignments) {
        return res.status(500).json({ error: 'Could not deliver the verdict. Please try again.' });
      }
      return res.json(parsed);
    }

    // ── REBALANCE ──
    if (action === 'rebalance') {
      const { currentAssignments, complaint, history, sessionHistory } = req.body;
      const hist = history || sessionHistory;

      const prompt = `REBALANCE REQUEST:

Current assignments:
${currentAssignments.map(a =>
  `${a.roommate}: ${a.chores.map(ch => `${ch.name} (effort ${ch.effort})`).join(', ')}`
).join('\n')}

COMPLAINT: "${complaint}"

${hist && hist.length > 0 ? `HISTORY (last ${hist.length} rounds):\n${hist.map((round, i) => {
  const assignments = round.assignments.map(a =>
    `  ${a.roommate}: ${a.chores.map(ch => `${ch.name} (effort ${ch.effort})`).join(', ')}`
  ).join('\n');
  return `Round ${hist.length - i} (${round.date}):\n${assignments}`;
}).join('\n\n')}` : 'No prior history available.'}

Evaluate this complaint against the data. Is it valid? If yes, provide revised assignments. If no, explain why with specific numbers.

Return this exact JSON structure:
{
  "complaint_valid": true | false,
  "revised_assignments": [{ "roommate": "Name", "chores": [{ "name": "Chore", "effort": 2 }] }] or null if complaint invalid,
  "revised_effort_totals": { "Name1": 6 } or null,
  "revised_fairness_score": 82 or null,
  "explanation": "plain language explanation for the complainer — empathetic but factual"
}

Return ONLY valid JSON.`;

      const parsed = await callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 4000,
        system: withLanguage(ASSIGNER_SYSTEM, req.body.userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
        messages: [{ role: 'user', content: prompt }]
      }, { label: 'roommate-court-3' });
      if (parsed.complaint_valid === undefined) {
        return res.status(500).json({ error: 'Could not deliver the verdict. Please try again.' });
      }
      return res.json(parsed);
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });

  } catch (error) {
    console.error('RoommateCourt error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
