const express = require('express');
const router = express.Router();
const { withLanguage, withLocaleContext, callClaudeWithRetry } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const PERSONALITY = `Presentation coach for people who already have something to say and need help making it work in the room.

Protect the speaker's meaning, facts, commitments, and natural voice. Improve what is there; do not invent evidence, achievements, statistics, anecdotes, quotations, audience reactions, or certainty the source does not support.

Be practical rather than theatrical. The goal is a presentation the user can actually deliver: clear, concise, credible, and suited to the audience.

Never place a double-quote (") character inside any JSON string value — quoted claims, audience questions, and presentation lines must be written plainly or with single quotes, or it breaks the JSON.`;

// ─── CUT: Trim content to fit a time limit ───
router.post('/the-runthrough-cut', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  // Keep-alive heartbeat (same pattern as party-architect — see its
  // tool-notes for the original incident). A single SMART generation
  // already ran 10-11s locally at typical length; the shortfall-retry path
  // below can run it TWICE with zero response bytes sent in between, and
  // long source text pushes token count further still. Reported live as a
  // 502 with no app-level error body — the signature of an upstream proxy
  // deciding a silent connection is dead, not a code failure (this route
  // never returns a bare "502"; that string can only come from in front of
  // us). Writing a whitespace byte periodically keeps the connection
  // visibly active; JSON.parse ignores leading/trailing whitespace, so the
  // success path needs no frontend change. The error path DOES rely on a
  // frontend change already in place (useClaudeAPI.js): once any byte is
  // written the HTTP status is committed to 200, so a failure discovered
  // after that point is reported as a bare {error} body instead of a status
  // code — the frontend already treats that shape as a failure.
  let keepAlive = null;
  try {
    const { content, timeMinutes, context, userLanguage } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ error: 'Paste your presentation content.' });
    }
    if (!timeMinutes || timeMinutes < 1) {
      return res.status(400).json({ error: 'Set a time limit (in minutes).' });
    }

    res.setHeader('Content-Type', 'application/json');
    res.flushHeaders();
    keepAlive = setInterval(() => {
      try { res.write(' '); } catch { /* connection already gone */ }
    }, 10000);

    const userPrompt = `PRESENTATION CUT MODE:

CONTENT:
"""
${content.trim()}
"""

TIME LIMIT: ${timeMinutes} minutes
${context ? `CONTEXT: ${context.trim()}` : ''}

Treat the time limit as a CEILING, not a quota. Estimate a normal speaking pace at about 130 words per minute, but recognize that pauses, emphasis, slides, demonstrations, and audience interaction can make delivery slower.

Your job:
1. Determine whether the source already fits comfortably inside the time limit.
2. If it already fits: treat the time limit as a CEILING, not a target. Do not shorten the presentation merely to use less of the available time, and do not rewrite it just to make it sound different. But use the supplied context (audience, stakes, setting) to judge whether genuinely greater brevity would materially improve the presentation regardless of the time limit — for example a notoriously impatient audience, a context that signals "keep this tight," or material that is clearly over-explained on its own terms, independent of the clock.
   - If tightening would NOT materially help: return the source essentially unchanged (correcting only an obvious spoken-language stumble if necessary), set revision_status to "unchanged", and leave what_was_cut empty.
   - If tightening WOULD materially help: return a tightened version, set revision_status to "tightened". There is no minimum length for this case: remove only what genuinely improves clarity or pacing, never to hit a number.
3. If it does not fit, cut it down. Set revision_status to "cut". HARD FLOOR: trimmed_content must be AT LEAST ${Math.round(timeMinutes * 130 * 0.7)} words (70% of the ${timeMinutes * 130}-word target) — NEVER fewer, no matter how much low-value material you find. Reaching the floor before you run out of things you'd like to remove means STOP CUTTING and keep the rest, even material you consider secondary. A trimmed talk under the floor is not a successful edit; it is a summary standing in for a talk, and that is a failure regardless of how "unnecessary" the removed material seemed. Preserve the speaker's meaning, factual claims, caveats, commitments, chronology, and voice.
4. Remove low-value setup, repetition, throat-clearing, unnecessary examples, and detail before removing information the audience needs — cut in that order, and STOP at the floor in step 3, not when you run out of "nice to cut" material.
5. Never add facts, explanations, promises, rationale, or conclusions that were not in the source.
6. Do not turn plain speech into keynote language. This is a run-through, not a speechwriter.
7. Pacing notes should identify only 2-3 moments where delivery meaningfully changes comprehension or emphasis.
8. Before returning, count the words in your own trimmed_content. If revision_status is "cut" and the count is under ${Math.round(timeMinutes * 130 * 0.7)} words, you have cut too much — add back material from the source (in the speaker's own words, not new content) until you clear the floor.
9. Never report a cut, tightening, or change that the returned text does not actually contain. trimmed_content, trimmed_word_count, trimmed_est_minutes, what_was_cut, and what_was_kept must all describe the same, actual edit — if nothing changed, say so exactly; if you tightened, describe only material you actually removed.
10. what_was_kept names ONE thing: the central message or decision this presentation exists to deliver — the sentence you'd say if someone asked "what is this actually about?" It is never a list or summary of what got preserved (topics covered, figures retained, sections kept) — that is an inventory, not a thesis, and applies whether revision_status is "unchanged", "tightened", or "cut". Whether the source already fit the time limit is reported elsewhere; do not restate it here.

Return ONLY valid JSON:

{
  "session_title": "3-6 word neutral label naming what this presentation is about, e.g. 'Q3 Budget Review' or 'Team Standup Update' — for a history list, never shown as the deliverable itself",
  "context_label": "2-3 word label for the setting, e.g. 'Team Standup', 'Investor Pitch', 'Conference Talk' — derived from CONTEXT above if one was given, otherwise null. Never invent a setting that was not stated or clearly implied.",
  "revision_status": "unchanged" | "tightened" | "cut" — MUST be exactly one of these three lowercase English words, never translated or rephrased regardless of the output language; pick the one that matches what you actually did (see rules 2-3),
  "original_word_count": 0,
  "original_est_minutes": 0,
  "target_minutes": ${timeMinutes},
  "trimmed_content": "the deliverable presentation text — if revision_status is 'cut', at least ${Math.round(timeMinutes * 130 * 0.7)} words, a hard floor (see rule 3); if 'unchanged' or 'tightened', whatever length is actually right — no minimum",
  "trimmed_word_count": 0,
  "trimmed_est_minutes": 0,
  "what_was_cut": [
    {
      "section": "A short description of material actually removed",
      "reason": "Why removing it helps — fitting the time limit if revision_status is 'cut', or improving clarity/pacing if 'tightened'"
    }
  ],
  "what_was_kept": "One sentence naming the single central message or decision this presentation exists to deliver — never a list or summary of what was retained (see rule 10)",
  "pacing_notes": "2-3 brief, concrete delivery notes joined as one string"
}

If nothing needed to change, return an empty what_was_cut array. Do not manufacture cuts to justify a "cut" or "tightened" status — most presentations that already fit should come back as "unchanged".`;

    // The floor in the prompt (rule 3) is a real instruction, not a
    // formality — but it's a length constraint, exactly the kind of thing a
    // model follows unreliably even when stated as a HARD FLOOR with a
    // self-check step. Measured live against the golden 1,284-word/5-min
    // case: three back-to-back identical calls returned 108, 372, and 459
    // words against a 455-word floor — one attempt in three actually met it.
    // One retry, fed the actual shortfall instead of a generic reminder,
    // is a real second chance rather than the same coin flip again.
    const floorWords = Math.round(timeMinutes * 130 * 0.7);
    const wordCount = (text) => (text || '').trim().split(/\s+/).filter(Boolean).length;
    // Ceiling scales with the target: ~130 wpm × ~1.35 tokens/word + schema
    // overhead. Base bumped 1200→2000 on 2026-09-14 for the two new short
    // fields (session_title, context_label) and the extra RULES text added
    // this session. NOT bumped further to "fix" the truncation below —
    // measured live on the golden 1284w/5min case, the SAME input produced
    // 1721 output tokens on one call and ran the ceiling dry at 4100 on the
    // next: that is model variance, not underbudgeting, and no ceiling
    // reliably absorbs it without making every call slower (directly
    // fighting the point of the heartbeat above). A concise-mode retry
    // handles it instead — see below.
    const maxTokens = Math.min(8000, 2000 + Number(timeMinutes) * 220);

    let parsed;
    try {
      parsed = await callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: maxTokens,
        system: withLanguage(PERSONALITY, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
        messages: [{ role: 'user', content: userPrompt }],
      }, { label: 'the-runthrough' });
    } catch (err) {
      // callClaudeWithRetry fails fast (no parse attempt) on max_tokens —
      // the model ran out of room before finishing valid JSON, a different
      // failure than the floor-shortfall case below (that one gets a
      // parsed-but-short response; this one gets nothing parseable at all).
      // One retry with an explicit instruction to be concise, rather than
      // failing the request outright on what measured as a genuinely
      // variable failure rate, not a rare fluke.
      if (!/max_tokens/.test(err?.message || '')) throw err;
      const concisePrompt = `${userPrompt}\n\nYOUR PREVIOUS ATTEMPT AT THIS ran out of room before finishing — it was too long to complete within the response limit. Try again meaningfully more concise: one clear sentence per what_was_cut entry (not several), no restating the rules back, no repeated phrasing anywhere. Keep every field as tight as the job allows while still meeting the HARD FLOOR in rule 3.\n\nReturn ONLY valid JSON, the same shape as before.`;
      parsed = await callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: maxTokens,
        system: withLanguage(PERSONALITY, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
        messages: [{ role: 'user', content: concisePrompt }],
      }, { label: 'the-runthrough-concise-retry' });
    }

    // The floor only means anything when a cut was actually required for
    // time — "unchanged" and "tightened" are legitimately allowed to be
    // short (or even shorter than the mechanical floor) if that's just what
    // the source is. Gating on revision_status stops the retry from forcing
    // padding back into a presentation that was never asked to hit a length.
    if (parsed.revision_status === 'cut' && parsed.trimmed_content && wordCount(parsed.trimmed_content) < floorWords && wordCount(parsed.trimmed_content) < wordCount(content)) {
      // Repeats userPrompt's own JSON instruction explicitly (rather than
      // relying on it riding along inside the ${userPrompt} interpolation)
      // for the same reason it's worth restating up front: an instruction
      // nearer the end of a long prompt is followed more reliably than one
      // buried a thousand words earlier.
      const shortfallPrompt = `${userPrompt}\n\nYOUR PREVIOUS ATTEMPT AT THIS returned only ${wordCount(parsed.trimmed_content)} words, well under the ${floorWords}-word floor. Try again: add back real material from the source in the speaker's own words — do not invent new content — until trimmed_content clears ${floorWords} words. Cut only what you removed before that was genuinely dispensable; the rest goes back in.\n\nReturn ONLY valid JSON, the same shape as before.`;
      try {
        const retried = await callClaudeWithRetry({
          model: MODELS.SMART,
          max_tokens: maxTokens,
          system: withLanguage(PERSONALITY, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
          messages: [{ role: 'user', content: shortfallPrompt }],
        }, { label: 'the-runthrough-cut-retry' });
        // Only replace the first attempt if the retry actually did better —
        // a second roll of the same dice landing lower would otherwise
        // silently make the result worse.
        if (retried.trimmed_content && wordCount(retried.trimmed_content) > wordCount(parsed.trimmed_content)) {
          parsed = retried;
        }
      } catch (_) {
        // Keep the first attempt — a failed retry must not turn a usable
        // (if short) result into a hard error.
      }
    }

    clearInterval(keepAlive);
    if (!parsed.trimmed_content) {
      return res.end(JSON.stringify({ error: 'Could not analyze your presentation. Please try again.' }));
    }
    // res.end, not res.json: the heartbeat already sent and flushed headers
    // (Express's res.json() would try to set them again and throw).
    res.end(JSON.stringify(parsed));

  } catch (error) {
    if (keepAlive) clearInterval(keepAlive);
    console.error('TheRunthrough Cut error:', error);
    // callClaudeWithRetry fails fast (no parse attempt) when stop_reason === 'max_tokens'.
    const message = /max_tokens/.test(error?.message || '')
      ? 'The revised version was too long to generate — try a shorter source or split the talk.'
      : 'Something went wrong. Please try again.';
    if (!res.headersSent) {
      res.status(500).json({ error: message });
    } else {
      res.end(JSON.stringify({ error: message }));
    }
  }
});

