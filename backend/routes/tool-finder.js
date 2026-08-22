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
    const { problem, refinement, rejected, userLanguage } = req.body;

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
3b. Describe only what the catalog entry says the tool does. Do not round a capability up to make the match sound better, and do not imply authority the tool does not claim — a tool that translates a document into plain language helps them SEE what to question; it does not rule on whether a charge is wrong.
4. Never characterise what a tool will tell them about the law, their rights, or their legal position. Say what it helps them work out; let the tool set its own bounds.
5. Be honest: if NO tool actually addresses the user's problem (a true category gap — e.g. they need appliance repair and there's no appliance tool in the catalog), do NOT force a wrong-domain tool into "recommendations" just to have something to show. Leave "recommendations" empty and explain the gap in "no_perfect_fit" instead — name the closest tool there, in prose, only as a last-resort mention, never presented as "your best tool." Reserve "recommendations" for tools that genuinely help, even partially (e.g. a decision-paralysis tool for the stress of a broken appliance is a real, if partial, fit and belongs in "recommendations" normally).
6. Never recommend more than 5 tools — quality over quantity.
7. Match the user's energy. If they're stressed, be calm and direct. If they're curious, be enthusiastic.
8. NEVER generalize a tool's scope beyond what its catalog entry actually says. A tool named/described around one specific thing (e.g. bicycles) covers ONLY that thing, even for a vague problem — do not claim it also handles adjacent categories (appliances, cars, general objects) that aren't in its entry. If the vague problem could mean many different physical things, prefer a genuinely general tool over stretching a narrow one.

