const express = require('express');
const router = express.Router();
const { anthropic, cleanJsonResponse } = require('../lib/claude');

// ═══════════════════════════════════════════════════
// THE FINAL WORD — Settle arguments with authority
// ═══════════════════════════════════════════════════

// Helper: safe JSON parse with repair
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
    // Try fixing common issues
    cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, ' ');
    cleaned = cleaned.replace(/([{,]\s*)(\w+)\s*:/g, '$1"$2":');
    return JSON.parse(cleaned);
  }
}

// ─── MODE: Quick Question ───
router.post('/the-final-word', async (req, res) => {
  try {
    const { mode, question, claimA, claimB, personA, personB, claim, context } = req.body;

    if (!mode) {
      return res.status(400).json({ error: 'Please select a mode' });
    }

    let prompt, maxTokens;

    // Current date context — prevents the model from thinking recent events are "in the future"
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const DATE_CONTEXT = `TODAY'S DATE: ${dateStr}. Use this to reason about what has already happened vs. what is upcoming. For example, if today is February 2026, the 2025-26 NFL season is nearly or fully complete, not "in the future."\n\n`;

    // ════════════════════════════════════════
    // MODE 1: QUICK QUESTION
    // ════════════════════════════════════════
    if (mode === 'question') {
      if (!question || !question.trim()) {
        return res.status(400).json({ error: 'Please ask a question' });
      }

      maxTokens = 1200;
      prompt = `${DATE_CONTEXT}You are THE FINAL WORD — an authoritative, confident fact-resolver. Someone has asked a factual question and wants a clear, definitive answer. Be direct. Be confident. Be correct.

QUESTION: "${question.trim()}"

RULES:
- Give the ANSWER first, boldly and clearly
- If it's a factual question with a clear answer, give high confidence
- If it's subjective or debatable, say so honestly — classify as "opinion" or "debatable"
- Keep explanation to 2-3 sentences max
- Include 1-2 verifiable facts that support the answer
- If the question is nonsensical, say so with humor

Return ONLY this JSON:
{
  "answer": "The clear, bold answer in one sentence",
  "confidence": "certain" | "high" | "moderate" | "low" | "uncertain",
  "category": "fact" | "opinion" | "debatable" | "myth" | "nonsense",
  "explanation": "2-3 sentence explanation with key supporting facts",
  "supporting_facts": ["Fact 1 that backs this up", "Fact 2"],
  "common_misconception": "What people often get wrong about this (or null if none)",
  "fun_extra": "One bonus interesting related fact (keep it short and surprising)"
}`;

    // ════════════════════════════════════════
    // MODE 2: SETTLE A DISPUTE
    // ════════════════════════════════════════
    } else if (mode === 'dispute') {
      if (!claimA || !claimA.trim() || !claimB || !claimB.trim()) {
        return res.status(400).json({ error: 'Please provide both sides of the dispute' });
      }

      const nameA = (personA && personA.trim()) || 'Person A';
      const nameB = (personB && personB.trim()) || 'Person B';
      const ctx = context ? `\nCONTEXT: ${context.trim()}` : '';

      maxTokens = 1500;
      prompt = `${DATE_CONTEXT}You are THE FINAL WORD — the ultimate argument referee. Two people disagree. Your job is to deliver a fair, authoritative verdict. Be direct.

${nameA} SAYS: "${claimA.trim()}"
${nameB} SAYS: "${claimB.trim()}"${ctx}

RULES:
- Determine who is MORE correct (or if both are wrong, or both partially right)
- Be specific about what each person got right and wrong
- Don't hedge excessively — people want a VERDICT
- If it's genuinely a matter of opinion, say so, but still provide useful context

CRITICAL — HANDLING TIME-SENSITIVE AND OPINION CLAIMS:
- If the claims involve current rankings, standings, stats, or performance (sports, markets, tech, etc.), you MUST acknowledge that your knowledge has a cutoff and you may not have the latest data. DO NOT present possibly outdated stats as current fact.
- For "best" claims in sports/entertainment/subjective domains: frame it as OPINION and provide the objective criteria someone could use to settle it (e.g., "Check current NFL offensive rankings at espn.com/nfl/stats"). Give each person credit for having a defensible position rather than scoring them low based on stale data.
- For claims that ARE verifiable facts (history, science, geography), be fully authoritative.
- Keep the tone fun but authoritative — you're the ref, not a lecturer

Return ONLY this JSON:
{
  "verdict": "who_a_wins" | "who_b_wins" | "both_right" | "both_wrong" | "its_complicated" | "opinion",
  "winner_name": "${nameA}" or "${nameB}" or "Neither" or "Both",
  "verdict_headline": "Bold one-line verdict (e.g., '${nameA} nails it.' or 'Both of you are wrong.')",
  "score": {
    "person_a": { "name": "${nameA}", "accuracy": 0-100, "what_they_got_right": "...", "what_they_got_wrong": "..." },
    "person_b": { "name": "${nameB}", "accuracy": 0-100, "what_they_got_right": "...", "what_they_got_wrong": "..." }
  },
  "explanation": "2-4 sentence breakdown of the facts",
  "the_actual_answer": "What the correct/complete answer actually is",
  "time_sensitive": true | false,
  "how_to_verify": "If time-sensitive or opinion, tell them exactly where to check live data (specific URL or source). null if not needed.",
  "settlement_suggestion": "A fun, diplomatic way to move on (e.g., 'Loser buys the next round')"
}`;

    // ════════════════════════════════════════
    // MODE 3: FACT CHECK
    // ════════════════════════════════════════
    } else if (mode === 'factcheck') {
      if (!claim || !claim.trim()) {
        return res.status(400).json({ error: 'Please enter a claim to fact-check' });
      }

      maxTokens = 1200;
      prompt = `${DATE_CONTEXT}You are THE FINAL WORD — a sharp, authoritative fact-checker. Someone has made a claim and wants to know if it's true. Deliver a clear ruling.

CLAIM: "${claim.trim()}"

RULES:
- Give a clear ruling: TRUE, FALSE, MOSTLY TRUE, MOSTLY FALSE, MISLEADING, or IT'S COMPLICATED
- Don't be wishy-washy — commit to a rating
- Explain WHY in 2-3 sentences with specific facts
- If it's a common myth, explain how it started
- If context matters (e.g., "it depends on..."), note the key qualifier

Return ONLY this JSON:
{
  "ruling": "true" | "false" | "mostly_true" | "mostly_false" | "misleading" | "complicated" | "unverifiable",
  "ruling_display": "TRUE ✓" or "FALSE ✗" or "MOSTLY TRUE" or "MOSTLY FALSE" or "MISLEADING" or "IT'S COMPLICATED" or "UNVERIFIABLE",
  "confidence": "certain" | "high" | "moderate" | "low",
  "explanation": "2-3 sentences explaining the ruling with specific facts",
  "the_nuance": "Key qualifier or context that matters (or null)",
  "origin_of_myth": "If false/misleading, how did this belief start? (or null)",
  "what_is_true": "The accurate version of this claim",
  "share_summary": "One-line tweetable summary of the ruling"
}`;

    // ════════════════════════════════════════
    // MODE 4: QUICK-FIRE TRIVIA
    // ════════════════════════════════════════
    } else if (mode === 'trivia') {
      const { category, difficulty, previousQuestions } = req.body;
      const prevList = (previousQuestions && previousQuestions.length > 0)
        ? `\nNO REPEATS: ${previousQuestions.slice(-10).join('; ')}`
        : '';

      maxTokens = 500;
      prompt = `Trivia question. ${category || 'General Knowledge'}, ${difficulty || 'medium'} difficulty.${prevList}
4 multiple-choice options, one correct. Plausible wrong answers. Short explanation.
JSON ONLY:
{"question":"...","options":["A","B","C","D"],"correct_index":0,"correct_answer":"...","explanation":"1 sentence why + 1 fun fact","difficulty_actual":"easy|medium|hard","category_label":"specific sub-category"}`;

    // ════════════════════════════════════════
    // MODE 4b: CHECK TRIVIA ANSWER
    // ════════════════════════════════════════
    } else if (mode === 'trivia-check') {
      // No AI needed — answer checking is done client-side
      // This route exists for the "Actually..." challenge
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

    } else {
      return res.status(400).json({ error: 'Invalid mode. Use: question, dispute, factcheck, or trivia' });
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

module.exports = router;
