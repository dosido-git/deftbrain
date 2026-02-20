const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/routine-rupture-manager', async (req, res) => {
  try {
    const {
      disruption, customDisruption, energy, duration,
      normalRoutine, criticalTasks, constraints, userLanguage
    } = req.body;

    if (!disruption) {
      return res.status(400).json({ error: 'Select what disrupted your routine.' });
    }

    const DISRUPTION_GUIDANCE = {
      sick_day: 'Sick day. Rest is the #1 priority, not a luxury. Only true non-negotiables survive (medication, feeding dependents). Everything else is dropped or radically simplified. No guilt about screen time, naps, or eating cereal for dinner.',
      insomnia: 'Bad sleep / insomnia. Cognitive function is impaired — no important decisions today. Caffeine is a band-aid, not a fix. Shorten the day: start later, end earlier. Cancel anything optional. Nap if possible but not after 2pm.',
      mental_health: 'Mental health day. This is a REAL sick day, not a lazy day. Reduce stimulation. Keep one small anchor task to prevent spiral. No "catching up" — that defeats the purpose. Gentle movement if possible. Permission to cancel everything.',
      pain_flare: 'Pain or chronic condition flare. Energy and mobility are severely limited. Break tasks into micro-steps with rest between. Nothing standing if sitting works. Nothing in-person if phone/text works. Heating pad, medication timing, and positioning matter more than productivity.',
      travel: 'Travel day. Different location, different resources, possible time zone shift. Keep medication timing absolute. Simplify meals (eating out or simple food is fine). Build in buffer time for everything. Routine anchors matter more than routine content.',
      visitors: 'House guests / visitors. Your space is shared. Noise, social energy drain, schedule disruptions. Protect one quiet time block. Lower hosting standards. Its okay to disappear for 30 minutes. Meals dont need to be perfect.',
      kid_home: 'Kid(s) home unexpectedly. Productivity drops 70-90%. Accept this immediately. Survival mode for work. Screen time for kids is FINE today. Rotate between focused 15-min blocks and kid attention. Lower all standards.',
      partner_away: 'Partner away. Solo parenting or solo household. Double the tasks, same energy. Simplify meals radically. Bedtime routines can be shorter. Its okay to let things slide. Batch errands.',
      wfh_change: 'Working from home when usually in office. Missing structure, commute-as-transition, social cues. Create artificial transitions (walk around the block = commute). Set harder stop time. Wear real clothes if that helps. Avoid fridge-grazing.',
      office_change: 'In office when usually WFH. Sensory overload, commute fatigue, social drain. Pack everything the night before. Plan decompression time after. Lunch alone is valid. Noise-canceling headphones if available.',
      power_outage: 'Power outage or no internet. Most digital routines are impossible. Switch to analog: paper lists, books, face-to-face. Preserve phone battery. Check food safety. This is temporary — dont try to recreate your normal day without power.',
      holiday: 'Holiday or day off. The absence of structure IS the disruption for routine-dependent people. Keep 2-3 anchor points (wake time, one meal, bedtime). The rest can float. Having no plan is fine IF you have anchor points.',
      schedule_change: 'External schedule change. Something moved and the dominoes are falling. Identify what ACTUALLY changed vs what FEELS changed. Often only 1-2 things shifted but it destabilized everything. Rebuild around the fixed points.',
      emergency: 'Emergency or crisis. Triage mode. Only three questions matter: Is everyone safe? What needs to happen in the next 2 hours? Who can help? Everything else is suspended, not dropped — it will be there when this passes.',
      other: 'Custom disruption. Apply general principles: identify what actually changed, protect non-negotiables, simplify everything else, give explicit permission to drop optional tasks.',
    };

    const ENERGY_CALIBRATION = {
      survival: 'SURVIVAL MODE. Only absolute non-negotiables: medication, hydration, feeding dependents, staying safe. Everything else is explicitly dropped. No guilt. This is temporary. Meals can be crackers. Hygiene can be a face wipe. Work can be "out sick."',
      low: 'LOW ENERGY. Essentials only, simplified. Meals are simple (toast, cereal, takeout). Hygiene is abbreviated. Work is minimum viable. Social obligations cancelled. One small anchor activity to prevent total collapse.',
      moderate: 'MODERATE ENERGY. Modified but functional. Most tasks happen in simplified form. Some optional things can stay if they bring comfort. Reduce duration and intensity of everything by ~50%.',
      near_normal: 'NEAR NORMAL. Most things can happen with minor adjustments. Focus on what specifically cant work today and adapt just those elements. Keep most structure intact.',
    };

    const disruptionGuide = DISRUPTION_GUIDANCE[disruption] || DISRUPTION_GUIDANCE.other;
    const energyGuide = ENERGY_CALIBRATION[energy] || ENERGY_CALIBRATION.low;
    const disruptionLabel = disruption === 'other' ? (customDisruption || 'Unknown disruption') : disruption.replace(/_/g, ' ');

    const systemPrompt = `You are a routine adaptation specialist. When someone's routine breaks, you build them a temporary replacement that is realistic, compassionate, and structured.

YOUR PHILOSOPHY:
- A broken routine is genuinely distressing for routine-dependent people (ADHD, autism, anxiety, OCD, chronic illness). This is not dramatic — it is real.
- The goal is NOT to maintain the old routine. It is to create a NEW temporary structure that accounts for today's reality.
- Every adapted routine needs ANCHOR POINTS — fixed moments that give the day shape. Even in survival mode, "wake up, drink water, take meds" is a routine.
- Permission to drop things is ESSENTIAL. Say it explicitly: "You do not need to do X today."
- Self-care anchors (water, food, medication, one comfort thing) are non-negotiable in every tier.
- "What to tell people" scripts remove the burden of explaining yourself while dysregulated.
- The re-entry plan prevents the "day 1 back = 100% immediately" trap.

DISRUPTION:
${disruptionLabel}
${disruptionGuide}

ENERGY LEVEL:
${energyGuide}

DURATION: ${duration || 'today only'}
${normalRoutine ? `NORMAL ROUTINE:\n${normalRoutine}` : 'No normal routine provided — create a general adapted day structure.'}
${criticalTasks ? `NON-NEGOTIABLES (must happen): ${criticalTasks}` : ''}
${constraints ? `CONSTRAINTS: ${constraints}` : ''}

RULES:
- Adapted schedule should have 4-6 time blocks, not a minute-by-minute plan.
- Each task in the schedule must be tagged: "keep" (unchanged), "simplified" (easier version), or "skip" (explicitly dropped).
- Self-care anchors are concrete and specific, not vague ("drink a glass of water" not "stay hydrated").
- "What to tell people" scripts should be copy-pasteable: one for boss/work, one for family/friends, one for anyone else. Short, honest, no over-explaining.
- Permissions should be specific to THIS disruption, not generic motivational quotes.
- Re-entry plan should have 2-3 graduated phases, not "just go back to normal."
- Watch-for signs should be specific and actionable.`;

    const userPrompt = `Build an adapted routine for today. Return ONLY valid JSON:
{
  "acknowledgment": "One warm sentence acknowledging the disruption. Not generic — specific to what happened and their energy level.",

  "self_care_anchors": [
    {"emoji": "💊", "task": "Take medication at usual time"},
    {"emoji": "🥤", "task": "Drink a full glass of water right now"},
    {"emoji": "🍞", "task": "Eat something, anything — crackers count"}
  ],

  "adapted_schedule": [
    {
      "time": "Morning / When you wake up",
      "label": "Gentle start",
      "energy": "none|low|moderate",
      "tasks": [
        {"text": "The task", "type": "keep|simplified|skip", "note": "Optional note explaining the change"}
      ]
    }
  ],

  "summary": {
    "keep": ["Tasks staying as-is"],
    "simplify": ["Tasks in easier form — describe the simpler version"],
    "drop": ["Tasks explicitly dropped today"]
  },

  "what_to_tell_people": [
    {"who": "Boss / work", "say": "Copy-pasteable message. Short, professional, no over-explaining."},
    {"who": "Family / friends", "say": "Casual, honest message."},
    {"who": "Anyone asking", "say": "Brief default response."}
  ],

  "permissions": [
    "Specific permission statements for THIS disruption. e.g., 'You do not need to cook today. Cereal is dinner.'",
    "Not generic motivation. Concrete permissions to drop specific things."
  ],

  "watch_for": [
    "Specific warning signs that this adapted mode needs to escalate. e.g., 'If you skip medication two days in a row, text someone.'"
  ],

  "reentry": {
    "signs_ready": ["Specific indicators you can start returning to normal"],
    "phases": [
      {"name": "Phase 1: Minimum viable", "description": "Add back just the critical work tasks. Keep everything else simplified."},
      {"name": "Phase 2: Building up", "description": "Add back exercise and social commitments. Meals can get more complex."},
      {"name": "Phase 3: Full routine", "description": "Resume normal. If anything still feels hard, keep the simplified version longer."}
    ],
    "warning": "Do not go from adapted to 100% in one day. That causes a crash. Phase back in over 2-3 days minimum."
  },

  "closing": "One warm sentence. Not 'you got this' — something specific and genuinely reassuring about their situation."
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 3500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('Routine Rupture Manager error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate adapted routine' });
  }
});

module.exports = router;
