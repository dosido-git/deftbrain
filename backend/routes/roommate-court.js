const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');
const { rateLimit } = require('../lib/rateLimiter');

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

router.post('/roommate-court', rateLimit(), async (req, res) => {
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

THEIR PERSPECTIVE (as stated by user):
${yourSide || 'Not provided'}

WHAT THE OTHER PERSON WOULD SAY:
${theirSide || 'Not provided'}

Analyze this dispute impartially. Remember: you're only hearing one side.

Return this exact JSON structure:
{
  "verdict": {
    "whos_right": "you | them | both | neither",
    "reasoning": "2-3 sentence plain language explanation of your ruling",
    "your_fault_pct": <number 0-100>,
    "their_fault_pct": <number 0-100>
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

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 2500,
        system: withLanguage(MEDIATOR_SYSTEM, req.body.userLanguage),
        messages: [{ role: 'user', content: prompt }]
      });

      const text = message.content.find(c => c.type === 'text')?.text || '';
      const cleaned = cleanJsonResponse(text);
      const parsed = JSON.parse(cleaned);
      return res.json(parsed);
    }

    // ── ASSIGN ──
    if (action === 'assign') {
      const { roommates, chores, history } = req.body;

      if (!roommates || roommates.length < 2) {
        return res.status(400).json({ error: 'Need at least 2 roommates' });
      }
      if (!chores || chores.length < 1) {
        return res.status(400).json({ error: 'Need at least 1 chore' });
      }

      let historyBlock = '';
      if (history && history.length > 0) {
        historyBlock = `\n\nASSIGNMENT HISTORY (most recent first):\n${history.map((round, i) => {
          const assignments = round.assignments.map(a =>
            `  ${a.roommate}: ${a.chores.map(ch => `${ch.name} (effort ${ch.effort})`).join(', ')}`
          ).join('\n');
          return `Round ${history.length - i} (${round.date}):\n${assignments}`;
        }).join('\n\n')}`;
      }

      const prompt = `HOUSEHOLD:
Roommates: ${roommates.join(', ')}
Chores to assign: ${chores.join(', ')}
${historyBlock}

Assign ALL chores to roommates. Balance total effort points fairly.${history?.length ? ' Use the history to correct any imbalances.' : ''}

Return this exact JSON structure:
{
  "assignments": [
    { "roommate": "Name", "chores": [{ "name": "Chore", "effort": 1-3 }] }
  ],
  "effort_totals": { "Name1": <total>, "Name2": <total> },
  "fairness_score": <50-100>,
  "reasoning": "2-3 sentences explaining why each person got what they got, citing history if available",
  "chore_weights": { "Chore1": 1-3, "Chore2": 1-3 }
}

Return ONLY valid JSON.`;

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        system: withLanguage(ASSIGNER_SYSTEM, req.body.userLanguage),
        messages: [{ role: 'user', content: prompt }]
      });

      const text = message.content.find(c => c.type === 'text')?.text || '';
      const cleaned = cleanJsonResponse(text);
      const parsed = JSON.parse(cleaned);
      return res.json(parsed);
    }

    // ── REBALANCE ──
    if (action === 'rebalance') {
      const { currentAssignments, complaint, history, roommates } = req.body;

      const prompt = `REBALANCE REQUEST:

Current assignments:
${currentAssignments.map(a =>
  `${a.roommate}: ${a.chores.map(ch => `${ch.name} (effort ${ch.effort})`).join(', ')}`
).join('\n')}

COMPLAINT: "${complaint}"

${history && history.length > 0 ? `HISTORY (last ${history.length} rounds):\n${history.map((round, i) => {
  const assignments = round.assignments.map(a =>
    `  ${a.roommate}: ${a.chores.map(ch => `${ch.name} (effort ${ch.effort})`).join(', ')}`
  ).join('\n');
  return `Round ${history.length - i} (${round.date}):\n${assignments}`;
}).join('\n\n')}` : 'No prior history available.'}

Evaluate this complaint against the data. Is it valid? If yes, provide revised assignments. If no, explain why with specific numbers.

Return this exact JSON structure:
{
  "complaint_valid": true | false,
  "analysis": "detailed analysis citing specific rounds and numbers from history",
  "revised_assignments": [{ "roommate": "Name", "chores": [{ "name": "Chore", "effort": 1-3 }] }] or null if complaint invalid,
  "revised_effort_totals": { "Name1": <total> } or null,
  "revised_fairness_score": <number> or null,
  "explanation": "plain language explanation for the complainer — empathetic but factual"
}

Return ONLY valid JSON.`;

      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        system: withLanguage(ASSIGNER_SYSTEM, req.body.userLanguage),
        messages: [{ role: 'user', content: prompt }]
      });

      const text = message.content.find(c => c.type === 'text')?.text || '';
      const cleaned = cleanJsonResponse(text);
      const parsed = JSON.parse(cleaned);
      return res.json(parsed);
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });

  } catch (error) {
    console.error('RoommateCourt error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
