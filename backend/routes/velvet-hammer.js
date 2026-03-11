const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

// ════════════════════════════════════════════
// MAIN ENDPOINT: Transform message
// ════════════════════════════════════════════
router.post('/velvet-hammer', async (req, res) => {
  try {
    const {
      harshMessage,
      relationship,
      channel,
      goals,
      powerDynamic,
      rageLevel,
      history,
      userLanguage,
    } = req.body;

    if (!harshMessage) return res.status(400).json({ error: 'Message required' });

    const goalsText = goals && goals.length > 0 ? goals.join(', ') : 'Not specified';
    const powerText = {
      they_have_power: 'They have power over the sender (boss, landlord, authority figure)',
      equals: 'Sender and recipient are equals (peer, friend, neighbor)',
      i_have_leverage: 'Sender has leverage (client, the recipient needs something from them)',
    }[powerDynamic] || 'Not specified';

    const channelInstructions = {
      'Email': 'Format for email. Include a professional subject line. Can be structured with paragraphs.',
      'Slack/Teams': 'Format for workplace chat. Keep concise and professional but less formal than email. No subject line needed.',
      'Text Message': 'Format for text/SMS. Keep short and conversational but clear. No subject line.',
      'In-person script': 'Format as talking points the sender can use face-to-face. Include 3-4 bullet points and anticipate 1-2 likely responses from the recipient with suggested replies.',
      'Letter/Formal': 'Format as a formal letter/written communication. Full structure with clear paragraphs. Include a subject line.',
      'Social Media': 'Format for public-facing social media. Brief, measured, high-road tone. Nothing that looks bad screenshot-ed. No subject line.',
    }[channel] || 'Format for email with a subject line.';

    const basePrompt = `You are an expert communication strategist and emotional intelligence coach. Your job is to transform raw, emotionally charged messages into professional, effective communication while preserving the sender's legitimate concerns and core message.

CONTEXT:
- Raw message: """${harshMessage}"""
- Relationship: ${relationship || 'Not specified'}
- Communication channel: ${channel || 'Email'}
- Sender's goals: ${goalsText}
- Power dynamic: ${powerText}
- Self-reported anger level: ${rageLevel || 3}/5
- Additional context: ${history || 'None provided'}

CHANNEL FORMATTING: ${channelInstructions}

ANALYSIS & TRANSFORMATION INSTRUCTIONS:

1. VALIDATE the sender's emotions first. Acknowledge WHY they're angry in 1-2 empathetic sentences. Don't validate the delivery — validate the feeling.

2. EXTRACT the legitimate concerns buried in the angry message. What factual claims, reasonable expectations, or valid boundaries exist beneath the emotion?

3. IDENTIFY inflammatory elements that undermine the sender's position: personal attacks, absolutes ("always"/"never"), sarcasm, threats, profanity, assumptions about intent, exaggerations.

4. CHECK FAIRNESS: Are any of the sender's claims exaggerated or unfair? Flag them honestly. Note what the other person's perspective might be.

5. GENERATE THREE distinct rewrites, each calibrated to the relationship, channel, and power dynamic:

   COLLABORATIVE: Assumes good faith. Uses "I" statements and open questions. Opens dialogue. Warmest and most relationship-preserving. Best when the sender isn't sure of the recipient's intent or wants to maintain closeness.

   BALANCED: Clear, direct, and professional. States facts, sets expectations, and requests specific action. Neither warm nor cold. The "default professional" option for most situations.

   FIRM: Maximum assertiveness without aggression. Uses formal language, references patterns or consequences where applicable. For escalation after previous polite attempts have failed, or when the power dynamic favors the sender.

   For each version, calibrate assertiveness and warmth to the POWER DYNAMIC:
   - If they have power: all versions should be more diplomatic; even "firm" stays respectful
   - If equals: standard calibration
   - If sender has leverage: versions can be more direct; "firm" can reference consequences

6. PROVIDE before/after comparisons showing the most important specific phrases that were changed and why.

7. PROVIDE strategic advice: when to send it, whether this situation might need escalation beyond a message, and what to do if the response is poor.

OUTPUT FORMAT — Return ONLY valid JSON:
{
  "emotional_validation": "1-2 empathetic sentences acknowledging why the sender is angry, without validating the inflammatory delivery",

  "original_harshness": 8,

  "legitimate_concerns": [
    "First valid point extracted from the message",
    "Second valid point"
  ],

  "inflammatory_elements": [
    {
      "original_phrase": "the exact problematic phrase",
      "problem": "why this undermines the sender's position",
      "risk": "what could happen if this is sent as-is"
    }
  ],

  "fairness_check": {
    "exaggerations": ["Any absolute statements or overstatements from the original"],
    "valid_claims": ["Claims that appear factually defensible"],
    "missing_perspective": "A brief, honest note on what the other person's perspective might be"
  },

  "versions": [
    {
      "style": "collaborative",
      "label": "Collaborative — Assume Good Faith",
      "message": "The full rewritten message formatted for the specified channel",
      "subject_line": "Email/letter subject line, or null if not applicable",
      "best_for": "Brief description of when to use this version",
      "tone_score": 3,
      "assertiveness_score": 4,
      "key_techniques": ["I-statements", "open questions", "benefit of the doubt"]
    },
    {
      "style": "balanced",
      "label": "Balanced — Clear & Professional",
      "message": "The full rewritten message",
      "subject_line": "Subject line or null",
      "best_for": "When to use this version",
      "tone_score": 5,
      "assertiveness_score": 6,
      "key_techniques": ["specific facts", "clear expectations", "professional tone"]
    },
    {
      "style": "firm",
      "label": "Firm — Direct & Boundaried",
      "message": "The full rewritten message",
      "subject_line": "Subject line or null",
      "best_for": "When to use this version",
      "tone_score": 7,
      "assertiveness_score": 8,
      "key_techniques": ["pattern references", "consequence framing", "formal register"]
    }
  ],

  "before_after": [
    {
      "original_snippet": "A short inflammatory phrase from the original",
      "transformed_to": "How it was rewritten in the balanced version",
      "why": "Brief explanation of why this change strengthens the message"
    }
  ],

  "strategic_notes": {
    "timing_advice": "When to send this message",
    "escalation_warning": "If applicable: whether this situation may need escalation beyond a message. Set to null if not applicable.",
    "follow_up": "What to do if they don't respond or respond poorly"
  },

  "confidence": "high, medium, or low — how confident you are that the rewrites capture the sender's intent"
}

IMPORTANT RULES:
- tone_score: 1 = ice cold, 10 = very warm. Collaborative should be warmest, Firm should be coolest.
- assertiveness_score: 1 = very soft, 10 = very forceful. Firm should be highest, Collaborative should be lowest.
- subject_line should ONLY be non-null when the channel is Email or Letter/Formal.
- For "In-person script" channel, format the message as numbered talking points the person can reference.
- Keep each version's message realistic in length for the channel (texts should be short, emails can be longer).
- The before_after array should have 3-5 entries showing the most impactful changes.
- Be honest in the fairness_check — if the sender is being unreasonable about something, say so diplomatically.

Return ONLY the JSON object. No markdown fences, no preamble, no explanation outside the JSON.`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      messages: [{ role: 'user', content: withLanguage(basePrompt, userLanguage) }],
    });

    const textContent = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = JSON.parse(cleanJsonResponse(textContent));
    res.json(parsed);

  } catch (error) {
    console.error('Velvet Hammer error:', error);
    res.status(500).json({ error: error.message || 'Failed to transform message' });
  }
});

