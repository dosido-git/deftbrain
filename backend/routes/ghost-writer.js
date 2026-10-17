const express = require('express');
const router = express.Router();
const { answer, onlyKeys, planNote } = require('../lib/progressive');
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ════════════════════════════════════════════
// MAIN ENDPOINT: Generate recommendation letter
// ════════════════════════════════════════════
router.post('/ghost-writer', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const {
      recipientName,
      pronouns,
      yourRelationship,
      whatTheyreApplyingFor,
      letterType,
      qualities,
      anecdotes,
      duration,
      whyRecommending,
      oneThingRemembered,
      formalityLevel,
      additionalContext,
      userLanguage,
    } = req.body;

    if (!recipientName || !yourRelationship) {
      return res.status(400).json({ error: 'We need to know who this is for and your relationship' });
    }

    const qualitiesList = Array.isArray(qualities) && qualities.length > 0
      ? qualities.join(', ')
      : 'Not specified — infer from the relationship and context';

    const anecdotesList = Array.isArray(anecdotes) && anecdotes.length > 0
      ? anecdotes.map((a, i) => `  ${i + 1}. ${a}`).join('\n')
      : 'None provided — generate plausible-sounding generalizations the writer can customize';

    // Shared context block — identical in both parallel calls (input tokens are
    // cheap; output tokens generate serially, so the 3 letters are split across
    // two parallel calls to cut wall-clock latency).
    const sharedContext = `You are a professional writer who specializes in compelling recommendation letters. Your job is to take rough bullet points and turn them into polished, persuasive letters that sound like the RECOMMENDER wrote them thoughtfully — not like AI generated them.

PERSON BEING RECOMMENDED: ${recipientName}
THEIR PRONOUNS: ${pronouns || 'not stated — use they/them throughout'}
YOUR RELATIONSHIP: ${yourRelationship} (e.g., "their manager for 2 years", "college professor", "coworker")
WHAT THEY'RE APPLYING FOR: ${whatTheyreApplyingFor || 'Not specified'}
LETTER TYPE: ${letterType || 'professional recommendation'}
HOW LONG YOU'VE KNOWN THEM: ${duration || 'Not specified'}
FORMALITY LEVEL: ${formalityLevel || 'professional'}

WHY THE WRITER IS RECOMMENDING THEM: ${whyRecommending || 'Not stated'}
THE ONE THING THE WRITER WANTS THE READER TO REMEMBER: ${oneThingRemembered || 'Not stated'}

QUALITIES TO HIGHLIGHT:
${qualitiesList}

SPECIFIC ANECDOTES/EXAMPLES:
${anecdotesList}

ADDITIONAL CONTEXT: ${additionalContext || 'None'}

WRITING INSTRUCTIONS:
0a. If the writer named the one thing they want remembered, that is the letter's single claim. Make it the thing the whole letter argues for — every version, whatever its structure. Do not state it as a slogan and move on; the anecdotes and qualities below are the evidence for it, so choose and frame them to prove that claim specifically.
0b. A recommendation is an act of advocacy, not a summary of a CV. If the writer said why they are recommending this person, that conviction is the spine of the letter — let it shape which evidence you lead with and how the close lands. Never quote the writer's reason back at the reader verbatim, and never write a sentence like 'they are recommending them because...'. Show the belief through what the letter chooses to say.
`;

    const perVersionInstructions = `2. For each version:
   - Open with how you know the person and for how long
   - Include at least one specific example (from their anecdotes or plausibly constructed)
   - Show, don't tell: "I watched Sarah reorganize our entire filing system in a weekend" > "Sarah is organized"
   - Match the formality to the context (LinkedIn rec ≠ grad school letter)
   - Close with a clear, confident endorsement
   - If anecdotes are vague, flesh them out into compelling mini-stories

3. FLAG any placeholders where the writer needs to fill in specific details they'd know but you don't.`;

    const sharedRules = `- The letters must sound like a HUMAN wrote them, not AI. Vary sentence length. Include natural transitions. Avoid clichés like "I wholeheartedly recommend" or "I cannot recommend them highly enough."
- Use the pronouns given above for the person being recommended, consistently, everywhere they appear. Do not switch part-way, and do not dodge by repeating the name where a pronoun belongs. If none were given, they/them is correct — use it without remark.
- Use the writer's perspective ("In my X years of managing teams..." or "As their professor for...").
- Placeholders should be in [BRACKETS] and clearly labeled.
- If no anecdotes were provided, create plausible-sounding scenarios marked with [CUSTOMIZE: replace with a real example] so the writer knows to swap them.
- Match formality: LinkedIn = conversational, grad school = formal, job reference = professional.
- Each version should feel genuinely different in structure and tone, not just reworded.
- customize_prompts should be specific: "Add the name of the client they impressed" not "add more detail."`;

    const noQuoteRule = `- Never place a double-quote (") character inside any JSON string value — write quoted phrases or letter text plainly or with single quotes, or it breaks the JSON.`;

    // The cross-cutting extras' template (onlyKeys keeps their part of it).
    const promptB = `${sharedContext}
1. Generate 1 VERSION of the letter:

   VERSION 1 — STRUCTURED: Clear thesis statement, organized sections covering different qualities, specific examples for each. Most comprehensive. Best for formal applications (grad school, senior positions).

${perVersionInstructions}

OUTPUT FORMAT — Return ONLY valid JSON:
{
  "versions": [
    {
      "style": "structured",
      "label": "Structured — Comprehensive & Formal",
      "letter": "The FULL letter text — a complete, multi-paragraph recommendation letter of roughly the word_count shown below (NOT a summary, NOT 2-3 sentences)",
      "word_count": 450,
      "best_for": "Who this version is for — AT MOST 6 words, no trailing period. Best for competitive roles / Best for formal applications / Best when the reader is busy",
      "strengths": ["what this version does well"],
      "customize_prompts": ["specific things the writer should personalize"]
    }
  ],

  "writing_tips": [
    "Specific advice for making this letter more effective"
  ],

  "placeholders_to_fill": [
    {
      "placeholder": "[SPECIFIC PROJECT]",
      "suggestion": "Replace with a real project name they worked on"
    }
  ],

  "power_phrases": [
    "Lines lifted verbatim from the letters above that carry real weight. They must sound like the writer said them, not like they were composed: no rhetorical turns, no setup-then-reversal, no 'X is accurate; it is also an underrepresentation'. If a phrase would draw attention to its own construction, it is the wrong phrase — pick the plain sentence that does the work instead."
  ]
}

IMPORTANT RULES:
${sharedRules}
- LIMITS: writing_tips AT MOST 4, power_phrases AT MOST 5, placeholders_to_fill AT MOST 5; strengths and customize_prompts AT MOST 3 per version. Keep tips/phrases/prompts terse (one line each) — the letters themselves carry the length.
- Your response MUST contain ALL 4 top-level keys: versions, writing_tips, placeholders_to_fill, power_phrases.
${noQuoteRule}

Return ONLY the JSON object. No markdown fences, no preamble.`;

    const localeSuffix = withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);
    // Progressive (2026-10-16, lib/progressive.js): one pass per letter, all
    // at once — the concise letter usually lands first. The tips, placeholders
    // and power phrases are written after the letters land, handed all three,
    // so the phrases are lifted from letters that exist and the placeholders
    // are the ones actually in them. No check runs on this route.
    const VERSION = {
      narrative: { n: 'NARRATIVE: Opens with a specific anecdote or moment, then builds the case through storytelling. Most personal and memorable. Best for competitive applications where the letter needs to stand out.', label: 'Narrative — Personal & Memorable', words: 350, maxTokens: 2000 },
      structured: { n: 'STRUCTURED: Clear thesis statement, organized sections covering different qualities, specific examples for each. Most comprehensive. Best for formal applications (grad school, senior positions).', label: 'Structured — Comprehensive & Formal', words: 450, maxTokens: 2400 },
      concise: { n: 'CONCISE: Gets to the point quickly. Strong opening endorsement, 2-3 key points with brief evidence, decisive close. Best for LinkedIn recommendations, brief references, or when you know the reader has limited time.', label: 'Concise — Quick & Powerful', words: 200, maxTokens: 1400 },
    };
    const letterPrompt = (style) => `${sharedContext}
1. Generate 1 VERSION of the letter. Other writers are producing the other versions at the same time, each with a different structure:

   ${VERSION[style].n}

${perVersionInstructions}

OUTPUT FORMAT — Return ONLY valid JSON:
{
  "versions": [
    {
      "style": "${style}",
      "label": "${VERSION[style].label}",
      "letter": "The FULL letter text — a complete, multi-paragraph recommendation letter of roughly the word_count shown below (NOT a summary, NOT 2-3 sentences)",
      "word_count": ${VERSION[style].words},
      "best_for": "Who this version is for — AT MOST 6 words, no trailing period. Best for competitive roles / Best for formal applications / Best when the reader is busy",
      "strengths": ["what this version does well"],
      "customize_prompts": ["specific things the writer should personalize"]
    }
  ]
}

IMPORTANT RULES:
${sharedRules}
- LIMITS: strengths and customize_prompts AT MOST 3. Keep them terse (one line each) — the letter itself carries the length.
- Your response MUST contain the top-level key "versions" with exactly one version, style exactly "${style}".
${noQuoteRule}

Return ONLY the JSON object. No markdown fences, no preamble.`;
    const call = (prompt, maxTokens, label) => callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: withLanguage(prompt, userLanguage) + localeSuffix }],
    }, { label });
    const styleOrder = ['narrative', 'structured', 'concise'];
    const versionsOf = d => styleOrder.map(st => d.letters?.[st]).filter(Boolean);
    const EXTRAS = ['writing_tips', 'placeholders_to_fill', 'power_phrases'];
    return await answer(req, res, {
      label: 'ghost-writer',
      parts: styleOrder.map(style => ({
        run: () => call(letterPrompt(style), VERSION[style].maxTokens, style === 'narrative' ? 'ghost-writer' : `ghost-writer-${style}`),
        apply: (d, out) => {
          const v = (Array.isArray(out?.versions) ? out.versions : []).find(x => x && x.letter);
          if (v) d.letters = { ...d.letters, [style]: { ...v, style } };
        },
      })),
      after: async (d) => {
        // T11 (audit/DEFECT-TYPES.md): the letters are final — this pass once
        // questioned the pronouns they used. Placeholders are the [BRACKETS]
        // actually in them; power phrases are lifted verbatim from them.
        const letters = { letters: versionsOf(d).map(v => ({ style: v.style, letter: v.letter })) };
        const out = await call(`${onlyKeys(promptB, EXTRAS)}${planNote(letters, ['letters'])}\nThe placeholders are the [BRACKETS] actually in these letters; power phrases are lifted verbatim from them; the tips are about using these letters well.`, 1500, 'ghost-writer-b');
        EXTRAS.forEach(k => { if (out?.[k] !== undefined) d[k] = out[k]; });
      },
      finish: d => {
        const { letters, ...rest } = structuredClone(d);
        return { ...rest, versions: versionsOf(d).map(v => structuredClone(v)) };
      },
      ready: d => versionsOf(d).length > 0,
      complete: d => versionsOf(d).length > 0,
    });

  } catch (error) {
    console.error('Ghost Writer error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate letter' });
  }
});

