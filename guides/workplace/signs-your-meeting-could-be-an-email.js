module.exports = {
  slug:          'signs-your-meeting-could-be-an-email',
  category:      'workplace',
  categoryLabel: 'Workplace',
  title:         "Signs your meeting could be an email",
  titleHtml:     "Signs your meeting <em>could be an email</em>",
  shortTitle:    "Signs of unnecessary meetings",
  navTitle:      "meeting could be email",
  description:   "Specific signals that a meeting on your calendar — or one you are about to schedule — is unnecessary and should be replaced with written communication.",
  deck:          "Specific signals that a meeting on your calendar — or one you are about to schedule — is unnecessary and should be replaced with written communication.",
  ledes: [
    `You suspect the meeting could be an email. You are not sure. The organizer scheduled it as a meeting, after all, and they presumably had a reason. You do not want to be the cynical person who treats every meeting as a waste of time. But also, every time you have attended this kind of meeting in the past, you have come away thinking 'that did not need to be an hour.'\n\nThe signals for a meeting-that-could-be-an-email are reasonably consistent across organizations and meeting types. Once you can recognize them, you can predict in advance which meetings will be wasted hours, which gives you the basis for declining or pushing back without flying blind.`,
    `Here are the signals that a meeting could probably be an email.`,
  ],
  steps: [
    { name: 'The agenda is "status update" or "sync"', body: 'These two words are the strongest signal that a meeting does not need to be a meeting. Status updates are one-way information transfer — they do not require real-time interaction. Syncs are usually status updates with extra steps. If the title or agenda contains either word, the meeting is a strong candidate for replacement with a written update or a shared document. The signal is so reliable that you can almost use it as a default.' },
    { name: 'There are more than eight people', body: 'Meetings with more than eight people rarely produce decisions, because decision-making does not scale to large groups. They almost always become broadcast events — one person presents, everyone else listens. Broadcast events are the definition of one-way information flow, which is what email is for. Big meetings can be useful for ceremonial purposes, but they are usually inefficient as working sessions. The size is the signal.' },
    { name: 'The same meeting has happened before with no new outcome', body: 'If the recurring meeting has not produced a new decision, a new alignment, or a new action item in three sessions, it is probably ceremonial at this point. The team uses it to feel coordinated, but the actual coordination is not happening through the meeting — it is happening through other channels. Ceremonial meetings have some value, but most could be reduced or replaced. The persistent unproductive recurring meeting is a strong red flag.' },
    { name: 'No decision needs to be made', body: 'If the meeting is to share information, give an update, walk through a document, or align on something already decided, it does not need to be a meeting. Decisions are what justify synchronous time. In their absence, what is happening is information distribution, and email is purpose-built for that. Ask: what specific decision will this meeting produce? If the answer is none, the meeting is probably an email.' },
    { name: 'The meeting could be skipped without anyone noticing', body: 'The strongest test of meeting necessity is the imagination test: if this meeting did not happen, would anyone notice? Would any work be blocked? Would any decision be missed? If the honest answer is no, the meeting is unnecessary. Many recurring meetings persist because canceling them feels like more work than attending them. The cost of attending, multiplied across the team, is far greater than the cost of canceling. The skip test is the cleanest one.' }
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
