const express = require('express');
const router = express.Router();
const { cleanJsonResponse, withLanguage, callClaudeWithRetry } = require('../lib/claude');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ════════════════════════════════════════════════════════════
// SHARED
// ════════════════════════════════════════════════════════════
const PERSONALITY = `Study coach and memory expert. Build understanding, not just memorization. Find connections, build mental models, give exam strategy based on how professors actually test. The goal is walking into the exam confident.`

// ════════════════════════════════════════════════════════════
// POST /recall — Distill: transcript → key bullet points
// ════════════════════════════════════════════════════════════
router.post('/recall', rateLimit(DEFAULT_LIMITS), async (req, res) => {
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

DISTILL MODE: Extract the ${count} most important points. ${priorityNote} Each bullet: complete standalone fact, not 'X was discussed'. Rank by exam likelihood. Include specific numbers, names, formulas. State cause/effect explicitly.`;

    const userPrompt = `LECTURE CONTENT:
${subject ? `Subject: ${subject}` : ''}
${lectureTitle ? `Topic: ${lectureTitle}` : ''}

${transcript.substring(0, 30000)}

Extract exactly ${count} key points, ranked by importance. Return ONLY valid JSON:

{
  "lecture_summary": "One sentence: what this lecture was fundamentally about",
  "subject_detected": "Detected academic subject/field — one sentence",

  "bullets": [
    {
      "rank": 1,
      "point": "Complete, specific, standalone statement of the key concept or fact — one sentence",
      "why_important": "Why this matters — is it a definition, a process, a cause/effect, a comparison? — one sentence",
      "type": "definition | process | cause_effect | comparison | application | framework | fact | formula",
      "testable": true,
      "test_hint": "How this might appear on an exam: 'Define X', 'Compare X and Y', 'Explain why X leads to Y' — one sentence"
    }
  ],

  "vocabulary": [
    {
      "term": "Key term introduced or emphasized — 3-6 words",
      "definition": "Concise definition as the professor presented it — one sentence"
    }
  ],

  "connections": [
    "How this lecture connects to broader course themes or prior material — only include if evident from the content"
  ],

  "professor_signals": [
    "Things the professor explicitly flagged as important ('this will be on the test', 'make sure you understand', repeated 3+ times) — empty if none detected"
  ],

  "gaps": [
    "Concepts that seemed incomplete or that the professor might continue next lecture"
  ]
}`;

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'recall' });
    if (!parsed.answer && !parsed.facts && !parsed.response) {
      return res.status(500).json({ error: 'Could not recall this. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('Recall distill error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /recall/study-guide — Structured study guide
// ════════════════════════════════════════════════════════════
router.post('/recall/study-guide', rateLimit(DEFAULT_LIMITS), async (req, res) => {
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

STUDY GUIDE MODE: Create a structured exam-prep guide. ${formatNote} Readable the night before, walks them in confident.`;

    const userPrompt = `LECTURE CONTENT:
${subject ? `Subject: ${subject}` : ''}
${lectureTitle ? `Topic: ${lectureTitle}` : ''}

${transcript.substring(0, 30000)}

Create a study guide. Return ONLY valid JSON:

{
  "title": "Study guide title based on lecture topic — 3-6 words",
  "overview": "2-3 sentence overview of what this material covers and why it matters",

  "concepts_to_know": [
    {
      "concept": "Concept or topic name — one sentence",
      "explanation": "Clear, concise explanation — written for understanding, not just memorization — 1-2 sentences",
      "memorize_vs_understand": "memorize | understand | both",
      "mnemonic": "Memory aid, acronym, or trick to remember this. null if not applicable. — one sentence"
    }
  ],

  "key_definitions": [
    {
      "term": "Term",
      "definition": "Precise definition — one sentence",
      "distinguish_from": "Similar term it's commonly confused with. null if none. — one sentence"
    }
  ],

  "processes_and_formulas": [
    {
      "name": "Process or formula name — 3-6 words",
      "steps_or_formula": "Step-by-step or the formula itself — one sentence",
      "when_to_use": "When/why you'd apply this — one sentence",
      "common_mistake": "What students typically get wrong — one sentence"
    }
  ] or [],

  "relationships": [
    {
      "relationship": "X causes Y because Z — one sentence",
      "type": "cause_effect | compare_contrast | sequence | hierarchy | part_whole"
    }
  ],

  "exam_strategy": {
    "likely_questions": "2-3 questions that are almost certainly on the exam based on this material — one sentence",
    "trap_warnings": "Common mistakes or misunderstandings to watch for — one sentence",
    "time_allocation": "If this is one topic of many, how much exam time to budget for it — one sentence"
  }
}`;

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'recall-2' });
    if (!parsed.answer && !parsed.facts && !parsed.response) {
      return res.status(500).json({ error: 'Could not recall this. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('Recall study guide error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /recall/test-prep — Generate practice exam questions
// ════════════════════════════════════════════════════════════
router.post('/recall/test-prep', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { transcript, subject, lectureTitle, questionTypes, difficulty, questionCount, userLanguage } = req.body;

    if (!transcript?.trim()) {
      return res.status(400).json({ error: 'Paste your lecture transcript or notes' });
    }

    const count = Math.max(5, Math.min(20, questionCount || 10));
    const types = questionTypes?.length ? questionTypes : ['multiple_choice', 'short_answer', 'essay'];
    const diff = difficulty || 'mixed';

    const systemPrompt = `${PERSONALITY}

TEST PREP MODE: Generate ${count} practice questions testing understanding, not just recall. MC: one clearly wrong, one tempting wrong, one close-but-wrong. Short answer: requires attendance. Essay: synthesis and argument. Difficulty: ${diff === 'easy' ? 'basic recall' : diff === 'hard' ? 'application and synthesis' : 'mixed'}. Types: ${types.join(', ')}.`;

    const userPrompt = `LECTURE CONTENT:
${subject ? `Subject: ${subject}` : ''}
${lectureTitle ? `Topic: ${lectureTitle}` : ''}

${transcript.substring(0, 30000)}

Generate ${count} practice questions. Return ONLY valid JSON:

{
  "questions": [
    {
      "number": 1,
      "type": "multiple_choice | short_answer | essay | true_false | fill_blank",
      "difficulty": "easy | medium | hard",
      "question": "The question text — one sentence",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."] or null,
      "answer": "The correct answer — full explanation — one sentence",
      "why_wrong": {
        "A": "Why this is wrong (for MC only) — one sentence",
        "B": "Why this is wrong — one sentence",
        "C": "Why this is wrong — one sentence"
      } or null,
      "points_hint": "What a grader would look for in the answer — one sentence",
      "source_concept": "Which lecture concept this tests — one sentence"
    }
  ],

  "study_tips": [
    "Based on the questions generated, here's what to focus on"
  ]
}`;

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'recall-3' });
    if (!parsed.answer && !parsed.facts && !parsed.response) {
      return res.status(500).json({ error: 'Could not recall this. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('Recall test prep error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /recall/connect — Compare 2+ lectures, find themes
// ════════════════════════════════════════════════════════════
router.post('/recall/connect', rateLimit(DEFAULT_LIMITS), async (req, res) => {
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

CONNECT MODE: Find patterns across lectures — recurring themes, how concepts build, contradictions, the arc. What would a cumulative exam focus on?`;

    const lectureList = validLectures.map((l, i) =>
      `--- LECTURE ${i + 1}${l.title ? `: ${l.title}` : ''} ---\n${l.transcript.substring(0, 10000)}`
    ).join('\n\n');

    const userPrompt = `LECTURES TO CONNECT:
${subject ? `Subject: ${subject}` : ''}

${lectureList}

Analyze the connections. Return ONLY valid JSON:

{
  "course_narrative": "What story is this course telling across these lectures? 2-3 sentences.",

  "recurring_themes": [
    {
      "theme": "A concept, idea, or question that appears across multiple lectures — 3-6 words",
      "appearances": ["Lecture 1: how it appeared", "Lecture 3: how it evolved"],
      "why_recurring": "Why the professor keeps returning to this — what does it suggest about the exam? — one sentence"
    }
  ],

  "concept_chain": [
    {
      "concept": "A concept that builds across lectures — one sentence",
      "progression": "How it develops: Lecture 1 introduced X → Lecture 2 added Y → Lecture 3 applied it to Z — one sentence"
    }
  ],

  "contradictions_or_nuance": [
    {
      "topic": "Something that seemed simple early on but got more complex — 3-6 words",
      "evolution": "How the understanding shifted across lectures — one sentence"
    }
  ] or [],

  "cumulative_exam_focus": [
    "If there's a cumulative exam, these are the topics that span multiple lectures and are almost certainly on it"
  ],

  "gaps_between_lectures": [
    "Things that seem like they should connect but don't yet — possible future lecture topics"
  ]
}`;

    const parsed = await callClaudeWithRetry({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'recall-4' });
    if (!parsed.answer && !parsed.facts && !parsed.response) {
      return res.status(500).json({ error: 'Could not recall this. Please try again.' });
    }
    res.json(parsed);

  } catch (error) {
    console.error('Recall connect error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
