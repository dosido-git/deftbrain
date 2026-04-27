// ============================================================
// guide-specs/planning/how-to-pressure-test-a-plan-before-you-bet-money-on-it.js
// ============================================================

module.exports = {
  slug:          'how-to-pressure-test-a-plan-before-you-bet-money-on-it',
  category:      'planning',
  categoryLabel: 'Planning',

  title:         "How to Pressure-Test a Plan Before You Bet Money on It",
  titleHtml:     "How to Pressure-Test a Plan <em>Before You Bet Money on It</em>",
  shortTitle:    "How to Pressure-Test a Plan",
  navTitle:      "How to pressure-test a plan before you bet money on it",

  description:   "Most plans look better than they are because the person who wrote them is also the person evaluating them. Five steps for finding the weak points before the money goes in.",
  deck:          "Most plans look better than they are because the person who wrote them is also the person evaluating them. Five steps for finding the weak points before the money goes in.",

  published:     '2026-04-25',
  modified:      '2026-04-25',

  ledes: [
    `The plan is on paper. The numbers add up, the timeline looks tight but feasible, and you're at the moment where the decision shifts from 'should we' to 'when do we start.' The next move costs real money — capital, time, opportunity cost, reputation — and you have a small voice asking whether you've stress-tested this enough or just convinced yourself you have.`,
    `Plans look stronger to the person who wrote them than to anyone else. This isn't a flaw in your judgment; it's a feature of how planning works. You spent weeks selecting the assumptions that hold the plan together, which means you've also done the most thorough job available of not noticing the assumptions that don't. Pressure-testing is the discipline of breaking out of that frame deliberately. The five steps below are how to do it before the money commits, with techniques specifically designed for the failure modes that self-evaluation produces.`,
  ],

  steps: [
    {
      name: "List every assumption — including the ones that feel like facts",
      body: "The first move in pressure-testing is to enumerate the assumptions the plan rests on. The trick is including the ones that feel like facts. 'Customers will pay $99/month' is obviously an assumption. 'Cloud hosting costs will stay roughly stable' often gets treated as fact. 'My co-founder will stay through launch' often doesn't make the list at all. Walk through every line of the plan and ask: what has to be true for this to hold? Each answer is an assumption. The list usually runs to 30-50 items for a serious plan, which is the right scale — assumptions you don't list are assumptions you don't get to test, and the ones that feel like facts are exactly the ones most likely to bite you because nobody's going to look at them. Write them down without filtering for plausibility. Filter later.",
    },
    {
      name: "Sort assumptions by reversibility cost",
      body: "Not all wrong assumptions cost the same. Some can be discovered mid-execution and corrected for free or near-free; others bake into the plan in ways that are expensive or impossible to reverse. Sort the assumption list into two columns. Reversible: assumptions whose failure can be detected and corrected without significant cost (the marketing channel that doesn't work can be replaced; the pricing that's too low can be raised). Irreversible: assumptions whose failure is expensive to discover and harder to fix (the office lease signed for two years; the tech stack chosen at the start; the co-founder equity split; the brand name; the launch market). The reversible assumptions can be tested cheaply during execution, so they don't need much pre-launch work. The irreversible ones are where pre-launch pressure-testing earns its keep — because failing to test them means you'll find out they were wrong at exactly the moment you can't change them.",
    },
    {
      name: "Find the cheapest experiment to test the most expensive assumption",
      body: "For each irreversible assumption, ask: what's the cheapest test I can run that would change my mind about this? Often the answer is much cheaper than people initially assume. Pricing assumptions can be tested with a fake door (a landing page that takes signups but doesn't deliver yet); demand assumptions can be tested with paid ads measuring click-through and signup; team assumptions can be tested with a paid trial project before formal commitment; market assumptions can be tested by reading the trade press of the segment for 90 days and tracking whether the trends you're betting on are visible. The discipline is matching the experiment to the assumption: a $500 test that could save a $50,000 mistake is the right ratio. Most pre-launch pressure-testing fails not because the experiments are too expensive but because the team didn't think to design them. Cheap tests on expensive assumptions are usually available; the question is whether you go look for them.",
    },
    {
      name: "Identify the kill criteria upfront",
      body: "Before committing money, identify the conditions under which you'd shut the plan down. This is the single hardest discipline in pressure-testing because once you've committed, you'll have strong incentives to keep going regardless of evidence. Pre-committed kill criteria protect against this. The format that works: 'If by month 6 we haven't hit X, we shut down. If by month 9 we haven't hit Y, we pivot. If by month 12 we haven't hit Z, we sell or close.' Specific numbers, specific dates, specific actions. The discipline is making these criteria binding by writing them down where you'll see them later, sharing them with someone who'll hold you to them, and tying decision rights to them in advance. Plans without kill criteria run on indefinitely past the point where the evidence has stopped supporting them, because once you're in motion, every individual month feels like the wrong time to stop. The kill criteria are how you protect future-you from present-you's optimism.",
    },
    {
      name: "Know when pressure-testing has become procrastinating",
      body: "There's a category of pressure-testing that's productive and a category that's avoidance dressed up as rigor. The signal you've crossed into the second: the testing isn't moving toward a decision; it's expanding into more questions. Each round of analysis surfaces new assumptions to test, new objections to consider, new edge cases to model. The plan is increasingly stress-tested but no closer to executing. This is a real pattern and it's the second-biggest failure mode of pressure-testing (the first being inadequate testing). The check: are you running tests that, if they came back positive, would actually advance the decision? If yes, keep testing. If no — if positive results just generate more questions — you've shifted from rigorous evaluation to rigorous delay. The remedy is to write down the specific evidence that would move you from 'still evaluating' to 'committing,' and to either run the tests that would generate that evidence or commit despite their absence. Indefinite pressure-testing is a way to feel responsible while not deciding, and it costs the same opportunity cost that an underprepared launch would.",
    },
  ],

  callout: {
    afterStep: 1,
    scriptedLine: "Reversible (test during execution, cheap to fix):\n• Marketing channel mix\n• Pricing tier structure\n• Hire #2 timing\n\nIrreversible (test BEFORE commitment, expensive to fix):\n• Co-founder equity split\n• Tech stack choice\n• Launch market selection\n• Brand name + domain",
    explanation: "This sort is the move that focuses pressure-testing where it actually matters. Reversible assumptions can be tested cheaply once you're operating; irreversible ones need to be tested before commitment because failing to test them means discovering they were wrong at exactly the moment you can't change them anymore. Most plans fail on a small number of irreversible assumptions that nobody pressure-tested specifically. Sort the list and spend your testing budget on the second column.",
  },

  cta: {
    glyph:    '💀',
    headline: "Get the assumption list and the failure memo before you commit",
    body:     "Pre-Mortem produces the future-failure memo that surfaces what you're implicitly betting on. The Assumptions Autopsy lists each assumption, ranked by danger. The Fatal Assumption identifies the single belief most likely to kill the plan. The technique used by NASA, military planners, and venture investors — applied in minutes, not weeks.",
    features: [
      "Failure memo from your future self — specific failure narrative with probability ratings",
      "Assumptions Autopsy — every assumption ranked by danger, becomes a pre-launch checklist",
      "Fatal Assumption — the single belief most likely to kill the plan",
      "Warning signs you'll ignore — early indicators teams typically miss",
      "Plan-type tuning — startup, project, career move, investment each get specialized analysis",
    ],
    toolId:   'PreMortem',
    toolName: 'Pre-Mortem',
  },
};
