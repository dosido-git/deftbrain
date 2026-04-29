// ============================================================
// guides/workplace/how-to-read-a-software-license-agreement-before-clicking-accept.js
// ============================================================

module.exports = {
  slug:          'how-to-read-a-software-license-agreement-before-clicking-accept',
  category:      'workplace',
  categoryLabel: 'Workplace',

  title:         "How to Read a Software License Agreement (Without Reading 47 Pages)",
  titleHtml:     "How to Read a Software License Agreement <em>(Without Reading 47 Pages)</em>",
  shortTitle:    "How to Read a Software License",
  navTitle:      "How to read a software license agreement before clicking accept",

  description:   "Nobody reads them. You're not going to either. Here's the four-section scan that catches what actually matters — data, money, rights, and termination.",
  deck:          "Nobody reads them. You're not going to either. Here's the four-section scan that catches what actually matters — data, money, rights, and termination.",

  published:     '2026-04-28',
  modified:      '2026-04-28',

  ledes: [
    `The install dialog wants you to click 'I agree.' Above the button is a scroll box containing forty-seven pages of legalese that you have, in your entire life, never once read. You scroll once for form's sake — maybe you make it three sentences in — and you click. Everyone clicks. The companies know everyone clicks. The whole document is designed around the assumption that you won't read it, and most of the time, you really shouldn't.`,
    `But every now and then it's a tool you're going to use seriously, with your data, on your work, for years — and at that point a five-minute scan is worth doing. Not the whole agreement. Four sections. Here are the four.`,
  ],

  steps: [
    {
      name: "Skip to the data section first",
      body: "Search the document for 'data,' 'personal information,' or 'usage information.' What they collect, what they share, who they sell it to, and how long they keep it — those four answers are the entire privacy story. Bonus points if the document references a separate privacy policy by URL; that means the data terms can change without your knowing, and 'we may update this policy at any time' is doing a lot of work in that sentence.",
    },
    {
      name: "Find the auto-renewal and payment clauses",
      body: "The free trial that becomes a charge. The monthly subscription that auto-renews annually at a higher rate. The cancellation that has to happen 30 days before the next billing cycle. These are written into the agreement, not the marketing page, and they are how 'free' tools generate revenue from people who forgot. Look for 'auto-renew,' 'recurring,' 'evergreen,' and 'unless cancelled.' If the cancellation procedure is more complicated than the signup, that's the design.",
    },
    {
      name: "Read the arbitration and class-action waivers",
      body: "Almost every modern license includes mandatory arbitration and a class-action waiver. Translation: if the company harms you, you can't sue them in court and you can't join with other affected users to do it together. You'd individually arbitrate, in their chosen venue, under their chosen rules. Sometimes there's a 30-day window after signup where you can opt out by email. Almost nobody does, because almost nobody reads.",
    },
    {
      name: "Check what happens to your data on termination",
      body: "Termination clauses are short and brutal. They can suspend or close your account 'at any time, for any reason or no reason' — and many agreements give you a fixed window, often 30 days, to export your data before it's deleted. If your work lives in the tool, this is the section that decides whether a future dispute costs you a weekend of export work or your entire archive. Treat it accordingly.",
    },
    {
      name: "Word-search for the heavy modifiers",
      body: "You don't have to read the whole document — you have to find the load-bearing words. Ctrl-F these: 'perpetual,' 'irrevocable,' 'worldwide,' 'royalty-free,' 'sublicensable.' These are the words companies use when they're claiming broad rights to something — usually content you upload. If they appear next to 'license you grant us,' read that sentence three times. That's the sentence where you sign over more than you think.",
    },
  ],

  cta: {
    glyph:    '🗡',
    headline: "Get the four-section translation in two minutes",
    body:     "Paste any software license or terms of service, and Jargon Assassin extracts the data, billing, rights, and termination clauses — flagged, ranked, and translated into plain language — so you can decide before you click accept.",
    features: [
      "Plain-language translation",
      "Data and rights flagging",
      "Auto-renewal detection",
      "Termination clause analysis",
      "Q&A on specific clauses",
    ],
    toolId:   'JargonAssassin',
    toolName: 'Jargon Assassin',
  },
};
