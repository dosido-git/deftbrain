module.exports = {
  slug:          'how-to-see-the-real-structure-of-a-complex-document',
  category:      'workplace',
  categoryLabel: 'Workplace',
  title:         "How to see the real structure of a complex document",
  titleHtml:     "How to see <em>the real structure</em> of a complex document",
  shortTitle:    "Real structure of documents",
  navTitle:      "real structure of documents",
  description:   "A method for figuring out the architecture of a long, complex document — what each section is actually doing, which parts are load-bearing, and which parts are filler.",
  deck:          "A method for figuring out the architecture of a long, complex document — what each section is actually doing, which parts are load-bearing, and which parts are filler.",
  ledes: [
    `The document is forty pages long. It has a table of contents. The table of contents lists twenty-three sections with vague titles like 'General Provisions' and 'Definitions and Interpretations.' You have read four sections and you cannot remember what any of them said, because you were reading without knowing how the sections related to each other or which ones actually mattered.\n\nMost long documents have a hidden architecture — a set of load-bearing sections that contain the real content, surrounded by sections that are boilerplate, definitional, or formal. Until you can see the architecture, every page feels equally important, and you have to read all of them with the same care, which is exhausting and largely a waste.`,
    `Here is how to see the real structure of a complex document, so you can read what matters and skim what does not.`,
  ],
  steps: [
    { name: 'Map the document before reading it', body: 'Open the document and skim the table of contents. Read the section headings. Then skim the first sentence of each section to see what it actually does. You are not reading for content — you are mapping. After ten or fifteen minutes, you should have a rough mental picture of how the document is structured: what comes first, what comes next, what depends on what. Reading without this map is reading blind. The map takes minutes and saves hours.' },
    { name: 'Identify the boilerplate sections and demote them', body: 'Most documents contain a substantial percentage of boilerplate — sections that exist for legal or formal reasons but contain no decisions or new information. \'Definitions.\' \'Governing law.\' \'Severability.\' \'Notices.\' These sections are necessary in the document but rarely contain anything you need to engage with. Once you can identify them, you can give them thirty seconds each and move on. Boilerplate is a category, not a clue, and you do not need to read it carefully.' },
    { name: 'Find the substantive sections and read those carefully', body: 'After demoting boilerplate, what is left is the substantive content — the parts where decisions are made, obligations are defined, scope is set. These sections deserve careful attention. They are usually a small fraction of the document — maybe 20-40%. The trick is identifying them. Look for sections with proper nouns, specific numbers, conditional language (\'if,\' \'unless,\' \'in the event of\'). Those are usually the substantive parts. The rest is wrapping.' },
    { name: 'Notice cross-references and follow them', body: 'Complex documents often have load-bearing cross-references. \'Subject to Section 8.4.\' \'As defined in Schedule A.\' \'Notwithstanding Section 12.\' These references are not decoration — they are the connective tissue. When you encounter one, follow it. Read the referenced section. The document only makes sense when you trace the references; reading linearly without following them is reading a partial document. The cross-references are how the document is actually wired.' },
    { name: 'Write the document\'s argument in three sentences', body: 'After mapping and reading the substantive sections, write the document\'s content in three sentences of your own. \'This is a contract that obligates X to do Y by Z date in exchange for W payment.\' \'This is a study that found A causes B in the presence of C.\' If you cannot do this, you have not understood the document. The three-sentence summary is the test of comprehension. Most readers stop at having read the words. Comprehension means being able to reproduce the architecture in plain language.' }
  ],
  cta: {
    glyph:    '🔍',
    headline: "See through any text.",
    body:     "Paste any document — a contract, a research paper, a medical form, a corporate memo — and PlainTalk gives you two things: a plain-English translation, and a structural X-ray showing how the text is built. It surfaces obligations, deadlines, hidden asymmetries, and the parts that actually matter.",
    features: [
      "Plain-English translation of any document, any length",
      "Structural X-ray showing how the text is architecturally built",
      "Side-by-side view to compare original to translation",
      "Auto-detects document type and adapts the analysis"
    ],
    toolId:   'PlainTalk',
    toolName: 'PlainTalk — Document Analyst',
  },
  published: '2026-04-29',
  modified:  '2026-04-29',
};
