// ============================================================
// guide-specs/pets/do-dogs-just-vomit-sometimes.js
// ============================================================
// Source of truth for /guides/pets/do-dogs-just-vomit-sometimes.
// Edit here; run `node scripts/build-guides.js pets` to regenerate.
// ============================================================

module.exports = {
  slug:          'do-dogs-just-vomit-sometimes',
  category:      'pets',
  categoryLabel: 'Pets',

  title:         "Do Dogs Just Vomit Sometimes? Yes — But Here's When It Matters",
  titleHtml:     "Do Dogs Just Vomit Sometimes? <em>Yes — But Here's When It Matters</em>",
  shortTitle:    "Do Dogs Just Vomit Sometimes?",
  navTitle:      "Do dogs just vomit sometimes yes but heres when it matters",

  description:   "Healthy dogs vomit occasionally and most one-off episodes mean nothing. Five reasons dogs throw up, ordered from 'totally normal' to 'go to the ER tonight,' plus the rule for telling them apart.",
  deck:          "Healthy dogs vomit occasionally and most one-off episodes mean nothing. Five reasons dogs throw up, ordered from 'totally normal' to 'go to the ER tonight,' plus the rule for telling them apart.",

  published:     '2026-04-25',
  modified:      '2026-04-25',

  ledes: [
    `Your dog just threw up. You're cleaning it up trying to decide whether to call the vet, watch and wait, or throw the rug in the wash and forget it happened. The answer is almost always one of the three, and which one depends on a small number of details — most of them right in front of you.`,
    `Yes, dogs just vomit sometimes. It's normal. The trick is knowing the difference between "ate too fast" and something that needs a vet, and the difference between something that needs a vet and something that needs the ER tonight. Five reasons dogs throw up, ordered from least to most worrying.`,
  ],

  steps: [
    {
      name: "The vomit that's basically nothing",
      body: "Most one-off vomiting in an otherwise-healthy dog is harmless and explainable. Yellow bile on an empty stomach in the morning means they need a small bedtime snack or earlier breakfast. Undigested kibble back up minutes after eating means they ate too fast — slow-feeder bowls fix this. A pile of grass and a little stomach foam means they ate grass and grass came back. The marker for this category: one episode, no recurrence within hours, dog otherwise themselves — eyes bright, appetite returns by the next meal, wants their walk. If your dog throws up and twenty minutes later is asking for their tennis ball, you're almost certainly here.",
    },
    {
      name: "The mild upset that resolves on its own",
      body: "Dietary indiscretion (raided the trash, ate something off the sidewalk, got into cat food), a recent food change, something fatty, mild gastritis. A few episodes within a 12-to-24-hour window, dog stays mostly okay between, rights itself within a day. Standard home approach: withhold food for 12 hours, then offer something bland (boiled chicken and rice, or plain canned pumpkin), then resume normal feeding gradually. If your dog perks back up between episodes and the vomiting tapers off rather than escalating, you're in this category. If it's not resolving by hour 24, escalate to step 3 — that's the line.",
    },
    {
      name: "The repeated vomiting that needs a call",
      body: "More than three episodes in a day, vomiting that persists past 24 hours despite withholding food, or vomiting that recurs every time food goes in. Possible causes range from GI infection, parasites, or food allergy to pancreatitis or partial foreign-body obstruction. The directive here is clean: at three-plus episodes in a day, or vomiting that's still going at hour 24, call the vet. Same day if you can, next morning if you can't. The 'we'll see' window has closed. Bring a description of what came up (color, contents, frequency) and what your dog has eaten in the last 48 hours — the vet will want both.",
    },
    {
      name: "The vomiting paired with something else",
      body: "Pairings change the urgency more than the vomiting itself does. Vomiting plus lethargy. Vomiting plus appetite that doesn't return. Vomiting with blood or coffee-ground-appearance flecks. Vomiting plus fever. Vomiting plus a distended belly. Vomiting plus wobbliness or pale gums. A single vomiting episode in a flat, miserable dog is more serious than five episodes in an otherwise-engaged dog — that's the rule worth memorizing. When vomiting appears alongside another sign, the vomiting is usually a symptom of the other sign rather than the main event. Don't treat it in isolation. Call the vet describing the cluster, not just the vomiting.",
    },
    {
      name: "The vomiting you don't wait on",
      body: "Some presentations aren't 'vomiting questions' anymore. Unproductive retching paired with a distended, hard belly — that's bloat (gastric dilatation-volvulus), and it kills dogs in hours. Repeated vomiting of bright red blood. Vomiting after suspected toxin ingestion — chocolate, grapes or raisins, xylitol, antifreeze, rat poison, certain houseplants (call ASPCA Animal Poison Control: 888-426-4435 before driving, if you have time). Vomiting after trauma. Vomiting paired with collapse, seizure, or sudden inability to stand. These are ER visits, not vet appointments. The 24-hour wait-and-see rule from earlier in the guide does not apply. Go now.",
    },
  ],

  callout: {
    afterStep: 1,
    scriptedLine: "Once or repeated? Dog otherwise themselves? Anything else off?",
    explanation: "The three questions that resolve most vomiting worry. Once + dog acting normal + nothing else wrong = almost always nothing. Repeated, or paired with anything else, or dog clearly off = call. The combination matters more than the vomit itself — what comes up, how often, and what's happening alongside it tell you almost everything.",
  },

  cta: {
    glyph:    '🐶',
    headline: "Get a personalized triage read on your dog's vomiting",
    body:     "This guide covers the general framework. Pet Weirdness Decoder takes the specifics — what came up, how many times, what else is happening, your dog's age and breed — and gives you a personalized triage read: reassure, watch and wait, or call the vet today.",
    features: [
      "A specific read on your dog's specific situation",
      "Triage timing — today, this week, or watch-and-wait",
      "Red flags to watch for given your dog's age and breed",
      "Questions to ask the vet if you go",
      "What to track if you're watching and waiting",
    ],
    toolId:   'PetWeirdnessDecoder',
    toolName: 'Pet Weirdness Decoder',
  },
};
