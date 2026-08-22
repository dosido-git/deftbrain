const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { TOOL_CATALOG } = require('../lib/toolCatalog');


function catalogToString() {
  return TOOL_CATALOG.map(t => {
    // Use both tagline (marketing hook) and description (functional detail)
    // when they differ — a narrow tool's scope (e.g. "bicycle") often only
    // appears in one of the two, and giving the model just one halves its
    // chance of grounding a recommendation in what the tool actually covers.
    const blurb = [t.tagline, t.description].filter(Boolean)
      .filter((s, i, arr) => arr.indexOf(s) === i)
      .join(' — ') || 'No description';
    return `${t.icon || '🔧'} ${t.title} (/${t.id}) [${t.category || 'Uncategorized'}]: ${blurb}`;
  }).join('\n');
}

// ════════════════════════════════════════════════════════════
// POST /tool-finder — Recommend tools for a problem
// ════════════════════════════════════════════════════════════
router.post('/tool-finder', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { problem, userLanguage } = req.body;

    if (!problem?.trim()) {
      return res.status(400).json({ error: 'Describe your problem or situation and I\'ll find the right tools.' });
    }

    const catalog = catalogToString();

    const systemPrompt = `You are the guide for DeftBrain, a suite of ${TOOL_CATALOG.length}+ AI-powered tools. A user will describe a problem, situation, or need in plain language. Your job: recommend the best DeftBrain tools for their situation.

HERE IS THE COMPLETE TOOL CATALOG:
${catalog}

YOUR APPROACH:
1. Understand what the user actually needs — read between the lines.
2. Recommend 1-5 tools, ranked by relevance. Most problems need 1-3 tools.
3. For each recommendation, explain WHY this tool fits their specific situation — don't just repeat the description.
4. Only if two or more genuinely distinct tasks have to happen in a particular order, say what that order is — as a sequence a person would follow, never as a "workflow", and never as a way to justify having listed several tools.
6. Never characterise what a tool will tell them about the law, their rights, or their legal position. Say what it helps them work out; let the tool set its own bounds.
5. Be honest: if NO tool actually addresses the user's problem (a true category gap — e.g. they need appliance repair and there's no appliance tool in the catalog), do NOT force a wrong-domain tool into "recommendations" just to have something to show. Leave "recommendations" empty and explain the gap in "no_perfect_fit" instead — name the closest tool there, in prose, only as a last-resort mention, never presented as "your best tool." Reserve "recommendations" for tools that genuinely help, even partially (e.g. a decision-paralysis tool for the stress of a broken appliance is a real, if partial, fit and belongs in "recommendations" normally).
6. Never recommend more than 5 tools — quality over quantity.
7. Match the user's energy. If they're stressed, be calm and direct. If they're curious, be enthusiastic.
8. NEVER generalize a tool's scope beyond what its catalog entry actually says. A tool named/described around one specific thing (e.g. bicycles) covers ONLY that thing, even for a vague problem — do not claim it also handles adjacent categories (appliances, cars, general objects) that aren't in its entry. If the vague problem could mean many different physical things, prefer a genuinely general tool over stretching a narrow one.

IMPORTANT:
- The tool IDs are case-sensitive and used as URL paths. Always return the exact ID from the catalog.
- Some problems genuinely benefit from multiple tools used in sequence. Flag these as a "workflow."
- If the problem is vague, still give your best recommendations but note what clarification would help.
- Never place a double-quote (") character inside any JSON string value — quoted tool names and phrases must be written plainly or with single quotes, or it breaks the JSON.`;

    const userPrompt = `My problem: ${problem}

THE FEWEST TOOLS THAT GIVE THEM A CLEAR NEXT STEP. Somebody came here because they could not choose. Do not solve that by handing them another choice. One confident starting point beats three plausible matches, and a second tool earns its place only by addressing a DIFFERENT dimension of the problem — not a different angle on the same one. If a tool already covers tone, a second tool about tone is not a second recommendation.
- The "even though" test: if you find yourself writing "even though this is really for X..." or "while this tool is designed for Y...", that recommendation is strained. Drop it.
- Anything beyond the first is CONDITIONAL and says so: "if you also want to...", "if it turns out you need...". They have not asked for it yet.
- One recommendation is a complete, good answer. Two is common. Three is rare. Never pad to a number.

UNDERSTAND, DO NOT DIAGNOSE. "understanding" shows you read what they wrote. It is not an opportunity to find the deeper dynamic underneath it. Restate only what they said or what follows directly from it, then stop - two sentences at most. The visitor supplies the situation; you supply the direction.
- Never infer temperament, motive, emotion or mechanism. A metaphor is not a diagnosis: somebody who says they feel paralysed has told you they cannot start, not that something in their brain freezes.
- Never announce which part is the hard part, and never rule a cause OUT. "Not because you don't know what to do" is a claim about them - and if your own clarification then asks whether they get stuck choosing where to begin, you have contradicted yourself inside one answer.
- Never judge whether their time, money or resources are enough. You do not know how big the project is, so "a week is enough time, but only if you get unstuck today" is invented and urgent at once.
  NO:  You are caught between two real needs... The hard part is not the conversation itself, it is doing both at once.
  YES: You need to get a serious problem addressed while keeping a workable relationship with your landlord.
  NO:  You are stuck before you even start - not because you don't know what to do, but because something in your brain freezes when you try to begin. A week is enough time, but only if you can get unstuck today.
  YES: You have a large project, a deadline coming up, and the hardest part right now is getting started.

GUIDANCE, NOT SEARCH RESULTS. This is the front door for somebody who does not know what they need, and what they need back is a person pointing, not a ranked list. Never mention matching, scores, percentages, relevance or how you decided — that is software talking to itself. Write it the way you would tell a friend which one to open first and what to say when they get there.

Return ONLY valid JSON:
{
  "understanding": "1-2 sentences showing you understand their actual problem — not just restating it, but reading between the lines.",
  "recommendations": [
    {
      "id": "ExactToolId",
      "title": "Tool Title",
      "icon": "emoji",
      "category": "Category",
      "why": "1-2 sentences on what this tool would DO for their situation. Describe what it changes about the TASK, not what it changes about them. Never guarantee an outcome or a mental state - no your brain stops seeing it, no resistance collapses, no it removes the decision paralysis, no so you stay calm, no exactly what to say. Where an effect is possible rather than certain, say it CAN or MAY help. Never invent how another person will react.",
      "what_to_do": "One sentence, second person: what to tell it when they open it, built from their own details. Where their situation has unknowns, end by asking for what THEY are concerned about rather than inventing what someone else might do."
    }
  ],
  "order_note": "NULL whenever there is only ONE recommendation - one tool has no order - and null unless every tool you name here is also in recommendations above. Never introduce a tool in the order that they cannot see or click. Otherwise: only when there are two or more genuinely DISTINCT tasks that have to happen in a particular order — and then the order must be the logical one, not the order you listed them. Understanding your position comes before planning what to say; rehearsing comes after. Never manufacture a sequence because several tools matched. Never the word workflow.",
  "no_perfect_fit": "If it's a true category gap (no tool in the catalog addresses this domain at all), explain what's missing here and mention the closest tool by name in this prose, as a last resort — do NOT also put that tool in 'recommendations'. Otherwise null.",
  "clarification": "ONE thing you would want to know, read AFTER the recommendation and only when a single missing fact could genuinely change it. Never block on it - if what they wrote already supports a useful starting point, recommend first and ask second. Phrase the options as observable situations (what happens when they sit down, what they find themselves doing), never as internal states to choose between (mind goes blank / anxiety kicks in). Otherwise null."
}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.FAST,
      max_tokens: 2000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'tool-finder' });

    if (!parsed.recommendations) {
      return res.status(500).json({ error: 'Could not find matching tools. Please try again.' });
    }

    // Validate that recommended IDs actually exist, and never let Tool Finder
    // recommend itself (excluded from the catalog above, but a defensive
    // second check here since this is the single worst possible result).
    parsed.recommendations = parsed.recommendations.filter(rec => {
      if (rec.id === 'ToolFinder') return false;
      const exists = TOOL_CATALOG.some(t => t.id === rec.id);
      if (!exists) console.warn(`ToolFinder: AI recommended non-existent tool "${rec.id}"`);
      return exists;
    });

    // An order that names a tool the visitor cannot see or click is a dead end,
    // and one recommendation has no order at all.
    if (parsed.order_note) {
      const shown = parsed.recommendations.map(r => (r.title || '').toLowerCase()).filter(Boolean);
      const note = String(parsed.order_note).toLowerCase();
      const namesUnshown = TOOL_CATALOG.some(t => {
        const title = (t.title || '').toLowerCase();
        return title && note.includes(title) && !shown.includes(title);
      });
      if (parsed.recommendations.length < 2 || namesUnshown) parsed.order_note = null;
    }

    return res.json(parsed);

  } catch (error) {
    console.error('ToolFinder error:', error);
    res.status(500).json({ error: error.message || 'Failed to find tools' });
  }
});

module.exports = router;
