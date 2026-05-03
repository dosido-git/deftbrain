const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');
const { rateLimit, CREATIVE_LIMITS } = require('../lib/rateLimiter');

// Apply creative-tier rate limit
router.use(rateLimit(CREATIVE_LIMITS, 'gratitude-debt-clearer:'));

// ═══════════════════════════════════════════════════
// ROUTE 1: MAIN GENERATION — Thank-you messages
// ═══════════════════════════════════════════════════
router.post('/gratitude-debt-clearer', rateLimit(), async (req, res) => {
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
      originalMessage,
      userLanguage,
      recipientHistory,
      toneOverride,
    } = req.body;

    if (!recipientName) return res.status(400).json({ error: 'Recipient name required' });
    if (!gratitudePoints) return res.status(400).json({ error: 'Gratitude points required' });

    let prompt;
    
    if (adjustmentPrompt && originalMessage) {
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
      const lengthGuidance = length <= 3 ? 'very brief (2-3 sentences)' 
        : length <= 7 ? 'moderate length (1-2 paragraphs)' 
        : 'detailed and thorough (2-3 paragraphs)';

      const culturalMap = {
        'East Asian (Japanese, Korean, Chinese)': 'Use more formal, humble language. Emphasize the relationship and obligation. Thank-you notes are expected and valued.',
        'British/Commonwealth': 'Slightly more formal than American. Use understated language, avoid excessive emotion. Handwritten notes are still common.',
        'South Asian (Indian, Pakistani)': 'Warm, relationship-focused language. Family connections are important. Can be more effusive with gratitude.',
        'Middle Eastern': 'Formal, respectful language. Emphasize hospitality and generosity. Relationship and honor are key.',
        'Latin American': 'Warm, personal, expressive language. Family and relationship bonds are central. Emotion is welcome.',
        'Southern US': 'Gracious, warm language. Handwritten notes for gifts are expected. Warmth without condescension.',
        'African': 'Community-focused and warm. Respect for elders and seniority. Relationship continuity matters.',
      };
      const culturalGuidance = culturalMap[culturalContext] || 'Standard American/Western directness with warmth. Balance between formal and casual based on relationship.';

      let specificityNotes = '';
      if (specificGiftDetails) specificityNotes += `\nSPECIFIC GIFT DETAILS: ${specificGiftDetails}`;
      if (howYoullUseIt) specificityNotes += `\nHOW THEY'LL USE IT: ${howYoullUseIt}`;

      const deliveryGuidance = deliveryMethod === 'Let AI suggest' 
        ? 'Suggest the most appropriate delivery method based on context and relationship'
        : `Tailor the message for: ${deliveryMethod}`;

      // Recipient history context
      let historyContext = '';
      if (recipientHistory?.length > 0) {
        const recent = recipientHistory.slice(0, 3);
        historyContext = `\n\nRECIPIENT HISTORY — You have thanked ${recipientName} before:
${recent.map(h => `- ${new Date(h.sentAt).toLocaleDateString()}: "${h.messageText?.slice(0, 80)}..." (${h.context}, ${h.messageVersion})${h.reaction ? ` — Their reaction: ${h.reaction}` : ''}`).join('\n')}

CRITICAL: Reference this history naturally. Don't repeat the same opening or approach. If they reacted well to a previous style, lean into it. You can reference the ongoing relationship: "Once again, you've..." or "I keep finding myself grateful to you for..."`;
      }

      // Tone calibration
      let toneCalibration = '';
      if (toneOverride) {
        toneCalibration = `\nTONE NOTE: The user selected "${tone}" but "${toneOverride}" may be more appropriate for a ${relationship} relationship in a ${context} context. Generate the user's requested tone first, but also include one version in the suggested tone with a note about why it might work better.`;
      }

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
${historyContext}${toneCalibration}

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
${context === 'Condolence support' ? '- Be gentle, avoid platitudes, acknowledge their pain while expressing gratitude for their support.' : ''}
${context === 'Post-interview' ? '- Follow post-interview etiquette: send within 24 hours, reference specific conversation points, reiterate interest.' : ''}

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
  }${toneCalibration ? `,
  "tone_calibration": {
    "suggested_tone": "the tone you think fits best",
    "reason": "why this tone may work better for this relationship and context"
  }` : ''}${needHandwritingTemplate ? `,
  "handwriting_template": {
    "opening_placement": "suggested greeting and where to place it",
    "message_layout": "how to structure the message on a physical card",
    "closing_placement": "closing phrase and signature placement",
    "font_suggestions": ["style 1", "style 2", "style 3"],
    "writing_tips": ["tip 1", "tip 2", "tip 3", "tip 4"],
    "length_guidance": "ideal length for a physical card"
  }` : ''}
}

