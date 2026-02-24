const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

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

    const prompt = withLanguage(`You are a data analyst specializing in personal health pattern recognition. Analyze these daily logs and identify RECURRING patterns, correlations, and cycles.

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

Be SPECIFIC with numbers and dates. Don't speculate — only report patterns supported by the data.`, userLanguage);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3000,
      messages: [{ role: 'user', content: prompt }]
    });

    const jsonText = cleanJsonResponse(message.content[0].text);
    const cleaned = jsonText.replace(/,(\s*[}\]])/g, '$1');
    const results = JSON.parse(cleaned);

    res.json(results);

  } catch (error) {
    console.error('Pattern detection error:', error);
    res.status(500).json({
      error: 'Failed to detect patterns',
      details: error.message
    });
  }
});

module.exports = router;
