// ============================================================
// guide-specs/home/red-flags-in-a-rental-lease.js
// ============================================================
// Source of truth for /guides/home/red-flags-in-a-rental-lease.
// Edit here; run `node scripts/build-guides.js home` to regenerate.
// ============================================================

module.exports = {
  slug:          'red-flags-in-a-rental-lease',
  category:      'home',
  categoryLabel: 'Home',

  title:         "Red Flags in a Rental Lease (That Should Make You Think Twice)",
  titleHtml:     "Red Flags in a Rental Lease <em>(That Should Make You Think Twice)</em>",
  shortTitle:    "Red Flags in a Rental Lease",
  navTitle:      "Red flags in a rental lease that should make you think twice",

  description:   "Not every bad lease clause is illegal. Many are just predatory — permitted in your state, but designed to extract money or control from the tenant. Here are the five worth walking away over.",
  deck:          "Not every bad lease clause is illegal. Many are just predatory — permitted in your state, but designed to extract money or control from the tenant. Here are the five worth walking away over.",

  published:     '2026-04-24',
  modified:      '2026-04-24',

  ledes: [
    `You're reading the lease, and something doesn't sit right. You can't name it exactly — just a feeling that a clause favors the landlord a little too much, or a fee seems higher than it should, or a rule gives them more control than you expected. That feeling is usually right. Most bad leases aren't illegal. They're just designed to extract money or control in ways a first-time renter doesn't see coming.`,
    `Every state has laws that cap what landlords can do in practice, but most don't cap what they can try to put into a lease. A clause that's unenforceable in court can still cost you a lawsuit, or a security deposit, or a year of stress. Here are the five worst offenders, and what they look like on the page.`,
  ],

  steps: [
    {
      name: "'As-is' language without a pre-signing inspection",
      body: "A lease that states the unit is accepted 'as-is,' with no written record of its condition at move-in, hands the landlord the ability to claim any damage is yours. If you see 'as-is' anywhere in the document, ask for an inspection report to be attached. Document every pre-existing issue with timestamped photos before you hand over the first check. Without that record, you've agreed that the stained carpet and cracked window are things you did.",
    },
    {
      name: "One-sided early-termination fees",
      body: "Leases commonly specify what the tenant owes if they break the lease — usually one or two months' rent plus forfeiture of the deposit. Red flag: the lease spells out your penalty for breaking it, but is silent on the landlord's obligations if they fail to maintain the unit. That's a one-way street. A fairer lease specifies mutual obligations and consequences on both sides, not just yours.",
    },
    {
      name: "Excessive or open-ended fees",
      body: "Late fees that are percentages rather than fixed amounts. 'Administrative fees' or 'processing fees' with no definition. Cleaning fees that apply regardless of condition. Any line item that's 'to be determined by landlord.' Each can be reasonable in moderation, but together they signal a landlord who expects to extract more than rent. A $150 fee on a lease renewal isn't normal — it's just permitted.",
    },
    {
      name: "Landlord entry without proper notice",
      body: "Most states require 24 hours' notice before a landlord enters the unit, with exceptions for genuine emergencies. A lease that says the landlord can enter 'at any time,' 'upon reasonable notice,' or 'with two hours' notice' is trying to normalize something the law often doesn't permit. Check your state's minimum; if the lease is more permissive, it doesn't override the law — but it tells you what the landlord thinks they can get away with.",
    },
    {
      name: "'Joint and several liability' with roommates, buried",
      body: "If you're signing with roommates, 'joint and several' means the landlord can collect the full rent from any one of you if the others don't pay. You're not just liable for your share — you're liable for everyone's. This is standard and often appropriate, but it should be explicit. If the lease doesn't mention how roommate liability works, ask. If it's there but buried in boilerplate, at least you know what you've signed.",
    },
  ],

  callout: {
    afterStep: 1,
    scriptedLine: "Before I sign, I'd like to do a walk-through with you and document the unit's current condition — photos and a written list we both sign off on.",
    explanation: "This protects both parties, and a landlord who refuses is telling you they want the 'as-is' clause to mean they can charge you later for pre-existing damage. Most reasonable landlords will agree right away — their insurance often requires it anyway.",
  },

  cta: {
    glyph:    '🏡',
    headline: "Find the predatory clauses before you sign",
    body:     "Lease Trap Detector reads your lease the way a tenant's-rights attorney would, flagging the clauses most likely to cost you money, freedom, or your deposit.",
    features: [
      "Predatory-clause detection",
      "Fairness rating by section",
      "State-aware law check",
      "Negotiation scripts",
      "Pre-signing inspection checklist",
    ],
    toolId:   'LeaseTrapDetector',
    toolName: 'Lease Trap Detector',
  },
};
