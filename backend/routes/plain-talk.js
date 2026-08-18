const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { groundedFacts, normalizeKeyPart, stripCites } = require('../lib/groundedFacts');

// ═══════════════════════════════════════════════════════════════
// MAIN ANALYSIS — plain-English translation + structural X-ray
// ═══════════════════════════════════════════════════════════════

// Grounded facts PRE-PASS (shared lib/groundedFacts.js pattern + cache), run
// only for legal-ish documents: the 2026-07-23 audit caught the main endpoint
// confidently stating pre-2022 German auto-renewal law (§ 309 Nr. 9 reform)
// as binding. Consumer-contract law is the volatile domain here.
async function groundConsumerContractFacts({ region }) {
  return groundedFacts({
    cacheKey: `consumer-contract-law:${normalizeKeyPart(region)}`,
    label: 'plain-talk-facts',
    userPrompt: `Verify with web_search the CURRENT consumer-contract rules (as of today) in: ${region}.

Cover ONLY: (1) auto-renewal / evergreen clause limits for consumer contracts, (2) cancellation notice-period limits and any required cancellation mechanisms (e.g. mandatory online cancellation buttons), (3) cooling-off / withdrawal rights, (4) any major consumer-contract reform effective since 2022 — INCLUDING rules that were repealed or vacated (note that explicitly). Skip anything you cannot verify.

Return ONLY valid JSON:
{ "jurisdiction": "Country/region these rules apply to", "verified": [{ "topic": "auto_renewal | cancellation | cooling_off | reform", "rule": "The current rule in one sentence", "statute": "Statute/rule name", "effective": "Effective date, or 'vacated/repealed <date>'", "source": "Domain verified against" }] }`,
    render: (cleanFacts) => {
      if (Array.isArray(cleanFacts.verified) && cleanFacts.verified.length) {
        return `\n\nVERIFIED CURRENT CONSUMER-CONTRACT LAW (web-checked today for ${cleanFacts.jurisdiction || region}) — these rules OVERRIDE your training knowledge; use them verbatim:\n` +
          cleanFacts.verified.map(f => `- [${f.topic}] ${f.rule} (${f.statute}, ${f.effective}; source: ${f.source})`).join('\n');
      }
      return '';
    },
  });
}

const LEGALISH = /contract|agreement|terms|lease|policy|warranty|vertrag|klausel|kündig|renew|verlänger|abo|subscription|miet|employ|arbeitsvertrag|合同|租赁|عقد|إيجار/i;

