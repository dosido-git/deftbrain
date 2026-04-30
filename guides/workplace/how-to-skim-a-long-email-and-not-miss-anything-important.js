module.exports = {
  slug:          'how-to-skim-a-long-email-and-not-miss-anything-important',
  category:      'workplace',
  categoryLabel: 'Workplace',
  title:         "How to skim a long email and not miss anything important",
  titleHtml:     "How to skim a long email <em>and not miss anything important</em>",
  shortTitle:    "Skim long emails",
  navTitle:      "skim long emails",
  description:   "A method for processing the email that is way too long without spending fifteen minutes on it or missing the one thing that needed your attention.",
  deck:          "A method for processing the email that is way too long without spending fifteen minutes on it or missing the one thing that needed your attention.",
  ledes: [
    `The email is twelve paragraphs long. The sender used no headings. There are at least three different topics in it. There may be a question for you somewhere — there usually is — but you cannot find it on first read. There may also be an action item, a deadline, and an FYI, all interleaved with context you did not need and tangents that should have been a separate email. You have a meeting in eleven minutes. You are about to make a decision: read it now, deal with it later, or skim it and risk missing something.\n\nA disciplined skim, done well, takes ninety seconds and catches almost everything that matters. The trick is knowing where in a long email the actionable content tends to live, and learning to filter past the parts that do not require you.`,
    `Here is how to skim a long email efficiently and not miss what matters.`,
  ],
  steps: [
    { name: 'Read the first sentence and the last paragraph first', body: 'Most long emails follow an unintentional structure: the writer warms up in the opening (skim it), gets to the substance in the middle (read this), and circles back to action items or asks at the end (read this). Reading the first sentence tells you the topic. Reading the last paragraph often tells you what they want from you. Together, these two reads give you 80% of the email\'s payload in 10% of the time. Then you decide whether to read the middle.' },
    { name: 'Search for question marks', body: 'Questions are where action lives. Ctrl-F for question marks if the email is in a window that allows it, or just visually scan for them. Each question is a place where the sender expects you to respond. If there are three question marks, there are three things they want from you. If there are zero, the email is probably informational, and you may not need to respond at all. The number of question marks is a fast proxy for the email\'s demand on your time.' },
    { name: 'Look for explicit action language', body: 'Phrases like \'can you,\' \'please,\' \'I need,\' \'by [date],\' \'let me know,\' \'would you mind\' — these are action flags. Each one points to something the sender wants. Even in a long email with no clear structure, these phrases stand out once you are looking for them. They are usually concentrated in the last third of the email. Catching them is most of what skimming has to accomplish.' },
    { name: 'Identify any dates and deadlines', body: 'If a long email contains a date, that date is usually load-bearing. Scan for digits and day names. The date is when something happens, when something is due, or when a window closes. Always note the date. The number of times someone misses a deadline because the relevant date was buried in paragraph eight is high enough that this single check would prevent most of those failures.' },
    { name: 'If you skimmed and feel uncertain, ask a clarifying question instead of re-reading', body: 'If after skimming you are not sure what they want, send a quick reply asking the specific clarifying question — \'Do you need this by Thursday?\' \'Are you asking me to draft this or review yours?\' This is faster than re-reading the email three times trying to be sure, and it shifts the cost of clarity back to the sender, which is where it belonged in the first place. Long, ambiguous emails should not require recipients to do detective work.' }
  ],
  cta: {
    glyph:    '🔇',
    headline: "Pull the 10% that matters out of the 90% that doesn't.",
    body:     "Noise Canceler is a relevance filter, not a summarizer. Paste any dense document — HOA notice, insurance EOB, benefits packet, policy update — describe your situation, and it returns only what requires action, what costs you money, what saves you money, and what you can safely ignore.",
    features: [
      "Cross-references the document against your specific situation",
      "Extracts only action items, cost changes, and personally-affecting clauses",
      "Flags 'buried but important' items hidden in dense fine print",
      "Tells you explicitly what you can ignore — most of it"
    ],
    toolId:   'NoiseCanceler',
    toolName: 'Noise Canceler',
  },
  published: '2026-04-29',
  modified:  '2026-04-29',
};
