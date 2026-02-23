const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');
const rateLimit = require('../lib/rateLimiter');

// ════════════════════════════════════════════════════════════
// BRAIN ROULETTE v3 — Backend
// v2 routes: spin, deeper, chain-deeper
// v3 routes: debate, journey, journey-step, extract-concepts, digest
// ════════════════════════════════════════════════════════════

// ── Main spin (v2) ──
router.post('/brain-roulette', rateLimit(), async (req, res) => {
  try {
    const { interests, depth, seenTopics, isSurprise, customTopic, audienceLevel, locale } = req.body;
    const lang = withLanguage(locale);
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const month = today.toLocaleDateString('en-US', { month: 'long' });
    const activeInterests = isSurprise ? [] : (interests || []);

    const depthInstruction = {
      quick: 'Respond with a fascinating 2-3 sentence nugget. Punchy, surprising, memorable.',
      medium: 'Respond with a compelling paragraph (4-6 sentences) that builds to a surprising twist or connection. Include one "wait, really?" moment.',
      deep: 'Respond with a multi-section exploration (3-4 short sections with bold headers). Start with the hook, go deeper into the "why", then land on a surprising connection or implication. About 200-300 words total.',
    }[depth] || 'Respond with a compelling paragraph (4-6 sentences).';

    const levelInstruction = {
      casual: 'AUDIENCE: Explain like talking to a curious friend. Use analogies. No jargon.',
      curious: '', nerd: 'AUDIENCE: Use proper terminology, cite specifics.',
      expert: 'AUDIENCE: Expert-level. Precise technical language. Non-obvious connections.',
    }[audienceLevel] || '';

    const topicInstruction = customTopic
      ? `The user wants to explore: "${customTopic}". Find the most surprising, non-obvious angle.${activeInterests.length > 0 ? ` Connect to their interests (${activeInterests.join(', ')}) if possible.` : ''}`
      : activeInterests.length > 0
        ? `USER'S INTERESTS: ${activeInterests.join(', ')}\nIMPORTANT: Find the unexpected INTERSECTION between 2+ interests.`
        : `SURPRISE — pick any fascinating topic from any domain. Go wild.`;

    const prompt = `You are Brain Roulette — a brilliant, endlessly curious friend who always has the most fascinating thing to say. Generate a single captivating rabbit hole.

TODAY: ${dateStr} | MONTH: ${month}

${topicInstruction}

DEPTH: ${depthInstruction}
${levelInstruction}

ALREADY COVERED (don't repeat): ${(seenTopics || []).slice(0, 30).join(', ') || 'None yet'}

TONE: Enthusiastic but not corny. Like a smart friend. Use "you" language. Hook immediately — no "Did you know?"

Respond ONLY with valid JSON:
{
  "title": "Short intriguing title (5-8 words)",
  "hook": "The main content",
  "topic_tag": "2-3 word tag",
  "interest_connections": ["interest1", "interest2"],
  "deeper_threads": [
    {"label": "Compelling question", "prompt_hint": "What to explore"},
    {"label": "Thread title", "prompt_hint": "What to explore"},
    {"label": "Thread title", "prompt_hint": "What to explore"}
  ],
  "share_snippet": "One punchy sentence for sharing"
}

CRITICAL: Return ONLY valid JSON.${lang}`;

    console.log(`[BrainRoulette] Spin | ${activeInterests.length ? activeInterests.join(', ') : customTopic ? 'CUSTOM:' + customTopic : 'SURPRISE'} | ${depth} | ${audienceLevel || 'curious'}`);
    const message = await anthropic.messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] });
    res.json(JSON.parse(cleanJsonResponse(message.content.find(i => i.type === 'text')?.text || '')));
  } catch (error) {
    console.error('Brain Roulette spin error:', error);
    res.status(500).json({ error: error.message || 'The roulette wheel got stuck!' });
  }
});

