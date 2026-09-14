const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse, withLanguage, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const crypto = require('crypto');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

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
    return JSON.parse(cleanJsonResponse(cleaned));
  } catch (e) {
    cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, ' ');
    cleaned = cleaned.replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":');
    return JSON.parse(cleanJsonResponse(cleaned));
  }
}

function getDateContext() {
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  return `TODAY'S DATE: ${dateStr}. Use this to reason about what has already happened vs. what is upcoming.\n\n`;
}

const NO_QUOTE_RULE = '\nNever place a double-quote (") character inside any JSON string value — quoted claims, titles, and phrases must be written plainly or with single quotes, or it breaks the JSON.';

const SOURCES_INSTRUCTION = `
IMPORTANT — SOURCE LEADS:
- "sources" are source leads the user can verify, not proof that you consulted them.
- Name only specific, real sources you are confident exist and are directly relevant.
- Never invent a publication, study, agency page, quotation, URL, author, or statistic.
- If you cannot identify a trustworthy source lead from your knowledge, return an empty array.
- For current or rapidly changing claims, say that live verification is needed rather than implying the answer is current.`;

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
const rooms = new Map(); // code → room state — real-time and short-lived
                          // (24h TTL); a lost room just means starting a new
                          // one. Shared verdicts used to live here too (then
                          // in a JSON file); both were removed after the
                          // link still 404'd in production — see the note by
                          // handleCreateShareLink in TheFinalWord.js.

// Cleanup old rooms every 30 minutes
setInterval(() => {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (now - room.createdAt > 24 * 60 * 60 * 1000) rooms.delete(code);
  }
}, 30 * 60 * 1000);

// ═══════════════════════════════════════════════════
// MAIN AI ROUTE — All modes
// ═══════════════════════════════════════════════════
// The model occasionally emits the literal strings "null"/"None" for empty
// fields, which then render as text — normalize them to real null.
const normalizeNullStrings = (val) => {
  if (typeof val === 'string') {
    return /^(null|undefined|None|NONE|N\/A)$/.test(val.trim()) ? null : val;
  }
  if (Array.isArray(val)) return val.map(normalizeNullStrings);
  if (val && typeof val === 'object') {
    for (const k of Object.keys(val)) val[k] = normalizeNullStrings(val[k]);
  }
  return val;
};

