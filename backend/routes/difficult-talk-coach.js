const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');

// ═══════════════════════════════════════════════════
// ROUTE 1: MAIN REHEARSAL — Strategy & Scripts
// ═══════════════════════════════════════════════════
router.post('/difficult-talk-coach', async (req, res) => {
  try {
    const {
      topic,
      relationship,
      communicationStyle,
      resistanceLevel,
      goals,
      fears,
      biggestFear,
      theirPerspective,
      previousAttempts,
      userLanguage,
    } = req.body;

    if (!topic || !topic.trim()) {
      return res.status(400).json({ error: 'Topic is required' });
    }
    if (!relationship) {
      return res.status(400).json({ error: 'Relationship is required' });
    }
    if (!goals || goals.length === 0) {
      return res.status(400).json({ error: 'At least one goal is required' });
    }

    const goalsList = goals.map(g => {
      const goalMap = {
        setBoundary: 'set a boundary',
        requestChange: 'request a change',
        addressConflict: 'address a conflict',
        giveFeedback: 'give feedback',
        askForSomething: 'ask for something',
        endRelationship: 'end or step back from the relationship',
        apologize: 'deliver a genuine apology',
        sayNo: 'say no to a request',
        addressDisrespect: 'address disrespect or mistreatment',
        pushBack: 'push back on an unreasonable demand',
        declineNoExplain: 'decline without owing an explanation',
      };
      return goalMap[g] || g;
    }).join(', ');

    const prompt = `You are an expert communication coach and conflict resolution specialist who has guided thousands of people through difficult conversations. You combine emotional intelligence, negotiation psychology, and practical conversation strategy.

═══════════════════════════════════════════════
CONVERSATION CONTEXT
═══════════════════════════════════════════════

TOPIC: ${topic}
RELATIONSHIP: ${relationship}
COMMUNICATION STYLE PREFERENCE: ${communicationStyle || 'Direct'}
EXPECTED RESISTANCE LEVEL: ${resistanceLevel || 50}/100
GOALS: ${goalsList}
BIGGEST FEAR: ${biggestFear || 'Not specified'}
SPECIFIC FEARS: ${fears?.length > 0 ? fears.join(', ') : 'None selected'}
THEIR LIKELY PERSPECTIVE: ${theirPerspective || 'Not specified'}
PREVIOUS ATTEMPTS: ${previousAttempts || 'None — this is the first time raising it'}

═══════════════════════════════════════════════
ANALYSIS INSTRUCTIONS
═══════════════════════════════════════════════

STEP 1 — SITUATION READING
Analyze the power dynamics, emotional stakes, and likely conversation trajectory. Consider:
- What does this person likely VALUE in this relationship?
- What is their likely emotional state when this topic comes up?
- What defense mechanisms will they probably activate? (denial, deflection, counter-attack, withdrawal, tears, guilt-tripping)
- What is the realistic best-case outcome? What is the realistic floor?

STEP 2 — EMOTIONAL LANDMINE MAPPING
Based on the topic, relationship, and the user's stated fear, identify the 3-5 moments in the conversation most likely to derail the user emotionally. For each:
- What might the other person say or do?
- What emotional reaction it will trigger in the user (shame, rage, guilt, freeze, tears, capitulation)
- What the instinctive (bad) response would be
- What the strategic (good) response is, and why it works

STEP 3 — CONVERSATION APPROACHES
Generate 3 distinct approaches. Each should be FULLY ADAPTED to this specific relationship, topic, and power dynamic. Do NOT use generic advice — every word should reflect the specific situation described.

Each approach must include:
- A complete opening (the exact first 2-3 sentences — this is the hardest part)
- 3-4 main points to cover, in order of importance
- Specific phrases calibrated to this relationship (not generic I-statements)
- A closing that locks in next steps or agreement
- 5-8 anticipated responses from the other person with strategic counters
- What NOT to say (specific to this situation)

STEP 4 — BODY LANGUAGE & DELIVERY
Provide body language and tone guidance SPECIFIC to this relationship and setting. A conversation with a boss requires different physical presence than with a spouse. An assertive boundary-setting conversation requires different energy than a vulnerable apology. Tailor everything.

STEP 5 — DE-ESCALATION TOOLKIT
Provide de-escalation strategies SPECIFIC to the likely defense mechanisms you identified. If this person is likely to cry, the de-escalation is different than if they're likely to get angry or go silent.

STEP 6 — PREPARATION PLAN
Give a concrete preparation plan: what to do in the hour before, how to set up the conversation (timing, location, framing), and what to have ready.

STEP 7 — VALIDATION & REALITY CHECK
Write 2-3 sentences affirming that what the user is asking for is reasonable. Reference their specific situation. Then write a reality check: prepare them for the other person's likely reaction (especially connected to their stated fears). Normalize that reaction and remind them it doesn't mean they're wrong.

STEP 8 — FIRMNESS-LEVEL MESSAGES
Generate 3 complete, copy-paste ready messages at different firmness levels. These are DIFFERENT from the conversation approaches — approaches are strategic frameworks, these are complete standalone messages the user can send verbatim.
- Gentle: Warm, acknowledges their perspective, clear about the need. Best for first attempts.
- Balanced (RECOMMENDED): Direct, respectful, no apologies. No softening.
- Firm: Unambiguous. Includes consequences if boundary isn't respected. Non-negotiable.
CRITICAL: Remove ALL apologetic qualifiers from each message. Track what was removed in a "removes" array. Messages should be STATEMENTS not questions.

STEP 9 — PUSHBACK SCRIPTS BY REACTION TYPE
Generate standalone scripts organized by how the other person might react: guilt_trip, anger, negotiation, silent_treatment, deflection. Each script is 1-2 sentences the user can say verbatim regardless of which approach they chose. These restate the boundary without re-explaining or defending.

STEP 10 — FOLLOW-UP GUIDANCE
Write 2-3 sentences about what to do after the conversation: don't re-explain or soften if they push back, restate once then disengage, and any situation-specific advice.

═══════════════════════════════════════════════
OUTPUT FORMAT — Return ONLY valid JSON
═══════════════════════════════════════════════

{
  "situation_reading": {
    "their_likely_mindset": "What the other person is probably thinking/feeling about this topic",
    "defense_mechanisms": ["The 2-3 defense mechanisms they'll likely use"],
    "realistic_best_case": "What success actually looks like for this conversation",
    "realistic_floor": "What the minimum acceptable outcome is — know this going in",
    "key_insight": "The single most important thing to understand about this conversation"
  },

  "emotional_landmines": [
    {
      "they_might": "What they might say or do that will hit hardest",
      "your_trigger": "The emotional reaction this will cause (shame, rage, guilt, freeze, etc.)",
      "instinct_response": "What you'll WANT to say/do in that moment (the bad reaction)",
      "strategic_response": "What to actually say/do instead",
      "why_it_works": "Why the strategic response is more effective"
    }
  ],

  "conversation_approaches": [
    {
      "approach_name": "Name",
      "when_to_use": "Specific scenario when this approach is best",
      "tone": "Tone description",
      "script": {
        "opening": "The exact first 2-3 sentences to say. This is the hardest part — make it specific and natural, not robotic.",
        "main_points": ["Point 1 — the exact words, not a summary", "Point 2", "Point 3"],
        "specific_phrases": ["Ready-to-use phrases for key moments"],
        "closing": "How to close — locking in agreement or next steps"
      },
      "anticipated_responses": [
        {
          "they_might_say": "A likely response from them",
          "emotional_danger": "What this might trigger in you",
          "you_could_say": "Strategic counter-response",
          "goal_of_response": "What this response accomplishes"
        }
      ],
      "what_NOT_to_say": ["Specific phrases to avoid in this situation and why"],
      "body_language": ["2-3 physical presence tips specific to this approach"]
    }
  ],

  "body_language_guidance": {
    "before_conversation": "How to physically prepare (posture, breathing, positioning) specific to this setting",
    "during_conversation": "Physical presence advice specific to this relationship dynamic",
    "if_tension_rises": "What to do with your body when things get heated",
    "mirroring_tip": "A specific mirroring or attunement technique for this relationship"
  },

  "deescalation_toolkit": {
    "for_their_likely_defense": "Specific strategies for the defense mechanisms you predicted — not generic phrases",
    "tension_lowering_phrases": ["4-5 phrases calibrated to this specific relationship and topic"],
    "pause_strategies": ["2-3 ways to take a break without it feeling like abandonment or avoidance"],
    "if_they_shut_down": "What to do if they go completely silent or refuse to engage",
    "if_they_escalate": "What to do if they raise their voice, attack, or get aggressive",
    "exit_protocol": "When to end the conversation and exactly how to do it gracefully"
  },

  "preparation_plan": {
    "one_hour_before": "What to do in the hour before the conversation",
    "setting_the_stage": "How to initiate — timing, location, and framing the conversation opener",
    "grounding_technique": "A specific grounding technique to use right before and during",
    "have_ready": ["Things to have prepared or on hand"],
    "mindset_anchor": "A single sentence to repeat to yourself if you start losing your center"
  },

  "follow_up_plan": {
    "if_it_goes_well": "What to do in the 24-48 hours after a successful conversation",
    "if_it_goes_poorly": "What to do if the conversation goes badly or is unresolved",
    "if_they_need_time": "What to do if they ask for space to process"
  },

  "confidence_note": "A brief, honest, non-patronizing note of encouragement specific to this situation",

  "validation": "2-3 sentences affirming that what the user is asking for is reasonable. Be specific to their situation. Don't be generic — reference their actual scenario.",

  "reality_check": "1-2 sentences preparing them for the other person's likely reaction, based on their fears. Normalize that reaction and remind them it doesn't make them wrong.",

  "firmness_messages": [
    {
      "level": "gentle",
      "label": "Gentle but Clear",
      "text": "The actual message they can copy-paste. Warm but unambiguous.",
      "what_this_does": "One sentence explaining the approach",
      "removes": ["List of apologetic phrases this version removes", "e.g. 'I'm sorry but'", "'If it's not too much trouble'"]
    },
    {
      "level": "balanced",
      "label": "Balanced Assertiveness",
      "text": "Direct, respectful, no apologies. This is the recommended default.",
      "what_this_does": "One sentence explaining the approach",
      "removes": ["Apologetic phrases removed from this version"]
    },
    {
      "level": "firm",
      "label": "Very Firm",
      "text": "Unambiguous. Includes consequence if boundary isn't respected.",
      "what_this_does": "One sentence explaining the approach",
      "removes": ["All softening language removed"]
    }
  ],

  "pushback_scripts": {
    "guilt_trip": "If they guilt-trip you, say: '[exact script]'",
    "anger": "If they get angry, say: '[exact script]'",
    "negotiation": "If they try to negotiate, say: '[exact script]'",
    "silent_treatment": "If they go silent, say: '[exact script]'",
    "deflection": "If they deflect or change the subject, say: '[exact script]'"
  },

  "follow_up_guidance": "2-3 sentences about what to do after the conversation: don't re-explain or soften if they push back, restate once then disengage, and any situation-specific advice.",

  "reassurance_badges": ["This is reasonable", "You're not being mean", "Their discomfort ≠ you're wrong"]
}

═══════════════════════════════════════════════
CRITICAL RULES
═══════════════════════════════════════════════

1. SPECIFICITY: Every piece of advice must be tailored to THIS topic, THIS relationship, THIS power dynamic. If you could copy-paste your advice to a different situation and it would still work, it's too generic. Make it specific.

2. REALISTIC SCRIPTS: The opening lines and phrases should sound like things a real human would actually say in conversation — not therapy-speak, not corporate HR language. Natural, specific, authentic.

3. ANTICIPATED RESPONSES: This is the most valuable section. Generate 5-8 per approach. Include the responses the user is AFRAID of (the ones connected to their stated fears), not just easy softballs.

4. EMOTIONAL HONESTY: If the user's situation is one where the conversation is likely to go badly no matter what, say so. If their goals are unrealistic, gently recalibrate. Don't promise good outcomes — promise the user is doing the right thing by having the conversation.

5. NO GENERIC FILLER: Body language advice like "maintain eye contact" and "keep arms uncrossed" adds no value. Tell them something specific to their situation.

6. FIRMNESS MESSAGES: These must be complete, standalone messages the user can literally copy-paste and send. They are different from the conversation approaches. Remove ALL apologetic qualifiers: "I'm sorry but", "If it's okay", "I hate to ask", "I don't want to be difficult", "Maybe", "Kind of". Track what was removed in the "removes" array.

7. PUSHBACK SCRIPTS: Write response scripts for each reaction type. Each should be 1-2 sentences the user can say verbatim. Scripts should restate the boundary without re-explaining or defending.

8. REASSURANCE BADGES: Generate 3 short affirmation phrases (5-8 words each) specific to this situation. These are small psychological anchors the user can refer back to.

6. Return ONLY the JSON object. No markdown, no preamble.`;

    const systemPrompt = withLanguage(
      'You are an expert communication coach and conflict resolution specialist. Return ONLY valid JSON matching the exact schema requested. No markdown, no preamble.',
      userLanguage
    );

    const parsed = await callClaudeWithRetry(prompt, {
      label: 'DifficultTalkCoach',
      max_tokens: 10000,
      system: systemPrompt,
    });

    res.json(parsed);

  } catch (error) {
    console.error('[DifficultTalkCoach] Error:', error);
    res.status(500).json({ error: 'Failed to generate conversation strategy', details: error.message });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 2: PRACTICE SIMULATION — Interactive rehearsal
// ═══════════════════════════════════════════════════
router.post('/difficult-talk-simulate', async (req, res) => {
  try {
    const {
      topic,
      relationship,
      resistanceLevel,
      theirPerspective,
      conversationHistory,
      userMessage,
      chosenApproach,
      emotionalLandmines,
      currentOpenness,
      userLanguage,
    } = req.body;

    if (!userMessage || !userMessage.trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const historyText = (conversationHistory || [])
      .map(msg => `${msg.role === 'user' ? 'YOU' : 'THEM'}: ${msg.content}`)
      .join('\n');

    // Build strategy context so coaching can reference the prepared material
    let strategyContext = '';
    if (chosenApproach) {
      strategyContext = `
STRATEGY THE USER PREPARED:
- Approach: "${chosenApproach.approach_name}"
- Planned opening: "${chosenApproach.script?.opening || 'N/A'}"
- Key phrases they were coached to use: ${(chosenApproach.script?.specific_phrases || []).slice(0, 3).map(p => `"${p}"`).join(', ')}
- Things they were told NOT to say: ${(chosenApproach.what_NOT_to_say || []).slice(0, 3).join(', ')}`;
    }
    if (emotionalLandmines?.length > 0) {
      strategyContext += `
EMOTIONAL LANDMINES IDENTIFIED: ${emotionalLandmines.slice(0, 3).map(lm => `"${lm.they_might}" (trigger: ${lm.your_trigger})`).join('; ')}`;
    }

    const prompt = withLanguage(`You are simulating a difficult conversation as a practice partner. You are playing the role of the OTHER PERSON in this conversation.

CONTEXT:
- Topic being discussed: ${topic}
- Your relationship to the speaker: ${relationship} (you are the ${relationship})
- Your resistance level: ${resistanceLevel || 50}/100 (how resistant you are to what they want)
- Your perspective: ${theirPerspective || 'Not specified — infer a realistic perspective based on the topic'}
- Your current openness level: ${currentOpenness ?? 50}/100 (how receptive you currently are based on how the conversation has gone so far)
${strategyContext}

CONVERSATION SO FAR:
${historyText || '(This is the start of the conversation)'}

THEY JUST SAID: "${userMessage}"

═══════════════════════════════════════════════
YOUR INSTRUCTIONS
═══════════════════════════════════════════════

1. Respond IN CHARACTER as the other person. Be realistic — not a pushover, not a villain. React the way a real person in this role would actually react, calibrated to the resistance level.

2. At resistance 20-40: You're somewhat receptive but have concerns. You listen but push back mildly.
   At resistance 50-70: You're defensive. You may deflect, minimize, or counter-argue. But you're not unreasonable.
   At resistance 80-100: You're highly resistant. You may get angry, shut down, guilt-trip, or refuse to engage. The user needs to work hard.

3. React to HOW they said it, not just what. If they used an accusation, react to feeling attacked. If they used an I-statement, be slightly more receptive. If they were vague, express confusion.

4. OPENNESS EVOLUTION: Your openness level should SHIFT based on cumulative conversation quality. If the user has been consistently empathetic and strategic, increase openness. If they've been accusatory or dismissive, decrease it. Openness should move gradually (±5-15 per turn), not jump wildly. The current value is ${currentOpenness ?? 50}.

5. After your in-character response, provide a brief coaching note. If the user has a prepared strategy, reference it — e.g. "Good — you used your planned opening" or "You drifted from your prepared approach here — remember your key phrase about..."

Return ONLY this JSON:

{
  "their_response": "What the other person would realistically say in response. Stay in character. 1-3 sentences, natural dialogue — not a speech.",
  "their_emotional_state": "What the other person is feeling right now (1-3 words)",
  "coaching_note": "Brief coaching feedback on what the user did well or could improve. Reference their prepared strategy when relevant. 1-2 sentences max.",
  "suggestion": "If applicable: a better way they could have phrased what they just said — ideally drawn from their prepared key phrases. Null if what they said was effective.",
  "conversation_health": "on_track | drifting | derailing — assessment of how the conversation is going",
  "openness_shift": "Number from -15 to +15 indicating how much more open (+) or closed (-) the other person became from this exchange. Positive means the user did well.",
  "openness_reason": "One sentence explaining why openness shifted — e.g., 'Your I-statement made them feel heard' or 'The accusation triggered defensiveness'",
  "technique_used": "Name of the communication technique the user employed (or failed to employ) — e.g., 'I-statement', 'active listening', 'boundary setting', 'deflection', 'accusation', 'validation', 'none detected'"
}

RULES:
- Stay in character. You ARE this person.
- Be realistic, not theatrical. Real people don't monologue.
- Keep responses to 1-3 sentences. Real conversation is short exchanges.
- The coaching note should be honest but constructive — don't sugarcoat but don't be harsh.
- Return ONLY JSON.`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, {
      label: 'DifficultTalkSimulate',
      max_tokens: 1000,
    });

    res.json(parsed);

  } catch (error) {
    console.error('[DifficultTalkSimulate] Error:', error);
    res.status(500).json({ error: 'Failed to simulate response', details: error.message });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 3: POST-CONVERSATION DEBRIEF
// ═══════════════════════════════════════════════════
router.post('/difficult-talk-debrief', async (req, res) => {
  try {
    const {
      originalTopic,
      relationship,
      howItWent,
      originalStrategy,
      practiceTranscript,
      userLanguage,
    } = req.body;

    if (!howItWent?.trim() && !practiceTranscript) {
      return res.status(400).json({ error: 'Description of how it went or practice transcript is required' });
    }

    const strategyContext = originalStrategy
      ? `\nORIGINAL STRATEGY USED: The user prepared using the "${originalStrategy.approach_name || 'unknown'}" approach. Their planned opening was: "${originalStrategy.script?.opening || 'not recorded'}". Their goals were to achieve a realistic outcome.`
      : '';

    // If practice transcript is provided, build it into the debrief
    let practiceContext = '';
    if (practiceTranscript?.length > 0) {
      practiceContext = `\n\nPRACTICE SESSION TRANSCRIPT (the user rehearsed before the real conversation):\n${
        practiceTranscript.map(msg => {
          if (msg.role === 'user') return `USER SAID: "${msg.content}"`;
          if (msg.role === 'them') return `THEM (simulated): "${msg.content}" [emotional state: ${msg.emotionalState || 'unknown'}, health: ${msg.health || 'unknown'}]${msg.coaching ? `\n  COACH NOTE: ${msg.coaching}` : ''}`;
          return '';
        }).filter(Boolean).join('\n')
      }`;
    }

    const prompt = withLanguage(`You are a compassionate communication coach helping someone process a difficult conversation they just had.

ORIGINAL TOPIC: ${originalTopic || 'Not specified'}
RELATIONSHIP: ${relationship || 'Not specified'}
${strategyContext}
${practiceContext}

${practiceTranscript ? 'THE USER IS DEBRIEFING THEIR PRACTICE SESSION (not a real conversation). Analyze their practice performance and give them constructive feedback to improve before the real conversation.' : `WHAT ACTUALLY HAPPENED: ${howItWent}`}

═══════════════════════════════════════════════
ANALYSIS INSTRUCTIONS
═══════════════════════════════════════════════

Provide a thorough, honest, compassionate debrief. Compare what happened to what was planned (if strategy context is available). Identify specific moments that went well or could improve. Be constructive, not critical.

Return ONLY this JSON:

{
  "overall_assessment": "A brief, honest summary of how the conversation went — not sugarcoated, but kind",

  "what_went_well": [
    {
      "moment": "A specific thing they did well",
      "why_it_worked": "Why this was effective"
    }
  ],

  "growth_areas": [
    {
      "moment": "A specific moment that could have gone better",
      "what_happened": "What they did or said",
      "alternative": "What might have been more effective and why",
      "difficulty": "easy | moderate | advanced — how hard this skill is to develop"
    }
  ],

  "plan_vs_reality": "If strategy context available: how did the actual conversation compare to the plan? What surprised them? This helps build self-awareness for next time. If no strategy context, set to null.",

  "their_patterns": "Any communication patterns you notice from their description — things they tend to do under pressure (over-apologize, get defensive, shut down, ramble, etc.). Be gentle but honest.",

  "emotional_processing": "Validate their feelings. Normalize the difficulty. Put the outcome in perspective. Remind them that having the conversation took courage. Be genuine, not patronizing.",

  "follow_up": {
    "timing": "When to follow up with the other person",
    "what_to_say": "A specific follow-up message or conversation starter",
    "if_unresolved": "What to do if the core issue is still unresolved"
  },

  "next_time": [
    "1-2 specific things to practice or do differently in the next difficult conversation — based on patterns observed"
  ]
}

Return ONLY JSON. No markdown, no preamble.`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, {
      label: 'DifficultTalkDebrief',
      max_tokens: 3000,
      system: 'You are a compassionate communication coach. Return ONLY valid JSON matching the exact schema requested. No markdown, no preamble.',
    });

    res.json(parsed);

  } catch (error) {
    console.error('[DifficultTalkDebrief] Error:', error);
    res.status(500).json({ error: 'Failed to generate debrief', details: error.message });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 4: PRACTICE SESSION SUMMARY — Readiness Score
// ═══════════════════════════════════════════════════
router.post('/difficult-talk-practice-summary', async (req, res) => {
  try {
    const {
      topic,
      relationship,
      resistanceLevel,
      chosenApproach,
      emotionalLandmines,
      transcript,
      userLanguage,
    } = req.body;

    if (!transcript || transcript.length < 2) {
      return res.status(400).json({ error: 'Need at least one exchange to summarize' });
    }

    const transcriptText = transcript.map(msg => {
      if (msg.role === 'user') return `USER: "${msg.content}"`;
      if (msg.role === 'them') return `THEM: "${msg.content}" [emotional: ${msg.emotionalState || '?'}, health: ${msg.health || '?'}, openness_shift: ${msg.openness_shift || 0}, technique: ${msg.technique_used || 'unknown'}]${msg.coaching ? `\n  COACH: ${msg.coaching}` : ''}${msg.suggestion ? `\n  SUGGESTED INSTEAD: "${msg.suggestion}"` : ''}`;
      return '';
    }).filter(Boolean).join('\n');

    const approachContext = chosenApproach
      ? `PREPARED APPROACH: "${chosenApproach.approach_name}"
PLANNED OPENING: "${chosenApproach.script?.opening || 'N/A'}"
KEY PHRASES TO USE: ${(chosenApproach.script?.specific_phrases || []).slice(0, 5).map(p => `"${p}"`).join(', ')}
THINGS NOT TO SAY: ${(chosenApproach.what_NOT_to_say || []).slice(0, 4).join(', ')}`
      : 'No prepared approach — user was freestyling.';

    const landmineContext = emotionalLandmines?.length > 0
      ? `EMOTIONAL LANDMINES TO WATCH FOR:\n${emotionalLandmines.map(lm => `- "${lm.they_might}" (trigger: ${lm.your_trigger}, strategic response: "${lm.strategic_response}")`).join('\n')}`
      : '';

    const prompt = withLanguage(`You are an expert communication coach scoring a practice session. Analyze this rehearsal transcript and provide a thorough assessment.

CONTEXT:
- Topic: ${topic}
- Relationship: ${relationship}
- Resistance level: ${resistanceLevel}/100
${approachContext}
${landmineContext}

PRACTICE TRANSCRIPT:
${transcriptText}

═══════════════════════════════════════════════
Analyze the full practice session and return ONLY valid JSON:

{
  "readiness_score": 7,
  "readiness_label": "Ready with caveats | Not quite ready | Well prepared | Needs more practice",
  "overall_assessment": "2-3 sentence honest assessment of how the practice went. Be encouraging but truthful.",

  "strategy_adherence": {
    "used_prepared_opening": true,
    "key_phrases_used": ["Which prepared phrases the user actually used in the practice"],
    "key_phrases_missed": ["Which prepared phrases would have helped but weren't used"],
    "avoided_forbidden_phrases": true,
    "forbidden_phrases_used": ["Any 'don't say' items they actually said"],
    "adherence_note": "Brief assessment of how well they followed their strategy"
  },

  "strengths": [
    {
      "moment": "Specific quote or moment from the transcript",
      "technique": "What communication technique they used",
      "impact": "What effect it had on the conversation"
    }
  ],

  "stumbles": [
    {
      "moment": "Specific quote or moment where they struggled",
      "what_happened": "What they did and why it was suboptimal",
      "better_approach": "What they could have said instead, ideally from their prepared phrases",
      "severity": "minor | moderate | significant"
    }
  ],

  "landmine_navigation": [
    {
      "landmine": "Which emotional landmine was triggered (if any)",
      "navigated": true,
      "how": "How they handled it — or how they fell into it"
    }
  ],

  "conversation_arc": {
    "opening": "strong | adequate | weak — how they opened",
    "middle": "maintained | drifted | lost — whether they stayed on track",
    "closing": "strong | adequate | weak | no_closing — how they wrapped up",
    "health_trajectory": "improved | stable | declined — overall direction of conversation health across the session"
  },

  "techniques_demonstrated": ["List of communication techniques the user successfully used across the session"],
  "techniques_to_practice": ["Specific techniques they should work on before the real conversation"],

  "retry_suggestions": {
    "same_difficulty": "What to focus on if practicing again at the same level",
    "higher_difficulty": "What to prepare for at higher resistance",
    "specific_moment": "The single exchange they should redo — quote it and explain the better approach"
  },

  "readiness_breakdown": {
    "opening_readiness": 8,
    "handling_pushback": 6,
    "emotional_regulation": 7,
    "staying_on_topic": 8,
    "closing_and_next_steps": 5
  }
}

SCORING GUIDE (readiness_score):
- 1-3: Needs significant practice. Multiple derailing moments, didn't use strategy, lost emotional control.
- 4-5: Getting there. Some good moments but inconsistent. Key skills need work.
- 6-7: Reasonably ready. Solid foundation with a few areas to polish.
- 8-9: Well prepared. Minor refinements only.
- 10: Exceptional. Handled everything including unexpected challenges.

Be honest — don't inflate scores. A score of 6-7 for a first practice is very good.
Return ONLY JSON.`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, {
      label: 'DifficultTalkPracticeSummary',
      max_tokens: 4000,
      system: withLanguage('You are an expert communication coach. Return ONLY valid JSON. No markdown, no preamble.', userLanguage),
    });

    res.json(parsed);

  } catch (error) {
    console.error('[DifficultTalkPracticeSummary] Error:', error);
    res.status(500).json({ error: 'Failed to generate practice summary', details: error.message });
  }
});

module.exports = router;
