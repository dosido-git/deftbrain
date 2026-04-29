// ============================================================
// guides/workplace/how-to-identify-hidden-costs-in-a-service-agreement.js
// ============================================================

module.exports = {
  slug:          'how-to-identify-hidden-costs-in-a-service-agreement',
  category:      'workplace',
  categoryLabel: 'Workplace',

  title:         "How to Identify Hidden Costs in a Service Agreement",
  titleHtml:     "How to Identify Hidden Costs <em>in a Service Agreement</em>",
  shortTitle:    "Hidden Costs in a Service Agreement",
  navTitle:      "How to identify hidden costs in a service agreement before you sign",

  description:   "The headline price is what they want you to remember. The fine print is where the real cost lives. Here's how to find every fee, escalator, and 'as needed' charge.",
  deck:          "The headline price is what they want you to remember. The fine print is where the real cost lives. Here's how to find every fee, escalator, and 'as needed' charge.",

  published:     '2026-04-28',
  modified:      '2026-04-28',

  ledes: [
    `The proposal arrived. The price is on the first page, in bold, in a tasteful font. It's roughly what you expected. You start reading the rest of the document and immediately your eyes glaze, because it is six pages of definitions and you already saw the number. Three months later your first invoice is 22% higher than the proposal price, and you can't quite explain why. The answer was always in the document. You just stopped reading after the headline.`,
    `Hidden costs in service agreements aren't really hidden — they're just not on the page anyone reads. There are five places they live. Once you know where to look, the price you're actually agreeing to becomes legible. Here are the five places.`,
  ],

  steps: [
    {
      name: "Find every fee that isn't in the headline price",
      body: "Search the document for the word 'fee.' Setup fee, processing fee, onboarding fee, account maintenance fee, 'convenience' fee, transaction fee, statement fee, paper-statement fee. Most of these are quietly rolled into the first invoice and disappear into the background after that. Add them up. Then add them to the headline price. That's the actual year-one cost, and it's almost always larger than the number you remember.",
    },
    {
      name: "Look for the auto-escalation language",
      body: "'Pricing subject to annual adjustment.' 'Fees may increase by the lesser of CPI or 5% annually.' 'Rates renewable on each anniversary at our then-current pricing.' These clauses mean the price you signed for is the price for year one, and you've agreed to whatever they decide for years two and beyond. Read the cap, if there is one. If there isn't, you've signed a blank check on price, and you'll only find out the size of it when you get the renewal notice.",
    },
    {
      name: "Read the termination terms backwards",
      body: "Most people read the agreement front to back and never make it to the termination section. Read it first. How much notice do you have to give? Is there an early termination fee, and if so, how is it calculated? Is termination only allowed at certain windows? A service agreement that's cheap to enter and expensive to leave is a service agreement designed to keep you longer than you want to stay. Know the exit cost before you commit.",
    },
    {
      name: "Watch for 'as needed' and 'to be determined' pricing",
      body: "Anywhere the contract describes services priced at 'our then-current rates,' 'as needed,' 'on a time-and-materials basis,' or 'to be determined based on scope,' you're looking at unbounded cost. These phrases are appropriate for genuinely variable work. They're also where unscrupulous vendors live. Demand specifics: hourly rates, capped totals, written change orders before any out-of-scope work starts. Open-ended pricing without process is open-ended pricing in their favor.",
    },
    {
      name: "Check what's billed per-X",
      body: "Per-seat, per-user, per-call, per-transaction, per-API-call, per-day, per-incident. Any unit-based pricing scales with your use, which means the cost can grow without your renegotiating. Calculate what your bill looks like at 1.5x or 2x your current usage. If that number gives you a stomach drop, the contract has a hidden cost you haven't priced in yet — your own success. Negotiate volume discounts, caps, or fixed-fee tiers before you sign.",
    },
  ],

  callout: {
    afterStep: 4,
    scriptedLine: "Before we move to signature, can you send a worked example of a typical monthly invoice under this agreement — including all fees and the year-two escalation?",
    explanation: "This works because it forces the vendor to commit to numbers in writing, surfaces fees they may have hoped you wouldn't ask about, and gives you a baseline to dispute against if the first real invoice doesn't match. Most legitimate vendors will produce this without complaint; the ones who push back are telling you something useful.",
  },

  cta: {
    glyph:    '🗡',
    headline: "Find every hidden cost before signing",
    body:     "Paste any service agreement and Jargon Assassin extracts every fee, escalator, sublimit, and unit-based charge — translates each into plain language, totals the year-one cost, and flags the open-ended pricing terms.",
    features: [
      "Fee extraction",
      "Auto-escalation detection",
      "Termination cost analysis",
      "Year-one cost calculation",
      "Suggested redlines",
    ],
    toolId:   'JargonAssassin',
    toolName: 'Jargon Assassin',
  },
};
