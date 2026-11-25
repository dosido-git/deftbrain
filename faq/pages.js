// Single-question answer pages served at /faq/<slug> (built by scripts/build-faq.js).
//
// A deliberate SEO test (started 2026-11-19), set against the 12 single-question
// deposit GUIDES of 2026-11-18. These follow one practitioner's recipe (David
// Quaid) strictly: one question per page, the address and title are the
// question, the answer is short and comes first, no structured data, and no
// "| DeftBrain" in the title. Every claim is from the statute linked in that
// page's sources.
//
// 2026-11-25: widened to ~10 pages per category (owner), one file per topic
// (faq/travel.js, ...), so the test covers the catalog and not just landlords.
//
// `paras` accept inline links: [label](/path) or [label](https://...).

const S = {
  ca: { label: 'California Civil Code § 1950.5 (California Legislative Information)', url: 'https://leginfo.legislature.ca.gov/faces/codes_displaySection.xhtml?lawCode=CIV&sectionNum=1950.5' },
  tx: { label: 'Texas Property Code, Chapter 92 (Texas Legislature)', url: 'https://statutes.capitol.texas.gov/Docs/PR/htm/PR.92.htm' },
  ny: { label: 'New York General Obligations Law § 7-108 (NY Senate)', url: 'https://www.nysenate.gov/legislation/laws/GOB/7-108' },
  ma: { label: 'Massachusetts General Laws ch. 186 § 15B (Massachusetts Legislature)', url: 'https://malegislature.gov/Laws/GeneralLaws/PartII/TitleI/Chapter186/Section15B' },
  wa060: { label: 'RCW 59.18.060, landlord duties (Washington State Legislature)', url: 'https://app.leg.wa.gov/RCW/default.aspx?cite=59.18.060' },
  wa260: { label: 'RCW 59.18.260, move-in checklist (Washington State Legislature)', url: 'https://app.leg.wa.gov/RCW/default.aspx?cite=59.18.260' },
  wa280: { label: 'RCW 59.18.280, deposit statement (Washington State Legislature)', url: 'https://app.leg.wa.gov/RCW/default.aspx?cite=59.18.280' },
};

const MODIFIED = '2026-11-19';

