const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage, withLocaleContext } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');
const { runOutputGuard } = require('../lib/outputGuard');

// The starters are written before the guard runs; never hold them hostage.
const GUARD_ENTRY_MS = Number(process.env.FFA_GUARD_ENTRY_MS || 60_000);

// Only the prose the visitor reads. The rhythm enum is a contract with the
// frontend and is not the guard's business.
async function guardStarters(parsed, body, startedAt) {
  if (Date.now() - startedAt > GUARD_ENTRY_MS) {
    console.log('[friendship-fade-alerter-v2] v2 guard: skipped — out of time, answer returned unguarded');
    return;
  }
  const fields = [];
  const push = (path, v) => { if (typeof v === 'string' && v.trim().length > 15) fields.push([path, v]); };
  push('encouragement', parsed.encouragement);
  ['pickUpThread', 'simpleHello', 'makeAPlan'].forEach(k => {
    push(`${k}.message`, parsed[k] && parsed[k].message);
    push(`${k}.why`, parsed[k] && parsed[k].why);
  });
  if (!fields.length) return;

  await runOutputGuard(parsed, {
    label: 'friendship-fade-alerter-v2',
    fields,
    supplied: `WHAT THE USER TOLD US ABOUT THIS PERSON, IN FULL — nothing else is known:
Name they used: ${body.name || '(not given)'}
Relationship, in the user's words: ${body.relationship || body.relationshipType || '(not given)'}
Days since they last actually caught up: ${body.daysSinceMeaningfulConnection ?? body.daysSinceContact ?? '(not given)'}
Notes the user chose to keep: ${((body.notes ?? body.contextNotes) || '').trim() || 'NONE — they wrote nothing'}
Recent contact logged: ${(body.recentConnections || body.contactLog || []).map(l => `${l.date} ${l.note || ''} (counted as catching up: ${l.meaningfulConnection === false ? 'no' : 'yes'})`).join('; ') || 'none'}

Nothing about why the gap happened, whether either person was hurt, who owes
whom a message, what the friendship used to be like, or how either of them
feels about it now.

WHAT FAILS:
1. Treating elapsed time as evidence. A long gap is a fact about calendars, not
   about the relationship. "Things have clearly drifted", "you have been out of
   touch too long", "before this fades completely" all assert a decline the
   user never reported and the number cannot show.
2. Inventing the reason for the gap — busyness, a falling-out, one person
   pulling away, life getting in the way. The user did not say.
3. Scorekeeping. Who reached out last, who owes whom, whether the friendship is
   balanced. Not ours to score, and the tool exists to make contact easier, not
   to adjudicate it.
4. Putting an apology in the user's mouth. A starter that opens by apologising
   for the silence makes the visitor concede a fault they never named.
5. Diagnosing the friendship's health, trajectory, or future.
6. Inventing shared history — a trip, a joke, a conversation — that is not in
   the notes above. The message has to be sendable as written.
7. Treating recent contact that was NOT catching up as though they are already
   back in touch. An email arriving is material for a conversation, not a
   conversation.
8. Wedging a remembered detail into a message purely to show it was remembered,
   where it gives no natural opening.`,
  }, { max_tokens: 1400 });
}

const NO_QUOTE_RULE = 'Never place a double-quote (") character inside any JSON string value — message text and quoted phrases must be written plainly with no inner quote marks, or it breaks the JSON.';


