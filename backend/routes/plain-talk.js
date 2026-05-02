const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');

// ═══════════════════════════════════════════════════════════════
// MAIN ANALYSIS — plain-English translation + structural X-ray
// ═══════════════════════════════════════════════════════════════

router.post('/plaintalk', async (req, res) => {
  try {
    const { text, textType, focusQuestion, userLanguage } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const trimmed = text.trim().slice(0, 15000); // Cap at ~15k chars
    const typeHint = textType && textType !== 'auto' ? `\nDOCUMENT TYPE (user-specified): ${textType}` : '';
    const focusHint = focusQuestion ? `\nUSER'S SPECIFIC QUESTION: "${focusQuestion}"` : '';

    const prompt = withLanguage(`You are PlainTalk, a universal text comprehension expert. Your job: take complex text and make it completely understandable.

ANALYZE THIS TEXT:
---
${trimmed}
---
${typeHint}${focusHint}

INSTRUCTIONS:

1. AUTO-DETECT the text type if not specified. Categories: legal, medical, academic, financial, technical, literary, political, bureaucratic, scientific, general.

2. Produce a complete analysis with these sections:

Return ONLY valid JSON (no markdown, no code fences, no preamble):

{
  "detected_type": "legal",
  "detected_type_label": "Legal / Contract",
  "confidence": "high",
  "reading_level": {
    "original": "Graduate / Professional",
    "original_grade": 16,
    "translated": "8th Grade",
    "translated_grade": 8
  },
  "overview": {
    "one_sentence": "What this text IS in one plain sentence",
    "key_takeaways": ["Most important point 1", "Most important point 2", "Most important point 3"],
    "what_matters_to_you": "If the user asked a specific question, answer it directly here. Otherwise, explain what someone reading this text most needs to know about how it affects THEM personally.",
    "red_flags": ["Any concerning, unusual, or asymmetric provisions/claims"],
    "action_items": ["Things the reader should DO based on this text"],
    "deadlines": ["Any time-sensitive dates, periods, or windows mentioned"]
  },
  "sections": [
    {
      "id": "sec_1",
      "original": "The exact original text of this section (preserve verbatim)",
      "translation": "Plain-English translation of this section — clear, conversational, no jargon",
      "title": "Short descriptive title for this section",
      "purpose": "What this section is DOING in the document (e.g., 'Limits your ability to sue', 'Establishes the payment schedule')",
      "importance": "high|medium|low",
      "flags": ["Any red flags, asymmetries, or notable aspects of this section"]
    }
  ],
  "structure": {
    "architecture": "How the overall text is organized and why (e.g., 'Standard employment contract: definitions → terms → restrictions → termination')",
    "persuasion_techniques": ["Any rhetorical, legal, or structural techniques used to influence the reader"],
    "what_they_buried": "Anything important that was placed in a non-obvious location or wrapped in complex language",
    "internal_contradictions": ["Any places where the text contradicts itself or creates ambiguity"]
  },
  "specialist_suggestion": {
    "tool": "OfferDissector|DoctorVisitTranslator|BillGuiltEraser|ComplaintEscalationWriter|null",
    "reason": "Why this specialist tool would help with this specific text, or null if none applies"
  },
  "type_insights": {
    "type": "Matches detected_type — legal|medical|academic|financial|technical|literary|political|bureaucratic|scientific|general",
    "power_analysis": "FOR LEGAL/FINANCIAL: Who has more power in this document? Map obligations: YOUR obligations vs THEIR obligations. Note any asymmetries where one party has more rights or fewer obligations than the other. FOR MEDICAL: What is the urgency level — routine monitoring, needs action within weeks, or urgent? FOR ACADEMIC: What is the confidence level of the claims? FOR OTHER: null",
    "vs_standard": "How does this compare to standard/typical documents of this type? What is unusually strict, generous, vague, or missing compared to what you'd normally see?",
    "negotiable_items": ["FOR LEGAL/FINANCIAL: Clauses that are commonly negotiated or pushed back on in this type of document"],
    "urgency": "none|low|medium|high|critical — how quickly does the reader need to act?"
  },
  "full_translation": "The COMPLETE text translated into plain, conversational English. Every section, every clause — nothing omitted. Use paragraph breaks. This should be readable by an 8th grader.",
  "jargon_glossary": [
    { "term": "force majeure", "definition": "Events outside anyone's control (natural disasters, wars) that excuse not fulfilling the contract" }
  ]
}

CRITICAL RULES:
- "sections" MUST cover the ENTIRE text — break it into logical chunks of 1-3 paragraphs each. Every sentence of the original must appear in exactly one section.
- "original" in each section must be VERBATIM from the input text — do not paraphrase the original
- "translation" must be genuinely plain — imagine explaining to a smart 14-year-old
- "full_translation" must be COMPLETE — translate every single sentence, omit nothing
- "importance" should be "high" for anything that creates obligations, costs, risks, or deadlines
- If the text is literary/creative, adapt: "purpose" becomes narrative function, "flags" becomes literary devices, "persuasion_techniques" becomes style/voice analysis
- For medical text: flag anything requiring patient action, consent implications, or risk disclosures. "urgency" should reflect how quickly the reader needs medical attention or follow-up.
- For legal text: explicitly note any asymmetric obligations (one party has more rights/fewer obligations). "vs_standard" should compare clauses to typical industry practice. "negotiable_items" should list clauses commonly pushed back on.
- For financial text: identify who bears risk, what fees are hidden, and what the total cost of compliance is
- "type_insights" must ALWAYS be populated — adapt the fields to the document type. This is the most valuable section for the reader.
- "jargon_glossary" should include 5-15 domain-specific terms used in the text
- Be thorough but never pad — only include what's genuinely useful`, userLanguage);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }]
    });

    const textContent = message.content.find(item => item.type === 'text')?.text || '';

    const cleaned = cleanJsonResponse(textContent);
    const parsed = JSON.parse(cleaned);

    res.json(parsed);

  } catch (error) {
    console.error('[PlainTalk] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze text' });
  }
});

