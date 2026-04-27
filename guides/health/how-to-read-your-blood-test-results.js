module.exports = {
  slug:          'how-to-read-your-blood-test-results',
  category:      'health',
  categoryLabel: 'Health',

  title:         "How to Read Your Blood Test Results (Without Panicking About Every Number)",
  titleHtml:     "How to Read Your Blood Test Results <em>(Without Panicking About Every Number)</em>",
  shortTitle:    "How to Read Your Blood Test Results",
  navTitle:      "How to read your blood test results without panicking about every number",

  description:   "A blood panel has thirty values and most of them don't mean anything in isolation. Here's how to tell which ones are worth a closer look and which ones are just noise.",
  deck:          "A blood panel has thirty values and most of them don't mean anything in isolation. Here's how to tell which ones are worth a closer look and which ones are just noise.",

  ledes: [
    `The results landed in your patient portal three hours before your follow-up appointment. There's a long list of values, and at least four of them have a small letter next to them — H, L, or just an asterisk. Each one feels like a small alarm. You haven't talked to the doctor yet, you don't know which ones matter, and you're trying to decide whether to spend the afternoon worrying or trust that they'll get back to you if it's serious.`,
    `Most lab panels look more alarming than they are. The reference ranges are tight, the flagging is automatic, and the body produces values that drift in and out of "normal" for reasons that have nothing to do with disease. Reading the panel well is mostly about knowing what *not* to react to — and which small handful of patterns actually warrant a call.`,
  ],

  steps: [
    {
      name: "Find the reference range, not just the flag",
      body: "Every value on a blood panel is reported with a reference range: the bracket that the lab considers 'normal' for adults like you. A flag (H or L) means your value is outside that bracket — but the magnitude of how far outside matters far more than the flag itself. A cholesterol of 201 (range up to 200) gets flagged. So does a cholesterol of 280. They are not the same finding. Look at the actual number, the range, and the gap between them. Slightly outside is almost always different from clearly outside.",
    },
    {
      name: "Know which 'abnormal' values are usually situational",
      body: "Several common values shift around for reasons that don't reflect disease: dehydration affects your hematocrit and BUN; a recent meal affects glucose and triglycerides; intense exercise the day before affects creatine kinase and liver enzymes; menstruation affects iron studies; even the time of day affects cortisol and thyroid values. A single off result in any of these often means 'come back fasting next time' or 'we'll recheck in three months,' not 'something is wrong.' One snapshot in time is rarely the whole story.",
    },
    {
      name: "Look for patterns, not single values",
      body: "Individual abnormal values rarely tell you much. Patterns do. High white blood cells *and* high inflammation markers point one direction; low hemoglobin *and* low ferritin *and* low iron point another. Doctors are trained to read panels as constellations — the combination of which values are off, and in which direction. If only one or two values are flagged and they're not in the same constellation, the chance that this is a real signal versus noise drops considerably.",
    },
    {
      name: "Identify which values, if abnormal, actually warrant a call",
      body: "A handful of results are worth flagging proactively rather than waiting for the doctor to call: significantly low hemoglobin, significantly elevated white blood cell count outside of obvious illness, kidney function values trending in the wrong direction, glucose or A1C values consistent with new-onset diabetes, calcium clearly outside the range. These are the ones where a portal message — 'I noticed [value] is at [number] — is this something to address before our next visit?' — is reasonable. Most other flagged values can wait.",
    },
    {
      name: "When the context changes everything",
      body: "The same number can mean nothing or mean everything depending on context. A slightly low hemoglobin is one thing in a 25-year-old with heavy periods and another in a 70-year-old with new fatigue. A slightly elevated liver enzyme means something different if you started a new medication last month. The values on the printout don't know your context — but you do, and so does your doctor. The most useful question you can bring to a follow-up isn't 'what does this number mean,' it's 'what does this number mean *given everything else going on with me right now*.'",
    },
  ],

  cta: {
    glyph:    '🩺',
    headline: "Get the numbers in plain English before your appointment",
    body:     "Doctor Visit Translator reads your full lab panel, explains each value in context, flags which results actually warrant attention, and gives you the specific questions to ask about anything unclear.",
    features: [
      "Full panel plain-English read",
      "Context-aware significance ranking",
      "Pattern recognition across values",
      "Appointment question prep",
      "Action priority list",
    ],
    toolId:   'DoctorVisitTranslator',
    toolName: 'Doctor Visit Translator',
  },

  published: '2026-04-27',
  modified:  '2026-04-27',
};
