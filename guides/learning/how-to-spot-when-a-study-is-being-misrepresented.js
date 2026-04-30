module.exports = {
  slug:          'how-to-spot-when-a-study-is-being-misrepresented',
  category:      'learning',
  categoryLabel: 'Learning',
  title:         "How to Spot When a Study Is Being Misrepresented",
  titleHtml:     "How to Spot When a Study <em>Is Being Misrepresented</em>",
  shortTitle:    "Spot Misrepresentation",
  navTitle:      "spot a misrepresented study",
  description:   "There are about six common ways studies get misrepresented in news, social media, and policy debates. Here are the patterns to watch for.",
  deck:          "There are about six common ways studies get misrepresented in news, social media, and policy debates. Here are the patterns to watch for.",
  ledes: [
    `A friend sends you an article about a study. You half-believe it. Something feels off but you cannot put your finger on it. A week later somebody you trust says the study actually shows something different, and the article was misleading in a specific way. You realize you read it without checking and almost forwarded it.\n\nMost study misrepresentations follow a small number of patterns. Cherry-picked outcomes. Generalizing from a narrow sample. Confusing correlation and causation in the headline. Burying limitations. Mistranslating "associated with" into "causes." Once you can spot the patterns, you stop falling for them — and you can call them out when you see them.`,
    `Here are the most common patterns — and how Research Decoder names them when it sees them.`,
  ],
  steps: [
    { name: 'Watch for "associated with" becoming "causes"', body: 'The phrase "associated with" in a paper means correlation. The paper found that two things tend to occur together. It does not mean one causes the other. News articles routinely upgrade "associated with" to "causes" in the headline. If the paper said "X was associated with Y" and the article says "X causes Y," you have caught a misrepresentation. The vast majority of observational studies cannot establish causation.' },
    { name: 'Watch for generalization beyond the population studied', body: 'A study on 200 men in their 40s does not tell you about women, children, or older adults. The paper will say so explicitly. The article almost never carries that caveat. If the headline says "exercise prevents diabetes" and the study was on a specific subgroup, the headline has overgeneralized. Check the inclusion criteria in the methods section and ask: is this group like the people the article is talking to?' },
    { name: 'Watch for cherry-picked outcomes', body: 'Some studies measure many outcomes and headline the one that turned out positive. The paper will list several measurements. If the abstract emphasizes one finding while the rest were null or negative, the result may be a fluke. Multiple comparisons means some will be statistically significant by chance. The paper itself often acknowledges this in the limitations; the news article rarely does.' },
    { name: 'Watch for buried limitations getting amplified out of the article', body: 'Real papers list their limitations honestly: small sample, short follow-up, self-reported data, animal model not human, single site. News articles routinely strip these out. If the paper said "in a small preliminary study, in mice" and the article says "scientists discover," the limitations have been buried. Open the paper and look at the limitations section — what did the authors themselves say not to overinterpret?' },
    { name: 'Use Research Decoder\'s Media Check to surface patterns automatically', body: 'Research Decoder\'s Media Check compares the actual paper to the news article and labels the specific misrepresentation when it finds one — "this article generalized from a small sample," "this headline upgraded correlation to causation," "this paragraph dropped the limitations the authors flagged." You see exactly which sentence broke from the paper. Faster and more thorough than catching it sentence by sentence on your own.' }
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
