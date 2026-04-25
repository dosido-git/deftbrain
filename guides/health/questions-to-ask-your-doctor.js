// ============================================================
// guide-specs/health/questions-to-ask-your-doctor.js
// ============================================================
// Source of truth for /guides/health/questions-to-ask-your-doctor.
// Edit here; run `node scripts/build-guides.js health` to regenerate.
// ============================================================

module.exports = {
  slug:          'questions-to-ask-your-doctor',
  category:      'health',
  categoryLabel: 'Health',

  title:         "Prepare for Your Appointment in Advance: Questions to Ask Your Doctor to Get the Most Out of Your Visit",
  titleHtml:     "Prepare for Your Appointment in Advance: <em>Questions to Ask Your Doctor to Get the Most Out of Your Visit</em>",
  shortTitle:    "Questions to Ask Your Doctor",
  navTitle:      "Prepare for your appointment in advance: questions to ask your doctor",

  description:   "A short doctor's appointment compresses a lot of reasoning into a few sentences. Five questions, prepared in advance, decompress it — so you leave with the doctor's thinking, not just the conclusion.",
  deck:          "A short doctor's appointment compresses a lot of reasoning into a few sentences. Five questions, prepared in advance, decompress it — so you leave with the doctor's thinking, not just the conclusion.",

  published:     '2026-04-24',
  modified:      '2026-04-25',

  ledes: [
    `A typical doctor's appointment is fifteen minutes. In that time, your doctor is doing a lot of compressed work — narrowing down what's wrong, weighing options, deciding what to monitor and what to ignore. The conclusions get spoken aloud. The reasoning behind them usually doesn't, unless you ask. Prepared in advance, these five questions are the ones that get the reasoning out.`,
    `They aren't a memorized list. They're a short set of moves you can run in any appointment, regardless of what it's about. Each one targets a place where doctors tend to compress — and where decompressing matters to you.`,
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
    glyph:    '📝',
    headline: "Walk in with the questions tailored to your situation",
    body:     "The five questions in this guide work in any appointment. Doctor Visit Prep takes your symptoms, history, and what you're most worried about, and generates the prioritized questions for your specific visit — the ones that matter if your doctor only has time for two.",
    features: [
      "Prioritized questions, ranked by what matters most",
      "A clinical-ready opener you can read aloud",
      "What to mention even if your doctor doesn't ask",
      "Red-flag symptoms to report first",
      "Pre-visit checklist tailored to your concern",
    ],
    toolId:   'DoctorVisitPrep',
    toolName: 'Doctor Visit Prep',
  },
};
