module.exports = {
  slug:          'how-to-understand-what-your-doctor-actually-said',
  category:      'health',
  categoryLabel: 'Health',

  title:         "How to Understand What Your Doctor Actually Said (After You Already Left)",
  titleHtml:     "How to Understand What Your Doctor Actually Said <em>(After You Already Left)</em>",
  shortTitle:    "How to Understand What Your Doctor Actually Said",
  navTitle:      "How to understand what your doctor actually said after you already left",

  description:   "You nodded along, you said okay, you walked out. Now you're at home and the only thing you remember clearly is the part where they used a word you didn't know. Here's how to reconstruct the rest.",
  deck:          "You nodded along, you said okay, you walked out. Now you're at home and the only thing you remember clearly is the part where they used a word you didn't know. Here's how to reconstruct the rest.",

  ledes: [
    `It was twenty minutes ago. The doctor was talking, you were listening, and somewhere in the middle they used a word that pulled all your attention to one place — and the next three sentences happened without you. Now you're in the car or at home, and you have a vague, important-feeling cloud of information that you can't quite make a sentence out of. You know there was a diagnosis, or a recommendation, or a number. You don't know exactly what it was.`,
    `This is the universal medical visit experience and almost no one talks about it. Your job in the room wasn't to memorize a transcript; the system isn't designed around your retention. Reconstructing what was said is a separate skill, done after the visit, with the right inputs. Here's the order of operations.`,
  ],

  steps: [
    {
      name: "Pull up the after-visit summary before you trust your memory",
      body: "Almost every visit produces a written record — the after-visit summary in the patient portal, the visit notes, a printout you were handed on the way out. Find it before you start trying to reconstruct anything from memory. Memory of a medical visit is unreliable in a specific way: you remember the parts that scared you and forget the parts that explained them. The written record is the actual answer; your memory is the prompt that helps you find it.",
    },
    {
      name: "Make a list of every word you don't fully understand",
      body: "Read the visit notes once and circle every term that doesn't mean something specific to you. 'Mild' is a word you understand; 'mild stenosis' might not be. 'Elevated' you know; 'elevated A1C' you might be guessing about. Don't try to figure them out as you read — you'll lose your place and miss the structure. Just list them. The visit usually contains five to ten words doing most of the work, and that list is what you need to translate.",
    },
    {
      name: "Translate each word into 'what does this mean for me'",
      body: "A definition isn't enough. 'Hypertension means high blood pressure' is a definition; 'hypertension means my blood pressure is high enough that they want to manage it before it causes harm' is a translation. For each unfamiliar word, the goal is one short sentence that includes both what it means and why it's appearing in your visit notes. If you can't write that sentence — even after a search — it's a real candidate for a callback or a portal message to the doctor.",
    },
    {
      name: "Sort what you heard into four categories",
      body: "After the translation, sort each piece of information into one of four buckets: *diagnosis* (what they think is going on), *treatment* (what they want you to do), *prognosis* (what to expect over time), and *follow-up* (when and why to come back). Most visits cover two or three of these categories, sometimes all four. The fog of a confusing visit usually clears when you see which bucket each sentence belongs in — and you'll spot what's missing. A diagnosis without a treatment plan, or a treatment plan without a follow-up, is a question you need to ask.",
    },
    {
      name: "When reading isn't enough — and the next step is a portal message",
      body: "Sometimes you sort everything, look up every word, and you're still left with something genuinely unclear: a number you can't contextualize, a recommendation that doesn't match what you thought you heard, a phrase that could mean two different things. That's not a sign you're failing at this. That's the signal to send a short message through the patient portal: 'I'm reviewing my notes from yesterday's visit and want to clarify what you meant by [X]. Can you confirm whether it means [A] or [B]?' Most doctors answer these within a day or two. The cost of asking is much lower than the cost of acting on the wrong interpretation.",
    },
  ],

  cta: {
    glyph:    '🩺',
    headline: "Turn the visit notes into plain English",
    body:     "Doctor Visit Translator reads your visit notes, lab results, or any medical document and gives you a plain-English summary, a prioritized action list, medication explanations, and the right questions to ask at your next appointment.",
    features: [
      "Plain-English summary",
      "Action item prioritization",
      "Medical jargon translation",
      "Medication explanations",
      "Follow-up question generation",
    ],
    toolId:   'DoctorVisitTranslator',
    toolName: 'Doctor Visit Translator',
  },

  published: '2026-04-27',
  modified:  '2026-04-27',
};
