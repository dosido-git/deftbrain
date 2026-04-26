// ============================================================
// guide-specs/pets/how-do-i-know-if-my-dog-is-sick.js
// ============================================================
// Source of truth for /guides/pets/how-do-i-know-if-my-dog-is-sick.
// Edit here; run `node scripts/build-guides.js pets` to regenerate.
// ============================================================

module.exports = {
  slug:          'how-do-i-know-if-my-dog-is-sick',
  category:      'pets',
  categoryLabel: 'Pets',

  title:         "How Do I Know If My Dog Is Sick? The Signs That Actually Matter",
  titleHtml:     "How Do I Know If My Dog Is Sick? <em>The Signs That Actually Matter</em>",
  shortTitle:    "How Do I Know If My Dog Is Sick?",
  navTitle:      "How do I know if my dog is sick the signs that actually matter",

  description:   "Dogs can't tell you they don't feel good — they show you. Five categories of signs that consistently mean something is wrong, plus the emergencies that turn watch-and-wait into call-now.",
  deck:          "Dogs can't tell you they don't feel good — they show you. Five categories of signs that consistently mean something is wrong, plus the emergencies that turn watch-and-wait into call-now.",

  published:     '2026-04-25',
  modified:      '2026-04-25',

  ledes: [
    `You can't ask your dog how they're feeling. You can only watch. And dogs are spectacular at hiding when something's wrong — leftover wolf wiring tells them showing weakness gets you eaten. They will compensate, conceal, and carry on long after a person in the same condition would be on the couch.`,
    `That makes the signs harder to read but not unreadable. Most illness in dogs shows up across a small number of categories: appetite, bathroom, energy, and a handful of physical signals you can check yourself. Knowing what to look for is the difference between catching something on day one and catching it three weeks in.`,
  ],

  steps: [
    {
      name: "Watch the appetite — but not just one meal",
      body: "Dogs skip meals for all kinds of harmless reasons: heat, hormones, too many treats, food they're bored of. One missed meal in an otherwise-bright dog is almost never the signal. Sustained refusal across 24 hours is. Refusing a high-value treat your dog always takes — chicken, cheese, peanut butter — is. A dog who turns down food from your hand is more diagnostic than a dog who turns down their bowl. Keep this rule in mind: a one-day appetite dip in a dog who's otherwise themselves is a watch. A multi-day dip, or refusal of food they normally inhale, is a call.",
    },
    {
      name: "Read the bathroom changes",
      body: "This is the single highest-yield category for catching illness early. Vomiting once and bouncing back is usually fine. Repeated vomiting, vomiting blood, or vomiting paired with lethargy is not. Diarrhea for a day is usually fine; bloody diarrhea, persistent diarrhea past 48 hours, or diarrhea plus low energy is not. Drinking dramatically more or less than usual matters. Peeing more, less, or with visible difficulty (squatting without producing, repeated trips, accidents in a house-trained dog) matters. The pattern: one episode that resolves on its own is usually nothing. Duration, blood, or pairing with energy changes is something.",
    },
    {
      name: "Spot the engagement shift",
      body: "Healthy dogs have a recognizable engagement level — they meet you at the door, respond to their name, perk up at the leash. The concerning shift isn't 'moving slower,' which can be normal aging or just a quiet day. The concerning shift is checked-out: a dog who used to greet you and doesn't, a dog whose eyes used to track you and now don't, a dog who responds to nothing that used to work. Eyes are usually the first place this shows. Engagement loss in an otherwise-physically-fine dog is often the earliest sign that something is wrong, and it's the one most worth trusting your gut on.",
    },
    {
      name: "Check the physical signals",
      body: "Five things you can actually check, not just observe. Gum color: pink and moist is normal; pale, white, blue, yellow, or brick-red is not. Press your fingertip on the gum — color should return in under two seconds. Breathing: rapid panting at rest, or visible effort when not exercising or hot, is concerning. Hydration: pinch the skin between the shoulder blades; it should snap back. Skin that stays tented is dehydration. Temperature: a warm or dry nose is not a reliable test — take a real temp if you suspect fever. Normal is 101–102.5°F; over 103°F is fever territory. Belly: a hard, distended, painful belly, especially with restlessness or unproductive retching, is a same-day emergency.",
    },
    {
      name: "Know the emergencies you don't wait on",
      body: "Some signs aren't on the same scale as the rest of this guide. Pale, white, or blue gums. Collapse or sudden inability to stand. A bloated, hard belly with unproductive retching — that's bloat, and it kills dogs in hours, not days. Severe breathing distress. Seizure. Suspected toxin ingestion (chocolate, grapes, xylitol, rodenticide, antifreeze, certain plants). Sudden inability to use the back legs. Repeated bloody vomiting or bloody diarrhea with lethargy. These are ER visits, not vet appointments. The rest of this guide is about reading signals and deciding when to call. This step is the one where the deciding is already done — go now.",
    },
  ],

  callout: {
    afterStep: 1,
    scriptedLine: "Is this new? Has it lasted? Is anything else different?",
    explanation: "Three questions that turn a vague worry into a useful read. New + brief + isolated is almost always nothing. New + persistent + clustered with anything else is a call. The combination matters more than any single observation — and the cluster of small changes is often what catches illness earlier than waiting for one obvious symptom would.",
  },

  cta: {
    glyph:    '🐶',
    headline: "Get a personalized read on your dog's specific signs",
    body:     "This guide is the general checklist. Pet Weirdness Decoder takes the specifics — your dog's breed, age, what's actually happening, how long it's been — and gives you a personalized triage read: reassure, watch and wait, or call the vet today.",
    features: [
      "A specific read on your dog's specific situation",
      "Triage timing — today, this week, or watch-and-wait",
      "Red flags specific to your dog's age and breed",
      "Questions to ask the vet if you go",
      "What to track if you're watching and waiting",
    ],
    toolId:   'PetWeirdnessDecoder',
    toolName: 'Pet Weirdness Decoder',
  },
};
