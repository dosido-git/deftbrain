const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// Rebrand + CONTRACT rewrite (2026-09-13, owner-supplied): "The Crux" ->
// "Heart of the Matter". The naming-consistency-rule's already-locked
// exception (keep the route/endpoint on a rename) applied for that first
// pass — but a second owner-supplied change the same day explicitly asked
// for the mismatch fixed anyway: route filename `the-crux.js` ->
// `heart-of-the-matter.js`, and all 4 endpoints `/the-crux*` ->
// `/heart-of-the-matter*`. Per the rule's own exception list, the i18n
// filename/prefix (recall.js / rec_) and localStorage keys stay put — a
// re-key would touch every key × 13 languages, and the storage key would
// silently wipe every existing user's saved history, for zero user-facing
// benefit. See audit/RENAMES.md and the golden sample for the full history.
//
// The CONTRACT itself: the old PERSONALITY was "Study coach and memory
// expert... give exam strategy based on how professors actually test" —
// every mode leaned on inferring exam likelihood, professor intent, and
// future lecture content the supplied material never established. The
// replacement is source-first: the supplied material is the only authority
// for content-specific claims, and the model may reorganize/compare/
// generate practice FROM it but must not silently add outside facts,
// predict exams, infer professor intent, invent common mistakes, or
// predict future material. exam_strategy and cumulative_exam_focus are now
// always null/empty by design (the schema says so, and validateResult
// below makes it true even if the model doesn't comply) rather than
// asking the model to guess at exam coverage.
router.outputStandard = 'v2';
router.outputGuard = {
  prohibit: [
    'exam_strategy_not_null',
    'cumulative_exam_focus_not_empty',
    'array_field_exceeds_documented_limit',
    // Prompt-enforced, not code-checkable — see PERSONALITY: a claim not
    // supported by the supplied material, an inferred professor intent or
    // future-lecture prediction, or a practice question framed as an
    // actual exam prediction rather than source-grounded practice.
    'invented_fact_not_supported_by_source',
    'inferred_professor_intent_or_future_content',
    'exam_prediction_disguised_as_practice',
  ],
  require: ['fulfills_tool_promise'],
};

// ════════════════════════════════════════════════════════════
// SHARED
// ════════════════════════════════════════════════════════════
const PERSONALITY = `SOURCE-FIRST LEARNING EDITOR. Help the visitor find the heart of supplied material and work with it intelligently.

The supplied material is the authority for content-specific claims. Do not silently correct, complete, modernize, or expand it from outside knowledge. You may reorganize, compare, explain relationships that follow from the supplied material, and generate practice from it.

Separate what the material actually says from what you generate as a study aid. Never claim to know what a professor will test, what students usually get wrong, how much exam time a topic deserves, what a future lecture will cover, or what a field generally considers important unless the supplied material explicitly establishes it.

When the source is incomplete, ambiguous, internally inconsistent, or does not support a requested conclusion, preserve that limitation rather than filling the gap.

NORTH STAR: FIND WHAT MATTERS IN THE MATERIAL. DO NOT INVENT WHAT ISN'T THERE.`;

// Structural sanitization only — the PERSONALITY's source-grounding
// discipline (no invented facts, no professor-intent inference, no exam
// prediction) is prompt-enforced, not code-checkable. This pins what code
// CAN guarantee regardless of what the model does: exam_strategy and
// cumulative_exam_focus are always null/empty (the schema already asks for
// this; this makes it true even if the model slips), and every array field
// stays within the limit already stated in its own prompt. Returns null on
// a missing required field, which each route turns into a 500.
function capArray(arr, max) {
  return Array.isArray(arr) ? arr.slice(0, max) : [];
}