// ═══════════════════════════════════════════════════════════════
// RECOMMEND RHYTHM — gentle first-use help, not a prescription
// ═══════════════════════════════════════════════════════════════
router.post('/friendship-fade-alerter/recommend-rhythm', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { name, relationshipType, contextNotes, userLanguage } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });

    const prompt = `Help someone choose a comfortable contact rhythm for a relationship. This is a preference, not a rule or judgment about how friendship should work.

PERSON: ${name.trim()}
RELATIONSHIP: ${relationshipType || 'friend'}
${contextNotes?.trim() ? `CONTEXT: ${contextNotes.trim()}` : ''}

Choose the least demanding rhythm that still plausibly fits the relationship. Do not imply that longer gaps mean a friendship is failing. Some close relationships are naturally low-frequency.

Return ONLY valid JSON:
{
  "suggested_frequency": "one of: weekly | biweekly | monthly | quarterly | semiannually",
  "reasoning": "One short, humane sentence explaining why this may be a comfortable starting point. Make clear it can be changed.",
  "note": "One short sentence reminding the user that the right rhythm is the one that feels natural and sustainable."
}

Return ONLY valid JSON. ${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 700,
      system: (withLanguage('You are a practical, non-judgmental relationship assistant. Never turn friendship into a quota.', userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion)),
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'friendship-fade-alerter-recommend-rhythm' });

    const valid = ['weekly', 'biweekly', 'monthly', 'quarterly', 'semiannually'];
    if (!valid.includes(parsed.suggested_frequency)) parsed.suggested_frequency = 'monthly';
    res.json(parsed);
  } catch (error) {
    console.error('[FriendshipFade/recommend-rhythm] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// MAIN — generate conversation starters for one person
// ═══════════════════════════════════════════════════════════════

router.post('/friendship-fade-alerter', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  const startedAt = Date.now();
  try {
    const {
      name, relationship, relationshipType, rhythm,
      lastMeaningfulConnection, daysSinceMeaningfulConnection, daysSinceContact,
      lastInteraction, daysSinceInteraction,
      notes, contextNotes, recentConnections, contactLog, userLanguage,
    } = req.body;

    const rel = relationship || relationshipType;
    const days = daysSinceMeaningfulConnection ?? daysSinceContact;
    const remembered = (notes ?? contextNotes ?? '').trim();
    const log = Array.isArray(recentConnections) ? recentConnections : (contactLog || []);

    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
    if (!rel) return res.status(400).json({ error: 'Relationship type is required' });
    if (days === undefined) return res.status(400).json({ error: 'Days since contact is required' });

    // An email arriving is not the same event as catching up. Both belong in
    // the prompt, but only one of them resets the clock, and the model has to
    // be able to tell which is which or it writes "great to have just spoken"
    // over the top of a two-year silence.
    const logBlock = log.length
      ? `\nRECENT CONTACT OF ANY KIND (most recent first). "Counted as catching up: no" means something happened but they did not actually have a conversation — it is conversational material, NOT evidence that they are back in touch:\n${log.slice(0, 6).map(l => `- ${l.date}: ${l.note || '(no note)'} — counted as catching up: ${l.meaningfulConnection === false ? 'no' : 'yes'}`).join('\n')}`
      : '';

    const prompt = `You are helping someone reach out to a person in their life. Life gets busy and gaps happen, including in healthy relationships. Make reaching out easy and natural, without treating elapsed time as evidence that anything is wrong.

PERSON: ${name}
RELATIONSHIP: ${rel}
${rhythm ? `THE RHYTHM THEY CHOSE FOR THIS RELATIONSHIP: ${rhythm}` : ''}
DAYS SINCE THEY LAST ACTUALLY CAUGHT UP: ${days}
${lastMeaningfulConnection ? `DATE THEY LAST ACTUALLY CAUGHT UP: ${lastMeaningfulConnection}` : ''}
${(daysSinceInteraction !== undefined && daysSinceInteraction !== days) ? `DAYS SINCE ANYTHING AT ALL HAPPENED BETWEEN THEM: ${daysSinceInteraction}${lastInteraction ? ` (on ${lastInteraction})` : ''}. Something recent happened that was not the two of them catching up — see the list below. It may be that the other person reached out and the user has not replied yet. Do not assume either way, and do not write as though they have just spoken.` : ''}
${remembered ? `WHAT THE USER CHOSE TO REMEMBER ABOUT THEM: ${remembered}` : ''}
${logBlock}

USING WHAT THEY REMEMBERED
The note above is the whole reason this tool is worth using — but only when it
gives you a real opening. If it does, one message should walk straight through
that door: the user already knows the thing, so the message can just ask about
it. If it does not, leave it alone. Never wedge an old note into a message to
prove you remembered it; a message that name-drops a detail for no reason reads
worse than one that does not mention it at all.

Invent nothing. If a fact is not written above, you do not know it. You do not
know why the gap happened, who last reached out, how either of them feels, or
what has changed in their life.

THREE DIFFERENT APPROACHES, NOT THREE TONES
Each one solves a different social problem, and they must be genuinely
different messages — not the same message written casual, warm and direct.

