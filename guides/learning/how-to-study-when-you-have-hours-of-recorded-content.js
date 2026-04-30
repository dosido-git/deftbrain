module.exports = {
  slug:          'how-to-study-when-you-have-hours-of-recorded-content',
  category:      'learning',
  categoryLabel: 'Learning',
  title:         "How to Study When You Have Hours of Recorded Content to Get Through",
  titleHtml:     "How to Study When You Have <em>Hours of Recorded Content</em> to Get Through",
  shortTitle:    "Hours of Recordings",
  navTitle:      "hours of recorded lectures",
  description:   "Twelve unwatched lecture recordings, an exam in five days. Here is the triage process for getting through hours of content without watching it all — and without missing what matters.",
  deck:          "Twelve unwatched lecture recordings, an exam in five days. Here is the triage process for getting through hours of content without watching it all — and without missing what matters.",
  ledes: [
    `It is Sunday night. You have an exam Friday. You have twelve unwatched lecture recordings sitting in the portal — some 60 minutes, some 90, some longer. Even at 1.5x speed, that is more than ten hours of pure watching, never mind notes. Your usual move would be to start at lecture one and grind through. By Wednesday you would be at lecture six, exhausted, and learning nothing.\n\nGrinding through serially is the worst possible strategy when you are time-boxed. The right move is triage — figure out which lectures you actually need to watch, which you can skim, and which you can skip entirely. Most students never learn this and spend exam week burning hours they did not have to burn.`,
    `Here is the triage process — and the tool that makes it possible in one afternoon.`,
  ],
  steps: [
    { name: 'Get all the transcripts before watching anything', body: 'Pull every transcript at once. Most lecture-capture systems let you batch-export. If they do not, spend twenty minutes downloading them all to a folder. Having the text gives you something you can scan in minutes per lecture instead of hours per lecture. You cannot triage video — you can only triage text. This is the single highest-leverage move in the whole process.' },
    { name: 'Map each lecture to a topic on the exam study guide', body: 'Open the syllabus or exam study guide. For each topic you need to know, identify which one or two lectures cover it. Some lectures cover one topic; some cover three; some cover review or background that will not be tested. Now you have a mapping: topic → lectures. The lectures that map to nothing testable can be skipped without guilt.' },
    { name: 'Run every transcript through Distill mode in one batch', body: 'Paste each transcript into Recall and run Distill mode on all of them. You get ten ranked bullets per lecture. That is your fast-pass version. For ten lectures, you now have a hundred bullets you can read in fifteen minutes. From those bullets, you can identify which lectures had the densest testable content and which were lighter — that ranks your watching priority for the deeper passes.' },
    { name: 'Watch the high-priority lectures fully, skim the rest', body: 'Pick the three or four lectures whose bullets included the hardest concepts, the worked examples, or the most \'this will be on the test\' signals. Watch those at 1.5x with notes. For the rest, just read the Distill output and the Study Guide output from Recall. You will not be a perfect master of those topics, but you will know enough to score on the exam questions about them. Perfect is the enemy of done when you have five days.' },
    { name: 'Use Connect mode for the cumulative angle', body: 'Cumulative exams test themes that span multiple lectures, not just facts from individual lectures. Recall\'s Connect mode takes three to five transcripts and surfaces the threads that run through all of them. Run it on the lectures that share a topic area and you get the synthesis question version of the material — which is exactly the kind of question that separates the A from the B.' }
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
