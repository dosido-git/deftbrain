module.exports = {
  slug:          'how-to-understand-a-hard-concept-when-explanations-dont-click',
  category:      'learning',
  categoryLabel: 'Learning',
  title:         "How to Understand a Hard Concept When Explanations Do Not Click",
  titleHtml:     "How to Understand a Hard Concept <em>When Explanations Do Not Click</em>",
  shortTitle:    "When Explanations Fail",
  navTitle:      "when explanations do not click",
  description:   "You read three explanations of the same idea and none of them landed. The problem is usually not the explanation — it is a missing prerequisite. Here is how to find it.",
  deck:          "You read three explanations of the same idea and none of them landed. The problem is usually not the explanation — it is a missing prerequisite. Here is how to find it.",
  ledes: [
    `You are trying to understand something — a concept in a class, an idea in a book, a piece of math, a system at work. You read the explanation and it does not stick. You read a second explanation and it sounds the same. You watch a video and the video assumes you already know what you are trying to learn. After an hour you have not moved, and you start to wonder if you are just bad at this thing.\n\nYou are usually not bad at it. You are missing a prerequisite — some concept underneath the one you are trying to understand that everyone explaining the surface concept assumes you already have. The reason the explanations do not click is that they are all building on the same hidden foundation, and you are missing the foundation. Once you find the missing prerequisite and learn it, the original concept usually clicks immediately.`,
    `Here is the diagnostic — and how The Gap finds the missing piece.`,
  ],
  steps: [
    { name: 'Locate exactly which sentence stops making sense', body: 'When you read an explanation, mark the specific sentence where you stop following. Not \'the whole thing is confusing\' — the specific sentence. The sentence right before the break is one you understood; the next one is not. The leap between those two sentences is where the missing piece lives. Most learning failures are this kind of small gap, but most people experience them as \'I do not get the topic\' instead of \'I do not get this specific transition.\'' },
    { name: 'Identify what the explanation assumes you already know', body: 'Read the breaking sentence carefully. What words or ideas does it use as if they were already familiar? A math explanation that says "applying the chain rule" assumes you know what the chain rule is. A coding explanation that says "this returns a promise" assumes you know what a promise is. List the assumed concepts. Each one is a candidate for the prerequisite you are missing.' },
    { name: 'Test each candidate prerequisite quickly', body: 'Take each assumed concept from the list and ask yourself: can I explain this one in a sentence? If you cannot, that is the prerequisite. Often there is more than one, and they form a chain — each prerequisite has its own prerequisites. Trace backward until you reach a concept you genuinely understand. The boundary between what you know and what you do not is the place to start learning.' },
    { name: 'Learn the prerequisite, then come back', body: 'Find an explanation of the prerequisite, learn it, then return to the original concept. Most of the time, the original concept now reads cleanly. The explanations that did not click before were not bad — they were correctly assuming the prerequisite. With the prerequisite in hand, the same explanation works. This is why concepts often suddenly "click" — usually one missing piece moved into place.' },
    { name: 'Use The Gap to trace the prerequisite chain automatically', body: 'Tell The Gap the concept you are stuck on plus where you are stuck. It works backward to find the most likely missing prerequisite, teaches that piece in plain language, and then bridges back to the original concept. Faster and more accurate than trial-and-error backtracking. Often surprising — the missing piece is rarely where you expected it to be.' }
  ],
  cta: {
    glyph:    '🔍',
    headline: "Find where your understanding actually broke.",
    body:     "Tell The Gap what you are stuck on and it works backward to find the missing prerequisite — the specific concept underneath the one you cannot grasp. Then it teaches that one, and your way forward unsticks.",
    features: [
      "Prerequisite-tracing diagnosis",
      "Plain-language explanation of the missing piece",
      "Builds the bridge to the original concept",
      "Works for any subject"
    ],
    toolId:   'TheGap',
    toolName: 'The Gap',
  },
  published: '2026-04-29',
  modified:  '2026-04-29',
};
