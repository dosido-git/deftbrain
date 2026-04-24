// ============================================================
// guide-specs/health/what-questions-to-ask-your-doctor.js
// ============================================================
// Source of truth for /guides/health/what-questions-to-ask-your-doctor.
// Edit here; run `node scripts/build-guides.js health` to regenerate.
// ============================================================

module.exports = {
  slug:          'what-questions-to-ask-your-doctor',
  category:      'health',
  categoryLabel: 'Health',

  title:         "What Questions to Ask Your Doctor (That You'll Wish You'd Asked Later)",
  titleHtml:     "What Questions to Ask Your Doctor <em>(That You&#39;ll Wish You&#39;d Asked Later)</em>",
  shortTitle:    "What Questions to Ask Your Doctor",
  navTitle:      "What questions to ask your doctor — the ones you'll wish you'd asked",

  description:   "Most people walk out wishing they'd asked something they didn't. The right questions aren't longer or fancier — they're sharper. Five questions that change what you walk out with.",
  deck:          "Most people walk out wishing they'd asked something they didn't. The right questions aren't longer or fancier — they're sharper. Five questions that change what you walk out with.",

  published:     '2026-04-24',
  modified:      '2026-04-24',

  ledes: [
    `The doctor asks 'any questions?' and you say no. Then you spend the drive home realizing there were five. What the medication is actually for. Whether you need to worry. What happens if it doesn't work. By the time you remember, the visit is over — and you're stuck with the version of the answer you imagined instead of the one you'd have gotten.`,
    `Good questions aren't a memorized list. They're a short set of moves you can run in any appointment, regardless of what it's about. Here are the five that earn their place.`,
  ],

  steps: [
    {
      name: "Ask what they're ruling out",
      body: "Most diagnostic thinking is a process of elimination. Asking what your doctor is ruling out is a shortcut to understanding what they think is going on. It's also a way to confirm they're considering the thing you're worried about. If your chest tightness isn't being checked for a heart issue, you want to know why before you leave.",
    },
    {
      name: "Ask about the option they didn't recommend",
      body: "Every recommendation has alternatives the doctor considered and set aside. Asking 'what was your second choice?' surfaces the reasoning behind the first one. It also reveals options you might prefer — a different medication, a wait-and-see approach, a lifestyle change. Doctors don't usually volunteer the path they rejected unless you ask.",
    },
    {
      name: "Ask about the timeline — when to worry, when to relax",
      body: "Most conditions have a rhythm: this should start improving in X days; if it's still the same after Y days, that's a problem; if Z happens, call immediately. Get that rhythm before you leave. 'When should I expect to feel better?' and 'When should I call you back?' are two different questions — you need both answers.",
    },
    {
      name: "Ask how confident they are",
      body: "Doctors deal in probabilities, not certainties. Some diagnoses are clear; many are best guesses based on the evidence available. Asking about confidence doesn't undermine the doctor — it tells you how to calibrate your own worry. A 90-percent answer means stop thinking about it. A 40-percent answer means pay attention to how things progress.",
    },
    {
      name: "Before you leave, ask what you're not asking",
      body: "The last thirty seconds of an appointment are underused. 'What am I not asking that I should be?' invites the doctor to flag anything they were planning to mention but hadn't yet. Half the time you'll get a genuinely useful answer. The other half you'll get 'nothing, I think we covered it' — and you leave knowing you didn't miss anything.",
    },
  ],

  callout: {
    afterStep: 3,
    scriptedLine: "When should I expect improvement, and at what point should I call you back?",
    explanation: "Two questions rolled into one, and both have concrete timelines as answers. This is the hardest question for a doctor to hand-wave, which is exactly why it works.",
  },

  cta: {
    glyph:    '🩺',
    headline: "Get the questions you'd have come up with over the next three hours — now",
    body:     "Doctor Visit Translator generates the smart follow-up questions tailored to your specific situation, so you walk in with the list you'd have built if you'd had all day.",
    features: [
      "Situation-specific questions",
      "Follow-up prompts by diagnosis",
      "Plain-English phrasing",
      "Alternatives you didn't know to ask",
      "Final-30-seconds checklist",
    ],
    toolId:   'DoctorVisitTranslator',
    toolName: 'Doctor Visit Translator',
  },
};
