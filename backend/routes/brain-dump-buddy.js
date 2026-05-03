const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');
const { rateLimit } = require('../lib/rateLimiter');
// Rate limiting handled globally in server.js

// ═══════════════════════════════════════════════════
// BRAIN DUMP STRUCTURER — v3 (7 routes)
// v1: single structure call
// v2: +start-with-me, +review, +carry-forward
// v3: +shrink, +time-map, +excavate, +dump-diff,
//     +emergency mode on structure
// ═══════════════════════════════════════════════════

const CONTEXT_GUIDANCE = {
  work_overwhelm: 'This person is overwhelmed by work. Prioritize ruthlessly. Identify what can wait until next week, what can be delegated, and what actually needs them specifically. Many "urgent" work items are less urgent than they feel.',
  life_chaos: 'Life is chaotic — multiple domains colliding. Separate work from personal from household. Identify which category is actually on fire vs. which just feels loud.',
  big_decision: 'They have a big decision weighing on them. Separate the decision from the noise around it. Identify what information they actually need to decide, vs. what is anxiety-generated rumination.',
  anxiety_spiral: 'This person may be in an anxiety spiral. Be extra gentle. Many of these thoughts are worry-loops, not tasks. Aggressively separate feelings from actions. The "feelings to acknowledge" category is especially important here. The goal is to show them how few ACTUAL tasks there are vs. how many thoughts are anxiety noise.',
  new_situation: 'New situation — lots of unknowns generating lots of thoughts. Focus on what they can control now vs. what will become clear later. Many thoughts are premature planning.',
  '3am_thoughts': 'These are 3am racing thoughts. Most of these will feel less urgent in daylight. Be honest about that while still respecting the thoughts. Capture the real tasks, but flag that 3am urgency is rarely real urgency.',
  planning: 'They are planning something specific. Focus on sequencing, dependencies, and breaking the plan into phases. Many planning thoughts are actually the same task described differently.',
  transition: 'Life transition (new job, move, breakup, baby, retirement). Separate logistics from emotions. Both are valid, but they need different responses.',
  creative: 'Creative brainstorm. Don\'t over-structure. Capture ideas without killing them. Group related ideas. Identify which ones have energy and which are filler.',
  grief_logistics: 'They are dealing with loss and its logistics. Be extremely gentle. Separate practical tasks from grief processing. Many items may need delegation. Acknowledge that doing logistics while grieving is profoundly hard.',
};

