const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

function safeParseJSON(text) {
  let cleaned = cleanJsonResponse(text);
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
  try { return JSON.parse(cleaned); } catch {
    cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, ' ');
    try { return JSON.parse(cleaned); } catch {
      cleaned = cleaned.replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":');
      return JSON.parse(cleaned);
    }
  }
}

// ═══════════════════════════════════════════════════════════════
// MAIN — generate conversation starters for one person
// ═══════════════════════════════════════════════════════════════

router.post('/friendship-fade-alerter', async (req, res) => {
  try {
    const { name, relationshipType, daysSinceContact, contextNotes, contactLog, upcomingEvents, usedTopics, reciprocity, userLanguage } = req.body;

    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
    if (!relationshipType) return res.status(400).json({ error: 'Relationship type is required' });
    if (daysSinceContact === undefined) return res.status(400).json({ error: 'Days since contact is required' });

    const logBlock = contactLog?.length
      ? `\nPAST INTERACTIONS (most recent first):\n${contactLog.slice(0, 5).map(l => `- ${l.date}: ${l.note}${l.initiator === 'them' ? ' (they initiated)' : ''}`).join('\n')}`
      : '';

    const eventsBlock = upcomingEvents?.length
      ? `\nUPCOMING EVENTS:\n${upcomingEvents.map(e => `- ${e.label} on ${e.date}`).join('\n')}`
      : '';

    const freshnessBlock = usedTopics?.length
      ? `\nTOPICS ALREADY USED IN PAST MESSAGES (avoid these — find fresh angles):\n${usedTopics.map(t => `- "${t}"`).join('\n')}`
      : '';

    const reciprocityBlock = reciprocity
      ? `\nINITIATION PATTERN: You initiated ${reciprocity.youInitiated} times, they initiated ${reciprocity.theyInitiated} times out of last ${reciprocity.total} contacts.`
      : '';

    const prompt = `You are helping someone reconnect with a person in their life. Life gets busy and people lose track of time between conversations — that's completely normal. Your job is to make reaching out easy and natural.

PERSON: ${name}
RELATIONSHIP: ${relationshipType}
DAYS SINCE LAST CONTACT: ${daysSinceContact}
${contextNotes ? `CONTEXT / SHARED INTERESTS: ${contextNotes}` : ''}
${logBlock}
${eventsBlock}
${freshnessBlock}
${reciprocityBlock}

RULES:
- Messages should sound like THEM, not a template
- No guilt, no apologies for time passing — just natural warmth
- Reference specific shared interests, past conversations, or upcoming events when available
- Provide a range: quick low-effort texts AND deeper catch-up invitations
- Each message should be ready to copy and send as-is
- If TOPICS ALREADY USED are listed, do NOT reuse those angles — find fresh conversation starters
- If initiation pattern is one-sided, subtly adjust tone (don't lecture about it, just keep it lighter/lower-effort if they rarely initiate)

Return ONLY valid JSON:
{
  "starters": [
    {
      "message": "Ready-to-send message text",
      "tone": "casual / warm / direct / playful",
      "effort": "low / medium / high",
      "why_it_works": "Brief explanation",
      "follow_ups": ["Follow-up idea 1", "Follow-up idea 2"]
    }
  ],
  "approaches": [
    {
      "name": "Quick ping",
      "message": "Short ready-to-send message",
      "best_for": "When to use this approach"
    },
    {
      "name": "Catch-up invite",
      "message": "Message with a specific invitation",
      "best_for": "When to use this"
    }
  ],
  "context_hooks": [
    {
      "topic": "Specific topic to bring up",
      "angle": "How to naturally bring this into conversation"
    }
  ],
  "encouragement": "One warm, practical sentence about why reaching out now is a good idea (no guilt, no psychology, just real talk)"
}

Return ONLY valid JSON.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
      system: withLanguage('You are a helpful assistant that responds in the same language as the user.', userLanguage),
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = safeParseJSON(raw);
    res.json(parsed);

  } catch (error) {
    console.error('[FriendshipFade] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate starters' });
  }
});

// ═══════════════════════════════════════════════════════════════
// BATCH — generate starters for multiple overdue people at once
// ═══════════════════════════════════════════════════════════════

router.post('/friendship-fade-alerter/batch', async (req, res) => {
  try {
    const { people, userLanguage } = req.body;

    if (!people?.length) return res.status(400).json({ error: 'No people provided' });
    if (people.length > 8) return res.status(400).json({ error: 'Max 8 people per batch' });

    const peopleBlock = people.map((p, i) =>
      `${i + 1}. ${p.name} (${p.relationshipType}, ${p.daysSinceContact} days)${p.contextNotes ? ` — Context: ${p.contextNotes}` : ''}${p.lastNote ? ` — Last talked about: ${p.lastNote}` : ''}`
    ).join('\n');

    const prompt = `You are helping someone do a quick catch-up sprint — they have ${people.length} people they want to reach out to. Generate one ready-to-send message for each person. Messages should be natural, warm, and varied (don't use the same template for everyone).

PEOPLE TO REACH OUT TO:
${peopleBlock}

RULES:
- Each message must sound different — vary the opening, tone, and approach
- Keep messages short and sendable (1-3 sentences)
- Reference context/shared interests when provided
- No guilt, no apologies — just natural reconnection
- Mix of tones: some playful, some warm, some direct

Return ONLY valid JSON:
{
  "messages": [
    {
      "name": "Person's name",
      "message": "Ready-to-send message",
      "tone": "casual / warm / direct / playful",
      "tip": "One-line tip for this specific reconnection"
    }
  ],
  "sprint_encouragement": "One motivating sentence about knocking these all out"
}

Return ONLY valid JSON.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
      system: withLanguage('You are a helpful assistant that responds in the same language as the user.', userLanguage),
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = safeParseJSON(raw);
    res.json(parsed);

  } catch (error) {
    console.error('[FriendshipFade/batch] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate batch' });
  }
});

