module.exports = {
  slug:          'what-questions-to-ask-your-doctor',
  category:      'health',
  categoryLabel: 'Health',

  title:         "What Questions to Ask Your Doctor (And Which Ones Actually Get You Answers)",
  titleHtml:     "What Questions to Ask Your Doctor <em>(And Which Ones Actually Get You Answers)</em>",
  shortTitle:    "What Questions to Ask Your Doctor",
  navTitle:      "What questions to ask your doctor and which ones actually get you answers",

  description:   "Most patient question lists are too generic to land. The questions that get you specific, useful answers are the ones that bypass the doctor's autopilot.",
  deck:          "Most patient question lists are too generic to land. The questions that get you specific, useful answers are the ones that bypass the doctor's autopilot.",

  ledes: [
    `You searched for a list of questions to ask your doctor and got back twenty bullet points that all sound roughly the same: ask about treatment options, ask about side effects, ask about follow-up. Helpful in theory. The problem is that doctors have answered those questions thousands of times, which means the answers come out polished and slightly generic — exactly the answers you could have read on a pamphlet.`,
    `The questions that actually get you somewhere are the ones that move the conversation off the script. They're not aggressive or confrontational; they're specific in a way that makes a generic answer impossible. Here are five worth memorizing.`,
  ],

  steps: [
    {
      name: "Ask: \"What's the most likely cause, and what else could it be?\"",
      body: "Doctors are trained to think in terms of differentials — the list of conditions that could explain your symptoms, ranked by likelihood. When you ask only 'what is this,' you usually get the most likely answer. When you ask what *else* it could be, you're inviting the doctor to walk through the rest of the list with you. The second-most-likely answer is sometimes the one that matters, and you'll only hear it if you ask.",
    },
    {
      name: "Ask: \"What should I watch for that would mean I need to call back sooner?\"",
      body: "Standard discharge instructions tend to be vague: 'follow up in two weeks' or 'come back if it gets worse.' Worse is doing a lot of work in that sentence. Get specific. What symptom, what level of severity, what timeline? You want the answer in plain language: 'If your fever goes above 102 and stays there for more than 24 hours.' 'If the swelling spreads past your knee.' 'If the pain wakes you up at night.' Specific tripwires beat vague vigilance.",
    },
    {
      name: "Ask: \"What would you do if this were your family member?\"",
      body: "This question routes around a defensive crouch a lot of doctors don't realize they're in. Their formal answer is constrained by liability, by what they can recommend without being directive, by the language of 'patient autonomy.' The personal answer is different. It tells you what they actually believe given the same information. Most doctors will give you a real answer to this question — and that answer is often more useful than the official one.",
    },
    {
      name: "Ask: \"How will we know if this is working?\"",
      body: "Most treatment plans are launched without a clear measure of success. You take the medication, you do the physical therapy, you change the diet — and three months later neither of you really knows whether it worked. Get the metric upfront. What should you feel? On what timeline? At what point would the plan change? Without an explicit answer, you'll spend the next quarter not knowing whether to push for something different or stay the course.",
    },
    {
      name: "Ask: \"Is there anything we're not testing for that we probably should be?\"",
      body: "Insurance and protocol both push doctors toward the most common explanation, in roughly the most efficient order. That's usually fine. Sometimes it isn't. This question doesn't suggest the doctor is missing something — it asks them to actively consider what isn't on the current panel. Sometimes the answer is 'no, we have what we need.' Sometimes it's 'actually, given what you described, let me add one more.' Either way, you've heard the doctor's reasoning out loud, which is what you came in for.",
    },
  ],

  callout: {
    afterStep: 3,
    scriptedLine: "I want to make sure I understand what we're looking at — what's the most likely thing, and what's the next-most-likely we'd want to rule out?",
    explanation: "This phrasing names what you want without challenging the doctor's first answer. It frames the second question as natural follow-up rather than skepticism, and most doctors will answer both.",
  },

  cta: {
    glyph:    '📝',
    headline: "Get the right questions before you walk in",
    body:     "Doctor Visit Prep generates the questions that match your specific situation — the ones tailored to your symptoms, your concerns, and your visit type — so you don't have to remember them on the spot.",
    features: [
      "Situation-specific question generation",
      "Symptom-tailored prompts",
      "Specialist visit questions",
      "Diagnostic clarification prompts",
      "Treatment plan check-ins",
    ],
    toolId:   'DoctorVisitPrep',
    toolName: 'Doctor Visit Prep',
  },

  published: '2026-04-27',
  modified:  '2026-04-27',
};
