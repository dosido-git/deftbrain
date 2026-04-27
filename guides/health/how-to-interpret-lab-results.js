module.exports = {
  slug:          'how-to-interpret-lab-results',
  category:      'health',
  categoryLabel: 'Health',

  title:         "How to Interpret Lab Results (When the Doctor Hasn't Called Yet)",
  titleHtml:     "How to Interpret Lab Results <em>(When the Doctor Hasn&#39;t Called Yet)</em>",
  shortTitle:    "How to Interpret Lab Results",
  navTitle:      "How to interpret lab results when the doctor hasn't called yet",

  description:   "Patient portals deliver lab results to you before the doctor sees them. Here's how to read what's there well enough to know whether to wait, ask, or act.",
  deck:          "Patient portals deliver lab results to you before the doctor sees them. Here's how to read what's there well enough to know whether to wait, ask, or act.",

  ledes: [
    `The portal lit up at 9:14 PM with new lab results. Your doctor hasn't seen them yet — they're sitting in a queue that'll get reviewed sometime tomorrow. You're sitting on your couch with a list of values, half of them flagged, and a small but real anxiety about whether the flagged ones mean anything. You also know that calling the after-hours line for lab questions is not going to go well.`,
    `Modern patient portals have created a new kind of medical experience: you see your data before your doctor does. That's mostly a good thing, but it means a category of interpretation that used to happen during a phone call now happens silently in your living room. The skill isn't reading lab results like a doctor would — it's reading them well enough to know which results need a response and which can wait until morning.`,
  ],

  steps: [
    {
      name: "Read the report header before you read the values",
      body: "Every lab report has a header that tells you what was actually ordered, when the sample was drawn, and who ordered it. This is a five-second read but it changes everything. A panel ordered as 'routine annual' is different from one ordered to follow up on a specific concern. Knowing what they were *looking for* tells you what you should pay attention to. Generic worry across all values is rarely as useful as targeted attention to the values that prompted the test.",
    },
    {
      name: "Distinguish reference range from clinical significance",
      body: "Reference ranges are statistical, not clinical. They cover roughly 95% of healthy people — which means about 1 in 20 healthy people will have a flagged value on any given panel. This isn't a flaw in the lab; it's how reference ranges work. A single flagged value in an otherwise normal panel, especially when the flag is small, is far more often statistical noise than disease. The flag is a prompt to look closer; it isn't, by itself, a finding.",
    },
    {
      name: "Group flagged values to see if they tell a story together",
      body: "Lab values rarely matter in isolation. Two or three values flagged together — and pointing in the same direction — is a different finding than three flagged values that don't share a pattern. If your white blood cell count, neutrophils, and inflammation markers are all high, that's pointing somewhere. If your potassium is slightly low, your liver enzymes are slightly elevated, and your platelets are slightly high, those probably aren't connected. Look at the constellation, not the individual stars.",
    },
    {
      name: "Know which results actually warrant a portal message tonight",
      body: "Most flagged results can wait for the doctor's review. A few can't. If you see a critically high or critically low value (often marked with two flags or asterisks), a hemoglobin below 9, a glucose above 300 with symptoms, an electrolyte clearly outside normal range, or any value labeled 'critical' — message the after-hours line or the patient portal with the specific number. For most other flagged values, wait for the doctor's review. The 'critical' label is doing the sorting work for you; trust it.",
    },
    {
      name: "When the wait is the worst part",
      body: "Sometimes the labs are fine, sometimes they aren't, and the hardest part is the gap between seeing them and hearing from the doctor about them. A portal message — short, factual, asking specifically about the value or pattern that worries you — is almost always reasonable. 'I noticed my [value] was [number] — is this something we need to address before the next visit?' gets answered by most practices within a business day. The cost of asking is much lower than the cost of three days of speculation.",
    },
  ],

  cta: {
    glyph:    '🩺',
    headline: "Read the panel before the call comes in",
    body:     "Doctor Visit Translator reads your full lab report, explains every flagged value in context, identifies which results actually need attention versus which are statistical noise, and gives you the right portal message if you need to send one.",
    features: [
      "Full panel plain-English read",
      "Statistical noise vs real signal",
      "Pattern recognition across values",
      "Portal message draft",
      "Critical value flagging",
    ],
    toolId:   'DoctorVisitTranslator',
    toolName: 'Doctor Visit Translator',
  },

  published: '2026-04-27',
  modified:  '2026-04-27',
};
