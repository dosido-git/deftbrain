const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');
const { rateLimit } = require('../lib/rateLimiter');

router.post('/meeting-hijack-preventer', rateLimit(), async (req, res) => {
  try {
    const { 
      meetingGoal, 
      duration, 
      participantCount, 
      meetingType, 
      challenges,
      isVirtual,
      virtualPlatform,
      decisionFramework,
      useTemplate,
      selectedTemplate
    } = req.body;

    // Validation
    if (!meetingGoal && !meetingGoal?.trim() && !useTemplate) {
      return res.status(400).json({ error: 'Meeting goal or template is required' });
    }

    if (!duration || duration < 15 || duration > 120) {
      return res.status(400).json({ error: 'Duration must be between 15 and 120 minutes' });
    }

    // Build challenge context
    const challengeList = [];
    if (challenges && typeof challenges === 'object') {
      if (challenges.dominates) challengeList.push('one person tends to dominate discussions');
      if (challenges.offTopic) challengeList.push('conversations go off-topic easily');
      if (challenges.talkOver) challengeList.push('people talk over each other');
      if (challenges.schedule) challengeList.push('difficult to keep on schedule');
      if (challenges.quietVoices) challengeList.push('quiet participants struggle to contribute');
    }

    const challengeContext = challengeList.length > 0
      ? `\n\nKNOWN CHALLENGES: ${challengeList.join(', ')}`
      : '';

    // Template-specific guidance
    const templateGuidance = useTemplate && selectedTemplate ? `
TEMPLATE SELECTED: ${selectedTemplate}
Use this as a foundation and adapt based on the specific meeting goal and parameters.
` : '';

    // Virtual meeting context
    const virtualContext = isVirtual ? `
VIRTUAL MEETING PLATFORM: ${virtualPlatform}
Include platform-specific protocols for:
- Mute/unmute management
- Screen sharing protocols
- Chat usage guidelines
- Raise hand feature
- Breakout room allocation (if applicable)
` : '';

    // Decision framework context
    const decisionContext = `
DECISION-MAKING FRAMEWORK: ${decisionFramework}
${decisionFramework === 'Consensus' ? 'Everyone must agree. Focus on finding common ground and addressing all concerns.' : ''}
${decisionFramework === 'Majority Vote' ? 'Decisions made by voting. Prepare voting mechanisms and tallying process.' : ''}
${decisionFramework === 'Disagree & Commit' ? 'Allow dissent, but require commitment. Script for acknowledging disagreement while moving forward.' : ''}
${decisionFramework === 'Leader Decides' ? 'Leader makes final call after hearing input. Script for collecting input efficiently.' : ''}
`;

    const prompt = `You are an expert meeting facilitator specializing in inclusive, neurodivergent-friendly meeting structures.

Create a highly structured meeting agenda that prevents hijacking and ensures all voices are heard.

MEETING DETAILS:
- Goal: ${meetingGoal || 'See template'}
- Duration: ${duration} minutes
- Participants: ${participantCount} people
- Type: ${meetingType}
- Format: ${isVirtual ? `Virtual (${virtualPlatform})` : 'In-person'}${challengeContext}
${templateGuidance}${virtualContext}${decisionContext}

CRITICAL REQUIREMENTS:
1. Time-box EVERY agenda item with specific minute allocations
2. Reserve 5-10% of total time as buffer
3. Provide explicit speaking order where applicable
4. Include facilitator scripts that are kind but firm
5. Create strategies for parking lot methodology
6. Address the known challenges with specific prevention/response tactics
7. ${isVirtual ? `Include ${virtualPlatform}-specific virtual meeting protocols` : 'Include in-person meeting best practices'}
8. Define decision-making process based on ${decisionFramework} framework
9. Generate meeting artifacts: action items template, minutes template, follow-up email

OUTPUT FORMAT (valid JSON):
{
  "meeting_structure": {
    "total_duration": ${duration},
    "agenda_items": [
      {
        "topic": "Opening & Ground Rules",
        "time_allocated": 5,
        "objective": "Set expectations and create psychological safety",
        "facilitator_role": "State the meeting goal, review time limits, introduce parking lot, ${isVirtual ? 'review virtual meeting protocols' : 'establish ground rules'}",
        "speaker_order": ["Facilitator"],
        "time_warning": "We have 1 minute left for questions about the agenda"
      }
      // ... more items that add up to ${duration - Math.floor(duration * 0.1)} minutes
    ],
    "buffer_time": ${Math.floor(duration * 0.1)},
    "parking_lot_instructions": "Write tangent topics on sticky notes ${isVirtual ? 'or in shared doc/chat' : 'or whiteboard'}. Address at end if time permits, or schedule follow-up."
  },
  
  "facilitator_scripts": {
    "opening": "Exact words to start meeting with warmth and clarity${isVirtual ? ', including virtual meeting setup' : ''}",
    "redirecting_tangent": "Kind but firm phrase when discussion goes off-topic",
    "managing_dominance": "Tactful way to redirect dominant speaker and invite others",
    "encouraging_quiet_voices": "Gentle invitation for quieter participants without putting them on spot",
    "time_warning": "How to signal time is running low without creating anxiety",
    "parking_lot_response": "What to say when parking an idea to validate it while staying on track",
    "closing": "How to wrap up with clear next steps and appreciation"
  },
  
  ${isVirtual ? `"virtual_meeting_protocols": {
    "mute_unmute_protocol": "When to mute/unmute, how facilitator manages this for ${virtualPlatform}",
    "screen_share_protocol": "Who can share screen when, how to request screen time",
    "chat_management": "How to use chat for questions vs discussions, who monitors it",
    "raise_hand_feature": "When to use raise hand vs speaking up, how facilitator acknowledges",
    ${participantCount > 8 ? '"breakout_rooms": "When to use breakout rooms, how to allocate participants, reporting back process",' : ''}
    "recording_policy": "Whether meeting will be recorded, how to announce it, consent process"
  },` : ''}
  
  "decision_making_structure": {
    "framework": "${decisionFramework}",
    "when_to_use": "Explain when in the meeting to apply this framework",
    "process": "Step-by-step process for making decisions with this framework",
    ${decisionFramework === 'Majority Vote' || decisionFramework === 'Disagree & Commit' ? '"voting_mechanism": "How voting will work (show of hands, poll, anonymous, etc)",' : ''}
    "conflict_resolution": "What to do if framework doesn't lead to clean resolution"
  },
  
  "speaking_roles": [
    {
      "role": "Facilitator",
      "responsibility": "Guide discussion, manage time, ensure all voices heard${isVirtual ? ', manage virtual tools' : ''}"
    },
    {
      "role": "Timekeeper",
      "responsibility": "Track time for each agenda item, give 2-minute and 1-minute warnings"
    },
    {
      "role": "Notetaker",
      "responsibility": "Capture key decisions, action items, and parking lot items${isVirtual ? ' in shared doc' : ''}"
    }
    ${isVirtual ? `,{
      "role": "Tech Support",
      "responsibility": "Handle technical issues, manage breakout rooms, monitor chat"
    }` : ''}
  ],
  
  "preparation_checklist": [
    "Send agenda 24 hours in advance",
    "Assign roles before meeting starts",
    ${isVirtual ? `"Test ${virtualPlatform} technology 15 minutes early",` : ''}
    ${isVirtual ? '"Set up parking lot in shared doc",' : '"Set up parking lot (whiteboard or sticky notes)",'}
    "Prepare any materials participants need to review",
    ${isVirtual ? '"Share screen/presentation files in advance",' : ''}
    "Review facilitator scripts"
  ],
  
  "anti_hijack_strategies": [
    {
      "scenario": "Someone monopolizes discussion",
      "prevention": "Set expectation in ground rules: 'Let's hear from everyone before second rounds'",
      "response": "Thank you [name], those are valuable points. Let's hear from others who haven't spoken yet. [Quiet person], what are your thoughts?"
    },
    {
      "scenario": "Conversation goes off-topic",
      "prevention": "Start with clear objective for each agenda item",
      "response": "This is interesting, but let's park it for now to stay on track. I'm adding it to our parking lot to revisit if time allows."
    }
    // Include 3-5 strategies based on the known challenges
  ],
  
  "meeting_artifacts": {
    "action_items_template": "Format for tracking action items:

ACTION ITEMS FROM [MEETING NAME] - [DATE]
===========================================

| Action Item | Owner | Deadline | Status | Notes |
|------------|-------|----------|--------|-------|
| [Description] | [Name] | [Date] | [Not Started/In Progress/Complete] | [Any notes] |
| | | | | |

Next Review: [Date]
",
    
    "meeting_minutes_template": "Template for meeting minutes:

MEETING MINUTES
Meeting: [Name]
Date: [Date]
Time: [Start] - [End]
Attendees: [Names]
Facilitator: [Name]
Notetaker: [Name]

AGENDA ITEMS COVERED:
1. [Topic] - [Summary of discussion]
   - Key points discussed
   - Decisions made
   
2. [Topic] - [Summary]

DECISIONS MADE:
- [Decision 1]: [Context and outcome]
- [Decision 2]: [Context and outcome]

ACTION ITEMS: (see action items tracker)

PARKING LOT ITEMS:
- [Item 1] - assigned to [person] for follow-up
- [Item 2] - to be discussed in [future meeting]

NEXT STEPS:
- [Next step 1]
- [Next step 2]
",

    "follow_up_email": "Subject: [Meeting Name] - Summary & Next Steps

Hi team,

Thanks for participating in today's ${(meetingType || 'team').toLowerCase()} meeting. Here's a summary:

DECISIONS MADE:
• [Key decision 1]
• [Key decision 2]

ACTION ITEMS:
• [Person]: [Task] by [Date]
• [Person]: [Task] by [Date]

PARKING LOT (for future discussion):
• [Item 1]
• [Item 2]

NEXT MEETING: [Date/Time if applicable]

Full meeting minutes are attached/available at [link].

Best,
[Facilitator Name]",

    "decision_log": "DECISION LOG
Date: [Date]
Decision: [What was decided]
Framework Used: ${decisionFramework}
Participants: [Who was involved]
Rationale: [Why this decision was made]
Dissent: [Any disagreement expressed]
Next Review: [When to revisit if needed]"
  },
  
  "success_metrics": "Meeting is successful if: (1) ${decisionFramework === 'Decision-making' ? 'Decision is made with clear next steps' : 'Stated goal is achieved'}, (2) All participants contributed at least once, (3) Time limit was respected, (4) Clear next steps and ownership defined, (5) No one felt dominated or excluded, (6) Parking lot items are documented."
}

TONE GUIDELINES:
- Scripts should be warm but direct
- Never condescending or parental
- Assume good intent from all participants
- Prioritize psychological safety
- Use "we" language, not "you" (less accusatory)
- Neurodivergent-friendly: clear expectations, predictable structure
${isVirtual ? '- Virtual-friendly: acknowledge technology challenges with empathy' : ''}

${useTemplate ? `BASE YOUR AGENDA ON THIS TEMPLATE WHILE ADAPTING TO THE SPECIFICS:

${selectedTemplate === 'sprint-planning' ? `Sprint Planning Template:
- Review sprint goal (5 min)
- Review backlog items (20 min)
- Story point estimation (30 min)
- Capacity planning (15 min)
- Commit to sprint (10 min)
- Buffer (10 min)` : ''}

${selectedTemplate === 'retrospective' ? `Retrospective Template:
- Set the stage (5 min)
- Gather data: What went well? (15 min)
- Gather data: What didn't go well? (15 min)
- Generate insights (15 min)
- Decide what to do (10 min)
- Close (5 min)
- Buffer (5 min)` : ''}

${selectedTemplate === 'brainstorm' ? `Brainstorming Template:
- Problem statement (5 min)
- Silent ideation (10 min)
- Idea sharing round-robin (20 min)
- Idea clustering (10 min)
- Dot voting/prioritization (10 min)
- Next steps (5 min)
- Buffer (5 min)` : ''}

${selectedTemplate === 'decision' ? `Decision-Making Template:
- Frame the decision (10 min)
- Present options (15 min)
- Discuss pros/cons (20 min)
- Apply decision framework (10 min)
- Document decision (5 min)
- Buffer (5 min)` : ''}

${selectedTemplate === 'standup' ? `Daily Standup Template:
- Opening (1 min)
- Round-robin updates: Yesterday/Today/Blockers (10 min)
- Parking lot quick capture (2 min)
- Close (2 min)` : ''}

${selectedTemplate === 'one-on-one' ? `One-on-One Template:
- Check-in/rapport (5 min)
- Progress on goals (10 min)
- Challenges/support needed (10 min)
- Forward planning (5 min)
- Buffer (5 min)` : ''}
` : ''}

Focus especially on addressing these challenges: ${challengeList.join(', ') || 'general meeting effectiveness'}`;

    // Call Claude API
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{
        role: 'user',
        content: prompt
      }]
    });

    const rawContent = response.content[0]?.text || '';
    
    // Extract JSON from response
    let jsonMatch = rawContent.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to extract JSON from response');
    }

    let results;
    try {
      results = JSON.parse(jsonMatch[0]);
    } catch (parseError) {
      // Try cleaning common issues
      let cleaned = jsonMatch[0]
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']')
        .replace(/[\x00-\x1F\x7F]/g, ' ');
      results = JSON.parse(cleaned);
    }

    // Validate required fields
    if (!results.meeting_structure || !results.facilitator_scripts) {
      throw new Error('Invalid response structure from AI');
    }

    res.json(results);

  } catch (error) {
    console.error('Meeting Hijack Preventer error:', error);
    res.status(500).json({
      error: 'Failed to generate meeting structure',
      details: error.message
    });
  }
});

module.exports = router;
