// ============================================================
// guides/workplace/what-to-actually-pay-attention-to-in-a-benefits-packet.js
// ============================================================

module.exports = {
  slug:          'what-to-actually-pay-attention-to-in-a-benefits-packet',
  category:      'workplace',
  categoryLabel: 'Workplace',

  title:         "What to Actually Pay Attention to in a Benefits Packet",
  titleHtml:     "What to Actually Pay Attention to <em>in a Benefits Packet</em>",
  shortTitle:    "What Matters in a Benefits Packet",
  navTitle:      "What to actually pay attention to in a benefits packet",

  description:   "The packet is 80 pages. You have a window. Here's the small list of things that matter — and the questions to answer about your situation before you click enroll.",
  deck:          "The packet is 80 pages. You have a window. Here's the small list of things that matter — and the questions to answer about your situation before you click enroll.",

  published:     '2026-04-28',
  modified:      '2026-04-28',

  ledes: [
    `Open enrollment is open and you have until Friday. The benefits packet has eighty pages, three insurance plan options, an HSA decision, dental, vision, life insurance, disability, a 401(k) section, an FSA section, and a paragraph at the bottom about pet insurance that almost made you laugh. You'll click through it, accept the same plan you had last year, and discover in March that you would have saved fifteen hundred dollars by picking a different option. This is the universal benefits-packet experience.`,
    `The packet is mostly noise. Six things actually matter, and they're the same six every year, regardless of company. Once you know what to look for, an eighty-page packet collapses into a one-hour decision. Here are the six.`,
  ],

  steps: [
    {
      name: "Compare the total annual cost, not the monthly premium",
      body: "Premium is what you see; total cost is what you pay. A plan with a low premium and a high deductible can cost more than a plan with a higher premium if you actually use healthcare. Add: monthly premium times twelve, plus deductible, plus expected out-of-pocket for the year. Do that math for each plan. The plan that wins on premium frequently doesn't win on total cost — and total cost is the only number that matters.",
    },
    {
      name: "Check whether your doctors and meds are covered",
      body: "A plan that doesn't cover your existing doctor or your existing prescription is a plan that's quietly going to cost you more — either in switching costs or in surprise out-of-network bills. Every plan has a provider directory and a formulary. Spend ten minutes searching both for your specific doctors and your specific medications. This single check is worth more than reading the entire summary.",
    },
    {
      name: "Decide HSA versus FSA versus neither",
      body: "If your plan is HSA-eligible and you can afford to fund the account, the HSA is almost always the right answer — the tax treatment beats every other vehicle. If you're not HSA-eligible, an FSA can still be useful but only if you'll actually spend the balance. The default is to skip both because they look complicated. The default is wrong; the math is straightforward, and these accounts are where the real benefits-packet money is.",
    },
    {
      name: "Find out the 401(k) match and vesting",
      body: "Two numbers: how much will the company contribute, and when does that contribution become yours. A 6% match with a four-year cliff vest is a different deal than a 4% match that vests immediately. The match is free money the moment it lands; vesting determines whether the money stays yours if you leave. Set your contribution to capture the full match — anything less is leaving compensation on the table.",
    },
    {
      name: "Look at disability and life insurance with fresh eyes",
      body: "These are the easiest sections to ignore and often the most consequential. Long-term disability replaces income if you're unable to work for an extended period; group life is cheap because it's underwritten in bulk. The default elections are usually the bare minimum. If you have dependents, run the numbers — supplemental coverage at group rates is usually a fraction of what equivalent individual policies would cost. Cheap insurance you might never use is sometimes still the best buy in the packet.",
    },
  ],

  cta: {
    glyph:    '🔇',
    headline: "Get the personalized read on your packet",
    body:     "Paste your benefits packet and your situation — family size, doctors, prescriptions, savings goals — and Noise Canceler extracts only the parts that affect you, with the math worked out across plans.",
    features: [
      "Plan-by-plan cost comparison",
      "Provider and formulary check",
      "HSA/FSA recommendations",
      "Match-and-vest extraction",
      "Personalized relevance filter",
    ],
    toolId:   'NoiseCanceler',
    toolName: 'Noise Canceler',
  },
};
