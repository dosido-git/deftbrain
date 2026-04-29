// ============================================================
// guides/workplace/how-to-triage-your-inbox-in-5-minutes.js
// ============================================================

module.exports = {
  slug:          'how-to-triage-your-inbox-in-5-minutes',
  category:      'workplace',
  categoryLabel: 'Workplace',

  title:         "How to Triage Your Inbox in 5 Minutes",
  titleHtml:     "How to Triage Your Inbox in <em>5 Minutes</em>",
  shortTitle:    "Triage Your Inbox in 5 Minutes",
  navTitle:      "How to triage your inbox in five minutes flat",

  description:   "Five minutes between meetings, forty-seven unread, and you want to peek without falling in. Here's the exact sequence — scan, sort, send the one-liners, close the tab.",
  deck:          "Five minutes between meetings, forty-seven unread, and you want to peek without falling in. Here's the exact sequence — scan, sort, send the one-liners, close the tab.",

  published:     '2026-04-28',
  modified:      '2026-04-28',

  ledes: [
    `You have five minutes between meetings. Forty-seven unread. You want to peek without falling in — but you know how this goes. You'll open the first one, half-write a reply, see another one underneath it, get pulled into a third, and look up to find your next meeting started six minutes ago. The five-minute check has a one hundred percent failure rate when you do it the way you currently do it.`,
    `It can be done. There's a sequence that actually fits in five minutes — but it's not a faster version of how you normally read email. It's a different shape of attention. Here's the shape.`,
  ],

  steps: [
    {
      name: "Don't open anything yet",
      body: "The instinct is to click the first one. Resist. The first thirty seconds are for scanning, not reading — names down the left, subjects across, no clicking. You're looking for the shape of the pile before you decide where to spend any attention. Open one email in the first thirty seconds and you've already lost.",
    },
    {
      name: "Tag the few that look real, leave the rest",
      body: "From the scan, flag two or three messages that look like they actually want something from you. Star them, mark them, drag them — whatever your client supports. Everything else is ignored for now. Don't read to confirm; the flag is a hypothesis, not a verdict. You'll be wrong on one of them, and that's fine.",
    },
    {
      name: "Reply to the one-liners immediately",
      body: "Some emails take a single sentence to handle: 'Got it.' 'Yes.' 'Friday works.' 'Thanks for sending.' Find the messages that close out in one line and close them out in one line. Don't expand. Don't add context. The whole point of the one-liner is that it ends the thread.",
    },
    {
      name: "Defer the substantive ones to a calendar block",
      body: "The flagged messages that need a real reply do not get a real reply right now. They get a fifteen-minute block on your calendar later today, or tomorrow morning, or whenever you have actual writing time. Drafting a substantive reply in the gap between meetings is how you write the email you regret. Defer the writing; do not defer the deciding.",
    },
    {
      name: "Close the tab when the timer ends",
      body: "Five minutes means five minutes. Set a timer if you have to. The point of this exercise is not to clear the inbox — the point is to know what's in it without being eaten by it. The discipline of closing the tab while messages are still unread is the entire trick. The inbox will still be there. So will you.",
    },
  ],

  callout: {
    afterStep: 3,
    scriptedLine: "Got it — I'll look at this on Friday and follow up if I have questions. No need to reply.",
    explanation: "This is the universal one-liner: it acknowledges the message, names a specific date, and signals that you don't need a reply unless something comes up. Most threads end here, which is exactly what you want.",
  },

  cta: {
    glyph:    '📬',
    headline: "Run the five-minute triage with a backstop",
    body:     "Paste your inbox, get instant per-email verdicts and ready-to-send reply templates for the urgent ones — so the five-minute check actually fits in five minutes.",
    features: [
      "Two-minute inbox scan",
      "Quick reply templates",
      "Three-tier prioritization",
      "Per-email reasoning",
      "Permission to ignore",
    ],
    toolId:   'EmailUrgencyTriager',
    toolName: 'Email Urgency Triager',
  },
};
