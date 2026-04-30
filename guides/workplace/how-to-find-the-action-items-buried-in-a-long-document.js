module.exports = {
  slug:          'how-to-find-the-action-items-buried-in-a-long-document',
  category:      'workplace',
  categoryLabel: 'Workplace',
  title:         "How to find the action items buried in a long document",
  titleHtml:     "How to find <em>the action items buried in a long document</em>",
  shortTitle:    "Find buried action items",
  navTitle:      "find buried action items",
  description:   "A method for the specific problem of pulling out the things you actually have to do from a document that buried them in pages of context, throat-clearing, and FYI material.",
  deck:          "A method for the specific problem of pulling out the things you actually have to do from a document that buried them in pages of context, throat-clearing, and FYI material.",
  ledes: [
    `You know the document contains action items. The sender said so. Or implied so. Or you remember the email saying 'please review and respond.' But the document itself is sixteen pages of dense prose, and the action items — if they exist — are not in their own section, not bolded, not flagged, not in a bulleted list. They are inline, somewhere, hiding among the FYI material.\n\nThis is unfortunately how many work documents are written. The author knew what the asks were. The author did not bother to make them visible. The result is that recipients miss things, take longer than they should, and sometimes have to ask 'wait, was there something I needed to do?' which is a question that should never have to be asked but routinely is.`,
    `Here is how to find the buried action items in a long document, fast.`,
  ],
  steps: [
    { name: 'Search for action verbs first', body: 'Open the document and search for the verbs that signal an ask: review, complete, sign, submit, send, return, confirm, approve, respond, attend, register, opt out. Use Ctrl-F. Each hit is a place where someone is being asked to do something. The hits will not all be addressed to you, but they form the candidate list. Read the surrounding sentence for each one. The pattern emerges quickly: the actual action items will be a subset of these hits, and the rest will be context.' },
    { name: 'Search for dates and deadlines', body: 'Any sentence containing a specific date is a candidate action item — something is happening or due on that date. Scan for digits, month names, and phrases like \'by Friday,\' \'no later than,\' \'effective [date].\' These are signal flares. Even if the action language is vague, the date tells you something specific is expected. Make a list of every date you find with a one-line description of what is associated with it.' },
    { name: 'Search for direct address language', body: 'Long documents often distinguish between general information and instructions to specific people. Look for direct address: \'Please ensure you,\' \'You are required to,\' \'Each [role] should.\' These are the moments when the document is talking to you specifically rather than describing the world generally. The action items are concentrated in these passages.' },
    { name: 'Map each action item to a person and a deadline', body: 'For every candidate action you find, ask two questions: who has to do it, and by when? If both are clear, it is a real action item. If either is vague, you have one of two options — make a reasonable assumption and proceed, or reach out to the sender for clarification. Vague action items have a way of becoming missed action items, because nobody is sure they apply to them. Pinning down the who and the when converts vague into concrete.' },
    { name: 'Build a one-page summary of the actions and ignore the rest', body: 'After your search, you should have a short list — usually three to seven items — of actions you actually need to take. Write them down in a simple format: action, deadline, what success looks like. This page is now your working version of the document. The original sixteen pages exist for reference, but you do not need to read them again. The summary is what you act from. Most of the document was context. The actions are the document\'s actual payload.' }
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
