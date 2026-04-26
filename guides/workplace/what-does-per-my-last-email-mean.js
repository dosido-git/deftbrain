// ============================================================
// guide-specs/workplace/what-does-per-my-last-email-mean.js
// ============================================================
// Source of truth for /guides/workplace/what-does-per-my-last-email-mean.
// Edit here; run `node scripts/build-guides.js workplace` to regenerate.
// ============================================================

module.exports = {
  slug:          'what-does-per-my-last-email-mean',
  category:      'workplace',
  categoryLabel: 'Workplace',

  title:         'What "Per My Last Email" Actually Means (And How to Respond Without Escalating)',
  titleHtml:     'What "Per My Last Email" Actually Means <em>(And How to Respond Without Escalating)</em>',
  shortTitle:    'What "Per My Last Email" Means',
  navTitle:      'What does per my last email mean and how to respond without escalating',

  description:   "'Per my last email' isn't always passive-aggressive. Four contexts, what each one really signals, and how to respond in a way that doesn't make the situation worse.",
  deck:          "'Per my last email' isn't always passive-aggressive. Four contexts, what each one really signals, and how to respond in a way that doesn't make the situation worse.",

  published:     '2026-04-25',
  modified:      '2026-04-25',

  ledes: [
    `You open the email. Three words land before anything else: "Per my last email…" Your stomach drops a little, even before you've read the rest. The phrase has a reputation, and that reputation does a lot of the work — sometimes too much of it.`,
    `"Per my last email" doesn't always mean what people assume it means. It has a few legitimate uses and a few weaponized ones, and they look identical on the page. Reading the right one takes context: what came before, who sent it, and what they're trying to make the email do. The phrase itself is just the signal that the sender wants you to look backward — the question is why.`,
  ],

  steps: [
    {
      name: "Read the polite reference",
      body: "The most common version, especially in customer service, vendor communication, and any context where written records matter. The sender is genuinely pointing you back to information they already shared, often because the thread is long and easy to lose track of. The tell is that the rest of the email is helpful — it restates the key point, doesn't dwell on the reference, and treats you as someone navigating a complicated thread rather than as someone who failed to read carefully. This version isn't passive-aggressive. It's just navigation.",
    },
    {
      name: "Spot the 'I already answered this' version",
      body: "Sender is mildly annoyed that you missed something specific, but isn't aggrieved about it. Wants to redirect your attention without retyping the whole answer. The tell: your previous email asked something the sender had already addressed, and the response is brief but not pointed. Common when someone is busy, the answer was technical, or the original email was buried. The right move is to find the specific detail in the prior email, acknowledge it briefly without over-apologizing ('Thanks — I missed that the deadline was Friday, not next Monday'), and move on. Don't escalate; you didn't do anything wrong, you just missed something.",
    },
    {
      name: "Recognize the status move",
      body: "The version that earned the phrase its reputation. Sender is positioning themselves as having been correct and clear; you as having missed something obvious. The plausible deniability is the feature — they can claim it's just a polite reference if challenged, but the social meaning is a quiet correction. The tell: the original email actually wasn't that clear, the answer required interpretation you reasonably didn't make, or the sender uses the phrase regularly with different people. The right response is to handle the content as if the dominance move didn't happen. Answer the actual question, supply what's needed, and don't mirror the framing. Directness, applied consistently, is the most effective long-term response — it doesn't give the pattern anything to feed on.",
    },
    {
      name: "Notice the paper-trail version",
      body: "Sender is building a documented record. They're making it textually clear, with timestamps, that they communicated something specific at a specific time. Often precedes formal escalation — a project review, a performance conversation, a vendor dispute. The tell: 'per my last email' is paired with specifics ('per my email of March 12 at 4:47 PM, the deliverable was scheduled for…'), and the rest of the message is unusually formal or cc's people who weren't on the original thread. This isn't necessarily hostile, but it isn't friendly either. The right response is to match the register: acknowledge specifically, address the substance carefully, and assume the email will be read by people who weren't part of the original conversation. Don't be defensive in writing. Don't be dismissive either.",
    },
    {
      name: "Know the pattern that needs attention",
      body: "Where 'per my last email' arrives repeatedly from the same person, regardless of whether you actually missed anything. This is the version that signals something about the working relationship rather than any specific email. The phrase is doing status work as a habit. If you notice the pattern — multiple instances over weeks or months, often when you reasonably asked for clarification — the issue isn't decoding individual emails anymore. It's the dynamic. The move is twofold: stop treating each instance as a puzzle to solve, and start treating the pattern as information about how this person communicates. For relationships you have to maintain, that means adjusting the channel — fewer email threads, more verbal confirmations, written follow-ups that explicitly close loops. For relationships you don't have to maintain, the pattern is a data point worth weighing.",
    },
  ],

  callout: {
    afterStep: 1,
    scriptedLine: "Was the original email actually clear, and does this person use this phrase often?",
    explanation: "The two questions that decode most 'per my last email' moments. If the original email genuinely contained the answer and the sender doesn't use the phrase regularly, you probably just missed something. If the original email required interpretation you reasonably didn't make, or this person reaches for the phrase often, the message is doing status work — and the right response is to handle the content cleanly without mirroring the framing.",
  },

  cta: {
    glyph:    '🔍',
    headline: "Get a read on the specific 'per my last email' you received",
    body:     "This guide covers four common contexts. Decoder Ring takes the actual email and the thread context — what was originally asked, what was originally answered, how the sender normally writes — and tells you which interpretation is most likely, plus three response strategies calibrated to whichever reading you choose.",
    features: [
      "A specific read on the specific email you received",
      "The most likely interpretation, plus alternatives ranked",
      "Subtext and tone analysis — passive-aggression detection, status moves, genuine references",
      "Three response strategies calibrated to different readings",
      "Draft language that handles the content without escalating",
    ],
    toolId:   'DecoderRing',
    toolName: 'Decoder Ring',
  },
};
