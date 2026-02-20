const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/time-vanishing-explainer', async (req, res) => {
  try {
    const { timePeriod, timeLogData, comparisonData, comparisonMode, perception, hourlyRate } = req.body;

    // Validation
    if (!timeLogData || !timeLogData.trim()) {
      return res.status(400).json({ error: 'Time log data is required' });
    }

    // Build the prompt
    const prompt = `You are analyzing time usage patterns for someone who experiences time blindness. Your analysis must be:
- NON-JUDGMENTAL (no productivity shaming)
- COMPASSIONATE (acknowledge neurodivergent time experience)
- REALISTIC (based on actual patterns, not idealized advice)
- SUPPORTIVE (celebrate accomplishments)

TIME PERIOD: ${timePeriod}
${perception ? `USER'S PERCEPTION: ${perception}` : ''}
${hourlyRate ? `HOURLY RATE: $${hourlyRate} (enable economic analysis)` : ''}
${comparisonMode !== 'none' ? `COMPARISON MODE: ${comparisonMode}` : ''}

TIME LOG DATA (CURRENT PERIOD):
${timeLogData}

${comparisonData ? `
TIME LOG DATA (COMPARISON PERIOD):
${comparisonData}
` : ''}

Analyze this time log and provide:
1. Where time actually went vs where they thought it went
2. Time leaks (context switching, underestimated tasks, transition time)
3. ${hourlyRate ? 'Economic analysis (meeting costs, context switching tax, total economic cost)' : ''}
4. Work type classification (deep work, shallow work, meetings, breaks)
5. Peak productivity hours and energy mapping
6. ${comparisonData ? 'Trend comparison showing improvements or declines' : ''}
7. Ideal week template based on THEIR actual patterns
8. Realistic capacity and future planning help
9. Celebration of accomplishments

CRITICAL: Your tone must be supportive and understanding. This person's brain experiences time differently, and that's okay. Focus on understanding patterns, not fixing productivity.

Return ONLY valid JSON in this EXACT structure (no preamble, no markdown):

{
  "time_analysis_summary": {
    "total_time_period": "8 hours",
    "time_accounted_for": "6 hours",
    "time_vanished": "2 hours",
    "biggest_discrepancy": "Email took 3x longer than estimated"
  },
  "perception_vs_reality": [
    {
      "activity": "Email",
      "you_thought": "30 minutes",
      "actually_was": "1.5 hours",
      "difference": "1 hour",
      "why_the_gap": "Context switching between emails and other tasks added hidden time"
    }
  ],
  "time_leaks": [
    {
      "leak_type": "Context switching",
      "time_lost": "1 hour",
      "instances": 8,
      "pattern": "Switching between projects every 20 minutes",
      "impact": "Each switch costs ~7.5 minutes of refocus time",
      "how_to_reduce": "Batch similar tasks, block 90-minute focus periods"
    },
    {
      "leak_type": "Underestimated task duration",
      "tasks_affected": ["Email", "Admin work"],
      "average_underestimate": "Tasks took 2x longer than expected",
      "planning_adjustment": "Multiply your estimates by 2 for admin tasks"
    }
  ],
  "actual_time_breakdown": {
    "categories": [
      {
        "category": "Deep work",
        "time_spent": "2 hours",
        "percentage": 25
      },
      {
        "category": "Communication (email, slack)",
        "time_spent": "3 hours",
        "percentage": 37
      },
      {
        "category": "Meetings",
        "time_spent": "2 hours",
        "percentage": 25
      },
      {
        "category": "Transitions/breaks",
        "time_spent": "1 hour",
        "percentage": 13
      }
    ]
  },
  "time_blindness_insights": {
    "your_pattern": "You consistently underestimate admin tasks by 50%",
    "realistic_capacity": "You can complete 2-3 major tasks per day, not 5-7",
    "planning_adjustment": "Build in 50% buffer time for all estimates",
    "non_judgmental_reality": "This isn't about being bad at time management - your brain experiences time differently, which is a real neurological difference"
  },
  "future_scheduling_help": {
    "realistic_estimates": [
      {
        "task_type": "Email processing",
        "you_usually_think": "15 minutes",
        "actually_takes": "45 minutes",
        "use_this_estimate": "1 hour"
      },
      {
        "task_type": "Admin tasks",
        "you_usually_think": "30 minutes",
        "actually_takes": "1.5 hours",
        "use_this_estimate": "2 hours"
      }
    ],
    "capacity_planning": "Based on your actual patterns, schedule maximum 3 major tasks per day",
    "buffer_recommendations": "Add 30-minute buffers between all scheduled commitments"
  },
  "celebration": {
    "what_you_actually_accomplished": "You completed 3 major tasks and handled 15 smaller items",
    "reframe": "That's significant work, even if it took longer than you originally planned. Your accomplishments are real."
  },
  ${hourlyRate ? `"economic_analysis": {
    "hourly_rate": ${hourlyRate},
    "total_meeting_cost": 1200,
    "context_switching_cost": 375,
    "total_economic_cost": 1575,
    "expensive_meetings": [
      {
        "name": "Weekly team sync",
        "duration": "2 hours",
        "attendees": 8,
        "cost": 1200
      }
    ],
    "economic_insight": "Meetings cost $1,200 this week. Each context switch cost ~$47. Total economic impact: $1,575 in time value."
  },` : ''}
  "work_type_breakdown": {
    "types": [
      {
        "type": "Deep Work",
        "hours": "8 hours",
        "percentage": 20,
        "optimal": false,
        "too_much": false,
        "recommendation": "Aim for 30-40% deep work. Protect morning hours for deep work blocks."
      },
      {
        "type": "Shallow Work",
        "hours": "15 hours",
        "percentage": 37,
        "optimal": false,
        "too_much": true,
        "recommendation": "Too much shallow work (email, admin). Batch these tasks into dedicated blocks."
      },
      {
        "type": "Meetings",
        "hours": "10 hours",
        "percentage": 25,
        "optimal": true,
        "too_much": false,
        "recommendation": "Reasonable meeting load. Consider declining meetings without clear agendas."
      },
      {
        "type": "Breaks/Transitions",
        "hours": "7 hours",
        "percentage": 18,
        "optimal": true,
        "too_much": false,
        "recommendation": "Healthy amount of transition time for ADHD brain."
      }
    ],
    "overall_assessment": "You're spending only 20% of time on deep work vs 37% on shallow work. Flip this ratio by batching admin and protecting focus blocks."
  },
  "peak_productivity": {
    "peak_hours": "9:00 AM - 11:00 AM",
    "good_hours": "2:00 PM - 4:00 PM",
    "low_energy_hours": "12:00 PM - 1:00 PM, 4:00 PM - 5:00 PM",
    "protect_recommendation": "Block 9-11am for deep work. Schedule ZERO meetings during this time. This is when you're most effective.",
    "low_energy_tasks": "Schedule email, admin, routine meetings during low energy hours (post-lunch, late afternoon).",
    "energy_insight": "You're a morning person. Your best work happens before noon. Protect those hours fiercely."
  },
  ${comparisonData ? `"trend_comparison": {
    "metrics": [
      {
        "metric": "Deep Work",
        "current_value": "12 hours",
        "previous_value": "15 hours",
        "change": "-20%",
        "trend": "declining"
      },
      {
        "metric": "Context Switches",
        "current_value": "18",
        "previous_value": "25",
        "change": "-28%",
        "trend": "improving"
      },
      {
        "metric": "Meeting Hours",
        "current_value": "10 hours",
        "previous_value": "8 hours",
        "change": "+25%",
        "trend": "declining"
      },
      {
        "metric": "Time Estimation Accuracy",
        "current_value": "65%",
        "previous_value": "50%",
        "change": "+30%",
        "trend": "improving"
      }
    ],
    "overall_trend": "Improving: Fewer context switches (+28% better), better time estimation (+30%). Needs work: Deep work declining (-20%), meetings increasing (+25%)."
  },` : ''}
  "ideal_week": {
    "intro": "Based on your actual patterns, here's a realistic week template that works WITH your brain, not against it.",
    "daily_template": [
      {
        "day": "Monday",
        "blocks": [
          {"time": "9:00-11:00", "activity": "Deep Work Block #1", "note": "Peak productivity - protect this"},
          {"time": "11:00-12:00", "activity": "Email/Slack batch #1", "note": "Check messages once"},
          {"time": "12:00-1:00", "activity": "Lunch + Walk", "note": "True break, no phone"},
          {"time": "1:00-2:30", "activity": "Shallow Work (admin, planning)", "note": "Lower energy time"},
          {"time": "2:30-3:00", "activity": "Buffer/Transition", "note": "Don't schedule anything"},
          {"time": "3:00-4:30", "activity": "Deep Work Block #2", "note": "Good energy returns"},
          {"time": "4:30-5:00", "activity": "Email/Slack batch #2", "note": "End of day check"}
        ]
      },
      {
        "day": "Tuesday",
        "blocks": [
          {"time": "9:00-11:00", "activity": "Deep Work Block #1", "note": "Peak productivity"},
          {"time": "11:00-12:00", "activity": "Email/Slack batch #1", "note": ""},
          {"time": "12:00-1:00", "activity": "Lunch Break", "note": ""},
          {"time": "1:00-3:00", "activity": "Meetings ONLY on Tues/Thurs", "note": "Batch all meetings"},
          {"time": "3:00-3:30", "activity": "Buffer/Decompression", "note": "Recover from meetings"},
          {"time": "3:30-5:00", "activity": "Follow-up tasks from meetings", "note": "While context fresh"}
        ]
      },
      {
        "day": "Wednesday - Friday",
        "blocks": [
          {"time": "Similar to Monday", "activity": "Deep work mornings, shallow work afternoons", "note": "Protect 9-11am"}
        ]
      }
    ],
    "key_principles": [
      "Deep work ONLY during peak hours (9-11am) - no exceptions",
      "Meetings batched on Tues/Thurs afternoons only",
      "Email checked 2x per day (not constantly)",
      "30-min buffers between major activities",
      "Realistic capacity: 2 major tasks per day, not 5"
    ],
    "reality_check": "This template assumes 6 hours of productive work per 8-hour day. The other 2 hours are breaks, transitions, and recovery time. That's NORMAL and HEALTHY for an ADHD brain."
  }
}

IMPORTANT:
- ALL fields must be filled with actual data from the time log
- If perception was provided, include perception_vs_reality analysis
- Categories in actual_time_breakdown must add up to 100%
- Be specific with numbers (hours, percentages, task counts)
- Celebration section is MANDATORY - always find something to celebrate
- Never use shame language like "wasted time" or "procrastinated"
- Focus on patterns and understanding, not blame`;

    // Call Claude API
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000, // Increased for economic analysis, work type, peak hours, trends, ideal week
      messages: [{ role: 'user', content: prompt }]
    });

    // Parse response
    let jsonText = message.content[0].text.trim();
    
    // Remove markdown code blocks if present
    jsonText = jsonText.replace(/```json\s*/g, '').replace(/```\s*/g, '');
    
    // Find JSON object
    const firstBrace = jsonText.indexOf('{');
    const lastBrace = jsonText.lastIndexOf('}');
    
    if (firstBrace === -1 || lastBrace === -1) {
      throw new Error('No JSON found in AI response');
    }
    
    jsonText = jsonText.substring(firstBrace, lastBrace + 1);
    
    // Remove trailing commas
    jsonText = jsonText.replace(/,(\s*[}\]])/g, '$1');
    
    let results;
    try {
      results = JSON.parse(jsonText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError.message);
      console.error('Raw response:', jsonText.substring(0, 500));
      throw new Error(`JSON parse failed: ${parseError.message}`);
    }

    // Validate required fields
    if (!results.time_analysis_summary || !results.celebration) {
      throw new Error('Invalid response structure - missing required fields');
    }

    res.json(results);

  } catch (error) {
    console.error('Time Vanishing Explainer Error:', error);
    res.status(500).json({
      error: error.message || 'Failed to analyze time',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;
