// ============================================================
// guides/meetings/how-to-politely-decline-a-meeting.js
// ============================================================

module.exports = {
  slug:          'how-to-politely-decline-a-meeting',
  category:      'meetings',
  categoryLabel: 'Meetings',

  title:         "How to Politely Decline a Meeting (Without Looking Like You're Hiding)",
  titleHtml:     "How to Politely Decline a Meeting <em>(Without Looking Like You're Hiding)</em>",
  shortTitle:    "How to Decline a Meeting",
  navTitle:      "How to politely decline a meeting without looking like you're hiding",

  description:   "Declining is a skill, not a personality trait. Here's how to say no to a meeting in a way that doesn't damage the relationship, and that the organizer can't easily push back on.",
  deck:          "Declining is a skill, not a personality trait. Here's how to say no to a meeting in a way that doesn't damage the relationship, and that the organizer can't easily push back on.",

  published:     '2026-04-28',
  modified:      '2026-04-28',

  ledes: [
    `The invite arrived at 4:47pm. It's for tomorrow at 10am. There's no agenda, eight people on it, and you genuinely cannot think of a reason you should be there. You also can't think of a way to say no without sounding like you're being difficult — so you're going to accept it, half-attend, multitask through it, and resent the hour. That's the calculus for most declined-but-not-actually-declined meetings, and it costs you the hour anyway.`,
    `Saying no to a meeting cleanly is mostly about giving the organizer a graceful out — a way to remove you from the invite that doesn't require them to admit the meeting was unnecessary. Done well, you keep the relationship and skip the hour. Done badly, you spend twenty minutes drafting a reply and accept anyway. Here's the version that works.`,
  ],

  steps: [
    {
      name: "Acknowledge the goal, not the meeting",
      body: "Open by naming what the meeting is trying to accomplish, not by listing your objections to the meeting itself. 'I want to make sure the launch plan gets locked in this week' is a different opening than 'I don't think I need to be on this call.' The first one keeps you on the same team as the organizer. The second one positions you as an obstacle to whatever they're trying to do — which is rarely the actual situation.",
    },
    {
      name: "Offer a written alternative instead",
      body: "A bare decline forces the organizer to either accept your absence or push back. A decline plus an offer makes the same point and gives them somewhere to go. 'I'll send my input as comments on the doc tomorrow morning' is harder to refuse than 'I can't make it.' The offer doesn't have to be huge; it has to remove their reason to need you in the room.",
    },
    {
      name: "Make the timing the problem, not the meeting",
      body: "'I have a conflict' is a complete sentence and almost never gets pushed back on. You don't owe a detailed explanation, and the more you explain, the more openings you give them to suggest a reschedule. Conflict, deadline, focus block — pick one and stop. The people who can't decline meetings are the ones who explain themselves until the explanation invites a counter.",
    },
    {
      name: "Don't apologize for declining",
      body: "'Sorry I can't make it' frames declining as something to feel bad about. 'Won't be able to make it — here's my input' frames it as a normal adult choice. The apology is a tell that you think you owe the organizer more than your input. You don't. Meeting attendance isn't a moral obligation. The people who decline cleanly stop apologizing for declining; that's the difference.",
    },
    {
      name: "Decline early, not the morning of",
      body: "A decline at 9:55am for a 10am meeting is rude. A decline 24 hours out is professional. The same words, sent at the same hour the day before, land entirely differently. Once you've decided you're not going, send the message — give the organizer time to adjust, cancel, or move on. The longer you sit on it, the more it looks like avoidance, which is the exact thing you were trying not to look like.",
    },
  ],

  callout: {
    afterStep: 2,
    scriptedLine: "Got the invite, thanks. Won't be able to make this one — but I'll send written input on the launch plan tomorrow morning so you have it before the meeting.",
    explanation: "This template covers the three things that make a decline land well: it's clean, it offers an alternative contribution, and it removes the organizer's need to chase you. Adapt the specifics; keep the structure.",
  },

  cta: {
    glyph:    '🕵',
    headline: "Get the exact decline message for any meeting",
    body:     "Meeting BS Detector analyzes the invite, classifies it, and generates a tailored decline script — with an alternative contribution and the right tone for your relationship to the organizer.",
    features: [
      "Tailored decline scripts",
      "Async alternative suggestions",
      "BS/borderline/legitimate verdict",
      "Tone calibration",
      "Permission to skip",
    ],
    toolId:   'MeetingBSDetector',
    toolName: 'Meeting BS Detector',
  },
};
