// ============================================================
// guide-specs/workplace/the-email-you-write-at-11pm-vs-the-email-you-should-send.js
// ============================================================
// Source of truth for /guides/workplace/the-email-you-write-at-11pm-vs-the-email-you-should-send.
// Edit here; run `node scripts/build-guides.js workplace` to regenerate.
// ============================================================

module.exports = {
  slug:          'the-email-you-write-at-11pm-vs-the-email-you-should-send',
  category:      'workplace',
  categoryLabel: 'Workplace',

  title:         "The Email You Write at 11pm vs. The Email You Should Send in the Morning",
  titleHtml:     "The Email You Write at 11pm vs. <em>The Email You Should Send in the Morning</em>",
  shortTitle:    "The 11pm Email vs the Morning Email",
  navTitle:      "The email you write at 11pm vs the email you should send in the morning",

  description:   "The 11pm email and the 8am email are written by different people, even when both are you. Five steps for using the difference rather than fighting it — write the late-night version, but send the morning one.",
  deck:          "The 11pm email and the 8am email are written by different people, even when both are you. Five steps for using the difference rather than fighting it — write the late-night version, but send the morning one.",

  published:     '2026-04-25',
  modified:      '2026-04-25',

  ledes: [
    `It's late. You've been turning the situation over for hours and now you're going to handle it. The reply window is open. You start typing — confidently, even fluently, because the last six hours of mental rehearsal have given you a draft that feels exactly right. You finish, you reread it, it still feels exactly right, and your finger hovers over the send button.`,
    `Almost every professional email that the writer regrets was sent in the second half of that paragraph — between feeling exactly right and clicking send. The 11pm email feels right because the writer is in the state that produced it; the same email, read at 8am, often feels like it was written by a stranger who doesn't quite work where you work. The five points below are the structural reasons why this happens, and the practical technique for using the late-night writing energy without paying the late-night sending cost.`,
  ],

  steps: [
    {
      name: "Recognize the 11pm self and the 8am self are not the same writer",
      body: "It's tempting to think of the late-night version of yourself as 'unfiltered me' and the morning version as 'filtered me' — same person, different gates. The honest version is more interesting: they're not just different gates, they're different writers. The 11pm self has access to feelings the 8am self can't quite reach, has a sharper ear for slights and subtext, has more conviction about the underlying truth of the situation, and has zero ability to predict how the message will land tomorrow. The 8am self has lost some of the access to the feeling but has gained the ability to predict reception, the patience to read the message as the recipient will read it, and the perspective to know which parts of the late-night draft were necessary and which were excess. Neither writer is more honest than the other. They have different strengths, and the 8am writer is better at the specific job of sending professional email.",
    },
    {
      name: "Use the 11pm self for diagnosis, not delivery",
      body: "The 11pm self is unmatched at one specific task: figuring out what you actually care about. Letting that writer have the keyboard while a situation is fresh produces a draft that contains every grievance, every clarification, every unspoken thing that the situation surfaced. That draft is useful — but its job is diagnosis, not delivery. By morning, you'll be able to read the late-night draft and see at a glance which parts are the load-bearing content (the actual ask, the specific point that can't be left unsaid, the boundary that needs naming) and which parts are the rage that produced the draft (the cutting parenthetical, the sentence that lists every previous offense, the closing that's slightly too sharp). The morning self is much better at separating the two than the night self is, but only the night self can produce the raw material both selves need.",
    },
    {
      name: "Don't trust the 11pm verdict on whether to send",
      body: "The single most dangerous move at 11pm is concluding that the message is ready to go. The late-night self is uniquely bad at this judgment — not because it's wrong about the situation, but because it's incapable of the prediction work that determines whether the message will actually land. Will the recipient read this as the legitimate concern it is, or as someone losing composure? Will the closing sentence read as decisive or petty in twelve hours? Will tomorrow you be glad this email exists with your name on it? These questions are the 8am self's job. The 11pm self can write the draft, can save it, can mark it for sending tomorrow. The 11pm self cannot reliably press send. The structural rule: if you cannot wait until morning to send the email, the email itself is probably not the right move. Real emergencies don't go in email at 11pm; they go in phone calls.",
    },
    {
      name: "Read the morning version aloud before sending",
      body: "There's a simple practice that catches almost every email that crossed a line at 11pm but didn't quite get cleaned up at 8am: read it out loud. Not silently, not in your head — out loud, at conversational volume, the way you'd read it to a colleague over coffee. Sentences that read fine on the screen often reveal themselves out loud as sharper than you intended, more accusatory than necessary, or just longer than they need to be. The mouth catches things the eye misses. This is especially true for the closing sentence, which is the part of the email recipients linger on most and writers proofread least. If the closing sentence sounds, when read aloud, like something you'd actually say to this person across a table, it's probably right. If it sounds like something you'd say behind a slightly closed door, it's not yet ready to send.",
    },
    {
      name: "Know when no email at all is the morning answer",
      body: "Sometimes the morning answer to the 11pm draft is that no email is the right email. The situation that felt urgent and consequential at midnight may be, at 8am, a situation that resolves itself if left alone for a few days; a colleague's slight may, with rest, register as a non-event; the boundary that seemed urgent to set may turn out to have been already set by your behavior, and naming it explicitly would only make it weird. This is the most counterintuitive use of the 11pm-vs-8am gap: the 11pm self believes the email needs to be sent, and the 8am self can sometimes see that the email itself is the wrong response. The signal you've reached this category: read the morning draft and ask yourself, 'if I hadn't already written this, would I write it from scratch right now?' If the honest answer is no, the answer is probably to delete it and move on. The 11pm draft did its work — it metabolized the situation, surfaced what mattered, and you woke up calmer than you went to bed. That's a complete piece of work even if no email ever leaves your outbox.",
    },
  ],

  callout: {
    afterStep: 2,
    scriptedLine: "Did the morning self write this email, or did the morning self lightly edit something the 11pm self wrote and decide that was enough?",
    explanation: "The single best self-check before sending any email written or revised the night before. There's a meaningful difference between the two — light edits to a late-night draft tend to leave the emotional shape of the original intact, even when individual words and phrases get softened. A real morning rewrite usually produces a structurally different message, often shorter, sometimes with a different ask, occasionally no email at all. If the email you're about to send is the late-night draft with a few sanded edges, it's probably the late-night email with extra steps. If it's a fresh draft built from what the late-night version surfaced, it's the right email.",
  },

  cta: {
    glyph:    '🔨',
    headline: "Skip the 11pm-to-8am cycle — translate in one pass",
    body:     "VelvetHammer takes the unfiltered late-night draft and produces three morning-ready professional variants — Collaborative, Balanced, and Firm — calibrated to the relationship and goal. The translation work that would take overnight rest happens in seconds; the rage draft stays private; the message that sends is the one a morning self would have written.",
    features: [
      "Three professional variants from one rage draft — translated, not just sanded",
      "Calibration by relationship, goal, and power dynamic",
      "Preserves factual claims while removing late-night language",
      "Privacy by design — your unfiltered draft is never stored",
      "Faster than waiting until morning, with the same structural translation",
    ],
    toolId:   'VelvetHammer',
    toolName: 'Velvet Hammer',
  },
};
