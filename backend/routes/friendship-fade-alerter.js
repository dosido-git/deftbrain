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
    const { name, relationshipType, daysSinceContact, contextNotes, contactLog, upcomingEvents, usedTopics, reciprocity } = req.body;

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

    console.log(`[FriendshipFade] Generating for ${name} (${daysSinceContact}d, ${relationshipType})`);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1200,
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
    const { people } = req.body;

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

    console.log(`[FriendshipFade/batch] ${people.length} people`);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1500,
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
    const { name, relationshipType, daysSinceOutreach, originalMessage, contextNotes } = req.body;

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

    console.log(`[FriendshipFade/followup] ${name}, ${daysSinceOutreach}d since outreach`);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
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
    const { stats } = req.body;

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
  "streak_note": "Comment on their consistency streak (encouraging if good, motivating if broken)",
  "one_liner": "One warm closing sentence"
}

Return ONLY valid JSON.`;

    console.log(`[FriendshipFade/digest] ${stats.total} people, ${stats.contactedThisWeek} contacted`);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 800,
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

module.exports = router;
