const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

router.post('/dream-pattern-spotter-single', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { description,
      date,
      emotions,
      lifeContext, userLanguage } = req.body;

    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Dream description is required' });
    }

    const emotionContext = emotions
      ? `Emotional tone: ${Array.isArray(emotions) ? emotions.join(', ') : emotions}`
      : 'Emotional tone not specified';

    const contextInfo = lifeContext
      ? `Life context: ${lifeContext}`
      : 'No life context provided';

    const prompt = `You are a depth psychology analyst and sleep scientist trained in Jungian, Freudian, modern neuroscience, trauma psychology, and lucid dreaming techniques.

DREAM:
Date: ${date}
${emotionContext}
${contextInfo}

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
    "nightmare_assessment": "If nightmare: severity and characteristics, else: not a nightmare — 1-2 sentences"
  },
  
  "themes": [
    {
      "theme": "Theme name — 3-6 words",
      "emotional_context": "Emotions with this theme — 1-2 sentences",
      "possible_meaning": "Tentative interpretation — one sentence",
      "perspectives": {
        "jungian": "Jungian interpretation — one sentence",
        "freudian": "Freudian interpretation — one sentence",
        "neuroscience": "Modern neuroscience view — one sentence"
      }
    }
  ],
  
  "symbols": [
    {
      "symbol": "Specific symbol — one sentence",
      "context_in_dream": "How it appeared — one sentence",
      "interpretation_options": [
        "Classical interpretation",
        "Personal association",
        "Cultural/universal meanings"
      ],
      "reflection_prompt": "Question for dreamer — one sentence"
    }
  ],
  
  "lucid_dreaming_analysis": {
    "dream_signs_identified": [
      {
        "sign": "Impossible or improbable element (e.g., 'can fly', 'dead person alive', 'teleportation') — one sentence",
        "category": "impossibility | improbability | anomaly | emotion",
        "how_to_use": "If this appears again, do reality check — one sentence"
      }
    ],
    "reality_check_recommendations": [
      "Specific reality check for identified dream signs"
    ],
    "lucid_potential": "low | moderate | high"
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
    "rem_sleep_indicators": "Vivid dreams suggest REM sleep occurred — one sentence",
    "sleep_quality_correlation": "If sleep data provided: how quality affects dreams — one sentence",
    "dream_recall_factors": "What affects remembering this dream — one sentence",
    "sleep_disruption_patterns": "If applicable: how sleep issues show in dream — one sentence"
  },
  
  "emotional_significance": {
    "dominant_emotions": ["emotion1", "emotion2"],
    "emotional_processing": "What emotions being processed — one sentence",
    "unresolved_feelings": "Feelings needing attention — one sentence"
  },

  "life_event_connections": [
    {
      "potential_connection": "Life event or situation this dream may connect to — one sentence",
      "how_dream_processes_it": "How the dream works through it — one sentence",
      "symbolic_transformation": "How the event appears in symbolic form — one sentence"
    }
  ],

  "insights": {
    "overall_assessment": "Big-picture reading of this dream — 2-3 sentences",
    "therapeutic_value": "What exploring this dream could offer — 1-2 sentences",
    "growth_areas": "Personal growth themes suggested — 1-2 sentences",
    "sleep_recommendations": "Sleep hygiene suggestions based on this dream — 1-2 sentences",
    "nightmare_prognosis": "If nightmare: likely trajectory with/without intervention, else: not applicable — one sentence",
    "sleep_health_assessment": "What this dream suggests about sleep health — one sentence"
  },

  "reflection_questions": [
    "Open question for journaling or therapy"
  ],

  "therapist_export_summary": {
    "classification": "Clinical-style dream classification — one sentence",
    "emotional_content": "Summary of emotional content — one sentence",
    "trauma_indicators": "Present/absent and which — one sentence",
    "clinical_relevance": "Why this may matter clinically — one sentence",
    "recommended_exploration": "What a clinician might explore — one sentence",
    "clinical_priority_areas": ["priority area"],
    "recommended_interventions": ["intervention"],
    "progress_indicators": "What improvement would look like — one sentence"
  }
}

ARRAY CAPS (hard limits — keep the response compact):
- themes: max 5 items
- symbols: max 5 items
- interpretation_options: max 3 items per symbol
- dream_signs_identified: max 3 items
- reality_check_recommendations: max 3 items
- ptsd_indicators: max 3 items (empty array if not applicable)
- intervention_suggestions: max 3 items
- life_event_connections: max 3 items (empty array if no life context to connect)
- reflection_questions: max 4 items
- clinical_priority_areas / recommended_interventions: max 3 items each

Keep enum values exactly as listed, in English (type, intensity, severity, category, lucid_potential) — the interface switches on them. Never append annotations or translations to enum values.

Your response must be complete, valid JSON that closes every bracket — do not truncate.

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
Base lucid_potential on the number and strength of dream signs plus dream vividness and recall.

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

    const results = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{role: 'user', content: withLanguage(prompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion)}]
    }, { label: 'dream-pattern-spotter' });

    if (!results.themes || !results.symbols) {
      return res.status(500).json({ error: 'Could not analyze your dream. Please try again.' });
    }
    res.json(results);

  } catch (error) {
    console.error('Dream analysis error:', error);
    res.status(500).json({
      error: 'Something went wrong. Please try again.' });
  }
});

router.post('/dream-pattern-spotter-pattern', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { dreams, userLanguage } = req.body;

    if (!dreams || dreams.length < 2) {
      return res.status(400).json({ error: 'At least 2 dreams required for pattern analysis' });
    }

    const dreamSummaries = dreams.map((d, idx) => {
      const emotions = d.emotions && d.emotions.length > 0 ? d.emotions.join(', ') : 'none';
      const context = d.lifeContext || 'no context';
      return `Dream ${idx + 1} (${d.date}):
