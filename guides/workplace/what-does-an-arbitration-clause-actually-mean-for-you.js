// ============================================================
// guides/workplace/what-does-an-arbitration-clause-actually-mean-for-you.js
// ============================================================

module.exports = {
  slug:          'what-does-an-arbitration-clause-actually-mean-for-you',
  category:      'workplace',
  categoryLabel: 'Workplace',

  title:         "What Does an Arbitration Clause Actually Mean for You?",
  titleHtml:     "What Does an Arbitration Clause <em>Actually Mean for You?</em>",
  shortTitle:    "What an Arbitration Clause Means",
  navTitle:      "What does an arbitration clause actually mean for you",

  description:   "Almost every contract you sign contains one. Most people skim past it. Here's what an arbitration clause is, what it costs you, and the small window you usually have to opt out.",
  deck:          "Almost every contract you sign contains one. Most people skim past it. Here's what an arbitration clause is, what it costs you, and the small window you usually have to opt out.",

  published:     '2026-04-28',
  modified:      '2026-04-28',

  ledes: [
    `Somewhere in the last contract you signed, there was a paragraph titled 'Dispute Resolution' or 'Arbitration.' You skimmed it. It was three sentences long. You probably didn't notice that the three sentences quietly removed your right to take that company to court — for any dispute, on any grounds, for as long as the contract is in force. This happens in employment contracts, in software terms of service, in cell phone agreements, in gym memberships. Almost all of them. You've signed dozens.`,
    `An arbitration clause isn't necessarily a disaster — but it's never something you should agree to without knowing what it does. Here's what it is, who it favors, and the small window you usually have to push back.`,
  ],

  steps: [
    {
      name: "Understand what you're giving up",
      body: "An arbitration clause says: if we have a dispute, we won't resolve it in court — we'll resolve it through a private process called arbitration, in front of a paid arbitrator chosen under the rules in this contract. You're giving up a public courtroom, a jury, and the ability to appeal most decisions. The trade is supposed to be speed and lower cost. In practice, especially for individuals against companies, it's usually a worse outcome.",
    },
    {
      name: "Distinguish mandatory from voluntary",
      body: "Most modern arbitration clauses are mandatory — meaning if a dispute arises, you have no choice. Voluntary arbitration is a different animal: you can choose it after a dispute arises if you both want to. Read the language carefully. 'Any dispute shall be resolved by binding arbitration' is mandatory. 'The parties may elect arbitration' is voluntary. The first removes options; the second adds one.",
    },
    {
      name: "Look for the class-action waiver buried with it",
      body: "Arbitration clauses almost always come with a class-action waiver. Translation: not only can you not sue them in court, you can't join with other affected people to do it together. If a company quietly overcharges a million customers ten dollars each, the waiver makes it economically impossible for anyone to do anything about it. Each person would have to individually arbitrate, individually pay, individually win — which almost nobody does. The waiver is often the more consequential clause.",
    },
    {
      name: "Check who picks the arbitrator and where",
      body: "The arbitration provider, the location, and the rules are all specified in the clause. Some providers are reputable; some are functionally captured by repeat-customer companies that pay them millions a year. The location can be an out-of-state city you'd have to fly to. Read for the named provider — JAMS and AAA are the common ones — and for the location. If both heavily favor the company, the arbitration is theater before it begins.",
    },
    {
      name: "Know your one window to opt out",
      body: "Many arbitration clauses include a small carve-out: you can opt out by sending a written notice within 30 days of signing. The window is short, the procedure is specific, and the company doesn't advertise it. Look for the phrase 'opt out' or 'right to reject this arbitration provision.' If it's there, take it — send the certified letter, keep a copy, mark the calendar. Opting out costs you nothing and preserves your rights for the entire life of the contract.",
    },
  ],

  cta: {
    glyph:    '🗡',
    headline: "Find the arbitration clause and the opt-out",
    body:     "Paste any contract — employment, software, services — and Jargon Assassin locates the arbitration clause, translates exactly what it does, finds the class-action waiver, and tells you whether an opt-out exists and how to use it.",
    features: [
      "Clause-specific translation",
      "Opt-out detection",
      "Class-action waiver flagging",
      "Q&A on legal terms",
      "Letter generator",
    ],
    toolId:   'JargonAssassin',
    toolName: 'Jargon Assassin',
  },
};