// ═══════════════════════════════════════════════════════════════
// FOLLOWUP ADVICE — what to do when someone didn't respond
// ═══════════════════════════════════════════════════════════════

router.post('/friendship-fade-alerter/followup-advice', async (req, res) => {
  try {
    const { name, relationshipType, daysSinceOutreach, originalMessage, contextNotes, userLanguage } = req.body;

    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });

    const prompt = `Someone reached out to a friend/contact and hasn't heard back. Help them figure out what to do — no overthinking, just practical advice.

PERSON: ${name}
RELATIONSHIP: ${relationshipType || 'friend'}
DAYS SINCE THEY REACHED OUT: ${daysSinceOutreach || 'unknown'}
${originalMessage ? `WHAT THEY SENT: "${originalMessage}"` : ''}
${contextNotes ? `CONTEXT: ${contextNotes}` : ''}

Give practical, non-anxious advice. Sometimes people are just busy. Sometimes the message got buried. Rarely is it personal.

Return ONLY valid JSON:
{
  "assessment": "Brief, honest read on the situation (1-2 sentences)",
  "recommendation": "wait / follow_up / let_it_go",
  "follow_up_message": "If follow-up is recommended: a ready-to-send message. If not: null",
  "follow_up_timing": "When to send it (e.g., 'Give it another 3-4 days')",
  "perspective": "One grounding sentence — not dismissive, not anxious, just realistic",
  "if_still_no_response": "What to do if they still don't respond after the follow-up"
}

Return ONLY valid JSON.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      system: withLanguage('You are a helpful assistant that responds in the same language as the user.', userLanguage),
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = safeParseJSON(raw);
    res.json(parsed);

  } catch (error) {
    console.error('[FriendshipFade/followup] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate advice' });
  }
});

// ═══════════════════════════════════════════════════════════════
// DIGEST — weekly relationship summary
// ═══════════════════════════════════════════════════════════════

router.post('/friendship-fade-alerter/digest', async (req, res) => {
  try {
    const { stats, userLanguage } = req.body;

    if (!stats) return res.status(400).json({ error: 'Stats are required' });

    const prompt = `Generate a brief, warm weekly relationship digest based on these stats. Be encouraging and practical — not preachy. If things look good, say so. If things are slipping, be honest but kind.

THIS WEEK'S STATS:
- People tracked: ${stats.total}
- Contacted this week: ${stats.contactedThisWeek} (${stats.contactedNames?.join(', ') || 'none'})
- Currently overdue: ${stats.overdueCount} (${stats.overdueNames?.join(', ') || 'none'})
- Due next week: ${stats.dueNextWeek} (${stats.dueNextWeekNames?.join(', ') || 'none'})
- Upcoming events (next 14 days): ${stats.upcomingEvents?.map(e => `${e.name}: ${e.label} on ${e.date}`).join(', ') || 'none'}
- Longest neglected: ${stats.longestNeglected || 'N/A'} (${stats.longestNeglectedDays || 0} days)
- One-sided relationships (you always initiate): ${stats.oneSided?.join(', ') || 'none'}
- Weekly streak: ${stats.streak || 0} weeks maintaining your contact goals
${stats.circles?.length ? `- Circle health: ${stats.circles.map(c => `${c.name}: ${c.overdue}/${c.total} overdue`).join(', ')}` : ''}

Return ONLY valid JSON:
{
  "headline": "One punchy sentence summarizing the week (e.g., 'Solid week — 4 catch-ups and only 1 overdue')",
  "wins": ["Something positive from this week", "Another win if applicable"],
  "attention_needed": ["Specific person or pattern that needs attention"],
  "next_week_priorities": ["Top priority for next week", "Secondary priority"],
  "proactive_priorities": [
    {
      "name": "Person's name",
      "reason": "Specific, non-generic reason why this person is the priority this week — what's the window, what's the context, what's at stake",
      "suggested_action": "One concrete thing to do or say — not 'reach out' but the actual approach"
    }
  ],
  "risk_flags": ["Any relationship showing signs of permanent fade — name + specific pattern that concerns you. Leave empty array if none."],
  "streak_note": "Comment on their consistency streak (encouraging if good, motivating if broken)",
  "one_liner": "One warm closing sentence"
}

Return ONLY valid JSON.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
      system: withLanguage('You are a helpful assistant that responds in the same language as the user.', userLanguage),
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = safeParseJSON(raw);
    res.json(parsed);

  } catch (error) {
    console.error('[FriendshipFade/digest] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate digest' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /friendship-fade-alerter/reengage — NetworkNurse
// Craft natural re-engagement messages for awkward silences
// ════════════════════════════════════════════════════════════
router.post('/friendship-fade-alerter/reengage', async (req, res) => {
  try {
    const { personName, relationship, howLong, lastContext, reason, userLanguage } = req.body;
    if (!personName?.trim()) return res.status(400).json({ error: 'Who are you reaching out to?' });
    if (!howLong?.trim()) return res.status(400).json({ error: 'How long has it been?' });

    const systemPrompt = `You are a social reconnection expert — someone who understands the psychology of awkward silences and knows how to dissolve them naturally. 

You know that most people WANT to hear from someone they've drifted from. The fear is almost always one-sided. Your job is to give people natural, specific, non-cringe re-engagement messages that feel like they came from a real person — not a template, not a therapy script.

The golden rules:
- Never acknowledge the gap explicitly unless it was clearly a falling-out
- Lead with something specific to THEM, not to the silence
- Don't make it weird. Don't explain yourself. Just reach out.
- The best re-engagement message sounds like there was never an awkward silence at all
- Short is almost always better. Long = effortful = obligation = pressure = silence
- Give them an easy on-ramp — something they can respond to without committing to much`;

    const userPrompt = `NETWORK NURSE — RE-ENGAGEMENT MESSAGES

Person: ${personName.trim()}
Relationship type: ${relationship || 'friend'}
Silence duration: ${howLong.trim()}
${lastContext?.trim() ? `Last context (what they last talked about or what was going on in their life): ${lastContext.trim()}` : ''}
${reason?.trim() ? `Why the silence started: ${reason.trim()}` : ''}

Write 3 re-engagement messages. Each should feel completely natural for a different approach.

Return ONLY valid JSON:
{
  "situation_read": "One honest sentence about what this silence likely feels like from both sides",

  "messages": [
    {
      "style": "casual | warm | practical",
      "style_label": "What this approach prioritizes (e.g., 'Low pressure', 'Emotional warmth', 'Easy hook')",
      "message": "The complete message — ready to send. Natural, specific, brief. Should not mention the silence or feel like an apology for reaching out.",
      "why_it_works": "One sentence on why this approach dissolves the awkwardness",
      "best_for": "When to use this version (e.g., 'If you want to keep it light', 'If you genuinely miss them', 'If you have a natural excuse')"
    }
  ],

  "what_NOT_to_say": [
    {
      "phrase": "The type of line to avoid",
      "why": "Why it makes things more awkward instead of less"
    }
  ],

  "if_they_dont_respond": "What to do and what it probably means — be honest, not just reassuring",

  "timing_tip": "Best time/channel to send this (text vs. DM vs. email, time of day, day of week)"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const raw = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = safeParseJSON(raw);
    res.json(parsed);

  } catch (error) {
    console.error('[FriendshipFade/reengage] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate re-engagement messages' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /friendship-fade-alerter/health-insight
// Qualitative AI read on a single relationship
// ════════════════════════════════════════════════════════════
router.post('/friendship-fade-alerter/health-insight', async (req, res) => {
  try {
    const { name, relationshipType, frequency, daysSinceContact, contactLog, contextNotes, reciprocity, drift, upcomingEvents, userLanguage } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });

    const logBlock = contactLog?.length
      ? `
CONTACT LOG (most recent first):
${contactLog.map(l => `- ${l.date}: "${l.note || 'Reached out'}"${l.initiator === 'them' ? ' (they initiated)' : ''}`).join('\n')}`
      : '';

    const reciprocityBlock = reciprocity
      ? `
RECIPROCITY: You initiated ${reciprocity.youInitiated}/${reciprocity.total} contacts (${reciprocity.balance})`
      : '';

    const driftBlock = drift
      ? `
DRIFT: Averaging every ${drift.avgInterval} days vs ${drift.target}d target — ${drift.drifted ? 'drifting' : 'on track'}`
      : '';

    const prompt = `You are a thoughtful relationship coach reading between the lines of someone's contact history with a person in their life. Give them genuine insight — not just summaries of numbers, but qualitative interpretation of what the pattern means.

PERSON: ${name}
RELATIONSHIP TYPE: ${relationshipType}
TARGET FREQUENCY: ${frequency}
DAYS SINCE LAST CONTACT: ${daysSinceContact}
${contextNotes ? `CONTEXT / SHARED INTERESTS: ${contextNotes}` : ''}
${logBlock}
${reciprocityBlock}
${driftBlock}
${upcomingEvents?.length ? `
UPCOMING EVENTS: ${upcomingEvents.map(e => e.label + ' on ' + e.date).join(', ')}` : ''}

Read this relationship honestly. Look for:
- Patterns in what they talk about vs what they used to talk about
- Whether the quality of connection seems to be deepening, stable, or fading
- What the reciprocity pattern says about the dynamic (not just the numbers)
- Any specific recommended action based on the full picture — not generic advice

Return ONLY valid JSON:
{
  "headline": "One punchy sentence capturing the real state of this relationship — honest, not harsh",
  "depth_reading": "2-3 sentences of qualitative insight beyond the numbers. What do the patterns actually mean? What's the real dynamic here?",
  "trajectory": "improving / stable / drifting / at_risk — and one sentence explaining why",
  "conversation_shift": "If the contact log shows a change in conversation depth or topics over time, describe it specifically. If not enough data or no shift, return null.",
  "action_recommendation": "One specific, actionable recommendation based on the full picture — not 'reach out more' but something concrete like what to say, what to address, or what to stop doing",
  "worth_a_deeper_check": true/false
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 900,
      system: withLanguage('You are a thoughtful relationship coach. Be honest, specific, and avoid generic advice.', userLanguage),
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content.find(b => b.type === 'text')?.text || '';
    const parsed = safeParseJSON(raw);
    res.json(parsed);

  } catch (error) {
    console.error('[FriendshipFade/health-insight] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate insight' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /friendship-fade-alerter/say-it-coach
// Scripts for addressing one-sided relationship dynamics
// ════════════════════════════════════════════════════════════
router.post('/friendship-fade-alerter/say-it-coach', async (req, res) => {
  try {
    const { name, relationshipType, contactLog, reciprocity, contextNotes, userLanguage } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });

    const logBlock = contactLog?.length
      ? `
RECENT INTERACTIONS:
${contactLog.map(l => `- ${l.date}: "${l.note || 'Reached out'}" (${l.initiator === 'them' ? 'they initiated' : 'you initiated'})`).join('\n')}`
      : '';

    const prompt = `Someone has noticed they always initiate contact with a person in their life. They want help deciding whether to address it — and if so, how.

PERSON: ${name}
RELATIONSHIP: ${relationshipType}
${contextNotes ? `CONTEXT: ${contextNotes}` : ''}
${reciprocity ? `INITIATION PATTERN: ${reciprocity.youInitiated} of last ${reciprocity.total} contacts initiated by them. They initiated ${reciprocity.theyInitiated}.` : ''}
${logBlock}

Be honest about whether this is worth addressing. Sometimes one-sidedness is normal (e.g., one person is a natural initiator), sometimes it signals a fading interest. Read the specific data and give real advice.

Return ONLY valid JSON:
{
  "situation_read": "1-2 sentences honestly reading what this pattern likely means in this specific relationship — not generic",
  "worth_saying": true/false,
  "whether_to_say_it": "Honest assessment of whether addressing this is likely to help or just create awkwardness — and why",
  "the_script": "If worth saying: the actual words to use. Natural, non-accusatory, opens a conversation rather than making a statement. If not worth saying: null.",
  "tone_notes": "How to deliver this — timing, setting, tone of voice, what to avoid",
  "what_to_expect": "Realistic outcome — what they'll probably say, how it typically goes",
  "if_they_get_defensive": "What to say if the immediate reaction is defensive or dismissive",
  "alternative": "If they don't want to say it directly: a behavioural shift that might naturally change the dynamic without the conversation"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: withLanguage('You are a direct, honest relationship coach. No fluff — give specific, actionable guidance.', userLanguage),
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content.find(b => b.type === 'text')?.text || '';
    const parsed = safeParseJSON(raw);
    res.json(parsed);

  } catch (error) {
    console.error('[FriendshipFade/say-it-coach] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate coaching' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /friendship-fade-alerter/frequency-suggest
// AI-recommended contact frequency adjustment based on drift data
// ════════════════════════════════════════════════════════════
router.post('/friendship-fade-alerter/frequency-suggest', async (req, res) => {
  try {
    const { name, relationshipType, currentFrequency, avgInterval, contactLog, userLanguage } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });

    const logBlock = contactLog?.length
      ? `\nRECENT CONTACT INTERVALS:\n${contactLog.slice(0, 6).map(l => `- ${l.date}: ${l.note || 'Contact'}`).join('\n')}`
      : '';

    const FREQ_OPTIONS = ['weekly', 'biweekly', 'monthly', 'quarterly', 'semiannually'];

    const prompt = `You are advising someone on how often to realistically aim to contact a person in their life. 
Their goal is healthy relationships that don't feel like a chore — the right target frequency is one they can actually maintain.

PERSON: ${name}
RELATIONSHIP TYPE: ${relationshipType}
CURRENT TARGET: ${currentFrequency}
ACTUAL AVERAGE INTERVAL: ${avgInterval ? `${avgInterval} days` : 'unknown'}
${logBlock}

Recommend a realistic adjusted frequency. Consider:
- If they're consistently missing their target by >50%, the target is unrealistic — lower it
- If actual interval is close to target but slightly over, suggest a small adjustment or staying the course
- Relationship type matters: close friends warrant more effort than acquaintances
- Better to have a realistic target they hit than an aspirational one they feel guilty about

Return ONLY valid JSON:
{
  "suggested_frequency": "one of: weekly | biweekly | monthly | quarterly | semiannually",
  "reasoning": "One honest, specific sentence explaining why this frequency fits the actual pattern — not generic advice",
  "impact": "What this adjustment will concretely change (e.g., 'Removes 2 overdue alerts per month you were ignoring')",
  "stay_the_course": true/false
}

Return ONLY valid JSON.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 400,
      system: withLanguage('You are a direct, practical relationship coach. No fluff.', userLanguage),
      messages: [{ role: 'user', content: prompt }],
    });

    const raw = message.content.find(b => b.type === 'text')?.text || '';
    const parsed = safeParseJSON(raw);

    // Validate suggested_frequency is a known value
    const VALID = ['weekly', 'biweekly', 'monthly', 'quarterly', 'semiannually'];
    if (parsed.suggested_frequency && !VALID.includes(parsed.suggested_frequency)) {
      parsed.suggested_frequency = currentFrequency;
    }

    res.json(parsed);

  } catch (error) {
    console.error('[FriendshipFade/freq-suggest] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to suggest frequency' });
  }
});

module.exports = router;
