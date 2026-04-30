module.exports = {
  slug:          'how-to-read-a-research-paper-without-a-phd',
  category:      'learning',
  categoryLabel: 'Learning',
  title:         "How to Read a Research Paper Without a PhD",
  titleHtml:     "How to Read a Research Paper <em>Without a PhD</em>",
  shortTitle:    "Read a Paper",
  navTitle:      "read a research paper",
  description:   "Academic papers are not written for you, but you can extract what you need from one in fifteen minutes if you read in the right order. Here is the order — and what to skip.",
  deck:          "Academic papers are not written for you, but you can extract what you need from one in fifteen minutes if you read in the right order. Here is the order — and what to skip.",
  ledes: [
    `You found a paper that might answer your question. You open the PDF and there are 28 pages, six tables, two pages of references, and an abstract that uses the word "heterogeneity" three times in the first sentence. Your instinct is to either start at page one and grind through it, or to give up and rely on whatever some news article said about it.\n\nNeither is necessary. Researchers do not read papers from page one — they read in a specific order that extracts the actual content in fifteen minutes. The structure of academic papers is consistent enough that the same shortcut works for almost any paper. Once you know the order, papers stop being intimidating.`,
    `Here is the reading order — and how Research Decoder gets you the same result faster.`,
  ],
  steps: [
    { name: 'Read the abstract twice, slowly', body: 'The abstract is the entire paper compressed to 200 words. Read it once for the gist. Read it a second time slowly, identifying these four things: what they tested, how they tested it, what they found, and what they claim it means. If the abstract is too jargon-heavy to extract these, the paper itself will be worse — pick a different one or use a tool to translate.' },
    { name: 'Skip the introduction. Go straight to the figures', body: 'The introduction is mostly literature review and motivation — useful context, but not the result. The figures are the result, expressed visually. Look at them in order. Read the captions carefully. The story of the paper is in the figures and you can usually understand it before reading any prose. If the figures are incomprehensible, the writing is unlikely to clarify them.' },
    { name: 'Read the methods section just enough to know what was done', body: 'You do not need to be able to replicate the study. You need to know roughly: what kind of study (lab, observational, randomized trial, computational), how many participants or samples, what measurement, over what time. Five sentences of methods are enough for a non-specialist read. The methods section is where bad studies hide their problems — small samples, short follow-up, weird outcome measures.' },
    { name: 'Read the discussion for limitations, not for conclusions', body: 'The conclusion section is the authors marketing their own paper. The limitations section is them admitting where it falls short. Read the limitations section carefully — it tells you when not to trust the headline finding. Authors are usually honest here because reviewers force them to be. The discussion is a buyer-beware section, not a summary.' },
    { name: 'Use Research Decoder to do all of this in two minutes', body: 'Drop the paper into Research Decoder and pick Digest mode. You get the one-sentence finding, the methodology summary, the actual limitations, the decoded jargon, and an honest "so what" assessment. It is the same output a careful 15-minute read would produce, in a fraction of the time, and it does not skip the limitations section the way most people do when reading on their own.' }
  ],
  cta: {
    glyph:    '📄',
    headline: "Read the paper, not just the headline.",
    body:     "Paste a paper URL, abstract, or PDF and Research Decoder gives you the one-sentence finding, methodology, limitations, and an honest \"so what\" — plus a Media Check that flags how the news got it wrong.",
    features: [
      "Plain-language summary",
      "Methodology and limitations",
      "Media Check vs the headlines",
      "Auto-built jargon dictionary"
    ],
    toolId:   'ResearchDecoder',
    toolName: 'Research Decoder',
  },
  published: '2026-04-29',
  modified:  '2026-04-29',
};
