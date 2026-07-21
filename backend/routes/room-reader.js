const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');
const { MODELS } = require('../lib/models');
const { rateLimit, DEFAULT_LIMITS } = require('../lib/rateLimiter');

// ═══════════════════════════════════════════════════
// ROUTE 1: PRE-GAME — Comprehensive event prep
// ═══════════════════════════════════════════════════
router.post('/room-reader', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { eventType, eventDetails, people, concerns, topicsToAvoid, comfort, playbook, userLanguage } = req.body;
    if (!eventType?.trim() && !eventDetails?.trim()) return res.status(400).json({ error: 'Describe the event or social situation you\'re prepping for.' });

    const playbookCtx = playbook?.length
      ? `\nPERSONAL PLAYBOOK (what has worked for this person before):\n${playbook.slice(0, 10).map(p => `- "${p.tactic}" (used in: ${p.context}, rated: ${p.rating}/5)`).join('\n')}`
      : '';

    const sharedHeader = `You are a warm, witty social intelligence coach helping someone prepare for a social event. You're their friend who happens to be brilliant at reading rooms. Not therapist-y — more like a clever friend prepping them in the car on the way there.

EVENT: ${eventType || ''} ${eventDetails ? `— ${eventDetails}` : ''}
${people?.trim() ? `WHO'S THERE: ${people}` : ''}
${concerns?.trim() ? `THEIR CONCERNS: ${concerns}` : ''}
COMFORT LEVEL: ${comfort || 'nervous'}
${topicsToAvoid?.trim() ? `AVOID THESE TOPICS: ${topicsToAvoid}` : ''}
${playbookCtx}

TONE: Warm but witty. Match their comfort level — more reassuring if panicking, more playful if they're mostly fine. Every suggestion should sound like something a real person would actually say, not a LinkedIn networking tip.

NAMES RULE: never invent a proper name for anyone the user did not name — refer to unnamed people by role ("your partner", "the host") in every ready-to-say line.`;

    // Parallel-split: the single 5000-token call ran ~88s. Call A carries the
    // bulky starters + people_map; call B carries the rest. Disjoint keys,
    // same context, response shape unchanged after the merge.
    const promptTalk = withLanguage(`${sharedHeader}

Return ONLY valid JSON — BOTH top-level keys MUST be present:
{
  "conversation_starters": [
    {
      "line": "The exact thing to say. Natural, specific to this event. — one sentence",
      "works_because": "Why this line works HERE (not generic advice). — one sentence",
      "energy": "low_key | warm | playful | bold",
      "best_for": "Who/when to use this — e.g., 'anyone at the appetizer table' or 'your partner's college friend' — one sentence",
      "if_they_respond": "Most likely response, then your natural follow-up. Show the flow. — one sentence",
      "if_it_falls_flat": "What to do if they give a one-word answer — graceful pivot. — one sentence"
    }
  ],
  "people_map": [
    {
      "who": "Type of person they'll encounter — e.g., 'the host', 'partner's boss', 'strangers at the bar' — one sentence",
      "opener": "Specific line for this person — one sentence",
      "topics_that_work": ["Topics likely to land well with this person"],
      "watch_for": "Social cue that tells you they want to keep talking vs. move on — one sentence"
    }
  ]
}

Generate 6-8 conversation starters with a mix of energies. Generate 2-4 people in the people_map.`, userLanguage);

    const promptNav = withLanguage(`${sharedHeader}

Return ONLY valid JSON — ALL SIX top-level keys MUST be present, never omit trailing keys:
{
  "vibe_check": {
    "read": "Your read on this event — what kind of energy to expect, what the social norms are. 2-3 sentences, conversational.",
    "your_superpower": "One specific thing about this situation that's actually in their favor — reframe something they're dreading as an advantage. — one sentence",
    "comfort_hack": "One practical thing to do in the first 2 minutes to settle in (not 'take a deep breath' — something situational). — one sentence"
  },
  "body_language": {
    "arrival": "What to do with your body when you first walk in — one sentence",
    "during": "Positioning and posture tips specific to this event type — one sentence",
    "secret_weapon": "One non-verbal move that makes you look confident and approachable — one sentence"
  },
  "landmine_map": [
    "Topics to avoid and WHY — specific to this event, not generic. Include topics they listed PLUS others you'd flag for this scenario."
  ],
  "exit_toolkit": [
    {
      "scenario": "When you need to exit a conversation — one sentence",
      "line": "Natural exit line — one sentence",
      "move": "What to physically do (walk where, pick up what) — one sentence"
    }
  ],
  "worst_case_saves": [
    {
      "scenario": "Specific awkward thing that might happen at THIS event — one sentence",
      "save": "How to handle it gracefully — one sentence",
      "reframe": "Why it's not as bad as they think — one sentence"
    }
  ],
  "pep_talk": "2-3 sentences. Warm, specific, a little funny. The thing their best friend would say in the car before they walk in."
}

Generate 3-4 exit strategies and 2-3 worst case saves.`, userLanguage);

    const sysPrompt = () => withLanguage('Social intelligence coach. Warm, witty, specific. You give advice that sounds like a clever friend, not a self-help book. Every line you suggest is something a real person would actually say. You read rooms like a superpower and teach others to do the same. NAMES RULE: never invent a proper name for anyone the user did not name — refer to unnamed people by role ("your partner", "the host") in every ready-to-say line. Return ONLY valid JSON. No markdown.', userLanguage);

    const [talkPart, navPart] = await Promise.all([
      callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 3000,
        system: sysPrompt(),
        messages: [{ role: 'user', content: promptTalk }]
      }, { label: 'RoomReaderPreGame-talk' }),
      callClaudeWithRetry({
        model: MODELS.SMART,
        max_tokens: 2500,
        system: sysPrompt(),
        messages: [{ role: 'user', content: promptNav }]
      }, { label: 'RoomReaderPreGame-nav' }),
    ]);

    const parsed = { ...navPart, ...talkPart };
    // Guard on a real top-level field — `read` lives under vibe_check, not at top level
    // (the old `parsed.read` guard always fired → every Pre-Game request 500'd).
    if (!parsed.vibe_check && !parsed.conversation_starters) {
      return res.status(500).json({ error: 'Could not read the room. Please try again.' });
    }
    res.json(parsed);
  } catch (error) {
    console.error('[RoomReaderPreGame]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 2: QUICK READ — Instant, minimal input
// ═══════════════════════════════════════════════════
router.post('/room-reader-quick', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { scenario, relationship, playbook, exclude, userLanguage } = req.body;
    if (!scenario?.trim()) return res.status(400).json({ error: 'Pick a scenario.' });

    const playbookCtx = playbook?.length
      ? `\nTHIS PERSON'S SOCIAL STYLE (from past experience): They prefer ${playbook.slice(0, 5).map(p => `"${p.tactic}"`).join(', ')}. Lean into this style.`
      : '';
    const excludeCtx = exclude?.length
      ? `\nDO NOT SUGGEST THESE (already tried): ${exclude.map(e => `"${e}"`).join(', ')}. Give something genuinely different.`
      : '';

    const prompt = withLanguage(`Emergency social rescue. Give ONE great conversation line, show exactly how it plays out, and offer a "silence is fine" reframe. Quick, warm, a little witty.

SCENARIO: "${scenario}"
TALKING TO: "${relationship || 'someone I don\'t know well'}"
${playbookCtx}${excludeCtx}

NAMES RULE: never invent a proper name for anyone the user did not name — refer to unnamed people by role ("your partner", "the host") in every ready-to-say line. Return ONLY valid JSON:
{
  "line": "One natural, non-cheesy thing to say. Observations beat questions — 'This place has amazing light' > 'So what do you do?' — one sentence",
  "why_it_works": "One sentence — why this line fits this exact scenario.",
  "they_say": "Their most likely response. Keep it realistic. — one sentence",
  "you_follow": "Your natural follow-up that builds on what THEY said. — one sentence",
  "if_nothing": "Graceful out if they give you nothing back. — one sentence",
  "silence_reframe": "Why silence is actually fine RIGHT NOW in this specific scenario. Not generic — specific to this moment. — one sentence",
  "body_tip": "One body language move for this exact scenario. — one sentence"
}

Write every field with precision — no filler, no padding, no restating what was asked. Never repeat information across fields.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 1500,
      system: withLanguage('Emergency social coach. Fast, warm, witty. One great line, not a list. Make it specific to the scenario. NAMES RULE: never invent a proper name for anyone the user did not name — refer to unnamed people by role ("your partner", "the host") in every ready-to-say line. Return ONLY valid JSON. No markdown.', userLanguage),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'RoomReaderQuick' });
    if (!parsed.line) {
      return res.status(500).json({ error: 'Could not read the room. Please try again.' });
    }
    res.json(parsed);
  } catch (error) {
    console.error('[RoomReaderQuick]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 3: SIGNAL DECODER — What did they mean?
// ═══════════════════════════════════════════════════
router.post('/room-reader-decode', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { theyDid, context, relationship, yourConcern, userLanguage } = req.body;
    if (!theyDid?.trim()) return res.status(400).json({ error: 'Describe what they said or did.' });

    const prompt = withLanguage(`You are a social signal decoder. Someone is trying to figure out what a social interaction meant. Help them read it accurately — not catastrophize, not dismiss, just understand.

WHAT HAPPENED: "${theyDid}"
${context?.trim() ? `CONTEXT: "${context}"` : ''}
RELATIONSHIP: "${relationship || 'not specified'}"
${yourConcern?.trim() ? `WHAT I'M WORRIED IT MEANS: "${yourConcern}"` : ''}

Be honest but kind. If it probably means something negative, say so gently. If they're overthinking it, tell them warmly. Don't be dismissive of their concern — take it seriously, then give your actual read.

NAMES RULE: never invent a proper name for anyone the user did not name — refer to unnamed people by role ("your partner", "the host") in every ready-to-say line. Return ONLY valid JSON:
{
  "most_likely": {
    "read": "The most likely interpretation — honest, specific. Not 'could mean anything.' — one sentence",
    "confidence": "pretty sure | likely | hard to tell | genuinely ambiguous",
    "evidence": "What specific detail points to this interpretation. — one sentence"
  },
  "also_possible": {
    "read": "A second plausible interpretation, if there is one. — one sentence",
    "what_would_confirm": "What to watch for that would confirm this reading. — one sentence"
  },
  "overthinking_check": "Honest assessment: are they reading too much into this? If yes, explain warmly why. If no, validate their instinct. — one sentence",
  "what_to_do": {
    "if_you_want_to_address_it": "How to bring it up naturally, with exact words. — one sentence",
    "if_you_want_to_let_it_go": "How to move past it without it eating at you. — one sentence",
    "if_youre_not_sure": "One small thing to do or watch for before deciding. — one sentence"
  },
  "reframe": "A warm, grounding perspective. The thing a wise friend would say. — one sentence"
}`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      system: withLanguage('Social signal analyst. Honest, warm, perceptive. You don\'t catastrophize or dismiss — you give the real read. You understand that social anxiety makes people over-interpret, but you also know sometimes their gut is right. NAMES RULE: never invent a proper name for anyone the user did not name — refer to unnamed people by role ("your partner", "the host") in every ready-to-say line. Return ONLY valid JSON. No markdown.', userLanguage),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'RoomReaderDecode' });
    // Guard on a real top-level field — `read` lives under most_likely, not at top level
    // (the old `parsed.read` guard always fired → every Decode request 500'd).
    if (!parsed.most_likely) {
      return res.status(500).json({ error: 'Could not read the room. Please try again.' });
    }
    res.json(parsed);
  } catch (error) {
    console.error('[RoomReaderDecode]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 4: DEBRIEF — Post-event analysis
// ═══════════════════════════════════════════════════
router.post('/room-reader-debrief', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { eventType, whatHappened, whatWentWell, whatFeltAwkward, overallFeeling, playbook, userLanguage } = req.body;
    if (!whatHappened?.trim() && !whatWentWell?.trim() && !whatFeltAwkward?.trim()) return res.status(400).json({ error: 'Tell us something about how it went.' });

    const playbookCtx = playbook?.length
      ? `\nPREVIOUS PLAYBOOK:\n${playbook.slice(0, 10).map(p => `- "${p.tactic}" (${p.context})`).join('\n')}`
      : '';

    const prompt = withLanguage(`Post-social-event debrief. Help them process what happened, extract what worked, and build confidence for next time. Not therapy — more like talking it through with a friend over coffee.

EVENT: ${eventType || 'social event'}
WHAT HAPPENED: ${whatHappened || 'not specified'}
${whatWentWell?.trim() ? `WHAT WENT WELL: ${whatWentWell}` : ''}
${whatFeltAwkward?.trim() ? `WHAT FELT AWKWARD: ${whatFeltAwkward}` : ''}
OVERALL FEELING: ${overallFeeling || 'mixed'}
${playbookCtx}

NAMES RULE: never invent a proper name for anyone the user did not name — refer to unnamed people by role ("your partner", "the host") in every ready-to-say line. Return ONLY valid JSON:
{
  "honest_read": "Your honest assessment of how it went — warm but not patronizing. If they nailed it, celebrate. If it was rough, acknowledge it without sugarcoating. — one sentence",
  "wins": [
    {
      "what": "Something that went well — even small things count — one sentence",
      "why_it_worked": "What specifically made this work — one sentence",
      "add_to_playbook": "A tactic to remember for next time — phrased as a reusable strategy — one sentence"
    }
  ],
  "awkward_reframes": [
    {
      "what_felt_bad": "The awkward moment they described — one sentence",
      "reality_check": "How it probably actually looked from the outside (usually less bad than they think) — one sentence",
      "next_time": "What to do differently OR why it's fine as-is — one sentence"
    }
  ],
  "patterns": "If they have previous playbook entries, note patterns: what consistently works, what they keep struggling with. If no history, skip this. — one sentence",
  "confidence_note": "Where they are on the confidence arc. Celebrate progress. Be specific — not 'you're doing great' but 'you went from dreading small talk to initiating conversations with strangers.' — one sentence",
  "next_challenge": {
    "suggestion": "One small social challenge for next time — graduated, not overwhelming — one sentence",
    "why": "How this builds on what they already proved they can do — one sentence"
  }
}`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2000,
      system: withLanguage('Post-event social coach. Warm, honest, encouraging. You help people see social wins they missed and reframe awkward moments accurately. You track progress and build confidence gradually. Not therapy — friendship with good social instincts. NAMES RULE: never invent a proper name for anyone the user did not name — refer to unnamed people by role ("your partner", "the host") in every ready-to-say line. Return ONLY valid JSON. No markdown.', userLanguage),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'RoomReaderDebrief' });
    if (!parsed.honest_read) {
      return res.status(500).json({ error: 'Could not read the room. Please try again.' });
    }
    res.json(parsed);
  } catch (error) {
    console.error('[RoomReaderDebrief]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 5: FOLLOW-UP — What to text after
// ═══════════════════════════════════════════════════
router.post('/room-reader-followup', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { context, who, whatHappened, goal, playbook, userLanguage } = req.body;
    if (!who?.trim() && !context?.trim()) return res.status(400).json({ error: 'Who are you following up with?' });

    const playbookCtx = playbook?.length
      ? `\nTHIS PERSON'S SOCIAL STYLE: They prefer ${playbook.slice(0, 5).map(p => `"${p.tactic}"`).join(', ')}. Match this tone.`
      : '';

    const prompt = withLanguage(`Help craft a follow-up message after a social interaction. This is the "what do I text them?" moment — after a date, after meeting someone at a party, after a work event, after an awkward encounter.

WHO: "${who || 'someone I met'}"
CONTEXT: "${context || 'social event'}"
${whatHappened?.trim() ? `WHAT HAPPENED: "${whatHappened}"` : ''}
${goal?.trim() ? `MY GOAL: "${goal}"` : ''}
${playbookCtx}

NAMES RULE: never invent a proper name for anyone the user did not name — refer to unnamed people by role ("your partner", "the host") in every ready-to-say line. Return ONLY valid JSON:
{
  "timing": "When to send it — specific (e.g., 'tomorrow afternoon' not 'soon'). Explain why this timing works. — one sentence",
  "messages": [
    {
      "style": "Warm | Casual | Playful | Professional",
      "text": "The actual message to send. Natural, appropriate length for the medium. — one sentence",
      "why": "Why this approach works for this specific situation. — one sentence",
      "risk": "low | medium | high"
    }
  ],
  "do_not_send": "One example of what NOT to text and why — the common mistake for this situation. — one sentence",
  "if_no_reply": "What to do (and not do) if they don't respond. Specific timeline and one graceful follow-up option. — one sentence"
}

Generate 3 message options with different styles/risk levels.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      system: withLanguage('Follow-up message coach. You write messages that sound like the person actually wrote them, not a bot. You understand timing, tone, and the anxiety of the follow-up text. Warm, practical, a little witty. NAMES RULE: never invent a proper name for anyone the user did not name — refer to unnamed people by role ("your partner", "the host") in every ready-to-say line. Return ONLY valid JSON. No markdown.', userLanguage),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'RoomReaderFollowUp' });
    if (!parsed.timing) {
      return res.status(500).json({ error: 'Could not read the room. Please try again.' });
    }
    res.json(parsed);
  } catch (error) {
    console.error('[RoomReaderFollowUp]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 6: PERSON PREP — Deep prep for one specific person
// ═══════════════════════════════════════════════════
router.post('/room-reader-person', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { personName, relationship, whatYouKnow, context, yourConcern, playbook, userLanguage } = req.body;
    if (!whatYouKnow?.trim() && !relationship?.trim()) return res.status(400).json({ error: 'Tell us something about this person.' });

    const playbookCtx = playbook?.length
      ? `\nUSER'S SOCIAL STYLE: ${playbook.slice(0, 5).map(p => `"${p.tactic}"`).join(', ')}`
      : '';

    const prompt = withLanguage(`Build a social strategy for interacting with ONE specific person. This isn't small talk advice — it's "I know I'll be sitting next to this person for 2 hours, help me not dread it."

PERSON: ${personName?.trim() ? `"${personName.trim()}"` : 'Not named'}
RELATIONSHIP: "${relationship || 'acquaintance'}"
WHAT I KNOW ABOUT THEM: "${whatYouKnow || 'not much'}"
${context?.trim() ? `UPCOMING CONTEXT: "${context}"` : ''}
${yourConcern?.trim() ? `WHAT WORRIES ME: "${yourConcern}"` : ''}
${playbookCtx}

NAMES RULE: never invent a proper name for anyone the user did not name — refer to unnamed people by role ("your partner", "the host") in every ready-to-say line. Return ONLY valid JSON:
{
  "person_read": {
    "likely_personality": "Your best read on what this person is probably like socially — based on the clues given. Warm, not judgmental. — one sentence",
    "what_they_probably_want": "What this person likely wants from social interactions — to feel respected? to be entertained? to connect? to be left alone? — one sentence",
    "your_advantage": "Something about your position or knowledge that gives you a natural in with this person. — one sentence"
  },
  "openers": [
    {
      "line": "Specific opener tailored to this person and your shared context. — one sentence",
      "why": "Why this works for THIS person specifically. — one sentence",
      "energy": "low_key | warm | playful | bold",
      "flow": "How the first 2-3 exchanges will go. — one sentence"
    }
  ],
  "topics_that_work": [
    {
      "topic": "A specific topic likely to land well with this person — 3-6 words",
      "entry_point": "How to bring it up naturally — exact words — one sentence",
      "why_it_works": "What about this person makes this topic a winner — one sentence"
    }
  ],
  "topics_to_avoid": [
    "Topics that would be risky or awkward with this specific person and why"
  ],
  "reading_them": {
    "interested_signals": "How to tell if THIS type of person is enjoying the conversation — one sentence",
    "done_signals": "How to tell when they want to move on — specific to their likely personality — one sentence",
    "warming_up": "Some people take 10 minutes to open up. What patience looks like with this person. — one sentence"
  },
  "if_it_goes_sideways": [
    {
      "scenario": "Something awkward that could happen with this specific person — one sentence",
      "recovery": "How to handle it — one sentence"
    }
  ],
  "overall_strategy": "2-3 sentences: your game plan for this person. What energy to bring, what to prioritize, what to let go of."
}

Generate 4-5 openers and 3-4 working topics.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2500,
      system: withLanguage('One-on-one social strategist. You build approach plans for specific people based on available clues. Warm, perceptive, practical. You never make someone sound like a "problem to solve" — you help the user find genuine connection points. NAMES RULE: never invent a proper name for anyone the user did not name — refer to unnamed people by role ("your partner", "the host") in every ready-to-say line. Return ONLY valid JSON. No markdown.', userLanguage),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'RoomReaderPerson' });
    if (!parsed.person_read) {
      return res.status(500).json({ error: 'Could not read the room. Please try again.' });
    }
    res.json(parsed);
  } catch (error) {
    console.error('[RoomReaderPerson]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 7: GROUP DYNAMICS — Navigating group conversations
// ═══════════════════════════════════════════════════
router.post('/room-reader-group', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { situation, groupSize, yourRole, challenge, playbook, userLanguage } = req.body;
    if (!situation?.trim() && !challenge?.trim()) return res.status(400).json({ error: 'Describe the group situation.' });

    const playbookCtx = playbook?.length
      ? `\nUSER'S SOCIAL STYLE: ${playbook.slice(0, 5).map(p => `"${p.tactic}"`).join(', ')}`
      : '';

    const prompt = withLanguage(`Help someone navigate GROUP conversation dynamics. This is fundamentally different from 1-on-1. Groups have hierarchies, side conversations, dominant voices, and the terrifying moment of "how do I enter this conversation?"

SITUATION: "${situation || 'group social setting'}"
GROUP SIZE: ${groupSize || '4-6 people'}
MY ROLE: "${yourRole || 'not the host, just attending'}"
${challenge?.trim() ? `MY SPECIFIC CHALLENGE: "${challenge}"` : ''}
${playbookCtx}

NAMES RULE: never invent a proper name for anyone the user did not name — refer to unnamed people by role ("your partner", "the host") in every ready-to-say line. Return ONLY valid JSON:
{
  "group_read": {
    "dynamics": "How this type of group typically operates — who talks, who listens, what the power structure looks like. — one sentence",
    "your_position": "Where you naturally fit in this group dynamic and how to use that. — one sentence",
    "misconception": "The thing people get wrong about group conversations that makes them harder than they need to be. — one sentence"
  },
  "entering_conversations": [
    {
      "scenario": "A specific 'how do I join this?' moment — e.g., '3 people laughing about something you missed' — one sentence",
      "technique": "Exactly how to enter — positioning, timing, first words — one sentence",
      "line": "The actual thing to say — one sentence",
      "why": "Why this works in a group context specifically — one sentence"
    }
  ],
  "common_traps": [
    {
      "trap": "A common group conversation mistake — e.g., 'trying to redirect to a topic you know about' — one sentence",
      "why_it_backfires": "What actually happens when you do this — one sentence",
      "instead": "What to do instead — one sentence"
    }
  ],
  "power_moves": [
    {
      "move": "A subtle group conversation technique that makes people remember you positively — one sentence",
      "how": "Exactly how to execute it — one sentence",
      "energy": "low_key | warm | confident"
    }
  ],
  "if_youre_being_ignored": {
    "why_it_happens": "Honest explanation — usually not personal — one sentence",
    "immediate_fix": "What to do right now — one sentence",
    "positioning_fix": "How to physically reposition to be included — one sentence",
    "exit_option": "When it's fine to just leave the group and find a different conversation — one sentence"
  },
  "recovery": "If you said something that landed flat in the group — how to recover without making it worse. — one sentence"
}

Generate 3-4 entry techniques, 3-4 contribution methods, 2-3 traps, and 2-3 power moves.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2500,
      system: withLanguage('Group dynamics coach. You understand social hierarchies, conversation flow, and the specific challenge of being heard in groups without being obnoxious. Warm, practical, specific. You know that groups are harder than 1-on-1 and you take that seriously. NAMES RULE: never invent a proper name for anyone the user did not name — refer to unnamed people by role ("your partner", "the host") in every ready-to-say line. Return ONLY valid JSON. No markdown.', userLanguage),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'RoomReaderGroup' });
    if (!parsed.group_read) {
      return res.status(500).json({ error: 'Could not read the room. Please try again.' });
    }
    res.json(parsed);
  } catch (error) {
    console.error('[RoomReaderGroup]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 8: CONVERSATION RECOVERY — I just said something weird
// ═══════════════════════════════════════════════════
router.post('/room-reader-recover', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { whatYouSaid, context, relationship, howBad, userLanguage } = req.body;
    if (!whatYouSaid?.trim()) return res.status(400).json({ error: 'What did you say?' });

    const prompt = withLanguage(`Someone just said something awkward/wrong/weird in a conversation and needs an IMMEDIATE recovery. This is happening RIGHT NOW. Be fast, specific, and honest about how bad it actually was.

WHAT I SAID: "${whatYouSaid}"
${context?.trim() ? `CONTEXT: "${context}"` : ''}
TALKING TO: "${relationship || 'someone'}"
HOW BAD I THINK IT WAS: "${howBad || 'bad'}"

NAMES RULE: never invent a proper name for anyone the user did not name — refer to unnamed people by role ("your partner", "the host") in every ready-to-say line. Return ONLY valid JSON:
{
  "damage_check": {
    "how_bad_really": "1-10 scale, honest. Most things people panic about are a 3. — one sentence",
    "what_they_probably_thought": "Their most likely interpretation — honest, not what the person fears. — one sentence",
    "immediate_read": "Quick, warm reality check. If it's fine, say so. If it's bad, own it. — one sentence"
  },
  "recovery_options": [
    {
      "strategy": "Acknowledge | Redirect | Humor | Let it go",
      "line": "Exact words to say RIGHT NOW. — one sentence",
      "timing": "Say it now | Wait 10 seconds | Circle back in a minute",
      "risk": "This could make it better/neutral/worse if done wrong — one sentence",
      "when_to_use": "Use this if... — one sentence"
    }
  ],
  "do_not_do": "The thing that would make this worse — the instinct to fight. — one sentence",
  "body_language": "What to do with your face and body right now. — one sentence",
  "perspective": "The warm, grounding truth — something a friend would say to talk you off the ledge. — one sentence"
}

Generate 3 recovery options with different strategies.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      system: withLanguage('Emergency conversation recovery specialist. Fast, warm, honest. You know most social "disasters" are 3/10 at worst. Give immediate, actionable saves. NAMES RULE: never invent a proper name for anyone the user did not name — refer to unnamed people by role ("your partner", "the host") in every ready-to-say line. Return ONLY valid JSON. No markdown.', userLanguage),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'RoomReaderRecover' });
    if (!parsed.damage_check) {
      return res.status(500).json({ error: 'Could not read the room. Please try again.' });
    }
    res.json(parsed);
  } catch (error) {
    console.error('[RoomReaderRecover]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 9: CULTURE DECODER — Cross-cultural social norms
// ═══════════════════════════════════════════════════
router.post('/room-reader-culture', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { culture, situation, myBackground, specificConcern, userLanguage } = req.body;
    if (!culture?.trim() && !situation?.trim()) return res.status(400).json({ error: 'Describe the cultural context.' });

    const prompt = withLanguage(`Cross-cultural social intelligence guide. Not a generic culture overview — specific to THIS social situation with THIS culture. Help them navigate without embarrassing themselves or offending anyone.

CULTURE/BACKGROUND: "${culture || 'not specified'}"
SITUATION: "${situation || 'social gathering'}"
${myBackground?.trim() ? `MY BACKGROUND: "${myBackground}"` : ''}
${specificConcern?.trim() ? `MY CONCERN: "${specificConcern}"` : ''}

NAMES RULE: never invent a proper name for anyone the user did not name — refer to unnamed people by role ("your partner", "the host") in every ready-to-say line. Return ONLY valid JSON:
{
  "quick_read": {
    "biggest_difference": "The single biggest social norm difference they need to know for THIS situation. — one sentence",
    "good_news": "What's easier than they think — common ground. — one sentence",
    "hidden_rule": "The unspoken rule outsiders always miss. — one sentence"
  },
  "do_this": [
    {
      "norm": "Specific social behavior expected in this culture/situation — one sentence",
      "why": "Why it matters — not just 'it's polite' but what it signals — one sentence",
      "how": "Exactly what to do — specific enough to execute — one sentence"
    }
  ],
  "avoid_this": [
    {
      "mistake": "Common mistake outsiders make — one sentence",
      "why_its_bad": "What it signals — not just 'it's rude' but what they'll think — one sentence",
      "what_to_do_instead": "The correct behavior — one sentence"
    }
  ],
  "conversation": {
    "safe_topics": ["Topics that work well across this cultural bridge"],
    "dangerous_topics": ["Topics to avoid and why — specific to this culture"],
    "humor": "How humor works — what's funny, what's offensive, whether humor is even appropriate here — one sentence"
  },
  "body_language": {
    "greetings": "How to greet — handshake, bow, hug, cheek kiss, distance — one sentence",
    "eye_contact": "Norms around eye contact — one sentence",
    "gestures_to_avoid": ["Gestures that mean something different in this culture"]
  },
  "graceful_recovery": "If you accidentally do something wrong — the universal recovery move for this culture — one sentence",
  "phrase_to_know": "One phrase in their language that will earn you enormous goodwill — with pronunciation — one sentence"
}

Generate 4-5 'do this' items and 3-4 'avoid this' items.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2500,
      system: withLanguage('Cross-cultural social intelligence expert. Specific, nuanced, respectful. You understand that cultural norms vary enormously and "just be yourself" is useless advice when yourself might accidentally offend. Practical, warm, never condescending about any culture. NAMES RULE: never invent a proper name for anyone the user did not name — refer to unnamed people by role ("your partner", "the host") in every ready-to-say line. Return ONLY valid JSON. No markdown.', userLanguage),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'RoomReaderCulture' });
    if (!parsed.quick_read) {
      return res.status(500).json({ error: 'Could not read the room. Please try again.' });
    }
    res.json(parsed);
  } catch (error) {
    console.error('[RoomReaderCulture]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 10: PERSON APPROACH — Generate strategy from tracked history
// ═══════════════════════════════════════════════════
router.post('/room-reader-person-refresh', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { personName, relationship, notes, nextContext, playbook, userLanguage } = req.body;
    if (!notes?.length) return res.status(400).json({ error: 'Need at least one interaction note for this person.' });

    const prompt = withLanguage(`Generate a FRESH approach strategy for a recurring person based on past interaction history. The user has met this person multiple times and logged what worked and what didn't. Give NEW suggestions that build on what they know.

PERSON: "${personName || 'Not named'}"
RELATIONSHIP: "${relationship || 'recurring contact'}"
${nextContext?.trim() ? `NEXT ENCOUNTER: "${nextContext}"` : ''}

INTERACTION HISTORY (most recent first):
${notes.slice(0, 15).map((n, i) => `${i + 1}. [${n.date || 'undated'}] Topics: ${n.topicsWorked || 'n/a'} | Avoided: ${n.topicsBombed || 'n/a'} | Notes: ${n.notes || 'none'}`).join('\n')}

${playbook?.length ? `USER'S GENERAL STYLE: ${playbook.slice(0, 5).map(p => `"${p.tactic}"`).join(', ')}` : ''}

NAMES RULE: never invent a proper name for anyone the user did not name — refer to unnamed people by role ("your partner", "the host") in every ready-to-say line. Return ONLY valid JSON:
{
  "relationship_arc": "Where this relationship is now based on the history — getting warmer, stalled, tense, comfortable. Be specific. — one sentence",
  "pattern_insights": [
    "Specific patterns from the history — e.g., 'Travel topics consistently land well' or 'They always shut down when you ask about work'"
  ],
  "fresh_openers": [
    {
      "line": "Something NEW to try — based on patterns but not repeating old topics — one sentence",
      "why_now": "Why this line makes sense given where the relationship is — one sentence"
    }
  ],
  "wildcard": {
    "move": "One unexpected thing to try that could shift the dynamic — one sentence",
    "risk": "low | medium | high"
  }
}

Generate 3-4 fresh openers.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      system: withLanguage('Recurring relationship strategist. You track patterns across interactions and suggest fresh approaches. You never repeat old advice — you build on history. Warm, perceptive, practical. NAMES RULE: never invent a proper name for anyone the user did not name — refer to unnamed people by role ("your partner", "the host") in every ready-to-say line. Return ONLY valid JSON. No markdown.', userLanguage),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'RoomReaderPersonRefresh' });
    if (!parsed.relationship_arc) {
      return res.status(500).json({ error: 'Could not read the room. Please try again.' });
    }
    res.json(parsed);
  } catch (error) {
    console.error('[RoomReaderPersonRefresh]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 11: ENERGY MATCH — Bridge the energy gap
// ═══════════════════════════════════════════════════
router.post('/room-reader-energy', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { myEnergy, roomEnergy, context, userLanguage } = req.body;
    if (!myEnergy?.trim() || !roomEnergy?.trim()) return res.status(400).json({ error: 'Describe your energy and the room\'s energy.' });

    const prompt = withLanguage(`Help someone bridge the gap between their current energy and the room's energy. The mismatch is often the real source of discomfort.

MY ENERGY: "${myEnergy}"
THE ROOM'S ENERGY: "${roomEnergy}"
${context?.trim() ? `CONTEXT: "${context}"` : ''}

NAMES RULE: never invent a proper name for anyone the user did not name — refer to unnamed people by role ("your partner", "the host") in every ready-to-say line. Return ONLY valid JSON:
{
  "gap_read": "What this mismatch actually feels like from both sides — why it's uncomfortable and whether it's actually noticeable to others. — one sentence",
  "match_up": {
    "strategy": "How to raise/lower your energy to match the room — specific techniques — one sentence",
    "starter_line": "One thing to say that bridges the energy gap naturally — one sentence"
  },
  "stay_yourself": {
    "strategy": "How to be comfortable at YOUR energy level without matching — because sometimes you shouldn't have to change — one sentence",
    "permission": "Why it's okay to not match — specific to this situation — one sentence"
  },
  "body_hacks": ["2-3 physical things to do that naturally shift your energy level — not 'take a deep breath' but specific actions"],
  "find_your_people": "How to find the 1-2 people in the room who match YOUR energy — they're always there. — one sentence",
  "reframe": "The warm truth: energy mismatches feel bigger from inside than they look from outside. — one sentence"
}`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 4000,
      system: withLanguage('Energy dynamics coach. You understand that social energy mismatches cause most social discomfort. Warm, practical, and honest that sometimes the answer is "don\'t match, own your energy." NAMES RULE: never invent a proper name for anyone the user did not name — refer to unnamed people by role ("your partner", "the host") in every ready-to-say line. Return ONLY valid JSON. No markdown.', userLanguage),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'RoomReaderEnergy' });
    if (!parsed.gap_read) {
      return res.status(500).json({ error: 'Could not read the room. Please try again.' });
    }
    res.json(parsed);
  } catch (error) {
    console.error('[RoomReaderEnergy]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 12: SMALL TALK LADDER — Escalate depth naturally
// ═══════════════════════════════════════════════════
router.post('/room-reader-ladder', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { relationship, context, currentDepth, userLanguage } = req.body;

    const prompt = withLanguage(`Build a "depth ladder" — a specific progression from surface-level small talk to genuine connection. Show exact transition phrases between each level. This is the skill nobody teaches: how to go from "nice weather" to actually learning something real about someone.

RELATIONSHIP: "${relationship || 'new acquaintance'}"
${context?.trim() ? `CONTEXT: "${context}"` : ''}
CURRENT DEPTH: "${currentDepth || 'surface — weather, sports, basic facts'}"

NAMES RULE: never invent a proper name for anyone the user did not name — refer to unnamed people by role ("your partner", "the host") in every ready-to-say line. Return ONLY valid JSON:
{
  "ladder": [
    {
      "level": 1,
      "name": "Surface — 3-6 words",
      "description": "What conversations at this level sound like — 1-2 sentences",
      "example_topics": ["3-4 topics at this depth"],
      "transition_up": {
        "phrase": "Exact phrase that naturally moves to the next level — not forced — one sentence",
        "technique": "What you're actually doing (e.g., 'sharing a mild opinion invites them to share one too') — one sentence",
        "signal_theyre_ready": "How to tell they want to go deeper vs. stay here — one sentence"
      }
    }
  ],
  "stuck_at_surface": {
    "why_it_happens": "The real reason most conversations stay at level 1 — one sentence",
    "the_fix": "The single mindset shift that makes depth feel natural — one sentence",
    "magic_question": "One question that almost always moves a conversation deeper — specific to this relationship type — one sentence"
  },
  "too_deep_too_fast": {
    "signs": "How to tell you've gone too deep for their comfort — one sentence",
    "recovery": "How to gracefully pull back without making it awkward — one sentence"
  },
  "the_goal": "What genuine connection at the deepest comfortable level actually looks and feels like for this relationship type. — one sentence"
}

Generate a 5-level ladder from Surface to Genuine Connection.`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2000,
      system: withLanguage('Conversation depth expert. You teach the skill of naturally deepening conversations without being intense or inappropriate. Every transition phrase sounds natural, never forced. Warm, wise, practical. NAMES RULE: never invent a proper name for anyone the user did not name — refer to unnamed people by role ("your partner", "the host") in every ready-to-say line. Return ONLY valid JSON. No markdown.', userLanguage),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'RoomReaderLadder' });
    if (!parsed.ladder) {
      return res.status(500).json({ error: 'Could not read the room. Please try again.' });
    }
    res.json(parsed);
  } catch (error) {
    console.error('[RoomReaderLadder]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 13: SOCIAL AUTOPSY — Deep forensic analysis
// ═══════════════════════════════════════════════════
router.post('/room-reader-autopsy', rateLimit(DEFAULT_LIMITS), async (req, res) => {
  try {
    const { whatHappened, timeline, howYouFelt, whatYouThinkWentWrong, playbook, userLanguage } = req.body;
    if (!whatHappened?.trim()) return res.status(400).json({ error: 'Describe what happened.' });

    const playbookCtx = playbook?.length
      ? `\nPREVIOUS PLAYBOOK:\n${playbook.slice(0, 10).map(p => `- "${p.tactic}" (${p.context})`).join('\n')}`
      : '';

    const prompt = withLanguage(`Deep forensic analysis of a social interaction that didn't go well. This is more thorough than a debrief — the person needs to understand WHAT happened and WHY, because they can't figure it out on their own. Be honest but kind. Sometimes the answer is "this wasn't your fault."

WHAT HAPPENED: "${whatHappened}"
${timeline?.trim() ? `TIMELINE/ARC: "${timeline}"` : ''}
${howYouFelt?.trim() ? `HOW I FELT: "${howYouFelt}"` : ''}
${whatYouThinkWentWrong?.trim() ? `WHAT I THINK WENT WRONG: "${whatYouThinkWentWrong}"` : ''}
${playbookCtx}

NAMES RULE: never invent a proper name for anyone the user did not name — refer to unnamed people by role ("your partner", "the host") in every ready-to-say line. Return ONLY valid JSON:
{
  "honest_assessment": "What actually happened, from an outside perspective. If their read is right, validate it. If they're wrong about what went wrong, tell them warmly. — 1-2 sentences",
  "turning_point": {
    "moment": "The specific moment things shifted — if identifiable — one sentence",
    "what_caused_it": "Why this was the turning point — one sentence",
    "was_it_you": "Honest: was this something you did, something they did, or just circumstances? (true/false)"
  },
  "signals_you_missed": [
    {
      "signal": "A social signal that was there but easy to miss — one sentence",
      "what_it_meant": "What it was telling you — one sentence",
      "how_to_spot_it_next_time": "What to watch for in future — one sentence"
    }
  ],
  "what_was_in_your_control": [
    "Specific things you could have done differently — actionable, not guilt-trippy"
  ],
  "what_was_not_your_fault": [
    "Things that were outside your control — other people's moods, bad timing, group dynamics. BE GENEROUS HERE. People blame themselves too much."
  ],
  "the_real_lesson": "The one takeaway that's actually useful going forward — not platitudes but a specific, learnable insight. — one sentence",
  "next_time": {
    "add_to_playbook": "A tactic to remember — phrased as a reusable strategy — one sentence"
  },
  "compassion_note": "The thing they need to hear. Warm, honest, human. 'You're being too hard on yourself' or 'That was a tough room' or 'Actually, you handled it better than you think.' — one sentence"
}`, userLanguage);

    const parsed = await callClaudeWithRetry({
      model: MODELS.SMART,
      max_tokens: 2500,
      system: withLanguage('Social forensic analyst. You do deep, honest, compassionate breakdowns of difficult social interactions. You separate what was in someone\'s control from what wasn\'t. You never pile on — you help them see clearly and learn. The goal is understanding, not self-blame. NAMES RULE: never invent a proper name for anyone the user did not name — refer to unnamed people by role ("your partner", "the host") in every ready-to-say line. Return ONLY valid JSON. No markdown.', userLanguage),
      messages: [{ role: 'user', content: prompt }]
    }, { label: 'RoomReaderAutopsy' });
    if (!parsed.honest_assessment) {
      return res.status(500).json({ error: 'Could not read the room. Please try again.' });
    }
    res.json(parsed);
  } catch (error) {
    console.error('[RoomReaderAutopsy]', error);
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;