Emotions: ${emotions}
Context: ${context}
Description: ${d.description}`;
    }).join('\n\n');

    // Raw ISO dates only — the frontend formats the range in the user's locale.
    const isoDates = dreams.map(d => d.date).filter(Boolean).sort();
    const minISO = isoDates[0] || '';
    const maxISO = isoDates[isoDates.length - 1] || '';

    const totalDreams = dreams.length;

    const prompt = `You are a depth psychology analyst, trauma specialist, and sleep scientist. Analyze these dreams for patterns including nightmare patterns, trauma indicators, lucid dreaming potential, and sleep quality correlations.

DREAMS TO ANALYZE (${totalDreams} dreams):
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
    "date_range_start": "${minISO}",
    "date_range_end": "${maxISO}",
    "dream_type_distribution": {
      "normal_dream": 0,
      "anxiety_dream": 0,
      "nightmare": 0,
      "lucid_dream": 0,
      "recurring_dream": 0
    },
    "recurring_themes": [
      {
        "theme": "Theme name — 3-6 words",
        "frequency": 3,
        "emotional_context": "Emotions — 1-2 sentences",
        "possible_meaning": "Tentative — one sentence",
        "dreams_featuring": ["Dream 1", "Dream 3"]
      }
    ],
    "recurring_symbols": [
      {
        "symbol": "Symbol — one sentence",
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
        "possible_connection": "Connection — one sentence"
      }
    ],
    "emotional_patterns": {
      "most_common_emotion": "Emotion — one sentence",
      "emotional_trend": "increasing/decreasing/stable — one sentence",
      "correlation_with_life_events": "Correlation — one sentence"
    }
  },
  
  "nightmare_pattern_analysis": {
    "nightmare_frequency": "X/${totalDreams} dreams — count dreams whose description indicates a nightmare",
    "nightmare_severity_trend": "increasing | stable | decreasing | not applicable",
    "nightmare_types": [
      {
        "type": "Anxiety nightmare | Trauma nightmare | Idiopathic",
        "frequency": 2,
        "characteristics": "Description — one sentence"
      }
    ],
    "ptsd_indicators": {
      "trauma_reexperiencing": true/false,
      "hyperarousal_themes": true/false,
      "repetitive_traumatic_content": true/false,
      "frequent_occurrence": true/false,
      "daytime_triggers": true/false
    },
    "intervention_strategies": [
      {
        "strategy": "Imagery Rehearsal Therapy — one sentence",
        "how_to_apply": "Step-by-step for this pattern — one sentence",
        "expected_timeline": "Timeframe for improvement — one sentence"
      },
      {
        "strategy": "Lucid Dreaming for Nightmare Control — one sentence",
        "how_to_apply": "Use reality checks during nightmare — one sentence",
        "expected_timeline": "3-6 months practice — one sentence"
      }
    ]
  },
  
  "lucid_dreaming_potential": {
    "recurring_dream_signs": [
      {
        "sign": "Personal dream sign (what's impossible/improbable in YOUR dreams) — one sentence",
        "frequency": 3,
        "category": "impossibility | improbability | anomaly",
        "reality_check_to_use": "Specific check for this sign — one sentence"
      }
    ],
    "lucid_dream_induction_suggestions": [
      "MILD technique: Before sleep, repeat 'Next time I see [dream sign], I'll realize I'm dreaming'",
      "Reality checks: Check [your common dream sign] during day, 10+ times",
      "Dream journal: Record immediately upon waking, improves recall and awareness"
    ],
    "estimated_lucid_potential": "low | moderate | high"
  },
  
  "sleep_quality_correlation": {
    "poor_sleep_dream_patterns": "Patterns suggesting poor sleep nights — one sentence",
    "good_sleep_dream_patterns": "Patterns suggesting good sleep nights — one sentence",
    "rem_sleep_quality_indicators": "Dream vividness suggests REM quality — one sentence",
    "sleep_improvement_recommendations": [
      "Specific recommendation based on patterns"
    ]
  },

  "life_event_correlations": [
    {
      "life_event": "Life event or situation from the provided context — 3-6 words",
      "dream_changes": "How dreams shifted around it — one sentence",
      "pattern": "The correlation pattern observed — one sentence"
    }
  ],

  "subconscious_preoccupations": [
    {
      "preoccupation": "What the subconscious keeps returning to — 3-6 words",
      "evidence": ["evidence from the dreams"],
      "reflection_prompt": "Question for the dreamer — one sentence"
    }
  ],

  "insights": {
    "overall_assessment": "Big-picture reading of these dream patterns — 2-3 sentences",
    "therapeutic_value": "What exploring these patterns could offer — 1-2 sentences",
    "growth_areas": "Personal growth themes suggested — 1-2 sentences",
    "sleep_recommendations": "Sleep hygiene suggestions based on the patterns — 1-2 sentences",
    "nightmare_prognosis": "If nightmares present: likely trajectory with/without intervention, else: not applicable — one sentence",
    "sleep_health_assessment": "What these patterns suggest about sleep health — one sentence"
  },

  "reflection_questions": [
    "Open question for journaling or therapy"
  ]
}

