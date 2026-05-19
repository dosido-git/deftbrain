const express = require('express');
const router = express.Router();
const { cleanJsonResponse, withLanguage, callClaudeWithRetry } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ════════════════════════════════════════════════════════════
// SHARED
// ════════════════════════════════════════════════════════════
const PERSONALITY = `Meeting analyst and decision tracker. Extract what actually happened: decisions made, actions owned, questions unresolved. Cut to what matters — who owns what by when, what was decided, and what carries forward.`

// ════════════════════════════════════════════════════════════
// POST /the-debrief — Distill: transcript → key decisions & actions
// ════════════════════════════════════════════════════════════
router.post('/the-debrief', rateLimit(DEFAULT_LIMITS), async (req, res) => {
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

DISTILL MODE: Extract actionable output. ${typeNote} Every action needs an owner and deadline — flag unassigned. Decisions as facts: 'We decided X', not 'it was discussed'. Filter all filler ruthlessly.`;

    const userPrompt = `MEETING TRANSCRIPT:
${meetingType ? `Meeting type: ${meetingType}` : ''}
${attendees ? `Attendees: ${attendees}` : ''}
${context ? `Context: ${context}` : ''}

${transcript.substring(0, 30000)}

Extract the meeting output. Return ONLY valid JSON:

{
  "meeting_summary": "One sentence: what this meeting was about and its primary outcome",
  "meeting_type_detected": "What type of meeting this appears to be — one sentence",
  "duration_estimate": "Estimated meeting length based on transcript volume — one sentence",

  "decisions": [
    {
      "decision": "What was decided — stated as a fact — one sentence",
      "context": "Brief context for why this decision was made — 1-2 sentences",
      "who_decided": "Who made or drove this decision, if identifiable — one sentence",
      "reversibility": "Easily reversed if wrong, or committed/hard to undo — one sentence"
    }
  ],

  "action_items": [
    {
      "action": "Specific task that needs to happen — one sentence",
      "owner": "Who's responsible — name if stated, 'UNASSIGNED' if not — one sentence",
      "deadline": "When it's due — exact date if stated, 'No deadline set' if not — one sentence",
      "priority": "high | medium | low",
      "status": "new | in_progress | blocked | waiting",
      "depends_on": "What this action depends on, if anything. null if standalone. — one sentence"
    }
  ],

  "open_questions": [
    {
      "question": "Something that was raised but not resolved — one sentence",
      "why_unresolved": "Why it didn't get resolved — ran out of time, needs data, someone was absent, etc. — one sentence",
      "suggested_owner": "Who should own getting this resolved — one sentence"
    }
  ],

  "parking_lot": [
    "Topics that came up but were deferred — future agenda items"
  ],

  "tensions": [
    {
      "topic": "Where there was disagreement or unspoken friction — 3-6 words",
      "nature": "What the tension was about — be specific but diplomatic — one sentence",
      "resolution": "How it was resolved, or 'Unresolved' — one sentence"
    }
  ] or [],

  "meeting_health": {
    "efficiency": "How much of the meeting produced value vs. filler — percentage estimate — one sentence",
    "accountability": "Were owners and deadlines assigned, or was it vague? — one sentence",
    "pattern_warning": "If anything suggests a recurring problem (topic that keeps resurfacing, decisions that keep getting revisited). null if clean. — one sentence"
  },

  "follow_up_email": "A concise, ready-to-send follow-up email summarizing decisions and action items. Professional tone, bullet points for actions. — 2-4 sentences"
}`;

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'the-debrief' });
    if (!parsed.meeting_summary && !parsed.answer) {
      return res.status(500).json({ error: 'Could not analyze the meeting. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('The Debrief error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /the-debrief/followup — Draft follow-up messages
// ════════════════════════════════════════════════════════════
router.post('/the-debrief/followup', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { transcript, meetingType, attendees, recipientRole, tone, userLanguage } = req.body;

    if (!transcript?.trim()) {
      return res.status(400).json({ error: 'Paste your meeting transcript or notes' });
    }

    const toneNote = tone === 'formal' ? 'Professional and formal — suitable for executives or clients.'
      : tone === 'casual' ? 'Warm and casual — suitable for team members you know well.'
      : 'Balanced professional — friendly but clear.';

    const systemPrompt = `${PERSONALITY}

FOLLOW-UP MODE: Draft follow-up messages. ${toneNote} Concise, action-oriented, reference specific decisions and deadlines. Never vague.`;

    const userPrompt = `MEETING TRANSCRIPT:
${meetingType ? `Meeting type: ${meetingType}` : ''}
${attendees ? `Attendees: ${attendees}` : ''}
${recipientRole ? `Follow-up recipient: ${recipientRole}` : ''}
Tone: ${tone || 'professional'}

${transcript.substring(0, 25000)}

Draft follow-up messages. Return ONLY valid JSON:

{
  "group_email": {
    "subject": "Email subject line — one sentence",
    "body": "Full email body — concise, professional, with clear action items per person — 2-4 sentences"
  },

  "individual_nudges": [
    {
      "to": "Person name or role — one sentence",
      "message": "Short, specific follow-up message — references their specific action item and deadline — 2-4 sentences",
      "channel": "email | slack | text — best channel for this type of follow-up",
      "urgency": "send_now | within_24h | can_wait"
    }
  ],

  "boss_update": {
    "subject": "Brief subject — one sentence",
    "body": "Upward summary for a manager who wasn't in the meeting — decisions, risks, and what you need from them. 3-5 sentences max."
  },

  "calendar_invites": [
    {
      "title": "What to schedule — 3-6 words",
      "attendees": "Who needs to be there — one sentence",
      "when": "When to schedule it — specific or relative ('next Tuesday', 'before Friday') — one sentence",
      "purpose": "One line on why this meeting is needed — one sentence"
    }
  ] or []
}`;

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'the-debrief-2' });
    if (!parsed.meeting_summary && !parsed.answer) {
      return res.status(500).json({ error: 'Could not analyze the meeting. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('The Debrief followup error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /the-debrief/series — Analyze meeting series for patterns
// ════════════════════════════════════════════════════════════
router.post('/the-debrief/series', rateLimit(DEFAULT_LIMITS), async (req, res) => {
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

SERIES MODE: Find patterns across meetings. Focus on: uncompleted actions, recurring unresolved topics, talking vs silent dynamics, productivity trends, commitments that slipped.`;

    const meetingList = validMeetings.map((m, i) =>
      `--- MEETING ${i + 1}${m.title ? `: ${m.title}` : ''}${m.date ? ` (${m.date})` : ''} ---\n${m.transcript.substring(0, 8000)}`
    ).join('\n\n');

    const userPrompt = `MEETING SERIES:
${context ? `Context: ${context}` : ''}

${meetingList}

Analyze the series. Return ONLY valid JSON:

{
  "series_summary": "What these meetings are about and the overall trajectory — getting better, stuck, or drifting? — 1-2 sentences",

  "recurring_topics": [
    {
      "topic": "Something that keeps coming up — 3-6 words",
      "frequency": "Appeared in X of Y meetings (number)",
      "resolved": true or false,
      "why_recurring": "Why this keeps surfacing — not enough time, no owner, avoiding a hard decision? — one sentence"
    }
  ],

  "accountability_gaps": [
    {
      "action": "An action item that was assigned — one sentence",
      "assigned_meeting": "Which meeting it was assigned in — one sentence",
      "owner": "Who was supposed to do it — one sentence",
      "status": "completed | incomplete | disappeared — never mentioned again",
      "pattern": "Is this person/topic a repeat offender? — one sentence"
    }
  ],

  "decisions_revisited": [
    {
      "decision": "A decision that was made and then reopened or reversed — one sentence",
      "original_meeting": "When it was first decided — one sentence",
      "revisited_meeting": "When it got reopened — one sentence",
      "why": "Why it was revisited — new information, someone wasn't bought in, poor execution — one sentence"
    }
  ] or [],

  "productivity_trend": {
    "direction": "improving | stable | declining",
    "evidence": "Specific evidence for the trend — one sentence",
    "recommendation": "What to change to improve meeting effectiveness — one sentence"
  },

  "next_meeting_agenda": [
    "Suggested agenda items for the next meeting based on open items, recurring topics, and accountability gaps"
  ]
}`;

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'the-debrief-3' });
    if (!parsed.meeting_summary && !parsed.answer) {
      return res.status(500).json({ error: 'Could not analyze the meeting. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('The Debrief series error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
