module.exports = {
  slug:          'how-to-fix-a-cooking-disaster',
  category:      'cooking',
  categoryLabel: 'Cooking',
  title:         "How to Fix a Cooking Disaster",
  titleHtml:     "How to Fix <em>a Cooking Disaster</em>",
  shortTitle:    "Rescue a Disaster",
  navTitle:      "fix a cooking disaster",
  description:   "Burnt sauce, too-salty soup, broken cream, gummy rice. Most cooking disasters are recoverable if you act fast and know the right move. Here is the triage.",
  deck:          "Burnt sauce, too-salty soup, broken cream, gummy rice. Most cooking disasters are recoverable if you act fast and know the right move. Here is the triage.",
  ledes: [
    `Something has gone visibly wrong. The sauce broke. The soup is too salty to eat. The rice is gluey. The chicken is burned on the bottom. People are arriving in forty minutes and the dish that took you two hours is unservable.\n\nMost cooking disasters are fixable. Not all of them — sometimes the right answer is to start over or order in — but the fixable ones have specific moves, and the moves only work if you do them fast and do not panic. The recipe-rescue skill is mostly knowing which disaster you have and matching it to its move. Learn five and you can save almost any dinner.`,
    `Here is the triage — and how Recipe Chaos Solver picks the right move for what specifically went wrong.`,
  ],
  steps: [
    { name: 'Too salty: dilute, do not chase', body: 'Adding more of everything else to balance does not work — you end up with twice as much food that is still slightly too salty. The fix is dilution: add unsalted broth or water, then re-thicken if needed. For soup, drop in a peeled raw potato to absorb salt for fifteen minutes, then remove. For sauce, double the unsalted base and adjust seasoning. The myth about adding sugar to fix saltiness only masks the salt; it does not remove it.' },
    { name: 'Broken cream sauce: emulsify with hot liquid and a whisk', body: 'When a cream sauce splits — fat separates from the liquid, looks curdled — pull it off the heat immediately. Add a tablespoon of cold water or warm broth, whisk hard, and it usually re-emulsifies. If that fails, push it through a sieve and start a new emulsion: heat a tablespoon of cream in a clean pan, then whisk the broken sauce in slowly. Most broken sauces are saved in under two minutes if you act before they cool.' },
    { name: 'Burnt bottom: lift the unburnt part out, do not stir', body: 'When you smell burning, do not stir — stirring distributes the burnt flavor through the whole pot. Pull the pan off the heat. Carefully spoon the unburnt food from the top into a clean pan, leaving the burnt layer behind. Smell the rescued portion; if it tastes scorched, add fresh aromatics and a splash of acid (lemon, vinegar, wine) to refresh. Do not try to reuse the original pot.' },
    { name: 'Gluey rice: rinse and steam', body: 'Overcooked, sticky rice can be partly rescued. Drain it, rinse with cold water to wash off surface starch, return to a low pan with a clean towel under the lid for ten minutes. The towel absorbs steam and the grains separate slightly. It will not be perfect but will be servable. For very far gone rice, repurpose: fried rice (chop, fry hard in oil) or rice pudding both prefer overcooked rice as a starting point.' },
    { name: 'Tell Recipe Chaos Solver exactly what happened', body: 'Recipe Chaos Solver takes a disaster description — "I burned the bottom of my chili" or "my hollandaise broke" — and gives you the specific recovery move plus the timing window. Some disasters are time-sensitive; the recovery only works in the first few minutes. Knowing what to do without having to look it up is the difference between dinner happening and not happening.' }
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
