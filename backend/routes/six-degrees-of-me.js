const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');
const { rateLimit} = require('../lib/rateLimiter');
// ════════════════════════════════════════════════════════════
// SIX DEGREES OF ME v2 — Backend
// v1: chain, flip, surprise, profile-prompt
// v2: challenge, what-if, story, tag-nodes, chain-between
// ════════════════════════════════════════════════════════════

const buildProfileContext = (profile) => {
  if (!profile || Object.keys(profile).length === 0) return 'No profile provided.';
  const s = [];
  if (profile.education?.length) s.push(`EDUCATION: ${profile.education.join('; ')}`);
  if (profile.career?.length) s.push(`CAREER: ${profile.career.join('; ')}`);
  if (profile.hobbies?.length) s.push(`HOBBIES: ${profile.hobbies.join('; ')}`);
  if (profile.places?.length) s.push(`PLACES: ${profile.places.join('; ')}`);
  if (profile.relationships?.length) s.push(`PEOPLE: ${profile.relationships.join('; ')}`);
  if (profile.fearsAndLoves?.length) s.push(`FEARS/LOVES: ${profile.fearsAndLoves.join('; ')}`);
  if (profile.formative?.length) s.push(`FORMATIVE: ${profile.formative.join('; ')}`);
  if (profile.freeform?.trim()) s.push(`OTHER: ${profile.freeform}`);
  return s.join('\n') || 'Minimal profile.';
};

// ── Main chain (v1) ──
router.post('/six-degrees', rateLimit(), async (req, res) => {
  try {
    const { thingA, thingB, profile, locale } = req.body;
    const lang = withLanguage(locale);
    if (!thingA?.trim() || !thingB?.trim()) return res.status(400).json({ error: 'Need both Thing A and Thing B.' });
    const profileCtx = buildProfileContext(profile);

    const prompt = `You are "Six Degrees of Me" — a brilliant pattern-finder who traces hidden chains connecting seemingly unrelated parts of someone's life.

THING A: "${thingA.trim()}"
THING B: "${thingB.trim()}"

PROFILE:
${profileCtx}

Find a chain of 4-6 degrees connecting A to B through this person's life. Each step: SPECIFIC to them, SURPRISING, CAUSAL, CONCRETE. The chain should feel like a revelation.

Provide a DEEP INSIGHT after — specific, thought-provoking, about their life pattern.

Respond ONLY with valid JSON:
{
  "chain": [{"step":1,"from":"Start (2-5 words)","to":"Next (2-5 words)","connection":"How from→to (1-2 sentences)","emoji":"🔗"}],
  "insight": {"title":"Punchy (4-8 words)","body":"2-4 sentences naming the pattern.","through_line":"5-10 word through-line"},
  "share_snippet": "One punchy sentence",
  "topic_tag": "2-3 word tag"
}

CRITICAL: Return ONLY valid JSON.${lang}`;

    const msg = await anthropic.messages.create({ model: 'claude-haiku-4-5-20251001', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] });
    res.json(JSON.parse(cleanJsonResponse(msg.content.find(i => i.type === 'text')?.text || '')));
  } catch (e) { console.error('SixDegrees chain:', e); res.status(500).json({ error: e.message || 'Chain broke!' }); }
});

// ── Flip (v1) ──
router.post('/six-degrees/flip', rateLimit(), async (req, res) => {
  try {
    const { thingA, thingB, profile, originalChain, locale } = req.body;
    const lang = withLanguage(locale);
    const origSummary = (originalChain || []).map(s => `${s.from}→${s.to}: ${s.connection}`).join('\n');

    const prompt = `Find a completely DIFFERENT chain from "${thingB}" back to "${thingA}". Different connections, different intermediate steps.

ORIGINAL (don't repeat): ${origSummary}
PROFILE: ${buildProfileContext(profile)}

Respond ONLY with valid JSON:
{"chain":[{"step":1,"from":"...","to":"...","connection":"...","emoji":"..."}],"insight":{"title":"...","body":"...","through_line":"..."},"share_snippet":"...","topic_tag":"..."}

CRITICAL: Return ONLY valid JSON.${lang}`;

    const msg = await anthropic.messages.create({ model: 'claude-haiku-4-5-20251001', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] });
    res.json(JSON.parse(cleanJsonResponse(msg.content.find(i => i.type === 'text')?.text || '')));
  } catch (e) { console.error('Flip:', e); res.status(500).json({ error: "Couldn't flip." }); }
});

