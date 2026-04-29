// ============================================================
// guides/meetings/how-to-suggest-making-a-meeting-async.js
// ============================================================

module.exports = {
  slug:          'how-to-suggest-making-a-meeting-async',
  category:      'meetings',
  categoryLabel: 'Meetings',

  title:         "How to Suggest Making a Meeting Async",
  titleHtml:     "How to Suggest <em>Making a Meeting Async</em>",
  shortTitle:    "How to Suggest a Meeting Go Async",
  navTitle:      "How to suggest making a meeting async without ruffling feathers",

  description:   "You don't need a manifesto. You need a one-message ask that gives the organizer a graceful path from meeting to thread. Here's the script and the move that makes it work.",
  deck:          "You don't need a manifesto. You need a one-message ask that gives the organizer a graceful path from meeting to thread. Here's the script and the move that makes it work.",

  published:     '2026-04-28',
  modified:      '2026-04-28',

  ledes: [
    `The recurring meeting just hit your calendar again. You've been on it for nine weeks; you've watched it produce roughly three decisions, all of which could have been made over Slack. The question of whether to suggest moving it async has been sitting in your head for a month. Every time you start to type the message, it gets long, then political, then defensive, then deleted.`,
    `Suggesting that a meeting go async is not a manifesto. It's a one-message ask that gives the organizer a graceful path from real-time to written. The right ask is short, specific, and frames the change as a favor to them, not a complaint about them. Here's how that ask is built.`,
  ],

  steps: [
    {
      name: "Frame it as their time, not your time",
      body: "'I think this meeting could be a thread' is about you. 'I'd hate for you to spend an hour each week pulling this information out of people in real time' is about them. The first reads as a complaint; the second reads as a favor. Same proposal, completely different reception. The organizer is more likely to accept a change that benefits them than one that benefits you.",
    },
    {
      name: "Propose the specific async format",
      body: "'Could we do this async?' invites a debate. 'Could each person post a three-bullet update in #team-channel by Tuesday 5pm?' invites a yes. The more concrete the alternative, the easier it is to agree to — and the harder it is to say 'we tried and it didn't work,' because there's a specific procedure to try. Vague asks invite vague nos. Specific asks invite specific yeses.",
    },
    {
      name: "Acknowledge what gets lost",
      body: "Real-time meetings do offer something async doesn't — face time, off-agenda asides, the ability to read the room. Pretending those don't matter makes you sound naive. Acknowledge them: 'We'd lose the casual catchup, but we could keep a 30-min monthly version for that.' This pre-empts the most common pushback and shows you've thought about it. The organizer is far more likely to agree if they think you have.",
    },
    {
      name: "Suggest a trial, not a permanent change",
      body: "'Let's cancel this meeting' is a fight. 'Let's try async for two weeks and see how it goes' is an experiment. The trial framing makes the proposal almost impossible to refuse — there's no permanent loss, just a test, and either it works or you go back. Most trials become permanent because the meeting nobody really wanted doesn't get re-instated when nobody's pushing for it.",
    },
    {
      name: "Send the message in DM, not in the meeting",
      body: "Suggesting async in the meeting itself, in front of everyone, puts the organizer on the spot — they can't agree without losing face. Send it as a DM the day before: low-stakes, low-audience, easy to say yes to without performing the change for the room. The single biggest determinant of whether the suggestion works is whether the organizer feels they're being asked privately or challenged publicly.",
    },
  ],

  callout: {
    afterStep: 3,
    scriptedLine: "Quick thought — would you be open to trying our weekly sync async for two weeks? Each person posts a three-bullet update by Tuesday 5pm, plus a monthly call for the rest.",
    explanation: "This works because it's specific (format, day, time), bounded (two weeks, then re-evaluate), and preserves what matters (a monthly call). The organizer can say yes without losing the meeting permanently, which is what they're really protecting.",
  },

  cta: {
    glyph:    '🕵',
    headline: "Generate the exact async-suggestion script",
    body:     "Meeting BS Detector takes your meeting description, identifies whether async actually works, and produces the specific format, channel, and message — calibrated for the relationship and the company.",
    features: [
      "Async format suggestions",
      "Tailored DM scripts",
      "Tone calibration",
      "Trial-period framing",
      "Time-saved estimates",
    ],
    toolId:   'MeetingBSDetector',
    toolName: 'Meeting BS Detector',
  },
};
