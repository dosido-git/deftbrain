// ============================================================
// guide-specs/apologies/how-to-apologize-to-your-partner-without-making-it-worse.js
// ============================================================
// Source of truth for /guides/apologies/how-to-apologize-to-your-partner-without-making-it-worse.
// Edit here; run `node scripts/build-guides.js apologies` to regenerate.
// ============================================================

module.exports = {
  slug:          'how-to-apologize-to-your-partner-without-making-it-worse',
  category:      'apologies',
  categoryLabel: 'Apologies',

  title:         "How to Apologize to Your Partner Without Making It Worse",
  titleHtml:     "How to Apologize to Your Partner <em>Without Making It Worse</em>",
  shortTitle:    "How to Apologize to Your Partner Without Making It Worse",
  navTitle:      "How to apologize to your partner without making it worse",

  description:   "The apology that goes wrong with a partner usually fails in the same way: it's defensive, it pivots to your feelings about being wrong, or it tries to fix in the moment when they need you to sit with it first. Five steps for the apology that actually lands.",
  deck:          "The apology that goes wrong with a partner usually fails in the same way: it's defensive, it pivots to your feelings about being wrong, or it tries to fix in the moment when they need you to sit with it first. Five steps for the apology that actually lands.",

  published:     '2026-04-25',
  modified:      '2026-04-25',

  ledes: [
    `You know you owe an apology. You've been turning it over in your head for an hour, or a day, and now there's a version of it ready to come out — and you're already half-anticipating that it won't land the way you hope. That hesitation is a useful signal. Apologies between partners fail in surprisingly predictable ways, and most of them are recoverable if you can spot them before you say them.`,
    `The most common failure isn't insincerity. It's that the apology is technically a sincere one but structured in a way that makes it impossible for your partner to receive. They want to feel heard about the specific thing that hurt them; you want to fix it and move on; both intentions are real and they pull in different directions. The five steps below are designed for partners specifically, where the relationship is the asset and protecting it sometimes means letting the apology take longer than feels comfortable.`,
  ],

  steps: [
    {
      name: "Find out what they're actually upset about, not what you assume",
      body: "Most partner apologies fail at step zero: you apologize for the wrong thing. You think they're upset about being late; they're upset about not being told. You think they're upset about the comment; they're upset about the audience it was made in front of. An apology aimed at the wrong target doesn't land — it actively confirms that you weren't paying attention. Before you apologize, ask. Sometimes the question is direct ('what hurt the most?'); sometimes it's reflective ('I want to make sure I understand what this is about — can you tell me what it felt like from your side?'). The goal isn't to interrogate but to verify, because aiming the apology accurately is the difference between repair and a longer fight.",
    },
    {
      name: "Apologize without 'but' — separate apology from explanation entirely",
      body: "'I'm sorry, but I was stressed' is not an apology; it's a justification with the word 'sorry' attached. Partners hear the 'but' as the load-bearing part of the sentence, and the 'sorry' as the polite preamble before the actual content. Separate the two completely. If explanation is appropriate, it goes in a different conversation, or in a later beat after your partner has had a chance to respond to the apology itself. Often, no explanation is needed — your partner mostly wants to know that you understood what happened and that you take it seriously, not the chain of circumstances that led to it. The discipline is to let the apology be the whole sentence: 'I'm sorry I did that. It hurt you, and I get why.' Then stop.",
    },
    {
      name: "Don't centerpiece your own feelings about having upset them",
      body: "There's a particular pattern that derails apologies between partners: the apology that becomes a meditation on how terrible you feel about having done the thing. 'I feel awful.' 'I can't believe I did that.' 'I'm so frustrated with myself.' Each of these is honest, and each of them subtly redirects the conversation from your partner's hurt to your guilt. Within a few minutes, your partner is consoling you instead of being consoled. This is one of the most common ways a sincere apology becomes a reason to apologize again later, because your partner walks away with the experience of having had to manage your feelings about the thing that hurt them. Your feelings about being wrong are real, and they're worth processing — somewhere else, with someone else, or later, on your own time. The apology is for them.",
    },
    {
      name: "Resist fixing in the moment if they need to feel hurt first",
      body: "The instinct to immediately offer a solution is strong, especially if you're someone who processes emotion through action. Your partner is upset; you want to fix it; the fastest path to fixing it is to propose what you'll do differently. But sometimes — often — your partner needs to feel hurt first, and the offer to fix can read as an attempt to skip past their hurt to a state where you don't have to sit with it. Read the room. If they're still in the middle of the feeling, the right move is to stay with them in it: 'You're right. That was hurtful. I want to understand it more before I jump to what I'll do differently.' The fix can come tomorrow, or in an hour, or after they've said everything they need to say. Trying to fix during the hurt usually means doing it twice.",
    },
    {
      name: "Know when repeated apologies for the same thing have stopped counting",
      body: "There's a point in any pattern where the third or fourth apology for the same kind of mistake stops being received as an apology. Your partner has heard the words; they've watched the behavior continue; the apology now sounds like a step in a cycle rather than a moment of real change. If you find yourself apologizing for something you've apologized for before, that's the signal that the next conversation isn't actually an apology — it's about whether the underlying behavior is going to change. Naming this directly is harder than apologizing again, but it's the only thing that resets the cycle: 'I keep apologizing for this. I don't want to apologize again next month. What would actually have to be different?' The question puts you both on the same side of the problem and changes the conversation from repair to redesign. Sometimes that's the only apology that lands.",
    },
  ],

  callout: {
    afterStep: 2,
    scriptedLine: "I'm sorry I did that. You're right that it hurt you, and I understand why. I don't want to explain or defend it right now — I want to make sure you feel heard first.",
    explanation: "This opening does the three things that protect partner apologies most: unqualified ownership ('I'm sorry I did that' as a complete sentence), validation of their reaction ('you're right that it hurt you'), and explicit deferral of explanation. The last sentence is the one most apologizers skip, but it's the one that signals you understand the order matters — their feeling first, your context later, if at all.",
  },

  cta: {
    glyph:    '⚖️',
    headline: "Get the right apology for the actual hurt",
    body:     "ApologyCalibrator analyzes what happened, the relationship context, and your actual responsibility, then returns a calibrated apology with templates tuned to a partner specifically. The 'what NOT to say' list catches defensive language like 'but,' 'if you felt,' and other patterns that detonate apologies between partners.",
    features: [
      "5-level calibration with templates tuned for partner / spouse / close relationships",
      "'What NOT to say' catches defensive language and centering-your-feelings patterns",
      "Calibration prevents under-apologizing (level 3 when level 4 is needed)",
      "Phrasing alternatives for the most common failure modes",
      "Permission framing when an apology isn't needed at all",
    ],
    toolId:   'ApologyCalibrator',
    toolName: 'Apology Calibrator',
  },
};