// ── Surprise (v1) ──
router.post('/six-degrees/surprise', rateLimit(), async (req, res) => {
  try {
    const { profile, usedPairs, locale } = req.body;
    const lang = withLanguage(locale);

    const prompt = `Suggest 4 pairs of seemingly unrelated things from this person's life that would make fascinating chains.

PROFILE: ${buildProfileContext(profile)}
ALREADY TRIED: ${(usedPairs || []).join('; ') || 'none'}

Each pair from DIFFERENT domains. Include one wild card. Use specific profile details.

Respond ONLY with valid JSON:
{"pairs":[{"thingA":"...","thingB":"...","tease":"Why interesting (1 sentence)"}]}

CRITICAL: Return ONLY valid JSON.${lang}`;

    const msg = await anthropic.messages.create({ model: 'claude-haiku-4-5-20251001', max_tokens: 800, messages: [{ role: 'user', content: prompt }] });
    res.json(JSON.parse(cleanJsonResponse(msg.content.find(i => i.type === 'text')?.text || '')));
  } catch (e) { console.error('Surprise:', e); res.status(500).json({ error: "Couldn't suggest." }); }
});

// ── Profile prompts (v1) ──
router.post('/six-degrees/profile-prompt', rateLimit(), async (req, res) => {
  try {
    const { profile, category, locale } = req.body;
    const lang = withLanguage(locale);

    const prompt = `Generate 3 follow-up questions for someone building their profile, category "${category}".

EXISTING: ${buildProfileContext(profile)}

Questions: specific, drawing on what's shared, about turning points/surprises, conversational, short.

Respond ONLY with valid JSON:
{"questions":["Q1?","Q2?","Q3?"]}
CRITICAL: Return ONLY valid JSON.${lang}`;

    const msg = await anthropic.messages.create({ model: 'claude-haiku-4-5-20251001', max_tokens: 400, messages: [{ role: 'user', content: prompt }] });
    res.json(JSON.parse(cleanJsonResponse(msg.content.find(i => i.type === 'text')?.text || '')));
  } catch (e) { console.error('Profile-prompt:', e); res.status(500).json({ error: "Couldn't generate." }); }
});

// ════════════════════════════════════════════════════════════
// v2: CHALLENGE — Chain with constraints
// ════════════════════════════════════════════════════════════
router.post('/six-degrees/challenge', rateLimit(), async (req, res) => {
  try {
    const { thingA, thingB, profile, constraint, locale } = req.body;
    const lang = withLanguage(locale);
    if (!thingA?.trim() || !thingB?.trim()) return res.status(400).json({ error: 'Need both things.' });

    const constraintInstr = {
      short: 'Find the chain in EXACTLY 3 steps. No more, no less. Every step must be load-bearing.',
      long: 'Find a chain of at least 7 steps. Take the scenic route — find the most surprising, winding path.',
      no_career: `Connect these WITHOUT going through anything career/work related. Use hobbies, relationships, fears, places, formative moments instead.`,
      no_education: `Connect these WITHOUT going through anything education/school related.`,
      no_places: `Connect these WITHOUT referencing any geographic locations or moves.`,
      emotions_only: 'Every connection must go through an EMOTION or FEELING. Each step transitions through how one thing made them feel, which led to the next.',
    }[constraint] || constraint;

    const prompt = `You are "Six Degrees of Me" — CHALLENGE MODE.

THING A: "${thingA.trim()}"  THING B: "${thingB.trim()}"
PROFILE: ${buildProfileContext(profile)}

CONSTRAINT: ${constraintInstr}

Find the chain respecting the constraint. If the constraint makes it impossible, explain why in the insight (this itself is revealing).

Respond ONLY with valid JSON:
{
  "chain":[{"step":1,"from":"...","to":"...","connection":"...","emoji":"..."}],
  "insight":{"title":"...","body":"What this constrained path reveals.","through_line":"..."},
  "constraint_note": "Brief note on how the constraint shaped the path (1 sentence)",
  "difficulty": "easy" | "medium" | "hard" | "impossible",
  "share_snippet":"...","topic_tag":"..."
}

CRITICAL: Return ONLY valid JSON.${lang}`;

    const msg = await anthropic.messages.create({ model: 'claude-haiku-4-5-20251001', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] });
    res.json(JSON.parse(cleanJsonResponse(msg.content.find(i => i.type === 'text')?.text || '')));
  } catch (e) { console.error('Challenge:', e); res.status(500).json({ error: 'Challenge failed.' }); }
});