// ── Go Deeper (v2) ──
router.post('/brain-roulette/deeper', rateLimit(), async (req, res) => {
  try {
    const { originalTitle, originalHook, threadLabel, promptHint, audienceLevel, locale } = req.body;
    const lang = withLanguage(locale);
    if (!originalTitle || !threadLabel) return res.status(400).json({ error: 'Missing context' });
    const levelNote = { casual: 'Keep it accessible.', nerd: 'Go deeper technically.', expert: 'Maximum depth.' }[audienceLevel] || '';

    const prompt = `You are Brain Roulette's "Go Deeper" mode.

ORIGINAL: "${originalTitle}" — "${originalHook}"
THREAD: "${threadLabel}"
HINT: ${promptHint || threadLabel}
${levelNote}

Explore in 150-250 words. Bold key terms. End with a surprise. Suggest 2-3 NEW chain threads.

Respond ONLY with valid JSON:
{"title":"...","content":"...","mind_blown":"...","chain_threads":[{"label":"...","prompt_hint":"..."}]}

CRITICAL: Return ONLY valid JSON.${lang}`;

    const message = await anthropic.messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 1200, messages: [{ role: 'user', content: prompt }] });
    res.json(JSON.parse(cleanJsonResponse(message.content.find(i => i.type === 'text')?.text || '')));
  } catch (error) {
    console.error('Deeper error:', error);
    res.status(500).json({ error: "Couldn't dig deeper." });
  }
});

// ── Chain Deeper (v2) ──
router.post('/brain-roulette/chain-deeper', rateLimit(), async (req, res) => {
  try {
    const { originalTitle, chainHistory, threadLabel, promptHint, audienceLevel, locale } = req.body;
    const lang = withLanguage(locale);
    if (!threadLabel) return res.status(400).json({ error: 'Missing thread context' });
    const levelNote = { casual: 'Keep it accessible.', nerd: 'Technical depth.', expert: 'Maximum depth.' }[audienceLevel] || '';
    const historyContext = (chainHistory || []).map((h, i) => `Step ${i + 1}: "${h.title}" — ${h.content?.substring(0, 150)}...`).join('\n');

    const prompt = `Chain exploration mode.

ORIGINAL: "${originalTitle}"
PATH: ${historyContext || 'First dive'}
NOW EXPLORE: "${threadLabel}" | HINT: ${promptHint || threadLabel}
${levelNote}

Continue chain (150-250 words). Reference earlier steps. Suggest 2-3 MORE threads.

Respond ONLY with valid JSON:
{"title":"...","content":"...","mind_blown":"...","chain_threads":[{"label":"...","prompt_hint":"..."}]}

CRITICAL: Return ONLY valid JSON.${lang}`;

    const message = await anthropic.messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 1200, messages: [{ role: 'user', content: prompt }] });
    res.json(JSON.parse(cleanJsonResponse(message.content.find(i => i.type === 'text')?.text || '')));
  } catch (error) {
    console.error('Chain error:', error);
    res.status(500).json({ error: "Couldn't continue chain." });
  }
});

