// ============================================================
// guide-specs/planning/the-questions-to-ask-before-starting-anything-that-costs-you-time.js
// ============================================================

module.exports = {
  slug:          'the-questions-to-ask-before-starting-anything-that-costs-you-time',
  category:      'planning',
  categoryLabel: 'Planning',

  title:         "The Questions to Ask Before Starting Anything That Costs You Time",
  titleHtml:     "The Questions to Ask <em>Before Starting Anything That Costs You Time</em>",
  shortTitle:    "Questions Before Anything That Costs Time",
  navTitle:      "The questions to ask before starting anything that costs you time",

  description:   "Time spent is the cost you can't get back. Five questions to ask before committing real time to anything — and the meta-question for when the questions themselves are the problem.",
  deck:          "Time spent is the cost you can't get back. Five questions to ask before committing real time to anything — and the meta-question for when the questions themselves are the problem.",

  published:     '2026-04-25',
  modified:      '2026-04-25',

  ledes: [
    `Money you can earn back. Time you can't. Most of the things that cost you significant time — projects you start, commitments you take on, paths you go down — produce roughly the outcomes you'd have predicted if you'd asked yourself a small number of honest questions before starting. The questions are short, the answers are usually findable, and the discipline of asking them sounds basic. The reason people skip it is that 'just start' feels more virtuous than 'figure out whether to start.'`,
    `The five questions below aren't a planning template. They're the small set of high-leverage prompts that catch most of the bad commitments before they get made. They're designed to take ten or fifteen minutes — not an hour, not a planning offsite. The goal is the minimum viable check that your time is going somewhere worth going, in a form you can run on a coffee break before you say yes.`,
  ],

  steps: [
    {
      name: "What does success actually look like — concretely?",
      body: "Most commitments fail this question on the first try. 'Build something useful.' 'Get into shape.' 'Launch a side project.' Each of these sounds like a goal but isn't, because none of them tell you when you've succeeded or when to stop. The fix is concrete: 'Ship the v1 within 90 days, with at least 50 weekly active users by month 4.' 'Run a 5K under 30 minutes by July.' 'Generate $1K of revenue by end of Q2 — if I haven't, I shut it down.' Specific number, specific timeline, specific decision. The exercise of being specific does two useful things at once. It surfaces whether you actually want this thing or just want to be a person who pursues it, and it gives you a way to check progress that doesn't depend on how much energy you've sunk in. Vague goals get pursued indefinitely; concrete goals reach decision points where you can either commit further or stop without feeling like you failed.",
    },
    {
      name: "What's the cheapest version of this I could test first?",
      body: "Most commitments can be approximated by a smaller version that costs a fraction of the time and tests most of what's uncertain. Want to start a podcast? Record three episodes and keep them on your hard drive — does the production process feel sustainable, do you have material for episode 30, do you actually like editing? Want to switch careers into a new field? Take a part-time project in that field before quitting your job. Want to write a book? Write one chapter and read it three months later — does it hold up, do you want to write 14 more like it? The cheap version doesn't replace the full commitment; it just answers questions that the full commitment would have to answer eventually, at much higher cost. The discipline is to ask, before starting the big version: what version of this could I do in two weeks that would tell me whether the big version is worth doing? If you can name the cheap version, do it first. If you can't, the inability to name it is its own signal — the commitment may be more about identity than about the work itself.",
    },
    {
      name: "What am I implicitly betting on that's outside my control?",
      body: "Every plan that involves time investment is implicitly betting on a number of things you don't control. The market won't shift in a way that makes this obsolete. The technology stack won't change underneath you. The relationships you're building it for won't dissolve. The gatekeepers won't change priorities. The job market won't tighten. Your health and energy will hold. Your family situation won't require all of your attention for an unrelated reason. Each of these is outside your control and could break the plan in ways you can't compensate for. The exercise is to list the three or four biggest external dependencies your plan relies on and rate each by likelihood of changing within your timeline. Plans with high external dependency aren't bad — they may be the right plans — but they should be entered with eyes open. The pattern that goes wrong is treating external dependencies as fixed when they're variable. Naming them as variables is what lets you build contingency without paranoia.",
    },
    {
      name: "What does failure look like — and at what cost?",
      body: "Before committing time, define what failure means and what it costs. The exercise has two parts. First: what's the realistic worst-case outcome if this doesn't work? (Six months of evenings spent on something that didn't pan out; the financial loss of self-funding the experiment; the opportunity cost of what you didn't do instead.) Second: how would you feel about that outcome — not the bad version of feeling, but the actual specific feelings? (Some people would feel embarrassed; some would feel relieved to have tried; some would experience real material consequence; some would simply move on.) The honest answer to the second part determines how much of the first part you can absorb. Some commitments are good bets even with high failure costs because the absorption is high; others are bad bets with low failure costs because the failure feels disproportionate. Naming both makes the bet legible to you in a way that committing without naming them doesn't.",
    },
    {
      name: "Know when these questions have become a way to never start",
      body: "The questions in this guide can be useful or they can be the way you avoid starting. The signal that they've shifted: are you running through them again on a commitment you keep meaning to make, generating the same answers each time, and not deciding either way? Are you adding more questions to the list rather than answering the existing ones? Have you been 'evaluating' for longer than the commitment itself would have taken to test? If yes, the questions have become a substitute for the start. The remedy is structural rather than analytical. Either commit to a small version this week (which the second question already suggested) or commit to letting the option go. Indefinite evaluation has the same opportunity cost as the bad commitment you were trying to avoid — the time spent evaluating is time not spent on whatever else you'd do, and the indecision itself produces a low-grade drain that compounds over months. Pre-commitment evaluation is valuable up to a point; past that point, it's the failure mode the questions were supposed to prevent.",
    },
  ],

  callout: {
    afterStep: 4,
    scriptedLine: "What does success look like (specific number + date)? What's the cheapest version I could test first? What am I betting on that's outside my control? What does failure look like and how would I feel about it? Have I been asking these questions on this same commitment for more than a few weeks?",
    explanation: "Five questions, ten to fifteen minutes, before any commitment that costs serious time. The first four surface most of what you needed to know about whether to start. The fifth catches the situation where the questions themselves have become the avoidance. Run them once, generate honest answers, and decide. Running them repeatedly on the same decision over weeks or months is the signal that the analysis has stopped serving the decision and started replacing it.",
  },

  cta: {
    glyph:    '💀',
    headline: "Run the formal pre-mortem on the commitment you're considering",
    body:     "Pre-Mortem takes your plan, runs the cognitive inversion, and produces the structured failure analysis: most likely failure modes with probability ratings, the Fatal Assumption you're making, the warning signs you'll ignore, and the one thing that actually determines the outcome. The technique used by NASA, military planners, and venture investors — applied in minutes before you commit your time.",
    features: [
      "Failure narrative — the memo from your future self explaining why this didn't work",
      "Failure modes ranked by probability — focus on what's most likely to derail you",
      "Fatal Assumption — the single belief most likely to kill the commitment",
      "Warning signs you'll ignore — the early indicators motivated reasoning will dismiss",
      "Plan-type tuning — startup, project, career move, relationship each get specialized analysis",
    ],
    toolId:   'PreMortem',
    toolName: 'Pre-Mortem',
  },
};
