module.exports = {
  slug:          'how-to-halve-or-double-a-recipe',
  category:      'cooking',
  categoryLabel: 'Cooking',
  title:         "How to Halve or Double a Recipe Without Ruining It",
  titleHtml:     "How to Halve or Double a Recipe <em>Without Ruining It</em>",
  shortTitle:    "Scale a Recipe",
  navTitle:      "halve or double a recipe",
  description:   "Most things in a recipe scale linearly. Some do not. Here is what to multiply, what to leave alone, and which ingredients break recipes when you scale them up or down.",
  deck:          "Most things in a recipe scale linearly. Some do not. Here is what to multiply, what to leave alone, and which ingredients break recipes when you scale them up or down.",
  ledes: [
    `You are cooking for two and the recipe serves four. Or you are hosting six and the recipe serves three. The first instinct is to multiply every ingredient by the ratio and call it done. That works for the obvious things — meat, vegetables, sauce — and fails for the ones that are not obvious, which is how you end up with an over-spiced stew or a cake that does not rise.\n\nScaling has rules. Liquid scales linearly. Salt and spice usually do not — the perception of seasoning is not strictly proportional to the amount. Baking time changes when pan size changes. Leavening agents have a non-linear sweet spot. Knowing which is which keeps the recipe working.`,
    `Here is the framework — and the math Recipe Chaos Solver does for you.`,
  ],
  steps: [
    { name: 'Scale liquids and main ingredients linearly', body: 'Stocks, water, milk, oils, the main proteins, the main vegetables — these all scale by the ratio without complications. If the recipe calls for two cups of broth and you are doubling, use four. The math here is straightforward and gets most of what you need to scale handled. Errors at this stage are usually arithmetic, not recipe craft.' },
    { name: 'Scale salt and spices by 75%, not 100%', body: 'Doubling a recipe does not require doubling the salt. The perception of seasoning saturates — twice the salt usually tastes too salty in a doubled recipe, not exactly right. Start at 75% of the linear scale and adjust at the end with a final tasting. Same for chili, paprika, black pepper, and most strong spices. Bland is fixable at the table; over-seasoned is not.' },
    { name: 'Use the same pan size and adjust time, or change the pan', body: 'A doubled stew in the same pot will not cook in the same time — there is more liquid to heat and more meat to braise. Either use a larger pot (which preserves the time) or accept that cook time will be 20-30% longer. For baking, this is more dangerous: doubling cake batter in a same-sized pan changes everything. A doubled cake recipe needs a bigger pan or two pans, not a thicker layer.' },
    { name: 'Be careful with leavening when scaling baking', body: 'Baking soda and baking powder do not scale linearly because they react with surface area exposed to acid, not just total volume. For most baking, scale leavening at about 80% of the linear ratio when doubling. Doubled cakes with doubled leavening often dome and crack. Halved recipes with halved leavening often come out flat. This is the most common scaling mistake in baking and the hardest to recover from.' },
    { name: 'Use Recipe Chaos Solver to do the math safely', body: 'Tell Recipe Chaos Solver the recipe and the new serving count and it produces a scaled version with the right adjustments — linear where appropriate, sub-linear for salt and leavening, with notes on cook time and pan size. It catches the non-obvious adjustments that pure multiplication misses. Two minutes of input saves the doubled cake from being a doubled disaster.' }
  ],
  cta: {
    glyph:    '🍳',
    headline: "Cooking emergency? Get the fix in seconds.",
    body:     "Tell Recipe Chaos Solver what went wrong, what you have, or what you ran out of. Get a substitute, a rescue, or a step-by-step recovery — fast enough that dinner still happens.",
    features: [
      "Ingredient substitutes",
      "Cooking-disaster rescues",
      "Scaling and conversion math",
      "Works with what you actually have"
    ],
    toolId:   'RecipeChaosSolver',
    toolName: 'Recipe Chaos Solver',
  },
  published: '2026-04-29',
  modified:  '2026-04-29',
};