router.post('/the-final-word', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { mode, userLanguage } = req.body;
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
      prompt = `${DATE_CONTEXT}You are THE FINAL WORD. Your job is not to sound certain; your job is to make the answer clear enough that the user knows what is known, what is uncertain, and what would settle the question.

QUESTION: "${question.trim()}"

RULES:
- Answer the question immediately in one plain sentence.
- Separate established fact from interpretation, opinion, prediction, and current information.
- Use strong confidence only when the answer is stable and well established.
- If the answer depends on missing context, state the decisive condition instead of guessing.
- If the question is current or fast-changing and you cannot verify live information, say that plainly.
- Never manufacture precision, statistics, quotations, dates, studies, or sources.
- Keep the explanation concise: usually 2-4 sentences.
- Include supporting facts only when they materially help.
- Use humor only for harmless nonsense; never let the persona override accuracy.
${SOURCES_INSTRUCTION}

Return ONLY this JSON:
{
  "answer": "The clearest useful answer in one sentence",
  "confidence": "certain" | "high" | "moderate" | "low" | "uncertain",
  "category": "fact" | "opinion" | "debatable" | "myth" | "nonsense",
  "explanation": "2-4 sentences explaining what supports the answer and any important limit",
  "supporting_facts": ["Fact 1", "Fact 2"],
  "common_misconception": "A genuinely useful misconception, or null",
  "fun_extra": "A genuinely useful related fact, or null",
  "sources": ["Specific source lead 1", "Specific source lead 2"]
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
      prompt = `${DATE_CONTEXT}You are THE FINAL WORD. Two people disagree. Identify the part that can actually be settled, separate facts from blame or preference, and give a fair verdict without pretending that every disagreement has an objective winner.

${nameA} SAYS: "${claimA.trim()}"
${nameB} SAYS: "${claimB.trim()}"${ctx}

RULES:
- First determine what kind of disagreement this is: factual, interpretive, preference-based, responsibility/blame, or mixed.
- Judge factual claims against what can reasonably be established.
- Do not convert feelings, motives, fairness, blame, or relationship dynamics into fake factual certainty.
- If both people are partly right, say exactly where each is right.
- If the evidence supplied is insufficient, identify what missing fact would change the verdict.
- For current or rapidly changing claims, do not present remembered information as current.
- Judge how well each person's position holds up as one of five QUALITATIVE categories — strongly_supported, mostly_supported, partly_supported, weakly_supported, or not_supported. This is not a probability, a truth percentage, or a measure of a person's credibility, and it is not a number you privately compute and then round to a label — reason in these categories directly. Two people can land on the same category for entirely different reasons; that is fine and expected for an ambiguous or old disagreement.
- Do not infer intent, negligence, dishonesty, or character unless the supplied facts establish it.
- Prefer a useful resolution over theatrical winner-picking.
${SOURCES_INSTRUCTION}

Return ONLY this JSON:
{
  "verdict": "who_a_wins" | "who_b_wins" | "both_right" | "both_wrong" | "its_complicated" | "opinion",
  "winner_name": "${nameA}" or "${nameB}" or "Neither" or "Both",
  "verdict_headline": "One-line verdict that says what can actually be concluded",
  "score": {
    "person_a": { "name": "${nameA}", "support": "strongly_supported" | "mostly_supported" | "partly_supported" | "weakly_supported" | "not_supported", "what_they_got_right": "...", "what_they_got_wrong": "..." },
    "person_b": { "name": "${nameB}", "support": "strongly_supported" | "mostly_supported" | "partly_supported" | "weakly_supported" | "not_supported", "what_they_got_right": "...", "what_they_got_wrong": "..." }
  },
  "explanation": "2-4 sentences separating the factual issue from interpretation or blame",
  "the_actual_answer": "The most complete answer supported by the available facts — one sentence",
  "time_sensitive": true | false,
  "how_to_verify": "The single best next check if live or missing information matters, otherwise null",
  "settlement_suggestion": "A practical, light-touch way to move on, or null",
  "sources": ["Specific source lead 1", "Specific source lead 2"]
}`;

    // ════════════════════════════════════════
    // MODE 3: FACT CHECK (with related claims)
    // ════════════════════════════════════════
    } else if (mode === 'factcheck') {
      const { claim } = req.body;
      if (!claim?.trim()) return res.status(400).json({ error: 'Please enter a claim to fact-check' });

      maxTokens = 1600;
      prompt = `${DATE_CONTEXT}You are THE FINAL WORD. Evaluate the claim precisely. The goal is not a dramatic TRUE/FALSE stamp; it is a ruling that matches the evidence and makes the misleading part easy to see.

CLAIM: "${claim.trim()}"

RULES:
- Choose the narrowest defensible ruling: TRUE, FALSE, MOSTLY TRUE, MOSTLY FALSE, MISLEADING, IT'S COMPLICATED, or UNVERIFIABLE.
- Judge the claim as written. Do not silently rewrite it into an easier claim.
- Identify the exact words, missing context, timeframe, denominator, comparison, or causal leap that changes the ruling.
- Distinguish absence of evidence from evidence of absence.
- If the claim is current or fast-changing and you cannot verify it live, use UNVERIFIABLE or clearly state the limitation.
- Explain the ruling in 2-4 sentences.
- "origin_of_myth" must be null unless you know a specific, supportable origin. Never invent an origin story.
- Suggest related claims only when they are genuinely adjacent and checkable.
${SOURCES_INSTRUCTION}

Return ONLY this JSON:
{
  "ruling": "true" | "false" | "mostly_true" | "mostly_false" | "misleading" | "complicated" | "unverifiable",
  "ruling_display": "TRUE ✓" or "FALSE ✗" or "MOSTLY TRUE" or "MOSTLY FALSE" or "MISLEADING" or "IT'S COMPLICATED" or "UNVERIFIABLE",
  "confidence": "certain" | "high" | "moderate" | "low",
  "explanation": "2-4 sentences explaining exactly why the claim earns this ruling",
  "the_nuance": "The qualifier that most changes how the claim should be understood, or null",
  "origin_of_myth": "A specific supportable origin, or null",
  "what_is_true": "The most accurate replacement for the original claim — one sentence",
  "sources": ["Specific source lead 1", "Specific source lead 2"],
  "related_claims": ["Related checkable claim 1", "Related checkable claim 2"]
}`;

    // ════════════════════════════════════════
    // MODE 4: QUICK-FIRE TRIVIA
    // ════════════════════════════════════════
    } else if (mode === 'trivia') {
      const { category, difficulty, previousQuestions } = req.body;

      const prevBlock = (previousQuestions?.length > 0)
        ? `\n\nALREADY ASKED (DO NOT REPEAT OR REPHRASE ANY OF THESE — generate a COMPLETELY DIFFERENT question on a DIFFERENT sub-topic):\n${previousQuestions.slice(-15).map((q, i) => `${i + 1}. ${q}`).join('\n')}\n`
        : '';

      maxTokens = 500;
      prompt = `You are a trivia host. Generate ONE original ${difficulty || 'medium'}-difficulty trivia question in the category: ${category || 'General Knowledge'}.
${prevBlock}
RULES:
- 4 multiple-choice options with exactly ONE correct answer
- Wrong answers must be plausible — not obviously silly
- The question must be FACTUALLY VERIFIABLE with a single correct answer
- Pick a SPECIFIC and INTERESTING sub-topic within the category
- Keep the question concise (1-2 sentences max)
- Explanation: 1 sentence why the answer is correct + 1 fun bonus fact

Return ONLY this JSON — no other text:
{"question":"...","options":["A","B","C","D"],"correct_index":0,"correct_answer":"...","explanation": "1 sentence why + 1 fun fact — 1-2 sentences","difficulty_actual":"easy|medium|hard","category_label": "specific sub-category — 2-4 words"}`;

    // ════════════════════════════════════════
    // MODE 4b: TRIVIA CHALLENGE
    // ════════════════════════════════════════
    } else if (mode === 'trivia-check') {
      const { originalQuestion, userChallenge } = req.body;
      if (!originalQuestion || !userChallenge) {
        return res.status(400).json({ error: 'Question and challenge text required' });
      }

      maxTokens = 800;
      prompt = `${DATE_CONTEXT}You are THE FINAL WORD. A user is challenging a trivia answer. Re-check the question and answer from scratch; the original answer receives no presumption of correctness.

ORIGINAL QUESTION & ANSWER: ${originalQuestion}
USER'S CHALLENGE: "${userChallenge}"

RULES:
- Be fair — if they have a legitimate point, acknowledge it
- But don't cave to incorrect challenges
- State the best-supported answer. If the question is ambiguous or the original item has more than one defensible answer, say so and void the question rather than forcing a winner

Return ONLY this JSON:
{
  "challenge_valid": true | false | "partially",
  "ruling": "One sentence ruling on the challenge",
  "explanation": "Why the challenge is or isn't valid — 1-2 sentences",
  "definitive_answer": "The final, correct answer with supporting facts — one sentence"
}`;

    // ════════════════════════════════════════
    // MODE 5: FOLLOW-UP
    // ════════════════════════════════════════
    } else if (mode === 'follow-up') {
      const { originalQuestion, originalAnswer, followUpQuestion } = req.body;
      if (!followUpQuestion?.trim()) return res.status(400).json({ error: 'Please enter a follow-up question' });
      if (!originalAnswer) return res.status(400).json({ error: 'No original answer to follow up on' });

      maxTokens = 1400;
      prompt = `${DATE_CONTEXT}You are THE FINAL WORD. The user wants to go deeper. Treat the previous answer as context, not as an authority; correct it if the follow-up exposes a problem.

ORIGINAL QUESTION/CLAIM: "${originalQuestion || 'Not provided'}"
YOUR PREVIOUS ANSWER: "${typeof originalAnswer === 'string' ? originalAnswer : JSON.stringify(originalAnswer)}"
FOLLOW-UP QUESTION: "${followUpQuestion.trim()}"

RULES:
- Build on the previous answer — don't repeat the same information
- Go deeper on the specific aspect they're asking about
- Match confidence to the evidence; do not preserve confidence merely for consistency with the earlier answer
- If the follow-up changes the answer, say so clearly
${SOURCES_INSTRUCTION}

Return ONLY this JSON:
{
  "answer": "Clear, direct answer to the follow-up — one sentence",
  "confidence": "certain" | "high" | "moderate" | "low" | "uncertain",
  "explanation": "2-4 sentences going deeper",
  "changes_original": "How this qualifies the original answer (or null) — one sentence",
  "supporting_facts": ["Fact 1", "Fact 2"],
  "sources": ["Source 1", "Source 2"],
  "fun_extra": "Bonus related fact (or null) — one sentence"
}`;

    // ════════════════════════════════════════
    // MODE 6: APPEAL (Dispute Rematch)
    // ════════════════════════════════════════
    } else if (mode === 'appeal') {
      const { originalVerdict, newEvidence, appellantName } = req.body;
      if (!originalVerdict) return res.status(400).json({ error: 'No original verdict to appeal' });
      if (!newEvidence?.trim()) return res.status(400).json({ error: 'You must present new evidence or arguments for your appeal' });

      maxTokens = 1800;
      prompt = `${DATE_CONTEXT}You are THE FINAL WORD — APPEALS COURT. Reconsider a previous dispute verdict in light of new evidence or reasoning. The original verdict has no special status; the goal is a better conclusion, not institutional theater.

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
- Be concise and decisive, but never manufacture certainty
${SOURCES_INSTRUCTION}

Return ONLY this JSON:
{
  "appeal_ruling": "upheld" | "modified" | "overturned",
  "ruling_headline": "Bold one-line appeal ruling (e.g., 'Appeal DENIED — original verdict stands.' or 'OVERTURNED — new evidence changes everything.') — one sentence",
  "new_evidence_assessment": "How strong is the new evidence? 1-2 sentences.",
  "explanation": "3-4 sentence detailed explanation of the appeal ruling",
  "updated_scores": {
    "person_a": { "name": "...", "original_accuracy": 0-100, "revised_accuracy": 0-100 },
    "person_b": { "name": "...", "original_accuracy": 0-100, "revised_accuracy": 0-100 }
  },
  "final_answer": "The definitive answer after considering all evidence — one sentence",
  "case_closed": "A decisive closing statement — this is truly THE final word — one sentence",
  "sources": ["Source 1", "Source 2"]
}`;

    // ════════════════════════════════════════
    // MODE 7: DEVIL'S ADVOCATE
    // ════════════════════════════════════════
    } else if (mode === 'devils-advocate') {
      const { position, topic } = req.body;
      if (!position?.trim()) return res.status(400).json({ error: 'Please state your position' });

      maxTokens = 2000;
      prompt = `${DATE_CONTEXT}You are THE FINAL WORD — DEVIL'S ADVOCATE MODE. Steelman the strongest reasonable counter-position, then show the user where each side is strongest, weakest, and dependent on values or uncertain facts.

TOPIC: "${topic?.trim() || 'Not specified'}"
THEIR POSITION: "${position.trim()}"

RULES:
- First, generate the BEST possible counter-argument — not a straw man, the genuinely strongest opposition
- Make the counter-argument specific, well-reasoned, and backed by real facts/evidence
- Then compare BOTH positions fairly. Separate factual accuracy from argumentative strength and value judgments
- Don't go easy on the user — if their position is weak, say so
- But also don't artificially make the counter-argument win — be genuinely fair
- The goal is to stress-test their thinking, not to agree or disagree
- Judge how well each position holds up as one of five QUALITATIVE categories — strongly_supported, mostly_supported, partly_supported, weakly_supported, or not_supported — not a probability or a number you privately compute and then round to a label. Reason in these categories directly; both sides can land on the same one for different reasons.
${SOURCES_INSTRUCTION}

Return ONLY this JSON:
{
  "counter_position": "The strongest possible counter-argument in 2-3 sentences",
  "counter_supporting_facts": ["Fact supporting counter-argument 1", "Fact 2"],
  "verdict": "user_wins" | "counter_wins" | "both_valid" | "both_weak" | "its_complicated",
  "verdict_headline": "Bold one-line verdict — one sentence",
  "user_score": {
    "support": "strongly_supported" | "mostly_supported" | "partly_supported" | "weakly_supported" | "not_supported",
    "strengths": "What's strong about their position — one sentence",
    "weaknesses": "Where their position falls short — one sentence"
  },
  "counter_score": {
    "support": "strongly_supported" | "mostly_supported" | "partly_supported" | "weakly_supported" | "not_supported",
    "strengths": "What's strong about the counter-argument — one sentence",
    "weaknesses": "Where the counter falls short — one sentence"
  },
  "explanation": "3-4 sentence fair analysis of both positions",
  "the_nuance": "The key insight both sides might be missing — one sentence",
  "recommendation": "What the user should consider or research further — one sentence",
  "sources": ["Source 1", "Source 2"]
}`;

    } else {
      return res.status(400).json({ error: 'Invalid mode' });
    }

    // ── Call Claude ──
    let message;
    for (let _att = 1; _att <= 3; _att++) {
      try {
        message = await anthropic.messages.create({
      model: MODELS.SMART,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: withLanguage(prompt + NO_QUOTE_RULE, userLanguage) }]
    });
        break;
      } catch (_e) {
        if (_att === 3) throw _e;
        await new Promise(r => setTimeout(r, 1000 * _att));
      }
    }

    const textContent = message.content.find(item => item.type === 'text')?.text || '';
    const parsed = safeParseJSON(textContent);
    parsed._mode = mode;
    res.json(normalizeNullStrings(parsed));

  } catch (error) {
    console.error('The Final Word error:', error);
    res.status(500).json({ error: 'Failed to deliver the verdict. Please try again.' });
  }
});

// Shareable verdict links used to be server-side: POST here for an id,
// GET it back at open time. Removed after it 404'd in production even with
// disk persistence added for it (most likely a real deploy replaces the
// whole container, not just the process) — the frontend now encodes the
// verdict directly into the link itself (src/utils/shareEncode.js), which
// needs no route here at all. See src/components/SharedVerdict.js.

// ═══════════════════════════════════════════════════
// MULTIPLAYER TRIVIA — Room Management
// ═══════════════════════════════════════════════════

// Create a room
router.post('/the-final-word/room/create', rateLimit(DEFAULT_LIMITS), (req, res) => {
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
router.post('/the-final-word/room/:code/join', rateLimit(DEFAULT_LIMITS), (req, res) => {
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
router.get('/the-final-word/room/:code/state', rateLimit(DEFAULT_LIMITS), (req, res) => {
  try {
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
  } catch (error) {
    console.error('TheFinalWord room state error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Host: generate next question
router.post('/the-final-word/room/:code/next', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { playerId, userLanguage } = req.body;
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
    const prevBlock = room.previousQuestions.length > 0
      ? `\n\nALREADY ASKED (DO NOT REPEAT OR REPHRASE ANY OF THESE — generate a COMPLETELY DIFFERENT question on a DIFFERENT sub-topic):\n${room.previousQuestions.slice(-15).map((q, i) => `${i + 1}. ${q}`).join('\n')}\n`
      : '';

    const prompt = `You are a trivia host. Generate ONE original ${room.settings.difficulty}-difficulty trivia question in the category: ${room.settings.category}.
${prevBlock}
RULES:
- 4 multiple-choice options with exactly ONE correct answer
- Wrong answers must be plausible — not obviously silly
- The question must be FACTUALLY VERIFIABLE with a single correct answer
- Pick a SPECIFIC and INTERESTING sub-topic within the category
- Keep the question concise (1-2 sentences max)
- Explanation: 1 sentence why the answer is correct + 1 fun bonus fact

Return ONLY this JSON — no other text:
{"question":"...","options":["A","B","C","D"],"correct_index":0,"correct_answer":"...","explanation": "1 sentence why + 1 fun fact — 1-2 sentences","difficulty_actual":"easy|medium|hard","category_label": "specific sub-category — 2-4 words"}`;

    let message;
    for (let _att = 1; _att <= 3; _att++) {
      try {
        message = await anthropic.messages.create({
      model: MODELS.SMART,
      max_tokens: 4000,
      messages: [{ role: 'user', content: withLanguage(prompt + NO_QUOTE_RULE, userLanguage) }]
    });
        break;
      } catch (_e) {
        if (_att === 3) throw _e;
        await new Promise(r => setTimeout(r, 1000 * _att));
      }
    }

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
router.post('/the-final-word/room/:code/answer', rateLimit(DEFAULT_LIMITS), (req, res) => {
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
router.post('/the-final-word/room/:code/reveal', rateLimit(DEFAULT_LIMITS), (req, res) => {
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

// ════════════════════════════════════════
// DEEP DISSECT — FactOrFiction fold-in
// Break a claim into its component parts,
// each with its own verdict + reasoning
// ════════════════════════════════════════
router.post('/the-final-word/dissect', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { claim, userLanguage } = req.body;
    if (!claim?.trim()) return res.status(400).json({ error: 'Paste a claim to dissect.' });

    const DATE_CONTEXT = `Today's date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}. `;

    const systemPrompt = `${DATE_CONTEXT}You are THE FINAL WORD — a surgical fact-checker who doesn't just rule on claims, you dissect them. Your job: break a claim into its individual components and give each piece its own verdict with the reasoning shown.

Most claims that go viral aren't completely true or completely false — they're a mixture. A statistic is cherry-picked. A real event is exaggerated. A true fact is stripped of context that reverses its meaning. A legitimate concern is attached to a false cause.${NO_QUOTE_RULE}`;

    const userPrompt = `DEEP DISSECT THIS CLAIM:

"${claim.trim()}"

Break it into its component parts and evaluate each one.

Return ONLY valid JSON:
{
  "claim_as_stated": "The claim exactly as submitted — one sentence",
  "quick_read": "One sentence — what kind of claim this is and what's most important to know about it upfront",
  
  "components": [
    {
      "element": "The specific factual sub-claim or element being evaluated — one sentence",
      "verdict": "true | false | misleading | missing_context | exaggerated | unverifiable | opinion",
      "verdict_label": "TRUE ✓ | FALSE ✗ | MISLEADING | MISSING CONTEXT | EXAGGERATED | UNVERIFIABLE | OPINION",
      "reasoning": "2-3 sentences explaining exactly why this verdict — show the evidence, not just the conclusion",
      "matters_because": "One sentence on why this element is important to the overall claim (or null if minor)"
    }
  ],
  
  "what_the_claim_gets_right": "What's genuinely true in this claim — credit where it's due (or null) — one sentence",
  "what_changes_the_picture": "The missing context, omitted facts, or framing choices that most distort the overall impression — one sentence",
  "how_it_spread": "Why this claim is believable and how it circulates (or null if not a viral-style claim) — one sentence",
  "the_accurate_version": "A corrected version of the claim that someone could actually share — true to the spirit of what they were trying to say but accurate — one sentence",
  
  "overall_verdict": {
    "ruling": "true | mostly_true | mixed | mostly_false | false | misleading | opinion",
    "ruling_display": "TRUE ✓ | MOSTLY TRUE | MIXED | MOSTLY FALSE | FALSE ✗ | MISLEADING | OPINION",
    "one_line": "The verdict in one plain-English sentence — one sentence"
  }
}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2000,
      system: withLanguage(systemPrompt, userLanguage),
      messages: [{ role: 'user', content: withLanguage(userPrompt, userLanguage) }],
    }, { label: 'the-final-word' });
    res.json(normalizeNullStrings(parsed));

  } catch (error) {
    console.error('TheFinalWord dissect error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
