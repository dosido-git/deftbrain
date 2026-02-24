const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse } = require('../lib/claude');
const crypto = require('crypto');

// ═══════════════════════════════════════════════════
// THE FINAL WORD — Settle arguments with authority
// ═══════════════════════════════════════════════════

// ─── Helpers ───
function safeParseJSON(text) {
  let cleaned = text.trim();
  cleaned = cleaned.replace(/```json\s*/g, '').replace(/```\s*/g, '');
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace === -1 || lastBrace === -1) throw new Error('No JSON found');
  cleaned = cleaned.substring(firstBrace, lastBrace + 1);
  cleaned = cleaned.replace(/,(\s*[}\]])/g, '$1');
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, ' ');
    cleaned = cleaned.replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":');
    return JSON.parse(cleaned);
  }
}

function getDateContext() {
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  return `TODAY'S DATE: ${dateStr}. Use this to reason about what has already happened vs. what is upcoming.\n\n`;
}

const SOURCES_INSTRUCTION = `
IMPORTANT — SOURCES: Include a "sources" array with 1-3 brief source references that support your answer (e.g., "NASA astronaut accounts", "Guinness World Records"). Be specific, concise, and only cite sources you are confident about.`;

function generateId(len = 8) {
  return crypto.randomBytes(len).toString('base64url').substring(0, len);
}

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/1/0 for clarity
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ─── In-Memory Stores ───
// Production: replace with Redis or database
const sharedVerdicts = new Map();  // id → { verdict, createdAt }
const rooms = new Map();           // code → room state

// Cleanup old entries every 30 minutes
setInterval(() => {
  const now = Date.now();
  // Shared verdicts: 30-day TTL
  for (const [id, entry] of sharedVerdicts) {
    if (now - entry.createdAt > 30 * 24 * 60 * 60 * 1000) sharedVerdicts.delete(id);
  }
  // Rooms: 24-hour TTL
  for (const [code, room] of rooms) {
    if (now - room.createdAt > 24 * 60 * 60 * 1000) rooms.delete(code);
  }
}, 30 * 60 * 1000);