router.post('/brain-dump-buddy', rateLimit(), async (req, res) => {
  const { action } = req.body;

  try {
    switch (action || 'structure') {

      // ────────────────────────────────────────────
      // STRUCTURE — Main sort (+ emergency mode)
      // ────────────────────────────────────────────
      case 'structure': {
        const { rawThoughts, context, carryForward, emergencyMode, userLanguage } = req.body;

        if (!rawThoughts || rawThoughts.trim().length < 5) {
          return res.status(400).json({ error: 'Dump more thoughts. Even a few words helps.' });
        }

        const contextGuide = CONTEXT_GUIDANCE[context] || '';

        const carryForwardSection = carryForward?.length > 0
          ? `\n\nCARRY-FORWARD from previous dump (unchecked items still pending):\n${carryForward.map(item => `- ${item}`).join('\n')}\nIncorporate these into your sorting. They're existing tasks that haven't been done yet — don't duplicate them, but do re-prioritize them alongside the new thoughts.`
          : '';

        // ── EMERGENCY MODE ──
        if (emergencyMode) {
          const emergencyPrompt = withLanguage(`You are a calm, steady presence for someone who is barely functioning right now. They dumped their thoughts but they can't handle a long organized list. They need the absolute minimum.

${contextGuide ? `CONTEXT: ${contextGuide}\n` : ''}
RAW BRAIN DUMP:
"""
${rawThoughts.substring(0, 5000)}
"""
${carryForwardSection}

Give them EXACTLY 3 things. No more. No categories. No overwhelm meter. Just three clear lines.

Return ONLY valid JSON:
{
  "mode": "emergency",
  "breathe": "One very short calming sentence. Gentle.",
  "one_task": {
    "task": "THE single easiest, smallest, most concrete thing they can do right now. Not the most important — the most doable.",
    "time_estimate": "Very short estimate",
    "why": "One sentence: why this one."
  },
  "one_release": {
    "thought": "The one worry or item they should let go of RIGHT NOW.",
    "permission": "One sentence giving explicit permission to drop it."
  },
  "one_truth": "One honest, warm sentence about their situation. Not a platitude — something specific to what they dumped."
}`, userLanguage);

          const parsed = await callClaudeWithRetry(emergencyPrompt, {
            label: 'BDS-Emergency',
            max_tokens: 500,
          });
          return res.json(parsed);
        }

        // ── STANDARD MODE ──
        const prompt = withLanguage(`You are a brain organizer — part therapist, part project manager, part wise friend. Someone is dumping the contents of their overwhelmed brain on you. Your job is to sort the chaos into clarity.

YOUR PHILOSOPHY:
- The #1 output is the ONE NEXT STEP. Not a prioritized list. One single thing to do first. Everything else is secondary.
- Feelings are NOT tasks. "I'm worried about the presentation" is a feeling. "Practice the presentation once" is a task. Separate them.
- Most people in overwhelm have fewer actual tasks than they think. Half their "to-do list" is anxiety, feelings, other people's problems, and things that don't actually need doing. Show them this.
- Permission to drop things is a feature, not a failure. Aggressively identify what doesn't matter.
- Dependencies matter. "Book flights" can't happen until "pick vacation dates." Surface these.
- Delegate ruthlessly. Many items don't require this specific person.
- Worries get acknowledged, not dismissed. "This isn't a task" doesn't mean "this doesn't matter."
- The overwhelm meter is therapeutic: "You dumped 47 thoughts. After sorting: 8 actual tasks, 3 decisions, and 36 things that are either feelings, not your problem, or things you can drop."

${contextGuide ? `CONTEXT-SPECIFIC GUIDANCE:\n${contextGuide}\n` : ''}
TONE: Warm, calm, slightly playful. Like a friend who is good at organizing and doesn't judge you for having 47 things swirling in your head. Never clinical. Never preachy.

CATEGORIZATION RULES:
- "actions": Real tasks this person specifically needs to do. Concrete and startable.
- "decisions": Things requiring a choice, not an action.
- "tell_someone": Things to communicate to a specific person. Always identify WHO.
- "worries": Things they're anxious about that are NOT actionable right now. Include a gentle reframe.
- "ideas": Creative sparks, future plans, worth capturing but not acting on now.
- "can_drop": Things that genuinely don't need doing. Give a brief reason.
- "not_your_problem": Things to delegate or that are someone else's responsibility.
- "feelings": Emotional content needing acknowledgment, not action.
- "dependencies": Pairs where one must happen before the other.

IMPORTANT: Not every category needs items. But look hard — there's almost always something to drop.

RAW BRAIN DUMP:
"""
${rawThoughts.substring(0, 5000)}
"""
${carryForwardSection}

Parse EVERY thought, feeling, worry, and task. Nothing should be lost.

Return ONLY valid JSON:
{
  "breathe": "One calming sentence acknowledging what they just did.",
  "overwhelm_meter": {
    "summary": "Your brain held [X] distinct thoughts. After sorting: [Y] actual tasks, [Z] decisions, and [W] feelings/worries/noise.",
    "counts": { "actual_tasks": 0, "decisions": 0, "not_actionable": 0, "can_drop": 0 },
    "relief": "Specific sentence about the ratio."
  },
  "do_first": {
    "task": "THE one specific, concrete, startable next step.",
    "why_this_first": "Why this first.",
    "time_estimate": "How long"
  },
  "actions": [{ "task": "Specific, concrete, startable", "deadline": "Today / This week / When you can / null", "time_estimate": "5 min / 30 min / 1-2 hours" }],
  "decisions": [{ "decision": "The choice to make", "what_you_need": "Info needed to decide", "deadline": "When to decide by" }],
  "tell_someone": [{ "who": "Person/role", "what": "What to communicate", "how": "Text / call / email" }],
  "worries": [{ "thought": "The worry", "reframe": "Gentle, honest reframe." }],
  "ideas": ["Ideas worth capturing."],
  "not_your_problem": [{ "task": "Not theirs", "delegate_to": "Who should handle this", "why_not_yours": "Brief reason" }],
  "feelings": [{ "feeling": "The emotion", "validation": "Acknowledgment without fixing." }],
  "can_drop": [{ "task": "Can be dropped", "reason": "Why it's okay." }],
  "dependencies": [{ "first": "This first", "then": "Before this" }],
  "closing": "One warm, specific sentence."
}`, userLanguage);

        const parsed = await callClaudeWithRetry(prompt, { label: 'BDS-Structure', max_tokens: 4000 });
        return res.json(parsed);
      }

      // ────────────────────────────────────────────
      // EXCAVATE — Go deeper on a worry (v3)
      // ────────────────────────────────────────────
      case 'excavate': {
        const { worry, context, userLanguage } = req.body;
        if (!worry?.trim()) return res.status(400).json({ error: 'Which worry?' });

        const prompt = withLanguage(`You are a gentle but honest friend helping someone dig into a specific worry. They brain-dumped, and this worry was categorized as "not a task." Your job: excavate it — find if there's a hidden task buried inside, or if it truly is just anxiety needing acknowledgment.

THE WORRY: "${worry.trim()}"
CONTEXT: ${context || 'general overwhelm'}

Walk through mentally (weave into analysis, don't list as questions):
1. What specifically are they afraid will happen?
2. How likely is that, honestly?
3. If it DID happen, what would they actually do?
4. Is there one small thing they could do right now to reduce this worry by 10%?

Sometimes a worry IS just a worry — validate it. But sometimes "I'm worried about the presentation" means "I haven't practiced the opening" — which IS a task.

Return ONLY valid JSON:
{
  "worry": "Original worry",
  "whats_underneath": "What it's really about.",
  "likelihood": { "assessment": "very unlikely / somewhat possible / legitimate concern", "reality_check": "One grounding sentence." },
  "if_it_happened": "What they'd actually do. Calming because it shows they'd handle it.",
  "hidden_task": { "found": true, "task": "Hidden task or null", "time_estimate": "How long or null", "relief_potential": "How much relief" },
  "if_just_a_worry": "If no hidden task, genuine validation.",
  "one_thing": "Single most helpful thing to do about this worry right now."
}`, userLanguage);

        const parsed = await callClaudeWithRetry(prompt, { label: 'BDS-Excavate', max_tokens: 800 });
        return res.json(parsed);
      }

      // ────────────────────────────────────────────
      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

  } catch (err) {
    console.error('BrainDumpStructurer error:', err);
    res.status(500).json({ error: err.message || 'Failed to structure thoughts.' });
  }
});

module.exports = router;
