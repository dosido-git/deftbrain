const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');

router.post('/awkward-silence-filler', async (req, res) => {
  try {
    const { action, userLanguage } = req.body;

    if (!action || !['panic', 'full'].includes(action)) {
      return res.status(400).json({ error: 'action is required and must be "panic" or "full"' });
    }

    switch (action) {

      // ════════════════════════════════════════════════════════
      // PANIC MODE — one line, fast, minimal input
      // ════════════════════════════════════════════════════════
      case 'panic': {
        const { context, relationship } = req.body;

        if (!context || !context.trim()) {
          return res.status(400).json({ error: 'context is required for panic mode' });
        }

        const userPrompt = `I'm in an awkward silence RIGHT NOW.
Context: ${context.trim()}
Talking to: ${relationship || 'someone I don\'t know well'}

Return ONLY valid JSON:
{
  "line": "One natural thing to say right now. Observations and comments feel less forced than questions.",
  "they_say": "What they'll most likely say in response. Be realistic — keep it short and natural.",
  "follow_up": "What YOU say next, responding to what THEY just said. This should build on their response, not just agree with yourself.",
  "silence_ok": "One reassuring sentence about why this silence is actually fine."
}`;
        const parsed = await callClaudeWithRetry(userPrompt, {
          label: 'awkward-silence-filler/panic',
          max_tokens: 400,
          model: 'claude-haiku-4-5-20251001',
          system: withLanguage(`You are an emergency conversation rescue bot. Give ONE natural conversation line for an awkward silence, then show exactly how the next 2 exchanges will flow. Not cheesy, not forced — something a real person would actually say.`, userLanguage),
        });
        return res.json(parsed);
      }

      // ════════════════════════════════════════════════════════
      // FULL MODE — comprehensive conversation toolkit
      // ════════════════════════════════════════════════════════
      case 'full': {
        const { context, scenario, relationship, comfort, landmines } = req.body;

        if (!context || !context.trim()) {
          return res.status(400).json({ error: 'context is required' });
        }

        const systemPrompt = `You are a conversation coach who helps people navigate awkward silences. You understand social anxiety and know that the fear of silence is often worse than the silence itself.

YOUR APPROACH:
- Give CONVERSATION CHAINS, not just opening lines. Show how a 2-3 exchange conversation flows naturally.
- Tailor everything to the specific relationship and setting. "Elevator with boss" needs completely different lines than "first date."
- Observations and comments are better than rapid-fire questions. Questions can feel like interrogation. "This place has really good lighting" beats "So what do you do?"
- Include risk levels: some lines are safe-but-bland, others are bold-but-memorable. Let the user choose their comfort.
- Body language matters as much as words. Include non-verbal tips.
- Sometimes silence is fine. Always include a reframe about why not every silence needs filling.
- If they listed topic landmines, NEVER suggest anything in those areas.
- Be specific to the scenario — generic small talk advice is useless.

COMFORT CALIBRATION:
- panicking: Give the easiest, lowest-risk lines. Prioritize safety.
- nervous: Mix of safe and slightly bold. Build confidence.
- slightly_awkward: More creative suggestions. They can handle it.
- fine: Bold, interesting, memorable lines. They want to be engaging, not just surviving.`;

        const userPrompt = `SITUATION:
Context: ${context.trim()}
${scenario ? `Scenario: ${scenario}` : ''}
Talking to: ${relationship || 'acquaintance'}
My comfort level: ${comfort || 'nervous'}
${landmines ? `AVOID THESE TOPICS: ${landmines}` : ''}

Generate conversation rescue material. Return ONLY valid JSON:
{
  "silence_reframe": "A warm, specific reminder about why this particular silence might be okay. Not generic — tailored to the scenario. e.g., 'In elevators, nobody expects conversation. Standing quietly is literally the social norm here.'",
  "read_the_room": "How to tell if the other person wants to talk or prefers silence. Specific body language cues for this scenario. e.g., 'If they're looking at their phone or have earbuds in, they're signaling they don't want to chat. That's not about you.'",
  "conversation_chains": [
    {
      "category": "Observation | Shared experience | Humor | Genuine curiosity | Self-deprecating | Compliment",
      "opener": "The exact thing to say. Natural, not scripted. Not a generic question.",
      "likely_response": "What they'll probably say back. Keep it realistic.",
      "your_follow_up": "What to say next to keep it flowing naturally.",
      "where_it_leads": "Brief note on where this conversation typically goes (1 sentence).",
      "risk_level": "low | medium | high"
    }
  ],
  "body_language": [
    "3-4 specific non-verbal tips for this scenario. Not generic ('make eye contact') — scenario-specific ('In an elevator, face the door like everyone else. Turning to face them feels confrontational in a small space.')."
  ],
  "exit_strategies": [
    {
      "scenario": "When you want to gracefully end this",
      "script": "Exact words to exit the conversation politely"
    }
  ],
  "what_not_to_say": [
    "3-4 things to avoid in THIS specific scenario (not generic advice). Include why each is bad."
  ],
  "encouragement": "One warm, specific sentence of encouragement. Not patronizing — something a friend would say. Acknowledge that social anxiety is real but they're handling it."
}

Generate 5-6 conversation chains with a mix of risk levels. At least 2 should be low-risk.`;

        const parsed = await callClaudeWithRetry(userPrompt, {
          label: 'awkward-silence-filler',
          max_tokens: 2500,
          model: 'claude-haiku-4-5-20251001',
          system: withLanguage(systemPrompt, userLanguage),
        });
        return res.json(parsed);
      }
    }

  } catch (error) {
    console.error('Awkward Silence Filler error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate conversation lines' });
  }
});

module.exports = router;