// ════════════════════════════════════════════════════════════
// v2: WHAT-IF — Counterfactual chain
// ════════════════════════════════════════════════════════════
router.post('/six-degrees/what-if', rateLimit(), async (req, res) => {
  try {
    const { thingA, thingB, profile, originalChain, removedStep, locale } = req.body;
    const lang = withLanguage(locale);

    const chainSummary = (originalChain || []).map(s => `${s.step}. ${s.from}→${s.to}: ${s.connection}`).join('\n');

    const prompt = `"Six Degrees of Me" — WHAT IF mode.

Original chain from "${thingA}" to "${thingB}":
${chainSummary}

The user removed step ${removedStep.step}: "${removedStep.from} → ${removedStep.to}" (${removedStep.connection})

PROFILE: ${buildProfileContext(profile)}

What happens if this connection never existed? Find an ALTERNATE chain from "${thingA}" to "${thingB}" that routes around the removed link. Use completely different intermediate steps.

Also assess: was this link LOAD-BEARING (hard to route around, fundamentally changed the path) or REDUNDANT (easy to bypass, destination was inevitable)?

Respond ONLY with valid JSON:
{
  "chain":[{"step":1,"from":"...","to":"...","connection":"...","emoji":"..."}],
  "insight":{"title":"...","body":"What the absence of this link reveals.","through_line":"..."},
  "linchpin_assessment": "load_bearing" | "redundant" | "partial",
  "linchpin_explanation": "1-2 sentences on why this link was/wasn't critical",
  "share_snippet":"...","topic_tag":"..."
}

CRITICAL: Return ONLY valid JSON.${lang}`;

    const msg = await anthropic.messages.create({ model: 'claude-haiku-4-5-20251001', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] });
    res.json(JSON.parse(cleanJsonResponse(msg.content.find(i => i.type === 'text')?.text || '')));
  } catch (e) { console.error('WhatIf:', e); res.status(500).json({ error: "Couldn't explore what-if." }); }
});

// ════════════════════════════════════════════════════════════
// v2: STORY OF YOU — Narrative synthesis
// ════════════════════════════════════════════════════════════
router.post('/six-degrees/story', rateLimit(), async (req, res) => {
  try {
    const { profile, chainHistory, locale } = req.body;
    const lang = withLanguage(locale);

    const chainSummaries = (chainHistory || []).slice(0, 20).map((h, i) =>
      `Chain ${i + 1}: "${h.thingA}" → "${h.thingB}" | Through-line: ${h.insight?.through_line || 'unknown'} | Insight: ${h.insight?.title || 'none'}`
    ).join('\n');

    const allNodes = new Set();
    (chainHistory || []).forEach(h => h.chain?.forEach(s => { allNodes.add(s.from); allNodes.add(s.to); }));

    const prompt = `You are a brilliant life narrator. Based on ALL the chains this person has explored, synthesize "The Story of You" — a 3-4 paragraph narrative about the hidden architecture of their life.

PROFILE: ${buildProfileContext(profile)}

ALL CHAINS EXPLORED (${(chainHistory || []).length} total):
${chainSummaries}

ALL UNIQUE NODES THAT APPEARED: ${[...allNodes].join(', ')}

Your narrative should:
1. IDENTIFY the 2-3 recurring through-lines across ALL their chains (not just one)
2. NAME which nodes are HUBS (appear in many chains) vs ISLANDS (rarely connected)
3. REVEAL a meta-pattern they probably can't see — what's the organizing principle of their life?
4. Be genuinely moving and specific — not generic self-help platitudes
5. End with one prediction: "Based on your pattern, the next big connection in your life will probably be..."

Respond ONLY with valid JSON:
{
  "title": "The Story of You title (evocative, personal, 4-8 words)",
  "paragraphs": ["Paragraph 1...", "Paragraph 2...", "Paragraph 3...", "Paragraph 4 (optional)..."],
  "hub_nodes": ["Node that appears everywhere", "Another hub"],
  "island_nodes": ["Node that's surprisingly isolated"],
  "through_lines": ["Through-line 1", "Through-line 2"],
  "prediction": "One sentence prediction about their next connection",
  "share_snippet": "One powerful sentence from the story"
}

CRITICAL: Return ONLY valid JSON.${lang}`;

    const msg = await anthropic.messages.create({ model: 'claude-haiku-4-5-20251001', max_tokens: 2500, messages: [{ role: 'user', content: prompt }] });
    res.json(JSON.parse(cleanJsonResponse(msg.content.find(i => i.type === 'text')?.text || '')));
  } catch (e) { console.error('Story:', e); res.status(500).json({ error: "Couldn't write your story." }); }
});

