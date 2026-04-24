// ============================================================
// guide-specs/health/how-to-understand-what-your-doctor-actually-said.js
// ============================================================
// Source of truth for /guides/health/how-to-understand-what-your-doctor-actually-said.
// Edit here; run `node scripts/build-guides.js health` to regenerate.
// ============================================================

module.exports = {
  slug:          'how-to-understand-what-your-doctor-actually-said',
  category:      'health',
  categoryLabel: 'Health',

  title:         "How to Understand What Your Doctor Actually Said (And What You're Actually Supposed to Do)",
  titleHtml:     "How to Understand What Your Doctor Actually Said <em>(And What You&#39;re Actually Supposed to Do)</em>",
  shortTitle:    "How to Understand What Your Doctor Actually Said",
  navTitle:      "How to understand what your doctor actually said and what you're supposed to do",

  description:   "You left with a plan, a prescription, and the feeling you didn't catch half of it. A step-by-step approach to reconstructing what you were told — and what you actually need to do about it.",
  deck:          "You left with a plan, a prescription, and the feeling you didn't catch half of it. A step-by-step approach to reconstructing what you were told — and what you actually need to do about it.",

  published:     '2026-04-24',
  modified:      '2026-04-24',

  ledes: [
    `You're home from the appointment. You have the paperwork in front of you. Your partner asks what the doctor said, and you start a sentence and can't finish it. Something about your thyroid, maybe, or was it your kidneys? You're supposed to take the new pill with food, or was it without? The visit felt like it made sense while it was happening, and now twenty minutes later you realize you're not sure what any of it actually means.`,
    `Medical communication has patterns — specific words that mean specific things, a standard structure for the after-visit summary, and standard places where the actually-useful information hides. Once you know the patterns, decoding is easier than it looks. Here's the sequence.`,
  ],

  steps: [
    {
      name: "Start with the after-visit summary",
      body: "Most appointments now end with a written summary — printed, emailed, or available in the patient portal. It's the least-read document in American medicine and one of the most useful. Read it before you try to remember what was said out loud. Focus on three things: the diagnosis (or the 'likely cause' language), the plan (what you're supposed to do), and the follow-up (when to come back, when to call).",
    },
    {
      name: "Translate the jargon",
      body: "Medical writing uses specific phrases that sound descriptive but are actually codes. 'Consistent with' means 'this matches, but could also be other things.' 'Unremarkable' means 'normal, nothing caught our attention.' 'Idiopathic' means 'we don't know why.' 'Chronic' means 'ongoing, not a new problem.' Five minutes looking up unfamiliar terms on a reputable source (Mayo Clinic, MedlinePlus) is almost always worth it.",
    },
    {
      name: "Figure out what you're supposed to do",
      body: "What are you actually supposed to do between now and your next contact with the doctor? Take a new medication? Change a dose? Watch for specific symptoms? Get a test? The plan is often buried in a bullet point inside a paragraph. If you can't find it clearly stated, assume it isn't — either because it wasn't communicated well or because there isn't a clear plan. Both are worth a follow-up.",
    },
    {
      name: "Notice what was ruled out, not just what was found",
      body: "Doctors often communicate diagnoses in the negative — not 'you have X' but 'we're not worried about X anymore.' Reading the summary for what was excluded is sometimes more informative than looking for what was confirmed. If the visit was about chest pain and the summary says 'cardiac workup negative,' that's a specific and meaningful answer, just delivered sideways.",
    },
    {
      name: "Send a portal message for anything still unclear",
      body: "Patient portals exist for exactly this. A short, specific message gets clarification within a few business days, and the doctor's reply goes into your chart alongside the original note — useful if you ever need to reference it later. You don't need to justify asking. If something wasn't clear, ask.",
    },
  ],

  callout: {
    afterStep: 4,
    scriptedLine: "I left my appointment a bit unclear on [specific thing]. Could you clarify what was meant by [phrase or instruction]?",
    explanation: "This is the standard portal-message pattern. Specific, polite, requires no apology, and gets routed to the right place. Most providers respond within 1–3 business days, and their reply becomes part of your medical record.",
  },

  cta: {
    glyph:    '🩺',
    headline: "Turn the jargon into a plan you can actually follow",
    body:     "Doctor Visit Translator decodes your after-visit summary into plain language: what was found, what was ruled out, what you're supposed to do, and when to call back.",
    features: [
      "Medical jargon translator",
      "After-visit summary decoder",
      "Plain-English diagnosis",
      "Treatment plan clarifier",
      "Follow-up question drafts",
    ],
    toolId:   'DoctorVisitTranslator',
    toolName: 'Doctor Visit Translator',
  },
};
