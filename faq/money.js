// Money FAQ pages (topic: money). Every claim is from the page linked in that
// entry's sources, read 2026-11-25 (FTC consumer advice and CMS).

const S = {
  ftcAvoid: { label: 'How To Avoid a Scam (Federal Trade Commission)', url: 'https://consumer.ftc.gov/articles/how-avoid-scam' },
  ftcScammed: { label: 'What To Do if You Were Scammed (Federal Trade Commission)', url: 'https://consumer.ftc.gov/articles/what-do-if-you-were-scammed' },
  ftcDispute: { label: 'Using Credit Cards and Disputing Charges (Federal Trade Commission)', url: 'https://consumer.ftc.gov/articles/using-credit-cards-and-disputing-charges' },
  ftcCooling: { label: 'Buyer’s Remorse: The FTC’s Cooling-Off Rule May Help (Federal Trade Commission)', url: 'https://consumer.ftc.gov/articles/buyers-remorse-ftcs-cooling-rule-may-help' },
  ftcUnordered: { label: 'What To Do if You’re Billed for Things You Never Got, or You Get Unordered Products (Federal Trade Commission)', url: 'https://consumer.ftc.gov/articles/what-do-if-youre-billed-things-you-never-got-or-you-get-unordered-products' },
  ftcReviews: { label: 'How To Evaluate Online Reviews (Federal Trade Commission)', url: 'https://consumer.ftc.gov/articles/how-evaluate-online-reviews' },
  ftcReviewRule: { label: 'FTC announces final rule banning fake reviews and testimonials, August 2024 (Federal Trade Commission)', url: 'https://www.ftc.gov/news-events/news/press-releases/2024/08/federal-trade-commission-announces-final-rule-banning-fake-reviews-testimonials' },
  ftcContractor: { label: 'How To Avoid a Home Improvement Scam (Federal Trade Commission)', url: 'https://consumer.ftc.gov/articles/how-avoid-home-improvement-scam' },
  cms: { label: 'Medical bill rights: the No Surprises Act (Centers for Medicare & Medicaid Services)', url: 'https://www.cms.gov/initiatives/your-patient-rights/medical-bill-rights' },
};

const MODIFIED = '2026-11-25';

