const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ═══════════════════════════════════════════════════════════════
// MAIN ANALYSIS
// ═══════════════════════════════════════════════════════════════

router.post('/conflict-coach', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  console.log('✅ Conflict Coach V3 endpoint called');
  try {
    const { receivedMessage, relationship, emotionalState, goals, userDraft, actualGoal, isThread, personLabel, userLanguage } = req.body;

    if (!receivedMessage || receivedMessage.trim().length < 10) {
      return res.status(400).json({ error: 'Please provide the message (at least 10 characters)' });
    }

    const emotionsText = emotionalState?.length > 0 ? emotionalState.join(', ') : 'not specified';
    const goalsText = goals?.length > 0 ? goals.map(g => g.replace(/_/g, ' ')).join(', ') : 'respond thoughtfully';

    const systemPrompt = withLanguage(
      'You are an expert conflict resolution coach with deep knowledge of manipulation tactics, attachment theory, and de-escalation. Return only valid JSON.',
      userLanguage
    );

    const prompt = `Expert conflict resolution coach. Analyze this ${isThread ? 'conversation thread' : 'message'} and prevent reactive texting.

${isThread ? 'CONVERSATION THREAD' : 'MESSAGE RECEIVED'}:
"${receivedMessage}"
${personLabel ? `Person: ${personLabel}` : ''}

CONTEXT:
Relationship: ${relationship}
Current emotions: ${emotionsText}
Goals: ${goalsText}
${actualGoal ? `Desired outcome: "${actualGoal}"` : ''}
${userDraft ? `\n⚠️ REACTIVE DRAFT they want to send: "${userDraft}"` : ''}

MANIPULATION DETECTION (CRITICAL — analyze the INCOMING message for these):
Scan for: gaslighting ("that never happened", "you're imagining things"), DARVO (deny-attack-reverse victim/offender), guilt-tripping ("after everything I've done"), stonewalling threats ("fine, I just won't talk"), passive aggression, love-bombing after conflict, false equivalence ("you do it too"), blame-shifting, silent treatment threats, catastrophizing ("you ALWAYS/NEVER"), weaponized vulnerability ("I guess I'm just a terrible person"), triangulation ("everyone agrees with me"), dismissiveness ("you're overreacting"), financial/emotional threats.
If tactics found, name them clearly with the exact phrase that triggered detection and a healthy counter-response.

ENHANCED LANDMINE DETECTION:
- Phrase landmines: specific words/phrases that will escalate THIS situation
- Timing landmines: "don't respond while driving", "not at 2am", "not right after work"
- Channel landmines: "this conversation shouldn't happen over text", "call instead", "wait for in-person"

${userDraft ? `DRAFT ANALYSIS: "${userDraft}"\nDetect: angry tone, sarcasm, passive-aggression, generalizations (always/never), counter-accusations, dismissiveness, escalation signals.` : ''}

RELATIONSHIP RULES:
${relationship === 'Partner' ? 'Partner: high stakes. Repair crucial. No "winning." Long-term health.' : ''}
${relationship === 'Ex' ? 'Ex: minimize contact. Gray rock. Ask: "Do I need to respond at all?"' : ''}
${relationship === 'Family' ? "Family: can't exit. Boundaries essential. Consider therapy for chronic patterns." : ''}
${relationship === 'Coworker' ? 'Coworker: professional. Document if needed. No personal attacks.' : ''}

Return ONLY valid JSON:
{
  "message_analysis": {
    "emotional_temperature": "high/medium/low",
    "primary_emotion_detected": "...",
    "triggers_identified": ["exact phrases"],
    "communication_style": "attacking/passive-aggressive/direct/emotional/manipulative",
    "underlying_need": "..."
  },
  "manipulation_tactics": [
    {
      "tactic": "Name (e.g. Gaslighting, DARVO, Guilt-Tripping)",
      "icon": "emoji",
      "description": "What they're doing and why it's problematic",
      "example_phrase": "Exact quote from their message",
      "healthy_response": "How to counter this without escalating"
    }
  ],
  "goal_reality_check": {
    "assessment": "...",
    "will_this_message_achieve_it": true,
    "alternative_approach": "..."
  },
  "draft_analysis": {
    "tone_flags": [{"flag": "...", "why_problematic": "..."}],
    "problematic_phrases": [{"phrase": "...", "issue": "...", "better_version": "..."}],
    "escalation_risk": {"level": "low/medium/high/extreme", "why": "..."},
    "overall_assessment": "..."
  },
  "response_strategies": [
    {
      "strategy": "Name",
      "response_text": "Actual message to send",
      "tone": "calm/firm/compassionate",
      "what_this_does": "...",
      "risks": "..."
    }
  ],
  "apology_assessment": {
    "is_apology_appropriate": true,
    "reasoning": "...",
    "suggested_apology": "..."
  },
  "what_NOT_to_say": [{"phrase": "...", "why_avoid": "..."}],
  "timing_landmines": ["Don't respond while X", "Wait until Y"],
  "channel_landmines": ["This needs a phone call", "Wait for face-to-face"],
  "if_they_continue_escalating": {"script": "...", "then_what": "..."},
  "repair_strategy_later": "...",
  "cooling_recommendation": {"mandatory_delay": true, "delay_time": "...", "why_delay": "..."}
}

RULES:
1. manipulation_tactics: ALWAYS analyze incoming message. Return [] only if genuinely no tactics detected.
2. If draft provided, analyze BRUTALLY HONESTLY
3. High emotions = recommend mandatory delay
4. Generate 3-5 response strategies, all de-escalating
5. what_NOT_to_say: 3-5 specific phrases personalized to THIS conflict
6. timing_landmines + channel_landmines: always include at least 1-2 each
7. Protect the relationship over being "right"`;

    const parsed = await callClaudeWithRetry(
      prompt,
      {
        label: 'conflict-coach',
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3500,
        system: systemPrompt,
      }
    );

    console.log('✅ V3 Analysis:', {
      temperature: parsed.message_analysis?.emotional_temperature,
      manipulationCount: parsed.manipulation_tactics?.length || 0,
      strategies: parsed.response_strategies?.length || 0,
      landmines: parsed.what_NOT_to_say?.length || 0,
    });

    res.json(parsed);
  } catch (error) {
    console.error('❌ Conflict Coach V3 error:', error.message);
    res.status(500).json({ error: 'Failed to analyze. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// FOLLOW-UP COACHING
// ═══════════════════════════════════════════════════════════════

router.post('/conflict-coach/followup', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  console.log('✅ Conflict Coach Follow-Up called');
  try {
    const { question, originalAnalysis, relationship, receivedMessage, actualGoal, personLabel, userLanguage } = req.body;

    if (!question?.trim()) return res.status(400).json({ error: 'Please provide a question.' });
    if (!originalAnalysis) return res.status(400).json({ error: 'No analysis context. Run analysis first.' });

    const ctx = [];
    ctx.push(`Relationship: ${relationship || 'Unknown'}${personLabel ? ` (${personLabel})` : ''}`);
    ctx.push(`Original message: ${receivedMessage?.slice(0, 200) || 'Not provided'}`);
    if (actualGoal) ctx.push(`Goal: ${actualGoal}`);
    if (originalAnalysis.message_analysis) {
      ctx.push(`Temperature: ${originalAnalysis.message_analysis.emotional_temperature}`);
      ctx.push(`Their emotion: ${originalAnalysis.message_analysis.primary_emotion_detected}`);
    }
    if (originalAnalysis.manipulation_tactics?.length) {
      ctx.push(`Manipulation detected: ${originalAnalysis.manipulation_tactics.map(t => t.tactic).join(', ')}`);
    }
    if (originalAnalysis.response_strategies?.length) {
      ctx.push(`Strategies suggested: ${originalAnalysis.response_strategies.map(s => s.strategy).join(', ')}`);
    }

    const systemPrompt = withLanguage(
      `You are an expert conflict resolution coach. A user already received an analysis and has a follow-up question.

ORIGINAL CONTEXT:
${ctx.join('\n')}

Answer the follow-up based on full context. Be specific, practical, warm but honest.
- If they share a new response from the other person, analyze it for manipulation and suggest next steps.
- If they ask about a specific scenario, give concrete advice.
- If they're spiraling, help ground them.
- Keep to 2-4 paragraphs. Stay de-escalating.

Return ONLY valid JSON: {"answer": "Your full coaching response here"}`,
      userLanguage
    );

    const parsed = await callClaudeWithRetry(
      question.trim(),
      {
        label: 'conflict-coach-followup',
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        system: systemPrompt,
      }
    );

    console.log('✅ Follow-up answered');
    res.json({ answer: parsed.answer || 'No answer available.' });
  } catch (error) {
    console.error('❌ Follow-up error:', error.message);
    res.status(500).json({ error: 'Failed to answer follow-up.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// TONE ADJUSTMENT
// ═══════════════════════════════════════════════════════════════

router.post('/conflict-coach/adjust-tone', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  console.log('✅ Conflict Coach Tone Adjust called');
  try {
    const { originalResponse, originalStrategy, toneLevel, relationship, receivedMessage, actualGoal, userLanguage } = req.body;

    if (!originalResponse) return res.status(400).json({ error: 'No response to adjust.' });

    const toneDescription = toneLevel <= 20 ? 'very gentle, soft, empathetic, prioritizing warmth over directness'
      : toneLevel <= 40 ? 'gentle and warm, but with clear intent'
      : toneLevel <= 60 ? 'balanced — direct but compassionate'
      : toneLevel <= 80 ? 'firm and clear, with minimal softening'
      : 'very firm, direct, no-nonsense, clear boundaries with zero ambiguity';

    const systemPrompt = withLanguage(
      `You are a conflict resolution expert. Rewrite this response at the requested tone level while keeping the same intent and strategy.

Original strategy: ${originalStrategy}
Original: "${originalResponse}"
Relationship: ${relationship}
${actualGoal ? `Goal: ${actualGoal}` : ''}
Context (their message): "${receivedMessage?.slice(0, 200) || ''}"

Tone target: ${toneLevel}/100 (${toneDescription})

Return ONLY valid JSON:
{
  "adjusted_text": "The rewritten response",
  "tone_note": "Brief note on what changed and why this tone level works/risks for this situation"
}`,
      userLanguage
    );

    const parsed = await callClaudeWithRetry(
      `Rewrite at tone level ${toneLevel}/100.`,
      {
        label: 'conflict-coach-tone',
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        system: systemPrompt,
      }
    );

    console.log('✅ Tone adjusted:', { toneLevel, length: parsed.adjusted_text?.length });
    res.json(parsed);
  } catch (error) {
    console.error('❌ Tone adjust error:', error.message);
    res.status(500).json({ error: 'Failed to adjust tone.' });
  }
});

module.exports = router;
