module.exports = {
  slug:          'how-to-understand-a-chronic-illness-diagnosis',
  category:      'health',
  categoryLabel: 'Health',

  title:         "How to Understand a Chronic Illness Diagnosis (When You're Newly Diagnosed)",
  titleHtml:     "How to Understand a Chronic Illness Diagnosis <em>(When You&#39;re Newly Diagnosed)</em>",
  shortTitle:    "How to Understand a Chronic Illness Diagnosis",
  navTitle:      "How to understand a chronic illness diagnosis when you're newly diagnosed",

  description:   "A chronic diagnosis isn't one piece of information — it's a stack of decisions, terms, and protocols that all arrive in a single visit. Here's how to unpack it without trying to learn everything at once.",
  deck:          "A chronic diagnosis isn't one piece of information — it's a stack of decisions, terms, and protocols that all arrive in a single visit. Here's how to unpack it without trying to learn everything at once.",

  ledes: [
    `You walked in expecting a check-in. You walked out with a diagnosis — diabetes, thyroid disease, an autoimmune condition, a heart issue, something with a name and a long-term plan attached. The doctor went through it carefully, you nodded, you took the prescription, you left. Now you're at home and the diagnosis has settled into your kitchen as a presence. There's a pamphlet, a portal full of instructions, and a vague sense that you're supposed to be learning something but you don't know where to start.`,
    `A chronic diagnosis is overwhelming for a structural reason: it's not one piece of information, it's a stack. The condition itself, the medication, the dietary changes, the monitoring schedule, the long-term outlook, the words you've never heard before. Trying to learn it all at once is how people end up paralyzed. Taking it apart in the right order is how it becomes manageable.`,
  ],

  steps: [
    {
      name: "Separate the diagnosis from the prognosis",
      body: "These are two different sentences and they get tangled in the same conversation. The *diagnosis* is what's wrong: the name, the mechanism, the part of the body involved. The *prognosis* is what to expect: how it tends to progress, what management looks like, how this changes life expectancy or daily life. Most people fixate on prognosis first because that's where the fear is — but understanding the diagnosis is what makes the prognosis legible. Take them in order: what is it, then what does having it mean over time.",
    },
    {
      name: "Find out what's controllable and what isn't",
      body: "Most chronic conditions split your life into two columns: the things that affect the disease (medication adherence, certain foods, sleep, stress, monitoring) and the things that don't (genetics, the basic mechanism of the disease, the diagnosis itself). A lot of early-diagnosis anxiety comes from blurring these — feeling like you must be doing something wrong, or like every flare is your fault. Most chronic illnesses respond to the controllable column meaningfully but not completely. Knowing which is which prevents months of unnecessary self-blame.",
    },
    {
      name: "Understand what the medication is doing, not just that you should take it",
      body: "Most chronic-condition prescriptions do one of three things: replace something your body isn't making (insulin, thyroid hormone), suppress an overactive process (immunosuppressants, blood pressure medications), or block a specific reaction (statins, antihistamines). Knowing which category yours falls into changes how you think about taking it. Replacement medications you generally need to take consistently for life. Suppression medications you may be able to taper. Blocking medications work in real time. The category matters more than the brand name.",
    },
    {
      name: "Learn the monitoring schedule before you learn the disease",
      body: "Most chronic conditions are managed through periodic measurement: A1C every three months, thyroid levels every six, kidney function annually, imaging on some longer cadence. The schedule is the actual plan — it's how you and your doctor will know whether the condition is stable, improving, or progressing. Learning the schedule first gives you a concrete framework for the next year, and turns 'I have this disease' into 'I have a recurring rhythm of measurements that tell me how things are going.' That's a much more livable mental model.",
    },
    {
      name: "When learning everything is the wrong move",
      body: "There's a temptation, in the first weeks after diagnosis, to read everything you can find about the condition. This often makes things worse. Patient forums skew toward people having problems; medical literature is written for clinicians; the worst-case progression descriptions stick disproportionately. The healthier first step is to learn what *your* version of the condition looks like — its severity, its specific subtype, your particular markers — from your doctor. Generic information about the worst form of a condition you might have a milder version of is rarely useful, and almost always harder to read than it should be.",
    },
  ],

  cta: {
    glyph:    '🩺',
    headline: "Translate the visit notes into your starting point",
    body:     "Doctor Visit Translator reads your diagnosis paperwork, explains the condition and the plan in plain English, separates what's controllable from what isn't, and gives you the right questions to bring to your next appointment.",
    features: [
      "Diagnosis-specific plain-English summary",
      "Medication purpose explanations",
      "Monitoring schedule extraction",
      "Action priority list",
      "Follow-up question generation",
    ],
    toolId:   'DoctorVisitTranslator',
    toolName: 'Doctor Visit Translator',
  },

  published: '2026-04-27',
  modified:  '2026-04-27',
};
