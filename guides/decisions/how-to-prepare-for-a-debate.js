// ============================================================
// guides/decisions/how-to-prepare-for-a-debate.js
// ============================================================

module.exports = {
  slug:          'how-to-prepare-for-a-debate',
  category:      'decisions',
  categoryLabel: 'Decisions',

  title:         "How to Prepare for a Debate",
  titleHtml:     "How to Prepare <em>for a Debate</em>",
  shortTitle:    "Prepare for a Debate",
  navTitle:      "How to prepare for a debate — five steps used by competitive debaters",

  description:   "Most debate prep focuses on memorizing your own arguments. Real prep is about predicting the opposition. Here's the five-step protocol used by competitive debaters.",
  deck:          "Most debate prep focuses on memorizing your own arguments. Real prep is about predicting the opposition. Here's the five-step protocol used by competitive debaters.",

  published:     '2026-04-28',
  modified:      '2026-04-28',

  ledes: [
    `You have a debate coming up. It might be a formal one — a class assignment, a competition, a public forum — or a meeting where you'll be defending a position you know will be challenged. Either way, you've got a finite amount of prep time and an unclear sense of what to do with it. The instinct is to write down all your arguments, memorize a few good lines, and walk in confident. This is the wrong instinct, and it's why most prepared debaters still get caught flat-footed.`,
    `The competitive debate world has spent decades figuring out what works. The answer is the opposite of what most people do: less time on your own case, much more on the opposition's. Five steps in the order good debaters run them. They take longer than the lazy version, and produce performances that aren't comparable.`,
  ],

  steps: [
    {
      name: "Write your case in one paragraph first",
      body: "Before anything else, write your position as a single tight paragraph. Not bullet points, not an outline — connected prose that argues itself. If you can't compress your case to a paragraph, you don't yet understand what you're arguing. The compressed version forces you to identify the actual claim, the load-bearing reasons, and the conclusion. Everything you build later — evidence, examples, rebuttals — hangs off this paragraph. Skipping this step is why most debate prep produces sprawling, disorganized cases.",
    },
    {
      name: "Predict the three strongest objections",
      body: "Spend at least as much time on the opposition as on your own case. What are the three best objections a smart, well-prepared opponent would raise? Write each one in its strongest form. If you can't articulate the opposing case better than your opponent will, you're going to be surprised in real time — and the cost of being surprised is much higher than the cost of preparing for objections you don't end up facing.",
    },
    {
      name: "Pre-build your responses to each objection",
      body: "For each of the three strongest objections, write your response — also tightly, also in connected prose. Don't try to be clever; try to be correct. Cover three things in each response: where the objection has a legitimate point, why it doesn't ultimately defeat your case, and what evidence supports your version. Pre-built responses don't need to be memorized; they need to be thought through. The thinking is what survives into the actual debate.",
    },
    {
      name: "Find the evidence that survives scrutiny",
      body: "Most debaters cite evidence sloppily — partial quotes, stale statistics, sources that don't say what they're claimed to say. Don't be one of them. For each major claim, find one piece of evidence you've checked yourself and would feel comfortable defending the source of. One strong, verifiable piece of evidence is worth more than five flashy ones, especially when the opponent challenges them. Quality over quantity, always.",
    },
    {
      name: "Rehearse the parts you'll likely flub",
      body: "Identify the moments most likely to go wrong: the opening, the response to the hardest objection, the close. Rehearse those out loud — actually out loud, not in your head. The gap between thinking something and saying it cleanly is much bigger than people realize, and competitive debaters don't trust the head version. The other 80% of the debate, you can wing if you've done the prior steps. The 20% you can't wing is what rehearsal is for.",
    },
  ],

  cta: {
    glyph:    '🥊',
    headline: "Prep for any debate against the steelman",
    body:     "Debate Me's Devil's Advocate Prep mode drills you on your position by generating the strongest possible objections — exactly the predictive prep work competitive debaters do, automated for any topic in any format.",
    features: [
      "Devil's Advocate Prep mode",
      "Steelman objection generation",
      "Five debate formats",
      "Real-time fallacy flags",
      "Multi-turn rehearsal",
    ],
    toolId:   'DebateMe',
    toolName: 'Debate Me',
  },
};
