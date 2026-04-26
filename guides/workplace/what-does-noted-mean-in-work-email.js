// ============================================================
// guide-specs/workplace/what-does-noted-mean-in-work-email.js
// ============================================================
// Source of truth for /guides/workplace/what-does-noted-mean-in-work-email.
// Edit here; run `node scripts/build-guides.js workplace` to regenerate.
// ============================================================

module.exports = {
  slug:          'what-does-noted-mean-in-work-email',
  category:      'workplace',
  categoryLabel: 'Workplace',

  title:         'What "Noted" Actually Means in a Work Email (And What to Say Back)',
  titleHtml:     'What "Noted" Actually Means in a Work Email <em>(And What to Say Back)</em>',
  shortTitle:    'What "Noted" Means in a Work Email',
  navTitle:      'What does noted mean in a work email and what to say back',

  description:   "Someone replied 'Noted.' to your email and your brain freezes. Four contexts, what each one really means, and how to respond — including the one that's actually a flag.",
  deck:          "Someone replied 'Noted.' to your email and your brain freezes. Four contexts, what each one really means, and how to respond — including the one that's actually a flag.",

  published:     '2026-04-25',
  modified:      '2026-04-25',

  ledes: [
    `You sent a thoughtful email — three paragraphs, a clear ask, maybe even some context. The reply lands. It's one word. "Noted." And now your brain is doing the thing: was that an acknowledgment, an annoyance, a parked disagreement, or a quiet shut-down?`,
    `"Noted" doesn't have one meaning. It has four common ones, plus one that's actually a flag. The word is too short to carry tone, so recipients fill in the missing tone using whatever frame is already there — recent friction, status difference, the length of your message versus theirs. The trick is reading what came before, not the word itself.`,
  ],

  steps: [
    {
      name: "Read the routine acknowledgment",
      body: "The most common version, and the one most people overthink. Your email was informational or a small request, the sender was busy, and 'Noted.' just means 'got it, no further action needed.' The tell is low stakes in the original message plus a sender who normally writes short replies. If you sent something that didn't actually need a response, and you got the shortest possible response, the most likely explanation is that you didn't actually need a response. Don't reply 'thanks!' — it adds noise and signals you read meaning into something that didn't have any.",
    },
    {
      name: "Spot the parked disagreement",
      body: "The version where the sender doesn't agree but isn't going to argue in writing. The tell: your last email contained an opinion, a proposal, or a position — something they could have engaged with, and they chose not to. 'Noted' here is a tactical pause. The next conversation about this topic is going to go differently from how you wrote it. The right response isn't another paragraph defending the position. It's flagging a quick call or stopping by their desk. Whatever they want to push back on isn't going to come through email, and pretending you got real agreement when you got 'Noted' is how surprises happen later.",
    },
    {
      name: "Recognize when they heard the criticism",
      body: "The version after you flagged something or pushed back. 'Noted' here means 'I heard you, I'm not disputing it, and I'm not going to keep typing about it.' Different from disagreement — they're acknowledging the issue exists. They're not agreeing to do anything specific about it. The question 'so what happens next' doesn't get answered by another email. If the issue actually matters, the follow-up needs a different channel and a specific ask: a meeting with a clear agenda, or a written question that requires a yes/no answer. Vague follow-ups attract more 'Noted.'",
    },
    {
      name: "Notice when 'Noted' means stop",
      body: "The version where the sender is closing the thread. Could be neutral — they've prioritized the topic out, decided not to engage, want this off their plate — or pointed: they think you've been too persistent, sent too many follow-ups, or are pushing on something they've already decided. The tell is context: the thread was already getting heated, or you've sent multiple emails in a short window, or this is the second 'Noted' in the same conversation. The right move is to take the off-ramp. Don't reply with another clarification. Let it sit for a few days. If the topic still matters, reopen it later in a different format — different framing, different audience, sometimes a different person to send to.",
    },
    {
      name: "Know the one that needs attention",
      body: "Where 'Noted' arrives in a context that called for a real response. You flagged a serious problem to your manager and got 'Noted.' You reported something to HR and got 'Noted.' You sent a client a thirty-page proposal and got 'Noted.' This isn't necessarily bad — sometimes it's a placeholder while the recipient figures out the real response — but it usually means the next move is yours, and it isn't another email. The action depends on stakes: for serious workplace issues, escalate the channel — request a meeting, copy a manager into a follow-up, document the timeline. For client situations, give it a few days, then call. The signal isn't the word; it's the gap between what you sent and what you got back.",
    },
  ],

  callout: {
    afterStep: 1,
    scriptedLine: "What did I send, and does this match how this person normally writes?",
    explanation: "The two questions that decode most 'Noted' replies. The original message tells you what was at stake — informational, request, opinion, flag. The sender's normal style tells you whether 'Noted' is short for them or short FOR them. Match the original against the pattern, and the meaning usually clarifies before you draft a response you'll regret.",
  },

  cta: {
    glyph:    '🔍',
    headline: "Get a personalized read on the specific reply you got",
    body:     "This guide covers four common contexts. Decoder Ring takes the actual message and reply you received — wording matters, tone matters — and tells you which interpretation is most likely, ranks the alternatives, and gives you draft responses calibrated to whichever reading you choose.",
    features: [
      "A specific read on the specific reply you received",
      "The most likely interpretation, plus alternatives ranked",
      "Subtext and tone analysis — not just dictionary meaning",
      "Three response strategies calibrated to different readings",
      "Draft language you can actually send",
    ],
    toolId:   'DecoderRing',
    toolName: 'Decoder Ring',
  },
};
