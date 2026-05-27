const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

router.post('/awkward-silence-filler', rateLimit(DEFAULT_LIMITS), async (req, res) => {
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
  "line": "One natural thing to say right now. Observations and comments feel less forced than questions. — one sentence",
  "they_say": "What they'll most likely say in response. Be realistic — keep it short and natural. — one sentence",
  "follow_up": "What YOU say next, responding to what THEY just said. This should build on their response, not just agree with yourself. — one sentence",
  "silence_ok": "One reassuring sentence about why this silence is actually fine. — one sentence"
}`;
        const parsed = await callClaudeWithRetry({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1500,
          system: withLanguage(`You are an emergency conversation rescue bot. Give ONE natural conversation line for an awkward silence, then show exactly how the next 2 exchanges will flow. Not cheesy, not forced — something a real person would actually say.`, userLanguage),
          messages: [{ role: 'user', content: userPrompt }],
        }, { label: 'awkward-silence-filler/panic' });
        if (!parsed.line) {
      return res.status(500).json({ error: 'Could not fill the silence. Please try again.' });
    }
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

        const systemPrompt = `You are a conversation coach who helps people navigate awkward silences. You understand social anxiety and know that the fear of silence is often worse than the silence itself.`;

        const userPrompt = `SITUATION:
Context: ${context.trim()}
${scenario ? `Scenario: ${scenario}` : ''}
Talking to: ${relationship || 'acquaintance'}
My comfort level: ${comfort || 'nervous'}
${landmines ? `AVOID THESE TOPICS: ${landmines}` : ''}

Generate conversation rescue material. Return ONLY valid JSON:
{
  "silence_reframe": "A warm, specific reminder about why this particular silence might be okay. Not generic — tailored to the scenario. e.g., 'In elevators, nobody expects conversation. Standing quietly is literally the social norm here.' — one sentence",
  "read_the_room": "How to tell if the other person wants to talk or prefers silence. Specific body language cues for this scenario. e.g., 'If they're looking at their phone or have earbuds in, they're signaling they don't want to chat. That's not about you.' — one sentence",
  "conversation_chains": [
    {
      "category": "Observation | Shared experience | Humor | Genuine curiosity | Self-deprecating | Compliment",
      "opener": "The exact thing to say. Natural, not scripted. Not a generic question. — one sentence",
      "likely_response": "What they'll probably say back. Keep it realistic. — one sentence",
      "your_follow_up": "What to say next to keep it flowing naturally. — one sentence",
      "where_it_leads": "Brief note on where this conversation typically goes (1 sentence). — one sentence",
      "risk_level": "low | medium | high"
    }
  ],
  "body_language": [
    "3-4 specific non-verbal tips for this scenario. Not generic ('make eye contact') — scenario-specific ('In an elevator, face the door like everyone else. Turning to face them feels confrontational in a small space.')."
  ],
  "exit_strategies": [
    {
      "scenario": "When you want to gracefully end this — one sentence",
      "script": "Exact words to exit the conversation politely — 2-4 sentences"
    }
  ],
  "what_not_to_say": [
    "3-4 things to avoid in THIS specific scenario (not generic advice). Include why each is bad."
  ],
  "encouragement": "One warm, specific sentence of encouragement. Not patronizing — something a friend would say. Acknowledge that social anxiety is real but they're handling it. — one sentence"
}

Generate 5-6 conversation chains with a mix of risk levels. At least 2 should be low-risk.`;

        const parsed = await callClaudeWithRetry({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 4000,
          system: withLanguage(systemPrompt, userLanguage),
          messages: [{ role: 'user', content: userPrompt }],
        }, { label: 'awkward-silence-filler' });
        if (!parsed.conversation_chains && !parsed.silence_reframe) {
          return res.status(500).json({ error: 'Could not fill the silence. Please try again.' });
        }
        return res.json(parsed);
      }
    }

  } catch (error) {
    console.error('Awkward Silence Filler error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
