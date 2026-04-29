// ============================================================
// guides/meetings/signs-your-meeting-could-be-an-email.js
// ============================================================

module.exports = {
  slug:          'signs-your-meeting-could-be-an-email',
  category:      'meetings',
  categoryLabel: 'Meetings',

  title:         "Signs Your Meeting Could Be an Email",
  titleHtml:     "Signs Your Meeting <em>Could Be an Email</em>",
  shortTitle:    "Signs This Should Be an Email",
  navTitle:      "Five signs your meeting could be an email instead",

  description:   "Some meetings have a tell. Once you've seen the patterns, you start to notice them on the invite — usually before you've accepted. Here are the five most common signs.",
  deck:          "Some meetings have a tell. Once you've seen the patterns, you start to notice them on the invite — usually before you've accepted. Here are the five most common signs.",

  published:     '2026-04-28',
  modified:      '2026-04-28',

  ledes: [
    `You're scrolling through your week and you can already feel which days are going to be productive and which days aren't. The give-away is the calendar density — and specifically, the meetings that have a certain quality to them. You can't always articulate it, but you can feel it. The 'sync.' The 'touch base.' The 'check-in.' Something in the language is doing work, and it's not the work of producing a useful conversation.`,
    `The good news is that you're not imagining it. Meetings that should have been emails follow recognizable patterns, visible on the invite. Once you can read the signs, you can usually catch them before you accept. Five signs.`,
  ],

  steps: [
    {
      name: "The title is a vague verb",
      body: "'Sync.' 'Touch base.' 'Align.' 'Connect.' 'Catch up.' These are vague verbs masquerading as meeting purposes. A meeting that earns its place has a real noun in the title — a decision, a problem, a deliverable, a launch. When the title is a fuzzy verb, it's usually because the organizer didn't know what the meeting was actually for. The title is the tell.",
    },
    {
      name: "The agenda field is empty",
      body: "An agenda doesn't have to be elaborate. Three bullets and a desired outcome is enough. The total absence of an agenda is a sign the organizer didn't know what they wanted to come out of the hour, which means the hour will fill itself with whatever happens to come up. Empty agendas are how 'quick syncs' run 50 minutes and produce no decisions.",
    },
    {
      name: "It's mostly status updates",
      body: "If the meeting is people taking turns reporting on their work, it's not a meeting — it's a memo with chairs. Status updates are the canonical case of information that should travel asynchronously. Reading them takes a quarter of the time. Listening to them takes everyone's time at once. The fact that status meetings still exist is a fossil of the era before written async tools were good enough.",
    },
    {
      name: "The same people, same topic, every week",
      body: "Standing weekly meetings degrade. The first one was useful because something specific had to be discussed. By month four, the meeting exists because the meeting exists. If you can't remember the last time the recurring meeting produced anything you couldn't have read in a doc, that's the meeting telling you. Recurrence is a fossil; refresh the cadence or kill it.",
    },
    {
      name: "You'd be fine reading the notes after",
      body: "The cleanest test: imagine the meeting happens without you, and someone sends a one-paragraph summary after. Do you lose anything important? For most meetings, the honest answer is no — you'd get the decisions, you'd skip the discussion, you'd save the hour. If a written summary would have served you, you didn't need the meeting; you needed the summary. That's the email it should have been.",
    },
  ],

  cta: {
    glyph:    '🕵',
    headline: "Detect the signs across your whole calendar",
    body:     "Meeting BS Detector scans any meeting invite and surfaces the red flags — vague title, no agenda, status-only content, runaway recurrence — with a confidence-scored verdict and the alternative that should have been used.",
    features: [
      "Red-flag detection",
      "Pattern analysis",
      "BS/borderline/legitimate verdict",
      "Recurring-meeting audit",
      "Async alternative suggestions",
    ],
    toolId:   'MeetingBSDetector',
    toolName: 'Meeting BS Detector',
  },
};
