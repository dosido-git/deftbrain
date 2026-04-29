// ============================================================
// guides/workplace/how-to-skim-a-long-email-and-not-miss-anything-important.js
// ============================================================

module.exports = {
  slug:          'how-to-skim-a-long-email-and-not-miss-anything-important',
  category:      'workplace',
  categoryLabel: 'Workplace',

  title:         "How to Skim a Long Email and Not Miss Anything Important",
  titleHtml:     "How to Skim a Long Email and <em>Not Miss Anything Important</em>",
  shortTitle:    "Skim a Long Email",
  navTitle:      "How to skim a long email and not miss anything important",

  description:   "Some emails are five paragraphs of context plus one sentence that needs your reply. Here's how to find that sentence in 30 seconds — and how to know whether the rest is worth reading.",
  deck:          "Some emails are five paragraphs of context plus one sentence that needs your reply. Here's how to find that sentence in 30 seconds — and how to know whether the rest is worth reading.",

  published:     '2026-04-28',
  modified:      '2026-04-28',

  ledes: [
    `The email is eleven paragraphs long. The sender wanted to be thorough; what they were actually being was generous with your time, on the assumption you'd read every paragraph. You won't. You shouldn't. Inside this eleven-paragraph email there is — almost always — one specific request, one decision being asked of you, or one piece of information you genuinely need. The rest is context, history, framing, hedging, and the writer thinking through their own position out loud.`,
    `Skimming a long email well is a real skill — different from speed-reading and different from ignoring it. The goal is to find the actionable core in roughly 30 seconds and decide, in another 30, whether the surrounding material is worth reading. Five moves.`,
  ],

  steps: [
    {
      name: "Read the last paragraph first",
      body: "In long emails, the actual ask usually lives at the bottom — the writer has built up to it through context and arrives at the request in the closing paragraphs. Reading the last paragraph first tells you what the email wants. Once you know the ask, the rest of the email becomes navigable: you can decide which earlier paragraphs you actually need to read in order to respond.",
    },
    {
      name: "Search for question marks and dates",
      body: "Questions and dates are the two structural elements of a request. Ctrl-F a question mark, then a date format. Each hit is a candidate for the actionable content. A long email frequently has only one or two real questions buried inside three pages of explanation; finding the question marks reduces the hunt from minutes to seconds.",
    },
    {
      name: "Find your name and read backwards from there",
      body: "If your name appears anywhere in the body, that's almost always near the actionable part — 'and so [your name], could you...' or 'will need [your name] to confirm.' Search for your first name and read the surrounding paragraph. The rest of the email may be context for other recipients; the part directly addressed to you is the part you owe a response to.",
    },
    {
      name: "Skip the historical recap",
      body: "Long emails frequently begin with a recap of how we got here — what was discussed last week, what was agreed, what's been blocked. If you were part of those conversations, the recap is content you already have. Skip it. The email is communicating with multiple readers at different levels of context; you don't need the version that's pitched at the least-informed person on the thread.",
    },
    {
      name: "Reply only to the actionable part",
      body: "Long emails seem to demand long replies. They don't. Reply directly to the question, the request, or the decision — not to the entire email. A short, focused reply tells the sender you read what mattered without performing a full read of every paragraph. Most senders prefer this; they wrote at length because they had time to, not because they expected the same in return.",
    },
  ],

  cta: {
    glyph:    '🔇',
    headline: "Get the actionable core of any email instantly",
    body:     "Paste a long email and Noise Canceler extracts the actual ask, surfaces the questions and dates, and produces a tight summary of the parts that affect you — so you reply to substance, not throat-clearing.",
    features: [
      "Actionable-content extraction",
      "Question and date detection",
      "Name-targeted highlighting",
      "Recap-and-context filtering",
      "Plain-language summaries",
    ],
    toolId:   'NoiseCanceler',
    toolName: 'Noise Canceler',
  },
};
