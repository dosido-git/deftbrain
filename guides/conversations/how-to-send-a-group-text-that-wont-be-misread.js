module.exports = {
  slug:          'how-to-send-a-group-text-that-wont-be-misread',
  category:      'conversations',
  categoryLabel: 'Conversations',

  title:         "How to Send a Group Text That Won't Be Misread (By Anyone in the Group)",
  titleHtml:     "How to Send a Group Text That Won&#39;t Be Misread <em>(By Anyone in the Group)</em>",
  shortTitle:    "How to Send a Group Text That Won't Be Misread",
  navTitle:      "How to send a group text that won't be misread by anyone in the group",

  description:   "Same words, different reactions across the group. Here's how to draft a message that reads roughly the same way to everyone who'll see it.",
  deck:          "Same words, different reactions across the group. Here's how to draft a message that reads roughly the same way to everyone who'll see it.",

  ledes: [
    `You're sending a text to a group — your siblings, your friends, the parent group chat, the colleagues planning a thing. You write it. You hover over send. You can already feel the small risk: one person in the group will read it slightly wrong. The brother who takes things personally. The friend who'll think you're being passive-aggressive. The colleague who reads sarcasm into everything. You have one message and four interpretations to manage, and the wrong word will trigger a side-DM you didn't want to have.`,
    `Group texts have a structural problem: the same words land differently on different people, and you can't address each person's filter individually. The fix isn't bland neutrality — it's writing in a way that reduces the surface area for misreading. A few specific moves do most of the work. Here's how to draft a group text that reads roughly the same to everyone in the group.`,
  ],

  steps: [
    {
      name: "Lead with what the message is for",
      body: "Group texts get misread when readers have to guess the purpose. State it in the first sentence. 'Quick logistics question.' 'Just sharing for fun, no response needed.' 'Trying to figure out next weekend.' Once readers know what frame to hold the message in, individual phrasings get less weight. Without the frame, every word is up for interpretation.",
    },
    {
      name: "Avoid sarcasm and dry humor unless the whole group reliably reads them",
      body: "Sarcasm in text format requires the reader to correctly infer tone with no audio cues. In a group of six, at least one person will misread it. If the group has someone who consistently takes things literally, or someone you don't text often, the cost of sarcasm exceeds the benefit. Keep dry humor for one-on-one threads or groups where the tone is established. Group texts reward more direct phrasing.",
    },
    {
      name: "Don't address one person inside a message to the group",
      body: "'Hey Sara, can you bring chips? Everyone else, see you Saturday.' This puts Sara on the spot publicly, which often reads worse than intended. If something is for one person, send it directly to them. Group texts work best when every line is genuinely for everyone. Mixing public and private business inside one message creates exactly the kind of small awkwardness that gets misread.",
    },
    {
      name: "Re-read for any line that could be read two ways",
      body: "Before sending, scan for anything ambiguous. 'Sure, whatever works' could read as accommodating or annoyed. 'Fine' could read as fine or as fine. If a line could be read negatively by anyone in the group, rephrase it. The five-second re-read prevents the 30-minute side-conversation that follows when someone reads it wrong. Disambiguating language up front is much less work than damage control.",
    },
    {
      name: "Use a punctuation mark that signals tone",
      body: "Punctuation does real work in group texts. A period at the end of a short reply ('Sure.') reads colder than no punctuation ('sure'). Exclamation points soften — 'Sounds good!' lands warmer than 'Sounds good.' Use this on purpose. The exclamation point you'd normally feel weird about is doing tone work that prevents misreading. This isn't optional in group texts; it's load-bearing.",
    },
  ],

  cta: {
    glyph:    '👁',
    headline: "See how your group text will land for each reader",
    body:     "Context Collapse simulates how your message reads to each person in the group — flags ambiguous lines, sarcasm risks, and tone mismatches before you send.",
    features: [
      "Per-person tone read",
      "Sarcasm-risk flagging",
      "Ambiguity detection",
      "Punctuation suggestions",
      "Frame-clarifying rewrites",
    ],
    toolId:   'ContextCollapse',
    toolName: 'Context Collapse',
  },

  published: '2026-04-29',
  modified:  '2026-04-29',
};
