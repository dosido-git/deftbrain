const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');
const { rateLimit } = require('../lib/rateLimiter');

// ════════════════════════════════════════════════════════════
// SHARED
// ════════════════════════════════════════════════════════════
const PERSONALITY = `Meeting effectiveness expert. Direct, evidence-based, allergic to jargon. Call wasteful meetings clearly; endorse justified ones equally. Give specific scripts. Calculate real person-hour costs — always express cost in person-hours, never currency or dollar figures. Never blame organizers — the system creates bad meetings.`

// ════════════════════════════════════════════════════════════
// POST /meeting-bs-detector — Single meeting analysis
// ════════════════════════════════════════════════════════════
router.post('/meeting-bs-detector', rateLimit(), async (req, res) => {
  try {
    const { meetingText, duration, attendees, userLanguage } = req.body;

    if (!meetingText?.trim()) {
      return res.status(400).json({ error: 'Paste a meeting invite or description' });
    }

    const systemPrompt = `${PERSONALITY}

Analyze this meeting. Score on: decision-making need, info flow, collaboration requirement, participant fit, urgency. Red flags: no agenda, vague purpose, 2+ hours, recurring with no deliverables, 10+ people. Exceptions: 1-on-1s, HR topics, conflict resolution, small brainstorms.`;

    const userPrompt = `MEETING TO ANALYZE:
"${meetingText}"
${duration ? `Duration: ${duration} hours` : ''}
${attendees ? `Attendees: ${attendees}` : ''}

Analyze. Return ONLY valid JSON:

{
  "verdict": "JUSTIFIED | COULD BE AN EMAIL | NEEDS RESCUE | CANCEL IT",
  "verdict_emoji": "✅ | 📧 | 🔧 | 🗑️",
  "confidence": 85,
  "quality_score": 7,
  "one_liner": "One punchy sentence summary. Be memorable. — one sentence",
  "reasoning": [
    "3-5 specific reasons with evidence from the text"
  ],
  "red_flags": ["Any red flags found. Empty array if none."],
  "green_flags": ["Any positive signals. Empty array if none."],
  "time_cost": {
    "duration_hours": 1.0,
    "participants": 8,
    "total_person_hours": 8.0,
    "could_save_hours": 7.0,
    "annual_cost_if_recurring": "If weekly, X person-hours per year — one sentence"
  },
  "alternative": "Specific async alternative if meeting not justified. null if justified. — one sentence",
  "rescue_tips": ["2-3 quick fixes if the meeting IS happening regardless"],
  "decline_message": "Professional decline message if not justified. null if justified. — 2-4 sentences",
  "optimal_format": "What this SHOULD be: 15-min standup | async Slack thread | shared doc | 30-min focused session | keep as-is"
}`;

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'meeting-bs-detector' });
    if (!parsed.verdict) {
      return res.status(500).json({ error: 'Could not analyze the meeting. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('MeetingBSDetector analyze error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /meeting-bs-detector/calendar — Weekly calendar audit
// ════════════════════════════════════════════════════════════
router.post('/meeting-bs-detector/calendar', rateLimit(), async (req, res) => {
  try {
    const { meetings, userLanguage } = req.body;

    if (!meetings?.length) {
      return res.status(400).json({ error: 'Add at least one meeting' });
    }

    const systemPrompt = `${PERSONALITY}

Audit the full week of meetings. Rank all, calculate total person-hours, identify cuts. Be ruthless but fair.`;

    const meetingList = meetings.map((m, i) =>
      `${i + 1}. "${m.title}" — ${m.duration || '1hr'}${m.attendees ? `, ${m.attendees} people` : ''}${m.recurring ? ' (RECURRING)' : ''}${m.notes ? ` [${m.notes}]` : ''}`
    ).join('\n');

    const userPrompt = `WEEKLY CALENDAR AUDIT:

${meetingList}

Audit this entire week. Return ONLY valid JSON:

{
  "week_verdict": "HEALTHY | HEAVY | OVERLOADED | MEETING HELL",
  "week_emoji": "✅ | 🟡 | 🟠 | 🔴",
  "total_meeting_hours": 12.5,
  "total_person_hours": 45,
  "potential_savings_hours": 8.5,
  "one_liner": "One punchy sentence about this week's meeting load. — one sentence",
  "meetings": [
    {
      "index": 1,
      "title": "Meeting title — 3-6 words",
      "verdict": "KEEP | SHORTEN | MAKE ASYNC | SKIP | KILL RECURRING",
      "verdict_emoji": "✅ | ⏱️ | 📧 | ❌ | 🗑️",
      "reason": "One sentence why",
      "time_cost": "Xh × Y people = Zh person-hours (number)",
      "priority": 1
    }
  ],
  "keep": ["Meeting titles that are justified"],
  "cut": ["Meeting titles that should be emails or cancelled"],
  "rescue": ["Meeting titles that need restructuring"],
  "weekly_advice": "One tactical suggestion for managing this week's meeting load — one sentence",
  "meeting_free_blocks": "When to protect focus time based on this schedule — one sentence"
}`;

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'meeting-bs-detector-2' });
    if (!parsed.week_verdict) {
      return res.status(500).json({ error: 'Could not analyze the meeting. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('MeetingBSDetector calendar error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /meeting-bs-detector/live — Live rescue (in-meeting)
// ════════════════════════════════════════════════════════════
router.post('/meeting-bs-detector/live', rateLimit(), async (req, res) => {
  try {
    const { whatsHappening, minutesIn, yourRole, userLanguage } = req.body;

    if (!whatsHappening?.trim()) {
      return res.status(400).json({ error: 'What\'s happening right now?' });
    }

    const systemPrompt = `${PERSONALITY}

Someone is in a meeting right now going sideways. Give a 60-second intervention script — exact words, no analysis.`;

    const userPrompt = `LIVE RESCUE — I'm in the meeting RIGHT NOW:

What's happening: "${whatsHappening}"
${minutesIn ? `Minutes in: ${minutesIn}` : ''}
${yourRole ? `My role: ${yourRole}` : ''}

Give me something I can say RIGHT NOW. Return ONLY valid JSON:

{
  "situation_read": "One sentence — what's actually going on in this meeting",
  "urgency": "REDIRECT NOW | WRAP IT UP | RIDE IT OUT",
  "urgency_emoji": "🚨 | ⏰ | 🤷",
  "say_this_now": "Exact words to say in the next 30 seconds to redirect the meeting. Natural, professional, not robotic. — one sentence",
  "say_this_softer": "Softer version if the direct one feels too bold — one sentence",
  "if_youre_not_the_lead": "What to say if you're not running the meeting — how to influence without overstepping — one sentence",
  "escape_hatch": "How to leave early if needed — exact words — one sentence",
  "salvage_plan": "If you stay, here's how to extract value from the remaining time. 1-2 sentences.",
  "post_meeting_move": "What to do/send after this meeting ends to prevent it from happening again — one sentence"
}`;

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'meeting-bs-detector-3' });
    if (!parsed.situation_read) {
      return res.status(500).json({ error: 'Could not analyze the meeting. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('MeetingBSDetector live error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /meeting-bs-detector/recurring — Recurring meeting audit
// ════════════════════════════════════════════════════════════
router.post('/meeting-bs-detector/recurring', rateLimit(), async (req, res) => {
  try {
    const { meetingName, originalPurpose, whatActuallyHappens, frequency, attendees, duration, userLanguage } = req.body;

    if (!meetingName?.trim()) {
      return res.status(400).json({ error: 'What\'s the meeting called?' });
    }

    const systemPrompt = `${PERSONALITY}

Audit this recurring meeting. Should it live, die, or transform? Calculate the annual cost. Be honest.`;

    const userPrompt = `RECURRING MEETING AUDIT:

Meeting: "${meetingName}"
Frequency: ${frequency || 'weekly'}
Duration: ${duration || '1 hour'}
Attendees: ${attendees || 'unknown'}
Original purpose: "${originalPurpose || 'not sure'}"
What actually happens now: "${whatActuallyHappens || 'not specified'}"

Audit this recurring meeting. Return ONLY valid JSON:

{
  "verdict": "KEEP IT | RESTRUCTURE | REDUCE FREQUENCY | KILL IT",
  "verdict_emoji": "✅ | 🔧 | 📉 | ☠️",
  "zombie_score": 7,
  "zombie_label": "How much of a zombie is this meeting? 1=vital, 10=walking dead — 2-4 words",
  "honest_take": "2-3 sentences. Has this meeting drifted from its purpose?",
  "annual_cost": {
    "hours_per_occurrence": 1.0,
    "occurrences_per_year": 52,
    "attendees": 8,
    "total_person_hours_per_year": 416,
    "equivalent": "A vivid comparison — e.g., 'That's 10 full work weeks' — one sentence"
  },
  "the_drift": "How has this meeting drifted from its original purpose? null if it hasn't. — one sentence",
  "restructure_plan": {
    "new_format": "What this should become (e.g., biweekly 30-min, async Slack check-in, monthly deep-dive) — 2-4 words",
    "new_duration": "Suggested duration (number)",
    "new_frequency": "Suggested frequency — one sentence",
    "new_attendees": "Who actually needs to be there — one sentence",
    "new_agenda": "Suggested agenda structure — one sentence"
  },
  "kill_email": "Ready-to-send email proposing to cancel or restructure this meeting. Professional, constructive, not passive-aggressive. — 2-4 sentences",
  "keep_if": "Under what conditions should this meeting continue? Be specific. — one sentence"
}`;

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'meeting-bs-detector-4' });
    if (!parsed.verdict) {
      return res.status(500).json({ error: 'Could not analyze the meeting. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('MeetingBSDetector recurring error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /meeting-bs-detector/messages — Message generator
// ════════════════════════════════════════════════════════════
router.post('/meeting-bs-detector/messages', rateLimit(), async (req, res) => {
  try {
    const { messageType, meetingName, context, relationship, userLanguage } = req.body;

    if (!messageType?.trim() || !meetingName?.trim()) {
      return res.status(400).json({ error: 'Need message type and meeting name' });
    }

    const systemPrompt = `${PERSONALITY}

Generate a meeting message that sounds like a real person wrote it. Adjust tone for relationship (boss/peer/report). Give multiple versions.`;

    const userPrompt = `MESSAGE GENERATOR:
Type: "${messageType}"
Meeting: "${meetingName}"
${context ? `Context: ${context}` : ''}
${relationship ? `Sending to: ${relationship}` : ''}

Generate messages. Return ONLY valid JSON:

{
  "message_type": "${messageType}",
  "versions": [
    {
      "label": "Direct — one sentence",
      "subject": "Email subject line — one sentence",
      "body": "Full message body. Ready to send. — 2-4 sentences",
      "tone": "Brief tone description — one sentence",
      "best_for": "When to use this version — one sentence"
    },
    {
      "label": "Diplomatic — one sentence",
      "subject": "Email subject line — one sentence",
      "body": "Softer version — 2-4 sentences",
      "tone": "Brief tone description — one sentence",
      "best_for": "When to use this version — one sentence"
    },
    {
      "label": "Constructive — one sentence",
      "subject": "Email subject line — one sentence",
      "body": "Version that proposes an alternative — 2-4 sentences",
      "tone": "Brief tone description — one sentence",
      "best_for": "When to use this version — one sentence"
    }
  ],
  "pro_tip": "One tactical tip about sending this type of message — one sentence"
}`;

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'meeting-bs-detector-5' });
    if (!parsed.message_type) {
      return res.status(500).json({ error: 'Could not analyze the meeting. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('MeetingBSDetector messages error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /meeting-bs-detector/agenda — Agenda builder
// ════════════════════════════════════════════════════════════
router.post('/meeting-bs-detector/agenda', rateLimit(), async (req, res) => {
  try {
    const { topic, duration, attendees, desiredOutcome, context, userLanguage } = req.body;

    if (!topic?.trim()) {
      return res.status(400).json({ error: 'What\'s the meeting about?' });
    }

    const systemPrompt = `${PERSONALITY}

Build a tight time-boxed agenda. Account for every minute. Assign roles. Define exit criteria.`;

    const userPrompt = `AGENDA BUILDER:
Topic: "${topic}"
Duration: ${duration || '30 minutes'}
Attendees: ${attendees || 'not specified'}
Desired outcome: "${desiredOutcome || 'Make a decision'}"
${context ? `Context: ${context}` : ''}

Build a tight agenda. Return ONLY valid JSON:

{
  "meeting_title": "Concise, action-oriented title (not 'Team Sync' — something specific) — 3-6 words",
  "duration": "${duration || '30 minutes'}",
  "pre_work": {
    "what_to_send": "What to send attendees before the meeting (doc, data, options) — one sentence",
    "when_to_send": "How far in advance — one sentence",
    "read_time": "Estimated read time — one sentence"
  },
  "roles": {
    "facilitator": "Who runs the meeting (suggestion or role) — one sentence",
    "note_taker": "Who captures decisions — one sentence",
    "timekeeper": "Who keeps things on track — one sentence"
  },
  "agenda_blocks": [
    {
      "time": "0:00-5:00 — one sentence",
      "title": "Block title — 3-6 words",
      "description": "What happens in this block. Be specific. — 1-2 sentences",
      "owner": "Who leads this block — one sentence",
      "output": "What this block should produce — one sentence"
    }
  ],
  "exit_criteria": "How do we know the meeting is done? What must be true before we leave? — one sentence",
  "decision_method": "How will decisions be made? (consensus, vote, leader decides, etc.) — one sentence",
  "follow_up_template": "Template for the follow-up message to send after the meeting — 2-4 sentences",
  "calendar_description": "Ready-to-paste calendar invite description with agenda embedded — 1-2 sentences"
}`;

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'meeting-bs-detector-6' });
    if (!parsed.meeting_title) {
      return res.status(500).json({ error: 'Could not analyze the meeting. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('MeetingBSDetector agenda error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /meeting-bs-detector/report — Meeting culture report
// ════════════════════════════════════════════════════════════
router.post('/meeting-bs-detector/report', rateLimit(), async (req, res) => {
  try {
    const { scorecards, historySummary, totalHours, userLanguage } = req.body;

    if (!scorecards?.length && !historySummary) {
      return res.status(400).json({ error: 'Need meeting data to generate a report' });
    }

    const systemPrompt = `${PERSONALITY}

Generate a punchy, shareable meeting culture report from the data. Use emoji and stats. Celebrate wins, call out problems.`;

    const scoreStr = scorecards?.map((s, i) =>
      `${i + 1}. "${s.name}" — rated ${s.score}/5, decision: ${s.decisionMade ? 'yes' : 'no'}, could be shorter: ${s.couldBeShorter ? 'yes' : 'no'}, all needed: ${s.allNeeded ? 'yes' : 'no'}`
    ).join('\n') || '';

    const userPrompt = `MEETING CULTURE REPORT:

${scoreStr ? `SCORECARDS (${scorecards.length} meetings rated):\n${scoreStr}\n` : ''}
${historySummary ? `ANALYSIS HISTORY:\n${historySummary}\n` : ''}
${totalHours ? `Estimated weekly meeting hours: ${totalHours}` : ''}

Generate a shareable report. Return ONLY valid JSON:

{
  "report_title": "Your Meeting Culture Report — 3-6 words",
  "period": "Based on X meetings over Y time — one sentence",
  "headline_stat": "The one number that tells the whole story — one sentence",
  "headline_emoji": "📊",
  "grade": "A | B | C | D | F",
  "grade_label": "Meeting Ninja | Healthy | Needs Work | Meeting Heavy | Meeting Hell",
  "key_stats": [
    {"label": "Stat name — one sentence", "value": "Number — one sentence", "emoji": "📊", "verdict": "Good | Concerning | Bad"}
  ],
  "biggest_win": "Something they're doing well with meetings — one sentence",
  "biggest_problem": "The #1 meeting culture issue revealed by the data — one sentence",
  "time_analysis": {
    "meeting_hours_per_week": 12,
    "productive_meeting_pct": 60,
    "could_reclaim_hours": 5,
    "maker_time_ratio": "Ratio of focus time to meeting time — one sentence"
  },
  "recommendations": [
    "3-4 specific, actionable recommendations based on the data"
  ],
  "share_summary": "A 2-sentence summary formatted for sharing — punchy, memorable, shareable — 1-2 sentences"
}`;

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'meeting-bs-detector-7' });
    if (!parsed.grade) {
      return res.status(500).json({ error: 'Could not analyze the meeting. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('MeetingBSDetector report error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /meeting-bs-detector/team — Manager/team meeting health
// ════════════════════════════════════════════════════════════
router.post('/meeting-bs-detector/team', rateLimit(), async (req, res) => {
  try {
    const { teamSize, meetings, teamContext, userLanguage } = req.body;

    if (!meetings?.length) {
      return res.status(400).json({ error: 'Add your team\'s meetings' });
    }

    const systemPrompt = `${PERSONALITY}

Analyze meeting health for the whole team: duplicates, uneven load, total person-hours, consolidation opportunities.`;

    const meetingStr = meetings.map((m, i) =>
      `${i + 1}. "${m.title}" — ${m.duration || '1hr'}, ${m.attendeesFromTeam || '?'} team members attend${m.frequency ? ` (${m.frequency})` : ''}${m.notes ? ` [${m.notes}]` : ''}`
    ).join('\n');

    const userPrompt = `TEAM MEETING HEALTH:
Team size: ${teamSize || 'unknown'}
${teamContext ? `Team context: ${teamContext}` : ''}

TEAM MEETINGS:
${meetingStr}

Analyze team meeting health. Return ONLY valid JSON:

{
  "team_verdict": "HEALTHY | MEETING-HEAVY | OVERLOADED | CRITICAL",
  "team_emoji": "✅ | 🟡 | 🟠 | 🔴",
  "headline": "One punchy sentence about this team's meeting health — one sentence",
  "team_stats": {
    "total_team_meeting_hours_per_week": 45,
    "avg_per_person_per_week": 8,
    "pct_of_work_week_in_meetings": 20,
    "total_person_hours_per_week": 90
  },
  "overlaps": ["Meetings where multiple team members attend the same low-value meeting"],
  "consolidation_opportunities": ["Meetings that could be merged or replaced"],
  "meeting_ranking": [
    {
      "title": "Meeting name — 3-6 words",
      "team_impact": "HIGH | MEDIUM | LOW",
      "recommendation": "Keep | Reduce attendees | Make async | Consolidate with X | Cut",
      "team_hours_saved_if_fixed": 4
    }
  ],
  "top_3_changes": [
    "The 3 specific changes that would save the most team time. Be very specific."
  ],
  "manager_talking_points": [
    "2-3 things the manager can say to the team about meeting culture changes"
  ],
  "team_maker_time": "How much uninterrupted focus time does each person actually have? — one sentence"
}`;

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'meeting-bs-detector-8' });
    if (!parsed.team_verdict) {
      return res.status(500).json({ error: 'Could not analyze the meeting. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('MeetingBSDetector team error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
