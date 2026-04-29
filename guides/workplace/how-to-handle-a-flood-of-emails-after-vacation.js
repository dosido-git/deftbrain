// ============================================================
// guides/workplace/how-to-handle-a-flood-of-emails-after-vacation.js
// ============================================================

module.exports = {
  slug:          'how-to-handle-a-flood-of-emails-after-vacation',
  category:      'workplace',
  categoryLabel: 'Workplace',

  title:         "How to Handle a Flood of Emails After Vacation (Without Undoing the Vacation)",
  titleHtml:     "How to Handle a Flood of Emails After Vacation <em>(Without Undoing the Vacation)</em>",
  shortTitle:    "Emails After Vacation",
  navTitle:      "How to handle the post-vacation email flood without undoing the trip",

  description:   "Two hundred unread. The trip you just took is in danger of evaporating in your first hour back. Here's how to face a flooded inbox without re-entering work in panic mode.",
  deck:          "Two hundred unread. The trip you just took is in danger of evaporating in your first hour back. Here's how to face a flooded inbox without re-entering work in panic mode.",

  published:     '2026-04-28',
  modified:      '2026-04-28',

  ledes: [
    `Sunday night. Last night of the trip. You're brushing your teeth, you reach for the phone out of habit, and there it is: 247 unread. Whatever was happening in your nervous system on the beach this morning is gone. You're not on vacation anymore; you're calculating which client probably emailed twice and whether your manager is annoyed with you. Twelve hours before you walk back into the office, the trip is already half-undone.`,
    `Coming back from time off is not actually about the email — it's about the speed at which you re-enter. If you sprint into the inbox the moment you sit down Monday morning, the vacation evaporates in an hour. If you have a procedure, the evaporation slows down. Here's the procedure.`,
  ],

  steps: [
    {
      name: "Don't read them on Sunday night",
      body: "The single biggest mistake is opening the inbox the night before you go back. Whatever you read at 9pm on Sunday, you will replay all night. Whatever you read at 9am on Monday, you will deal with and move on. The trip ends when you walk into the office, not when you tap the mail icon in bed.",
    },
    {
      name: "Block your first ninety minutes for triage only",
      body: "Put it on the calendar before you leave: Monday 9–10:30am, no meetings, no replies, no real work. The block is for sorting and reading, not responding. Most people come back and immediately start drafting paragraph-long catch-up replies — that's how you lose the whole morning. You're scanning the pile, not climbing it.",
    },
    {
      name: "Sort by sender and look for patterns",
      body: "A flooded post-vacation inbox is mostly noise: calendar invites that already happened, newsletters, automated alerts, three rounds of CC chains where everything resolved without you. Sort by sender; archive the obvious bulk first. What's left will be small enough to look at — usually under thirty messages, sometimes under ten. The flood was always mostly newsletters.",
    },
    {
      name: "Archive anything older than your last day out",
      body: "If something genuinely needed you and dates from before you left, the sender almost certainly followed up later in the week — or they routed around you and got the answer somewhere else. Either way, the original message is dead air. Archive the early-week pile. The follow-ups, if there were any, are what you should actually be reading.",
    },
    {
      name: "Send one 'catching up' to the few that matter",
      body: "For the handful of messages that look real, don't reply to each individually. Send one short message that says: I'm just back, I see this, flag it again if it's still live. Most people will reply 'all sorted, welcome back.' The rest will tell you what's still active, and you can handle those over the next two days — not the next two hours.",
    },
  ],

  callout: {
    afterStep: 4,
    scriptedLine: "Just back from a week out — going through the backlog now. If your message is still live, flag it again and I'll prioritize. If it's resolved, no need to reply.",
    explanation: "This works because it's honest, time-bounded, and removes the guilt for both parties. The sender doesn't have to chase you; you don't have to read every message. The inbox sorts itself.",
  },

  cta: {
    glyph:    '📬',
    headline: "Sort the post-vacation pile in under twenty minutes",
    body:     "Email Urgency Triager processes the backlog in batches and tells you exactly which messages are still live versus which ones already resolved themselves while you were out — with reply templates for the catch-up notes you actually need to send.",
    features: [
      "Batch inbox analysis",
      "Catch-up reply templates",
      "Three-tier prioritization",
      "Permission to archive",
      "Per-email reasoning",
    ],
    toolId:   'EmailUrgencyTriager',
    toolName: 'Email Urgency Triager',
  },
};
