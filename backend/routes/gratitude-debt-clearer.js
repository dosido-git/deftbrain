const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/gratitude-debt-clearer', async (req, res) => {
  try {
    const { 
      recipientName, 
      gratitudePoints, 
      context, 
      relationship, 
      tone, 
      length,
      specificGiftDetails,
      howYoullUseIt,
      culturalContext,
      deliveryMethod,
      needHandwritingTemplate,
      adjustmentPrompt,
      originalMessage
    } = req.body;

    // Validation
    if (!recipientName) {
      return res.status(400).json({ error: 'Recipient name required' });
    }
    if (!gratitudePoints) {
      return res.status(400).json({ error: 'Gratitude points required' });
    }

    // Build the prompt
    let prompt;
    
    if (adjustmentPrompt && originalMessage) {
      // Adjustment mode
      prompt = `You are a gratitude expression specialist helping someone adjust their thank you message.

ORIGINAL MESSAGE:
${originalMessage}

ADJUSTMENT REQUEST:
${adjustmentPrompt}

RECIPIENT: ${recipientName}
CONTEXT: ${context}
RELATIONSHIP: ${relationship}
DESIRED TONE: ${tone}

TASK: Adjust the message according to the request while maintaining the core gratitude.

OUTPUT (JSON only):
{
  "thank_you_messages": [
    {
      "version": "Adjusted Version",
      "message_text": "the adjusted message text",
      "tone": "${tone.toLowerCase()}",
      "length": word_count,
      "why_this_works": "brief explanation of changes made",
      "best_for": "when to use this version"
    }
  ]
}

Return ONLY valid JSON.`;
    } else {
      // Initial generation mode
      const lengthGuidance = length <= 3 ? 'very brief (2-3 sentences)' 
        : length <= 7 ? 'moderate length (1-2 paragraphs)' 
        : 'detailed and thorough (2-3 paragraphs)';

      // Build cultural context guidance
      let culturalGuidance = '';
      if (culturalContext === 'East Asian (Japanese, Korean, Chinese)') {
        culturalGuidance = 'Use more formal, humble language. Emphasize the relationship and obligation. Thank-you notes are expected and valued. Mention how the gift/action honors you.';
      } else if (culturalContext === 'British/Commonwealth') {
        culturalGuidance = 'Slightly more formal than American. Use understated language, avoid excessive emotion. Handwritten notes are still common for gifts.';
      } else if (culturalContext === 'South Asian (Indian, Pakistani)') {
        culturalGuidance = 'Warm, relationship-focused language. Family connections are important. Can be more effusive with gratitude.';
      } else if (culturalContext === 'Middle Eastern') {
        culturalGuidance = 'Formal, respectful language. Emphasize hospitality and generosity. Relationship and honor are key.';
      } else if (culturalContext === 'Latin American') {
        culturalGuidance = 'Warm, personal, expressive language. Family and relationship bonds are central. Emotion is welcome.';
      } else if (culturalContext === 'Southern US') {
        culturalGuidance = 'Gracious, warm language. Handwritten notes for gifts are expected. "Bless your heart" warmth without condescension.';
      } else {
        culturalGuidance = 'Standard American/Western directness with warmth. Balance between formal and casual based on relationship.';
      }

      // Build specificity enhancements
      let specificityNotes = '';
      if (specificGiftDetails) {
        specificityNotes += `\nSPECIFIC GIFT DETAILS: ${specificGiftDetails}`;
      }
      if (howYoullUseIt) {
        specificityNotes += `\nHOW THEY'LL USE IT: ${howYoullUseIt}`;
      }

      // Build delivery method guidance
      let deliveryGuidance = deliveryMethod === 'Let AI suggest' 
        ? 'Suggest the most appropriate delivery method based on context and relationship'
        : `Tailor the message for: ${deliveryMethod}`;

      prompt = `You are a gratitude expression specialist who helps people turn genuine feelings into heartfelt, authentic thank you messages.

RECIPIENT: ${recipientName}
WHAT THEY'RE GRATEFUL FOR:
${gratitudePoints}${specificityNotes}

CONTEXT: ${context}
RELATIONSHIP: ${relationship}
DESIRED TONE: ${tone}
LENGTH PREFERENCE: ${lengthGuidance}
CULTURAL CONTEXT: ${culturalContext}
${culturalGuidance}

DELIVERY METHOD: ${deliveryGuidance}

TASK: Generate 2-3 different thank you message options that feel authentic and personal, not generic or AI-generated.

CRITICAL REQUIREMENTS:
- Use SPECIFIC details from what the user wrote (don't be generic)
${specificGiftDetails ? `- Reference the specific gift details: "${specificGiftDetails}"` : ''}
${howYoullUseIt ? `- Mention how they'll use it: "${howYoullUseIt}"` : ''}
- Match the tone to the relationship (professional vs personal)
- Follow ${culturalContext} gratitude etiquette and formality levels
- Avoid clichés and over-the-top language unless culturally appropriate
- Sound like a real human, not a hallmark card
- Each version should have a distinct approach
- Include the recipient's name naturally in at least one version
- Be culturally appropriate and sincere
${context === 'Condolence support' ? '- This is a sensitive situation involving loss. Be gentle, avoid platitudes, acknowledge their pain while expressing gratitude for their support.' : ''}
${context === 'Post-interview' ? '- Follow professional post-interview etiquette: send within 24 hours, reference specific conversation points, reiterate interest.' : ''}

OUTPUT (JSON only):
{
  "thank_you_messages": [
    {
      "version": "Heartfelt Version" or "Professional Version" or "Brief & Warm" or "Culturally Formal",
      "message_text": "the complete thank you message text",
      "tone": "warm/professional/casual/heartfelt/formal",
      "length": actual_word_count,
      "why_this_works": "why this approach is effective for this situation",
      "best_for": "when this version is most appropriate"
    }
  ],
  "delivery_suggestions": {
    "method": "email/handwritten card/text message/in-person/social media",
    "timing": "when to send this for maximum impact and cultural appropriateness",
    "timing_cultural_note": "any cultural timing considerations (${culturalContext})",
    "additional_gesture": "optional gesture to accompany message"
  },
  "personalization_tips": [
    "specific suggestions to make it even more personal",
    "details they could add",
    "cultural considerations for ${culturalContext}"
  ],
  "if_you_feel_awkward": {
    "permission": "reassuring statement about feeling awkward",
    "reframe": "why expressing gratitude matters in ${culturalContext}"
  }${needHandwritingTemplate ? `,
  "handwriting_template": {
    "opening_placement": "suggested greeting and where to place it",
    "message_layout": "how to structure the message on a physical card",
    "closing_placement": "closing phrase and signature placement",
    "font_suggestions": [
      "readable handwriting style 1",
      "readable handwriting style 2",
      "readable handwriting style 3"
    ],
    "writing_tips": [
      "tip about pen choice",
      "tip about spacing",
      "tip about card choice",
      "tip about length for physical cards"
    ],
    "length_guidance": "ideal length for a physical card (number of lines/words)"
  }` : ''}
}

Generate 2-3 message versions with different approaches. Return ONLY valid JSON.`;
    }

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2500,
      messages: [{ role: 'user', content: prompt }]
    });

    // Extract and parse response
    const textContent = message.content.find(item => item.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(textContent);
    const parsed = JSON.parse(cleaned);

    // Send response
    res.json(parsed);

  } catch (error) {
    console.error('Gratitude Debt Clearer error:', error);
    res.status(500).json({ 
      error: error.message || 'Failed to generate thank you messages' 
    });
  }
});


module.exports = router;
