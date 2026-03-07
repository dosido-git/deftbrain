const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/dream-pattern-spotter-single', async (req, res) => {
  try {
    const { 
      description, 
      date, 
      emotions, 
      lifeContext,
      isNightmare,
      sleepQuality,
      timeAsleep,
      wakeUps
    } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Dream description is required' });
    }

    const emotionContext = emotions 
      ? `Emotional tone: ${Array.isArray(emotions) ? emotions.join(', ') : emotions}` 
      : 'Emotional tone not specified';
    
    const contextInfo = lifeContext 
      ? `Life context: ${lifeContext}` 
      : 'No life context provided';

    const nightmareInfo = isNightmare ? 'User marked as NIGHTMARE' : 'Not marked as nightmare';
    
    const sleepInfo = sleepQuality 
      ? `Sleep quality: ${sleepQuality}/10, Time asleep: ${timeAsleep || 'unknown'}, Wake-ups: ${wakeUps || 'unknown'}` 
      : 'No sleep data provided';

    const prompt = `You are a depth psychology analyst and sleep scientist trained in Jungian, Freudian, modern neuroscience, trauma psychology, and lucid dreaming techniques.

DREAM:
Date: ${date}
${emotionContext}
${contextInfo}
${nightmareInfo}
${sleepInfo}

Description: ${description}

CRITICAL FRAMEWORK:
- Psychological pattern recognition, NOT fortune-telling
- Dreams reflect subconscious processing, emotions, and memory consolidation
- MULTIPLE interpretation possibilities from different schools
- NEVER definitive ("this means X") - always tentative ("could suggest")
- Assess for nightmare patterns, PTSD indicators, lucid dreaming potential
- Ground in psychology and sleep research

Return ONLY this JSON structure (NO markdown):

{
  "dream_classification": {
    "type": "normal_dream | anxiety_dream | nightmare | lucid_dream | recurring_dream",
    "intensity": "low | moderate | high",
    "nightmare_assessment": "If nightmare: severity and characteristics, else: not a nightmare"
  },
  
  "themes": [
    {
      "theme": "Theme name",
      "emotional_context": "Emotions with this theme",
      "possible_meaning": "Tentative interpretation",
      "perspectives": {
        "jungian": "Jungian interpretation",
        "freudian": "Freudian interpretation",
        "neuroscience": "Modern neuroscience view"
      }
    }
  ],
  
  "symbols": [
    {
      "symbol": "Specific symbol",
      "context_in_dream": "How it appeared",
      "interpretation_options": [
        "Classical interpretation",
        "Personal association",
        "Cultural/universal meanings"
      ],
      "reflection_prompt": "Question for dreamer"
    }
  ],
  
  "lucid_dreaming_analysis": {
    "dream_signs_identified": [
      {
        "sign": "Impossible or improbable element (e.g., 'can fly', 'dead person alive', 'teleportation')",
        "category": "impossibility | improbability | anomaly | emotion",
        "how_to_use": "If this appears again, do reality check"
      }
    ],
    "reality_check_recommendations": [
      "Specific reality check for identified dream signs"
    ],
    "lucid_potential": "low | moderate | high based on dream signs and vividness"
  },
  
  "nightmare_analysis": {
    "is_nightmare": true/false,
    "severity": "mild | moderate | severe | not applicable",
    "nightmare_type": "Anxiety nightmare | Trauma nightmare | Idiopathic nightmare | Not nightmare",
    "ptsd_indicators": [
      "If applicable: trauma re-experiencing, hyperarousal, avoidance themes"
    ],
    "intervention_suggestions": [
      "Imagery Rehearsal Therapy steps",
      "Nightmare rescripting technique",
      "When to seek professional help"
    ],
    "professional_help_recommended": true/false
  },
  
  "sleep_quality_analysis": {
    "rem_sleep_indicators": "Vivid dreams suggest REM sleep occurred",
    "sleep_quality_correlation": "If sleep data provided: how quality affects dreams",
    "dream_recall_factors": "What affects remembering this dream",
    "sleep_disruption_patterns": "If applicable: how sleep issues show in dream"
  },
  
  "emotional_significance": {
    "dominant_emotions": ["emotion1", "emotion2"],
    "emotional_processing": "What emotions being processed",
    "unresolved_feelings": "Feelings needing attention"
  },
  
  "trauma_processing_indicators": {
    "trauma_themes_present": true/false,
    "processing_stage": "If trauma present: re-experiencing | avoidance | integration | none",
    "therapeutic_considerations": "What therapist should know"
  },
  
  "life_event_connections": [
    {
      "potential_connection": "Connection to life context",
      "how_dream_processes_it": "Processing mechanism",
      "symbolic_transformation": "Symbolic representation"
    }
  ],
  
  "reflection_questions": [
    "Open-ended question about waking life",
    "Question about emotions/patterns",
    "Question about relationships or situations"
  ],
  
  "insights": {
    "overall_assessment": "Summary with multiple possibilities",
    "therapeutic_value": "What to explore in therapy",
    "growth_areas": "Life areas needing attention",
    "sleep_recommendations": "If sleep quality data: specific suggestions"
  },
  
  "therapist_export_summary": {
    "dream_date": "${date}",
    "classification": "Type and severity",
    "key_themes": ["theme1", "theme2"],
    "emotional_content": "Dominant emotions",
    "trauma_indicators": "If any",
    "clinical_relevance": "What's therapeutically significant",
    "recommended_exploration": "Therapy discussion points"
  }
}

NIGHTMARE ASSESSMENT CRITERIA:
- Wakes dreamer from sleep
- Causes significant distress
- Involves threat, danger, or intense fear
- Detailed recall of disturbing content
- Affects daytime functioning

PTSD NIGHTMARE INDICATORS:
- Trauma re-experiencing (similar to real event)
- Hyperarousal themes (constant vigilance, threat)
- Repetitive traumatic content
- Occurs frequently (multiple times/week)
- Associated with trauma history

NIGHTMARE INTERVENTION (Imagery Rehearsal Therapy):
1. Write down nightmare
2. Change the ending to something empowering
3. Rehearse new version 10-20 min daily
4. Imagine new version before sleep
5. Research shows 70% reduction in nightmare frequency

LUCID DREAMING DREAM SIGNS:
- Impossibilities (flying, breathing underwater, teleportation)
- Improbabilities (dead people alive, wrong location, impossible scenarios)
- Anomalies (bizarre physics, changing scenes, reading problems)
- Emotional extremes (without cause)

REALITY CHECK TECHNIQUES:
- Counting fingers (often wrong number in dreams)
- Reading text twice (changes in dreams)
- Checking time twice (changes in dreams)
- Trying to breathe through pinched nose (can in dreams)
- Looking for light switches (often don't work in dreams)

SLEEP QUALITY FACTORS:
- Poor sleep = more anxiety dreams
- REM rebound (after deprivation) = more vivid dreams
- Stress = more nightmares
- Alcohol/drugs = suppressed REM, rebound effect
- Sleep fragmentation = less dream recall

Generate psychological insights that promote understanding and healing.

Return ONLY the JSON object.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3500,
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
      // Try repair: remove control chars, fix trailing commas
      let repaired = jsonText
        .replace(/[\x00-\x1F\x7F]/g, (ch) => (ch === '\n' || ch === '\r' || ch === '\t') ? ch : ' ')
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']');
      try {
        results = JSON.parse(repaired);
        console.log('✅ JSON parsed after repair');
      } catch (retryError) {
        const pos = parseInt(parseError.message.match(/position (\d+)/)?.[1] || '0');
        if (pos > 0) {
          console.error('Context:', jsonText.substring(Math.max(0, pos - 100), Math.min(jsonText.length, pos + 100)));
        }
        throw new Error(`JSON parse failed: ${parseError.message}`);
      }
    }

    res.json(results);

  } catch (error) {
    console.error('Dream analysis error:', error);
    res.status(500).json({
      error: 'Failed to analyze dream',
      details: error.message
    });
  }
});

router.post('/dream-pattern-spotter-pattern', async (req, res) => {
  try {
    const { dreams } = req.body;

    if (!dreams || dreams.length < 2) {
      return res.status(400).json({ error: 'At least 2 dreams required for pattern analysis' });
    }

    const dreamSummaries = dreams.map((d, idx) => {
      const emotions = d.emotions && d.emotions.length > 0 ? d.emotions.join(', ') : 'none';
      const context = d.lifeContext || 'no context';
      const nightmare = d.isNightmare ? 'NIGHTMARE' : 'normal';
      const sleep = d.sleepQuality ? `sleep quality: ${d.sleepQuality}/10` : 'no sleep data';
      return `Dream ${idx + 1} (${d.date}):
