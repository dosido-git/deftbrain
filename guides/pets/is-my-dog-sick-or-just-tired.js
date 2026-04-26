// ============================================================
// guide-specs/pets/is-my-dog-sick-or-just-tired.js
// ============================================================
// Source of truth for /guides/pets/is-my-dog-sick-or-just-tired.
// Edit here; run `node scripts/build-guides.js pets` to regenerate.
// ============================================================

module.exports = {
  slug:          'is-my-dog-sick-or-just-tired',
  category:      'pets',
  categoryLabel: 'Pets',

  title:         "Is My Dog Sick or Just Tired? How to Tell the Difference",
  titleHtml:     "Is My Dog Sick or Just Tired? <em>How to Tell the Difference</em>",
  shortTitle:    "Is My Dog Sick or Just Tired?",
  navTitle:      "Is my dog sick or just tired how to tell the difference",

  description:   "Your dog has been off all day and you can't tell if it's a low-energy day or something wrong. Five signals that separate just tired from actually sick, plus the emergencies that don't wait until morning.",
  deck:          "Your dog has been off all day and you can't tell if it's a low-energy day or something wrong. Five signals that separate just tired from actually sick, plus the emergencies that don't wait until morning.",

  published:     '2026-04-25',
  modified:      '2026-04-25',

  ledes: [
    `Your dog has been quiet all afternoon. Not interested in their toy. Got up for dinner but barely ate. They're not limping, not throwing up, not panting weird — they're just... off. You're 90% sure it's nothing. The other 10% is what made you open this tab at 11pm.`,
    `Tired and sick can look identical at first glance. Both lie around. Both lose interest. Both can come on out of nowhere. The difference is in the details — how long it's lasted, what else is happening, and whether your dog is still showing up. Five signals that separate one from the other, plus the emergencies that don't wait.`,
  ],

  steps: [
    {
      name: "Watch the engagement, not just the activity",
      body: "A tired dog is still your dog. Their eyes track you when you walk in. They lift their head when you say their name. The tail thumps even if they don't get up. A sick dog goes flat — eyes unfocused, no response to triggers that usually work, indifference that feels different from sleepiness. The activity level can look identical (lying down, not playing). The engagement level is what separates them. If your dog is still in there — still aware, still acknowledging you — they're probably just tired. If your dog has checked out, that's the part to take seriously.",
    },
    {
      name: "Read the appetite, not just one missed meal",
      body: "Dogs skip meals all the time and it's almost always nothing — too many treats earlier, food too hot, hot weather, a hormonal phase. The high-value treat test is more diagnostic than the meal-skip: offer something they always take (chicken, cheese, a favorite biscuit) from your hand. A tired dog still takes it, even if they're not hungry for kibble. A sick dog refuses it. Sustained refusal across 24 hours, or refusing food they normally never turn down, is the version to act on. One missed meal in an otherwise-engaged dog is just one missed meal.",
    },
    {
      name: "Check the recovery overnight",
      body: "Tired bounces back. Sick doesn't. A dog who had a quiet afternoon and is bright the next morning was just tired — case closed. A dog who's been off for 24 hours and is still off the next morning isn't recovering on the normal timeline, and that's the cleanest single test in this guide. Most 'tired' resolves by the next day. Most 'sick' doesn't. If you're somewhere on the line at 11pm, the smartest move is often to sleep on it and re-evaluate in the morning. If they're back to normal, you have your answer. If they're not, call the vet.",
    },
    {
      name: "Notice the cluster, not just the symptom",
      body: "One weird thing in isolation usually isn't worth worrying about. Two or three together usually is. A dog who's lying around but eating, drinking, peeing, and engaging normally is almost always fine. A dog who's lying around AND off their food AND drinking more (or less) than usual AND vomited once is a different conversation, even if each individual symptom seems mild on its own. Illness shows up as a pattern, not a single signal. Count the things that are different from baseline. One — probably nothing. Three — vet conversation today.",
    },
    {
      name: "Know the emergencies that don't wait",
      body: "Some signs aren't 'tired or sick' questions at all — they're emergencies. Pale, white, blue, or brick-red gums (press your finger; color should return in under two seconds). Collapse or sudden inability to stand. A bloated, hard belly with unproductive retching — that's bloat, and it kills dogs in hours. Severe breathing distress, blue tongue, seizure, suspected toxin ingestion, sudden disorientation, repeated bloody vomiting. These aren't on the same scale as the rest of this guide. ER visits, not vet appointments. Not watch-and-wait. If any of these are happening, the rest of this guide doesn't apply — go now.",
    },
  ],

  callout: {
    afterStep: 1,
    scriptedLine: "How long has it been? What else is different? Is my dog still showing up?",
    explanation: "The three questions that separate tired from sick. Hours usually mean tired; a full day or more often means sick. One thing different usually means tired; a cluster of changes means sick. A dog still tracking you with their eyes is probably tired; a dog who's checked out probably isn't. Most worry resolves cleanly when you answer all three honestly.",
  },

  cta: {
    glyph:    '🐶',
    headline: "Get a personalized triage read on your dog",
    body:     "This guide covers the general framework. Pet Weirdness Decoder takes the specifics — your dog's breed, age, what's actually different, how long it's been — and gives you a personalized triage read: reassure, watch and wait, or call the vet today.",
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
