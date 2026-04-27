module.exports = {
  slug:          'how-to-read-a-lease-before-signing-it',
  category:      'home',
  categoryLabel: 'Home',

  title:         "How to Read a Lease Before Signing It (Without Missing Anything That Matters)",
  titleHtml:     "How to Read a Lease Before Signing It <em>(Without Missing Anything That Matters)</em>",
  shortTitle:    "How to Read a Lease Before Signing It",
  navTitle:      "How to read a lease before signing it without missing anything that matters",

  description:   "A 30-page lease isn't designed to be read — it's designed to make every clause look equal. Here's the order to read it in, and what to actually pay attention to.",
  deck:          "A 30-page lease isn't designed to be read — it's designed to make every clause look equal. Here's the order to read it in, and what to actually pay attention to.",

  ledes: [
    `It's sitting on the kitchen table. Twenty-eight pages, single-spaced, with five places to initial. The landlord wants it back by Friday. You started reading it Tuesday night and somewhere around page four the words stopped being sentences and started being shapes. You know you're supposed to read every word. You also know you won't.`,
    `That's fine. The skill isn't reading every clause — it's reading the right clauses in the right order. Most of a lease is boilerplate that won't ever matter to you. A handful of clauses will determine whether the next year is uneventful or expensive. Here's how to find them.`,
  ],

  steps: [
    {
      name: "Skim the move-out clauses before the move-in ones",
      body: "Most people read leases front-to-back, which means they're paying full attention by the time they hit 'rent due on the first' and zoning out by the time they reach 'tenant shall be liable for.' Flip the script. Find the sections on early termination, security deposit return, and end-of-lease cleaning standards first, while you're still alert. These are where the real money is — and where landlords write the clauses that hurt the most.",
    },
    {
      name: "Read every dollar amount out loud",
      body: "Lease numbers blur. Pet deposit, key replacement fee, lockout fee, late fee, parking fee, utility surcharge, administrative fee — they all start to sound the same on the page. Saying them out loud breaks the trance. You'll catch the $250 lockout fee that was hiding next to a paragraph about plumbing maintenance. You'll notice that the late fee is 10% of monthly rent, not a flat $50. Anything that costs you money should be heard, not just seen.",
    },
    {
      name: "Look for clauses that override your standard rights",
      body: "Tenant law gives you certain default protections — notice before entry, the right to a habitable unit, limits on what your security deposit can be used for. Some leases try to write those protections out. Watch for phrases like 'tenant waives,' 'notwithstanding any law,' 'tenant agrees that landlord may,' or 'except as expressly stated herein.' These are flags that the lease is asking you to give up something the law would otherwise give you for free.",
    },
    {
      name: "Watch for definitions written to be flexible",
      body: "If a clause says you're responsible for 'reasonable wear and tear' — fine. If it says you're responsible for 'normal use as determined by landlord' — that's a different sentence. The same goes for 'sufficient notice' (versus 30 days), 'reasonable repairs' (versus a list), 'good condition' (versus a move-in checklist). The vaguer the standard, the more discretion the landlord has when they invoke it. Vagueness in a lease is almost never accidental.",
    },
    {
      name: "Mark what you'll actually have to live by",
      body: "Once you've read it once, go back through and underline only the clauses that will affect your daily life or cost you money: pet rules, guest rules, quiet hours, maintenance request process, what counts as default, what triggers a fee. Take a photo of those pages. The rest of the lease is for lawyers and edge cases. The clauses you live by are the ones you should be able to recall in 18 months — because that's when one of them will come up.",
    },
  ],

  callout: {
    afterStep: 3,
    scriptedLine: "Before I sign, can you walk me through which clauses are negotiable? I'd like to clarify a few before we finalize.",
    explanation: "This frames you as a careful tenant rather than a difficult one, and it surfaces what the landlord considers fixed versus flexible. Their answer tells you what's worth pushing on.",
  },

  cta: {
    glyph:    '🏡',
    headline: "Don't read the lease alone",
    body:     "Lease Trap Detector reads it for you, flags the clauses that override your rights, identifies what's unenforceable in your jurisdiction, and tells you exactly what to push back on before you sign.",
    features: [
      "Red, yellow, and green flag detection",
      "Unenforceable clause identification",
      "Jurisdiction-specific rights check",
      "Negotiation priority list",
      "PDF or pasted-text input",
    ],
    toolId:   'LeaseTrapDetector',
    toolName: 'Lease Trap Detector',
  },

  published: '2026-04-27',
  modified:  '2026-04-27',
};
