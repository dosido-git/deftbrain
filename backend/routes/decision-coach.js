const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS, DIVERSION_LIMITS } = require('../lib/rateLimiter');
// ════════════════════════════════════════════════════════════
// DECISION COACH v3 — Backend
// v1: decide
// v2: pros-cons, quick-decide, patterns, group-decide, followup
// v3: dna, devils-advocate, batch, chain
// ════════════════════════════════════════════════════════════

const CAPACITY = {
  overwhelmed: 'The user is TOTALLY STUCK. Simplest possible answer, minimal steps. No choices — just tell them what to do.',
  low: 'The user has LOW ENERGY. Low-effort, comfort-first. Steps require minimal willpower.',
  medium: 'The user has SOME BANDWIDTH. Moderate effort is fine. 3-4 steps ok.',
};

// ── v1: Main decide ──
router.post('/decision-coach', rateLimit(), async (req, res) => {
  try {
    const { decisionNeeded, category, preferences, capacityLevel, recentDecisions, rejectedChoices, locale } = req.body;
    const lang = withLanguage(locale);
    if (!decisionNeeded) return res.status(400).json({ error: 'Describe the decision you need made' });

    const prompt = `You are Decision Coach — decisive, confident, warm. You MAKE the decision. ONE answer, not options.

DECISION NEEDED: ${decisionNeeded}
${category ? `CATEGORY: ${category}` : ''}
${preferences ? `CONSTRAINTS/PREFERENCES: ${preferences}` : ''}

CAPACITY: ${CAPACITY[capacityLevel] || CAPACITY.overwhelmed}

${recentDecisions?.length > 0 ? `RECENT DECISIONS (avoid repeating): ${recentDecisions.join(', ')}` : ''}
${rejectedChoices?.length > 0 ? `REJECTED (do NOT suggest these or similar): ${rejectedChoices.join(', ')}
IMPORTANT: New answer must be CLEARLY DIFFERENT — not a variation.` : ''}

YOUR APPROACH:
1. Consider ALL constraints
2. Pick ONE SPECIFIC answer (not "pasta" but "spaghetti carbonara")
3. Give 2-4 concrete execution steps (what to do RIGHT NOW)
4. Explain why you eliminated alternatives
5. Add a "no second-guessing" message — encouraging but firm

TONE: Confident, warm, slightly playful. Like a friend who's great at decisions.

OUTPUT (JSON only):
{
  "decision_made_for_you": {
    "choice": "The ONE specific answer",
    "why": "1-2 sentences why this is right",
    "alternatives_eliminated": ["Alt 1 — why it lost", "Alt 2 — why it lost", "Alt 3 — why it lost"]
  },
  "execution_instructions": ["Step 1: ...", "Step 2: ...", "Step 3: ..."],
  "no_second_guessing": "Firm, encouraging message to stop deliberating"
}

CRITICAL: Return ONLY valid JSON.${lang}`;

    console.log(`[DecisionCoach] Decide | "${decisionNeeded}" | Rejected: ${rejectedChoices?.length || 0}`);
    const msg = await anthropic.messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 1200, messages: [{ role: 'user', content: prompt }] });
    res.json(JSON.parse(cleanJsonResponse(msg.content.find(i => i.type === 'text')?.text || '')));
  } catch (e) { console.error('DecisionCoach decide:', e); res.status(500).json({ error: e.message || 'Failed to decide' }); }
});

