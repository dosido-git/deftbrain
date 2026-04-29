// ============================================================
// guides/workplace/how-to-know-if-an-email-is-actually-urgent.js
// ============================================================

module.exports = {
  slug:          'how-to-know-if-an-email-is-actually-urgent',
  category:      'workplace',
  categoryLabel: 'Workplace',

  title:         "How to Know If an Email Is Actually Urgent",
  titleHtml:     "How to Know If an Email Is <em>Actually Urgent</em>",
  shortTitle:    "Is This Email Actually Urgent?",
  navTitle:      "How to tell if an email is actually urgent or just loud",

  description:   "The subject line says URGENT. The body has three exclamation points. Your stomach flips. Here's how to read past the volume and tell whether anything actually has to happen today.",
  deck:          "The subject line says URGENT. The body has three exclamation points. Your stomach flips. Here's how to read past the volume and tell whether anything actually has to happen today.",

  published:     '2026-04-28',
  modified:      '2026-04-28',

  ledes: [
    `The email arrives. Subject line: URGENT — please read. Body: three short paragraphs, two exclamation points, the word 'critical' twice. Your shoulders go up. Your other tabs lose your attention. Whatever you were doing, you're not doing anymore — you're reading this email, because the email told you to, in a tone of voice you can't easily ignore.`,
    `The problem with most 'urgent' emails is that they're not. They've been written by someone whose own week is on fire, or someone who routes everything through capital letters, or someone who's confused 'I need this' with 'this is a deadline.' Real urgency has a different signature than performed urgency. Here's how to tell them apart.`,
  ],

  steps: [
    {
      name: "Strip the punctuation, then read the request",
      body: "Mentally remove the all-caps subject, the bolded text, the exclamation points, the 'urgent' tag, the 'please read ASAP.' Read what's left. Nine times out of ten, what's left is a request that would have looked completely routine in plain text. The formatting was telling you about the sender's mood, not the message's importance.",
    },
    {
      name: "Look for a real deadline, not a manufactured one",
      body: "'By EOD' is a deadline if there's a meeting at 6pm where this matters. Without a downstream consequence, 'by EOD' is a vibe — the sender wants it today because they want it today. Ask yourself what concretely happens if you reply tomorrow morning instead. If the honest answer is 'nothing,' the deadline isn't real, no matter what the email says.",
    },
    {
      name: "Check whether the sender controls the urgency",
      body: "Many 'urgent' forwards are passing along someone else's panic. The CEO mentioned it on a call, your manager flagged it in passing, a client asked for an update — and now it's an URGENT email in your inbox. The energy is borrowed; the actual ask underneath is often modest. Find out who originally cared and how much they actually cared. The forwarded version is usually amplified.",
    },
    {
      name: "Apply the 24-hour test",
      body: "For any email claiming urgency, ask: what changes if I reply in 24 hours instead of 24 minutes? If the meeting still happens, the project still moves, the deal still closes — it isn't urgent. Most things pass this test embarrassingly easily. The few that don't, you'll know immediately, and they almost never come dressed up in exclamation points.",
    },
    {
      name: "Trust the calmness signal",
      body: "Genuinely urgent emails tend to be eerily calm. A single short paragraph, a specific deadline tied to a specific event, a clear ask, no decoration. The sender knows they need something time-sensitive and writes accordingly. Loud urgency is a tell that someone is frustrated. Quiet urgency is a tell that someone is in trouble. Read for quiet first.",
    },
  ],

  cta: {
    glyph:    '📬',
    headline: "Get a real urgency rating for any email",
    body:     "Email Urgency Triager reads past the all-caps subject lines and exclamation points to tell you whether a message is actually time-sensitive — and gives you the reasoning, so you can trust the call.",
    features: [
      "Real-urgency analysis",
      "Per-email reasoning",
      "Three-tier prioritization",
      "Suggested response time",
      "Anxiety-relief read-out",
    ],
    toolId:   'EmailUrgencyTriager',
    toolName: 'Email Urgency Triager',
  },
};
