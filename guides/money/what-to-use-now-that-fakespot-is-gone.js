// ============================================================
// guide-specs/money/what-to-use-now-that-fakespot-is-gone.js
// ============================================================
// Source of truth for /guides/money/what-to-use-now-that-fakespot-is-gone.
// Edit here; run `node scripts/build-guides.js money` to regenerate.
// ============================================================
// COMPARISON GUIDE (first of its kind here, 2026-07-29). Targets the query
// intent "fakespot alternative / fakespot shut down" — a real audience with a
// dead incumbent, distinct from the existing how-to-spot-fake-reviews guides.
// Facts verified 2026-07-29: Mozilla acquired Fakespot 2023; Firefox Review
// Checker retired 2025-06-10; extensions/apps/site went dark 2025-07-01.
// Do NOT restate those dates without re-checking them.
// ============================================================

module.exports = {
  slug:          'what-to-use-now-that-fakespot-is-gone',
  category:      'money',
  categoryLabel: 'Money',

  title:         "What to Use Now That Fakespot Is Gone",
  titleHtml:     "What to Use Now That <em>Fakespot</em> Is Gone",
  shortTitle:    "What to Use Now That Fakespot Is Gone",
  navTitle:      "What to use now that Fakespot is gone",

  description:   "Mozilla retired Fakespot in mid-2025, and the grade-the-page browser extension model went with it. Here's what actually replaced it, what didn't, and how to judge a review section yourself in about two minutes.",
  deck:          "Mozilla retired Fakespot in mid-2025, and the grade-the-page browser extension model went with it. Here's what actually replaced it, what didn't, and how to judge a review section yourself in about two minutes.",

  published:     '2026-07-29',
  modified:      '2026-07-29',

  ledes: [
    `If you got used to glancing at a letter grade before trusting a product's reviews, you've probably noticed that habit stopped working. Mozilla acquired Fakespot in 2023, folded it into Firefox as Review Checker, and then discontinued both: the in-browser Review Checker was retired on June 10, 2025, and the extensions, mobile apps and website went offline on July 1, 2025. Mozilla's explanation was blunt — the products "didn't fit a model we could sustain."`,
    `What's left is a gap with a specific shape. The thing Fakespot did well was fast, low-effort triage: one glance, one grade, decision made. Most of what's marketed as a replacement either doesn't do that, doesn't do it for free, or quietly does something else. Below is an honest map of the options, and — because tool availability keeps changing — the manual version of the same judgment, which nobody can discontinue.`,
  ],

  steps: [
    {
      name: "Understand what actually died, so you replace the right thing",
      body: "Fakespot did two separable jobs. The first was pattern analysis: scanning a review corpus for the statistical fingerprints of manipulation — implausible timing clusters, reviewer accounts with no other history, language that repeats across supposedly independent reviews, ratings distributions that don't look like real human opinion. The second was delivery: a browser extension that put a grade on the page you were already looking at, at the moment you were deciding. When people say they miss Fakespot, they almost always mean the second job. The analysis is reproducible — any careful reader or capable tool can do it. The zero-effort, in-page delivery is the part that's genuinely hard to replace, because it depends on someone maintaining an extension against retailers who don't want it there. Knowing which half you're replacing keeps you from being disappointed by a tool that does the analysis well but asks you to paste text into it.",
    },
    {
      name: "Check whether ReviewMeta still works before you rely on it",
      body: "ReviewMeta was the other well-known name in this category, with an approach many people preferred: it re-computed an adjusted rating after discarding reviews it judged unnatural, rather than issuing a letter grade. It has had periods of being unmaintained and periods of being partially functional, and its coverage was always narrower than Fakespot's. Treat it as worth ten seconds of checking rather than a dependable habit — load it, try one product you know well, and see whether the result looks sane before you trust it on a purchase that matters. This is good practice for every tool in this category: the failure mode is not a tool that gives wrong answers loudly, it's one that quietly stopped updating two years ago and now returns confident nonsense.",
    },
    {
      name: "Be skeptical of the replacement extensions that appeared afterwards",
      body: "A vacuum this visible attracts filler. In the months after the shutdown, a crop of extensions and sites appeared promising Fakespot-style grading. Some are honest efforts; others are affiliate operations where the 'analysis' exists to funnel you toward whatever product pays the referral, or data-collection plays where a browser extension that reads every page you visit is the actual product and the review grade is the excuse. Two questions filter most of it: does the tool tell you how it reaches its verdict, and does it ever say 'these reviews look fine'? A grader that finds something suspicious about everything is either broken or selling something. A grader that won't explain its reasoning can't be checked, which means it can't be trusted on the purchase where it matters most.",
    },
    {
      name: "Learn the four signals that survive any tool going offline",
      body: "The manual version takes about two minutes and never gets discontinued. First, sort by most recent and read those, not the top-rated ones — manipulation is usually a campaign, and campaigns have dates. Second, look for timing clusters: dozens of five-star reviews inside a few days, especially near the listing's launch or right after a run of bad ones, is the single strongest signal available to a human reader. Third, click through two or three glowing reviewers and check whether they have any other review history, or whether their history is thirty five-star reviews of unrelated cheap products. Fourth, read the three-star reviews — they are the least worth faking in either direction, and they are where the real defects get described in specific, unenthusiastic detail. If those four checks come back clean, the review section is probably honest. If two or more look wrong, treat the rating as decoration.",
    },
    {
      name: "Watch for the failure the tools never covered: reviews that are real but not about this product",
      body: "Review merging is now a bigger problem than outright fake reviews on some marketplaces, and no grading extension ever handled it well. A seller attaches a new or different item to an existing listing that already has thousands of positive reviews — a different size, a different model, sometimes a different product category entirely — and inherits the rating. Every review is genuine; none of them are about the thing in your cart. The tell is in the review text: people describing a colour, capacity, or use case that doesn't match what's on sale, or complaining that what arrived isn't what the reviews describe. Automated analysis reads that corpus as healthy, because statistically it is. This one is only catchable by reading, which is a good argument for keeping the manual habit even when a tool is available.",
    },
  ],

  callout: {
    afterStep: 3,
    scriptedLine: "Sort by most recent → scan for date clusters → click two five-star reviewers → read the three-star reviews.",
    explanation: "That's the whole manual method, in the order that finds problems fastest. It works on any marketplace, needs no extension, survives every tool shutdown, and catches the two things automated graders miss entirely: merged listings and very recent campaigns that a cached analysis hasn't seen yet. Run it before any purchase big enough that returning the item would annoy you.",
  },

  cta: {
    glyph:    '🔍',
    headline: "Paste the reviews, get the analysis Fakespot used to do",
    body:     "Fake Review Detective runs the pattern analysis on a set of reviews you paste in — timing clusters, reviewer-history red flags, language repetition, ratings distribution — and tells you which specific reviews look manufactured and why, rather than issuing a grade you can't interrogate. It's free, needs no account, and installs nothing in your browser. The trade-off is honest: you paste the reviews instead of getting a badge on the page, and in exchange you get reasoning you can check.",
    features: [
      "Flags the specific reviews that look manufactured, with the reason for each",
      "Catches timing clusters and reviewer-history patterns — the two strongest human-checkable signals",
      "Says so when the reviews look genuine, instead of finding fault with everything",
      "No extension, no account, nothing reading your browsing",
      "Works on any marketplace's review text, not just the retailers an extension supported",
    ],
    toolId:   'FakeReviewDetective',
    toolName: 'Fake Review Detective',
  },
};
