const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');
const { rateLimit } = require('../lib/rateLimiter');

// ════════════════════════════════════════════════════════════
// GENTLE PUSH GENERATOR
// Dispatches to action handlers based on req.body.action
// ════════════════════════════════════════════════════════════

router.post('/gentle-push-generator', rateLimit(), async (req, res) => {
  try {
    const { action, userLanguage, ...payload } = req.body;

    if (!action) {
      return res.status(400).json({ error: 'action is required' });
    }

    switch (action) {
      case 'generate':       return await handleGenerate(payload, userLanguage, res);
      case 'regenerate':     return await handleRegenerate(payload, userLanguage, res);
      case 'reflect':        return await handleReflect(payload, userLanguage, res);
      case 'review':         return await handleReview(payload, userLanguage, res);
      case 'courage-countdown': return await handleCourageCountdown(payload, userLanguage, res);
      case 'escalation-ladder': return await handleEscalationLadder(payload, userLanguage, res);
      case 'fear-inventory': return await handleFearInventory(payload, userLanguage, res);
      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    console.error('GentlePushGenerator error:', error);
    res.status(500).json({ error: error.message || 'Something went wrong.' });
  }
});

// ════════════════════════════════════════════════════════════
// ACTION: GENERATE — 3 calibrated pushes
// ════════════════════════════════════════════════════════════
async function handleGenerate({ domain, comfortZone, growthArea, currentCapacity, pushHistory }, userLanguage, res) {
  if (!growthArea?.trim()) {
    return res.status(400).json({ error: 'growthArea is required' });
  }

  const capacityGuide = {
    low:    'Keep challenges TINY. The person is struggling. A small brave step is a big deal right now.',
    medium: 'Normal calibration. Real but doable — slightly outside comfort but achievable this week.',
    high:   'They are ready for more. Can push a bit harder. Still must be achievable, not reckless.',
  };

  const historyNote = pushHistory?.length > 0
    ? `\nRECENT PUSH HISTORY (last ${pushHistory.length} pushes — use to avoid repeats and notice patterns):\n${pushHistory.slice(0, 5).map(p => `- "${p.challenge}" (${p.intensity}, attempted: ${p.attempted})`).join('\n')}`
    : '';

  const prompt = withLanguage(`You are a compassionate growth coach who specializes in calibrating challenges to exactly the right size — not too scary, not too easy. You understand that growth happens at the edge of comfort, not past the point of panic.

CONTEXT:
- Growth area: "${growthArea.trim()}"
- Domain: ${domain || 'not specified'}
- Comfort zone baseline: ${comfortZone?.trim() || 'not specified'}
- Current capacity: ${currentCapacity || 'medium'} — ${capacityGuide[currentCapacity] || capacityGuide.medium}
${historyNote}

Generate 3 distinct push challenges — one gentle, one moderate, one bold. Each must be:
- SPECIFIC and actionable (not "be more social" — "text one friend you haven't spoken to in 3 months")
- Sized for their capacity right now
- Achievable within the time frame given
- Genuinely different from each other in structure, not just intensity

Return ONLY valid JSON:
{
  "acknowledgment": "1-2 warm sentences acknowledging where they are and what they're working toward — human, not clinical",
  "if_you_dont": "One gentle sentence normalising it if they don't attempt — no shame, just information",
  "pattern_note": "Optional: 1 sentence noting a pattern in their push history (only if pushHistory has 3+ entries and a clear pattern). Omit if no history or no clear pattern.",
  "pushes": [
    {
      "intensity": "gentle",
      "challenge": "Specific, concrete challenge they can attempt this week",
      "time_frame": "e.g., 'This week', 'In the next 3 days', 'Today if possible'",
      "why_this_size": "Why this challenge is sized right for them RIGHT NOW — reference their specific situation",
      "what_counts": "What counts as success — lower the bar intentionally (e.g., 'Sending the text counts, even if they don't reply')",
      "if_too_much": "A smaller version — what to do if this still feels too big"
    },
    {
      "intensity": "moderate",
      "challenge": "...",
      "time_frame": "...",
      "why_this_size": "...",
      "what_counts": "...",
      "if_too_much": "..."
    },
    {
      "intensity": "bold",
      "challenge": "...",
      "time_frame": "...",
      "why_this_size": "...",
      "what_counts": "...",
      "if_too_much": "..."
    }
  ]
}

RULES:
- Never suggest anything that requires spending money, accessing specific locations, or contacting someone who hasn't consented
- The "bold" option should still be achievable — not terrifying, just a bigger step
- If capacity is LOW, even the "bold" option should be small by normal standards
- what_counts must make attempting easier than not — lower the bar
- Return ONLY the JSON object`, userLanguage);

  const parsed = await callClaudeWithRetry(prompt, {
    label: 'gpg-generate',
    max_tokens: 2000,
  });

  res.json(parsed);
}

// ════════════════════════════════════════════════════════════
// ACTION: REGENERATE — one new push based on feedback
// ════════════════════════════════════════════════════════════
async function handleRegenerate({ previousPush, feedback, domain, comfortZone, growthArea, currentCapacity }, userLanguage, res) {
  const prompt = withLanguage(`You are a compassionate growth coach. The person didn't like the push they were given and wants something different.

CONTEXT:
- Growth area: "${growthArea?.trim() || 'not specified'}"
- Domain: ${domain || 'not specified'}
- Comfort zone: ${comfortZone?.trim() || 'not specified'}
- Capacity: ${currentCapacity || 'medium'}
- Previous push: "${previousPush || 'not specified'}"
- Feedback: "${feedback}"

Generate ONE new push that directly addresses the feedback. If they said "too scary" — smaller. If "too easy" — bigger. If "wrong direction" — reframe the challenge entirely. If "not relevant" — try a completely different angle.

Return ONLY valid JSON:
{
  "response_to_feedback": "1 sentence acknowledging their feedback warmly",
  "push": {
    "intensity": "gentle|moderate|bold|adjusted",
    "challenge": "The new specific challenge",
    "time_frame": "When to do it",
    "why_this_size": "Why this is better sized given their feedback",
    "what_counts": "What counts as success",
    "if_too_much": "A smaller fallback if needed"
  }
}`, userLanguage);

  const parsed = await callClaudeWithRetry(prompt, {
    label: 'gpg-regenerate',
    max_tokens: 800,
  });

  res.json(parsed);
}

// ════════════════════════════════════════════════════════════
// ACTION: REFLECT — process the outcome
// ════════════════════════════════════════════════════════════
async function handleReflect({ push, attempted, scariness, predictedScariness, whatHappened }, userLanguage, res) {
  const prompt = withLanguage(`You are a compassionate growth coach helping someone process a comfort-zone challenge they just attempted (or didn't attempt).

WHAT THEY DID:
- Challenge: "${push || 'not specified'}"
- Attempted: ${attempted ? 'Yes' : 'No'}
${scariness ? `- How scary it was (actual): ${scariness}/5` : ''}
${predictedScariness ? `- How scary they expected it to be: ${predictedScariness}/5` : ''}
${whatHappened?.trim() ? `- What happened: "${whatHappened.trim()}"` : ''}

${attempted
  ? 'They attempted the challenge. Celebrate the attempt regardless of outcome — attempting IS success.'
  : 'They did not attempt the challenge. Be compassionate — this is information, not failure. Help them understand without shame.'}

${predictedScariness && scariness && predictedScariness !== scariness
  ? `The prediction gap: they expected ${predictedScariness}/5, reality was ${scariness}/5. ${predictedScariness > scariness ? 'Their brain overpredicted the danger.' : 'It was harder than expected — that took courage.'}`
  : ''}

Return ONLY valid JSON:
{
  "celebration": ${attempted ? '"Warm celebration of the attempt — 1-2 sentences. Reference what they actually did. No generic cheerleading."' : 'null'},
  "reflection": "1-2 sentences of honest, warm reflection on what this experience shows about their growth edge",
  "growth_insight": "One specific insight about their growth pattern — connect this to what their attempt (or non-attempt) reveals",
  "scariness_note": ${scariness ? '"1 sentence calibration note about their scariness rating"' : 'null'},
  "prediction_insight": ${predictedScariness && scariness ? '"1 sentence insight about the gap between predicted and actual scariness"' : 'null'},
  "next_suggestion": "One concrete, small suggestion for next time — either the same challenge or a step toward it"
}`, userLanguage);

  const parsed = await callClaudeWithRetry(prompt, {
    label: 'gpg-reflect',
    max_tokens: 800,
  });

  res.json(parsed);
}

// ════════════════════════════════════════════════════════════
// ACTION: REVIEW — growth map analysis
// ════════════════════════════════════════════════════════════
async function handleReview({ pushLog, domains }, userLanguage, res) {
  if (!pushLog?.length) {
    return res.status(400).json({ error: 'pushLog is required' });
  }

  const attempted = pushLog.filter(p => p.attempted).length;
  const attemptRate = Math.round((attempted / pushLog.length) * 100);
  const withScariness = pushLog.filter(p => p.scariness > 0 && p.attempted);
  const avgScariness = withScariness.length > 0
    ? Math.round((withScariness.reduce((s, p) => s + p.scariness, 0) / withScariness.length) * 10) / 10
    : 0;

  const prompt = withLanguage(`You are a growth coach analyzing someone's comfort-zone push history to help them understand their patterns.

PUSH HISTORY (${pushLog.length} total):
${pushLog.slice(0, 20).map(p => `- "${p.challenge}" | domain: ${p.domain || 'general'} | intensity: ${p.intensity} | attempted: ${p.attempted} | scariness: ${p.scariness || 'not rated'}/5 | date: ${p.date?.slice(0, 10) || 'unknown'}`).join('\n')}

DOMAIN COMFORT SCORES (1=terrified, 5=confident):
${domains ? Object.entries(domains).map(([d, v]) => `${d}: ${v}/5`).join(', ') : 'not provided'}

COMPUTED STATS:
- Total pushes: ${pushLog.length}
- Attempted: ${attempted} (${attemptRate}%)
- Avg scariness (attempted): ${avgScariness}/5

Analyze their patterns and growth trajectory.

Return ONLY valid JSON:
{
  "total_pushes": ${pushLog.length},
  "attempted": ${attempted},
  "attempt_rate": "${attemptRate}%",
  "avg_scariness": ${avgScariness},
  "comfort_zone_shift": {
    "direction": "expanding|stable|contracting",
    "evidence": "1-2 sentences of specific evidence from their history",
    "biggest_growth": "The domain or area where they've grown most"
  },
  "streak": {
    "current": 0,
    "longest": 0,
    "observation": "1 sentence about their consistency pattern"
  },
  "intensity_pattern": {
    "most_chosen": "gentle|moderate|bold",
    "observation": "1 sentence about what their intensity choices reveal"
  },
  "domain_breakdown": [
    {
      "domain": "social|professional|creative|physical|emotional|financial",
      "pushes": 0,
      "avg_scariness": 0,
      "trend": "growing|avoiding|neutral"
    }
  ],
  "blind_spots": "1 sentence about domains or patterns they're avoiding — or null if no clear blind spots",
  "encouragement": "1-2 genuinely warm sentences about what their history shows — specific, not generic",
  "next_recommendation": "1 specific suggestion for their next push based on patterns"
}

Only include domains in domain_breakdown that appear in their history.`, userLanguage);

  const parsed = await callClaudeWithRetry(prompt, {
    label: 'gpg-review',
    max_tokens: 1500,
  });

  res.json(parsed);
}

// ════════════════════════════════════════════════════════════
// ACTION: COURAGE COUNTDOWN — in-the-moment support
// ════════════════════════════════════════════════════════════
async function handleCourageCountdown({ push, domain, comfortZone }, userLanguage, res) {
  if (!push?.trim()) {
    return res.status(400).json({ error: 'push challenge is required' });
  }

  const prompt = withLanguage(`You are a calm, grounded coach helping someone in the moment right before they do something scary. They're about to attempt: "${push.trim()}"

Context: domain: ${domain || 'general'}, comfort zone: ${comfortZone?.trim() || 'not specified'}

Create a short courage countdown — a sequence of 4-5 steps that grounds them, reframes their fear, and gets them ready to act. This is NOT a pep talk. It's a practical sequence: breathe, name the fear, shrink it, go.

Return ONLY valid JSON:
{
  "opening": "1-2 sentences that meet them where they are — calm, not cheerleady. Acknowledge the fear.",
  "reframe": "1 sentence that reframes the challenge in a smaller, more manageable way",
  "steps": [
    { "emoji": "🫁", "instruction": "Take one slow breath. In for 4, out for 6." },
    { "emoji": "🧠", "instruction": "Name the actual fear. What's the worst realistic thing that happens?" },
    { "emoji": "📏", "instruction": "Shrink it: what's the absolute minimum version of this that still counts?" },
    { "emoji": "⏱️", "instruction": "Set a timer for 2 minutes. You only have to start — not finish." },
    { "emoji": "🚀", "instruction": "Go. Right now. Before your brain talks you out of it." }
  ],
  "go_line": "Short, direct line to go. Not cheerleading — a quiet push.",
  "panic_plan": "If they freeze: 1 sentence on the smallest possible version of the action they can take right now"
}

Steps should be 4-6 total. Keep each instruction to 1-2 sentences max. Practical, grounded, calm.`, userLanguage);

  const parsed = await callClaudeWithRetry(prompt, {
    label: 'gpg-countdown',
    max_tokens: 800,
  });

  res.json(parsed);
}

// ════════════════════════════════════════════════════════════
// ACTION: ESCALATION LADDER — step-by-step progression
// ════════════════════════════════════════════════════════════
async function handleEscalationLadder({ domain, comfortZone, growthArea, currentCapacity, pushHistory }, userLanguage, res) {
  if (!growthArea?.trim()) {
    return res.status(400).json({ error: 'growthArea is required' });
  }

  const historyNote = pushHistory?.length > 0
    ? `\nPast pushes in this area: ${pushHistory.slice(0, 5).filter(p => p.attempted).map(p => `"${p.challenge}"`).join(', ')}`
    : '';

  const prompt = withLanguage(`You are a growth coach building a personalized escalation ladder — a clear progression from tiny first steps to meaningful growth.

CONTEXT:
- Growth area: "${growthArea.trim()}"
- Domain: ${domain || 'not specified'}
- Comfort zone: ${comfortZone?.trim() || 'not specified'}
- Current capacity: ${currentCapacity || 'medium'}
${historyNote}

Create a 7-rung ladder from barely scary (1/5) to genuinely challenging (5/5). Each rung should be a clear, specific step. The ladder should tell a coherent story of progression.

Return ONLY valid JSON:
{
  "ladder_intro": "1 sentence explaining the ladder's progression",
  "current_position": 1,
  "rungs": [
    {
      "level": 1,
      "challenge": "Specific challenge — concrete and actionable",
      "estimated_scariness": 1,
      "why_this_level": "Why this is sized at this level"
    },
    { "level": 2, "challenge": "...", "estimated_scariness": 2, "why_this_level": "..." },
    { "level": 3, "challenge": "...", "estimated_scariness": 2, "why_this_level": "..." },
    { "level": 4, "challenge": "...", "estimated_scariness": 3, "why_this_level": "..." },
    { "level": 5, "challenge": "...", "estimated_scariness": 3, "why_this_level": "..." },
    { "level": 6, "challenge": "...", "estimated_scariness": 4, "why_this_level": "..." },
    { "level": 7, "challenge": "...", "estimated_scariness": 5, "why_this_level": "..." }
  ],
  "distance_note": "1 encouraging sentence about the distance from where they are to the top",
  "next_rung_suggestion": "Which rung to start with and why"
}

Set current_position to the rung that matches their current capacity and comfort zone.
estimated_scariness should use scale 1-5 and increase progressively (not necessarily one per rung).`, userLanguage);

  const parsed = await callClaudeWithRetry(prompt, {
    label: 'gpg-ladder',
    max_tokens: 1500,
  });

  res.json(parsed);
}

// ════════════════════════════════════════════════════════════
// ACTION: FEAR INVENTORY — profile analysis from scenario ratings
// ════════════════════════════════════════════════════════════
async function handleFearInventory({ responses }, userLanguage, res) {
  if (!responses || Object.keys(responses).length < 5) {
    return res.status(400).json({ error: 'At least 5 scenario responses required' });
  }

  const SCENARIOS = {
    s1:  { text: 'Eating alone at a restaurant',                    domain: 'social' },
    s2:  { text: 'Making a phone call to a stranger',               domain: 'social' },
    s3:  { text: 'Starting a conversation at a party',              domain: 'social' },
    s4:  { text: 'Saying no to a friend\'s request',                domain: 'emotional' },
    s5:  { text: 'Asking for a raise or promotion',                 domain: 'professional' },
    s6:  { text: 'Speaking up in a meeting',                        domain: 'professional' },
    s7:  { text: 'Sharing creative work publicly',                  domain: 'creative' },
    s8:  { text: 'Singing or performing in front of others',        domain: 'creative' },
    s9:  { text: 'Going to the gym alone',                          domain: 'physical' },
    s10: { text: 'Trying a new sport or class',                     domain: 'physical' },
    s11: { text: 'Crying in front of someone',                      domain: 'emotional' },
    s12: { text: 'Telling someone they hurt you',                   domain: 'emotional' },
    s13: { text: 'Checking your bank balance',                      domain: 'financial' },
    s14: { text: 'Negotiating a price',                             domain: 'financial' },
    s15: { text: 'Admitting you don\'t know something',             domain: 'professional' },
    s16: { text: 'Traveling somewhere alone',                       domain: 'physical' },
    s17: { text: 'Posting a photo of yourself online',              domain: 'creative' },
    s18: { text: 'Having a difficult conversation with family',     domain: 'emotional' },
    s19: { text: 'Applying for a job you\'re not sure you qualify for', domain: 'professional' },
    s20: { text: 'Asking someone on a date',                        domain: 'social' },
  };

  // Compute domain averages
  const domainTotals = {};
  const domainCounts = {};
  const ratedItems = [];

  Object.entries(responses).forEach(([id, score]) => {
    const scenario = SCENARIOS[id];
    if (!scenario || !score) return;
    ratedItems.push(`- "${scenario.text}" (${scenario.domain}): ${score}/5`);
    if (!domainTotals[scenario.domain]) { domainTotals[scenario.domain] = 0; domainCounts[scenario.domain] = 0; }
    domainTotals[scenario.domain] += score;
    domainCounts[scenario.domain]++;
  });

  const domainAvgs = {};
  Object.entries(domainTotals).forEach(([d, total]) => {
    domainAvgs[d] = Math.round((total / domainCounts[d]) * 10) / 10;
  });

  // Convert scariness (1-5) to comfort (1-5, inverted) for domain_scores
  const domainScores = {};
  Object.entries(domainAvgs).forEach(([d, avg]) => {
    domainScores[d] = Math.max(1, Math.min(5, Math.round(6 - avg)));
  });

  const prompt = withLanguage(`You are a growth coach analyzing someone's fear inventory to create a personalized comfort zone profile.

THEIR RATINGS (1=easy, 5=terrifying):
${ratedItems.join('\n')}

DOMAIN AVERAGES (scariness 1-5, lower=more comfortable):
${Object.entries(domainAvgs).map(([d, avg]) => `${d}: ${avg}/5`).join(', ')}

Analyze their fear profile and provide personalized insights.

Return ONLY valid JSON:
{
  "profile_summary": "2-3 sentences summarizing their overall fear profile — what's their comfort zone pattern? What does this reveal about them?",
  "strongest": {
    "domain": "the domain name (social|professional|creative|physical|emotional|financial)",
    "observation": "1 sentence about why this is their strongest area and what it means for growth"
  },
  "growth_edge": {
    "domain": "the domain with most growth potential given their profile",
    "observation": "1 sentence about why this domain offers the best leverage for their growth"
  },
  "biggest_fear": {
    "domain": "their highest-scariness domain",
    "observation": "1 compassionate sentence about this domain — no judgment, just insight"
  },
  "patterns": [
    { "pattern": "Pattern name", "insight": "What this pattern reveals about them — 1 sentence" },
    { "pattern": "Pattern name", "insight": "..." }
  ],
  "recommended_first_push": {
    "direction": "Specific suggested first push — concrete, not generic",
    "why": "Why this is the right starting point for them specifically"
  },
  "domain_scores": ${JSON.stringify(domainScores)}
}

Patterns should be cross-domain insights (e.g., "Social-professional crossover: comfortable one-on-one but scared in groups"). 2-3 patterns max. Be specific and insightful, not generic.`, userLanguage);

  const parsed = await callClaudeWithRetry(prompt, {
    label: 'gpg-inventory',
    max_tokens: 1200,
  });

  // Ensure domain_scores is always included (use computed values as fallback)
  if (!parsed.domain_scores) parsed.domain_scores = domainScores;

  res.json(parsed);
}

module.exports = router;
