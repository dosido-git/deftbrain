module.exports = {
  slug:          'how-to-tell-if-a-meeting-is-going-to-be-useful',
  category:      'workplace',
  categoryLabel: 'Workplace',
  title:         "How to tell if a meeting is going to be useful",
  titleHtml:     "How to tell if a meeting <em>is going to be useful</em>",
  shortTitle:    "Useful meetings",
  navTitle:      "useful meetings",
  description:   "A diagnostic for predicting which meetings on your calendar will be worth your time and which will not — before you commit your hour to them.",
  deck:          "A diagnostic for predicting which meetings on your calendar will be worth your time and which will not — before you commit your hour to them.",
  ledes: [
    `You have ten meetings this week. Five of them are worth your time. Five of them are not. The problem is you cannot reliably tell, in advance, which is which. So you accept all of them, attend all of them, and notice in retrospect that half of them produced nothing — but by then the time is gone. You wish there were a way to predict, before the meeting, whether it was going to be useful.\n\nThere is. The signals are reasonably reliable. The hard part is being willing to act on them — to decline or push back on the ones that are predictably going to waste your time, instead of just accepting them all on autopilot.`,
    `Here is a diagnostic for predicting in advance which meetings will actually be worth attending.`,
  ],
  steps: [
    { name: 'Look at the agenda — or the absence of one', body: 'A specific agenda is the strongest single predictor of a useful meeting. \'Decide on Q3 budget allocation\' is an agenda. \'Sync on projects\' is not. If the agenda is specific, the meeting probably has a real purpose and a real outcome. If the agenda is vague or missing, the meeting may exist because someone scheduled it, not because it is needed. Insist on agendas, or assume the absence is a signal.' },
    { name: 'Check the attendee count', body: 'The number of attendees is correlated with the kind of meeting. Two to four people, with a clear question, is usually a real working meeting. Eight to twelve people, with a vague topic, is usually a status meeting in disguise. Twenty people is almost never a working meeting — it is a presentation or an announcement. The attendee count tells you the meeting type, even when the title does not.' },
    { name: 'Ask whether a decision will be made', body: 'Useful meetings produce decisions, agreements, or new shared understanding. If you cannot answer the question \'what will be different after this meeting that is not true now?\', the meeting may not be useful. Ask the organizer, if you can, what specific outcome they are looking for. If the answer is fuzzy, the meeting will be fuzzy. If the answer is sharp, the meeting will likely deliver value.' },
    { name: 'Notice the timing pattern', body: 'Recurring meetings that have been on the calendar for a long time often outlive their usefulness. The meeting was useful when it was scheduled. The team\'s needs have changed. The meeting persists because nobody has bothered to cancel it. If a recurring meeting has felt stale for the last three sessions, it probably needs to be retired or restructured. The timing pattern — same time, every week, no agenda evolution — is a strong red flag.' },
    { name: 'Trust your prior with this organizer or this meeting type', body: 'Some organizers consistently run useful meetings. Some consistently run wasteful ones. Same with meeting types — your team\'s planning meetings might be tight, while your team\'s brainstorms might wander. Use your accumulated experience as data. If the last six meetings of this type have not produced value, the seventh probably will not either. Adjusting your participation accordingly is rational, not cynical.' }
  ],
  cta: {
    glyph:    '🕵️',
    headline: "Should this be a meeting? Probably not.",
    body:     "Meeting BS Detector analyzes any meeting against red flags — vague purposes, missing agendas, info-sharing disguised as collaboration — and produces a verdict with confidence score. It also writes the script for suggesting an async alternative without sounding difficult.",
    features: [
      "Verdict (BS / borderline / legitimate) with confidence score",
      "Specific red flags identified — and what they mean",
      "Async alternative with exact template to propose it",
      "Permission statement: you are not being difficult by asking"
    ],
    toolId:   'MeetingBSDetector',
    toolName: 'Meeting BS Detector',
  },
  published: '2026-04-29',
  modified:  '2026-04-29',
};
