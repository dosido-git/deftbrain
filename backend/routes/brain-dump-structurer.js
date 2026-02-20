const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

router.post('/brain-dump-structurer', async (req, res) => {
  try {
    const { rawThoughts, context, thoughtCount, userLanguage } = req.body;

    if (!rawThoughts || rawThoughts.trim().length < 5) {
      return res.status(400).json({ error: 'Dump more thoughts. Even a few words helps.' });
    }

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

    const contextGuide = CONTEXT_GUIDANCE[context] || '';

    const systemPrompt = `You are a brain organizer — part therapist, part project manager, part wise friend. Someone is dumping the contents of their overwhelmed brain on you. Your job is to sort the chaos into clarity.

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
- "actions": Real tasks that this person specifically needs to do. Each one should be concrete and startable. Not vague ("deal with finances") — specific ("check bank balance and pay the electric bill").
- "decisions": Things that require a choice, not an action. "Should I take the job?" is a decision. "Accept the job offer" is an action that comes AFTER the decision.
- "tell_someone": Things that need to be communicated to a specific person. Always identify WHO.
- "worries": Things they're anxious about that are NOT actionable right now. Include a gentle reframe for each one.
- "ideas": Creative sparks, future plans, things worth capturing but not acting on now.
- "can_drop": Things that genuinely don't need doing, aren't urgent, or will resolve themselves. Give a brief reason for each — this permission needs justification.
- "not_your_problem": Things that should be delegated or are someone else's responsibility. Identify who.
- "feelings": Emotional content that needs acknowledgment, not action. Validate each one.
- "dependencies": Pairs of items where one must happen before the other.

IMPORTANT: Not every category needs items. If nothing qualifies for "can_drop," don't force it. But look hard — there's almost always something.`;

    const userPrompt = `RAW BRAIN DUMP:
"""
${rawThoughts.substring(0, 5000)}
"""

Parse every thought, feeling, worry, and task in this dump. Return ONLY valid JSON:
{
  "breathe": "One calming sentence acknowledging what they just did. 'You got it all out. Now let's sort it.' Not generic — reference the volume or intensity of what they dumped.",

  "overwhelm_meter": {
    "summary": "Your brain held [X] distinct thoughts. After sorting: [Y] are actual tasks, [Z] are decisions, and [W] are feelings, worries, or things that aren't your problem. That's [much/significantly] less than it felt.",
    "counts": {
      "actual_tasks": 0,
      "decisions": 0,
      "not_actionable": 0,
      "can_drop": 0
    },
    "relief": "A specific sentence about the ratio. e.g., 'More than half of what felt urgent is actually just noise. You have 6 real things to do, not 30.'"
  },

  "do_first": {
    "task": "THE one specific, concrete, startable next step. Not the most important task — the best FIRST task. Often the smallest one, or the one that unblocks others.",
    "why_this_first": "Why this specific thing first. e.g., 'This takes 2 minutes, clears mental space, and unblocks 3 other items.'",
    "time_estimate": "How long: '2 minutes' or '30 minutes' or '1 phone call'"
  },

  "actions": [
    {
      "task": "Specific, concrete, startable action. Not vague.",
      "deadline": "Today / This week / When you can / null",
      "time_estimate": "Quick estimate: '5 min' / '30 min' / '1-2 hours'"
    }
  ],

  "decisions": [
    {
      "decision": "The decision that needs to be made.",
      "what_you_need": "What information or clarity would help you decide.",
      "deadline": "When this needs to be decided by, if applicable."
    }
  ],

  "tell_someone": [
    {
      "who": "Specific person or role",
      "what": "What to communicate",
      "how": "Text / call / email / in person — whichever is easiest"
    }
  ],

  "worries": [
    {
      "thought": "The worry as they expressed it.",
      "reframe": "A gentle, honest reframe. Not dismissive ('don't worry about it') — realistic ('This is a valid concern. Here's what you can actually control about it: [specific]. The rest isn't yours to carry right now.')."
    }
  ],

  "ideas": ["Ideas worth capturing. Brief, as-is."],

  "not_your_problem": [
    {
      "task": "The thing they're carrying that isn't theirs.",
      "delegate_to": "Who should actually handle this.",
      "why_not_yours": "Brief reason this isn't their responsibility."
    }
  ],

  "feelings": [
    {
      "feeling": "The emotion expressed or implied.",
      "validation": "Acknowledgment without trying to fix it. 'Of course you feel that way. You're dealing with a lot and feelings aren't tasks to solve.'"
    }
  ],

  "can_drop": [
    {
      "task": "The thing that can be dropped.",
      "reason": "Why it's okay to let this go. Be specific."
    }
  ],

  "dependencies": [
    {
      "first": "This needs to happen first",
      "then": "Before this can happen"
    }
  ],

  "closing": "One warm, specific sentence. Not 'you got this' generic — tied to their actual situation. Acknowledge the courage of dumping it all out and the relief of seeing it organized."
}

Be thorough. Parse EVERY thought in the dump — nothing should be lost. If something doesn't fit neatly into one category, put it in the closest one. If a thought contains both a feeling and a task, split it: the feeling goes to feelings, the task goes to actions.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(text);
    const parsed = JSON.parse(cleaned);
    res.json(parsed);

  } catch (error) {
    console.error('Brain Dump Structurer error:', error);
    res.status(500).json({ error: error.message || 'Failed to structure thoughts' });
  }
});

module.exports = router;
