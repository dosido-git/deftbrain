// ============================================================
// guides/workplace/how-to-read-a-financial-report-like-an-expert.js
// ============================================================

module.exports = {
  slug:          'how-to-read-a-financial-report-like-an-expert',
  category:      'workplace',
  categoryLabel: 'Workplace',

  title:         "How to Read a Financial Report Like an Expert",
  titleHtml:     "How to Read a Financial Report <em>Like an Expert</em>",
  shortTitle:    "Read a Financial Report",
  navTitle:      "How to read a financial report like someone who knows what they're looking at",

  description:   "A 10-K is intimidating once. Then it's a pattern. Here's the order experts read in — and the four numbers that tell you most of what the report is actually saying.",
  deck:          "A 10-K is intimidating once. Then it's a pattern. Here's the order experts read in — and the four numbers that tell you most of what the report is actually saying.",

  published:     '2026-04-28',
  modified:      '2026-04-28',

  ledes: [
    `You've opened the annual report. It's 180 pages. You skimmed the first six and you've already met the words 'transformational,' 'positioned,' and 'fiscal headwinds.' Somewhere in the back are the actual numbers, but the numbers are in a format that assumes you already know how to read them. The whole document is built on the assumption that you'll either be a finance professional who breezes through it or a retail investor who reads the press release and stops there. You're neither.`,
    `Reading a financial report is a learnable skill, and the pros don't read it front to back — they have a sequence. Four sections, in this order, and most of what matters is visible in under thirty minutes. Here's the sequence.`,
  ],

  steps: [
    {
      name: "Skip to the cash flow statement first",
      body: "Income statements can be massaged. Balance sheets can be timed. Cash flow is harder to fake — it's literally the money that moved in and out. Look at cash from operations: is the company generating cash from the actual business, or only from financing and asset sales? A company with rising profits and falling operating cash flow is telling you something important, and it's almost always the cash flow that's telling the truth.",
    },
    {
      name: "Read the auditor's letter",
      body: "Two pages, near the front, written by the outside accounting firm. Most of the time it's boilerplate and you can move on. But when it isn't boilerplate — when it includes language about 'going concern,' 'material weaknesses,' or 'critical audit matters' — that's the auditor flagging something the rest of the report won't say plainly. The pros read this letter every time, in case it's the one time it isn't routine.",
    },
    {
      name: "Find the four numbers that summarize the business",
      body: "Revenue growth, operating margin, free cash flow, and debt-to-equity. These four numbers, year-over-year, tell you whether the business is healthy, getting better, or quietly deteriorating. Everything else is texture. The reports are written to make you read the texture first; the experts go to the four numbers, then read the rest only as needed to understand what the numbers are saying.",
    },
    {
      name: "Read the risk factors backwards",
      body: "The risk factors section is long, generic, and ten pages of standard disclosure copy-pasted from every other public filing. But the new risks — the ones added this year that weren't there last year — are the ones the company's lawyers thought were specific enough to disclose. Pull last year's report and diff the risk sections. The new entries are usually where the real news is buried, in the only place that requires them to be honest about it.",
    },
    {
      name: "Read management's commentary last, not first",
      body: "Management Discussion & Analysis sounds like it'd be the place to start — actual humans explaining the numbers — but it's actually where the spin lives. Read it after you already know what the numbers say. That way you can tell whether management is explaining the business or selling you a narrative about it. Reading MD&A first is how you absorb the framing before you've assessed the facts. Reverse the order.",
    },
  ],

  cta: {
    glyph:    '🔍',
    headline: "Get the structural read in two minutes",
    body:     "PlainTalk parses a financial report — 10-K, 10-Q, annual report — and surfaces the cash flow trends, auditor flags, year-over-year risk-factor changes, and the four numbers that summarize the business.",
    features: [
      "Document structure map",
      "Cash flow analysis",
      "Year-over-year diff",
      "Auditor-letter highlighting",
      "MD&A spin detection",
    ],
    toolId:   'PlainTalk',
    toolName: 'PlainTalk',
  },
};
