module.exports = {
  slug:          'how-to-fact-check-a-news-article-that-cites-a-study',
  category:      'learning',
  categoryLabel: 'Learning',
  title:         "How to Fact-Check a News Article That Cites a Study",
  titleHtml:     "How to Fact-Check a News Article <em>That Cites a Study</em>",
  shortTitle:    "Fact-Check the News",
  navTitle:      "fact-check news that cites a study",
  description:   "News articles routinely overstate what a study found. Here is how to find the original paper, compare it to the article, and tell whether you have been told the truth.",
  deck:          "News articles routinely overstate what a study found. Here is how to find the original paper, compare it to the article, and tell whether you have been told the truth.",
  ledes: [
    `A news article tells you that a new study shows X. The phrasing is confident. The headline is bold. The article quotes one of the authors. You believe it, more or less, until two weeks later somebody points out that the study did not actually show X — it showed something narrower and weaker, and the journalist either did not read the paper or did not understand it.\n\nThis happens constantly. The gap between what studies actually find and what headlines claim is often substantial, and you can check it yourself in about ten minutes. The skill is not statistical literacy — it is just knowing how to find the original paper and compare specific claims to specific evidence.`,
    `Here is the process — and how Research Decoder does the comparison automatically.`,
  ],
  steps: [
    { name: 'Find the original paper, not just the press release', body: 'The article should link to the study or at least name it. If it does not, that is a flag — many articles are based on press releases, not on the actual paper. Search for the lead author plus a key term from the article. Most papers are findable on Google Scholar or PubMed. If the only source is a press release with no paper, treat the claim as preliminary at best.' },
    { name: 'Read the abstract — not the news article — to see what was actually claimed', body: 'The abstract is the authors\' own summary of what they found. Compare it to the article. Look specifically for: did the article add words like "proves" or "shows definitively" when the abstract said "suggests" or "is associated with"? Did the article skip the population the study was about? Did it generalize a finding from mice to humans? These translation errors are the most common form of misreporting.' },
    { name: 'Check the size of the effect and the size of the claim', body: 'An article that says "this drug cures the disease" and a study that says "this drug reduced symptom score by 8 percent" are not telling you the same thing. Look at the effect size in the paper and the size of the claim in the article. If the article uses absolute language for a modest effect, you have been misled, even if technically nothing was a lie.' },
    { name: 'Check the population the study was actually done on', body: 'A study on 60-year-old men with heart disease does not apply to 30-year-old healthy women. A study on cells in a dish does not apply to humans yet. A study on rats may or may not apply to humans. The article often loses this nuance — "studies show coffee prevents dementia" when the study was on people who already had risk factors. Check who the participants were and whether you are one of them.' },
    { name: 'Run Research Decoder\'s Media Check', body: 'Drop the paper and the article into Research Decoder\'s Media Check mode. The output highlights specific places where the article overstated, oversimplified, or omitted context — sentence by sentence, with the actual paper text alongside. You see the gap directly. It catches the things you would have to be a very careful reader to catch on your own.' }
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
