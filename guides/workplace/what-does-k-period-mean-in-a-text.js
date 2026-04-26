// ============================================================
// guide-specs/workplace/what-does-k-period-mean-in-a-text.js
// ============================================================
// Source of truth for /guides/workplace/what-does-k-period-mean-in-a-text.
// Edit here; run `node scripts/build-guides.js workplace` to regenerate.
// ============================================================

module.exports = {
  slug:          'what-does-k-period-mean-in-a-text',
  category:      'workplace',
  categoryLabel: 'Workplace',

  title:         'What "K." Actually Means in a Text (And Why the Period Changes Everything)',
  titleHtml:     'What "K." Actually Means in a Text <em>(And Why the Period Changes Everything)</em>',
  shortTitle:    'What "K." Means in a Text',
  navTitle:      'What does k period mean in a text and why the period changes everything',

  description:   "'k' and 'K.' look almost identical and mean completely different things. Five contexts that decode what 'K.' is actually doing — and why the period is doing most of the work.",
  deck:          "'k' and 'K.' look almost identical and mean completely different things. Five contexts that decode what 'K.' is actually doing — and why the period is doing most of the work.",

  published:     '2026-04-25',
  modified:      '2026-04-25',

  ledes: [
    `You sent a long, thoughtful message. Maybe a question, maybe a plan, maybe just a story you wanted to share. The reply lands. Two characters. "K." And now you're staring at it trying to figure out what just happened.`,
    `"K" without a period and "K." with one are not the same message. The period is what's doing the work. Modern texting conventions treat the period as a closing punctuation in a way that ordinary writing never does — the same period that's invisible in a paragraph becomes loud in a text. Decoding "K." is mostly decoding what the period is signaling, against the context of what was sent and who sent it.`,
  ],

  steps: [
    {
      name: "Read the no-period version (it's almost always fine)",
      body: "Lowercase 'k' with no period is the genuinely neutral version. Sender had time for one letter — they were driving, in a meeting, walking somewhere, or just genuinely confirming receipt without thinking about it. The tell is the absence of punctuation: 'k', sometimes 'kk', sometimes 'k 👍'. This is the digital equivalent of a head nod. If you got 'k' and not 'K.' and not 'k.', you almost certainly got an acknowledgment, not a signal. Reading meaning into it is overinterpretation. Move on.",
    },
    {
      name: "Spot the period that closes the conversation",
      body: "The most common 'K.' version. The period is doing one specific thing: signaling that the conversation is over from the sender's side. Not necessarily mad, not necessarily cold — just done. The tell: you sent something that didn't require further response, the message was non-urgent, and 'K.' arrives as the natural endpoint. Common when one person is winding down a thread the other person was still mid-conversation in. The right response is no response. Adding more after a 'K.' is reopening a door the sender just closed. If the topic still matters, it matters tomorrow; raise it then in a fresh thread, not by pushing back into a closed one.",
    },
    {
      name: "Recognize the cool response",
      body: "Past just-done, into actively cool. The period is sharper. The tell is what came before: 'K.' arrives after a request you made, a question that asked for emotional engagement, a suggestion that landed weird, or an apology that wasn't accepted. The brevity is the message — the sender is choosing not to give you more. This isn't necessarily anger; it's distance. The right response depends on relationship and stakes. If the relationship matters, the move is usually to leave it alone for a while, then reconnect on something different. Trying to immediately fix what produced a 'K.' tends to make it worse. The cooling-off period the sender has imposed is information. Use it.",
    },
    {
      name: "Notice the angry version",
      body: "Beyond cool — actively displeased. The 'K.' is short on purpose, sharp on purpose, and meant to be felt. The tell: it's the second 'K.' in a thread, or it follows something specific you said that hit wrong, or this person is normally warm in texts and 'K.' is unusual for them. Don't try to text your way out. Whatever produced the response isn't going to get unproduced by another text, and pushing back will harden the position. The right move is to acknowledge there's an issue ('I can tell something landed wrong — can we talk?'), shift channels if you can, and resist the urge to over-explain in writing. Anger expressed in two characters needs more space than two characters can fix.",
    },
    {
      name: "Know what the pattern means",
      body: "Where 'K.' arrives regularly from the same person, regardless of what you sent. This isn't about decoding individual messages anymore — it's information about the relationship. The phrase has become this person's default response register, which usually means one of two things: they've stopped engaging at the depth they used to, or they never engaged at that depth and you're noticing it now. Neither is a crisis. But both are worth noticing without pretending they aren't happening. For relationships you have stakes in, the move is to talk about the dynamic in a different format — voice, video, in person — rather than trying to text your way back to where you were. The pattern is the signal; trying to interpret each individual 'K.' will lead you in circles.",
    },
  ],

  callout: {
    afterStep: 1,
    scriptedLine: "Was there a period, and what came right before?",
    explanation: "The two questions that decode most 'K.' moments. The period separates the neutral acknowledgment from the loaded version — it's almost always doing the work. What came right before tells you what the period is closing: a long message, a request, a feeling, or a pattern. Match the punctuation against the context, and the meaning usually clarifies before you respond.",
  },

  cta: {
    glyph:    '🔍',
    headline: "Get a read on the specific 'K.' you just received",
    body:     "This guide covers five common contexts. Decoder Ring takes the actual exchange — what you sent, the exact reply, the relationship context, the prior tone — and tells you which interpretation is most likely, ranks the alternatives, and gives you draft responses calibrated to whether the moment calls for backing off, reconnecting later, or shifting channels.",
    features: [
      "A specific read on the specific message you received",
      "The most likely interpretation, plus alternatives ranked",
      "Subtext and tone analysis — closing moves, distance signals, genuine acknowledgment",
      "Three response strategies — back off, reconnect later, or shift channels",
      "Draft language for whichever path makes sense",
    ],
    toolId:   'DecoderRing',
    toolName: 'Decoder Ring',
  },
};