module.exports = [
  {
    slug: 'what-are-the-signs-of-a-scam',
    question: 'What are the signs of a scam?',
    answer: 'The FTC names four: the caller pretends to be from an organization you know, says there is a problem or a prize, pressures you to act right away, and tells you to pay in a specific way.',
    paras: [
      'Scammers often claim to be from the government, such as the IRS, Social Security or Medicare, or from a utility or tech company. They can change the number that shows on your caller ID, so the name and number you see may not be real.',
      'The pressure is deliberate: they may tell you not to hang up so you can’t check their story, or threaten arrest, a lawsuit or the loss of a license.',
      'The FTC’s advice is to stop and talk to someone you trust before doing anything else, and to contact a company through a website or phone number you look up yourself, not one the message gave you.',
    ],
    sources: [S.ftcAvoid],
  },
  {
    slug: 'is-it-a-scam-if-someone-asks-you-to-pay-with-a-gift-card',
    question: 'Is it a scam if someone asks you to pay with a gift card?',
    answer: 'The FTC says never to pay someone who insists you can only pay with a gift card, cryptocurrency, a wire transfer or a payment app. Insisting on those is one of its four signs of a scam.',
    paras: [
      'The typical request is to buy a gift card and read out the numbers on the back. Another version sends you a check that later turns out to be fake, then asks you to send part of the money back.',
      'If you already paid with a gift card, contact the card’s issuer right away using the number on the back, tell them a scammer tricked you into giving them the number and PIN, and ask for a refund. Keep the card and the receipt.',
    ],
    sources: [S.ftcAvoid, S.ftcScammed],
  },
  {
    slug: 'can-you-get-your-money-back-if-you-paid-a-scammer',
    question: 'Can you get your money back if you paid a scammer?',
    answer: 'Sometimes. The FTC says the money may already be gone, but it is always worth asking the company you used to pay, right away, to reverse the payment.',
    paras: [
      'For a bank transfer or Zelle, report it to your bank and ask it to reverse the payment. For a payment app, report it to the app. For a wire transfer, tell the wire company a scammer tricked you and ask for a refund.',
      'Credit and debit cards have the strongest protection: federal law protects you from unauthorized use, so report it to the card issuer and ask for your money back.',
      'Cryptocurrency payments don’t have the same legal protections, so the FTC says they can be hard to recover. Cash sent by U.S. mail can sometimes be intercepted, for a fee, through the U.S. Postal Inspection Service.',
    ],
    sources: [S.ftcScammed],
  },
  {
    slug: 'how-long-do-you-have-to-dispute-a-credit-card-charge',
    question: 'How long do you have to dispute a credit card charge?',
    answer: 'For a billing error, your written dispute must reach the card issuer within 60 days after the first statement showing the error was sent to you.',
    paras: [
      'Write to the address the issuer gives for billing inquiries, not the one for payments, with your name, account number and a description of the error. The FTC suggests certified mail with a return receipt.',
      'The issuer must acknowledge your dispute in writing within 30 days and resolve it within 90. While it investigates, you can withhold payment on the disputed amount, but you still owe the rest of the bill.',
      'Billing errors include charges for things you didn’t accept or that weren’t delivered as agreed, wrong amounts and unauthorized charges. Complaints about the quality of what you bought follow separate rules.',
    ],
    sources: [S.ftcDispute, S.ftcUnordered],
  },
  {
    slug: 'can-you-cancel-a-purchase-within-3-days',
    question: 'Can you cancel a purchase within 3 days?',
    answer: 'For some sales, yes. The FTC’s Cooling-Off Rule gives you until midnight of the third business day to cancel certain sales made at your home or at a seller’s temporary location.',
    paras: [
      'Temporary locations include hotel rooms, convention centers, fairgrounds and restaurants. The rule doesn’t cover sales under $25 at your home or under $130 at temporary locations, or sales made entirely online, by mail or by phone.',
      'Saturday counts as a business day; Sundays and federal holidays don’t. You don’t have to give a reason. Sign and mail the cancellation form the seller must give you, or a letter, postmarked before the deadline.',
      'Once you cancel, the seller has 10 days to refund your money and return any trade-in.',
    ],
    sources: [S.ftcCooling],
  },
  {
    slug: 'do-you-have-to-pay-for-something-you-didnt-order',
    question: 'Do you have to pay for something you didn’t order?',
    answer: 'No. The FTC says companies can’t send you merchandise you didn’t order and then demand payment. You don’t have to return it, and you can keep it as a free gift.',
    paras: [
      'Sellers can send items clearly marked as a gift or free sample, and charities can send merchandise and ask for a contribution. Either way, you may keep it.',
      'A different situation is a free trial that turns into monthly shipments and charges. The FTC says that might be a scam, and charges for orders you never got can be disputed with your card issuer.',
    ],
    sources: [S.ftcUnordered],
  },
  {
    slug: 'how-can-you-tell-if-an-online-review-is-fake',
    question: 'How can you tell if an online review is fake?',
    answer: 'Often you can’t just by looking, the FTC says. Check when reviews were posted and who wrote them, and look at several sources rather than one.',
    paras: [
      'A burst of reviews over a short period can mean they are fake. So can a reviewer who seems to have created an account just to review one product.',
      'Fake positive reviews sometimes give less than the top rating to seem believable, and fake reviews are not always positive: a company may post negative ones about a competitor.',
      'In August 2024 the FTC announced a rule that bans businesses from creating, buying or selling fake reviews, including AI-generated ones, and from paying for reviews that express a particular opinion.',
    ],
    sources: [S.ftcReviews, S.ftcReviewRule],
  },
  {
    slug: 'can-you-get-a-surprise-bill-for-out-of-network-emergency-care',
    question: 'Can you get a surprise bill for out-of-network emergency care?',
    answer: 'The No Surprises Act, in effect since January 1, 2022, protects most people with health insurance from unexpected out-of-network bills for emergency room visits.',
    paras: [
      'It also covers non-emergency care related to a visit to an in-network hospital, hospital outpatient department or ambulatory surgical center, and air ambulance services.',
      'If you believe a facility, provider or insurer isn’t following these rules, you can submit a complaint to the Centers for Medicare & Medicaid Services.',
    ],
    sources: [S.cms],
  },
  {
    slug: 'what-is-a-good-faith-estimate-for-medical-care',
    question: 'What is a good faith estimate for medical care?',
    answer: 'If you don’t have or don’t use health insurance, providers usually must give you an estimate of what your care will cost, when you schedule care in advance or ask for one.',
    paras: [
      'The estimate is required when you schedule services at least 3 business days ahead or request one. It comes from the No Surprises Act.',
      'If your bill is at least $400 more than the estimate, you may be able to dispute it.',
    ],
    sources: [S.cms],
  },
  {
    slug: 'how-do-you-compare-contractor-estimates',
    question: 'How do you compare contractor estimates?',
    answer: 'Get several written estimates that each describe the work, the materials, the completion date and the price. The FTC says not to pick the lowest bid automatically, and to ask why if the estimates differ a lot.',
    paras: [
      'Before signing, check that the contract has the contractor’s name, address and license number, start and finish dates, and any promises made about the scope of work and costs. Ask for a written contract even if your state doesn’t require one.',
      'Don’t pay the full amount up front; some states limit how much a contractor can ask as a down payment. Pressure for an immediate decision, cash-only payment, or a request that you get the permits yourself are signs the FTC links to scams.',
    ],
    sources: [S.ftcContractor],
  },
].map(p => ({ modified: MODIFIED, topic: 'money', ...p }));
