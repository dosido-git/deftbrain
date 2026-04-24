// ============================================================
// guide-specs/home/how-to-read-a-lease-before-signing-it.js
// ============================================================
// Source of truth for /guides/home/how-to-read-a-lease-before-signing-it.
// Edit here; run `node scripts/build-guides.js home` to regenerate.
// ============================================================

module.exports = {
  slug:          'how-to-read-a-lease-before-signing-it',
  category:      'home',
  categoryLabel: 'Home',

  title:         "How to Read a Lease Before Signing It (Without Missing Anything Expensive)",
  titleHtml:     "How to Read a Lease Before Signing It <em>(Without Missing Anything Expensive)</em>",
  shortTitle:    "How to Read a Lease Before Signing It",
  navTitle:      "How to read a lease before signing it without missing anything expensive",

  description:   "A lease is a contract most people skim. The expensive regrets are buried in the parts they skipped. A five-step approach to reading one properly — before you're stuck with it for a year.",
  deck:          "A lease is a contract most people skim. The expensive regrets are buried in the parts they skipped. A five-step approach to reading one properly — before you're stuck with it for a year.",

  published:     '2026-04-24',
  modified:      '2026-04-24',

  ledes: [
    `The landlord hands you the lease and a pen. You're standing in the unit you just toured. You're already mentally moved in — you've pictured the couch, you've thought about where the cat would nap. And somewhere in those three pages of dense small-type text, there are clauses that will cost you money or freedom you haven't considered yet. The amount most renters read before signing is "enough to know where to initial."`,
    `Reading a lease properly isn't a legal skill. It's a process — a few passes, each looking for something different. Fifteen minutes, a pen, and a quiet room. Here's how.`,
  ],

  steps: [
    {
      name: "Ask to take it home before signing",
      body: "A landlord who insists you sign on the spot is a landlord you want to know more about first. Standard practice is 24 to 48 hours to review, ask questions, and return with signed pages. Pressure to sign immediately is itself information — about how this landlord will handle disputes later. If they won't let you take the document home to read it, that's a data point worth a long pause before you commit.",
    },
    {
      name: "Read it cold, all the way through, before flagging anything",
      body: "Resist the urge to start underlining or writing questions on the first pass. Just read it straight through, no notes, no stops. The goal is to absorb the overall shape of the agreement — the term, the money, the major obligations — so you know the context for anything specific you flag later. A clause about 'quiet hours' means something different if you already know there's a 60-day notice period for termination.",
    },
    {
      name: "On the second pass, check what should be there",
      body: "Basic items every lease should specify clearly: the monthly rent and when it's due, the security deposit amount and return terms, the lease length and renewal rules, who pays which utilities, what's included (parking, laundry, storage). If any of these are vague or missing, that's a flag on its own. A well-run landlord has these dialed. A lease that leaves basics implicit leaves them open to interpretation — and the interpretation will be the landlord's.",
    },
    {
      name: "On the third pass, mark anything that seems one-sided",
      body: "Any clause that lists what you owe if you break the lease, but is silent on the landlord's obligations if they fail to uphold theirs. Any provision that lets the landlord enter without notice, raise rent mid-term, or change the rules on short notice. Any fee where the amount is 'to be determined' rather than specified. One-sided doesn't automatically mean illegal — it just means the document favors the landlord in that situation, and you should know it going in.",
    },
    {
      name: "Look up anything you don't understand",
      body: "'Joint and several liability.' 'Force majeure.' 'Attornment.' 'Estoppel certificate.' You don't need to become a lawyer, but you do need to know what each clause actually binds you to. Search the term plus 'tenant' for a plain-English explanation. If a word is important enough to be in a contract you're about to sign, it's important enough to understand before you sign it.",
    },
  ],

  callout: {
    afterStep: 1,
    scriptedLine: "Thanks — I'd like to take this home to read through carefully. I'll be back with signed pages by [tomorrow / Monday / end of the week].",
    explanation: "Direct, reasonable, not apologetic. A 24-to-48-hour review window is standard practice, and a landlord who pushes back on it is telling you something about how disputes will go later. Give a specific return day so it doesn't feel open-ended.",
  },

  cta: {
    glyph:    '🏡',
    headline: "Find what's buried in the lease before you commit to it",
    body:     "Lease Trap Detector reads your lease the way a tenant's-rights attorney would — surfacing the problematic clauses, the one-sided language, and the questions worth asking before you sign.",
    features: [
      "Predatory-clause detector",
      "Plain-English translations",
      "Fairness check by section",
      "Negotiation-ready questions",
      "State-aware warnings",
    ],
    toolId:   'LeaseTrapDetector',
    toolName: 'Lease Trap Detector',
  },
};
