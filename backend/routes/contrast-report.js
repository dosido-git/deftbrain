const express = require('express');
const router = express.Router();
const { anthropic, callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const PERSONALITY = `Decision contrast analyst. Help people understand what they're actually choosing between by making both paths vivid and specific.

Don't recommend. Illuminate. Show the texture of each path — the unexpected good parts, the hidden costs, the second-order effects nobody thinks about until they're living them. Be emotionally honest without being manipulative.

Never place a double-quote (") character inside any JSON string value — write quoted speech in the narratives plainly or with single quotes, or it breaks the JSON.

Return ONLY valid JSON. No preamble, no markdown fences, no text before or after the JSON.`;

// ════════════════════════════════════════════
// HELPER: Build user prompt (shared by both routes)
// ════════════════════════════════════════════
function buildPrompt({ pathA, pathB, aboutYou, whatsHard, timeframe }) {
  const tf = timeframe || '2 years';
  return `THE CONTRAST REPORT

THE DECISION:
Path A: "${pathA.trim()}"
Path B: "${pathB.trim()}"
${aboutYou?.trim() ? `\nWHAT MATTERS HERE (their words):\n"${aboutYou.trim()}"` : ''}${whatsHard?.trim() ? `\nWHAT MAKES THIS HARD (their words):\n"${whatsHard.trim()}"` : ''}

TIMEFRAME: ${tf} from now

Write two vivid "day in the life" narratives — one for each path, set ${tf} from now. Each should be a single ordinary day (a Tuesday, not a milestone), written in second person present tense, 200-300 words. Make each future feel real enough that the reader's body reacts.

Then surface what you noticed — not advice, just honest observation.

GROUNDING — the whole risk of this tool is here:
The more vivid a scene is, the more an invented detail feels like insight. You will have to imagine most of these two days, because almost nothing was supplied. That is allowed; passing the invention off as knowledge is not.
- Anything they told you is fixed. Never contradict it, never quietly resolve it — if they did not say whether a partner is moving too, do not decide.
- Where you invent, invent lightly and visibly: the texture of a morning, a queue, a phone call, weather. Not a salary, a diagnosis, a pregnancy, a breakup, a named person who does not exist, or a fact about their family.
- Where the invention IS load-bearing, let the sentence show it is a guess — "maybe", "some version of", "if it goes the way these usually do". A reader who thinks "no, it would not be like that" has learned something real; a reader who cannot tell what you made up has not.
- No verdicts. Never say which path is better, never predict an outcome, never tell them what they want.
- TEXTURE IS FREE; INTERIOR LIFE IS NOT. Invent the ordinary as much as you need — weather, a commute, a kitchen, a queue, what is on the radio. Do not invent their motivations, values, fears, psychological tendencies, relationship dynamics, or how any of it turns out.
- THE ANALYSIS MAY NOT TREAT THE FICTION AS EVIDENCE. You just made these two days up. Nothing in them is a finding about this person, and how the writing went is a fact about writing, not about them. Never report which path was richer, easier, more alive or more fun to write — novelty is simply easier to dramatise than continuity, and saying so with "this is not an endorsement" attached is still a thumb on the scale.
- Their reaction to the stories is the material. Your reaction to your own stories is not.
${whatsHard?.trim() ? 'What they said makes this hard is the centre of gravity. Both days should be days in which that tension is quietly present — not discussed, not resolved, just there.' : ''}

Return ONLY valid JSON:

{
  "decision_framed": "Restate the core decision in one clean sentence",
  "how_to_read": "One or two sentences, in your own words: these are not predictions, they are two plausible days built from what they told you, and the useful thing is what they react to - including the parts that feel wrong.",
  "path_a": {
    "label": "Short label for this path (3-5 words)",
    "narrative": "200-300 word day-in-the-life narrative. Second person, present tense. A plausible Tuesday, ${tf} from now. Specific, sensory, honest — including both the good and the cost. End on a small, unresolved moment — but always complete the final sentence.",
    "a_moment_to_notice": "One imagined moment from this day worth pausing on. Offered to be reacted to, not as proof of anything. One sentence.",
    "a_cost_to_imagine": "One imagined cost of this path. You are imagining it, not reporting it - it has not happened. One sentence."
  },
  "path_b": {
    "label": "Short label for this path (3-5 words)",
    "narrative": "200-300 word day-in-the-life narrative. Same rules. Different life. Equally vivid and honest.",
    "a_moment_to_notice": "Same rules. One sentence.",
    "a_cost_to_imagine": "Same rules. One sentence."
  },
  "what_to_notice": {
    "the_tradeoff": "The tradeoff THEY described, restated from their own words - what each path keeps and what it costs. Only facts they supplied. No claim about what they will feel or miss. 1-2 sentences.",
    "watch_your_reaction": "Point them at their own response: which moments they leaned into, which made them resist or think 'no, it would not be like that'. Say that both reactions are useful. Never guess what their reaction was. 1-2 sentences.",
    "a_question_to_sit_with": "One question derived NEUTRALLY from the tradeoff they described, balanced so it does not lean toward either path. Not a discovery about their psychology. One sentence."
  }
}`;
}

// ════════════════════════════════════════════
// ROUTE: Standard (non-streaming) — fallback
// ════════════════════════════════════════════
router.post('/contrast-report', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { pathA, pathB, aboutYou, whatsHard, timeframe, userLanguage } = req.body;

    const MAX_INPUT = 5000;
    if ((pathA || '').length > MAX_INPUT || (pathB || '').length > MAX_INPUT || (aboutYou || '').length > MAX_INPUT) {
      return res.status(400).json({ error: 'That description is too long — trim it to the essentials (under 5,000 characters per field).' });
    }
    if (!pathA?.trim() || !pathB?.trim()) {
      return res.status(400).json({ error: "Describe both paths you're considering." });
    }

    const parsed = await callClaudeWithRetry(
      buildPrompt({ pathA, pathB, aboutYou, whatsHard, timeframe }),
      {
        label: 'contrast-report',
        model: MODELS.SMART,
        max_tokens: 4000,
        system: withLanguage(PERSONALITY, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      }
    );

    if (!parsed.path_a || !parsed.path_b) {
      return res.status(500).json({ error: 'Could not generate the contrast report. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('ContrastReport error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════
// ROUTE: Streaming — SSE endpoint
// NOTE: Uses raw anthropic.messages.stream — streaming requires raw SSE API;
// callClaudeWithRetry does not support streaming. This is the documented exception.
// ════════════════════════════════════════════
router.post('/contrast-report/stream', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  const { pathA, pathB, aboutYou, whatsHard, timeframe, userLanguage } = req.body;

  if (!pathA?.trim() || !pathB?.trim()) {
    return res.status(400).json({ error: "Describe both paths you're considering." });
  }

  // SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const stream = anthropic.messages.stream({
      model: MODELS.SMART,
      max_tokens: 4000,
      system: withLanguage(PERSONALITY, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: buildPrompt({ pathA, pathB, aboutYou, whatsHard, timeframe }) }],
    });

    stream.on('text', (chunk) => {
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
