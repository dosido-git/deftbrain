module.exports = {
  slug:          'how-to-find-recurring-charges-hidden-on-your-statement',
  category:      'money',
  categoryLabel: 'Money',
  title:         "How to Find Recurring Charges Hidden on Your Statement",
  titleHtml:     "How to Find Recurring Charges <em>Hidden on Your Statement</em>",
  shortTitle:    "Hidden Recurring Charges",
  navTitle:      "hidden recurring charges",
  description:   "Some subscriptions hide on your statement under names you do not recognize. Here is how to identify them, trace them back to the actual service, and stop paying.",
  deck:          "Some subscriptions hide on your statement under names you do not recognize. Here is how to identify them, trace them back to the actual service, and stop paying.",
  ledes: [
    `You scan your statement and most charges are obvious — the streaming service, the gym, the cloud storage. Then there is a $9.99 line item from "DRI*BLZ MERCHANT" that has been there for three months. You have no idea what it is. You suspect it might be the cancelled trial from something, but you cannot remember signing up. You are now paying $120 a year for a service you cannot name.\n\nThis is intentional. Many subscriptions bill under generic processor names — DRI, FastSpring, Stripe, third-party billing services — that obscure what you are actually paying for. The merchant gets paid; you get billed by something that looks like it could be anything. The trick is recognizing the patterns and tracing the charges back to the actual service.`,
    `Here is how to trace them — and how SubSweep names them for you.`,
  ],
  steps: [
    { name: 'Recognize the third-party processor prefixes', body: 'Common processor patterns include DRI* (Digital River), FS* (FastSpring), 2CO* (2Checkout), STRIPE*, SP* (Square), PADDLE*. When a charge starts with one of these and ends with a partial merchant name, the actual service is whatever comes after the prefix. \'DRI*BLZ MERCHANT\' might be a Blizzard game subscription processed through Digital River. Recognizing the format is half the work.' },
    { name: 'Search the exact statement string in a search engine', body: 'Copy the merchant string exactly as it appears on the statement and search for it. Other people have asked the same question — what is "DRI*XYZ" — and forums usually have answers. The cryptic name almost always resolves to a specific company within the first page of results. This is the fastest manual method. Two minutes of searching identifies most mystery charges.' },
    { name: 'Check your email for receipts matching the date and amount', body: 'Search your email for the dollar amount of the mystery charge. Most subscriptions email a receipt or renewal notice, often from a billing address that names the actual service. A search for "$9.99" plus the date often surfaces the email. If no email exists, the subscription may have been signed up for years ago when you used a different email. Check archive folders or old email accounts.' },
    { name: 'Call the bank if you genuinely cannot identify it', body: 'After search and email both fail, call the bank or use their dispute portal. They can identify the merchant from the merchant ID number on their side. They can also stop the charges for you if you confirm you did not authorize them. Banks deal with this constantly and have well-developed processes. If you cannot identify a charge after 10 minutes, escalating is faster than continuing to dig.' },
    { name: 'Use SubSweep to identify and decode them automatically', body: 'Drop the statement into SubSweep and it decodes processor prefixes and obscure merchant strings to actual service names. It maintains a database of these mappings and updates it as new ones appear. The line item that said \'DRI*BLZ MERCHANT\' becomes \'Blizzard Battle.net subscription\' with a link to your account page. From cryptic to actionable in seconds.' }
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