function validateResult(kind, parsed) {
  if (kind === 'distill') {
    if (!parsed?.lecture_summary) return null;
    return {
      ...parsed,
      bullets: Array.isArray(parsed.bullets) ? parsed.bullets : [],
      vocabulary: capArray(parsed.vocabulary, 8),
      connections: capArray(parsed.connections, 4),
      professor_signals: capArray(parsed.professor_signals, 5),
      gaps: capArray(parsed.gaps, 4),
    };
  }
  if (kind === 'study_guide') {
    if (!parsed?.title) return null;
    return {
      ...parsed,
      concepts_to_know: capArray(parsed.concepts_to_know, 8),
      key_definitions: capArray(parsed.key_definitions, 10),
      processes_and_formulas: capArray(parsed.processes_and_formulas, 6),
      relationships: capArray(parsed.relationships, 6),
      exam_strategy: null,
    };
  }
  if (kind === 'test_prep') {
    if (!Array.isArray(parsed?.questions) || !parsed.questions.length) return null;
    return {
      ...parsed,
      questions: capArray(parsed.questions, 20),
      study_tips: capArray(parsed.study_tips, 5),
    };
  }
  if (kind === 'connect') {
    if (!parsed?.course_narrative) return null;
    return {
      ...parsed,
      recurring_themes: capArray(parsed.recurring_themes, 5),
      concept_chain: capArray(parsed.concept_chain, 5),
      contradictions_or_nuance: capArray(parsed.contradictions_or_nuance, 4),
      cumulative_exam_focus: [],
      gaps_between_lectures: capArray(parsed.gaps_between_lectures, 4),
    };
  }
  return null;
}

