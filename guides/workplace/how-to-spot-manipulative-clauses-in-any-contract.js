// ============================================================
// guides/workplace/how-to-spot-manipulative-clauses-in-any-contract.js
// ============================================================

module.exports = {
  slug:          'how-to-spot-manipulative-clauses-in-any-contract',
  category:      'workplace',
  categoryLabel: 'Workplace',

  title:         "How to Spot Manipulative Clauses in Any Contract",
  titleHtml:     "How to Spot Manipulative Clauses <em>in Any Contract</em>",
  shortTitle:    "Manipulative Clauses",
  navTitle:      "How to spot manipulative clauses in any contract",

  description:   "Manipulative clauses don't shout. They hide in passive voice, in references to other documents, and in what's missing. Here's how to read for the patterns.",
  deck:          "Manipulative clauses don't shout. They hide in passive voice, in references to other documents, and in what's missing. Here's how to read for the patterns.",

  published:     '2026-04-28',
  modified:      '2026-04-28',

  ledes: [
    `You've read the contract. Nothing jumped out. Everything sounds reasonable. And yet there's a vague sense that you're missing something — that the document is doing more work than it appears to, in places you can't quite locate. That sense is usually right. Manipulative contract language is engineered to read past you. It's designed not to register on a careful first pass, which is the only pass most people make.`,
    `The good news is that manipulative clauses follow patterns. Once you've seen them in three contracts, you'll see them in every contract. The skill isn't legal expertise; it's pattern recognition. Here are the patterns.`,
  ],

  steps: [
    {
      name: "Pattern one: passive voice with discretion",
      body: "Watch for sentences that hide who has the power. 'Fees may be adjusted' is doing different work than 'we may adjust fees.' Both let them change the price; only the second admits it's their decision. The standard tell is the phrase 'at our sole discretion,' which means 'we can do this for any reason, and you have no recourse.' Anywhere that phrase appears, read the surrounding sentence twice — that's where the asymmetry lives.",
    },
    {
      name: "Pattern two: references to other documents",
      body: "Some of the worst clauses aren't in the contract you're reading — they're in a document the contract references. 'Subject to our Terms of Service,' 'in accordance with the Privacy Policy,' 'as detailed in the Operating Agreement' — every reference is a separate document that's now part of your contract. Always ask for those documents before signing. If they say 'they're on our website,' download them and read them. Otherwise you're agreeing to terms you haven't seen.",
    },
    {
      name: "Pattern three: clauses with no time limit",
      body: "Look for the words 'perpetual,' 'in perpetuity,' 'irrevocable,' and 'survives termination.' These mean the obligation continues forever, even after the relationship ends. Some perpetual clauses are appropriate — confidentiality of trade secrets, for instance. Most aren't. A perpetual non-compete, a perpetual rights grant, a perpetual indemnification — these are signs they want something to outlast the deal in ways that benefit only one side.",
    },
    {
      name: "Pattern four: asymmetric obligations",
      body: "Read every clause and ask: who is required to do this? Who has the option? In a fair contract, obligations are mostly symmetrical — both parties have to give notice, both can terminate, both warrant the same things. In a manipulative one, you're required to indemnify them but not the other way around; you give 30 days' notice and they give zero; you guarantee everything and they guarantee nothing. Mismatched obligations are the contract telling you what it actually thinks of you.",
    },
    {
      name: "Pattern five: what's missing",
      body: "The most manipulative clauses are sometimes the clauses that aren't there. No cap on liability. No definition of 'reasonable efforts.' No carve-out for force majeure. No process for resolving disputes short of litigation. When something obvious is missing from a contract, it's not always an oversight; sometimes it's intentional silence designed to be filled in later, in their favor. Make a list of what's not there and ask why.",
    },
  ],

  cta: {
    glyph:    '🗡',
    headline: "Detect the manipulation before you sign",
    body:     "Paste any contract and Jargon Assassin flags every passive-voice discretion clause, every external reference, every perpetual obligation, and every asymmetric term — ranked by danger, with the language to push back on each.",
    features: [
      "Pattern detection",
      "Red-flag scoring",
      "Asymmetry analysis",
      "Suggested redlines",
      "Plain-language translation",
    ],
    toolId:   'JargonAssassin',
    toolName: 'Jargon Assassin',
  },
};
