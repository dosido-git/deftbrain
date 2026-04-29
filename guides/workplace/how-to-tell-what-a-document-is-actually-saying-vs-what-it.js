// ============================================================
// guides/workplace/how-to-tell-what-a-document-is-actually-saying-vs-what-it.js
// ============================================================

module.exports = {
  slug:          'how-to-tell-what-a-document-is-actually-saying-vs-what-it',
  category:      'workplace',
  categoryLabel: 'Workplace',

  title:         "How to Tell What a Document Is Actually Saying (vs. What It Sounds Like)",
  titleHtml:     "How to Tell What a Document Is Actually Saying <em>(vs. What It Sounds Like)</em>",
  shortTitle:    "What a Document Is Actually Saying",
  navTitle:      "How to tell what a document is actually saying versus what it sounds like",

  description:   "Some documents are designed to read favorably and decide unfavorably. Here's how to read past the tone and find what the words actually commit to — or don't.",
  deck:          "Some documents are designed to read favorably and decide unfavorably. Here's how to read past the tone and find what the words actually commit to — or don't.",

  published:     '2026-04-28',
  modified:      '2026-04-28',

  ledes: [
    `You finished reading the document and your overall impression is positive. The tone was warm. The conclusions sounded reasonable. There were no obvious red flags. Three weeks later something happens that the document seemingly addressed, and you discover that what you thought it said is not what it actually said. The favorable reading wasn't an accident — it was the design. The document was written to leave a feeling, not a commitment.`,
    `Reading past tone is one of the most undertaught skills in professional life. Documents can sound supportive while committing to nothing; they can sound firm while leaving the writer enormous room to maneuver. The skill isn't suspicion — it's parsing. Five moves that surface the actual content. Here they are.`,
  ],

  steps: [
    {
      name: "Separate verbs of doing from verbs of intending",
      body: "'We will deliver,' 'we are committed to delivering,' 'we intend to deliver,' and 'we are working toward delivery' all sound similar. They are not similar. The first is a commitment; the others are increasingly rhetorical postures. When a document sounds firm, check whether the verbs are actually firm. The shift from 'will' to 'intend' is where commitments quietly evaporate.",
    },
    {
      name: "Underline every modal verb",
      body: "May, might, could, should, would, shall — these are modal verbs, and they're where wiggle room hides. 'Funds shall be released within 30 days' is a commitment. 'Funds may be released' is a hope. Documents drift toward modal language wherever the writer doesn't want to be pinned down. Underline every one in the document; the cluster pattern shows you where the document is pretending to commit.",
    },
    {
      name: "Find the conditions hidden in subordinate clauses",
      body: "A subordinate clause attached to a strong statement usually undoes the strong statement. 'You'll receive a refund' becomes a different promise when extended to 'You'll receive a refund, provided that the request is submitted within 14 days, the original packaging is intact, and the merchant determines the return is eligible.' The conditions matter more than the headline. The document's tone lives in the headline; the document's actual content lives in the conditions.",
    },
    {
      name: "Notice what isn't denied",
      body: "Documents often handle awkward topics by addressing them carefully without denying them. 'We have no current plans to raise prices' is doing different work than 'we will not raise prices.' 'We do not require this' is different from 'we cannot require this.' When a sensitive topic is handled with notably soft language, that's almost always because the firm version isn't true. The non-denial is the answer.",
    },
    {
      name: "Read the silence in the document",
      body: "What a document doesn't address is sometimes more meaningful than what it does. A performance review that emphasizes growth and is silent on results. A proposal that lists capabilities but doesn't mention timeline. A statement that addresses everything except the specific concern raised. The silence is a signal. Make a list of the questions a complete document would answer; check what's been left off; that's usually where the document is hiding the answer it doesn't want to write.",
    },
  ],

  cta: {
    glyph:    '🔍',
    headline: "Hear what the document is actually saying",
    body:     "PlainTalk parses commitments versus intentions, surfaces every modal-verb hedge, extracts the conditions buried in subordinate clauses, and flags the questions the document doesn't address — so you read content, not tone.",
    features: [
      "Commitment-vs-hedge analysis",
      "Modal verb mapping",
      "Hidden condition extraction",
      "Non-denial detection",
      "Silence-and-omission flagging",
    ],
    toolId:   'PlainTalk',
    toolName: 'PlainTalk',
  },
};
