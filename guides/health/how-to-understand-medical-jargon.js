module.exports = {
  slug:          'how-to-understand-medical-jargon',
  category:      'health',
  categoryLabel: 'Health',

  title:         "How to Understand Medical Jargon (Without a Medical Dictionary)",
  titleHtml:     "How to Understand Medical Jargon <em>(Without a Medical Dictionary)</em>",
  shortTitle:    "How to Understand Medical Jargon",
  navTitle:      "How to understand medical jargon without a medical dictionary",

  description:   "Medical terminology is a code with predictable rules. Once you know the rules, most words you encounter become roughly readable on first contact.",
  deck:          "Medical terminology is a code with predictable rules. Once you know the rules, most words you encounter become roughly readable on first contact.",

  ledes: [
    `You're reading the visit summary, the discharge instructions, or the imaging report, and the sentences are mostly English with the occasional word that looks like it was assembled in a lab. *Hyperlipidemia. Pyelonephritis. Idiopathic.* You can guess at them, but the guessing has stakes — it changes how you interpret what's wrong with you. You've been doing the search-each-word routine, which works but takes forever and doesn't stick.`,
    `Medical jargon isn't really jargon — it's compressed Latin and Greek built from a small set of recurring parts. Most clinical words decode predictably once you recognize the parts they're made of. You won't become fluent, but you'll go from looking up every term to looking up only the unusual ones.`,
  ],

  steps: [
    {
      name: "Learn to split words into prefix, root, and suffix",
      body: "Most medical terms are three pieces glued together. *Hyperlipidemia* = hyper (high) + lipid (fat) + emia (in the blood) = high fat in the blood. *Pyelonephritis* = pyelo (kidney pelvis) + nephr (kidney) + itis (inflammation) = inflammation of the kidney and its drainage system. Once you start splitting the word visually, the meaning is usually waiting in the parts. The first pass at any unfamiliar term is to look for the seams.",
    },
    {
      name: "Memorize the dozen prefixes that do most of the work",
      body: "*Hyper* (over), *hypo* (under), *brady* (slow), *tachy* (fast), *peri* (around), *intra* (within), *trans* (across), *dys* (abnormal/painful), *poly* (many), *oligo* (few), *macro* (large), *micro* (small). These twelve prefixes appear in hundreds of medical terms. Hypertension, hypoglycemia, bradycardia, tachypnea, pericarditis, transabdominal — once these are familiar, the half of any term that isn't a prefix is the half that needs translating.",
    },
    {
      name: "Memorize the suffixes that tell you what kind of problem it is",
      body: "Suffixes are the most useful piece because they tell you the *category* of the term — diagnosis, condition, procedure, or status. *-itis* = inflammation. *-osis* = abnormal condition (often degenerative). *-emia* = in the blood. *-uria* = in the urine. *-ectomy* = surgical removal. *-otomy* = surgical cutting (without removal). *-ostomy* = creation of an opening. *-pathy* = disease of. *-algia* = pain in. Knowing the suffix lets you place the term in the right bucket even if the root is unfamiliar.",
    },
    {
      name: "Recognize the words that mean 'we don't know'",
      body: "Several medical terms politely communicate uncertainty: *idiopathic* (no known cause), *cryptogenic* (origin hidden), *primary* (without underlying cause), *spontaneous* (occurred without identifiable trigger), *non-specific* (doesn't point to one diagnosis), *consistent with* (looks like, but not confirmed). These words appear when the doctor or the report is honest about what's known versus what's a working guess. Recognizing them helps you read findings accurately — *idiopathic hypertension* is a different sentence from *secondary hypertension*, and the word *idiopathic* is doing real work.",
    },
    {
      name: "When jargon is hiding a recommendation, not just a description",
      body: "Some medical terms aren't describing your condition — they're prescribing what's supposed to happen next. *Watchful waiting*, *active surveillance*, *expectant management*, *conservative management* — these all mean the doctor is recommending no immediate intervention, but they sound like they're describing something more substantial. Other terms do the opposite. *Indicated*, *contraindicated*, *recommended*, *advised against* — these are decision points dressed up as descriptions. When you encounter a clinical-sounding word in the section about what to do next, slow down: it's probably an instruction.",
    },
  ],

  cta: {
    glyph:    '🩺',
    headline: "Stop translating word by word",
    body:     "Doctor Visit Translator reads your visit notes, lab results, prescription labels, or any medical document and turns them into plain English — with an action checklist and the questions worth bringing back to your doctor.",
    features: [
      "Full document plain-English summary",
      "Term-by-term jargon glossary",
      "Action item extraction",
      "Medication explanations",
      "Follow-up question generation",
    ],
    toolId:   'DoctorVisitTranslator',
    toolName: 'Doctor Visit Translator',
  },

  published: '2026-04-27',
  modified:  '2026-04-27',
};