Type: ${nightmare}
Emotions: ${emotions}
Sleep: ${sleep}
Context: ${context}
Description: ${d.description}`;
    }).join('\n\n');

    const dates = dreams.map(d => new Date(d.date));
    const minDate = new Date(Math.min(...dates));
    const maxDate = new Date(Math.max(...dates));
    const dateRange = `${minDate.toLocaleDateString()} - ${maxDate.toLocaleDateString()}`;

    const nightmareCount = dreams.filter(d => d.isNightmare).length;
    const totalDreams = dreams.length;

    const prompt = `You are a depth psychology analyst, trauma specialist, and sleep scientist. Analyze these dreams for patterns including nightmare patterns, trauma indicators, lucid dreaming potential, and sleep quality correlations.

DREAMS TO ANALYZE (${totalDreams} dreams, ${nightmareCount} nightmares):
${dreamSummaries}

CRITICAL FRAMEWORK:
- Identify PATTERNS across dreams
- Assess nightmare frequency and progression
- Look for PTSD/trauma indicators
- Identify lucid dreaming opportunities
- Correlate sleep quality with dream content
- Use tentative language, multiple perspectives
- Promote therapeutic exploration and healing

Return ONLY this JSON structure (NO markdown):

{
  "pattern_analysis": {
    "total_dreams_analyzed": ${totalDreams},
    "date_range": "${dateRange}",
    "dream_type_distribution": {
      "normal_dreams": 0,
      "anxiety_dreams": 0,
      "nightmares": ${nightmareCount},
      "lucid_dreams": 0
    },
    "recurring_themes": [
      {
        "theme": "Theme name",
        "frequency": 3,
        "emotional_context": "Emotions",
        "possible_meaning": "Tentative",
        "dreams_featuring": ["Dream 1", "Dream 3"],
        "evolution": "increasing/stable/decreasing"
      }
    ],
    "recurring_symbols": [
      {
        "symbol": "Symbol",
        "frequency": 4,
        "contexts": ["context1", "context2"],
        "emotional_associations": ["emotion1"],
        "interpretation_options": ["interpretation1"]
      }
    ],
    "recurring_people": [
      {
        "person_type": "Type",
        "frequency": 3,
        "role_in_dreams": "Role",
        "possible_connection": "Connection"
      }
    ],
    "emotional_patterns": {
      "most_common_emotion": "Emotion",
      "emotional_trend": "increasing/decreasing/stable",
      "correlation_with_life_events": "Correlation"
    }
  },
  
  "nightmare_pattern_analysis": {
    "nightmare_frequency": "${nightmareCount}/${totalDreams} dreams",
    "nightmare_severity_trend": "increasing | stable | decreasing | not applicable",
    "nightmare_types": [
      {
        "type": "Anxiety nightmare | Trauma nightmare | Idiopathic",
        "frequency": 2,
        "characteristics": "Description"
      }
    ],
    "ptsd_indicators": {
      "trauma_reexperiencing_present": true/false,
      "hyperarousal_themes": true/false,
      "avoidance_patterns": true/false,
      "flashback_quality_dreams": true/false,
      "professional_evaluation_recommended": true/false
    },
    "intervention_strategies": [
      {
        "strategy": "Imagery Rehearsal Therapy",
        "how_to_apply": "Step-by-step for this pattern",
        "expected_timeline": "Timeframe for improvement"
      },
      {
        "strategy": "Lucid Dreaming for Nightmare Control",
        "how_to_apply": "Use reality checks during nightmare",
        "expected_timeline": "3-6 months practice"
      }
    ]
  },
  
  "lucid_dreaming_potential": {
    "recurring_dream_signs": [
      {
        "sign": "Personal dream sign (what's impossible/improbable in YOUR dreams)",
        "frequency": 3,
        "category": "impossibility | improbability | anomaly",
        "reality_check_to_use": "Specific check for this sign"
      }
    ],
    "lucid_dream_induction_suggestions": [
      "MILD technique: Before sleep, repeat 'Next time I see [dream sign], I'll realize I'm dreaming'",
      "Reality checks: Check [your common dream sign] during day, 10+ times",
      "Dream journal: Record immediately upon waking, improves recall and awareness"
    ],
    "estimated_lucid_potential": "low | moderate | high based on dream signs and recall"
  },
  
  "sleep_quality_correlation": {
    "poor_sleep_dream_patterns": "If sleep data: patterns on poor sleep nights",
    "good_sleep_dream_patterns": "If sleep data: patterns on good sleep nights",
    "rem_sleep_quality_indicators": "Dream vividness suggests REM quality",
    "sleep_improvement_recommendations": [
      "Specific recommendations based on patterns"
    ]
  },
  
  "trauma_processing_assessment": {
    "trauma_themes_present": true/false,
    "processing_stage": "If trauma: re-experiencing | working through | integration | unprocessed",
    "trauma_dream_evolution": "How trauma content changes over time",
    "healing_indicators": "Signs of trauma integration if present",
    "clinical_recommendations": "What mental health professional should assess"
  },
  
  "life_event_correlations": [
    {
      "life_event": "Event",
      "dream_changes": "Changes",
      "pattern": "Processing pattern"
    }
  ],
  
  "subconscious_preoccupations": [
    {
      "preoccupation": "Theme",
      "evidence": ["evidence1"],
      "reflection_prompt": "Question"
    }
  ],
  
  "reflection_questions": [
    "Question about patterns",
    "Question about nightmares if applicable",
    "Question about unresolved issues"
  ],
  
  "insights": {
    "overall_assessment": "Summary",
    "therapeutic_value": "Therapy exploration",
    "growth_areas": "Life areas",
    "nightmare_prognosis": "If nightmares: outlook with intervention",
    "sleep_health_assessment": "Overall sleep-dream health"
  },
  
  "therapist_export_summary": {
    "date_range": "${dateRange}",
    "total_sessions_analyzed": ${totalDreams},
    "nightmare_frequency": "${nightmareCount}/${totalDreams}",
    "key_patterns": ["pattern1", "pattern2"],
    "trauma_indicators": "If any",
    "dominant_emotions": ["emotion1"],
    "clinical_priority_areas": ["area1"],
    "recommended_interventions": ["intervention1"],
    "progress_indicators": "If longitudinal: signs of improvement or deterioration"
  },
  
  "cbt_i_integration": {
    "sleep_hygiene_issues_evident": "If sleep data: issues to address",
    "cognitive_patterns_affecting_sleep": "Worry patterns, anxiety themes",
    "behavioral_recommendations": [
      "Sleep schedule optimization",
      "Pre-sleep routine adjustments",
      "Nightmare rescripting practice timing"
    ]
  }
}

