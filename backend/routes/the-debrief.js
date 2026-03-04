const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

// ════════════════════════════════════════════════════════════
// SHARED
// ════════════════════════════════════════════════════════════
const PERSONALITY = `You are an expert meeting analyst — part executive assistant, part project manager, part organizational psychologist. You've sat through thousands of meetings and you know that 90% of meeting time produces 10% of the value.

YOUR SKILL:
- Distinguish signal from noise: actual decisions vs. circular discussion, real commitments vs. vague "we should"
- Detect accountability gaps: things that were discussed but nobody owns
- Identify the subtext: what was left unsaid, where tension exists, what was deferred to avoid conflict
- Recognize meeting anti-patterns: decisions that got unmade, action items with no deadline, topics that keep resurfacing
- Be specific: "Sarah owns the Q3 report, due Friday" not "The report was discussed"`;

// ════════════════════════════════════════════════════════════
// POST /the-debrief — Distill: transcript → key decisions & actions
// ════════════════════════════════════════════════════════════
router.post('/the-debrief', async (req, res) => {
  try {
    const { transcript, meetingType, attendees, context, userLanguage } = req.body;

    if (!transcript?.trim()) {
      return res.status(400).json({ error: 'Paste your meeting transcript or notes' });
    }

    const typeNote = meetingType === 'standup' ? 'This is a standup/sync — focus on blockers, progress, and commitments.'
      : meetingType === 'planning' ? 'This is a planning meeting — focus on decisions, timelines, and ownership.'
      : meetingType === 'retro' ? 'This is a retrospective — focus on wins, issues, and improvement commitments.'
      : meetingType === 'one_on_one' ? 'This is a 1:1 — focus on feedback, concerns, and agreed next steps.'
      : meetingType === 'client' ? 'This is a client meeting — focus on commitments made, expectations set, and follow-ups.'
      : meetingType === 'brainstorm' ? 'This is a brainstorm — focus on ideas generated, which got energy, and what was decided to pursue.'
      : 'General meeting — extract all decisions, actions, and open questions.';

    const systemPrompt = `${PERSONALITY}

DISTILL MODE: Extract the actionable output from this meeting. ${typeNote}

RULES:
- Every action item needs an OWNER and a DEADLINE. If neither was stated, flag it as unassigned.
- Decisions should be stated as facts, not "it was discussed" — "We decided X" or "No decision was reached on X"
- Distinguish between "someone said we should" (not a decision) and "we agreed to" (a decision)
- Open questions are things that were raised but not resolved — these are future agenda items
- Be ruthless about filtering filler: pleasantries, tangents, repeated points, circular discussion`;

    const userPrompt = `MEETING TRANSCRIPT:
${meetingType ? `Meeting type: ${meetingType}` : ''}
${attendees ? `Attendees: ${attendees}` : ''}
${context ? `Context: ${context}` : ''}

${transcript.substring(0, 30000)}

Extract the meeting output. Return ONLY valid JSON:

{
  "meeting_summary": "One sentence: what this meeting was about and its primary outcome",
  "meeting_type_detected": "What type of meeting this appears to be",
  "duration_estimate": "Estimated meeting length based on transcript volume",

  "decisions": [
    {
      "decision": "What was decided — stated as a fact",
      "context": "Brief context for why this decision was made",
      "who_decided": "Who made or drove this decision, if identifiable",
      "reversibility": "Easily reversed if wrong, or committed/hard to undo"
    }
  ],

  "action_items": [
    {
      "action": "Specific task that needs to happen",
      "owner": "Who's responsible — name if stated, 'UNASSIGNED' if not",
      "deadline": "When it's due — exact date if stated, 'No deadline set' if not",
      "priority": "high | medium | low",
      "status": "new | in_progress | blocked | waiting",
      "depends_on": "What this action depends on, if anything. null if standalone."
    }
  ],

  "open_questions": [
    {
      "question": "Something that was raised but not resolved",
      "why_unresolved": "Why it didn't get resolved — ran out of time, needs data, someone was absent, etc.",
      "suggested_owner": "Who should own getting this resolved"
    }
  ],

  "parking_lot": [
    "Topics that came up but were deferred — future agenda items"
  ],

  "tensions": [
    {
      "topic": "Where there was disagreement or unspoken friction",
      "nature": "What the tension was about — be specific but diplomatic",
      "resolution": "How it was resolved, or 'Unresolved'"
    }
  ] or [],

  "meeting_health": {
    "efficiency": "How much of the meeting produced value vs. filler — percentage estimate",
    "accountability": "Were owners and deadlines assigned, or was it vague?",
    "pattern_warning": "If anything suggests a recurring problem (topic that keeps resurfacing, decisions that keep getting revisited). null if clean."
  },

  "follow_up_email": "A concise, ready-to-send follow-up email summarizing decisions and action items. Professional tone, bullet points for actions."
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const parsed = JSON.parse(cleanJsonResponse(text));
    res.json(parsed);

  } catch (error) {
    console.error('The Debrief error:', error);
    res.status(500).json({ error: error.message || 'Meeting distillation failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /the-debrief/followup — Draft follow-up messages
// ════════════════════════════════════════════════════════════
router.post('/the-debrief/followup', async (req, res) => {
  try {
    const { transcript, meetingType, attendees, recipientRole, tone, userLanguage } = req.body;

    if (!transcript?.trim()) {
      return res.status(400).json({ error: 'Paste your meeting transcript or notes' });
    }

    const toneNote = tone === 'formal' ? 'Professional and formal — suitable for executives or clients.'
      : tone === 'casual' ? 'Warm and casual — suitable for team members you know well.'
      : 'Balanced professional — friendly but clear.';

    const systemPrompt = `${PERSONALITY}

FOLLOW-UP MODE: Draft follow-up messages from this meeting. ${toneNote}

Each message should be concise, action-oriented, and reference specific decisions and deadlines from the meeting. Never vague. Always specific.`;

    const userPrompt = `MEETING TRANSCRIPT:
${meetingType ? `Meeting type: ${meetingType}` : ''}
${attendees ? `Attendees: ${attendees}` : ''}
${recipientRole ? `Follow-up recipient: ${recipientRole}` : ''}
Tone: ${tone || 'professional'}

${transcript.substring(0, 25000)}

Draft follow-up messages. Return ONLY valid JSON:

{
  "group_email": {
    "subject": "Email subject line",
    "body": "Full email body — concise, professional, with clear action items per person"
  },

  "individual_nudges": [
    {
      "to": "Person name or role",
      "message": "Short, specific follow-up message — references their specific action item and deadline",
      "channel": "email | slack | text — best channel for this type of follow-up",
      "urgency": "send_now | within_24h | can_wait"
    }
  ],

  "boss_update": {
    "subject": "Brief subject",
    "body": "Upward summary for a manager who wasn't in the meeting — decisions, risks, and what you need from them. 3-5 sentences max."
  },

  "calendar_invites": [
    {
      "title": "What to schedule",
      "attendees": "Who needs to be there",
      "when": "When to schedule it — specific or relative ('next Tuesday', 'before Friday')",
      "purpose": "One line on why this meeting is needed"
    }
  ] or []
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const parsed = JSON.parse(cleanJsonResponse(text));
    res.json(parsed);

  } catch (error) {
    console.error('The Debrief followup error:', error);
    res.status(500).json({ error: error.message || 'Follow-up drafting failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /the-debrief/series — Analyze meeting series for patterns
// ════════════════════════════════════════════════════════════
router.post('/the-debrief/series', async (req, res) => {
  try {
    const { meetings, context, userLanguage } = req.body;

    if (!meetings?.length || meetings.length < 2) {
      return res.status(400).json({ error: 'Paste at least 2 meeting transcripts to compare' });
    }

    const validMeetings = meetings.filter(m => m.transcript?.trim());
    if (validMeetings.length < 2) {
      return res.status(400).json({ error: 'Need at least 2 meetings with content' });
    }

    const systemPrompt = `${PERSONALITY}

SERIES MODE: Analyze multiple meetings from the same series (weekly standups, project syncs, etc.) to find patterns.

FOCUS ON:
- Action items that were assigned but never completed — accountability gaps
- Topics that keep resurfacing without resolution — decision avoidance
- Who's doing the talking vs. who's silent — power dynamics
- Whether meetings are getting more or less productive over time
- Commitments made in meeting 1 that should have been done by meeting 2`;

    const meetingList = validMeetings.map((m, i) =>
      `--- MEETING ${i + 1}${m.title ? `: ${m.title}` : ''}${m.date ? ` (${m.date})` : ''} ---\n${m.transcript.substring(0, 8000)}`
    ).join('\n\n');

    const userPrompt = `MEETING SERIES:
${context ? `Context: ${context}` : ''}

${meetingList}

Analyze the series. Return ONLY valid JSON:

{
  "series_summary": "What these meetings are about and the overall trajectory — getting better, stuck, or drifting?",

  "recurring_topics": [
    {
      "topic": "Something that keeps coming up",
      "frequency": "Appeared in X of Y meetings",
      "resolved": true or false,
      "why_recurring": "Why this keeps surfacing — not enough time, no owner, avoiding a hard decision?"
    }
  ],

  "accountability_gaps": [
    {
      "action": "An action item that was assigned",
      "assigned_meeting": "Which meeting it was assigned in",
      "owner": "Who was supposed to do it",
      "status": "completed | incomplete | disappeared — never mentioned again",
      "pattern": "Is this person/topic a repeat offender?"
    }
  ],

  "decisions_revisited": [
    {
      "decision": "A decision that was made and then reopened or reversed",
      "original_meeting": "When it was first decided",
      "revisited_meeting": "When it got reopened",
      "why": "Why it was revisited — new information, someone wasn't bought in, poor execution"
    }
  ] or [],

  "productivity_trend": {
    "direction": "improving | stable | declining",
    "evidence": "Specific evidence for the trend",
    "recommendation": "What to change to improve meeting effectiveness"
  },

  "next_meeting_agenda": [
    "Suggested agenda items for the next meeting based on open items, recurring topics, and accountability gaps"
  ]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const parsed = JSON.parse(cleanJsonResponse(text));
    res.json(parsed);

  } catch (error) {
    console.error('The Debrief series error:', error);
    res.status(500).json({ error: error.message || 'Series analysis failed' });
  }
});

module.exports = router;
