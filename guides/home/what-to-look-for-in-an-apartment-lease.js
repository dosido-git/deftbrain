// ============================================================
// guide-specs/home/what-to-look-for-in-an-apartment-lease.js
// ============================================================
// Source of truth for /guides/home/what-to-look-for-in-an-apartment-lease.
// Edit here; run `node scripts/build-guides.js home` to regenerate.
// ============================================================

module.exports = {
  slug:          'what-to-look-for-in-an-apartment-lease',
  category:      'home',
  categoryLabel: 'Home',

  title:         "What to Look for in an Apartment Lease (Before You Lock In a Year)",
  titleHtml:     "What to Look for in an Apartment Lease <em>(Before You Lock In a Year)</em>",
  shortTitle:    "What to Look for in an Apartment Lease",
  navTitle:      "What to look for in an apartment lease before you lock in a year",

  description:   "A lease is a list of promises — yours and the landlord's. Here's what every well-written lease should specify clearly, and what it usually means when something isn't specified at all.",
  deck:          "A lease is a list of promises — yours and the landlord's. Here's what every well-written lease should specify clearly, and what it usually means when something isn't specified at all.",

  published:     '2026-04-24',
  modified:      '2026-04-24',

  ledes: [
    `You're looking at the lease. It's seven pages, mostly small type, with sections titled things like 'Covenants of Tenant' and 'Possession.' You know you should be reading it carefully, but carefully for what? Which paragraphs actually matter? Which ones are boilerplate? And which ones are the problem — the parts that will cost you, surprise you, or trap you later?`,
    `A well-written lease specifies certain things clearly. When something important is vague, missing, or left 'to be determined,' the interpretation defaults to the landlord. The five categories below are what to verify before you put your name on anything.`,
  ],

  steps: [
    {
      name: "The money: rent, due date, grace period, late fees",
      body: "Exact rent amount. Day of the month it's due. Grace period before late fees kick in (three to five days is standard). Late fee amount, and whether it's a flat fee or a percentage of the rent. Accepted payment methods. If any of these are vague — 'late fees at landlord's discretion' — flag it. 'At landlord's discretion' is legalese for 'however much I feel like charging.'",
    },
    {
      name: "The term: length, notice to leave, auto-renewal",
      body: "How long the lease is (usually 12 months). Whether it converts to month-to-month at the end or automatically renews for another full term. How much notice you need to give if you don't want to renew — 30 days is minimum, 60 is common, 90 is worth pushing back on. What happens if you need to leave early, and whether there's a specified break fee. Auto-renewal clauses are where people get locked into another year they never meant to commit to.",
    },
    {
      name: "The deposit: amount, where it's held, how it's returned",
      body: "How much. Who holds it (some states require a separate escrow account, with interest paid to the tenant). What can be deducted from it — 'damage beyond normal wear and tear' is the standard language, and the fight is always over what counts as normal. Timeline for return after move-out — most states require 14 to 30 days with an itemized list of deductions. The lease should state the timeline even if state law already does; if it doesn't, ask.",
    },
    {
      name: "Access and use: pets, guests, subletting, working from home",
      body: "Whether pets are allowed, what kinds, what the deposit or monthly fee is. Whether guests can stay, and how long before they count as an unauthorized occupant. Whether you can sublet or assign the lease. Whether you can run a business from the unit — increasingly relevant for remote workers. Quiet hours, parking, smoking, and other use rules. All of this should be explicit in the lease; none of it should be 'discuss with landlord.'",
    },
    {
      name: "Responsibility: utilities, maintenance, repairs, appliances",
      body: "Which utilities the tenant pays, which the landlord pays. Who's responsible for yard care, snow removal, pest control. Who fixes the HVAC when it dies, and how quickly. Whether appliances are 'provided as-is' or maintained. Vague language here is expensive. When the furnace quits in January, you don't want to be arguing over who pays to replace it — you want to point at a line in the lease.",
    },
  ],

  callout: {
    afterStep: 2,
    scriptedLine: "Before I sign, could you specify the break fee in writing? I'd rather know the number now than discover it later.",
    explanation: "Most leases imply a break fee through liquidated-damages language without stating a specific number. Asking for one isn't aggressive — it's reasonable, and it protects both sides. A landlord unwilling to commit to a specific number on paper is telling you they want discretion later.",
  },

  cta: {
    glyph:    '🏡',
    headline: "A lease read by an expert — before you sign one",
    body:     "Lease Trap Detector checks every essential clause for presence, specificity, and fairness. Paste your lease, get a plain-English summary with every flag worth your attention.",
    features: [
      "Essential-clause checklist",
      "Vague-language spotter",
      "Fee and deposit audit",
      "Break-clause detector",
      "Questions worth asking",
    ],
    toolId:   'LeaseTrapDetector',
    toolName: 'Lease Trap Detector',
  },
};
