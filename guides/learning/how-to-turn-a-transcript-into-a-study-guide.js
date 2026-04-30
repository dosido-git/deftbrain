module.exports = {
  slug:          'how-to-turn-a-transcript-into-a-study-guide',
  category:      'learning',
  categoryLabel: 'Learning',
  title:         "How to Turn a Transcript into a Study Guide",
  titleHtml:     "How to Turn a Transcript <em>Into a Study Guide</em>",
  shortTitle:    "Transcript to Study Guide",
  navTitle:      "transcript to study guide",
  description:   "A transcript is a wall of text. A study guide is structured for review. Here is the process for converting one into the other — what to keep, what to cut, and what structure to impose.",
  deck:          "A transcript is a wall of text. A study guide is structured for review. Here is the process for converting one into the other — what to keep, what to cut, and what structure to impose.",
  ledes: [
    `You have a transcript. It is forty pages of unbroken text. The professor said 'um' two hundred times. Some of it is gold. Most of it is filler. Reading it end-to-end takes ninety minutes and leaves you with no notes. A study guide, by contrast, is structured: definitions, key concepts, comparisons, worked examples, likely questions. Reviewing one takes ten minutes.\n\nConverting a transcript into a study guide is not summarizing — it is restructuring. You are not trying to make it shorter; you are trying to make it usable for review. The structure is the point. Most students never learn this and just highlight the transcript, which is the same as not studying.`,
    `Here is the conversion process — manually, and with Recall doing the heavy lifting.`,
  ],
  steps: [
    { name: 'Establish the categories before reading', body: 'A study guide has predictable sections: definitions and key terms, processes or mechanisms, comparisons and distinctions, cause-and-effect chains, examples and applications, likely exam questions. Set up empty buckets for each before you touch the transcript. Now your job is sorting, not generating. Reading without buckets is what produces highlighted-but-useless transcripts.' },
    { name: 'Pull definitions and key terms first', body: 'Scan the transcript for sentences that define or name things. \'X is the process of...\', \'we call this Y\', \'this is known as Z.\' Copy each definition into the definitions bucket with the term. Most exam questions hinge on knowing what the term actually means in the context of this class — not the Google definition, but the version your professor used. Get those exact wordings down.' },
    { name: 'Extract processes and mechanisms in numbered steps', body: 'When the professor explains how something works — a chemical reaction, a historical sequence, a legal procedure, a policy mechanism — convert their explanation into numbered steps. Step 1, step 2, step 3. The original transcript will have these embedded in flowing prose. Pull them out. Numbered processes are the easiest format to memorize and the most likely format for short-answer questions.' },
    { name: 'Capture comparisons in tables', body: 'Anywhere the professor compared two or more things, pull it into a small comparison table. Three columns: feature, X, Y. This forces you to surface the actual axes of difference rather than just listing facts about each. Comparison questions on exams are answered well by people who studied with comparison tables and badly by people who studied each thing separately.' },
    { name: 'Use Recall to do all of this in one pass', body: 'Paste the transcript into Recall and pick Study Guide mode. It produces sectioned output organized into definitions, processes, key concepts, and questions — the structure above, automatically. Treat the output as a strong first draft, not the final product. Edit it: add the comparisons it missed, fix anything wrong. Five minutes of editing on top of Recall\'s output beats ninety minutes of structuring from scratch.' }
  ],
  cta: {
    glyph:    '🧠',
    headline: "Turn 90 minutes of lecture into 15 minutes of study material.",
    body:     "Paste a transcript and pick a mode: distilled bullets, structured study guide, practice questions, or cross-lecture themes. Recall flags what the professor signaled as testable.",
    features: [
      "Four modes: Distill, Study Guide, Test Prep, Connect",
      "Catches \"this will be on the test\" signals",
      "Handles imperfect auto-captions",
      "Practice questions with explanations"
    ],
    toolId:   'Recall',
    toolName: 'Recall',
  },
  published: '2026-04-29',
  modified:  '2026-04-29',
};
