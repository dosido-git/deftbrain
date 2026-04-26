// ============================================================
// guide-specs/pets/weird-dog-behaviors-explained.js
// ============================================================
// Source of truth for /guides/pets/weird-dog-behaviors-explained.
// Edit here; run `node scripts/build-guides.js pets` to regenerate.
// ============================================================

module.exports = {
  slug:          'weird-dog-behaviors-explained',
  category:      'pets',
  categoryLabel: 'Pets',

  title:         "Weird Dog Behaviors, Explained (And When to Actually Worry)",
  titleHtml:     "Weird Dog Behaviors, Explained <em>(And When to Actually Worry)</em>",
  shortTitle:    "Weird Dog Behaviors, Explained",
  navTitle:      "Weird dog behaviors explained and when to actually worry",

  description:   "Your dog just did the thing again. Some weird behaviors are wiring; a few are actually telling you something is wrong. Five common patterns explained, plus the one you genuinely can't ignore.",
  deck:          "Your dog just did the thing again. Some weird behaviors are wiring; a few are actually telling you something is wrong. Five common patterns explained, plus the one you genuinely can't ignore.",

  published:     '2026-04-25',
  modified:      '2026-04-25',

  ledes: [
    `Your dog just did the thing again — the head-tilt, the staring, the sudden full-body shake when nothing happened. You're 90% sure it's fine. The other 10% is what makes you Google it at 11pm.`,
    `Dogs are weird. Most of their weirdness is wiring: leftover wolf behaviors, breed quirks, individual personality. A small fraction is your dog telling you something is off. The trick is knowing which is which, and the difference often comes down to a single change — how recently the behavior started.`,
  ],

  steps: [
    {
      name: "Decode the grass-eating",
      body: "Dogs eat grass. Most do, regularly, and most of the time it means nothing more than they wanted to. The myth that grass means stomach upset doesn't hold up well — most grass-eating dogs aren't sick before or after, and don't vomit. The quirky version is occasional, post-meal, on a familiar lawn. The concerning version is sudden frantic grass-eating accompanied by lip-licking, drooling, or unproductive retching. That pattern points at nausea your dog is trying to relieve, and warrants a vet call if it lasts more than a day.",
    },
    {
      name: "Read the spinning and tail-chasing",
      body: "Puppies chase their tails because tails move and puppies are absurd. That's quirky and almost always grows out of it. The concerning version shows up in adult dogs who do it for long stretches, can't be redirected, or seem distressed during. That can signal compulsive behavior, neurological issues, or skin or anal-gland irritation they're trying to reach. A few minutes of zoomies-with-tail-chasing is fine. Ten minutes of tight obsessive spinning is a vet conversation.",
    },
    {
      name: "Spot the difference between alert and afraid",
      body: "Dogs hear and smell things you can't. The pause-stare-listen sequence — head up, ears forward, focused on nothing visible — is your dog processing something real to them. That's quirky and reflects how good their senses are. The concerning version is a sudden change: a dog who's been confident in their own home now flinching at corners, refusing rooms, or showing fear at the same spot repeatedly. Sudden onset of fear behaviors in a previously confident dog can point at vision loss, hearing changes, or pain — and warrants a vet visit even if your dog seems fine otherwise.",
    },
    {
      name: "Understand the poop-eating",
      body: "Coprophagia is incredibly common, almost always disgusting, and mostly not medically serious. Puppies do it as part of investigating the world; some dogs do it for nutritional reasons; some do it because the behavior was reinforced when an owner ran over yelling. The quirky version is occasional and stops with management — clean the yard, train 'leave it,' redirect. The concerning version is sudden onset in an adult dog who never did it before, which can signal nutritional deficiency, parasites, or an underlying digestive condition. Recent change matters more than the behavior itself.",
    },
    {
      name: "Know the one you can't ignore",
      body: "Head pressing — a dog standing with their head pushed against a wall, corner, or piece of furniture, often for extended periods, often with a vacant or unfocused expression — is not a quirky behavior. It's a classic sign of neurological problems: liver shunts, toxin exposure, brain inflammation, head trauma. Unlike everything else in this guide, head pressing has no quirky version. If your dog is doing it, they need a vet that day, not next week. The other behaviors here are usually fine; this one is usually not.",
    },
  ],

  callout: {
    afterStep: 1,
    scriptedLine: "Is this new? Is it persistent? Is my dog otherwise themselves?",
    explanation: "The three questions that turn a worried Google search into a useful read on what's happening. New + persistent + change in baseline behavior = worth a call. Familiar + occasional + dog otherwise themselves = almost certainly quirky. Most weird-behavior questions resolve cleanly when you answer all three.",
  },

  cta: {
    glyph:    '🐶',
    headline: "Get a personalized read on your dog's specific weirdness",
    body:     "This guide covers five common patterns. Pet Weirdness Decoder takes whatever your dog is actually doing — the specific behavior, the timeline, what changed — and gives you a personalized triage read: reassure, watch and wait, or call the vet today.",
    features: [
      "A specific read on your dog's specific behavior",
      "Triage timing — today, this week, or never",
      "Red flags to watch for in your dog",
      "Questions to ask the vet if you go",
      "What to track if you're watching and waiting",
    ],
    toolId:   'PetWeirdnessDecoder',
    toolName: 'Pet Weirdness Decoder',
  },
};
