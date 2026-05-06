const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');
const { rateLimit } = require('../lib/rateLimiter');

// ════════════════════════════════════════════
// MAIN ENDPOINT: Generate recommendation letter
// ════════════════════════════════════════════
router.post('/ghost-writer', rateLimit(), async (req, res) => {
  try {
    const {
      recipientName,
      yourRelationship,
      whatTheyreApplyingFor,
      letterType,
      qualities,
      anecdotes,
      duration,
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

    const basePrompt = `You are a professional writer who specializes in compelling recommendation letters. Your job is to take rough bullet points and turn them into polished, persuasive letters that sound like the RECOMMENDER wrote them thoughtfully — not like AI generated them.

PERSON BEING RECOMMENDED: ${recipientName}
YOUR RELATIONSHIP: ${yourRelationship} (e.g., "their manager for 2 years", "college professor", "coworker")
WHAT THEY'RE APPLYING FOR: ${whatTheyreApplyingFor || 'Not specified'}
LETTER TYPE: ${letterType || 'professional recommendation'}
HOW LONG YOU'VE KNOWN THEM: ${duration || 'Not specified'}
FORMALITY LEVEL: ${formalityLevel || 'professional'}

QUALITIES TO HIGHLIGHT:
${qualitiesList}

SPECIFIC ANECDOTES/EXAMPLES:
${anecdotesList}

ADDITIONAL CONTEXT: ${additionalContext || 'None'}

WRITING INSTRUCTIONS:

1. Generate 3 VERSIONS of the letter, each with a different structure and emphasis:

   VERSION 1 — NARRATIVE: Opens with a specific anecdote or moment, then builds the case through storytelling. Most personal and memorable. Best for competitive applications where the letter needs to stand out.

   VERSION 2 — STRUCTURED: Clear thesis statement, organized sections covering different qualities, specific examples for each. Most comprehensive. Best for formal applications (grad school, senior positions).

   VERSION 3 — CONCISE: Gets to the point quickly. Strong opening endorsement, 2-3 key points with brief evidence, decisive close. Best for LinkedIn recommendations, brief references, or when you know the reader has limited time.

2. For each version:
   - Open with how you know the person and for how long
   - Include at least one specific example (from their anecdotes or plausibly constructed)
   - Show, don't tell: "I watched Sarah reorganize our entire filing system in a weekend" > "Sarah is organized"
   - Match the formality to the context (LinkedIn rec ≠ grad school letter)
   - Close with a clear, confident endorsement
   - If anecdotes are vague, flesh them out into compelling mini-stories

3. FLAG any placeholders where the writer needs to fill in specific details they'd know but you don't.

OUTPUT FORMAT — Return ONLY valid JSON:
{
  "versions": [
    {
      "style": "narrative",
      "label": "Narrative — Personal & Memorable",
      "letter": "The full letter text",
      "word_count": 350,
      "best_for": "When this version works best",
      "strengths": ["what this version does well"],
      "customize_prompts": ["specific things the writer should personalize"]
    },
    {
      "style": "structured",
      "label": "Structured — Comprehensive & Formal",
      "letter": "The full letter text",
      "word_count": 450,
      "best_for": "When this version works best",
      "strengths": ["what this version does well"],
      "customize_prompts": ["specific things the writer should personalize"]
    },
    {
      "style": "concise",
      "label": "Concise — Quick & Powerful",
      "letter": "The full letter text",
      "word_count": 200,
      "best_for": "When this version works best",
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
    "Strong phrases from the letters that carry particular weight in recommendations"
  ]
}

IMPORTANT RULES:
- The letters must sound like a HUMAN wrote them, not AI. Vary sentence length. Include natural transitions. Avoid clichés like "I wholeheartedly recommend" or "I cannot recommend them highly enough."
- Use the writer's perspective ("In my X years of managing teams..." or "As their professor for...").
- Placeholders should be in [BRACKETS] and clearly labeled.
- If no anecdotes were provided, create plausible-sounding scenarios marked with [CUSTOMIZE: replace with a real example] so the writer knows to swap them.
- Match formality: LinkedIn = conversational, grad school = formal, job reference = professional.
- Each version should feel genuinely different in structure and tone, not just reworded.
- customize_prompts should be specific: "Add the name of the client they impressed" not "add more detail."

Return ONLY the JSON object. No markdown fences, no preamble.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4500,
      messages: [{ role: 'user', content: withLanguage(basePrompt, userLanguage) }],
    });

    const textContent = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = JSON.parse(cleanJsonResponse(textContent));
    res.json(parsed);

  } catch (error) {
    console.error('Ghost Writer error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate letter' });
  }
});

// ════════════════════════════════════════════
// REFINE ENDPOINT: Adjust a specific version
// ════════════════════════════════════════════
router.post('/ghost-writer/refine', rateLimit(), async (req, res) => {
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
  "refined_letter": "the full revised letter",
  "word_count": 350,
  "what_changed": "1-sentence summary of the revision"
}

Return ONLY valid JSON.`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{ role: 'user', content: withLanguage(basePrompt, userLanguage) }],
    });

    const textContent = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = JSON.parse(cleanJsonResponse(textContent));
    res.json(parsed);

  } catch (error) {
    console.error('Ghost Writer refine error:', error);
    res.status(500).json({ error: error.message || 'Failed to refine letter' });
  }
});

// ═══════════════════════════════════════════════════════════════
// STREAMING ROUTE — main letter generation
// ═══════════════════════════════════════════════════════════════

router.post('/ghost-writer/stream', rateLimit(), async (req, res) => {
  const { recipientName, yourRelationship, whatTheyreApplyingFor, letterType, qualities, anecdotes, duration, formalityLevel, additionalContext, userLanguage } = req.body;

  if (!recipientName || !yourRelationship) return res.status(400).json({ error: 'We need to know who this is for and your relationship' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    const qualitiesList = Array.isArray(qualities) && qualities.length > 0
      ? qualities.join(', ')
      : 'Not specified — infer from the relationship and context';

    const anecdotesList = Array.isArray(anecdotes) && anecdotes.length > 0
      ? anecdotes.map((a, i) => `  ${i + 1}. ${a}`).join('\n')
      : 'None provided — generate plausible-sounding generalizations the writer can customize';

    const prompt = withLanguage(`You are a professional writer who specializes in compelling recommendation letters.

PERSON BEING RECOMMENDED: ${recipientName}
YOUR RELATIONSHIP: ${yourRelationship}
WHAT THEY'RE APPLYING FOR: ${whatTheyreApplyingFor || 'Not specified'}
LETTER TYPE: ${letterType || 'professional recommendation'}
HOW LONG YOU'VE KNOWN THEM: ${duration || 'Not specified'}
FORMALITY LEVEL: ${formalityLevel || 'professional'}

QUALITIES TO HIGHLIGHT: ${qualitiesList}
SPECIFIC ANECDOTES: ${anecdotesList}
ADDITIONAL CONTEXT: ${additionalContext || 'None'}

Generate 3 letter versions (narrative, structured, concise) plus writing_tips, placeholders_to_fill, and power_phrases. Return ONLY valid JSON matching the full schema from the standard ghost-writer endpoint.`, userLanguage);

    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-6',
      max_tokens: 4500,
      messages: [{ role: 'user', content: prompt }],
    });

    stream.on('text', (text) => sendEvent({ chunk: text }));
    await stream.finalMessage();
    sendEvent({ done: true });
    res.end();

  } catch (err) {
    console.error('[GhostWriter/stream] Error:', err);
    sendEvent({ error: err.message || 'Stream failed' });
    res.end();
  }
});

module.exports = router;
