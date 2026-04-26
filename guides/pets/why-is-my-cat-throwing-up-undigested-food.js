// ============================================================
// guide-specs/pets/why-is-my-cat-throwing-up-undigested-food.js
// ============================================================
// Source of truth for /guides/pets/why-is-my-cat-throwing-up-undigested-food.
// Edit here; run `node scripts/build-guides.js pets` to regenerate.
// ============================================================

module.exports = {
  slug:          'why-is-my-cat-throwing-up-undigested-food',
  category:      'pets',
  categoryLabel: 'Pets',

  title:         "Why Is My Cat Throwing Up Undigested Food? The 5 Real Reasons",
  titleHtml:     "Why Is My Cat Throwing Up Undigested Food? <em>The 5 Real Reasons</em>",
  shortTitle:    "Why Is My Cat Throwing Up Undigested Food?",
  navTitle:      "Why is my cat throwing up undigested food the 5 real reasons",

  description:   "Undigested food coming back up is one of the most common cat-owner concerns — and the causes are a small, knowable set. Five reasons cats throw up undigested food, from 'fix the bowl' to 'see the vet today.'",
  deck:          "Undigested food coming back up is one of the most common cat-owner concerns — and the causes are a small, knowable set. Five reasons cats throw up undigested food, from 'fix the bowl' to 'see the vet today.'",

  published:     '2026-04-25',
  modified:      '2026-04-25',

  ledes: [
    `You've watched your cat eat. Inhale, really. And then, ten minutes later, there's a pile on the floor with food in it that looks barely chewed. You're now Googling whether this counts as a problem.`,
    `It usually doesn't, and the cause is usually simple. But "usually" isn't always, and undigested food coming up regularly can also point at things that need a vet. Five real reasons cats throw up undigested food, ordered from most fixable at home to most worth calling about.`,
  ],

  steps: [
    {
      name: "They're eating too fast",
      body: "This is the single most common cause and the easiest to fix. Cats — especially in multi-cat households, food-anxious rescues, or cats on a once-a-day feeding schedule — bolt their food, swallow large pieces without chewing, and a stomach full of barely-touched kibble triggers the food right back up. The classic presentation: food comes up within minutes of eating, in a tube shape (the shape of the esophagus), still recognizable as kibble. The fix is mechanical: a slow-feeder bowl, a puzzle feeder, scattering food across a tray, or splitting one meal into several smaller ones across the day. If the regurgitation stops when you slow them down, you've found your answer and you don't need a vet.",
    },
    {
      name: "It's actually a hairball, not just food",
      body: "Cats groom constantly and swallow hair. The hair forms a wad in the stomach and comes back up, often mixed with whatever food was in there. The clue is texture and content: if there's clearly hair visible, or what came up is dense and cylindrical, you're probably dealing with a hairball rather than pure food regurgitation. Long-haired breeds and shedding seasons make this more frequent. Manageable at home: regular brushing (especially during shedding seasons), hairball-control food, or hairball-paste treats. Occasional hairballs are normal — most cats produce them. Weekly or more frequent is worth mentioning to your vet, even if your cat seems otherwise fine.",
    },
    {
      name: "They have a food sensitivity or intolerance",
      body: "This shows up as a pattern, not an episode. Cats with a sensitivity to a specific protein — chicken, beef, fish, and dairy are the common culprits — vomit consistently after eating that food, sometimes within minutes, sometimes within hours, often with the food only partially digested. The tell is consistency: it happens with a specific food and stops if you change to a different protein source or a limited-ingredient diet. This usually warrants a vet conversation rather than DIY trial-and-error, because diagnosis ideally involves a structured elimination diet — running it informally tends to confound the result.",
    },
    {
      name: "It's regurgitation, not vomiting (and that distinction matters)",
      body: "This step is worth a paragraph because vets care about it: vomiting is active (heaving, abdominal contractions, the cat is clearly working at it for a few seconds before food comes up); regurgitation is passive (food just comes back up with no effort, often right after eating, sometimes still in tube shape). They look similar. They mean different things. Passive regurgitation of undigested food can point at an upper-GI issue — esophageal motility problems, megaesophagus, partial obstruction, or rarely a tumor. If your cat brings food up without retching, especially shortly after eating, especially repeatedly, that's the kind of detail your vet specifically wants to know. Tell them which it is — it changes what they investigate.",
    },
    {
      name: "The version that needs a vet, not a bowl change",
      body: "Frequent vomiting (more than once a week as a sustained pattern) paired with anything else is the line where home fixes stop applying. Anything else means: weight loss, change in appetite or thirst, lethargy, hiding, changes in litter-box habits, or blood in what comes up. That cluster points at conditions bowl swaps don't reach — chronic kidney disease, hyperthyroidism, IBD, lymphoma, intestinal obstruction, pancreatitis. None get better on their own; some get much worse. And there are emergency markers worth knowing: vomiting that won't stop across hours, inability to keep water down, severe lethargy, suspected ingestion of string or ribbon (a swallowed string can saw through intestines — never pull on a visible end), or suspected toxin ingestion (lilies, antifreeze, human medications). Those go to the ER. The rest is a vet workup, not wait-and-see — bring a record of how often it's happening and what you've already tried.",
    },
  ],

  callout: {
    afterStep: 1,
    scriptedLine: "How fast did they eat? How often is it happening? Is anything else changing?",
    explanation: "Three questions that route most cases. Eating fast + occasional + cat otherwise fine = mechanical fix at the bowl. Steady pattern + nothing else off = food sensitivity or hairball worth flagging. A pattern + other changes (weight, thirst, energy, litter box) = vet workup. The third question is the most important one — undigested food coming up alone is usually fixable; undigested food coming up alongside anything else is usually not.",
  },

  cta: {
    glyph:    '🐱',
    headline: "Get a personalized read on your cat's pattern",
    body:     "This guide covers the five common causes. Pet Weirdness Decoder takes the specifics — your cat's breed, age, how often it's happening, what else is going on, what you've already tried — and gives you a personalized triage read: try this fix, monitor for these signs, or call the vet today.",
    features: [
      "A specific read on your cat's specific pattern",
      "Triage timing — today, this week, or watch-and-wait",
      "Change-in-baseline cues to watch for",
      "Questions to ask the vet if you go",
      "What to track if you're watching and waiting",
    ],
    toolId:   'PetWeirdnessDecoder',
    toolName: 'Pet Weirdness Decoder',
  },
};
