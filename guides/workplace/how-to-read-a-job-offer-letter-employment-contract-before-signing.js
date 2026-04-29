// ============================================================
// guides/workplace/how-to-read-a-job-offer-letter-employment-contract-before-signing.js
// ============================================================

module.exports = {
  slug:          'how-to-read-a-job-offer-letter-employment-contract-before-signing',
  category:      'workplace',
  categoryLabel: 'Workplace',

  title:         "How to Read a Job Offer Before You Sign (Without Missing the Traps)",
  titleHtml:     "How to Read a Job Offer Before You Sign <em>(Without Missing the Traps)</em>",
  shortTitle:    "How to Read a Job Offer",
  navTitle:      "How to read a job offer letter or employment contract before signing",

  description:   "The PDF arrived. You're excited and tired and tempted to just sign. Here's how to read an employment contract carefully — once, properly — without missing what matters.",
  deck:          "The PDF arrived. You're excited and tired and tempted to just sign. Here's how to read an employment contract carefully — once, properly — without missing what matters.",

  published:     '2026-04-28',
  modified:      '2026-04-28',

  ledes: [
    `The email arrived an hour ago. Subject line: 'Offer Letter — please review and sign by Friday.' You're already mentally telling your friends. The PDF is fourteen pages of dense formatting and you've skimmed page one — the salary number, which is good — and you're looking for the signature block. The deadline is in three days. The temptation to scroll to the bottom and click is enormous, and that is exactly when most people sign things they later wish they hadn't.`,
    `Reading an employment contract well is not about being a lawyer. It's about knowing the four or five places they hide the things you'd actually want to know. The people who push back successfully on offers aren't more confrontational than you — they just read the right pages. Here are the right pages.`,
  ],

  steps: [
    {
      name: "Read the comp section twice, slowly",
      body: "Base salary is the easy part. The math gets weird in everything else: bonus is 'target' (not guaranteed), equity has a vest schedule and usually a one-year cliff, sign-on bonus has a clawback if you leave early. Add up what you actually take home in year one if you do nothing extraordinary, then again if you leave at month eleven. Two different numbers. Both should be ones you'd accept.",
    },
    {
      name: "Find the clauses they want you to skim",
      body: "Non-compete, IP assignment, arbitration, confidentiality — these are the clauses written in the language that makes your eyes glaze, and that's not an accident. Read them slowly. Non-competes vary wildly by state and some are functionally unenforceable; IP assignment can quietly include 'anything you make on your own time'; arbitration trades your right to sue for a closed-door process you'd lose more often than not. Skim these and you've signed something different from what you read.",
    },
    {
      name: "Match the verbal offer to the written offer",
      body: "Whatever the recruiter said on the call — about the bonus structure, about remote flexibility, about the title, about the start date — none of it exists unless it's in the document. 'We always pay the bonus' is not the same as 'bonus is guaranteed.' If something matters and isn't written, ask for it written. The contract overrides every conversation that came before it; the conversation does not override the contract.",
    },
    {
      name: "Identify what happens automatically",
      body: "At-will employment, change-in-control provisions, severance triggers, stock acceleration on termination — these are the clauses that decide what happens to you when something happens to the company. They're often phrased in passive voice so they feel like background noise. They aren't. The terms that govern your worst-case scenario deserve the same attention as the ones governing your salary.",
    },
    {
      name: "Negotiate before signing, not after",
      body: "You have leverage at exactly one moment: between offer extended and offer accepted. Once you sign, your leverage drops to roughly zero. Ask for the changes you want now, in one consolidated email, not in dribs and drabs. Most companies expect some pushback and have already left themselves room. The people who don't ask don't get; the people who ask once, professionally, almost always get something.",
    },
  ],

  callout: {
    afterStep: 4,
    scriptedLine: "Thanks for sending this through — before signing, I'd like 20 minutes this week to walk through the comp structure and a couple of the clauses. Could we set something up?",
    explanation: "This works because it doesn't reject the offer, doesn't list demands in writing, and doesn't put your concerns in an email that gets forwarded internally. It moves the conversation to a call, which is where negotiation actually happens.",
  },

  cta: {
    glyph:    '🗡',
    headline: "Translate the contract before you sign it",
    body:     "Jargon Assassin reads your offer, flags every clause that matters, scores the document against typical employment contracts, and tells you exactly what to push back on with the language to use.",
    features: [
      "Plain-language translation",
      "Red-flag scoring",
      "Standard-vs-aggressive comparison",
      "Suggested redline edits",
      "Negotiation strategy",
    ],
    toolId:   'JargonAssassin',
    toolName: 'Jargon Assassin',
  },
};
