const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/focus-pocus', async (req, res) => {
  try {
    const { activity, plannedMinutes, actualMinutes, overtimeMinutes, missedNeeds, upcomingObligations, snoozeCount } = req.body;

    if (!activity || !activity.trim()) {
      return res.status(400).json({ error: 'Activity is required' });
    }

    const overtime = overtimeMinutes || 0;
    const snoozes = snoozeCount || 0;
    const planned = plannedMinutes || 25;
    const actual = actualMinutes || planned;

    console.log(`[FocusPocus] Activity: "${activity}", planned: ${planned}min, actual: ${actual}min, overtime: ${overtime}min, snoozes: ${snoozes}`);

    const prompt = `You are a firm but caring focus coach helping someone transition out of a deep work session. Your tone should match the urgency level — gentle if they stopped on time, increasingly direct if they've been going way past their session.

SESSION DATA:
- Activity: ${activity}
- Planned session: ${planned} minutes
- Actual time spent: ${actual} minutes
- Overtime (past session end): ${overtime} minutes
- Times they hit "5 more minutes": ${snoozes}
- Missed needs they mentioned: ${missedNeeds || 'none specified'}
- Upcoming obligations: ${upcomingObligations || 'none specified'}

URGENCY CALIBRATION:
${overtime === 0 ? '- They stopped ON TIME. Be warm and congratulatory. Gentle break suggestion.' : ''}
${overtime > 0 && overtime <= 15 ? '- Slightly over. Acknowledge it lightly, firm but friendly.' : ''}
${overtime > 15 && overtime <= 45 ? '- Significantly over. Be direct. Their body needs attention NOW.' : ''}
${overtime > 45 ? '- WAY over. This is urgent. Be blunt and caring. They may have forgotten to eat, drink, or move for hours.' : ''}
${snoozes >= 3 ? '- They snoozed multiple times. They KNOW they should stop. Be the friend who physically takes the laptop away.' : ''}

Generate a break intervention with these sections:

1. HEADLINE (headline): A short, punchy message (under 15 words). Match urgency to overtime.
   - On time: Something warm like "Great session! Time to recharge."
   - Way over: Something urgent like "STOP. Your body has been waiting ${overtime} minutes for you."

2. MESSAGE (message): 2-3 sentences explaining why they should break NOW. Reference their specific activity. If they've been overtime, mention concrete physical effects (dehydration, eye strain, muscle stiffness, blood sugar). Don't lecture — be the smart friend who cares.

3. MANDATORY ACTIONS (mandatory_actions): Array of 3-5 specific, immediate things to do. These should be concrete and quick (under 2 minutes each). Always include water and standing up. Tailor to activity and duration:
   - Coding for hours → eye rest (20-20-20 rule), wrist stretches
   - Gaming → posture reset, eye distance refocus
   - Research → break the mental loop, physical grounding
   - If they mentioned missed needs, address those first
   - If they have upcoming obligations, include a prep action

4. BODY CHECK (body_check): Object with quick status indicators:
   - hydration: string describing likely hydration state
   - hunger: string describing likely hunger state  
   - posture: string describing likely posture state
   - eyes: string describing likely eye strain state
   - movement: string describing likely movement state
   (Base these on activity type and duration — someone coding for 3 hours has different needs than someone reading for 30 minutes)

5. RE-ENTRY PLAN (re_entry): A brief suggestion for how to resume their activity after the break, IF they should resume at all. If they've been going for a very long time, suggest they might be done for now. Include a specific "bookmark" technique — e.g., "write down exactly where you are in one sentence before walking away."

6. NEXT SESSION (next_session): Suggest an appropriate duration for their next session based on how this one went. If they went way overtime, suggest a shorter next session with a harder boundary.

Return ONLY valid JSON (no markdown, no preamble, no code fences):

{
  "headline": "short punchy headline",
  "message": "2-3 sentence break message",
  "mandatory_actions": ["action 1", "action 2", "action 3"],
  "body_check": {
    "hydration": "status string",
    "hunger": "status string",
    "posture": "status string",
    "eyes": "status string",
    "movement": "status string"
  },
  "re_entry": "how to resume after break",
  "next_session": "suggested next session duration and advice"
}

CRITICAL: Be specific to their activity. Do NOT give generic advice. Reference what they were actually doing.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    const textContent = message.content.find(item => item.type === 'text')?.text || '';
    console.log(`[FocusPocus] Response: ${textContent.length} chars`);

    const cleaned = cleanJsonResponse(textContent);
    const parsed = JSON.parse(cleaned);

    console.log(`[FocusPocus] Generated: headline=${!!parsed.headline}, actions=${parsed.mandatory_actions?.length || 0}`);
    res.json(parsed);

  } catch (error) {
    console.error('[FocusPocus] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate break plan' });
  }
});

module.exports = router;
