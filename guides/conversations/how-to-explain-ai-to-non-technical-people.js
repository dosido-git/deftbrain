module.exports = {
  slug:          'how-to-explain-ai-to-non-technical-people',
  category:      'conversations',
  categoryLabel: 'Conversations',

  title:         "How to Explain AI to Non-Technical People (Without Sounding Like a Textbook)",
  titleHtml:     "How to Explain AI to Non-Technical People <em>(Without Sounding Like a Textbook)</em>",
  shortTitle:    "How to Explain AI to Non-Technical People",
  navTitle:      "How to explain AI to non-technical people without sounding like a textbook",

  description:   "Your audience doesn't need the architecture diagram. They need to know what it does, when it's wrong, and why it matters to them. Here's how to deliver that.",
  deck:          "Your audience doesn't need the architecture diagram. They need to know what it does, when it's wrong, and why it matters to them. Here's how to deliver that.",

  ledes: [
    `Someone at the dinner table asks what you mean when you say AI. You start to answer. Within a sentence you've used 'model,' 'training data,' and 'parameters' — and you can already see the polite shutdown happening across the table. You weren't trying to show off. You were just using the words you use at work. The problem is those words don't mean anything to someone who hasn't built one.`,
    `Explaining AI to a non-technical audience is a translation skill, not a dumbing-down exercise. The people who do it well aren't oversimplifying — they're picking analogies that carry the right intuitions and quietly drop the wrong ones. Here's the sequence that works whether you're talking to your parents, your CEO, or a stranger on a plane.`,
  ],

  steps: [
    {
      name: "Lead with what it does, not what it is",
      body: "Skip the definition. Start with the verb. 'It writes emails for you.' 'It finds patterns in numbers humans miss.' 'It generates pictures from a description.' The reader cares what it does first; the mechanism comes later, if at all. A definition asks them to hold an abstraction. A verb hands them a behavior they can picture.",
    },
    {
      name: "Pick an analogy from their world, not yours",
      body: "If they cook, AI is like a sous chef who's read every cookbook ever written but has never tasted food. If they teach, it's like a brilliant student who confidently turns in plagiarized work without realizing. If they manage people, it's like the smartest intern you've ever had, who needs constant supervision. The right analogy is the one that fits their daily experience, not the one that's most technically accurate.",
    },
    {
      name: "Name what it gets wrong, not just what it gets right",
      body: "Most explanations of AI front-load the impressive part. The trust comes from the next sentence. Say: 'It will sometimes make things up that sound completely correct.' 'It can't tell you why it picked that answer.' 'It's confidently wrong about a small percentage of things in a way that's hard to catch.' Naming the failure mode before they have to discover it is what makes the explanation honest.",
    },
    {
      name: "Give them one true thing they can repeat",
      body: "Most people will leave the conversation able to repeat one sentence. Choose what that sentence is. 'It's a pattern-matching machine, not a thinking one.' 'It's a brilliant guesser that can't check its own work.' 'It's predicting the next word, the way autocomplete predicts what you're about to type — but on a much bigger scale.' That sentence is what they'll say to the next person.",
    },
    {
      name: "Stop when they have what they came for",
      body: "Don't keep going until you've covered everything you know. You're not giving a lecture. The person asked a question; deliver the answer that fits their question. If they want to know about the architecture, they'll ask. If they don't, the rest is for you, not them. Most failed explanations fail by overshooting.",
    },
  ],

  cta: {
    glyph:    '💡',
    headline: "Get a custom analogy for your audience, instantly",
    body:     "Analogy Engine takes any concept and any audience — and finds the analogy from their world that lands. Non-technical relatives, executives, students, customers.",
    features: [
      "Audience-tuned analogies",
      "Multiple options to compare",
      "Built-in failure-mode framing",
      "Adjustable complexity",
      "Tested across audiences",
    ],
    toolId:   'AnalogyEngine',
    toolName: 'Analogy Engine',
  },

  published: '2026-04-29',
  modified:  '2026-04-29',
};