// ════════════════════════════════════════════════════════════
// POST /heart-of-the-matter — Distill: transcript → key bullet points
// ════════════════════════════════════════════════════════════
router.post('/heart-of-the-matter', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { transcript, subject, lectureTitle, bulletCount, priority, userLanguage } = req.body;

    if (!transcript?.trim()) {
      return res.status(400).json({ error: 'Paste your lecture transcript or notes' });
    }

    const count = Math.max(5, Math.min(20, bulletCount || 10));
    const priorityNote = priority === 'conceptual' ? 'Prioritize big-picture concepts and frameworks over specific facts.'
      : priority === 'factual' ? 'Prioritize specific facts, names, dates, formulas, and definitions.'
      : priority === 'applied' ? 'Prioritize practical applications, processes, and how-to knowledge.'
      : 'Balance concepts, facts, and applications.';

    const systemPrompt = `${PERSONALITY}

DISTILL MODE: Extract the ${count} points most central to understanding the supplied material. ${priorityNote} Each point must be a faithful, standalone representation of something supported by the source. Rank by source centrality and emphasis, not guessed exam likelihood. Preserve specific numbers, names, formulas, qualifications, and cause/effect only when the source supplies them.`;

    const userPrompt = `LECTURE CONTENT:
${subject ? `Subject: ${subject}` : ''}
${lectureTitle ? `Topic: ${lectureTitle}` : ''}

${transcript.substring(0, 30000)}

Extract exactly ${count} key points, ranked by how central they are to understanding this supplied material. Do not add outside facts. Return ONLY valid JSON:

{
  "lecture_summary": "One sentence: what this lecture was fundamentally about",
  "subject_detected": "Detected academic subject/field",

  "bullets": [
    {
      "rank": 1,
      "point": "Complete, specific, standalone statement of the key concept or fact",
      "why_important": "What role this point plays in the supplied material — definition, process, cause/effect, comparison, evidence, framework, or other source-supported role",
      "type": "definition | process | cause_effect | comparison | application | framework | fact | formula",
      "testable": true,
      "test_hint": "A practice prompt answerable from the supplied material. Do not predict an actual exam."
    }
  ],

  "vocabulary": [
    {
      "term": "Key term introduced or emphasized",
      "definition": "Concise definition as the professor presented it"
    }
  ],

  "connections": [
    "A connection explicitly stated in the supplied material, or a relationship that follows directly between ideas within it. Do not invent outside course context."
  ],

  "professor_signals": [
    "Only explicit importance or assessment signals in the supplied material. Do not infer intent from repetition alone. Empty if none."
  ],

  "gaps": [
    "Only an incompleteness or unresolved point explicitly visible in the supplied material. Do not predict future content. Empty if none."
  ]
}

LIMITS (keep the response compact so it never gets cut off): vocabulary AT MOST 8, connections AT MOST 4, professor_signals AT MOST 5, gaps AT MOST 4. Keep every field to one concise sentence. Never place a double-quote (") character inside any string value — it breaks the JSON.`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 6000,
      system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'heart-of-the-matter' });

    const result = validateResult('distill', parsed);
    if (!result) return res.status(500).json({ error: 'Could not process this. Please try again.' });
    res.json(result);

  } catch (error) {
    console.error('HeartOfTheMatter distill error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /heart-of-the-matter/study-guide — Structured study guide
// ════════════════════════════════════════════════════════════
router.post('/heart-of-the-matter/study-guide', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { transcript, subject, lectureTitle, examFormat, userLanguage } = req.body;

    if (!transcript?.trim()) {
      return res.status(400).json({ error: 'Paste your lecture transcript or notes' });
    }

    const formatNote = examFormat === 'multiple_choice' ? 'Focus on distinctions, definitions, and specific facts that become wrong answer traps.'
      : examFormat === 'essay' ? 'Focus on arguments, evidence chains, and how to construct a thesis from this material.'
      : examFormat === 'problem_solving' ? 'Focus on formulas, processes, and step-by-step methods.'
      : examFormat === 'short_answer' ? 'Focus on concise definitions, key facts, and brief explanations.'
      : 'Cover all types: definitions, processes, arguments, and applications.';

    const systemPrompt = `${PERSONALITY}

STUDY GUIDE MODE: Turn the supplied material into a structured study guide. ${formatNote} Everything content-specific must remain grounded in the supplied material. Generated mnemonics or practice aids may reorganize source material but must not introduce new factual claims.`;

    const userPrompt = `LECTURE CONTENT:
${subject ? `Subject: ${subject}` : ''}
${lectureTitle ? `Topic: ${lectureTitle}` : ''}

${transcript.substring(0, 30000)}

Create a study guide. Return ONLY valid JSON:

{
  "title": "Study guide title based on lecture topic",
  "overview": "2-3 sentence overview of what this supplied material covers and how its main ideas fit together",

  "concepts_to_know": [
    {
      "concept": "Concept or topic name",
      "explanation": "Clear, concise explanation — written for understanding, not just memorization",
      "memorize_vs_understand": "memorize | understand | both",
      "mnemonic": "Memory aid, acronym, or trick to remember this. null if not applicable."
    }
  ],

  "key_definitions": [
    {
      "term": "Term",
      "definition": "Precise definition",
      "distinguish_from": "Similar term it's commonly confused with. null if none."
    }
  ],

  "processes_and_formulas": [
    {
      "name": "Process or formula name",
      "steps_or_formula": "Step-by-step or the formula itself",
      "when_to_use": "When/why you'd apply this",
      "common_mistake": "Only a mistake or warning explicitly identified in the supplied material; otherwise null"
    }
  ] or [],

  "relationships": [
    {
      "relationship": "X causes Y because Z",
      "type": "cause_effect | compare_contrast | sequence | hierarchy | part_whole"
    }
  ],

  "exam_strategy": null
}

LIMITS (keep the response compact so it never gets cut off): concepts_to_know AT MOST 8, key_definitions AT MOST 10, processes_and_formulas AT MOST 6, relationships AT MOST 6. Keep every field to one concise sentence. Never place a double-quote (") character inside any string value — it breaks the JSON.`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 6000,
      system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'heart-of-the-matter-2' });

    const result = validateResult('study_guide', parsed);
    if (!result) return res.status(500).json({ error: 'Could not process this. Please try again.' });
    res.json(result);

  } catch (error) {
    console.error('HeartOfTheMatter study guide error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /heart-of-the-matter/test-prep — Generate practice exam questions
// ════════════════════════════════════════════════════════════
router.post('/heart-of-the-matter/test-prep', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { transcript, subject, lectureTitle, questionTypes, difficulty, questionCount, userLanguage } = req.body;

    if (!transcript?.trim()) {
      return res.status(400).json({ error: 'Paste your lecture transcript or notes' });
    }

    const count = Math.max(5, Math.min(20, questionCount || 10));
    const types = questionTypes?.length ? questionTypes : ['multiple_choice', 'short_answer', 'essay'];
    const diff = difficulty || 'mixed';

    const systemPrompt = `${PERSONALITY}

TEST PREP MODE: Generate ${count} practice questions answerable from the supplied material. Test understanding as well as recall. For multiple choice, every correct answer must be supported by the source and every distractor must be distinguishable as wrong from the source itself; do not rely on outside facts. Essay and synthesis questions may connect ideas only when those connections are supported by the supplied material. Difficulty: ${diff === 'easy' ? 'basic recall' : diff === 'hard' ? 'application and synthesis using only supplied material' : 'mixed'}. Types: ${types.join(', ')}. These are practice questions, never predictions of an actual exam.`;

    // The questions array is the whole cost — up to 20 entries of 8 fields, and
    // the golden case measured 65-67s against the ~60s where Safari abandons the
    // fetch. Nothing else in the schema is big enough to trade against it, so
    // the array is partitioned by which part of the lecture each half draws
    // from. Both calls still see the whole transcript (essay questions need it
    // for synthesis); only their sourcing brief differs, which is what keeps
    // them from writing the same question twice.
    const countA = Math.ceil(count / 2);
    const countB = count - countA;

    const questionShape = `    {
      "number": 1,
      "type": "multiple_choice | short_answer | essay | true_false | fill_blank",
      "difficulty": "easy | medium | hard",
      "question": "The question text",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."] or null,
      "answer": "The correct answer — full explanation",
      "why_wrong": {
        "A": "Why this is wrong (for MC only)",
        "B": "Why this is wrong",
        "C": "Why this is wrong"
      } or null,
      "points_hint": null,
      "source_concept": "Which lecture concept this tests"
    }`;

    const lectureBlock = `LECTURE CONTENT:
${subject ? `Subject: ${subject}` : ''}
${lectureTitle ? `Topic: ${lectureTitle}` : ''}

${transcript.substring(0, 30000)}`;

    const CRUX_LIMITS = 'Keep every field to one concise sentence. Never place a double-quote (") character inside any string value (paraphrase quoted passages, do not use quote marks) — it breaks the JSON.';

    const promptFirstHalf = `${lectureBlock}

Generate exactly ${countA} practice questions, drawn from the FIRST HALF of the lecture content above. Another writer is covering the second half — do not write questions about it. Number them 1 to ${countA}.

Return ONLY valid JSON with EXACTLY this one top-level key:

{
  "questions": [
${questionShape}
  ]
}

LIMITS: ${CRUX_LIMITS}`;

    const promptSecondHalf = `${lectureBlock}

Generate exactly ${countB} practice questions, drawn from the SECOND HALF of the lecture content above. Another writer is covering the first half — do not write questions about it. Number them 1 to ${countB}. Essay questions may synthesise across the whole lecture, but must be anchored in the second half.

Then write the study tips for the lecture as a whole.

Return ONLY valid JSON with EXACTLY these two top-level keys:

{
  "questions": [
${questionShape}
  ],

  "study_tips": [
    "A source-grounded distinction, relationship, or idea worth reviewing based on the supplied material"
  ]
}

LIMITS: study_tips AT MOST 5. ${CRUX_LIMITS}`;

    // Each call wraps its own withLanguage — the S7.4 parity check counts
    // withLanguage() calls against Anthropic calls in the file.
    const systemSuffix = withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion);
    const [firstHalf, secondHalf] = await Promise.all([
      callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 3500,
        system: withLanguage(systemPrompt, userLanguage) + systemSuffix,
        messages: [{ role: 'user', content: promptFirstHalf }],
      }, { label: 'heart-of-the-matter-3-first' }),
      callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 3500,
        system: withLanguage(systemPrompt, userLanguage) + systemSuffix,
        messages: [{ role: 'user', content: promptSecondHalf }],
      }, { label: 'heart-of-the-matter-3-second' }),
    ]);
    // Each half numbers from 1; restore one continuous run in lecture order.
    const merged = {
      ...secondHalf,
      questions: [
        ...(Array.isArray(firstHalf.questions) ? firstHalf.questions : []),
        ...(Array.isArray(secondHalf.questions) ? secondHalf.questions : []),
      ].map((q, i) => ({ ...q, number: i + 1 })),
    };

    const result = validateResult('test_prep', merged);
    if (!result) return res.status(500).json({ error: 'Could not process this. Please try again.' });
    res.json(result);

  } catch (error) {
    console.error('HeartOfTheMatter test prep error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /heart-of-the-matter/connect — Compare 2+ lectures, find themes
// ════════════════════════════════════════════════════════════
router.post('/heart-of-the-matter/connect', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { lectures, subject, userLanguage } = req.body;

    if (!lectures?.length || lectures.length < 2) {
      return res.status(400).json({ error: 'Paste at least 2 lectures to compare' });
    }

    const validLectures = lectures.filter(l => l.transcript?.trim());
    if (validLectures.length < 2) {
      return res.status(400).json({ error: 'Need at least 2 lectures with content' });
    }

    const systemPrompt = `${PERSONALITY}

CONNECT MODE: Compare the supplied materials and find relationships that are actually supported across them: recurring themes, concept development, contrasts, contradictions, and unresolved connections. Do not infer professor intent, course design, future content, or likely exam coverage.`;

    const lectureList = validLectures.map((l, i) =>
      `--- LECTURE ${i + 1}${l.title ? `: ${l.title}` : ''} ---\n${l.transcript.substring(0, 10000)}`
    ).join('\n\n');

    const userPrompt = `LECTURES TO CONNECT:
${subject ? `Subject: ${subject}` : ''}

${lectureList}

Analyze the connections. Return ONLY valid JSON:

{
  "course_narrative": "A 2-3 sentence throughline supported across the supplied materials. Do not invent a course-wide purpose beyond them.",

  "recurring_themes": [
    {
      "theme": "A concept, idea, or question that appears across multiple lectures",
      "appearances": ["Lecture 1: how it appeared", "Lecture 3: how it evolved"],
      "why_recurring": "What relationship or development across the supplied materials makes this theme useful to notice"
    }
  ],

  "concept_chain": [
    {
      "concept": "A concept that builds across lectures",
      "progression": "How it develops: Lecture 1 introduced X → Lecture 2 added Y → Lecture 3 applied it to Z"
    }
  ],

  "contradictions_or_nuance": [
    {
      "topic": "Something that seemed simple early on but got more complex",
      "evolution": "How the understanding shifted across lectures"
    }
  ] or [],

  "cumulative_exam_focus": [],

  "gaps_between_lectures": [
    "A relationship among the supplied materials that remains unresolved or unclear. Do not predict future material."
  ]
}

LIMITS (keep the response compact so it never gets cut off): recurring_themes AT MOST 5, concept_chain AT MOST 5, contradictions_or_nuance AT MOST 4, cumulative_exam_focus AT MOST 5, gaps_between_lectures AT MOST 4. Keep every field to one concise sentence. Never place a double-quote (") character inside any string value — it breaks the JSON.`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      system: withLanguage(systemPrompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'heart-of-the-matter-4' });

    const result = validateResult('connect', parsed);
    if (!result) return res.status(500).json({ error: 'Could not process this. Please try again.' });
    res.json(result);

  } catch (error) {
    console.error('HeartOfTheMatter connect error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /heart-of-the-matter/extract — file upload → plain text
// ════════════════════════════════════════════════════════════
// Owner-supplied addition: "add the ability to upload a file: text, pdf,
// etc., or sound." Deliberately NOT wired into the 4 endpoints above — it
// only ever produces plain text that lands in the same `transcript` (or
// per-lecture) textarea a visitor would otherwise paste into, so distill/
// study-guide/test-prep/connect need no changes at all. Plain text files
// (.txt, .md) never reach here — the frontend reads those directly via
// FileReader, no round trip needed.
//
// PDF: sent to Claude as a native `document` content block (same pattern as
// doctor-visit-translator.js / document-detective.js) rather than a local
// parsing library — one fewer dependency, and Claude's PDF support already
// handles scanned/image-only pages the way a text-layer-only parser cannot.
// Capped at ~28,000 characters of output, matching the 30,000-character
// substring every one of the 4 endpoints above already truncates the
// transcript to — extracting further than that would be thrown away anyway.
//
// Audio: ElevenLabs' speech-to-text (scribe_v1), reusing the same
// ELEVENLABS_API_KEY already configured for pronounce-it-right-audio.js's
// text-to-speech — no new credential, no new vendor decision.
router.post('/heart-of-the-matter/extract', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { fileData, mediaType } = req.body;
    if (!fileData || !mediaType) {
      return res.status(400).json({ error: 'No file received.' });
    }

    if (mediaType === 'application/pdf') {
      // withLanguage is applied (S7.4 requires every Anthropic call to wrap
      // one) but immediately overridden for the one field it would otherwise
      // corrupt: extraction must reproduce the document's OWN language
      // verbatim, not translate it into the visitor's UI language. A French
      // PDF opened by an English-UI visitor should come back in French.
      const extractSystem = withLanguage(
        'Extract the readable text from this document, verbatim and in reading order — do not summarize, paraphrase, or comment on it. If it runs past roughly 28,000 characters, stop cleanly at a paragraph boundary rather than cutting a sentence in half; do not try to fit more by compressing it. If the document has no readable text (blank pages, an unreadable scan), return an empty string. Return ONLY valid JSON: {"text": "the extracted text"}. Never place a double-quote (") character inside the string value — it breaks the JSON.',
        req.body.userLanguage
      ) + '\n\nOVERRIDE: the "text" field is a verbatim transcription, not a response to the visitor — write it in the DOCUMENT\'S OWN language exactly as it appears, regardless of the LANGUAGE instruction above. Do not translate it.';

      const parsed = await callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 8000,
        system: extractSystem,
        messages: [{
          role: 'user',
          content: [{ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: fileData } }],
        }],
      }, { label: 'heart-of-the-matter-extract-pdf' });
      return res.json({ text: typeof parsed?.text === 'string' ? parsed.text : '' });
    }

    if (mediaType.startsWith('audio/')) {
      const apiKey = process.env.ELEVENLABS_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'Audio transcription is not available right now.' });
      }

      const buffer = Buffer.from(fileData, 'base64');
      const form = new FormData();
      form.append('model_id', 'scribe_v1');
      form.append('file', new Blob([buffer], { type: mediaType }), 'audio');

      const elevenRes = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: { 'xi-api-key': apiKey },
        body: form,
      });
      if (!elevenRes.ok) {
        const errText = await elevenRes.text().catch(() => '');
        console.error('HeartOfTheMatter audio transcription error:', elevenRes.status, errText);
        return res.status(502).json({ error: 'Could not transcribe this audio. Please try again.' });
      }
      const data = await elevenRes.json();
      return res.json({ text: typeof data?.text === 'string' ? data.text : '' });
    }

    return res.status(400).json({ error: 'Unsupported file type.' });

  } catch (error) {
    console.error('HeartOfTheMatter extract error:', error);
    res.status(500).json({ error: 'Could not read this file. Please try again.' });
  }
});

module.exports = router;