// ═══════════════════════════════════════════════════
// MAIN AI ROUTE — All modes
// ═══════════════════════════════════════════════════
router.post('/the-final-word', async (req, res) => {
  try {
    const { mode } = req.body;
    if (!mode) return res.status(400).json({ error: 'Please select a mode' });

    let prompt, maxTokens;
    const DATE_CONTEXT = getDateContext();

    // ════════════════════════════════════════
    // MODE 1: QUICK QUESTION
    // ════════════════════════════════════════
    if (mode === 'question') {
      const { question } = req.body;
      if (!question?.trim()) return res.status(400).json({ error: 'Please ask a question' });

      maxTokens = 1400;
      prompt = `${DATE_CONTEXT}You are THE FINAL WORD — an authoritative, confident fact-resolver. Someone has asked a factual question and wants a clear, definitive answer. Be direct. Be confident. Be correct.

QUESTION: "${question.trim()}"

RULES:
- Give the ANSWER first, boldly and clearly
- If it's a factual question with a clear answer, give high confidence
- If it's subjective or debatable, say so honestly — classify as "opinion" or "debatable"
- Keep explanation to 2-3 sentences max
- Include 1-2 verifiable facts that support the answer
- If the question is nonsensical, say so with humor
${SOURCES_INSTRUCTION}

Return ONLY this JSON:
{
  "answer": "The clear, bold answer in one sentence",
  "confidence": "certain" | "high" | "moderate" | "low" | "uncertain",
  "category": "fact" | "opinion" | "debatable" | "myth" | "nonsense",
  "explanation": "2-3 sentence explanation with key supporting facts",
  "supporting_facts": ["Fact 1", "Fact 2"],
  "common_misconception": "What people often get wrong (or null)",
  "fun_extra": "One bonus interesting related fact",
  "sources": ["Source 1", "Source 2"]
}`;

    // ════════════════════════════════════════
    // MODE 2: SETTLE A DISPUTE
    // ════════════════════════════════════════
    } else if (mode === 'dispute') {
      const { claimA, claimB, personA, personB, context } = req.body;
      if (!claimA?.trim() || !claimB?.trim()) {
        return res.status(400).json({ error: 'Please provide both sides of the dispute' });
      }

      const nameA = personA?.trim() || 'Person A';
      const nameB = personB?.trim() || 'Person B';
      const ctx = context ? `\nCONTEXT: ${context.trim()}` : '';

      maxTokens = 1800;
      prompt = `${DATE_CONTEXT}You are THE FINAL WORD — the ultimate argument referee. Two people disagree. Your job is to deliver a fair, authoritative verdict. Be direct.

${nameA} SAYS: "${claimA.trim()}"
${nameB} SAYS: "${claimB.trim()}"${ctx}

RULES:
- Determine who is MORE correct (or if both are wrong, or both partially right)
- Be specific about what each person got right and wrong
- Don't hedge excessively — people want a VERDICT
- If it's genuinely a matter of opinion, say so, but still provide useful context

CRITICAL — HANDLING TIME-SENSITIVE AND OPINION CLAIMS:
- If the claims involve current rankings, standings, stats, or performance, acknowledge your knowledge cutoff. DO NOT present possibly outdated stats as current fact.
- For "best" claims in subjective domains: frame it as OPINION and provide criteria to settle it.
- For verifiable facts (history, science, geography), be fully authoritative.
- Keep the tone fun but authoritative
${SOURCES_INSTRUCTION}

Return ONLY this JSON:
{
  "verdict": "who_a_wins" | "who_b_wins" | "both_right" | "both_wrong" | "its_complicated" | "opinion",
  "winner_name": "${nameA}" or "${nameB}" or "Neither" or "Both",
  "verdict_headline": "Bold one-line verdict",
  "score": {
    "person_a": { "name": "${nameA}", "accuracy": 0-100, "what_they_got_right": "...", "what_they_got_wrong": "..." },
    "person_b": { "name": "${nameB}", "accuracy": 0-100, "what_they_got_right": "...", "what_they_got_wrong": "..." }
  },
  "explanation": "2-4 sentence breakdown",
  "the_actual_answer": "What the correct/complete answer actually is",
  "time_sensitive": true | false,
  "how_to_verify": "Where to check live data, or null",
  "settlement_suggestion": "A fun way to move on",
  "sources": ["Source 1", "Source 2"]
}`;

    // ════════════════════════════════════════
    // MODE 3: FACT CHECK (with related claims)
    // ════════════════════════════════════════
    } else if (mode === 'factcheck') {
      const { claim } = req.body;
      if (!claim?.trim()) return res.status(400).json({ error: 'Please enter a claim to fact-check' });

      maxTokens = 1600;
      prompt = `${DATE_CONTEXT}You are THE FINAL WORD — a sharp, authoritative fact-checker. Someone has made a claim and wants to know if it's true. Deliver a clear ruling.

CLAIM: "${claim.trim()}"

RULES:
- Give a clear ruling: TRUE, FALSE, MOSTLY TRUE, MOSTLY FALSE, MISLEADING, or IT'S COMPLICATED
- Don't be wishy-washy — commit to a rating
- Explain WHY in 2-3 sentences with specific facts
- If it's a common myth, explain how it started
- If context matters, note the key qualifier
- ALSO suggest 2-3 related claims that people commonly confuse with this one or wonder about in the same context. These should be interesting, specific, and checkable — not generic.
${SOURCES_INSTRUCTION}

Return ONLY this JSON:
{
  "ruling": "true" | "false" | "mostly_true" | "mostly_false" | "misleading" | "complicated" | "unverifiable",
  "ruling_display": "TRUE ✓" or "FALSE ✗" or "MOSTLY TRUE" or "MOSTLY FALSE" or "MISLEADING" or "IT'S COMPLICATED" or "UNVERIFIABLE",
  "confidence": "certain" | "high" | "moderate" | "low",
  "explanation": "2-3 sentences explaining the ruling with specific facts",
  "the_nuance": "Key qualifier or context that matters (or null)",
  "origin_of_myth": "How this belief started (or null)",
  "what_is_true": "The accurate version of this claim",
  "share_summary": "One-line tweetable summary",
  "sources": ["Source 1", "Source 2"],
  "related_claims": [
    "Related claim 1 that people also wonder about",
    "Related claim 2",
    "Related claim 3"
  ]
}`;

    // ════════════════════════════════════════
    // MODE 4: QUICK-FIRE TRIVIA
    // ════════════════════════════════════════
    } else if (mode === 'trivia') {
      const { category, difficulty, previousQuestions } = req.body;
      const prevList = (previousQuestions?.length > 0)
        ? `\nNO REPEATS: ${previousQuestions.slice(-10).join('; ')}`
        : '';

      maxTokens = 500;
      prompt = `Trivia question. ${category || 'General Knowledge'}, ${difficulty || 'medium'} difficulty.${prevList}
4 multiple-choice options, one correct. Plausible wrong answers. Short explanation.
JSON ONLY:
{"question":"...","options":["A","B","C","D"],"correct_index":0,"correct_answer":"...","explanation":"1 sentence why + 1 fun fact","difficulty_actual":"easy|medium|hard","category_label":"specific sub-category"}`;

    // ════════════════════════════════════════
    // MODE 4b: TRIVIA CHALLENGE
    // ════════════════════════════════════════
    } else if (mode === 'trivia-check') {
      const { originalQuestion, userChallenge } = req.body;
      if (!originalQuestion || !userChallenge) {
        return res.status(400).json({ error: 'Question and challenge text required' });
      }

      maxTokens = 800;
      prompt = `${DATE_CONTEXT}You are THE FINAL WORD — someone is challenging a trivia answer. Review their challenge fairly.

ORIGINAL QUESTION & ANSWER: ${originalQuestion}
USER'S CHALLENGE: "${userChallenge}"

RULES:
- Be fair — if they have a legitimate point, acknowledge it
- But don't cave to incorrect challenges
- Provide the definitive answer with sources/facts

Return ONLY this JSON:
{
  "challenge_valid": true | false | "partially",
  "ruling": "One sentence ruling on the challenge",
  "explanation": "Why the challenge is or isn't valid",
  "definitive_answer": "The final, correct answer with supporting facts"
}`;

    // ════════════════════════════════════════
    // MODE 5: FOLLOW-UP
    // ════════════════════════════════════════
    } else if (mode === 'follow-up') {
      const { originalQuestion, originalAnswer, followUpQuestion } = req.body;
      if (!followUpQuestion?.trim()) return res.status(400).json({ error: 'Please enter a follow-up question' });
      if (!originalAnswer) return res.status(400).json({ error: 'No original answer to follow up on' });

      maxTokens = 1400;
      prompt = `${DATE_CONTEXT}You are THE FINAL WORD — someone got an answer from you and wants to dig deeper.

ORIGINAL QUESTION/CLAIM: "${originalQuestion || 'Not provided'}"
YOUR PREVIOUS ANSWER: "${typeof originalAnswer === 'string' ? originalAnswer : JSON.stringify(originalAnswer)}"
FOLLOW-UP QUESTION: "${followUpQuestion.trim()}"

RULES:
- Build on the previous answer — don't repeat the same information
- Go deeper on the specific aspect they're asking about
- Be just as authoritative and confident
- If the follow-up changes the answer, say so clearly
${SOURCES_INSTRUCTION}

Return ONLY this JSON:
{
  "answer": "Clear, direct answer to the follow-up",
  "confidence": "certain" | "high" | "moderate" | "low" | "uncertain",
  "explanation": "2-4 sentences going deeper",
  "changes_original": "How this qualifies the original answer (or null)",
  "supporting_facts": ["Fact 1", "Fact 2"],
  "sources": ["Source 1", "Source 2"],
  "fun_extra": "Bonus related fact (or null)"
}`;

    // ════════════════════════════════════════
    // MODE 6: APPEAL (Dispute Rematch)
    // ════════════════════════════════════════
    } else if (mode === 'appeal') {
      const { originalVerdict, newEvidence, appellantName } = req.body;
      if (!originalVerdict) return res.status(400).json({ error: 'No original verdict to appeal' });
      if (!newEvidence?.trim()) return res.status(400).json({ error: 'You must present new evidence or arguments for your appeal' });

      maxTokens = 1800;
      prompt = `${DATE_CONTEXT}You are THE FINAL WORD — APPEALS COURT. A previous verdict was delivered and now one party is appealing with new evidence or arguments. You must be MORE rigorous than the original ruling. Appeals courts have higher standards.

ORIGINAL VERDICT:
${JSON.stringify(originalVerdict, null, 2)}

APPELLANT: ${appellantName || 'The losing party'}
NEW EVIDENCE/ARGUMENT: "${newEvidence.trim()}"

RULES:
- Review the original verdict critically
- Consider the new evidence/arguments fairly but rigorously
- You can UPHOLD (original was correct), MODIFY (partially change), or OVERTURN (reverse the verdict)
- Be specific about what the new evidence changes (or doesn't)
- If the appeal is just restating the same argument with no new info, uphold firmly
- Maintain the authoritative, no-nonsense tone
${SOURCES_INSTRUCTION}

Return ONLY this JSON:
{
  "appeal_ruling": "upheld" | "modified" | "overturned",
  "ruling_headline": "Bold one-line appeal ruling (e.g., 'Appeal DENIED — original verdict stands.' or 'OVERTURNED — new evidence changes everything.')",
  "original_verdict_assessment": "Was the original ruling sound? 1-2 sentences.",
  "new_evidence_assessment": "How strong is the new evidence? 1-2 sentences.",
  "explanation": "3-4 sentence detailed explanation of the appeal ruling",
  "updated_scores": {
    "person_a": { "name": "...", "original_accuracy": 0-100, "revised_accuracy": 0-100 },
    "person_b": { "name": "...", "original_accuracy": 0-100, "revised_accuracy": 0-100 }
  },
  "final_answer": "The definitive answer after considering all evidence",
  "case_closed": "A decisive closing statement — this is truly THE final word",
  "sources": ["Source 1", "Source 2"]
}`;

    // ════════════════════════════════════════
    // MODE 7: DEVIL'S ADVOCATE
    // ════════════════════════════════════════
    } else if (mode === 'devils-advocate') {
      const { position, topic } = req.body;
      if (!position?.trim()) return res.status(400).json({ error: 'Please state your position' });

      maxTokens = 2000;
      prompt = `${DATE_CONTEXT}You are THE FINAL WORD — DEVIL'S ADVOCATE MODE. Someone has a position on a topic and wants you to generate the STRONGEST possible counter-argument, then judge both sides fairly.

TOPIC: "${topic?.trim() || 'Not specified'}"
THEIR POSITION: "${position.trim()}"

RULES:
- First, generate the BEST possible counter-argument — not a straw man, the genuinely strongest opposition
- Make the counter-argument specific, well-reasoned, and backed by real facts/evidence
- Then judge BOTH positions fairly as if two real people presented them
- Don't go easy on the user — if their position is weak, say so
- But also don't artificially make the counter-argument win — be genuinely fair
- The goal is to stress-test their thinking, not to agree or disagree
${SOURCES_INSTRUCTION}

Return ONLY this JSON:
{
  "counter_position": "The strongest possible counter-argument in 2-3 sentences",
  "counter_supporting_facts": ["Fact supporting counter-argument 1", "Fact 2"],
  "verdict": "user_wins" | "counter_wins" | "both_valid" | "both_weak" | "its_complicated",
  "verdict_headline": "Bold one-line verdict",
  "user_score": {
    "accuracy": 0-100,
    "strengths": "What's strong about their position",
    "weaknesses": "Where their position falls short"
  },
  "counter_score": {
    "accuracy": 0-100,
    "strengths": "What's strong about the counter-argument",
    "weaknesses": "Where the counter falls short"
  },
  "explanation": "3-4 sentence fair analysis of both positions",
  "the_nuance": "The key insight both sides might be missing",
  "recommendation": "What the user should consider or research further",
  "sources": ["Source 1", "Source 2"]
}`;

    } else {
      return res.status(400).json({ error: 'Invalid mode' });
    }

    // ── Call Claude ──
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }]
    });

    const textContent = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = safeParseJSON(textContent);
    parsed._mode = mode;
    res.json(parsed);

  } catch (error) {
    console.error('The Final Word error:', error);
    res.status(500).json({ error: 'Failed to deliver the verdict. Please try again.' });
  }
});


