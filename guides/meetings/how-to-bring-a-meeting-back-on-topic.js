// ============================================================
// guides/meetings/how-to-bring-a-meeting-back-on-topic.js
// ============================================================

module.exports = {
  slug:          'how-to-bring-a-meeting-back-on-topic',
  category:      'meetings',
  categoryLabel: 'Meetings',

  title:         "How to Bring a Meeting Back on Topic",
  titleHtml:     "How to Bring a Meeting <em>Back on Topic</em>",
  shortTitle:    "Bring a Meeting Back on Topic",
  navTitle:      "How to bring a meeting back on topic without making it awkward",

  description:   "The discussion has drifted. You're now seven minutes into a tangent and the original question is forgotten. Here's how to redirect cleanly — without sounding like the meeting cop.",
  deck:          "The discussion has drifted. You're now seven minutes into a tangent and the original question is forgotten. Here's how to redirect cleanly — without sounding like the meeting cop.",

  published:     '2026-04-28',
  modified:      '2026-04-28',

  ledes: [
    `It's now twelve minutes since the meeting was on topic. The conversation drifted to a tangent that turned into a different topic that turned into a story about Q2 that turned into a debate about org structure. Everyone in the room knows the meeting is off-track. Nobody is saying anything because the discussion is interesting, technically work-adjacent, and the person who'd usually redirect is the one currently telling the Q2 story.`,
    `Bringing a meeting back on topic is a small move with outsized impact — and the most common reason it doesn't happen is that everyone thinks it's someone else's job to do. It's almost always the job of whoever notices first. Here's how to do it without sounding like the room's hall monitor.`,
  ],

  steps: [
    {
      name: "Reference the original question, not the tangent",
      body: "'Can we get back on track?' frames the tangent as the problem; 'I want to make sure we land the original question' frames the original question as the priority. Both redirect the meeting, but the first reads as criticism and the second as facilitation. Reference forward, not back. The redirect should feel like progress, not like getting in trouble.",
    },
    {
      name: "Acknowledge the tangent before closing it",
      body: "Tangents are usually interesting; that's why they happen. Pretending otherwise insults the room. 'That's a real conversation we should have — let's put it on the parking lot for next time' validates the drift without continuing it. The acknowledgment is what makes the redirect socially acceptable. People will let go of a topic if you've shown you understood why they wanted to discuss it.",
    },
    {
      name: "Use 'we,' not 'you'",
      body: "'You're getting off-topic' is a confrontation. 'We're getting off-topic' is a shared observation. The pronoun shift removes the implicit accusation and makes the redirect a group recognition rather than a personal call-out. The group is more likely to self-correct when the framing includes the speaker; people resist correction when they feel singled out.",
    },
    {
      name: "Time-anchor the redirect to the clock",
      body: "'We've got eight minutes left and three more items on the agenda' is a redirect that uses the clock as authority. The clock isn't your opinion; it's a fact the room can see. When you point to remaining time, you're not the one stopping the conversation — the schedule is. Time is a useful third party. Lean on it whenever you can.",
    },
    {
      name: "Don't escalate when it happens again",
      body: "If the meeting drifts again ten minutes later, the temptation is to redirect more sharply. Don't. The second redirect should be calibrated identically to the first — same warmth, same framing, same parking-lot offer. People drift in meetings; that's normal and not malicious. Repeated sharp redirects produce a room that's afraid to think out loud, which is worse for the meeting than an occasional tangent. Calibrate steadily.",
    },
  ],

  callout: {
    afterStep: 1,
    scriptedLine: "This is a great thread — let me park it on the side and bring us back to the original question, since we've still got to land that decision before we wrap.",
    explanation: "The 'great thread' acknowledges the value of the tangent, 'park it on the side' signals it isn't lost, and 'land that decision' frames the redirect as progress on the meeting's stated outcome. All in one sentence, before anyone has the chance to feel called out.",
  },

  cta: {
    glyph:    '🛡',
    headline: "Get redirect language for the moment of drift",
    body:     "Meeting Hijack Preventer generates the exact in-meeting language — parking-lot offers, time-anchored redirects, group-framed corrections — that bring a meeting back on topic without making it personal.",
    features: [
      "Tangent-redirect scripts",
      "Parking-lot phrasing",
      "Time-anchored intervention",
      "Group-framed corrections",
      "Tone calibration",
    ],
    toolId:   'MeetingHijackPreventer',
    toolName: 'Meeting Hijack Preventer',
  },
};
