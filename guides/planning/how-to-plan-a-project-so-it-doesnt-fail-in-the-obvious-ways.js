// ============================================================
// guide-specs/planning/how-to-plan-a-project-so-it-doesnt-fail-in-the-obvious-ways.js
// ============================================================

module.exports = {
  slug:          'how-to-plan-a-project-so-it-doesnt-fail-in-the-obvious-ways',
  category:      'planning',
  categoryLabel: 'Planning',

  title:         "How to Plan a Project So It Doesn't Fail in the Obvious Ways",
  titleHtml:     "How to Plan a Project <em>So It Doesn&#39;t Fail in the Obvious Ways</em>",
  shortTitle:    "Plan a Project So It Doesn't Fail Obviously",
  navTitle:      "How to plan a project so it doesn't fail in the obvious ways",

  description:   "Most failed projects fail in ways the team should have seen coming. Five steps for surfacing the failure modes you can already see — before they become the post-mortem.",
  deck:          "Most failed projects fail in ways the team should have seen coming. Five steps for surfacing the failure modes you can already see — before they become the post-mortem.",

  published:     '2026-04-25',
  modified:      '2026-04-25',

  ledes: [
    `You're starting a project. Maybe a product launch, maybe a campaign, maybe a personal thing you're carving time out for after work. The plan looks reasonable on paper, the team is committed, and you can already feel the small voice in the back of your head saying it might not work. Most people ignore that voice. Most projects that fail prove the voice was right.`,
    `Failed projects almost never fail in surprising ways. They fail in ways the team would have predicted if anyone had asked them at the start, written down the prediction, and acted on it. The technique that makes this work is called a pre-mortem: imagine the project has already failed, then write the explanation. The exercise sounds small and produces specific, actionable risk lists in about thirty minutes. The five steps below are how to run one, what to do with the output, and when the obvious failure modes aren't actually the dangerous ones.`,
  ],

  steps: [
    {
      name: "Imagine the project failed — write the failure narrative first",
      body: "The structural move that unlocks pre-mortems is the cognitive inversion: instead of asking 'what could go wrong,' assume the project already went wrong, and ask 'what's the explanation?' The shift sounds rhetorical but produces dramatically different output. Forward-thinking ('what could go wrong?') generates a list of vague risks with no narrative weight. Backward-thinking ('we failed; here's why') generates a story that's specific, sequential, and emotionally credible. Try it: write a single paragraph as if six months from now you're explaining to your team why the project didn't work. Don't filter; let the explanation flow. The paragraph that emerges will name two or three specific failure modes that forward-thinking would have missed, because the brain is much better at constructing causal stories than at scanning for abstract risks.",
    },
    {
      name: "Identify which failure modes are unique to this project, not generic",
      body: "The first list of failure modes from a pre-mortem usually includes a mix of generic risks ('the team got distracted by other priorities,' 'the spec changed mid-project') and project-specific ones ('we built the dashboard before we'd validated the metrics matter,' 'the customer interviews we did all came from one industry segment'). Generic failure modes are real but underspecific — every project has them, and every team has rough heuristics for managing them. Project-specific failure modes are where the actual value is. They're the ones that nobody else's checklist would have caught for you. Sort the list into the two categories explicitly. Spend a few minutes on the generic ones to confirm you have basic mitigations, then spend the bulk of your planning time on the project-specific ones — because those are the failure modes most likely to actually kill the project, and they're the ones nobody else has solved for you.",
    },
    {
      name: "Pressure-test assumptions you didn't know you were making",
      body: "Every project plan rests on assumptions, most of which the team holds implicitly without ever stating. Pre-mortems are good at surfacing the explicit assumptions; the harder work is finding the implicit ones. The technique: take each line of your plan and ask 'what has to be true for this to work?' For 'we'll launch in October,' the assumption might be that engineering capacity stays at current levels (could change), that legal review takes two weeks (might take six), that the product team's sequencing holds (might shift). For 'customers will adopt this within a quarter,' the assumption might be that adoption follows past patterns (the segment may behave differently), that the price point won't change (might), that competitive landscape stays similar (might not). Each of these implicit assumptions is a place the project can fail through no fault of execution. Write them down. The ones you can't easily verify are the most dangerous, because they're the ones you'll be assuming continue to hold for the duration of the project — and assumptions held without scrutiny are how plans break in ways nobody named.",
    },
    {
      name: "Build mitigations for the top three, not all of them",
      body: "A complete failure-mode list often runs to fifteen or twenty items. The instinct is to address all of them, which produces a planning document that's mostly mitigation overhead and not much actual project work. The discipline is to triage: pick the top three failure modes by combined likelihood and impact, and build specific mitigations for those. The other twelve to seventeen go on a watch list — you'll monitor for early warning signs but won't pre-build mitigations. This is uncomfortable because it means accepting that some failure modes you've identified will catch you if they happen. The trade-off is that you actually have time to execute the project. Pre-mortems run wrong when they generate so much risk-management work that they crowd out the project itself. Three real mitigations beat fifteen half-built ones, and the top three are usually the ones that matter most anyway.",
    },
    {
      name: "Know when the obvious failure modes aren't actually the dangerous ones",
      body: "There's a category of project where the failure modes the pre-mortem surfaces are genuinely the obvious ones — the budget overrun, the missed deadline, the scope creep — and the project still fails for a different reason that nobody named. The pattern: the team focused so hard on managing the obvious risks that they missed a deeper structural problem. The project was wrong from the start (the customer didn't actually want this), the timing was wrong (a competitor moved first or a market shifted), or the team itself was the wrong team (skills mismatch nobody named). These second-order failures don't show up in the standard pre-mortem because the team running it shares the assumptions that produced them. The check that catches these: bring one outside person — a senior peer in another function, a friend in the industry, a former colleague — and ask them to read your plan and tell you what's worrying them. Their answer will often name the failure mode your team couldn't see, because they don't share the assumptions that hide it. The signal you should run this check: do you feel resistance to having someone else read your plan? If yes, do it specifically. The plans we most resist showing are usually the ones with the failure modes worth surfacing.",
    },
  ],

  callout: {
    afterStep: 1,
    scriptedLine: "It's six months from now. The project failed. Write the paragraph that explains why.",
    explanation: "This single prompt does most of the work of a pre-mortem. The brain is much better at constructing a causal story than at scanning for abstract risks, so the failure narrative — written as if from the future — produces specific, sequenced, plausible failure modes that forward-thinking would have missed. Most teams do this once and immediately spot two or three risks they hadn't named in any planning meeting. The whole technique is built on this single inversion: assume failure, then explain it.",
  },

  cta: {
    glyph:    '💀',
    headline: "Run the pre-mortem your project actually needs",
    body:     "Pre-Mortem takes your plan, runs the cognitive inversion, and produces the failure narrative — including the most likely failure modes with probability ratings, the Fatal Assumption you're making, the warning signs you'll ignore, and the one thing that actually determines the outcome. The technique used by NASA, military planners, and venture investors, in 90 seconds.",
    features: [
      "Failure narrative — the memo from your future self explaining why the project failed",
      "Failure modes ranked by probability — focus mitigation on what actually matters",
      "Fatal Assumption — the single assumption most likely to kill the project",
      "Warning signs you'll ignore — the early indicators most teams miss",
      "Assumptions Autopsy — becomes a pre-launch checklist for verification",
    ],
    toolId:   'PreMortem',
    toolName: 'Pre-Mortem',
  },
};
