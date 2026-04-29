// ============================================================
// guides/workplace/what-to-look-for-in-an-nda-before-signing.js
// ============================================================

module.exports = {
  slug:          'what-to-look-for-in-an-nda-before-signing',
  category:      'workplace',
  categoryLabel: 'Workplace',

  title:         "What to Look For in an NDA Before Signing",
  titleHtml:     "What to Look For in an NDA <em>Before Signing</em>",
  shortTitle:    "What to Look For in an NDA",
  navTitle:      "What to look for in an NDA before signing",

  description:   "The other side wants you to sign before the meeting. Here's how to read an NDA in ten minutes and identify the four places they overreach — without killing the deal.",
  deck:          "The other side wants you to sign before the meeting. Here's how to read an NDA in ten minutes and identify the four places they overreach — without killing the deal.",

  published:     '2026-04-28',
  modified:      '2026-04-28',

  ledes: [
    `The meeting is tomorrow at 10am. The other side just emailed: 'Quick housekeeping — please sign the attached NDA before we get on the call.' It's three pages, single-spaced, and you're meant to read, sign, and return it tonight. They're not trying to trap you, probably. But the standard NDA most companies send out is calibrated to favor them, and if you've signed it without reading it you've done their negotiation for them.`,
    `An NDA is one of the few documents you can read in ten minutes and meaningfully redline yourself. There are four sections that matter; everything else is boilerplate. Here are the four.`,
  ],

  steps: [
    {
      name: "Pin down what 'confidential' actually covers",
      body: "Bad NDAs define confidential information as 'any information disclosed by the Disclosing Party' — which is everything, including the weather. Good NDAs require the information to be marked confidential, or to be the kind of thing a reasonable person would treat as confidential. Push for the second. Without that limit, you're agreeing not to discuss anything that came up in the conversation, including ideas you brought yourself.",
    },
    {
      name: "Limit the duration to something reasonable",
      body: "Some NDAs run two years. Some run five. Some run 'in perpetuity,' which is the legal way of writing 'forever.' Forever is almost never appropriate for routine business conversations — trade secrets are a separate category and can be handled by a separate clause. For most exploratory meetings, two to three years is the upper bound. If they ask for more, ask why.",
    },
    {
      name: "Carve out the obvious exceptions",
      body: "Make sure the NDA explicitly excludes: information that's already public, information you already knew before the conversation, information you develop independently without using theirs, and information you're legally required to disclose. These exceptions exist in most templates, but not all of them. If they're missing, you've technically signed an agreement that you can be sued for repeating something you read in a newspaper.",
    },
    {
      name: "Watch for non-solicit and non-compete sneaking in",
      body: "An NDA is supposed to govern information. Some templates quietly include clauses that prevent you from hiring the other side's employees, working with their competitors, or pursuing similar business opportunities — none of which are confidentiality. Read the headings. If you see 'non-solicitation,' 'non-circumvention,' or 'non-compete' in a document called an NDA, you're being asked to agree to substantially more than the title suggests.",
    },
    {
      name: "Sign the right copy",
      body: "If you redline a document and send it back, the other side will sometimes 'accept your changes' and circulate a clean version. Read the clean version. Make sure your changes are actually in it. The most common NDA dispute isn't about a clause — it's about whose version got signed. Sign the document with your edits visible, or sign a clean version you've personally diffed against your redline. Trust, but verify.",
    },
  ],

  callout: {
    afterStep: 2,
    scriptedLine: "Happy to sign — I just want to suggest two small changes to the standard form, the duration and the definition of confidential information. Can I send a redline back this afternoon?",
    explanation: "This works because it signals readiness to sign while flagging two specific, reasonable edits. Most counterparties expect minor redlines on a standard NDA and will accept them without pushback; the ones who don't are telling you something useful about how the rest of the deal will go.",
  },

  cta: {
    glyph:    '🗡',
    headline: "Redline the NDA in five minutes, not five hours",
    body:     "Paste the document and Jargon Assassin flags the four overreach clauses, generates suggested redlines with the exact alternative language, and tells you what's standard versus aggressive for an NDA of this type.",
    features: [
      "Four-clause analysis",
      "Suggested redlines",
      "Standard-vs-aggressive comparison",
      "Plain-language translation",
      "Negotiation strategy",
    ],
    toolId:   'JargonAssassin',
    toolName: 'Jargon Assassin',
  },
};