// ════════════════════════════════════════════════════════════
// v2: TAG NODES — Semantic auto-tagging
// ════════════════════════════════════════════════════════════
router.post('/six-degrees/tag-nodes', rateLimit(), async (req, res) => {
  try {
    const { nodes, locale } = req.body;
    const lang = withLanguage(locale);

    const prompt = `Categorize these life-concept nodes into semantic tags. Also identify nodes that refer to the SAME concept (should be merged).

NODES: ${(nodes || []).join(', ')}

Categories: career, education, relationship, place, hobby, emotion, skill, event, identity, health, belief

Respond ONLY with valid JSON:
{
  "tagged": [{"node":"exact node text","tag":"category","color":"hex color for category"}],
  "merge_suggestions": [{"nodes":["node1","node2"],"merged_label":"Suggested merged name","reason":"Why these are the same"}]
}

CRITICAL: Return ONLY valid JSON.${lang}`;

    const msg = await anthropic.messages.create({ model: 'claude-haiku-4-5-20251001', max_tokens: 1200, messages: [{ role: 'user', content: prompt }] });
    res.json(JSON.parse(cleanJsonResponse(msg.content.find(i => i.type === 'text')?.text || '')));
  } catch (e) { console.error('Tag:', e); res.status(500).json({ error: "Couldn't tag." }); }
});

// ════════════════════════════════════════════════════════════
// v2: CHAIN BETWEEN US — Two-player mode
// ════════════════════════════════════════════════════════════
router.post('/six-degrees/chain-between', rateLimit(), async (req, res) => {
  try {
    const { profileA, profileB, nameA, nameB, mode, sharedThing, locale } = req.body;
    const lang = withLanguage(locale);

    const modeInstr = mode === 'shared'
      ? `Both people connect to "${sharedThing}". Show how it connects to completely DIFFERENT parts of each person's life. Side-by-side chains.`
      : `Find the SHORTEST path connecting ${nameA || 'Person A'}'s life to ${nameB || 'Person B'}'s life. What's the strongest link between them?`;

    const prompt = `"Six Degrees of Me" — CHAIN BETWEEN US.

${nameA || 'PERSON A'}'s PROFILE:
${buildProfileContext(profileA)}

${nameB || 'PERSON B'}'s PROFILE:
${buildProfileContext(profileB)}

MODE: ${modeInstr}

${mode === 'shared' ? `
Show two chains:
1. How "${sharedThing}" connects to something unexpected in ${nameA}'s life
2. How "${sharedThing}" connects to something unexpected in ${nameB}'s life

Respond with valid JSON:
{
  "chainA": [{"step":1,"from":"...","to":"...","connection":"...","emoji":"..."}],
  "chainB": [{"step":1,"from":"...","to":"...","connection":"...","emoji":"..."}],
  "insight": {"title":"...","body":"How the same thing means completely different things to each person.","through_line":"..."},
  "share_snippet":"..."
}` : `
Find a chain linking someone from ${nameA}'s life to ${nameB}'s life (3-5 steps).

Respond with valid JSON:
{
  "chain": [{"step":1,"from":"...","to":"...","connection":"...","emoji":"...","person":"A"|"B"|"shared"}],
  "insight": {"title":"...","body":"What connects these two lives.","through_line":"..."},
  "share_snippet":"..."
}`}

CRITICAL: Return ONLY valid JSON.${lang}`;

    const msg = await anthropic.messages.create({ model: 'claude-haiku-4-5-20251001', max_tokens: 2500, messages: [{ role: 'user', content: prompt }] });
    res.json(JSON.parse(cleanJsonResponse(msg.content.find(i => i.type === 'text')?.text || '')));
  } catch (e) { console.error('ChainBetween:', e); res.status(500).json({ error: "Couldn't find the connection." }); }
});

module.exports = router;
