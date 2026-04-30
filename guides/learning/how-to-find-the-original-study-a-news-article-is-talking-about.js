module.exports = {
  slug:          'how-to-find-the-original-study-a-news-article-is-talking-about',
  category:      'learning',
  categoryLabel: 'Learning',
  title:         "How to Find the Original Study a News Article Is Talking About",
  titleHtml:     "How to Find <em>the Original Study</em> a News Article Is Talking About",
  shortTitle:    "Find the Source Paper",
  navTitle:      "find the original study",
  description:   "News articles rarely link directly to the studies they cite. Here is how to find the actual paper in under five minutes — and what to do when the article does not name the study.",
  deck:          "News articles rarely link directly to the studies they cite. Here is how to find the actual paper in under five minutes — and what to do when the article does not name the study.",
  ledes: [
    `You read an article that confidently summarizes a study. You want to look at the study yourself. There is no link. No DOI. The article quotes "researchers at a university" and names one author in passing. You search for ten minutes and either find nothing or find a different paper that turns out not to be the one cited.\n\nThis is on purpose, sometimes — many publications do not link out — and accidental other times. Either way, you can usually find the original paper in three to five minutes once you know where to look. The skill is not research; it is just three good search moves and one fallback.`,
    `Here are the moves — and how Research Decoder runs the search for you.`,
  ],
  steps: [
    { name: 'Search for the lead author plus a key term from the article', body: 'Most articles name at least one author. Combine that name with the most specific keyword from the article — the disease, the variable, the place. Run that search on Google Scholar or PubMed. If the article said "Dr. Patel found that vitamin D supplementation reduced X," search "Patel vitamin D X" on Scholar. The right paper is usually on the first page of results.' },
    { name: 'Check the journal name in the article', body: 'Many articles mention the journal — "published this week in The Lancet" or "in JAMA Pediatrics." Search the journal\'s site directly for the topic in their recent issues. The "current issue" or "latest articles" section usually surfaces papers within hours of news coverage. A journal name plus a topic almost always finds the paper.' },
    { name: 'Try searching the press release the article is based on', body: 'Many news articles are barely-reworded versions of press releases from the university or the journal. Search for the exact distinctive phrase from the article — like a quoted statistic — in quotation marks. Often you find the press release, which usually links to the paper directly. EurekAlert and the university\'s news page are good places to check.' },
    { name: 'When the article is too vague, use the date and topic to search recent papers', body: 'Sometimes the article gives you nothing but a date and a topic. Run a Google Scholar search restricted to the past month with the topic. Sort by relevance. Even if the article was deliberately unspecific, a paper matching its claims usually shows up. If multiple papers could match, the one with the larger sample size or the more prominent journal is usually the one being covered.' },
    { name: 'Use Research Decoder to find and decode the paper in one step', body: 'Paste the news article URL into Research Decoder. It identifies the underlying paper, retrieves the abstract, and runs Media Check against the article. You go from "vague news article" to "actual paper plus an analysis of how the article reported it" in one move. The skill it replaces is the half hour you would have spent searching and comparing manually.' }
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
