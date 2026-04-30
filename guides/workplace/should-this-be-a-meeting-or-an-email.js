module.exports = {
  slug:          'should-this-be-a-meeting-or-an-email',
  category:      'workplace',
  categoryLabel: 'Workplace',
  title:         "Should this be a meeting or an email?",
  titleHtml:     "Should this be a meeting <em>or an email?</em>",
  shortTitle:    "Meeting or email?",
  navTitle:      "meeting or email",
  description:   "An honest test for whether the meeting on your calendar — or the meeting you are about to schedule — should actually be a meeting at all.",
  deck:          "An honest test for whether the meeting on your calendar — or the meeting you are about to schedule — should actually be a meeting at all.",
  ledes: [
    `You just got an invite for a one-hour 'sync.' There is no agenda. The description says something like 'touching base on the project.' Eight people are on it. You know how this is going to go. Someone will spend ten minutes recapping things you already know. Someone will share a screen and walk through a slide deck you could have read in three minutes. Someone will say 'just to add to that' and add nothing. At the end of the hour, no decision will have been made, and you will all schedule a follow-up.\n\nMeetings have become the default. Anything that involves more than one person seems to require a calendar slot. But most of what gets put in meetings does not actually need to be. The cost of that mistake is enormous — multiply the meeting hours by the people in the room and most teams are losing entire workweeks every month to meetings that should not have happened.`,
    `Here is a clean test for whether something should actually be a meeting or could just be an email.`,
  ],
  steps: [
    { name: 'If it is information flowing one way, it is an email', body: 'Status updates. Project announcements. Reading a deck out loud. Walking through a document. These are all one-way information transfers, and one-way transfers do not need synchronous attention. They need a written artifact people can read on their own time. If the meeting consists mostly of one person talking and others listening, the meeting is an email pretending to be a meeting. The pretending costs the team hours.' },
    { name: 'If there is no decision to make, it is probably not a meeting', body: 'Real meetings produce decisions. They take a question — \'Should we do A or B?\' — and convert it into a commitment. If you cannot name the decision the meeting will produce, the meeting is probably ceremonial. Some ceremonial meetings have value (team-building, alignment), but most do not. Ask yourself before scheduling or accepting: what specific decision will be made here? If the answer is none, reconsider the meeting.' },
    { name: 'If it requires real-time back-and-forth, it is a meeting', body: 'Some things genuinely require synchronous discussion. Negotiation. Brainstorming with rapid iteration. Conflict resolution. Hard conversations. Any situation where the right answer emerges from the friction of multiple voices reacting to each other in real time. If the discussion is genuinely interactive — not \'I talk, you talk, I talk\' but \'we are building something together that no one of us could write alone\' — that is a real meeting.' },
    { name: 'If it can wait 24 hours, it can be async', body: 'Many meetings exist because they feel urgent in the moment, but the actual urgency is low. If the discussion can wait twenty-four hours, an async thread will produce a better outcome. People can think before responding. Quiet contributors can participate. The decision-maker can read everything and decide without the speed bias of the loudest person in the room. Meetings should be reserved for things that genuinely cannot wait.' },
    { name: 'If you cannot name the agenda in three sentences, do not have it', body: 'An agenda you cannot articulate is a meeting you cannot run. If when you sit down to write the invite, you cannot name what will be discussed in three concrete sentences, the meeting is not ready to be scheduled. Either do the work to figure out the agenda, or recognize that the meeting is not actually about anything specific and should not happen. Meetings without agendas are meetings without purposes, and they are where teams go to lose hours.' }
  ],
  cta: {
    glyph:    '🕵️',
    headline: "Should this be a meeting? Probably not.",
    body:     "Meeting BS Detector analyzes any meeting against red flags — vague purposes, missing agendas, info-sharing disguised as collaboration — and produces a verdict with confidence score. It also writes the script for suggesting an async alternative without sounding difficult.",
    features: [
      "Verdict (BS / borderline / legitimate) with confidence score",
      "Specific red flags identified — and what they mean",
      "Async alternative with exact template to propose it",
      "Permission statement: you are not being difficult by asking"
    ],
    toolId:   'MeetingBSDetector',
    toolName: 'Meeting BS Detector',
  },
  published: '2026-04-29',
  modified:  '2026-04-29',
};