// ════════════════════════════════════════════════════════════
// v2: PROS & CONS — Compare specific options
// ════════════════════════════════════════════════════════════
router.post('/decision-coach/pros-cons', rateLimit(), async (req, res) => {
  try {
    const { options, context, preferences, capacityLevel, locale } = req.body;
    const lang = withLanguage(locale);
    if (!options?.length || options.length < 2) return res.status(400).json({ error: 'Need at least 2 options' });

    const prompt = `You are Decision Coach — Pros & Cons mode. The user is stuck between specific options. Evaluate each, then PICK A WINNER. Be decisive.

OPTIONS TO COMPARE:
${options.map((o, i) => `${i + 1}. ${o}`).join('\n')}

${context ? `CONTEXT: ${context}` : ''}
${preferences ? `CONSTRAINTS: ${preferences}` : ''}
CAPACITY: ${CAPACITY[capacityLevel] || CAPACITY.overwhelmed}

For each option, evaluate:
- How well it fits their constraints
- Effort required
- Likely satisfaction
- Hidden downsides

Then PICK ONE WINNER. Be confident.

OUTPUT (JSON only):
{
  "comparison": [
    {
      "option": "Option name",
      "score": 85,
      "pros": ["Pro 1", "Pro 2"],
      "cons": ["Con 1"],
      "fit_summary": "One sentence on constraint fit"
    }
  ],
  "winner": {
    "choice": "The winning option (exact text)",
    "why": "2-3 sentences on why this wins",
    "margin": "close" | "clear" | "landslide"
  },
  "tie_breaker": "If close: the one factor that tips it",
  "execution_instructions": ["Step 1: ...", "Step 2: ..."],
  "no_second_guessing": "Firm message about why the winner is right"
}

CRITICAL: Return ONLY valid JSON.${lang}`;

    console.log(`[DecisionCoach] ProsCons | ${options.length} options`);
    const msg = await anthropic.messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 1800, messages: [{ role: 'user', content: prompt }] });
    res.json(JSON.parse(cleanJsonResponse(msg.content.find(i => i.type === 'text')?.text || '')));
  } catch (e) { console.error('DecisionCoach pros-cons:', e); res.status(500).json({ error: 'Failed to compare' }); }
});

// ════════════════════════════════════════════════════════════
// v2: QUICK DECIDE — Instant one-tap decision
// ════════════════════════════════════════════════════════════
router.post('/decision-coach/quick', rateLimit(), async (req, res) => {
  try {
    const { category, savedPreferences, recentDecisions, locale } = req.body;
    const lang = withLanguage(locale);

    const prompt = `You are Decision Coach — QUICK MODE. The user tapped ONE button. Give them an instant, specific decision.

CATEGORY: ${category || 'anything'}
${savedPreferences ? `SAVED PREFERENCES: ${savedPreferences}` : ''}
${recentDecisions?.length > 0 ? `RECENT (avoid these): ${recentDecisions.join(', ')}` : ''}

Rules:
- Be HYPER-SPECIFIC (not "watch a movie" but "watch The Grand Budapest Hotel")
- Maximum 2 execution steps
- Assume lowest possible effort tolerance
- Surprise them — don't be predictable

OUTPUT (JSON only):
{
  "decision_made_for_you": {
    "choice": "One hyper-specific answer",
    "why": "One punchy sentence"
  },
  "execution_instructions": ["Step 1: ...", "Step 2: ..."],
  "no_second_guessing": "One confident sentence"
}

CRITICAL: Return ONLY valid JSON.${lang}`;

    console.log(`[DecisionCoach] Quick | category: ${category}`);
    const msg = await anthropic.messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 600, messages: [{ role: 'user', content: prompt }] });
    res.json(JSON.parse(cleanJsonResponse(msg.content.find(i => i.type === 'text')?.text || '')));
  } catch (e) { console.error('DecisionCoach quick:', e); res.status(500).json({ error: 'Quick decide failed' }); }
});

