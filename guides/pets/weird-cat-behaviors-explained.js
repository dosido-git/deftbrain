// ============================================================
// guide-specs/pets/weird-cat-behaviors-explained.js
// ============================================================
// Source of truth for /guides/pets/weird-cat-behaviors-explained.
// Edit here; run `node scripts/build-guides.js pets` to regenerate.
// ============================================================

module.exports = {
  slug:          'weird-cat-behaviors-explained',
  category:      'pets',
  categoryLabel: 'Pets',

  title:         "Weird Cat Behaviors, Explained (And When to Actually Worry)",
  titleHtml:     "Weird Cat Behaviors, Explained <em>(And When to Actually Worry)</em>",
  shortTitle:    "Weird Cat Behaviors, Explained",
  navTitle:      "Weird cat behaviors explained and when to actually worry",

  description:   "Cats are weird on purpose, but a small fraction of weirdness is them telling you something is off. Five common cat behaviors explained, plus the change-in-baseline rule that separates quirky from concerning.",
  deck:          "Cats are weird on purpose, but a small fraction of weirdness is them telling you something is off. Five common cat behaviors explained, plus the change-in-baseline rule that separates quirky from concerning.",

  published:     '2026-04-25',
  modified:      '2026-04-25',

  ledes: [
    `Your cat is staring at the wall. Or the ceiling. Or, somehow, both at once. They've been doing it for ten minutes. You are now Googling, against your better judgment.`,
    `Cats are weird on purpose. Their wiring is built around predator senses we can't access — sounds we can't hear, scents we can't track, motion we can't see. Most of what looks like cosmic horror to us is them processing the world. A small fraction is something to act on. The difference usually comes down to whether the behavior is new.`,
  ],

  steps: [
    {
      name: "Decode the wall-staring",
      body: "Cats see, hear, and smell things you don't. Air currents, dust motes catching light, the high-frequency hum of a power supply, an insect on the ceiling, the soft scrape of a mouse two rooms away. When your cat stares at 'nothing,' they're almost always processing something real to them. This is the most reliably quirky behavior in this guide. The pattern — sudden focus, locked posture, occasional ear-tracking — is normal predator wiring. The concerning version is rare: persistent wall-staring without focus, often combined with disorientation or unusual vocalization, which can signal cognitive changes in elderly cats. For a cat under 10 with intermittent wall-watching, you're fine.",
    },
    {
      name: "Read the over-grooming",
      body: "Cats groom roughly 30% of their waking time. That's normal. Over-grooming — bald patches, broken hairs, raw skin, grooming the same spot for thirty minutes straight — is not. The quirky version doesn't really exist; cats don't accidentally over-groom. The concerning version splits two ways: stress-driven (new pet in the house, move, schedule change) or pain-driven. Cats often groom over a hidden ache — joints, urinary tract, skin condition — as a self-soothing response. If you can identify a recent stressor and the grooming started within weeks of it, manage the stressor and watch. If there's no obvious stressor, treat it as pain until proven otherwise; that's the rule among cat-knowledgeable vets.",
    },
    {
      name: "Spot the meaningful hiding",
      body: "Cats hide. Their wiring tells them small dark spaces are safer than open ones, and a cat retreating to the closet during a thunderstorm is just being a cat. The quirky version is contextual — visitors, vacuum, fireworks, a delivery — and ends when the trigger does. The concerning version is sudden hiding without a context, especially in a previously confident cat, especially combined with reduced eating, reduced grooming, or unusual quietness. Cats hide pain by hiding themselves. A cat who suddenly stops appearing for meals or for company is often telling you something is wrong.",
    },
    {
      name: "Recognize the eating-non-food",
      body: "Pica — cats eating wool, plastic, hair ties, cardboard, dirt — is not a quirky cat thing. It's worth treating as concerning even when you're not sure. The medical version can signal mineral deficiency, anemia, gastrointestinal issues, or compulsive behavior. The behavioral version often points at boredom, weaning issues, or stress. A cat who licks a cardboard box once is fine. A cat who eats a sock is a cat headed to the vet — and not just because the sock has to come back out, but because the urge itself wants explaining.",
    },
    {
      name: "Know the late-night yowl",
      body: "Cats vocalize for many reasons: hunger, boredom, demanding attention, a closed door. That's quirky. The concerning version is a specific shift — an older cat who develops a new pattern of loud yowling, especially at night, especially in unfamiliar parts of the house, especially in a cat who used to be quiet. That pattern can signal cognitive dysfunction, hyperthyroidism, hypertension, or pain. Unlike most things in this guide, this one rarely improves on its own. A senior cat with new-onset nighttime vocalization is a vet visit, not a watch-and-wait.",
    },
  ],

  callout: {
    afterStep: 1,
    scriptedLine: "Is this new? Is it persistent? Is my cat otherwise themselves?",
    explanation: "Cats are masters at hiding distress — a cat who's still eating, grooming, and showing up for company is usually fine even when their behavior is bizarre. A cat whose baseline has shifted (quieter, hungrier, hiding more, grooming less) is communicating something. The change matters more than the strange behavior itself.",
  },

  cta: {
    glyph:    '🐱',
    headline: "Get a personalized read on your cat's specific weirdness",
    body:     "This guide covers five common patterns. Pet Weirdness Decoder takes whatever your cat is actually doing — the specific behavior, the timeline, what changed — and gives you a personalized triage read: reassure, watch and wait, or call the vet today.",
    features: [
      "A specific read on your cat's specific behavior",
      "Triage timing — today, this week, or never",
      "Change-in-baseline cues to watch for",
      "Questions to ask the vet if you go",
      "What to track if you're watching and waiting",
    ],
    toolId:   'PetWeirdnessDecoder',
    toolName: 'Pet Weirdness Decoder',
  },
};