// ═══════════════════════════════════════════════════
// SHAREABLE VERDICT ROUTES
// ═══════════════════════════════════════════════════

// Save a verdict for sharing
router.post('/the-final-word/share', (req, res) => {
  try {
    const { verdict, inputSummary } = req.body;
    if (!verdict) return res.status(400).json({ error: 'No verdict to share' });

    const id = generateId(10);
    sharedVerdicts.set(id, {
      verdict,
      inputSummary: inputSummary || '',
      createdAt: Date.now(),
    });

    res.json({ id, url: `/verdict/${id}` });
  } catch (error) {
    console.error('Share error:', error);
    res.status(500).json({ error: 'Failed to create share link' });
  }
});

// Retrieve a shared verdict
router.get('/the-final-word/share/:id', (req, res) => {
  const entry = sharedVerdicts.get(req.params.id);
  if (!entry) return res.status(404).json({ error: 'Verdict not found or has expired' });
  res.json({ verdict: entry.verdict, inputSummary: entry.inputSummary });
});


// ═══════════════════════════════════════════════════
// MULTIPLAYER TRIVIA — Room Management
// ═══════════════════════════════════════════════════

// Create a room
router.post('/the-final-word/room/create', (req, res) => {
  try {
    const { hostName, settings } = req.body;
    if (!hostName?.trim()) return res.status(400).json({ error: 'Host name required' });

    // Generate unique room code
    let code;
    let attempts = 0;
    do {
      code = generateRoomCode();
      attempts++;
    } while (rooms.has(code) && attempts < 20);

    if (rooms.has(code)) return res.status(500).json({ error: 'Could not generate room code' });

    const hostId = generateId(12);
    const room = {
      code,
      hostId,
      players: [{
        id: hostId,
        name: hostName.trim(),
        score: 0,
        streak: 0,
        bestStreak: 0,
        isHost: true,
        answered: false,
      }],
      settings: {
        category: settings?.category || 'General Knowledge',
        categoryId: settings?.categoryId || 'general',
        difficulty: settings?.difficulty || 'medium',
        rounds: settings?.rounds || 10,
      },
      currentQuestion: null,
      questionNumber: 0,
      answers: {},       // playerId → answerIndex
      revealed: false,
      started: false,
      finished: false,
      previousQuestions: [],
      categoryBreakdown: {},
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    rooms.set(code, room);
    res.json({ code, playerId: hostId });
  } catch (error) {
    console.error('Room create error:', error);
    res.status(500).json({ error: 'Failed to create room' });
  }
});

// Join a room
router.post('/the-final-word/room/:code/join', (req, res) => {
  try {
    const { playerName } = req.body;
    const room = rooms.get(req.params.code.toUpperCase());
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.started) return res.status(400).json({ error: 'Game already in progress' });
    if (room.players.length >= 8) return res.status(400).json({ error: 'Room is full (max 8 players)' });
    if (!playerName?.trim()) return res.status(400).json({ error: 'Player name required' });

    const playerId = generateId(12);
    room.players.push({
      id: playerId,
      name: playerName.trim(),
      score: 0,
      streak: 0,
      bestStreak: 0,
      isHost: false,
      answered: false,
    });
    room.updatedAt = Date.now();

    res.json({ playerId, players: room.players.map(p => ({ name: p.name, isHost: p.isHost })) });
  } catch (error) {
    console.error('Room join error:', error);
    res.status(500).json({ error: 'Failed to join room' });
  }
});

