// sleep-architect.js
const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const GOAL_LABELS = {
  fall_asleep:  'falling asleep faster',
  stay_asleep:  'staying asleep through the night',
  wake_rested:  'waking up feeling rested',
  timing:       'fixing sleep schedule / timing',
  stress:       'sleeping despite stress or anxiety',
  energy:       'increasing daytime energy',
};

const DISRUPTOR_LABELS = {
  screens:    'screen use before bed',
  caffeine:   'caffeine consumption',
  alcohol:    'alcohol use',
  noise:      'environmental noise',
  light:      'light exposure in bedroom',
  temperature:'uncomfortable bedroom temperature',
  stress:     'racing thoughts / stress / anxiety',
  irregular:  'irregular sleep schedule',
  partner:    'partner or pet disruptions',
  bathroom:   'waking to use the bathroom',
  pain:       'pain or physical discomfort',
  unknown:    'unknown causes',
};

router.post('/sleep-architect/stream', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  const { goals, bedtime, wakeTime, hoursActual, disruptors, freeform, userLanguage } = req.body;

  const goalList = Array.isArray(goals) && goals.length
    ? goals.map(g => GOAL_LABELS[g] ?? g).join(', ')
    : null;

  const disruptorList = Array.isArray(disruptors) && disruptors.length
    ? disruptors.map(d => DISRUPTOR_LABELS[d] ?? d).join(', ')
    : null;

  if (!goalList && !freeform?.trim()) {
    return res.status(400).json({ error: 'Please select at least one sleep goal or describe your situation.' });
  }

  const systemPrompt = withLanguage(
    `You are an expert sleep coach and behavioral sleep medicine specialist. You create personalized, evidence-based sleep improvement protocols grounded in cognitive behavioral therapy for insomnia (CBT-I), sleep hygiene science, and circadian rhythm research. Your advice is specific, actionable, and sequenced — you tell people exactly what to do and in what order, not just general principles. You always return only valid JSON with no markdown, no code blocks, and no explanation outside the JSON object.`,
    userLanguage
  );

  const context = [
    goalList            ? `Primary goals: ${goalList}` : null,
    bedtime             ? `Current bedtime: ${bedtime}` : null,
    wakeTime            ? `Current wake time: ${wakeTime}` : null,
    hoursActual         ? `Actual hours of sleep: ${hoursActual}` : null,
    disruptorList       ? `Known disruptors: ${disruptorList}` : null,
    freeform?.trim()    ? `Additional context: ${freeform.trim()}` : null,
  ].filter(Boolean).join('\n');

  const prompt = `Create a personalized sleep improvement protocol based on this person's situation:

${context}

Return ONLY valid JSON with this exact structure:
{
  "sleep_score": <integer 1–10 — current sleep health based on the information provided; be honest, not optimistic>,
  "diagnosis": <1-2 sentence plain-language summary of the core sleep problem and its likely cause>,
  "key_issues": [<specific sleep issue identified from their inputs — max 4, cite their actual situation>],
  "quick_wins": [<action they can take TONIGHT that will have immediate impact — max 4, extremely specific>],
  "protocol": [
    {
      "phase": <one of: "immediate", "week1", "ongoing", "environment">,
      "title": <short name for this intervention>,
      "description": <1-2 sentence explanation of why this works and what it targets>,
      "actions": [<specific step to take — concrete, measurable — max 4>]
    }
  ],
  "schedule": {
    "bedtime": <recommended target bedtime — e.g. "10:30 PM" — null if not enough info>,
    "wake_time": <recommended target wake time — e.g. "6:30 AM" — null if not enough info>,
    "wind_down_start": <when to begin wind-down routine — e.g. "9:45 PM" — null if not calculable>,
    "note": <one sentence about the schedule — e.g. consistency note or transition advice>
  }
}

Guidelines:
- sleep_score: 1-3 = poor (multiple significant issues), 4-6 = moderate (fixable with effort), 7-8 = good with room for improvement, 9-10 = rare
- quick_wins: the single most important thing first — often one habit change has outsized impact
- protocol phases: immediate = tonight/tomorrow, week1 = build over 7 days, ongoing = permanent habits, environment = physical setup
- Be specific: "Stop caffeine after 1 PM" not "reduce caffeine"; "keep bedroom at 65-68°F / 18-20°C" not "cool your room"
- Include 3-5 protocol steps ordered by impact
- If stress/racing thoughts is a factor, include a specific cognitive technique (not just "relax")
- Return ONLY the JSON object`;

  try {
    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'sleep-architect' });

    if (!parsed?.diagnosis || !Array.isArray(parsed?.protocol)) {
      return res.status(500).json({ error: 'Unexpected response format. Please try again.' });
    }

    res.json({
      sleep_score:  typeof parsed.sleep_score === 'number' ? parsed.sleep_score : null,
      diagnosis:    parsed.diagnosis ?? '',
      key_issues:   Array.isArray(parsed.key_issues)  ? parsed.key_issues  : [],
      quick_wins:   Array.isArray(parsed.quick_wins)  ? parsed.quick_wins  : [],
      protocol:     parsed.protocol,
      schedule:     parsed.schedule ?? null,
    });
  } catch (err) {
    if (!res.headersSent) {
      res.status(500).json({ error: 'Protocol generation failed. Please try again.' });
    }
  }
});

module.exports = router;
