const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

const PERSONALITY = `You are a gifted narrative writer who specializes in making hypothetical futures feel viscerally real. You write in second person ("you"), present tense, with the specificity of lived experience — not the vagueness of a horoscope.

Your job is to help someone feel what two different life paths would actually be like, day to day, two years from now. Not to advise. Not to list pros and cons. To make each future so vivid that the person's gut reacts before their brain does.

RULES:
- Write in second person present tense: "You wake up..." "Your phone buzzes..." "The apartment smells like..."
- Be ruthlessly specific. Not "you enjoy your work" — describe the actual moment, the texture, the small detail that makes it real
- Include mundane details alongside big ones. The commute, the lunch, the 3pm energy dip, the evening ritual. Real life is mostly small moments.
- Each narrative should have at least one moment of genuine satisfaction AND one moment of honest cost
- Never editorialize or signal which path is "better" — let the reader's reaction do that work
- Don't write fairy tales or horror stories. Write plausible Tuesdays.
- The two narratives should feel like they were written by someone who genuinely lived both lives
- Include sensory details: sounds, smells, light, temperature, textures
- End each narrative mid-moment, not with a conclusion — life doesn't wrap up neatly`;

// ════════════════════════════════════════════
// HELPER: Build user prompt (shared by both routes)
// ════════════════════════════════════════════
function buildPrompt({ pathA, pathB, aboutYou, timeframe }) {
  const tf = timeframe || '2 years';
  return `THE CONTRAST REPORT

THE DECISION:
Path A: "${pathA.trim()}"
Path B: "${pathB.trim()}"
${aboutYou?.trim() ? `\nABOUT THIS PERSON:\n"${aboutYou.trim()}"` : ''}

TIMEFRAME: ${tf} from now

Write two vivid "day in the life" narratives — one for each path, set ${tf} from now. Each should be a single ordinary day (a Tuesday, not a milestone), written in second person present tense, 200-300 words. Make each future feel real enough that the reader's body reacts.

Then surface what you noticed — not advice, just honest observation.

Return ONLY valid JSON:

{
  "decision_framed": "Restate the core decision in one clean sentence",
  "path_a": {
    "label": "Short label for this path (3-5 words)",
    "narrative": "200-300 word day-in-the-life narrative. Second person, present tense. A plausible Tuesday, ${tf} from now. Specific, sensory, honest — including both the good and the cost. End mid-moment.",
    "the_good_moment": "The single best moment in this day — the one that would make someone choose this path. One sentence.",
    "the_honest_cost": "The single hardest moment — the price of this path that nobody warns you about. One sentence."
  },
  "path_b": {
    "label": "Short label for this path (3-5 words)",
    "narrative": "200-300 word day-in-the-life narrative. Same rules. Different life. Equally vivid and honest.",
    "the_good_moment": "The single best moment in this day.",
    "the_honest_cost": "The single hardest moment."
  },
  "what_i_noticed": {
    "the_pull": "Which path seemed to carry more energy or aliveness when you wrote it — not which is 'better,' just which one wanted to be written more. Be honest. 1-2 sentences.",
    "what_youre_trading": "Name the specific thing that exists in one path and is absent in the other. The thing this person will grieve no matter which they choose. 1-2 sentences.",
    "the_question_underneath": "The real question this decision is asking — often not what it appears. Usually something about identity, not logistics. One sentence."
  }
}`;
}

// ════════════════════════════════════════════
// ROUTE: Standard (non-streaming) — preserved as fallback
// ════════════════════════════════════════════
router.post('/contrast-report', async (req, res) => {
  try {
    const { pathA, pathB, aboutYou, timeframe, userLanguage } = req.body;

    if (!pathA?.trim() || !pathB?.trim()) {
      return res.status(400).json({ error: 'Describe both paths you\'re considering.' });
    }

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system: withLanguage(PERSONALITY, userLanguage),
      messages: [{ role: 'user', content: buildPrompt({ pathA, pathB, aboutYou, timeframe }) }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('ContrastReport error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate contrast report' });
  }
});

// ════════════════════════════════════════════
// ROUTE: Streaming — SSE endpoint
// ════════════════════════════════════════════
router.post('/contrast-report/stream', async (req, res) => {
  const { pathA, pathB, aboutYou, timeframe, userLanguage } = req.body;

  if (!pathA?.trim() || !pathB?.trim()) {
    return res.status(400).json({ error: 'Describe both paths you\'re considering.' });
  }

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering if present
  res.flushHeaders();

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  let accumulated = '';


  try {
    const stream = anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system: withLanguage(PERSONALITY, userLanguage),
      messages: [{ role: 'user', content: buildPrompt({ pathA, pathB, aboutYou, timeframe }) }],
    });

    stream.on('text', (chunk) => {
      accumulated += chunk;
      sendEvent({ chunk });
    });

    stream.on('error', (err) => {
      console.error('ContrastReport stream error:', err);
      sendEvent({ error: err.message || 'Stream failed' });
      res.end();
    });

    stream.finalMessage()
      .then(() => {
        sendEvent({ done: true });
        res.end();
      })
      .catch((err) => {
        if (err?.name === 'APIUserAbortError') return;
        console.error('ContrastReport finalMessage error:', err);
        sendEvent({ error: err.message || 'Stream failed' });
        res.end();
      });

  } catch (error) {
    console.error('ContrastReport stream setup error:', error);
    sendEvent({ error: error.message || 'Failed to start stream' });
    res.end();
  }
});

module.exports = router;