Generate 2-3 message versions with different approaches. Return ONLY valid JSON.`;
    }

    const wrappedPrompt = withLanguage(prompt, userLanguage);
    const msg1 = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2500,
      messages: [{ role: 'user', content: wrappedPrompt }],
    });
    const parsed = JSON.parse(cleanJsonResponse(msg1.content.find(b => b.type === 'text')?.text || ''));

    res.json(parsed);

  } catch (error) {
    console.error('Gratitude Debt Clearer error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate thank you messages' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 2: SPECIFICITY EXTRACTION — Smart pre-pass
// ═══════════════════════════════════════════════════
router.post('/gratitude-debt-specificity', rateLimit(), async (req, res) => {
  try {
    const { recipientName, gratitudePoints, context, relationship, userLanguage } = req.body;

    if (!gratitudePoints) return res.status(400).json({ error: 'Gratitude points required' });

    const prompt = withLanguage(`You are a gratitude coach. The user wants to thank "${recipientName || 'someone'}" for:
"${gratitudePoints}"

Context: ${context || 'General kindness'}
Relationship: ${relationship || 'Personal'}

Assess whether their input is SPECIFIC enough for a truly personal thank-you message. If vague, generate 2-3 targeted questions to extract details.

SPECIFICITY SCALE:
- VAGUE: "helped me a lot", "was really nice", "great gift", "supported me"
- MODERATE: "helped me move", "gave me a book", "listened when I was stressed"  
- SPECIFIC: "spent 6 hours helping me pack and drove the U-Haul", "gave me that Italian cookbook with the lasagna recipe we talked about"

Return ONLY this JSON:
{
  "specificity_level": "vague | moderate | specific",
  "needs_questions": true/false,
  "questions": [
    {
      "question": "A targeted question to extract more detail",
      "placeholder": "Example answer to guide the user",
      "why": "What this detail will add to the message"
    }
  ],
  "existing_strengths": "What's already good about their input (1 sentence, encouraging)"
}

RULES:
- If "specific", set needs_questions to false and return empty questions array.
- 2-3 questions max. Make them feel like a friend asking, not an interview.
- Questions should be answerable in 5-15 words.
- Focus on: what specifically happened, how it made them feel, what would have happened without this person.
- Return ONLY JSON.`, userLanguage);

    const msg2 = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    });
    const parsed = JSON.parse(cleanJsonResponse(msg2.content.find(b => b.type === 'text')?.text || ''));

    res.json(parsed);

  } catch (error) {
    console.error('Gratitude Specificity error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze specificity' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 3: FOLLOW-UP MESSAGE — Outcome-based follow-up
// ═══════════════════════════════════════════════════
router.post('/gratitude-debt-followup', rateLimit(), async (req, res) => {
  try {
    const {
      recipientName, originalContext, originalMessage, originalDate,
      outcome, relationship, tone, culturalContext, deliveryMethod, userLanguage,
    } = req.body;

    if (!recipientName || !outcome) return res.status(400).json({ error: 'Recipient name and outcome required' });

    const timeSince = originalDate
      ? `${Math.round((Date.now() - new Date(originalDate).getTime()) / (1000 * 60 * 60 * 24))} days ago`
      : 'some time ago';

    const prompt = withLanguage(`You are a gratitude expression specialist generating a FOLLOW-UP message.

CONTEXT: The user previously thanked ${recipientName} ${timeSince}.
ORIGINAL CONTEXT: ${originalContext || 'Not specified'}
${originalMessage ? `ORIGINAL MESSAGE SENT:\n"${originalMessage.slice(0, 300)}"\n` : ''}
WHAT HAPPENED SINCE: ${outcome}
RELATIONSHIP: ${relationship || 'Personal'}
TONE: ${tone || 'Warm & casual'}
CULTURAL CONTEXT: ${culturalContext || 'American/Western'}
DELIVERY: ${deliveryMethod || 'Let AI suggest'}

Generate 2 follow-up messages. These are MORE powerful than the original because they show LASTING impact.

CRITICAL:
- This is a FOLLOW-UP, not a first thank-you. Don't re-explain everything.
- Opening should signal "update": "I wanted you to know...", "Remember when...", "You may not realize this, but..."
- Connect their kindness to the outcome.
- Keep it natural. The power is in the simple connection.

OUTPUT (JSON only):
{
  "follow_up_messages": [
    {
      "version": "The Update" or "The Callback" or "The Full Circle",
      "message_text": "the follow-up message",
      "tone": "tone used",
      "length": word_count,
      "why_this_works": "why this follow-up is powerful",
      "best_for": "when to use this version"
    }
  ],
  "timing_note": "When to send this follow-up for maximum impact",
  "bonus_gesture": "Optional accompanying gesture idea"
}

Return ONLY valid JSON.`, userLanguage);

    const msg3 = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });
    const parsed = JSON.parse(cleanJsonResponse(msg3.content.find(b => b.type === 'text')?.text || ''));

    res.json(parsed);

  } catch (error) {
    console.error('Gratitude Follow-Up error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate follow-up' });
  }
});

module.exports = router;
