// ============================================================
// guides/decisions/how-to-make-a-decision-when-you-have-to-commit-by-deadline.js
// ============================================================

module.exports = {
  slug:          'how-to-make-a-decision-when-you-have-to-commit-by-deadline',
  category:      'decisions',
  categoryLabel: 'Decisions',

  title:         "How to Make a Decision When You Have to Commit by a Deadline",
  titleHtml:     "How to Make a Decision <em>When You Have to Commit by a Deadline</em>",
  shortTitle:    "Decide Before the Deadline",
  navTitle:      "How to make a decision when you have to commit by a deadline",

  description:   "The deadline is real, the decision matters, and you don't have time to keep deliberating. Here's how to compress good decision-making into the time you have — without panicking.",
  deck:          "The deadline is real, the decision matters, and you don't have time to keep deliberating. Here's how to compress good decision-making into the time you have — without panicking.",

  published:     '2026-04-28',
  modified:      '2026-04-28',

  ledes: [
    `The deadline is Friday at 5pm. It's currently Wednesday afternoon. The decision is meaningful — accepting a job offer, signing a lease, committing to a contract — and the version of yourself that wishes you'd had three more weeks to decide is going to have to sit down. The deadline is fixed; the decision is not. The work between now and Friday is making the best decision you can in the time available, which is a different skill than making the best possible decision in unbounded time.`,
    `Time-constrained decisions follow a different protocol than open-ended ones. The trick is to compress the right parts of the analysis and skip the parts that don't add information at this resolution. Five steps designed to fit in 48 hours. They produce decisions that are usually as good as the unbounded-time version would have been.`,
  ],

  steps: [
    {
      name: "Stop seeking new information immediately",
      body: "With a deadline approaching, the instinct is to gather more — read more reviews, ask more people, get more data. This almost always backfires. New information arriving close to a deadline doesn't get integrated well; it just adds noise to a decision you're already making. Cut off new inputs at least 12 hours before the deadline. Use the remaining time to think with what you have, not to scramble for what you don't.",
    },
    {
      name: "Make the call once, on paper, fast",
      body: "Sit down and make the decision in twenty minutes. Write down the choice and three reasons. Don't second-guess; don't refine; don't optimize. This is your fast first answer. It often turns out to be the right one — the brain knows more than it lets on, and forced quick decisions surface that knowledge. Even if it's wrong, you now have a baseline to compare further analysis against. Without the baseline, all subsequent thinking is unmoored.",
    },
    {
      name: "Run the worst-case test",
      body: "For your fast first answer, articulate the worst plausible outcome. Not the catastrophe; the realistic bad version. If the bad version is something you could absorb and recover from, the decision is probably fine. If the bad version is something that would meaningfully damage your life, you need more rigor on the analysis — but only on the parts that actually drive that worst case. The worst-case test focuses your remaining time on what matters.",
    },
    {
      name: "Ask the one person who knows the territory",
      body: "Before the deadline, find one person — exactly one — who has actual experience with the kind of decision you're making, and ask them what they'd do. Not for permission, not for general advice. For their actual call. One expert opinion under deadline pressure is much more valuable than five generalist opinions over weeks. Pick someone who's been there. Ask directly. Listen.",
    },
    {
      name: "Commit by the deadline, then stop",
      body: "When the deadline arrives, commit. Put the decision in writing — accept the offer, sign the lease, send the email. Then stop thinking about whether it was the right call. Once a decision is committed, additional rumination provides no benefit and substantial cost; you can't change it now, and the energy you spend second-guessing is energy not spent executing well on the choice you made. The decision was made under time pressure; let it be made. Move forward.",
    },
  ],

  cta: {
    glyph:    '🎯',
    headline: "Compress the decision into the time you have",
    body:     "Decision Coach takes your situation, your constraints, and your deadline, then produces a single answer — fast — with execution steps to act on immediately. Designed for the decisions you can't afford to drag out.",
    features: [
      "Time-constrained reasoning",
      "Worst-case scenario testing",
      "Single-answer output",
      "Execution-step plan",
      "Deadline-forced resolution",
    ],
    toolId:   'DecisionCoach',
    toolName: 'Decision Coach',
  },
};
