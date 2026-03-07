const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');

const LEVEL_GUIDE = {
  'eli5': 'Explain like I\'m 5. Simplest words. Short sentences. Child-friendly analogies.',
  '5th-grade': '5th-grade reading level. Simple words, short sentences. Define technical terms in parentheses.',
  '8th-grade': '8th-grade reading level. Clear and accessible, preserves more nuance.',
  'professional': 'Professional but de-jargoned. Replace field-specific jargon with general professional language. Reader is smart but not in this field.'
};

// ═══════════════════════════════════════════════════
// ROUTE 1: TRANSLATE — Core document translation
// ═══════════════════════════════════════════════════
router.post('/jargon-assassin', async (req, res) => {
  try {
    const { documentText, documentType, readingLevel, userLanguage } = req.body;
    if (!documentText?.trim()) return res.status(400).json({ error: 'Paste or upload a document to translate.' });

    const lvl = LEVEL_GUIDE[readingLevel] || LEVEL_GUIDE['5th-grade'];
    const prompt = withLanguage(`Translate this complex document into plain language while preserving ALL critical information.

DOCUMENT TYPE: ${documentType || 'general'}
TARGET READING LEVEL: ${readingLevel || '5th-grade'} — ${lvl}

DOCUMENT:
"""
${documentText.trim().substring(0, 12000)}
"""

RULES:
- Maintain ALL factual content. Replace jargon with common words. Break long sentences short. Eliminate passive voice.
- Define necessary technical terms in parentheses. Use concrete examples for abstract concepts.
- Flag important sections, decisions, red flags, and deadlines.
- For clauses that are commonly unenforceable or unusually aggressive, note this.

Return ONLY valid JSON:
{
  "summary": "2-3 sentence summary. Warm, direct.",
  "translation": "Full plain-language translation.",
  "reading_level": "Achieved level (e.g., '5th grade')",
  "sections": [{ "id": "s1", "title": "Section heading", "original_snippet": "First ~50 words", "translated": "Plain translation", "importance": "high | medium | low" }],
  "key_sections": [{ "type": "important | decision | red_flag | deadline", "title": "Brief title", "original_text": "Original text", "simplified": "Plain explanation", "why_it_matters": "Why flagged", "enforceability_note": "If this clause is commonly disputed or unenforceable, note it here. null otherwise." }],
  "glossary": [{ "term": "technical term", "definition": "simple definition", "context": "where it appears" }],
  "checklist": ["Before you sign/agree, verify this..."],
  "suggested_questions": [{ "question": "Question to ask", "why": "Why it matters", "who_to_ask": "lawyer/doctor/HR/etc." }],
  "danger_score": { "level": "safe | caution | warning | danger", "explanation": "Brief risk explanation" },
  "jargon_highlights": [{ "original": "jargon phrase from document", "replaced_with": "plain version", "location": "approximate location in doc" }]
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'JargonAssassin', max_tokens: 6000,
      system: withLanguage('Plain language expert. Translate complex docs so anyone understands. Never omit details. Flag concerns. Note potentially unenforceable clauses. Warm, clear, protective. Return ONLY valid JSON. No markdown.', userLanguage) });
    console.log(`[JargonAssassin] ${documentType} | ${readingLevel || '5th'} | ${parsed.glossary?.length || 0} terms | danger: ${parsed.danger_score?.level || '?'}`);
    res.json(parsed);
  } catch (error) {
    console.error('[JargonAssassin]', error);
    res.status(500).json({ error: error.message || 'Failed to translate.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 2: ASK — Follow-up question
// ═══════════════════════════════════════════════════
router.post('/jargon-assassin-ask', async (req, res) => {
  try {
    const { question, documentText, documentType, translationSummary, readingLevel, userLanguage } = req.body;
    if (!question?.trim()) return res.status(400).json({ error: 'What do you want to know?' });

    const prompt = withLanguage(`Answer a question about a translated document at the same reading level.

DOC TYPE: ${documentType || 'general'} | LEVEL: ${readingLevel || '5th-grade'}
DOCUMENT: "${documentText?.trim().substring(0, 8000) || 'N/A'}"
SUMMARY: "${translationSummary || 'N/A'}"
QUESTION: "${question.trim()}"

Return ONLY valid JSON:
{
  "answer": "Clear direct answer at appropriate reading level.",
  "found_in_document": true/false,
  "relevant_section": "Specific part this relates to, or null",
  "follow_up": "Natural follow-up question, or null",
  "warning": "If question reveals a concern, flag it. null if fine.",
  "who_to_ask": "Professional to consult, or null"
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'JargonAssassinAsk', max_tokens: 1500,
      system: withLanguage('Plain language Q&A expert. Direct, warm, protective. Return ONLY valid JSON. No markdown.', userLanguage) });
    res.json(parsed);
  } catch (error) {
    console.error('[JargonAssassinAsk]', error);
    res.status(500).json({ error: error.message || 'Failed to answer.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 3: COMPARE — Two document versions
// ═══════════════════════════════════════════════════
router.post('/jargon-assassin-compare', async (req, res) => {
  try {
    const { text1, text2, documentType, readingLevel, userLanguage } = req.body;
    if (!text1?.trim() || !text2?.trim()) return res.status(400).json({ error: 'Paste both versions.' });

    const prompt = withLanguage(`Compare two document versions. Explain every meaningful change in plain language.

DOC TYPE: ${documentType || 'general'} | LEVEL: ${readingLevel || '5th-grade'}
VERSION 1: "${text1.trim().substring(0, 6000)}"
VERSION 2: "${text2.trim().substring(0, 6000)}"

Return ONLY valid JSON:
{
  "summary": "1-2 sentence overview of changes.",
  "changes": [{ "what_changed": "plain description", "before": "v1 simplified", "after": "v2 simplified", "impact": "positive | negative | neutral", "severity": "major | minor | cosmetic", "why_it_matters": "reader impact" }],
  "added": ["new in v2"], "removed": ["missing from v2 — potentially concerning"],
  "overall_assessment": { "direction": "better | worse | mixed | similar", "recommendation": "what to do" }
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'JargonAssassinCompare', max_tokens: 3000,
      system: withLanguage('Document comparison expert. Find meaningful changes, explain in plain language. Protective of reader. Return ONLY valid JSON. No markdown.', userLanguage) });
    res.json(parsed);
  } catch (error) {
    console.error('[JargonAssassinCompare]', error);
    res.status(500).json({ error: error.message || 'Failed to compare.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 4: SECTION — Deep-dive one section
// ═══════════════════════════════════════════════════
router.post('/jargon-assassin-section', async (req, res) => {
  try {
    const { sectionText, documentType, readingLevel, fullDocumentContext, userLanguage } = req.body;
    if (!sectionText?.trim()) return res.status(400).json({ error: 'Paste the section to explain.' });

    const prompt = withLanguage(`Deep-dive explanation of a specific document section. Every clause, every condition, every implication.

DOC TYPE: ${documentType || 'general'} | LEVEL: ${readingLevel || '5th-grade'}
SECTION: "${sectionText.trim().substring(0, 4000)}"
${fullDocumentContext ? `CONTEXT: "${fullDocumentContext.substring(0, 3000)}"` : ''}

Return ONLY valid JSON:
{
  "section_summary": "What this section does in one sentence.",
  "line_by_line": [{ "original": "clause/sentence", "meaning": "plain meaning", "implication": "practical effect on YOU", "hidden_catch": "anything tricky, or null" }],
  "what_this_means_for_you": "Practical summary of how this affects your life/money/rights.",
  "questions_to_ask": ["specific questions about this section"],
  "related_to": "How this connects to other parts, if relevant"
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'JargonAssassinSection', max_tokens: 2500,
      system: withLanguage('Section analyst. Every clause, every hidden implication. Protective. Return ONLY valid JSON. No markdown.', userLanguage) });
    res.json(parsed);
  } catch (error) {
    console.error('[JargonAssassinSection]', error);
    res.status(500).json({ error: error.message || 'Failed to analyze section.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 5: SUGGEST — Questions you should ask
// ═══════════════════════════════════════════════════
router.post('/jargon-assassin-suggest', async (req, res) => {
  try {
    const { documentText, documentType, translationSummary, userSituation, userLanguage } = req.body;
    if (!documentText?.trim() && !translationSummary?.trim()) return res.status(400).json({ error: 'Need document context.' });

    const prompt = withLanguage(`Generate questions the reader SHOULD be asking. Think like a protective advisor.

DOC TYPE: ${documentType || 'general'}
DOCUMENT: "${(documentText || translationSummary || '').substring(0, 6000)}"
${userSituation ? `SITUATION: "${userSituation}"` : ''}

Return ONLY valid JSON:
{
  "must_ask": [{ "question": "critical question", "why": "importance", "who_to_ask": "who", "what_good_looks_like": "satisfactory answer" }],
  "should_ask": [{ "question": "important question", "why": "why", "who_to_ask": "who" }],
  "negotiate": [{ "point": "negotiable item", "current": "current terms", "better": "what to ask for", "how_to_ask": "framing" }],
  "verify": ["things to fact-check independently"],
  "overall_advice": "One sentence of warm direct advice."
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'JargonAssassinSuggest', max_tokens: 2500,
      system: withLanguage('Protective document advisor. Generate questions readers should ask. Like a knowledgeable friend. Return ONLY valid JSON. No markdown.', userLanguage) });
    res.json(parsed);
  } catch (error) {
    console.error('[JargonAssassinSuggest]', error);
    res.status(500).json({ error: error.message || 'Failed to suggest.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 6: EXPLAIN TO — Reframe for specific person
// ═══════════════════════════════════════════════════
router.post('/jargon-assassin-explain-to', async (req, res) => {
  try {
    const { sectionText, audience, translationSummary, documentType, userLanguage } = req.body;
    if (!sectionText?.trim() && !translationSummary?.trim()) return res.status(400).json({ error: 'Need content to reframe.' });
    if (!audience?.trim()) return res.status(400).json({ error: 'Who are you explaining this to?' });

    const prompt = withLanguage(`Reframe this document content for a specific person. Not just simpler — tailored to what THEY would care about, worry about, and need to understand.

CONTENT TO EXPLAIN:
"${(sectionText || translationSummary || '').trim().substring(0, 5000)}"

DOCUMENT TYPE: ${documentType || 'general'}
EXPLAINING TO: "${audience.trim()}"

RULES:
- Use language and analogies appropriate for THIS person.
- Emphasize what THEY would care about, not what you think is important.
- Anticipate THEIR questions and concerns.
- If there are things they don't need to worry about, say so — reduce their anxiety.

Return ONLY valid JSON:
{
  "explanation": "The content reframed for this specific person. 2-4 paragraphs. Conversational, warm, appropriate.",
  "their_main_concern": "What this person would likely be most worried about, addressed directly.",
  "key_points_for_them": ["The 3-4 things this person specifically needs to understand"],
  "skip": "What you can tell them they DON'T need to worry about — anxiety reducer.",
  "their_questions": ["Questions THIS person would likely ask, with answers"],
  "how_to_deliver": "Advice on how to actually have this conversation — tone, setting, what to emphasize."
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'JargonAssassinExplainTo', max_tokens: 2000,
      system: withLanguage('Communication reframer. Tailor complex information for specific audiences. Empathetic, practical, warm. Return ONLY valid JSON. No markdown.', userLanguage) });
    console.log(`[JargonAssassinExplainTo] audience: ${audience?.substring(0, 30)}`);
    res.json(parsed);
  } catch (error) {
    console.error('[JargonAssassinExplainTo]', error);
    res.status(500).json({ error: error.message || 'Failed to reframe.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 7: RED-LINE — Suggested changes/edits
// ═══════════════════════════════════════════════════
router.post('/jargon-assassin-redline', async (req, res) => {
  try {
    const { documentText, documentType, userRole, userLanguage } = req.body;
    if (!documentText?.trim()) return res.status(400).json({ error: 'Paste the document to red-line.' });

    const prompt = withLanguage(`Act as a protective advocate for the reader. Generate a red-line markup: specific changes to push for, language to modify, clauses to remove or add. NOT legal advice — but the starting points most people don't know are negotiable.

DOCUMENT TYPE: ${documentType || 'general'}
${userRole ? `USER'S ROLE: "${userRole}" (tenant/employee/patient/buyer/etc.)` : ''}

DOCUMENT:
"${documentText.trim().substring(0, 8000)}"

DISCLAIMER: This is educational guidance, not legal advice.

Return ONLY valid JSON:
{
  "overview": "1-2 sentence summary of the document's fairness from the reader's perspective.",
  "fairness_score": { "score": 1-10, "label": "Very unfair | Unfair | Somewhat unfair | Standard | Fair | Very favorable", "explanation": "Why this score" },
  "redlines": [
    {
      "clause": "The specific clause or language to change",
      "current_text": "What it currently says (simplified)",
      "problem": "Why this is bad for you",
      "suggested_change": "Specific alternative language to propose",
      "priority": "must-change | should-change | nice-to-have",
      "negotiation_tip": "How to frame this request"
    }
  ],
  "add_these": [{ "what": "A clause or protection that's MISSING and should be added", "why": "Why you need this", "suggested_language": "Draft language to propose" }],
  "remove_these": [{ "what": "A clause that should be removed entirely", "why": "Why it's problematic" }],
  "non_negotiable_warning": "Things in this document that are probably not negotiable — save your leverage for what matters.",
  "overall_strategy": "How to approach the negotiation. What to lead with, what to save, what to concede."
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'JargonAssassinRedline', max_tokens: 3500,
      system: withLanguage('Protective document advocate generating red-line edits. Specific, actionable, strategic. Not legal advice — educational guidance. Return ONLY valid JSON. No markdown.', userLanguage) });
    console.log(`[JargonAssassinRedline] ${parsed.redlines?.length || 0} redlines | fairness: ${parsed.fairness_score?.score || '?'}/10`);
    res.json(parsed);
  } catch (error) {
    console.error('[JargonAssassinRedline]', error);
    res.status(500).json({ error: error.message || 'Failed to generate red-line.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 8: TEMPLATE COMPARE — vs. what's normal
// ═══════════════════════════════════════════════════
router.post('/jargon-assassin-template', async (req, res) => {
  try {
    const { documentText, documentType, context, userLanguage } = req.body;
    if (!documentText?.trim()) return res.status(400).json({ error: 'Paste the document to compare against standard.' });

    const prompt = withLanguage(`Compare this document against what's TYPICAL for this type of document. The reader has no baseline — give them one.

DOCUMENT TYPE: ${documentType || 'general'}
${context ? `CONTEXT: "${context}"` : ''}

DOCUMENT:
"${documentText.trim().substring(0, 8000)}"

Tell the reader what's normal, what's unusual, what's generous, and what's aggressive compared to standard documents of this type.

Return ONLY valid JSON:
{
  "overall_assessment": "Is this a standard/fair/aggressive/generous document of this type? 1-2 sentences.",
  "normal_score": { "score": 1-10, "label": "Very aggressive | Aggressive | Slightly aggressive | Standard | Slightly favorable | Favorable | Very favorable" },
  "comparisons": [
    {
      "clause_area": "What area this covers (rent increases, termination, liability, etc.)",
      "this_document": "What this document says (simplified)",
      "typical_range": "What's normal for this type of document",
      "verdict": "standard | better_than_usual | worse_than_usual | unusual | red_flag",
      "context": "Why this matters — what the typical range means practically"
    }
  ],
  "missing_protections": ["Standard protections that are MISSING from this document — things you'd normally expect to see"],
  "unusually_good": ["Things in this document that are actually better than typical — give credit"],
  "bottom_line": "Warm, direct assessment. Is this a fair document? Should they sign? What should they push on?"
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'JargonAssassinTemplate', max_tokens: 3000,
      system: withLanguage('Document standards expert. Compare against typical documents of this type. Give readers a baseline. Fair, specific, protective. Return ONLY valid JSON. No markdown.', userLanguage) });
    console.log(`[JargonAssassinTemplate] ${documentType} | score: ${parsed.normal_score?.score || '?'}/10 | ${parsed.comparisons?.length || 0} comparisons`);
    res.json(parsed);
  } catch (error) {
    console.error('[JargonAssassinTemplate]', error);
    res.status(500).json({ error: error.message || 'Failed to compare against template.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 9: ACTION PLAN — What to do now
// ═══════════════════════════════════════════════════
router.post('/jargon-assassin-action-plan', async (req, res) => {
  try {
    const { documentText, documentType, translationSummary, keySections, userSituation, userLanguage } = req.body;
    if (!documentText?.trim() && !translationSummary?.trim()) return res.status(400).json({ error: 'Need document context for action plan.' });

    const prompt = withLanguage(`Generate a concrete, ordered action plan for the reader. Turn document understanding into specific steps.

DOC TYPE: ${documentType || 'general'}
DOCUMENT/SUMMARY: "${(translationSummary || documentText || '').substring(0, 5000)}"
${keySections ? `KEY SECTIONS: ${JSON.stringify(keySections).substring(0, 2000)}` : ''}
${userSituation ? `SITUATION: "${userSituation}"` : ''}

Create a step-by-step action plan with deadlines pulled from the document where applicable.

Return ONLY valid JSON:
{
  "summary": "One sentence: what the reader needs to do.",
  "steps": [
    {
      "order": 1,
      "action": "Specific action to take",
      "why": "Why this step matters",
      "deadline": "Deadline from the document, or 'as soon as possible', or 'before signing'",
      "how": "Practical guidance on executing this step",
      "who": "Who to contact or involve, if anyone",
      "template": "A script/template for this step if it involves communication. null if not applicable."
    }
  ],
  "if_you_do_nothing": "What happens if the reader takes no action. Be specific about consequences.",
  "quick_wins": ["Things they can do in under 5 minutes that improve their position"],
  "timeline": "Overall timeline — when do they need to have everything done by?",
  "cost_estimate": "If there are costs involved (lawyer fees, deposits, etc.), estimate them. null if no costs."
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'JargonAssassinActionPlan', max_tokens: 2500,
      system: withLanguage('Action plan generator. Turn document understanding into specific ordered steps. Practical, clear, deadline-aware. Return ONLY valid JSON. No markdown.', userLanguage) });
    console.log(`[JargonAssassinActionPlan] ${parsed.steps?.length || 0} steps | deadline: ${parsed.timeline || '?'}`);
    res.json(parsed);
  } catch (error) {
    console.error('[JargonAssassinActionPlan]', error);
    res.status(500).json({ error: error.message || 'Failed to generate action plan.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 10: DOSSIER — Cross-reference multiple docs
// ═══════════════════════════════════════════════════
router.post('/jargon-assassin-dossier', async (req, res) => {
  try {
    const { documents, userLanguage } = req.body;
    if (!documents?.length || documents.length < 2) return res.status(400).json({ error: 'Need at least 2 documents to cross-reference.' });

    const docsText = documents.map((d, i) => `[DOCUMENT ${i + 1}: ${d.title || 'Untitled'} (${d.type || 'general'})]\n"${(d.text || '').substring(0, 3000)}"`).join('\n\n');

    const prompt = withLanguage(`Cross-reference multiple related documents. Find conflicts, dependencies, gaps, and interactions between them.

${documents.length} DOCUMENTS:
${docsText}

Return ONLY valid JSON:
{
  "relationship": "How these documents relate to each other. 1-2 sentences.",
  "conflicts": [{ "doc1": "Document 1 name/number", "doc2": "Document 2 name/number", "conflict": "What contradicts", "which_wins": "Which document takes precedence, if determinable", "risk": "What this means for you" }],
  "dependencies": [{ "from": "Document that references", "to": "Document being referenced", "what": "What's referenced", "implication": "What this means" }],
  "gaps": ["Important things NOT covered by any of these documents — missing protections"],
  "interactions": [{ "documents": "Which docs interact", "how": "How they work together", "watch_out": "What to be careful about" }],
  "combined_checklist": ["Things to verify considering ALL documents together"],
  "overall": "Overall assessment of this document package. Is the reader well-protected?"
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'JargonAssassinDossier', max_tokens: 3000,
      system: withLanguage('Multi-document cross-reference analyst. Find conflicts, gaps, dependencies. Protective. Return ONLY valid JSON. No markdown.', userLanguage) });
    console.log(`[JargonAssassinDossier] ${documents.length} docs | conflicts: ${parsed.conflicts?.length || 0} | gaps: ${parsed.gaps?.length || 0}`);
    res.json(parsed);
  } catch (error) {
    console.error('[JargonAssassinDossier]', error);
    res.status(500).json({ error: error.message || 'Failed to cross-reference.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 11: LETTER — Generate response letter
// ═══════════════════════════════════════════════════
router.post('/jargon-assassin-letter', async (req, res) => {
  try {
    const { documentText, documentType, intent, specificPoints, tone, userLanguage } = req.body;
    if (!intent?.trim()) return res.status(400).json({ error: 'What do you want to say? (dispute, accept, negotiate, etc.)' });

    const prompt = withLanguage(`Generate a professional response letter based on a document the user received. They want to ${intent.trim()}.

DOCUMENT RECEIVED (type: ${documentType || 'general'}):
"${(documentText || '').substring(0, 5000)}"

INTENT: "${intent.trim()}"
${specificPoints ? `SPECIFIC POINTS: "${specificPoints}"` : ''}
TONE: ${tone || 'professional but firm'}

Write a letter that's clear, professional, and references specific clauses/points from the document.

Return ONLY valid JSON:
{
  "letter": "The full response letter. Professional, clear, references specific document points.",
  "subject_line": "Email subject line if sending by email.",
  "send_to": "Who this should be addressed to (based on document type).",
  "send_via": "Recommended method: email | certified mail | in person | through lawyer",
  "timing": "When to send this — immediately? Before a deadline? After consulting someone?",
  "keep_record": "What to save/document for your records.",
  "escalation": "If this doesn't work, what's the next step?",
  "warnings": ["Things to be careful about when sending this — potential consequences or considerations"]
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'JargonAssassinLetter', max_tokens: 2500,
      system: withLanguage('Professional letter writer. Draft responses to documents that are clear, firm, and reference specifics. Protective of the reader. Return ONLY valid JSON. No markdown.', userLanguage) });
    console.log(`[JargonAssassinLetter] intent: ${intent?.substring(0, 30)} | via: ${parsed.send_via || '?'}`);
    res.json(parsed);
  } catch (error) {
    console.error('[JargonAssassinLetter]', error);
    res.status(500).json({ error: error.message || 'Failed to generate letter.' });
  }
});

module.exports = router;