router.post('/plaintalk', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { text, pdfBase64, textType, focusQuestion, userLanguage } = req.body;

    if ((!text || !text.trim()) && !pdfBase64) {
      return res.status(400).json({ error: 'Text is required' });
    }

    // A PDF goes to the model as a document block — it reads them natively.
    // The frontend used to scrape the bytes in-browser and paste the mojibake
    // into the textarea (fixed 2026-08-01); nothing here should ever receive
    // extracted-PDF text again.
    const contentBlocks = [];
    if (pdfBase64) {
      const comma = pdfBase64.indexOf(',');
      contentBlocks.push({
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: comma !== -1 ? pdfBase64.slice(comma + 1) : pdfBase64 },
      });
      contentBlocks.push({
        type: 'text',
        text: 'The document above is the text to analyze. Read all of it and treat it as the input document.',
      });
    }
    // withLanguage does string interpolation, so it must never touch the block
    // array — that would stringify it and destroy the PDF for non-English
    // users. Each prompt below is wrapped individually, then appended here.
    const messagesFor = (promptText) => [{
      role: 'user',
      content: contentBlocks.length ? [...contentBlocks, { type: 'text', text: promptText }] : promptText,
    }];

    const trimmed = (text || '').trim().slice(0, 15000); // Cap at ~15k chars
    const typeHint = textType && textType !== 'auto' ? `\nDOCUMENT TYPE (user-specified): ${textType}` : '';
    const focusHint = focusQuestion ? `\nUSER'S SPECIFIC QUESTION: "${focusQuestion}"` : '';

    const isLegalish = LEGALISH.test(textType || '') || LEGALISH.test(trimmed.slice(0, 4000));
    const factsBlock = isLegalish
      ? await groundConsumerContractFacts({ region: req.body.userRegion || req.body.userLocale || 'US' })
      : '';
    const legalHint = isLegalish
      ? `\n${factsBlock}\nLEGAL CURRENCY: contract law changed in several jurisdictions after 2022 (auto-renewal, cancellation rights). For any legal claim not covered by a VERIFIED block above, state the rule's effective date if you know it, or advise the reader to verify the current rule — never present remembered law as settled.`
      : '';

    // Parallel split (latency): the mega-schema single call generated ~12k
    // output tokens serially (EN cold 218s). Split into two calls with
    // DISJOINT top-level keys — "sections" (carries the whole document,
    // verbatim + translation) vs everything else — run via Promise.all and
    // merged back into the ORIGINAL response shape. Frontend unchanged.
    // The document itself is what makes this half expensive — it is carried
    // twice, verbatim and translated. For a long document that is unbounded, so
    // a long one is cut at a paragraph boundary near its midpoint and the two
    // pieces are translated in parallel. Each call sees only its own piece, so
    // "every sentence appears in exactly one section" survives by construction;
    // the merge concatenates in order and renumbers the ids.
    const SPLIT_MIN_CHARS = 3000;
    function documentHalves(doc) {
      if (!doc || doc.length < SPLIT_MIN_CHARS) return null;
      const paras = doc.split(/\n\s*\n/).filter(x => x.trim());
      if (paras.length < 2) return null;
      const target = doc.length / 2;
      let run = 0, cut = 1, best = Infinity;
      for (let i = 0; i < paras.length - 1; i++) {
        run += paras[i].length + 2;
        const dist = Math.abs(run - target);
        if (dist < best) { best = dist; cut = i + 1; }
      }
      return [paras.slice(0, cut).join('\n\n'), paras.slice(cut).join('\n\n')];
    }
    const halves = contentBlocks.length ? null : documentHalves(trimmed);

    const sectionsPrompt = (docText, partNote) => withLanguage(`You are PlainTalk, a universal text comprehension expert. Your job: take complex text and make it completely understandable.

ANALYZE THIS TEXT:
${docText ? `---\n${docText}\n---` : 'The document is attached above as a PDF. Read it in full and analyze its contents.'}${partNote}
${typeHint}${focusHint}${legalHint}

INSTRUCTIONS:

1. AUTO-DETECT the text type if not specified. Categories: legal, medical, academic, financial, technical, literary, political, bureaucratic, scientific, general.

2. Produce the complete section-by-section plain-language translation:

Return ONLY valid JSON (no markdown, no code fences, no preamble):

{
  "sections": [
    {
      "id": "sec_1",
      "original": "The exact original text of this section (preserve verbatim)",
      "translation": "Plain-English translation of this section — clear, conversational, no jargon",
      "title": "Short descriptive title for this section",
      "purpose": "What this section is DOING in the document (e.g., 'Limits your ability to sue', 'Establishes the payment schedule')",
      "importance": "high|medium|low",
      "flags": ["At most 2, and only when genuinely notable — a red flag, an asymmetry, or a term that costs the reader something. Omit the array entirely when a section is routine."]
    }
  ]
}

CRITICAL RULES:
- Your response MUST contain ALL 1 keys: sections.
- "sections" MUST cover the ENTIRE text you were given (and only that text) — break it into logical chunks of 1-3 paragraphs each. Every sentence of the original must appear in exactly one section.
- "original" in each section must be VERBATIM from the input text — do not paraphrase. ONE permitted deviation: replace any double-quote characters from the source with single quotes (') so the JSON stays valid.
- "translation" must be genuinely plain — imagine explaining to a smart 14-year-old
- "importance" should be "high" for anything that creates obligations, costs, risks, or deadlines
- If the text is literary/creative, adapt: "purpose" becomes narrative function, "flags" becomes literary devices
- For medical text: flag anything requiring patient action, consent implications, or risk disclosures.
- For legal text: explicitly note any asymmetric obligations (one party has more rights/fewer obligations).
- For financial text: identify who bears risk, what fees are hidden, and what the total cost of compliance is
- Be thorough but never pad — only include what's genuinely useful
- LIMITS: at most 12 sections. Keep short fields to one concise sentence; section "original" and "translation" are the exception — they carry the actual document and must stay complete.
- Recompute any sum, total, or multiplication you state (e.g. monthly cost × months) from its parts before writing it — stated numbers must reconcile with each other and with the document.
- Never place a double-quote (") character inside any JSON string value — paraphrase quoted phrases or use single quotes; a literal " breaks the JSON.`, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

    // The analysis half was itself the floor once grounding came off the
    // critical path (59s on a 621-character fixture). Split again: what the
    // document IS and what it means for the reader, vs how it is built and what
    // its jargon means. Disjoint keys, merged back to the original shape.
    const promptSummary = withLanguage(`You are PlainTalk, a universal text comprehension expert. Your job: take complex text and make it completely understandable.

ANALYZE THIS TEXT:
${trimmed ? `---\n${trimmed}\n---` : 'The document is attached above as a PDF. Read it in full and analyze its contents.'}
${typeHint}${focusHint}${legalHint}

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
  "specialist_suggestion": {
    "tool": "OfferDissector|DoctorVisitTranslator|BillGuiltEraser|ComplaintEscalationWriter|null",
    "reason": "Why this specialist tool would help with this specific text, or null if none applies"
  }
}

CRITICAL RULES:
- Your response MUST contain ALL 6 keys: detected_type, detected_type_label, confidence, reading_level, overview, specialist_suggestion.
- "overview" is the part the reader acts on — put the real answer to their question in "what_matters_to_you".
- If the text is literary/creative, adapt: "persuasion_techniques" becomes style/voice analysis
- For medical text: flag anything requiring patient action, consent implications, or risk disclosures. "urgency" should reflect how quickly the reader needs medical attention or follow-up.
- For legal text: explicitly note any asymmetric obligations (one party has more rights/fewer obligations). "vs_standard" should compare clauses to typical industry practice. "negotiable_items" should list clauses commonly pushed back on.
- For financial text: identify who bears risk, what fees are hidden, and what the total cost of compliance is
- Be thorough but never pad — only include what's genuinely useful
- LIMITS: keep every short field to ONE concise sentence. This half no longer shares a token budget with the rest of the report, and without that discipline it runs long and truncates, which 500s the whole tool.
- Recompute any sum, total, or multiplication you state (e.g. monthly cost × months) from its parts before writing it — stated numbers must reconcile with each other and with the document.
- Never place a double-quote (") character inside any JSON string value — paraphrase quoted phrases or use single quotes; a literal " breaks the JSON.
- Another analyst is writing the rest of the report — return ONLY your own keys.`, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

    const promptStructure = withLanguage(`You are PlainTalk, a universal text comprehension expert. Your job: take complex text and make it completely understandable.

ANALYZE THIS TEXT:
${trimmed ? `---\n${trimmed}\n---` : 'The document is attached above as a PDF. Read it in full and analyze its contents.'}
${typeHint}${focusHint}${legalHint}

INSTRUCTIONS:

1. AUTO-DETECT the text type if not specified. Categories: legal, medical, academic, financial, technical, literary, political, bureaucratic, scientific, general.

2. Produce a complete analysis with these sections:

Return ONLY valid JSON (no markdown, no code fences, no preamble):

{
  "structure": {
    "architecture": "How the overall text is organized and why (e.g., 'Standard employment contract: definitions → terms → restrictions → termination')",
    "persuasion_techniques": ["Any rhetorical, legal, or structural techniques used to influence the reader"],
    "what_they_buried": "Anything important that was placed in a non-obvious location or wrapped in complex language",
    "internal_contradictions": ["Any places where the text contradicts itself or creates ambiguity"]
  },
  "type_insights": {
    "type": "Matches detected_type — legal|medical|academic|financial|technical|literary|political|bureaucratic|scientific|general",
    "power_analysis": "FOR LEGAL/FINANCIAL: Who has more power in this document? Map obligations: YOUR obligations vs THEIR obligations. Note any asymmetries where one party has more rights or fewer obligations than the other. FOR MEDICAL: What is the urgency level — routine monitoring, needs action within weeks, or urgent? FOR ACADEMIC: What is the confidence level of the claims? FOR OTHER: null",
    "vs_standard": "How does this compare to standard/typical documents of this type? What is unusually strict, generous, vague, or missing compared to what you'd normally see?",
    "negotiable_items": ["FOR LEGAL/FINANCIAL: Clauses that are commonly negotiated or pushed back on in this type of document"],
    "urgency": "none|low|medium|high|critical — how quickly does the reader need to act?"
  },
  "jargon_glossary": [
    { "term": "force majeure", "definition": "Events outside anyone's control (natural disasters, wars) that excuse not fulfilling the contract" }
  ]
}

CRITICAL RULES:
- Your response MUST contain ALL 3 keys: structure, type_insights, jargon_glossary.
- "type_insights" must ALWAYS be populated — adapt the fields to the document type. This is the most valuable section for the reader.
- "jargon_glossary" should include 5-12 domain-specific terms used in the text (at most 12), each definition ONE short sentence under 15 words. A 3000-token budget truncated this call outright in German, which 500s the whole tool — brevity here is a hard requirement, not a preference.
- If the text is literary/creative, adapt: "persuasion_techniques" becomes style/voice analysis
- For medical text: flag anything requiring patient action, consent implications, or risk disclosures. "urgency" should reflect how quickly the reader needs medical attention or follow-up.
- For legal text: explicitly note any asymmetric obligations (one party has more rights/fewer obligations). "vs_standard" should compare clauses to typical industry practice. "negotiable_items" should list clauses commonly pushed back on.
- For financial text: identify who bears risk, what fees are hidden, and what the total cost of compliance is
- Be thorough but never pad — only include what's genuinely useful
- LIMITS: keep every short field to ONE concise sentence. This half no longer shares a token budget with the rest of the report, and without that discipline it runs long and truncates, which 500s the whole tool.
- Recompute any sum, total, or multiplication you state (e.g. monthly cost × months) from its parts before writing it — stated numbers must reconcile with each other and with the document.
- Never place a double-quote (") character inside any JSON string value — paraphrase quoted phrases or use single quotes; a literal " breaks the JSON.
- Another analyst is writing the rest of the report — return ONLY your own keys.`, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

    // Every call runs concurrently, so the wall-clock is the slowest one rather
    // than the sum. max_tokens is per call: the sections budget follows how much
    // document each call actually carries.
    const PART_1 = '\n\nTHIS IS PART 1 OF 2 of a longer document. The text above is your part in full — analyze only it, do not summarize or reference the rest, and do not add an introduction or conclusion about the whole document.';
    const PART_2 = '\n\nTHIS IS PART 2 OF 2 of a longer document. The text above is your part in full — analyze only it, do not summarize or reference the rest, and do not add an introduction or conclusion about the whole document.';

    const sectionCalls = halves
      ? [
          { prompt: sectionsPrompt(halves[0], PART_1), tokens: 5000, label: 'plain-talk-sections-1' },
          { prompt: sectionsPrompt(halves[1], PART_2), tokens: 5000, label: 'plain-talk-sections-2' },
        ]
      : [{ prompt: sectionsPrompt(trimmed, ''), tokens: 7500, label: 'plain-talk' }];

    const results = await Promise.all([
      ...sectionCalls.map(c => callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: c.tokens,
        messages: messagesFor(c.prompt)
      }, { label: c.label })),
      callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 3000,
        messages: messagesFor(promptSummary)
      }, { label: 'plain-talk-summary' }),
      callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 4000,
        messages: messagesFor(promptStructure)
      }, { label: 'plain-talk-structure' }),
    ]);
    const sectionParts = results.slice(0, sectionCalls.length);
    const analysisParts = results.slice(sectionCalls.length);

    // Disjoint top-level keys — merge back into the original response shape.
    // sections is the one key more than one call can emit, so it is
    // concatenated in document order and the ids renumbered across the join.
    const parsed = Object.assign({}, ...analysisParts);
    parsed.sections = sectionParts
      .flatMap(part => (Array.isArray(part.sections) ? part.sections : []))
      .map((sec, i) => ({ ...sec, id: `sec_${i + 1}` }));
    // full_translation is no longer model-generated (it fully duplicated the
    // per-section translations, ~tripling output size and hanging real-sized
    // documents — audit 2026-07-19). Sections must cover the entire text, so
    // their translations concatenated ARE the complete translation.
    if (!parsed.full_translation && Array.isArray(parsed.sections)) {
      parsed.full_translation = parsed.sections.map(sec => sec.translation).filter(Boolean).join('\n\n');
    }
    if (!parsed.detected_type) {
      return res.status(500).json({ error: 'Could not simplify this. Please try again.' });
    }
    res.json(stripCites(parsed));

  } catch (error) {
    console.error('[PlainTalk] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to analyze text' });
  }
});