// Get room state (polling endpoint — NOT rate-limited since it's GET)
router.get('/the-final-word/room/:code/state', (req, res) => {
  const room = rooms.get(req.params.code.toUpperCase());
  if (!room) return res.status(404).json({ error: 'Room not found' });

  const playerId = req.query.playerId;

  // Return sanitized state (hide correct answer if not revealed)
  const state = {
    code: room.code,
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      score: p.score,
      streak: p.streak,
      bestStreak: p.bestStreak,
      isHost: p.isHost,
      answered: p.answered,
    })),
    settings: room.settings,
    questionNumber: room.questionNumber,
    started: room.started,
    finished: room.finished,
    revealed: room.revealed,
    currentQuestion: room.currentQuestion ? {
      question: room.currentQuestion.question,
      options: room.currentQuestion.options,
      category_label: room.currentQuestion.category_label,
      difficulty_actual: room.currentQuestion.difficulty_actual,
      // Only include answer data if revealed
      ...(room.revealed ? {
        correct_index: room.currentQuestion.correct_index,
        correct_answer: room.currentQuestion.correct_answer,
        explanation: room.currentQuestion.explanation,
      } : {}),
    } : null,
    myAnswer: room.answers[playerId] ?? null,
    allAnswered: room.players.every(p => p.answered),
    categoryBreakdown: room.categoryBreakdown,
    updatedAt: room.updatedAt,
  };

  res.json(state);
});

