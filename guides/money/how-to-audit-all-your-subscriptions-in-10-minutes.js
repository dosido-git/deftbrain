module.exports = {
  slug:          'how-to-audit-all-your-subscriptions-in-10-minutes',
  category:      'money',
  categoryLabel: 'Money',
  title:         "How to Audit All Your Subscriptions in 10 Minutes",
  titleHtml:     "How to Audit All Your Subscriptions <em>in 10 Minutes</em>",
  shortTitle:    "Audit Your Subscriptions",
  navTitle:      "audit subscriptions in ten minutes",
  description:   "You are paying for more recurring services than you can name. Here is the fastest way to find every one of them — including the ones hidden on partner accounts and forgotten free trials.",
  deck:          "You are paying for more recurring services than you can name. Here is the fastest way to find every one of them — including the ones hidden on partner accounts and forgotten free trials.",
  ledes: [
    `You know you have too many subscriptions. You can name maybe six off the top of your head. Your actual count is probably twelve to twenty, and the difference is mostly things you signed up for once and forgot — a free trial that converted, a year-long thing you meant to cancel, a service buried on a credit card you do not use anymore.\n\nThe audit feels like it should take an afternoon. It actually takes ten minutes if you do it the right way. The mistake most people make is trying to think of every service they have ever signed up for. The right move is searching the bank statement, which already has the list — you just have to extract it.`,
    `Here is the ten-minute version — and how SubSweep does most of it for you.`,
  ],
  steps: [
    { name: 'Pull your last 90 days of statements, all accounts', body: 'Subscriptions can be on any payment method — your main credit card, a backup card, a debit card, PayPal, Apple Pay, Google Pay. Pull statements from all of them for the last 90 days. Most things bill monthly, so 90 days catches everything monthly plus most quarterly. Annual subscriptions need 12 months — set that aside as a separate sweep. Statements are downloadable from every bank in two minutes; this is the slow step.' },
    { name: 'Search for "recurring," "monthly," "subscription," or just any merchant name twice', body: 'Open each statement and search for the word "recurring" or "subscription." Many statements label them. Then sort transactions by merchant name and look for any merchant that appears more than once at a roughly equal interval. That is a subscription, even if not labeled. The repeat-charge pattern catches everything the labels miss — gym memberships, app store charges, software-as-a-service, news sites, donation-pledges-that-feel-like-services.' },
    { name: 'List them with the charge amount and the date', body: 'For each subscription, write down the merchant name, monthly amount, and date charged. The date matters — billing day controls when you can cancel without paying for another month. The list at this stage is just inventory. Do not try to evaluate which to cancel yet; resist the temptation to make it complicated. Inventory first, decisions second.' },
    { name: 'Calculate the annual total for each, in two columns', body: 'Multiply each monthly charge by 12 to get the annual cost. Two columns: monthly, annual. The annual column is the one that produces the gut reaction. A $14.99 monthly service is one number; $179.88 a year for it is a different number. Most people make subscription decisions on the monthly framing and would make different decisions on the annual framing. Force yourself to look at the annual.' },
    { name: 'Use SubSweep to do the search automatically', body: 'Drop your statement into SubSweep and it identifies every recurring charge, calculates the annual cost for each, and groups them by category. It catches charges with non-obvious merchant names ("DRI*" prefixes, billing aliases, generic "monthly service" descriptions) that a manual sweep misses. Five seconds of upload replaces ten minutes of squinting at PDFs. The output is the inventory; cancellation is the next step.' }
  ],
  cta: {
    glyph:    '🧹',
    headline: "Find every recurring charge. Cut what you do not use.",
    body:     "Drop in your statement and SubSweep finds every subscription, calculates the annual cost, ranks them by value-per-use, and gives you the cancellation links and scripts for the ones to drop.",
    features: [
      "Finds hidden recurring charges",
      "Annual cost per subscription",
      "Value-per-use ranking",
      "Cancellation links + scripts"
    ],
    toolId:   'SubSweep',
    toolName: 'SubSweep',
  },
  published: '2026-04-29',
  modified:  '2026-04-29',
};
