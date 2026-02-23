const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse } = require('../lib/claude');

router.post('/plaintalk', async (req, res) => {
  try {
    const { text, textType, context, pdfBase64, readingLevel } = req.body;

    if (!text && !pdfBase64) {
      return res.status(400).json({ error: 'Please provide text or upload a PDF' });
    }

    const readingLevelInstructions = {
      '5th': 'Target reading level: 5th grade. Use the simplest possible words. Maximum 10-12 words per sentence. Explain every concept as if to a child.',
      '8th': 'Target reading level: 8th grade. Use clear everyday language. Maximum 15 words per sentence. Define any term a typical teenager might not know.',
      'high_school': 'Target reading level: high school. Standard plain English. Maximum 20 words per sentence. Define specialized terms on first use.',
      'professional': 'Target reading level: professional simplified. Keep nuance and precision but eliminate unnecessary jargon. Replace legalese with plain equivalents. OK to be more detailed.',
    };

    // Build multi-modal content blocks
    const contentBlocks = [];

    if (pdfBase64) {
      const commaIndex = pdfBase64.indexOf(',');
      const rawBase64 = commaIndex !== -1 ? pdfBase64.substring(commaIndex + 1) : pdfBase64;
      const sizeKB = Math.round((rawBase64.length * 0.75) / 1024);
      console.log(`[PlainTalk] PDF received: ${sizeKB}KB`);

      contentBlocks.push({
        type: 'document',
        source: {
          type: 'base64',
          media_type: 'application/pdf',
          data: rawBase64
        }
      });
      contentBlocks.push({
        type: 'text',
        text: 'The document above is the text to analyze. Read it in its entirety.'
      });
    }

    const prompt = `You are PlainTalk, an expert text analyst who does two things no simple translator can:

1. TRANSLATE complex text into plain English that anyone can understand
2. X-RAY the structure underneath — revealing how the text is built and what it's really doing

You adapt your analysis to whatever type of text you receive. You are not adversarial by default — most complex text isn't trying to deceive anyone, it's written for an audience with specialized knowledge. Your job is to bridge that knowledge gap.

TEXT TYPE: ${textType || 'auto-detect'}
${context ? `USER'S QUESTION: ${context}` : ''}
${readingLevel && readingLevelInstructions[readingLevel] ? `READING LEVEL: ${readingLevelInstructions[readingLevel]}` : ''}

${text ? `TEXT TO ANALYZE:\n"""\n${text}\n"""` : 'The text to analyze was provided as a PDF above. Analyze its full contents.'}

═══════════════════════════════════════════════
ANALYSIS REQUIREMENTS
═══════════════════════════════════════════════

STEP 1 — DETECT TEXT TYPE
Classify the text into one of these categories:
- legal (contracts, agreements, terms of service, policies, regulations)
- medical (consent forms, lab results, clinical notes, drug information, diagnoses)
- academic (research papers, journal articles, dissertations, textbook chapters)
- literary (fiction, poetry, essays, creative nonfiction, criticism)
- financial (statements, prospectuses, tax documents, loan agreements, investment reports)
- technical (manuals, specifications, API docs, engineering reports, patents)
- government (forms, regulations, legislation, public notices, benefits documentation)
- business (memos, reports, proposals, strategy documents, press releases)
- persuasive (speeches, op-eds, marketing copy, fundraising letters, manifestos)
- general (anything that doesn't fit the above)

STEP 2 — PLAIN-LANGUAGE TRANSLATION
- Preserve ALL factual content — omit nothing important
- Replace jargon and domain-specific terms with common words
- Break long sentences into short ones (max 15-20 words)
- Convert passive voice to active where it improves clarity
- Define technical terms that MUST remain (in parentheses on first use)
- Use concrete examples for abstract concepts
- Match the translation length roughly to the original — don't balloon or truncate significantly

STEP 3 — STRUCTURAL X-RAY (adapt focus to text type)

For LEGAL / FINANCIAL text:
- What each section is functionally doing (granting rights, imposing obligations, limiting liability, etc.)
- Your obligations vs. their obligations — extracted and listed separately
- Asymmetries in rights, obligations, or remedies
- Internal contradictions or tensions between sections
- What's boilerplate vs. what's substantive/unusual
- Exit and termination provisions

For ACADEMIC text:
- The core argument or finding in one sentence
- The logical chain: premise → evidence → conclusion
- Assumptions the paper makes (stated and unstated)
- Where evidence is strong vs. where the author is speculating
- What's actually proven vs. what's implied

For LITERARY text:
- What each scene/section is accomplishing narratively
- Themes being developed and how
- Subtext in dialogue — what characters mean vs. what they say
- Narrative techniques being used (foreshadowing, irony, unreliable narration, symbolism)
- Structural purpose — why this chapter/passage exists in the larger work
- Tone shifts and their significance

For PERSUASIVE text:
- The core ask or thesis
- Rhetorical strategies being employed (emotional appeal, authority, scarcity, social proof, etc.)
- What's stated as fact vs. what's opinion vs. what's emotional framing
- What's left unsaid or conspicuously absent
- Who the intended audience is and how the text is calibrated to them

For TECHNICAL text:
- Core concept or purpose in one sentence
- Logical dependencies — what you need to understand first
- Essential information vs. reference material you can skip on first read
- Where precision matters vs. where there's flexibility

For MEDICAL text:
- What's happening / what this means for you in plain terms
- What you're being asked to consent to or decide
- Risks explained with actual context (frequency, severity, alternatives)
- What questions this should prompt you to ask your provider

For GOVERNMENT / BUSINESS / GENERAL text:
- Use the structural analysis approach that best fits the content
- Focus on: purpose, key information, required actions, and what matters most

STEP 4 — SMART ROUTING
Based on the detected text type, identify which specialist tool (if any) could provide deeper analysis. Only suggest a tool if it's genuinely relevant.

Available specialist tools:
- LeaseTrapDetector: rental/lease agreements (legal analysis, tenant rights, negotiation scripts)
- FinePointFinder: terms of service, sign-up agreements, subscription contracts (trap hunting)
- InsuranceClaimCoach: insurance policies, EOBs, claim documents (filing strategy, coverage language)
- MedicalBillNegotiator: medical bills, hospital charges (error detection, negotiation scripts)
- SecondOpinionPrep: medical diagnoses, treatment plans (questions to ask, records to request)
- OfferDissector: job offers, compensation packages (total comp breakdown)
- MapTheArgument: op-eds, speeches, persuasive essays (logical structure mapping)
- MethodologyBullshitDetector: research papers, studies (methodology stress-testing)
- RuleBookTranslator: regulations, compliance documents (actionable rule extraction)
- BureaucracyBuster: government forms, institutional processes (step-by-step navigation)
- ComplaintEscalationWriter: situations requiring formal complaints (letter generation)
- RightsCheck: situations where rights may have been violated (rights identification)

═══════════════════════════════════════════════
OUTPUT FORMAT
═══════════════════════════════════════════════

Return ONLY valid JSON (no markdown, no preamble):

{
  "detected_type": "legal | medical | academic | literary | financial | technical | government | business | persuasive | general",
  "detected_type_label": "Human-readable label, e.g. 'Legal Contract', 'Literary Fiction', 'Academic Research Paper'",
  "confidence": "high | medium | low",

  "the_core": "1-3 sentences: the single most important thing this text is saying, asking, or doing. Not a summary — the core purpose or thesis. Written as if answering 'What is this, in 10 seconds?'",

  "summary": "3-5 sentence summary covering: what this text is, who it's written for, and what the reader needs to take away",

  "translation": "The complete plain-language rendering of the full text. Roughly the same length as the original — every important idea preserved, all jargon replaced, all complex sentences simplified. This is a translation, not a summary.",

  "structural_xray": {
    "sections": [
      {
        "title": "Descriptive title for this section",
        "original_location": "Where this appears, e.g. 'Paragraphs 1-3', 'Section 4', 'Opening scene'",
        "purpose": "What this section is DOING — its functional role",
        "importance": "essential | important | context | boilerplate",
        "key_content": "Critical information in this section, in plain language",
        "notes": "Observations — contradictions, unusual language, things to pay attention to. Null if nothing notable."
      }
    ],
    "architecture_summary": "2-3 sentences: how the text is structured overall — its logic, flow, or narrative arc"
  },

  "obligations_and_commitments": {
    "applicable": true,
    "yours": ["Things YOU are agreeing to, committing to, or expected to do"],
    "theirs": ["Things THEY are committing to or promising"],
    "asymmetry_notes": "Notable imbalance between what you give and what you get — null if balanced or N/A",
    "decisions_required": ["Decisions you need to make based on this text"],
    "deadlines": ["Dates, timeframes, or windows mentioned"]
  },

  "narrative_analysis": {
    "applicable": true,
    "themes": ["Themes being developed"],
    "techniques": [{ "technique": "Name", "example": "Where/how it appears", "effect": "What it accomplishes" }],
    "subtext": [{ "surface": "What is said/written", "underneath": "What it means or implies" }],
    "structural_purpose": "Why this passage/chapter exists — what it sets up, resolves, or develops"
  },

  "argument_analysis": {
    "applicable": true,
    "core_thesis": "The central claim or argument",
    "premises": ["Stated premises or assumptions"],
    "hidden_assumptions": ["Unstated assumptions the argument depends on"],
    "evidence_quality": [{ "claim": "", "evidence": "", "strength": "strong | moderate | weak | unsupported" }],
    "rhetorical_strategies": ["Persuasion techniques being used"],
    "what_is_missing": ["Important counterarguments, context, or caveats that are absent"]
  },

  "glossary": [
    {
      "term": "Technical or domain-specific term",
      "definition": "Plain-English definition",
      "context": "How this term is used specifically in THIS text"
    }
  ],

  "what_matters_most": [
    "The 3-5 most important things the reader should focus on, take away, or act on — prioritized"
  ],

  "internal_contradictions": [
    {
      "section_a": "Where the first statement appears",
      "says_a": "What it says",
      "section_b": "Where the contradicting statement appears",
      "says_b": "What it says",
      "implication": "Why this matters"
    }
  ],

  "reading_level": {
    "original": "Estimated grade level of original, e.g. '14th grade / college senior'",
    "translated": "Grade level of translation (target: 5th-6th grade)"
  },

  "tool_suggestion": {
    "suggested": true,
    "tool_id": "ToolId or null",
    "tool_name": "Tool Name or null",
    "reason": "One sentence: why this specialist tool would help — or null"
  }
}

═══════════════════════════════════════════════
CRITICAL RULES
═══════════════════════════════════════════════

1. ADAPTIVE ANALYSIS: Set "applicable" to true ONLY for analysis sections relevant to the text type. A legal contract needs obligations (applicable=true) but not narrative_analysis (applicable=false). A novel chapter is the reverse. A persuasive speech might have both argument_analysis and narrative_analysis applicable. When applicable is false, return that section as: { "applicable": false }

2. RESPECT THE TEXT: Do not assume adversarial intent unless the text demonstrates it. Technical jargon is usually precision, not obfuscation. Academic density is usually thoroughness, not gatekeeping. Only flag something as deliberately obscuring if there's real evidence.

3. TRANSLATION COMPLETENESS: The translation must cover the FULL text, not just highlights. If the original is long, the translation should be comparably long.

4. STRUCTURAL HONESTY: If a section is genuinely boilerplate or standard, say so. Don't manufacture concerns. If the text is well-written and fair, say that too.

5. TOOL SUGGESTIONS: Only suggest a specialist tool when it would genuinely add value. If the text is a recipe, a personal email, or a simple memo — tool_suggestion.suggested should be false.

6. Return ONLY the JSON object. No preamble, no markdown fences, no explanation outside the JSON.`;

    contentBlocks.push({ type: 'text', text: prompt });

    console.log(`[PlainTalk] Sending ${contentBlocks.length} content blocks (PDF: ${!!pdfBase64}, text: ${!!text}, type: ${textType || 'auto'})`);

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8000,
      messages: [{ role: 'user', content: contentBlocks }]
    });

    const textContent = message.content.find(item => item.type === 'text')?.text || '';
    console.log(`[PlainTalk] Response: ${textContent.length} chars`);

    const cleaned = cleanJsonResponse(textContent);
    const parsed = JSON.parse(cleaned);

    console.log(`[PlainTalk] Type: ${parsed.detected_type}, Sections: ${parsed.structural_xray?.sections?.length || 0}, Tool suggestion: ${parsed.tool_suggestion?.tool_id || 'none'}`);
    res.json(parsed);

  } catch (error) {
    console.error('[PlainTalk] Error:', error);

    if (error instanceof SyntaxError) {
      console.error('[PlainTalk] JSON Parse Error:', error.message);
    }

    res.status(500).json({
      error: error.message || 'Failed to analyze text'
    });
  }
});

module.exports = router;