// Host: generate next question
router.post('/the-final-word/room/:code/next', async (req, res) => {
  try {
    const { playerId } = req.body;
    const room = rooms.get(req.params.code.toUpperCase());
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.hostId !== playerId) return res.status(403).json({ error: 'Only the host can advance questions' });

    // Check if game should end
    if (room.questionNumber >= room.settings.rounds) {
      room.finished = true;
      room.updatedAt = Date.now();
      return res.json({ finished: true });
    }

    // Mark game as started
    room.started = true;

    // Reset answer state
    room.answers = {};
    room.revealed = false;
    room.players.forEach(p => { p.answered = false; });

    // Generate question via Claude
    const prevList = room.previousQuestions.length > 0
      ? `\nNO REPEATS: ${room.previousQuestions.slice(-10).join('; ')}`
      : '';

    const prompt = `Trivia question. ${room.settings.category}, ${room.settings.difficulty} difficulty.${prevList}
4 multiple-choice options, one correct. Plausible wrong answers. Short explanation.
JSON ONLY:
{"question":"...","options":["A","B","C","D"],"correct_index":0,"correct_answer":"...","explanation":"1 sentence why + 1 fun fact","difficulty_actual":"easy|medium|hard","category_label":"specific sub-category"}`;

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }]
    });

    const textContent = message.content.find(item => item.type === 'text')?.text || '';
    const questionData = safeParseJSON(textContent);

    room.currentQuestion = questionData;
    room.questionNumber++;
    room.previousQuestions.push(questionData.question);
    room.updatedAt = Date.now();

    res.json({ success: true, questionNumber: room.questionNumber });
  } catch (error) {
    console.error('Room next error:', error);
    res.status(500).json({ error: 'Failed to generate question' });
  }
});

