// ============================================================
// guide-specs/workplace/how-to-tell-your-boss-a-deadline-is-unrealistic.js
// ============================================================

module.exports = {
  slug:          'how-to-tell-your-boss-a-deadline-is-unrealistic',
  category:      'workplace',
  categoryLabel: 'Workplace',

  title:         "How to Tell Your Boss a Deadline Is Unrealistic (Before It's Too Late)",
  titleHtml:     "How to Tell Your Boss a Deadline Is Unrealistic <em>(Before It&#39;s Too Late)</em>",
  shortTitle:    "How to Tell Your Boss a Deadline Is Unrealistic",
  navTitle:      "How to tell your boss a deadline is unrealistic",

  description:   "The worst time to tell your manager a deadline won't work is the day before it's due. The second-worst is never. Here's how to have the conversation early — with data, not excuses.",
  deck:          "The worst time to tell your manager a deadline won't work is the day before it's due. The second-worst is never. Here's how to have the conversation early — with data, not excuses.",

  published:     '2026-04-22',
  modified:      '2026-04-22',

  ledes: [
    `You looked at the timeline, ran the numbers in your head, and the answer came back negative. Two weeks of work, nine days available. The deadline isn't wrong in principle — it's wrong in practice, and you can already see exactly where it breaks down. Now you have to say so.`,
    `Missed deadlines rarely come as a surprise. Someone usually knew weeks in advance. The reason they didn't say anything is that telling your manager a deadline is unrealistic feels like admitting you can't handle the work. It isn't. It's project management. The earlier you raise it, the more it looks like judgment rather than failure.`,
  ],

  steps: [
    {
      name: "Raise it immediately, not at the halfway mark",
      body: "The signal value of a deadline concern drops by the day. Saying 'this timeline is tight' on day one is a planning conversation. Saying it on day seven is a bailout request. The content is the same — the framing is completely different. If you already know the deadline won't hold, the right time to say so is now, before you've done enough work to feel sunk-cost about it.",
    },
    {
      name: "Bring the math, not the feeling",
      body: "'This feels like a lot' doesn't move anyone. 'This project breaks into six workstreams averaging two days each, or 12 days of work in a 9-day window' does. Turn the gut feeling into a scoped estimate before you walk in. Even a rough estimate is persuasive, because it's something your manager can argue with concretely instead of dismiss as nerves.",
    },
    {
      name: "Don't just say what won't fit — say what will",
      body: "If you walk in with 'this can't be done,' your manager has no move except to push back. If you walk in with 'here are three things we could ship by Friday, and here's what would have to move to October,' you've handed them a decision instead of a problem. Decisions feel like leadership. Problems feel like interruptions. Frame accordingly.",
    },
    {
      name: "Flag dependencies and risks, not just time",
      body: "The most convincing argument for an unrealistic deadline isn't hours — it's what you're dependent on that isn't in your control. The design isn't finalized. Legal hasn't reviewed. The staging environment is down. These aren't excuses; they're the actual blockers. Name them precisely. A specific blocker is a problem your manager can unblock. A vague 'it's tight' is one they have to override.",
    },
    {
      name: "Get the new plan in writing",
      body: "Whatever you agree to — a scope cut, a deadline push, a split delivery — confirm it in a short message afterward. Not a formal document; a two-line Slack recap. 'Confirming we're shipping the MVP Friday and the polish lands October 15.' This does two things: it catches misunderstandings now rather than during the post-mortem, and it gives you a shared record if anyone's memory gets creative later.",
    },
  ],

  callout: {
    afterStep: 2,
    scriptedLine: "Before we lock this in — I'm tracking about 12 days of work in a 9-day window. I have some ideas for where we could trim scope or extend the timeline. Which would you rather adjust?",
    explanation: "This positions you as the person thinking through the constraint, not complaining about it. The closing question hands your manager a choice, which is almost always easier to say yes to than a request.",
  },

  cta: {
    glyph:    '⏰',
    headline: "Rehearse the deadline conversation before you have it",
    body:     "Difficult Talk Coach drafts the exact scoping argument you need, anticipates how your manager will push back, and lets you rehearse the exchange until it lands naturally.",
    features: [
      "Scoping framework",
      "Predicted pushback + responses",
      "Live practice mode",
      "Written-recap templates",
      "Post-conversation debrief",
    ],
    toolId:   'DifficultTalkCoach',
    toolName: 'Difficult Talk Coach',
  },
};
