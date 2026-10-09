module.exports = {
  "slug": "how-to-plan-a-project-so-it-doesnt-fail-in-the-obvious-ways",
  "category": "planning",
  "categoryLabel": "Planning",
  "title": "How to Plan a Project So It Doesn't Fail in the Obvious Ways",
  "titleHtml": "How to Plan a Project <em>So It Doesn&#39;t Fail in the Obvious Ways</em>",
  "shortTitle": "Plan a Project So It Doesn't Fail Obviously",
  "navTitle": "How to plan a project so it doesn't fail in the obvious ways",
  "description": "Most failed projects fail in ways the team should have seen coming. Five steps for surfacing the failure modes you can already see — before they become the post-mortem.",
  "deck": "To keep a project from failing in obvious ways, run a pre-mortem: imagine it has already failed and write why. Separate project-specific risks from generic ones, list the assumptions behind each line of the plan, mitigate the top three, and have an outsider read it.",
  "answerList": [
    "Imagine the project failed and write the explanation.",
    "Focus on risks specific to this project.",
    "Ask 'what has to be true?' for each line of the plan.",
    "Build mitigations for the top three; watch the rest.",
    "Have someone outside the team read the plan."
  ],
  "ledes": [
    "A pre-mortem is a planning technique, described by psychologist Gary Klein in Harvard Business Review in 2007, in which a team assumes a project has already failed and writes down plausible reasons why. Klein cites research showing that imagining an outcome has already happened (prospective hindsight) improves people's ability to identify its causes. The output is a specific list of risks that can be ranked, with mitigations built for the most likely and damaging ones.",
    "You're starting a project: a launch, a campaign, or something personal carved out of your evenings. The plan looks reasonable and there's a small voice saying it might not work. That voice is often pointing at something real, and a pre-mortem is a structured way to hear it out."
  ],
  "steps": [
    {
      "name": "What is a pre-mortem and how do you run one?",
      "body": "The structural move that unlocks pre-mortems is the cognitive inversion: instead of asking 'what could go wrong,' assume the project already went wrong, and ask 'what's the explanation?' The shift sounds rhetorical but tends to produce different output. Forward-thinking ('what could go wrong?') generates a list of vague risks with no narrative weight. Backward-thinking ('we failed; here's why') generates a story that's specific, sequential, and emotionally credible. Try it: write a single paragraph as if six months from now you're explaining to your team why the project didn't work. Don't filter; let the explanation flow. The paragraph that emerges will name two or three specific failure modes that forward-thinking would have missed, because the brain is much better at constructing causal stories than at scanning for abstract risks."
    },
    {
      "name": "Which project risks should you focus on?",
      "body": "The first list of failure modes from a pre-mortem usually includes a mix of generic risks ('the team got distracted by other priorities,' 'the spec changed mid-project') and project-specific ones ('we built the dashboard before we'd validated the metrics matter,' 'the customer interviews we did all came from one industry segment'). Generic failure modes are real but underspecific — every project has them, and every team has rough heuristics for managing them. Project-specific failure modes are where the actual value is. They're the ones that nobody else's checklist would have caught for you. Sort the list into the two categories explicitly. Spend a few minutes on the generic ones to confirm you have basic mitigations, then spend the bulk of your planning time on the project-specific ones — because nobody else has solved those for you."
    },
    {
      "name": "How do you find hidden assumptions in a project plan?",
      "body": "Every project plan rests on assumptions, most of which the team holds implicitly without ever stating. Pre-mortems are good at surfacing the explicit assumptions; the harder work is finding the implicit ones. The technique: take each line of your plan and ask 'what has to be true for this to work?' For 'we'll launch in October,' the assumption might be that engineering capacity stays at current levels (could change), that legal review takes two weeks (might take six), that the product team's sequencing holds (might shift). For 'customers will adopt this within a quarter,' the assumption might be that adoption follows past patterns (the segment may behave differently), that the price point won't change (might), that competitive landscape stays similar (might not). Each of these implicit assumptions is a place the project can fail through no fault of execution. Write them down. The ones you can't easily verify are the most dangerous, because they're the ones you'll be assuming continue to hold for the duration of the project — and assumptions held without scrutiny are how plans break in ways nobody named."
    },
    {
      "name": "How many project risks should you plan for?",
      "body": "A complete failure-mode list can run long. The instinct is to address all of them, which produces a planning document that's mostly mitigation overhead and not much actual project work. The discipline is to triage: pick the top three failure modes by combined likelihood and impact, and build specific mitigations for those. The rest go on a watch list — you'll monitor for early warning signs but won't pre-build mitigations. This is uncomfortable because it means accepting that some failure modes you've identified will catch you if they happen. The trade-off is that you actually have time to execute the project. Pre-mortems run wrong when they generate so much risk-management work that they crowd out the project itself. Three real mitigations beat fifteen half-built ones, and the top three are usually the ones that matter most anyway."
    },
    {
      "name": "What if the real risk isn't one you listed?",
      "body": "There's a category of project where the failure modes the pre-mortem surfaces are genuinely the obvious ones — the budget overrun, the missed deadline, the scope creep — and the project still fails for a different reason that nobody named. The pattern: the team focused so hard on managing the obvious risks that they missed a deeper structural problem. The project was wrong from the start (the customer didn't actually want this), the timing was wrong (a competitor moved first or a market shifted), or the team itself was the wrong team (skills mismatch nobody named). These second-order failures don't show up in the standard pre-mortem because the team running it shares the assumptions that produced them. The check that catches these: bring one outside person — a senior peer in another function, a friend in the industry, a former colleague — and ask them to read your plan and tell you what's worrying them. Their answer will often name the failure mode your team couldn't see, because they don't share the assumptions that hide it. The signal you should run this check: do you feel resistance to having someone else read your plan? If yes, do it specifically. The plans we most resist showing are usually the ones with the failure modes worth surfacing."
    }
  ],
  "callout": {
    "afterStep": 1,
    "scriptedLine": "It's six months from now. The project failed. Write the paragraph that explains why.",
    "explanation": "This single prompt does most of the work of a pre-mortem. The brain is much better at constructing a causal story than at scanning for abstract risks, so the failure narrative — written as if from the future — produces specific, sequenced, plausible failure modes that forward-thinking would have missed. Most teams do this once and immediately spot two or three risks they hadn't named in any planning meeting. The whole technique is built on this single inversion: assume failure, then explain it."
  },
  "sources": [
    {
      "label": "Harvard Business Review: Performing a Project Premortem (Gary Klein, 2007)",
      "url": "https://hbr.org/2007/09/performing-a-project-premortem"
    }
  ],
  "cta": {
    "glyph": "💀",
    "headline": "Run Break My Plan? on the project you're about to start",
    "body": "Break My Plan? takes your plan, imagines it failed, and works backward — surfacing the failure paths worth watching, the Assumption to Test First, observable warning signs, and the highest-value first move. The technique used by NASA, military planners, and venture investors, in about a minute.",
    "features": [
      "Failure narrative — a disciplined imagined failure mechanism, not a forecast",
      "Failure modes by priority — one Primary Watch tells you what to address first",
      "Assumption to Test First — the single dependency most worth verifying before committing",
      "Observable warning signs — early evidence to watch for, not predicted reactions",
      "Assumptions Autopsy — becomes a pre-launch checklist for verification"
    ],
    "toolId": "BreakMyPlan",
    "toolName": "Break My Plan?"
  },
  "published": "2026-04-25",
  "modified": "2026-10-09",
  "reviewed": true
};
