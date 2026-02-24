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
      calendarEvents
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
      
      return `Day ${daysAgo} (${log.date}):
Energy: ${log.energy}/10
Sleep: ${log.sleep}/10
Stress: ${log.stress}/10
Activities: ${activities.join(', ') || 'none'}
Physical: ${symptoms.join(', ') || 'none'}
Warning signs: ${warnings.join(', ') || 'none'}
Medications: ${log.medications?.join(', ') || 'none'}
Caffeine: ${log.caffeine || 0} servings
Alcohol: ${log.alcohol || 0} drinks${log.menstrualPhase ? `
Menstrual phase: ${log.menstrualPhase}` : ''}${log.biometrics?.hrv ? `
HRV: ${log.biometrics.hrv}ms` : ''}${log.biometrics?.sleepStages ? `
Sleep stages: ${JSON.stringify(log.biometrics.sleepStages)}` : ''}${log.weather?.barometricPressure ? `
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

    const prompt = `You are a burnout prevention specialist with expertise in biometric analysis, pharmacology, endocrinology, and chronobiology. Analyze patterns for someone who pushes through warning signs.

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
      "HRV below 40ms for 2+ days",
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
    "hrv_trend": "If available: declining significantly | declining | stable | improving",
    "hrv_interpretation": "HRV <40ms = high stress/low recovery, 40-60ms = moderate, >60ms = good recovery",
    "sleep_stage_quality": "If available: REM disrupted | Deep sleep insufficient | Fragmented | Good",
    "physical_activity_pattern": "If available: Overtraining | Declining | Stable | Adequate",
    "resting_heart_rate": "If available: Elevated (stress indicator) | Normal | Low",
    "crash_prediction_confidence": "Biometrics increase prediction accuracy to X%"
  },
  
  "medication_correlation": {
    "medications_logged": ["medication1", "medication2"],
    "recent_changes": [
      {
        "medication": "SSRI started",
        "date": "3 days ago",
        "correlation_with_symptoms": "Energy dip coincides with start - common initial side effect",
        "recommendation": "Monitor for 2 weeks, consult doctor if persists"
      }
    ],
    "caffeine_impact": "Averaging X servings/day. High caffeine correlates with poor sleep and HRV decline.",
    "alcohol_impact": "X drinks logged. Alcohol on day Y preceded sleep quality drop from 7 to 3.",
    "supplement_timing": "If logged: timing patterns relative to symptoms"
  },
  
  "menstrual_cycle_correlation": {
    "current_phase": "follicular | ovulation | luteal | menstrual",
    "days_until_period": 5,
    "energy_pattern": "Your energy typically drops 5-7 days before period (luteal phase)",
    "crash_risk_adjustment": "Crash risk +20% due to luteal phase. Your pattern shows crashes more likely in late luteal.",
    "pmdd_indicators": "If applicable: severe mood/energy swings suggest PMDD screening recommended",
    "cycle_optimized_interventions": "Schedule demanding tasks in follicular phase (days 1-14). Reduce commitments in luteal."
  },
  
  "weather_sensitivity_analysis": {
    "barometric_pressure_correlation": "Headaches/fatigue coincide with pressure drops below X mb",
    "seasonal_pattern": "Energy declines in winter months (Nov-Feb) - suggests seasonal affective pattern",
    "weather_triggered_crashes": "3 of last 5 crashes preceded by barometric pressure drop",
    "light_exposure_recommendation": "If seasonal pattern: 10,000 lux light therapy 30 min morning"
  },
  
  "warning_signs_present": [
    {
      "sign": "Irritability",
      "your_typical_timeline": "appears 5 days before crash",
      "current_status": "present for 2 days",
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
      "red": "CRISIS - Medical professional contact, emergency contacts notified, survival mode only"
    },
    "why_this_level": "Multiple critical indicators present (sleep critical, stress critical, HRV concerning, warning signs accumulating)",
    "escalation_triggers": "Will escalate to RED if: energy <2 for 2 days, suicidal thoughts, cannot perform basic self-care",
    "de_escalation_criteria": "Move to ORANGE when: 2+ nights of sleep >6, stress <7 for 3 days, 1 full rest day completed"
  },
  
  "preventive_interventions": [
    {
      "priority": "critical | urgent | high | medium | low",
      "action": "Cancel tomorrow's evening plans",
      "why": "You need 8+ hours of unstructured rest to prevent crash",
      "how": "Text: 'I need to raincheck - not feeling well. Can we reschedule next week?'",
      "when": "Today by 6pm",
      "resistance_you_might_feel": "Guilt, FOMO, 'but I committed', fear of letting people down",
      "reframe": "Canceling now prevents canceling everything next week when you crash",
      "if_you_dont": "Your crash risk increases from 40% to 80%",
      "success_metric": "How you'll know it worked: Sleep quality >6, energy stabilizes"
    }
  ],
  
  "capacity_reality_check": {
    "your_current_capacity": "20% below normal | 40% below normal | severely depleted | critical",
    "what_this_means": "You can do 1-2 important things today, not 5. You cannot sustain current load.",
    "permission": "It's okay to do less right now. This is temporary. Your body needs this.",
    "what_happens_if_you_ignore": "Forced shutdown in estimated X days. Complete inability to function.",
    "capacity_calculation": "Based on: Energy avg 3.2/10 (vs baseline 7), Sleep avg 4/10 (vs baseline 7), HRV 35ms (vs baseline 55ms)"
  },
  
  "calendar_integration_insights": {
    "upcoming_demanding_periods": "Next week shows 8 commitments - above your threshold of 5 for current capacity",
    "recommended_cancellations": "Cancel: meeting Y, social event Z. Delegate: project X.",
    "rest_day_scheduling": "Block Saturday entirely for recovery. No exceptions.",
    "future_crash_prevention": "Week of Dec 15 looks very busy - proactively reduce now"
  },
  
  "if_youre_already_crashed": {
    "likelihood": "high | moderate | low",
    "recognition": "You might already be in burnout if: [specific signs from their data]",
    "crash_severity": "severe | moderate | mild based on symptom constellation",
    "immediate_actions": [
      "Call in sick tomorrow - no exceptions",
      "Cancel all non-essential plans this week",
      "Contact: [emergency contact person if provided]",
      "Medical professional if: suicidal thoughts, cannot eat/sleep, complete dissociation"
    ],
    "minimum_survival_tasks": [
      "Drink water",
      "Eat something simple (cereal, crackers, delivery)",
      "Sleep as much as body wants",
      "Shower if can, don't if can't",
      "Take medications if prescribed"
    ],
    "recovery_timeline": "Severe crash: 3-6 weeks, Moderate: 2-4 weeks, Mild: 1-2 weeks. Cannot rush.",
    "recovery_stages": {
      "week_1": "Sleep/eat/survive only. No decisions. No guilt.",
      "week_2": "Still mostly resting. Maybe small tasks. Still easily exhausted.",
      "week_3": "Starting to feel human. Short activities okay. Still need lots of rest.",
      "week_4_plus": "Gradual return to function. Monitor carefully for relapse signs."
    },
    "what_not_to_do": "Don't try to power through. Don't minimize. Don't set deadlines. Don't compare to others."
  },
  
  "recovery_protocol": {
    "who_to_notify": [
      {
        "person": "Manager/Boss",
        "message": "I'm experiencing health issues and need to take sick leave. I'll update you on Monday.",
        "when": "Today if taking sick leave tomorrow"
      },
      {
        "person": "Close friend/family",
        "message": "I'm in burnout and need support. Can you check on me this week?",
        "when": "ASAP"
      }
    ],
    "self_compassion_scripts": [
      "I am not lazy. I am depleted. This is medical.",
      "Resting now is productive. It prevents weeks of forced shutdown.",
      "My body kept me going as long as it could. Now it needs care.",
      "I'm not weak. I'm recovering. This takes time and that's okay."
    ],
    "relapse_prevention": {
      "warning_signs_of_relapse": "Energy drops again, pushing through fatigue, skipping rest days, 'I'm fine now'",
      "how_to_catch_early": "Continue daily logging for 4 weeks post-recovery. Watch for pattern restart.",
      "if_relapse_starting": "Immediate rest day. Do not wait. Pattern can restart in 2-3 days."
    }
  },
  
  "poor_interoception_support": {
    "objective_data": "Your logs show: sleep averaging 4.5/10, stress at 8+ for 6 days, energy declining from 7 to 3, zero rest days in 12 days",
    "biometric_data": "HRV dropped from 55ms to 35ms. Resting HR elevated 10bpm above baseline. REM sleep reduced 40%.",
    "trust_the_data": "Even if you 'feel fine', the pattern is clear. Your body is telling you something your brain is masking.",
    "for_doubters": "You logged this data yourself. These numbers don't lie.",
    "external_validation": "Show this analysis to someone who knows you. Ask: 'Does this match what you've observed?'"
  },
  
  "specific_to_neurodivergent": {
    "autistic_considerations": [
      "If autistic: masking drains energy invisibly. Social activities cost 2x what they seem.",
      "Shutdown vs burnout: you might be heading for shutdown (sudden inability to function)",
      "Sensory overload accumulates even if not noticed in moment",
      "Your HRV data shows autonomic dysregulation - common in autism, worsens with stress"
    ],
    "adhd_considerations": [
      "If ADHD: hyperfocus hides fatigue. Interest-driven activities still drain energy.",
      "Stimulant medications can mask exhaustion - check actual sleep/rest, not how you feel",
      "Novelty-seeking can delay rest - crash comes when novelty wears off",
      "Medication timing: Your energy dips 4-6 hours post-medication - schedule rest then"
    ],
    "medication_interactions": "If taking multiple medications: stimulants + SSRIs can mask fatigue while increasing crash risk. Monitor carefully."
  },
  
  "personalized_recovery_estimate": {
    "if_you_act_now": "2-4 days intensive rest → back to 70% capacity",
    "if_you_wait_1_week": "1-2 weeks recovery needed → back to 60% capacity initially",
    "if_you_crash_completely": "3-6 weeks minimum → gradual return, high relapse risk",
    "cost_benefit": "Acting now: lose 3 days. Ignoring: lose 21+ days. Math is clear."
  }
}

ANALYSIS PRINCIPLES:

1. BIOMETRIC INTEGRATION:
- HRV <40ms = high crash risk (poor recovery, high stress)
- HRV declining trend = early warning (drops before subjective fatigue)
- Sleep stage disruption (reduced REM/deep) = poor recovery
- Resting HR elevated 10+ bpm = autonomic stress
- Step count drop >30% = activity avoidance (crash sign)

2. MEDICATION CORRELATION:
- New medication within 2 weeks = consider side effects
- SSRI start = common energy dip first 2 weeks
- Stimulant timing = note energy crash 4-6 hours post-dose
- Caffeine >4 servings = likely masking fatigue + disrupting sleep
- Alcohol even 2-3 drinks = sleep quality destruction

3. MENSTRUAL CYCLE:
- Luteal phase (days 15-28) = energy naturally lower
- 5-7 days pre-period = highest crash risk if already depleted
- PMDD indicators: severe mood/energy drops in luteal phase
- Cycle-optimize: demanding tasks in follicular, rest in luteal

4. WEATHER SENSITIVITY:
- Barometric pressure drops >5mb = headache/fatigue trigger for some
- Seasonal pattern (low energy Nov-Feb) = SAD likely
- Weather-sensitive: 70% of crashes follow pressure drops = strong correlation

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

Use biometric data to increase prediction confidence. Correlate patterns across all data sources.

Return ONLY the JSON object.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4500,
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
