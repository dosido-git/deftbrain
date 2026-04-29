// ============================================================
// guides/meetings/should-this-be-a-meeting-or-an-email.js
// ============================================================

module.exports = {
  slug:          'should-this-be-a-meeting-or-an-email',
  category:      'meetings',
  categoryLabel: 'Meetings',

  title:         "Should This Be a Meeting or an Email?",
  titleHtml:     "Should This Be a Meeting <em>or an Email?</em>",
  shortTitle:    "Should This Be a Meeting?",
  navTitle:      "Should this be a meeting or an email — how to decide",

  description:   "You're about to put a meeting on someone's calendar. Stop. Here's a five-question test that catches the meetings that should never have existed.",
  deck:          "You're about to put a meeting on someone's calendar. Stop. Here's a five-question test that catches the meetings that should never have existed.",

  published:     '2026-04-28',
  modified:      '2026-04-28',

  ledes: [
    `Your finger is hovering over 'Send Invite.' You typed up the meeting because something needed to happen and you didn't know what else to do — schedule the meeting, get the people in a room, figure it out together. That's the default reflex of office life. The problem with the default is that it costs eight people an hour of their day, and roughly half the time the actual answer was a paragraph in Slack.`,
    `The decision between meeting and message isn't a personal style question. It's a question with an answer, and the answer comes out of asking the right things first. Five questions, in order. If you can't answer the first one, the rest don't matter.`,
  ],

  steps: [
    {
      name: "Is there a real decision to make?",
      body: "If the meeting is to share information, it's not a meeting — it's a memo with chairs. Status updates, FYIs, walkthroughs of things people could read on their own time: these are documents pretending to be meetings. A real meeting has a decision the group needs to make together, with input from the people in the room. No decision, no meeting.",
    },
    {
      name: "Does it need everyone in the room?",
      body: "Eight people on a status sync isn't a meeting; it's a broadcast with witnesses. A meeting earns its size when each person in the room either contributes to the decision or learns something they couldn't get from a doc. If you'd be fine with two of the eight just reading the notes after, those two shouldn't be there. Half the people on most invites are there because nobody wanted to leave them out.",
    },
    {
      name: "Is the conversation high-bandwidth or low-bandwidth?",
      body: "Some conversations need real-time back-and-forth: brainstorming, conflict resolution, anything where you're reading faces. Others don't: 'here's what we decided last week,' 'here's the new policy,' 'here's the project plan.' Low-bandwidth conversations are where meetings go to die badly. The test: could this be done over text without losing the substance? If yes, do it that way. The bandwidth saved is real money.",
    },
    {
      name: "Is async slower, or does it just feel slower?",
      body: "People schedule meetings because async feels slow — you wait for replies, things get lost, threads sprawl. But a 30-minute meeting with eight people costs four hours of collective time. A Slack thread that resolves in two days costs maybe twenty minutes total. Meetings feel fast because the time is everyone else's. They aren't faster. They're just more synchronous, which is a different thing.",
    },
    {
      name: "Could it be smaller, shorter, or written?",
      body: "If the meeting passes the first four tests and still needs to happen, the last move is to make it the smallest version of itself. Cut the duration in half. Cut the invite list to the people who'll actually speak. Send an agenda the day before so people walk in already up to speed. The meeting that survives all five tests is usually a much better meeting than the one you were originally going to send.",
    },
  ],

  callout: {
    afterStep: 4,
    scriptedLine: "Quick check before I send the invite — could we handle this in a thread instead? I think we can resolve it without pulling everyone onto a call.",
    explanation: "This works because it doesn't decline the conversation, doesn't accuse anyone of over-scheduling, and offers a specific alternative. Most senders will agree to try async first if the option is presented before the calendar invite goes out.",
  },

  cta: {
    glyph:    '🕵',
    headline: "Run the test on any meeting before you accept",
    body:     "Meeting BS Detector takes a meeting description and tells you whether it's legitimate, borderline, or unnecessary — with the exact alternative to suggest, the time it would save, and a script to propose it.",
    features: [
      "Five-question diagnostic",
      "BS/borderline/legitimate verdict",
      "Async alternative suggestions",
      "Time-saved estimates",
      "Diplomatic decline scripts",
    ],
    toolId:   'MeetingBSDetector',
    toolName: 'Meeting BS Detector',
  },
};