// ════════════════════════════════════════════════════════════
// v2: PATTERNS — Analyze decision history
// ════════════════════════════════════════════════════════════
router.post('/decision-coach/patterns', rateLimit(), async (req, res) => {
  try {
    const { history, locale } = req.body;
    const lang = withLanguage(locale);
    if (!history?.length || history.length < 5) return res.status(400).json({ error: 'Need at least 5 past decisions' });

    const histSummary = history.slice(0, 30).map((h, i) => {
      const parts = [`${i + 1}. "${h.question}" → chose "${h.choice}"`];
      if (h.category) parts.push(`[${h.category}]`);
      if (h.rejections > 0) parts.push(`(rejected ${h.rejections} first)`);
      if (h.followUp) parts.push(`outcome: ${h.followUp}`);
      if (h.date) parts.push(`on ${new Date(h.date).toLocaleDateString()}`);
      return parts.join(' ');
    }).join('\n');

    const prompt = `You are a behavioral psychologist analyzing someone's decision-making patterns from their Decision Coach history.

DECISION HISTORY (${history.length} decisions):
${histSummary}

Analyze deeply:
1. What category do they struggle with most?
2. Average rejections — are they a "first answer" person or a "fifth try" person?
3. Time patterns — when do they need help most?
4. Constraint patterns — what do they always prioritize?
5. What do they THINK they want vs what they actually end up choosing?
6. The big insight — what's the real reason they can't decide?

Be specific, insightful, slightly provocative. Not generic self-help.

OUTPUT (JSON only):
{
  "headline_insight": "One punchy sentence about their decision pattern (personal, specific)",
  "stats": {
    "total_decisions": 0,
    "most_common_category": "category",
    "avg_rejections": 0.0,
    "acceptance_rate_first_try": "X%",
    "peak_time": "When they need help most (e.g. '6-8pm weekdays')"
  },
  "patterns": [
    {"title": "Pattern name (4-6 words)", "description": "2-3 sentences. Specific, insightful.", "emoji": "🔍"}
  ],
  "blind_spot": "Something they probably don't realize about how they decide (2-3 sentences)",
  "recommendation": "One actionable change that would help them decide faster (specific, not generic)",
  "share_snippet": "One punchy shareable sentence"
}

CRITICAL: Return ONLY valid JSON.${lang}`;

    console.log(`[DecisionCoach] Patterns | ${history.length} decisions`);
    const msg = await anthropic.messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] });
    res.json(JSON.parse(cleanJsonResponse(msg.content.find(i => i.type === 'text')?.text || '')));
  } catch (e) { console.error('DecisionCoach patterns:', e); res.status(500).json({ error: 'Pattern analysis failed' }); }
});

// ════════════════════════════════════════════════════════════
// v2: GROUP DECIDE — Multiple people, one decision
// ════════════════════════════════════════════════════════════
router.post('/decision-coach/group', rateLimit(), async (req, res) => {
  try {
    const { decisionNeeded, people, extraContext, locale } = req.body;
    const lang = withLanguage(locale);
    if (!decisionNeeded?.trim()) return res.status(400).json({ error: 'Describe the decision' });
    if (!people?.length || people.length < 2) return res.status(400).json({ error: 'Need at least 2 people' });

    const peopleSummary = people.map((p, i) =>
      `${i + 1}. ${p.name || `Person ${i + 1}`}: ${p.constraints || 'no specific constraints'}`
    ).join('\n');

    const prompt = `You are Decision Coach — GROUP MODE. Multiple people need to agree on one decision. Find the optimal compromise.

DECISION: ${decisionNeeded}
${extraContext ? `CONTEXT: ${extraContext}` : ''}

PEOPLE:
${peopleSummary}

YOUR APPROACH:
1. Map each person's constraints
2. Find the answer that satisfies the MOST constraints
3. Be specific about which constraints are satisfied vs compromised
4. If perfect consensus is impossible, say who compromises and why it's fair

TONE: Diplomatic but decisive. You're the friend who ends the 30-minute restaurant debate.

OUTPUT (JSON only):
{
  "group_decision": {
    "choice": "The ONE specific answer for the group",
    "why": "2-3 sentences on why this is the best compromise"
  },
  "person_fit": [
    {
      "name": "Person name",
      "satisfied": ["Constraint met", "Another met"],
      "compromised": ["Constraint they bend on"],
      "happiness": 85
    }
  ],
  "overall_satisfaction": 80,
  "execution_instructions": ["Step 1: ...", "Step 2: ..."],
  "diplomatic_pitch": "How to present this to the group so everyone feels heard (2-3 sentences)",
  "no_second_guessing": "Firm message to the group"
}

CRITICAL: Return ONLY valid JSON.${lang}`;

    console.log(`[DecisionCoach] Group | "${decisionNeeded}" | ${people.length} people`);
    const msg = await anthropic.messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 1800, messages: [{ role: 'user', content: prompt }] });
    res.json(JSON.parse(cleanJsonResponse(msg.content.find(i => i.type === 'text')?.text || '')));
  } catch (e) { console.error('DecisionCoach group:', e); res.status(500).json({ error: 'Group decide failed' }); }
});

