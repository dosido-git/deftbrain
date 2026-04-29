// ============================================================
// guides/meetings/how-to-tell-if-a-meeting-is-going-to-be-useful.js
// ============================================================

module.exports = {
  slug:          'how-to-tell-if-a-meeting-is-going-to-be-useful',
  category:      'meetings',
  categoryLabel: 'Meetings',

  title:         "How to Tell If a Meeting Is Going to Be Useful",
  titleHtml:     "How to Tell If a Meeting Is <em>Going to Be Useful</em>",
  shortTitle:    "Will This Meeting Be Useful?",
  navTitle:      "How to tell if a meeting is going to be useful before it happens",

  description:   "You can usually tell in thirty seconds whether a meeting will produce anything. Here are the five signals — visible on the invite — that separate useful from calendar tax.",
  deck:          "You can usually tell in thirty seconds whether a meeting will produce anything. Here are the five signals — visible on the invite — that separate useful from calendar tax.",

  published:     '2026-04-28',
  modified:      '2026-04-28',

  ledes: [
    `Tuesday at 2pm. Sixty minutes. 'Sync to align on the project.' Eight people invited, no agenda attached, last edited four weeks ago. You've already accepted because that's what you do. You'll show up, you'll listen to people work out something they could have written down, you'll leave at 2:58pm with the same understanding of the project you walked in with. The cost of attending was the hour. The cost of declining felt higher, so here we are.`,
    `Most useful meetings are visibly useful before they start. Most useless meetings are also visibly useless before they start — you can tell from the invite if you know what to look for. Here are the five signals.`,
  ],

  steps: [
    {
      name: "Read the agenda first, the title second",
      body: "Meetings with real agendas almost always produce something. Meetings without agendas are about half noise, half nothing. The agenda doesn't have to be elaborate — three bullet points and a desired outcome is enough — but its absence is a tell. If there's no agenda, the organizer hasn't decided what the meeting is for, which means the meeting will spend the first fifteen minutes figuring it out and the last fifteen running over.",
    },
    {
      name: "Check whether there's a decision to make",
      body: "Useful meetings almost always exist to make a decision. Useless ones tend to exist to share information, discuss feelings, or perform alignment. Look at the title: 'Decide on Q3 launch sequence' is a different animal than 'Touch base on Q3.' The first will produce a decision; the second will produce a meeting summary email. Decisions are leverage. Touchings of bases are not.",
    },
    {
      name: "Count the people on the invite",
      body: "Two to four people in a room makes decisions. Five to seven makes discussions. Eight or more makes performances. The number of people on the invite tells you what kind of meeting it's going to be — and 'discussion' and 'performance' rarely produce anything useful. Look at the invite list. If the goal is a decision and there are nine people, the meeting will not actually make the decision; it will set up another meeting where the decision gets made among three of those nine.",
    },
    {
      name: "Look at the duration relative to the topic",
      body: "An hour to discuss a roadmap is fine. An hour to share status updates is the wrong unit of time entirely. Meetings tend to expand to fill their slots — a 60-minute meeting will run 60 minutes whether or not the topic warranted 15. If the duration feels too long for the topic, it is, and the extra time will be filled with content nobody needed.",
    },
    {
      name: "Distinguish a real meeting from a habit",
      body: "Recurring meetings degrade over time. The first one was useful; by the twelfth, it's calendar furniture. Look at the recurrence pattern. If it's been weekly for six months and there's no agenda, you're attending a habit, not a meeting. Habits don't produce decisions. They produce calendar guilt — the sense that something is happening because something has to be happening at this time on Tuesdays.",
    },
  ],

  cta: {
    glyph:    '🕵',
    headline: "Get a verdict on the meeting before you accept",
    body:     "Meeting BS Detector reads the invite — title, agenda, duration, attendees — and gives you a confidence-scored verdict on whether it'll produce anything, plus what to do if it won't.",
    features: [
      "Pre-meeting verdict",
      "Confidence scoring",
      "Red-flag detection",
      "Five-question diagnostic",
      "Decline or trim suggestions",
    ],
    toolId:   'MeetingBSDetector',
    toolName: 'Meeting BS Detector',
  },
};
