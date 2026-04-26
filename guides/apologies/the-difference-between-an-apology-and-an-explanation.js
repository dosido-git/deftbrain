// ============================================================
// guide-specs/apologies/the-difference-between-an-apology-and-an-explanation.js
// ============================================================
// Source of truth for /guides/apologies/the-difference-between-an-apology-and-an-explanation.
// Edit here; run `node scripts/build-guides.js apologies` to regenerate.
// ============================================================

module.exports = {
  slug:          'the-difference-between-an-apology-and-an-explanation',
  category:      'apologies',
  categoryLabel: 'Apologies',

  title:         "The Difference Between an Apology and an Explanation (And Why It Matters)",
  titleHtml:     "The Difference Between an Apology and an Explanation <em>(And Why It Matters)</em>",
  shortTitle:    "Apology vs Explanation",
  navTitle:      "The difference between an apology and an explanation and why it matters",

  description:   "Most apologies that go wrong aren't insincere — they're explanations wearing apology costumes. Five steps for telling the difference, knowing which one you owe, and giving each the room it needs.",
  deck:          "Most apologies that go wrong aren't insincere — they're explanations wearing apology costumes. Five steps for telling the difference, knowing which one you owe, and giving each the room it needs.",

  published:     '2026-04-25',
  modified:      '2026-04-25',

  ledes: [
    `You apologized. They didn't seem to receive it. Or you walked away from the conversation feeling like nothing actually got resolved, even though you said the words. Or someone apologized to you and you couldn't quite say why it didn't land — only that it didn't. Most of these failures share a common cause: an apology and an explanation got tangled together in a way that detonated both.`,
    `An apology and an explanation are different speech acts. An apology takes ownership of harm. An explanation describes the cause of an event. Both are useful in different situations, and there are situations where you owe one, the other, both, or neither. The trouble starts when a person delivers one and the recipient was waiting for the other — or when the speaker tries to do both in a single breath, which usually means they accomplish neither. The five steps below are the framework for telling them apart, knowing which one you owe in any given situation, and not detonating the apology with the explanation when both are warranted.`,
  ],

  steps: [
    {
      name: "Recognize they're different speech acts",
      body: "An apology says: 'I caused harm, I take responsibility, and I want to repair it.' An explanation says: 'Here's what happened and why.' These are not different versions of the same thing — they have different purposes, different content, and different effects on the listener. The apology centers the harmed party and your accountability for the harm; the explanation centers the event and the chain of circumstances that produced it. When someone is hurt, they want the first one. When someone is confused or wants context, they want the second one. Mixing them produces something that looks like both and functions as neither — which is the source of the most common failure mode in difficult conversations. Step one is recognizing that they aren't interchangeable, even when they're both honest.",
    },
    {
      name: "Run the 'but' test",
      body: "The fastest way to tell whether you're delivering an apology or an explanation in disguise: try to say it without the word 'but.' 'I'm sorry I missed the deadline, but the spec changed three times' — the 'but' is the load-bearing element of that sentence, and the apology is the polite preamble. The actual content is the explanation. 'I'm sorry I missed the deadline. The spec changed three times' — same words, different shape, and now the listener can hear whether they're getting an apology, context, or both. If you cannot deliver the apology as a complete sentence on its own, before any 'but,' 'because,' or 'just' arrives, it isn't yet an apology. It's an explanation that contains the word 'sorry.' This isn't a trick of phrasing — it's the structural test for whether ownership is actually being taken.",
    },
    {
      name: "Know when you owe an apology",
      body: "You owe an apology when three things are true at once: someone was harmed, your action or inaction contributed to it, and the harm matters enough to be worth naming. All three have to be present. If someone is upset but no actual harm occurred (they're frustrated about an outcome that wasn't your responsibility), an apology is the wrong response — it implies an ownership you don't have. If harm occurred but you didn't contribute to it (the project failed for reasons outside your control), an apology is the wrong response — it accepts responsibility you don't bear. If your action contributed to a minor inconvenience that doesn't really need naming (you were five minutes late to a casual meeting), an apology is over-calibration. The over-apology problem isn't usually about giving too much sorry — it's about offering apologies in situations where some other response is more appropriate. The right response when no apology is warranted is acknowledgment, explanation, or sometimes nothing at all.",
    },
    {
      name: "Know when you owe an explanation, not an apology",
      body: "There's a class of situations where the speaker reaches for an apology and the listener is actually waiting for an explanation. The colleague whose project you didn't get to is annoyed, but the underlying thing they want is to know what your priorities looked like and whether their request is in the queue. The friend who didn't get a quick reply isn't necessarily hurt — they may just want to know whether you got the message. In these situations, leading with an apology adds emotional weight to a conversation that didn't need it, and the explanation that follows feels diminished by the apology framing. The cleaner move is to lead with the explanation: 'I haven't gotten to your draft yet — I had three other reviews ahead of it and the earliest I can read it is Thursday.' That's not a missing apology; it's a complete response that delivers what the listener actually needed. Reserve apologies for actual harm. Use explanations for everything else.",
    },
    {
      name: "Know when you owe both — and how to keep one from detonating the other",
      body: "Sometimes you owe both. You missed a deadline (apology), and there's a real reason that bears on whether the deadline was reasonable in the first place (explanation). The trap is delivering them in the same breath, because that's when the 'but' moves in and the explanation reads as deflection. The technique that works is sequencing in time: deliver the apology first, complete and unqualified, and let the listener respond. After they've responded — and only after — offer the explanation if it's still relevant. 'I missed the deadline. That's on me, and the team had to scramble to cover.' Wait. They respond. Then, if appropriate: 'I want to share some context on what was going on, but only if that's useful — I'm not trying to explain it away.' The explicit naming of the seam ('I'm not trying to explain it away') is what protects the apology from the explanation. It tells the listener you understand the order matters. Sometimes they'll want the context; sometimes they won't. Either way, the apology has had its own room to land before the explanation arrived to share it.",
    },
  ],

  callout: {
    afterStep: 1,
    scriptedLine: "Am I trying to apologize for something, explain something, or both — and do I know which one this person is actually waiting for?",
    explanation: "The single most useful question to run before any difficult conversation. Most failures of these conversations come from the speaker delivering one speech act while the listener is waiting for the other, or from the speaker trying to do both at once in a way that detonates both. Asking yourself which one you actually owe — and which one the other person is actually expecting — sorts out half the failure modes before the conversation begins.",
  },

  cta: {
    glyph:    '⚖️',
    headline: "Find out which one you actually owe — and what to say if it's both",
    body:     "ApologyCalibrator analyzes what happened and your actual responsibility, then tells you whether an apology is warranted (level 1–5) or whether explanation is the right response instead. The 'what NOT to say' list catches the most common ways apologies and explanations get tangled together, and the calibration prevents the 'apology with a but' that detonates both.",
    features: [
      "5-level calibration tells you when no apology is needed (level 1) — explanation only",
      "Templates separate apology language from explanation language",
      "'What NOT to say' catches 'but,' 'just,' and other detonators",
      "Permission framing when you don't actually owe an apology",
      "Sequencing guidance for situations where both are owed",
    ],
    toolId:   'ApologyCalibrator',
    toolName: 'Apology Calibrator',
  },
};
