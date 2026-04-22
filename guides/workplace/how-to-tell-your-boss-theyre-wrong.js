// ============================================================
// guide-specs/workplace/how-to-tell-your-boss-theyre-wrong.js
// ============================================================
// Source of truth for /guides/workplace/how-to-tell-your-boss-theyre-wrong.
// Edit here; run `node scripts/build-guides.js workplace` to regenerate.
// ============================================================

module.exports = {
  slug:          'how-to-tell-your-boss-theyre-wrong',
  category:      'workplace',
  categoryLabel: 'Workplace',

  title:         "How to Tell Your Boss They're Wrong (Without Burning Anything Down)",
  titleHtml:     "How to Tell Your Boss They&#39;re Wrong <em>(Without Burning Anything Down)</em>",
  shortTitle:    "How to Tell Your Boss They're Wrong",
  navTitle:      "How to tell your boss they're wrong without burning anything down",

  description:   "You can see the problem clearly. The hard part is saying so. A practical, step-by-step approach to pushing back on your manager — professionally, and without blowing up your career.",
  deck:          "You can see the problem clearly. The hard part is saying so. A practical, step-by-step approach to pushing back on your manager — professionally, and without blowing up your career.",

  published:     '2026-03-30',
  modified:      '2026-04-22',

  ledes: [
    `You're in the meeting. The plan is on the board. You can already see three ways it falls apart — and now your manager is looking around the room for a thumbs-up. Saying nothing feels like lying. Saying something feels like a gamble. Neither option is comfortable, which is probably why you're reading this instead of already having had the conversation.`,
    `The good news is that pushing back on a manager is a learnable skill, not a personality trait. The people who do it well aren't braver than you — they've just figured out the sequence. Here's the sequence.`,
  ],

  steps: [
    {
      name: "Pick a private moment, not a public one",
      body: "Never push back in front of an audience. Your manager can't agree with you without looking like they just reversed course — even if they secretly think you're right. Ask for five minutes after the meeting, or send a short message requesting a quick call. The setting alone determines whether this is a conversation or a confrontation.",
    },
    {
      name: "Lead with a question, not a correction",
      body: "There's a big difference between 'I think that's a problem' and 'Can I share a concern about the timeline?' One puts your boss on the defensive before you've made your point. The other signals that you're thinking, not just reacting — and that you have something worth hearing.",
    },
    {
      name: "Name the problem, not the person",
      body: "Stay on the facts — the data point that looks off, the deadline that conflicts with a dependency, the assumption that hasn't been tested. The moment you say 'I feel like this wasn't fully thought through,' you've made it personal. The moment you say 'The Q3 numbers suggest we'd need 40% more capacity,' you've made it technical. Technical is easier to discuss without ego.",
    },
    {
      name: "Predict their pushback before you walk in",
      body: "Your manager will have a response to whatever you say. Most of the time it's one of three things: 'We don't have time to change it,' 'That risk is acceptable,' or 'I've already committed to this.' Know how you'll respond to each before the conversation starts. Walking in prepared is not the same as walking in stubborn.",
    },
    {
      name: "Practice your opening line out loud",
      body: "The first sentence is the hardest. Once it's out, the rest of the conversation has somewhere to go. Say it in the car, say it in the shower, say it to your dog. It won't feel so loaded by the time you actually need it. Silence in the first three seconds is where most people lose their nerve.",
    },
  ],

  callout: {
    afterStep: 2,
    scriptedLine: "I want to make sure I understand the approach — can I walk through a few things I'm seeing before we finalize?",
    explanation: "This opens the door without implying you've already decided they're wrong. It also gives you a natural entry point to lay out exactly what concerns you.",
  },

  cta: {
    glyph:    '🗣',
    headline: "Practice this conversation before it happens",
    body:     "Difficult Talk Coach generates exact scripts for your specific situation, predicts your manager's likely responses, and lets you run the conversation live until you feel ready.",
    features: [
      "Multiple strategic approaches",
      "Predicted pushback + responses",
      "Live practice mode",
      "Real-time coaching",
      "Post-conversation debrief",
    ],
    toolId:   'DifficultTalkCoach',
    toolName: 'Difficult Talk Coach',
  },
};
