const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');

// ════════════════════════════════════════════════════════════
// SHARED: Log processing helper
// ════════════════════════════════════════════════════════════
function buildLogSummary(log, idx, total) {
  const daysAgo = total - idx;
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
Alcohol: ${log.alcohol || 0} drinks${log.menstrualPhase && log.menstrualPhase !== 'na' ? `\nMenstrual phase: ${log.menstrualPhase}` : ''}${log.notes ? `\nNotes: ${log.notes}` : ''}${log.biometrics?.hrv ? `\nHRV: ${log.biometrics.hrv}ms` : ''}${log.biometrics?.restingHR ? `\nResting HR: ${log.biometrics.restingHR} bpm` : ''}${log.biometrics?.sleepHours ? `\nSleep hours: ${log.biometrics.sleepHours}h` : ''}${log.biometrics?.steps ? `\nSteps: ${log.biometrics.steps}` : ''}${log.weather?.condition ? `\nWeather: ${log.weather.condition}` : ''}${log.weather?.barometricPressure ? `\nBarometric pressure: ${log.weather.barometricPressure} mb` : ''}`;
}

function buildContextBlocks(body) {
  const { biometricData, medicationLog, menstrualCycle, weatherData, calendarContext, emergencyContacts } = body;
  const blocks = [];

  if (biometricData) blocks.push(`BIOMETRIC TRENDS:\nHRV baseline: ${biometricData.hrvBaseline || 'unknown'}\nRecent HRV trend: ${biometricData.hrvTrend || 'unknown'}\nSleep stage disruption: ${biometricData.sleepDisruption || 'unknown'}\nStep count deviation: ${biometricData.stepDeviation || 'unknown'}\nResting HR changes: ${biometricData.restingHRChange || 'unknown'}`);

  if (medicationLog?.length > 0) blocks.push(`MEDICATION LOG:\n${medicationLog.map(m => `${m.date}: ${m.medication} ${m.change || ''}`).join('\n')}`);

  if (menstrualCycle) blocks.push(`MENSTRUAL CYCLE DATA:\nCurrent phase: ${menstrualCycle.currentPhase || 'unknown'}\nDays until period: ${menstrualCycle.daysUntilPeriod || 'unknown'}\nPattern: ${menstrualCycle.pattern || 'unknown'}`);

  if (weatherData) blocks.push(`WEATHER PATTERNS:\nRecent pressure changes: ${weatherData.pressureChanges || 'none noted'}\nSeasonal factors: ${weatherData.seasonalFactors || 'none'}`);

  if (calendarContext) blocks.push(`UPCOMING COMMITMENTS:\n${calendarContext}`);

  if (emergencyContacts?.length > 0) blocks.push(`EMERGENCY CONTACTS (for recovery protocol personalization):\n${emergencyContacts.map(c => `${c.name} (${c.relationship})`).join(', ')}`);

  return blocks.join('\n\n');
}

// ════════════════════════════════════════════════════════════
// SHARED: Personality & analysis principles
// ════════════════════════════════════════════════════════════
const PERSONALITY = `You are a burnout prevention specialist with expertise in biometric analysis, chronobiology, and pattern recognition. You analyze patterns for people who tend to push through warning signs.

CRITICAL CONTEXT:
This person likely:
- Minimizes symptoms and has trouble trusting their own assessment
- Has difficulty sensing their own body's signals until it's too late
- Will downplay how bad things are
- Pushes through everything until forced shutdown
- Needs OBJECTIVE DATA because their subjective sense may be unreliable`;

const ANALYSIS_PRINCIPLES = `ANALYSIS PRINCIPLES:

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

BE DIRECT. DON'T SOFTEN. They need to hear the truth because they may not be able to sense it themselves.

Use all available data to increase prediction confidence. Correlate patterns across all data sources.`;

// ════════════════════════════════════════════════════════════
// POST /crash-predictor-analyze — Main risk assessment
// ════════════════════════════════════════════════════════════
router.post('/crash-predictor-analyze', async (req, res) => {
  try {
    const { logs, userLanguage } = req.body;

    if (!logs || logs.length < 3) {
      return res.status(400).json({ error: 'Need at least 3 days of logs for pattern analysis' });
    }

    const logSummaries = logs.map((log, idx) => buildLogSummary(log, idx, logs.length)).join('\n\n');
    const contextBlocks = buildContextBlocks(req.body);

    const userPrompt = `${PERSONALITY}

ANALYZE THESE LOGS (${logs.length} days):
${logSummaries}

${contextBlocks}

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
    "hrv_trend": "If available: declining significantly | declining | stable | improving. If not: not tracked",
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

${ANALYSIS_PRINCIPLES}

Return ONLY the JSON object.`;

    const parsed = await callClaudeWithRetry(
      userPrompt,
      {
        label: 'crash-predictor-analyze',
        model: 'claude-sonnet-4-20250514',
        max_tokens: 5000,
        system: withLanguage(PERSONALITY, userLanguage),
      }
    );

    if (!parsed.burnout_risk_assessment) {
      throw new Error('Invalid response structure');
    }

    res.json(parsed);

  } catch (error) {
    console.error('Crash predictor analyze error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze crash patterns' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /crash-predictor-patterns — Long-term pattern detection (14+ days)
// ════════════════════════════════════════════════════════════
router.post('/crash-predictor-patterns', async (req, res) => {
  try {
    const { logs, userLanguage } = req.body;

    if (!logs || logs.length < 14) {
      return res.status(400).json({ error: 'Need at least 14 days of logs for pattern detection' });
    }

    const logSummaries = logs.slice(0, 90).map((log, idx) => {
      const activities = Object.keys(log.activities || {}).filter(k => log.activities[k]);
      const symptoms = Object.keys(log.physicalSymptoms || {}).filter(k => log.physicalSymptoms[k]);
      const warnings = Object.keys(log.warningSigns || {}).filter(k => log.warningSigns[k]);
      const customWarnings = (log.customSymptoms || []).filter(s => s.active).map(s => s.label);
      const dayOfWeek = new Date(log.date).toLocaleDateString('en', { weekday: 'short' });

      return `${log.date} (${dayOfWeek}): E:${log.energy} S:${log.sleep} St:${log.stress} M:${log.mood || '?'} ` +
        `Act:[${activities.join(',')}] Phys:[${symptoms.join(',')}] Warn:[${[...warnings, ...customWarnings].join(',')}] ` +
        `Caff:${log.caffeine || 0} Alc:${log.alcohol || 0}${log.menstrualPhase && log.menstrualPhase !== 'na' ? ` Cycle:${log.menstrualPhase}` : ''}` +
        `${log.notes ? ` Notes:"${log.notes.slice(0, 80)}"` : ''}`;
    }).join('\n');

    const userPrompt = `You are a data analyst specializing in personal health pattern recognition. Analyze these daily logs and identify RECURRING patterns, correlations, and cycles.

LOGS (${logs.length} days):
${logSummaries}

Find patterns across these dimensions:
1. Weekly patterns (which days are worst/best)
2. Cyclical patterns (crash every N weeks, monthly patterns)
3. Activity-consequence correlations (what activities precede crashes)
4. Substance correlations (caffeine/alcohol timing → next-day impact)
5. Cascade patterns (what sequence of events leads to crashes)
6. Recovery patterns (what helps them bounce back fastest)

Return ONLY this JSON (NO markdown):

{
  "patterns_found": [
    {
      "pattern": "Clear, specific description of the pattern",
      "evidence": "Specific dates/numbers that prove it",
      "confidence": "high | medium | low",
      "category": "weekly | cyclical | activity | substance | cascade | recovery",
      "actionable_insight": "What they should do about this pattern",
      "icon": "emoji that represents this pattern"
    }
  ],
  "weekly_heatmap": {
    "monday": { "avg_energy": 6.2, "avg_stress": 5.1, "risk_level": "low | moderate | high" },
    "tuesday": { "avg_energy": 5.8, "avg_stress": 5.5, "risk_level": "low | moderate | high" },
    "wednesday": { "avg_energy": 5.5, "avg_stress": 6.0, "risk_level": "low | moderate | high" },
    "thursday": { "avg_energy": 5.0, "avg_stress": 6.5, "risk_level": "low | moderate | high" },
    "friday": { "avg_energy": 4.5, "avg_stress": 7.0, "risk_level": "low | moderate | high" },
    "saturday": { "avg_energy": 5.5, "avg_stress": 4.0, "risk_level": "low | moderate | high" },
    "sunday": { "avg_energy": 6.0, "avg_stress": 4.5, "risk_level": "low | moderate | high" }
  },
  "crash_sequences": [
    {
      "trigger": "What starts the sequence",
      "sequence": ["Day 1: ...", "Day 2: ...", "Day 3: crash"],
      "frequency": "How often this has happened",
      "early_warning_day": "Which day in the sequence to intervene"
    }
  ],
  "what_helps": [
    {
      "intervention": "What they did",
      "effect": "What happened to their metrics",
      "evidence": "Specific instances"
    }
  ],
  "biggest_risks": [
    "The single most dangerous pattern, stated bluntly"
  ],
  "summary": "2-3 sentence overview of their most important patterns"
}

Be SPECIFIC with numbers and dates. Don't speculate — only report patterns supported by the data.`;

    const parsed = await callClaudeWithRetry(
      userPrompt,
      {
        label: 'crash-predictor-patterns',
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        system: withLanguage('You are a data analyst specializing in personal health pattern recognition.', userLanguage),
      }
    );
    res.json(parsed);

  } catch (error) {
    console.error('Crash predictor patterns error:', error);
    res.status(500).json({ error: error.message || 'Failed to detect patterns' });
  }
});

module.exports = router;
