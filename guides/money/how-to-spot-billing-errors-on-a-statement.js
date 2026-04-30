module.exports = {
  slug:          'how-to-spot-billing-errors-on-a-statement',
  category:      'money',
  categoryLabel: 'Money',
  title:         "How to Spot Billing Errors on a Statement",
  titleHtml:     "How to Spot <em>Billing Errors on a Statement</em>",
  shortTitle:    "Spot Billing Errors",
  navTitle:      "spot billing errors on a statement",
  description:   "The five things to look for on any statement — medical, utility, credit card, subscription. Most errors are visible if you know where to look.",
  deck:          "The five things to look for on any statement — medical, utility, credit card, subscription. Most errors are visible if you know where to look.",
  ledes: [
    `Statements are designed to be skimmed and paid. They are formatted to look official and uncomplicated, with a total at the bottom and an autopay reminder at the side. Most people read the total, confirm it is roughly what they expected, and pay. The companies that send the statements know this.<br/><br/>If you slow down for two minutes per statement, you find errors. Not always — but often enough that the time pays for itself many times over. Here is what to look for, regardless of what kind of bill it is.`,
    `The five-point statement scan.`,
  ],
  steps: [
    { name: 'Compare this month total to last month total', body: 'If the bill is meaningfully higher than last month and you did not change anything (no extra usage, no new service, no late fees), that is the first flag. Open last month statement and put them side by side. The line that grew is the line to investigate. Sudden jumps are usually either rate increases (which you have a right to be told about) or errors.' },
    { name: 'Look for charges with no clear description', body: '"Service fee," "miscellaneous," "facility charge," "regulatory recovery" — vague labels are where companies hide things. Some are legitimate. Many are negotiable, optional, or simply made up. Call and ask: "What is this charge for, specifically, and is it required?" Often it gets removed when you ask, because there is no good answer.' },
    { name: 'Check for duplicate charges', body: 'Especially common on medical bills, hotel folios, and credit card statements. Look for two lines with the same amount on the same day, or two of the same item — same supply, same service, same date. Duplicates happen because billing systems repost charges that were already submitted. They come off as soon as you point at them, but only if you point at them.' },
    { name: 'Match every charge to something you actually used or bought', body: 'Read each line and ask \'do I remember this happening?\' If the answer is no — a service you did not receive, a date you were not there, a quantity that does not match — flag it. This is where ghost charges live: gym memberships you canceled, app subscriptions you forgot, services that auto-renewed at higher rates, hospital line items for things that never happened.' },
    { name: 'Look at the math', body: 'Add up the line items and compare to the total. Look at quantity times rate and see if the answer matches the line amount. Computer billing makes math errors more often than you would think — usually because of a price update that did not flow through, a rate that was applied to the wrong tier, or a discount that was supposed to be applied but was not. The math is the easiest place to win because it is objective.' }
  ],
  cta: {
    glyph:    '🧾',
    headline: "Photograph or paste any bill for an instant scan.",
    body:     "Bill Rescue's AI bill autopsy flags suspicious charges, missing discounts, and items worth questioning — plus generates the dispute letter or call script if you want to fight one.",
    features: [
      "AI bill autopsy",
      "Quick Check for any charge",
      "Generates dispute letters instantly",
      "Tracks every win with dollar totals"
    ],
    toolId:   'BillRescue',
    toolName: 'Bill Rescue',
  },
  published: '2026-04-29',
  modified:  '2026-04-29',
};
