// ============================================================
// guide-specs/workplace/how-to-say-no-to-your-boss.js
// ============================================================

module.exports = {
  slug:          'how-to-say-no-to-your-boss',
  category:      'workplace',
  categoryLabel: 'Workplace',

  title:         "How to Say No to Your Boss (Without Burning a Bridge)",
  titleHtml:     "How to Say No to Your Boss <em>(Without Burning a Bridge)</em>",
  shortTitle:    "How to Say No to Your Boss",
  navTitle:      "How to say no to your boss without burning a bridge",

  description:   "Saying no to your manager isn't insubordination — it's scope management. A practical guide to declining requests in a way that shows judgment, not reluctance.",
  deck:          "Saying no to your manager isn't insubordination — it's scope management. The trick is saying it in a way that shows judgment, not reluctance.",

  published:     '2026-04-22',
  modified:      '2026-04-22',

  ledes: [
    `Your manager just walked over and asked you to "take a quick look" at something. Three hours of quick-looking later, you're behind on the things you were already behind on. Saying yes was easier in the moment. It usually is. That's why people end up saying yes to everything — and then missing the things that actually matter.`,
    `A good "no" isn't a refusal. It's a negotiation about where your time is best spent. Your boss has as much interest in that conversation as you do — they just often don't realize it until you name the tradeoff out loud.`,
  ],

  steps: [
    {
      name: "Don't answer immediately",
      body: "The worst 'no' is the one you blurt out under pressure, before you've thought about the actual cost. The worst 'yes' gets blurted out the same way. Buy yourself five minutes. 'Let me check my calendar and get back to you in an hour' is enough to give you room to assess the real ask. Almost no request needs an answer in the next sixty seconds, even if the person asking acts like it does.",
    },
    {
      name: "Confirm you understood the request",
      body: "Before you answer, repeat the request back in your own words — especially the deliverable, the deadline, and the purpose. Half the time your manager is less attached to the specifics than you think. Sometimes they're thinking out loud and haven't fully committed yet. Repeating it back often prompts them to revise it downward before you ever have to push back.",
    },
    {
      name: "Name the tradeoff, not the refusal",
      body: "Don't say 'I can't.' Say 'I can do this, but it means X will slip.' Your boss has visibility you don't into which of those two things matters more. Let them make the prioritization call — that's their job. Your job is to make the call legible. The moment you frame it as a tradeoff, you've moved from resisting the request to asking them to lead.",
    },
    {
      name: "Offer a partial yes",
      body: "A clean 'no' is harder to accept than a 'yes, but smaller.' Can you do half? Can you do it next week instead of tomorrow? Can you hand it off to someone better positioned? Every alternative you offer is a door out of the corner you're both in. If you've only given them two options and one is 'no,' the conversation has nowhere to go.",
    },
    {
      name: "Follow through on whatever you did commit to",
      body: "The reason you get permission to say no next time is that the last time you said yes, you delivered. A reputation for realistic commitments is worth more than a reputation for being agreeable. Managers tolerate well-defended boundaries from reliable people and resent them from unreliable ones. Build the reliability first; the boundaries come easier after.",
    },
  ],

  callout: {
    afterStep: 2,
    scriptedLine: "Happy to take this on — before I commit, I want to flag that the Q3 report is due Friday, and I'd need to push that back to make room. Which matters more to you this week?",
    explanation: "This puts you on the same side of the table. You're not resisting the request; you're asking for prioritization. Most managers will take the hand-off gratefully because they'd rather make the call than have both things half-done.",
  },

  cta: {
    glyph:    '✋',
    headline: "Get the exact phrasing for your specific situation",
    body:     "Difficult Talk Coach drafts scripts tuned to your manager's style, predicts their likely response, and lets you rehearse the conversation until the first sentence feels easy.",
    features: [
      "Situation-specific scripts",
      "Tradeoff framing built in",
      "Live practice mode",
      "Real-time coaching",
      "Post-conversation debrief",
    ],
    toolId:   'DifficultTalkCoach',
    toolName: 'Difficult Talk Coach',
  },
};
