const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { runOutputGuard } = require('../lib/outputGuard');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — write quoted dialogue or phrases plainly or with single quotes, or it breaks the JSON.';

// ═══════════════════════════════════════════════════════════════
// MAIN ANALYSIS
// ═══════════════════════════════════════════════════════════════

router.post('/conflict-coach', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { receivedMessage, relationship, emotionalState, goals, userDraft, actualGoal, isThread, personLabel, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!receivedMessage || receivedMessage.trim().length < 10) {
      return res.status(400).json({ error: 'Please provide the message (at least 10 characters)' });
    }

    const emotionsText = emotionalState?.length > 0 ? emotionalState.join(', ') : 'not specified';
    const goalsText = goals?.length > 0 ? goals.map(g => g.replace(/_/g, ' ')).join(', ') : 'respond thoughtfully';

    const systemPrompt = 'You are an expert conflict resolution coach with deep knowledge of manipulation tactics, attachment theory, and de-escalation. CRITICAL: Return ONLY valid JSON. ' + NO_QUOTE_RULE;

    // One 12-key schema at max_tokens 6000 measured 79-84s — past the ~60s where
    // Safari abandons the fetch. Reading the message and writing the reply are a
    // clean seam: disjoint top-level keys, same brief, merged back to the
    // original response shape (frontend untouched).
    const brief = `Expert conflict resolution coach. Analyze this ${isThread ? 'conversation thread' : 'message'} and prevent reactive texting.

${isThread ? 'CONVERSATION THREAD' : 'MESSAGE RECEIVED'}:
"${receivedMessage}"
${personLabel ? `Person: ${personLabel}` : ''}

CONTEXT:
Relationship: ${relationship}
Current emotions: ${emotionsText}
Goals: ${goalsText}
${actualGoal ? `Desired outcome: "${actualGoal}"` : ''}
${userDraft ? `\n⚠️ REACTIVE DRAFT they want to send: "${userDraft}"` : ''}

RELATIONSHIP RULES:
${relationship === 'Partner' ? 'Partner: high stakes. Repair crucial. No "winning." Long-term health.' : ''}
${relationship === 'Ex' ? 'Ex: minimize contact. Gray rock. Ask: "Do I need to respond at all?"' : ''}
${relationship === 'Family' ? "Family: can't exit. Boundaries essential. Consider therapy for chronic patterns." : ''}
${relationship === 'Coworker' ? 'Coworker: professional. Document if needed. No personal attacks.' : ''}

You are producing ONE PART of the analysis. Another coach is producing the other part — return only your own keys.`;

    // ── Part A: what is actually going on in the message (and the draft) ──
    const readPrompt = `${brief}

YOUR PART: diagnose the incoming message, the tactics in it, and the user's draft.

MANIPULATION DETECTION (CRITICAL — analyze the INCOMING message for these):
Scan for: gaslighting ("that never happened", "you're imagining things"), DARVO (deny-attack-reverse victim/offender), guilt-tripping ("after everything I've done"), stonewalling threats ("fine, I just won't talk"), passive aggression, love-bombing after conflict, false equivalence ("you do it too"), blame-shifting, silent treatment threats, catastrophizing ("you ALWAYS/NEVER"), weaponized vulnerability ("I guess I'm just a terrible person"), triangulation ("everyone agrees with me"), dismissiveness ("you're overreacting"), financial/emotional threats.
If tactics found, name them clearly with the exact phrase that triggered detection and a healthy counter-response.

${userDraft ? `DRAFT ANALYSIS: "${userDraft}"\nDetect: angry tone, sarcasm, passive-aggression, generalizations (always/never), counter-accusations, dismissiveness, escalation signals.` : ''}

YOU ARE READING A MESSAGE, NOT A PERSON. You have one message and whatever the
visitor typed about it. You have not met the sender, you do not know what they
meant, felt, needed or were trying to do, and a message is not enough to
diagnose anybody. Quote what is on the page and stop there — "always" appears
twice, the question is asked three times, the last line is a threat to leave.
Those are observations, and they are what actually helps someone reply.

So: no emotional temperature, no score of any kind, no primary emotion, no
underlying need, no communication style, no named manipulation tactic, no
diagnosis of the relationship, and nothing about how they will react to what
the visitor sends. Every one of those is a determination about a stranger, and
the visitor is the only person here who knows them.

USE THEIR WORD FOR WHO THIS IS. The relationship is stated above. If it says
partner, the person is a partner in every field you write — not a roommate, not
a friend, not a colleague. Do not introduce a living arrangement, a workplace,
a shared history or anything else that was not supplied. Getting this wrong is
worse than saying nothing, because they can see it is wrong immediately and
will not trust the replies either.

AND THE REPLIES MAY REFLECT WHAT WAS SAID, NEVER WHAT IS FELT. "I hear that
you're frustrated with me" tells someone what they are feeling; nobody said
that. "Something specific has been bothering you" asserts an inner state and a
cause. Reflect the words instead — I hear you. You said I ignored you. You
asked and it did not happen. Those are on the page, and they de-escalate
without telling the other person about themselves.

Return ONLY valid JSON with EXACTLY these four top-level keys:
{
  "message_analysis": {
    "triggers_identified": ["The exact phrases doing the damage, quoted from their message. A short note after a quote is allowed ONLY as a possibility about the WORDS, and phrased as one: CAN READ AS, MAY LAND AS, LEAVES LITTLE ROOM FOR. Not 'delivers a criticism' but 'can read as criticism'; not 'closes the exchange' but 'can read as closing the exchange'. The difference is whether you are describing the sentence or ruling on it. Never a 'likely meaning' — you cannot know that literal words mean their opposite. And never a name for an attitude behind them: contempt, disdain, passive aggression and dismissiveness are all verdicts on a person, and hedging one does not fix it. Never a determination about the sender, and never why they chose it. If a note would need the word because, cut it."],
    "whats_being_asked": "In one sentence, what the message actually asks for or objects to, in plain terms. If that is genuinely unclear from the words, say it is unclear — that is useful, and guessing is not."
  },
  "goal_reality_check": {
    "assessment": "One or two sentences on whether what the VISITOR said they want is something a reply can achieve. About their goal and their message, never about the other person's likely response.",
    "alternative_approach": "If a different approach would serve their stated goal better, one sentence. Null if not."
  },
  "draft_analysis": {
    "tone_flags": [{"flag": "...", "why_problematic": "..."}],
    "problematic_phrases": [{"phrase": "...", "issue": "...", "better_version": "..."}],
    "overall_assessment": "..."
  }
}

RULES:
1. draft_analysis covers the VISITOR'S OWN draft, which they wrote and gave you. Be direct about it — that is their text and they asked. It carries no risk score: "level: high" is a number attached to a guess.
2. ${userDraft ? 'A draft was provided — be honest about it.' : 'No draft was provided — return draft_analysis with empty arrays and a short string saying so.'}
3. Keep every string field to one or two sentences.\n4. THREE OR FOUR response_strategies. Each one genuinely different in what it does, not the same reply at three volumes.`;

    // ── Part B: what to send, when, and what to avoid ──
    const respondPrompt = `${brief}

YOUR PART: the replies to send, what not to say, and when/where to say it.

ENHANCED LANDMINE DETECTION:
- Phrase landmines: specific words/phrases that will escalate THIS situation
- Timing landmines: "don't respond while driving", "not at 2am", "not right after work"
- Channel landmines: "this conversation shouldn't happen over text", "call instead", "wait for in-person"

Return ONLY valid JSON with EXACTLY these eight top-level keys:
{
  "response_strategies": [
    {
      "strategy": "A short descriptive name for what this reply DOES, drawn from the reply itself — Asks what they needed, Names the specific incident, Offers a time to talk. Not what it avoids and not what it implies about them: 'holds space without chasing' invents a chasing dynamic nobody described, and 'refuses to take the bait' calls their message bait. Describe your own sentence.",
      "response_text": "The message to send, ready to paste. This is the deliverable and it is the whole entry: no note on what it achieves, no risk attached to it, no prediction of how it lands. You have not met the recipient.",
      "tone": "calm/firm/compassionate"
    }
  ],
  "cooling_recommendation": {"delay_time": "How long to wait, in ordinary words rather than a figure: until you have eaten, before you reply tonight, tomorrow morning. Never a number of minutes — nobody measured that, and a precise figure is a rule invented to sound certain.", "why_delay": "One sentence, about the visitor and their draft. Not about how the other person will read a delay."}
}

RULES:
1. THREE OR FOUR response_strategies, each genuinely different in what it does — not the same reply at three volumes. They are the deliverable; everything else on this page is context for choosing between them.
2. All de-escalating, and all sendable as written.
3. Protect the relationship over being right.
4. Keep every string to one or two sentences. response_text is the exception: it is the actual message.
5. No prediction anywhere. Not what the reply will achieve, not how they will take it, not what it risks. You have one message from someone you have never met.`;

    const system = systemPrompt + withLocaleContext(userLocale, userCurrency, userRegion);
    const [readPart, respondPart] = await Promise.all([
      callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 3500,
        system,
        messages: [{ role: 'user', content: withLanguage(readPrompt, userLanguage) }],
      }, { label: 'conflict-coach:read' }),
      callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 3500,
        system,
        messages: [{ role: 'user', content: withLanguage(respondPrompt, userLanguage) }],
      }, { label: 'conflict-coach:respond' }),
    ]);
    const parsed = { ...respondPart, ...readPart };

    // Seen once in testing: response_strategies came back as a STRING holding
    // Python-style pseudo-JSON. The frontend maps over it, so that ships as a
    // render crash rather than an error anyone can act on. Guard the shape of
    // the deliverable before anything else touches it.
    if (!Array.isArray(parsed.response_strategies) || !parsed.response_strategies.length) {
      console.error('ConflictCoach: response_strategies not an array', typeof parsed.response_strategies);
      return res.status(500).json({ error: 'Could not put together a response. Please try again.' });
    }

    // V2 guard. Fail-open: it wraps a working answer and must never drop it.
    try {
      const fields = [];
      const push = (path, v) => { if (typeof v === 'string' && v.trim()) fields.push([path, v]); };
      push('message_analysis.whats_being_asked', parsed.message_analysis?.whats_being_asked);
      push('goal_reality_check.assessment', parsed.goal_reality_check?.assessment);
      push('goal_reality_check.alternative_approach', parsed.goal_reality_check?.alternative_approach);
      push('draft_analysis.overall_assessment', parsed.draft_analysis?.overall_assessment);
      push('cooling_recommendation.delay_time', parsed.cooling_recommendation?.delay_time);
      push('cooling_recommendation.why_delay', parsed.cooling_recommendation?.why_delay);
      // response_text, not message. The first version of this line named a
      // field that does not exist, so the guard silently checked everything
      // EXCEPT the replies — the only part the visitor actually sends.
      (parsed.response_strategies || []).forEach((st, i) => push(`response_strategies[${i}].response_text`, st?.response_text));

      await runOutputGuard(parsed, {
        label: 'conflict-coach',
        fields,
        supplied: `THE MESSAGE THEY RECEIVED: ${receivedMessage || '(thread supplied instead)'}
WHAT THEY ARE TEMPTED TO SEND: ${userDraft || '(not supplied)'}
RELATIONSHIP: ${relationship || '(not supplied)'}${personLabel ? ` (${personLabel})` : ''}
WHAT THEY WANT FROM IT: ${(goals || []).join(', ') || '(not supplied)'}`,
        promise: 'Help someone reply to a tense message: what the message is actually asking, whether their goal is achievable by replying, an honest read of their own draft, and responses they can send.',
        guard: router.outputGuard,
        // Every promised reply must survive repair as something sendable.
        requiredNonEmpty: (parsed.response_strategies || []).map((_, i) => `response_strategies[${i}].response_text`),
        userLanguage,
        locale: withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion),
      });
    } catch (err) {
      console.error('ConflictCoach v2 guard skipped:', err.message);
    }

    res.json(parsed);
  } catch (error) {
    console.error('❌ Conflict Coach V3 error:', error.message);
    res.status(500).json({ error: 'Failed to analyze. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// FOLLOW-UP COACHING
// ═══════════════════════════════════════════════════════════════

router.post('/conflict-coach/followup', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { question, originalAnalysis, relationship, receivedMessage, actualGoal, personLabel, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!question?.trim()) return res.status(400).json({ error: 'Please provide a question.' });
    if (!originalAnalysis) return res.status(400).json({ error: 'No analysis context. Run analysis first.' });

    const lang = withLanguage('', userLanguage);

    const ctx = [];
    ctx.push(`Relationship: ${relationship || 'Unknown'}${personLabel ? ` (${personLabel})` : ''}`);
    ctx.push(`Original message: ${receivedMessage?.slice(0, 200) || 'Not provided'}`);
    if (actualGoal) ctx.push(`Goal: ${actualGoal}`);
    if (originalAnalysis.message_analysis?.triggers_identified?.length) {
      ctx.push(`Phrases that landed hardest: ${originalAnalysis.message_analysis.triggers_identified.join(' / ')}`);
    }
    if (originalAnalysis.response_strategies?.length) {
      ctx.push(`Strategies suggested: ${originalAnalysis.response_strategies.map(s => s.strategy).join(', ')}`);
    }

    const systemPrompt = `You are an expert conflict resolution coach. A user already received an analysis and has a follow-up question.

ORIGINAL CONTEXT:
${ctx.join('\n')}

Answer the follow-up based on full context. Be specific, practical, warm but honest.
- If they share a new response from the other person, analyze it for manipulation and suggest next steps.
- If they ask about a specific scenario, give concrete advice.
- If they're spiraling, help ground them.
- Keep to 2-4 paragraphs. Stay de-escalating.

CRITICAL: Return ONLY valid JSON: {"answer": "Your full coaching response here"}

${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 800,
      system: systemPrompt + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: question.trim() + `\n\n${lang}` }],
    }, { label: 'conflict-coach' });

    res.json({ answer: parsed.answer || 'No answer available.' });
  } catch (error) {
    console.error('❌ Follow-up error:', error.message);
    res.status(500).json({ error: 'Failed to answer follow-up.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// TONE ADJUSTMENT
// ═══════════════════════════════════════════════════════════════

router.post('/conflict-coach/adjust-tone', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { originalResponse, originalStrategy, toneLevel, relationship, receivedMessage, actualGoal, userLanguage, userLocale, userCurrency, userRegion } = req.body;

    if (!originalResponse) return res.status(400).json({ error: 'No response to adjust.' });
    if (toneLevel === undefined || toneLevel === null) return res.status(400).json({ error: 'Tone level required.' });

    const lang = withLanguage('', userLanguage);

    const toneDescription = toneLevel <= 20 ? 'very gentle, soft, empathetic, prioritizing warmth over directness'
      : toneLevel <= 40 ? 'gentle and warm, but with clear intent'
      : toneLevel <= 60 ? 'balanced — direct but compassionate'
      : toneLevel <= 80 ? 'firm and clear, with minimal softening'
      : 'very firm, direct, no-nonsense, clear boundaries with zero ambiguity';

    const systemPrompt = `You are a conflict resolution expert. Rewrite this response at the requested tone level while keeping the same intent and strategy.

Original strategy: ${originalStrategy || 'de-escalate'}
Original: "${originalResponse}"
Relationship: ${relationship || 'Unknown'}
${actualGoal ? `Goal: ${actualGoal}` : ''}
Context (their message): "${receivedMessage?.slice(0, 200) || ''}"

Tone target: ${toneLevel}/100 (${toneDescription})

CRITICAL: Return ONLY valid JSON:
{
  "adjusted_text": "The rewritten response",
  "tone_note": "One short line on what changed in the wording. Not what it will achieve."
}

${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 1500,
      system: systemPrompt + withLocaleContext(userLocale, userCurrency, userRegion),
      messages: [{ role: 'user', content: `Rewrite at tone level ${toneLevel}/100.\n\n${lang}` }],
    }, { label: 'conflict-coach-2' });
    res.json(parsed);
  } catch (error) {
    console.error('❌ Tone adjust error:', error.message);
    res.status(500).json({ error: 'Failed to adjust tone.' });
  }
});

// PF-39. Reviewed against DEFTBRAIN_OUTPUT_STANDARD_V2 on 2026-08-23.
router.outputStandard = 'v2';

// The failure modes that are local to this tool. It reads one message from
// someone it has never met, and every construct below turned that into a
// determination about a person: "Primary emotion: resentment", "Manipulation
// Tactics Detected", "designed to make you feel guilty", "wait 20-30 minutes",
// "they may interpret this as". The visitor is the only one here who knows the
// sender, and they came for help replying, not a diagnosis of their sister.
router.outputGuard = {
  prohibit: [
    'contradicted_supplied_fact',
    'interpretation_as_fact',
    'attitude_label',
    'invented_relationship_dynamic',
    'emotion_inference_as_fact',
    'motive_inference_as_fact',
    'need_inference_as_fact',
    'manipulation_detection',
    'psychological_label',
    'temperature_score',
    'unsupported_timing_rule',
    'predicted_recipient_reaction',
  ],
  require: [
    'fulfills_tool_promise',
    'actionable_output',
  ],
};

module.exports = router;
