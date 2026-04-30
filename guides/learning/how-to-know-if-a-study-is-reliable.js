module.exports = {
  slug:          'how-to-know-if-a-study-is-reliable',
  category:      'learning',
  categoryLabel: 'Learning',
  title:         "How to Know If a Study Is Reliable",
  titleHtml:     "How to Know If a Study <em>Is Reliable</em>",
  shortTitle:    "Is a Study Reliable",
  navTitle:      "is a study reliable",
  description:   "Most studies that get headlines should not. Here is how to tell a solid study from a weak one in about three minutes — without needing to be a statistician.",
  deck:          "Most studies that get headlines should not. Here is how to tell a solid study from a weak one in about three minutes — without needing to be a statistician.",
  ledes: [
    `A new study makes the news every day. Coffee is good for you. Coffee is bad for you. Multivitamins do not work. Multivitamins prevent dementia. Each study comes with a confident headline, and you cannot tell from the headline alone whether the study is solid science or a tiny preliminary result that will not replicate.\n\nReliability has tells. Sample size, study type, who funded it, whether the result is huge or modest, whether it has been replicated, who the authors are. None of these requires a statistics background to evaluate at a basic level. Five quick checks will let you separate the solid studies from the noise about 80% of the time.`,
    `Here are the checks — and how Research Decoder runs them automatically.`,
  ],
  steps: [
    { name: 'Check the sample size and study type first', body: 'A study of 23 college students is not the same as a study of 200,000 adults followed for ten years. Small studies can be useful as preliminary evidence, but they should not drive headlines or behavior change. Look for sample size in the abstract or methods. Anything under a few hundred participants for human research deserves skepticism. Lab studies on cells or animals are interesting but rarely apply directly to humans without further work.' },
    { name: 'Check whether the result has been replicated', body: 'A single study showing a striking result is a hypothesis, not a finding. Real findings replicate across multiple studies by different teams using different populations. If the only evidence for a claim is one paper, the claim is provisional even if the paper is high quality. Search for "replication" or "meta-analysis" of the finding before treating it as established. The most-quoted single studies often turn out not to replicate.' },
    { name: 'Look at how big the effect is, not just whether it was statistically significant', body: 'A study can find a "statistically significant" effect that is too small to matter in real life. The headline says coffee reduces risk; the study says it reduces risk by 2 percent. Small effects are real but often not actionable. Look for effect size — the actual percentage difference, the actual hazard ratio, the actual change in score. If the result is statistically significant but the effect is tiny, do not change behavior on it.' },
    { name: 'Check who funded it and whether the framing matches the data', body: 'Industry-funded studies are not automatically wrong but are more likely to overstate effects favoring the industry. Check the funding disclosure — usually at the end. More importantly, check whether the conclusion in the abstract matches what the data actually showed. Many papers have findings that are technically true but framed in misleading ways. The abstract conclusion is marketing; the actual numbers are the evidence.' },
    { name: 'Use Research Decoder for the full reliability check in one pass', body: 'Drop the paper into Research Decoder. The output flags sample size, replication status, effect size, funding sources, and how the framing compares to the data. It will tell you whether this is a solid study you can rely on, a preliminary study to watch, or a weak study you should not change behavior on. The same checks researchers do, faster than you can do them yourself.' }
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