// ════════════════════════════════════════════════════════════
// v2: FOLLOW-UP — Did you do it? What happened?
// ════════════════════════════════════════════════════════════
router.post('/decision-coach/followup', rateLimit(), async (req, res) => {
  try {
    const { originalDecision, outcome, actualChoice, satisfaction, locale } = req.body;
    const lang = withLanguage(locale);

    const prompt = `You are Decision Coach — FOLLOW-UP mode. Check in on a past decision.

ORIGINAL DECISION: ${originalDecision}
OUTCOME: ${outcome} ${/* did_it, didnt_do_it, changed */''}
${outcome === 'changed' && actualChoice ? `WHAT THEY DID INSTEAD: ${actualChoice}` : ''}
${satisfaction ? `SATISFACTION: ${satisfaction}/5` : ''}

${outcome === 'did_it' ? `
They followed through! Respond with:
- Validation (they made a good call)
- What this tells them about their preferences (useful for future decisions)
- One-sentence encouragement for next time` : ''}

${outcome === 'didnt_do_it' ? `
They didn't follow through. DON'T shame them. Instead:
- Gently explore what got in the way (decision fatigue? social pressure? secretly didn't want it?)
- What this reveals about their real preferences
- One small thing they could do differently next time` : ''}

${outcome === 'changed' ? `
They did something different! This is GOLD DATA. Analyze:
- Why the pivot? What does the actual choice reveal about what they really wanted?
- Gap between what they asked for and what they chose — what does that mean?
- How to use this insight for better future decisions` : ''}

OUTPUT (JSON only):
{
  "response": "2-4 sentences. Personal, warm, insightful. Not generic.",
  "insight": "One sentence about what this reveals about their decision-making",
  "preference_learned": "One specific preference to remember for future decisions (e.g. 'You prefer familiar comfort over adventure when tired')",
  "encouragement": "One sentence for next time"
}

CRITICAL: Return ONLY valid JSON.${lang}`;

    console.log(`[DecisionCoach] Followup | outcome: ${outcome}`);
    const msg = await anthropic.messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 800, messages: [{ role: 'user', content: prompt }] });
    res.json(JSON.parse(cleanJsonResponse(msg.content.find(i => i.type === 'text')?.text || '')));
  } catch (e) { console.error('DecisionCoach followup:', e); res.status(500).json({ error: 'Follow-up failed' }); }
});

