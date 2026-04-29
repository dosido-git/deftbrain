// ============================================================
// guides/workplace/what-to-do-when-you-have-1000-unread-emails.js
// ============================================================

module.exports = {
  slug:          'what-to-do-when-you-have-1000-unread-emails',
  category:      'workplace',
  categoryLabel: 'Workplace',

  title:         "What to Do When You Have 1,000+ Unread Emails",
  titleHtml:     "What to Do When You Have <em>1,000+ Unread Emails</em>",
  shortTitle:    "1,000+ Unread Emails",
  navTitle:      "What to do when you have 1,000+ unread emails",

  description:   "The number stares back. You've been pretending it isn't a problem; now it is. Here's how to clear a four-figure inbox without reading all of it — you won't, and you don't have to.",
  deck:          "The number stares back. You've been pretending it isn't a problem; now it is. Here's how to clear a four-figure inbox without reading all of it — you won't, and you don't have to.",

  published:     '2026-04-28',
  modified:      '2026-04-28',

  ledes: [
    `The number is 1,247. Or 2,300. Or 4,800. You stopped looking at the count six weeks ago because it was making you feel something you didn't want to feel. Now you're looking again, and it's larger than it was, and somewhere in there is probably a real email from a real person who needed something. You don't know which one. You also don't have a week to find out.`,
    `Here's the truth: you are not going to read those emails. Anyone who tells you to start at the top and work down is selling you a fantasy. The only way out of a four-figure inbox is to stop treating each email as a thing that needs reading and start treating the pile as a problem with a procedure. Here's the procedure.`,
  ],

  steps: [
    {
      name: "Accept that you won't read them",
      body: "This is the hardest step and it's the first one. Reading 1,247 emails would take a full work week and you don't have a full work week. The premise of triaging this pile is that 95% of it doesn't matter — and that's the same percentage as a normal inbox; it just looks worse at scale. You're not abandoning the messages. You're being honest about what you were going to do with them anyway.",
    },
    {
      name: "Sort by sender, not date",
      body: "Date-sorted, the inbox is chaos. Sender-sorted, patterns appear: 312 are from one newsletter, 78 are from your calendar app, 41 are from a tool you stopped using two months ago. These are the bulk-archive piles. Sort by sender and the noise sorts itself; suddenly the message from a real human in week three jumps out instead of hiding in line behind 200 others.",
    },
    {
      name: "Bulk-archive the obvious noise first",
      body: "Calendar invites, automated notifications, newsletters, alerts, Slack digests, system emails — gone. Multi-select, archive, don't think. You can always recover from archive if it turns out you needed something; you can't recover the hour you spent debating whether to archive each one individually. The bulk-archive pass should remove half the pile in under five minutes.",
    },
    {
      name: "Search by name for the senders you actually owe",
      body: "Now think of the four or five people whose emails you'd be embarrassed to ignore. A boss, a client, a collaborator on a project you're behind on. Search by name. Read those threads, and only those threads. Everyone else either followed up — in which case you'll find them naturally — or didn't, in which case it wasn't urgent.",
    },
    {
      name: "Send a short 'I missed this' to the few",
      body: "For the messages that needed a reply weeks ago, the apology is short and the explanation is shorter. 'Just seeing this — sorry for the delay. Still relevant?' Two sentences. No paragraph of excuses. The senders you owe a real reply to either say 'yes, still relevant' and you handle it, or 'no, sorted itself out' and you didn't owe anything anyway. Most of them are the second.",
    },
  ],

  callout: {
    afterStep: 4,
    scriptedLine: "Just seeing this now — sorry for the delay. Is this still live, or has it sorted itself out? Happy to help if you still need me.",
    explanation: "This is the universal late-reply opener: short apology, an out for the sender, and a clear offer. Most replies come back as 'all sorted, no worries' — which is exactly what you want.",
  },

  cta: {
    glyph:    '📬',
    headline: "Triage a four-figure inbox without reading it",
    body:     "Email Urgency Triager handles batch analysis: paste the senders and subjects from your unread pile and get back which ones actually need attention — fast, with reasoning, and with reply templates for the small set that does.",
    features: [
      "Batch inbox analysis",
      "Three-tier prioritization",
      "Per-email reasoning",
      "Late-reply templates",
      "Permission to archive",
    ],
    toolId:   'EmailUrgencyTriager',
    toolName: 'Email Urgency Triager',
  },
};