// ════════════════════════════════════════════
// REFINE ENDPOINT: Adjust a specific version
// ════════════════════════════════════════════
router.post('/ghost-writer/refine', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { letterText, refinementRequest, letterType, formalityLevel, userLanguage } = req.body;

    if (!letterText || !refinementRequest) {
      return res.status(400).json({ error: 'Letter text and refinement request required' });
    }

    const basePrompt = `You are editing a recommendation letter. Apply the requested changes while maintaining the same voice, formality level, and overall quality.

CURRENT LETTER:
"""
${letterText}
"""

REQUESTED CHANGE: "${refinementRequest}"
LETTER TYPE: ${letterType || 'professional recommendation'}
FORMALITY: ${formalityLevel || 'professional'}

Return the revised letter and a brief note on what changed.

OUTPUT (JSON only):
{
  "refined_letter": "the FULL revised letter — same length and completeness as the original (a complete letter, not a summary)",
  "word_count": 350,
  "what_changed": "1-sentence summary of the revision"
}

Never place a double-quote (") character inside any JSON string value — write quoted phrases or letter text plainly or with single quotes, or it breaks the JSON.

Return ONLY valid JSON.`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2000,
      messages: [{ role: 'user', content: withLanguage(basePrompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion) }],
    }, { label: 'ghost-writer-2' });
    if (!parsed.refined_letter) {
      return res.status(500).json({ error: 'Could not generate content. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('Ghost Writer refine error:', error);
    res.status(500).json({ error: error.message || 'Failed to refine letter' });
  }
});

module.exports = router;
