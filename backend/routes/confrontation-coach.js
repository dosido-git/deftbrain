const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/confrontation-coach', async (req, res) => {
  try {
    const { commType, situation, relationship, fears, hardPart, recurring, triedBefore, userLanguage } = req.body;

    if (!situation || !situation.trim()) {
      return res.status(400).json({ error: 'Please describe the situation' });
    }

    const commTypeLabels = {
      say_no: 'Saying no to a request',
      set_boundary: 'Setting a boundary',
      address_disrespect: 'Addressing disrespect or mistreatment',
      end_relationship: 'Ending a relationship',
      negotiate: 'Negotiating a need',
      push_back: 'Pushing back on an unreasonable demand',
      decline_no_explain: 'Declining without owing an explanation',
      general: 'Communicating something difficult',
    };

    const systemPrompt = `You are a communication coach who specializes in helping conflict-averse people find the right words. Your users are people who KNOW what they need to say but struggle to say it — they over-apologize, over-explain, soften until the message disappears, or freeze entirely.

YOUR JOB:
1. Validate that what they're asking for is reasonable
2. Write the actual message for them at three firmness levels
3. Prepare them for pushback
4. Remind them it's okay to say this

CRITICAL RULES FOR MESSAGE WRITING:
- Remove ALL apologetic qualifiers: "I'm sorry but", "If it's okay", "I hate to ask", "I don't want to be difficult", "Maybe", "Kind of", "Sort of", "A little bit"
- Messages should be STATEMENTS, not questions. "I need..." not "Is it okay if I..."
- Brief explanation is optional and should never be over-justifying
- Never include "Does that make sense?" or "Is that okay?" at the end
- Each message should be something they can literally copy-paste and send

FIRMNESS LEVELS:
- Gentle: Maintains warmth. Acknowledges their perspective. Clear about the boundary/need. Best for first attempts or when preserving the relationship is critical.
- Balanced (RECOMMENDED DEFAULT): No apologizing. Direct and respectful. No softening. Best for most situations.
- Firm: No softening whatsoever. Includes consequences if needed. Non-negotiable tone. Best when previous attempts failed or it's a serious violation.

PUSHBACK SCRIPTS:
- Write responses for: guilt_trip, anger, negotiation (always include these three)
- Add situation-specific pushback types if relevant (e.g., silent_treatment, deflection, crying)
- Each script should be 1-2 sentences the user can say verbatim
- Scripts should restate the boundary without re-explaining or defending`;

    const fearsText = fears && fears.length > 0
      ? `\nFEARS: ${fears.join(', ')}`
      : '';
    const hardPartText = hardPart
      ? `\nWHAT MAKES THIS HARD: ${hardPart}`
      : '';

    const userPrompt = `COMMUNICATION TYPE: ${commTypeLabels[commType] || commTypeLabels.general}
SITUATION: ${situation}
RELATIONSHIP: ${relationship || 'Not specified'}
RECURRING ISSUE: ${recurring ? 'Yes — this has happened before' : 'No — first time addressing it'}
TRIED BEFORE: ${triedBefore ? 'Yes — previous attempts haven\'t worked' : 'No'}${fearsText}${hardPartText}

Generate the messages and support content. Return ONLY valid JSON:
{
  "validation": "2-3 sentences affirming that what they're asking for is reasonable. Be specific to their situation. Don't be generic — reference their actual scenario.",

  "reality_check": "1-2 sentences preparing them for the other person's likely reaction, based on their fears. Normalize that reaction and remind them it doesn't make them wrong.",

  "messages": [
    {
      "level": "gentle",
      "label": "Gentle but Clear",
      "text": "The actual message they can copy-paste. Warm but unambiguous.",
      "what_this_does": "One sentence explaining the approach — e.g., 'Maintains warmth while being clear about the boundary'",
      "removes": ["List of apologetic phrases this replaces", "e.g., 'I'm sorry but'", "'If it's not too much trouble'"]
    },
    {
      "level": "balanced",
      "label": "Balanced Assertiveness (Recommended)",
      "text": "Direct, respectful, no apologies. This is the recommended default.",
      "what_this_does": "One sentence — e.g., 'States the need clearly without softening or over-explaining'",
      "removes": ["Apologetic phrases removed"]
    },
    {
      "level": "firm",
      "label": "Very Firm",
      "text": "Unambiguous. Includes consequence if boundary isn't respected.",
      "what_this_does": "One sentence — e.g., 'Leaves no room for misinterpretation, includes what happens next'",
      "removes": ["All softening language"]
    }
  ],

  "pushback_scripts": {
    "guilt_trip": "If they say [specific guilt-trip]: You can say: '[response]'",
    "anger": "If they get angry: You can say: '[response]'",
    "negotiation": "If they try to negotiate: You can say: '[response]'"
  },

  "follow_up_guidance": "2-3 sentences about what to do after sending. Should include: don't re-explain or soften if they push back, restate once then disengage, and any situation-specific advice."
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const textContent = message.content.find(item => item.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(textContent);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('Confrontation Coach error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate messages' });
  }
});

module.exports = router;
