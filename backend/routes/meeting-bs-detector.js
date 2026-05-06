const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');
const { rateLimit } = require('../lib/rateLimiter');

// ════════════════════════════════════════════════════════════
// SHARED
// ════════════════════════════════════════════════════════════
const PERSONALITY = `You are a meeting effectiveness expert who's seen thousands of calendar invites and knows instantly which meetings are productive and which are time sinks. You're direct, a little irreverent, and allergic to corporate jargon.

YOUR STYLE:
- Blunt but professional. "This meeting is an email" is a perfectly valid verdict.
- Back up every call with specific evidence from the meeting text.
- When a meeting IS justified, say so enthusiastically — not everything is BS.
- Give people actual words to say and send, not just analysis.
- Calculate time costs honestly — person-hours matter.
- Never be mean about the organizer. The system creates bad meetings, not bad people.`;

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

Analyze this meeting using evidence-based criteria:
1. DECISION-MAKING: Does it require real-time consensus? (30% weight)
2. INFORMATION FLOW: Is it one-way broadcast vs discussion? (25%)
3. COLLABORATION: Is real-time interaction essential? (20%)
4. PARTICIPANTS: Right size? Clear roles? (15%)
5. URGENCY: Genuinely time-sensitive? (10%)

RED FLAGS: No agenda (-20), vague purpose like "sync/touch base" (-15), 2+ hours (-15), recurring with no deliverables (-10), 10+ people for non-presentation (-10).

EXCEPTIONS: 1-on-1s, sensitive HR topics, performance reviews, conflict resolution, small creative brainstorms — these often justify real-time.`;

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
  "one_liner": "One punchy sentence summary. Be memorable.",
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
    "annual_cost_if_recurring": "If weekly, X person-hours per year"
  },
  "alternative": "Specific async alternative if meeting not justified. null if justified.",
  "rescue_tips": ["2-3 quick fixes if the meeting IS happening regardless"],
  "decline_message": "Professional decline message if not justified. null if justified.",
  "optimal_format": "What this SHOULD be: 15-min standup | async Slack thread | shared doc | 30-min focused session | keep as-is"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('MeetingBSDetector analyze error:', error);
    res.status(500).json({ error: error.message || 'Analysis failed' });
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

You are auditing someone's entire week of meetings. Rank every meeting, calculate total time investment, and identify which ones to cut. Be ruthless but fair — some meetings are genuinely necessary.`;

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
  "one_liner": "One punchy sentence about this week's meeting load.",
  "meetings": [
    {
      "index": 1,
      "title": "Meeting title",
      "verdict": "KEEP | SHORTEN | MAKE ASYNC | SKIP | KILL RECURRING",
      "verdict_emoji": "✅ | ⏱️ | 📧 | ❌ | 🗑️",
      "reason": "One sentence why",
      "time_cost": "Xh × Y people = Zh person-hours",
      "priority": 1
    }
  ],
  "keep": ["Meeting titles that are justified"],
  "cut": ["Meeting titles that should be emails or cancelled"],
  "rescue": ["Meeting titles that need restructuring"],
  "weekly_advice": "One tactical suggestion for managing this week's meeting load",
  "meeting_free_blocks": "When to protect focus time based on this schedule"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('MeetingBSDetector calendar error:', error);
    res.status(500).json({ error: error.message || 'Calendar audit failed' });
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

Someone is IN a meeting right now and it's going sideways. They need an intervention script they can use in the next 60 seconds. Be fast, specific, and give them exact words. No analysis paragraphs — just moves.`;

    const userPrompt = `LIVE RESCUE — I'm in the meeting RIGHT NOW:

What's happening: "${whatsHappening}"
${minutesIn ? `Minutes in: ${minutesIn}` : ''}
${yourRole ? `My role: ${yourRole}` : ''}

Give me something I can say RIGHT NOW. Return ONLY valid JSON:

{
  "situation_read": "One sentence — what's actually going on in this meeting",
  "urgency": "REDIRECT NOW | WRAP IT UP | RIDE IT OUT",
  "urgency_emoji": "🚨 | ⏰ | 🤷",
  "say_this_now": "Exact words to say in the next 30 seconds to redirect the meeting. Natural, professional, not robotic.",
  "say_this_softer": "Softer version if the direct one feels too bold",
  "if_youre_not_the_lead": "What to say if you're not running the meeting — how to influence without overstepping",
  "escape_hatch": "How to leave early if needed — exact words",
  "salvage_plan": "If you stay, here's how to extract value from the remaining time. 1-2 sentences.",
  "post_meeting_move": "What to do/send after this meeting ends to prevent it from happening again"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('MeetingBSDetector live error:', error);
    res.status(500).json({ error: error.message || 'Live rescue failed' });
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

You are auditing a recurring meeting. These are the biggest time sinks in any organization — they start with a purpose, then become zombies that no one questions. Be honest about whether this one should live, die, or be transformed. Calculate the annual cost.`;

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
  "zombie_label": "How much of a zombie is this meeting? 1=vital, 10=walking dead",
  "honest_take": "2-3 sentences. Has this meeting drifted from its purpose?",
  "annual_cost": {
    "hours_per_occurrence": 1.0,
    "occurrences_per_year": 52,
    "attendees": 8,
    "total_person_hours_per_year": 416,
    "equivalent": "A vivid comparison — e.g., 'That's 10 full work weeks'"
  },
  "the_drift": "How has this meeting drifted from its original purpose? null if it hasn't.",
  "restructure_plan": {
    "new_format": "What this should become (e.g., biweekly 30-min, async Slack check-in, monthly deep-dive)",
    "new_duration": "Suggested duration",
    "new_frequency": "Suggested frequency",
    "new_attendees": "Who actually needs to be there",
    "new_agenda": "Suggested agenda structure"
  },
  "kill_email": "Ready-to-send email proposing to cancel or restructure this meeting. Professional, constructive, not passive-aggressive.",
  "keep_if": "Under what conditions should this meeting continue? Be specific."
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('MeetingBSDetector recurring error:', error);
    res.status(500).json({ error: error.message || 'Recurring audit failed' });
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

