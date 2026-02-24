const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/meeting-bullshit-detector', async (req, res) => {
  try {
    const { meetingText, rescueMode, manualDuration, manualAttendees } = req.body;

    // Debug logging
    console.log('🔍 Manual overrides received:', {
      manualDuration,
      manualAttendees,
      typeOfDuration: typeof manualDuration,
      typeOfAttendees: typeof manualAttendees
    });

    if (!meetingText || !meetingText.trim()) {
      return res.status(400).json({ error: 'Meeting text is required' });
    }

    const mode = rescueMode ? 'RESCUE' : 'ANALYZE';

    const prompt = `You are an expert in evidence-based meeting effectiveness, familiar with research from Perlow, Rogelberg, and others on meeting science.

MEETING TEXT TO ANALYZE:
${meetingText}

MODE: ${mode}

${manualDuration || manualAttendees ? `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚠️  MANDATORY: USER PROVIDED THESE VALUES  ⚠️
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

In your time_estimate response, you MUST use:
${manualDuration ? `meeting_duration_hours: ${manualDuration}` : 'meeting_duration_hours: [extract from text or estimate]'}
${manualAttendees ? `participant_count: ${manualAttendees}` : 'participant_count: [extract from text or estimate]'}

These are NOT suggestions. These are the EXACT numbers to use.
Do NOT extract different values from the meeting text.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
` : ''}

${!manualDuration && !manualAttendees ? `Extract meeting duration and participant count from the text above.` : ''}
${mode === 'ANALYZE' ? `
ANALYZE using this weighted framework:

1. DECISION-MAKING NEEDS (High weight - 30%):
- Does this require real-time consensus building?
- Are there complex tradeoffs to discuss?
- Will decisions emerge from discussion vs. voting on preset options?

2. INFORMATION FLOW (High weight - 25%):
- Is this primarily one-way information broadcast?
- Could this be a document with comments enabled?
- Is there a Q&A that could happen asynchronously?

3. COLLABORATION TYPE (Medium weight - 20%):
- Is real-time brainstorming essential or could ideas be contributed asynchronously?
- Does this need immediate back-and-forth or threaded discussion?

4. PARTICIPANT DYNAMICS (Medium weight - 15%):
- Are there >10 people? (If yes, likely too many unless presentation)
- Do all attendees have speaking roles or are some just listeners?
- Is this "FYI attendance" vs. active participation?

5. URGENCY ASSESSMENT (Medium weight - 10%):
- Is time-sensitivity genuine or artificial?
- Could 24-48 hour response time work?

6. RELATIONSHIP/TRUST BUILDING (Context weight - 5%):
- Is there legitimate value in face-time for team cohesion?
- Is this a sensitive topic requiring tone/body language?

RED FLAGS (automatic deductions):
- No agenda = -20 points
- Vague purpose ("sync," "touch base," "check in") = -15 points
- 2+ hours duration = -15 points (requires extraordinary justification)
- Recurring meeting without clear deliverables = -10 points
- >10 participants for non-presentation = -10 points

EDGE CASES (validate even if data suggests async):
- 1-on-1s (often valuable for relationship building)
- Sensitive HR topics (tone/body language matters)
- Performance reviews (personal touch important)
- Conflict resolution (real-time dialogue helps)
- Creative brainstorming with <5 people (synergy can be real)

Return ONLY this JSON structure (NO markdown):

{
  "verdict": "meeting_justified | async_recommended | unclear",
  "confidence": 85,
  "color": "green | yellow | red",
  "quality_score": 7,
  "reasoning": [
    "Specific reason 1 with evidence from text",
    "Specific reason 2",
    "Red flag: No agenda provided",
    "Participant issue: 12 attendees but only 2 have speaking roles"
  ],
  "analysis_breakdown": {
    "decision_making": "High need | Medium need | Low need | None",
    "information_flow": "Two-way discussion | Q&A possible | One-way broadcast",
    "collaboration": "Real-time essential | Could be async | Not collaborative",
    "participants": "Right size | Too many | Unclear roles",
    "urgency": "Genuinely urgent | Flexible timing | Artificial urgency"
  },
  "red_flags": [
    "⚠️ No agenda provided",
    "⚠️ 2-hour duration for 'brainstorming'",
    "⚠️ 15 attendees for status update"
  ],
  "alternative": "Specific async alternative suggestion or null if meeting justified",
  "decline_template": "Professional decline message or null if meeting justified",
  "time_estimate": {
    "meeting_duration_hours": 1.0,
    "participant_count": 8,
    "total_person_hours": 8.0,
    "could_save_hours": 7.0
  }
}

CRITICAL: You MUST ALWAYS include time_estimate with actual numbers:

${manualDuration ? `meeting_duration_hours: ${manualDuration} (USER PROVIDED - USE THIS EXACT NUMBER)` : `meeting_duration_hours: Parse from text or estimate (0.5 for standup, 1.0 for sync, 1.5 for planning)`}

${manualAttendees ? `participant_count: ${manualAttendees} (USER PROVIDED - USE THIS EXACT NUMBER)` : `participant_count: Parse from text, count names, or estimate (6-8 for team, 50+ for all-hands, 2 for 1-on-1)`}

total_person_hours: ALWAYS = meeting_duration_hours × participant_count

could_save_hours:
  - If async_recommended: Usually total_person_hours - (participant_count × 0.25)
  - If meeting_justified: 0
  - NEVER leave blank

EXAMPLES:

GOOD MEETING (Green):
- "Quarterly planning session: 5 people making budget tradeoff decisions with pre-read materials"
- Verdict: meeting_justified, confidence: 95, color: green
- Reasoning: Complex decisions, small group, prepared discussion

BAD MEETING (Red):
- "Team sync - just wanted to touch base and see how everyone's doing. 12 people invited, 1 hour"
- Verdict: async_recommended, confidence: 90, color: red
- Reasoning: Vague purpose, too many people, could be Slack check-in or email

Generate honest but diplomatic analysis.
` : `
RESCUE MODE: The meeting IS happening. Suggest improvements to make it more effective.

Return ONLY this JSON structure (NO markdown):

{
  "rescue_suggestions": [
    "Add specific agenda with time allocations",
    "Reduce participant count from 12 to 5 core decision-makers",
    "Shorten duration from 2 hours to 45 minutes",
    "Send pre-read materials 24 hours in advance",
    "Define clear decision-making process (consensus vs vote vs leader decides)",
    "Assign roles: facilitator, notetaker, timekeeper",
    "Set expected outcomes: 'We will decide X, Y, Z by end of meeting'"
  ],
  "improved_agenda_template": "Suggested agenda structure with time blocks",
  "participant_optimization": "Recommendation for who actually needs to be there",
  "time_optimization": "Suggested shorter duration with rationale",
  "pre_work_needed": "What should be done before meeting to make it productive",
  "success_metrics": "How to know if meeting was successful"
}
`}

Be direct and evidence-based. Meeting culture wastes billions of hours annually - help people reclaim their time.

Return ONLY the JSON object.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{role: 'user', content: prompt}]
    });

    let jsonText = message.content[0].text.trim();
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('No JSON found in AI response');
    }
    
    jsonText = jsonText.substring(firstBrace, lastBrace + 1);
    jsonText = jsonText.replace(/,(\s*[}\]])/g, '$1');
    
    let results;
    try {
      results = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError.message);
      throw new Error(`JSON parse failed: ${parseError.message}`);
    }

    // Validate response structure based on mode
    if (!rescueMode && !results.verdict) {
      throw new Error('Invalid analyze mode response - missing verdict');
    }
    if (rescueMode && !results.rescue_suggestions) {
      throw new Error('Invalid rescue mode response - missing rescue_suggestions');
    }

    // FORCE manual overrides into the response if provided (analyze mode only)
    if (!rescueMode && (manualDuration || manualAttendees)) {
      console.log('🔧 Forcing manual overrides into response');
      
      const duration = manualDuration || results.time_estimate?.meeting_duration_hours || 1.0;
      const attendees = manualAttendees || results.time_estimate?.participant_count || 8;
      const totalHours = duration * attendees;
      const couldSave = results.verdict === 'async_recommended' 
        ? totalHours - (attendees * 0.25)
        : 0;

      results.time_estimate = {
        meeting_duration_hours: duration,
        participant_count: attendees,
        total_person_hours: totalHours,
        could_save_hours: couldSave
      };

      console.log('✅ Manual overrides applied:', results.time_estimate);
    }

    res.json(results);

  } catch (error) {
    console.error('Meeting analysis error:', error);
    res.status(500).json({
      error: 'Failed to analyze meeting',
      details: error.message
    });
  }
});


module.exports = router;
