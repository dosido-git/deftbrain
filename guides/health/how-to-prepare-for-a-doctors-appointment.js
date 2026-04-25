// ============================================================
// guide-specs/health/how-to-prepare-for-a-doctors-appointment.js
// ============================================================
// Source of truth for /guides/health/how-to-prepare-for-a-doctors-appointment.
// Edit here; run `node scripts/build-guides.js health` to regenerate.
// ============================================================

module.exports = {
  slug:          'how-to-prepare-for-a-doctors-appointment',
  category:      'health',
  categoryLabel: 'Health',

  title:         "How to Prepare for a Doctor's Appointment (So You Don't Waste It)",
  titleHtml:     "How to Prepare for a Doctor&#39;s Appointment <em>(So You Don&#39;t Waste It)</em>",
  shortTitle:    "How to Prepare for a Doctor's Appointment",
  navTitle:      "How to prepare for a doctor's appointment so you don't waste it",

  description:   "You've waited weeks for the appointment. You'll have fifteen minutes. A practical, step-by-step approach to walking in prepared — so nothing gets forgotten and nothing gets wasted.",
  deck:          "You've waited weeks for the appointment. You'll have fifteen minutes. A practical, step-by-step approach to walking in prepared — so nothing gets forgotten and nothing gets wasted.",

  published:     '2026-04-24',
  modified:      '2026-04-25',

  ledes: [
    `You booked the appointment three weeks ago. Now it's tomorrow and you're running through everything in your head — the symptoms, the questions, the concern that made you call in the first place. And you can already feel how fifteen minutes won't be enough. The last time you saw a doctor, you remembered the most important thing halfway home.`,
    `The good news is that a prepared patient is a different patient. Not smarter, not more assertive — just organized. Here's the preparation.`,
  ],

  steps: [
    {
      name: "Pick your top three questions and write them down",
      body: "Three, not ten. If you walk in with a list of ten, you'll get cursory answers to all of them. Pick the three that matter most — the symptom you're most worried about, the decision you need help with, the question you'll kick yourself for not asking. Everything else can wait for the follow-up message or the next visit.",
    },
    {
      name: "Bring a current medication list — with doses",
      body: "Not just 'I take something for blood pressure.' The name, the dose, and how long you've been on it. Same for supplements and over-the-counter pills. Snap a photo of the bottles if it's easier. Medication interactions are a common reason a visit runs off course; giving your doctor the full list up front saves the detour.",
    },
    {
      name: "Know your symptom timeline",
      body: "When did it start? When is it worse? When is it better? If you can't remember, look back through your phone — photos, messages, and calendar entries can often pin down when something began. Doctors are trained to look for patterns. Your job is to give them the pattern, not the raw feelings.",
    },
    {
      name: "Rehearse your one-sentence opener",
      body: "The doctor will say 'What brings you in today?' — probably within the first thirty seconds. Your answer sets the direction for the next fifteen minutes. Don't wing it. Practice one sentence that names the main concern, how long it's been going on, and one key detail. A crisp opener buys you time for everything else.",
    },
    {
      name: "Note anything that's changed since last visit",
      body: "New stressors, new medications, new diagnoses from other doctors, a job change, a move, a death in the family. Much of medicine is reading the whole context, not just the current complaint. The doctor who knows your father died six months ago will interpret your new insomnia differently than the one who doesn't.",
    },
  ],

  callout: {
    afterStep: 4,
    scriptedLine: "I've had [specific symptom] for [how long], and it's [one key detail — worse when X, better when Y, getting worse, etc.].",
    explanation: "The formula — what, how long, one specific detail — is how doctors are trained to take a history. Opening with it puts your visit in a shape they can work with immediately, instead of one they have to piece together.",
  },

  cta: {
    glyph:    '📝',
    headline: "Walk in ready — without forgetting the thing that matters",
    body:     "The five moves in this guide work for any appointment. Doctor Visit Prep takes your symptoms, history, and what you're most worried about, and turns them into the prep sheet for your specific visit — opener, prioritized questions, and the things to mention even if your doctor doesn't ask.",
    features: [
      "Prioritized questions, ranked by what matters most",
      "A clinical-ready opener you can read aloud",
      "Things to mention even if your doctor doesn't ask",
      "A pre-visit checklist tailored to your concern",
      "A short list of what to bring",
    ],
    toolId:   'DoctorVisitPrep',
    toolName: 'Doctor Visit Prep',
  },
};