NIGHTMARE FREQUENCY ASSESSMENT:
- 0-1 per week: Normal range
- 2-3 per week: Moderate concern, intervention recommended
- 4+ per week: High concern, professional evaluation recommended

PTSD NIGHTMARE CHARACTERISTICS:
- Repetitive traumatic content
- Wakes with intense fear, sweating, heart racing
- Difficulty returning to sleep
- Daytime trauma reminders trigger nightmares
- Content closely resembles actual traumatic event

LUCID DREAMING BENEFITS FOR NIGHTMARES:
- Can change nightmare while dreaming
- Reduces fear and helplessness
- Increases sense of control
- 60-70% reduction in nightmare distress (research)

SLEEP QUALITY-DREAM CORRELATION:
- Poor sleep → more fragmented dreams, anxiety themes
- Good sleep → more coherent narratives, positive emotions
- REM rebound (after deprivation) → intense, vivid dreams
- Sleep debt → more nightmares and negative content

CBT-I (Cognitive Behavioral Therapy for Insomnia) INTEGRATION:
- Worry dreams indicate cognitive arousal
- Nightmare frequency correlates with sleep quality
- Imagery Rehearsal Therapy is CBT-I compatible
- Sleep restriction + nightmare rescripting synergistic

Generate insights promoting healing and sleep health.

Return ONLY the JSON object.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
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
      let repaired = jsonText
        .replace(/[\x00-\x1F\x7F]/g, (ch) => (ch === '\n' || ch === '\r' || ch === '\t') ? ch : ' ')
        .replace(/,\s*}/g, '}')
        .replace(/,\s*]/g, ']');
      try {
        results = JSON.parse(repaired);
        console.log('✅ JSON parsed after repair');
      } catch (retryError) {
        const pos = parseInt(parseError.message.match(/position (\d+)/)?.[1] || '0');
        if (pos > 0) {
          console.error('Context:', jsonText.substring(Math.max(0, pos - 100), Math.min(jsonText.length, pos + 100)));
        }
        throw new Error(`JSON parse failed: ${parseError.message}`);
      }
    }

    res.json(results);

  } catch (error) {
    console.error('Pattern analysis error:', error);
    res.status(500).json({
      error: 'Failed to analyze dream patterns',
      details: error.message
    });
  }
});


module.exports = router;
