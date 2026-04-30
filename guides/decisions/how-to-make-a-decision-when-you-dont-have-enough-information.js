// ============================================================
// guides/decisions/how-to-make-a-decision-when-you-dont-have-enough-information.js
// ============================================================

module.exports = {
  slug:          'how-to-make-a-decision-when-you-dont-have-enough-information',
  category:      'decisions',
  categoryLabel: 'Decisions',

  title:         "How to Make a Decision When You Don't Have Enough Information",
  titleHtml:     "How to Make a Decision <em>When You Don't Have Enough Information</em>",
  shortTitle:    "Decide With Incomplete Info",
  navTitle:      "How to make a decision when you don't have enough information",

  description:   "Most decisions get made under uncertainty. Waiting for full information often means waiting forever. Here's how to decide responsibly when the data is incomplete.",
  deck:          "Most decisions get made under uncertainty. Waiting for full information often means waiting forever. Here's how to decide responsibly when the data is incomplete.",

  published:     '2026-04-28',
  modified:      '2026-04-28',

  ledes: [
    `You're trying to decide about something — a job, a move, a partnership, a strategy — and you don't have enough information. You don't know how the team will turn out, whether the city will fit, what the partner will be like in six months. Every direction you turn, the relevant data is incomplete, and the people advising you don't have it either. The instinct is to keep researching until something resolves. The catch is that for most real decisions, nothing resolves — you decide under uncertainty, or you don't.`,
    `Deciding under incomplete information is most of adult decision-making. Waiting for full data is rarely an option, and the people who do it well aren't getting more data — they use a different protocol. Five steps that work specifically for the case where you can't know what you wish you knew.`,
  ],

  steps: [
    {
      name: "Separate uncertainty from missing facts",
      body: "Not all 'I don't have enough information' is the same. Some decisions are missing facts you could actually get — by reading, asking, doing more research. Others are missing information that doesn't yet exist anywhere — outcomes, future market conditions, how a person will behave under future circumstances. The first kind needs investigation; the second kind needs decision-making under uncertainty. Most stuck decisions are stuck because people are treating type-two as if it were type-one and waiting for facts that won't ever arrive.",
    },
    {
      name: "Decide based on probability ranges, not point estimates",
      body: "When you don't have enough information, you're not actually deciding about a single outcome — you're deciding about a range of possible outcomes weighted by likelihood. Don't pretend to know what'll happen; estimate a range. 'There's maybe a 40% chance the team is great, a 40% chance it's fine, a 20% chance it's bad.' Pick the option whose range you can live with, not the one that requires getting lucky. Decisions that work under range-thinking tend to be more robust than ones that bet on a specific outcome.",
    },
    {
      name: "Identify the cheapest experiment available",
      body: "Sometimes you can buy information at much lower cost than committing to the full decision. A trial period, a single conversation, a small experiment, a six-week test. If a low-cost experiment can resolve a key uncertainty before you commit, it's almost always worth running. Don't make the irreversible call when a reversible one would teach you the most important thing first. The framing isn't 'decide now' — it's 'what's the smallest move that gives me real information.'",
    },
    {
      name: "Pick the option that fails gracefully",
      body: "When the future is genuinely uncertain, the best decision isn't the one with the highest expected value — it's the one whose worst case is most survivable. If option A goes great, both A and B turn out well; if things go badly, A leaves you in a worse position than B. Take B. People who make good decisions under uncertainty consistently optimize for graceful failure rather than maximum upside, because they know they can't predict which world they'll end up in.",
    },
    {
      name: "Decide the deadline for your decision",
      body: "Lack of information is often weaponized into indefinite delay. Set a deadline by which you'll decide regardless of whether new information arrives. The deadline forces the decision; you can extend it once if necessary, but not three times. People who routinely wait for 'one more piece of information' rarely arrive at decisions; the information keeps not being enough. The deadline is what closes the gap between gathering and choosing.",
    },
  ],

  cta: {
    glyph:    '🎯',
    headline: "Get a decision under the uncertainty you actually have",
    body:     "Decision Coach takes your situation, the information you have, and the uncertainty you can't resolve, then produces a single answer with execution steps — including which uncertainties to test cheaply before committing.",
    features: [
      "Uncertainty-aware reasoning",
      "Cheap-experiment suggestions",
      "Graceful-failure analysis",
      "Single-answer output",
      "Execution-step plan",
    ],
    toolId:   'DecisionCoach',
    toolName: 'Decision Coach',
  },
};
