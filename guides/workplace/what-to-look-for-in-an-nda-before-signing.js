module.exports = {
  slug:          'what-to-look-for-in-an-nda-before-signing',
  category:      'workplace',
  categoryLabel: 'Workplace',
  title:         "What to look for in an NDA before signing",
  titleHtml:     "What to look for in an NDA <em>before signing</em>",
  shortTitle:    "Reading NDAs",
  navTitle:      "reading NDAs",
  description:   "A practical guide to reading non-disclosure agreements — what they should and should not say, and what to push back on.",
  deck:          "A practical guide to reading non-disclosure agreements — what they should and should not say, and what to push back on.",
  ledes: [
    `Someone has handed you an NDA to sign. Maybe before a job interview. Maybe before a business meeting. Maybe as part of a partnership conversation. The document is three to seven pages long. Most of it is dense, and you have a meeting in twenty minutes. The pressure is to just sign — it is 'standard,' it is 'mutual,' it is 'just a formality.' All of these phrases are sometimes true. Sometimes they are not.\n\nNDAs are not all the same. Some are reasonable and necessary. Some are unreasonably broad and would commit you to obligations that follow you for years. The differences are visible if you know where to look — and reviewing an NDA carefully takes five to ten minutes once you know what to look for.`,
    `Here is what to look for in an NDA before you sign it.`,
  ],
  steps: [
    { name: 'Verify it is mutual or one-way, and understand which', body: 'A mutual NDA protects information shared in both directions. A one-way NDA protects only the other party\'s information. Mutual NDAs are usually fine for business conversations between potential partners. One-way NDAs make sense when only one side is sharing sensitive information (you are interviewing at a company, you are evaluating their software). If you are sharing information too and you are given a one-way NDA, ask why it is not mutual. Sometimes the answer is reasonable. Sometimes it reveals an asymmetry you should address.' },
    { name: 'Read the definition of \'confidential information\'', body: 'What counts as confidential? Some NDAs define it narrowly: information specifically marked confidential or shared in writing with a confidentiality designation. Some NDAs define it broadly: anything you learn in connection with the relationship, regardless of whether it was identified as confidential. The broad version is much harder to comply with — you might inadvertently violate it just by knowing things. Push for narrower definitions when you can.' },
    { name: 'Check the duration', body: 'How long does the obligation last? Reasonable NDAs are typically two to five years for general business information. Trade secrets can be protected indefinitely. If an NDA has a perpetual confidentiality obligation on ordinary business information, that is unusually broad. Ask why. Sometimes the answer is reasonable; often the duration was just over-drafted by a lawyer who did not push back. Negotiating it down is usually possible.' },
    { name: 'Identify the carve-outs', body: 'Standard NDAs include carve-outs — categories of information that are not covered. These usually include: information you already knew, information you learned independently, information that is or becomes public through no fault of yours, and information you are required to disclose by law. Make sure these carve-outs are present. Without them, you could be technically violating the NDA by repeating something you read in the news.' },
    { name: 'Look for non-compete-by-stealth language', body: 'Some NDAs sneak in non-compete or non-solicitation provisions. The document is titled \'NDA\' but contains clauses that prevent you from working with competitors, hiring their employees, or pursuing similar business. These provisions belong in a separate non-compete agreement that you can evaluate on its own. If they appear in an NDA, they are often hoping you will not notice. Read every paragraph, not just the headings. If you see anything beyond confidentiality obligations, push back.' }
  ],
  cta: {
    glyph:    '📋',
    headline: "Know what you are agreeing to before you sign.",
    body:     "Paste the contract, or upload the file, and Contract Decoder gives you a plain-English breakdown of the important terms, the questions to ask, and the points you may want to clarify or negotiate before you sign. It quotes the language it is explaining and keeps what the contract says separate from what still needs checking.",
    features: [
      "Plain-English overview of what the contract actually says",
      "Important terms, quoted from the document itself",
      "Questions to clarify before you sign",
      "Points you may want to negotiate"
    ],
    toolId:   'ContractDecoder',
    toolName: 'Contract Decoder',
  },
  published: '2026-04-29',
  modified:  '2026-10-08',
};