// ════════════════════════════════════════════════════════════
// v3: DECISION DNA — Deep psychological profile
// ════════════════════════════════════════════════════════════
router.post('/decision-coach/dna', rateLimit(), async (req, res) => {
  try {
    const { history, learnedPreferences, locale } = req.body;
    const lang = withLanguage(locale);
    if (!history?.length || history.length < 8) return res.status(400).json({ error: 'Need at least 8 decisions for DNA analysis' });

    const histSummary = history.slice(0, 40).map((h, i) => {
      const parts = [`${i + 1}. "${h.question}" → "${h.choice}"`];
      if (h.category) parts.push(`[${h.category}]`);
      if (h.rejections > 0) parts.push(`(rejected ${h.rejections} first)`);
      if (h.followUp) parts.push(`outcome: ${h.followUp}`);
      if (h.date) parts.push(`${new Date(h.date).toLocaleDateString()}`);
      return parts.join(' ');
    }).join('\n');

    const prompt = `You are a behavioral psychologist building a deep "Decision DNA" profile. Go far beyond surface patterns — identify the PSYCHOLOGICAL architecture of how this person decides.

FULL HISTORY (${history.length} decisions):
${histSummary}

${learnedPreferences?.length ? `LEARNED PREFERENCES FROM FOLLOW-UPS: ${learnedPreferences.join('; ')}` : ''}

Build their Decision DNA:

1. ARCHETYPE: Which fits best? (pick exactly one, or create a hybrid)
   - "The Comfort Optimizer" — gravitates toward familiar, safe, known
   - "The Analysis Paralysis Pro" — rejects many, often picks #2 anyway
   - "The Permission Seeker" — already knows, needs validation
   - "The Perfectionist Staller" — nothing is good enough, defaults to nothing
   - "The Mood Surfer" — decisions completely depend on emotional state
   - "The Rebel" — rejects whatever is suggested, wants to feel autonomous
   Create a CUSTOM archetype if none fit perfectly.

2. STATED vs REAL CONSTRAINTS: What do they SAY they want vs what they ACTUALLY choose? (e.g. "always selects 'healthy' but rejects every healthy suggestion")

3. DOMAIN VELOCITY: Rejection rate by category. Which domains are they fast in, which are they slow in?

4. FOLLOW-THROUGH PATTERN: If follow-up data exists, what's the gap between deciding and doing?

5. GROWTH TRAJECTORY: Are they getting more decisive over time? Compare early decisions to recent ones.

6. CORE BLOCKER: The single deepest reason they struggle to decide. Not surface-level.

Be SPECIFIC, slightly provocative, genuinely insightful. This should feel like a therapist who's been watching them for months.

OUTPUT (JSON only):
{
  "archetype": {
    "name": "The [Custom Name]",
    "emoji": "🧬",
    "description": "2-3 sentences defining this archetype",
    "strengths": ["Strength 1", "Strength 2"],
    "blindspots": ["Blind spot 1", "Blind spot 2"]
  },
  "stated_vs_real": {
    "stated": "What they claim to want (1 sentence)",
    "real": "What they actually choose (1 sentence)",
    "gap_insight": "What this gap reveals (1-2 sentences)"
  },
  "domain_velocity": [
    {"domain": "food", "avg_rejections": 1.2, "verdict": "Fast — you trust your gut here"},
    {"domain": "tasks", "avg_rejections": 4.5, "verdict": "Slow — this is where you spiral"}
  ],
  "growth": {
    "early_avg_rejections": 3.5,
    "recent_avg_rejections": 1.8,
    "trajectory": "improving" | "stable" | "declining",
    "insight": "1 sentence on what changed"
  },
  "core_blocker": "2-3 sentences. The deep reason. Not generic.",
  "prescription": "One specific behavioral change that would transform their decision-making",
  "share_snippet": "One punchy sentence about their Decision DNA"
}

CRITICAL: Return ONLY valid JSON.${lang}`;

    console.log(`[DecisionCoach] DNA | ${history.length} decisions`);
    const msg = await anthropic.messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] });
    res.json(JSON.parse(cleanJsonResponse(msg.content.find(i => i.type === 'text')?.text || '')));
  } catch (e) { console.error('DecisionCoach DNA:', e); res.status(500).json({ error: 'DNA analysis failed' }); }
});

// ════════════════════════════════════════════════════════════
// v3: DEVIL'S ADVOCATE — Gut check & validation
// ════════════════════════════════════════════════════════════
router.post('/decision-coach/devils-advocate', rateLimit(), async (req, res) => {
  try {
    const { decisionNeeded, gutInstinct, preferences, locale } = req.body;
    const lang = withLanguage(locale);
    if (!gutInstinct?.trim()) return res.status(400).json({ error: 'Share your gut instinct first' });

    const prompt = `You are Decision Coach — DEVIL'S ADVOCATE mode.

The user is deciding: "${decisionNeeded}"
Their gut says: "${gutInstinct}"
${preferences ? `Their constraints: ${preferences}` : ''}

Your job:
1. Play devil's advocate AGAINST their gut instinct. Give 2-3 genuine reasons their gut might be wrong.
2. Then VALIDATE their gut. Explain why, despite those counterarguments, their instinct is probably right (or wrong, if it genuinely is).
3. Give a final verdict: should they trust their gut or override it?

Be honest. If their gut is actually wrong given their constraints, say so. If it's right, validate it powerfully.

The insight: "You already knew the answer. You just needed someone to say it's okay." — OR — "Your gut is leading you astray this time. Here's why."

OUTPUT (JSON only):
{
  "case_against": ["Reason 1 against their gut", "Reason 2", "Reason 3"],
  "case_for": ["Reason 1 for their gut", "Reason 2"],
  "verdict": "trust_gut" | "override_gut",
  "verdict_explanation": "2-3 sentences. Personal, direct.",
  "the_real_answer": "The specific answer they should go with (either their gut or an override)",
  "permission_slip": "One sentence of permission/validation. The thing they need to hear.",
  "execution_instructions": ["Step 1: ...", "Step 2: ..."]
}

CRITICAL: Return ONLY valid JSON.${lang}`;

    console.log(`[DecisionCoach] DevilsAdvocate | gut: "${gutInstinct}"`);
    const msg = await anthropic.messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 1200, messages: [{ role: 'user', content: prompt }] });
    res.json(JSON.parse(cleanJsonResponse(msg.content.find(i => i.type === 'text')?.text || '')));
  } catch (e) { console.error('DecisionCoach devils-advocate:', e); res.status(500).json({ error: "Devil's advocate failed" }); }
});

