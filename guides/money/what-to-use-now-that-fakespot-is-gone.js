module.exports = {
  "slug": "what-to-use-now-that-fakespot-is-gone",
  "category": "money",
  "categoryLabel": "Money",
  "title": "What to Use Now That Fakespot Is Gone",
  "titleHtml": "What to Use Now That <em>Fakespot</em> Is Gone",
  "shortTitle": "What to Use Now That Fakespot Is Gone",
  "navTitle": "What to use now that Fakespot is gone",
  "description": "What to use now that Fakespot is gone: what actually replaced it, which extensions to be wary of, and a two-minute manual check for fake reviews.",
  "deck": "Mozilla shut down Fakespot in 2025, and no free tool now gives the same one-glance grade. Check any replacement extension before installing it, and use a quick manual check on any site: read the most recent and lowest-rated reviews, look for bursts, and confirm reviews are about this exact product.",
  "answerList": [
    "Fakespot shut down in 2025; no free tool gives the same quick grade.",
    "Check any replacement extension before trusting it.",
    "Sort by most recent and read those first.",
    "Read the one- and two-star reviews.",
    "Check the reviews are about this exact product, not a merged listing."
  ],
  "ledes": [
    "Fakespot, a review-analysis service Mozilla acquired in 2023, was discontinued in 2025: Mozilla retired Firefox's built-in Review Checker on June 10, 2025, and Fakespot's website, apps and extensions stopped working on July 1, 2025, saying the product 'didn't fit a model we could sustain.' Without it, the FTC's advice still applies: read reviews from several sources, check reviewers' histories, watch for bursts of reviews, and don't rely on star ratings alone.",
    "If you were used to glancing at a letter grade before trusting a product's reviews, that habit stopped working. Here's what the service actually did, what to watch for in replacements, and the manual check that doesn't depend on any tool staying online."
  ],
  "steps": [
    {
      "name": "What did Fakespot actually do?",
      "body": "Fakespot did two separable jobs. The first was pattern analysis: scanning a review corpus for the statistical fingerprints of manipulation — implausible timing clusters, reviewer accounts with no other history, language that repeats across supposedly independent reviews, ratings distributions that don't look like real human opinion. The second was delivery: a browser extension that put a grade on the page you were already looking at, at the moment you were deciding. When people say they miss Fakespot, they almost always mean the second job. The analysis is reproducible — any careful reader or capable tool can do it. The zero-effort, in-page delivery is the part that's genuinely hard to replace, because it depends on someone maintaining an extension against retailers who don't want it there. Knowing which half you're replacing keeps you from being disappointed by a tool that does the analysis well but asks you to paste text into it."
    },
    {
      "name": "Does ReviewMeta still work?",
      "body": "ReviewMeta was the other well-known name in this category, with an approach many people preferred: it re-computed an adjusted rating after discarding reviews it judged unnatural, rather than issuing a letter grade. It has had periods of being unmaintained and periods of being partially functional, and its coverage was always narrower than Fakespot's. Treat it as worth ten seconds of checking rather than a dependable habit — load it, try one product you know well, and see whether the result looks sane before you trust it on a purchase that matters. This is good practice for every tool in this category: the failure mode is not a tool that gives wrong answers loudly, it's one that quietly stopped updating two years ago and now returns confident nonsense."
    },
    {
      "name": "Are Fakespot replacement extensions safe to use?",
      "body": "A vacuum this visible attracts filler. In the months after the shutdown, a crop of extensions and sites appeared promising Fakespot-style grading. Some are honest efforts; others are affiliate operations where the 'analysis' exists to funnel you toward whatever product pays the referral, or data-collection plays where a browser extension that reads every page you visit is the actual product and the review grade is the excuse. Two questions filter most of it: does the tool tell you how it reaches its verdict, and does it ever say 'these reviews look fine'? A grader that finds something suspicious about everything is either broken or selling something. A grader that won't explain its reasoning can't be checked, which means it can't be trusted on the purchase where it matters most."
    },
    {
      "name": "How can you check reviews without Fakespot?",
      "body": "The manual version takes about two minutes and never gets discontinued. First, sort by most recent and read those, not the top-rated ones — manipulation is usually a campaign, and campaigns have dates. Second, look for timing clusters: dozens of five-star reviews inside a few days, especially near the listing's launch or right after a run of bad ones, is the single strongest signal available to a human reader. Third, click through two or three glowing reviewers and check whether they have any other review history, or whether their history is thirty five-star reviews of unrelated cheap products. Fourth, read the three-star reviews — they are the least worth faking in either direction, and they are where the real defects get described in specific, unenthusiastic detail. If those four checks come back clean, the review section is probably honest. If two or more look wrong, treat the rating as decoration."
    },
    {
      "name": "Why don't reviews always match the product you're buying?",
      "body": "Sometimes reviews are genuine but not about the item in your cart. A listing can combine several sizes, models or versions, and some sellers attach a new or different item to an existing listing with many positive reviews. Every review may be real; few may describe what you'd receive. The tell is in the text: reviewers describing a color, capacity or use that doesn't match what's on sale, or complaining that what arrived isn't what the reviews describe. Automated tools were never good at catching this; reading is."
    }
  ],
  "callout": {
    "afterStep": 3,
    "scriptedLine": "Sort by most recent → scan for date clusters → click two five-star reviewers → read the three-star reviews.",
    "explanation": "That's the whole manual method, in the order that finds problems fastest. It works on any marketplace, needs no extension, survives every tool shutdown, and catches the two things automated graders miss entirely: merged listings and very recent campaigns that a cached analysis hasn't seen yet. Run it before any purchase big enough that returning the item would annoy you."
  },
  "sources": [
    {
      "label": "Mozilla Blog: Investing in what moves the internet forward",
      "url": "https://blog.mozilla.org/en/mozilla/building-whats-next/"
    },
    {
      "label": "FTC Consumer Advice: How To Evaluate Online Reviews",
      "url": "https://www.consumer.ftc.gov/articles/how-evaluate-online-reviews"
    }
  ],
  "cta": {
    "glyph": "🔍",
    "headline": "Paste the reviews, get the analysis Fakespot used to do",
    "body": "Fake Review Detective runs the pattern analysis on a set of reviews you paste in — timing clusters, reviewer-history red flags, language repetition, ratings distribution — and tells you which specific reviews look manufactured and why, rather than issuing a grade you can't interrogate. It's free, needs no account, and installs nothing in your browser. The trade-off is honest: you paste the reviews instead of getting a badge on the page, and in exchange you get reasoning you can check.",
    "features": [
      "Flags the specific reviews that look manufactured, with the reason for each",
      "Catches timing clusters and reviewer-history patterns — the two strongest human-checkable signals",
      "Says so when the reviews look genuine, instead of finding fault with everything",
      "No extension, no account, nothing reading your browsing",
      "Works on any marketplace's review text, not just the retailers an extension supported"
    ],
    "toolId": "FakeReviewDetective",
    "toolName": "Fake Review Detective"
  },
  "published": "2026-07-29",
  "modified": "2026-10-09",
  "reviewed": true
};