// ════════════════════════════════════════════════════════════
// v3: DEBATE MODE — "Actually..."
// ════════════════════════════════════════════════════════════
router.post('/brain-roulette/debate', rateLimit(), async (req, res) => {
  try {
    const { interests, seenTopics, audienceLevel, locale } = req.body;
    const lang = withLanguage(locale);
    const levelNote = { casual: 'Keep claim and reveal very accessible.', nerd: 'Include technical nuance.', expert: 'Full depth, cite data.' }[audienceLevel] || '';

    const prompt = `You are Brain Roulette's "Actually…" Debate Mode. Present a widely-believed "fact" that turns out to be wrong, misleading, or far more nuanced than people think.

${(interests || []).length > 0 ? `Draw from: ${interests.join(', ')}` : 'Pick any domain.'}
AVOID: ${(seenTopics || []).slice(0, 20).join(', ') || 'none'}
${levelNote}

The claim should be something most people would confidently agree with. The reveal should be genuinely surprising, not pedantic.

Respond ONLY with valid JSON:
{
  "claim": "The widely-believed 'fact' (1-2 confident sentences)",
  "confidence_prompt": "Short question, e.g. 'True or false?', 'Buy it or bust?'",
  "verdict": "mostly_false",
  "reveal_title": "Punchy title (4-6 words)",
  "reveal": "The truth — 3-5 engaging sentences with evidence",
  "why_we_believe_it": "1-2 sentences on why this myth persists",
  "mind_blown": "One final takeaway",
  "topic_tag": "2-3 word tag",
  "share_snippet": "Punchy one-liner for sharing"
}

verdict must be one of: "mostly_false", "misleading", "its_complicated", "surprisingly_true"

CRITICAL: Return ONLY valid JSON.${lang}`;

    console.log(`[BrainRoulette] Debate | ${(interests || []).join(', ') || 'any'}`);
    const message = await anthropic.messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 1200, messages: [{ role: 'user', content: prompt }] });
    res.json(JSON.parse(cleanJsonResponse(message.content.find(i => i.type === 'text')?.text || '')));
  } catch (error) {
    console.error('Debate error:', error);
    res.status(500).json({ error: 'Debate mode stumbled.' });
  }
});

// ════════════════════════════════════════════════════════════
// v3: GUIDED JOURNEY — Generate outline
// ════════════════════════════════════════════════════════════
router.post('/brain-roulette/journey', rateLimit(), async (req, res) => {
  try {
    const { interests, customTheme, audienceLevel, locale } = req.body;
    const lang = withLanguage(locale);

    const prompt = `Design a curated 6-step rabbit hole journey — each step builds on the last like a great documentary series.

${customTheme ? `THEME: "${customTheme}"` : `INTERESTS: ${(interests || []).join(', ') || 'anything fascinating'}`}

Create a journey with a compelling narrative arc where each step recontextualizes the previous, building to an "everything connects" finale.

Respond ONLY with valid JSON:
{
  "title": "Journey title (evocative, 4-8 words)",
  "description": "1-2 sentence teaser",
  "interest_connections": ["interest1", "interest2"],
  "steps": [
    {"step_number": 1, "title": "Step title (4-7 words)", "teaser": "One sentence preview", "prompt_hint": "Detailed prompt for generating content"},
    ... (6 steps total)
  ]
}

CRITICAL: Return ONLY valid JSON.${lang}`;

    console.log(`[BrainRoulette] Journey | ${customTheme || (interests || []).join(', ') || 'surprise'}`);
    const message = await anthropic.messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] });
    res.json(JSON.parse(cleanJsonResponse(message.content.find(i => i.type === 'text')?.text || '')));
  } catch (error) {
    console.error('Journey error:', error);
    res.status(500).json({ error: "Couldn't create journey." });
  }
});

// ── Journey Step content ──
router.post('/brain-roulette/journey-step', rateLimit(), async (req, res) => {
  try {
    const { journeyTitle, stepNumber, stepTitle, promptHint, previousSteps, audienceLevel, locale } = req.body;
    const lang = withLanguage(locale);
    const levelNote = { casual: 'Keep accessible.', nerd: 'Technical depth.', expert: 'Full depth.' }[audienceLevel] || '';
    const prevContext = (previousSteps || []).map(s => `Step ${s.step_number}: "${s.title}" — ${s.content?.substring(0, 100)}...`).join('\n');

    const prompt = `Generate step ${stepNumber} of journey "${journeyTitle}".

STEP: "${stepTitle}" | DIRECTION: ${promptHint}
${levelNote}
PREVIOUS: ${prevContext || 'First step.'}

Write 150-250 words. Reference previous steps. End with a hook for the next step. Extract 3-5 key concepts.

Respond ONLY with valid JSON:
{
  "title": "${stepTitle}",
  "content": "Step content",
  "mind_blown": "Surprising takeaway",
  "concepts": [{"label": "Concept name", "prompt_hint": "What's interesting"}],
  "next_hook": "Teaser for next step"
}

CRITICAL: Return ONLY valid JSON.${lang}`;

    const message = await anthropic.messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 1200, messages: [{ role: 'user', content: prompt }] });
    res.json(JSON.parse(cleanJsonResponse(message.content.find(i => i.type === 'text')?.text || '')));
  } catch (error) {
    console.error('Journey-step error:', error);
    res.status(500).json({ error: "Couldn't generate step." });
  }
});