Generate a professional message about a meeting. The message should sound like a real person wrote it — not corporate-speak, not robotic. Adjust tone based on the relationship (boss vs peer vs report). Give multiple versions so they can pick the one that fits.`;

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
      "label": "Direct",
      "subject": "Email subject line",
      "body": "Full message body. Ready to send.",
      "tone": "Brief tone description",
      "best_for": "When to use this version"
    },
    {
      "label": "Diplomatic",
      "subject": "Email subject line",
      "body": "Softer version",
      "tone": "Brief tone description",
      "best_for": "When to use this version"
    },
    {
      "label": "Constructive",
      "subject": "Email subject line",
      "body": "Version that proposes an alternative",
      "tone": "Brief tone description",
      "best_for": "When to use this version"
    }
  ],
  "pro_tip": "One tactical tip about sending this type of message"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('MeetingBSDetector messages error:', error);
    res.status(500).json({ error: error.message || 'Message generation failed' });
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

Build a tight, time-boxed agenda that turns a potentially wasteful meeting into a focused, productive one. Every minute should be accounted for. Assign roles. Define the exit criteria — how do we know the meeting is done?`;

    const userPrompt = `AGENDA BUILDER:
Topic: "${topic}"
Duration: ${duration || '30 minutes'}
Attendees: ${attendees || 'not specified'}
Desired outcome: "${desiredOutcome || 'Make a decision'}"
${context ? `Context: ${context}` : ''}

Build a tight agenda. Return ONLY valid JSON:

{
  "meeting_title": "Concise, action-oriented title (not 'Team Sync' — something specific)",
  "duration": "${duration || '30 minutes'}",
  "pre_work": {
    "what_to_send": "What to send attendees before the meeting (doc, data, options)",
    "when_to_send": "How far in advance",
    "read_time": "Estimated read time"
  },
  "roles": {
    "facilitator": "Who runs the meeting (suggestion or role)",
    "note_taker": "Who captures decisions",
    "timekeeper": "Who keeps things on track"
  },
  "agenda_blocks": [
    {
      "time": "0:00-5:00",
      "title": "Block title",
      "description": "What happens in this block. Be specific.",
      "owner": "Who leads this block",
      "output": "What this block should produce"
    }
  ],
  "exit_criteria": "How do we know the meeting is done? What must be true before we leave?",
  "decision_method": "How will decisions be made? (consensus, vote, leader decides, etc.)",
  "follow_up_template": "Template for the follow-up message to send after the meeting",
  "calendar_description": "Ready-to-paste calendar invite description with agenda embedded"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('MeetingBSDetector agenda error:', error);
    res.status(500).json({ error: error.message || 'Agenda generation failed' });
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

Generate a shareable meeting culture report based on the user's meeting data. This should be punchy, visual-friendly (using emoji and clear stats), and something they'd want to screenshot and share with their team or manager. Be honest about the data — celebrate wins and call out problems.`;

    const scoreStr = scorecards?.map((s, i) =>
      `${i + 1}. "${s.name}" — rated ${s.score}/5, decision: ${s.decisionMade ? 'yes' : 'no'}, could be shorter: ${s.couldBeShorter ? 'yes' : 'no'}, all needed: ${s.allNeeded ? 'yes' : 'no'}`
    ).join('\n') || '';

    const userPrompt = `MEETING CULTURE REPORT:

${scoreStr ? `SCORECARDS (${scorecards.length} meetings rated):\n${scoreStr}\n` : ''}
${historySummary ? `ANALYSIS HISTORY:\n${historySummary}\n` : ''}
${totalHours ? `Estimated weekly meeting hours: ${totalHours}` : ''}

Generate a shareable report. Return ONLY valid JSON:

{
  "report_title": "Your Meeting Culture Report",
  "period": "Based on X meetings over Y time",
  "headline_stat": "The one number that tells the whole story",
  "headline_emoji": "📊",
  "grade": "A | B | C | D | F",
  "grade_label": "Meeting Ninja | Healthy | Needs Work | Meeting Heavy | Meeting Hell",
  "key_stats": [
    {"label": "Stat name", "value": "Number", "emoji": "📊", "verdict": "Good | Concerning | Bad"}
  ],
  "biggest_win": "Something they're doing well with meetings",
  "biggest_problem": "The #1 meeting culture issue revealed by the data",
  "time_analysis": {
    "meeting_hours_per_week": 12,
    "productive_meeting_pct": 60,
    "could_reclaim_hours": 5,
    "maker_time_ratio": "Ratio of focus time to meeting time"
  },
  "recommendations": [
    "3-4 specific, actionable recommendations based on the data"
  ],
  "share_summary": "A 2-sentence summary formatted for sharing — punchy, memorable, shareable"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('MeetingBSDetector report error:', error);
    res.status(500).json({ error: error.message || 'Report generation failed' });
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

You are analyzing meeting health for a manager's entire team. Think about not just individual meeting quality, but team-wide impact: duplicated meetings, uneven distribution, total person-hours consumed, and opportunities to consolidate. Help the manager make their team's time more effective.`;

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
  "headline": "One punchy sentence about this team's meeting health",
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
      "title": "Meeting name",
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
  "team_maker_time": "How much uninterrupted focus time does each person actually have?"
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('MeetingBSDetector team error:', error);
    res.status(500).json({ error: error.message || 'Team analysis failed' });
  }
});

module.exports = router;