// ─── ANTICIPATE: Predict tough Q&A ───
router.post('/the-runthrough-anticipate', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  // Keep-alive heartbeat — see the Cut route above for why. Measured live
  // at 56s for a single generation here (4-6 questions with full draft
  // answers is a genuinely large completion), the slowest of the three
  // modes and the one most likely to trip an upstream proxy timeout.
  let keepAlive = null;
  try {
    const { content, audience, stakes, userLanguage } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ error: 'Paste your presentation content.' });
    }

    res.setHeader('Content-Type', 'application/json');
    res.flushHeaders();
    keepAlive = setInterval(() => {
      try { res.write(' '); } catch { /* connection already gone */ }
    }, 10000);

    const audienceMap = {
      executives: 'C-suite executives — care about ROI, risk, and bottom line. Short attention spans. Will interrupt.',
      investors: 'Investors / VCs — looking for market size, traction, defensibility. Skeptical by default.',
      team: 'Internal team — want to know how this affects them. Looking for clarity and fairness.',
      clients: 'Clients / customers — care about value, reliability, and trust. Will compare to competitors.',
      academic: 'Academic / conference — care about rigor, methodology, and novelty. Will probe assumptions.',
      general: 'General / mixed audience — varied knowledge levels. Questions will range from basic to pointed.',
    };

    const userPrompt = `PRESENTATION ANTICIPATE MODE:

CONTENT:
"""
${content.trim()}
"""

AUDIENCE: ${audienceMap[audience] || audienceMap.general}
${stakes ? `STAKES: ${stakes.trim()}` : ''}

Give the speaker a fast pre-flight check before presenting. Predict the questions most likely to expose a weak spot, misunderstanding, missing fact, or consequential tradeoff in THIS presentation for THIS audience.

This is not a generic Q&A generator and not a hostile-interrogation exercise.

RULES:
- Ground every predicted question in something actually present, implied, or conspicuously absent from the presentation.
- Distinguish a weak claim from a claim that simply needs supporting detail.
- Draft answers may use only facts contained in the presentation or supplied context. Never turn a plausible explanation, plan, capability, or assumption into something the speaker can state as fact. When information needed to answer is missing, use an explicit placeholder or give the speaker a safe response structure that acknowledges what must be checked before presenting.
- Never fabricate metrics, dates, evidence, customer results, commitments, motives, or certainty.
- Prefer the 4-6 questions that would matter most over a long list of clever questions.
- Make draft answers sound speakable, direct, and honest.
- Use difficulty as a practical indicator of how much preparation the question deserves, not as drama.
- The curveball must still be plausible for the stated audience; no random gotchas.
- Overall readiness should tell the user what to fix before presenting, not merely grade them.

Return ONLY valid JSON:

{
  "session_title": "3-6 word neutral label naming what this presentation is about, e.g. 'Checkout Redesign — Budget Request' — for a history list, never shown as the deliverable itself",
  "presentation_summary": "1-2 sentences stating the presentation's main message and intended takeaway",
  "vulnerability_scan": {
    "weakest_claim": "The claim or passage most in need of support or clarification — or 'No obvious weak claim' if none",
    "missing_data": "The most consequential information the audience may reasonably ask for that is not supplied — or 'Nothing obvious' if none",
    "assumption_risk": "The unstated assumption most likely to affect the conclusion — or 'No major assumption risk' if none"
  },
  "tough_questions": [
    {
      "question": "A natural question this audience could actually ask",
      "why_they_ask": "The concern underneath it",
      "difficulty": "hard | very_hard | killer",
      "draft_answer": "A concise, speakable answer using only supported information; if key information is missing, acknowledge that and show how to answer without bluffing",
      "trap_to_avoid": "The specific mistake that would make this answer weaker"
    }
  ],
  "curveball": {
    "question": "One less-obvious but plausible question",
    "draft_answer": "A calm way to handle it without inventing information"
  },
  "overall_readiness": "1-2 candid sentences naming the most useful preparation step before the presentation"
}

Generate 4-6 tough_questions, ordered by how important they are to prepare for.`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      system: withLanguage(PERSONALITY, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'the-runthrough-2' });
    clearInterval(keepAlive);
    if (!parsed.presentation_summary) {
      return res.end(JSON.stringify({ error: 'Could not analyze your presentation. Please try again.' }));
    }
    res.end(JSON.stringify(parsed));

  } catch (error) {
    if (keepAlive) clearInterval(keepAlive);
    console.error('TheRunthrough Anticipate error:', error);
    const message = 'Something went wrong. Please try again.';
    if (!res.headersSent) {
      res.status(500).json({ error: message });
    } else {
      res.end(JSON.stringify({ error: message }));
    }
  }
});

