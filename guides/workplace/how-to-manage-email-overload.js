// ============================================================
// guides/workplace/how-to-manage-email-overload.js
// ============================================================

module.exports = {
  slug:          'how-to-manage-email-overload',
  category:      'workplace',
  categoryLabel: 'Workplace',

  title:         "How to Manage Email Overload (Without Declaring Inbox Bankruptcy)",
  titleHtml:     "How to Manage Email Overload <em>(Without Declaring Inbox Bankruptcy)</em>",
  shortTitle:    "How to Manage Email Overload",
  navTitle:      "How to manage email overload without declaring inbox bankruptcy",

  description:   "Most email overload isn't a volume problem — it's a triage problem. Here's how to cut through the pile and know what to ignore, without losing the few things that matter.",
  deck:          "Most email overload isn't a volume problem — it's a triage problem. Here's how to cut through the pile and know what to ignore, without losing the few things that matter.",

  published:     '2026-04-28',
  modified:      '2026-04-28',

  ledes: [
    `It's 9:47 on a Tuesday morning. You opened your laptop intending to start the day. Forty minutes later you've read seventeen emails, replied to two, and somehow the unread count is higher than when you started. There's a real day ahead of you and you haven't begun it. The inbox isn't a tool anymore; it's a holding pen for everyone else's priorities.`,
    `Email overload isn't a volume problem. It's a triage problem. Most messages don't need a reply; many of them don't need to be read. The work is figuring out which is which fast enough that the inbox doesn't eat your day. Here's the sequence.`,
  ],

  steps: [
    {
      name: "Sort by sender, then scan, then read",
      body: "Reading top-to-bottom is the trap — you spend your attention in the order things arrived, which has nothing to do with what matters. Sort by sender, scan the names, and skip anything from a sender you don't recognize or owe. The list of names tells you more about your day than the list of subjects ever will.",
    },
    {
      name: "Use the three-bucket rule, not inbox zero",
      body: "Inbox zero is a perfectionist trap. The bucket system isn't: every email is Reply Now, Reply This Week, or Ignore. Reply Now is the small set with a real question, a real deadline, and someone actually waiting. Reply This Week is anything you'd be embarrassed not to answer eventually. Everything else is Ignore — and the world stays fine.",
    },
    {
      name: "Stop confusing urgency with importance",
      body: "An email can be loud without being urgent. ALL CAPS subjects, red exclamation flags, three follow-ups in two hours — these are signals about the sender, not the message. The actually-urgent emails almost never look urgent; they're calm, specific, and have a real deadline attached. Train yourself to ignore the volume and read for the substance.",
    },
    {
      name: "Set a budget, not a goal",
      body: "'Inbox zero by end of day' is a goal you'll fail every day. 'Twenty minutes in the morning, twenty in the afternoon' is a budget you can keep. The budget protects the rest of your time. The goal punishes you for having a job that produces email faster than you can answer it. Stop trying to win against the inbox; start refusing to let it win against you.",
    },
    {
      name: "Cut the noise at the source",
      body: "Every recurring newsletter you didn't sign up for, every CC chain you don't need to be on, every notification from a tool you stopped using — unsubscribe, mute, or filter, in the moment you notice. Five seconds of friction once saves you the same email costing you attention every week for a year. The inbox doesn't shrink unless you shrink it.",
    },
  ],

  cta: {
    glyph:    '📬',
    headline: "Cut through the pile in two minutes",
    body:     "Email Urgency Triager reads your inbox, sorts every message into Reply Now / Reply This Week / Ignore, and tells you exactly what each one actually wants — so you can stop reading and start deciding.",
    features: [
      "Three-tier prioritization",
      "Per-email reasoning",
      "Permission to ignore",
      "Quick reply templates",
      "Role-aware analysis",
    ],
    toolId:   'EmailUrgencyTriager',
    toolName: 'Email Urgency Triager',
  },
};
