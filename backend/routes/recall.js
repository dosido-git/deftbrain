const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage } = require('../lib/claude');
const { rateLimit } = require('../lib/rateLimiter');

// ════════════════════════════════════════════════════════════
// SHARED
// ════════════════════════════════════════════════════════════
const PERSONALITY = `You are an expert academic distiller. You've attended thousands of lectures across every discipline and you know EXACTLY what professors emphasize when they want students to remember something.

YOUR SKILL:
- Distinguish signal from noise: core concepts vs. tangents, anecdotes, repetition, and filler
- Detect "this matters" signals: repetition, emphasis phrases ("the key thing here is..."), definitions, examples that illustrate testable concepts, contrasts with prior material
- Understand academic structure: thesis → evidence → implications → connections to prior material
- Know what gets tested: definitions, processes, cause/effect, comparisons, applications
- Be specific: "The mitochondria produces ATP via oxidative phosphorylation" not "Energy production was discussed"`;

// ════════════════════════════════════════════════════════════
// POST /recall — Distill: transcript → key bullet points
// ════════════════════════════════════════════════════════════
router.post('/recall', rateLimit(), async (req, res) => {
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

DISTILL MODE: Extract the ${count} most important points from this lecture content. ${priorityNote}

RULES:
- Each bullet must be a COMPLETE, standalone fact or concept — not "X was discussed"
- Rank by importance: #1 is the most likely to appear on an exam
- If the professor repeated something multiple times, that's a signal — it matters
- Distinguish between "interesting tangent" and "core concept being taught"
- Include specific details: numbers, names, formulas, definitions — not vague summaries
- If there are cause/effect relationships, state them explicitly`;

    const userPrompt = `LECTURE CONTENT:
${subject ? `Subject: ${subject}` : ''}
${lectureTitle ? `Topic: ${lectureTitle}` : ''}

${transcript.substring(0, 30000)}

Extract exactly ${count} key points, ranked by importance. Return ONLY valid JSON:

{
  "lecture_summary": "One sentence: what this lecture was fundamentally about",
  "subject_detected": "Detected academic subject/field",

  "bullets": [
    {
      "rank": 1,
      "point": "Complete, specific, standalone statement of the key concept or fact",
      "why_important": "Why this matters — is it a definition, a process, a cause/effect, a comparison?",
      "type": "definition | process | cause_effect | comparison | application | framework | fact | formula",
      "testable": true,
      "test_hint": "How this might appear on an exam: 'Define X', 'Compare X and Y', 'Explain why X leads to Y'"
    }
  ],

  "vocabulary": [
    {
      "term": "Key term introduced or emphasized",
      "definition": "Concise definition as the professor presented it"
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

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const parsed = JSON.parse(cleanJsonResponse(text));
    res.json(parsed);

  } catch (error) {
    console.error('Recall distill error:', error);
    res.status(500).json({ error: error.message || 'Distillation failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /recall/study-guide — Structured study guide
// ════════════════════════════════════════════════════════════
router.post('/recall/study-guide', rateLimit(), async (req, res) => {
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

STUDY GUIDE MODE: Create a structured study guide optimized for exam preparation. ${formatNote}

The study guide should be something a student can read the night before an exam and walk in confident.`;

    const userPrompt = `LECTURE CONTENT:
${subject ? `Subject: ${subject}` : ''}
${lectureTitle ? `Topic: ${lectureTitle}` : ''}

${transcript.substring(0, 30000)}

Create a study guide. Return ONLY valid JSON:

{
  "title": "Study guide title based on lecture topic",
  "overview": "2-3 sentence overview of what this material covers and why it matters",

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
      "common_mistake": "What students typically get wrong"
    }
  ] or [],

  "relationships": [
    {
      "relationship": "X causes Y because Z",
      "type": "cause_effect | compare_contrast | sequence | hierarchy | part_whole"
    }
  ],

  "exam_strategy": {
    "likely_questions": "2-3 questions that are almost certainly on the exam based on this material",
    "trap_warnings": "Common mistakes or misunderstandings to watch for",
    "time_allocation": "If this is one topic of many, how much exam time to budget for it"
  }
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const parsed = JSON.parse(cleanJsonResponse(text));
    res.json(parsed);

  } catch (error) {
    console.error('Recall study guide error:', error);
    res.status(500).json({ error: error.message || 'Study guide generation failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /recall/test-prep — Generate practice exam questions
// ════════════════════════════════════════════════════════════
router.post('/recall/test-prep', rateLimit(), async (req, res) => {
  try {
    const { transcript, subject, lectureTitle, questionTypes, difficulty, questionCount, userLanguage } = req.body;

    if (!transcript?.trim()) {
      return res.status(400).json({ error: 'Paste your lecture transcript or notes' });
    }

    const count = Math.max(5, Math.min(20, questionCount || 10));
    const types = questionTypes?.length ? questionTypes : ['multiple_choice', 'short_answer', 'essay'];
    const diff = difficulty || 'mixed';

    const systemPrompt = `${PERSONALITY}

TEST PREP MODE: Generate ${count} practice exam questions from this lecture content.

RULES:
- Questions should test UNDERSTANDING, not just recall — especially for essay/short answer
- Multiple choice: include one obviously wrong answer, one tempting wrong answer, and one close-but-wrong answer
- Short answer: require specific knowledge that a student who didn't attend couldn't guess
- Essay: require synthesis and argumentation, not just listing facts
- Difficulty: ${diff === 'easy' ? 'Basic recall and definitions' : diff === 'hard' ? 'Application, synthesis, and analysis' : 'Mix of recall, understanding, and application'}
- Question types to include: ${types.join(', ')}`;

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
      "question": "The question text",
      "options": ["A) ...", "B) ...", "C) ...", "D) ..."] or null,
      "answer": "The correct answer — full explanation",
      "why_wrong": {
        "A": "Why this is wrong (for MC only)",
        "B": "Why this is wrong",
        "C": "Why this is wrong"
      } or null,
      "points_hint": "What a grader would look for in the answer",
      "source_concept": "Which lecture concept this tests"
    }
  ],

  "study_tips": [
    "Based on the questions generated, here's what to focus on"
  ]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 4000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const parsed = JSON.parse(cleanJsonResponse(text));
    res.json(parsed);

  } catch (error) {
    console.error('Recall test prep error:', error);
    res.status(500).json({ error: error.message || 'Test prep generation failed' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /recall/connect — Compare 2+ lectures, find themes
// ════════════════════════════════════════════════════════════
router.post('/recall/connect', rateLimit(), async (req, res) => {
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

CONNECT MODE: Analyze multiple lectures to find patterns, themes, and how concepts build on each other. This is the "big picture" view that helps students see the forest, not just the trees.

FOCUS ON:
- Recurring themes across lectures (what keeps coming up?)
- How later lectures build on earlier ones
- Contradictions or evolving ideas
- The overall narrative arc of the course material
- What a cumulative exam would focus on`;

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
      "theme": "A concept, idea, or question that appears across multiple lectures",
      "appearances": ["Lecture 1: how it appeared", "Lecture 3: how it evolved"],
      "why_recurring": "Why the professor keeps returning to this — what does it suggest about the exam?"
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

  "cumulative_exam_focus": [
    "If there's a cumulative exam, these are the topics that span multiple lectures and are almost certainly on it"
  ],

  "gaps_between_lectures": [
    "Things that seem like they should connect but don't yet — possible future lecture topics"
  ]
}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 3500,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: userPrompt }],
    });

    const text = message.content.find(b => b.type === 'text')?.text || '';
    const parsed = JSON.parse(cleanJsonResponse(text));
    res.json(parsed);

  } catch (error) {
    console.error('Recall connect error:', error);
    res.status(500).json({ error: error.message || 'Connection analysis failed' });
  }
});

module.exports = router;
