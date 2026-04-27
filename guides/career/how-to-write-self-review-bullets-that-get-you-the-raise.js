// ============================================================
// guide-specs/career/how-to-write-self-review-bullets-that-get-you-the-raise.js
// ============================================================

module.exports = {
  slug:          'how-to-write-self-review-bullets-that-get-you-the-raise',
  category:      'career',
  categoryLabel: 'Career',

  title:         "How to Write Self-Review Bullets That Get You the Raise",
  titleHtml:     "How to Write Self-Review Bullets <em>That Get You the Raise</em>",
  shortTitle:    "How to Write Self-Review Bullets That Get the Raise",
  navTitle:      "How to write self-review bullets that get you the raise",

  description:   "Most self-review bullets describe activity, not outcome. Five steps for bullets that read as case-for-promotion rather than year-in-review.",
  deck:          "Most self-review bullets describe activity, not outcome. Five steps for bullets that read as case-for-promotion rather than year-in-review.",

  published:     '2026-04-25',
  modified:      '2026-04-25',

  ledes: [
    `The self-review form is open. The deadline is end of day Friday. You've been staring at the empty bullets section for an hour, half-remembering things you did this year, half-flinching at how flat they sound when you write them down. You don't want to oversell. You also don't want to undersell, since the calibration meeting where bullets become decisions is happening in three weeks and your name is going to come up either way.`,
    `Most self-review bullets fail in the same way: they describe activity rather than outcome. 'Led the dashboard redesign' is activity. 'Led dashboard redesign that cut support tickets 40% and unblocked the enterprise tier launch' is outcome. The first version reads as 'this person was busy this year.' The second reads as 'this person made the company better in measurable ways.' Calibration committees compare versions. The five steps below close the gap between what you actually did and what gets read into your file.`,
  ],

  steps: [
    {
      name: "Stop describing what you did — describe what changed",
      body: "Activity bullets describe the work as if the work itself were the achievement. 'Owned the migration project.' 'Led weekly customer calls.' 'Managed the vendor relationship.' These tell the reader you were busy. They don't tell the reader the company is different because of you. Outcome bullets name what changed in the world as a result of the work: customer churn dropped, revenue increased, a process got faster, a launch shipped, a team got unblocked. The shift is from 'here's what filled my calendar' to 'here's what's different now that wasn't different a year ago.' Every bullet in your self-review should be readable through the lens of 'what changed because of me.' If a bullet doesn't survive that test, the work isn't necessarily unimportant — but the bullet isn't doing the job a self-review bullet has to do.",
    },
    {
      name: "Quantify everything you can quantify — and proxy when you can't",
      body: "Numbers don't sound boastful in self-reviews; they sound credible. A bullet with a number reads as a claim that's testable; a bullet without one reads as a claim that's hopeful. Pull whatever metrics you have access to: percentage improvements, revenue impact, time saved, ticket reductions, NPS changes, headcount of teams unblocked. When the direct number isn't available, proxy it. 'Cut investigation time from 45 minutes to under 10' even if you can't quote support tickets. 'Reduced approval cycles from three rounds to one' even if you can't quote dollar value. Proxies show that you thought about impact; they're meaningfully better than no number at all. The discipline is to never write a bullet that contains no numerical or comparative anchor — at minimum, before-vs-after framing of any kind.",
    },
    {
      name: "Match the bullet to what your manager and skip-level actually value",
      body: "Self-review bullets travel up the chain. The person who reads them in detail is your manager; the person who reads them quickly during calibration is your skip-level or higher; the people who decide your raise read maybe two bullets per person across dozens of reviews. Each of these readers values different things. Your manager remembers the details and wants you to surface what they didn't see. Your skip-level wants signal that you operate at the level above your current title. The calibration committee wants the one or two bullets that distinguish you from your peer group. The discipline is to write bullets that work at all three reading depths: the top sentence captures the headline impact, the supporting clause provides the proof, and the depth that follows holds up if anyone reads further. Bullets that only work at one reading depth either get over-trimmed by the calibration scan or buried under detail nobody reads.",
    },
    {
      name: "Show range — depth in two or three areas, not breadth in eight",
      body: "The instinct in self-reviews is to list everything you touched, on the assumption that volume looks like productivity. It doesn't — it looks like activity. Eight bullets at medium depth on eight different topics produces a self-review that reads as scattered. Three bullets that show real depth on three things, plus two or three smaller ones to round out the picture, reads as someone with focus and impact. The discipline is to choose your strongest stories and develop them, rather than listing every project you contributed to. The smaller bullets aren't the case for the raise — they're the supporting evidence that you also showed up consistently across the rest of the year. Your strongest bullets carry the case; everything else corroborates.",
    },
    {
      name: "Know when self-review bullets aren't actually the bottleneck",
      body: "Sometimes the best-written self-review in the world doesn't move the calibration. The pattern: your manager hasn't been advocating for you in calibration meetings, your skip-level doesn't know your work, decisions about raises and promotions are happening in conversations you're not part of, and the form is largely a formality. If you suspect this is happening, the right response isn't to keep polishing bullets — it's to address the visibility gap upstream of the form. That means making sure your manager has the talking points they need to advocate for you, getting in front of your skip-level on substantive work earlier in the cycle, and seeking out cross-functional projects where senior people see your output directly. The signal you've reached this category: have your last two reviews been strong on paper and produced underwhelming outcomes? If yes, the form isn't your problem; the politics are. Self-review bullets are one input to a system that has other inputs you may need to address directly.",
    },
  ],

  callout: {
    afterStep: 1,
    scriptedLine: "Activity: 'Led dashboard redesign project.'\nOutcome: 'Led dashboard redesign that cut support tickets 40% (Q2-Q4) and unblocked the enterprise launch — second-largest revenue line of the year.'",
    explanation: "Same work, two completely different bullets. The activity version tells the reader you were responsible for a project. The outcome version tells the reader the company is materially different because of you, with numbers that hold up to scrutiny and a connection to a business outcome the calibration committee already cares about. The second version is what gets you the raise.",
  },

  cta: {
    glyph:    '🏆',
    headline: "Turn humble descriptions into bullets that hold up in calibration",
    body:     "Brag Sheet Builder takes your work in your own words — however vague — and produces polished outcome bullets with verb upgrades, then asks the metrics questions that replace estimates with real numbers. The Strength Radar scores your sheet against role expectations and finds gaps before your manager does.",
    features: [
      "Before/After bullets — turns 'helped with onboarding' into outcome statements with metrics",
      "Metrics Excavator — multi-round questions that replace estimates with real numbers",
      "Strength Radar — scores against role expectations across 6-8 dimensions, surfaces gaps",
      "Voice Match — rewrites bullets in your natural writing voice, not AI voice",
      "Raise mode — produces business-value estimates and a meeting script for the conversation",
    ],
    toolId:   'BragSheetBuilder',
    toolName: 'Brag Sheet Builder',
  },
};