// ═══════════════════════════════════════════════════════════════
// FOLLOW-UP QUESTIONS — ask about specific sections/topics
// ═══════════════════════════════════════════════════════════════

router.post('/plaintalk/followup', rateLimit(DEFAULT_LIMITS), async (req, res) => {
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
  "key_quote": "The most relevant quote from the original text (if applicable)",
  "practical_implication": "What this means for the reader practically — what should they DO or KNOW",
  "follow_up_suggestions": ["Another question they might want to ask", "Another angle to explore"]
}

Never place a double-quote (") character inside any JSON string value (paraphrase the key_quote rather than wrapping it in quote marks) — a literal " breaks the JSON. Write the response language with its full native orthography to the last field (for German: real umlauts/ß, never ae/oe/ue).`, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'plain-talk-2' });
    if (!parsed.answer) {
      return res.status(500).json({ error: 'Could not simplify this. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[PlainTalk/followup] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to answer question' });
  }
});

// ═══════════════════════════════════════════════════════════════
// DOCUMENT COMPARISON — diff two versions of a document
// ═══════════════════════════════════════════════════════════════

router.post('/plaintalk/compare', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { textA, textB, pdfA, pdfB, labelA, labelB, textType, questions, userLanguage } = req.body;

    if ((!textA?.trim() && !pdfA) || (!textB?.trim() && !pdfB)) {
      return res.status(400).json({ error: 'Both documents are required for comparison' });
    }

    const trimA = (textA || '').trim().slice(0, 10000);
    const trimB = (textB || '').trim().slice(0, 10000);

    // Two versions of a real document are usually two PDFs, so each side can
    // arrive as a document block. They are labelled inline because the model
    // otherwise has no way to tell which attachment is the original.
    const strip = (d) => { const i = d.indexOf(','); return i !== -1 ? d.slice(i + 1) : d; };
    const docBlock = (data, label) => ([
      { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: strip(data) } },
      { type: 'text', text: `The document above is ${label}.` },
    ]);
    const compareBlocks = [
      ...(pdfA ? docBlock(pdfA, `DOCUMENT A, the ${labelA || 'original'}`) : []),
      ...(pdfB ? docBlock(pdfB, `DOCUMENT B, the ${labelB || 'revised'} version`) : []),
    ];
    const typeHint = textType && textType !== 'auto' ? `\nDOCUMENT TYPE: ${textType}` : '';

    // What a person actually wants from two versions of a document is not a
    // diff. It is "did they change anything that affects me, and should I
    // care" — so the output leads with the answer, and the raw edits are the
    // last thing rather than the first.
    const FOCUS_BY_TYPE = {
      legal:        'obligations, liability, penalties, deadlines, exit clauses, payment terms',
      financial:    'rates, fees, premiums, coverage, payment schedules',
      medical:      'new findings, changed measurements, new recommendations, new medications, follow-up instructions',
      bureaucratic: 'eligibility, deadlines, documentation requirements',
    };
    const focus = FOCUS_BY_TYPE[textType];
    const focusBlock = focus
      ? `\nWHAT MATTERS IN THIS KIND OF DOCUMENT: ${focus}. Weight those areas above everything else — a change there is worth reporting even when it is small, and a change elsewhere usually is not.`
      : '';

    const asked = Array.isArray(questions) ? questions.filter(q => typeof q === 'string' && q.trim()).slice(0, 8) : [];
    const questionBlock = asked.length
      ? `\nTHE READER ASKED SPECIFICALLY: ${asked.join('; ')}. Answer these first and say so plainly if the answer is no — "nothing about the price changed" is a useful answer, not a missing one.`
      : '';

    const prompt = withLanguage(`You are PlainTalk. Two versions of a document are below. The reader is not asking for a diff — they are asking whether anything changed that affects them, and whether they should care.

${pdfA ? `DOCUMENT A ("${labelA || 'Original'}") is the first attachment above.` : `DOCUMENT A ("${labelA || 'Original'}"):
---
${trimA}
---`}

${pdfB ? `DOCUMENT B ("${labelB || 'Revised'}") is the ${pdfA ? 'second' : 'first'} attachment above.` : `DOCUMENT B ("${labelB || 'Revised'}"):
---
${trimB}
---`}
${typeHint}${focusBlock}${questionBlock}

Separate what matters from what does not. Reordered paragraphs, formatting, and rewording that means the same thing are noise — say so in one line and move on. A changed number, deadline, obligation, or right is the whole point.

Return ONLY valid JSON:

{
  "bottom_line": {
    "should_you_care": "yes | no",
    "explanation": "The direct answer first, then why — 2 to 4 short sentences. Name the single most important change and what the reader should do about it. If nothing consequential changed, say that plainly and stop."
  },
  "key_changes": [
    {
      "id": "chg_1",
      "topic": "Short label for what changed, e.g. Cancellation period",
      "before": "The old value, as short as it can honestly be — 60 days",
      "after": "The new value, same brevity — 30 days",
      "why_it_matters": "One or two sentences on the consequence for the reader, e.g. You now have half as much time to terminate the agreement.",
      "before_full": "The verbatim sentence from Document A this came from",
      "after_full": "The verbatim sentence from Document B this came from"
    }
  ],
  "minor_changes": ["Short phrases naming the changes that do not matter — formatting, reordered paragraphs, rewording with the same meaning"],
  "unchanged_important": ["Important things that did NOT change — worth saying, because a reader scanning for damage will assume the worst"]
}

CRITICAL:
- "should_you_care" must be exactly the English word yes or no, never translated and never a sentence — the interface switches on it.
- key_changes holds ONLY changes with a real consequence. At most 6, most consequential first. If there are none, return an empty array and say so in bottom_line.
- Include quiet rewordings that change meaning while looking cosmetic. Those belong in key_changes, not minor_changes — they are the most valuable thing on the page.
- "before" and "after" are the VALUES that changed, not whole sentences: "60 days" / "30 days", "$500" / "$1,000", "no late fee" / "5% monthly penalty". The full sentences go in before_full and after_full.
- For something added in B, "before" is "not mentioned". For something removed from A, "after" is "removed".
- minor_changes are short phrases, not sentences. At most 6. If there is no cosmetic noise, return an empty array — never a line saying none was found. The section disappears on its own; an entry announcing its own absence is clutter.
- Recompute any sum, total, or percentage you state from its parts before writing it — stated numbers must reconcile with each other.
- Never place a double-quote (") character inside any JSON string value (paraphrase the verbatim excerpts rather than wrapping them in quote marks).`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      // 4000 truncated every DE/AR compare call (15 changes × verbatim
      // text_a/text_b excerpts) — 2026-07-23 audit.
      max_tokens: 6000,
      messages: [{
        role: 'user',
        content: compareBlocks.length ? [...compareBlocks, { type: 'text', text: prompt }] : prompt,
      }],
    }, { label: 'plain-talk-3' });
    // Guard on the always-present field. bottom_line carries the answer; a
    // response without it has nothing to show, whereas key_changes is
    // legitimately empty when nothing consequential changed.
    if (!parsed.bottom_line) {
      return res.status(500).json({ error: 'Could not compare these. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('[PlainTalk/compare] Error:', error);
    res.status(500).json({ error: error.message || 'Failed to compare documents' });
  }
});

module.exports = router;
