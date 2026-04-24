// ============================================================
// guide-specs/health/how-to-describe-your-symptoms-to-a-doctor.js
// ============================================================
// Source of truth for /guides/health/how-to-describe-your-symptoms-to-a-doctor.
// Edit here; run `node scripts/build-guides.js health` to regenerate.
// ============================================================

module.exports = {
  slug:          'how-to-describe-your-symptoms-to-a-doctor',
  category:      'health',
  categoryLabel: 'Health',

  title:         "How to Describe Your Symptoms to a Doctor (So They Actually Listen)",
  titleHtml:     "How to Describe Your Symptoms to a Doctor <em>(So They Actually Listen)</em>",
  shortTitle:    "How to Describe Your Symptoms to a Doctor",
  navTitle:      "How to describe your symptoms to a doctor so they actually listen",

  description:   "You've been trying to explain it for three weeks. Doctors are pattern-recognizers — they need the shape of a problem they can work with. A step-by-step approach to describing symptoms in the way that gets taken seriously.",
  deck:          "You've been trying to explain it for three weeks. Doctors are pattern-recognizers — they need the shape of a problem they can work with. A step-by-step approach to describing symptoms in the way that gets taken seriously.",

  published:     '2026-04-24',
  modified:      '2026-04-24',

  ledes: [
    `You've been trying for three weeks to explain it. The pain is there, except when it isn't. It's kind of sharp, unless it's dull. It's worst at night, usually, but not always. You get through the first thirty seconds of your description and you can feel the doctor's attention slipping. It isn't that they don't believe you. It's that you haven't given them the shape of a problem they can work with.`,
    `Doctors are pattern-matchers. They've heard thousands of symptom descriptions, and the ones that land are the ones that fit the patterns they already know. Describing your symptoms well is a specific, teachable skill. Here's how.`,
  ],

  steps: [
    {
      name: "Lead with the compact summary",
      body: "One sentence. The what, the duration, and one key detail. 'I've had a sharp headache behind my right eye for about ten days, and it gets worse when I lie down.' You've just given the doctor three categories of information they need, in under fifteen words. The rest of the conversation builds on that foundation.",
    },
    {
      name: "Name the quality, not just the intensity",
      body: "Doctors distinguish between sharp, dull, throbbing, burning, stabbing, aching, and pressure-like. Each one points to a different category of cause. Saying 'it really hurts' tells the doctor nothing diagnostic; 'it's a burning sensation that spreads down my arm' tells them something specific. If you can't decide on a single word, say 'mostly sharp, sometimes throbbing' — that's also useful information.",
    },
    {
      name: "Give the trigger-and-relief pattern",
      body: "When is it worse? When is it better? After meals, during exercise, at night, when you're stressed, after a specific movement. The pattern is often more diagnostic than the symptom itself. 'My knee hurts when I go down stairs but not up' narrows the causes significantly. 'I feel dizzy when I stand up, but it passes in ten seconds' points somewhere specific.",
    },
    {
      name: "Say what you've already tried",
      body: "Over-the-counter medications, rest, heat, ice, stretches, cutting caffeine, elimination diets. What helped, what didn't, what made it worse. This saves the doctor from suggesting things you've already tested, and gives them information about which categories of cause are less likely. It also signals that you've been paying attention — which changes how the rest of your description gets taken.",
    },
    {
      name: "Name your specific concern",
      body: "'I'm worried this might be a thyroid issue because it runs in my family' is different from 'I don't know, it just doesn't feel right.' Naming your concern — even if you're wrong — gives the doctor a concrete thing to respond to. They can rule it in, rule it out, or explain why they don't think it applies. Without a named concern, they'll choose their own framing, and you might not get to yours.",
    },
  ],

  callout: {
    afterStep: 1,
    scriptedLine: "I've had [specific symptom] for [how long], and [one key detail — worse when X, better when Y, spreading, getting worse, etc.].",
    explanation: "The formula — what, how long, one specific detail — is how doctors are trained to take a history. Opening with it means your description lands in a shape they can work with immediately, instead of one they have to piece together from scattered fragments.",
  },

  cta: {
    glyph:    '🩺',
    headline: "Turn your scattered symptoms into the description that gets heard",
    body:     "Doctor Visit Translator organizes what you've been feeling into the precise language doctors are trained to hear — the quality, the pattern, the timeline, and the concern you haven't been able to put into words.",
    features: [
      "Symptom-quality translator",
      "Trigger-and-relief mapper",
      "Medical vocabulary helper",
      "Photo + log organizer",
      "Concern-naming prompts",
    ],
    toolId:   'DoctorVisitTranslator',
    toolName: 'Doctor Visit Translator',
  },
};
