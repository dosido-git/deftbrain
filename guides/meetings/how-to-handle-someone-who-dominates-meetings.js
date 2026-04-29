// ============================================================
// guides/meetings/how-to-handle-someone-who-dominates-meetings.js
// ============================================================

module.exports = {
  slug:          'how-to-handle-someone-who-dominates-meetings',
  category:      'meetings',
  categoryLabel: 'Meetings',

  title:         "How to Handle Someone Who Dominates Meetings",
  titleHtml:     "How to Handle Someone Who <em>Dominates Meetings</em>",
  shortTitle:    "Handle a Meeting Dominator",
  navTitle:      "How to handle someone who dominates meetings",

  description:   "One person is taking up most of the air. Everyone else has stopped talking. Here's how to redirect cleanly — without making it personal, and without becoming the next problem.",
  deck:          "One person is taking up most of the air. Everyone else has stopped talking. Here's how to redirect cleanly — without making it personal, and without becoming the next problem.",

  published:     '2026-04-28',
  modified:      '2026-04-28',

  ledes: [
    `It's twenty minutes into the meeting and one person has spoken for fourteen of them. They're making good points; they're also making all of the points. The four other people in the room have started looking at their laptops. You have actual contributions and you've been waiting for an opening that hasn't come — they breathe and immediately start the next sentence. Saying something now feels like cutting them off, which feels rude, which is part of why nobody has done it yet.`,
    `Handling a meeting dominator is one of the hardest small skills in office life. Done badly it feels like a confrontation; done well it feels like facilitation. The difference is technique, not nerve. Five moves that redirect the air without making the moment personal.`,
  ],

  steps: [
    {
      name: "Wait for a breath, not a pause",
      body: "Real silences from a dominator are rare. What you're waiting for is a breath — the brief moment between sentences when they're inhaling and not speaking. Step into the breath cleanly and quickly: 'Thanks for that — I want to make sure we hear from a couple of others.' Waiting for them to finish a thought is a strategy that fails because they don't finish. The breath is the entry point.",
    },
    {
      name: "Redirect by naming, not by interrupting",
      body: "'Let me hear from someone else' is vague and feels like a criticism. 'Sara, you've been working on this — what's your read?' is specific and feels like inclusion. Naming a particular person redirects the air without indicting the dominator; the dominator doesn't have to stop talking because they did anything wrong, only because someone else has been called on. The name is the redirect.",
    },
    {
      name: "Use the agenda as your authority",
      body: "If the meeting has a stated time-box and a stated outcome, you can lean on those instead of on yourself. 'We've got eight minutes on this item — I want to make sure we land the decision' is a structural move, not a personal one. The dominator can keep going if they want, but they're now arguing with the schedule, not with you. The schedule is harder to argue with.",
    },
    {
      name: "Route them to a follow-up, not silence",
      body: "Dominators often have real expertise; what they're missing is calibration. 'These are great points and there's clearly more here — could you write it up afterward and send it around?' acknowledges the substance, gives them a venue for the rest of their thinking, and moves the meeting forward. Most dominators will accept the offer — they wanted to be heard, and the offer means they will be.",
    },
    {
      name: "Don't over-correct in the next meeting",
      body: "If you've successfully redirected someone in one meeting, the temptation in the next is to redirect them faster, harder, and more visibly. Resist it. Repeated public redirection becomes a pattern people notice — and the dominator becomes hyper-aware, which makes the dynamic worse. Reset to neutral. Treat each meeting fresh. Calibration is the goal; humiliation isn't, and the line between them is thinner than it looks.",
    },
  ],

  callout: {
    afterStep: 2,
    scriptedLine: "Thanks, that's helpful — I want to make sure we hear from Sara on this one too, since she's been closest to the launch side. Sara, what's your read?",
    explanation: "This works because it ends the dominator's turn cleanly, names a specific other person, and gives a specific reason for naming them. The redirect lands as inclusion, not as a rebuke. Most dominators absorb it and move on.",
  },

  cta: {
    glyph:    '🛡',
    headline: "Get redirect language before the meeting starts",
    body:     "Meeting Hijack Preventer generates intervention scripts for the dominators, interrupters, and tangent-takers in your specific room — calibrated for the seniority dynamic and the meeting's stated outcome.",
    features: [
      "Dominator-redirect scripts",
      "Inclusion-prompt language",
      "Time-boxed agenda structure",
      "Tone calibration",
      "Anti-hijack strategies",
    ],
    toolId:   'MeetingHijackPreventer',
    toolName: 'Meeting Hijack Preventer',
  },
};
