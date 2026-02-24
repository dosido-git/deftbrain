const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/crash-predictor-analyze', async (req, res) => {
  try {
    const { 
      logs,
      biometricData,
      medicationLog,
      menstrualCycle,
      weatherData,
      calendarEvents,
      calendarContext,
      emergencyContacts,
      userLanguage
    } = req.body;

    if (!logs || logs.length < 3) {
      return res.status(400).json({ error: 'Need at least 3 days of logs for pattern analysis' });
    }

    // Process logs for analysis
    const logSummaries = logs.map((log, idx) => {
      const daysAgo = logs.length - idx;
      const activities = Object.keys(log.activities || {}).filter(k => log.activities[k]);
      const symptoms = Object.keys(log.physicalSymptoms || {}).filter(k => log.physicalSymptoms[k]);
      const warnings = Object.keys(log.warningSigns || {}).filter(k => log.warningSigns[k]);
      const customWarnings = (log.customSymptoms || []).filter(s => s.active).map(s => s.label);
      
      return `Day ${daysAgo} (${log.date}):
Energy: ${log.energy}/10
Sleep: ${log.sleep}/10
Stress: ${log.stress}/10
Mood: ${log.mood || 'not tracked'}/10
Activities: ${activities.join(', ') || 'none'}
Physical: ${symptoms.join(', ') || 'none'}
Warning signs: ${[...warnings, ...customWarnings].join(', ') || 'none'}
Medications: ${log.medications || 'none'}
Caffeine: ${log.caffeine || 0} servings
Alcohol: ${log.alcohol || 0} drinks${log.menstrualPhase && log.menstrualPhase !== 'na' ? `
Menstrual phase: ${log.menstrualPhase}` : ''}${log.notes ? `
Notes: ${log.notes}` : ''}${log.biometrics?.hrv ? `
HRV: ${log.biometrics.hrv}ms` : ''}${log.biometrics?.restingHR ? `
Resting HR: ${log.biometrics.restingHR} bpm` : ''}${log.biometrics?.sleepHours ? `
Sleep hours: ${log.biometrics.sleepHours}h` : ''}${log.biometrics?.steps ? `
Steps: ${log.biometrics.steps}` : ''}${log.weather?.condition ? `
Weather: ${log.weather.condition}` : ''}${log.weather?.barometricPressure ? `
Barometric pressure: ${log.weather.barometricPressure} mb` : ''}`;
    }).join('\n\n');

    const biometricSummary = biometricData ? `
BIOMETRIC TRENDS (if available):
HRV baseline: ${biometricData.hrvBaseline || 'unknown'}
Recent HRV trend: ${biometricData.hrvTrend || 'unknown'}
Sleep stage disruption: ${biometricData.sleepDisruption || 'unknown'}
Step count deviation: ${biometricData.stepDeviation || 'unknown'}
Resting HR changes: ${biometricData.restingHRChange || 'unknown'}
` : '';

    const medicationSummary = medicationLog && medicationLog.length > 0 ? `
MEDICATION LOG:
${medicationLog.map(m => `${m.date}: ${m.medication} ${m.change || ''}`).join('\n')}
` : '';

    const menstrualSummary = menstrualCycle ? `
MENSTRUAL CYCLE DATA:
Current phase: ${menstrualCycle.currentPhase || 'unknown'}
Days until period: ${menstrualCycle.daysUntilPeriod || 'unknown'}
Pattern: ${menstrualCycle.pattern || 'unknown'}
` : '';

    const weatherSummary = weatherData ? `
WEATHER PATTERNS:
Recent pressure changes: ${weatherData.pressureChanges || 'none noted'}
Seasonal factors: ${weatherData.seasonalFactors || 'none'}
` : '';

    const calendarBlock = calendarContext ? `
UPCOMING COMMITMENTS:
${calendarContext}
` : '';

    const contactBlock = emergencyContacts && emergencyContacts.length > 0 ? `
EMERGENCY CONTACTS (for recovery protocol personalization):
${emergencyContacts.map(c => `${c.name} (${c.relationship})`).join(', ')}
` : '';

    const prompt = withLanguage(`You are a burnout prevention specialist with expertise in biometric analysis, chronobiology, and pattern recognition. Analyze patterns for someone who pushes through warning signs.

CRITICAL CONTEXT:
This person likely:
- Masks symptoms and can't trust their own assessment
- Has poor interoception (can't sense their own body signals)
- Will minimize how bad things are
- Pushes through everything until forced shutdown
- Needs OBJECTIVE DATA because their feelings are unreliable

ANALYZE THESE LOGS (${logs.length} days):
${logSummaries}
${biometricSummary}
${medicationSummary}
${menstrualSummary}
${weatherSummary}
${calendarBlock}
${contactBlock}

Return ONLY this JSON structure (NO markdown):

{
  "burnout_risk_assessment": {
    "current_risk_level": "critical | high | moderate | low",
    "risk_color": "red | orange | yellow | green",
    "confidence": 95,
    "days_until_likely_crash": 2,
    "trajectory": "declining | stable | improving",
    "crash_severity_predicted": "severe | moderate | mild"
  },
  
  "your_crash_pattern": {
    "pattern_recognition": "Describe their SPECIFIC pattern with numbers",
    "identified_indicators": [
      "Sleep drops below 5",
      "Stress above 8 for 3+ days",
      "No rest days for 10+ days"
    ],
    "current_status": {
      "sleep": "critical | below threshold | at threshold | normal",
      "stress": "critical | above threshold | at threshold | normal",
      "energy": "critical | depleted | low | adequate",
      "rest": "critical deficit | deficit | minimal | adequate",
      "warning_signs": "critical | accumulating | stable | decreasing",
      "biometrics": "concerning | watch | normal | not available"
    }
  },
  
  "biometric_analysis": {
    "hrv_trend": "If available: declining significantly | declining | stable | improving. If not available: not tracked",
    "hrv_interpretation": "What the HRV data means for crash risk, or explain what tracking HRV would reveal",
    "sleep_stage_quality": "If available: assessment. If not: based on self-reported sleep quality",
    "physical_activity_pattern": "If available: assessment. If not: inferred from activity logs",
    "resting_heart_rate": "If available: assessment. If not: not tracked",
    "crash_prediction_confidence": "How biometric data affects prediction accuracy"
  },
  
  "medication_correlation": {
    "caffeine_impact": "Analysis of caffeine intake patterns and correlation with sleep/energy",
    "alcohol_impact": "Analysis of alcohol intake and correlation with next-day metrics",
    "medication_notes": "Any medication changes noted and their potential impact on patterns",
    "substance_recommendation": "Specific actionable advice about caffeine/alcohol timing or amounts"
  },
  
  "menstrual_cycle_correlation": {
    "current_phase": "follicular | ovulation | luteal | menstrual | not tracked",
    "energy_pattern": "How cycle phase affects their energy based on logged data",
    "crash_risk_adjustment": "How cycle phase modifies crash risk prediction",
    "cycle_optimized_interventions": "Specific advice for current phase"
  },
  
  "weather_sensitivity_analysis": {
    "barometric_pressure_correlation": "Correlation between weather and symptoms if data available",
    "seasonal_pattern": "Any seasonal energy patterns detected",
    "weather_triggered_crashes": "Weather-related crash patterns if any",
    "recommendation": "Actionable weather-related advice"
  },
  
  "warning_signs_present": [
    {
      "sign": "Warning sign name",
      "your_typical_timeline": "appears X days before crash",
      "current_status": "present for X days",
      "urgency": "critical | high | moderate | watch",
      "days_until_crash_if_persists": 3
    }
  ],
  
  "intervention_escalation": {
    "current_level": "red | orange | yellow | green",
    "level_definitions": {
      "green": "Preventive - Maintain current self-care, monitor trends",
      "yellow": "Proactive - Reduce non-essential commitments, increase rest",
      "orange": "Urgent - Cancel plans, significant rest needed, consider sick leave",
      "red": "CRISIS - Seek professional support, emergency contacts notified, survival mode only"
    },
    "why_this_level": "Specific explanation of why this level was chosen based on their data",
    "escalation_triggers": "What would cause escalation to next level",
    "de_escalation_criteria": "What needs to happen to move down a level"
  },
  
  "preventive_interventions": [
    {
      "priority": "critical | urgent | high | medium | low",
      "action": "Specific action to take",
      "why": "Why this matters based on their data",
      "how": "Concrete steps",
      "when": "Timing",
      "resistance_you_might_feel": "Common pushback and why to ignore it",
      "reframe": "Alternative way to think about this"
    }
  ],

  "capacity_reality_check": {
    "your_current_capacity": "Percentage or description",
    "what_this_means": "Practical implications",
    "permission": "Permission statement to rest/reduce",
    "rest_day_scheduling": "When to schedule recovery",
    "future_crash_prevention": "Proactive planning advice"
  },
  
  "if_youre_already_crashed": {
    "likelihood": "high | moderate | low",
    "recognition": "Signs they might already be in burnout based on their data",
    "crash_severity": "severe | moderate | mild",
    "immediate_actions": [
      "Specific immediate action 1",
      "Specific immediate action 2"
    ],
    "minimum_survival_tasks": [
      "Drink water",
      "Eat something simple",
      "Sleep as much as body wants",
      "Take prescribed medications"
    ],
    "recovery_timeline": "Realistic timeline based on severity",
    "recovery_stages": {
      "week_1": "What to expect and do",
      "week_2": "What to expect and do",
      "week_3": "What to expect and do",
      "week_4_plus": "What to expect and do"
    },
    "what_not_to_do": "Common mistakes to avoid during recovery"
  },
  
  "recovery_protocol": {
    "who_to_notify": [
      {
        "person": "Role or name if provided",
        "message": "Pre-written message they can copy",
        "when": "When to send"
      }
    ],
    "self_compassion_scripts": [
      "Supportive self-talk script 1",
      "Supportive self-talk script 2",
      "Supportive self-talk script 3",
      "Supportive self-talk script 4"
    ],
    "relapse_prevention": {
      "warning_signs_of_relapse": "What to watch for after recovery",
      "how_to_catch_early": "Monitoring strategy",
      "if_relapse_starting": "Immediate action plan"
    }
  },
  
  "poor_interoception_support": {
    "objective_data": "Summary of their actual numbers vs what they might feel",
    "biometric_data": "Biometric summary if available, or what it would show",
    "trust_the_data": "Direct statement about what the data shows",
    "for_doubters": "Challenge to their denial",
    "external_validation": "Suggestion to get outside perspective"
  },
  
  "personalized_recovery_estimate": {
    "if_you_act_now": "Best case scenario with immediate action",
    "if_you_wait_1_week": "What happens if they delay",
    "if_you_crash_completely": "Worst case scenario",
    "cost_benefit": "Clear math: days lost now vs days lost later"
  }
}

ANALYSIS PRINCIPLES:

1. BIOMETRIC INTEGRATION:
- HRV <40ms = high crash risk (poor recovery, high stress)
- HRV declining trend = early warning (drops before subjective fatigue)
- Resting HR elevated 10+ bpm = autonomic stress
- Step count drop >30% = activity avoidance (crash sign)
- If no biometrics: note what tracking would reveal and recommend it

2. SUBSTANCE CORRELATION:
- Caffeine >4 servings = likely masking fatigue + disrupting sleep
- Alcohol even 2-3 drinks = sleep quality destruction
- New medication within 2 weeks = consider side effects
- Correlate substance intake with next-day energy/sleep scores

3. MENSTRUAL CYCLE:
- Luteal phase (days 15-28) = energy naturally lower
- 5-7 days pre-period = highest crash risk if already depleted
- Cycle-optimize: demanding tasks in follicular, rest in luteal

4. WEATHER SENSITIVITY:
- Barometric pressure drops >5mb = headache/fatigue trigger for some
- Seasonal pattern (low energy Nov-Feb) = possible seasonal factor
- Correlate reported weather with symptom patterns

5. INTERVENTION ESCALATION:
- GREEN: Baseline monitoring, preventive self-care
- YELLOW: 1-2 indicators concerning, proactive reduction
- ORANGE: 3+ indicators critical, urgent intervention
- RED: Imminent crash or already crashed, crisis protocol

6. RECOVERY PROTOCOLS:
- Immediate: who to notify, what to say, when
- Survival tasks only: sleep, eat, water, meds
- Self-compassion: specific scripts for guilt/shame
- Timeline: realistic expectations, no rushing
- Relapse prevention: continue logging 4 weeks

BE DIRECT. DON'T SOFTEN. They need to hear the truth because they can't sense it themselves.

Use all available data to increase prediction confidence. Correlate patterns across all data sources.

Return ONLY the JSON object.`, userLanguage);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 5000,
      messages: [{ role: 'user', content: prompt }]
    });

    const jsonText = cleanJsonResponse(message.content[0].text);
    
    let results;
    try {
      // Remove trailing commas before parsing
      const cleaned = jsonText.replace(/,(\s*[}\]])/g, '$1');
      results = JSON.parse(cleaned);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError.message);
      const pos = parseInt(parseError.message.match(/position (\d+)/)?.[1] || '0');
      if (pos > 0) {
        console.error('Context:', jsonText.substring(Math.max(0, pos - 100), Math.min(jsonText.length, pos + 100)));
      }
      throw new Error(`JSON parse failed: ${parseError.message}`);
    }

    if (!results.burnout_risk_assessment) {
      throw new Error('Invalid response structure');
    }

    res.json(results);

  } catch (error) {
    console.error('Crash prediction error:', error);
    res.status(500).json({
      error: 'Failed to analyze crash patterns',
      details: error.message
    });
  }
});

module.exports = router;