// ════════════════════════════════════════════
// REFINE ENDPOINT: Adjust a specific version
// ════════════════════════════════════════════
router.post('/velvet-hammer/refine', async (req, res) => {
  try {
    const {
      originalVersion,
      selectedVersion,
      refinementRequest,
      channel,
      relationship,
      userLanguage,
    } = req.body;

    if (!originalVersion || !refinementRequest) {
      return res.status(400).json({ error: 'Original version and refinement request required' });
    }

    const basePrompt = `You are a communication editing assistant. The user has already transformed an angry message into a professional version and now wants to adjust it.

ORIGINAL PROFESSIONAL VERSION (style: ${selectedVersion || 'balanced'}):
"""
${originalVersion}
"""

USER'S ADJUSTMENT REQUEST: "${refinementRequest}"

COMMUNICATION CHANNEL: ${channel || 'Email'}
RELATIONSHIP: ${relationship || 'Not specified'}

Rewrite the professional version incorporating the user's requested changes. Keep the same overall style (${selectedVersion || 'balanced'}) and professionalism level. Adapt formatting to the channel.

OUTPUT (JSON only):
{
  "refined_message": "the adjusted version of the message",
  "what_changed": "1-sentence summary of the adjustment"
}

Return ONLY valid JSON. No markdown, no preamble.`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{ role: 'user', content: withLanguage(basePrompt, userLanguage) }],
    });

    const textContent = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = JSON.parse(cleanJsonResponse(textContent));
    res.json(parsed);

  } catch (error) {
    console.error('Velvet Hammer refine error:', error);
    res.status(500).json({ error: error.message || 'Failed to refine message' });
  }
});