Return ONLY valid JSON:
{
  "pickUpThread": {
    "message": "Picks up something specific and already known — ready to send as written, 1-3 sentences. THIS ONE IS OPTIONAL: if there is no real thread to pick up, set pickUpThread to null. Do not invent a detail, and do not fall back to a general hello — that is the next option and two of the same thing is worse than one.",
    "why": "One sentence on what this one does."
  },
  "simpleHello": {
    "message": "Asks for nothing and needs no occasion — ready to send as written, 1-2 sentences.",
    "why": "One sentence on what this one does."
  },
  "makeAPlan": {
    "message": "Proposes actually meeting or talking, concrete enough to answer yes or no — ready to send as written, 1-3 sentences.",
    "why": "One sentence on what this one does."
  },
  "encouragement": "One warm, practical sentence that makes sending one of these feel easy. Do not mention how long it has been, and do not imply the user is late or has failed."
}

BEFORE YOU RETURN, CHECK YOUR OWN ANSWER SILENTLY:
- Did I use what they remembered where it gave a natural opening, and leave it out where it did not?
- Did I invent any fact that is not written above?
- Are these genuinely different approaches, or the same message more than once? If pickUpThread says roughly what simpleHello says, there was no thread: return null for it.
- Would a real person actually send each of these, as written, without editing?
- Did I apologise for the silence, or make the user concede a fault they never named?
- Is what I wrote consistent with how long it has actually been? If recent contact happened but was not catching up, did I avoid implying they are already back in touch?
If any answer is wrong, fix it before returning. Return only the corrected version.

