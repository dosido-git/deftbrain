// ============================================================
// guides/meetings/how-to-run-a-meeting-that-doesnt-go-off-the-rails.js
// ============================================================

module.exports = {
  slug:          'how-to-run-a-meeting-that-doesnt-go-off-the-rails',
  category:      'meetings',
  categoryLabel: 'Meetings',

  title:         "How to Run a Meeting That Doesn't Go Off the Rails",
  titleHtml:     "How to Run a Meeting That <em>Doesn't Go Off the Rails</em>",
  shortTitle:    "Run a Meeting That Stays on Track",
  navTitle:      "How to run a meeting that doesn't go off the rails",

  description:   "A good meeting is built before it starts and steered while it runs. Here's the five-step practice — agenda, opening, intervention, close — that produces actual decisions.",
  deck:          "A good meeting is built before it starts and steered while it runs. Here's the five-step practice — agenda, opening, intervention, close — that produces actual decisions.",

  published:     '2026-04-28',
  modified:      '2026-04-28',

  ledes: [
    `You've been in the meetings that work. They start on time. The agenda is clear. Someone runs the room without performing it. Decisions get made and the meeting ends three minutes early. You've also been in the other kind — the meeting that opens with five minutes of small talk, drifts into a tangent at minute fifteen, and somehow ends sixty seconds before the next call with everyone agreeing to schedule another meeting to actually decide. The difference between the two is almost never the topic.`,
    `Running a good meeting is a learnable skill, and it has very little to do with personality. The people who run meetings well aren't more charismatic — they've internalized a five-step practice that holds up regardless of who's in the room. Here it is.`,
  ],

  steps: [
    {
      name: "Send the agenda before, not in the room",
      body: "An agenda discussed at the top of the meeting is a meeting that's already lost five minutes. Send the agenda the day before, with the desired outcome named for each item. People walk in with context, not expectations to be set. The agenda emailed in advance is also an agenda that gets read; the agenda projected on the wall during the meeting is mostly background.",
    },
    {
      name: "Open by stating the goal",
      body: "First minute, out loud: 'By the end of this hour, we need to decide X.' Stating the outcome up front gives everyone a shared destination — and gives you a tool to redirect later when discussion drifts. Without a stated goal, every tangent is a candidate; with one, you can name a tangent as a tangent without it being personal. The opening sentence is the entire frame for the meeting.",
    },
    {
      name: "Time-box every agenda item",
      body: "Each agenda item gets a duration; you announce it; you stick to it. Time-boxing is what stops one item from eating the whole hour. When the box runs out and the discussion isn't done, three options: park it for follow-up, take a quick decision now, or decide on the spot to extend. Saying any of those out loud — instead of letting the conversation continue silently overrun — is what keeps the meeting on schedule.",
    },
    {
      name: "Intervene early, not late",
      body: "Tangents are infinitely easier to redirect at minute three than at minute thirteen. The moment a discussion is no longer about the agenda item, name it: 'That's a great topic — let's park it and get back to the original question.' Done early, the redirect is graceful; done late, it's a disruption. The second-best time to intervene is now; the best time was two minutes ago.",
    },
    {
      name: "Close with named decisions and owners",
      body: "Last three minutes of the hour: walk through the decisions made, the action items generated, and the person responsible for each. Out loud, by name. Most meetings end with everyone half-aware of what was decided and nobody specifically responsible for any of it; the closing recap is what converts a meeting from a discussion into a deliverable. The recap is the meeting's product. Without it, the meeting was a conversation that happened.",
    },
  ],

  callout: {
    afterStep: 3,
    scriptedLine: "We've got 10 minutes on this item — let me hold us to that. If we're not landing it, I'll suggest we park the rest and come back later.",
    explanation: "Said up front, this works because it's a structural commitment, not a criticism of any one person. Naming the time-box out loud, and the contingency for overrunning it, is what makes the redirect later feel like procedure rather than rebuke.",
  },

  cta: {
    glyph:    '🛡',
    headline: "Build the meeting and the scripts before you start",
    body:     "Meeting Hijack Preventer generates a structured agenda with time-boxed items, facilitator scripts for opening, redirecting, and closing, and intervention language for the moments meetings tend to drift.",
    features: [
      "Time-boxed agenda generator",
      "Facilitator opening scripts",
      "Tangent-redirect language",
      "Closing recap structure",
      "Inclusion-prompt suggestions",
    ],
    toolId:   'MeetingHijackPreventer',
    toolName: 'Meeting Hijack Preventer',
  },
};
