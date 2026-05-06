const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');
const { rateLimit } = require('../lib/rateLimiter');

async function withRetry(fn, { retries = 3, baseDelayMs = 1500 } = {}) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const status = err?.status ?? err?.error?.status;
      const isOverloaded = status === 529 || err?.error?.error?.type === 'overloaded_error';
      if (isOverloaded && attempt < retries) {
        const delay = baseDelayMs * Math.pow(2, attempt);
        console.warn(`[brain-roulette] Overloaded (529), retrying in ${delay}ms (attempt ${attempt + 1}/${retries})`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        throw err;
      }
    }
  }
}
// Rate limiting handled globally in server.js

// ── Main spin ──
router.post('/brain-roulette', rateLimit(), async (req, res) => {
  const { interests, depth, seenTopics, isSurprise, customTopic, audienceLevel, locale } = req.body;

  if (!depth) {
    return res.status(400).json({ error: 'depth is required' });
  }

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const month = today.toLocaleDateString('en-US', { month: 'long' });

  const activeInterests = isSurprise ? [] : (interests || []);

  const depthInstruction = {
    quick: 'Respond with a fascinating 2-3 sentence nugget. Punchy, surprising, memorable.',
    medium: 'Respond with a compelling paragraph (4-6 sentences) that builds to a surprising twist or connection. Include one "wait, really?" moment.',
    deep: 'Respond with a multi-section exploration (3-4 short sections with bold headers). Start with the hook, go deeper into the "why", then land on a surprising connection or implication. About 200-300 words total.',
  }[depth] || 'Respond with a compelling paragraph (4-6 sentences) that builds to a surprising twist or connection.';

  const prompt = withLanguage(`You are Brain Roulette — a brilliant, endlessly curious friend who always has the most fascinating thing to say at a dinner party. Your job is to generate a single captivating rabbit hole that the user can't stop thinking about.

TODAY'S DATE: ${dateStr}
CURRENT MONTH: ${month}

${activeInterests.length > 0
  ? `USER'S INTERESTS: ${activeInterests.join(', ')}
IMPORTANT: Don't just pick ONE interest — find the unexpected INTERSECTION between 2+ of their interests. That's where the magic happens. For example, if they like "History" and "Food", don't just give a history fact or a food fact — find where they collide (e.g., the bizarre diet of Roman gladiators, or how spice trade shaped empires).`
  : customTopic
    ? `The user wants to explore: "${customTopic}". Find the most surprising, non-obvious angle on this topic.`
    : `The user wants a SURPRISE — pick any fascinating topic from any domain. Go wild.`}

AUDIENCE LEVEL: ${audienceLevel || 'curious'}
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

Return ONLY valid JSON.`, locale);

  try {
    const msg = await withRetry(() => anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }));
    const parsed = JSON.parse(cleanJsonResponse(msg.content.find(i => i.type === 'text')?.text || ''));
    res.json(parsed);
  } catch (error) {
    console.error('Brain Roulette spin error:', error);
    res.status(500).json({ error: error.message || 'The roulette wheel got stuck. Give it another spin!' });
  }
});

// ── Go Deeper ──
router.post('/brain-roulette/deeper', rateLimit(), async (req, res) => {
  const { originalTitle, originalHook, threadLabel, promptHint, audienceLevel, locale } = req.body;

  if (!originalTitle || !threadLabel) {
    return res.status(400).json({ error: 'originalTitle and threadLabel are required' });
  }

  const prompt = withLanguage(`You are Brain Roulette's "Go Deeper" mode. The user found something fascinating and wants more.

ORIGINAL TOPIC: "${originalTitle}"
ORIGINAL CONTENT: "${originalHook}"
THREAD THEY WANT TO EXPLORE: "${threadLabel}"
HINT: ${promptHint || threadLabel}
AUDIENCE LEVEL: ${audienceLevel || 'curious'}

Give them a rich, engaging exploration of this specific thread. Write 150-250 words in a conversational, compelling style. Use bold text for key terms. End with one more surprising connection or implication they probably didn't see coming.

Respond ONLY with valid JSON:
{
  "title": "Section title",
  "content": "The deeper exploration",
  "mind_blown": "One final 'whoa' sentence",
  "chain_threads": [
    {"label": "Thread title", "prompt_hint": "What to explore"},
    {"label": "Thread title", "prompt_hint": "What to explore"}
  ]
}

Return ONLY valid JSON.`, locale);

  try {
    const msg = await withRetry(() => anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    }));
    const parsed = JSON.parse(cleanJsonResponse(msg.content.find(i => i.type === 'text')?.text || ''));
    res.json(parsed);
  } catch (error) {
    console.error('Brain Roulette deeper error:', error);
    res.status(500).json({ error: error.message || "Couldn't dig deeper. Try again!" });
  }
});

// ── Extract Concepts (Spin From This) ──
router.post('/brain-roulette/extract-concepts', rateLimit(), async (req, res) => {
  const { title, content, locale } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'title and content are required' });
  }

  const prompt = withLanguage(`You are Brain Roulette's concept extractor. The user just read a fascinating rabbit hole and wants to branch off into related ideas.

TOPIC TITLE: "${title}"
TOPIC CONTENT: "${content}"

Extract 3-5 distinct spinnable concepts buried in this content. Each concept should be:
- A specific, tangible idea (not a vague theme)
- Different enough from the others that clicking it would lead somewhere genuinely new
- Interesting enough to make someone think "oh I want to know more about THAT specifically"

Respond ONLY with valid JSON:
{
  "concepts": [
    {
      "label": "Short concept name (2-4 words)",
      "angle": "Why this is interesting — one sentence teaser",
      "spin_prompt": "The exact topic string to feed into a new spin (specific enough to get a focused result)"
    }
  ]
}

Return ONLY valid JSON.`, locale);

  try {
    const msg = await withRetry(() => anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    }));
    const parsed = JSON.parse(cleanJsonResponse(msg.content.find(i => i.type === 'text')?.text || ''));
    res.json(parsed);
  } catch (error) {
    console.error('Brain Roulette extract-concepts error:', error);
    res.status(500).json({ error: error.message || "Couldn't extract concepts. Try again!" });
  }
});

// ── Chain Deeper ──
router.post('/brain-roulette/chain-deeper', rateLimit(), async (req, res) => {
  const { originalTitle, chainHistory, threadLabel, promptHint, audienceLevel, locale } = req.body;

  if (!originalTitle || !threadLabel) {
    return res.status(400).json({ error: 'originalTitle and threadLabel are required' });
  }

  const historyText = (chainHistory || [])
    .map((cr, i) => `[Depth ${i + 1}] ${cr.title}: ${cr.content}`)
    .join('\n\n');

  const prompt = withLanguage(`You are Brain Roulette's "Chain Deeper" mode. The user has been going deeper and deeper on a topic and wants to keep going.

ORIGINAL TOPIC: "${originalTitle}"

CHAIN SO FAR:
${historyText || '(This is the first step deeper)'}

NEXT THREAD TO EXPLORE: "${threadLabel}"
HINT: ${promptHint || threadLabel}
AUDIENCE LEVEL: ${audienceLevel || 'curious'}

Continue the chain — build on what's been covered, go one level deeper still. Write 150-250 words in a conversational, compelling style. Don't recap what was already said. End with a genuinely surprising connection or implication.

Respond ONLY with valid JSON:
{
  "title": "Section title (distinct from previous titles)",
  "content": "The deeper exploration — builds on the chain, goes somewhere new",
  "mind_blown": "One final 'whoa' sentence",
  "chain_threads": [
    {"label": "Next thread title (question format)", "prompt_hint": "What to explore"},
    {"label": "Next thread title", "prompt_hint": "What to explore"}
  ]
}

Return ONLY valid JSON.`, locale);

  try {
    const msg = await withRetry(() => anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    }));
    const parsed = JSON.parse(cleanJsonResponse(msg.content.find(i => i.type === 'text')?.text || ''));
    res.json(parsed);
  } catch (error) {
    console.error('Brain Roulette chain-deeper error:', error);
    res.status(500).json({ error: error.message || "Couldn't continue chain. Try again!" });
  }
});

// ── Debate Mode ("Actually…") ──
router.post('/brain-roulette/debate', rateLimit(), async (req, res) => {
  const { interests, seenTopics, audienceLevel, locale } = req.body;

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  const prompt = withLanguage(`You are Brain Roulette's "Actually…" Debate Mode. Your job is to present a widely-held belief — then reveal the surprising truth.

TODAY: ${dateStr}
USER'S INTERESTS: ${(interests || []).length > 0 ? interests.join(', ') : 'general / anything'}
ALREADY SEEN TOPICS: ${(seenTopics || []).slice(0, 20).join(', ') || 'None yet'}
AUDIENCE LEVEL: ${audienceLevel || 'curious'}

Pick a common belief that most people hold — ideally connected to the user's interests if possible, otherwise anything fascinating. The belief should be something people would confidently say "yeah of course that's true." Then reveal the nuanced, surprising reality.

VERDICT OPTIONS (pick the most accurate):
- "mostly_false" — the belief is substantially wrong
- "misleading" — true in a narrow sense but deeply misleading in context
- "its_complicated" — genuinely complex with truth on multiple sides
- "surprisingly_true" — the belief is actually correct, but for weird/unexpected reasons

Respond ONLY with valid JSON:
{
  "claim": "The commonly-held belief, stated as a confident assertion (1-2 sentences)",
  "confidence_prompt": "A short question to the user like 'Think this is true?' or 'Would you bet on this?'",
  "verdict": "mostly_false | misleading | its_complicated | surprisingly_true",
  "reveal_title": "A punchy title for the reveal (5-8 words)",
  "reveal": "The fascinating truth — 100-150 words, conversational, builds to a punchline",
  "why_we_believe_it": "One sentence: why this myth is so persistent",
  "mind_blown": "One final jaw-dropping implication or follow-on fact",
  "share_snippet": "A one-sentence teaser perfect for texting a friend",
  "topic_tag": "2-3 word tag for deduplication (e.g. 'gladiator vegetarian diet')"
}

Return ONLY valid JSON.`, locale);

  try {
    const msg = await withRetry(() => anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    }));
    const parsed = JSON.parse(cleanJsonResponse(msg.content.find(i => i.type === 'text')?.text || ''));
    res.json(parsed);
  } catch (error) {
    console.error('Brain Roulette debate error:', error);
    res.status(500).json({ error: error.message || 'Debate mode stumbled. Try again!' });
  }
});

// ── Guided Journey (create 6-step plan) ──
router.post('/brain-roulette/journey', rateLimit(), async (req, res) => {
  const { interests, customTheme, audienceLevel, locale } = req.body;

  const prompt = withLanguage(`You are Brain Roulette's Guided Journey creator. Your job is to design a 6-step curated path where each discovery builds meaningfully on the last.

USER'S INTERESTS: ${(interests || []).length > 0 ? interests.join(', ') : 'open / anything'}
CUSTOM THEME: ${customTheme || 'None — choose a compelling theme based on their interests or go completely surprising'}
AUDIENCE LEVEL: ${audienceLevel || 'curious'}

Design a journey with a clear through-line — not 6 random facts, but 6 steps that tell a story or build an argument. Each step should make the next step feel inevitable and more exciting. The whole journey should feel like a satisfying intellectual arc.

Respond ONLY with valid JSON:
{
  "title": "Journey title (6-10 words, intriguing)",
  "description": "One sentence describing the arc of this journey",
  "steps": [
    {
      "step_number": 1,
      "title": "Step title (3-6 words)",
      "teaser": "One sentence teaser that makes them want to click",
      "prompt_hint": "What to explore in this step — used to generate the full content"
    },
    { "step_number": 2, "title": "...", "teaser": "...", "prompt_hint": "..." },
    { "step_number": 3, "title": "...", "teaser": "...", "prompt_hint": "..." },
    { "step_number": 4, "title": "...", "teaser": "...", "prompt_hint": "..." },
    { "step_number": 5, "title": "...", "teaser": "...", "prompt_hint": "..." },
    { "step_number": 6, "title": "...", "teaser": "...", "prompt_hint": "..." }
  ]
}

Return ONLY valid JSON.`, locale);

  try {
    const msg = await withRetry(() => anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    }));
    const parsed = JSON.parse(cleanJsonResponse(msg.content.find(i => i.type === 'text')?.text || ''));
    res.json(parsed);
  } catch (error) {
    console.error('Brain Roulette journey error:', error);
    res.status(500).json({ error: error.message || "Couldn't create journey. Try again!" });
  }
});

// ── Journey Step (generate content for one step) ──
router.post('/brain-roulette/journey-step', rateLimit(), async (req, res) => {
  const { journeyTitle, stepNumber, stepTitle, promptHint, previousSteps, audienceLevel, locale } = req.body;

  if (!journeyTitle || !stepTitle) {
    return res.status(400).json({ error: 'journeyTitle and stepTitle are required' });
  }

  const prevText = (previousSteps || [])
    .map(s => `Step ${s.step_number} — ${s.title}: ${s.content?.slice(0, 200)}…`)
    .join('\n\n');

  const prompt = withLanguage(`You are Brain Roulette's Guided Journey narrator. Generate the content for one step in a curated intellectual journey.

JOURNEY: "${journeyTitle}"
CURRENT STEP: ${stepNumber} — "${stepTitle}"
WHAT TO COVER: ${promptHint || stepTitle}
AUDIENCE LEVEL: ${audienceLevel || 'curious'}

PREVIOUS STEPS COVERED:
${prevText || 'This is step 1 — nothing covered yet.'}

Write this step as a natural continuation of what came before. Build on the previous steps' ideas — reference them briefly if it adds power. 150-250 words, conversational and compelling. End with a hint of what's coming next.

Respond ONLY with valid JSON:
{
  "title": "Step title (matches or refines the planned title)",
  "content": "The step content — builds the journey arc",
  "mind_blown": "One 'whoa' sentence specific to this step",
  "concepts": [
    {
      "label": "Spinnable concept from this step (2-4 words)",
      "angle": "Why this is interesting — one sentence",
      "prompt_hint": "Topic string for a new spin"
    }
  ],
  "next_hook": "One teaser sentence hinting at what's coming in the next step (omit on final step)"
}

Return ONLY valid JSON.`, locale);

  try {
    const msg = await withRetry(() => anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1200,
      messages: [{ role: 'user', content: prompt }],
    }));
    const parsed = JSON.parse(cleanJsonResponse(msg.content.find(i => i.type === 'text')?.text || ''));
    res.json(parsed);
  } catch (error) {
    console.error('Brain Roulette journey-step error:', error);
    res.status(500).json({ error: error.message || "Couldn't load step. Try again!" });
  }
});

// ── Daily Digest ──
router.post('/brain-roulette/digest', rateLimit(), async (req, res) => {
  const { interests, seenTopics, audienceLevel, locale } = req.body;

  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  const month = today.toLocaleDateString('en-US', { month: 'long' });

  const prompt = withLanguage(`You are Brain Roulette's Daily Digest curator. Generate exactly 3 fascinating discoveries for today.

TODAY: ${dateStr}
USER'S INTERESTS: ${(interests || []).length > 0 ? interests.join(', ') : 'open / anything goes'}
ALREADY SEEN (avoid these): ${(seenTopics || []).slice(0, 20).join(', ') || 'None yet'}
AUDIENCE LEVEL: ${audienceLevel || 'curious'}

Generate 3 topics using these 3 types in this order:
1. "today" — something connected to today's date, this day in history, or this time of year (${month})
2. "mashup" — an unexpected intersection of 2+ of the user's interests (or any 2 domains if no interests)
3. "wildcard" — completely surprising, from any domain, no constraints

Each topic should be a proper rabbit hole — not a trivia fact, but something with depth and a "wait, really?" moment.

Respond ONLY with valid JSON:
{
  "date": "${dateStr}",
  "greeting": "A warm, one-sentence welcome for today's digest (vary it — don't always start with 'Welcome')",
  "topics": [
    {
      "type": "today",
      "emoji": "📅",
      "title": "Topic title (5-8 words)",
      "content": "The rabbit hole — 3-5 sentences, compelling and surprising",
      "interest_connections": ["interest1", "interest2"],
      "share_snippet": "One punchy sentence for sharing",
      "topic_tag": "2-3 word dedup tag"
    },
    {
      "type": "mashup",
      "emoji": "🔀",
      "title": "...",
      "content": "...",
      "interest_connections": ["..."],
      "share_snippet": "...",
      "topic_tag": "..."
    },
    {
      "type": "wildcard",
      "emoji": "🃏",
      "title": "...",
      "content": "...",
      "interest_connections": [],
      "share_snippet": "...",
      "topic_tag": "..."
    }
  ],
  "signoff": "A short, warm closing line (vary daily)"
}

Return ONLY valid JSON.`, locale);

  try {
    const msg = await withRetry(() => anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    }));
    const parsed = JSON.parse(cleanJsonResponse(msg.content.find(i => i.type === 'text')?.text || ''));
    res.json(parsed);
  } catch (error) {
    console.error('Brain Roulette digest error:', error);
    res.status(500).json({ error: error.message || "Couldn't generate digest. Try again!" });
  }
});

module.exports = router;