// ═══════════════════════════════════════════════════════════════
// FOLLOW-UP QUESTIONS — ask about specific sections/topics
// ═══════════════════════════════════════════════════════════════

router.post('/plaintalk/followup', async (req, res) => {
  try {
    const { originalText, question, previousAnalysis, userLanguage } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Question is required' });
    }

    const textSnippet = (originalText || '').slice(0, 8000);
    const analysisContext = previousAnalysis ? JSON.stringify({
      type: previousAnalysis.detected_type,
      overview: previousAnalysis.overview,
      sections: (previousAnalysis.sections || []).map(s => ({ title: s.title, purpose: s.purpose })),
    }) : '';

    const prompt = withLanguage(`You previously analyzed a document for a user using PlainTalk. Now they have a follow-up question.

ORIGINAL TEXT (excerpt):
---
${textSnippet}
---

PREVIOUS ANALYSIS CONTEXT:
${analysisContext}

USER'S FOLLOW-UP QUESTION: "${question.trim()}"

Respond in plain, conversational English. Be specific — reference actual parts of the text. If the question is about a specific section, quote the relevant part and explain it.

Return ONLY valid JSON:

{
  "answer": "Direct, clear answer to their question in plain English",
  "relevant_sections": ["sec_1", "sec_3"],
  "key_quote": "The most relevant quote from the original text (if applicable)",
  "practical_implication": "What this means for the reader practically — what should they DO or KNOW",
  "follow_up_suggestions": ["Another question they might want to ask", "Another angle to explore"]
}`, userLanguage);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    });

    const textContent = message.content.find(item => item.type === 'text')?.text || '';
    const cleaned = cleanJsonResponse(textContent);
    const parsed = JSON.parse(cleaned);

    res.json(parsed);

  } catch (error) {
    console.error('[PlainTalk/followup] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to answer question' });
  }
});

// ═══════════════════════════════════════════════════════════════
// DOCUMENT COMPARISON — diff two versions of a document
// ═══════════════════════════════════════════════════════════════

