// ============================================================
// guides/meetings/how-to-ask-if-a-meeting-can-be-canceled.js
// ============================================================

module.exports = {
  slug:          'how-to-ask-if-a-meeting-can-be-canceled',
  category:      'meetings',
  categoryLabel: 'Meetings',

  title:         "How to Ask If a Meeting Can Be Canceled",
  titleHtml:     "How to Ask If a Meeting <em>Can Be Canceled</em>",
  shortTitle:    "Ask to Cancel a Meeting",
  navTitle:      "How to ask if a meeting can be canceled — without making it weird",

  description:   "Sometimes a meeting genuinely doesn't need to happen, and you're the one who notices. Here's how to ask the organizer to cancel it without making it weird, political, or personal.",
  deck:          "Sometimes a meeting genuinely doesn't need to happen, and you're the one who notices. Here's how to ask the organizer to cancel it without making it weird, political, or personal.",

  published:     '2026-04-28',
  modified:      '2026-04-28',

  ledes: [
    `The meeting was scheduled three weeks ago. The thing you were going to discuss got resolved last Thursday over Slack. The meeting is still on the calendar. Eight people are still going to show up at 2pm tomorrow to cover ground that no longer exists. You're the only one who's noticed, or the only one willing to say so. The question is whether you can ask the organizer to cancel it without making yourself the person who killed the meeting.`,
    `Asking to cancel a meeting is one of the cheapest, highest-leverage moves in office life. Done right, it makes you look thoughtful and saves eight people an hour. Done wrong, it lands like criticism. The difference is mostly in how the message is built. Here's the build.`,
  ],

  steps: [
    {
      name: "Lead with what changed, not what's wrong",
      body: "'I think we should cancel this' starts a debate. 'Looks like the design question got resolved in Slack — do we still need this meeting?' starts a confirmation. The first asks the organizer to defend their meeting; the second asks them to acknowledge a fact. People agree to facts more easily than they agree to opinions, especially about meetings they themselves scheduled.",
    },
    {
      name: "Phrase it as a question, not a declaration",
      body: "A question gives the organizer authority over the answer. A declaration takes it away. 'Can we cancel?' lets them say yes; 'we should cancel' makes them choose between agreeing and pushing back. The cancel-or-keep decision should always be theirs — your job is to make it obvious which way to decide. Asking instead of declaring preserves their face while accomplishing the same outcome.",
    },
    {
      name: "Time the message right",
      body: "24 to 48 hours before is the sweet spot. Earlier and the situation might genuinely change before the meeting; later and you're asking people to scramble. Sending the message at 9pm the night before is technically valid but practically rude — most organizers will just keep the meeting on rather than make the cancellation calls at midnight. Give them time to act on the request.",
    },
    {
      name: "Offer to take the lighter version",
      body: "If you sense the organizer wants the meeting to happen for reasons you don't fully see, give them an out that's smaller than canceling. 'If we still want a quick check-in, happy to do 15 minutes async or push to next week' is harder to refuse than a flat cancel. Most organizers will take the smaller version because it doesn't require admitting the original meeting was unnecessary. They get the substance; you get the rest of the hour.",
    },
    {
      name: "Don't call the meeting pointless",
      body: "Whatever language you use to describe the meeting, avoid characterizing it as pointless, unnecessary, or a waste. Even when it's true. Even when the organizer agrees. Calling someone's meeting pointless makes them defend it; describing the situation that's changed lets them cancel it themselves. The organizer doesn't have to admit anything; they just have to acknowledge that things moved. Make it easy for them to do that.",
    },
  ],

  callout: {
    afterStep: 2,
    scriptedLine: "Looks like the design question got worked out in #design-review last week — do we still need to meet tomorrow, or can we cancel?",
    explanation: "This works because it cites the specific reason the meeting is no longer needed, asks rather than declares, and gives the organizer language they can use to cancel without admitting anything went wrong. Most cancellations land within an hour of a message like this.",
  },

  cta: {
    glyph:    '🕵',
    headline: "Get the right cancel-message for any meeting",
    body:     "Meeting BS Detector reads the invite, identifies whether the meeting still has a purpose, and generates a tailored cancel-request script — calibrated for the organizer's seniority and the relationship.",
    features: [
      "Cancel-request scripts",
      "Tone calibration",
      "Lighter-version alternatives",
      "Meeting-purpose audit",
      "Time-saved estimates",
    ],
    toolId:   'MeetingBSDetector',
    toolName: 'Meeting BS Detector',
  },
};
