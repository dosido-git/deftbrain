module.exports = {
  slug:          'can-you-trust-verifiedpurchase-reviews',
  category:      'money',
  categoryLabel: 'Money',
  title:         "Can You Trust Verified-Purchase Reviews?",
  titleHtml:     "Can You Trust <em>Verified-Purchase Reviews?</em>",
  shortTitle:    "Are Verified Reviews Trustworthy?",
  navTitle:      "are verified reviews trustworthy?",
  description:   `The verified-purchase badge is supposed to mean "this person actually bought it." Here's why it's only partly true — and how to read it.`,
  deck:          `The verified-purchase badge is supposed to mean "this person actually bought it." Here's why it's only partly true — and how to read it.`,
  ledes: [
    `The verified-purchase badge is supposed to be the gold standard. The reviewer actually bought the product. Surely they're real. The truth is more complicated. Verified purchase tells you exactly one thing: a transaction happened. It doesn't tell you whether the reviewer used the product, was paid to leave the review, received it free in exchange for a review, or has a financial interest in how the product performs. Once you understand the loopholes, the badge becomes useful — but in a different way than most people think.`,
    `Below are five things to know about verified-purchase reviews, and how to use the badge as one signal among several rather than as proof.`,
  ],
  steps: [
    { name: 'Verified means transaction, not honest', body: 'Reviewers can be paid to buy a product, leave a positive review, and then get reimbursed plus a small fee. The transaction is real; the review is a paid advertisement. These accounts often have hundreds of verified-purchase reviews because every review they write is verified — that\'s the whole business model. The badge is a low bar, not a high one.' },
    { name: 'Free-product programs produce technically-honest puffery', body: 'Many platforms run programs where reviewers receive free products in exchange for a review. The programs require disclosure, but the disclosure is often a single line at the bottom of an enthusiastic review. The reviewer isn\'t lying — they did get the product, and they did like it (free things are usually liked) — but the incentive is structurally tilted toward positive reviews. Look for the disclosure lines and weight those reviews accordingly.' },
    { name: 'Unverified reviews aren\'t necessarily fake', body: 'The flipside: unverified-purchase reviews aren\'t automatically suspicious. Someone might have bought the product elsewhere, received it as a gift, used a friend\'s, or just be reviewing without going through the platform\'s checkout. Some platforms also strip the verified badge after returns or refunds, which means the unhappy customers\' reviews lose the badge while the happy customers keep it — biasing what looks trustworthy.' },
    { name: 'Use the badge to filter only the obvious fakes, not as truth', body: 'What the badge does well: it filters out the 100% bot accounts that never made a transaction. What it doesn\'t do: distinguish between honest reviewers and incentivized ones. Use it as a first-pass filter — if a product has very few verified-purchase reviews and a flood of unverified ones, that\'s suspicious. But don\'t promote it past first-pass. Verified is necessary, not sufficient.' },
    { name: 'Check whether the badge correlates with rating', body: 'Sort reviews by verified-purchase only, and look at the distribution. Then look at the unverified-only distribution. If verified reviews are sharply more positive than unverified ones, you\'re probably looking at a verified-fake-review campaign — accounts paid to buy and review. If verified and unverified distributions look similar, the reviews are probably more honest. The comparison is more telling than either set alone.' }
  ],
  cta: {
    glyph:    '🕵️',
    headline: "Read the badge as one signal among many",
    body:     "Fake Review Detective checks the verified-purchase distribution against the unverified one, flags incentivized reviews, and weights the badge alongside other trust signals.",
    features: [
      "Verified vs unverified comparison",
      "Incentive-disclosure flagging",
      "Bot-account filtering",
      "Trust-weighted scoring",
      "Real-pool extraction"
    ],
    toolId:   'FakeReviewDetective',
    toolName: 'Fake Review Detective',
  },
  published: '2026-04-29',
  modified:  '2026-04-29',
};
