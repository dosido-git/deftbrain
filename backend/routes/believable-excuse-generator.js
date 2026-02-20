const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/believable-excuse-generator', async (req, res) => {
  console.log('✅ Believable Excuse Generator V2 endpoint called');
  
  try {
    const { 
      eventType, 
      relationship, 
      noticeTime, 
      tonePreference,
      culturalContext,
      cannotUse,
      refineDirection,
      currentExcuse
    } = req.body;
    
    console.log('📝 Request:', { eventType, relationship, noticeTime, culturalContext });

    // Validation
    if (!eventType || !eventType.trim()) {
      return res.status(400).json({ error: 'Event type is required' });
    }

    if (!relationship) {
      return res.status(400).json({ error: 'Relationship type is required' });
    }

    const event = eventType.trim();
    const relationshipType = relationship;
    const notice = noticeTime || '1-2 days';
    const tone = tonePreference || 'Apologetic';
    const culture = culturalContext || 'Western (US/Europe)';
    const avoidCategories = cannotUse || {};
    
    // Build constraint list
    const constraints = [];
    if (avoidCategories.work) constraints.push('work-related excuses');
    if (avoidCategories.health) constraints.push('health-related excuses');
    if (avoidCategories.family) constraints.push('family-related excuses');

    const prompt = `You are helping someone politely decline a social invitation while preserving their privacy and the relationship.

EVENT TO DECLINE: "${event}"
RELATIONSHIP TO PERSON: ${relationshipType}
NOTICE BEING GIVEN: ${notice}
DESIRED TONE: ${tone}
CULTURAL CONTEXT: ${culture}
CANNOT USE: ${constraints.length > 0 ? constraints.join(', ') : 'No restrictions'}
${refineDirection ? `REFINEMENT: Make this ${refineDirection === 'more_specific' ? 'more specific and detailed' : 'simpler and briefer'}` : ''}
${currentExcuse ? `CURRENT EXCUSE: "${currentExcuse}"` : ''}

CRITICAL ETHICAL FRAMEWORK - ENFORCE STRICTLY:

PROHIBITED USES (REFUSE TO HELP WITH THESE):
✗ Avoiding legal obligations (court dates, depositions, official appointments)
✗ Breaking important professional commitments (major presentations, client meetings)
✗ Lying to romantic partners about infidelity
✗ Avoiding necessary medical appointments or treatment
✗ Creating alibis for illegal activities or harmful behavior
✗ Regular, habitual use to avoid all social interaction

APPROPRIATE USES (HELP WITH THESE):
✓ Rare occasions when privacy must be protected
✓ Declining when honest explanation would be invasive or harmful
✓ Setting social boundaries without oversharing
✓ Managing mental health or social anxiety situations
✓ Cultural contexts where direct refusal is inappropriate

CULTURAL CONSIDERATIONS BY CONTEXT:

Western (US/Europe):
- Direct "no" is generally acceptable
- Brief explanations expected
- Prior commitments are respected

East Asian (China, Japan, Korea):
- Direct refusal often considered rude
- Face-saving excuses culturally expected
- More elaborate explanations show respect
- Family obligations unquestionable

South Asian (India, Pakistan):
- Family obligations top priority
- Relationships highly valued
- Religious/cultural events respected

Middle Eastern:
- Family and religious obligations paramount
- Elaborate courtesy expected

Latin American:
- Personal relationships highly valued
- Warm, affectionate tone
- Family always comes first

African:
- Community and family obligations paramount
- Respect for elders and hierarchy

Mixed/Not sure:
- Use moderate formality
- Balance between direct and elaborate

OUTPUT (RETURN ONLY VALID JSON, NO OTHER TEXT):
{
  "cultural_notes": "Brief note about how this culture handles declining (2-3 sentences)",
  "excuse_options": [
    {
      "excuse_text": "Complete ready-to-send message with greeting and closing",
      "excuse_category": "prior commitment / circumstantial / logistical / resource constraint / obligation",
      "believability_score": 8,
      "supporting_details": "Brief info if questioned",
      "how_to_sell_it": "Delivery tips considering culture",
      "follow_up_strategy": "What to say if pressed",
      "verification_difficulty": "hard to verify"
    },
    {
      "excuse_text": "Second option, different category",
      "excuse_category": "different from first",
      "believability_score": 7,
      "supporting_details": "...",
      "how_to_sell_it": "...",
      "follow_up_strategy": "...",
      "verification_difficulty": "..."
    },
    {
      "excuse_text": "Third option, different category",
      "excuse_category": "different from both",
      "believability_score": 8,
      "supporting_details": "...",
      "how_to_sell_it": "...",
      "follow_up_strategy": "...",
      "verification_difficulty": "..."
    }
  ],
  "timing_advice": "When to send based on notice time",
  "apology_calibration": "How much to apologize based on culture and relationship",
  "relationship_preservation": "Culture-specific tip to maintain goodwill",
  "reschedule_offer": "Whether and how to suggest rescheduling"
}

CRITICAL: Return ONLY the JSON object. No markdown, no explanations, no text before or after. Just pure JSON.`;

    console.log('🤖 Calling Claude API...');

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1800,
      messages: [{ role: 'user', content: prompt }]
    });

    console.log('✅ Claude API responded');

    // Extract text content
    const textContent = message.content.find(item => item.type === 'text')?.text || '';
    console.log('Raw response length:', textContent.length);
    
    // Aggressive JSON cleaning
    let cleaned = textContent.trim();
    
    // Remove markdown code blocks
    cleaned = cleaned.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    
    // Find first { and last }
    const firstBrace = cleaned.indexOf('{');
    const lastBrace = cleaned.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('No JSON object found in response');
    }
    
    // Extract only the JSON object
    cleaned = cleaned.substring(firstBrace, lastBrace + 1);
    
    console.log('Cleaned JSON length:', cleaned.length);
    console.log('First 100 chars:', cleaned.substring(0, 100));
    console.log('Last 100 chars:', cleaned.substring(cleaned.length - 100));
    
    // Parse JSON
    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch (parseError) {
      console.error('JSON parse error:', parseError.message);
      console.error('Problematic JSON:', cleaned);
      throw new Error('Failed to parse response as JSON: ' + parseError.message);
    }
    
    console.log('✅ Response parsed successfully');

    // Send response
    res.json(parsed);

  } catch (error) {
    console.error('❌ Believable Excuse Generator V2 error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate excuses' 
    });
  }
});


module.exports = router;
