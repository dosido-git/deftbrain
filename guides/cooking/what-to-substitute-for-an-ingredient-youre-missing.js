module.exports = {
  slug:          'what-to-substitute-for-an-ingredient-youre-missing',
  category:      'cooking',
  categoryLabel: 'Cooking',
  title:         "What to Substitute for an Ingredient You Are Missing",
  titleHtml:     "What to Substitute <em>for an Ingredient You Are Missing</em>",
  shortTitle:    "Ingredient Substitutes",
  navTitle:      "ingredient substitutes",
  description:   "You are halfway through cooking and out of buttermilk, eggs, baking powder, or whatever else. Here is the framework for finding a substitute that actually works — not just any swap somebody on the internet suggests.",
  deck:          "You are halfway through cooking and out of buttermilk, eggs, baking powder, or whatever else. Here is the framework for finding a substitute that actually works — not just any swap somebody on the internet suggests.",
  ledes: [
    `You are halfway through a recipe. The onion is sweating in the pan. You reach for the buttermilk and the carton is empty. The internet tells you twelve different things — milk plus lemon juice, sour cream, yogurt, kefir, half-and-half plus vinegar — and you do not know which one will actually work for what you are making.\n\nIngredient substitution is not random. Each ingredient does a specific job in a recipe — moisture, fat, acidity, leavening, structure, flavor. A good substitute does the same job. A bad one looks similar but does the wrong thing and your bread does not rise or your sauce splits. Learning to think about ingredients by job, not by name, is the whole skill.`,
    `Here is the framework — and how Recipe Chaos Solver does the matching for you.`,
  ],
  steps: [
    { name: 'Identify what job the ingredient is doing in this recipe', body: 'Buttermilk in pancakes is doing two jobs: providing acid (which reacts with baking soda for lift) and adding moisture and slight tang. Buttermilk in fried chicken is doing one job: tenderizing the meat through acidity. Same ingredient, different jobs. The substitute has to match the job, not just the ingredient. Ask: what would change about this dish if I left this ingredient out entirely? That tells you what it is doing.' },
    { name: 'Pick a swap that matches the job, not just the appearance', body: 'For the acid-plus-moisture job in pancakes, milk plus a tablespoon of lemon juice works perfectly — same chemistry, same texture. For the tenderizing job in fried chicken, plain yogurt thinned with milk works just as well as buttermilk. For richness in mac and cheese, sour cream is closer than yogurt. Match the function. The wrong substitute is the one that looks similar but does not do the same chemistry.' },
    { name: 'Adjust quantities for moisture and fat content', body: 'Substitutes are rarely one-to-one in volume. Greek yogurt is thicker than buttermilk; thin it with milk to match. Honey is sweeter than sugar; use about three-quarters as much. Olive oil for butter changes both fat content and water content; use slightly less. The internet usually gives the right substitute but the wrong ratio. The ratio matters as much as the choice.' },
    { name: 'Know which ingredients have no real substitute', body: 'Yeast cannot be substituted for baking powder in most recipes — they leaven on different timescales. Eggs in a baking recipe with no other binder cannot be replaced with mashed banana and have the result be the same. Cornstarch and flour as thickeners are not interchangeable in equal amounts. Knowing what you cannot substitute is as important as knowing what you can. When in doubt, change the recipe rather than the ingredient.' },
    { name: 'Use Recipe Chaos Solver for the recipe-specific substitute', body: 'Tell Recipe Chaos Solver what you are making, what you are missing, and what you have. The output gives you a substitute calibrated to the dish — not the generic one — plus the right ratio and any adjustment to other ingredients. It is the difference between "milk plus lemon juice" as a generic answer and "for this pancake recipe, use 1 cup milk plus 1 tbsp lemon juice and let sit 5 minutes" — which is what you actually need.' }
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