module.exports = router;

// ═══════════════════════════════════════════════════════════════
// STREAMING ROUTE — main message transformation
// ═══════════════════════════════════════════════════════════════

router.post('/velvet-hammer/stream', async (req, res) => {
  const { harshMessage, relationship, channel, goals, powerDynamic, rageLevel, history, userLanguage } = req.body;

  if (!harshMessage) return res.status(400).json({ error: 'Message required' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    const goalsText = goals && goals.length > 0 ? goals.join(', ') : 'Not specified';
    const powerText = {
      they_have_power: 'They have power over the sender (boss, landlord, authority figure)',
      equals: 'Sender and recipient are equals (peer, friend, neighbor)',
      i_have_leverage: 'Sender has leverage (client, the recipient needs something from them)',
    }[powerDynamic] || 'Not specified';

    const channelInstructions = {
      'Email': 'Format for email. Include a professional subject line.',
      'Slack/Teams': 'Format for workplace chat. Concise and professional.',
      'Text Message': 'Format for text/SMS. Keep short and conversational.',
      'In-person script': 'Format as 3-4 talking point bullets with anticipated responses.',
      'Letter/Formal': 'Format as a formal letter with clear paragraphs and subject line.',
      'Social Media': 'Brief, measured, high-road tone. Nothing that looks bad screenshotted.',
    }[channel] || 'Format for email with a subject line.';

    const prompt = withLanguage(`You are an expert communication strategist. Transform this raw message into 3 professional versions (collaborative, balanced, firm) with emotional validation, concern extraction, fairness check, before/after comparisons, and strategic notes.

Raw message: """${harshMessage}"""
Relationship: ${relationship || 'Not specified'}
Channel: ${channel || 'Email'} — ${channelInstructions}
Goals: ${goalsText}
Power dynamic: ${powerText}
Anger level: ${rageLevel || 3}/5
Context: ${history || 'None'}

Return ONLY valid JSON matching the full schema from the standard velvet-hammer endpoint.`, userLanguage);

    const stream = await anthropic.messages.stream({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    stream.on('text', (text) => sendEvent({ chunk: text }));
    await stream.finalMessage();
    sendEvent({ done: true });
    res.end();

  } catch (err) {
    console.error('[VelvetHammer/stream] Error:', err);
    sendEvent({ error: err.message || 'Stream failed' });
    res.end();
  }
});
