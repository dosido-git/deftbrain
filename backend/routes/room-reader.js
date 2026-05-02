const express = require('express');
const router = express.Router();
const { callClaudeWithRetry, withLanguage } = require('../lib/claude');

// ═══════════════════════════════════════════════════
// ROUTE 1: PRE-GAME — Comprehensive event prep
// ═══════════════════════════════════════════════════
router.post('/room-reader', async (req, res) => {
  try {
    const { eventType, eventDetails, people, concerns, topicsToAvoid, comfort, playbook, userLanguage } = req.body;
    if (!eventType?.trim() && !eventDetails?.trim()) return res.status(400).json({ error: 'Describe the event or social situation you\'re prepping for.' });

    const playbookCtx = playbook?.length
      ? `\nPERSONAL PLAYBOOK (what has worked for this person before):\n${playbook.slice(0, 10).map(p => `- "${p.tactic}" (used in: ${p.context}, rated: ${p.rating}/5)`).join('\n')}`
      : '';

    const prompt = withLanguage(`You are a warm, witty social intelligence coach helping someone prepare for a social event. You're their friend who happens to be brilliant at reading rooms. Not therapist-y — more like a clever friend prepping them in the car on the way there.

EVENT: ${eventType || ''} ${eventDetails ? `— ${eventDetails}` : ''}
${people?.trim() ? `WHO'S THERE: ${people}` : ''}
${concerns?.trim() ? `THEIR CONCERNS: ${concerns}` : ''}
COMFORT LEVEL: ${comfort || 'nervous'}
${topicsToAvoid?.trim() ? `AVOID THESE TOPICS: ${topicsToAvoid}` : ''}
${playbookCtx}

TONE: Warm but witty. Match their comfort level — more reassuring if panicking, more playful if they're mostly fine. Every suggestion should sound like something a real person would actually say, not a LinkedIn networking tip.

Return ONLY valid JSON:
{
  "vibe_check": {
    "read": "Your read on this event — what kind of energy to expect, what the social norms are. 2-3 sentences, conversational.",
    "your_superpower": "One specific thing about this situation that's actually in their favor — reframe something they're dreading as an advantage.",
    "comfort_hack": "One practical thing to do in the first 2 minutes to settle in (not 'take a deep breath' — something situational)."
  },
  "conversation_starters": [
    {
      "line": "The exact thing to say. Natural, specific to this event.",
      "works_because": "Why this line works HERE (not generic advice).",
      "energy": "low_key | warm | playful | bold",
      "best_for": "Who/when to use this — e.g., 'anyone at the appetizer table' or 'your partner's college friend'",
      "if_they_respond": "Most likely response, then your natural follow-up. Show the flow.",
      "if_it_falls_flat": "What to do if they give a one-word answer — graceful pivot."
    }
  ],
  "people_map": [
    {
      "who": "Type of person they'll encounter — e.g., 'the host', 'partner's boss', 'strangers at the bar'",
      "approach": "How to approach this person specifically",
      "opener": "Specific line for this person",
      "topics_that_work": ["Topics likely to land well with this person"],
      "watch_for": "Social cue that tells you they want to keep talking vs. move on"
    }
  ],
  "body_language": {
    "arrival": "What to do with your body when you first walk in",
    "during": "Positioning and posture tips specific to this event type",
    "secret_weapon": "One non-verbal move that makes you look confident and approachable"
  },
  "landmine_map": [
    "Topics to avoid and WHY — specific to this event, not generic. Include topics they listed PLUS others you'd flag for this scenario."
  ],
  "exit_toolkit": [
    {
      "scenario": "When you need to exit a conversation",
      "line": "Natural exit line",
      "move": "What to physically do (walk where, pick up what)"
    }
  ],
  "worst_case_saves": [
    {
      "scenario": "Specific awkward thing that might happen at THIS event",
      "save": "How to handle it gracefully",
      "reframe": "Why it's not as bad as they think"
    }
  ],
  "pep_talk": "2-3 sentences. Warm, specific, a little funny. The thing their best friend would say in the car before they walk in."
}

Generate 6-8 conversation starters with a mix of energies. Generate 2-4 people in the people_map. Generate 3-4 exit strategies and 2-3 worst case saves.`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'RoomReaderPreGame', max_tokens: 3000,
      system: withLanguage('Social intelligence coach. Warm, witty, specific. You give advice that sounds like a clever friend, not a self-help book. Every line you suggest is something a real person would actually say. You read rooms like a superpower and teach others to do the same. Return ONLY valid JSON. No markdown.', userLanguage) });
    res.json(parsed);
  } catch (error) {
    console.error('[RoomReaderPreGame]', error);
    res.status(500).json({ error: error.message || 'Failed to generate pre-game prep.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 2: QUICK READ — Instant, minimal input
// ═══════════════════════════════════════════════════
router.post('/room-reader-quick', async (req, res) => {
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

Return ONLY valid JSON:
{
  "line": "One natural, non-cheesy thing to say. Observations beat questions — 'This place has amazing light' > 'So what do you do?'",
  "why_it_works": "One sentence — why this line fits this exact scenario.",
  "they_say": "Their most likely response. Keep it realistic.",
  "you_follow": "Your natural follow-up that builds on what THEY said.",
  "if_nothing": "Graceful out if they give you nothing back.",
  "silence_reframe": "Why silence is actually fine RIGHT NOW in this specific scenario. Not generic — specific to this moment.",
  "body_tip": "One body language move for this exact scenario."
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'RoomReaderQuick', max_tokens: 600,
      system: withLanguage('Emergency social coach. Fast, warm, witty. One great line, not a list. Make it specific to the scenario. Return ONLY valid JSON. No markdown.', userLanguage) });
    res.json(parsed);
  } catch (error) {
    console.error('[RoomReaderQuick]', error);
    res.status(500).json({ error: error.message || 'Failed to generate quick read.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 3: SIGNAL DECODER — What did they mean?
// ═══════════════════════════════════════════════════
router.post('/room-reader-decode', async (req, res) => {
  try {
    const { theyDid, context, relationship, yourConcern, userLanguage } = req.body;
    if (!theyDid?.trim()) return res.status(400).json({ error: 'Describe what they said or did.' });

    const prompt = withLanguage(`You are a social signal decoder. Someone is trying to figure out what a social interaction meant. Help them read it accurately — not catastrophize, not dismiss, just understand.

WHAT HAPPENED: "${theyDid}"
${context?.trim() ? `CONTEXT: "${context}"` : ''}
RELATIONSHIP: "${relationship || 'not specified'}"
${yourConcern?.trim() ? `WHAT I'M WORRIED IT MEANS: "${yourConcern}"` : ''}

Be honest but kind. If it probably means something negative, say so gently. If they're overthinking it, tell them warmly. Don't be dismissive of their concern — take it seriously, then give your actual read.

Return ONLY valid JSON:
{
  "most_likely": {
    "read": "The most likely interpretation — honest, specific. Not 'could mean anything.'",
    "confidence": "pretty sure | likely | hard to tell | genuinely ambiguous",
    "evidence": "What specific detail points to this interpretation."
  },
  "also_possible": {
    "read": "A second plausible interpretation, if there is one.",
    "what_would_confirm": "What to watch for that would confirm this reading."
  },
  "overthinking_check": "Honest assessment: are they reading too much into this? If yes, explain warmly why. If no, validate their instinct.",
  "what_to_do": {
    "if_you_want_to_address_it": "How to bring it up naturally, with exact words.",
    "if_you_want_to_let_it_go": "How to move past it without it eating at you.",
    "if_youre_not_sure": "One small thing to do or watch for before deciding."
  },
  "reframe": "A warm, grounding perspective. The thing a wise friend would say."
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'RoomReaderDecode', max_tokens: 1500,
      system: withLanguage('Social signal analyst. Honest, warm, perceptive. You don\'t catastrophize or dismiss — you give the real read. You understand that social anxiety makes people over-interpret, but you also know sometimes their gut is right. Return ONLY valid JSON. No markdown.', userLanguage) });
    res.json(parsed);
  } catch (error) {
    console.error('[RoomReaderDecode]', error);
    res.status(500).json({ error: error.message || 'Failed to decode signal.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 4: DEBRIEF — Post-event analysis
// ═══════════════════════════════════════════════════
router.post('/room-reader-debrief', async (req, res) => {
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

Return ONLY valid JSON:
{
  "honest_read": "Your honest assessment of how it went — warm but not patronizing. If they nailed it, celebrate. If it was rough, acknowledge it without sugarcoating.",
  "wins": [
    {
      "what": "Something that went well — even small things count",
      "why_it_worked": "What specifically made this work",
      "add_to_playbook": "A tactic to remember for next time — phrased as a reusable strategy"
    }
  ],
  "awkward_reframes": [
    {
      "what_felt_bad": "The awkward moment they described",
      "reality_check": "How it probably actually looked from the outside (usually less bad than they think)",
      "next_time": "What to do differently OR why it's fine as-is"
    }
  ],
  "patterns": "If they have previous playbook entries, note patterns: what consistently works, what they keep struggling with. If no history, skip this.",
  "confidence_note": "Where they are on the confidence arc. Celebrate progress. Be specific — not 'you're doing great' but 'you went from dreading small talk to initiating conversations with strangers.'",
  "next_challenge": {
    "suggestion": "One small social challenge for next time — graduated, not overwhelming",
    "why": "How this builds on what they already proved they can do"
  }
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'RoomReaderDebrief', max_tokens: 2000,
      system: withLanguage('Post-event social coach. Warm, honest, encouraging. You help people see social wins they missed and reframe awkward moments accurately. You track progress and build confidence gradually. Not therapy — friendship with good social instincts. Return ONLY valid JSON. No markdown.', userLanguage) });
    res.json(parsed);
  } catch (error) {
    console.error('[RoomReaderDebrief]', error);
    res.status(500).json({ error: error.message || 'Failed to generate debrief.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 5: FOLLOW-UP — What to text after
// ═══════════════════════════════════════════════════
router.post('/room-reader-followup', async (req, res) => {
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

Return ONLY valid JSON:
{
  "timing": "When to send it — specific (e.g., 'tomorrow afternoon' not 'soon'). Explain why this timing works.",
  "messages": [
    {
      "style": "Warm | Casual | Playful | Professional",
      "text": "The actual message to send. Natural, appropriate length for the medium.",
      "why": "Why this approach works for this specific situation.",
      "risk": "low | medium | high"
    }
  ],
  "do_not_send": "One example of what NOT to text and why — the common mistake for this situation.",
  "if_no_reply": "What to do (and not do) if they don't respond. Specific timeline and one graceful follow-up option."
}

Generate 3 message options with different styles/risk levels.`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'RoomReaderFollowUp', max_tokens: 1200,
      system: withLanguage('Follow-up message coach. You write messages that sound like the person actually wrote them, not a bot. You understand timing, tone, and the anxiety of the follow-up text. Warm, practical, a little witty. Return ONLY valid JSON. No markdown.', userLanguage) });
    res.json(parsed);
  } catch (error) {
    console.error('[RoomReaderFollowUp]', error);
    res.status(500).json({ error: error.message || 'Failed to generate follow-up.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 6: PERSON PREP — Deep prep for one specific person
// ═══════════════════════════════════════════════════
router.post('/room-reader-person', async (req, res) => {
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

Return ONLY valid JSON:
{
  "person_read": {
    "likely_personality": "Your best read on what this person is probably like socially — based on the clues given. Warm, not judgmental.",
    "what_they_probably_want": "What this person likely wants from social interactions — to feel respected? to be entertained? to connect? to be left alone?",
    "your_advantage": "Something about your position or knowledge that gives you a natural in with this person."
  },
  "openers": [
    {
      "line": "Specific opener tailored to this person and your shared context.",
      "why": "Why this works for THIS person specifically.",
      "energy": "low_key | warm | playful | bold",
      "flow": "How the first 2-3 exchanges will go."
    }
  ],
  "topics_that_work": [
    {
      "topic": "A specific topic likely to land well with this person",
      "entry_point": "How to bring it up naturally — exact words",
      "why_it_works": "What about this person makes this topic a winner"
    }
  ],
  "topics_to_avoid": [
    "Topics that would be risky or awkward with this specific person and why"
  ],
  "reading_them": {
    "interested_signals": "How to tell if THIS type of person is enjoying the conversation",
    "done_signals": "How to tell when they want to move on — specific to their likely personality",
    "warming_up": "Some people take 10 minutes to open up. What patience looks like with this person."
  },
  "if_it_goes_sideways": [
    {
      "scenario": "Something awkward that could happen with this specific person",
      "recovery": "How to handle it"
    }
  ],
  "overall_strategy": "2-3 sentences: your game plan for this person. What energy to bring, what to prioritize, what to let go of."
}

Generate 4-5 openers and 3-4 working topics.`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'RoomReaderPerson', max_tokens: 2500,
      system: withLanguage('One-on-one social strategist. You build approach plans for specific people based on available clues. Warm, perceptive, practical. You never make someone sound like a "problem to solve" — you help the user find genuine connection points. Return ONLY valid JSON. No markdown.', userLanguage) });
    res.json(parsed);
  } catch (error) {
    console.error('[RoomReaderPerson]', error);
    res.status(500).json({ error: error.message || 'Failed to generate person prep.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 7: GROUP DYNAMICS — Navigating group conversations
// ═══════════════════════════════════════════════════
router.post('/room-reader-group', async (req, res) => {
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

Return ONLY valid JSON:
{
  "group_read": {
    "dynamics": "How this type of group typically operates — who talks, who listens, what the power structure looks like.",
    "your_position": "Where you naturally fit in this group dynamic and how to use that.",
    "misconception": "The thing people get wrong about group conversations that makes them harder than they need to be."
  },
  "entering_conversations": [
    {
      "scenario": "A specific 'how do I join this?' moment — e.g., '3 people laughing about something you missed'",
      "technique": "Exactly how to enter — positioning, timing, first words",
      "line": "The actual thing to say",
      "why": "Why this works in a group context specifically"
    }
  ],
  "contributing": [
    {
      "technique": "A specific way to contribute to a group conversation without dominating or disappearing",
      "example": "Exact words or approach",
      "when_to_use": "When this technique is most effective"
    }
  ],
  "common_traps": [
    {
      "trap": "A common group conversation mistake — e.g., 'trying to redirect to a topic you know about'",
      "why_it_backfires": "What actually happens when you do this",
      "instead": "What to do instead"
    }
  ],
  "power_moves": [
    {
      "move": "A subtle group conversation technique that makes people remember you positively",
      "how": "Exactly how to execute it",
      "energy": "low_key | warm | confident"
    }
  ],
  "if_youre_being_ignored": {
    "why_it_happens": "Honest explanation — usually not personal",
    "immediate_fix": "What to do right now",
    "positioning_fix": "How to physically reposition to be included",
    "exit_option": "When it's fine to just leave the group and find a different conversation"
  },
  "recovery": "If you said something that landed flat in the group — how to recover without making it worse."
}

Generate 3-4 entry techniques, 3-4 contribution methods, 2-3 traps, and 2-3 power moves.`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'RoomReaderGroup', max_tokens: 2500,
      system: withLanguage('Group dynamics coach. You understand social hierarchies, conversation flow, and the specific challenge of being heard in groups without being obnoxious. Warm, practical, specific. You know that groups are harder than 1-on-1 and you take that seriously. Return ONLY valid JSON. No markdown.', userLanguage) });
    res.json(parsed);
  } catch (error) {
    console.error('[RoomReaderGroup]', error);
    res.status(500).json({ error: error.message || 'Failed to analyze group dynamics.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 8: CONVERSATION RECOVERY — I just said something weird
// ═══════════════════════════════════════════════════
router.post('/room-reader-recover', async (req, res) => {
  try {
    const { whatYouSaid, context, relationship, howBad, userLanguage } = req.body;
    if (!whatYouSaid?.trim()) return res.status(400).json({ error: 'What did you say?' });

    const prompt = withLanguage(`Someone just said something awkward/wrong/weird in a conversation and needs an IMMEDIATE recovery. This is happening RIGHT NOW. Be fast, specific, and honest about how bad it actually was.

WHAT I SAID: "${whatYouSaid}"
${context?.trim() ? `CONTEXT: "${context}"` : ''}
TALKING TO: "${relationship || 'someone'}"
HOW BAD I THINK IT WAS: "${howBad || 'bad'}"

Return ONLY valid JSON:
{
  "damage_check": {
    "how_bad_really": "1-10 scale, honest. Most things people panic about are a 3.",
    "what_they_probably_thought": "Their most likely interpretation — honest, not what the person fears.",
    "immediate_read": "Quick, warm reality check. If it's fine, say so. If it's bad, own it."
  },
  "recovery_options": [
    {
      "strategy": "Acknowledge | Redirect | Humor | Let it go",
      "line": "Exact words to say RIGHT NOW.",
      "timing": "Say it now | Wait 10 seconds | Circle back in a minute",
      "risk": "This could make it better/neutral/worse if done wrong",
      "when_to_use": "Use this if..."
    }
  ],
  "do_not_do": "The thing that would make this worse — the instinct to fight.",
  "body_language": "What to do with your face and body right now.",
  "if_they_bring_it_up_later": "What to say if they reference it in 10 minutes or next week.",
  "perspective": "The warm, grounding truth — something a friend would say to talk you off the ledge."
}

Generate 3 recovery options with different strategies.`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'RoomReaderRecover', max_tokens: 1200,
      system: withLanguage('Emergency conversation recovery specialist. Fast, warm, honest. You know most social "disasters" are 3/10 at worst. Give immediate, actionable saves. Return ONLY valid JSON. No markdown.', userLanguage) });
    res.json(parsed);
  } catch (error) {
    console.error('[RoomReaderRecover]', error);
    res.status(500).json({ error: error.message || 'Failed to generate recovery.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 9: CULTURE DECODER — Cross-cultural social norms
// ═══════════════════════════════════════════════════
router.post('/room-reader-culture', async (req, res) => {
  try {
    const { culture, situation, myBackground, specificConcern, userLanguage } = req.body;
    if (!culture?.trim() && !situation?.trim()) return res.status(400).json({ error: 'Describe the cultural context.' });

    const prompt = withLanguage(`Cross-cultural social intelligence guide. Not a generic culture overview — specific to THIS social situation with THIS culture. Help them navigate without embarrassing themselves or offending anyone.

CULTURE/BACKGROUND: "${culture || 'not specified'}"
SITUATION: "${situation || 'social gathering'}"
${myBackground?.trim() ? `MY BACKGROUND: "${myBackground}"` : ''}
${specificConcern?.trim() ? `MY CONCERN: "${specificConcern}"` : ''}

Return ONLY valid JSON:
{
  "quick_read": {
    "biggest_difference": "The single biggest social norm difference they need to know for THIS situation.",
    "good_news": "What's easier than they think — common ground.",
    "hidden_rule": "The unspoken rule outsiders always miss."
  },
  "do_this": [
    {
      "norm": "Specific social behavior expected in this culture/situation",
      "why": "Why it matters — not just 'it's polite' but what it signals",
      "how": "Exactly what to do — specific enough to execute",
      "if_you_forget": "What happens and how to recover"
    }
  ],
  "avoid_this": [
    {
      "mistake": "Common mistake outsiders make",
      "why_its_bad": "What it signals — not just 'it's rude' but what they'll think",
      "what_to_do_instead": "The correct behavior"
    }
  ],
  "conversation": {
    "safe_topics": ["Topics that work well across this cultural bridge"],
    "dangerous_topics": ["Topics to avoid and why — specific to this culture"],
    "compliments": "How compliments work — some cultures deflect, some expect them, some find them suspicious",
    "humor": "How humor works — what's funny, what's offensive, whether humor is even appropriate here"
  },
  "body_language": {
    "greetings": "How to greet — handshake, bow, hug, cheek kiss, distance",
    "eye_contact": "Norms around eye contact",
    "personal_space": "Physical distance expectations",
    "gestures_to_avoid": ["Gestures that mean something different in this culture"]
  },
  "food_and_drink": "If food/drink is involved — what to expect, how to handle offers, etiquette",
  "graceful_recovery": "If you accidentally do something wrong — the universal recovery move for this culture",
  "phrase_to_know": "One phrase in their language that will earn you enormous goodwill — with pronunciation"
}

Generate 4-5 'do this' items and 3-4 'avoid this' items.`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'RoomReaderCulture', max_tokens: 2500,
      system: withLanguage('Cross-cultural social intelligence expert. Specific, nuanced, respectful. You understand that cultural norms vary enormously and "just be yourself" is useless advice when yourself might accidentally offend. Practical, warm, never condescending about any culture. Return ONLY valid JSON. No markdown.', userLanguage) });
    res.json(parsed);
  } catch (error) {
    console.error('[RoomReaderCulture]', error);
    res.status(500).json({ error: error.message || 'Failed to decode culture.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 10: PERSON APPROACH — Generate strategy from tracked history
// ═══════════════════════════════════════════════════
router.post('/room-reader-person-refresh', async (req, res) => {
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

Return ONLY valid JSON:
{
  "relationship_arc": "Where this relationship is now based on the history — getting warmer, stalled, tense, comfortable. Be specific.",
  "pattern_insights": [
    "Specific patterns from the history — e.g., 'Travel topics consistently land well' or 'They always shut down when you ask about work'"
  ],
  "fresh_openers": [
    {
      "line": "Something NEW to try — based on patterns but not repeating old topics",
      "why_now": "Why this line makes sense given where the relationship is",
      "builds_on": "Which past interaction this builds on"
    }
  ],
  "deepen_with": "One specific technique to move this relationship forward — from small talk to actual connection. Based on their patterns.",
  "avoid_this_time": ["Topics or approaches to skip based on history"],
  "wildcard": {
    "move": "One unexpected thing to try that could shift the dynamic",
    "risk": "low | medium | high",
    "potential": "What could happen if it works"
  }
}

Generate 3-4 fresh openers.`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'RoomReaderPersonRefresh', max_tokens: 1800,
      system: withLanguage('Recurring relationship strategist. You track patterns across interactions and suggest fresh approaches. You never repeat old advice — you build on history. Warm, perceptive, practical. Return ONLY valid JSON. No markdown.', userLanguage) });
    res.json(parsed);
  } catch (error) {
    console.error('[RoomReaderPersonRefresh]', error);
    res.status(500).json({ error: error.message || 'Failed to refresh person strategy.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 11: ENERGY MATCH — Bridge the energy gap
// ═══════════════════════════════════════════════════
router.post('/room-reader-energy', async (req, res) => {
  try {
    const { myEnergy, roomEnergy, context, userLanguage } = req.body;
    if (!myEnergy?.trim() || !roomEnergy?.trim()) return res.status(400).json({ error: 'Describe your energy and the room\'s energy.' });

    const prompt = withLanguage(`Help someone bridge the gap between their current energy and the room's energy. The mismatch is often the real source of discomfort.

MY ENERGY: "${myEnergy}"
THE ROOM'S ENERGY: "${roomEnergy}"
${context?.trim() ? `CONTEXT: "${context}"` : ''}

Return ONLY valid JSON:
{
  "gap_read": "What this mismatch actually feels like from both sides — why it's uncomfortable and whether it's actually noticeable to others.",
  "match_up": {
    "strategy": "How to raise/lower your energy to match the room — specific techniques",
    "time_needed": "How long this adjustment typically takes",
    "starter_line": "One thing to say that bridges the energy gap naturally"
  },
  "stay_yourself": {
    "strategy": "How to be comfortable at YOUR energy level without matching — because sometimes you shouldn't have to change",
    "permission": "Why it's okay to not match — specific to this situation",
    "how_to_own_it": "How to make your different energy a strength"
  },
  "body_hacks": ["2-3 physical things to do that naturally shift your energy level — not 'take a deep breath' but specific actions"],
  "find_your_people": "How to find the 1-2 people in the room who match YOUR energy — they're always there.",
  "reframe": "The warm truth: energy mismatches feel bigger from inside than they look from outside."
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'RoomReaderEnergy', max_tokens: 1200,
      system: withLanguage('Energy dynamics coach. You understand that social energy mismatches cause most social discomfort. Warm, practical, and honest that sometimes the answer is "don\'t match, own your energy." Return ONLY valid JSON. No markdown.', userLanguage) });
    res.json(parsed);
  } catch (error) {
    console.error('[RoomReaderEnergy]', error);
    res.status(500).json({ error: error.message || 'Failed to analyze energy.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 12: SMALL TALK LADDER — Escalate depth naturally
// ═══════════════════════════════════════════════════
router.post('/room-reader-ladder', async (req, res) => {
  try {
    const { relationship, context, currentDepth, userLanguage } = req.body;

    const prompt = withLanguage(`Build a "depth ladder" — a specific progression from surface-level small talk to genuine connection. Show exact transition phrases between each level. This is the skill nobody teaches: how to go from "nice weather" to actually learning something real about someone.

RELATIONSHIP: "${relationship || 'new acquaintance'}"
${context?.trim() ? `CONTEXT: "${context}"` : ''}
CURRENT DEPTH: "${currentDepth || 'surface — weather, sports, basic facts'}"

Return ONLY valid JSON:
{
  "ladder": [
    {
      "level": 1,
      "name": "Surface",
      "description": "What conversations at this level sound like",
      "example_topics": ["3-4 topics at this depth"],
      "transition_up": {
        "phrase": "Exact phrase that naturally moves to the next level — not forced",
        "technique": "What you're actually doing (e.g., 'sharing a mild opinion invites them to share one too')",
        "signal_theyre_ready": "How to tell they want to go deeper vs. stay here"
      }
    }
  ],
  "stuck_at_surface": {
    "why_it_happens": "The real reason most conversations stay at level 1",
    "the_fix": "The single mindset shift that makes depth feel natural",
    "magic_question": "One question that almost always moves a conversation deeper — specific to this relationship type"
  },
  "too_deep_too_fast": {
    "signs": "How to tell you've gone too deep for their comfort",
    "recovery": "How to gracefully pull back without making it awkward"
  },
  "the_goal": "What genuine connection at the deepest comfortable level actually looks and feels like for this relationship type."
}

Generate a 5-level ladder from Surface to Genuine Connection.`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'RoomReaderLadder', max_tokens: 2000,
      system: withLanguage('Conversation depth expert. You teach the skill of naturally deepening conversations without being intense or inappropriate. Every transition phrase sounds natural, never forced. Warm, wise, practical. Return ONLY valid JSON. No markdown.', userLanguage) });
    res.json(parsed);
  } catch (error) {
    console.error('[RoomReaderLadder]', error);
    res.status(500).json({ error: error.message || 'Failed to build ladder.' });
  }
});

// ═══════════════════════════════════════════════════
// ROUTE 13: SOCIAL AUTOPSY — Deep forensic analysis
// ═══════════════════════════════════════════════════
router.post('/room-reader-autopsy', async (req, res) => {
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

Return ONLY valid JSON:
{
  "honest_assessment": "What actually happened, from an outside perspective. If their read is right, validate it. If they're wrong about what went wrong, tell them warmly.",
  "turning_point": {
    "moment": "The specific moment things shifted — if identifiable",
    "what_caused_it": "Why this was the turning point",
    "was_it_you": "Honest: was this something you did, something they did, or just circumstances?"
  },
  "signals_you_missed": [
    {
      "signal": "A social signal that was there but easy to miss",
      "what_it_meant": "What it was telling you",
      "how_to_spot_it_next_time": "What to watch for in future"
    }
  ],
  "what_was_in_your_control": [
    "Specific things you could have done differently — actionable, not guilt-trippy"
  ],
  "what_was_not_your_fault": [
    "Things that were outside your control — other people's moods, bad timing, group dynamics. BE GENEROUS HERE. People blame themselves too much."
  ],
  "the_real_lesson": "The one takeaway that's actually useful going forward — not platitudes but a specific, learnable insight.",
  "next_time": {
    "if_same_situation": "What to do differently if this exact scenario happens again",
    "add_to_playbook": "A tactic to remember — phrased as a reusable strategy"
  },
  "compassion_note": "The thing they need to hear. Warm, honest, human. 'You're being too hard on yourself' or 'That was a tough room' or 'Actually, you handled it better than you think.'"
}`, userLanguage);

    const parsed = await callClaudeWithRetry(prompt, { label: 'RoomReaderAutopsy', max_tokens: 2500,
      system: withLanguage('Social forensic analyst. You do deep, honest, compassionate breakdowns of difficult social interactions. You separate what was in someone\'s control from what wasn\'t. You never pile on — you help them see clearly and learn. The goal is understanding, not self-blame. Return ONLY valid JSON. No markdown.', userLanguage) });
    res.json(parsed);
  } catch (error) {
    console.error('[RoomReaderAutopsy]', error);
    res.status(500).json({ error: error.message || 'Failed to analyze interaction.' });
  }
});

module.exports = router;
