module.exports = {
  slug:          'is-this-health-claim-actually-backed-by-evidence',
  category:      'decisions',
  categoryLabel: 'Decisions',
  title:         "Is This Health Claim Actually Backed by Evidence?",
  titleHtml:     "Is This Health Claim <em>Actually Backed by Evidence?</em>",
  shortTitle:    "Backed by Evidence?",
  navTitle:      "is the evidence real",
  description:   "A confident claim is not the same as a well-evidenced one. Here is how to tell when a health claim is supported by real science, when it is hype, and when it is somewhere in between.",
  deck:          "A confident claim is not the same as a well-evidenced one. Here is how to tell when a health claim is supported by real science, when it is hype, and when it is somewhere in between.",
  ledes: [
    `Somebody on a podcast tells you that cold plunges reduce inflammation. A wellness account says fasting prevents disease. A bestseller claims a specific supplement reverses aging. Each comes with citations, confident phrasing, and a study or two backing it up. You suspect some of this is true and some is not, and you cannot tell which is which without spending a weekend reading.\n\nClaims have a strength-of-evidence spectrum. At one end: well-replicated findings backed by large trials and consensus across independent research groups. At the other: a single small study, often with conflicts of interest, that has been amplified far past what it can support. Most health claims you encounter are somewhere in the middle, and the middle is where mistakes happen.`,
    `Here is how to evaluate the strength quickly — and how Signal vs Noise rates it for you.`,
  ],
  steps: [
    { name: 'Look for replication, not just citation', body: 'A claim with one supporting study is a hypothesis. A claim with five independent studies showing the same thing is evidence. Citation count is not the same — one study can be cited a thousand times and still not have been replicated. The question to ask is: how many independent research groups have tested this and found the same thing? If the answer is one or zero, downgrade your confidence regardless of how loud the claim is.' },
    { name: 'Distinguish association from causation in the original studies', body: 'Most health studies are observational — they find that people who do X tend to have Y. They cannot show that X causes Y. A claim like \'eating walnuts reduces heart attacks\' from observational data is consistent with reality and also consistent with \'people who eat walnuts also do other things that reduce heart attacks.\' Real causal evidence comes from randomized trials. If the underlying study is observational and the claim is causal, the claim has been overstated.' },
    { name: 'Check the size of the effect, not just the existence', body: 'A claim that \'X reduces risk of Y\' could mean a 50% reduction or a 2% reduction. The first might change behavior; the second probably should not. Drill into the actual numbers — relative risk reduction, absolute risk reduction, hazard ratio. Wellness coverage usually quotes the most flattering version (relative). The absolute number is often unimpressive even when the study is real. Effect size is the part most people skip.' },
    { name: 'Note who has financial interest in the claim', body: 'Studies funded by industries with a stake in the outcome are more likely to find the favorable result. This does not mean they are wrong — but it means they should be weighted carefully. The cold plunge industry, the supplement industry, and parts of the wellness influencer economy all have monetary reasons to amplify thin evidence. Independent funding plus consistent findings is the gold standard. Industry-funded plus a single study is the shakiest version.' },
    { name: 'Use Signal vs Noise to get the strength rating in one step', body: 'Drop the claim into Signal vs Noise. The output gives you a strength-of-evidence rating, the actual studies behind the claim, where the research community stands, and which parts of the claim are well-supported versus exaggerated. It does in two minutes what would take a careful reader two hours. The rating is the answer to \'should I update my behavior on this?\'' }
  ],
  cta: {
    glyph:    '📡',
    headline: "Cut through the noise. See what the evidence actually says.",
    body:     "Drop in any health, wellness, finance, or productivity claim and Signal vs Noise tells you what the actual evidence shows, where the consensus is, who disagrees, and how strong the case is.",
    features: [
      "Strength-of-evidence rating",
      "Who agrees, who disagrees, why",
      "Catches misleading marketing dressed as science",
      "Plain-language summary"
    ],
    toolId:   'SignalVsNoise',
    toolName: 'Signal vs. Noise',
  },
  published: '2026-04-29',
  modified:  '2026-04-29',
};
