module.exports = {
  slug:          'how-to-spot-billing-errors-on-a-statement',
  category:      'money',
  categoryLabel: 'Money',

  title:         "How to Spot Billing Errors on a Statement (The Specific Things to Look For)",
  titleHtml:     "How to Spot Billing Errors on a Statement <em>(The Specific Things to Look For)</em>",
  shortTitle:    "How to Spot Billing Errors on a Statement",
  navTitle:      "How to spot billing errors on a statement and the specific things to look for",

  description:   "Most billing errors fall into about eight categories, and most are visible on a careful read. The trick isn't being a forensic accountant — it's knowing which patterns suggest something's wrong.",
  deck:          "Most billing errors fall into about eight categories, and most are visible on a careful read. The trick isn't being a forensic accountant — it's knowing which patterns suggest something's wrong.",

  ledes: [
    `Studies of medical billing routinely find error rates of 30-80%. Telecom bills, utilities, credit cards, and subscription services have lower but still meaningful rates of mistakes. Most errors aren't catastrophic — small wrong charges, duplicate items, services billed at wrong rates — but they add up, and the people who catch them save real money over time. The catch: most billing errors are visible to anyone willing to look, but most people aren't, because bills are designed to discourage close reading.`,
    `Spotting billing errors is a teachable skill that takes about ten minutes per bill once you know what to look for. There are roughly eight common error categories, and they show up in predictable places on most statements. You don't need to be a forensic accountant. You just need to know which line items reward attention and which patterns suggest something is off.`,
  ],

  steps: [
    {
      name: "Look for duplicate charges first — they're the most common error",
      body: "Duplicate charges are the single most frequent billing error across every category. Same service billed twice on the same date. Same product appearing as two separate line items at slightly different prices. Same fee charged in the current month and also still appearing from last month. Scan the bill for any charge that appears more than once — even if the descriptions are slightly different. Duplicates often have one entry that looks normal and a second entry with a slightly altered code or fee structure that makes it look like a separate charge. Most duplicate billing is caught by people who specifically look for it; nobody else notices.",
    },
    {
      name: "Compare against your records of what you actually used",
      body: "Pull up your records — receipts, calendar entries, prior statements, your own notes — and check whether the bill matches what you actually used or received. For utility bills, does the usage match the season and your normal patterns? For medical bills, were you actually present for those services on those dates? For subscriptions, are you on the plan you signed up for, at the rate you agreed to? Charges that don't match your records are the second most common error category. Hospitals routinely bill for items used during your visit but not actually used by you. Telecom companies routinely bill for services you canceled. Subscription services routinely fail to apply discounts you should have. Your records are the only check on this.",
    },
    {
      name: "Watch for unfamiliar fees, especially new ones",
      body: "Fees with vague names — 'administrative fee,' 'service charge,' 'regulatory recovery,' 'compliance fee' — are worth scrutinizing. Some are legitimate; some are revenue masquerading as overhead. Compare to last month's bill: any new fee that wasn't there before deserves a question. Even legitimate fees often increase quietly without notification. If a 'maintenance fee' was $4.99 last month and is $7.99 this month, that's worth asking about. Companies are required to notify customers of significant pricing changes, and many do so via fine-print mailings that are easily missed. The fee on the bill is the actual change; the notification was the formality.",
    },
    {
      name: "Check the math — totals don't always add up",
      body: "Line items added up wrong is a surprisingly common error, especially on bills that have been adjusted, prorated, or split across periods. Pull out a calculator and verify that the line items actually sum to the total. Verify that the prior balance plus new charges minus payments equals the current balance. Verify that any percentage discounts were applied correctly. This step takes about five minutes and catches errors that don't show up any other way. The companies that produce bills don't always have humans checking the math; they have software that sometimes breaks.",
    },
    {
      name: "When the error pattern is the actual story",
      body: "Sometimes a single billing error isn't the issue — it's the pattern across multiple months that matters. Recurring small errors that always favor the company. Charges that appear, get disputed, then reappear under different names. Fees that were waived once and then reinstated quietly. If you're catching errors month after month from the same company, the issue isn't bad billing software — it's a billing department that's not motivated to fix recurring errors because the errors are profitable. At that point, the right move isn't another individual dispute; it's escalating to a regulator or filing a formal complaint about the pattern. State attorneys general and federal regulators (CFPB for financial services, FCC for telecom, state insurance departments for insurance) take patterns more seriously than individual errors. The companies that systematically err in their own favor stop doing it when the cost of being caught exceeds the revenue from the errors. That cost is sometimes you, deciding to make the report.",
    },
  ],

  cta: {
    glyph:    '🧾',
    headline: "Run the bill through an error scan in two minutes",
    body:     "Bill Rescue scans any bill — paste or photograph it — for the eight common error categories, flags duplicates and unfamiliar fees, verifies the math, and generates the dispute letter for anything that doesn't add up.",
    features: [
      "Eight-category error scan",
      "Duplicate-charge detection",
      "Math verification",
      "Pattern detection across months",
      "Dispute letter generation",
    ],
    toolId:   'BillRescue',
    toolName: 'Bill Rescue',
  },

  published: '2026-04-27',
  modified:  '2026-04-27',
};
