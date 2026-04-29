// ============================================================
// guides/workplace/how-to-understand-a-document-written-in-academic-jargon.js
// ============================================================

module.exports = {
  slug:          'how-to-understand-a-document-written-in-academic-jargon',
  category:      'workplace',
  categoryLabel: 'Workplace',

  title:         "How to Understand a Document Written in Academic Jargon",
  titleHtml:     "How to Understand a Document <em>Written in Academic Jargon</em>",
  shortTitle:    "Read Academic Jargon",
  navTitle:      "How to understand a document written in academic jargon",

  description:   "Academic writing is dense by training, not by accident. Here's how to read papers, abstracts, and reports written in academic register — and find the actual finding underneath.",
  deck:          "Academic writing is dense by training, not by accident. Here's how to read papers, abstracts, and reports written in academic register — and find the actual finding underneath.",

  published:     '2026-04-28',
  modified:      '2026-04-28',

  ledes: [
    `You're trying to read a paper. The abstract has six sentences, and each one contains roughly four pieces of information you need to understand to parse the next one. The first sentence references something called 'top-down attentional modulation,' which you don't know, and now you've spent ten minutes opening tabs to define terms instead of reading the actual paper. The paper might be saying something simple. You may never find out.`,
    `Academic writing is dense by training, not by accident. The conventions of the form make it nearly impossible to read casually — but the actual findings underneath are usually communicable in a paragraph or two. The skill is knowing where to look and what to skip. Five moves that translate the form back into prose.`,
  ],

  steps: [
    {
      name: "Read the abstract last, not first",
      body: "Counterintuitive but true. The abstract is the most compressed, most jargon-dense paragraph in the entire paper — designed to fit a maximum of meaning in 250 words for an audience that already speaks the field's language. Reading it first, cold, is the worst possible entry point. Skip it. Go to the introduction's last paragraph, where the authors usually state their finding in plainer language. Then come back to the abstract once you know what it's compressing.",
    },
    {
      name: "Find the figure that summarizes the result",
      body: "Most empirical papers have one figure that does the heavy lifting — the chart, the diagram, or the table that visually presents the central finding. Find it and read its caption. Often, that single figure plus its caption is roughly equivalent to reading the entire results section. The text around it is mostly methodological detail and statistical reporting; the figure is the finding.",
    },
    {
      name: "Translate the technical terms only as needed",
      body: "Don't try to define every unfamiliar term as you encounter it. Read past the term, see if the meaning is recoverable from context, and only stop to look it up if you genuinely can't follow without it. Academic prose is intentionally referential — terms point to bodies of literature you're not expected to recreate from scratch. The goal is to follow the argument, not to master the field. Most terms can be translated functionally without their full literature.",
    },
    {
      name: "Read the discussion to see what authors think",
      body: "The results section reports the data; the discussion section interprets it. The interpretation is where the authors say what they think the finding actually means, including its limits and its implications. This is also where you can tell whether the paper is overclaiming — when discussion language is much stronger than the data warrants, the authors are reaching, and the rest of the paper should be read with that calibration in mind.",
    },
    {
      name: "Watch for hedging language in the conclusions",
      body: "Academic writing has a complete vocabulary for hedging — 'suggests,' 'may indicate,' 'is consistent with,' 'we propose,' 'further research is needed.' These phrases sound technical but they're communicative: the authors are telling you how confident they are. A paper whose conclusions are full of strong claims is either an exception or a paper that's overclaiming. Most careful papers hedge in the conclusion. Read the hedges; they tell you how much weight to put on the finding.",
    },
  ],

  cta: {
    glyph:    '🔍',
    headline: "Translate the paper into the actual finding",
    body:     "PlainTalk parses academic papers and reports — abstract, methods, results, discussion — and produces a plain-language translation that surfaces the central finding, the strength of the evidence, and the authors' actual hedges.",
    features: [
      "Plain-language translation",
      "Central-finding extraction",
      "Hedging-language analysis",
      "Glossary of technical terms",
      "Reading-level controls",
    ],
    toolId:   'PlainTalk',
    toolName: 'PlainTalk',
  },
};