ARRAY CAPS (hard limits — keep the response compact):
- recurring_themes: max 5 items
- recurring_symbols: max 5 items
- recurring_people: max 3 items
- nightmare_types: max 3 items
- intervention_strategies: max 3 items
- recurring_dream_signs: max 3 items
- lucid_dream_induction_suggestions: max 3 items
- sleep_improvement_recommendations: max 3 items
- life_event_correlations: max 3 items (empty array if no life context provided)
- subconscious_preoccupations: max 3 items
- evidence: max 3 items per preoccupation
- reflection_questions: max 4 items
- dreams_featuring / contexts / emotional_associations / interpretation_options: max 3 items each

Keep enum values exactly as listed, in English (nightmare_severity_trend, category, estimated_lucid_potential, dream_type_distribution keys) — the interface switches on them. Never append annotations or translations to enum values.

Echo date_range_start and date_range_end exactly as given (raw ISO dates); the interface formats them.

Base estimated_lucid_potential on the number and strength of recurring dream signs and recall quality.

Your response must be complete, valid JSON that closes every bracket — do not truncate.

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

    const results = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      messages: [{role: 'user', content: withLanguage(prompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion)}]
    }, { label: 'dream-pattern-timeline' });

    if (!results.pattern_analysis) {
      return res.status(500).json({ error: 'Could not analyze dream patterns. Please try again.' });
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
