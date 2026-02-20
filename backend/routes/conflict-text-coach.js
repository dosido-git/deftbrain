const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/conflict-text-coach', async (req, res) => {
  console.log('✅ Conflict Text Coach V2 endpoint called');
  
  try {
    const { 
      receivedMessage,
      relationship,
      emotionalState,
      goals,
      userDraft,
      actualGoal
    } = req.body;
    
    console.log('📝 Request:', { 
      messageLength: receivedMessage?.length,
      relationship,
      emotions: emotionalState || [],
      goals: goals || [],
      hasDraft: !!userDraft,
      hasGoal: !!actualGoal
    });

    // Validation
    if (!receivedMessage || receivedMessage.trim().length < 10) {
      return res.status(400).json({ error: 'Please provide the message you received' });
    }

    const emotionsText = emotionalState && emotionalState.length > 0 
      ? emotionalState.join(', ')
      : 'not specified';

    const goalsText = goals && goals.length > 0
      ? goals.map(g => g.replace(/_/g, ' ')).join(', ')
      : 'respond thoughtfully';

    const prompt = `You are an expert conflict resolution coach with V2 ENHANCEMENTS: deep draft analysis, goal clarification, and escalation prevention. Your mission is to prevent reactive texting that damages relationships.

MESSAGE THEY RECEIVED:
"${receivedMessage}"

CONTEXT:
Relationship: ${relationship}
Current emotional state: ${emotionsText}
What they want to achieve: ${goalsText}
${actualGoal ? `\nActual outcome they want: "${actualGoal}"` : ''}
${userDraft ? `\n⚠️ CRITICAL - What they're tempted to send: "${userDraft}"` : ''}

V2 ENHANCEMENT FRAMEWORK:

## 1. GOAL REALITY CHECK (NEW)

${actualGoal ? `
User stated goal: "${actualGoal}"

Analyze:
{
  "goal_reality_check": {
    "assessment": "Is this goal realistic/healthy? Is it about winning or connecting?",
    "will_this_message_achieve_it": true/false,
    "alternative_approach": "If messaging won't achieve goal, what will?"
  }
}

Examples:
- Goal: "I want them to admit they're wrong" → Assessment: "This is about winning, not resolving. Unlikely to work."
- Goal: "I want to set a boundary" → Assessment: "Healthy goal. Messaging can help if done calmly."
- Goal: "I want them to understand how I feel" → Assessment: "Valid goal. But timing matters - are they in a state to hear you?"

` : `No explicit goal stated - infer what they might actually want based on context`}

## 2. DEEP DRAFT ANALYSIS (CRITICAL IF DRAFT PROVIDED)

${userDraft ? `
USER'S REACTIVE DRAFT: "${userDraft}"

Perform COMPREHENSIVE analysis:

{
  "draft_analysis": {
    "tone_flags": [
      {
        "flag": "Sounds angry / Defensive / Sarcastic / Passive-aggressive / Dismissive",
        "why_problematic": "Explanation of how this escalates"
      }
    ],
    
    "problematic_phrases": [
      {
        "phrase": "Exact quote from their draft",
        "issue": "What's wrong with it",
        "better_version": "How to say it better"
      }
    ],
    
    "escalation_risk": {
      "level": "low / medium / high / extreme",
      "why": "Specific reasons this will escalate"
    },
    
    "overall_assessment": "Honest verdict - will this help or hurt?"
  }
}

DETECT AND FLAG:
**Angry tone:**
- All caps words
- Excessive punctuation (!!!, ???)
- Aggressive language ("whatever", "fine", "don't even")
- Absolute statements ("you always", "you never")

**Defensive language:**
- "That's not true"
- "Actually..."
- "You're the one who..."
- Counter-accusations
- Deflection

**Sarcasm/Passive-aggressive:**
- "Oh sure"
- "Right..."
- "Whatever you say"
- Backhanded compliments
- Fake agreement

**Dismissive:**
- "Whatever"
- "I don't care"
- "Fine"
- One-word responses with period

**Generalizations:**
- "You always..."
- "You never..."
- "Every time..."

**Examples:**

Draft: "Whatever. This is EXACTLY why I don't tell you anything. You never listen anyway."

Analysis:
{
  "tone_flags": [
    {"flag": "Dismissive", "why_problematic": "'Whatever' immediately shuts down communication"},
    {"flag": "Defensive", "why_problematic": "Deflecting instead of addressing their concern"},
    {"flag": "Angry", "why_problematic": "All caps 'EXACTLY' shows high emotion"}
  ],
  "problematic_phrases": [
    {"phrase": "Whatever", "issue": "Dismissive, conversation-ending", "better_version": "I'm frustrated right now"},
    {"phrase": "You never listen", "issue": "Generalization, provably false", "better_version": "I'm feeling unheard"}
  ],
  "escalation_risk": {"level": "high", "why": "Multiple escalating elements, will definitely make them angrier"},
  "overall_assessment": "This will 100% escalate the conflict. You're venting, not communicating. This won't achieve any positive outcome."
}
` : ''}

## 3. MESSAGE ANALYSIS (ENHANCED)

Analyze received message:

{
  "message_analysis": {
    "emotional_temperature": "high/medium/low",
    "primary_emotion_detected": "anger/hurt/frustration/fear",
    "triggers_identified": ["exact triggering phrases"],
    "communication_style": "attacking/passive-aggressive/direct/emotional",
    "underlying_need": "What they actually need (to be heard, reassurance, boundary, etc.)"
  }
}

## 4. RESPONSE STRATEGIES (ENHANCED)

Generate 3-5 strategies based on:
- Their goals
- Emotional temperature
- Whether draft would work (if provided)
- Actual outcome desired

Each strategy must include ALL fields:
{
  "strategy": "Name",
  "response_text": "Actual message",
  "tone": "calm/firm/compassionate",
  "what_this_does": "Outcome",
  "when_to_use": "Situation",
  "risks": "Honest downsides",
  "body_language_if_in_person": "If face-to-face"
}

## 5. ESCALATION PREVENTION (NEW)

Based on emotional state: ${emotionsText}

Provide specific warnings:

**If angry/defensive detected:**
{
  "escalation_prevention": {
    "current_state_warning": "You're in fight mode right now. Everything you write will sound defensive.",
    "recommended_delay": "10-20 minutes minimum",
    "alternative_action": "Write it in notes app, don't send. Revisit in 20 min.",
    "physical_regulation": "Take a walk, breathe, move your body before responding"
  }
}

**Red flags in emotional state:**
- Angry + Defensive = VERY high escalation risk
- Hurt + Angry = Will sound attacking
- Frustrated + Defensive = Will generalize and blame
- Confused alone = Okay to ask clarifying questions

## 6. APOLOGY ASSESSMENT (NEW)

Determine if apology is warranted:

{
  "apology_assessment": {
    "is_apology_appropriate": true/false,
    "reasoning": "Why or why not",
    "what_to_apologize_for": "Specific action, not character",
    "what_NOT_to_apologize_for": "Don't apologize for feelings or boundaries",
    "suggested_apology": "If appropriate, provide script"
  }
}

Rules:
- Apologize for ACTIONS that hurt them
- DON'T apologize for having feelings
- DON'T apologize for setting boundaries
- DON'T apologize just to de-escalate if not warranted

Examples:
✅ "I'm sorry I forgot our plans. That was inconsiderate."
❌ "I'm sorry you're upset" (not an apology)
❌ "I'm sorry I have boundaries" (don't apologize for this)

Link to Apology Calibrator tool if apology needed: "For a properly calibrated apology, use the Apology Calibrator tool"

## 7. COOLING MECHANISMS (NEW)

Based on emotional temperature and state, recommend:

{
  "cooling_recommendation": {
    "mandatory_delay": true/false,
    "delay_time": "10 minutes / 1 hour / 24 hours / sleep on it",
    "why_delay": "Specific reason for this person",
    "what_to_do_instead": "Concrete alternative action",
    "emotion_check_questions": [
      "How do you feel RIGHT NOW?",
      "Has your heart rate slowed?",
      "Can you think clearly about outcomes?"
    ]
  }
}

**Delay recommendations:**
- High emotional temp + angry/defensive = MANDATORY 10+ min delay
- Medium temp + hurt = Suggest 30 min
- Low temp + calm = Can respond thoughtfully now
- High stakes (partner, family) + high emotion = "Sleep on it"

## 8. PAUSE PROMPTS (ENHANCED)

{
  "if_youre_about_to_send_something": {
    "pause_prompt": "Before you send that...",
    "reflection_questions": [
      "Will this help or hurt?",
      "Am I defending or communicating?",
      "What do I want to happen AFTER I send this?",
      "Will I regret this tomorrow?",
      "Would I say this to their face in person?"
    ],
    "cooling_off_time": "Specific recommendation",
    "save_draft_suggestion": "Write it in notes app, come back in 20 min"
  }
}

## 9. WHAT NOT TO SAY (ENHANCED)

Include user's draft phrases if problematic:

{
  "what_NOT_to_say": [
    {
      "phrase": "From their draft or common escalator",
      "why_avoid": "Specific reason it makes things worse",
      "what_happens_if_you_say_it": "Realistic consequence"
    }
  ]
}

## 10. IF THEY CONTINUE ESCALATING

{
  "if_they_continue_escalating": {
    "script": "Final boundary line",
    "then_what": "Stop responding. Seriously. Mute if needed."
  }
}

## 11. REPAIR STRATEGY

{
  "repair_strategy_later": "After 12-24 hours, how to reconnect constructively"
}

## 12. RELATIONSHIP-SPECIFIC GUIDANCE

${relationship === 'Partner' ? `
**Partner:** High stakes. Repair crucial. Avoid "winning". Focus on long-term health. Consider couples therapy if this is a pattern.
` : ''}

${relationship === 'Ex' ? `
**Ex:** Minimize contact. Gray rock method. Don't re-engage in old relationship dynamics. Ask: "Do I actually need to respond?"
` : ''}

${relationship === 'Family' ? `
**Family:** Can't fully exit. Boundaries essential. It's okay to take space even from family. Consider family therapy for chronic conflict.
` : ''}

${relationship === 'Coworker' ? `
**Coworker:** Keep professional. Document if needed. Don't engage in personal attacks. Involve HR if it's harassment.
` : ''}

## COMPLETE OUTPUT STRUCTURE

{
  "goal_reality_check": {
    "assessment": "...",
    "will_this_message_achieve_it": true/false,
    "alternative_approach": "..." (if messaging won't work)
  },
  
  "draft_analysis": {
    "tone_flags": [...],
    "problematic_phrases": [...],
    "escalation_risk": {...},
    "overall_assessment": "..."
  },
  
  "message_analysis": {
    "emotional_temperature": "high/medium/low",
    "primary_emotion_detected": "...",
    "triggers_identified": [...],
    "communication_style": "...",
    "underlying_need": "..."
  },
  
  "escalation_prevention": {
    "current_state_warning": "...",
    "recommended_delay": "...",
    "alternative_action": "...",
    "physical_regulation": "..."
  },
  
  "response_strategies": [
    {
      "strategy": "...",
      "response_text": "...",
      "tone": "...",
      "what_this_does": "...",
      "when_to_use": "...",
      "risks": "...",
      "body_language_if_in_person": "..."
    }
  ],
  
  "apology_assessment": {
    "is_apology_appropriate": true/false,
    "reasoning": "...",
    "what_to_apologize_for": "...",
    "what_NOT_to_apologize_for": "...",
    "suggested_apology": "..."
  },
  
  "cooling_recommendation": {
    "mandatory_delay": true/false,
    "delay_time": "...",
    "why_delay": "...",
    "what_to_do_instead": "...",
    "emotion_check_questions": [...]
  },
  
  "if_youre_about_to_send_something": {
    "pause_prompt": "...",
    "reflection_questions": [...],
    "cooling_off_time": "...",
    "save_draft_suggestion": "..."
  },
  
  "what_NOT_to_say": [
    {
      "phrase": "...",
      "why_avoid": "...",
      "what_happens_if_you_say_it": "..."
    }
  ],
  
  "if_they_continue_escalating": {
    "script": "...",
    "then_what": "..."
  },
  
  "repair_strategy_later": "..."
}

CRITICAL V2 RULES:
1. If draft provided, analyze it BRUTALLY HONESTLY - don't sugarcoat
2. If high emotions detected, recommend MANDATORY delay
3. Goal reality check - be honest if their goal is unrealistic
4. Escalation prevention - warn them if they're not in right headspace
5. Apology only when actually warranted, never to appease
6. All strategies should de-escalate, never match their energy
7. Protect the relationship over being "right"

Return ONLY valid JSON.`;

    console.log('🤖 Calling Claude API...');

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }]
    });

    console.log('✅ Claude API responded');

    // Extract text content
    const textContent = message.content.find(item => item.type === 'text')?.text || '';
    
    // Robust JSON extraction
    let cleaned = textContent.trim();
    cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('No JSON object found in response');
    }
    
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      // Try cleaning common Claude JSON issues
      let repaired = cleaned
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .replace(/[\x00-\x1F\x7F]/g, (ch) => (ch === '\n' || ch === '\r' || ch === '\t') ? ch : ' ');
      try {
        parsed = JSON.parse(repaired);
      } catch (retryError) {
        console.error('JSON parse error after repair:', retryError.message);
        throw new Error('Failed to parse response as JSON: ' + parseError.message);
      }
    }
    
    console.log('✅ Response parsed successfully');
    console.log('📊 V2 Analysis:', {
      temperature: parsed.message_analysis?.emotional_temperature,
      draftAnalyzed: !!parsed.draft_analysis,
      goalChecked: !!parsed.goal_reality_check,
      mandatoryDelay: parsed.cooling_recommendation?.mandatory_delay,
      apologySuggested: parsed.apology_assessment?.is_apology_appropriate
    });

    res.json(parsed);

  } catch (error) {
    console.error('❌ Conflict Text Coach V2 error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to analyze message' 
    });
  }
});


module.exports = router;