// ════════════════════════════════════════════════════════════
// v3: EXTRACT CONCEPTS — "Spin From This"
// ════════════════════════════════════════════════════════════
router.post('/brain-roulette/extract-concepts', rateLimit(), async (req, res) => {
  try {
    const { title, content, locale } = req.body;
    const lang = withLanguage(locale);

    const prompt = `Extract 4-5 fascinating concepts from this content that would each make a great independent rabbit hole.

TITLE: "${title}"
CONTENT: "${content}"

For each concept, give a compelling spin-worthy angle.

Respond ONLY with valid JSON:
{"concepts": [{"label": "Concept (2-4 words)", "angle": "Why fascinating (1 sentence)", "spin_prompt": "Full prompt for a spin"}]}

CRITICAL: Return ONLY valid JSON.${lang}`;

    const message = await anthropic.messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 800, messages: [{ role: 'user', content: prompt }] });
    res.json(JSON.parse(cleanJsonResponse(message.content.find(i => i.type === 'text')?.text || '')));
  } catch (error) {
    console.error('Extract error:', error);
    res.status(500).json({ error: "Couldn't extract concepts." });
  }
});

// ════════════════════════════════════════════════════════════
// v3: DAILY DIGEST
// ════════════════════════════════════════════════════════════
router.post('/brain-roulette/digest', rateLimit(), async (req, res) => {
  try {
    const { interests, seenTopics, audienceLevel, locale } = req.body;
    const lang = withLanguage(locale);
    const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const prompt = `Generate a daily digest mini-newsletter with 3 rabbit holes for today.

DATE: ${dateStr}
INTERESTS: ${(interests || []).join(', ') || 'eclectic'}
AVOID: ${(seenTopics || []).slice(0, 20).join(', ') || 'none'}
LEVEL: ${audienceLevel || 'curious'}

1. TODAY: Connected to today's date/season. 3-4 sentences.
2. MASHUP: Intersects 2+ interests. 2-3 sentences.
3. WILDCARD: Completely unexpected. 1-2 sentences.

Respond ONLY with valid JSON:
{
  "date": "${dateStr}",
  "greeting": "Short energetic greeting",
  "topics": [
    {"type": "today", "emoji": "📅", "title": "Title", "content": "Content", "share_snippet": "One-liner", "topic_tag": "tag"},
    {"type": "mashup", "emoji": "🔀", "title": "Title", "content": "Content", "interest_connections": ["a","b"], "share_snippet": "One-liner", "topic_tag": "tag"},
    {"type": "wildcard", "emoji": "🃏", "title": "Title", "content": "Content", "share_snippet": "One-liner", "topic_tag": "tag"}
  ],
  "signoff": "Fun closing line"
}

CRITICAL: Return ONLY valid JSON.${lang}`;

    console.log(`[BrainRoulette] Digest | ${(interests || []).join(', ') || 'any'}`);
    const message = await anthropic.messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] });
    res.json(JSON.parse(cleanJsonResponse(message.content.find(i => i.type === 'text')?.text || '')));
  } catch (error) {
    console.error('Digest error:', error);
    res.status(500).json({ error: "Couldn't generate digest." });
  }
});

module.exports = router;
