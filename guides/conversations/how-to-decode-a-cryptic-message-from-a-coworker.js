module.exports = {
  slug:          'how-to-decode-a-cryptic-message-from-a-coworker',
  category:      'conversations',
  categoryLabel: 'Conversations',
  title:         "How to decode a cryptic message from a coworker",
  titleHtml:     "How to decode a cryptic message from a coworker",
  shortTitle:    "Cryptic coworker messages",
  navTitle:      "Cryptic coworker messages",
  description:   `"Got a sec?" "Can you ping me when you're free?" "Quick question." Here is how to tell whether to panic, prepare, or ignore.`,
  deck:          `"Got a sec?" "Can you ping me when you're free?" "Quick question." Here is how to tell whether to panic, prepare, or ignore.`,
  ledes: [
    `A Slack notification slides in from your manager: "got a sec?" No context. No subject. No emoji to soften it. Just three lowercase words that have managed to ruin the next twenty minutes of your day. You start frantically reviewing every recent decision. Did the deck get sent. Was the launch okay. Did someone complain. Did THAT person complain. By the time you click through to the DM, you have constructed a small disciplinary hearing in your head, and your shoulders are somewhere up by your ears.<br/><br/>Cryptic work messages are a special kind of awful because the stakes feel higher than personal cryptic messages, even when they are not. The message can be anything from "I need help finding a file" to "we need to talk about your performance," and the wording usually does not distinguish the two. The skill is learning to read work messages without spiraling, because most of the spiraling produces no useful action and just makes you arrive at the actual conversation already flustered.`,
    `Here is how to actually decode a vague work message instead of going straight to worst-case, and how Decoder Ring weighs the signals around channel, sender, and timing to give you a calibrated read.`,
  ],
  steps: [
    { name: `Identify the channel: where they sent it tells you a lot`, body: `A cryptic message in Slack is almost always lower stakes than a cryptic message that arrives by email or, worst, calendar invite with no description. Slack is the channel of "I have a quick thing." Email is the channel of "I want a paper trail." Calendar-invite-no-description from a manager is the channel of "I want to make sure you have a moment for this and I do not want to write it down." The medium itself is half the message; train yourself to read it.` },
    { name: `Look at how this person normally communicates`, body: `Cryptic from a normally cryptic person is meaningless. Cryptic from a person who usually writes paragraphs is real signal. Some managers send "got a sec" three times a day for trivial things. Some only send it when something serious is happening. The same five words from these two people mean two different things. If you do not know your sender's baseline yet, that is one of the highest-ROI things to learn about your colleagues — it stops you from misreading them constantly.` },
    { name: `Notice the timing: end-of-day vs. mid-morning has weight`, body: `Vague messages sent at 9:15 a.m. on a Tuesday are usually operational. Vague messages sent at 4:47 p.m. on a Friday are more likely to carry weight, because something was building all week and is now being raised at a moment that signals "I want to discuss this before the weekend." This is not always true, but it is true often enough that timing should be part of your read. Pair the timing with the channel and you have the most of the signal you are going to get.` },
    { name: `Reply quickly with a specific time, not a vague availability`, body: `Do not reply "for sure, just lmk" — that pushes the ambiguity back at them and prolongs your stress. Reply "I have time at 11 or after 2, want to grab a quick call?" This does two helpful things: it commits to engaging, which signals you are not avoiding, and it forces them to either book the time (which means it is real) or revert to text (which usually deflates the urgency). Either way, you stop sitting in the limbo of an unscheduled vague meeting.` },
    { name: `When you do connect, ask your clarifying question first`, body: `When the call starts, do not over-prepare for every possible scenario. Just ask: "Hey, what is up?" or "What did you want to talk about?" Most of the time, they will say the thing immediately and 90% of your spiral evaporates in three seconds. The 10% of the time it really is a hard conversation, you find out fast and can engage with the actual issue rather than the imaginary one you have been rehearsing for. Either way, you stop spending fuel on speculation.` }
  ],
  cta: {
    glyph:    '🔍',
    headline: "Paste the message. Get the layer underneath the layer.",
    body:     "Decoder Ring runs the message through pragmatics, tone analysis, and emotional-undercurrent detection — surfaces hedging, power moves, passive aggression, emotional bids, non-answers, and genuine warmth. You get a translation, a confidence rating, what they actually want, and three response strategies with copyable drafts and risk notes.",
    features: [
      "Layer-by-layer breakdown: surface, subtext, emotional undercurrent",
      "Confidence rating so you know when to trust the read",
      "Detects passive aggression, hedging, gaslighting patterns, and people-pleasing",
      "3 response strategies with pros, risks, and copyable examples",
      "Channel-aware (text vs email vs Slack vs dating app behave differently)"
    ],
    toolId:   'DecoderRing',
    toolName: 'Decoder Ring',
  },
  published: '2026-04-29',
  modified:  '2026-04-29',
};