IMPORTANT:
- The tool IDs are case-sensitive and used as URL paths. Always return the exact ID from the catalog.
- Some problems genuinely benefit from multiple tools used in sequence. Flag these as a "workflow."
- If the problem is vague, still give your best recommendation. Do not ask a clarifying question — the page already offers them a way to correct you in their own words, which is better than a question you had to guess at.
- Never place a double-quote (") character inside any JSON string value — quoted tool names and phrases must be written plainly or with single quotes, or it breaks the JSON.`;

    const rejectedTitles = (Array.isArray(rejected) ? rejected : [])
      .map(id => (TOOL_CATALOG.find(t => t.id === id) || {}).title)
      .filter(Boolean);

    const userPrompt = `My problem: ${problem}${refinement ? `

THEY CAME BACK. You already answered this once${rejectedTitles.length ? ` and offered: ${rejectedTitles.join(', ')}` : ''}, and they said it was not what they meant. Their correction, which is the more important half of what you now know:
"${String(refinement).slice(0, 400)}"

Read the two together — the correction narrows the original, it does not replace it. Do not offer ${rejectedTitles.length ? 'those tools' : 'the same tools'} again unless the correction makes one of them clearly right, and if so say what changed. Getting it wrong the first time is not something to apologise for; just answer the narrower question.` : ''}

RESTRAINT, IN ORDER OF PRECEDENCE:
1. EXACTLY ONE by default. A second only when their own description contains a second, distinct need the first tool does not address. Never a second merely because it might also be useful — that is the trap, and hundreds of tools in this catalog are "also useful" for any given problem. You are not here to find every tool that helps; you are here to take the burden of choosing off them. NEVER three.
2. Their words over your interpretation.
3. "can help" over a promised outcome.
4. "if you also..." over "you need to".
5. The visitor correcting you over you interrogating them.
6. The primary recommendation IS where to start. Never imply anything should happen before it.

THE FEWEST TOOLS THAT GIVE THEM A CLEAR NEXT STEP. Somebody came here because they could not choose. Do not solve that by handing them another choice. One confident starting point beats three plausible matches, and a second tool earns its place only by addressing a DIFFERENT dimension of the problem — not a different angle on the same one. If a tool already covers tone, a second tool about tone is not a second recommendation.
- The "even though" test: if you find yourself writing "even though this is really for X..." or "while this tool is designed for Y...", that recommendation is strained. Drop it.
- The second is CONDITIONAL and says so: "if you also want to...", "if you are unsure whether...". It must not read as a step they have to take first — the primary is where they start.
- The second must answer a need ALREADY VISIBLE in what they wrote, not one you can imagine arriving later.
  TEST: name the second need by quoting the clause of their message that contains it. No clause, no second tool.
  NO:  if your landlord responds with documents or inspection reports  (nobody has sent anything; you made that up)
  YES: if you are unsure what you can reasonably ask for, given they have ignored it for months  (their words: ignoring, months)
  NO:  "I can't get started on this project" -> also recommend a tool for working out which parts of the project matter most. They said one thing. Recommend one tool. If that is wrong they can tell you, and the page gives them a box to tell you in — which is what makes a single confident answer safe.
- One recommendation is a complete, good answer. Two is the maximum. Never pad to a number.

UNDERSTAND, DO NOT DIAGNOSE. "understanding" shows you read what they wrote. It is not an opportunity to find the deeper dynamic underneath it. Restate only what they said or what follows directly from it, then stop - two sentences at most. The visitor supplies the situation; you supply the direction.
- Prefer their words to a paraphrase of their words. They wrote "the total seems way too high"; do not render it as "the total feels wrong".
- NEVER RULE A CAUSE OUT. You may say what they told you is happening. You may not say what is NOT causing it — they did not eliminate anything, and an elimination is a diagnosis wearing a summary's clothes.
  NO:  the obstacle right now isn't unclear requirements or missing skills - it's that you freeze when you try to begin
  YES: You have a substantial project due soon, and right now you're having trouble getting started.
  Boring is correct here. The intelligence belongs in the recommendation, not in an elaborate restatement of the problem.
- SUMMARISE, DO NOT INTERPRET, and do not escalate. Two clauses is usually enough: what they need to happen, and what they want to avoid. Their register is the ceiling — if they were measured, you are measured.
  NO:  you're worried that coming in too hard will poison the relationship
  NO:  you need the mold fixed - that's non-negotiable - but you also need to approach this in a way that doesn't tank the relationship
  YES: You need to get a serious maintenance problem addressed without unnecessarily damaging your relationship with your landlord.
  "Damage" was their word. "Poison", "tank" and "non-negotiable" are yours.
- Never infer temperament, motive, emotion or mechanism. A metaphor is not a diagnosis: somebody who says they feel paralysed has told you they cannot start, not that something in their brain freezes.
- Never announce which part is the hard part, and never rule a cause OUT. "Not because you don't know what to do" is a claim about them, and one you have no way to make.
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
      "why": "ONE or TWO sentences. Not three. Describe what this tool helps them DO, not what it will achieve — and never what it will do to the other person, whose reactions you cannot predict and must not narrate.
        NO:  how to frame it so your landlord hears the seriousness without defensiveness ... keeps them cooperative rather than hostile ... gives you a script that preserves the relationship
        NO:  it turns the talk from something you're dreading into something you've already practised, which shifts the dynamic from uncertain to grounded
        NO:  micro-tasks specifically designed to bypass the paralysis that happens before you start ... it removes the decision-making burden
        YES: turns a large project into very small, concrete tasks - including something you can do in a few minutes - so you can focus on one manageable next step instead of the whole project at once
        SHAPE, because banning phrases only moves the problem: ONE sentence saying what the tool does, plus AT MOST one clause tying that to what THEY wrote. Nothing after that. In particular no sentence that starts explaining how people or paralysis or conversations work in general, and no sentence about the state they will be in afterwards.
        NO:  ...small decisions you can make one at a time. When paralysis happens at the starting line, it's often because the project looks like one giant thing.   (a general theory of people, in a second sentence)
        NO:  ...so you're not figuring out how to handle pushback in the moment. You'll walk in grounded instead of hoping it goes well.   (a promised state, in a second sentence)
        Both of those are the same fault: the sentence that comes after the useful one.
        YES: Difficult Talk Coach can help you plan what to say, rehearse it, and prepare for possible responses, so you are not working it out in the moment.
        Describe what it changes about the TASK, not what it changes about them. Never guarantee an outcome or a mental state - no your brain stops seeing it, no resistance collapses, no it removes the decision paralysis, no so you stay calm, no exactly what to say. Where an effect is possible rather than certain, say it CAN or MAY help. Never invent how another person will react.",
      "what_to_do": "One sentence, second person: what to tell it when they open it. Carry forward the details they ALREADY gave you - a deadline they mentioned belongs here - rather than inventing new ones or adding qualifiers they did not ask for (do not tell somebody to begin without planning when the tool they are opening is a planning tool). Where their situation has unknowns, end by asking for what THEY are concerned about rather than inventing what someone else might do."
    }
  ],
  "no_perfect_fit": "If it's a true category gap (no tool in the catalog addresses this domain at all), explain what's missing here and mention the closest tool by name in this prose, as a last resort — do NOT also put that tool in 'recommendations'. Otherwise null."
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

    // A nullable field the model sometimes omits and sometimes emits as null is
    // a coin-flip for anything comparing the shape of the response — including
    // the golden. Always present, null when there is nothing to say.
    if (!('no_perfect_fit' in parsed)) parsed.no_perfect_fit = null;

    // At most two: one place to start, and at most one conditional alternative.
    if (parsed.recommendations.length > 2) parsed.recommendations = parsed.recommendations.slice(0, 2);

    return res.json(parsed);

  } catch (error) {
    console.error('ToolFinder error:', error);
    res.status(500).json({ error: error.message || 'Failed to find tools' });
  }
});

module.exports = router;
