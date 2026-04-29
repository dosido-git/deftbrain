// ============================================================
// guides/workplace/how-to-know-what-emails-actually-need-a-response.js
// ============================================================

module.exports = {
  slug:          'how-to-know-what-emails-actually-need-a-response',
  category:      'workplace',
  categoryLabel: 'Workplace',

  title:         "How to Know Which Emails Actually Need a Response",
  titleHtml:     "How to Know <em>Which Emails Actually Need a Response</em>",
  shortTitle:    "Which Emails Need a Response",
  navTitle:      "How to know which emails actually need a response",

  description:   "Most emails don't need a reply, but the inbox makes you feel like they all do. Here's how to tell the difference fast — without guilt, and without missing the ones that matter.",
  deck:          "Most emails don't need a reply, but the inbox makes you feel like they all do. Here's how to tell the difference fast — without guilt, and without missing the ones that matter.",

  published:     '2026-04-28',
  modified:      '2026-04-28',

  ledes: [
    `An email lands. You read it. You sit with it for a minute. Does this one actually need a reply, or is it one of those messages that exists in your inbox and nothing more? If you're honest, you spend a lot of the day half-drafting answers to things nobody asked you for. The cost isn't sending the reply; the cost is the ten minutes you spent deciding whether to.`,
    `Most emails don't need a response. Many don't need to be read. The trick is being able to tell, in about three seconds, which category any given message falls into. Here's how to read for that signal.`,
  ],

  steps: [
    {
      name: "Look for the question, not the words",
      body: "Most emails don't actually contain a question. They contain a status update, a CYA forward, a 'just letting you know,' or a slow-motion announcement. If you read the message and can't point to a specific thing the sender wants from you, there's nothing to reply to — there's only an impulse to acknowledge, which is different. Acknowledgment is optional; an answer is owed only when there's a question.",
    },
    {
      name: "Check who's actually being asked",
      body: "If you're on the To line, you're being asked. If you're CC'd, you're being informed. If you're BCC'd, you're being archived. People conflate these constantly — they treat a CC like a To and feel guilty for not replying to a thread they were never expected to answer. Reply to the To line. Read the CC. Ignore the BCC.",
    },
    {
      name: "Notice when the sender already has their answer",
      body: "A surprising number of emails are someone thinking out loud. They're asking a question they could answer themselves; they're flagging an issue that resolved itself by the time you read it; they're proposing a thing and three other people have already replied to greenlight it. Scroll the thread. If consensus has formed without you, you're not the bottleneck — and chiming in adds noise, not value.",
    },
    {
      name: "Calculate the cost of saying nothing",
      body: "For any email you're tempted to reply to, ask: what concretely happens if I don't? Most of the time, the honest answer is 'nothing' — the project moves on, the meeting still happens, the sender follows up if they actually need you. The emails that cost you something to ignore are the small minority, and they're usually obvious when you stop and check.",
    },
    {
      name: "Default to no reply, not yes reply",
      body: "If you can't articulate why an email needs a response, the default is silence. Inbox culture has trained you to feel guilty about silence — but most senders don't expect a reply to most messages, and the ones who do will follow up. Letting an email die is not rude; it's how email is supposed to work. The guilt is a trained response, not a real obligation.",
    },
  ],

  cta: {
    glyph:    '📬',
    headline: "Get a reply-or-ignore verdict for every email",
    body:     "Email Urgency Triager analyzes your inbox one message at a time and tells you exactly which ones need a response, which ones can wait, and which ones you can let die — with the reasoning behind each call.",
    features: [
      "Reply-or-ignore decisions",
      "Per-email reasoning",
      "Three-tier prioritization",
      "Permission to ignore",
      "Suggested response time",
    ],
    toolId:   'EmailUrgencyTriager',
    toolName: 'Email Urgency Triager',
  },
};