// ════════════════════════════════════════════════════════════
// v3: BATCH DECIDE — Pre-decide multiple at once
// ════════════════════════════════════════════════════════════
router.post('/decision-coach/batch', rateLimit(), async (req, res) => {
  try {
    const { category, count, preferences, recentDecisions, locale } = req.body;
    const lang = withLanguage(locale);
    const n = Math.min(count || 5, 7);

    const prompt = `You are Decision Coach — BATCH MODE. Pre-decide ${n} separate answers for the same category so the user doesn't have to think about it all week.

CATEGORY: ${category || 'dinner'}
${preferences ? `CONSTRAINTS: ${preferences}` : ''}
${recentDecisions?.length > 0 ? `RECENT (avoid these): ${recentDecisions.join(', ')}` : ''}

Rules:
- Each answer must be DIFFERENT from the others (variety is key)
- Each must be hyper-specific
- Mix it up: some easy, some slightly adventurous
- 1 execution step each (keep it fast)
- Label each for the day (Day 1, Day 2, etc.)

OUTPUT (JSON only):
{
  "decisions": [
    {
      "day": 1,
      "label": "Monday" (or just "Day 1"),
      "choice": "Hyper-specific answer",
      "why": "One sentence",
      "step": "One execution step"
    }
  ],
  "variety_note": "One sentence about the variety mix"
}

CRITICAL: Return ONLY valid JSON.${lang}`;

    console.log(`[DecisionCoach] Batch | ${n}x ${category}`);
    const msg = await anthropic.messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] });
    res.json(JSON.parse(cleanJsonResponse(msg.content.find(i => i.type === 'text')?.text || '')));
  } catch (e) { console.error('DecisionCoach batch:', e); res.status(500).json({ error: 'Batch decide failed' }); }
});

// ════════════════════════════════════════════════════════════
// v3: DECISION CHAIN — Linked cascading decisions
// ════════════════════════════════════════════════════════════
router.post('/decision-coach/chain', rateLimit(), async (req, res) => {
  try {
    const { primaryDecision, preferences, capacityLevel, locale } = req.body;
    const lang = withLanguage(locale);
    if (!primaryDecision?.trim()) return res.status(400).json({ error: 'Describe the primary decision' });

    const prompt = `You are Decision Coach — CHAIN MODE. One decision triggers others. Solve the WHOLE chain.

PRIMARY DECISION: "${primaryDecision}"
${preferences ? `CONSTRAINTS: ${preferences}` : ''}
CAPACITY: ${CAPACITY[capacityLevel] || CAPACITY.overwhelmed}

Your job:
1. Make the primary decision (be specific)
2. Identify 1-3 DOWNSTREAM decisions that depend on the primary choice
3. Solve each downstream decision too
4. Present as a decision tree: if primary = X, then downstream 1 = Y, downstream 2 = Z

This eliminates cascading paralysis — solve it all at once.

OUTPUT (JSON only):
{
  "primary": {
    "choice": "The primary decision answer",
    "why": "1 sentence"
  },
  "downstream": [
    {
      "question": "The downstream decision that follows",
      "depends_on": "What about the primary decision triggers this",
      "choice": "The answer",
      "step": "One execution step"
    }
  ],
  "full_plan": "2-3 sentences describing the complete chain as a coherent plan",
  "execution_instructions": ["Step 1: Primary action", "Step 2: First downstream", "Step 3: Next downstream"],
  "no_second_guessing": "Firm message about trusting the whole chain"
}

CRITICAL: Return ONLY valid JSON.${lang}`;

    console.log(`[DecisionCoach] Chain | "${primaryDecision}"`);
    const msg = await anthropic.messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] });
    res.json(JSON.parse(cleanJsonResponse(msg.content.find(i => i.type === 'text')?.text || '')));
  } catch (e) { console.error('DecisionCoach chain:', e); res.status(500).json({ error: 'Decision chain failed' }); }
});

module.exports = router;