// Player: submit answer
router.post('/the-final-word/room/:code/answer', (req, res) => {
  try {
    const { playerId, answerIndex } = req.body;
    const room = rooms.get(req.params.code.toUpperCase());
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (!room.currentQuestion) return res.status(400).json({ error: 'No active question' });
    if (room.revealed) return res.status(400).json({ error: 'Answer already revealed' });

    const player = room.players.find(p => p.id === playerId);
    if (!player) return res.status(404).json({ error: 'Player not found' });
    if (player.answered) return res.status(400).json({ error: 'Already answered' });

    room.answers[playerId] = answerIndex;
    player.answered = true;
    room.updatedAt = Date.now();

    const allAnswered = room.players.every(p => p.answered);
    res.json({ accepted: true, allAnswered });
  } catch (error) {
    console.error('Room answer error:', error);
    res.status(500).json({ error: 'Failed to submit answer' });
  }
});

// Host: reveal answer and score
router.post('/the-final-word/room/:code/reveal', (req, res) => {
  try {
    const { playerId } = req.body;
    const room = rooms.get(req.params.code.toUpperCase());
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.hostId !== playerId) return res.status(403).json({ error: 'Only the host can reveal' });
    if (!room.currentQuestion) return res.status(400).json({ error: 'No active question' });

    room.revealed = true;
    const correctIdx = room.currentQuestion.correct_index;

    // Score all players
    room.players.forEach(p => {
      const answer = room.answers[p.id];
      const isCorrect = answer === correctIdx;
      if (isCorrect) {
        p.score++;
        p.streak++;
        p.bestStreak = Math.max(p.bestStreak, p.streak);
      } else {
        p.streak = 0;
      }
    });

    // Track category breakdown
    const cat = room.currentQuestion.category_label || 'General';
    if (!room.categoryBreakdown[cat]) room.categoryBreakdown[cat] = { correct: 0, total: 0 };
    room.categoryBreakdown[cat].total++;
    const anyCorrect = Object.values(room.answers).some(a => a === correctIdx);
    if (anyCorrect) room.categoryBreakdown[cat].correct++;

    // Check if game is over
    if (room.questionNumber >= room.settings.rounds) {
      room.finished = true;
    }

    room.updatedAt = Date.now();
    res.json({ revealed: true, finished: room.finished });
  } catch (error) {
    console.error('Room reveal error:', error);
    res.status(500).json({ error: 'Failed to reveal answer' });
  }
});

module.exports = router;
