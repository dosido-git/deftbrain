const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse } = require('../lib/claude');

// ── Robust JSON parser ──
function safeParseJSON(text) {
  let cleaned = cleanJsonResponse(text);
  // Strip trailing commas before } or ]
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
  try {
    return JSON.parse(cleaned);
  } catch {
    // Remove control characters and try again
    cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, ' ');
    try {
      return JSON.parse(cleaned);
    } catch {
      // Last resort: fix unquoted keys
      cleaned = cleaned.replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":');
      return JSON.parse(cleaned);
    }
  }
}

// ── Main spin ──
router.post('/brain-roulette', async (req, res) => {
  try {
    const { interests, depth, seenTopics, isSurprise } = req.body;

    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const month = today.toLocaleDateString('en-US', { month: 'long' });

    const activeInterests = isSurprise ? [] : (interests || []);

    const depthInstruction = {
      quick: 'Respond with a fascinating 2-3 sentence nugget. Punchy, surprising, memorable.',
      medium: 'Respond with a compelling paragraph (4-6 sentences) that builds to a surprising twist or connection. Include one "wait, really?" moment.',
      deep: 'Respond with a multi-section exploration (3-4 short sections with bold headers). Start with the hook, go deeper into the "why", then land on a surprising connection or implication. About 200-300 words total.',
    }[depth] || 'Respond with a compelling paragraph (4-6 sentences) that builds to a surprising twist or connection.';

    const prompt = `You are Brain Roulette — a brilliant, endlessly curious friend who always has the most fascinating thing to say at a dinner party. Your job is to generate a single captivating rabbit hole that the user can't stop thinking about.

TODAY'S DATE: ${dateStr}
CURRENT MONTH: ${month}

${activeInterests.length > 0
  ? `USER'S INTERESTS: ${activeInterests.join(', ')}
IMPORTANT: Don't just pick ONE interest — find the unexpected INTERSECTION between 2+ of their interests. That's where the magic happens. For example, if they like "History" and "Food", don't just give a history fact or a food fact — find where they collide (e.g., the bizarre diet of Roman gladiators, or how spice trade shaped empires).`
  : `The user wants a SURPRISE — pick any fascinating topic from any domain. Go wild.`}

DEPTH: ${depthInstruction}

ALREADY COVERED TOPICS (do NOT repeat or closely resemble these):
${(seenTopics || []).length > 0 ? seenTopics.slice(0, 30).join(', ') : 'None yet — this is their first spin!'}

TIME-AWARENESS: If relevant, connect to something about today's date, this season (${month}), or "on this day in history". This is optional — only if it genuinely adds interest, don't force it.

TONE: Enthusiastic but not corny. Like a smart friend, not a textbook. Use "you" language. Start with something that immediately hooks — no preamble, no "Did you know...?" cliché.

Respond ONLY with valid JSON in this exact format:
{
  "title": "A short, intriguing title (5-8 words max)",
  "hook": "The main content — the fascinating rabbit hole itself",
  "topic_tag": "A 2-3 word tag for tracking (e.g., 'Roman gladiator diets')",
  "interest_connections": ["interest1", "interest2"],
  "deeper_threads": [
    {"label": "Thread title (compelling question format)", "prompt_hint": "What to explore if they click Go Deeper"},
    {"label": "Thread title", "prompt_hint": "What to explore"},
    {"label": "Thread title", "prompt_hint": "What to explore"}
  ],
  "share_snippet": "A single punchy sentence version perfect for texting a friend"
}

CRITICAL: Return ONLY valid JSON. No preamble, no markdown fences.`;

    console.log(`[BrainRoulette] Spin | Interests: ${activeInterests.length ? activeInterests.join(', ') : 'SURPRISE'} | Depth: ${depth} | Seen: ${(seenTopics || []).length}`);

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }]
    });

    const raw = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = safeParseJSON(raw);
    res.json(parsed);

  } catch (error) {
    console.error('Brain Roulette spin error:', error);
    res.status(500).json({
      error: error.message || 'The roulette wheel got stuck. Give it another spin!'
    });
  }
});

// ── Go Deeper ──
router.post('/brain-roulette/deeper', async (req, res) => {
  try {
    const { originalTitle, originalHook, threadLabel, promptHint } = req.body;

    if (!originalTitle || !threadLabel) {
      return res.status(400).json({ error: 'Missing context for deeper exploration' });
    }

    const prompt = `You are Brain Roulette's "Go Deeper" mode. The user found something fascinating and wants more.

ORIGINAL TOPIC: "${originalTitle}"
ORIGINAL CONTENT: "${originalHook}"
THREAD THEY WANT TO EXPLORE: "${threadLabel}"
HINT: ${promptHint || threadLabel}

Give them a rich, engaging exploration of this specific thread. Write 150-250 words in a conversational, compelling style. Use bold text for key terms. End with one more surprising connection or implication they probably didn't see coming.

Respond ONLY with valid JSON:
{
  "title": "Section title",
  "content": "The deeper exploration",
  "mind_blown": "One final 'whoa' sentence"
}

CRITICAL: Return ONLY valid JSON. No preamble, no markdown fences.`;

    console.log(`[BrainRoulette] Go Deeper: "${threadLabel}" (from "${originalTitle}")`);

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }]
    });

    const raw = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = safeParseJSON(raw);
    res.json(parsed);

  } catch (error) {
    console.error('Brain Roulette deeper error:', error);
    res.status(500).json({
      error: error.message || "Couldn't dig deeper. Try again!"
    });
  }
});

module.exports = router;