// ─── HOOK: Rewrite opening, closing, transitions ───
router.post('/the-runthrough-hook', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  // Keep-alive heartbeat — see the Cut route above for why.
  let keepAlive = null;
  try {
    const { content, tone, goal, userLanguage } = req.body;

    if (!content?.trim()) {
      return res.status(400).json({ error: 'Paste your presentation content.' });
    }

    res.setHeader('Content-Type', 'application/json');
    res.flushHeaders();
    keepAlive = setInterval(() => {
      try { res.write(' '); } catch { /* connection already gone */ }
    }, 10000);

    const toneMap = {
      authoritative: 'AUTHORITATIVE — Confident, commanding, "I know this cold." Think keynote energy.',
      conversational: 'CONVERSATIONAL — Warm, relatable, "Let me tell you a story." Think fireside chat.',
      provocative: 'PROVOCATIVE — Bold, challenging, "Everything you think you know is wrong." Think debate opener.',
      inspirational: 'INSPIRATIONAL — Uplifting, visionary, "Imagine a world where..." Think graduation speech.',
    };

    const userPrompt = `PRESENTATION HOOK MODE:

CONTENT:
"""
${content.trim()}
"""

TONE: ${toneMap[tone] || toneMap.conversational}
${goal ? `GOAL: ${goal.trim()}` : ''}

Strengthen the moments that determine whether the audience follows the presentation: the opening, closing, and the most important transitions.

RULES:
- Preserve the speaker's actual message and recognizable voice.
- Make the smallest rewrite that produces a meaningful improvement.
- Improve rhetoric, structure, emphasis, and transitions without adding a new factual claim, causal conclusion, characterization, or lesson that the source does not establish. A memorable line may sharpen an existing idea, but it must not create a new idea and then attribute it to the speaker or their examples.
- Do not force a flashy hook. A clear stakes statement, useful question, concrete problem, or direct promise is often stronger than theatrics.
- If the existing opening or closing already works, refine it rather than replacing it for novelty.
- Avoid clichés such as 'Imagine a world where', 'Have you ever wondered', and 'Everything you think you know is wrong' unless the source genuinely earns them.
- Transitions should help the audience understand why the next section follows; they should not merely sound polished. When a transition would require knowledge of material not supplied, write a neutral bridge rather than inventing what the later material proves.
- Honor the requested tone without making the speaker sound like a different person.
- If the source has no identifiable section break, return only transitions that are genuinely useful.

Return ONLY valid JSON:

{
  "session_title": "3-6 word neutral label naming what this presentation is about, e.g. 'Why Roadmaps Fail' — for a history list, never shown as the deliverable itself",
  "central_idea": "One sentence naming the core idea this presentation argues or delivers — the thesis itself, not the technique used to open or close it, and never a summary of the diagnosis or transitions",
  "diagnosis": {
    "current_opening": "What the opening currently does",
    "opening_problem": "The single most useful improvement, or 'Already strong' if it is",
    "current_closing": "What the closing currently does",
    "closing_problem": "The single most useful improvement, or 'Already strong' if it is"
  },
  "new_opening": {
    "text": "A concise, ready-to-deliver opening grounded entirely in the source",
    "technique": "The plain-language approach used",
    "why_it_works": "Why this version better prepares this audience to listen"
  },
  "new_closing": {
    "text": "A concise, ready-to-deliver closing grounded entirely in the source",
    "technique": "The plain-language approach used",
    "why_it_works": "Why this version leaves the intended takeaway clear"
  },
  "transitions": [
    {
      "between": "The two ideas or sections being connected",
      "original": "What currently connects them, or 'No transition'",
      "rewritten": "A brief, speakable bridge",
      "why": "What relationship this makes clearer"
    }
  ],
  "energy_arc": "2-3 practical sentences about where to build, pause, simplify, or land — based on the actual content rather than generic performance advice"
}

Generate 0-3 transitions: only the ones that materially improve comprehension.`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 3000,
      system: withLanguage(PERSONALITY, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'the-runthrough-3' });
    clearInterval(keepAlive);
    if (!parsed.diagnosis) {
      return res.end(JSON.stringify({ error: 'Could not analyze your presentation. Please try again.' }));
    }
    res.end(JSON.stringify(parsed));

  } catch (error) {
    if (keepAlive) clearInterval(keepAlive);
    console.error('TheRunthrough Hook error:', error);
    const message = 'Something went wrong. Please try again.';
    if (!res.headersSent) {
      res.status(500).json({ error: message });
    } else {
      res.end(JSON.stringify({ error: message }));
    }
  }
});

module.exports = router;
