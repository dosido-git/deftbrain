const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ═══════════════════════════════════════════════════
// ROUTE 1: DIGEST — The core translation
// ═══════════════════════════════════════════════════
router.post('/research-decoder', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { text, title, field, userLanguage } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Paste an abstract, excerpt, or paper text.' });

    const prompt = withLanguage(`Translate an academic paper into plain language. You are NOT judging this paper — you are helping a non-expert understand what it actually says. Be warm, clear, and honest.

PAPER TEXT:
"${text.trim().substring(0, 8000)}"
${title?.trim() ? `PAPER TITLE: "${title.trim()}"` : ''}
${field?.trim() ? `FIELD: "${field.trim()}"` : ''}

IMPORTANT GUIDELINES:
- DESCRIBE methodology, don't judge it. "This is a small observational study" is helpful. "This methodology is weak" is an opinion.
- Be honest about what the paper DOES and DOESN'T prove. Most papers prove less than people think.
- Use analogies to make complex concepts click.
- The "so what" section should answer what a regular person should DO with this information.

Return ONLY valid JSON:
{
  "one_sentence": "The actual finding in one plain sentence. No jargon. A smart 16-year-old should understand this. — one sentence",
  "why_it_matters": "Why should a non-scientist care about this? What's the real-world implication? 2-3 sentences.",
  "what_they_did": {
    "study_type": "What kind of study this is — in plain English. e.g., 'They surveyed 500 people once' or 'They followed 10,000 people for 20 years' or 'They tested this in mice, not humans' — one sentence",
    "sample": "Who/what was studied, how many, and any important details about the group — one sentence",
    "method_plain": "What they actually did, step by step, in language anyone can follow — one sentence",
    "controls": "Did they compare against anything? How? If no controls, say so clearly. — one sentence",
    "stats_note": "What the key numbers mean — translate p-values, confidence intervals, effect sizes into English. e.g., 'The effect was real but small — about a 3% difference.' — one sentence"
  },
  "what_it_proves": "What this paper actually demonstrates — be precise. Most papers show CORRELATION, not CAUSATION. If it's correlation, say so clearly with an analogy. — one sentence",
  "what_it_doesnt_prove": "What people might THINK this proves but it doesn't. This is crucial — be specific. — one sentence",
  "limitations": [
    "Each limitation explained in plain language — not academic hedging but 'here's why you shouldn't bet the farm on this'"
  ],
  "jargon_decoded": [
    { "term": "Technical term from the paper — 3-6 words", "meaning": "Plain English explanation — one sentence", "why_it_matters": "Why this term is important to understanding the finding — one sentence" }
  ],
  "so_what": {
    "for_you": "What should a regular person DO with this information? Change behavior? Wait for more research? Ignore the headline? — one sentence",
    "confidence_level": "How confident should you be in this finding? Scale from 'interesting but very early' to 'this is well-established science' — one sentence",
    "the_honest_take": "A warm, honest, slightly informal summary. The thing you'd tell a friend over coffee. — one sentence"
  },
  "field_context": "Where does this fit in the bigger picture? Is this confirming what scientists already thought, or is it surprising? Is there an ongoing debate? — 1-2 sentences"
}`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 3000,
      system: withLanguage('Science translator for non-experts. You make research accessible without dumbing it down. You DESCRIBE methodology rather than judging it. You are scrupulously honest about what papers prove vs. what people assume they prove. Warm, clear, occasionally funny. You use analogies. You care about scientific literacy. Return ONLY valid JSON. No markdown.', userLanguage),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'ResearchDecoder' });
    if (!parsed.one_sentence) {
      return res.status(500).json({ error: 'Could not decode this research. Please try again.' });
    }
    res.json(parsed);
  } catch (error) {
    console.error('[ResearchDecoder]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 2: MEDIA CHECK — Paper vs. headlines
// ═══════════════════════════════════════════════════
router.post('/research-decoder-media', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { paperText, headline, articleExcerpt, userLanguage } = req.body;
    if (!paperText?.trim() && !headline?.trim()) return res.status(400).json({ error: 'Provide the paper text and the headline or article.' });

    const prompt = withLanguage(`Compare what an academic paper ACTUALLY says to how the media is reporting it. This is where the most real-world harm happens — headlines that say "X CAUSES Y" when the paper says "weak correlation in a small sample."

PAPER TEXT (or abstract):
"${paperText?.trim().substring(0, 6000) || 'Not provided — analyze based on headline claims'}"

MEDIA COVERAGE:
${headline?.trim() ? `HEADLINE: "${headline.trim()}"` : ''}
${articleExcerpt?.trim() ? `ARTICLE EXCERPT: "${articleExcerpt.trim().substring(0, 3000)}"` : ''}

Return ONLY valid JSON:
{
  "paper_actually_says": "What the paper actually found — one clear sentence. — one sentence",
  "media_says": "What the headline/article claims — one clear sentence. — one sentence",
  "accuracy_rating": {
    "score": "Accurate | Mostly accurate | Exaggerated | Misleading | Completely wrong",
    "emoji": "✅ | 🟡 | 🟠 | 🔴 | ❌",
    "explanation": "Specific explanation of where the media got it right and where it went wrong. — 1-2 sentences"
  },
  "distortions": [
    {
      "what_media_said": "The specific claim or framing — one sentence",
      "what_paper_said": "What the paper actually said about this — one sentence",
      "distortion_type": "Causation from correlation | Cherry-picked result | Exaggerated effect size | Missing context | Generalized from specific population | Preliminary framed as conclusive | Omitted limitations",
      "why_it_matters": "Why this specific distortion could mislead someone — one sentence"
    }
  ],
  "what_they_got_right": ["Things the media coverage accurately represented — give credit where due"],
  "the_real_story": "The accurate version of this story in 2-3 sentences — what the headline SHOULD have said.",
  "should_you_worry": "Direct answer: based on the ACTUAL paper, should you change your behavior? Usually the answer is 'not yet' or 'this is one study.' (true/false)"
}`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: withLanguage('Media accuracy analyst for scientific papers. You compare what papers say to what headlines claim. You are fair — you give credit when media gets it right — but unflinching when they distort. You care about public understanding of science. Warm, clear, never condescending. Return ONLY valid JSON. No markdown.', userLanguage),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'ResearchDecoderMedia' });
    if (!parsed.paper_actually_says) {
      return res.status(500).json({ error: 'Could not decode this research. Please try again.' });
    }
    res.json(parsed);
  } catch (error) {
    console.error('[ResearchDecoderMedia]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 3: JARGON DEEP DIVE — Explain specific terms
// ═══════════════════════════════════════════════════
router.post('/research-decoder-jargon', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { terms, field, paperContext, userLanguage } = req.body;
    if (!terms?.length && !terms?.trim?.()) return res.status(400).json({ error: 'What terms do you want explained?' });

    const termList = Array.isArray(terms) ? terms : terms.split(',').map(t => t.trim()).filter(Boolean);
    if (!termList.length) return res.status(400).json({ error: 'List at least one term.' });

    const prompt = withLanguage(`Explain these academic/scientific terms in plain English. Not dictionary definitions — practical understanding. Help someone actually UNDERSTAND what they're reading.

TERMS: ${termList.map(t => `"${t}"`).join(', ')}
${field?.trim() ? `FIELD: "${field}"` : ''}
${paperContext?.trim() ? `CONTEXT: "${paperContext.substring(0, 2000)}"` : ''}

Return ONLY valid JSON:
{
  "terms": [
    {
      "term": "The term — 3-6 words",
      "plain_english": "What this actually means — no jargon in the explanation. Use an analogy if helpful. — one sentence",
      "why_it_matters": "Why this term matters for understanding the paper's claims — one sentence",
      "watch_out": "Common misconception about this term, if any — one sentence",
      "example": "A concrete example that makes it click — one sentence"
    }
  ]
}`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: withLanguage('Jargon translator. You explain technical terms so they actually make sense to non-experts. Analogies, examples, zero jargon in explanations. Return ONLY valid JSON. No markdown.', userLanguage),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'ResearchDecoderJargon' });
    if (!parsed.terms) {
      return res.status(500).json({ error: 'Could not decode this research. Please try again.' });
    }
    res.json(parsed);
  } catch (error) {
    console.error('[ResearchDecoderJargon]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 4: COMPARE — Two papers on the same topic
// ═══════════════════════════════════════════════════
router.post('/research-decoder-compare', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { paper1, paper2, question, userLanguage } = req.body;
    if (!paper1?.trim() || !paper2?.trim()) return res.status(400).json({ error: 'Paste text from both papers.' });

    const prompt = withLanguage(`Compare two academic papers on a related topic. Help a non-expert understand: do they agree? Disagree? Is one more reliable? Why might they have different results?

PAPER 1:
"${paper1.trim().substring(0, 4000)}"

PAPER 2:
"${paper2.trim().substring(0, 4000)}"

${question?.trim() ? `USER'S QUESTION: "${question.trim()}"` : ''}

Return ONLY valid JSON:
{
  "paper1_says": "One-sentence summary of Paper 1's finding. — one sentence",
  "paper2_says": "One-sentence summary of Paper 2's finding. — one sentence",
  "do_they_agree": {
    "verdict": "Yes | Mostly | Partially | No | They're asking different questions",
    "explanation": "Clear explanation of where they align and diverge. — 1-2 sentences"
  },
  "why_different": [
    "Possible reasons for any differences — different methods, populations, timeframes, definitions, etc. Explain in plain language."
  ],
  "which_to_trust_more": {
    "assessment": "Neither is 'better' — explain what each one's design is better at showing. If one is clearly stronger for a specific question, say so and explain why. — 1-2 sentences",
    "caveats": "Important caveats about this comparison. — one sentence"
  },
  "the_takeaway": "What should a regular person conclude from these two papers taken together? Usually more nuanced than either paper alone. — one sentence",
  "what_we_still_dont_know": "What questions remain unanswered even with both papers? — one sentence"
}`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: withLanguage('Paper comparison analyst. You help non-experts understand how multiple studies relate to each other. You never declare one paper "better" without explaining what "better" means in context. Nuanced, fair, clear. Return ONLY valid JSON. No markdown.', userLanguage),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'ResearchDecoderCompare' });
    if (!parsed.paper1_says) {
      return res.status(500).json({ error: 'Could not decode this research. Please try again.' });
    }
    res.json(parsed);
  } catch (error) {
    console.error('[ResearchDecoderCompare]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 5: SHOULD I CARE — Personalized relevance
// ═══════════════════════════════════════════════════
router.post('/research-decoder-relevance', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { paperSummary, myContext, myQuestion, userLanguage } = req.body;
    if (!paperSummary?.trim() && !myQuestion?.trim()) return res.status(400).json({ error: 'Provide the paper summary and your situation.' });

    const prompt = withLanguage(`Someone read about a study and wants to know: does this apply to ME? Should I change my behavior? Help them make a personal decision based on what the research actually shows.

PAPER SUMMARY OR FINDING:
"${paperSummary?.trim().substring(0, 3000) || 'Not provided'}"

THEIR SITUATION: "${myContext?.trim() || 'Not specified'}"
THEIR QUESTION: "${myQuestion?.trim() || 'Should I care about this?'}"

Be honest: sometimes the answer is "this doesn't apply to you." Sometimes it's "yes, but don't panic." Never dismiss their concern, but never inflate it either.

Return ONLY valid JSON:
{
  "applies_to_you": {
    "verdict": "Yes directly | Somewhat | Not really | Too early to tell",
    "explanation": "Specific explanation of why this does or doesn't apply to their situation. Reference the study population vs. their situation. — 1-2 sentences"
  },
  "should_you_change": {
    "behavior": "What, if anything, they should consider doing differently based on THIS study. Usually the answer is nuanced. — one sentence",
    "confidence": "How confident they should be in making this change — 'strong evidence' to 'interesting but wait for more research' (number)",
    "cost_of_waiting": "What's the downside of waiting for more evidence vs. acting now? Sometimes waiting is fine. Sometimes the change is low-cost and worth trying. — one sentence"
  },
  "talk_to": "Should they talk to a doctor/expert about this? If yes, what specifically to ask. — one sentence",
  "the_bottom_line": "One warm, honest, direct sentence. The thing a smart, caring friend would say. — one sentence"
}`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: withLanguage('Personal health/science relevance advisor. You help people figure out if a study applies to THEM. You never give medical advice but you help them think clearly about what to do with information. Warm, honest, specific. Return ONLY valid JSON. No markdown.', userLanguage),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'ResearchDecoderRelevance' });
    if (!parsed.applies_to_you) {
      return res.status(500).json({ error: 'Could not decode this research. Please try again.' });
    }
    res.json(parsed);
  } catch (error) {
    console.error('[ResearchDecoderRelevance]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