module.exports = [
  {
    slug: 'can-a-landlord-charge-for-lost-keys',
    question: 'Can a landlord charge for lost keys?',
    answer: 'Often yes, for a reasonable replacement cost. Whether it can come out of your deposit depends on your state and on what your lease says.',
    paras: [
      'In California, a deposit can pay to replace or return property such as keys only if the rental agreement says the deposit may be used that way, and only for amounts reasonably necessary.',
      'Texas requires the landlord to rekey after every tenant at its own expense. It can deduct the cost of rekeying only if you left in breach of a written lease that allows the deduction in underlined or bold print.',
      'Massachusetts limits deductions to unpaid rent or water charges, certain tax increases and damage to the unit. Lost keys are not on that list.',
      'If you are charged, ask for the receipt. The charge should match what the replacement actually cost.',
    ],
    sources: [S.ca, S.tx, S.ma],
  },
  {
    slug: 'can-a-landlord-charge-for-mold',
    question: 'Can a landlord charge for mold?',
    answer: 'Only if you caused it. Mold from a leak, a roof problem or the building’s plumbing is the landlord’s to fix; mold from something you did or neglected can be charged as damage.',
    paras: [
      'Deposit laws let a landlord deduct for damage the tenant caused beyond ordinary wear and tear. California and Massachusetts both put it that way.',
      'Washington law makes the landlord keep the structure, roof and plumbing in good repair, so mold that grows from those failures is a repair, not a tenant charge.',
      'Cause is usually the whole dispute. If you saw a leak and never reported it, the landlord may argue the damage was yours. Written repair requests and move-in photos are what settle it.',
    ],
    sources: [S.ca, S.ma, S.wa060],
  },
  {
    slug: 'can-a-landlord-keep-your-deposit-for-unpaid-utilities',
    question: 'Can a landlord keep your deposit for unpaid utilities?',
    answer: 'Sometimes, mostly when the bill is owed to the landlord under your lease. A utility account in your own name is a debt to the utility company, not to the landlord.',
    paras: [
      'New York lets a landlord keep deposit money for unpaid utility charges payable directly to the landlord under the lease.',
      'Massachusetts allows deductions for unpaid water charges, alongside unpaid rent, certain tax increases and damage. Other utilities are not on its list.',
      'In Texas, a landlord may deduct charges the tenant is legally liable for under the lease, so the lease wording decides it.',
    ],
    sources: [S.ny, S.ma, S.tx],
  },
  {
    slug: 'can-a-landlord-keep-your-deposit-if-you-never-move-in',
    question: 'Can a landlord keep your deposit if you never move in?',
    answer: 'Often part of it, rarely all of it automatically. It depends on whether you signed a lease, what the money was called, and whether the unit was rented to someone else.',
    paras: [
      'In Texas, if you signed a lease and never moved in, the landlord cannot keep the deposit when a replacement tenant it accepts moves in on or before your lease’s start date. If the landlord found that tenant, it may keep either a cancellation fee set in the lease or its actual costs of finding the replacement.',
      'California does not allow a lease to call a security deposit “nonrefundable.”',
      'If you never signed a lease, the money may have been a holding deposit rather than a security deposit. What the receipt and your messages said about it matters.',
    ],
    sources: [S.tx, S.ca],
  },
  {
    slug: 'can-a-landlord-keep-your-deposit-if-you-are-evicted',
    question: 'Can a landlord keep your deposit if you are evicted?',
    answer: 'Not automatically. An eviction does not forfeit the deposit; the landlord can deduct what you owe, usually unpaid rent and damage, and must account for the rest.',
    paras: [
      'New York gives the landlord 14 days after you leave to send an itemized statement and return the balance. A landlord who misses that deadline loses the right to keep any of it.',
      'California’s 21-day itemized statement still applies. The right to a pre-move-out inspection does not apply when the tenancy ends through an eviction for unpaid rent, a lease breach or a nuisance.',
      'In Texas, a landlord need not send an itemized list if you owed rent when you left and the amount is not in dispute.',
    ],
    sources: [S.ny, S.ca, S.tx],
  },
  {
    slug: 'can-a-landlord-charge-for-pest-control',
    question: 'Can a landlord charge for pest control?',
    answer: 'Usually only for an infestation you caused. Otherwise pest control is generally the landlord’s cost.',
    paras: [
      'Washington requires the landlord to provide a pest-control program at the start of a tenancy and, except in a single-family home, to control infestations during it unless the tenant caused them.',
      'In other states the answer usually turns on the same question of cause, and on what the lease says about pests.',
      'When the pests first appeared matters most. Report them in writing as soon as you see them, and keep a copy.',
    ],
    sources: [S.wa060],
  },
  {
    slug: 'can-a-landlord-charge-for-oven-cleaning',
    question: 'Can a landlord charge for oven cleaning?',
    answer: 'In some states, if you left the oven dirtier than it was when you moved in. In others, cleaning is not an allowed deposit deduction at all.',
    paras: [
      'California lets a deposit cover cleaning needed to return the unit to the level of cleanliness it had when you moved in, and you can ask for an inspection before you leave so you have the chance to clean first.',
      'Massachusetts does not list cleaning among the allowed deductions.',
      'Washington requires a signed move-in checklist describing the condition and cleanliness of the appliances. A landlord who collects a deposit without one can owe the whole deposit back.',
    ],
    sources: [S.ca, S.ma, S.wa260],
  },
  {
    slug: 'can-a-landlord-charge-for-broken-appliances',
    question: 'Can a landlord charge for broken appliances?',
    answer: 'Only if you broke it. An appliance that wears out or fails with age is the landlord’s to repair or replace.',
    paras: [
      'Deposit laws exclude ordinary wear and tear from deductions; California, Texas and New York all say so. New York also bars charging you for damage a prior tenant caused.',
      'Washington makes the landlord keep the appliances it supplies in reasonably good working order, and the move-in checklist must record their condition.',
      'Report a breakdown in writing when it happens. A dated report is the best answer to a charge at move-out.',
    ],
    sources: [S.ca, S.tx, S.ny, S.wa060],
  },
  {
    slug: 'can-a-landlord-charge-for-water-damage',
    question: 'Can a landlord charge for water damage?',
    answer: 'If you caused it, yes, at a reasonable repair cost. Not for leaks from the building’s roof or plumbing.',
    paras: [
      'Massachusetts requires a sworn, itemized list of the damage with estimates, bills or receipts, and bars deductions for damage already noted in the move-in statement.',
      'Washington requires the landlord to include copies of estimates or invoices with the deposit statement, and makes the landlord responsible for keeping plumbing working and the unit weathertight.',
      'In New York, the landlord has to prove the amount kept was reasonable.',
    ],
    sources: [S.ma, S.wa280, S.wa060, S.ny],
  },
  {
    slug: 'can-a-landlord-charge-you-for-something-not-in-the-lease',
    question: 'Can a landlord charge you for something not in the lease?',
    answer: 'For deposit deductions, state law usually matters more than the lease. Several states list what a deposit can cover, and a lease cannot add to that list.',
    paras: [
      'Massachusetts lists the allowed deductions and makes any lease term that conflicts with its deposit law void.',
      'California limits deductions to amounts reasonably necessary for unpaid rent, damage, cleaning and, if the lease allows it, replacing property such as keys.',
      'Texas works the other way: a landlord may deduct charges the tenant is liable for under the lease, so there the lease wording does matter. None of these three states allows deductions for ordinary wear and tear.',
    ],
    sources: [S.ma, S.ca, S.tx],
  },
].map(p => ({ modified: MODIFIED, topic: 'deposits', ...p }))
  .concat(require('./travel'), require('./health'));
