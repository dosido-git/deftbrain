module.exports = {
  slug:          'how-to-spot-fake-amazon-reviews',
  category:      'money',
  categoryLabel: 'Money',
  title:         "How to Spot Fake Amazon Reviews",
  titleHtml:     "How to Spot Fake <em>Amazon Reviews</em>",
  shortTitle:    "Spot Fake Amazon Reviews",
  navTitle:      "spot fake amazon reviews",
  description:   "Fake reviews follow patterns. Once you can see them, the real review pool is much smaller — and the product is much clearer.",
  deck:          "Fake reviews follow patterns. Once you can see them, the real review pool is much smaller — and the product is much clearer.",
  ledes: [
    `You're looking at a product with 4,200 five-star reviews. The number feels like proof. Then you start reading and something is off — review after review with the same praise, the same length, the same suspiciously enthusiastic phrasing. Some are fake; you can't tell which. The five-star average isn't lying exactly, but it's not telling you the thing you wanted to know either, which is whether this product will work for you.`,
    `Fake reviews follow patterns, and once you can see them, the real review pool is much smaller and much clearer. Below are five tells that work across categories — they apply to Amazon, but the same patterns show up everywhere reviews can be gamed.`,
  ],
  steps: [
    { name: 'Look at the review distribution shape, not the average', body: 'Real products produce a J-shaped review distribution: lots of 5-stars, some 4s, fewer 3s, and a small but real tail of 1- and 2-stars from people who hated it. Fake-pumped products show a U-shape — huge five-star spike, very few middle reviews, sometimes a small one-star tail from real angry buyers. If the distribution is mostly 5s and 1s with almost nothing in between, the 5s are doing too much work. Look at the bar chart, not the average.' },
    { name: 'Check the timing of the reviews', body: 'Sort reviews by date. Real products accumulate reviews over months and years at a steady pace. Fake-pumped products show clusters: 200 reviews in a single week, then nothing, then another cluster. These spikes line up with paid review campaigns. If a product has 1,000 reviews and 700 of them came in two windows three months apart, the math is wrong for organic adoption. The shape over time tells you what the average won\'t.' },
    { name: 'Read the lowest-rated reviews first', body: 'Skip the five-stars and read the one- and two-star reviews carefully. These are usually real (people don\'t fake negative reviews — they fake positive ones). Look for specific failure modes: the zipper broke, the cable shorted, the smell was overwhelming, the size was wrong. If the negative reviews describe a real, specific problem multiple times, that problem is real regardless of the average. The negatives are a more honest signal than the positives.' },
    { name: 'Search for copy-pasted phrases', body: 'Pick a distinctive phrase from a five-star review — "truly exceeded my expectations" or "this is a game-changer" — and search for it across the review section. If the same phrase appears in many reviews on the same product, you\'ve caught a fake-review template. Real customers don\'t independently use the same five-word praise. Other tells in this category: the same name dropped repeatedly, the same competitor product mentioned by name, the same usage scenario described in identical detail.' },
    { name: 'Check what the reviewer\'s other reviews look like', body: 'Click on a five-star reviewer and look at their other reviews. Real reviewers have a mix: some products they loved, some they didn\'t, normal categories, normal lifestyle. Fake reviewers have patterns that give them away — only ever five-star reviews, dozens of reviews in unrelated categories within the same week, the same writing style on radically different products. Two minutes spent on the reviewer\'s profile is more diagnostic than ten minutes on the product page.' }
  ],
  cta: {
    glyph:    '🕵️',
    headline: "See past the fake five-stars",
    body:     "Fake Review Detective scans the patterns — distribution shape, timing clusters, copy-pasted phrases, reviewer history — and tells you what the real review pool looks like.",
    features: [
      "Distribution analysis",
      "Timing-cluster detection",
      "Phrase-match scanning",
      "Reviewer-history check",
      "Real-review extraction"
    ],
    toolId:   'FakeReviewDetective',
    toolName: 'Fake Review Detective',
  },
  published: '2026-04-29',
  modified:  '2026-04-29',
};
