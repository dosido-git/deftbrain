const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/friendship-fade-alerter', async (req, res) => {
  try {
    const { name, relationshipType, daysSinceContact, contextNotes } = req.body;

    console.log('📥 Received request:', { name, relationshipType, daysSinceContact });

    // Validation
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Person name is required' });
    }
    if (!relationshipType) {
      return res.status(400).json({ error: 'Relationship type is required' });
    }
    if (daysSinceContact === undefined || daysSinceContact === null) {
      return res.status(400).json({ error: 'Days since contact is required' });
    }

    // Build the prompt
    const prompt = `You are helping someone with ADHD reconnect with a relationship they care about. They struggle with time-blindness and feel guilty about letting time pass.

RELATIONSHIP DETAILS:
- Person: ${name}
- Relationship: ${relationshipType}
- Days since last contact: ${daysSinceContact}
${contextNotes ? `- Context/shared interests: ${contextNotes}` : ''}

Your response must be:
- GUILT-FREE (no apology-focused messages)
- NATURAL (sounds like them, not forced)
- PERSONALIZED (uses context if provided)
- ACTIONABLE (ready to send)
- WARM (genuine reconnection, not transactional)

Generate conversation starters that:
1. Acknowledge time passed WITHOUT apologizing
2. Show genuine interest in the person
3. Reference shared interests/context if available
4. Give multiple approach options (quick vs lengthy)
5. Provide follow-up conversation directions

CRITICAL: Do NOT start messages with "I'm sorry" or "I apologize". Time passing is normal. Frame reconnection positively.

Return ONLY valid JSON in this EXACT structure (no preamble, no markdown):

{
  "relationship_context": {
    "name": "${name}",
    "days_since_contact": ${daysSinceContact},
    "relationship_type": "${relationshipType}",
    "last_topic": "${contextNotes || 'not provided'}"
  },
  "conversation_starters": [
    {
      "opener": "Hey! I realized it's been a minute - hope you're doing well! How's [specific thing] going?",
      "tone": "casual/warm",
      "why_this_works": "Acknowledges time without apologizing, shows interest in their life, asks about specific topic",
      "follow_up_ideas": [
        "Share update about your own life",
        "Suggest catching up soon",
        "Ask about shared interest"
      ]
    },
    {
      "opener": "Thinking of you! Want to grab coffee/call this week and catch up?",
      "tone": "direct/inviting",
      "why_this_works": "Simple, warm, action-oriented, no guilt, clear invitation",
      "follow_up_ideas": [
        "Suggest specific times",
        "Offer virtual or in-person",
        "Mention you miss talking"
      ]
    },
    {
      "opener": "I saw [thing related to shared interest] and immediately thought of you - made me realize we should catch up soon!",
      "tone": "warm/connecting",
      "why_this_works": "Uses shared interest as natural hook, positive framing, expresses wanting to connect",
      "follow_up_ideas": [
        "Share the thing that made you think of them",
        "Ask their take on it",
        "Transition to general catch-up"
      ]
    }
  ],
  "reconnection_approaches": [
    {
      "approach": "Quick check-in",
      "message": "Hey! Just thinking of you - hope you're doing well! How have you been?",
      "when_to_use": "When you're busy or testing waters before longer conversation"
    },
    {
      "approach": "Catch-up invitation",
      "message": "I'd love to catch up soon! Are you free for coffee/a call this week?",
      "when_to_use": "When you have time and energy for real conversation"
    }
  ],
  "guilt_relief": {
    "reframe": "It's been ${daysSinceContact} days, but that's life - you both have been busy. Reaching out now is what matters.",
    "permission": "You don't need to apologize for living your life. Time passing doesn't mean you don't care. Just reconnect now."
  },
  "shared_interest_hooks": [
    ${contextNotes ? `{
      "topic": "${contextNotes.split(',')[0].trim()}",
      "conversation_angle": "Ask how they're doing with this, share your recent experience with it, or mention something new related to it"
    }` : `{
      "topic": "General catch-up",
      "conversation_angle": "Ask about what's new in their life, what they've been up to lately"
    }`}
  ]
}`;

    console.log('🤖 Calling Claude API...');

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }]
    });

    console.log('✅ Claude API response received');

    // Parse response
    let jsonText = message.content[0].text.trim();
    
    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Find JSON object
    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('No JSON found in AI response');
    }
    
    jsonText = jsonText.substring(firstBrace, lastBrace + 1);
    
    // Remove trailing commas
    jsonText = jsonText.replace(/,(\s*[}\]])/g, '$1');
    
    let results;
    try {
      results = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError.message);
      console.error('Raw response:', jsonText.substring(0, 500));
      throw new Error(`JSON parse failed: ${parseError.message}`);
    }

    // Validate required fields
    if (!results.relationship_context || !results.conversation_starters || !results.guilt_relief) {
      throw new Error('Invalid response structure - missing required fields');
    }

    console.log('✅ Sending results back to client');
    res.json(results);

  } catch (error) {
    console.error('❌ Friendship Fade Alerter Error:', error);
    res.status(500).json({
      error: error.message || 'Failed to generate conversation starters',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});


module.exports = router;
