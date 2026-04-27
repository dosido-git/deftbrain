// ============================================================
// guide-specs/workplace/how-to-respond-to-a-passive-aggressive-email.js
// ============================================================
// Source of truth for /guides/workplace/how-to-respond-to-a-passive-aggressive-email.
// Edit here; run `node scripts/build-guides.js workplace` to regenerate.
// ============================================================

module.exports = {
  slug:          'how-to-respond-to-a-passive-aggressive-email',
  category:      'workplace',
  categoryLabel: 'Workplace',

  title:         "How to Respond to a Passive-Aggressive Email Professionally (Without Matching the Energy)",
  titleHtml:     "How to Respond to a Passive-Aggressive Email <em>Without Matching the Energy</em>",
  shortTitle:    "How to Respond to a Passive-Aggressive Email",
  navTitle:      "How to respond to a passive-aggressive email professionally without matching the energy",

  description:   "Passive-aggressive emails work by smuggling hostility past plausible deniability. The response that lands is the one that addresses the smuggled content without picking up the deniability. Five steps for not getting played.",
  deck:          "Passive-aggressive emails work by smuggling hostility past plausible deniability. The response that lands is the one that addresses the smuggled content without picking up the deniability. Five steps for not getting played.",

  published:     '2026-04-25',
  modified:      '2026-04-25',

  ledes: [
    `It's the email with 'per my last email' in it. Or 'just circling back on this since I haven't heard anything.' Or 'I'm sure you have your reasons, but…' Or the polite-on-the-surface message that took you fifteen minutes to read because you kept finding new layers of edge in it. The sender has plausible deniability — they didn't say anything overtly hostile — and you have a feeling, which is a much harder thing to defend than a sentence.`,
    `Passive-aggression in email works by exploiting the gap between what's literally said and what's actually communicated. The literal content is professional, sometimes even gracious. The actual communication is a sharp edge — irritation, blame, a status move, a deniable jab. The trap for the recipient is that responding to the literal content lets the sender win twice (the jab landed and they got a polite reply); responding to the actual communication invites the sender to retreat behind the literal content ('I don't know what you're talking about, I just asked a question'). The five steps below are the technique for breaking out of that trap.`,
  ],

  steps: [
    {
      name: "Don't match the energy — name the underlying concern instead",
      body: "The strongest temptation when receiving a passive-aggressive email is to send one back: equally polite on the surface, equally edged underneath. This loses on three counts. First, you've now established that this is how the two of you communicate, which means future exchanges will be worse, not better. Second, you've spent your day writing a passive-aggressive email — a use of your time you'll regret tomorrow. Third, the witness effect: passive-aggressive exchanges in email leave a record, and the record reads worse for both parties than the original message did for one. The move is to skip the surface-level match entirely and respond to the actual concern underneath the email — which forces the conversation back into the territory of explicit content where it can actually be addressed.",
    },
    {
      name: "Pretend it was sincere",
      body: "The most underrated technique for handling passive-aggressive email is to respond as if it had been written sincerely. 'Per my last email' becomes a literal pointer: 'Yes — I saw the original. To make sure we're aligned, here's where I am on it.' 'Just circling back since I haven't heard anything' becomes a request for status: 'Thanks for the nudge. Here's where things stand.' This isn't naivete — you know what was meant. It's a deliberate refusal to engage at the passive-aggressive level. The technique works because it leaves the sender with two options: either accept the sincere reading (which de-escalates) or escalate to making the hostility explicit (which forces them to drop the deniability). Most senders, faced with this choice, take the off-ramp you've offered. The exchange becomes professional from your side forward, regardless of how it started.",
    },
    {
      name: "Resist quoting their email back at them",
      body: "When responding to a passive-aggressive email, the impulse to quote a specific phrase from their message — sometimes in italics or air-quotes — is strong. 'You said 'per my last email,' but I want to point out that I responded to that email on Tuesday.' This satisfies a desire to be heard, and it almost always backfires. Quoting their phrasing back signals that you read the hostility, which means the hostility has worked on you, which means the sender now has confirmation their message landed. It also escalates the exchange into a meta-conversation about what was said, which is exactly the territory passive-aggressive senders are most comfortable in (because they have plausible deniability there). Address the substantive content. Leave their phrasing alone. The most powerful response to a passive-aggressive email is one that reads, to a hypothetical observer, as though there was nothing passive-aggressive about the original.",
    },
    {
      name: "Decide whether to address the issue or the pattern",
      body: "There's a meaningful difference between responding to one passive-aggressive email and responding to the third one this month from the same person. A one-off can be handled with the surface response — engage with the substantive content, ignore the edge, move on. A pattern needs a different response, because each individual surface engagement teaches the sender that the technique is working. Patterns get addressed in their own conversation, almost always not in email — because the same medium that produced the pattern won't produce the conversation that resolves it. The signal you've crossed from issue to pattern: are you starting to dread emails from this person? Have you found yourself reading their messages two or three times to figure out what they really meant? Have you noticed the same pattern from them with other colleagues? Two of three suggests you have a pattern, not just a bad email. Address the immediate issue in writing; book a conversation to address the pattern in person.",
    },
    {
      name: "Know when not engaging is the right move",
      body: "Some passive-aggressive emails don't deserve a response at all. The pattern: the sender has no actual ask underneath the message, the venue is wrong (you've been cc'd into a thread you shouldn't be in, or someone is performing for an audience that includes you), or the engagement itself would dignify a comment that was beneath dignifying. Responding to these gives the sender the engagement they were trying to provoke; not responding leaves them with nothing to escalate from. The discipline is recognizing this category exists. Most professional advice on passive-aggressive emails assumes you must respond — and most of the time you should. But there's a meaningful subset where the cleanest move is silence: read the message, note it for your own awareness, and respond with nothing. This isn't avoidance if there's no actual ask to respond to. The signal: if you removed every passive-aggressive layer from the message, would there still be a question or request that needed your reply? If the answer is no, the email's real purpose was the jab itself, and engaging is what completes the move. Don't.",
    },
  ],

  callout: {
    afterStep: 1,
    scriptedLine: "Thanks for the follow-up. Here's where I am on this — I responded to your original message on Tuesday with my proposed timeline. Did that come through, or should I resend?",
    explanation: "This is the sincere-reading reply to a 'per my last email'-style message. It does three things: takes the surface message at face value, provides the substantive update they were ostensibly asking for, and ends with a small question that hands them an exit. If they were genuinely missing the response, the question lets them save face. If they were being passive-aggressive, the sincere framing gives them no surface to escalate from. Either way, the exchange ends here, which is the goal.",
  },

  cta: {
    glyph:    '🔨',
    headline: "Get a calm response to a hostile email — without matching the hostility",
    body:     "VelvetHammer takes the response you'd write while irritated and returns three professional variants that address the substantive content without picking up the passive-aggressive frame. The Collaborative variant takes the email at face value; the Balanced variant addresses the underlying concern directly; the Firm variant draws a line professionally if the pattern needs addressing.",
    features: [
      "Three response levels — Collaborative (face value), Balanced (address concern), Firm (name pattern)",
      "Strips matching-energy phrasing while preserving your substantive points",
      "Calibration by relationship — different responses for boss / peer / direct report",
      "Goal-tuned — respond to issue vs respond to pattern",
      "Privacy by design — your unfiltered first draft is never stored",
    ],
    toolId:   'VelvetHammer',
    toolName: 'Velvet Hammer',
  },
};