router.post('/plaintalk/compare', async (req, res) => {
  try {
    const { textA, textB, labelA, labelB, textType, userLanguage } = req.body;

    if (!textA?.trim() || !textB?.trim()) {
      return res.status(400).json({ error: 'Both texts are required for comparison' });
    }

    const trimA = textA.trim().slice(0, 10000);
    const trimB = textB.trim().slice(0, 10000);
    const typeHint = textType && textType !== 'auto' ? `\nDOCUMENT TYPE: ${textType}` : '';

    const prompt = withLanguage(`You are PlainTalk, a document comparison expert. Compare two versions of a document and identify every meaningful change.

DOCUMENT A ("${labelA || 'Original'}"):
---
${trimA}
---

DOCUMENT B ("${labelB || 'Revised'}"):
---
${trimB}
---
${typeHint}

Analyze the differences between these two texts. Focus on SUBSTANTIVE changes — things that change meaning, obligations, rights, risks, or outcomes. Note formatting/wording changes only if they subtly alter meaning.

Return ONLY valid JSON:

{
  "summary": "2-3 sentence overview of what changed between the two versions and the overall direction of the changes (e.g., 'The revised version is significantly more restrictive for the tenant')",
  "change_direction": "more_favorable|less_favorable|neutral|mixed",
  "change_direction_for_whom": "Who benefits from the changes overall and who loses",
  "changes": [
    {
      "id": "chg_1",
      "category": "added|removed|modified|reworded",
      "severity": "critical|significant|minor|cosmetic",
      "topic": "Short label for what this change is about (e.g., 'Termination clause', 'Payment terms')",
      "text_a": "The relevant text from Document A (or null if added in B)",
      "text_b": "The relevant text from Document B (or null if removed from A)",
      "plain_explanation": "What this change means in plain English",
      "who_benefits": "Who does this change favor — the reader, the other party, both, or neither",
      "risk_note": "Any risk or concern this change creates for the reader (or null)"
    }
  ],
  "unchanged_important": ["Important clauses/sections that remained the same — worth noting for reassurance"],
  "hidden_changes": ["Changes that appear cosmetic but actually affect meaning — the quiet rewording trick"],
  "recommendation": "What the reader should do about these changes — accept, negotiate, flag for review, etc."
}

CRITICAL:
- List ALL substantive changes, not just the first few
- "category" must be one of: added, removed, modified, reworded
- "severity" must be one of: critical, significant, minor, cosmetic
- "text_a" and "text_b" should be the actual relevant text from each document (verbatim excerpts)
- For "added" changes, text_a is null. For "removed" changes, text_b is null.
- "hidden_changes" is the most valuable section — find anything that was subtly reworded to change meaning
- Be specific about who benefits from each change
- The recommendation should be actionable`, userLanguage);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 6000,
      messages: [{ role: 'user', content: prompt }]
    });

    const textContent = message.content.find(item => item.type === 'text')?.text || '';

    const cleaned = cleanJsonResponse(textContent);
    const parsed = JSON.parse(cleaned);

    res.json(parsed);

  } catch (error) {
    console.error('[PlainTalk/compare] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to compare documents' });
  }
});

module.exports = router;

// ═══════════════════════════════════════════════════════════════
// STREAMING ROUTE — main analysis
// ═══════════════════════════════════════════════════════════════

router.post('/plaintalk/stream', async (req, res) => {
  const { text, textType, focusQuestion, userLanguage } = req.body;

  if (!text?.trim()) return res.status(400).json({ error: 'Text is required' });

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const sendEvent = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    const trimmed = text.trim().slice(0, 15000);
    const typeHint = textType && textType !== 'auto' ? `\nDOCUMENT TYPE (user-specified): ${textType}` : '';
    const focusHint = focusQuestion ? `\nUSER'S SPECIFIC QUESTION: "${focusQuestion}"` : '';

    const prompt = withLanguage(`You are PlainTalk, a universal text comprehension expert. Your job: take complex text and make it completely understandable.

ANALYZE THIS TEXT:
---
${trimmed}
---
${typeHint}${focusHint}

Auto-detect the document type if not specified. Produce a complete analysis. Return ONLY valid JSON matching the full schema from the standard plaintalk endpoint, including: detected_type, detected_type_label, confidence, reading_level, overview, sections, structure, specialist_suggestion, type_insights, full_translation, and jargon_glossary.`, userLanguage);

    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [{ role: 'user', content: prompt }],
    });

    stream.on('text', (text) => sendEvent({ chunk: text }));
    await stream.finalMessage();
    sendEvent({ done: true });
    res.end();

  } catch (err) {
    console.error('[PlainTalk/stream] Error:', err);
    sendEvent({ error: err.message || 'Stream failed' });
    res.end();
  }
});