Return ONLY valid JSON. ${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2000,
      system: (withLanguage('You are a helpful assistant that responds in the same language as the user.', userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion)),
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'friendship-fade-alerter' });

    // The instruction above is a prose rule, and prose rules slip. When there is
    // nothing to pick up, the model's pickUpThread drifts into the same message
    // as simpleHello — measured, with no notes and no log, both came back as
    // "Hey Tom, thought of you today." Two copies of one option is worse than
    // one option, so the duplicate is dropped rather than shown.
    //
    // 0.45 is measured, not chosen: across live runs a real thread scored 0.10,
    // a thin-but-distinct pair 0.39, and the actual duplicate 0.55. The
    // threshold sits in the gap with margin on both sides.
    const words = (v) => new Set(String(v || '').toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean));
    const overlap = (a, b) => {
      const A = words(a), B = words(b);
      if (!A.size || !B.size) return 0;
      let shared = 0;
      A.forEach(w => { if (B.has(w)) shared++; });
      return shared / Math.min(A.size, B.size);
    };
    if (parsed?.pickUpThread?.message && parsed?.simpleHello?.message
        && overlap(parsed.pickUpThread.message, parsed.simpleHello.message) >= 0.45) {
      console.log('[friendship-fade-alerter] pickUpThread duplicated simpleHello — dropped, no thread to pick up');
      parsed.pickUpThread = null;
    }

    await guardStarters(parsed, req.body, startedAt);
    res.json(parsed);

  } catch (error) {
    console.error('[FriendshipFade] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// BATCH — generate starters for multiple overdue people at once
// ═══════════════════════════════════════════════════════════════

router.post('/friendship-fade-alerter/batch', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { people, userLanguage } = req.body;

    if (!people?.length) return res.status(400).json({ error: 'No people provided' });
    if (people.length > 8) return res.status(400).json({ error: 'Max 8 people per batch' });

    const peopleBlock = people.map((p, i) =>
      `${i + 1}. ${p.name} (${p.relationshipType}, ${p.daysSinceContact} days)${p.contextNotes ? ` — Context: ${p.contextNotes}` : ''}${p.lastNote ? ` — Last talked about: ${p.lastNote}` : ''}`
    ).join('\n');

    const prompt = `You are helping someone do a quick catch-up sprint — they have ${people.length} people they want to reach out to. Generate one ready-to-send message for each person. Messages should be natural, warm, and varied (don't use the same template for everyone).

PEOPLE TO REACH OUT TO:
${peopleBlock}

RULES:
- Each message must sound different — vary the opening, tone, and approach
- Keep messages short and sendable (1-3 sentences)
- Reference context/shared interests when provided
- No guilt, no apologies — just natural reconnection
- Mix of tones: some playful, some warm, some direct

Return ONLY valid JSON:
{
  "messages": [
    {
      "name": "Person's name — 3-6 words",
      "message": "Ready-to-send message — 2-4 sentences",
      "tone": "casual | warm | direct | playful",
      "tip": "One-line tip for this specific reconnection — one sentence"
    }
  ],
  "sprint_encouragement": "One motivating sentence about knocking these all out — one sentence"
}

Return ONLY valid JSON. ${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      system: (withLanguage('You are a helpful assistant that responds in the same language as the user.', userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion)),
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'friendship-fade-alerter-batch' });
    res.json(parsed);

  } catch (error) {
    console.error('[FriendshipFade/batch] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// FOLLOWUP ADVICE — what to do when someone didn't respond
// ═══════════════════════════════════════════════════════════════

router.post('/friendship-fade-alerter/followup-advice', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { name, relationshipType, daysSinceOutreach, originalMessage, contextNotes, userLanguage } = req.body;

    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });

    const prompt = `Someone reached out to a friend/contact and hasn't heard back. Help them figure out what to do — no overthinking, just practical advice.

PERSON: ${name}
RELATIONSHIP: ${relationshipType || 'friend'}
DAYS SINCE THEY REACHED OUT: ${daysSinceOutreach || 'unknown'}
${originalMessage ? `WHAT THEY SENT: "${originalMessage}"` : ''}
${contextNotes ? `CONTEXT: ${contextNotes}` : ''}

Give practical, non-anxious advice. Sometimes people are just busy. Sometimes the message got buried. Rarely is it personal.

Return ONLY valid JSON:
{
  "assessment": "Brief, honest read on the situation (1-2 sentences)",
  "recommendation": "wait | follow_up | let_it_go",
  "follow_up_message": "If follow-up is recommended: a ready-to-send message. If not: null — 2-4 sentences",
  "follow_up_timing": "When to send it (e.g., 'Give it another 3-4 days') — one sentence",
  "perspective": "One grounding sentence — not dismissive, not anxious, just realistic — one sentence",
  "if_still_no_response": "What to do if they still don't respond after the follow-up — one sentence"
}

Return ONLY valid JSON. ${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 800,
      system: (withLanguage('You are a helpful assistant that responds in the same language as the user.', userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion)),
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'friendship-fade-alerter-followup' });
    res.json(parsed);

  } catch (error) {
    console.error('[FriendshipFade/followup] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════════════════
// DIGEST — weekly relationship summary
// ═══════════════════════════════════════════════════════════════

router.post('/friendship-fade-alerter/digest', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { stats, userLanguage } = req.body;

    if (!stats) return res.status(400).json({ error: 'Stats are required' });

    const prompt = `Generate a brief, warm weekly relationship digest based on these stats. Be encouraging and practical — not preachy. If things look good, say so. If things are slipping, be honest but kind.

THIS WEEK'S STATS:
- People tracked: ${stats.total}
- Contacted this week: ${stats.contactedThisWeek} (${stats.contactedNames?.join(', ') || 'none'})
- Currently overdue: ${stats.overdueCount} (${stats.overdueNames?.join(', ') || 'none'})
- Due next week: ${stats.dueNextWeek} (${stats.dueNextWeekNames?.join(', ') || 'none'})
- Upcoming events (next 14 days): ${stats.upcomingEvents?.map(e => `${e.name}: ${e.label} on ${e.date}`).join(', ') || 'none'}
- Longest neglected: ${stats.longestNeglected || 'N/A'} (${stats.longestNeglectedDays || 0} days)
- One-sided relationships (you always initiate): ${stats.oneSided?.join(', ') || 'none'}
- Weekly streak: ${stats.streak || 0} weeks maintaining your contact goals
${stats.circles?.length ? `- Circle health: ${stats.circles.map(c => `${c.name}: ${c.overdue}/${c.total} overdue`).join(', ')}` : ''}

Return ONLY valid JSON:
{
  "headline": "One punchy sentence summarizing the week (e.g., 'Solid week — 4 catch-ups and only 1 overdue') — one sentence",
  "wins": ["Something positive from this week", "Another win if applicable"],
  "attention_needed": ["Specific person or pattern that needs attention"],
  "next_week_priorities": ["Top priority for next week", "Secondary priority"],
  "proactive_priorities": [
    {
      "name": "Person's name — 3-6 words",
      "reason": "Specific, non-generic reason why this person is the priority this week — what's the window, what's the context, what's at stake — one sentence",
      "suggested_action": "One concrete thing to do or say — not 'reach out' but the actual approach — one sentence"
    }
  ],
  "risk_flags": ["Any relationship showing signs of permanent fade — name + specific pattern that concerns you. Leave empty array if none."],
  "streak_note": "Comment on their consistency streak (encouraging if good, motivating if broken) — one sentence",
  "one_liner": "One warm closing sentence — one sentence"
}

Return ONLY valid JSON. ${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      system: (withLanguage('You are a helpful assistant that responds in the same language as the user.', userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion)),
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'friendship-fade-alerter-digest' });
    res.json(parsed);

  } catch (error) {
    console.error('[FriendshipFade/digest] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /friendship-fade-alerter/reengage — NetworkNurse
// Craft natural re-engagement messages for awkward silences
// ════════════════════════════════════════════════════════════
router.post('/friendship-fade-alerter/reengage', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { personName, relationship, howLong, lastContext, reason, userLanguage } = req.body;
    if (!personName?.trim()) return res.status(400).json({ error: 'Who are you reaching out to?' });
    if (!howLong?.trim()) return res.status(400).json({ error: 'How long has it been?' });

    const systemPrompt = `Friendship maintenance specialist. Help reconnect with someone after a gap without making it awkward.

Give a specific, low-pressure message that references something real about the relationship — not generic "been a while" openers. Calibrate for gap length, relationship depth, and what ended contact. The goal is authentic reconnection, not obligation fulfillment.`;

    const userPrompt = `NETWORK NURSE — RE-ENGAGEMENT MESSAGES

Person: ${personName.trim()}
Relationship type: ${relationship || 'friend'}
Silence duration: ${howLong.trim()}
${lastContext?.trim() ? `Last context (what they last talked about or what was going on in their life): ${lastContext.trim()}` : ''}
${reason?.trim() ? `Why the silence started: ${reason.trim()}` : ''}

Write 3 re-engagement messages. Each should feel completely natural for a different approach.

Return ONLY valid JSON:
{
  "situation_read": "One honest sentence about what this silence likely feels like from both sides — one sentence",

  "messages": [
    {
      "style": "casual | warm | practical",
      "style_label": "What this approach prioritizes (e.g., 'Low pressure', 'Emotional warmth', 'Easy hook') — 2-4 words",
      "message": "The complete message — ready to send. Natural, specific, brief. Should not mention the silence or feel like an apology for reaching out. — 2-4 sentences",
      "why_it_works": "One sentence on why this approach dissolves the awkwardness",
      "best_for": "When to use this version (e.g., 'If you want to keep it light', 'If you genuinely miss them', 'If you have a natural excuse') — one sentence"
    }
  ],

  "what_NOT_to_say": [
    {
      "phrase": "The type of line to avoid — one sentence",
      "why": "Why it makes things more awkward instead of less — one sentence"
    }
  ],

  "if_they_dont_respond": "What to do and what it probably means — be honest, not just reassuring — one sentence",

  "timing_tip": "Best time/channel to send this (text vs. DM vs. email, time of day, day of week) — one sentence"
}

Return ONLY valid JSON. ${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2500,
      system: (withLanguage(systemPrompt, userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion)),
      messages: [{ role: 'user', content: userPrompt }],
    }, { label: 'friendship-fade-alerter-reengage' });
    res.json(parsed);

  } catch (error) {
    console.error('[FriendshipFade/reengage] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /friendship-fade-alerter/health-insight
// Qualitative AI read on a single relationship
// ════════════════════════════════════════════════════════════
router.post('/friendship-fade-alerter/health-insight', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { name, relationshipType, frequency, daysSinceContact, contactLog, contextNotes, reciprocity, drift, upcomingEvents, userLanguage } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });

    const logBlock = contactLog?.length
      ? `
CONTACT LOG (most recent first):
${contactLog.map(l => `- ${l.date}: "${l.note || 'Reached out'}"${l.initiator === 'them' ? ' (they initiated)' : ''}`).join('\n')}`
      : '';

    const reciprocityBlock = reciprocity
      ? `
RECIPROCITY: You initiated ${reciprocity.youInitiated}/${reciprocity.total} contacts (${reciprocity.balance})`
      : '';

    const driftBlock = drift
      ? `
DRIFT: Averaging every ${drift.avgInterval} days vs ${drift.target}d target — ${drift.drifted ? 'drifting' : 'on track'}`
      : '';

    const prompt = `You are a thoughtful relationship coach reading between the lines of someone's contact history with a person in their life. Give them genuine insight — not just summaries of numbers, but qualitative interpretation of what the pattern means.

PERSON: ${name}
RELATIONSHIP TYPE: ${relationshipType}
TARGET FREQUENCY: ${frequency}
DAYS SINCE LAST CONTACT: ${daysSinceContact}
${contextNotes ? `CONTEXT / SHARED INTERESTS: ${contextNotes}` : ''}
${logBlock}
${reciprocityBlock}
${driftBlock}
${upcomingEvents?.length ? `
UPCOMING EVENTS: ${upcomingEvents.map(e => e.label + ' on ' + e.date).join(', ')}` : ''}

Read this relationship honestly. Look for:
- Patterns in what they talk about vs what they used to talk about
- Whether the quality of connection seems to be deepening, stable, or fading
- What the reciprocity pattern says about the dynamic (not just the numbers)
- Any specific recommended action based on the full picture — not generic advice

Return ONLY valid JSON:
{
  "headline": "One punchy sentence capturing the real state of this relationship — honest, not harsh — one sentence",
  "depth_reading": "2-3 sentences of qualitative insight beyond the numbers. What do the patterns actually mean? What's the real dynamic here?",
  "trajectory": "improving / stable / drifting / at_risk — and one sentence explaining why",
  "conversation_shift": "If the contact log shows a change in conversation depth or topics over time, describe it specifically. If not enough data or no shift, return null. — one sentence",
  "action_recommendation": "One specific, actionable recommendation based on the full picture — not 'reach out more' but something concrete like what to say, what to address, or what to stop doing — one sentence",
  "worth_a_deeper_check": true/false
}

Return ONLY valid JSON. ${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 1200,
      system: (withLanguage('You are a thoughtful relationship coach. Be honest, specific, and avoid generic advice.', userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion)),
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'friendship-fade-alerter-health-insight' });
    res.json(parsed);

  } catch (error) {
    console.error('[FriendshipFade/health-insight] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /friendship-fade-alerter/say-it-coach
// Scripts for addressing one-sided relationship dynamics
// ════════════════════════════════════════════════════════════
router.post('/friendship-fade-alerter/say-it-coach', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { name, relationshipType, contactLog, reciprocity, contextNotes, userLanguage } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });

    const logBlock = contactLog?.length
      ? `
RECENT INTERACTIONS:
${contactLog.map(l => `- ${l.date}: "${l.note || 'Reached out'}" (${l.initiator === 'them' ? 'they initiated' : 'you initiated'})`).join('\n')}`
      : '';

    const prompt = `Someone has noticed they always initiate contact with a person in their life. They want help deciding whether to address it — and if so, how.

PERSON: ${name}
RELATIONSHIP: ${relationshipType}
${contextNotes ? `CONTEXT: ${contextNotes}` : ''}
${reciprocity ? `INITIATION PATTERN: ${reciprocity.youInitiated} of last ${reciprocity.total} contacts initiated by them. They initiated ${reciprocity.theyInitiated}.` : ''}
${logBlock}

Be honest about whether this is worth addressing. Sometimes one-sidedness is normal (e.g., one person is a natural initiator), sometimes it signals a fading interest. Read the specific data and give real advice.

Return ONLY valid JSON:
{
  "situation_read": "1-2 sentences honestly reading what this pattern likely means in this specific relationship — not generic",
  "worth_saying": true/false,
  "whether_to_say_it": "Honest assessment of whether addressing this is likely to help or just create awkwardness — and why — one sentence",
  "the_script": "If worth saying: the actual words to use. Natural, non-accusatory, opens a conversation rather than making a statement. If not worth saying: null. — 2-4 sentences",
  "tone_notes": "How to deliver this — timing, setting, tone of voice, what to avoid — one sentence",
  "what_to_expect": "Realistic outcome — what they'll probably say, how it typically goes — one sentence",
  "if_they_get_defensive": "What to say if the immediate reaction is defensive or dismissive — one sentence",
  "alternative": "If they don't want to say it directly: a behavioural shift that might naturally change the dynamic without the conversation — one sentence"
}

Return ONLY valid JSON. ${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 1400,
      system: (withLanguage('You are a direct, honest relationship coach. No fluff — give specific, actionable guidance.', userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion)),
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'friendship-fade-alerter-say-it-coach' });
    res.json(parsed);

  } catch (error) {
    console.error('[FriendshipFade/say-it-coach] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ════════════════════════════════════════════════════════════
// POST /friendship-fade-alerter/frequency-suggest
// AI-recommended contact frequency adjustment based on drift data
// ════════════════════════════════════════════════════════════
router.post('/friendship-fade-alerter/frequency-suggest', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { name, relationshipType, currentFrequency, avgInterval, contactLog, userLanguage } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });

    const logBlock = contactLog?.length
      ? `\nRECENT CONTACT INTERVALS:\n${contactLog.slice(0, 6).map(l => `- ${l.date}: ${l.note || 'Contact'}`).join('\n')}`
      : '';


    const prompt = `You are advising someone on how often to realistically aim to contact a person in their life. 
Their goal is healthy relationships that don't feel like a chore — the right target frequency is one they can actually maintain.

PERSON: ${name}
RELATIONSHIP TYPE: ${relationshipType}
CURRENT TARGET: ${currentFrequency}
ACTUAL AVERAGE INTERVAL: ${avgInterval ? `${avgInterval} days` : 'unknown'}
${logBlock}

Recommend a realistic adjusted frequency. Consider:
- If they're consistently missing their target by >50%, the target is unrealistic — lower it
- If actual interval is close to target but slightly over, suggest a small adjustment or staying the course
- Relationship type matters: close friends warrant more effort than acquaintances
- Better to have a realistic target they hit than an aspirational one they feel guilty about

Return ONLY valid JSON:
{
  "suggested_frequency": "one of: weekly | biweekly | monthly | quarterly | semiannually",
  "reasoning": "One honest, specific sentence explaining why this frequency fits the actual pattern — not generic advice — one sentence",
  "impact": "What this adjustment will concretely change (e.g., 'Removes 2 overdue alerts per month you were ignoring') — one sentence"
}

Return ONLY valid JSON. ${NO_QUOTE_RULE}`;

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 1500,
      system: (withLanguage('You are a direct, practical relationship coach. No fluff.', userLanguage) + withLocaleContext(req.body.userLocale, req.body.userCurrency, req.body.userRegion)),
      messages: [{ role: 'user', content: prompt }],
    }, { label: 'friendship-fade-alerter-frequency-suggest' });

    // Validate suggested_frequency is a known value
    const VALID = ['weekly', 'biweekly', 'monthly', 'quarterly', 'semiannually'];
    if (parsed.suggested_frequency && !VALID.includes(parsed.suggested_frequency)) {
      parsed.suggested_frequency = currentFrequency;
    }

    res.json(parsed);

  } catch (error) {
    console.error('[FriendshipFade/freq-suggest] Error:', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

router.outputStandard = 'v2';
// friendship-fade-alerter-v2. Reviewed 2026-08-27. The tool's whole risk is
// that a number — days since contact — reads as a verdict on a friendship. It
// is not one. Someone can go eight months without speaking to a person they
// would take a 3am call from. The guard's job is to stop the output turning
// arithmetic into a diagnosis, and to stop it inventing the history that would
// justify one.
router.outputGuard = {
  prohibit: [
    'elapsed_time_treated_as_evidence_of_decline',
    'invents_a_reason_for_the_gap',
    'scorekeeping_about_who_reached_out',
    'apologises_on_the_users_behalf',
    'diagnoses_the_friendships_health',
    'invents_shared_history_not_in_the_notes',
    'treats_non_catchup_contact_as_being_back_in_touch',
    'name_drops_a_remembered_detail_with_no_opening',
  ],
  require: [
    'message_is_sendable_as_written',
    'fulfills_tool_promise',
  ],
};

module.exports = router;
